"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Stepper from "@/components/ticketing/Stepper";
import Button from "@/components/ui/button";
import { Plus, Package as PackageIcon } from "lucide-react";
import { uploadFileGetURL } from "@/lib/storage/upload";
import {
	listMerchForEvent,
	createMerchItem,
	deleteMerchItem,
} from "@/lib/firebase/queries/merch";
import type { MerchItemDoc } from "@/lib/models/merch";
import { getAuth } from "firebase/auth";
import { Spinner } from "@/components/ui/spinner";

const STEPS = [
	{ key: "details", label: "Details" },
	// { key: "theme", label: "Theme" },
	{ key: "tickets", label: "Tickets" },
	{ key: "merch", label: "Merch", optional: true },
	{ key: "moments", label: "Moments", optional: true },
	{ key: "review", label: "Review" },
];

export default function EventMerchPage() {
	const router = useRouter();
	const { eventId } = useParams<{ eventId: string }>();
	const eventIdString = eventId as string;

	const [items, setItems] = useState<MerchItemDoc[]>([]);
	const [open, setOpen] = useState(false);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		let mounted = true;
		(async () => {
			try {
				const list = await listMerchForEvent(eventIdString);
				if (mounted) setItems(list);
			} finally {
				if (mounted) setLoading(false);
			}
		})();
		return () => {
			mounted = false;
		};
	}, [eventIdString]);

	if (loading) {
		return (
			<div className="min-h-dvh grid place-items-center">
				<Spinner size="lg" />
			</div>
		);
	}

	return (
		<div className="min-h-dvh px-4 sm:px-6 py-8 max-w-3xl mx-auto">
			<Stepper steps={STEPS} activeKey="merch" />

			<div className="mt-6 flex items-center justify-between">
				<div>
					<h1 className="font-heading font-semibold text-2xl">
						Add event merch
					</h1>
					<p className="text-text-muted mt-1">
						Optional: tees, caps, posters — sell alongside tickets.
					</p>
				</div>
				<Button
					text="Add merch"
					variant="primary"
					leftIcon={<Plus className="w-4 h-4" />}
					onClick={() => setOpen(true)}
				/>
			</div>

			{/* Merch list / empty state */}
			<div className="mt-6">
				{items.length ? (
					<div className="grid gap-4">
						{items.map((m) => (
							<MerchRow
								key={m.id}
								m={m}
								onDelete={async () => {
									await deleteMerchItem(m.id);
									setItems((prev) => prev.filter((x) => x.id !== m.id));
								}}
							/>
						))}
					</div>
				) : (
					<div className="rounded-2xl bg-surface border border-stroke p-10 text-center">
						<PackageIcon className="mx-auto w-10 h-10 text-text-muted" />
						<h3 className="mt-3 font-medium">No merch yet</h3>
						<p className="text-text-muted text-sm mt-1">
							Add your first item — images sell it best.
						</p>
						<Button
							className="mt-4"
							variant="primary"
							text="Add merch"
							leftIcon={<Plus className="w-4 h-4" />}
							onClick={() => setOpen(true)}
						/>
					</div>
				)}
			</div>

			{/* Footer actions */}
			<div className="flex justify-between pt-8 mt-10 border-t border-stroke">
				<Button
					variant="outline"
					text="Back"
					onClick={() => router.push(`/events/${eventIdString}/tickets`)}
				/>
				<Button
					variant="primary"
					text="Continue → Moments"
					onClick={() => router.push(`/events/${eventIdString}/moments`)}
				/>
			</div>

			{/* Dialogs */}
			{open && (
				<CreateMerchDialog
					eventId={eventIdString}
					onClose={() => setOpen(false)}
					onCreated={(doc) => setItems((prev) => [doc, ...prev])}
				/>
			)}
		</div>
	);
}

/* ---------- UI bits ---------- */

function MerchRow({ m, onDelete }: { m: MerchItemDoc; onDelete: () => void }) {
	const img = m.images?.[0]?.url;
	return (
		<div className="rounded-2xl bg-surface border border-stroke p-4 flex gap-4">
			{img ? (
				<img
					src={img}
					className="w-24 h-24 object-cover rounded-xl border border-stroke"
					alt=""
				/>
			) : (
				<div className="w-24 h-24 rounded-xl bg-bg border border-stroke" />
			)}

			<div className="flex-1">
				<div className="flex items-center justify-between">
					<div className="font-medium">{m.name}</div>
					<div className="text-sm text-text-muted">
						{m.stockTotal == null
							? "Unlimited"
							: `${m.stockRemaining ?? 0}/${m.stockTotal} left`}
					</div>
				</div>

				<div className="text-sm text-text-muted mt-1">
					{m.currency} {(m.priceMinor / 100).toLocaleString()}
				</div>

				{(m.sizeOptions?.length || m.colorOptions?.length) && (
					<div className="text-xs text-text-muted mt-1">
						{m.sizeOptions?.length
							? `Sizes: ${m.sizeOptions.join(", ")}`
							: null}
						{m.sizeOptions?.length && m.colorOptions?.length ? " • " : ""}
						{m.colorOptions?.length
							? `Colors: ${m.colorOptions.join(", ")}`
							: null}
					</div>
				)}
			</div>

			<div className="flex items-center gap-2">
				<Button variant="outline" text="Edit" />
				<Button variant="danger" text="Delete" onClick={onDelete} />
			</div>
		</div>
	);
}

