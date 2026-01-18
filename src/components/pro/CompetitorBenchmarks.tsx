"use client";

import { Trophy, Target } from "lucide-react";
import LockedCard from "./LockedCard";

const INDUSTRY_STANDARDS = {
	streetwear: {
		conversion: 1.8, // 1.8% average
		engagement: 4.5, // 4.5% average
	},
};

interface BenchmarkMetrics {
	avg: number;
	p50?: number;
	p90?: number;
	sampleSize?: number;
}

interface CompetitorBenchmarksProps {
	isPro?: boolean;
	metrics?: {
		conversionRate: number;
		engagementRate: number;
	};
	benchmarks?: {
		category: string;
		conversion: BenchmarkMetrics;
		engagement: BenchmarkMetrics;
	} | null;
}

export default function CompetitorBenchmarks({
	isPro = true,
	metrics,
	benchmarks: realBenchmarks,
}: CompetitorBenchmarksProps) {
	if (!isPro) {
		return (
			<LockedCard
				title="Understand your market position"
				description="See how you stack up against similar brands in your category"
				height="h-56"
			/>
		);
	}

	// Use real benchmarks if available, otherwise fallback to "Streetwear" standard
	const activeBenchmarks = {
		conversion: realBenchmarks?.conversion.avg ?? INDUSTRY_STANDARDS.streetwear.conversion,
		engagement: realBenchmarks?.engagement.avg ?? INDUSTRY_STANDARDS.streetwear.engagement,
	};
	
	const isUsingRealData = !!realBenchmarks;
	const categoryName = realBenchmarks?.category || "Streetwear";

	const myConversion = metrics?.conversionRate || 0;
	const myEngagement = metrics?.engagementRate || 0;

	// Helper to position the marker (50% is average)
	const getPosition = (value: number, avg: number) => {
		if (!value) return 0;
		const diff = ((value - avg) / avg) * 30; // 30% swing per 100% diff
		return Math.min(Math.max(50 + diff, 5), 95); // Clamp 5-95%
	};

	const items = [
		{
			label: "Conversion Rate",
			myValue: myConversion,
			avgValue: activeBenchmarks.conversion,
			unit: "%",
			format: (n: number) => n.toFixed(1),
			color: "bg-accent",
			textColor: "text-accent",
		},
		{
			label: "Engagement Rate",
			myValue: myEngagement,
			avgValue: activeBenchmarks.engagement,
			unit: "%",
			format: (n: number) => n.toFixed(1),
			color: "bg-orange-500",
			textColor: "text-orange-600",
		},
	];

	return (
		<div className="rounded-xl border border-stroke bg-surface p-6">
			<div className="flex items-start justify-between mb-6">
				<div>
					<h3 className="font-heading font-semibold text-lg text-text">
						Market Benchmarks
					</h3>
					<p className="text-sm text-text-muted">
						Comparing vs {isUsingRealData ? "similar" : "industry standard"} <span className="capitalize">{categoryName}</span> brands
					</p>
				</div>
				<div className="p-2 bg-accent/10 rounded-lg">
					<Trophy className="w-5 h-5 text-accent" />
				</div>
			</div>

			<div className="space-y-8">
				{items.map((item) => {
					const position = getPosition(item.myValue, item.avgValue);
					const isAboveAvg = item.myValue >= item.avgValue;
					const diffPercent =
						((item.myValue - item.avgValue) / item.avgValue) * 100;

					return (
						<div key={item.label}>
							<div className="flex justify-between text-sm mb-2">
								<span className="font-medium text-text">{item.label}</span>
								<span className="text-text-muted">
									{isAboveAvg
										? `Top ${Math.max(
												100 - (50 + diffPercent / 2),
												1
										  ).toFixed(0)}%`
										: "Below Average"}
								</span>
							</div>
							<div className="h-3 bg-stroke/30 rounded-full overflow-hidden relative">
								{/* Market Avg Marker (Always center relative to scale logic) */}
								<div className="absolute left-[50%] top-0 bottom-0 w-0.5 h-full bg-text/50 z-20" />

								{/* My Marker */}
								<div
									className={`absolute top-0 bottom-0 w-1 ${item.color} z-30 transition-all duration-1000`}
									style={{ left: `${position}%` }}
								/>

								{/* Gradient Background */}
								<div className="w-full h-full bg-gradient-to-r from-red-500/10 via-yellow-500/10 to-green-500/10" />
							</div>
							<div className="flex justify-between text-xs text-text-muted mt-2">
								<span>
									Category Avg: {item.format(item.avgValue)}
									{item.unit}
								</span>
								<span className={`font-bold ${item.textColor}`}>
									You: {item.format(item.myValue)}
									{item.unit}
								</span>
							</div>
						</div>
					);
				})}
			</div>

			{process.env.NODE_ENV === "development" && !isUsingRealData && (
				<div className="mt-4 p-2 bg-yellow-50 text-yellow-800 text-[10px] rounded text-center">
					DEV MODE: Using static fallback. Cloud Function hasn't populated `market_benchmarks` yet.
				</div>
			)}
		</div>
	);
}
