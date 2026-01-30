"use client";

import { useState } from "react";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { reserveSlug, isPublicSlugTaken } from "@/lib/firebase/slugs";
import Button from "@/components/ui/button";

export default function SlugBackfillPage() {
	const [isRunning, setIsRunning] = useState(false);
	const [logs, setLogs] = useState<string[]>([]);
	const [progress, setProgress] = useState(0);

	function log(msg: string) {
		setLogs((prev) => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`]);
	}

	async function runBrandBackfill() {
		setIsRunning(true);
		setLogs([]);
		setProgress(0);
		log("Starting BRAND backfill...");

		try {
			const db = getFirestore();
			const brandsRef = collection(db, "brands");
			const snapshot = await getDocs(brandsRef);

			const total = snapshot.size;
			log(`Found ${total} brands.`);

			let processed = 0;
			let success = 0;
			let skipped = 0;
			let failed = 0;

			for (const doc of snapshot.docs) {
				const data = doc.data();
				const brandId = doc.id;
				// Prefer brandSlug, fallback to username
				const rawSlug = data.brandSlug || data.username;

				processed++;
				setProgress(Math.round((processed / total) * 100));

				if (!rawSlug) {
					log(`[${brandId}] No slug or username found. Skipped.`);
					skipped++;
					continue;
				}

				const slug = rawSlug.trim().toLowerCase();

				try {
					const taken = await isPublicSlugTaken(slug);
					if (taken) {
						skipped++;
					} else {
						await reserveSlug(slug, "brand", brandId, "BACKFILL_ADMIN");
						success++;
					}
				} catch (e: any) {
					log(`[${slug}] Error: ${e.message}`);
					failed++;
				}

				if (processed % 10 === 0) {
					await new Promise((r) => setTimeout(r, 50));
				}
			}

			log(
				`Brand Backfill complete. Success: ${success}, Skipped: ${skipped}, Failed: ${failed}.`,
			);
		} catch (e: any) {
			log(`Fatal error: ${e.message}`);
		} finally {
			setIsRunning(false);
		}
	}

	async function runEventBackfill() {
		setIsRunning(true);
		setLogs([]);
		setProgress(0);
		log("Starting EVENT ORGANIZER backfill (fixing to 'experience')...");

		try {
			const db = getFirestore();
			const eventsRef = collection(db, "eventOrganizers");
			const snapshot = await getDocs(eventsRef);
			const { doc, getDoc, deleteDoc } = await import("firebase/firestore");

			const total = snapshot.size;
			log(`Found ${total} event organizers.`);

			let processed = 0;
			let success = 0;
			let skipped = 0;
			let failed = 0;
			let fixed = 0;

			for (const d of snapshot.docs) {
				const data = d.data();
				const orgId = d.id;
				// Event organizers use 'username' as slug source
				//TODO CHANGE TO data.slug when you make it
				const rawSlug = data.username;

				processed++;
				setProgress(Math.round((processed / total) * 100));

				if (!rawSlug) {
					log(`[${orgId}] No username found. Skipped.`);
					skipped++;
					continue;
				}

				const slug = rawSlug.trim().toLowerCase();

				try {
					// Check existing
					// We need to check if we need to delete the old "event" type
					const slugRef = doc(db, "publicSlugs", slug);
					const slugSnap = await getDoc(slugRef);

					if (slugSnap.exists()) {
						const slugData = slugSnap.data();
						if (slugData.type === "event") {
							// Found the old wrong type! Delete it.
							await deleteDoc(slugRef);
							log(`[${slug}] Found legacy 'event' type. Deleting to fix.`);
							fixed++;
							// Now fall through to reserve it with "experience"
						} else {
							// It exists and is NOT "event" (maybe "brand" or already "experience")
							// log(`[${slug}] Already exists as ${slugData.type}. Skipped.`);
							skipped++;
							continue;
						}
					}

					// Create as "experience"
					await reserveSlug(slug, "experience", orgId, "BACKFILL_ADMIN");
					success++;
				} catch (e: any) {
					log(`[${slug}] Error: ${e.message}`);
					failed++;
				}

				if (processed % 10 === 0) {
					await new Promise((r) => setTimeout(r, 50));
				}
			}

			log(
				`Event Backfill complete. Success(new/fixed): ${success}, Fixed old: ${fixed}, Skipped: ${skipped}, Failed: ${failed}.`,
			);
		} catch (e: any) {
			log(`Fatal error: ${e.message}`);
		} finally {
			setIsRunning(false);
		}
	}

	async function runEventSubscriptionBackfill() {
		setIsRunning(true);
		setLogs([]);
		setProgress(0);
		log("Starting EVENT ORGANIZER SUBSCRIPTION/SLUG backfill...");

		try {
			const db = getFirestore();
			const eventsRef = collection(db, "eventOrganizers");
			const snapshot = await getDocs(eventsRef);
			const { doc, getDoc, updateDoc } = await import("firebase/firestore");

			const total = snapshot.size;
			log(`Found ${total} event organizers.`);

			let processed = 0;
			let success = 0;
			let skipped = 0;
			let failed = 0;

			for (const d of snapshot.docs) {
				const data = d.data();
				const orgId = d.id;
				processed++;
				setProgress(Math.round((processed / total) * 100));

				let updates: any = {};
				let needsUpdate = false;

				// 1. Check Subscription Tier
				if (!data.subscriptionTier) {
					updates.subscriptionTier = "free";
					needsUpdate = true;
				}

				// 2. Check Slug
				// We want to ensure 'slug' field exists on the organizer doc.
				// We assume it corresponds to their username or what's in publicSlugs.
				if (!data.slug) {
					// Fallback to username as the default slug if not set
					const candidateSlug = (data.username || "").toLowerCase();
					if (candidateSlug) {
						updates.slug = candidateSlug;
						needsUpdate = true;
					}
				}

				if (needsUpdate) {
					try {
						await updateDoc(d.ref, updates);
						// log(`[${orgId}] Updated: ${JSON.stringify(updates)}`);
						success++;
					} catch (e: any) {
						log(`[${orgId}] Update failed: ${e.message}`);
						failed++;
					}
				} else {
					skipped++;
				}

				if (processed % 10 === 0) {
					await new Promise((r) => setTimeout(r, 50));
				}
			}

			log(
				`Subscription Backfill complete. Updated: ${success}, Skipped: ${skipped}, Failed: ${failed}.`,
			);
		} catch (e: any) {
			log(`Fatal error: ${e.message}`);
		} finally {
			setIsRunning(false);
		}
	}

	return (
		<div className="p-8 max-w-4xl mx-auto">
			<h1 className="text-2xl font-bold mb-4">Public Slugs Backfill</h1>
			<p className="mb-6 text-text-muted">
				This tool will iterate through existing records and create entries in
				the `publicSlugs` collection if they do not exist.
				<br />
				<strong>Note:</strong> This runs on the client-side. Keep this tab open.
			</p>

			<div className="flex flex-wrap items-center gap-4 mb-6">
				<Button
					text={isRunning ? "Running..." : "Backfill BRANDS"}
					onClick={runBrandBackfill}
					disabled={isRunning}
					variant="primary"
				/>
				<Button
					text={isRunning ? "Running..." : "Backfill EVENTS"}
					onClick={runEventBackfill}
					disabled={isRunning}
					variant="secondary"
				/>
				<Button
					text={isRunning ? "Running..." : "Backfill EVENT SUBSCRIPTIONS"}
					onClick={runEventSubscriptionBackfill}
					disabled={isRunning}
					variant="outline"
				/>
				{isRunning && <span className="font-mono">{progress}%</span>}
			</div>

			<div className="bg-surface border border-stroke rounded-xl p-4 h-96 overflow-y-auto font-mono text-xs">
				{logs.length === 0 ? (
					<span className="text-text-muted">Logs will appear here...</span>
				) : (
					logs.map((L, i) => (
						<div key={i} className="mb-1">
							{L}
						</div>
					))
				)}
			</div>
		</div>
	);
}
