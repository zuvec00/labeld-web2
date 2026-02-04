"use client";

import { useState } from "react";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { reserveSlug, isPublicSlugTaken } from "@/lib/firebase/slugs";
import Button from "@/components/ui/button";
import { slugify } from "@/lib/utils";

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
		log("Starting BRAND backfill & repair...");

		try {
			const db = getFirestore();
			const brandsRef = collection(db, "brands");
			const snapshot = await getDocs(brandsRef);
			const { doc, updateDoc } = await import("firebase/firestore");

			const total = snapshot.size;
			log(`Found ${total} brands.`);

			let processed = 0;
			let success = 0;
			let skipped = 0;
			let failed = 0;
			let repaired = 0;

			for (const brandDoc of snapshot.docs) {
				const data = brandDoc.data();
				const brandId = brandDoc.id;
				const rawSlug = data.brandSlug || data.username;

				processed++;
				setProgress(Math.round((processed / total) * 100));

				if (!rawSlug) {
					log(`[${brandId}] No slug found. Skipped.`);
					skipped++;
					continue;
				}

				// Sanitize
				const sanitizedSlug = slugify(rawSlug);

				// 1. Repair Document if needed
				if (sanitizedSlug !== rawSlug) {
					try {
						await updateDoc(brandDoc.ref, {
							brandSlug: sanitizedSlug,
						});
						log(`[${brandId}] Repaired slug: ${rawSlug} -> ${sanitizedSlug}`);
						repaired++;
					} catch (e: any) {
						log(`[${brandId}] Failed repair: ${e.message}`);
					}
				}

				// 2. Reserve in public registry
				try {
					const taken = await isPublicSlugTaken(sanitizedSlug);
					// If taken, checks if it belongs to this brand (idempotent reserve?)
					// reserveSlug usually throws if taken by someone else.
					// Implementation detail: reserveSlug might not handle re-reservation gracefully without check.
					// But for backfill, if taken, we skip? Or we enforce?
					// Let's try reserve. If it fails, we log.
					// Note: validation says "if taken -> skipped".
					if (taken) {
						// verify ownership if possible?
						skipped++;
					} else {
						await reserveSlug(
							sanitizedSlug,
							"brand",
							brandId,
							"BACKFILL_ADMIN",
						);
						success++;
					}
				} catch (e: any) {
					log(`[${sanitizedSlug}] Reserve Error: ${e.message}`);
					failed++;
				}

				if (processed % 10 === 0) await new Promise((r) => setTimeout(r, 20));
			}

			log(
				`Brand Backfill Done. Reserved: ${success}, Repaired Docs: ${repaired}, Skipped: ${skipped}, Failed: ${failed}.`,
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
		log("Starting EVENT ORGANIZER backfill & repair...");

		try {
			const db = getFirestore();
			const eventsRef = collection(db, "eventOrganizers");
			const snapshot = await getDocs(eventsRef);
			const { doc, getDoc, updateDoc, deleteDoc } =
				await import("firebase/firestore");

			const total = snapshot.size;
			log(`Found ${total} organizers.`);

			let processed = 0;
			let success = 0;
			let skipped = 0;
			let failed = 0;
			let repaired = 0;
			let fixedType = 0;

			for (const orgDoc of snapshot.docs) {
				const data = orgDoc.data();
				const orgId = orgDoc.id;
				// Organizer slug source: 'slug' > 'username'
				const rawSlug = data.slug || data.username;

				processed++;
				setProgress(Math.round((processed / total) * 100));

				if (!rawSlug) {
					log(`[${orgId}] No slug/username. Skipped.`);
					skipped++;
					continue;
				}

				const sanitizedSlug = slugify(rawSlug);

				// 1. Repair Document if needed (e.g. contains dots or spaces)
				// Also explicit check: ensure 'slug' field IS set to the sanitized version
				if (data.slug !== sanitizedSlug) {
					try {
						await updateDoc(orgDoc.ref, {
							slug: sanitizedSlug,
						});
						log(`[${orgId}] Repaired doc slug: ${rawSlug} -> ${sanitizedSlug}`);
						repaired++;
					} catch (e: any) {
						log(`[${orgId}] Failed repair: ${e.message}`);
					}
				}

				// 2. Fix Legacy "event" type in publicSlugs (migrating to "experience")
				try {
					const slugRef = doc(db, "publicSlugs", sanitizedSlug);
					const slugSnap = await getDoc(slugRef);

					if (slugSnap.exists()) {
						const slugData = slugSnap.data();
						if (slugData.type === "event") {
							await deleteDoc(slugRef);
							log(
								`[${sanitizedSlug}] Found legacy 'event' type. Deleting to upgrade.`,
							);
							fixedType++;
						} else if (
							slugData.ownerId === orgId &&
							slugData.type === "experience"
						) {
							// Already good
							skipped++;
							continue;
						}
					}

					// Reserve as "experience"
					// We use a try/catch block for strict reservation
					try {
						await reserveSlug(
							sanitizedSlug,
							"experience",
							orgId,
							"BACKFILL_ADMIN",
						);
						success++;
					} catch (e: any) {
						// Usually means taken properly
						skipped++;
					}
				} catch (e: any) {
					log(`[${sanitizedSlug}] Registry Error: ${e.message}`);
					failed++;
				}

				if (processed % 10 === 0) await new Promise((r) => setTimeout(r, 20));
			}

			log(
				`Event Backfill Done. Reserved: ${success}, Repaired Docs: ${repaired}, Legacy Fixed: ${fixedType}, Failed: ${failed}.`,
			);
		} catch (e: any) {
			log(`Fatal error: ${e.message}`);
		} finally {
			setIsRunning(false);
		}
	}

	async function runEventSubscriptionBackfill() {
		// Deprecated/Merged into runEventBackfill above effectively, but keeping for standalone subscription fixes
		// Simplified to just ensure fields exist
		setIsRunning(true);
		setLogs([]);
		setProgress(0);
		log("Starting SUBSCRIPTION defaults check...");

		try {
			const db = getFirestore();
			const eventsRef = collection(db, "eventOrganizers");
			const snapshot = await getDocs(eventsRef);
			const { updateDoc } = await import("firebase/firestore");

			let processed = 0;
			let fixed = 0;

			for (const d of snapshot.docs) {
				const data = d.data();
				processed++;
				setProgress(Math.round((processed / snapshot.size) * 100));

				if (!data.subscriptionTier) {
					await updateDoc(d.ref, { subscriptionTier: "free" });
					fixed++;
				}
			}
			log(`Done. Fixed default subscription for ${fixed} docs.`);
		} catch (e: any) {
			log(`Error: ${e.message}`);
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
