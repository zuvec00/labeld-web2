// components/orders/FulfillmentLineManager.tsx
"use client";

import { useState } from "react";
import { OrderWithVendorStatus, LineItem } from "@/types/orders";
import { getLineKey, getLineFulfillmentStatus } from "@/lib/orders/helpers";
import FulfillmentStatusBadge from "./FulfillmentStatusBadge";
import TrackingModal from "./TrackingModal";
import NoteModal from "./NoteModal";
import {
	setFulfillmentStatus,
	addTimelineNote,
} from "@/lib/firebase/callables/shipping";
import { auth } from "@/lib/firebase/firebaseConfig";
import { Button } from "@/components/ui/button";
import { Package, Truck, X, MessageSquare } from "lucide-react";

interface FulfillmentLineManagerProps {
	order: OrderWithVendorStatus;
	onUpdate: () => void;
}

export default function FulfillmentLineManager({
	order,
	onUpdate,
}: FulfillmentLineManagerProps) {
	const [loading, setLoading] = useState<string | null>(null);
	const [showTrackingModal, setShowTrackingModal] = useState<string | null>(
		null,
	);
	const [showNoteModal, setShowNoteModal] = useState<string | null>(null);

	// Get vendor-owned merch lines
	const vendorOwnedLines = order.lineItems.filter(
		(item): item is LineItem & { _type: "merch" } =>
			item._type === "merch" && order.visibilityReason === "brand", // Only show for brand owners
	);

	const handleMarkFulfilled = async (lineKey: string) => {
		if (!auth.currentUser) return;

		setLoading(lineKey);
		try {
			await setFulfillmentStatus({
				orderId: order.id,
				lineKey,
				status: "fulfilled",
				qtyFulfilled:
					order.lineItems.find((item) => getLineKey(item) === lineKey)?.qty ||
					0,
			});
			onUpdate();
		} catch (error) {
			console.error("Failed to mark as fulfilled:", error);
		} finally {
			setLoading(null);
		}
	};

	const handleCancel = async (lineKey: string) => {
		if (!auth.currentUser) return;

		setLoading(lineKey);
		try {
			await setFulfillmentStatus({
				orderId: order.id,
				lineKey,
				status: "cancelled",
			});
			onUpdate();
		} catch (error) {
			console.error("Failed to cancel:", error);
		} finally {
			setLoading(null);
		}
	};

	const handleAddTracking = async (
		lineKey: string,
		trackingNumber: string,
		carrier: string,
	) => {
		if (!auth.currentUser) return;

		setLoading(lineKey);
		try {
			await setFulfillmentStatus({
				orderId: order.id,
				lineKey,
				status: "shipped",
				trackingNumber,
				carrier,
			});
			setShowTrackingModal(null);
			onUpdate();
		} catch (error) {
			console.error("Failed to add tracking:", error);
		} finally {
			setLoading(null);
		}
	};

	const handleAddNote = async (lineKey: string | null, note: string) => {
		if (!auth.currentUser) return;

		setLoading("note");
		try {
			await addTimelineNote({
				orderId: order.id,
				lineKey: lineKey || undefined,
				note,
			});
			setShowNoteModal(null);
			onUpdate();
		} catch (error) {
			console.error("Failed to add note:", error);
		} finally {
			setLoading(null);
		}
	};

	if (vendorOwnedLines.length === 0) {
		return null;
	}

	return (
		<>
			<div className="rounded-lg bg-surface border border-stroke p-4">
				<h3 className="font-medium text-text mb-3">Fulfillment Management</h3>
				<div className="space-y-3">
					{vendorOwnedLines.map((line) => {
						const lineKey = getLineKey(line);
						const fulfillmentLine = order.fulfillmentLines?.[lineKey];
						const fulfillmentStatus = fulfillmentLine
							? getLineFulfillmentStatus(fulfillmentLine)
							: "unfulfilled";
						const isProcessing = loading === lineKey;

						return (
							<div
								key={lineKey}
								className="p-3 bg-bg rounded-lg border border-stroke/50"
							>
								<div className="flex items-center justify-between mb-2">
									<div className="flex items-center gap-2">
										<Package className="w-4 h-4 text-text-muted" />
										<span className="text-sm font-medium text-text">
											{line.name}
										</span>
										{line.size && (
											<span className="text-xs text-text-muted">
												({line.size})
											</span>
										)}
										{line.color && (
											<span className="text-xs text-text-muted flex items-center gap-1">
												{typeof line.color === "object" ? (
													<>
														{(line.color as any).label}
														<span
															className="inline-block w-2 h-2 rounded-full border border-stroke/20"
															style={{
																backgroundColor: (line.color as any).hex,
															}}
														/>
													</>
												) : (
													line.color
												)}
											</span>
										)}
									</div>
									<FulfillmentStatusBadge status={fulfillmentStatus} />
								</div>

								<div className="text-xs text-text-muted mb-3">
									<div>Qty Ordered: {line.qty}</div>
									<div>
										Unit Price: ₦{(line.unitPriceMinor / 100).toFixed(2)}
									</div>
								</div>

								{/* Action Buttons */}
								<div className="flex items-center gap-2 flex-wrap">
									{fulfillmentStatus === "unfulfilled" && (
										<Button
											text={isProcessing ? "Processing..." : "Mark Fulfilled"}
											onClick={() => handleMarkFulfilled(lineKey)}
											disabled={isProcessing}
											variant="primary"
											className="bg-accent hover:bg-accent/90 text-text"
										/>
									)}

									{fulfillmentStatus === "fulfilled" && (
										<Button
											text="Add Tracking"
											onClick={() => setShowTrackingModal(lineKey)}
											disabled={isProcessing}
											variant="primary"
											leftIcon={<Truck className="w-3 h-3" />}
											className="bg-calm-1 hover:bg-calm-1/90 text-text"
										/>
									)}

									{fulfillmentStatus !== "cancelled" && (
										<Button
											text="Cancel"
											variant="outline"
											onClick={() => handleCancel(lineKey)}
											disabled={isProcessing}
											leftIcon={<X className="w-3 h-3" />}
											className="text-alert border-alert hover:bg-alert/10"
										/>
									)}

									<Button
										text="Add Note"
										variant="outline"
										onClick={() => setShowNoteModal(lineKey)}
										disabled={isProcessing}
										leftIcon={<MessageSquare className="w-3 h-3" />}
										className="text-text-muted border-stroke hover:bg-surface"
									/>
								</div>
							</div>
						);
					})}

					{/* Add general note button */}
					<div className="pt-2 border-t border-stroke/50">
						<Button
							text="Add Order Note"
							variant="outline"
							onClick={() => setShowNoteModal(null)}
							disabled={loading === "note"}
							leftIcon={<MessageSquare className="w-3 h-3" />}
							className="text-text-muted border-stroke hover:bg-surface"
						/>
					</div>
				</div>
			</div>

			{/* Tracking Modal */}
			<TrackingModal
				isOpen={!!showTrackingModal}
				onClose={() => setShowTrackingModal(null)}
				onSubmit={(trackingNumber, carrier) =>
					showTrackingModal &&
					handleAddTracking(showTrackingModal, trackingNumber, carrier)
				}
				loading={loading !== null}
			/>

			{/* Note Modal */}
			<NoteModal
				isOpen={!!showNoteModal}
				onClose={() => setShowNoteModal(null)}
				onSubmit={(note) => handleAddNote(showNoteModal, note)}
				loading={loading === "note"}
				title={showNoteModal ? "Add Line Note" : "Add Order Note"}
				placeholder={
					showNoteModal
						? "Add a note for this fulfillment line..."
						: "Add a general note for this order..."
				}
			/>
		</>
	);
}
