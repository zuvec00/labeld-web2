// components/dashboard/RevenueChart.tsx
"use client";

import { RevenueDataPoint } from "@/hooks/useDashboard";
import { formatNaira } from "@/lib/orders/helpers";

interface RevenueChartProps {
	data: RevenueDataPoint[];
	loading?: boolean;
	className?: string;
}

export default function RevenueChart({
	data,
	loading = false,
	className = "",
}: RevenueChartProps) {
	if (loading) {
		return (
			<div
				className={`rounded-lg bg-surface border border-stroke p-4 ${className}`}
			>
				<h3 className="font-medium text-text mb-4">Revenue Analytics</h3>
				<div className="h-64 flex items-center justify-center">
					<div className="animate-pulse text-text-muted">Loading chart...</div>
				</div>
			</div>
		);
	}

	if (!data || data.length === 0) {
		return (
			<div
				className={`rounded-lg bg-surface border border-stroke p-4 ${className}`}
			>
				<h3 className="font-medium text-text mb-4">Revenue Analytics</h3>
				<div className="h-64 flex items-center justify-center">
					<div className="text-center text-text-muted">
						<div className="text-4xl mb-2">📊</div>
						<div>No revenue data for this period</div>
					</div>
				</div>
			</div>
		);
	}

	// Calculate max value for scaling
	const maxValue = Math.max(...data.map((d) => d.total));
	const maxY = Math.ceil(maxValue / 10000) * 10000; // Round up to nearest 10k

	// Simple SVG line chart
	const width = 600;
	const height = 200;
	const padding = 40;
	const chartWidth = width - padding * 2;
	const chartHeight = height - padding * 2;

	const getX = (index: number) =>
		padding + (index / (data.length - 1)) * chartWidth;
	const getY = (value: number) =>
		padding + chartHeight - (value / maxY) * chartHeight;

	// Generate path for total revenue line
	const totalPath = data
		.map((point, index) => {
			const x = getX(index);
			const y = getY(point.total);
			return index === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
		})
		.join(" ");

	// Generate path for tickets revenue area
	const ticketsPath = data
		.map((point, index) => {
			const x = getX(index);
			const y = getY(point.tickets);
			return `${x} ${y}`;
		})
		.join(" L ");

	// Generate path for merch revenue area (stacked on top of tickets)
	const merchPath = data
		.map((point, index) => {
			const x = getX(index);
			const y = getY(point.tickets + point.merch);
			return `${x} ${y}`;
		})
		.join(" L ");

	// Y-axis labels
	const yLabels = [0, maxY * 0.25, maxY * 0.5, maxY * 0.75, maxY].map(
		(value) => ({
			value,
			y: getY(value),
		})
	);

	// X-axis labels (show every few days)
	const xLabels = data
		.filter(
			(_, index) => index % Math.max(1, Math.floor(data.length / 6)) === 0
		)
		.map((point, index) => ({
			label: new Date(point.date).toLocaleDateString("en-NG", {
				month: "short",
				day: "numeric",
			}),
			x: getX(index * Math.max(1, Math.floor(data.length / 6))),
		}));

	return (
		<div
			className={`rounded-lg bg-surface border border-stroke p-4 ${className}`}
		>
			<h3 className="font-medium text-text mb-4">Revenue Analytics</h3>

			<div className="h-64 overflow-x-auto">
				<svg width={width} height={height} className="min-w-full">
					{/* Grid lines */}
					{yLabels.map(({ y }, index) => (
						<line
							key={index}
							x1={padding}
							y1={y}
							x2={width - padding}
							y2={y}
							stroke="currentColor"
							strokeWidth="0.5"
							className="text-stroke/30"
						/>
					))}

					{/* Y-axis labels */}
					{yLabels.map(({ value, y }, index) => (
						<text
							key={index}
							x={padding - 8}
							y={y + 4}
							textAnchor="end"
							className="text-xs fill-text-muted"
						>
							{formatNaira(value)}
						</text>
					))}

					{/* X-axis labels */}
					{xLabels.map(({ label, x }, index) => (
						<text
							key={index}
							x={x}
							y={height - padding + 16}
							textAnchor="middle"
							className="text-xs fill-text-muted"
						>
							{label}
						</text>
					))}

					{/* Merch area (bottom layer) */}
					<path
						d={`M ${getX(0)} ${getY(data[0].tickets)} L ${ticketsPath} L ${getX(
							data.length - 1
						)} ${getY(data[data.length - 1].tickets)} L ${getX(
							data.length - 1
						)} ${getY(0)} L ${getX(0)} ${getY(0)} Z`}
						fill="url(#ticketsGradient)"
						className="opacity-60"
					/>

					{/* Tickets area */}
					<path
						d={`M ${getX(0)} ${getY(0)} L ${ticketsPath} L ${getX(
							data.length - 1
						)} ${getY(data[data.length - 1].tickets)} L ${getX(
							data.length - 1
						)} ${getY(0)} Z`}
						fill="url(#merchGradient)"
						className="opacity-60"
					/>

					{/* Total revenue line */}
					<path
						d={totalPath}
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						className="text-cta"
					/>

					{/* Data points */}
					{data.map((point, index) => (
						<circle
							key={index}
							cx={getX(index)}
							cy={getY(point.total)}
							r="3"
							fill="currentColor"
							className="text-cta"
						/>
					))}

					{/* Gradients */}
					<defs>
						<linearGradient
							id="ticketsGradient"
							x1="0%"
							y1="0%"
							x2="0%"
							y2="100%"
						>
							<stop offset="0%" stopColor="#3B82F6" stopOpacity="0.3" />
							<stop offset="100%" stopColor="#3B82F6" stopOpacity="0.1" />
						</linearGradient>
						<linearGradient
							id="merchGradient"
							x1="0%"
							y1="0%"
							x2="0%"
							y2="100%"
						>
							<stop offset="0%" stopColor="#10B981" stopOpacity="0.3" />
							<stop offset="100%" stopColor="#10B981" stopOpacity="0.1" />
						</linearGradient>
					</defs>
				</svg>
			</div>

			{/* Legend */}
			<div className="flex items-center justify-center gap-6 mt-4">
				<div className="flex items-center gap-2">
					<div className="w-3 h-3 bg-blue-500 rounded-sm"></div>
					<span className="text-xs text-text-muted">Tickets</span>
				</div>
				<div className="flex items-center gap-2">
					<div className="w-3 h-3 bg-green-500 rounded-sm"></div>
					<span className="text-xs text-text-muted">Merch</span>
				</div>
				<div className="flex items-center gap-2">
					<div className="w-3 h-3 border-2 border-cta rounded-sm"></div>
					<span className="text-xs text-text-muted">Total</span>
				</div>
			</div>
		</div>
	);
}
