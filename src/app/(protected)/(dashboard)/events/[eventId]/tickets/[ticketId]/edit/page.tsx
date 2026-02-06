/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Button from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { ArrowLeft } from "lucide-react";
import {
	listTicketTypes,
	updateTicketType,
} from "@/lib/firebase/queries/ticketTypes";
import type { TicketTypeDoc } from "@/lib/models/ticketType";

// type Tab = "free" | "paid" | "invite";
type Tab = "free" | "paid"; // "invite" commented out

export default function EditTicketPage() {
	const router = useRouter();
	const { eventId, ticketId } = useParams<{
		eventId: string;
		ticketId: string;
	}>();
	const eventIdString = eventId as string;
	const ticketIdString = ticketId as string;

	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [ticket, setTicket] = useState<TicketTypeDoc | null>(null);

	// Helper to go back to tickets list
	const goToTickets = () => {
		router.replace(`/events/${eventIdString}/tickets`);
	};

	useEffect(() => {
		let mounted = true;
		(async () => {
			try {
				const tickets = await listTicketTypes(eventIdString);
				const foundTicket = tickets.find((t) => t.id === ticketIdString);
				if (mounted) {
					if (foundTicket) {
						setTicket(foundTicket);
					} else {
						// Ticket not found, redirect back
						goToTickets();
					}
				}
			} finally {
				if (mounted) setLoading(false);
			}
		})();
		return () => {
			mounted = false;
		};
	}, [eventIdString, ticketIdString, router]);

	if (loading) {
		return (
			<div className="min-h-dvh px-4 sm:px-6 py-8 max-w-3xl mx-auto grid place-items-center">
				<Spinner size="lg" />
			</div>
		);
	}

	if (!ticket) {
		return (
			<div className="min-h-dvh px-4 sm:px-6 py-8 max-w-3xl mx-auto grid place-items-center text-center">
				<div>
					<p className="text-text-muted">Ticket not found.</p>
					<div className="mt-4">
						<Button
							text="Back to Tickets"
							variant="outline"
							onClick={goToTickets}
						/>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-dvh px-4 sm:px-6 py-8 max-w-3xl mx-auto">
			{/* Header */}
			<div className="flex items-center gap-4 mb-8">
				<Button
					variant="outline"
					text=""
					leftIcon={<ArrowLeft className="w-4 h-4" />}
					onClick={goToTickets}
				/>
				<div>
					<h1 className="font-heading font-semibold text-2xl">Edit Ticket</h1>
					<p className="text-text-muted mt-1">
						Update your ticket details and settings.
					</p>
				</div>
			</div>

			{/* Edit Form */}
			<EditTicketForm
				ticket={ticket}
				onSave={async (updatedData) => {
					setSaving(true);
					try {
						// Filter out undefined values to prevent Firestore errors
						const cleanData = Object.fromEntries(
							Object.entries(updatedData).filter(
								([_, value]) => value !== undefined,
							),
						);

						await updateTicketType(eventIdString, ticketIdString, cleanData);
						goToTickets();
					} finally {
						setSaving(false);
					}
				}}
				saving={saving}
			/>
		</div>
	);
}

function EditTicketForm({
	ticket,
	onSave,
	saving,
}: {
	ticket: TicketTypeDoc;
	onSave: (data: Partial<TicketTypeDoc>) => void;
	saving: boolean;
}) {
	// Determine tab based on ticket data
	const getInitialTab = (): Tab => {
		if (ticket.price && ticket.price > 0) return "paid";
		// if (ticket.admitType === "invite") return "invite"; // invite-only commented out
		return "free";
	};

	const [tab, setTab] = useState<Tab>(getInitialTab());
	const [name, setName] = useState(ticket.name);
	const [qtyMode, setQtyMode] = useState<"limited" | "unlimited">(
		ticket.quantityTotal === null ? "unlimited" : "limited",
	);
	const [quantity, setQuantity] = useState<string>(
		ticket.quantityTotal?.toString() || "",
	);
	const [quantityRemaining, setQuantityRemaining] = useState<string>(
		ticket.quantityRemaining?.toString() || "",
	);
	const [price, setPrice] = useState<string>(
		ticket.price ? (ticket.price / 100).toString() : "4000",
	); // Convert from kobo to Naira
	const [perUserMax, setPerUserMax] = useState<number>(
		ticket.limits?.perUserMax || 5,
	);
	const [desc, setDesc] = useState(ticket.description || "");
	const [perks, setPerks] = useState<string[]>(ticket.perks || []);
	const [transferFee, setTransferFee] = useState(
		ticket.transferFeesToGuest ?? true,
	);
	const [salesStart, setSalesStart] = useState<string>(
		ticket.salesWindow?.startAt
			? new Date(ticket.salesWindow.startAt).toISOString().slice(0, 16)
			: "",
	);
	const [salesEnd, setSalesEnd] = useState<string>(
		ticket.salesWindow?.endAt
			? new Date(ticket.salesWindow.endAt).toISOString().slice(0, 16)
			: "",
	);
	const [admitType, setAdmitType] = useState<"general" | "vip" | "backstage">(
		ticket.admitType || "general",
	);

	// Group ticket specific fields
	const [groupSize, setGroupSize] = useState<number>(ticket.groupSize || 2);
	const [groupPrice, setGroupPrice] = useState<string>(
		ticket.price ? (ticket.price / 100).toString() : "6000",
	);

	const isGroupTicket = ticket.kind === "group";

	const quantitySold = useMemo(() => {
		if (qtyMode === "unlimited") return 0;
		const total = parseInt(quantity) || 0;
		const remaining = parseInt(quantityRemaining) || 0;
		return Math.max(0, total - remaining);
	}, [qtyMode, quantity, quantityRemaining]);

	const canSave = useMemo(() => {
		if (!name.trim()) return false;
		if (qtyMode === "limited") {
			if (!quantity || parseInt(quantity) < 1) return false;
			// Ensure remaining doesn't exceed total
			const total = parseInt(quantity) || 0;
			const remaining = parseInt(quantityRemaining) || 0;
			if (remaining > total) return false;
		}
		if (tab === "paid") {
			const priceNum = parseInt(price) || 0;
			if (!price || priceNum < 50) return false;
		}
		if (isGroupTicket && (!groupSize || groupSize < 2)) return false;
		if (isGroupTicket && tab === "paid") {
			const groupPriceNum = parseInt(groupPrice) || 0;
			if (!groupPrice || groupPriceNum < 100) return false;
		}
		return true;
	}, [
		name,
		qtyMode,
		quantity,
		quantityRemaining,
		tab,
		price,
		isGroupTicket,
		groupSize,
		groupPrice,
	]);

	const perTicket = useMemo(() => {
		if (!isGroupTicket || !groupSize) return 0;
		const groupPriceNum = parseInt(groupPrice) || 0;
		return Math.max(0, Math.floor(groupPriceNum / groupSize));
	}, [isGroupTicket, groupPrice, groupSize]);

	const router = useRouter();
	const { eventId } = useParams<{ eventId: string }>();
	const eventIdString = eventId as string;

	// Helper to go back to tickets list
	const goToTickets = () => {
		router.replace(`/events/${eventIdString}/tickets`);
	};

	const handleAddPerk = () => setPerks([...perks, ""]);
	const handlePerkChange = (index: number, value: string) => {
		const newPerks = [...perks];
		newPerks[index] = value;
		setPerks(newPerks);
	};
	const handleRemovePerk = (index: number) => {
		const newPerks = [...perks];
		newPerks.splice(index, 1);
		setPerks(newPerks);
	};

	const handleSave = () => {
		const baseData = {
			name,
			description: desc || undefined,
			perks: perks.filter((p) => p.trim() !== ""),
			quantityTotal: qtyMode === "limited" ? parseInt(quantity) : null,
			quantityRemaining:
				qtyMode === "limited" ? parseInt(quantityRemaining) : null,
			limits: { perUserMax: perUserMax || undefined },
			salesWindow: {
				startAt: salesStart ? new Date(salesStart) : null,
				endAt: salesEnd ? new Date(salesEnd) : null,
			},
			admitType,
		};

		if (isGroupTicket) {
			onSave({
				...baseData,
				kind: "group",
				groupSize,
				price: tab === "paid" ? parseInt(groupPrice) * 100 : undefined,
				currency: tab === "paid" ? "NGN" : undefined,
				transferFeesToGuest: tab === "paid" ? transferFee : undefined,
			});
		} else {
			onSave({
				...baseData,
				kind: "single",
				price: tab === "paid" ? parseInt(price) * 100 : undefined,
				currency: tab === "paid" ? "NGN" : undefined,
				transferFeesToGuest: tab === "paid" ? transferFee : undefined,
			});
		}
	};

	return (
		<div className="space-y-6">
			{/* Ticket Type Indicator */}
			<div className="rounded-2xl bg-surface border border-stroke p-4">
				<div className="text-sm text-text-muted">
					{isGroupTicket ? `Group Ticket (x${groupSize})` : "Single Ticket"}
				</div>
			</div>

			{/* tabs */}
			<div className="inline-flex rounded-xl bg-surface p-1 border border-stroke">
				{[
					{ key: "free", label: "Free" },
					{ key: "paid", label: "Paid" },
					// { key: "invite", label: "Invite-only" }, // invite-only commented out
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

			<div className="flex flex-col gap-6">
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
							placeholder={isGroupTicket ? "Crew (x2)" : "General Admission"}
						/>
					</div>

					{isGroupTicket && (
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
					)}

					<div>
						<label className="block text-sm text-text-muted mb-2">
							Ticket description
						</label>
						<textarea
							className="w-full rounded-xl border border-stroke px-4 py-3 text-text outline-none focus:border-accent"
							rows={3}
							value={desc}
							onChange={(e) => setDesc(e.target.value)}
							placeholder={`Describe what this ${
								isGroupTicket ? "group " : ""
							}ticket includes...`}
						/>
					</div>

					{/* Perks Section */}
					<div>
						<div className="flex items-center justify-between mb-2">
							<label className="block text-sm text-text-muted">Perks</label>
							<button
								onClick={handleAddPerk}
								className="text-xs text-cta hover:underline font-medium"
							>
								+ Add Perk
							</button>
						</div>
						<div className="space-y-2">
							{perks.map((perk, i) => (
								<div key={i} className="flex gap-2">
									<input
										className="flex-1 rounded-xl border border-stroke px-4 py-2 text-sm text-text outline-none focus:border-accent"
										value={perk}
										onChange={(e) => handlePerkChange(i, e.target.value)}
										placeholder="e.g. Free Drink"
									/>
									<button
										onClick={() => handleRemovePerk(i)}
										className="text-text-muted hover:text-destructive px-2"
									>
										✕
									</button>
								</div>
							))}
							{perks.length === 0 && (
								<p className="text-xs text-text-muted italic">
									No perks added.
								</p>
							)}
						</div>
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
									Total quantity <span className="text-cta">*</span>
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

					{qtyMode === "limited" && (
						<div className="grid gap-4 sm:grid-cols-2">
							<div>
								<label className="block text-sm text-text-muted mb-2">
									Tickets sold (read-only)
								</label>
								<div className="w-full rounded-xl border border-stroke px-4 py-3 text-text-muted bg-bg">
									{quantitySold}
								</div>
							</div>
							<div>
								<label className="block text-sm text-text-muted mb-2">
									Remaining quantity <span className="text-cta">*</span>
								</label>
								<input
									type="number"
									className="w-full rounded-xl border border-stroke px-4 py-3 text-text outline-none focus:border-accent"
									value={quantityRemaining}
									min={0}
									max={parseInt(quantity) || 0}
									onChange={(e) => setQuantityRemaining(e.target.value)}
								/>
								<p className="text-xs text-text-muted mt-1">
									Update this to release more tickets or adjust availability
								</p>
							</div>
						</div>
					)}

					{tab === "paid" && (
						<div>
							<label className="block text-sm text-text-muted mb-2">
								{isGroupTicket ? "Group price" : "Ticket price"}{" "}
								<span className="text-cta">*</span>
							</label>
							<div className="flex gap-2">
								<div className="w-16 rounded-xl border border-stroke px-4 py-3 text-text bg-surface grid place-items-center">
									₦
								</div>
								<input
									type="number"
									className="flex-1 rounded-xl border border-stroke px-4 py-3 text-text outline-none focus:border-accent"
									value={isGroupTicket ? groupPrice : price}
									min={isGroupTicket ? 100 : 50}
									onChange={(e) => {
										if (isGroupTicket) {
											setGroupPrice(e.target.value);
										} else {
											setPrice(e.target.value);
										}
									}}
								/>
							</div>
						</div>
					)}

					{tab === "paid" && isGroupTicket && (
						<div>
							<label className="block text-sm text-text-muted mb-2">
								Price per ticket (auto-calculated)
							</label>
							<div className="w-full rounded-xl border border-stroke px-4 py-3 text-text bg-bg">
								₦ {perTicket.toLocaleString()}
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

					{tab === "paid" && (
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

			{/* Footer actions */}
			<div className="flex justify-between pt-8 mt-10 border-t border-stroke">
				<Button variant="outline" text="Cancel" onClick={goToTickets} />
				<Button
					variant={canSave ? "primary" : "disabled"}
					disabled={!canSave || saving}
					text={saving ? "Saving..." : "Save Changes"}
					onClick={handleSave}
				>
					{saving ? <Spinner size="sm" /> : "Save Changes"}
				</Button>
			</div>
		</div>
	);
}
