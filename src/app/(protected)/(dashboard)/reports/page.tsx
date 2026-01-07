// src/app/(dashboard)/reports/page.tsx
"use client";

import React, { useState } from "react";
import {
	FileText,
	Download,
	Calendar,
	ArrowRight,
	FileSpreadsheet,
	FileType,
	AlertCircle,
} from "lucide-react";
import { useBrandSpace } from "@/hooks/useBrandSpace";
import { useDashboard } from "@/hooks/useDashboard";

type DateRangeOption = "7days" | "30days" | "90days" | "custom";

interface ReportType {
	id: string;
	title: string;
	description: string;
	icon: React.ElementType;
	formats: ("csv" | "pdf")[];
	isAvailable: boolean;
}

const REPORT_TYPES: ReportType[] = [
	{
		id: "brand-summary",
		title: "Brand Summary",
		description:
			"Overview of heat score, followers, engagement, and content performance.",
		icon: FileText,
		formats: ["csv", "pdf"],
		isAvailable: false, // TODO: Implement export
	},
	{
		id: "orders",
		title: "Orders Report",
		description:
			"Detailed breakdown of all orders, products sold, and revenue.",
		icon: FileSpreadsheet,
		formats: ["csv"],
		isAvailable: false, // TODO: Implement export
	},
	{
		id: "events",
		title: "Events Report",
		description: "Ticket sales, attendee data, and event performance metrics.",
		icon: FileSpreadsheet,
		formats: ["csv"],
		isAvailable: false, // TODO: Implement export
	},
	{
		id: "wallet",
		title: "Wallet Statement",
		description: "Transaction history, payouts, and earnings breakdown.",
		icon: FileType,
		formats: ["csv", "pdf"],
		isAvailable: false, // TODO: Implement export
	},
];