/* ---------- Create Merch Dialog ---------- */

function CreateMerchDialog({
	eventId,
	onClose,
	onCreated,
}: {
	eventId: string;
	onClose: () => void;
	onCreated: (doc: MerchItemDoc) => void;
}) {
	const auth = getAuth();
	const [name, setName] = useState("");
	const [price, setPrice] = useState<string>("5000"); // NGN (display in naira)
	const [currency, setCurrency] = useState<"NGN" | "USD">("NGN");
	const [stockMode, setStockMode] = useState<"limited" | "unlimited">(
		"limited"
	);
	const [stockTotal, setStockTotal] = useState<string>("50");
	const [sizeOptions, setSizes] = useState<string[]>([]);

	// Predefined sizes like in pieces page
	const predefinedSizes = ["XS", "S", "M", "L", "XL", "XXL", "One Size"];
	const [files, setFiles] = useState<File[]>([]);
	const [uploading, setUploading] = useState(false);

	const canSave = useMemo(() => {
		if (!name.trim()) return false;
		if (!files.length) return false;
		if (stockMode === "limited" && (!stockTotal || parseInt(stockTotal) < 1))
			return false;
		if (!price || parseInt(price) < 50) return false;
		return true;
	}, [name, files, stockMode, stockTotal, price]);

	async function onSave() {
		const user = auth.currentUser;
		if (!user) return;
		setUploading(true);
		try {
			// upload images (same uploader style as Details cover)
			const uploaded: { url: string }[] = [];
			for (const f of files) {
				const url = await uploadFileGetURL(
					f,
					`merch/${user.uid}/${crypto.randomUUID()}-${f.name}`
				);
				uploaded.push({ url });
			}

			const docIn: Omit<MerchItemDoc, "id" | "createdAt" | "updatedAt"> = {
				brandId: user.uid,
				eventId,
				name,
				images: uploaded,
				priceMinor: parseInt(price) * 100,
				currency,
				stockTotal: stockMode === "limited" ? parseInt(stockTotal) : null,
				stockRemaining: stockMode === "limited" ? parseInt(stockTotal) : null,
				sizeOptions: sizeOptions.length ? sizeOptions : undefined,
				colorOptions: undefined, // Remove colors field
				isActive: true,
				visibility: "public",
			};

			// Filter out undefined values to prevent Firestore errors
			const cleanData = Object.fromEntries(
				Object.entries(docIn).filter(([_, value]) => value !== undefined)
			) as Omit<MerchItemDoc, "id" | "createdAt" | "updatedAt">;

			const id = await createMerchItem(cleanData);
			onCreated({ id, ...cleanData } as MerchItemDoc);
			onClose();
		} finally {
			setUploading(false);
		}
	}

	return (
		<DialogFrame title="Add merch" onClose={onClose}>
			<div className="grid gap-6">
				<div>
					<label className="block text-sm text-text-muted mb-2">
						Name <span className="text-cta">*</span>
					</label>
					<input
						className="w-full rounded-xl border border-stroke px-4 py-3 text-text outline-none focus:border-accent"
						value={name}
						onChange={(e) => setName(e.target.value)}
						placeholder="Event Tee"
					/>
				</div>

				{/* Images */}
				<div>
					<label className="block text-sm text-text-muted mb-2">
						Images <span className="text-cta">*</span>
					</label>
					<input
						type="file"
						multiple
						accept="image/*"
						onChange={(e) => setFiles(Array.from(e.target.files || []))}
						className="block w-full text-sm text-text file:mr-3 file:rounded-lg file:border file:border-stroke file:bg-bg file:px-3 file:py-2 file:text-sm file:font-semibold hover:file:bg-surface"
					/>
					<p className="text-xs text-text-muted mt-2">
						Add 1–5 images. First image is the cover. Recommended: JPG/PNG/WebP,
						max 2MB each.
					</p>
				</div>

				{/* Price & stock */}
				<div className="grid gap-4 sm:grid-cols-2">
					<div>
						<label className="block text-sm text-text-muted mb-2">
							Price <span className="text-cta">*</span>
						</label>
						<div className="flex gap-2">
							<div className="w-16 rounded-xl border border-stroke px-4 py-3 bg-surface grid place-items-center">
								₦
							</div>
							<input
								type="number"
								className="flex-1 rounded-xl border border-stroke px-4 py-3 text-text outline-none focus:border-accent"
								value={price}
								min={50}
								onChange={(e) => setPrice(e.target.value)}
							/>
						</div>
					</div>

					<div>
						<label className="block text-sm text-text-muted mb-2">
							Stock mode <span className="text-cta">*</span>
						</label>
						<select
							className="w-full rounded-xl border border-stroke px-4 py-3 bg-surface text-text outline-none focus:border-accent"
							value={stockMode}
							onChange={(e) =>
								setStockMode(e.target.value as "limited" | "unlimited")
							}
						>
							<option value="limited">Limited</option>
							<option value="unlimited">Unlimited</option>
						</select>
					</div>

					{stockMode === "limited" && (
						<div>
							<label className="block text-sm text-text-muted mb-2">
								Quantity <span className="text-cta">*</span>
							</label>
							<input
								type="number"
								className="w-full rounded-xl border border-stroke px-4 py-3 text-text outline-none focus:border-accent"
								value={stockTotal}
								min={1}
								onChange={(e) => setStockTotal(e.target.value)}
							/>
						</div>
					)}
				</div>

				{/* Sizes */}
				<div>
					<label className="block text-sm text-text-muted mb-2">
						Size Options
					</label>
					<div className="flex flex-wrap gap-2 mb-2">
						{predefinedSizes.map((s) => {
							const isSelected = sizeOptions.includes(s);
							const oneSizeSelected = sizeOptions.includes("One Size");
							const isDisabled =
								(s !== "One Size" && oneSizeSelected) ||
								(s === "One Size" && sizeOptions.length > 0 && !isSelected);
							return (
								<button
									key={s}
									type="button"
									disabled={isDisabled}
									onClick={() => {
										if (s === "One Size")
											setSizes(isSelected ? [] : ["One Size"]);
										else {
											if (oneSizeSelected) return;
											setSizes((prev) =>
												isSelected ? prev.filter((x) => x !== s) : [...prev, s]
											);
										}
									}}
									className={[
										"px-3 py-1.5 rounded-full text-sm border",
										isSelected
											? "bg-text text-bg border-text"
											: "bg-surface border-stroke",
										isDisabled ? "opacity-50 cursor-not-allowed" : "",
									].join(" ")}
								>
									{s}
								</button>
							);
						})}
						{sizeOptions.length > 1 && (
							<button
								type="button"
								className="text-alert text-sm border border-alert/30 rounded-lg px-2.5"
								onClick={() => setSizes([])}
							>
								Clear All
							</button>
						)}
					</div>
					{sizeOptions.includes("One Size") && (
						<p className="text-xs text-text-muted mt-1">
							Only &quot;One Size&quot; can be selected at a time.
						</p>
					)}
					<TagInput
						label="Custom Sizes"
						value={sizeOptions}
						onChange={setSizes}
						placeholder="e.g. S, M, L, XL ..."
					/>
				</div>
			</div>

			<div className="mt-6 flex items-center justify-end gap-2">
				<Button variant="outline" text="Cancel" onClick={onClose} />
				<Button
					variant={canSave ? "primary" : "disabled"}
					disabled={!canSave || uploading}
					text={uploading ? "Saving…" : "Save"}
					onClick={onSave}
				/>
			</div>
		</DialogFrame>
	);
}

