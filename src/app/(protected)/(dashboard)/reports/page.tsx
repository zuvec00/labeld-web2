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
	Lock,
} from "lucide-react";
import { useBrandSpace } from "@/hooks/useBrandSpace";
import { useDashboard, DashboardRange } from "@/hooks/useDashboard";
import { useDashboardContext } from "@/hooks/useDashboardContext";
import { getAllStoreOrders } from "@/lib/firebase/queries/storeOrders";
// import { useAuth } from "@/lib/firebase/context/AuthContext";
import { getDateRangeFromPerformanceRange } from "@/components/dashboard/PerformanceTimelineControls";
import ProBadge from "@/components/pro/ProBadge";
import UpgradeBanner from "@/components/pro/UpgradeBanner";
import { useAuth } from "@/lib/auth/AuthContext";

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
		formats: ["csv"], // PDF temporarily removed until generator is ready
		isAvailable: true,
	},
	{
		id: "orders",
		title: "Orders Report",
		description:
			"Detailed breakdown of all store orders, products sold, and revenue.",
		icon: FileSpreadsheet,
		formats: ["csv"],
		isAvailable: true,
	},
	// {
	// 	id: "events",
	// 	title: "Events Report",
	// 	description: "Ticket sales, attendee data, and event performance metrics.",
	// 	icon: FileSpreadsheet,
	// 	formats: ["csv"],
	// 	isAvailable: false, // Disabled as per request
	// },
	// {
	// 	id: "wallet",
	// 	title: "Wallet Statement",
	// 	description: "Transaction history, payouts, and earnings breakdown.",
	// 	icon: FileType,
	// 	formats: ["csv", "pdf"],
	// 	isAvailable: false, // Disabled as per request
	// },
];

// Helpers for CSV Generation
const generateCSV = (headers: string[], rows: (string | number)[][]) => {
	const csvContent = [
		headers.join(","),
		...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")), // Simple escape
	].join("\n");

	const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
	return URL.createObjectURL(blob);
};

