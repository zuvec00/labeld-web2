/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Button from "@/components/ui/button";
import { Plus, Ticket as TicketIcon } from "lucide-react";
import {
	listTicketTypes,
	createTicketType,
	deleteTicketType,
} from "@/lib/firebase/queries/ticketTypes";
import type { TicketTypeDoc } from "@/lib/models/ticketType";
import { Spinner } from "@/components/ui/spinner";

type Tab = "free" | "paid";

export default function EventTicketsTab({ eventId }: { eventId: string }) {
	const router = useRouter();
	const eventIdString = eventId;

	const [tickets, setTickets] = useState<TicketTypeDoc[]>([]);
	const [loading, setLoading] = useState(true);
	const [openKind, setOpenKind] = useState<null | "single" | "group">(null);

	useEffect(() => {
		let mounted = true;
		(async () => {
			try {
				const list = await listTicketTypes(eventIdString);
				if (mounted) setTickets(list);
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
			<div className="min-h-[40vh] grid place-items-center">
				<Spinner size="lg" />
			</div>
		);
	}

	const hasTickets = tickets.length > 0;

	return (
		<div className="py-6 max-w-3xl mx-auto">
			<div className="flex items-center justify-between mb-6">
				<div>
					<h2 className="font-heading font-semibold text-xl">Tickets</h2>
					<p className="text-text-muted text-sm mt-1">
						Manage your ticket types and inventory.
					</p>
				</div>
				<Button
					variant="primary"
					text="Add ticket"
					leftIcon={<Plus className="w-4 h-4" />}
					onClick={() => setOpenKind("single")}
					className="text-sm"
				/>
			</div>

			{/* Ticket list / empty state */}
			<div>
				{hasTickets ? (
					<div className="grid gap-4">
						{tickets.map((t) => (
							<TicketRow
								key={t.id}
								t={t}
								eventId={eventIdString}
								router={router}
								onDelete={async () => {
									if (!confirm("Delete this ticket type?")) return;
									await deleteTicketType(eventIdString, t.id);
									setTickets((prev) => prev.filter((x) => x.id !== t.id));
								}}
							/>
						))}
					</div>
				) : (
					<div className="rounded-2xl bg-surface border border-stroke p-10 text-center">
						<div className="relative w-32 h-32 mx-auto">
							<Image
								src="/images/ticket.png"
								alt="No tickets"
								fill
								className="object-contain"
							/>
						</div>
						<h3 className="mt-3 font-medium">Let&apos;s create tickets</h3>
						<p className="text-text-muted text-sm mt-1">
							You don&apos;t have any tickets yet — it only takes a minute.
						</p>
						<Button
							className="mt-4"
							variant="primary"
							text="Add new ticket"
							leftIcon={<Plus className="w-4 h-4" />}
							onClick={() => setOpenKind("single")}
						/>
					</div>
				)}
			</div>

			{/* Dialogs */}
			{openKind === "single" && (
				<CreateSingleDialog
					onClose={() => setOpenKind(null)}
					onSwitchToGroup={() => setOpenKind("group")}
					onCreate={async (t, setSaving) => {
						setSaving(true);
						try {
							const nextSortOrder =
								tickets.length > 0
									? Math.max(...tickets.map((t) => t.sortOrder)) + 10
									: 10;

							const cleanTicketData = Object.fromEntries(
								Object.entries(t).filter(([_, value]) => value !== undefined)
							);

							const ticketData: Omit<TicketTypeDoc, "id"> = {
								...cleanTicketData,
								quantityRemaining: t.quantityTotal,
								isActive: true,
								sortOrder: nextSortOrder,
							} as Omit<TicketTypeDoc, "id">;

							await createTicketType(eventIdString, ticketData);
							const newTicket = await listTicketTypes(eventIdString);
							setTickets(newTicket);
							setOpenKind(null);
						} finally {
							setSaving(false);
						}
					}}
				/>
			)}
			{openKind === "group" && (
				<CreateGroupDialog
					onClose={() => setOpenKind(null)}
					onSwitchToSingle={() => setOpenKind("single")}
					onCreate={async (t, setSaving) => {
						setSaving(true);
						try {
							const nextSortOrder =
								tickets.length > 0
									? Math.max(...tickets.map((t) => t.sortOrder)) + 10
									: 10;

							const cleanTicketData = Object.fromEntries(
								Object.entries(t).filter(([_, value]) => value !== undefined)
							);

							const ticketData: Omit<TicketTypeDoc, "id"> = {
								...cleanTicketData,
								quantityRemaining: t.quantityTotal,
								isActive: true,
								sortOrder: nextSortOrder,
							} as Omit<TicketTypeDoc, "id">;

							await createTicketType(eventIdString, ticketData);
							const newTicket = await listTicketTypes(eventIdString);
							setTickets(newTicket);
							setOpenKind(null);
						} finally {
							setSaving(false);
						}
					}}
				/>
			)}
		</div>
	);
}

/* ---------- UI bits ---------- */

function TicketRow({
	t,
	onDelete,
	eventId,
	router,
}: {
	t: TicketTypeDoc;
	onDelete: () => void;
	eventId: string | undefined;
	router: any;
}) {
	const kind = t.kind === "single" ? "Single" : `Group x${t.groupSize}`;
	const stock =
		t.quantityTotal == null
			? "Unlimited"
			: `${(
					t.quantityRemaining ?? 0
			  ).toLocaleString()} / ${t.quantityTotal.toLocaleString()} left`;

	const price =
		t.price != null
			? `${t.currency ?? "NGN"} ${(t.price / 100).toLocaleString()}`
			: "Free";

	return (
		<div className="rounded-2xl bg-surface border border-stroke p-4">
			<div className="flex items-center justify-between gap-4">
				<div>
					<div className="text-sm text-text-muted">{kind}</div>
					<div className="font-medium">{t.name}</div>
					{t.description && (
						<div className="text-sm text-text-muted mt-1 line-clamp-2">
							{t.description}
						</div>
					)}
					<div className="text-xs text-text-muted mt-2 flex gap-3">
						<span>Stock: {stock}</span>
						<span>Price: {price}</span>
						{t.limits?.perUserMax ? (
							<span>Limit: {t.limits.perUserMax}/user</span>
						) : null}
					</div>
				</div>
				<div className="flex gap-2">
					<Button
						variant="outline"
						text="Edit"
						onClick={() =>
							router.push(`/events/${eventId}/tickets/${t.id}/edit`)
						}
						className="text-xs sm:text-sm"
					/>
					<Button
						variant="danger"
						text="Delete"
						onClick={onDelete}
						className="text-xs sm:text-sm"
					/>
				</div>
			</div>
		</div>
	);
}

/* ---------- Create Single Ticket Dialog ---------- */

function CreateSingleDialog({
	onClose,
	onSwitchToGroup,
	onCreate,
}: {
	onClose: () => void;
	onSwitchToGroup: () => void;
	onCreate: (
		t: Omit<
			TicketTypeDoc,
			"id" | "quantityRemaining" | "isActive" | "sortOrder"
		>,
		setSaving: (v: boolean) => void
	) => void;
}) {
	const [tab, setTab] = useState<Tab>("free");
	const [name, setName] = useState("General Admission");
	const [qtyMode, setQtyMode] = useState<"limited" | "unlimited">("limited");
	const [quantity, setQuantity] = useState<string>("80");
	const [price, setPrice] = useState<string>("4000"); // NGN (display in naira)
	const [perUserMax, setPerUserMax] = useState<number>(5);
	const [desc, setDesc] = useState("");
	const [transferFee, setTransferFee] = useState(true);
	const [salesStart, setSalesStart] = useState<string>("");
	const [salesEnd, setSalesEnd] = useState<string>("");
	const [admitType, setAdmitType] = useState<"general" | "vip" | "backstage">(
		"general"
	);
	const [saving, setSaving] = useState(false);

	const showPrice = tab === "paid";

	const canSave = useMemo(() => {
		if (!name.trim()) return false;
		if (qtyMode === "limited" && (!quantity || parseInt(quantity) < 1))
			return false;
		if (showPrice && (!price || parseInt(price) < 50)) return false;
		return true;
	}, [name, qtyMode, quantity, showPrice, price]);

	return (
		<DialogFrame title="Add a new single ticket" onClose={onClose}>
			{/* tabs */}
			<div className="inline-flex rounded-xl bg-surface p-1 border border-stroke">
				{[
					{ key: "free", label: "Free" },
					{ key: "paid", label: "Paid" },
				].map((it) => (
					<button
						key={it.key}
						className={[
							"px-4 py-2 rounded-lg text-sm font-medium transition-colors",
							tab === it.key
								? "bg-white text-bg shadow-sm"
								: "text-text-muted hover:text-text",
						].join(" ")}
						onClick={() => setTab(it.key as Tab)}
					>
						{it.label}
					</button>
				))}
			</div>

			<div className="mt-6 flex flex-col gap-6">
				{/* Basic Info */}
				<div className="rounded-2xl bg-surface border border-stroke p-6 flex flex-col gap-5">
					<div>
						<label className="block text-sm text-text-muted mb-2">
							Ticket name <span className="text-cta">*</span>
						</label>
						<input
							className="w-full rounded-xl border border-stroke px-4 py-3 text-text outline-none focus:border-accent"
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="General Admission"
						/>
					</div>

					<div>
						<label className="block text-sm text-text-muted mb-2">
							Ticket description
						</label>
						<textarea
							className="w-full rounded-xl border border-stroke px-4 py-3 text-text outline-none focus:border-accent"
							rows={3}
							value={desc}
							onChange={(e) => setDesc(e.target.value)}
							placeholder="Describe what this ticket includes..."
						/>
					</div>
				</div>

				{/* Quantity & Pricing */}
				<div className="rounded-2xl bg-surface border border-stroke p-6 flex flex-col gap-5">
					<div className="grid gap-4 sm:grid-cols-2">
						<div>
							<label className="block text-sm text-text-muted mb-2">
								Quantity mode <span className="text-cta">*</span>
							</label>
							<select
								className="w-full rounded-xl border border-stroke px-4 py-3 text-text outline-none focus:border-accent bg-surface"
								value={qtyMode}
								onChange={(e) => setQtyMode(e.target.value as any)}
							>
								<option value="limited">Limited quantity</option>
								<option value="unlimited">Unlimited</option>
							</select>
						</div>

						{qtyMode === "limited" && (
							<div>
								<label className="block text-sm text-text-muted mb-2">
									Quantity <span className="text-cta">*</span>
								</label>
								<input
									type="number"
									className="w-full rounded-xl border border-stroke px-4 py-3 text-text outline-none focus:border-accent"
									value={quantity}
									min={1}
									onChange={(e) => setQuantity(e.target.value)}
								/>
							</div>
						)}
					</div>

					{showPrice && (
						<div>
							<label className="block text-sm text-text-muted mb-2">
								Ticket price <span className="text-cta">*</span>
							</label>
							<div className="flex gap-2">
								<div className="w-16 rounded-xl border border-stroke px-4 py-3 text-text bg-surface grid place-items-center">
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
					)}

					<div>
						<label className="block text-sm text-text-muted mb-2">
							Purchase limit per user
						</label>
						<input
							type="number"
							className="w-full rounded-xl border border-stroke px-4 py-3 text-text outline-none focus:border-accent"
							value={perUserMax}
							min={1}
							onChange={(e) => setPerUserMax(parseInt(e.target.value || "0"))}
						/>
					</div>

					{showPrice && (
						<div className="flex items-center gap-2">
							<input
								id="transfer-fee"
								type="checkbox"
								checked={transferFee}
								onChange={(e) => setTransferFee(e.target.checked)}
							/>
							<label htmlFor="transfer-fee" className="text-sm text-text-muted">
								Transfer fees to guest
							</label>
						</div>
					)}

					{/* Sales Window */}
					<div className="grid gap-4 sm:grid-cols-2">
						<div>
							<label className="block text-sm text-text-muted mb-2">
								Sales start
							</label>
							<input
								type="datetime-local"
								className="w-full rounded-xl border border-stroke px-4 py-3 text-text outline-none focus:border-accent"
								value={salesStart}
								onChange={(e) => setSalesStart(e.target.value)}
							/>
						</div>
						<div>
							<label className="block text-sm text-text-muted mb-2">
								Sales end
							</label>
							<input
								type="datetime-local"
								className="w-full rounded-xl border border-stroke px-4 py-3 text-text outline-none focus:border-accent"
								value={salesEnd}
								onChange={(e) => setSalesEnd(e.target.value)}
							/>
						</div>
					</div>

					{/* Admit Type */}
					<div>
						<label className="block text-sm text-text-muted mb-2">
							Admit type
						</label>
						<select
							className="w-full rounded-xl border border-stroke px-4 py-3 text-text outline-none focus:border-accent bg-surface"
							value={admitType}
							onChange={(e) =>
								setAdmitType(e.target.value as "general" | "vip" | "backstage")
							}
						>
							<option value="general">General</option>
							<option value="vip">VIP</option>
							<option value="backstage">Backstage</option>
						</select>
					</div>
				</div>
			</div>

			<div className="mt-6 flex items-center justify-between">
				<Button
					variant="outline"
					text="Switch to Group ticket"
					onClick={onSwitchToGroup}
				/>
				<div className="flex gap-2">
					<Button variant="outline" text="Cancel" onClick={onClose} />
					<Button
						variant={canSave ? "primary" : "disabled"}
						disabled={!canSave || saving}
						text={saving ? "Saving..." : "Save"}
						onClick={() =>
							onCreate(
								{
									kind: "single",
									name,
									description: desc || undefined,
									quantityTotal:
										qtyMode === "limited"
											? Math.max(1, parseInt(quantity || "0", 10))
											: null,
									limits: { perUserMax: perUserMax || undefined },
									price: showPrice ? parseInt(price) * 100 : undefined, // Convert to kobo
									currency: showPrice ? "NGN" : undefined,
									transferFeesToGuest: showPrice ? transferFee : undefined,
									salesWindow: {
										startAt: salesStart ? new Date(salesStart) : null,
										endAt: salesEnd ? new Date(salesEnd) : null,
									},
									admitType,
								},
								setSaving
							)
						}
					>
						{saving ? <Spinner size="sm" /> : "Save"}
					</Button>
				</div>
			</div>
		</DialogFrame>
	);
}

/* ---------- Create Group Ticket Dialog ---------- */

function CreateGroupDialog({
	onClose,
	onSwitchToSingle,
	onCreate,
}: {
	onClose: () => void;
	onSwitchToSingle: () => void;
	onCreate: (
		t: Omit<
			TicketTypeDoc,
			"id" | "quantityRemaining" | "isActive" | "sortOrder"
		>,
		setSaving: (v: boolean) => void
	) => void;
}) {
	const [tab, setTab] = useState<Tab>("free");
	const [name, setName] = useState("Crew (x2)");
	const [qtyMode, setQtyMode] = useState<"limited" | "unlimited">("limited");
	const [quantity, setQuantity] = useState<string>("50");
	const [groupSize, setGroupSize] = useState<number>(2);
	const [groupPrice, setGroupPrice] = useState<string>("6000");
	const [desc, setDesc] = useState("");
	const [transferFee, setTransferFee] = useState(true);
	const [salesStart, setSalesStart] = useState<string>("");
	const [salesEnd, setSalesEnd] = useState<string>("");
	const [admitType, setAdmitType] = useState<"general" | "vip" | "backstage">(
		"general"
	);
	const [saving, setSaving] = useState(false);

	const showPrice = tab === "paid";

	const perTicket = useMemo(() => {
		if (!groupSize || !groupPrice) return 0;
		return Math.max(0, Math.floor(parseInt(groupPrice) / groupSize));
	}, [groupPrice, groupSize]);

	const canSave = useMemo(() => {
		if (!name.trim()) return false;
		if (!groupSize || groupSize < 2) return false;
		if (qtyMode === "limited" && (!quantity || parseInt(quantity) < 1))
			return false;
		if (showPrice && (!groupPrice || parseInt(groupPrice) < 100)) return false;
		return true;
	}, [name, qtyMode, quantity, showPrice, groupPrice, groupSize]);

	return (
		<DialogFrame title="Add a new group ticket" onClose={onClose}>
			<div className="inline-flex rounded-xl bg-surface p-1 border border-stroke">
				{[
					{ key: "free", label: "Free" },
					{ key: "paid", label: "Paid" },
				].map((it) => (
					<button
						key={it.key}
						className={[
							"px-4 py-2 rounded-lg text-sm font-medium transition-colors",
							tab === it.key
								? "bg-white text-bg shadow-sm"
								: "text-text-muted hover:text-text",
						].join(" ")}
						onClick={() => setTab(it.key as Tab)}
					>
						{it.label}
					</button>
				))}
			</div>

			<div className="mt-6 flex flex-col gap-6">
				{/* Basic Info */}
				<div className="rounded-2xl bg-surface border border-stroke p-6 flex flex-col gap-5">
					<div>
						<label className="block text-sm text-text-muted mb-2">
							Ticket name <span className="text-cta">*</span>
						</label>
						<input
							className="w-full rounded-xl border border-stroke px-4 py-3 text-text outline-none focus:border-accent"
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="Crew (x2)"
						/>
					</div>

					<div>
						<label className="block text-sm text-text-muted mb-2">
							Group size <span className="text-cta">*</span>
						</label>
						<select
							className="w-full rounded-xl border border-stroke px-4 py-3 text-text outline-none focus:border-accent bg-surface"
							value={groupSize}
							onChange={(e) => setGroupSize(parseInt(e.target.value || "2"))}
						>
							{[...Array(9)].map((_, i) => (
								<option key={i + 2} value={i + 2}>
									{i + 2}
								</option>
							))}
						</select>
					</div>

					<div>
						<label className="block text-sm text-text-muted mb-2">
							Ticket description
						</label>
						<textarea
							className="w-full rounded-xl border border-stroke px-4 py-3 text-text outline-none focus:border-accent"
							rows={3}
							value={desc}
							onChange={(e) => setDesc(e.target.value)}
							placeholder="Describe what this group ticket includes..."
						/>
					</div>
				</div>

				{/* Quantity & Pricing */}
				<div className="rounded-2xl bg-surface border border-stroke p-6 flex flex-col gap-5">
					<div className="grid gap-4 sm:grid-cols-2">
						<div>
							<label className="block text-sm text-text-muted mb-2">
								Quantity mode <span className="text-cta">*</span>
							</label>
							<select
								className="w-full rounded-xl border border-stroke px-4 py-3 text-text outline-none focus:border-accent bg-surface"
								value={qtyMode}
								onChange={(e) => setQtyMode(e.target.value as any)}
							>
								<option value="limited">Limited quantity</option>
								<option value="unlimited">Unlimited</option>
							</select>
						</div>

						{qtyMode === "limited" && (
							<div>
								<label className="block text-sm text-text-muted mb-2">
									Quantity <span className="text-cta">*</span>
								</label>
								<input
									type="number"
									className="w-full rounded-xl border border-stroke px-4 py-3 text-text outline-none focus:border-accent"
									value={quantity}
									min={1}
									onChange={(e) => setQuantity(e.target.value)}
								/>
							</div>
						)}
					</div>

					{showPrice && (
						<>
							<div>
								<label className="block text-sm text-text-muted mb-2">
									Group price <span className="text-cta">*</span>
								</label>
								<div className="flex gap-2">
									<div className="w-16 rounded-xl border border-stroke px-4 py-3 text-text bg-surface grid place-items-center">
										₦
									</div>
									<input
										type="number"
										className="flex-1 rounded-xl border border-stroke px-4 py-3 text-text outline-none focus:border-accent"
										value={groupPrice}
										min={100}
										onChange={(e) => setGroupPrice(e.target.value)}
									/>
								</div>
							</div>

							<div>
								<label className="block text-sm text-text-muted mb-2">
									Price per ticket (auto-calculated)
								</label>
								<div className="w-full rounded-xl border border-stroke px-4 py-3 text-text bg-bg">
									₦ {perTicket.toLocaleString()}
								</div>
							</div>

							<div className="flex items-center gap-2">
								<input
									id="transfer-fee-group"
									type="checkbox"
									checked={transferFee}
									onChange={(e) => setTransferFee(e.target.checked)}
								/>
								<label
									htmlFor="transfer-fee-group"
									className="text-sm text-text-muted"
								>
									Transfer fees to guest
								</label>
							</div>
						</>
					)}

					{/* Sales Window */}
					<div className="grid gap-4 sm:grid-cols-2">
						<div>
							<label className="block text-sm text-text-muted mb-2">
								Sales start
							</label>
							<input
								type="datetime-local"
								className="w-full rounded-xl border border-stroke px-4 py-3 text-text outline-none focus:border-accent"
								value={salesStart}
								onChange={(e) => setSalesStart(e.target.value)}
							/>
						</div>
						<div>
							<label className="block text-sm text-text-muted mb-2">
								Sales end
							</label>
							<input
								type="datetime-local"
								className="w-full rounded-xl border border-stroke px-4 py-3 text-text outline-none focus:border-accent"
								value={salesEnd}
								onChange={(e) => setSalesEnd(e.target.value)}
							/>
						</div>
					</div>

					{/* Admit Type */}
					<div>
						<label className="block text-sm text-text-muted mb-2">
							Admit type
						</label>
						<select
							className="w-full rounded-xl border border-stroke px-4 py-3 text-text outline-none focus:border-accent bg-surface"
							value={admitType}
							onChange={(e) =>
								setAdmitType(e.target.value as "general" | "vip" | "backstage")
							}
						>
							<option value="general">General</option>
							<option value="vip">VIP</option>
							<option value="backstage">Backstage</option>
						</select>
					</div>
				</div>
			</div>

			<div className="mt-6 flex items-center justify-between">
				<Button
					variant="outline"
					text="Switch to Single ticket"
					onClick={onSwitchToSingle}
				/>
				<div className="flex gap-2">
					<Button variant="outline" text="Cancel" onClick={onClose} />
					<Button
						variant={canSave ? "primary" : "disabled"}
						disabled={!canSave || saving}
						text={saving ? "Saving..." : "Save"}
						onClick={() =>
							onCreate(
								{
									kind: "group",
									name,
									description: desc || undefined,
									quantityTotal:
										qtyMode === "limited"
											? Math.max(1, parseInt(quantity || "0", 10))
											: null,
									groupSize,
									price: showPrice ? parseInt(groupPrice) * 100 : undefined, // Convert to kobo
									currency: showPrice ? "NGN" : undefined,
									transferFeesToGuest: showPrice ? transferFee : undefined,
									salesWindow: {
										startAt: salesStart ? new Date(salesStart) : null,
										endAt: salesEnd ? new Date(salesEnd) : null,
									},
									admitType,
								},
								setSaving
							)
						}
					>
						{saving ? <Spinner size="sm" /> : "Save"}
					</Button>
				</div>
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
