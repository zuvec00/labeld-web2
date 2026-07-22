"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import Button from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
	fetchCleanupSummary,
	executeCleanup,
	type CleanupSummary,
} from "@/lib/firebase/admin/cleanup";
import { AlertTriangle, Trash2, RefreshCw } from "lucide-react";

type CleanupStep =
	| "idle"
	| "loading"
	| "preview"
	| "confirming"
	| "executing"
	| "complete";

export default function CleanupTestDataPage() {
	const { user } = useAuth();
	const [step, setStep] = useState<CleanupStep>("idle");
	const [summary, setSummary] = useState<CleanupSummary | null>(null);
	const [selectedEventIds, setSelectedEventIds] = useState<string[]>([]);
	const [error, setError] = useState<string | null>(null);
	const [confirmText, setConfirmText] = useState("");

	// Cleanup options
	const [options, setOptions] = useState({
		deleteAttendeeTickets: false,
		deleteOrders: true,
		deleteStoreOrders: true,
		deleteWalletLedger: true,
		resetWallet: true,
	});

	// Results
	const [results, setResults] = useState<{
		attendeeTicketsDeleted: number;
		ordersDeleted: number;
		storeOrdersDeleted: number;
		walletLedgerDeleted: number;
		walletReset: boolean;
	} | null>(null);

	async function handleFetchData() {
		if (!user?.uid) return;

		setStep("loading");
		setError(null);

		try {
			const data = await fetchCleanupSummary(user.uid);
			setSummary(data);
			setSelectedEventIds(data.events.map((e) => e.id));
			setStep("preview");
		} catch (err: any) {
			setError(err.message || "Failed to fetch cleanup data");
			setStep("idle");
		}
	}

	async function handleExecuteCleanup() {
		if (!user?.uid || !summary) return;
		if (confirmText !== "DELETE") {
			setError('Please type "DELETE" to confirm');
			return;
		}

		setStep("executing");
		setError(null);

		try {
			const cleanupResults = await executeCleanup(user.uid, {
				...options,
				eventIds: selectedEventIds,
			});
			setResults(cleanupResults);
			setStep("complete");
			setConfirmText("");
		} catch (err: any) {
			setError(err.message || "Failed to execute cleanup");
			setStep("confirming");
		}
	}

	function formatCurrency(minor: number) {
		return `₦${(minor / 100).toLocaleString()}`;
	}

	// Filtered data based on selected events
	const filteredTickets = summary
		? summary.attendeeTickets.filter((t) => selectedEventIds.includes(t.eventId))
		: [];
	const filteredOrders = summary
		? summary.orders.filter((o) => selectedEventIds.includes(o.eventId))
		: [];
	const filteredOrdersTotal = filteredOrders.reduce((sum, o) => sum + o.totalMinor, 0);
	const selectedActionsCount = Object.values(options).filter(Boolean).length;
	const canRunCleanup = selectedActionsCount > 0;

	if (!user) {
		return (
			<div className="min-h-dvh grid place-items-center">
				<p className="text-text-muted">Please log in to access this page.</p>
			</div>
		);
	}

	return (
		<div className="min-h-dvh bg-bg px-4 sm:px-6 py-8 max-w-4xl mx-auto">
			{/* Header */}
			<div className="mb-8">
				<h1 className="font-heading font-semibold text-2xl sm:text-3xl flex items-center gap-3">
					<Trash2 className="w-8 h-8 text-alert" />
					Test Data Cleanup
				</h1>
				<p className="text-text-muted mt-2">
					Clean up test data from your account. This action cannot be undone.
				</p>
			</div>

			{/* User Info */}
			<div className="bg-surface border border-stroke rounded-2xl p-6 mb-6">
				<h2 className="font-heading font-semibold text-lg mb-3">
					Current User
				</h2>
				<div className="space-y-2 text-sm">
					<div className="flex gap-2">
						<span className="text-text-muted">Email:</span>
						<span className="text-text font-mono">{user.email}</span>
					</div>
					<div className="flex gap-2">
						<span className="text-text-muted">UID:</span>
						<span className="text-text font-mono text-xs">{user.uid}</span>
					</div>
				</div>
			</div>

			{/* Safety Banner */}
			<div className="bg-cta/10 border border-cta/20 rounded-xl p-4 mb-6">
				<p className="text-cta font-semibold flex items-center gap-2">
					🛡️ Safety Guarantee
				</p>
				<p className="text-cta/90 text-sm mt-1">
					Events, ticket types/setups, moments, merch items, and event content are <strong>never</strong> deleted by this tool. Attendee tickets are also preserved by default unless you explicitly select that option.
				</p>
			</div>

			{/* Error Display */}
			{error && (
				<div className="bg-alert/10 border border-alert/20 rounded-xl p-4 mb-6 flex items-start gap-3">
					<AlertTriangle className="w-5 h-5 text-alert flex-shrink-0 mt-0.5" />
					<div>
						<p className="text-alert font-semibold">Error</p>
						<p className="text-alert/90 text-sm mt-1">{error}</p>
					</div>
				</div>
			)}

			{/* Step 1: Fetch Data */}
			{step === "idle" && (
				<div className="bg-surface border border-stroke rounded-2xl p-6">
					<h2 className="font-heading font-semibold text-lg mb-3">
						Step 1: Preview Your Test Data
					</h2>
					<p className="text-text-muted text-sm mb-6">
						Click below to fetch and preview all test data that will be cleaned
						up. This will scan your events and related records.
					</p>
					<Button
						text="Fetch My Test Data"
						variant="primary"
						onClick={handleFetchData}
						leftIcon={<RefreshCw className="w-4 h-4" />}
					/>
				</div>
			)}

			{/* Loading State */}
			{step === "loading" && (
				<div className="bg-surface border border-stroke rounded-2xl p-12 flex flex-col items-center justify-center">
					<Spinner size="lg" />
					<p className="text-text-muted mt-4">Scanning your test data...</p>
				</div>
			)}

			{/* Step 2: Preview & Select */}
			{(step === "preview" || step === "confirming") && summary && (
				<div className="space-y-6">
					{/* Data Summary */}
					<div className="bg-surface border border-stroke rounded-2xl p-6">
						<h2 className="font-heading font-semibold text-lg mb-4 flex items-center gap-2">
							📊 Selected Cleanup Summary
						</h2>

						<div className="space-y-4">
							{/* Events */}
							<div className="flex justify-between items-center py-3 border-b border-stroke">
								<div>
									<p className="font-medium">Selected Events</p>
									<p className="text-xs text-text-muted mt-1">
										Only data for these events will be affected
									</p>
								</div>
								<span className="text-2xl font-bold text-accent">
									{selectedEventIds.length} / {summary.events.length}
								</span>
							</div>

							{/* Attendee Tickets */}
							<div className="flex justify-between items-center py-3 border-b border-stroke">
								<div>
									<p className="font-medium font-semibold text-text-muted">Attendee Tickets Available</p>
									<p className="text-xs text-text-muted mt-1">
										Preserved unless you select “Delete attendee tickets”
									</p>
								</div>
								<span className="text-2xl font-bold text-text-muted">
									{filteredTickets.length}
								</span>
							</div>

							{/* Orders */}
							<div className="flex justify-between items-center py-3 border-b border-stroke">
								<div>
									<p className="font-medium font-semibold text-cta">Event Orders Selected</p>
									<p className="text-xs text-text-muted mt-1">
										{options.deleteOrders ? "Will be deleted" : "Currently preserved"} • Total value: {formatCurrency(filteredOrdersTotal)}
									</p>
								</div>
								<span className="text-2xl font-bold text-cta">
									{filteredOrders.length}
								</span>
							</div>

							{/* Store Orders */}
							<div className="flex justify-between items-center py-3 border-b border-stroke">
								<div>
									<p className="font-medium">Store Orders Available (Account-wide)</p>
									<p className="text-xs text-text-muted mt-1">
										{options.deleteStoreOrders ? "Will be deleted" : "Currently preserved"} •{" "}
										Total value:{" "}
										{formatCurrency(
											summary.storeOrders.reduce(
												(sum, o) => sum + o.totalMinor,
												0,
											),
										)}
									</p>
								</div>
								<span className="text-2xl font-bold text-text-muted">
									{summary.storeOrders.length}
								</span>
							</div>

							{/* Wallet Ledger */}
							<div className="flex justify-between items-center py-3 border-b border-stroke">
								<div>
									<p className="font-medium">Wallet Ledger Entries Available (Account-wide)</p>
									<p className="text-xs text-text-muted mt-1">
										{options.deleteWalletLedger ? "Will be deleted" : "Currently preserved"} •{" "}
										Total amount:{" "}
										{formatCurrency(
											summary.walletLedger.reduce(
												(sum, l) => sum + l.amountMinor,
												0,
											),
										)}
									</p>
								</div>
								<span className="text-2xl font-bold text-text-muted">
									{summary.walletLedger.length}
								</span>
							</div>

							{/* Wallet Balance */}
							<div className="flex justify-between items-center py-3">
								<div>
									<p className="font-medium">Current Wallet Balance (Account-wide)</p>
									<p className="text-xs text-text-muted mt-1">
										{options.resetWallet ? "Will be reset to ₦0" : "Currently preserved"}
									</p>
								</div>
								<span className="text-2xl font-bold text-alert">
									{formatCurrency(summary.currentWalletBalanceMinor)}
								</span>
							</div>
						</div>
					</div>

					{/* Event List */}
					{summary.events.length > 0 && (
						<div className="bg-surface border border-stroke rounded-2xl p-6">
							<div className="flex justify-between items-center mb-4">
								<h3 className="font-heading font-semibold text-lg">
									Step 2: Choose Target Events
								</h3>
								<div className="flex gap-2">
									<button
										type="button"
										onClick={() => setSelectedEventIds(summary.events.map((e) => e.id))}
										className="text-xs text-accent hover:underline font-medium"
									>
										Select All
									</button>
									<span className="text-stroke text-xs">|</span>
									<button
										type="button"
										onClick={() => setSelectedEventIds([])}
										className="text-xs text-text-muted hover:underline font-medium"
									>
										Deselect All
									</button>
								</div>
							</div>
							<p className="text-xs text-text-muted mb-3">
								Uncheck events to preserve their orders and attendee tickets. Events themselves are NEVER deleted.
							</p>
							<div className="space-y-2 max-h-60 overflow-y-auto">
								{summary.events.map((event) => {
									const isSelected = selectedEventIds.includes(event.id);
									return (
										<label
											key={event.id}
											className="flex justify-between items-center p-3 rounded-lg bg-bg border border-stroke text-sm hover:bg-bg/50 cursor-pointer"
										>
											<div className="flex items-center gap-3">
												<input
													type="checkbox"
													checked={isSelected}
													onChange={(e) => {
														if (e.target.checked) {
															setSelectedEventIds([...selectedEventIds, event.id]);
														} else {
															setSelectedEventIds(selectedEventIds.filter((id) => id !== event.id));
														}
													}}
													className="w-4 h-4 rounded border-stroke text-accent focus:ring-accent"
												/>
												<span className="font-medium">{event.title}</span>
											</div>
											<span className="text-text-muted font-mono text-xs">
												{event.id}
											</span>
										</label>
									);
								})}
							</div>
						</div>
					)}

					{/* Attendee Tickets Details */}
					{filteredTickets.length > 0 && options.deleteAttendeeTickets && (
						<div className="bg-surface border border-stroke rounded-2xl p-6">
							<h3 className="font-heading font-semibold mb-4">
								Attendee Tickets to Delete ({filteredTickets.length})
							</h3>
							<div className="space-y-2 max-h-96 overflow-y-auto">
								{filteredTickets.map((ticket) => (
									<div
										key={ticket.id}
										className="p-3 rounded-lg bg-bg border border-stroke text-sm"
									>
										<div className="flex justify-between items-start mb-2">
											<div>
												<p className="font-medium">{ticket.ticketTypeName}</p>
												<p className="text-xs text-text-muted mt-1">
													Code: {ticket.ticketCode}
												</p>
											</div>
											<span className="text-xs px-2 py-1 rounded-full bg-stroke">
												{ticket.status}
											</span>
										</div>
										<div className="text-xs space-y-1">
											<p className="text-text-muted">
												Email:{" "}
												<span className="text-text font-mono">
													{ticket.buyerEmail}
												</span>
											</p>
											{ticket.buyerPhone && (
												<p className="text-text-muted">
													Phone:{" "}
													<span className="text-text font-mono">
														{ticket.buyerPhone}
													</span>
												</p>
											)}
											<p className="text-text-muted">
												Owner ID:{" "}
												<span className="text-text font-mono text-xs">
													{ticket.ownerUserId.slice(0, 12)}...
												</span>
											</p>
										</div>
									</div>
								))}
							</div>
						</div>
					)}

					{/* Orders Details */}
					{filteredOrders.length > 0 && options.deleteOrders && (
						<div className="bg-surface border border-stroke rounded-2xl p-6">
							<h3 className="font-heading font-semibold mb-4">
								Orders to Delete ({filteredOrders.length})
							</h3>
							<div className="space-y-2 max-h-96 overflow-y-auto">
								{filteredOrders.map((order) => (
									<div
										key={order.id}
										className="p-3 rounded-lg bg-bg border border-stroke text-sm"
									>
										<div className="flex justify-between items-start mb-2">
											<div>
												<p className="font-medium font-mono text-xs">
													Order #{order.id.slice(0, 8)}
												</p>
												<p className="text-xs text-text-muted mt-1">
													{order.hasTickets
														? "🎫 Has Tickets"
														: "📦 Merch Only"}
												</p>
											</div>
											<div className="text-right">
												<span className="text-xs px-2 py-1 rounded-full bg-stroke">
													{order.status}
												</span>
												<p className="text-sm font-semibold mt-1">
													{formatCurrency(order.totalMinor)}
												</p>
											</div>
										</div>
										<div className="text-xs">
											{order.deliverToEmail && (
												<p className="text-text-muted">
													Email:{" "}
													<span className="text-text font-mono">
														{order.deliverToEmail}
													</span>
												</p>
											)}
											{order.deliverToName && (
												<p className="text-text-muted mt-1">
													Name:{" "}
													<span className="text-text">
														{order.deliverToName}
													</span>
												</p>
											)}
										</div>
									</div>
								))}
							</div>
						</div>
					)}

					{/* Store Orders Details */}
					{summary.storeOrders.length > 0 && options.deleteStoreOrders && (
						<div className="bg-surface border border-stroke rounded-2xl p-6">
							<h3 className="font-heading font-semibold mb-4">
								Store Orders to Delete ({summary.storeOrders.length})
							</h3>
							<div className="space-y-2 max-h-96 overflow-y-auto">
								{summary.storeOrders.map((order) => (
									<div
										key={order.id}
										className="p-3 rounded-lg bg-bg border border-stroke text-sm"
									>
										<div className="flex justify-between items-start mb-2">
											<div>
												<p className="font-medium font-mono text-xs">
													Order #{order.id.slice(0, 8)}
												</p>
												<p className="text-xs text-text-muted mt-1">
													🛍️ Store Order
												</p>
											</div>
											<div className="text-right">
												<span className="text-xs px-2 py-1 rounded-full bg-stroke">
													{order.status}
												</span>
												<p className="text-sm font-semibold mt-1">
													{formatCurrency(order.totalMinor)}
												</p>
											</div>
										</div>
									</div>
								))}
							</div>
						</div>
					)}

					{/* Wallet Ledger Details */}
					{summary.walletLedger.length > 0 && options.deleteWalletLedger && (
						<div className="bg-surface border border-stroke rounded-2xl p-6">
							<h3 className="font-heading font-semibold mb-4">
								Wallet Ledger Entries to Delete ({summary.walletLedger.length})
							</h3>
							<div className="space-y-2 max-h-96 overflow-y-auto">
								{summary.walletLedger.map((entry) => (
									<div
										key={entry.id}
										className="p-3 rounded-lg bg-bg border border-stroke text-sm"
									>
										<div className="flex justify-between items-start">
											<div>
												<p className="font-medium capitalize">
													{entry.type.replace(/_/g, " ")}
												</p>
												<p className="text-xs text-text-muted mt-1">
													Source: {entry.source}
												</p>
												{entry.eventId && (
													<p className="text-xs text-text-muted mt-1 font-mono">
														Event: {entry.eventId.slice(0, 8)}...
													</p>
												)}
											</div>
											<div className="text-right">
												<p className="text-sm font-semibold">
													{formatCurrency(entry.amountMinor)}
												</p>
												<p className="text-xs text-text-muted mt-1">
													{new Date(entry.createdAt).toLocaleDateString()}
												</p>
											</div>
										</div>
									</div>
								))}
							</div>
						</div>
					)}

					{/* Selection Options */}
					<div className="bg-surface border border-stroke rounded-2xl p-6">
						<h2 className="font-heading font-semibold text-lg mb-4">
							Step 3: Select What to Delete
						</h2>

						<div className="space-y-3">
							<label className="flex items-center gap-3 p-3 rounded-lg hover:bg-bg cursor-pointer">
								<input
									type="checkbox"
									checked={options.deleteAttendeeTickets}
									onChange={(e) =>
										setOptions({
											...options,
											deleteAttendeeTickets: e.target.checked,
										})
									}
									className="w-5 h-5 rounded border-stroke text-accent focus:ring-accent"
								/>
								<div>
									<p className="font-medium">Delete Attendee Tickets</p>
									<p className="text-xs text-text-muted">
										Optional. Leave off to keep issued tickets/QRs attached to the event.
									</p>
								</div>
							</label>

							<label className="flex items-center gap-3 p-3 rounded-lg hover:bg-bg cursor-pointer">
								<input
									type="checkbox"
									checked={options.deleteOrders}
									onChange={(e) =>
										setOptions({ ...options, deleteOrders: e.target.checked })
									}
									className="w-5 h-5 rounded border-stroke text-accent focus:ring-accent"
								/>
								<div>
									<p className="font-medium">Delete Event Orders</p>
									<p className="text-xs text-text-muted">
										{filteredOrders.length} orders ({formatCurrency(filteredOrdersTotal)}) for selected events. Events and ticket types stay.
									</p>
								</div>
							</label>
							<label className="flex items-center gap-3 p-3 rounded-lg hover:bg-bg cursor-pointer">
								<input
									type="checkbox"
									checked={options.deleteStoreOrders}
									onChange={(e) =>
										setOptions({
											...options,
											deleteStoreOrders: e.target.checked,
										})
									}
									className="w-5 h-5 rounded border-stroke text-accent focus:ring-accent"
								/>
								<div>
									<p className="font-medium">Delete Store Orders</p>
									<p className="text-xs text-text-muted">
										{summary.storeOrders.length} store orders (
										{formatCurrency(
											summary.storeOrders.reduce(
												(sum, o) => sum + o.totalMinor,
												0,
											),
										)}
										)
									</p>
								</div>
							</label>
							<label className="flex items-center gap-3 p-3 rounded-lg hover:bg-bg cursor-pointer">
								<input
									type="checkbox"
									checked={options.deleteWalletLedger}
									onChange={(e) =>
										setOptions({
											...options,
											deleteWalletLedger: e.target.checked,
										})
									}
									className="w-5 h-5 rounded border-stroke text-accent focus:ring-accent"
								/>
								<div>
									<p className="font-medium">Delete Wallet Ledger Entries</p>
									<p className="text-xs text-text-muted">
										{summary.walletLedger.length} entries (
										{formatCurrency(
											summary.walletLedger.reduce(
												(sum, l) => sum + l.amountMinor,
												0,
											),
										)}
										)
									</p>
								</div>
							</label>

							<label className="flex items-center gap-3 p-3 rounded-lg hover:bg-bg cursor-pointer">
								<input
									type="checkbox"
									checked={options.resetWallet}
									onChange={(e) =>
										setOptions({ ...options, resetWallet: e.target.checked })
									}
									className="w-5 h-5 rounded border-stroke text-accent focus:ring-accent"
								/>
								<div>
									<p className="font-medium">Reset Wallet Balance to ₦0</p>
									<p className="text-xs text-text-muted">
										Current: {formatCurrency(summary.currentWalletBalanceMinor)}
									</p>
								</div>
							</label>
						</div>
						<p className="text-xs text-text-muted mt-4">
							Not selectable here: events, ticket type setup, merch, moments, event content, and organizer profile data.
						</p>
					</div>

					{/* Confirmation */}
					{step === "preview" && (
						<div className="bg-surface border border-stroke rounded-2xl p-6">
							<h2 className="font-heading font-semibold text-lg mb-4">
								Step 4: Confirm Deletion
							</h2>
							<div className="bg-alert/10 border border-alert/20 rounded-lg p-4 mb-4">
								<p className="text-alert font-semibold flex items-center gap-2">
									<AlertTriangle className="w-5 h-5" />
									Warning: This action cannot be undone
								</p>
								<p className="text-alert/90 text-sm mt-2">
									Type <strong>DELETE</strong> below to confirm you want to run the selected cleanup. Preserved categories will not be touched.
								</p>
							</div>

							<input
								type="text"
								value={confirmText}
								onChange={(e) => setConfirmText(e.target.value)}
								placeholder='Type "DELETE" to confirm'
								className="w-full rounded-xl border border-stroke px-4 py-3 text-text outline-none focus:border-accent mb-4"
							/>

							<div className="flex gap-3">
								<Button
									text="Cancel"
									variant="outline"
									onClick={() => {
										setStep("idle");
										setSummary(null);
										setSelectedEventIds([]);
										setConfirmText("");
									}}
									className="flex-1"
								/>
								<Button
									text="Delete Selected Data"
									variant="danger"
									onClick={() => setStep("confirming")}
									disabled={confirmText !== "DELETE" || !canRunCleanup}
									className="flex-1"
									leftIcon={<Trash2 className="w-4 h-4" />}
								/>
							</div>
						</div>
					)}

					{/* Final Confirmation */}
					{step === "confirming" && (
						<div className="bg-surface border border-stroke rounded-2xl p-6">
							<h2 className="font-heading font-semibold text-lg mb-4 text-alert">
								Final Confirmation
							</h2>
							<p className="text-text-muted mb-6">
								Are you absolutely sure? This selected cleanup will:
							</p>
							<ul className="list-disc list-inside space-y-2 mb-6 text-sm">
								{options.deleteAttendeeTickets && (
									<li>{filteredTickets.length} attendee tickets</li>
								)}
								{options.deleteOrders && (
									<li>{filteredOrders.length} orders</li>
								)}
								{options.deleteStoreOrders && (
									<li>{summary.storeOrders.length} store orders</li>
								)}
								{options.deleteWalletLedger && (
									<li>{summary.walletLedger.length} wallet ledger entries</li>
								)}
								{options.resetWallet && <li>Reset wallet balance to ₦0</li>}
								<li className="text-text-muted">
									Preserve events, ticket types, merch, moments, and other event setup data
								</li>
							</ul>

							<div className="flex gap-3">
								<Button
									text="Go Back"
									variant="outline"
									onClick={() => setStep("preview")}
									className="flex-1"
								/>
								<Button
									text="Yes, Run Selected Cleanup"
									variant="danger"
									onClick={handleExecuteCleanup}
									className="flex-1"
									leftIcon={<Trash2 className="w-4 h-4" />}
								/>
							</div>
						</div>
					)}
				</div>
			)}

			{/* Executing State */}
			{step === "executing" && (
				<div className="bg-surface border border-stroke rounded-2xl p-12 flex flex-col items-center justify-center">
					<Spinner size="lg" />
					<p className="text-text-muted mt-4">Deleting data...</p>
					<p className="text-text-muted text-sm mt-2">This may take a moment</p>
				</div>
			)}

			{/* Complete State */}
			{step === "complete" && results && (
				<div className="bg-surface border border-stroke rounded-2xl p-6">
					<h2 className="font-heading font-semibold text-lg mb-4 text-accent flex items-center gap-2">
						✓ Cleanup Complete
					</h2>

					<div className="space-y-3 mb-6">
						{results.attendeeTicketsDeleted > 0 && (
							<p className="text-sm">
								✓ Deleted <strong>{results.attendeeTicketsDeleted}</strong>{" "}
								attendee tickets
							</p>
						)}
						{results.ordersDeleted > 0 && (
							<p className="text-sm">
								✓ Deleted <strong>{results.ordersDeleted}</strong> orders
							</p>
						)}
						{results.storeOrdersDeleted > 0 && (
							<p className="text-sm">
								✓ Deleted <strong>{results.storeOrdersDeleted}</strong> store
								orders
							</p>
						)}
						{results.walletLedgerDeleted > 0 && (
							<p className="text-sm">
								✓ Deleted <strong>{results.walletLedgerDeleted}</strong> wallet
								ledger entries
							</p>
						)}
						{results.walletReset && (
							<p className="text-sm">✓ Reset wallet balance to ₦0</p>
						)}
					</div>

					<Button
						text="Done"
						variant="primary"
						onClick={() => {
							setStep("idle");
							setSummary(null);
							setSelectedEventIds([]);
							setResults(null);
							setConfirmText("");
						}}
					/>
				</div>
			)}
		</div>
	);
}