function DateRangeSelector({
	value,
	onChange,
}: {
	value: DateRangeOption;
	onChange: (value: DateRangeOption) => void;
}) {
	return (
		<div className="flex gap-2 p-1 bg-bg rounded-lg">
			{[
				{ value: "7days" as const, label: "7 Days" },
				{ value: "30days" as const, label: "30 Days" },
				{ value: "90days" as const, label: "90 Days" },
			].map((option) => (
				<button
					key={option.value}
					onClick={() => onChange(option.value)}
					className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
						value === option.value
							? "bg-surface text-text shadow-sm"
							: "text-text-muted hover:text-text"
					}`}
				>
					{option.label}
				</button>
			))}
		</div>
	);
}

function ReportCard({
	report,
	dateRange,
}: {
	report: ReportType;
	dateRange: DateRangeOption;
}) {
	const Icon = report.icon;

	const handleExport = (format: "csv" | "pdf") => {
		// TODO: [DEV] Implement actual export functionality
		console.log(`Exporting ${report.id} as ${format} for ${dateRange}`);
		alert(
			`Export functionality coming soon!\n\nReport: ${
				report.title
			}\nFormat: ${format.toUpperCase()}\nDate Range: ${dateRange}`
		);
	};

	return (
		<div className="rounded-xl bg-surface border border-stroke p-5 hover:border-cta/30 transition-all">
			<div className="flex items-start gap-4">
				<div className="p-3 rounded-lg bg-cta/10">
					<Icon className="w-6 h-6 text-cta" />
				</div>
				<div className="flex-1">
					<h3 className="text-sm font-medium text-text mb-1">{report.title}</h3>
					<p className="text-xs text-text-muted mb-4">{report.description}</p>

					<div className="flex items-center gap-2">
						{report.formats.map((format) => (
							<button
								key={format}
								onClick={() => handleExport(format)}
								disabled={!report.isAvailable}
								className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
									report.isAvailable
										? "bg-cta/10 text-cta hover:bg-cta/20"
										: "bg-stroke/50 text-text-muted cursor-not-allowed"
								}`}
							>
								<Download className="w-3 h-3" />
								{format.toUpperCase()}
							</button>
						))}
						{!report.isAvailable && (
							<span className="text-[10px] text-text-muted ml-2">
								Coming soon
							</span>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}

function BrandSummaryPreview({
	brandData,
	dashboardData,
}: {
	brandData: ReturnType<typeof useBrandSpace>["data"];
	dashboardData: ReturnType<typeof useDashboard>["data"];
}) {
	return (
		<div className="rounded-xl bg-surface border border-stroke p-5">
			<h3 className="text-sm font-medium text-text mb-4">Quick Summary</h3>
			<div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
				<div className="text-center p-3 rounded-lg bg-bg">
					<div className="text-2xl font-heading font-bold text-text">
						{brandData?.kpis.heatScore.toFixed(1) || "—"}
					</div>
					<div className="text-xs text-text-muted">Heat Score</div>
				</div>
				<div className="text-center p-3 rounded-lg bg-bg">
					<div className="text-2xl font-heading font-bold text-text">
						{brandData?.kpis.followersCount.toLocaleString() || "—"}
					</div>
					<div className="text-xs text-text-muted">Followers</div>
				</div>
				<div className="text-center p-3 rounded-lg bg-bg">
					<div className="text-2xl font-heading font-bold text-text">
						{dashboardData?.kpis.orders.toLocaleString() || "0"}
					</div>
					<div className="text-xs text-text-muted">Orders</div>
				</div>
				<div className="text-center p-3 rounded-lg bg-bg">
					<div className="text-2xl font-heading font-bold text-text">
						₦{((dashboardData?.kpis.gmv || 0) / 100).toLocaleString()}
					</div>
					<div className="text-xs text-text-muted">Revenue</div>
				</div>
			</div>
		</div>
	);
}

export default function ReportsPage() {
	const [dateRange, setDateRange] = useState<DateRangeOption>("30days");

	// Map DateRangeOption to BrandSpaceRange for useBrandSpace
	// Note: 90days is not supported by useBrandSpace, so we default to 30days
	const brandSpaceRange = dateRange === "90days" ? "30days" : dateRange;

	const { data: brandData, loading: brandLoading } = useBrandSpace({
		range: brandSpaceRange,
	});
	const { data: dashboardData, loading: dashboardLoading } = useDashboard();

	const loading = brandLoading || dashboardLoading;

	if (loading) {
		return (
			<div className="space-y-6">
				<div>
					<div className="h-8 w-32 bg-stroke rounded animate-pulse mb-2" />
					<div className="h-4 w-64 bg-stroke rounded animate-pulse" />
				</div>
				<div className="h-10 w-64 bg-stroke rounded-lg animate-pulse" />
				<div className="space-y-4">
					{[1, 2, 3, 4].map((i) => (
						<div
							key={i}
							className="rounded-xl bg-surface border border-stroke p-5"
						>
							<div className="animate-pulse flex items-start gap-4">
								<div className="h-12 w-12 bg-stroke rounded-lg" />
								<div className="flex-1 space-y-2">
									<div className="h-4 w-32 bg-stroke rounded" />
									<div className="h-3 w-full bg-stroke rounded" />
									<div className="h-8 w-24 bg-stroke rounded" />
								</div>
							</div>
						</div>
					))}
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
				<div>
					<h1 className="font-heading text-2xl font-semibold">Reports</h1>
					<p className="text-text-muted mt-1">
						Export detailed reports for accountability and analysis.
					</p>
				</div>
				<DateRangeSelector value={dateRange} onChange={setDateRange} />
			</div>

			{/* Quick Summary */}
			<BrandSummaryPreview
				brandData={brandData}
				dashboardData={dashboardData}
			/>

			{/* Available Reports */}
			<div>
				<h2 className="text-sm font-medium text-text mb-4">
					Available Reports
				</h2>
				<div className="space-y-4">
					{REPORT_TYPES.map((report) => (
						<ReportCard key={report.id} report={report} dateRange={dateRange} />
					))}
				</div>
			</div>

			{/* Info Notice */}
			<div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-start gap-3">
				<AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
				<div>
					<h4 className="text-sm font-medium text-blue-700 mb-1">
						Export Coming Soon
					</h4>
					<p className="text-xs text-blue-600">
						Report exports are being built to help you share brand performance
						with stakeholders, track growth over time, and maintain
						accountability. Stay tuned!
					</p>
				</div>
			</div>

			{/* Developer Note */}
			{process.env.NODE_ENV === "development" && (
				<div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
					<h4 className="text-sm font-medium text-yellow-700 mb-2">
						🔧 Developer Note
					</h4>
					<p className="text-xs text-yellow-600">
						TODOs for Reports implementation:
					</p>
					<ul className="text-xs text-yellow-600 mt-2 space-y-1 list-disc list-inside">
						<li>Implement CSV export for orders, events, wallet</li>
						<li>Implement PDF generation for branded reports</li>
						<li>Add date range filtering to data queries</li>
						<li>Consider server-side export for large datasets</li>
					</ul>
				</div>
			)}
		</div>
	);
}