const formatDate = (date: Date) => date.toLocaleDateString("en-GB");

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
	dateRangeObj,
	isPro,
	brandData,
	dashboardData,
	userId,
}: {
	report: ReportType;
	dateRange: DateRangeOption;
	dateRangeObj?: { start: Date; end: Date };
	isPro: boolean;
	brandData?: ReturnType<typeof useBrandSpace>["data"];
	dashboardData?: ReturnType<typeof useDashboard>["data"];
	userId?: string;
}) {
	const Icon = report.icon;
	const [exporting, setExporting] = useState(false);

	const handleExport = async (format: "csv" | "pdf") => {
		if (!isPro) return;

		try {
			setExporting(true);

			let downloadUrl = "";
			let filename = `${report.id}-${new Date().toISOString().split("T")[0]}.${format}`;

			if (report.id === "brand-summary" && format === "csv") {
				// Generate Brand Summary CSV
				const headers = ["Metric", "Value", "Notes"];
				const rows = [
					["Report Date", new Date().toLocaleDateString(), ""],
					[
						"Heat Score",
						brandData?.kpis.heatScore.toFixed(2) || "N/A",
						"Current",
					],
					["Followers", brandData?.kpis.followersCount || 0, "Current"],
					["Total Orders", dashboardData?.kpis.orders || 0, "Selected Period"],
					[
						"Total Revenue",
						((dashboardData?.kpis.gmv || 0) / 100).toFixed(2),
						"Selected Period (NGN)",
					],
					[
						"Avg Order Value",
						((dashboardData?.kpis.aov || 0) / 100).toFixed(2),
						"Selected Period (NGN)",
					],
					[
						"Engagement Rate",
						`${(
							((brandData?.engagement?.totalInteractions || 0) /
								(brandData?.engagement?.uniqueUsers || 1)) *
							100
						).toFixed(1)}%`,
						"Estimated",
					],
				];
				downloadUrl = generateCSV(headers, rows);
			} else if (report.id === "orders" && format === "csv" && userId) {
				// Generate Orders Report CSV
				const { start, end } = dateRangeObj || {
					start: new Date(0),
					end: new Date(),
				};
				const orders = await getAllStoreOrders(userId, start, end);

				const headers = [
					"Order ID",
					"Date",
					"Customer ID",
					"Items",
					"Total (NGN)",
					"Status",
					"Fulfillment",
				];
				const rows = orders.map((order) => [
					order.id,
					new Date(order.createdAt.toDate()).toLocaleDateString(),
					order.buyerUserId || "Guest",
					order.lineItems.map((i) => `${i.qty}x ${i.name}`).join("; "),
					(order.amount.totalMinor / 100).toFixed(2),
					order.status,
					// Basic fulfillment check (can be refined)
					order.status === "completed" ? "Delivered" : "Pending",
				]);

				downloadUrl = generateCSV(headers, rows);
			}

			if (downloadUrl) {
				const link = document.createElement("a");
				link.href = downloadUrl;
				link.download = filename;
				document.body.appendChild(link);
				link.click();
				document.body.removeChild(link);
			} else {
				alert("Report generation failed or not implemented for this type.");
			}
		} catch (error) {
			console.error("Export failed:", error);
			alert("Failed to generate report. Please try again.");
		} finally {
			setExporting(false);
		}
	};

	return (
		<div className="rounded-xl bg-surface border border-stroke p-5 hover:border-cta/30 transition-all">
			<div className="flex items-start gap-4">
				<div className="p-3 rounded-lg bg-cta/10">
					<Icon className="w-6 h-6 text-cta" />
				</div>
				<div className="flex-1">
					<div className="flex items-center gap-2 mb-1">
						<h3 className="text-sm font-medium text-text">{report.title}</h3>
						{!isPro && <ProBadge size="sm" />}
					</div>
					<p className="text-xs text-text-muted mb-4">{report.description}</p>

					<div className="flex items-center gap-2 flex-wrap">
						{report.formats.map((format) => (
							<div key={format} className="relative group">
								<button
									onClick={() => handleExport(format)}
									disabled={!isPro || !report.isAvailable || exporting}
									className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
										isPro && report.isAvailable
											? "bg-cta/10 text-cta hover:bg-cta/20"
											: "bg-stroke/50 text-text-muted cursor-not-allowed relative"
									}`}
								>
									{!isPro && <Lock className="w-3 h-3" />}
									{isPro && !exporting && <Download className="w-3 h-3" />}
									{isPro && exporting && (
										<div className="w-3 h-3 border-2 border-cta/30 border-t-cta rounded-full animate-spin" />
									)}
									{format.toUpperCase()}
								</button>
								{!isPro && (
									<div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-bg border border-stroke rounded text-[10px] text-text whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-sm">
										Available on Pro
									</div>
								)}
							</div>
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
	const { user } = useAuth();
	
	// Pro status
	const { roleDetection } = useDashboardContext();
	const isPro = roleDetection?.brandSubscriptionTier === "pro";

	// Calculate actual date objects for filtering
	const dateRangeObj = getDateRangeFromPerformanceRange(dateRange as any) || {
		start: new Date(new Date().setDate(new Date().getDate() - 30)),
		end: new Date(),
	};

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

			{/* Pro Gate Banner */}
			{!isPro && (
				<UpgradeBanner
					title="Unlock data exports"
					description="Export detailed reports to share with stakeholders, track progress over time, and maintain accountability."
					variant="subtle"
				/>
			)}

			{/* Available Reports */}
			<div>
				<h2 className="text-sm font-medium text-text mb-4">
					Available Reports
				</h2>
				<div className="space-y-4">
					{REPORT_TYPES.map((report) => (
						<ReportCard
							key={report.id}
							report={report}
							dateRange={dateRange}
							dateRangeObj={dateRangeObj}
							isPro={isPro}
							brandData={brandData}
							dashboardData={dashboardData}
							userId={user?.uid}
						/>
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
