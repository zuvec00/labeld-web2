"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase/firebaseConfig";

const EXCLUDED_BRAND_IDS = new Set([
	"gYU1Zmtg6AWVlql8E1XA3CYTjJF2",
	"7BcG10FFQsXkxHcsYOrH3cpPsGn2",
	"zIGBDAlOw8Um9jD9gl6p5wdmPQS2",
	"4KuHZL5vc7hNCY5pmHFBgCTNCBq2",
	"t8iccKPppLTAT0aecb9kz7G3Zdo1",
	// "d7F7FYe72ESVIKju3M608dm6OeG2"
]);

interface StudioBrand {
	id: string;
	name: string;
	logoUrl?: string | null;
	category?: string | null;
	username?: string | null;
	storefrontUrl: string;
}

function initials(name: string): string {
	return name
		.split(" ")
		.map((part) => part[0])
		.join("")
		.slice(0, 2)
		.toUpperCase();
}

function normalizeDomainUrl(domain: string): string {
	const cleanDomain = domain.trim().replace(/^https?:\/\//, "").replace(/\/$/, "");
	return `https://${cleanDomain}`;
}

function getStorefrontUrl(data: Record<string, any>): string {
	const customDomain = typeof data.customDomain === "string" ? data.customDomain : "";
	const shouldUseCustomDomain =
		Boolean(data.useCustomDomain) &&
		customDomain.trim().length > 0 &&
		(!data.customDomainStatus ||
			data.customDomainStatus === "active" ||
			data.customDomainStatus === "verified");

	if (shouldUseCustomDomain) {
		return normalizeDomainUrl(customDomain);
	}

	const slug = data.brandSlug || data.username || "";
	return `https://${slug}.labeld.app`;
}

export default function StudioBrands() {
	const [brands, setBrands] = useState<StudioBrand[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		let mounted = true;

		async function loadBrands() {
			try {
				const brandsQuery = query(
					collection(db, "brands"),
					where("subscriptionTier", "==", "pro"),
				);
				const snapshot = await getDocs(brandsQuery);
				const rows = snapshot.docs
					.filter((doc) => !EXCLUDED_BRAND_IDS.has(doc.id))
					.map((doc) => {
						const data = doc.data();
						return {
							id: doc.id,
							name: data.brandName || data.username || "Studio Brand",
							logoUrl: data.logoUrl || null,
							category: data.category || null,
							username: data.brandSlug || data.username || null,
							storefrontUrl: getStorefrontUrl(data),
						};
					})
					.sort((a, b) => a.name.localeCompare(b.name));

				if (mounted) setBrands(rows);
			} catch (error) {
				console.error("Failed to load Studio brands", error);
				if (mounted) setBrands([]);
			} finally {
				if (mounted) setLoading(false);
			}
		}

		loadBrands();
		return () => {
			mounted = false;
		};
	}, []);

	const visibleBrands = useMemo(() => brands.slice(0, 12), [brands]);

	if (!loading && visibleBrands.length === 0) return null;

	return (
		<section className="border-b border-border bg-bg px-5 py-16 sm:px-6 md:py-20">
			<div className="mx-auto max-w-7xl">
				<div className="grid gap-6 md:grid-cols-[0.85fr_1.15fr] md:items-end">
					<div>
						<p className="mb-4 font-body text-[11px] font-bold uppercase tracking-[0.28em] text-cta">
							Brands on Studio
						</p>
						<h2 className="font-heading text-2xl font-semibold uppercase leading-[1.08] text-foreground sm:text-4xl">
							Independent brands already running with Labeld.
						</h2>
					</div>
					<p className="max-w-xl font-body text-sm leading-7 text-muted-foreground md:justify-self-end md:text-base">
						Studio is already powering real storefronts,
						drops, and operations for culture-driven brands.
					</p>
				</div>

				<div className="mt-10 grid gap-px overflow-hidden border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
					{loading
						? Array.from({ length: 8 }).map((_, index) => (
								<div key={index} className="h-28 animate-pulse bg-surface" />
							))
						: visibleBrands.map((brand) => (
								<a
									key={brand.id}
									href={brand.storefrontUrl}
									target="_blank"
									rel="noreferrer"
									className="group flex items-center gap-4 bg-surface p-5 transition-colors hover:bg-bg"
								>
									<div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden border border-border bg-bg">
										{brand.logoUrl ? (
											<Image
												src={brand.logoUrl}
												alt={`${brand.name} logo`}
												fill
												className="object-cover"
												sizes="56px"
											/>
										) : (
											<span className="font-heading text-sm font-semibold text-foreground">
												{initials(brand.name)}
											</span>
										)}
									</div>
									<div className="min-w-0">
										<h3 className="truncate font-heading text-sm font-semibold uppercase text-foreground transition-colors group-hover:text-cta">
											{brand.name}
										</h3>
										<p className="mt-1 truncate text-xs text-muted-foreground">
											{brand.username
												? `${brand.username}.labeld.app`
												: brand.category || "Open storefront"}
										</p>
									</div>
								</a>
							))}
				</div>
			</div>
		</section>
	);
}
