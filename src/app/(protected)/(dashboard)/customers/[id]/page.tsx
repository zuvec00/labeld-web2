"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
	ChevronLeft,
	Pencil,
	Mail,
	Phone,
	Instagram,
	MapPin,
	ShoppingBag,
	UserX,
} from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/lib/auth/AuthContext";
import {
	getCustomer,
	getCustomerOrders,
	type Customer,
	type CustomerOrderSummary,
} from "@/lib/firebase/queries/customers";
import { updateCustomer } from "@/lib/firebase/callables/customers";
import type { CustomerDetails } from "@/lib/firebase/customers";
import { formatWithCommasDouble } from "@/lib/format";
import { toast } from "@/app/hooks/use-toast";
import CustomerFormSheet from "@/components/brand/customers/CustomerFormSheet";
import DataState from "@/components/ui/DataState";
import EmptyState from "@/components/ui/EmptyState";
import { Skeleton, SkeletonRows } from "@/components/ui/skeleton";

const naira = (minor: number) => `₦${formatWithCommasDouble(minor / 100)}`;

/** Adapt the Firestore customer to the shape the edit sheet expects. */
function toDetails(c: Customer): CustomerDetails {
	const parts = c.name.trim().split(" ").filter(Boolean);
	const primary = c.addresses[0];
	return {
		customerId: c.id,
		firstName: parts[0] ?? "",
		lastName: parts.slice(1).join(" "),
		email: c.email ?? undefined,
		phone: c.phoneNumber ?? undefined,
		address: primary?.address,
		city: primary?.city,
		state: primary?.state,
		country: primary?.country,
		postalCode: primary?.postalCode,
		totalOrders: c.totalOrders,
		totalSpendMinor: c.totalSpendMinor,
		lastOrderAt: c.lastOrderAt,
	};
}

