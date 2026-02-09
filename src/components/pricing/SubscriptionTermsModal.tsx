"use client";

import { X } from "lucide-react";
import Button from "@/components/ui/button";

interface SubscriptionTermsModalProps {
	isOpen: boolean;
	onClose: () => void;
}

export default function SubscriptionTermsModal({
	isOpen,
	onClose,
}: SubscriptionTermsModalProps) {
	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
			<div className="bg-surface border border-stroke rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
				{/* Header */}
				<div className="flex items-center justify-between p-6 border-b border-stroke flex-shrink-0">
					<h3 className="font-heading font-semibold text-xl">
						Subscription Terms & Paid Services
					</h3>
					<button onClick={onClose} className="text-text-muted hover:text-text">
						<X className="w-5 h-5" />
					</button>
				</div>

				{/* Content */}
				<div className="p-6 overflow-y-auto space-y-6 text-sm text-text-muted leading-relaxed">
					{/* Subscription Plans */}
					<section>
						<h4 className="font-bold text-text mb-2">Subscription Plans</h4>
						<p className="mb-2">
							LABELD offers paid subscription plans for Brands and Events
							(“Subscriptions”).
						</p>
						<p className="mb-2">
							Subscriptions are available on the following billing cycles:
						</p>
						<ul className="list-disc pl-5 mb-2 space-y-1">
							<li>Monthly</li>
							<li>Quarterly</li>
							<li>Bi-Annual</li>
							<li>Yearly</li>
						</ul>
						<p>
							All subscriptions are recurring and will automatically renew at
							the end of each billing period unless cancelled by the user.
						</p>
					</section>

					{/* Access & Features */}
					<section>
						<h4 className="font-bold text-text mb-2">Access & Features</h4>
						<p className="mb-2">
							Upon successful payment, subscribers gain access to paid features
							including but not limited to:
						</p>
						<ul className="list-disc pl-5 mb-2 space-y-1">
							<li>Custom branded site</li>
							<li>Event or brand templates</li>
							<li>Booking functionality</li>
							<li>Analytics and insights</li>
							<li>Custom branding tools</li>
							<li>Digital checkout and payment processing</li>
						</ul>
						<p className="mb-2">There are currently no limits on:</p>
						<ul className="list-disc pl-5 mb-2 space-y-1">
							<li>Number of events</li>
							<li>Number of products</li>
							<li>Traffic or visitors</li>
						</ul>
						<p>
							However, LABELD reserves the right to introduce limits, adjust
							usage policies, or modify features at any time to ensure platform
							stability and fair use.
						</p>
					</section>

					{/* Payments & Billing */}
					<section>
						<h4 className="font-bold text-text mb-2">Payments & Billing</h4>
						<ul className="list-disc pl-5 space-y-1">
							<li>
								Subscription fees are charged in advance on a recurring basis.
							</li>
							<li>
								By subscribing, you authorize LABELD to automatically charge
								your selected payment method for each renewal period.
							</li>
							<li>
								You are responsible for maintaining valid payment information.
							</li>
							<li>
								Failure to process payment may result in suspension or loss of
								access to paid features.
							</li>
						</ul>
					</section>

					{/* Cancellation & Refunds */}
					<section>
						<h4 className="font-bold text-text mb-2">Cancellation & Refunds</h4>
						<ul className="list-disc pl-5 space-y-1">
							<li>Users may cancel their subscription at any time.</li>
							<li>All subscription payments are non-refundable.</li>
							<li>
								No refunds will be issued for unused time, partial periods, or
								failure to use the service.
							</li>
						</ul>
					</section>

					{/* Suspension & Termination */}
					<section>
						<h4 className="font-bold text-text mb-2">
							Suspension & Termination
						</h4>
						<p className="mb-2">
							LABELD reserves the right to immediately suspend or terminate any
							account that:
						</p>
						<ul className="list-disc pl-5 mb-2 space-y-1">
							<li>Engages in fraudulent, illegal, or misleading activity</li>
							<li>Uses the platform for scams or abuse</li>
							<li>Violates applicable laws or LABELD policies</li>
						</ul>
						<p className="mb-2">
							In cases of suspension or termination due to misuse or violations:
						</p>
						<ul className="list-disc pl-5 space-y-1">
							<li>No refunds will be issued</li>
							<li>
								Access to paid features may be revoked without prior notice
							</li>
						</ul>
					</section>

					{/* Platform Responsibility & Liability */}
					<section>
						<h4 className="font-bold text-text mb-2">
							Platform Responsibility & Liability
						</h4>
						<p className="mb-2">
							LABELD acts solely as a technology platform and is not responsible
							for:
						</p>
						<ul className="list-disc pl-5 mb-2 space-y-1">
							<li>Event cancellations or postponements</li>
							<li>Disputes between brands/events and customers</li>
							<li>
								Chargebacks, refunds, or payment disputes caused by brands or
								event organizers
							</li>
							<li>Fulfilment, delivery, or service quality</li>
						</ul>
						<p className="mb-2">LABELD provides:</p>
						<ul className="list-disc pl-5 mb-2 space-y-1">
							<li>The platform infrastructure</li>
							<li>Payment processing tools</li>
							<li>Digital management and analytics tools</li>
						</ul>
						<p>
							All transactions and engagements between users and their customers
							are the sole responsibility of the brand or event organizer.
						</p>
					</section>

					{/* Changes to Pricing & Features */}
					<section>
						<h4 className="font-bold text-text mb-2">
							Changes to Pricing & Features
						</h4>
						<p className="mb-2">LABELD may:</p>
						<ul className="list-disc pl-5 mb-2 space-y-1">
							<li>Modify subscription pricing</li>
							<li>Add, remove, or change features</li>
							<li>Introduce new plans or discontinue existing ones</li>
						</ul>
						<p>
							Such changes may take effect immediately or at the next billing
							cycle. Continued use of the platform after changes constitutes
							acceptance of the updated terms.
						</p>
					</section>

					{/* Governing Law */}
					<section>
						<h4 className="font-bold text-text mb-2">Governing Law</h4>
						<p>
							These terms are governed by and interpreted in accordance with the
							laws of the Federal Republic of Nigeria.
						</p>
					</section>

					{/* Acceptance of Terms */}
					<section>
						<h4 className="font-bold text-text mb-2">Acceptance of Terms</h4>
						<p>
							By subscribing to any LABELD paid plan, you confirm that you have
							read, understood, and agreed to these Subscription Terms.
						</p>
					</section>
				</div>

				{/* Footer */}
				<div className="p-6 border-t border-stroke flex-shrink-0">
					<Button
						variant="primary"
						className="w-full h-12 text-base"
						text="I Understand"
						onClick={onClose}
					/>
				</div>
			</div>
		</div>
	);
}
