"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import {
	ArrowRight,
	CalendarClock,
	CheckCircle2,
	Mail,
	Plus,
	Search,
	Settings2,
	Users,
	Zap,
} from "lucide-react";
import Button from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/app/hooks/use-toast";
import { addWaitlistEntry, type WaitlistEntry } from "@/lib/firebase/queries/waitlist";
import PurchaseCreditsDialog from "./PurchaseCreditsDialog";
import { useWaitlistData, type WaitlistFilters } from "./useWaitlistData";

function formatDate(date?: Date | null): string {
	if (!date) return "Not available";
	return new Intl.DateTimeFormat("en-NG", {
		month: "short",
		day: "numeric",
		year: "numeric",
	}).format(date);
}

function normalizeTag(tag?: string | null): string {
	return tag?.trim() || "general";
}

function statLabel(value: number): string {
	return new Intl.NumberFormat("en-NG").format(value);
}

function StatCard({
	icon,
	label,
	value,
	helper,
}: {
	icon: React.ReactNode;
	label: string;
	value: string;
	helper: string;
}) {
	return (
		<div className="rounded-2xl border border-stroke bg-surface p-4 sm:p-5">
			<div className="flex items-start justify-between gap-4">
				<div>
					<p className="text-xs font-bold uppercase tracking-[0.14em] text-text-muted">
						{label}
					</p>
					<p className="mt-3 font-unbounded text-2xl font-semibold text-text sm:text-3xl">
						{value}
					</p>
					<p className="mt-2 text-sm text-text-muted">{helper}</p>
				</div>
				<div className="rounded-xl bg-bg p-3 text-accent">{icon}</div>
			</div>
		</div>
	);
}

function EntryRow({ entry }: { entry: WaitlistEntry }) {
	const tag = normalizeTag(entry.context);
	return (
		<tr className="border-b border-stroke/70 last:border-0">
			<td className="min-w-[220px] px-4 py-4">
				<div className="font-semibold text-text">{entry.email}</div>
				<div className="mt-1 text-xs text-text-muted">Joined {formatDate(entry.createdAt)}</div>
			</td>
			<td className="px-4 py-4">
				<span className="rounded-full bg-bg px-3 py-1 text-xs font-bold text-text">
					{tag}
				</span>
			</td>
			<td className="px-4 py-4">
				<span className="text-sm capitalize text-text-muted">{entry.source}</span>
			</td>
			<td className="px-4 py-4">
				<span
					className={[
						"inline-flex items-center rounded-full px-3 py-1 text-xs font-bold capitalize",
						entry.status === "active"
							? "bg-calm-2/15 text-calm-2"
							: "bg-text-muted/10 text-text-muted",
					].join(" ")}
				>
					{entry.status}
				</span>
			</td>
		</tr>
	);
}

function AddEntryDialog({
	open,
	onClose,
	brandId,
	tagOptions,
}: {
	open: boolean;
	onClose: () => void;
	brandId: string;
	tagOptions: string[];
}) {
	const [email, setEmail] = useState("");
	const [context, setContext] = useState("general");
	const [saving, setSaving] = useState(false);
	const { toast } = useToast();

	if (!open) return null;

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setSaving(true);
		try {
			await addWaitlistEntry({ brandId, email, context, source: "manual" });
			toast({
				title: "Added to waitlist",
				description: `${email.trim().toLowerCase()} is now in your audience list.`,
			});
			setEmail("");
			setContext("general");
			onClose();
		} catch (error) {
			toast({
				variant: "destructive",
				title: "Could not add entry",
				description: error instanceof Error ? error.message : "Please try again.",
			});
		} finally {
			setSaving(false);
		}
	}

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
			<form
				onSubmit={handleSubmit}
				className="w-full max-w-md rounded-2xl border border-stroke bg-surface p-5 shadow-2xl sm:p-6"
			>
				<div className="flex items-start justify-between gap-4">
					<div>
						<h2 className="font-unbounded text-lg font-semibold text-text">
							Add Waitlist Entry
						</h2>
						<p className="mt-1 text-sm text-text-muted">
							Add someone manually from a DM, pop-up, or offline signup.
						</p>
					</div>
					<button type="button" onClick={onClose} className="text-text-muted hover:text-text">
						Close
					</button>
				</div>

				<label className="mt-6 block text-sm font-semibold text-text">
					Email
					<Input
						type="email"
						required
						value={email}
						onChange={(event) => setEmail(event.target.value)}
						placeholder="name@example.com"
						className="mt-2"
					/>
				</label>

				<label className="mt-4 block text-sm font-semibold text-text">
					Tag
					<select
						value={context}
						onChange={(event) => setContext(event.target.value)}
						className="mt-2 w-full rounded-xl border border-stroke bg-bg px-4 py-3 text-text outline-none focus:border-accent"
					>
						{tagOptions.map((tag) => (
							<option key={tag} value={tag}>
								{tag}
							</option>
						))}
					</select>
				</label>

				<div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
					<Button type="button" variant="outline" onClick={onClose}>
						Cancel
					</Button>
					<Button type="submit" isLoading={saving} loadingText="Adding...">
						Add Entry
					</Button>
				</div>
			</form>
		</div>
	);
}

