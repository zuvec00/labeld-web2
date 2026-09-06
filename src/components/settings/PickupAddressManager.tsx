"use client";

import { useState } from "react";
import { MapPin, Plus, Trash2, CheckCircle2, Pencil, X } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import {
	PickupAddress,
	emptyPickupAddress,
	formatPickupAddress,
	pickupAddressFullName,
	savePickupAddress,
	setDefaultPickupAddress,
	deletePickupAddress,
} from "@/lib/firebase/queries/shipping";

interface Props {
	uid: string;
	addresses: PickupAddress[];
	loading: boolean;
	/** Called after any write so the parent can refetch. */
	onChanged: () => void | Promise<void>;
}

type Draft = PickupAddress;

const REQUIRED_FIELDS: (keyof Draft)[] = [
	"firstName",
	"lastName",
	"phone",
	"line1",
	"city",
	"state",
];

/**
 * Manages the structured origin addresses a Terminal shipment is collected
 * from. Terminal Live cannot be enabled without a default address here, which
 * matches the validation the mobile app enforces.
 */
export default function PickupAddressManager({
	uid,
	addresses,
	loading,
	onChanged,
}: Props) {
	const [draft, setDraft] = useState<Draft | null>(null);
	const [busyId, setBusyId] = useState<string | null>(null);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const missingFields = draft
		? REQUIRED_FIELDS.filter((field) => !String(draft[field] || "").trim())
		: [];
	const canSave = draft !== null && missingFields.length === 0;

	const startCreate = () => {
		setError(null);
		// The first address a brand adds becomes the default — otherwise they
		// would have to add one and then separately mark it, and Terminal Live
		// would stay blocked for no obvious reason.
		setDraft({ ...emptyPickupAddress(), isDefault: addresses.length === 0 });
	};

	const handleSave = async () => {
		if (!draft || !canSave) return;
		setSaving(true);
		setError(null);
		try {
			await savePickupAddress(uid, draft);
			setDraft(null);
			await onChanged();
		} catch (err) {
			console.error("Failed to save pickup address:", err);
			setError("Could not save this address. Please try again.");
		} finally {
			setSaving(false);
		}
	};

	const handleSetDefault = async (addressId: string) => {
		setBusyId(addressId);
		setError(null);
		try {
			await setDefaultPickupAddress(uid, addressId);
			await onChanged();
		} catch (err) {
			console.error("Failed to set default pickup address:", err);
			setError("Could not update the default address.");
		} finally {
			setBusyId(null);
		}
	};

	const handleDelete = async (address: PickupAddress) => {
		const isLastDefault = address.isDefault && addresses.length > 1;
		const message = isLastDefault
			? `Delete "${address.label}"? It is your default pickup address — live rates stay off until you set another one.`
			: `Delete "${address.label}"?`;
		if (!window.confirm(message)) return;

		setBusyId(address.id);
		setError(null);
		try {
			await deletePickupAddress(uid, address.id);
			await onChanged();
		} catch (err) {
			console.error("Failed to delete pickup address:", err);
			setError("Could not delete this address.");
		} finally {
			setBusyId(null);
		}
	};

	const field = (
		key: keyof Draft,
		label: string,
		placeholder: string,
		type = "text"
	) => (
		<div className="space-y-2">
			<label className="text-xs font-medium text-text-muted">
				{label}
				{REQUIRED_FIELDS.includes(key) && (
					<span className="text-red-400/70 ml-1">*</span>
				)}
			</label>
			<input
				type={type}
				value={String(draft?.[key] ?? "")}
				onChange={(e) =>
					setDraft((prev) => (prev ? { ...prev, [key]: e.target.value } : prev))
				}
				placeholder={placeholder}
				className="w-full bg-surface-neutral/30 border border-stroke/30 rounded-xl px-4 py-3 text-text focus:outline-none focus:border-green-500/50 transition-colors placeholder:text-text-muted/40"
			/>
		</div>
	);

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<div>
					<h3 className="text-lg font-medium text-text">Pickup Addresses</h3>
					<p className="text-xs text-text-muted/70 mt-1">
						Where couriers collect orders. Live rates are quoted from your
						default address.
					</p>
				</div>
				{!draft && (
					<button
						onClick={startCreate}
						className="flex items-center gap-2 bg-white/5 border border-white/10 hover:bg-white/10 text-text px-4 py-2.5 rounded-xl transition-all text-sm"
					>
						<Plus className="w-4 h-4" />
						Add Address
					</button>
				)}
			</div>

			{error && (
				<div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
					{error}
				</div>
			)}

			{loading ? (
				<div className="flex justify-center py-8">
					<Spinner className="w-6 h-6" />
				</div>
			) : addresses.length === 0 && !draft ? (
				<div className="text-center py-8 border border-dashed border-stroke/50 rounded-xl">
					<MapPin className="w-6 h-6 text-text-muted/40 mx-auto mb-3" />
					<p className="text-text-muted">No pickup address yet.</p>
					<p className="text-xs text-text-muted/60 mt-1">
						Add one to turn on live carrier rates.
					</p>
				</div>
			) : (
				<div className="space-y-2">
					{addresses.map((address) => (
						<div
							key={address.id}
							className={`group flex items-start justify-between gap-4 p-4 rounded-xl border transition-all ${
								address.isDefault
									? "bg-surface border-green-500/40"
									: "bg-surface/50 border-transparent hover:bg-surface hover:border-stroke/30"
							}`}
						>
							<div className="min-w-0">
								<div className="flex items-center gap-2 flex-wrap">
									<span className="text-text font-medium">{address.label}</span>
									{address.isDefault && (
										<span className="text-[10px] uppercase tracking-wide bg-green-500/15 text-green-400 px-2 py-0.5 rounded-full">
											Default
										</span>
									)}
								</div>
								<div className="text-sm text-text-muted mt-1 truncate">
									{formatPickupAddress(address) || "No address details"}
								</div>
								<div className="text-xs text-text-muted/60 mt-0.5">
									{pickupAddressFullName(address)}
									{address.phone ? ` · ${address.phone}` : ""}
								</div>
							</div>

							<div className="flex items-center gap-1 shrink-0">
								{busyId === address.id ? (
									<Spinner className="w-4 h-4 m-2" />
								) : (
									<>
										{!address.isDefault && (
											<button
												onClick={() => handleSetDefault(address.id)}
												title="Set as default"
												className="text-text-muted/50 hover:text-green-400 p-2 hover:bg-white/5 rounded-lg transition-all"
											>
												<CheckCircle2 className="w-4 h-4" />
											</button>
										)}
										<button
											onClick={() => {
												setError(null);
												setDraft({ ...address });
											}}
											title="Edit"
											className="text-text-muted/50 hover:text-text p-2 hover:bg-white/5 rounded-lg transition-all"
										>
											<Pencil className="w-4 h-4" />
										</button>
										<button
											onClick={() => handleDelete(address)}
											title="Delete"
											className="text-text-muted/50 hover:text-red-400 p-2 hover:bg-white/5 rounded-lg transition-all"
										>
											<Trash2 className="w-4 h-4" />
										</button>
									</>
								)}
							</div>
						</div>
					))}
				</div>
			)}

			{draft && (
				<div className="border border-stroke/40 rounded-2xl p-6 bg-surface/40 space-y-5">
					<div className="flex items-center justify-between">
						<h4 className="text-text font-medium">
							{draft.id ? "Edit Address" : "New Pickup Address"}
						</h4>
						<button
							onClick={() => {
								setDraft(null);
								setError(null);
							}}
							className="text-text-muted/50 hover:text-text p-1 rounded-lg transition-colors"
						>
							<X className="w-4 h-4" />
						</button>
					</div>

					<div className="grid md:grid-cols-2 gap-4">
						{field("label", "Label", "Main Warehouse")}
						{field("phone", "Phone", "08012345678", "tel")}
						{field("firstName", "First Name", "Ada")}
						{field("lastName", "Last Name", "Okeke")}
						{field("email", "Email", "pickup@brand.com", "email")}
						{field("countryCode", "Country Code", "NG")}
					</div>

					{field("line1", "Address Line 1", "12 Admiralty Way")}
					{field("line2", "Address Line 2", "Apartment, suite, etc. (optional)")}

					<div className="grid md:grid-cols-3 gap-4">
						{field("city", "City", "Lekki")}
						{field("state", "State", "Lagos")}
						{field("postalCode", "Postal Code", "106104")}
					</div>

					<label className="flex items-center gap-3 cursor-pointer">
						<button
							type="button"
							onClick={() =>
								setDraft((prev) =>
									prev ? { ...prev, isDefault: !prev.isDefault } : prev
								)
							}
							className={`w-11 h-6 rounded-full relative transition-colors duration-300 ${
								draft.isDefault ? "bg-green-500" : "bg-surface-neutral"
							}`}
						>
							<div
								className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300 ${
									draft.isDefault ? "translate-x-6" : "translate-x-1"
								}`}
							/>
						</button>
						<span className="text-sm text-text-muted">
							Use as default pickup address
						</span>
					</label>

					{missingFields.length > 0 && (
						<p className="text-xs text-text-muted/60">
							Required fields are marked with *.
						</p>
					)}

					<div className="flex items-center gap-3">
						<button
							onClick={handleSave}
							disabled={!canSave || saving}
							className="flex items-center gap-2 bg-text text-bg font-bold px-5 py-3 rounded-xl transition-all hover:bg-green-400 hover:text-black disabled:opacity-40 disabled:cursor-not-allowed"
						>
							{saving ? (
								<>
									<Spinner className="w-4 h-4 border-black/30 border-t-black" />
									<span>Saving...</span>
								</>
							) : (
								<span>Save Address</span>
							)}
						</button>
						<button
							onClick={() => {
								setDraft(null);
								setError(null);
							}}
							className="text-text-muted hover:text-text px-4 py-3 transition-colors"
						>
							Cancel
						</button>
					</div>
				</div>
			)}
		</div>
	);
}
