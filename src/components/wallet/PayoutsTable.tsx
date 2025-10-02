// components/wallet/PayoutsTable.tsx
import { PayoutEntry } from "@/hooks/usePayouts";
import { formatCurrency, formatDate } from "@/lib/wallet/mock";
import Card from "@/components/dashboard/Card";

interface PayoutsTableProps {
	payouts: PayoutEntry[];
}

export default function PayoutsTable({ payouts }: PayoutsTableProps) {
	const getStatusColor = (status: string) => {
		switch (status) {
			case "pending":
				return "text-edit bg-edit/10 border-edit/20";
			case "processing":
				return "text-calm-2 bg-calm-2/10 border-calm-2/20";
			case "completed":
				return "text-accent bg-accent/10 border-accent/20";
			case "failed":
				return "text-alert bg-alert/10 border-alert/20";
			default:
				return "text-text-muted bg-stroke border-stroke";
		}
	};

	const getStatusLabel = (status: string) => {
		switch (status) {
			case "pending":
				return "Pending";
			case "processing":
				return "Processing";
			case "completed":
				return "Completed";
			case "failed":
				return "Failed";
			default:
				return status;
		}
	};

	return (
		<Card title="Payouts">
			<div className="space-y-4">
				{/* Automatic Payout Info */}
				<div className="rounded-lg bg-accent/10 border border-accent/20 p-4">
					<div className="flex items-start gap-3">
						<div className="w-2 h-2 bg-accent rounded-full mt-2 flex-shrink-0"></div>
						<div>
							<h4 className="text-sm font-medium text-accent mb-1">
								Automatic Weekly Payouts
							</h4>
							<p className="text-xs text-text-muted mb-2">
								Your eligible earnings are automatically paid out every Friday
								at 2:00 PM.
							</p>
							<p className="text-xs text-text-muted">
								<strong>Cutoff:</strong> Sales made after Thursday 12:00 PM are
								included in the following week&apos;s payout.
							</p>
						</div>
					</div>
				</div>

				{/* Table */}
				<div className="overflow-x-auto">
					<table className="w-full">
						<thead>
							<tr className="border-b border-stroke/60">
								<th className="text-left py-3 px-2 text-sm font-medium text-text-muted">
									Payout Date
								</th>
								<th className="text-left py-3 px-2 text-sm font-medium text-text-muted">
									Amount
								</th>
								<th className="text-left py-3 px-2 text-sm font-medium text-text-muted">
									Status
								</th>
								<th className="text-left py-3 px-2 text-sm font-medium text-text-muted">
									Reference
								</th>
							</tr>
						</thead>
						<tbody>
							{payouts.length === 0 ? (
								<tr key="empty-state">
									<td colSpan={4} className="text-center py-12">
										<div className="text-text-muted text-lg mb-2">
											No payouts yet
										</div>
										<p className="text-text-muted/70">
											Your automatic weekly payouts will appear here
										</p>
									</td>
								</tr>
							) : (
								payouts.map((payout) => (
									<tr
										key={payout.id}
										className="border-b border-stroke/30 hover:bg-surface/50 transition-colors"
									>
										<td className="py-3 px-2 text-sm text-text">
											{formatDate(payout.createdAt)}
										</td>
										<td className="py-3 px-2 text-sm font-medium text-cta">
											{formatCurrency(payout.amountMinor)}
										</td>
										<td className="py-3 px-2">
											<span
												className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(
													payout.status
												)}`}
											>
												{getStatusLabel(payout.status)}
											</span>
										</td>
										<td className="py-3 px-2 text-sm text-text-muted font-mono">
											{payout.reference || "—"}
										</td>
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>

				{/* Payout Schedule Info */}
				<div className="mt-6 p-4 rounded-lg bg-stroke/30 border border-stroke">
					<div className="flex items-start gap-3">
						<div className="w-2 h-2 bg-cta rounded-full mt-2 flex-shrink-0"></div>
						<div>
							<h4 className="text-sm font-medium text-text mb-1">
								Payout Schedule
							</h4>
							<div className="text-xs text-text-muted space-y-1">
								<p>
									<strong>Payout Day:</strong> Every Friday at 2:00 PM
								</p>
								<p>
									<strong>Cutoff Time:</strong> Thursday at 12:00 PM
								</p>
								<p>
									<strong>Processing:</strong> Automatic transfer to your
									verified bank account
								</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		</Card>
	);
}
