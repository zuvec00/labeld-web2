"use client";

import {
	Timestamp,
	collection,
	doc,
	getDoc,
	getDocs,
	increment,
	onSnapshot,
	orderBy,
	query,
	serverTimestamp,
	setDoc,
	updateDoc,
	where,
	type Unsubscribe,
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions } from "@/lib/firebase/firebaseConfig";

export type WaitlistStatus = "active" | "unsubscribed";
export type WaitlistSource = "storefront" | "manual";

export interface WaitlistEntry {
	id: string;
	brandId: string;
	email: string;
	createdAt: Date | null;
	status: WaitlistStatus;
	source: WaitlistSource;
	context?: string | null;
}

export interface WaitlistMeta {
	brandId: string;
	totalCount: number;
	lastNotifiedAt?: Date | null;
}

export interface WaitlistBrandContext {
	uid: string;
	brandName?: string;
	username?: string;
	logoUrl?: string;
	credits?: {
		balance?: number;
		totalUsed?: number;
		updatedAt?: Date | null;
	};
	storefrontConfig?: {
		enabledSections?: string[];
		contentOverrides?: Record<string, unknown>;
	};
}

type RawTimestamp = Timestamp | Date | { seconds: number; nanoseconds?: number } | null | undefined;

function toDate(value: RawTimestamp): Date | null {
	if (!value) return null;
	if (value instanceof Date) return value;
	if (value instanceof Timestamp) return value.toDate();
	if ("seconds" in value) return new Date(value.seconds * 1000);
	return null;
}

function parseEntry(id: string, data: Record<string, any>): WaitlistEntry {
	return {
		id,
		brandId: data.brandId || "",
		email: data.email || "",
		createdAt: toDate(data.createdAt),
		status: data.status === "unsubscribed" ? "unsubscribed" : "active",
		source: data.source === "manual" ? "manual" : "storefront",
		context: data.context || null,
	};
}

function parseMeta(brandId: string, data?: Record<string, any>): WaitlistMeta {
	return {
		brandId,
		totalCount: Number(data?.totalCount || 0),
		lastNotifiedAt: toDate(data?.lastNotifiedAt),
	};
}

function parseBrand(uid: string, data: Record<string, any>): WaitlistBrandContext {
	return {
		uid,
		brandName: data.brandName,
		username: data.username,
		logoUrl: data.logoUrl,
		credits: data.credits
			? {
					balance: Number(data.credits.balance || 0),
					totalUsed: Number(data.credits.totalUsed || 0),
					updatedAt: toDate(data.credits.updatedAt),
				}
			: { balance: 0 },
		storefrontConfig: data.storefrontConfig,
	};
}

export function watchBrandContext(
	brandId: string,
	onNext: (brand: WaitlistBrandContext | null) => void,
	onError?: (error: Error) => void,
): Unsubscribe {
	return onSnapshot(
		doc(db, "brands", brandId),
		(snapshot) => {
			onNext(snapshot.exists() ? parseBrand(snapshot.id, snapshot.data()) : null);
		},
		(error) => onError?.(error),
	);
}

export function watchWaitlistEntries(
	brandId: string,
	onNext: (entries: WaitlistEntry[]) => void,
	onError?: (error: Error) => void,
): Unsubscribe {
	const waitlistQuery = query(
		collection(db, "waitlist"),
		where("brandId", "==", brandId),
		orderBy("createdAt", "desc"),
	);

	return onSnapshot(
		waitlistQuery,
		(snapshot) => onNext(snapshot.docs.map((item) => parseEntry(item.id, item.data()))),
		(error) => onError?.(error),
	);
}

export function watchWaitlistMeta(
	brandId: string,
	onNext: (meta: WaitlistMeta) => void,
	onError?: (error: Error) => void,
): Unsubscribe {
	return onSnapshot(
		doc(db, "waitlist_meta", brandId),
		(snapshot) => onNext(parseMeta(brandId, snapshot.exists() ? snapshot.data() : undefined)),
		(error) => onError?.(error),
	);
}

export async function getWaitlistEntries(brandId: string): Promise<WaitlistEntry[]> {
	const waitlistQuery = query(
		collection(db, "waitlist"),
		where("brandId", "==", brandId),
		orderBy("createdAt", "desc"),
	);
	const snapshot = await getDocs(waitlistQuery);
	return snapshot.docs.map((item) => parseEntry(item.id, item.data()));
}

export async function addWaitlistEntry(params: {
	brandId: string;
	email: string;
	context?: string | null;
	source?: WaitlistSource;
}): Promise<void> {
	const email = params.email.trim().toLowerCase();
	if (!email) throw new Error("Email is required.");

	const entryRef = doc(db, "waitlist", `${params.brandId}_${email}`);
	const existing = await getDoc(entryRef);
	if (existing.exists()) {
		throw new Error("This email is already on the waitlist.");
	}

	await setDoc(entryRef, {
		brandId: params.brandId,
		email,
		createdAt: serverTimestamp(),
		status: "active",
		source: params.source || "manual",
		context: params.context || "general",
	});

	const metaRef = doc(db, "waitlist_meta", params.brandId);
	const meta = await getDoc(metaRef);
	if (meta.exists()) {
		await updateDoc(metaRef, {
			totalCount: increment(1),
			updatedAt: serverTimestamp(),
		});
	} else {
		await setDoc(metaRef, {
			brandId: params.brandId,
			totalCount: 1,
			updatedAt: serverTimestamp(),
		});
	}
}

export interface SendWaitlistNotificationRequest {
	brandId: string;
	subject: string;
	message: string;
	contextFilter?: string;
	ctaText?: string;
	ctaLink?: string;
	heroImage?: string;
}

export interface SendWaitlistNotificationResponse {
	success: boolean;
	sentCount: number;
	recipientsCount?: number;
	message?: string;
}

export const sendWaitlistNotification = httpsCallable<
	SendWaitlistNotificationRequest,
	SendWaitlistNotificationResponse
>(functions, "sendWaitlistNotification");

export interface InitializeCreditPaymentRequest {
	email: string;
	amount: number;
	reference: string;
	callbackUrl: string;
	cancelUrl: string;
	isLive: boolean;
	metadata: {
		type: "credit_purchase";
		brandId: string;
		credits: number;
		buyer_user_id?: string;
	};
}

export interface InitializeCreditPaymentResponse {
	data?: {
		authorization_url?: string;
		reference?: string;
	};
	authorization_url?: string;
	reference?: string;
}

export const initializeCreditPayment = httpsCallable<
	InitializeCreditPaymentRequest,
	InitializeCreditPaymentResponse
>(functions, "initializeTransaction");
