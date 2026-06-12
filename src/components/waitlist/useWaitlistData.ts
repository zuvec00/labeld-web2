"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import {
	watchBrandContext,
	watchWaitlistEntries,
	watchWaitlistMeta,
	type WaitlistBrandContext,
	type WaitlistEntry,
	type WaitlistMeta,
	type WaitlistSource,
	type WaitlistStatus,
} from "@/lib/firebase/queries/waitlist";

export interface WaitlistFilters {
	search: string;
	status: "all" | WaitlistStatus;
	source: "all" | WaitlistSource;
	tag: "all" | string;
}

const defaultFilters: WaitlistFilters = {
	search: "",
	status: "all",
	source: "all",
	tag: "all",
};

function normalizeTag(tag?: string | null): string {
	return tag?.trim() || "general";
}

export function useWaitlistData() {
	const { user, loading: authLoading } = useAuth();
	const [brand, setBrand] = useState<WaitlistBrandContext | null>(null);
	const [entries, setEntries] = useState<WaitlistEntry[]>([]);
	const [meta, setMeta] = useState<WaitlistMeta | null>(null);
	const [filters, setFilters] = useState<WaitlistFilters>(defaultFilters);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (authLoading) return;
		if (!user?.uid) {
			setLoading(false);
			return;
		}

		setLoading(true);
		setError(null);

		const unsubBrand = watchBrandContext(
			user.uid,
			setBrand,
			(err) => setError(err.message || "Failed to load brand details."),
		);
		const unsubEntries = watchWaitlistEntries(
			user.uid,
			setEntries,
			(err) => setError(err.message || "Failed to load waitlist entries."),
		);
		const unsubMeta = watchWaitlistMeta(
			user.uid,
			setMeta,
			(err) => setError(err.message || "Failed to load waitlist metadata."),
		);

		setLoading(false);
		return () => {
			unsubBrand();
			unsubEntries();
			unsubMeta();
		};
	}, [authLoading, user?.uid]);

	const tagOptions = useMemo(() => {
		const tags = new Set<string>(["general"]);
		entries.forEach((entry) => tags.add(normalizeTag(entry.context)));

		const overrides = brand?.storefrontConfig?.contentOverrides;
		if (overrides) {
			Object.values(overrides).forEach((value) => {
				if (value && typeof value === "object" && "tag" in value) {
					const tag = (value as { tag?: unknown }).tag;
					if (typeof tag === "string" && tag.trim()) tags.add(tag.trim());
				}
			});
		}

		return Array.from(tags).sort((a, b) => a.localeCompare(b));
	}, [brand?.storefrontConfig?.contentOverrides, entries]);

	const activeEntries = useMemo(
		() => entries.filter((entry) => entry.status === "active"),
		[entries],
	);

	const filteredEntries = useMemo(() => {
		const search = filters.search.trim().toLowerCase();
		return entries.filter((entry) => {
			const tag = normalizeTag(entry.context);
			const matchesSearch =
				!search ||
				entry.email.toLowerCase().includes(search) ||
				tag.toLowerCase().includes(search);
			const matchesStatus = filters.status === "all" || entry.status === filters.status;
			const matchesSource = filters.source === "all" || entry.source === filters.source;
			const matchesTag = filters.tag === "all" || tag === filters.tag;
			return matchesSearch && matchesStatus && matchesSource && matchesTag;
		});
	}, [entries, filters]);

	const newThisWeek = useMemo(() => {
		const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
		return entries.filter((entry) => (entry.createdAt?.getTime() || 0) >= weekAgo).length;
	}, [entries]);

	const waitlistEnabled = Boolean(
		brand?.storefrontConfig?.enabledSections?.some((sectionId) =>
			sectionId === "waitlist" || sectionId.startsWith("waitlist-"),
		),
	);

	return {
		user,
		brand,
		brandId: user?.uid || "",
		entries,
		activeEntries,
		filteredEntries,
		meta,
		tagOptions,
		filters,
		setFilters,
		newThisWeek,
		waitlistEnabled,
		credits: brand?.credits?.balance || 0,
		loading: loading || authLoading,
		error,
	};
}