export default function CustomerProfilePage() {
	const { id } = useParams<{ id: string }>();
	const router = useRouter();
	const { user } = useAuth();
	const brandId = user?.uid ?? "";

	const [customer, setCustomer] = useState<Customer | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const [orders, setOrders] = useState<CustomerOrderSummary[]>([]);
	const [ordersLoading, setOrdersLoading] = useState(true);
	const [ordersError, setOrdersError] = useState<string | null>(null);
	const [showAllOrders, setShowAllOrders] = useState(false);

	const [isEditOpen, setIsEditOpen] = useState(false);
	const [notes, setNotes] = useState("");
	const [savingNotes, setSavingNotes] = useState(false);

	const load = useCallback(async () => {
		if (!brandId || !id) return;
		setLoading(true);
		setError(null);
		try {
			const c = await getCustomer(brandId, id);
			setCustomer(c);
			setNotes(c?.notes ?? "");
			if (!c) {
				setOrdersLoading(false);
				return;
			}
			setOrdersLoading(true);
			setOrdersError(null);
			getCustomerOrders(brandId, c)
				.then(setOrders)
				.catch(() => setOrdersError("orders"))
				.finally(() => setOrdersLoading(false));
		} catch {
			setError("customer");
		} finally {
			setLoading(false);
		}
	}, [brandId, id]);

	useEffect(() => {
		load();
	}, [load]);

	async function saveNotes() {
		if (!customer) return;
		setSavingNotes(true);
		try {
			await updateCustomer({
				brandId,
				customerId: customer.id,
				name: customer.name,
				notes: notes.trim(),
			});
			setCustomer({ ...customer, notes: notes.trim() || null });
			toast({ title: "Notes updated", duration: 3000 });
		} catch {
			toast({
				title: "Couldn't save notes",
				description: "Please try again.",
				duration: 4000,
			});
		} finally {
			setSavingNotes(false);
		}
	}

	if (loading) {
		return (
			<div className="max-w-3xl space-y-6 pb-20">
				<Skeleton className="h-6 w-40" />
				<Skeleton className="h-28 rounded-2xl" />
				<div className="grid grid-cols-3 gap-3">
					{[0, 1, 2].map((i) => (
						<Skeleton key={i} className="h-20 rounded-2xl" />
					))}
				</div>
				<SkeletonRows count={3} />
			</div>
		);
	}

	if (error || !customer) {
		return (
			<div className="max-w-3xl pb-20">
				<BackLink />
				<EmptyState
					icon={UserX}
					title={error ? "Couldn't load this customer" : "Customer not found"}
					description={
						error
							? "Check your connection and try again."
							: "They may have been deleted."
					}
					action={
						error
							? { label: "Try again", onClick: load }
							: { label: "Back to customers", href: "/customers" }
					}
				/>
			</div>
		);
	}

	const initials =
		customer.name
			.trim()
			.split(" ")
			.filter(Boolean)
			.map((w) => w[0])
			.slice(0, 2)
			.join("")
			.toUpperCase() || "?";
	const aov =
		customer.totalOrders > 0
			? Math.round(customer.totalSpendMinor / customer.totalOrders)
			: 0;
	const since = customer.firstOrderAt ?? customer.createdAt;
	const visibleOrders = showAllOrders ? orders : orders.slice(0, 3);
	const notesDirty = notes.trim() !== (customer.notes ?? "");

	return (
		<div className="max-w-3xl space-y-6 pb-20">
			<BackLink />

			{/* Identity */}
			<div className="flex items-start gap-4 bg-surface rounded-2xl border border-stroke p-5">
				<div className="w-14 h-14 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center flex-shrink-0">
					<span className="text-lg font-semibold text-accent">{initials}</span>
				</div>
				<div className="flex-1 min-w-0 space-y-1.5">
					<h1 className="font-heading font-semibold text-xl text-text truncate">
						{customer.name}
					</h1>
					{since && (
						<p className="text-xs text-text-muted">
							Customer since {format(since, "MMM d, yyyy")}
						</p>
					)}
					<div className="flex flex-wrap gap-x-4 gap-y-1 pt-1">
						{customer.email && (
							<a
								href={`mailto:${customer.email}`}
								className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text"
							>
								<Mail className="w-3.5 h-3.5" /> {customer.email}
							</a>
						)}
						{customer.phoneNumber && (
							<a
								href={`tel:${customer.phoneNumber}`}
								className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text"
							>
								<Phone className="w-3.5 h-3.5" /> {customer.phoneNumber}
							</a>
						)}
						{customer.instagramHandle && (
							<span className="flex items-center gap-1.5 text-sm text-text-muted">
								<Instagram className="w-3.5 h-3.5" /> {customer.instagramHandle}
							</span>
						)}
					</div>
				</div>
				<button
					onClick={() => setIsEditOpen(true)}
					className="flex items-center gap-2 px-3 py-2 rounded-xl border border-stroke bg-bg text-sm font-semibold text-text hover:bg-surface transition-colors"
				>
					<Pencil className="w-4 h-4" />
					<span className="hidden sm:inline">Edit</span>
				</button>
			</div>

			{/* Metrics */}
			<div className="grid grid-cols-3 gap-3">
				<Metric label="Lifetime value" value={naira(customer.totalSpendMinor)} />
				<Metric label="Orders" value={String(customer.totalOrders)} />
				<Metric label="Avg. order" value={naira(aov)} />
			</div>

			{/* Notes */}
			<section className="bg-surface rounded-2xl border border-stroke p-5 space-y-3">
				<h2 className="text-sm font-semibold text-text">Private notes</h2>
				<textarea
					value={notes}
					onChange={(e) => setNotes(e.target.value)}
					placeholder={'e.g. "prefers pickup", "VIP"'}
					rows={3}
					className="w-full px-4 py-3 rounded-xl border border-stroke bg-bg/50 text-sm text-text placeholder:text-text-muted/50 focus:outline-none focus:border-accent resize-y"
				/>
				{notesDirty && (
					<div className="flex justify-end gap-2">
						<button
							onClick={() => setNotes(customer.notes ?? "")}
							disabled={savingNotes}
							className="px-3 py-2 rounded-xl text-sm text-text-muted hover:text-text"
						>
							Cancel
						</button>
						<button
							onClick={saveNotes}
							disabled={savingNotes}
							className="px-4 py-2 rounded-xl bg-cta text-bg text-sm font-semibold hover:opacity-90 disabled:opacity-50"
						>
							{savingNotes ? "Saving..." : "Save notes"}
						</button>
					</div>
				)}
			</section>

			{/* Addresses */}
			{customer.addresses.length > 0 && (
				<section className="bg-surface rounded-2xl border border-stroke p-5 space-y-3">
					<h2 className="text-sm font-semibold text-text">Addresses</h2>
					<ul className="space-y-2">
						{customer.addresses.map((a, i) => (
							<li
								key={i}
								className="flex items-start gap-2 text-sm text-text-muted"
							>
								<MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
								<span>
									{[a.address, a.city, a.state, a.postalCode, a.country]
										.filter(Boolean)
										.join(", ")}
								</span>
							</li>
						))}
					</ul>
				</section>
			)}

			{/* Purchase history */}
			<section className="space-y-3">
				<div className="flex items-center justify-between">
					<h2 className="text-sm font-semibold text-text">
						Purchase history{ordersLoading ? "" : ` (${orders.length})`}
					</h2>
					{orders.length > 3 && (
						<button
							onClick={() => setShowAllOrders((s) => !s)}
							className="text-xs font-semibold text-cta hover:text-cta/80"
						>
							{showAllOrders ? "Show less" : "Show all"}
						</button>
					)}
				</div>
				<DataState
					loading={ordersLoading}
					error={ordersError}
					onRetry={load}
					errorTitle="Couldn't load purchase history"
					isEmpty={orders.length === 0}
					skeleton={<SkeletonRows count={3} />}
					empty={
						<EmptyState
							icon={ShoppingBag}
							title="No orders recorded yet"
							action={{ label: "Record a sale →", href: "/orders" }}
						/>
					}
				>
					<ul className="space-y-2">
						{visibleOrders.map((o) => (
							<li
								key={o.id}
								className="flex items-center justify-between gap-3 px-4 py-3 bg-surface rounded-2xl border border-stroke"
							>
								<div className="min-w-0">
									<p className="text-sm font-semibold text-text">
										{naira(o.totalMinor)}
									</p>
									<p className="text-xs text-text-muted">
										{o.itemCount} item{o.itemCount !== 1 ? "s" : ""}
										{o.createdAt ? ` · ${format(o.createdAt, "MMM d, yyyy")}` : ""}
									</p>
								</div>
								<span className="text-xs font-medium capitalize px-2.5 py-1 rounded-full bg-bg border border-stroke text-text-muted">
									{o.status}
								</span>
							</li>
						))}
					</ul>
				</DataState>
			</section>

			<CustomerFormSheet
				isOpen={isEditOpen}
				onClose={() => {
					setIsEditOpen(false);
					load();
				}}
				brandId={brandId}
				initial={toDetails(customer)}
				onDeleted={() => router.replace("/customers")}
			/>
		</div>
	);
}

function BackLink() {
	return (
		<Link
			href="/customers"
			className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-text mb-4"
		>
			<ChevronLeft className="w-4 h-4" /> Customers
		</Link>
	);
}

function Metric({ label, value }: { label: string; value: string }) {
	return (
		<div className="bg-surface rounded-2xl border border-stroke p-4 space-y-1">
			<p className="text-xs font-medium text-text-muted">{label}</p>
			<p className="font-heading font-semibold text-lg text-text leading-none">
				{value}
			</p>
		</div>
	);
}
