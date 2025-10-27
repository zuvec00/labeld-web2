"use client";

import { useState } from "react";
import { getAuth } from "firebase/auth";
import {
	getFirestore,
	collection,
	getDocs,
	writeBatch,
	serverTimestamp,
} from "firebase/firestore";
import Button from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

/**
 * ONE-TIME INITIALIZATION PAGE
 *
 * This page initializes store order fields on ALL existing dropProducts
 * across the entire database. After running once, DELETE this file.
 *
 * Fields initialized:
 * - stockRemaining: null (unlimited stock)
 * - isActive: true
 * - isAvailableNow: true (already exists but ensures it's set)
 * - sizeOptions: null (or keeps existing array)
 * - updatedAt: server timestamp
 */

export default function InitializeStorePage() {
	const [status, setStatus] = useState<
		"idle" | "running" | "success" | "error"
	>("idle");
	const [progress, setProgress] = useState("");
	const [results, setResults] = useState<{
		total: number;
		updated: number;
		skipped: number;
		errors: string[];
	}>({ total: 0, updated: 0, skipped: 0, errors: [] });

	async function initializeStoreOrderFields() {
		const auth = getAuth();
		const user = auth.currentUser;

		if (!user) {
			setStatus("error");
			setProgress("❌ Not authenticated");
			return;
		}

		setStatus("running");
		setProgress("🔍 Fetching your dropProducts...");

		try {
			const db = getFirestore();

			// Fetch ALL products across entire database (no brand filter)
			const productsSnapshot = await getDocs(collection(db, "dropProducts"));
			const total = productsSnapshot.size;

			setProgress(
				`📦 Found ${total} products across ALL brands. Initializing...`
			);

			let batch = writeBatch(db);
			let batchCount = 0;
			let updated = 0;
			let skipped = 0;
			const errors: string[] = [];

			for (const docSnap of productsSnapshot.docs) {
				try {
					const data = docSnap.data();
					const updates: Record<string, any> = {};

					// Initialize stockRemaining to null (unlimited) if not set
					if (data.stockRemaining === undefined) {
						updates.stockRemaining = null;
					}

					// Initialize isActive to true if not set
					if (data.isActive === undefined) {
						updates.isActive = true;
					}

					// Initialize isAvailableNow to true if not set
					// (this likely exists already from your Product type)
					if (data.isAvailableNow === undefined) {
						updates.isAvailableNow = true;
					}

					// Keep sizeOptions as-is if it exists (array), otherwise null
					if (data.sizeOptions === undefined) {
						updates.sizeOptions = null;
					}

					// Only update if there are missing fields
					if (Object.keys(updates).length > 0) {
						updates.updatedAt = serverTimestamp();
						batch.update(docSnap.ref, updates);
						batchCount++;
						updated++;

						// Firestore batch limit is 500
						if (batchCount >= 500) {
							await batch.commit();
							setProgress(`✅ Committed batch (${updated}/${total})...`);
							batch = writeBatch(db);
							batchCount = 0;
						}
					} else {
						skipped++;
					}
				} catch (err) {
					const msg = `Error on product ${docSnap.id}: ${err}`;
					console.error(msg);
					errors.push(msg);
				}
			}

			// Commit remaining batch
			if (batchCount > 0) {
				await batch.commit();
			}

			setResults({ total, updated, skipped, errors });
			setStatus("success");
			setProgress(`✅ Initialization complete!`);

			console.log(`
╔════════════════════════════════════════╗
║   Store Initialization Complete ✅    ║
╠════════════════════════════════════════╣
║  Total Products:    ${total.toString().padStart(6)}          ║
║  Updated:           ${updated.toString().padStart(6)}          ║
║  Skipped:           ${skipped.toString().padStart(6)}          ║
║  Errors:            ${errors.length.toString().padStart(6)}          ║
╚════════════════════════════════════════╝
      `);
		} catch (error) {
			console.error("Initialization failed:", error);
			setStatus("error");
			setProgress(`❌ Error: ${error}`);
		}
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-8">
			<div className="max-w-3xl mx-auto">
				{/* Header */}
				<div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-6">
					<div className="flex items-center gap-4 mb-4">
						<div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
							<span className="text-2xl">🔧</span>
						</div>
						<div>
							<h1 className="text-3xl font-bold text-gray-900 dark:text-white">
								Store Initialization
							</h1>
							<p className="text-gray-500 dark:text-gray-400 mt-1">
								One-time setup for ALL dropProducts (database-wide)
							</p>
						</div>
					</div>

					<div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mt-6">
						<p className="text-sm text-yellow-800 dark:text-yellow-200 font-medium">
							⚠️ <strong>ONE-TIME USE ONLY</strong>
						</p>
						<p className="text-sm text-yellow-700 dark:text-yellow-300 mt-2">
							This will initialize the following fields on ALL existing
							dropProducts across the entire database:
						</p>
						<ul className="text-sm text-yellow-700 dark:text-yellow-300 mt-2 ml-4 space-y-1">
							<li>
								•{" "}
								<code className="bg-yellow-100 dark:bg-yellow-900/40 px-1 rounded">
									stockRemaining
								</code>
								: null (unlimited)
							</li>
							<li>
								•{" "}
								<code className="bg-yellow-100 dark:bg-yellow-900/40 px-1 rounded">
									isActive
								</code>
								: true
							</li>
							<li>
								•{" "}
								<code className="bg-yellow-100 dark:bg-yellow-900/40 px-1 rounded">
									isAvailableNow
								</code>
								: true
							</li>
							<li>
								•{" "}
								<code className="bg-yellow-100 dark:bg-yellow-900/40 px-1 rounded">
									sizeOptions
								</code>
								: null (if not set)
							</li>
							<li>
								•{" "}
								<code className="bg-yellow-100 dark:bg-yellow-900/40 px-1 rounded">
									updatedAt
								</code>
								: current timestamp
							</li>
						</ul>
						<p className="text-sm text-yellow-700 dark:text-yellow-300 mt-3">
							After running, <strong>delete this page</strong> or comment out
							the route.
						</p>
					</div>
				</div>

				{/* Action Area */}
				<div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
					{status === "idle" && (
						<div className="text-center py-8">
							<p className="text-gray-600 dark:text-gray-300 mb-6">
								Ready to initialize your store fields?
							</p>
							<Button
								text="🚀 Initialize Store Fields"
								variant="primary"
								onClick={initializeStoreOrderFields}
								className="px-8 py-3 text-lg"
							/>
						</div>
					)}

					{status === "running" && (
						<div className="text-center py-12">
							<Spinner size="lg" className="mx-auto mb-4" />
							<p className="text-lg font-medium text-gray-900 dark:text-white">
								{progress}
							</p>
							<p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
								Please wait, this may take a moment...
							</p>
						</div>
					)}

					{status === "success" && (
						<div className="py-8">
							<div className="text-center mb-8">
								<div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
									<span className="text-4xl">✅</span>
								</div>
								<h2 className="text-2xl font-bold text-green-600 dark:text-green-400 mb-2">
									Initialization Complete!
								</h2>
								<p className="text-gray-600 dark:text-gray-300">{progress}</p>
							</div>

							<div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-6 mb-6">
								<h3 className="font-semibold text-lg mb-4 text-gray-900 dark:text-white">
									📊 Summary
								</h3>
								<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
									<div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
										<p className="text-sm text-gray-500 dark:text-gray-400">
											Total
										</p>
										<p className="text-2xl font-bold text-gray-900 dark:text-white">
											{results.total}
										</p>
									</div>
									<div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-green-200 dark:border-green-700">
										<p className="text-sm text-green-600 dark:text-green-400">
											Updated
										</p>
										<p className="text-2xl font-bold text-green-600 dark:text-green-400">
											{results.updated}
										</p>
									</div>
									<div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
										<p className="text-sm text-blue-600 dark:text-blue-400">
											Skipped
										</p>
										<p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
											{results.skipped}
										</p>
									</div>
									<div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-red-200 dark:border-red-700">
										<p className="text-sm text-red-600 dark:text-red-400">
											Errors
										</p>
										<p className="text-2xl font-bold text-red-600 dark:text-red-400">
											{results.errors.length}
										</p>
									</div>
								</div>
							</div>

							{results.errors.length > 0 && (
								<div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
									<p className="text-sm font-semibold text-red-800 dark:text-red-200 mb-2">
										⚠️ Errors encountered:
									</p>
									<div className="text-xs text-red-700 dark:text-red-300 space-y-1 max-h-40 overflow-y-auto">
										{results.errors.map((err, idx) => (
											<div
												key={idx}
												className="font-mono bg-red-100 dark:bg-red-900/40 p-2 rounded"
											>
												{err}
											</div>
										))}
									</div>
								</div>
							)}

							<div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
								<p className="text-sm font-semibold text-purple-800 dark:text-purple-200 mb-2">
									✨ Next Steps
								</p>
								<ol className="text-sm text-purple-700 dark:text-purple-300 space-y-2 ml-4">
									<li>
										1. Verify your products have the new fields in Firestore
									</li>
									<li>2. Delete this initialization page:</li>
									<li className="font-mono text-xs bg-purple-100 dark:bg-purple-900/40 p-2 rounded mt-1">
										rm src/app/(protected)/(dashboard)/init-store/page.tsx
									</li>
									<li>3. Continue building your store/payment features! 🎉</li>
								</ol>
							</div>
						</div>
					)}

					{status === "error" && (
						<div className="text-center py-12">
							<div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
								<span className="text-4xl">❌</span>
							</div>
							<h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-2">
								Initialization Failed
							</h2>
							<p className="text-gray-600 dark:text-gray-300 mb-6">
								{progress}
							</p>
							<Button
								text="Try Again"
								variant="primary"
								onClick={() => {
									setStatus("idle");
									setProgress("");
									setResults({ total: 0, updated: 0, skipped: 0, errors: [] });
								}}
							/>
						</div>
					)}
				</div>

				{/* Instructions */}
				<div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
					<h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">
						📝 What this does:
					</h3>
					<ul className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
						<li>• Fetches ALL dropProducts from the entire database</li>
						<li>
							• Only updates products that are missing the required fields
						</li>
						<li>
							• Uses batched writes (500 operations per batch) for efficiency
						</li>
						<li>• Preserves existing data - only adds missing fields</li>
						<li>
							• Sets{" "}
							<code className="bg-blue-100 dark:bg-blue-900/40 px-1 rounded">
								updatedAt
							</code>{" "}
							timestamp on modified products
						</li>
					</ul>
				</div>
			</div>
		</div>
	);
}
