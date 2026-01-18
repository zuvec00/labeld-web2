import React from "react";
import { StorefrontAnalyticsSummary } from "@/types/storefront-analytics";
import Card from "@/components/ui/Card";
import {
	ResponsiveContainer,
	XAxis,
	YAxis,
	Tooltip,
	AreaChart,
	Area,
	CartesianGrid,
	PieChart,
	Pie,
	Cell,
	Legend,
	Line,
} from "recharts";
import {
	ArrowUpRight,
	ArrowDownRight,
	Users,
	ShoppingBag,
	CreditCard,
	Activity,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface OverviewTabProps {
	data: StorefrontAnalyticsSummary;
}

const COLORS = ["#8b5cf6", "#10b981", "#f59e0b", "#64748b"];

export default function OverviewTab({ data }: OverviewTabProps) {
	console.log("Traffic breakdown:", data.trafficSourceBreakdown);
	return (
		<div className="space-y-6">
			{/* Key Metrics Grid */}
			<div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
				<MetricCard
					title="Total Visits"
					value={data.totalVisits.toLocaleString()}
					icon={Activity}
					trend={Math.round(data.visitsTrend)}
				/>
				<MetricCard
					title="Unique Visitors"
					value={data.uniqueVisitors.toLocaleString()}
					icon={Users}
					trend={Math.round(data.uniqueVisitorsTrend)}
				/>
				<MetricCard
					title="Conversion Rate"
					value={`${data.conversionRate.toFixed(2)}%`}
					icon={ShoppingBag}
					trend={Math.round(data.conversionRateTrend)}
					trendInverse // e.g. if we wanted lower is better? wait, conversion higher is usually better.
					// Actually usually 'trendInverse' implies GREEN is DOWN.
					// For conversion, GREEN is UP. So trendInverse={false} (default).
					// The previous code had trendInverse for Conversion Rate? Let's check logic.
					// Logic: !trendInverse && isPositive => Text is Green? No, check code below.
				/>
				<MetricCard
					title="Total Revenue"
					value={formatCurrency(data.revenue, "NGN", { compact: true })}
					icon={CreditCard}
					trend={Math.round(data.revenueTrend)}
				/>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* Daily Trend Chart (Left 2/3) */}
				<Card
					className="lg:col-span-2 shadow-sm border-stroke"
					title="Traffic & Sales Trend"
					sub="Daily sessions vs conversions over the selected period."
				>
					<div className="h-[300px]">
						<ResponsiveContainer width="100%" height="100%">
							<AreaChart
								data={data.dailyTrend}
								margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
							>
								<defs>
									<linearGradient
										id="colorSessions"
										x1="0"
										y1="0"
										x2="0"
										y2="1"
									>
										<stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.1} />
										<stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
									</linearGradient>
								</defs>
								<CartesianGrid
									strokeDasharray="3 3"
									vertical={false}
									stroke="#f1f5f9"
								/>
								<XAxis
									dataKey="date"
									tickFormatter={(val) => val.split("-").slice(1).join("/")}
									axisLine={false}
									tickLine={false}
									tick={{ fontSize: 11, fill: "#94a3b8" }}
									dy={10}
								/>
								<YAxis
									yAxisId="left"
									axisLine={false}
									tickLine={false}
									tick={{ fontSize: 11, fill: "#94a3b8" }}
								/>
								<YAxis
									yAxisId="right"
									orientation="right"
									axisLine={false}
									tickLine={false}
									tick={{ fontSize: 11, fill: "#94a3b8" }}
								/>
								<Tooltip
									contentStyle={{
										borderRadius: "8px",
										border: "none",
										boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
									}}
									labelStyle={{ color: "#64748b", fontSize: "12px" }}
								/>
								<Area
									yAxisId="left"
									type="monotone"
									dataKey="sessions"
									name="Sessions"
									stroke="#8b5cf6"
									fillOpacity={1}
									fill="url(#colorSessions)"
								/>
								<Line
									yAxisId="right"
									type="monotone"
									dataKey="totalPurchases"
									name="Orders"
									stroke="#10b981"
									strokeWidth={2}
									dot={false}
								/>
							</AreaChart>
						</ResponsiveContainer>
					</div>
				</Card>

				{/* Traffic Sources (Right 1/3) */}
				<Card
					className="shadow-sm border-stroke"
					title="Traffic Sources"
					sub="Where your visitors are coming from."
				>
					<div className="h-[300px] relative">
						<ResponsiveContainer width="100%" height="100%">
							<PieChart>
								<Pie
									data={data.trafficSourceBreakdown}
									cx="50%"
									cy="50%"
									innerRadius={60}
									outerRadius={80}
									paddingAngle={data.trafficSourceBreakdown.length > 1 ? 5 : 0}
									//before it was 5
									dataKey="value"
								>
									{data.trafficSourceBreakdown.map((entry, index) => (
										<Cell
											key={`cell-${index}`}
											fill={COLORS[index % COLORS.length]}
										/>
									))}
								</Pie>
								<Tooltip />
								<Legend verticalAlign="bottom" height={36} />
							</PieChart>
						</ResponsiveContainer>
						<div className="absolute inset-0 flex items-center justify-center pointer-events-none pb-8">
							<div className="text-center">
								<span className="block text-2xl font-bold text-text">
									{data.totalVisits.toLocaleString()}
								</span>
								<span className="text-xs text-text-muted">Total Visits</span>
							</div>
						</div>
					</div>
				</Card>
			</div>
		</div>
	);
}

// Sub-component for consistency
function MetricCard({
	title,
	value,
	icon: Icon,
	trend,
	trendInverse = false,
}: any) {
	const isPositive = trend > 0;

	let colorClass = "text-emerald-500";
	if (!trendInverse) {
		if (!isPositive) colorClass = "text-rose-500";
	} else {
		if (isPositive) colorClass = "text-rose-500";
	}

	return (
		<Card className="shadow-sm border-stroke">
			<div className="flex items-center justify-between space-y-0 pb-2">
				<p className="text-sm font-medium text-text-muted">{title}</p>
				<Icon className="h-4 w-4 text-text-muted" />
			</div>
			<div className="flex items-center justify-between mt-2">
				<div className="text-2xl font-bold text-text">{value}</div>
				<div
					className={`flex items-center text-xs font-medium ${colorClass} bg-surface-neutral/50 px-2 py-1 rounded-full`}
				>
					{isPositive ? (
						<ArrowUpRight className="h-3 w-3 mr-1" />
					) : (
						<ArrowDownRight className="h-3 w-3 mr-1" />
					)}
					{Math.abs(trend)}%
				</div>
			</div>
		</Card>
	);
}
