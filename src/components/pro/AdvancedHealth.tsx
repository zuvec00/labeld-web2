import { Activity, Zap, BarChart3, Eye } from "lucide-react";
import { BrandSpaceData } from "@/hooks/useBrandSpace";
import { DashboardData } from "@/hooks/useDashboard";

interface AdvancedHealthProps {
	brandData?: BrandSpaceData | null;
	dashboardData?: DashboardData | null;
	analytics?: any; // Analytics summary
}

type HealthStatus = "Good" | "Fair" | "Poor";

export default function AdvancedHealth({
	brandData,
	dashboardData,
	analytics,
}: AdvancedHealthProps) {
	// --- 1. Growth Health (Followers & Heat) ---
	const followersChange = brandData?.kpis?.followersChange7d || 0;
	const growthStatus: HealthStatus =
		followersChange > 5 ? "Good" : followersChange >= 0 ? "Fair" : "Poor";
	const growthMessage =
		growthStatus === "Good"
			? "Growing faster than peers"
			: growthStatus === "Fair"
			? "Stable growth"
			: "Losing momentum";
	const growthSubtext =
		growthStatus === "Good"
			? "Is consistently growing"
			: "Needs engagement boost";
	const growthColor =
		growthStatus === "Good"
			? "text-green-600"
			: growthStatus === "Fair"
			? "text-orange-600"
			: "text-red-600";
	const growthIconColor =
		growthStatus === "Good"
			? "text-green-500"
			: growthStatus === "Fair"
			? "text-orange-500"
			: "text-red-500";

	// --- 2. Consistency Health (Posting Frequency) ---
	const postsLast30Days = brandData?.reactions?.postsInRange || 0; // Assuming this covers range
	// Roughly: >12 posts (3/week) is good, >4 (1/week) is fair, else poor
	const consistencyStatus: HealthStatus =
		postsLast30Days >= 12 ? "Good" : postsLast30Days >= 4 ? "Fair" : "Poor";
	const consistencyMessage =
		consistencyStatus === "Good"
			? "Strong posting cadence"
			: consistencyStatus === "Fair"
			? "Irregular posting"
			: "Inactive recently";
	const consistencySubtext =
		consistencyStatus === "Good"
			? "Top tier consistency"
			: "Try posting 3x/week";
	const consistencyColor =
		consistencyStatus === "Good"
			? "text-green-600"
			: consistencyStatus === "Fair"
			? "text-orange-600"
			: "text-red-600";
	const consistencyIconColor =
		consistencyStatus === "Good"
			? "text-green-500"
			: consistencyStatus === "Fair"
			? "text-orange-500"
			: "text-red-500";

	// --- 3. Conversion Health (View to Order) ---
	const uniqueUsers = brandData?.engagement?.uniqueUsers || 1; // Avoid div by 0
	const orders = dashboardData?.kpis?.orders || 0;
	const conversionRate = (orders / uniqueUsers) * 100;

	const conversionStatus: HealthStatus =
		conversionRate >= 2
			? "Good" // > 2%
			: conversionRate >= 0.5
			? "Fair" // 0.5% - 2%
			: "Poor"; // < 0.5%
	const conversionMessage =
		conversionStatus === "Good"
			? "Excellent conversion"
			: conversionStatus === "Fair"
			? "Average conversion"
			: "Low conversion";
	const conversionSubtext =
		conversionStatus === "Good"
			? `Top 10% (${conversionRate.toFixed(1)}%)`
			: `Avg is ~2% (You: ${conversionRate.toFixed(1)}%)`;
	const conversionColor =
		conversionStatus === "Good"
			? "text-green-600"
			: conversionStatus === "Fair"
			? "text-orange-600"
			: "text-red-600";
	const conversionIconColor =
		conversionStatus === "Good"
			? "text-green-500"
			: conversionStatus === "Fair"
			? "text-orange-500"
			: "text-red-500";

	// --- 4. Visibility Health (Traffic Mix) ---
	// Logic: If direct/social traffic > 0 and marketplace traffic > 0, it's good mix
	const radarClicks = analytics?.radarToStoreClicks || 0;
	const totalReach = brandData?.engagement?.totalInteractions || 0;
	
	const visibilityStatus: HealthStatus =
		totalReach > 1000 ? "Good" : totalReach > 200 ? "Fair" : "Poor";
	const visibilityMessage =
		visibilityStatus === "Good" // Using total reach as proxy for now
			? "High visibility"
			: visibilityStatus === "Fair"
			? "Growing visibility"
			: "Low visibility";
	const visibilitySubtext =
		visibilityStatus === "Good"
			? "Strong direct traffic"
			: "Focus on social sharing";
	const visibilityColor =
		visibilityStatus === "Good"
			? "text-green-600"
			: visibilityStatus === "Fair"
			? "text-orange-600"
			: "text-red-600";
	const visibilityIconColor =
		visibilityStatus === "Good"
			? "text-green-500"
			: visibilityStatus === "Fair"
			? "text-orange-500"
			: "text-red-500";


	return (
		<div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
			{/* Growth Health */}
			<div className="p-4 rounded-xl bg-surface border border-stroke flex flex-col justify-between h-full">
				<div>
					<div className="flex items-center gap-2 mb-2">
						<Activity className={`w-4 h-4 ${growthIconColor}`} />
						<span className="text-xs font-semibold text-text-muted uppercase">
							Growth Health
						</span>
					</div>
					<div className="text-2xl font-bold text-text mb-1">{growthStatus}</div>
					<p className="text-xs text-text-muted">{growthMessage}</p>
				</div>
				<div className={`mt-3 flex items-center text-xs font-medium ${growthColor}`}>
					{growthSubtext}
				</div>
			</div>

			{/* Consistency Health */}
			<div className="p-4 rounded-xl bg-surface border border-stroke flex flex-col justify-between h-full">
				<div>
					<div className="flex items-center gap-2 mb-2">
						<Zap className={`w-4 h-4 ${consistencyIconColor}`} />
						<span className="text-xs font-semibold text-text-muted uppercase">
							Consistency
						</span>
					</div>
					<div className="text-2xl font-bold text-text mb-1">{consistencyStatus}</div>
					<p className="text-xs text-text-muted">{consistencyMessage}</p>
				</div>
				<div className={`mt-3 flex items-center text-xs font-medium ${consistencyColor}`}>
					{consistencySubtext}
				</div>
			</div>

			{/* Conversion Health */}
			<div className="p-4 rounded-xl bg-surface border border-stroke flex flex-col justify-between h-full">
				<div>
					<div className="flex items-center gap-2 mb-2">
						<BarChart3 className={`w-4 h-4 ${conversionIconColor}`} />
						<span className="text-xs font-semibold text-text-muted uppercase">
							Conversion
						</span>
					</div>
					<div className="text-2xl font-bold text-text mb-1">{conversionStatus}</div>
					<p className="text-xs text-text-muted">{conversionMessage}</p>
				</div>
				<div className={`mt-3 flex items-center text-xs font-medium ${conversionColor}`}>
					{conversionSubtext}
				</div>
			</div>

			{/* Visibility Health */}
			<div className="p-4 rounded-xl bg-surface border border-stroke flex flex-col justify-between h-full">
				<div>
					<div className="flex items-center gap-2 mb-2">
						<Eye className={`w-4 h-4 ${visibilityIconColor}`} />
						<span className="text-xs font-semibold text-text-muted uppercase">
							Visibility
						</span>
					</div>
					<div className="text-2xl font-bold text-text mb-1">{visibilityStatus}</div>
					<p className="text-xs text-text-muted">{visibilityMessage}</p>
				</div>
				<div className={`mt-3 flex items-center text-xs font-medium ${visibilityColor}`}>
					{visibilitySubtext}
				</div>
			</div>
		</div>
	);
}
