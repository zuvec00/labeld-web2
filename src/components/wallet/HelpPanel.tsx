// components/wallet/HelpPanel.tsx
import Card from "@/components/dashboard/Card";

export default function HelpPanel() {
	return (
		<Card title="Help & Policy">
			<div className="space-y-4">
				<div className="text-sm text-text-muted mb-4">
					Understanding your wallet and payout process
				</div>

				<div className="space-y-3">
					<div className="flex items-start gap-3">
						<div className="w-2 h-2 bg-accent rounded-full mt-2 flex-shrink-0"></div>
						<div>
							<h4 className="text-sm font-medium text-text mb-1">
								Event Merchandise
							</h4>
							<p className="text-xs text-text-muted">
								Event merch becomes eligible after delivery confirmation from
								the customer.
							</p>
						</div>
					</div>

					<div className="flex items-start gap-3">
						<div className="w-2 h-2 bg-cta rounded-full mt-2 flex-shrink-0"></div>
						<div>
							<h4 className="text-sm font-medium text-text mb-1">
								Ticket Earnings
							</h4>
							<p className="text-xs text-text-muted">
								Ticket earnings may settle immediately after payment
								confirmation.
							</p>
						</div>
					</div>

					<div className="flex items-start gap-3">
						<div className="w-2 h-2 bg-edit rounded-full mt-2 flex-shrink-0"></div>
						<div>
							<h4 className="text-sm font-medium text-text mb-1">
								Payout Processing
							</h4>
							<p className="text-xs text-text-muted">
								Payouts are processed after eligibility is confirmed and all
								requirements are met.
							</p>
						</div>
					</div>

					<div className="flex items-start gap-3">
						<div className="w-2 h-2 bg-calm-2 rounded-full mt-2 flex-shrink-0"></div>
						<div>
							<h4 className="text-sm font-medium text-text mb-1">
								Processing Time
							</h4>
							<p className="text-xs text-text-muted">
								Withdrawal requests typically take 1-3 business days to process.
							</p>
						</div>
					</div>

					<div className="flex items-start gap-3">
						<div className="w-2 h-2 bg-calm-1 rounded-full mt-2 flex-shrink-0"></div>
						<div>
							<h4 className="text-sm font-medium text-text mb-1">
								Minimum Withdrawal
							</h4>
							<p className="text-xs text-text-muted">
								Minimum withdrawal amount is ₦1,000 from your eligible balance.
							</p>
						</div>
					</div>
				</div>

				<div className="pt-4 border-t border-stroke/60">
					<div className="flex items-center gap-2 text-xs text-text-muted">
						<span>Need help?</span>
						<a
							href="mailto:support@labeld.app?cc=labeldapp@gmail.com&subject=Support%20Request"
							className="text-cta hover:underline"
							title="Contact Support"
						>
							Contact Support
						</a>
					</div>
				</div>
			</div>
		</Card>
	);
}
