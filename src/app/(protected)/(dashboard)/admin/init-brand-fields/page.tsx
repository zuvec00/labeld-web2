"use client";

import { useState } from "react";
import {
	collection,
	getDocs,
	writeBatch,
	doc,
	serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase/firebaseConfig";
import { BrandModel } from "@/lib/models/brand";
import { Button } from "@/components/ui/button";
import Card from "@/components/ui/Card";
import { Loader2, AlertTriangle } from "lucide-react";

export default function InitBrandFieldsPage() {
	const [loading, setLoading] = useState(false);
	const [status, setStatus] = useState<string>("");
	const [logs, setLogs] = useState<string[]>([]);

	const initializeFields = async () => {
		try {
			setLoading(true);
			setStatus("Fetching brands...");
			setLogs([]);

			const brandsRef = collection(db, "brands");
			const snapshot = await getDocs(brandsRef);

			if (snapshot.empty) {
				setStatus("No brands found.");
				return;
			}

			const totalBrands = snapshot.size;
			setStatus(`Found ${totalBrands} brands. Starting initialization...`);

			let batch = writeBatch(db);
			let operationCount = 0;
			let updatedCount = 0;
			let skippedCount = 0;

			for (const brandDoc of snapshot.docs) {
				const brandData = brandDoc.data() as BrandModel;
				const updates: Partial<BrandModel> = {};

				// 1. Initialize brandSlug
				if (!brandData.brandSlug) {
					updates.brandSlug =
						brandData.username ||
						brandData.brandName.toLowerCase().replace(/\s+/g, "-");
				}

				// 2. Initialize subscriptionTier
				if (!brandData.subscriptionTier) {
					updates.subscriptionTier = "free";
				}

				if (Object.keys(updates).length > 0) {
					const docRef = doc(db, "brands", brandDoc.id);
					// @ts-ignore - updates might have partial fields
					batch.update(docRef, {
						...updates,
						updatedAt: serverTimestamp(),
					});

					updatedCount++;
					operationCount++;
					setLogs((prev) => [
						...prev,
						`[UPDATE] ${brandDoc.id}: ${JSON.stringify(updates)}`,
					]);
				} else {
					skippedCount++;
					setLogs((prev) => [
						...prev,
						`[SKIP] ${brandDoc.id}: Already initialized`,
					]);
				}

				// Commit batch every 500 operations
				if (operationCount >= 450) {
					await batch.commit();
					batch = writeBatch(db);
					operationCount = 0;
					setStatus(
						`Committed batch... Processed so far: ${
							updatedCount + skippedCount
						}/${totalBrands}`
					);
				}
			}

			// Commit remaining
			if (operationCount > 0) {
				await batch.commit();
			}

			setStatus(
				`Complete! Updated: ${updatedCount}, Skipped: ${skippedCount}, Total: ${totalBrands}`
			);
		} catch (error) {
			console.error("Error initializing fields:", error);
			setStatus(
				`Error: ${error instanceof Error ? error.message : "Unknown error"}`
			);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="p-8 max-w-4xl mx-auto space-y-8">
			<div>
				<h1 className="text-3xl font-bold tracking-tight">
					Admin: Initialize Brand Fields
				</h1>
				<p className="text-muted-foreground mt-2">
					Backfills missing `brandSlug` and `subscriptionTier` fields for all
					brands.
				</p>
			</div>

			<Card
				title="Migration Control"
				sub="Check every brand document, set defaults for missing fields."
			>
				<div className="space-y-4">
					<div className="bg-surface/50 p-4 rounded-lg text-sm space-y-2 border border-stroke">
						<p>
							<strong>Logic:</strong>
						</p>
						<ul className="list-disc pl-5 space-y-1">
							<li>
								<code>brandSlug</code> = <code>username</code> (if missing)
							</li>
							<li>
								<code>subscriptionTier</code> = <code>"free"</code> (if missing)
							</li>
						</ul>
					</div>

					<div className="flex items-center gap-4 pt-4">
						<Button
							text={loading ? "Processing..." : "Run Migration"}
							onClick={initializeFields}
							disabled={loading}
							variant="primary"
							isLoading={loading}
						/>
						{status && <span className="text-sm font-medium">{status}</span>}
					</div>

					<div className="mt-6 bg-slate-950 text-slate-50 p-4 rounded-lg h-96 overflow-y-auto font-mono text-xs">
						{logs.length === 0 ? (
							<span className="text-slate-500">
								// Logs will appear here...
							</span>
						) : (
							logs.map((log, i) => (
								<div
									key={i}
									className="border-b border-slate-800/50 py-1 last:border-0"
								>
									{log}
								</div>
							))
						)}
					</div>
				</div>
			</Card>

			<div className="flex items-start gap-3 p-4 bg-yellow-500/10 text-yellow-600 rounded-lg border border-yellow-500/20">
				<AlertTriangle className="h-5 w-5 shrink-0" />
				<p className="text-sm">
					<strong>Warning:</strong> This is a database write operation. Review
					the logic before running on production data.
				</p>
			</div>
		</div>
	);
}
