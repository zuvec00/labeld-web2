// components/orders/OrderTimeline.tsx
"use client";

import { useState } from "react";
import { useTimeline } from "@/hooks/useTimeline";
import { addTimelineNote } from "@/lib/firebase/callables/shipping";
import Date from "./Date";
import { useAuth } from "@/lib/auth/AuthContext";

interface OrderTimelineProps {
	orderId: string;
	onUpdate?: () => void;
}

export default function OrderTimeline({
	orderId,
	onUpdate,
}: OrderTimelineProps) {
	const { user } = useAuth();
	const { timeline, loading, error } = useTimeline(orderId);
	const [note, setNote] = useState("");
	const [submittingNote, setSubmittingNote] = useState(false);

	const handleAddNote = async () => {
		if (!note.trim() || !user) return;

		setSubmittingNote(true);
		try {
			await addTimelineNote({
				orderId,
				note: note.trim(),
			});

			setNote("");
			onUpdate?.();
		} catch (error) {
			console.error("Error adding timeline note:", error);
		} finally {
			setSubmittingNote(false);
		}
	};

	const getTypeBadgeColor = (type: string) => {
		switch (type) {
			case "order_created":
				return "bg-blue-100 text-blue-800";
			case "payment_captured":
				return "bg-green-100 text-green-800";
			case "fulfillment_marked":
				return "bg-purple-100 text-purple-800";
			case "note":
				return "bg-gray-100 text-gray-800";
			case "refund":
				return "bg-red-100 text-red-800";
			default:
				return "bg-gray-100 text-gray-800";
		}
	};

	const getTypeLabel = (type: string) => {
		switch (type) {
			case "order_created":
				return "Order Created";
			case "payment_captured":
				return "Payment Captured";
			case "fulfillment_marked":
				return "Fulfillment Updated";
			case "note":
				return "Note";
			case "refund":
				return "Refund";
			default:
				return type;
		}
	};

	const getActorLabel = (actor: string) => {
		if (actor === "system") return "System";
		if (actor.startsWith("vendor:")) return "Vendor";
		if (actor.startsWith("user:")) return "Customer";
		return actor;
	};

	if (loading) {
		return (
			<div className="rounded-lg bg-surface border border-stroke p-4">
				<h3 className="font-medium text-text mb-4">Timeline</h3>
				<div className="text-center py-4">
					<div className="text-text-muted">Loading timeline...</div>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="rounded-lg bg-surface border border-stroke p-4">
				<h3 className="font-medium text-text mb-4">Timeline</h3>
				<div className="text-center py-4">
					<div className="text-red-600">Error loading timeline: {error}</div>
				</div>
			</div>
		);
	}

	return (
		<div className="rounded-lg bg-surface border border-stroke p-4">
			<h3 className="font-medium text-text mb-4">Timeline</h3>

			<div className="space-y-4">
				{timeline.map((event, index) => (
					<div key={index} className="flex gap-3">
						<div className="flex-shrink-0 w-2 h-2 bg-cta rounded-full mt-2"></div>
						<div className="flex-1 min-w-0">
							<div className="flex items-center gap-2 mb-1">
								<span
									className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getTypeBadgeColor(
										event.type
									)}`}
								>
									{getTypeLabel(event.type)}
								</span>
								<span className="text-xs text-text-muted">
									by {getActorLabel(event.actor)}
								</span>
								<span className="text-xs text-text-muted">
									<Date timestamp={event.at} />
								</span>
							</div>
							<p className="text-sm text-text">{event.message}</p>
							{event.meta && (
								<div className="mt-2 text-xs text-text-muted">
									{event.meta.lineKey && <div>Line: {event.meta.lineKey}</div>}
									{event.meta.status && <div>Status: {event.meta.status}</div>}
									{event.meta.qtyFulfilled !== undefined && (
										<div>Qty Fulfilled: {event.meta.qtyFulfilled}</div>
									)}
									{event.meta.trackingNumber && (
										<div>Tracking: {event.meta.trackingNumber}</div>
									)}
									{event.meta.carrier && (
										<div>Carrier: {event.meta.carrier}</div>
									)}
								</div>
							)}
						</div>
					</div>
				))}

				{timeline.length === 0 && (
					<div className="text-center py-4">
						<div className="text-text-muted">No timeline events yet</div>
					</div>
				)}
			</div>

			{/* Add note section for vendors */}
			{/* {user && (
				<div className="mt-6 pt-4 border-t border-stroke">
					<h4 className="text-sm font-medium text-text mb-3">Add Note</h4>
					<div className="space-y-3">
						<textarea
							value={note}
							onChange={(e) => setNote(e.target.value)}
							placeholder="Add a note to the timeline..."
							rows={3}
							className="w-full px-3 py-2 border border-stroke rounded-lg bg-bg text-text resize-none"
						/>
						<div className="flex justify-end">
							<button
								onClick={handleAddNote}
								disabled={!note.trim() || submittingNote}
								className="px-4 py-2 bg-cta text-text rounded-lg hover:bg-cta/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
							>
								{submittingNote ? "Adding..." : "Add Note"}
							</button>
						</div>
					</div>
				</div>
			)} */}
		</div>
	);
}
