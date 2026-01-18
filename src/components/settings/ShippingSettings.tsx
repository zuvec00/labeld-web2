"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase/firebaseConfig";
import { Spinner } from "@/components/ui/spinner";
import {
	Plus,
	Trash2,
	CheckCircle2,
	MapPin,
	Globe,
	Truck,
	Store,
} from "lucide-react";
import { formatWithCommasDouble } from "@/lib/format";

interface ShippingSettings {
	mode: "flat_all" | "flat_by_state";
	flatAllFeeMinor?: number;
	stateFeesMinor?: Record<string, number>;
	pickupEnabled?: boolean;
	pickupAddress?: string;
}

export default function ShippingSettings() {
	const router = useRouter();
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [saveSuccess, setSaveSuccess] = useState(false);

	// Form State
	const [mode, setMode] = useState<"flat_all" | "flat_by_state">("flat_all");
	const [flatFee, setFlatFee] = useState<string>(""); // Store as string for input handling
	const [stateFees, setStateFees] = useState<Record<string, number>>({});
	const [pickupEnabled, setPickupEnabled] = useState(false);
	const [pickupAddress, setPickupAddress] = useState("");

	// Helper for dirty checking
	const [initialSettings, setInitialSettings] =
		useState<ShippingSettings | null>(null);

	// New Rate Input State
	const [newStateName, setNewStateName] = useState("");
	const [newStateFee, setNewStateFee] = useState("");

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
				const data = settingsSnap.data() as ShippingSettings;
				setInitialSettings(data);

				// Hydrate local state
				setMode(data.mode || "flat_all");
				setFlatFee(
					data.flatAllFeeMinor ? (data.flatAllFeeMinor / 100).toString() : "0"
				);
				setStateFees(data.stateFeesMinor || {});
				setPickupEnabled(!!data.pickupEnabled);
				setPickupAddress(data.pickupAddress || "");
			} else {
				// Defaults for new users
				const defaults: ShippingSettings = {
					mode: "flat_all",
				};
				setInitialSettings(defaults);
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

			const flatFeeMinor = Math.round(parseFloat(flatFee || "0") * 100);

			const newSettings: ShippingSettings = {
				mode,
				flatAllFeeMinor: flatFeeMinor,
				stateFeesMinor: stateFees,
				pickupEnabled,
				pickupAddress,
			};

			await setDoc(settingsRef, newSettings, { merge: true });

			setInitialSettings(newSettings);
			setSaveSuccess(true);

			setTimeout(() => {
				setSaveSuccess(false);
			}, 3000);
		} catch (error) {
			console.error("Error saving shipping settings:", error);
		} finally {
			setSaving(false);
		}
	};

	const handleAddRate = () => {
		if (!newStateName.trim() || !newStateFee) return;
		const feeMinor = Math.round(parseFloat(newStateFee) * 100);

		setStateFees((prev) => ({
			...prev,
			[newStateName.trim()]: feeMinor,
		}));

		setNewStateName("");
		setNewStateFee("");
	};

	const handleRemoveRate = (state: string) => {
		setStateFees((prev) => {
			const next = { ...prev };
			delete next[state];
			return next;
		});
	};

	// Dirty Check
	const isDirty = (() => {
		if (!initialSettings) return false;
		// Check simple fields
		if (mode !== initialSettings.mode) return true;
		if (pickupEnabled !== !!initialSettings.pickupEnabled) return true;
		if (pickupAddress !== (initialSettings.pickupAddress || "")) return true;

		// Check flat fee
		const currentFlatFeeMinor = Math.round(parseFloat(flatFee || "0") * 100);
		if (currentFlatFeeMinor !== (initialSettings.flatAllFeeMinor || 0))
			return true;

		// Check state fees (deep compare)
		const initialFees = initialSettings.stateFeesMinor || {};
		const keys1 = Object.keys(stateFees);
		const keys2 = Object.keys(initialFees);
		if (keys1.length !== keys2.length) return true;
		for (const key of keys1) {
			if (stateFees[key] !== initialFees[key]) return true;
		}

		return false;
	})();

	if (loading) {
		return (
			<div className="h-[400px] flex items-center justify-center">
				<Spinner size="lg" />
			</div>
		);
	}

	return (
		<div className="max-w-4xl mx-auto space-y-12 pb-24">
			{/* Header */}
			<div className="space-y-1">
				<h1 className="text-2xl md:text-3xl font-heading font-medium text-white tracking-tight">
					How do you deliver your orders?
				</h1>
				<p className="text-text-muted text-lg font-light">
					Choose how customers receive purchases from your store.
				</p>
			</div>

			{/* Shipping Strategy */}
			<div className="space-y-4">
				<h2 className="text-white font-medium text-lg">Shipping Strategy</h2>
				<div className="grid md:grid-cols-2 gap-4">
					{/* Card A - Flat Rate */}
					<button
						onClick={() => setMode("flat_all")}
						className={`
              relative flex flex-col p-6 rounded-2xl text-left border transition-all duration-300 group
              ${
								mode === "flat_all"
									? "bg-surface border-green-500/50 shadow-[0_0_20px_rgba(34,197,94,0.1)] scale-[1.01]"
									: "bg-surface-neutral/30 border-stroke/50 hover:bg-surface hover:border-stroke hover:scale-[1.005]"
							}
            `}
					>
						{mode === "flat_all" && (
							<div className="absolute top-4 right-4 text-green-500">
								<CheckCircle2 className="w-5 h-5" />
							</div>
						)}
						<div className="p-3 bg-surface-neutral/50 w-fit rounded-xl mb-4 group-hover:bg-green-500/10 group-hover:text-green-400 transition-colors">
							<Globe className="w-6 h-6" />
						</div>
						<h3 className="text-xl font-bold text-white mb-2">
							Flat Rate Shipping
						</h3>
						<p className="text-sm text-text-muted leading-relaxed">
							Charge the same delivery fee for all locations. Simple and
							predictable for customers.
						</p>
					</button>

					{/* Card B - Location Based */}
					<button
						onClick={() => setMode("flat_by_state")}
						className={`
              relative flex flex-col p-6 rounded-2xl text-left border transition-all duration-300 group
              ${
								mode === "flat_by_state"
									? "bg-surface border-green-500/50 shadow-[0_0_20px_rgba(34,197,94,0.1)] scale-[1.01]"
									: "bg-surface-neutral/30 border-stroke/50 hover:bg-surface hover:border-stroke hover:scale-[1.005]"
							}
            `}
					>
						{mode === "flat_by_state" && (
							<div className="absolute top-4 right-4 text-green-500">
								<CheckCircle2 className="w-5 h-5" />
							</div>
						)}
						<div className="p-3 bg-surface-neutral/50 w-fit rounded-xl mb-4 group-hover:bg-green-500/10 group-hover:text-green-400 transition-colors">
							<MapPin className="w-6 h-6" />
						</div>
						<h3 className="text-xl font-bold text-white mb-2">
							Location-based Shipping
						</h3>
						<p className="text-sm text-text-muted leading-relaxed">
							Set different fees by state or region. Charge more for distant
							locations.
						</p>
					</button>
				</div>
			</div>

			{/* Shipping Rates Configuration (Conditional) */}
			<div className="bg-surface/30 border border-stroke/30 rounded-2xl p-6 md:p-8 animate-in fade-in slide-in-from-top-4 duration-500">
				{mode === "flat_all" ? (
					/* Flat Rate Config */
					<div className="max-w-md">
						<label className="block text-sm font-medium text-text-muted mb-3">
							Global Shipping Fee
						</label>
						<div className="relative">
							<span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">
								₦
							</span>
							<input
								type="number"
								value={flatFee}
								onChange={(e) => setFlatFee(e.target.value)}
								className="w-full bg-surface border border-stroke rounded-xl pl-10 pr-4 py-4 text-2xl font-bold text-white focus:outline-none focus:border-green-500/50 transition-colors placeholder:text-text-muted/20"
								placeholder="0.00"
							/>
						</div>
						<p className="text-xs text-text-muted/60 mt-3">
							This amount will be added to checkout for every shipping order.
						</p>
					</div>
				) : (
					/* Location Fees Config */
					<div className="space-y-6">
						<h3 className="text-lg font-medium text-white">
							Shipping Rates by Location
						</h3>

						{/* Existing Rates List */}
						<div className="space-y-1">
							{Object.entries(stateFees).length === 0 ? (
								<div className="text-center py-8 border border-dashed border-stroke/50 rounded-xl">
									<p className="text-text-muted">No specific rates set yet.</p>
								</div>
							) : (
								Object.entries(stateFees).map(([state, feeMinor]) => (
									<div
										key={state}
										className="group flex items-center justify-between p-4 rounded-xl hover:bg-surface border border-transparent hover:border-stroke/30 transition-all"
									>
										<div className="flex items-center gap-3">
											<div className="w-2 h-2 rounded-full bg-green-500/50" />
											<span className="text-white font-medium">{state}</span>
										</div>
										<div className="flex items-center gap-6">
											<span className="font-mono text-text-muted">
												₦{formatWithCommasDouble(feeMinor / 100)}
											</span>
											<button
												onClick={() => handleRemoveRate(state)}
												className="text-text-muted/50 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all p-2 hover:bg-white/5 rounded-lg"
											>
												<Trash2 className="w-4 h-4" />
											</button>
										</div>
									</div>
								))
							)}
						</div>

						{/* Add Rate Input */}
						<div className="flex items-center gap-2 pt-4 border-t border-stroke/30">
							<input
								type="text"
								value={newStateName}
								onChange={(e) => setNewStateName(e.target.value)}
								placeholder="Location (e.g. Lagos)"
								className="w-36 md:w-90 bg-surface-neutral/30 border border-stroke/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500/50 transition-colors placeholder:text-text-muted/40"
							/>
							<div className="relative flex-1">
								<span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted/50 text-sm">
									₦
								</span>
								<input
									type="number"
									value={newStateFee}
									onChange={(e) => setNewStateFee(e.target.value)}
									placeholder="0.00"
									className="w-full bg-surface-neutral/30 border border-stroke/30 rounded-xl pl-8 pr-4 py-3 text-white focus:outline-none focus:border-green-500/50 transition-colors placeholder:text-text-muted/40"
								/>
							</div>
							<button
								onClick={handleAddRate}
								disabled={!newStateName.trim() || !newStateFee}
								className="bg-white/5 border border-white/10 hover:bg-white/10 text-white p-3 rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed"
							>
								<Plus className="w-5 h-5" />
							</button>
						</div>
					</div>
				)}
			</div>

			{/* Delivery Methods Section */}
			<div className="space-y-6">
				<h2 className="text-white font-medium text-lg">Delivery Methods</h2>

				{/* Option 1: Shipping (Visual Only Toggle) */}
				<div className="flex items-center justify-between p-4 rounded-xl border border-stroke/30 bg-surface/20 opacity-75">
					<div className="flex items-center gap-4">
						<div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
							<Truck className="w-5 h-5" />
						</div>
						<div>
							<div className="text-white font-medium">Ship Orders</div>
							<div className="text-xs text-text-muted">
								Deliver to customer address
							</div>
						</div>
					</div>
					{/* Fake Switch (Locked On) */}
					<div className="w-11 h-6 bg-green-500/80 rounded-full relative opacity-50 cursor-not-allowed">
						<div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
					</div>
				</div>

				{/* Option 2: Local Pickup */}
				<div className="border border-stroke/30 rounded-xl overflow-hidden bg-surface/10">
					<div className="flex items-center justify-between p-4">
						<div className="flex items-center gap-4">
							<div className="p-2 bg-orange-500/10 rounded-lg text-orange-400">
								<Store className="w-5 h-5" />
							</div>
							<div>
								<div className="text-white font-medium">Local Pickup</div>
								<div className="text-xs text-text-muted">
									Allow customers to collect orders
								</div>
							</div>
						</div>
						{/* Real Switch */}
						<button
							onClick={() => setPickupEnabled(!pickupEnabled)}
							className={`w-11 h-6 rounded-full relative transition-colors duration-300 ${
								pickupEnabled ? "bg-green-500" : "bg-surface-neutral"
							}`}
						>
							<div
								className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300 ${
									pickupEnabled ? "translate-x-6" : "translate-x-1"
								}`}
							/>
						</button>
					</div>

					{/* Collapsible Pickup Config */}
					<div
						className={`
              grid transition-[grid-template-rows] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]
              ${
								pickupEnabled
									? "grid-rows-[1fr] border-t border-stroke/30"
									: "grid-rows-[0fr]"
							}
            `}
					>
						<div className="overflow-hidden">
							<div className="p-6 space-y-3">
								<label className="text-sm font-medium text-text-muted">
									Pickup Address
								</label>
								<input
									type="text"
									value={pickupAddress}
									onChange={(e) => setPickupAddress(e.target.value)}
									placeholder="123 Example Street, City, State"
									className="w-full bg-surface-neutral/30 border border-stroke/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500/50 transition-colors placeholder:text-text-muted/30"
								/>
								<p className="text-xs text-text-muted/50">
									This address will be shown to customers who choose pickup at
									checkout.
								</p>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Strategy Summary / Footer */}
			<div className="flex justify-center pt-8 opacity-60">
				<p className="text-sm text-text-muted text-center max-w-md">
					Customers can receive orders via {pickupEnabled ? "shipping or " : ""}{" "}
					shipping. Fees are applied automatically at checkout.
				</p>
			</div>

			{/* Save Action */}
			<div className="fixed bottom-8 right-8 z-50">
				{isDirty && (
					<button
						onClick={saveSettings}
						disabled={saving}
						className={`
              flex items-center gap-3 px-6 py-4 rounded-full shadow-2xl transition-all duration-300 transform hover:scale-105
              bg-white text-black font-bold text-lg
              hover:bg-green-400 hover:text-black hover:shadow-[0_0_30px_rgba(74,222,128,0.4)]
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
					>
						{saving ? (
							<>
								<Spinner className="w-5 h-5 border-black/30 border-t-black" />
								<span>Saving...</span>
							</>
						) : (
							<span>Save Changes</span>
						)}
					</button>
				)}
			</div>

			{/* Success Toast */}
			{saveSuccess && (
				<div className="fixed bottom-24 right-8 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
					<div className="bg-green-500 text-black px-6 py-3 rounded-full font-bold shadow-lg flex items-center gap-2">
						<CheckCircle2 className="w-5 h-5" />
						Changes Saved
					</div>
				</div>
			)}
		</div>
	);
}
