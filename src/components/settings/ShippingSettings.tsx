// components/settings/ShippingSettings.tsx
"use client";

import { useState, useEffect } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/firebaseConfig";
import { auth } from "@/lib/firebase/firebaseConfig";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, Save } from "lucide-react";

interface ShippingSettings {
	mode: "flat_all" | "flat_by_state";
	flatAllFeeMinor?: number;
	stateFeesMinor?: Record<string, number>;
	pickupEnabled?: boolean;
	pickupAddress?: string;
}

interface StateFee {
	state: string;
	feeMinor: number;
}

export default function ShippingSettings() {
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [settings, setSettings] = useState<ShippingSettings>({
		mode: "flat_all",
		flatAllFeeMinor: 0,
		stateFeesMinor: {},
		pickupEnabled: false,
		pickupAddress: "",
	});
	const [newStateFee, setNewStateFee] = useState<StateFee>({
		state: "",
		feeMinor: 0,
	});

	useEffect(() => {
		loadSettings();
	}, []);

	const loadSettings = async () => {
		if (!auth.currentUser) return;

		try {
			setLoading(true);
			const settingsRef = doc(
				db,
				"users",
				auth.currentUser.uid,
				"shippingRules",
				"settings"
			);
			const settingsSnap = await getDoc(settingsRef);

			if (settingsSnap.exists()) {
				setSettings(settingsSnap.data() as ShippingSettings);
			}
		} catch (error) {
			console.error("Error loading shipping settings:", error);
		} finally {
			setLoading(false);
		}
	};

	const saveSettings = async () => {
		if (!auth.currentUser) return;

		try {
			setSaving(true);
			const settingsRef = doc(
				db,
				"users",
				auth.currentUser.uid,
				"shippingRules",
				"settings"
			);
			await setDoc(settingsRef, settings, { merge: true });
		} catch (error) {
			console.error("Error saving shipping settings:", error);
		} finally {
			setSaving(false);
		}
	};

	const addStateFee = () => {
		if (newStateFee.state.trim() && newStateFee.feeMinor > 0) {
			setSettings((prev) => ({
				...prev,
				stateFeesMinor: {
					...prev.stateFeesMinor,
					[newStateFee.state.trim()]: newStateFee.feeMinor,
				},
			}));
			setNewStateFee({ state: "", feeMinor: 0 });
		}
	};

	const removeStateFee = (state: string) => {
		setSettings((prev) => {
			const newStateFees = { ...prev.stateFeesMinor };
			delete newStateFees[state];
			return {
				...prev,
				stateFeesMinor: newStateFees,
			};
		});
	};

	const updateStateFee = (state: string, feeMinor: number) => {
		setSettings((prev) => ({
			...prev,
			stateFeesMinor: {
				...prev.stateFeesMinor,
				[state]: feeMinor,
			},
		}));
	};

	if (loading) {
		return (
			<div className="space-y-6">
				<div className="animate-pulse">
					<div className="h-6 bg-stroke rounded w-1/4 mb-4"></div>
					<div className="space-y-4">
						<div className="h-4 bg-stroke rounded w-3/4"></div>
						<div className="h-4 bg-stroke rounded w-1/2"></div>
						<div className="h-4 bg-stroke rounded w-2/3"></div>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div>
				<h2 className="text-xl font-heading font-semibold text-text mb-2">
					Shipping Settings
				</h2>
				<p className="text-text-muted">
					Configure shipping rules and fees for your merchandise orders.
				</p>
			</div>

			<div className="bg-surface border border-stroke rounded-lg p-6 space-y-6">
				{/* Shipping Mode */}
				<div>
					<h3 className="text-lg font-medium text-text mb-4">Shipping Mode</h3>
					<div className="space-y-3">
						<label className="flex items-center gap-3 cursor-pointer">
							<input
								type="radio"
								name="shippingMode"
								value="flat_all"
								checked={settings.mode === "flat_all"}
								onChange={(e) =>
									setSettings((prev) => ({
										...prev,
										mode: e.target.value as "flat_all",
									}))
								}
								className="w-4 h-4 accent-cta"
							/>
							<div>
								<div className="font-medium text-text">
									Flat Rate for All Locations
								</div>
								<div className="text-sm text-text-muted">
									Charge the same shipping fee regardless of destination
								</div>
							</div>
						</label>

						<label className="flex items-center gap-3 cursor-pointer">
							<input
								type="radio"
								name="shippingMode"
								value="flat_by_state"
								checked={settings.mode === "flat_by_state"}
								onChange={(e) =>
									setSettings((prev) => ({
										...prev,
										mode: e.target.value as "flat_by_state",
									}))
								}
								className="w-4 h-4 accent-cta"
							/>
							<div>
								<div className="font-medium text-text">
									Different Rates by State
								</div>
								<div className="text-sm text-text-muted">
									Set different shipping fees for each state
								</div>
							</div>
						</label>
					</div>
				</div>

				{/* Flat All Fee */}
				{settings.mode === "flat_all" && (
					<div>
						<label className="block text-sm font-medium text-text mb-2">
							Flat Shipping Fee (₦)
						</label>
						<Input
							type="number"
							value={
								settings.flatAllFeeMinor ? settings.flatAllFeeMinor / 100 : 0
							}
							onChange={(e) =>
								setSettings((prev) => ({
									...prev,
									flatAllFeeMinor: Math.round(
										parseFloat(e.target.value || "0") * 100
									),
								}))
							}
							placeholder="0.00"
							min="0"
							step="0.01"
							className="max-w-xs"
						/>
						<p className="text-xs text-text-muted mt-1">
							This fee will be charged for all orders regardless of location
						</p>
					</div>
				)}

				{/* State Fees */}
				{settings.mode === "flat_by_state" && (
					<div>
						<h3 className="text-lg font-medium text-text mb-4">
							State Shipping Fees
						</h3>

						{/* Add New State Fee */}
						<div className="flex items-center gap-3 mb-4 p-3 bg-background rounded-lg border border-stroke">
							<Input
								type="text"
								placeholder="State name (e.g., Lagos)"
								value={newStateFee.state}
								onChange={(e) =>
									setNewStateFee((prev) => ({ ...prev, state: e.target.value }))
								}
								className="flex-1"
							/>
							<Input
								type="number"
								placeholder="Fee (₦)"
								value={newStateFee.feeMinor ? newStateFee.feeMinor / 100 : 0}
								onChange={(e) =>
									setNewStateFee((prev) => ({
										...prev,
										feeMinor: Math.round(
											parseFloat(e.target.value || "0") * 100
										),
									}))
								}
								min="0"
								step="0.01"
								className="w-32"
							/>
							<Button
								text=""
								onClick={addStateFee}
								disabled={
									!newStateFee.state.trim() || newStateFee.feeMinor <= 0
								}
								leftIcon={<Plus className="w-4 h-4" />}
								className="bg-cta hover:bg-cta/90 text-text px-3 py-2"
							/>
						</div>

						{/* State Fees List */}
						<div className="space-y-2">
							{Object.entries(settings.stateFeesMinor || {}).map(
								([state, feeMinor]) => (
									<div
										key={state}
										className="flex items-center gap-3 p-3 bg-background rounded-lg border border-stroke"
									>
										<span className="flex-1 font-medium text-text">
											{state}
										</span>
										<Input
											type="number"
											value={feeMinor / 100}
											onChange={(e) =>
												updateStateFee(
													state,
													Math.round(parseFloat(e.target.value || "0") * 100)
												)
											}
											min="0"
											step="0.01"
											className="w-32"
										/>
										<Button
											text=""
											onClick={() => removeStateFee(state)}
											variant="outline"
											leftIcon={<Trash2 className="w-4 h-4" />}
											className="text-alert border-alert hover:bg-alert/10 px-3 py-2"
										/>
									</div>
								)
							)}
						</div>

						{Object.keys(settings.stateFeesMinor || {}).length === 0 && (
							<div className="text-center py-6 text-text-muted">
								<p>No state fees configured yet</p>
								<p className="text-sm">
									Add states above to set different shipping rates
								</p>
							</div>
						)}
					</div>
				)}

				{/* Pickup Settings */}
				<div>
					<h3 className="text-lg font-medium text-text mb-4">Pickup Options</h3>
					<div className="space-y-4">
						<div className="flex items-center justify-between">
							<div>
								<div className="font-medium text-text">Enable Pickup</div>
								<div className="text-sm text-text-muted">
									Allow customers to pick up orders instead of shipping
								</div>
							</div>
							<Switch
								checked={settings.pickupEnabled || false}
								onCheckedChange={(checked) =>
									setSettings((prev) => ({ ...prev, pickupEnabled: checked }))
								}
							/>
						</div>

						{settings.pickupEnabled && (
							<div>
								<label className="block text-sm font-medium text-text mb-2">
									Pickup Address
								</label>
								<Input
									type="text"
									value={settings.pickupAddress || ""}
									onChange={(e) =>
										setSettings((prev) => ({
											...prev,
											pickupAddress: e.target.value,
										}))
									}
									placeholder="Enter pickup address"
									className="max-w-md"
								/>
								<p className="text-xs text-text-muted mt-1">
									This address will be shown to customers who choose pickup
								</p>
							</div>
						)}
					</div>
				</div>

				{/* Save Button */}
				<div className="pt-4 border-t border-stroke">
					<Button
						text={saving ? "Saving..." : "Save Settings"}
						onClick={saveSettings}
						disabled={saving}
						leftIcon={<Save className="w-4 h-4" />}
						className="bg-cta hover:bg-cta/90 text-text"
					/>
				</div>
			</div>
		</div>
	);
}