export default function WaitlistDashboard() {
	const {
		user,
		brandId,
		brand,
		filteredEntries,
		entries,
		meta,
		tagOptions,
		filters,
		setFilters,
		newThisWeek,
		waitlistEnabled,
		credits,
		loading,
		error,
	} = useWaitlistData();
	const [addOpen, setAddOpen] = useState(false);
	const [creditsOpen, setCreditsOpen] = useState(false);

	const activeCount = useMemo(
		() => entries.filter((entry) => entry.status === "active").length,
		[entries],
	);

	function updateFilter<K extends keyof WaitlistFilters>(key: K, value: WaitlistFilters[K]) {
		setFilters((current) => ({ ...current, [key]: value }));
	}

	if (loading) {
		return (
			<div className="space-y-6">
				<div className="h-36 animate-pulse rounded-2xl bg-surface" />
				<div className="h-80 animate-pulse rounded-2xl bg-surface" />
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
				<div>
					<p className="text-xs font-black uppercase tracking-[0.18em] text-accent">
						Audience
					</p>
					<h1 className="mt-2 font-unbounded text-2xl font-semibold text-text sm:text-3xl">
						Waitlist
					</h1>
					<p className="mt-2 max-w-2xl text-sm leading-6 text-text-muted sm:text-base">
						Capture demand from your storefront, segment the people waiting, and send
						the drop when the moment is ready.
					</p>
				</div>
				<div className="flex flex-col gap-3 sm:flex-row">
					<Button type="button" variant="outline" onClick={() => setCreditsOpen(true)}>
						Top Up Credits
					</Button>
					<Link href="/audience/waitlist/notify">
						<Button type="button" className="w-full sm:w-auto" rightIcon={<ArrowRight className="h-4 w-4" />}>
							Notify Waitlist
						</Button>
					</Link>
				</div>
			</div>

			{error && (
				<div className="rounded-2xl border border-alert/30 bg-alert/10 p-4 text-sm text-alert">
					{error}
				</div>
			)}

			{!waitlistEnabled && (
				<div className="flex flex-col gap-4 rounded-2xl border border-accent/25 bg-accent/10 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
					<div>
						<div className="font-semibold text-text">Waitlist is not enabled on your storefront.</div>
						<p className="mt-1 text-sm text-text-muted">
							Turn it on in Site Customization so visitors can join from your Brand Space.
						</p>
					</div>
					<Link href="/brand-space/site-customization?open=active-template">
						<Button type="button" variant="outline" leftIcon={<Settings2 className="h-4 w-4" />}>
							Configure Storefront
						</Button>
					</Link>
				</div>
			)}

			<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
				<StatCard
					icon={<Users className="h-5 w-5" />}
					label="People Waiting"
					value={statLabel(activeCount)}
					helper={`${statLabel(entries.length)} total captured`}
				/>
				<StatCard
					icon={<CalendarClock className="h-5 w-5" />}
					label="New This Week"
					value={statLabel(newThisWeek)}
					helper="Fresh intent from your audience"
				/>
				<StatCard
					icon={<Zap className="h-5 w-5" />}
					label="Notification Credits"
					value={statLabel(credits)}
					helper="One credit per email sent"
				/>
				<StatCard
					icon={<Mail className="h-5 w-5" />}
					label="Last Notified"
					value={meta?.lastNotifiedAt ? formatDate(meta.lastNotifiedAt) : "Never"}
					helper={brand?.brandName || "Ready for your first send"}
				/>
			</div>

			<div className="rounded-2xl border border-stroke bg-surface">
				<div className="flex flex-col gap-4 border-b border-stroke p-4 lg:flex-row lg:items-center lg:justify-between">
					<div>
						<h2 className="font-unbounded text-lg font-semibold text-text">
							Entries
						</h2>
						<p className="mt-1 text-sm text-text-muted">
							{statLabel(filteredEntries.length)} showing from {statLabel(entries.length)} captured.
						</p>
					</div>
					<div className="flex flex-col gap-3 sm:flex-row">
						<div className="relative min-w-0 sm:w-72">
							<Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
							<Input
								value={filters.search}
								onChange={(event) => updateFilter("search", event.target.value)}
								placeholder="Search email or tag"
								className="pl-10"
							/>
						</div>
						<Button
							type="button"
							onClick={() => setAddOpen(true)}
							disabled={!waitlistEnabled}
							leftIcon={<Plus className="h-4 w-4" />}
						>
							Add Entry
						</Button>
					</div>
				</div>

				<div className="grid gap-3 border-b border-stroke p-4 sm:grid-cols-3">
					<select
						value={filters.status}
						onChange={(event) => updateFilter("status", event.target.value as WaitlistFilters["status"])}
						className="rounded-xl border border-stroke bg-bg px-4 py-3 text-sm text-text outline-none focus:border-accent"
					>
						<option value="all">All statuses</option>
						<option value="active">Active</option>
						<option value="unsubscribed">Unsubscribed</option>
					</select>
					<select
						value={filters.source}
						onChange={(event) => updateFilter("source", event.target.value as WaitlistFilters["source"])}
						className="rounded-xl border border-stroke bg-bg px-4 py-3 text-sm text-text outline-none focus:border-accent"
					>
						<option value="all">All sources</option>
						<option value="storefront">Storefront</option>
						<option value="manual">Manual</option>
					</select>
					<select
						value={filters.tag}
						onChange={(event) => updateFilter("tag", event.target.value)}
						className="rounded-xl border border-stroke bg-bg px-4 py-3 text-sm text-text outline-none focus:border-accent"
					>
						<option value="all">All tags</option>
						{tagOptions.map((tag) => (
							<option key={tag} value={tag}>
								{tag}
							</option>
						))}
					</select>
				</div>

				{entries.length === 0 ? (
					<div className="flex min-h-[320px] flex-col items-center justify-center px-4 py-12 text-center">
						<div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-bg text-accent">
							<Users className="h-6 w-6" />
						</div>
						<h3 className="mt-5 font-unbounded text-xl font-semibold text-text">
							Start building your audience.
						</h3>
						<p className="mt-2 max-w-md text-sm leading-6 text-text-muted">
							Enable waitlist on your storefront, then every drop, product, and campaign
							has somewhere real to gather demand.
						</p>
						<Link href="/brand-space/site-customization?open=active-template" className="mt-5">
							<Button type="button" leftIcon={<CheckCircle2 className="h-4 w-4" />}>
								Enable on Storefront
							</Button>
						</Link>
					</div>
				) : filteredEntries.length === 0 ? (
					<div className="px-4 py-12 text-center text-sm text-text-muted">
						No entries match those filters.
					</div>
				) : (
					<div className="overflow-x-auto">
						<table className="w-full min-w-[720px] text-left">
							<thead className="bg-bg/70 text-xs uppercase tracking-[0.14em] text-text-muted">
								<tr>
									<th className="px-4 py-3">Email</th>
									<th className="px-4 py-3">Tag</th>
									<th className="px-4 py-3">Source</th>
									<th className="px-4 py-3">Status</th>
								</tr>
							</thead>
							<tbody>
								{filteredEntries.map((entry) => (
									<EntryRow key={entry.id} entry={entry} />
								))}
							</tbody>
						</table>
					</div>
				)}
			</div>

			<AddEntryDialog
				open={addOpen}
				onClose={() => setAddOpen(false)}
				brandId={brandId}
				tagOptions={tagOptions}
			/>
			<PurchaseCreditsDialog
				open={creditsOpen}
				onClose={() => setCreditsOpen(false)}
				brandId={brandId}
				email={user?.email}
			/>
		</div>
	);
}
