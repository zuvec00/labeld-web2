// lib/firebase/queries/shipping.ts
//
// Web counterpart of the mobile app's ShippingService
// (lib/app/data/services/shipping_service.dart). Same collections, same
// document shapes — a brand configuring shipping on web and on mobile must see
// identical state.
import {
	doc,
	getDoc,
	setDoc,
	collection,
	getDocs,
	query,
	orderBy,
	where,
	writeBatch,
	deleteDoc,
	serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebaseConfig";

/**
 * How shipping is priced at checkout.
 *
 * `terminal_live` quotes real carrier rates through Terminal Africa, falling
 * back to the flat/by-state fees below when a route can't be quoted. It is
 * written by both clients, so every consumer must handle all three values.
 */
export type ShippingStrategy = "flat_all" | "flat_by_state" | "terminal_live";

export const DEFAULT_PACKAGE_WEIGHT_GRAMS = 1000;

export interface ShippingConfig {
	mode: ShippingStrategy;
	flatAllFeeMinor?: number;
	stateFeesMinor?: Record<string, number>;
	stateOrder?: string[];
	pickupEnabled?: boolean;
	/** Free-text address shown to customers who choose local pickup. */
	pickupAddress?: string;
	/** Used as the parcel weight when requesting live carrier rates. */
	defaultPackageWeightGrams?: number;
}

/**
 * A structured origin address, used as the "from" end of a Terminal shipment.
 * Distinct from `ShippingConfig.pickupAddress`, which is just display text for
 * customer self-collection.
 */
export interface PickupAddress {
	id: string;
	label: string;
	firstName: string;
	lastName: string;
	phone: string;
	email: string;
	line1: string;
	line2: string;
	city: string;
	state: string;
	countryCode: string;
	postalCode: string;
	isDefault: boolean;
}

export function emptyPickupAddress(): PickupAddress {
	return {
		id: "",
		label: "Pickup Address",
		firstName: "",
		lastName: "",
		phone: "",
		email: "",
		line1: "",
		line2: "",
		city: "",
		state: "",
		countryCode: "NG",
		postalCode: "",
		isDefault: false,
	};
}

/** Mirrors PickupAddress.displayAddress in the mobile model. */
export function formatPickupAddress(address: PickupAddress): string {
	return [address.line1, address.city, address.state]
		.filter((part) => part && part.trim().length > 0)
		.join(", ");
}

export function pickupAddressFullName(address: PickupAddress): string {
	return `${address.firstName} ${address.lastName}`.trim();
}

/**
 * Terminal Live can only be enabled once there is somewhere to collect from.
 * Mirrors the mobile validation in shipping_strategy_screen.dart.
 */
export function findDefaultPickupAddress(
	addresses: PickupAddress[]
): PickupAddress | null {
	if (addresses.length === 0) return null;
	return addresses.find((address) => address.isDefault) || null;
}

function shippingConfigRef(uid: string) {
	return doc(db, "users", uid, "shippingRules", "settings");
}

function pickupAddressesRef(uid: string) {
	return collection(db, "users", uid, "pickupAddresses");
}

function parsePickupAddress(id: string, data: Record<string, unknown>): PickupAddress {
	const str = (key: string, fallback = "") =>
		typeof data[key] === "string" ? (data[key] as string) : fallback;

	return {
		id,
		label: str("label", "Pickup Address"),
		firstName: str("firstName"),
		lastName: str("lastName"),
		phone: str("phone"),
		email: str("email"),
		line1: str("line1"),
		line2: str("line2"),
		city: str("city"),
		state: str("state"),
		countryCode: str("countryCode", "NG"),
		postalCode: str("postalCode"),
		isDefault: data.isDefault === true,
	};
}

export async function fetchPickupAddresses(uid: string): Promise<PickupAddress[]> {
	const snap = await getDocs(query(pickupAddressesRef(uid), orderBy("createdAt", "asc")));
	return snap.docs.map((d) => parsePickupAddress(d.id, d.data()));
}

/**
 * Create or update a pickup address. Setting one as default clears the flag on
 * every other address in the same batch, so there is never more than one.
 */
export async function savePickupAddress(
	uid: string,
	address: PickupAddress
): Promise<string> {
	const ref = pickupAddressesRef(uid);
	const batch = writeBatch(db);

	if (address.isDefault) {
		const existing = await getDocs(query(ref, where("isDefault", "==", true)));
		existing.docs.forEach((d) => {
			if (d.id !== address.id) {
				batch.update(d.ref, { isDefault: false });
			}
		});
	}

	const isNew = address.id.length === 0;
	const docRef = isNew ? doc(ref) : doc(ref, address.id);

	const data: Record<string, unknown> = {
		label: address.label,
		firstName: address.firstName,
		lastName: address.lastName,
		phone: address.phone,
		email: address.email,
		line1: address.line1,
		line2: address.line2,
		city: address.city,
		state: address.state,
		countryCode: address.countryCode,
		postalCode: address.postalCode,
		isDefault: address.isDefault,
		updatedAt: serverTimestamp(),
	};
	if (isNew) {
		data.createdAt = serverTimestamp();
	}

	batch.set(docRef, data, { merge: true });
	await batch.commit();

	return docRef.id;
}

export async function setDefaultPickupAddress(
	uid: string,
	addressId: string
): Promise<void> {
	const ref = pickupAddressesRef(uid);
	const batch = writeBatch(db);

	const existing = await getDocs(query(ref, where("isDefault", "==", true)));
	existing.docs.forEach((d) => batch.update(d.ref, { isDefault: false }));
	batch.update(doc(ref, addressId), { isDefault: true });

	await batch.commit();
}

export async function deletePickupAddress(
	uid: string,
	addressId: string
): Promise<void> {
	await deleteDoc(doc(pickupAddressesRef(uid), addressId));
}

export async function fetchShippingConfig(
	uid: string
): Promise<ShippingConfig | null> {
	const snap = await getDoc(shippingConfigRef(uid));
	if (!snap.exists()) return null;

	const data = snap.data();
	const mode = data.mode;

	return {
		...data,
		// Unknown values fall back to flat_all rather than being passed through,
		// so an unrecognised mode can never reach the mode comparisons in the UI.
		mode:
			mode === "terminal_live" || mode === "flat_by_state" || mode === "flat_all"
				? mode
				: "flat_all",
	} as ShippingConfig;
}

export async function saveShippingConfig(
	uid: string,
	config: ShippingConfig
): Promise<void> {
	await setDoc(shippingConfigRef(uid), {
		...config,
		updatedAt: serverTimestamp(),
	});
}
