"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase/firebaseConfig";
import { Spinner } from "@/components/ui/spinner";
import {
	Plus,
	Trash2,
	CheckCircle2,
	MapPin,
	Globe,
	Truck,
	Store,
	GripVertical,
	Zap,
	AlertTriangle,
} from "lucide-react";
import { formatWithCommasDouble } from "@/lib/format";
import PickupAddressManager from "./PickupAddressManager";
import {
	DEFAULT_PACKAGE_WEIGHT_GRAMS,
	PickupAddress,
	ShippingStrategy,
	fetchPickupAddresses,
	fetchShippingConfig,
	findDefaultPickupAddress,
	saveShippingConfig,
} from "@/lib/firebase/queries/shipping";

interface ShippingSettings {
	mode: ShippingStrategy;
	flatAllFeeMinor?: number;
	stateFeesMinor?: Record<string, number>;
	stateOrder?: string[]; // New field for ordering
	pickupEnabled?: boolean;
	pickupAddress?: string;
	defaultPackageWeightGrams?: number;
}

export default function ShippingSettings() {
	const router = useRouter();
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [saveSuccess, setSaveSuccess] = useState(false);

	// Form State
	const [mode, setMode] = useState<ShippingStrategy>("flat_all");
	const [flatFee, setFlatFee] = useState<string>(""); // Store as string for input handling
	const [stateFees, setStateFees] = useState<Record<string, number>>({});
	const [stateOrder, setStateOrder] = useState<string[]>([]); // New local state
	const [pickupEnabled, setPickupEnabled] = useState(false);
	const [pickupAddress, setPickupAddress] = useState("");
	const [packageWeight, setPackageWeight] = useState<string>(
		String(DEFAULT_PACKAGE_WEIGHT_GRAMS),
	);

	// Terminal Live origin addresses
	const [pickupAddresses, setPickupAddresses] = useState<PickupAddress[]>([]);
	const [addressesLoading, setAddressesLoading] = useState(true);

	const defaultPickup = findDefaultPickupAddress(pickupAddresses);

	// Terminal Live quotes rates from the default pickup address, so there is
	// nothing to quote from without one. Mirrors the mobile validation.
	const blockingError =
		mode === "terminal_live" && !addressesLoading && !defaultPickup
			? "Set a default pickup address before turning on live rates."
			: null;

	// Helper for dirty checking
	const [initialSettings, setInitialSettings] =
		useState<ShippingSettings | null>(null);

	const [newStateName, setNewStateName] = useState("");
	const [newStateFee, setNewStateFee] = useState("");
	const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

	useEffect(() => {
		loadSettings();
		loadPickupAddresses();
	}, []);

	const loadPickupAddresses = async () => {
		if (!auth.currentUser) return;
		try {
			setAddressesLoading(true);
			setPickupAddresses(await fetchPickupAddresses(auth.currentUser.uid));
		} catch (error) {
			console.error("Error loading pickup addresses:", error);
		} finally {
			setAddressesLoading(false);
		}
	};

	const loadSettings = async () => {
		if (!auth.currentUser) return;

		try {
			setLoading(true);
			const data = await fetchShippingConfig(auth.currentUser.uid);

			if (data) {
				setInitialSettings(data);

				// Hydrate local state. fetchShippingConfig already normalizes an
				// unrecognised mode down to flat_all.
				setMode(data.mode);
				setFlatFee(
					data.flatAllFeeMinor ? (data.flatAllFeeMinor / 100).toString() : "0",
				);
				setStateFees(data.stateFeesMinor || {});

				// Initialize order: use saved order or fallback to keys
				if (data.stateOrder && data.stateOrder.length > 0) {
					// Filter out any ordered keys that don't exist in fees anymore (integrity check)
					const existingKeys = new Set(Object.keys(data.stateFeesMinor || {}));
					setStateOrder(data.stateOrder.filter((k) => existingKeys.has(k)));

					// If there are keys in fees not in order, append them (migration case)
					const orderedSet = new Set(data.stateOrder);
					const missingKeys = Object.keys(data.stateFeesMinor || {}).filter(
						(k) => !orderedSet.has(k),
					);
					if (missingKeys.length) {
						setStateOrder((prev) => [...prev, ...missingKeys]);
					}
				} else {
					setStateOrder(Object.keys(data.stateFeesMinor || {}));
				}

				setPickupEnabled(!!data.pickupEnabled);
				setPickupAddress(data.pickupAddress || "");
				setPackageWeight(
					String(
						data.defaultPackageWeightGrams || DEFAULT_PACKAGE_WEIGHT_GRAMS,
					),
				);
			} else {
				// Defaults for new users
				const defaults: ShippingSettings = {
					mode: "flat_all",
					defaultPackageWeightGrams: DEFAULT_PACKAGE_WEIGHT_GRAMS,
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
		if (blockingError) return;

		try {
			setSaving(true);

			const flatFeeMinor = Math.round(parseFloat(flatFee || "0") * 100);
			const weightGrams =
				Math.round(parseFloat(packageWeight || "0")) ||
				DEFAULT_PACKAGE_WEIGHT_GRAMS;

			const newSettings: ShippingSettings = {
				...initialSettings, // Preserve any other existing fields
				mode,
				flatAllFeeMinor: flatFeeMinor,
				stateFeesMinor: stateFees,
				stateOrder, // Save the order
				pickupEnabled,
				pickupAddress,
				defaultPackageWeightGrams: weightGrams,
			};

			// Written without merge so removed keys in stateFeesMinor are actually
			// deleted; a merge would deep-merge the map and keep them.
			await saveShippingConfig(auth.currentUser.uid, newSettings);

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
		const name = newStateName.trim();
		const feeMinor = Math.round(parseFloat(newStateFee) * 100);

		// Prevent duplicates
		if (stateFees[name] !== undefined) {
			alert("This location already exists.");
			return;
		}

		setStateFees((prev) => ({
			...prev,
			[name]: feeMinor,
		}));
		setStateOrder((prev) => [...prev, name]); // Add to end

		setNewStateName("");
		setNewStateFee("");
	};

	const handleRemoveRate = (state: string) => {
		setStateFees((prev) => {
			const next = { ...prev };
			delete next[state];
			return next;
		});
		setStateOrder((prev) => prev.filter((s) => s !== state));
	};

	// Drag Handlers
	const handleDragStart = (
		e: React.DragEvent<HTMLDivElement>,
		index: number,
	) => {
		setDraggedIndex(index);
		e.dataTransfer.effectAllowed = "move";
		// Optional: set drag image if needed, but browser default is usually fine
	};

	const handleDragOver = (
		e: React.DragEvent<HTMLDivElement>,
		index: number,
	) => {
		e.preventDefault(); // allow dropping
		if (draggedIndex === null || draggedIndex === index) return;

		// Optional live reorder could go here
	};

	const handleDrop = (
		e: React.DragEvent<HTMLDivElement>,
		dropIndex: number,
	) => {
		e.preventDefault();
		if (draggedIndex === null) return;

		const newOrder = [...stateOrder];
		const [movedItem] = newOrder.splice(draggedIndex, 1);
		newOrder.splice(dropIndex, 0, movedItem);

		setStateOrder(newOrder);
		setDraggedIndex(null);
	};

	// Manual Move Handlers (Mobile Fallback)
	const moveRateUp = (index: number) => {
		if (index < 1) return;
		setStateOrder((prev) => {
			const next = [...prev];
			[next[index - 1], next[index]] = [next[index], next[index - 1]];
			return next;
		});
	};

	const moveRateDown = (index: number) => {
		if (index >= stateOrder.length - 1) return;
		setStateOrder((prev) => {
			const next = [...prev];
			[next[index], next[index + 1]] = [next[index + 1], next[index]];
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

		const currentWeight =
			Math.round(parseFloat(packageWeight || "0")) ||
			DEFAULT_PACKAGE_WEIGHT_GRAMS;
		if (
			currentWeight !==
			(initialSettings.defaultPackageWeightGrams ||
				DEFAULT_PACKAGE_WEIGHT_GRAMS)
		)
			return true;

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

		// Check order (if it existed initially)
		const initialOrder = initialSettings.stateOrder || [];
		if (stateOrder.length !== initialOrder.length) {
			// If lengths differ but fees are same, dirty (order changed vs keys added)
			// But simple length check often creates false positive if we just added keys.
			// Let's rely on string comparison of the arrays.
			return JSON.stringify(stateOrder) !== JSON.stringify(initialOrder);
		}
		for (let i = 0; i < stateOrder.length; i++) {
			if (stateOrder[i] !== initialOrder[i]) return true;
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

	const flatRateEditor = (
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
					className="w-full bg-surface border border-stroke rounded-xl pl-10 pr-4 py-4 text-2xl font-bold text-text focus:outline-none focus:border-green-500/50 transition-colors placeholder:text-text-muted/20"
					placeholder="0.00"
				/>
			</div>
			<p className="text-xs text-text-muted/60 mt-3">
				This amount will be added to checkout for every shipping order.
			</p>
		</div>
	);

	const stateRatesEditor = (
		<div className="space-y-6">
			<h3 className="text-lg font-medium text-text">
				Shipping Rates by Location
			</h3>

			{/* Existing Rates List (Ordered) */}
			<div className="space-y-2">
				{stateOrder.length === 0 ? (
					<div className="text-center py-8 border border-dashed border-stroke/50 rounded-xl">
						<p className="text-text-muted">No specific rates set yet.</p>
					</div>
				) : (
					stateOrder.map((state, index) => {
						const feeMinor = stateFees[state] || 0;
						const isDragging = draggedIndex === index;
						return (
							<div
								key={state}
								draggable
								onDragStart={(e) => handleDragStart(e, index)}
								onDragOver={(e) => handleDragOver(e, index)}
								onDrop={(e) => handleDrop(e, index)}
								className={`
                        group flex items-center justify-between p-4 rounded-xl border transition-all cursor-move
                        ${
										isDragging
											? "opacity-30 bg-surface-neutral border-dashed border-stroke"
											: "bg-surface/50 border-transparent hover:bg-surface hover:border-stroke/30"
									}
                        active:cursor-grabbing
                      `}
							>
								<div className="flex items-center gap-3">
									<div className="flex items-center gap-1 text-text-muted/30 group-hover:text-text-muted transition-colors">
										<GripVertical className="w-5 h-5 cursor-grab active:cursor-grabbing hidden lg:block" />

										{/* Mobile/Tablet Accessibility Reorder Buttons */}
										<div className="flex flex-col lg:hidden">
											<button
												onClick={(e) => {
													e.stopPropagation();
													moveRateUp(index);
												}}
												disabled={index === 0}
												className="p-1 hover:bg-white/10 rounded disabled:opacity-30"
												title="Move Up"
											>
												<svg
													className="w-3 h-3 text-text-muted"
													viewBox="0 0 24 24"
													fill="none"
													stroke="currentColor"
													strokeWidth="2"
												>
													<polyline points="18 15 12 9 6 15" />
												</svg>
											</button>
											<button
												onClick={(e) => {
													e.stopPropagation();
													moveRateDown(index);
												}}
												disabled={index === stateOrder.length - 1}
												className="p-1 hover:bg-white/10 rounded disabled:opacity-30"
												title="Move Down"
											>
												<svg
													className="w-3 h-3 text-text-muted"
													viewBox="0 0 24 24"
													fill="none"
													stroke="currentColor"
													strokeWidth="2"
												>
													<polyline points="6 9 12 15 18 9" />
												</svg>
											</button>
										</div>
									</div>
									<div className="w-2 h-2 rounded-full bg-green-500/50" />
									<span className="text-text font-medium">{state}</span>
								</div>
								<div className="flex items-center gap-6">
									<span className="font-mono text-text-muted">
										₦{formatWithCommasDouble(feeMinor / 100)}
									</span>
									<button
										onClick={(e) => {
											e.stopPropagation(); // Prevent drag
											handleRemoveRate(state);
										}}
										className="text-text-muted/50 hover:text-red-400 lg:opacity-0 lg:group-hover:opacity-100 transition-all p-2 hover:bg-white/5 rounded-lg"
									>
										<Trash2 className="w-4 h-4" />
									</button>
								</div>
							</div>
						);
					})
				)}
			</div>

			{/* Add Rate Input */}
			<div className="flex items-center gap-2 pt-4 border-t border-stroke/30">
				<input
					type="text"
					value={newStateName}
					onChange={(e) => setNewStateName(e.target.value)}
					placeholder="Location (e.g. Lagos)"
					className="w-36 md:w-90 bg-surface-neutral/30 border border-stroke/30 rounded-xl px-4 py-3 text-text focus:outline-none focus:border-green-500/50 transition-colors placeholder:text-text-muted/40"
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
						className="w-full bg-surface-neutral/30 border border-stroke/30 rounded-xl pl-8 pr-4 py-3 text-text focus:outline-none focus:border-green-500/50 transition-colors placeholder:text-text-muted/40"
					/>
				</div>
				<button
					onClick={handleAddRate}
					disabled={!newStateName.trim() || !newStateFee}
					className="bg-white/5 border border-white/10 hover:bg-white/10 text-text p-3 rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed"
				>
					<Plus className="w-5 h-5" />
				</button>
			</div>
		</div>
	);

	return (
		<div className="max-w-4xl mx-auto space-y-12 pb-24">
			{/* Header */}
			<div className="space-y-1">
				<h1 className="text-2xl md:text-3xl font-heading font-medium text-text tracking-tight">
					How do you deliver your orders?
				</h1>
				<p className="text-text-muted text-lg font-light">
					Choose how customers receive purchases from your store.
				</p>
			</div>

			{/* Shipping Strategy */}
			<div className="space-y-4">
				<h2 className="text-text font-medium text-lg">Shipping Strategy</h2>
				<div className="grid md:grid-cols-3 gap-4">
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
						<h3 className="text-xl font-bold text-text mb-2">
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
						<h3 className="text-xl font-bold text-text mb-2">
							Location-based Shipping
						</h3>
						<p className="text-sm text-text-muted leading-relaxed">
							Set different fees by state or region. Charge more for distant
							locations.
						</p>
					</button>

					{/* Card C - Live Carrier Rates (Terminal) */}
					<button
						onClick={() => setMode("terminal_live")}
						className={`
              relative flex flex-col p-6 rounded-2xl text-left border transition-all duration-300 group
              ${
								mode === "terminal_live"
									? "bg-surface border-green-500/50 shadow-[0_0_20px_rgba(34,197,94,0.1)] scale-[1.01]"
									: "bg-surface-neutral/30 border-stroke/50 hover:bg-surface hover:border-stroke hover:scale-[1.005]"
							}
            `}
					>
						{mode === "terminal_live" && (
							<div className="absolute top-4 right-4 text-green-500">
								<CheckCircle2 className="w-5 h-5" />
							</div>
						)}
						<div className="p-3 bg-surface-neutral/50 w-fit rounded-xl mb-4 group-hover:bg-green-500/10 group-hover:text-green-400 transition-colors">
							<Zap className="w-6 h-6" />
						</div>
						<h3 className="text-xl font-bold text-text mb-2">
							Live Carrier Rates
						</h3>
						<p className="text-sm text-text-muted leading-relaxed">
							Quote real courier prices at checkout based on the customer&apos;s
							address. Falls back to your fixed rates when a route can&apos;t be
							quoted.
						</p>
					</button>
				</div>
			</div>

			{/* Shipping Rates Configuration (Conditional) */}
			<div className="bg-surface/30 border border-stroke/30 rounded-2xl p-6 md:p-8 animate-in fade-in slide-in-from-top-4 duration-500">
				{mode === "flat_all" ? (
					flatRateEditor
				) : mode === "flat_by_state" ? (
					stateRatesEditor
				) : (
					/* Terminal Live Config */
					<div className="space-y-10">
						<div className="flex items-start gap-3 p-4 rounded-xl bg-green-500/5 border border-green-500/20">
							<Zap className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
							<div className="text-sm text-text-muted leading-relaxed">
								Customers are quoted real courier prices at checkout, based on
								the distance from your pickup address to theirs. You book the
								shipment from the order once it is paid.
							</div>
						</div>

						{blockingError && (
							<div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/5 border border-amber-500/30">
								<AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
								<div className="text-sm text-amber-200/90 leading-relaxed">
									{blockingError}
								</div>
							</div>
						)}

						{auth.currentUser && (
							<PickupAddressManager
								uid={auth.currentUser.uid}
								addresses={pickupAddresses}
								loading={addressesLoading}
								onChanged={loadPickupAddresses}
							/>
						)}

						{/* Default parcel weight */}
						<div className="max-w-md space-y-3 pt-2 border-t border-stroke/30">
							<label className="block text-sm font-medium text-text-muted pt-6">
								Default Package Weight
							</label>
							<div className="relative">
								<input
									type="number"
									value={packageWeight}
									onChange={(e) => setPackageWeight(e.target.value)}
									className="w-full bg-surface border border-stroke rounded-xl pl-4 pr-16 py-4 text-xl font-bold text-text focus:outline-none focus:border-green-500/50 transition-colors placeholder:text-text-muted/20"
									placeholder={String(DEFAULT_PACKAGE_WEIGHT_GRAMS)}
								/>
								<span className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted text-sm">
									grams
								</span>
							</div>
							<p className="text-xs text-text-muted/60">
								Used to request carrier quotes when an order has no weight of
								its own. Couriers price by weight, so a realistic value keeps
								quotes accurate.
							</p>
						</div>

						{/* Fallback rates */}
						<div className="space-y-6 pt-6 border-t border-stroke/30">
							<div>
								<h3 className="text-lg font-medium text-text">Fallback Rates</h3>
								<p className="text-xs text-text-muted/70 mt-1">
									Charged when no courier can quote a route — an unusual
									destination, or a carrier outage. Location rates win where you
									have set one; otherwise the flat fee applies.
								</p>
							</div>

							<div className="max-w-md">
								<label className="block text-sm font-medium text-text-muted mb-3">
									Fallback Flat Fee
								</label>
								<div className="relative">
									<span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">
										₦
									</span>
									<input
										type="number"
										value={flatFee}
										onChange={(e) => setFlatFee(e.target.value)}
										className="w-full bg-surface border border-stroke rounded-xl pl-10 pr-4 py-4 text-xl font-bold text-text focus:outline-none focus:border-green-500/50 transition-colors placeholder:text-text-muted/20"
										placeholder="0.00"
									/>
								</div>
							</div>

							{stateRatesEditor}
						</div>
					</div>
				)}
			</div>

			{/* Delivery Methods Section */}
			<div className="space-y-6">
				<h2 className="text-text font-medium text-lg">Delivery Methods</h2>

				{/* Option 1: Shipping (Visual Only Toggle) */}
				<div className="flex items-center justify-between p-4 rounded-xl border border-stroke/30 bg-surface/20 opacity-75">
					<div className="flex items-center gap-4">
						<div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
							<Truck className="w-5 h-5" />
						</div>
						<div>
							<div className="text-text font-medium">Ship Orders</div>
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
								<div className="text-text font-medium">Local Pickup</div>
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
									className="w-full bg-surface-neutral/30 border border-stroke/30 rounded-xl px-4 py-3 text-text focus:outline-none focus:border-green-500/50 transition-colors placeholder:text-text-muted/30"
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
			<div className="fixed bottom-8 right-8 z-50 flex flex-col items-end gap-3">
				{isDirty && blockingError && (
					<div className="max-w-xs text-xs text-amber-200/90 bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3 shadow-lg">
						{blockingError}
					</div>
				)}
				{isDirty && (
					<button
						onClick={saveSettings}
						disabled={saving || !!blockingError}
						className={`
              flex items-center gap-3 px-6 py-4 rounded-full shadow-2xl transition-all duration-300 transform hover:scale-105
              bg-text text-bg font-bold text-lg
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