/* ---------- small primitives ---------- */

function DialogFrame({
	title,
	children,
	onClose,
}: {
	title: string;
	children: React.ReactNode;
	onClose: () => void;
}) {
	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
			<div className="w-full max-w-2xl max-h-[90vh] rounded-2xl bg-surface border border-stroke flex flex-col">
				<div className="flex items-center justify-between p-6 border-b border-stroke">
					<h3 className="font-heading font-semibold text-lg">{title}</h3>
					<button className="text-text-muted hover:text-text" onClick={onClose}>
						✕
					</button>
				</div>
				<div className="flex-1 overflow-y-auto p-6">{children}</div>
			</div>
		</div>
	);
}

function TagInput({
	label,
	value,
	onChange,
	placeholder,
}: {
	label: string;
	value: string[];
	onChange: (v: string[]) => void;
	placeholder: string;
}) {
	const [input, setInput] = useState("");
	return (
		<div>
			<label className="block text-sm text-text-muted mb-2">{label}</label>
			<div className="flex gap-2">
				<input
					className="flex-1 rounded-xl border border-stroke px-4 py-3 text-text outline-none focus:border-accent"
					value={input}
					placeholder={placeholder}
					onChange={(e) => setInput(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === "Enter") {
							e.preventDefault();
							const t = input.trim();
							if (t && !value.includes(t)) onChange([...value, t]);
							setInput("");
						}
					}}
				/>
				<Button
					variant="outline"
					text="Add"
					onClick={() => {
						const t = input.trim();
						if (t && !value.includes(t)) onChange([...value, t]);
						setInput("");
					}}
				/>
			</div>
			{!!value.length && (
				<div className="flex flex-wrap gap-2 mt-2">
					{value.map((v) => (
						<span
							key={v}
							className="inline-flex items-center gap-2 bg-surface border border-stroke px-3 py-1.5 rounded-full text-sm"
						>
							{v}
							<button
								className="text-text-muted hover:text-text"
								onClick={() => onChange(value.filter((x) => x !== v))}
							>
								×
							</button>
						</span>
					))}
				</div>
			)}
		</div>
	);
}
