// src/app/(dashboard)/dashboard/page.tsx
import Card from "@/components/dashboard/Card";
import { Kpi } from "@/components/dashboard/kpis/KpiCard";

export default function DashboardPage() {
	return (
		<div className="space-y-6">
			<div>
				<h1 className="font-heading text-2xl font-semibold">Sales Overview</h1>
				<p className="text-text-muted mt-1">
					Snapshot of your brand’s performance.
				</p>
			</div>

			{/* KPI row */}
			<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
				<Kpi
					label="Total Sales (30d)"
					value="$8,220.64"
					sub="Last month: $6,200"
				/>
				<Kpi label="Orders (30d)" value="1,120" sub="Last month: 980" />
				<Kpi label="Followers" value="12,430" sub="+1,020 in 30d" />
				<Kpi label="Engagement Rate" value="4.8%" sub="Target: 5.0%" />
			</div>

			{/* Charts row */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
				<Card title="Revenue analytics" className="lg:col-span-2">
					<div className="h-64 grid place-items-center text-text-muted">
						[Chart]
					</div>
				</Card>
				<Card title="Total Income">
					<div className="h-64 grid place-items-center text-text-muted">
						[Mini Bars]
					</div>
				</Card>
			</div>

			{/* Tables row */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
				<Card title="Top Performing Content">
					<div className="h-40 grid place-items-center text-text-muted">
						[Table]
					</div>
				</Card>
				<Card
					title="Recent Orders"
					right={<button className="text-cta text-sm">Sort</button>}
				>
					<div className="h-40 grid place-items-center text-text-muted">
						[Table]
					</div>
				</Card>
			</div>

			{/* Coming soon tiles */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
				<Card title="Wallet (Coming Soon)">
					<div className="h-28 grid place-items-center text-text-muted">
						Balances & payouts
					</div>
				</Card>
				<Card title="Ticketing (Coming Soon)">
					<div className="h-28 grid place-items-center text-text-muted">
						Create ticketed events
					</div>
				</Card>
			</div>
		</div>
	);
}
