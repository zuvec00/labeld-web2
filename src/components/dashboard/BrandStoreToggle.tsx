"use client";

import { useState, useEffect } from "react";
import { getAuth } from "firebase/auth";
import {
	getFirestore,
	doc,
	getDoc,
	updateDoc,
	serverTimestamp,
	collection,
	query,
	where,
	getDocs,
} from "firebase/firestore";
import { Spinner } from "@/components/ui/spinner";

interface BrandStoreToggleProps {
	className?: string;
}

export default function BrandStoreToggle({
	className = "",
}: BrandStoreToggleProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [loading, setLoading] = useState(true);
	const [updating, setUpdating] = useState(false);
	const [showPrompt, setShowPrompt] = useState(false);
	const [productStats, setProductStats] = useState<{
		total: number;
		withoutStock: number;
		withoutSizes: number;
		withoutImages: number;
	} | null>(null);
	const [shippingRules, setShippingRules] = useState<{
		hasRules: boolean;
		hasPickup: boolean;
	} | null>(null);

	useEffect(() => {
		loadBrandStatus();
	}, []);

	async function loadBrandStatus() {
		try {
			const auth = getAuth();
			const uid = auth.currentUser?.uid;
			if (!uid) return;

			const db = getFirestore();
			const brandDoc = await getDoc(doc(db, "brands", uid));

			if (brandDoc.exists()) {
				const data = brandDoc.data();
				setIsOpen(data.isOpen ?? false);
			}
		} catch (error) {
			console.error("Failed to load brand status:", error);
		} finally {
			setLoading(false);
		}
	}

	async function checkProductReadiness(uid: string) {
		const db = getFirestore();
		const productsQuery = query(
			collection(db, "dropProducts"),
			where("brandId", "==", uid)
		);
		const snapshot = await getDocs(productsQuery);

		let withoutStock = 0;
		let withoutSizes = 0;
		let withoutImages = 0;

		snapshot.docs.forEach((doc) => {
			const data = doc.data();

			// Check if stock is not set (null means unlimited, undefined means not set)
			if (data.stockRemaining === undefined) {
				withoutStock++;
			}

			// Check if sizes are missing or empty
			if (
				!data.sizeOptions ||
				(Array.isArray(data.sizeOptions) && data.sizeOptions.length === 0)
			) {
				withoutSizes++;
			}

			// Check if main image is missing
			if (!data.mainVisualUrl) {
				withoutImages++;
			}
		});

		return {
			total: snapshot.size,
			withoutStock,
			withoutSizes,
			withoutImages,
		};
	}

	async function checkShippingRules(uid: string) {
		const db = getFirestore();
		try {
			// Check if shipping rules exist
			const shippingDoc = await getDoc(
				doc(db, "users", uid, "shippingRules", "settings")
			);

			if (!shippingDoc.exists()) {
				return {
					hasRules: false,
					hasPickup: false,
				};
			}

			const data = shippingDoc.data();
			const hasPickup = data?.pickupEnabled === true;

			return {
				hasRules: true,
				hasPickup,
			};
		} catch (error) {
			console.error("Failed to check shipping rules:", error);
			return {
				hasRules: false,
				hasPickup: false,
			};
		}
	}

	async function handleToggle() {
		const auth = getAuth();
		const uid = auth.currentUser?.uid;
		if (!uid) return;

		// If trying to open, show the prompt first
		if (!isOpen) {
			setUpdating(true);
			try {
				const [stats, shipping] = await Promise.all([
					checkProductReadiness(uid),
					checkShippingRules(uid),
				]);
				setProductStats(stats);
				setShippingRules(shipping);
				setShowPrompt(true);
			} catch (error) {
				console.error("Failed to check readiness:", error);
			} finally {
				setUpdating(false);
			}
		} else {
			// Closing the store - no prompt needed
			await updateStoreStatus(false);
		}
	}

	async function updateStoreStatus(newStatus: boolean) {
		const auth = getAuth();
		const uid = auth.currentUser?.uid;
		if (!uid) return;

		setUpdating(true);
		try {
			const db = getFirestore();
			await updateDoc(doc(db, "brands", uid), {
				isOpen: newStatus,
				updatedAt: serverTimestamp(),
			});
			setIsOpen(newStatus);
			setShowPrompt(false);
		} catch (error) {
			console.error("Failed to update store status:", error);
			alert("Failed to update store status. Please try again.");
		} finally {
			setUpdating(false);
		}
	}

	if (loading) {
		return (
			<div className={`flex items-center gap-2 ${className}`}>
				<Spinner size="sm" />
				<span className="text-sm text-text-muted">Loading...</span>
			</div>
		);
	}

	return (
		<>
			<div className={`flex items-center gap-3 ${className}`}>
				<div className="flex items-center gap-2">
					<span className="text-sm font-medium text-text">Store Status:</span>
					<div
						className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
							isOpen
								? "bg-green-200/70 text-green-700 dark:bg-green-700/20 dark:text-green-300"
								: "bg-[#23242C] text-gray-400 border border-stroke"
						}`}
					>
						<div
							className={`w-1.5 h-1.5 rounded-full ${
								isOpen ? "bg-green-500" : "bg-gray-500"
							}`}
						/>
						{isOpen ? "Open" : "Closed"}
					</div>
				</div>

				<button
					onClick={handleToggle}
					disabled={updating}
					className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ring-1 ring-stroke focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 ${
						isOpen
							? "bg-green-600/80"
							: "bg-[#23242C] dark:bg-[#23242C] border border-stroke"
					} ${updating ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
					aria-label="Toggle store open/closed"
				>
					<span
						className={`inline-block h-4 w-4 transform rounded-full ${
							isOpen
								? "bg-white dark:bg-bg translate-x-6"
								: "bg-gray-200 dark:bg-[#2D2E36] translate-x-1"
						} transition-transform`}
					/>
				</button>
			</div>

			{/* Prompt Modal */}
			{showPrompt && productStats && shippingRules && (
				<div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
					<div className="bg-bg dark:bg-surface border border-stroke rounded-2xl shadow-2xl max-w-lg w-full p-6">
						<div className="flex items-start gap-4 mb-4">
							<div className="w-12 h-12 rounded-full bg-yellow-300/30 dark:bg-yellow-900/30 flex items-center justify-center flex-shrink-0">
								<span className="text-2xl">⚠️</span>
							</div>
							<div className="flex-1">
								<h3 className="text-lg font-bold text-text mb-2">
									Opening Your Store
								</h3>
								<p className="text-sm text-text-muted mb-4">
									Before opening your store, please ensure your products are
									ready for customers.
								</p>

								{/* Shipping Rules Check */}
								{!shippingRules.hasRules && (
									<div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 mb-4">
										<div className="flex items-start gap-3">
											<span className="text-red-400 text-lg">🚫</span>
											<div>
												<p className="text-sm font-semibold text-red-300 mb-1">
													Shipping Rules Required
												</p>
												<p className="text-sm text-red-200">
													You must configure shipping rules before opening your
													store. Go to Settings → Shipping to set up your
													shipping fees and options.
												</p>
											</div>
										</div>
									</div>
								)}

								{/* Products Check */}
								{productStats.total > 0 ? (
									<div className="space-y-3 mb-4">
										<div className="bg-[#22304D]/60 dark:bg-[#23243A]/80 border border-blue-800/20 rounded-lg p-3">
											<p className="text-sm font-semibold text-blue-200 mb-2">
												📦 Product Summary
											</p>
											<ul className="text-sm text-blue-200 space-y-1">
												<li>• Total Products: {productStats.total}</li>
												{productStats.withoutStock > 0 && (
													<li className="text-yellow-300">
														⚠️ {productStats.withoutStock} product
														{productStats.withoutStock > 1 ? "s" : ""} without
														stock set
													</li>
												)}
												{productStats.withoutSizes > 0 && (
													<li className="text-yellow-300">
														⚠️ {productStats.withoutSizes} product
														{productStats.withoutSizes > 1 ? "s" : ""} without
														sizes
													</li>
												)}
												{productStats.withoutImages > 0 && (
													<li className="text-red-300">
														❌ {productStats.withoutImages} product
														{productStats.withoutImages > 1 ? "s" : ""} without
														images
													</li>
												)}
											</ul>
										</div>

										<div className="bg-[#2A213F]/50 border border-purple-800/20 rounded-lg p-3">
											<p className="text-xs text-purple-200">
												💡 <strong>Tip:</strong> Products without stock will
												show as unlimited. Products without sizes or images may
												impact customer experience.
											</p>
										</div>
									</div>
								) : (
									<div className="bg-[#23243A]/80 border border-stroke rounded-lg p-4 mb-4">
										<p className="text-sm text-text-muted">
											You don&apos;t have any products yet. You can still open
											your store and add products later.
										</p>
									</div>
								)}

								<p className="text-xs text-text-soft">
									Opening your store will make it visible to customers who can
									browse and purchase your products.
								</p>
							</div>
						</div>

						<div className="flex gap-3 justify-end">
							<button
								onClick={() => setShowPrompt(false)}
								className="px-4 py-2 text-sm font-medium text-text-soft bg-[#262633] hover:bg-[#31313f] rounded-lg transition-colors border border-stroke"
							>
								Cancel
							</button>
							<button
								onClick={() => updateStoreStatus(true)}
								disabled={updating || !shippingRules.hasRules}
								className="px-4 py-2 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 rounded-lg shadow"
							>
								{updating && <Spinner size="sm" />}
								{updating ? "Opening..." : "Open Store"}
							</button>
						</div>
					</div>
				</div>
			)}
		</>
	);
}
