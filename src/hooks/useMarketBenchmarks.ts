"use client";

import { useState, useEffect } from "react";
import { doc, onSnapshot, getFirestore, Timestamp } from "firebase/firestore";
import { getApp } from "firebase/app";

export interface BenchmarkMetrics {
	avg: number;
	p50: number;
	p90: number;
	sampleSize?: number;
}

export interface MarketBenchmarkDoc {
	period: "30d";
	category: string;
	updatedAt: Date;
	conversion: BenchmarkMetrics;
	engagement: BenchmarkMetrics;
}

export function useMarketBenchmarks(category: string = "global") {
	const [data, setData] = useState<MarketBenchmarkDoc | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const db = getFirestore(getApp());
		// Normalize category to lowercase for document ID consistency
		// Backend usually writes "global", "streetwear" (lowercase keys)
		const docId = category.toLowerCase();
		
		const unsub = onSnapshot(
			doc(db, "market_benchmarks", docId),
			(docSnap) => {
				setLoading(false);
				if (docSnap.exists()) {
					const rawData = docSnap.data();
					setData({
						period: rawData.period,
						category: rawData.category,
						updatedAt: rawData.updatedAt?.toDate() || new Date(),
						conversion: rawData.conversion,
						engagement: rawData.engagement,
					});
				} else {
					// Fallback: If specific category missing, try global if we weren't already asking for it
					if (docId !== "global") {
						// We could fetch global here, but for simplicity let's just return null 
						// and let the UI handle the "no data for this category" state
						// or maybe the component handles "global" fallback.
						setData(null);
					} else {
						setData(null);
					}
				}
			},
			(err) => {
				console.error("Error fetching market benchmarks:", err);
				setError(err.message);
				setLoading(false);
			}
		);

		return () => unsub();
	}, [category]);

	return { data, loading, error };
}
