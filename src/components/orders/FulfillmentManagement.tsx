// components/orders/FulfillmentManagement.tsx
"use client";

import { useState } from "react";
import {
	OrderWithVendorStatus,
	FulfillmentLine,
	FulfillmentStatus,
} from "@/types/orders";
import { setFulfillmentStatus } from "@/lib/firebase/callables/shipping";
import { getLineFulfillmentStatus } from "@/lib/orders/helpers";
import Money from "./Money";
import { useAuth } from "@/lib/auth/AuthContext";

interface FulfillmentManagementProps {
	order: OrderWithVendorStatus;
	onUpdate: () => void;
}

export default function FulfillmentManagement({
	order,
	onUpdate,
}: FulfillmentManagementProps) {
	const { user } = useAuth();
	const [editingLine, setEditingLine] = useState<string | null>(null);
	const [loading, setLoading] = useState<string | null>(null);
	const [formData, setFormData] = useState<{
		status: FulfillmentStatus;
		qtyFulfilled: number;
		trackingNumber: string;
		carrier: string;
		note: string;
	}>({
		status: "unfulfilled",
		qtyFulfilled: 0,
		trackingNumber: "",
		carrier: "",
		note: "",
	});

	// Get only merch fulfillment lines for the current vendor
	const vendorFulfillmentLines = Object.values(
		order.fulfillmentLines || {}
	).filter(
		(line) => line.vendorId === user?.uid && line.lineKey.startsWith("merch:")
	);

	console.log("🔍 FulfillmentManagement: Component render", {
		orderId: order.id,
		user: user?.uid,
		allFulfillmentLines: Object.values(order.fulfillmentLines || {}),
		vendorFulfillmentLines: vendorFulfillmentLines.map((line) => ({
			lineKey: line.lineKey,
			status: line.shipping?.status,
			vendorId: line.vendorId,
			shipping: line.shipping,
		})),
	});

	if (vendorFulfillmentLines.length === 0) {
		return null; // Hide section if no merch lines for this vendor
	}

	const handleEdit = (line: FulfillmentLine) => {
		console.log("🔍 FulfillmentManagement: handleEdit", {
			lineKey: line.lineKey,
			status: line.shipping?.status,
			shipping: line.shipping,
			fullLine: line,
		});

		setEditingLine(line.lineKey);
		setFormData({
			status: getLineFulfillmentStatus(line),
			qtyFulfilled: line.qtyFulfilled,
			trackingNumber: line.shipping?.trackingNumber || "",
			carrier: line.shipping?.carrier || "",
			note: line.notes || "",
		});
	};

	const handleSave = async (lineKey: string) => {
		if (!user) return;

		console.log("🔍 FulfillmentManagement: handleSave", {
			orderId: order.id,
			lineKey,
			formData,
			user: user.uid,
		});

		setLoading(lineKey);
		try {
			await setFulfillmentStatus({
				orderId: order.id,
				lineKey,
				status: formData.status,
				qtyFulfilled: formData.qtyFulfilled,
				trackingNumber: formData.trackingNumber || undefined,
				carrier: formData.carrier || undefined,
				note: formData.note || undefined,
			});

			console.log("✅ FulfillmentManagement: Save successful");

			setEditingLine(null);
			onUpdate();

			// Show success message (you can implement a toast system here)
		} catch (error) {
			console.error(
				"❌ FulfillmentManagement: Error updating fulfillment:",
				error
			);
			// Show error message
		} finally {
			setLoading(null);
		}
	};

	const handleCancel = () => {
		setEditingLine(null);
		setFormData({
			status: "unfulfilled",
			qtyFulfilled: 0,
			trackingNumber: "",
			carrier: "",
			note: "",
		});
	};

	return (
		<div className="rounded-lg bg-surface border border-stroke p-4">
			<h3 className="font-medium text-text mb-4">Fulfillment Management</h3>

			<div className="space-y-4">
				{vendorFulfillmentLines.map((line) => (
					<div
						key={line.lineKey}
						className="border border-stroke/50 rounded-lg p-4"
					>
						<div className="flex items-center justify-between mb-3">
							<div>
								<h4 className="font-medium text-text">{line.lineKey}</h4>
								{/* <p className="text-sm text-text-muted">
									Ordered: {line.qtyOrdered} | Fulfilled: {line.qtyFulfilled}
								</p> */}
							</div>
							{editingLine !== line.lineKey && (
								<button
									onClick={() => handleEdit(line)}
									className="px-3 py-1 text-sm bg-cta text-text rounded hover:bg-cta/90 transition-colors"
								>
									Edit
								</button>
							)}
						</div>

						{editingLine === line.lineKey ? (
							<div className="space-y-3">
								<div className="grid grid-cols-2 gap-3">
									<div>
										<label className="block text-sm font-medium text-text-muted mb-1">
											Status
										</label>
										<select
											value={formData.status}
											onChange={(e) =>
												setFormData({
													...formData,
													status: e.target.value as FulfillmentStatus,
												})
											}
											className="w-full px-3 py-2 border border-stroke rounded-lg bg-bg text-text"
										>
											<option value="unfulfilled">Unfulfilled</option>
											<option value="shipped">Shipped</option>
											<option value="delivered">Delivered</option>
											<option value="fulfilled">Fulfilled</option>
											<option value="cancelled">Cancelled</option>
										</select>
									</div>
									<div>
										<label className="block text-sm font-medium text-text-muted mb-1">
											Qty Fulfilled
										</label>
										<input
											type="number"
											min="0"
											max={line.qtyOrdered}
											value={formData.qtyFulfilled}
											onChange={(e) =>
												setFormData({
													...formData,
													qtyFulfilled: parseInt(e.target.value) || 0,
												})
											}
											className="w-full px-3 py-2 border border-stroke rounded-lg bg-bg text-text"
										/>
									</div>
								</div>

								<div className="grid grid-cols-2 gap-3">
									<div>
										<label className="block text-sm font-medium text-text-muted mb-1">
											Tracking Number
										</label>
										<input
											type="text"
											value={formData.trackingNumber}
											onChange={(e) =>
												setFormData({
													...formData,
													trackingNumber: e.target.value,
												})
											}
											placeholder="Optional"
											className="w-full px-3 py-2 border border-stroke rounded-lg bg-bg text-text"
										/>
									</div>
									<div>
										<label className="block text-sm font-medium text-text-muted mb-1">
											Carrier
										</label>
										<input
											type="text"
											value={formData.carrier}
											onChange={(e) =>
												setFormData({ ...formData, carrier: e.target.value })
											}
											placeholder="Optional"
											className="w-full px-3 py-2 border border-stroke rounded-lg bg-bg text-text"
										/>
									</div>
								</div>

								<div>
									<label className="block text-sm font-medium text-text-muted mb-1">
										Note
									</label>
									<textarea
										value={formData.note}
										onChange={(e) =>
											setFormData({ ...formData, note: e.target.value })
										}
										placeholder="Optional note"
										rows={2}
										className="w-full px-3 py-2 border border-stroke rounded-lg bg-bg text-text"
									/>
								</div>

								<div className="flex gap-2">
									<button
										onClick={() => handleSave(line.lineKey)}
										disabled={loading === line.lineKey}
										className="px-4 py-2 bg-cta text-text rounded-lg hover:bg-cta/90 transition-colors disabled:opacity-50"
									>
										{loading === line.lineKey ? "Saving..." : "Save"}
									</button>
									<button
										onClick={handleCancel}
										className="px-4 py-2 border border-stroke text-text rounded-lg hover:bg-surface transition-colors"
									>
										Cancel
									</button>
								</div>
							</div>
						) : (
							<div className="space-y-2">
								<div className="flex items-center justify-between">
									<span className="text-sm text-text-muted">Status:</span>
									<span
										className={`text-sm font-medium ${(() => {
											const current = getLineFulfillmentStatus(line);
											return current === "fulfilled"
												? "text-green-600"
												: current === "shipped"
												? "text-blue-600"
												: current === "delivered"
												? "text-green-600"
												: current === "cancelled"
												? "text-red-600"
												: "text-yellow-600";
										})()}`}
									>
										{getLineFulfillmentStatus(line)}
									</span>
								</div>

								<div className="flex items-center justify-between">
									<span className="text-sm text-text-muted">
										Shipping Method:
									</span>
									<span className="text-sm text-text capitalize">
										{line.shipping?.method || "—"}
									</span>
								</div>

								{line.shipping?.feeMinor && line.shipping.feeMinor > 0 && (
									<div className="flex items-center justify-between">
										<span className="text-sm text-text-muted">
											Shipping Fee:
										</span>
										<Money amountMinor={line.shipping.feeMinor} />
									</div>
								)}

								{line.shipping?.trackingNumber && (
									<div className="flex items-center justify-between">
										<span className="text-sm text-text-muted">Tracking:</span>
										<span className="text-sm text-text">
											{line.shipping.trackingNumber}
										</span>
									</div>
								)}

								{line.shipping?.carrier && (
									<div className="flex items-center justify-between">
										<span className="text-sm text-text-muted">Carrier:</span>
										<span className="text-sm text-text">
											{line.shipping.carrier}
										</span>
									</div>
								)}

								{line.notes && (
									<div>
										<span className="text-sm text-text-muted">Note:</span>
										<p className="text-sm text-text mt-1">{line.notes}</p>
									</div>
								)}

								{line.shipping?.method === "delivery" &&
									line.shipping?.address && (
										<div className="mt-3 p-3 bg-bg rounded-lg border border-stroke/50">
											<h5 className="text-sm font-medium text-text mb-2">
												Delivery Address
											</h5>
											<div className="space-y-1 text-sm text-text-muted">
												<div>{line.shipping.address.name}</div>
												<div>{line.shipping.address.address}</div>
												<div>
													{line.shipping.address.city},{" "}
													{line.shipping.address.state}
												</div>
												{line.shipping.address.postalCode && (
													<div>{line.shipping.address.postalCode}</div>
												)}
												{line.shipping.address.phone && (
													<div>{line.shipping.address.phone}</div>
												)}
											</div>
										</div>
									)}
							</div>
						)}
					</div>
				))}
			</div>
		</div>
	);
}
