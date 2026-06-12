"use client";

import Link from "next/link";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import Button from "@/components/ui/button";

interface PaymentReturnPageProps {
	status: "success" | "cancel";
	reference?: string;
}

export default function PaymentReturnPage({
	status,
	reference,
}: PaymentReturnPageProps) {
	const isSuccess = status === "success";

	return (
		<main className="min-h-dvh bg-bg px-4 py-10 text-text">
			<div className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center text-center">
				<div
					className={[
						"flex h-14 w-14 items-center justify-center rounded-full border",
						isSuccess
							? "border-calm-2/30 bg-calm-2/10 text-calm-2"
							: "border-alert/30 bg-alert/10 text-alert",
					].join(" ")}
				>
					{isSuccess ? (
						<CheckCircle2 className="h-7 w-7" />
					) : (
						<XCircle className="h-7 w-7" />
					)}
				</div>

				<h1 className="mt-6 font-unbounded text-2xl font-semibold sm:text-3xl">
					{isSuccess ? "Payment received" : "Payment not completed"}
				</h1>
				<p className="mt-3 text-sm leading-6 text-text-muted sm:text-base">
					{isSuccess
						? "Your credit purchase was successful. Credits are added after Paystack confirms the transaction with Labeld Studio."
						: "Your credit purchase was cancelled or could not be completed. No credits were deducted or added."}
				</p>

				{reference && (
					<div className="mt-5 w-full rounded-xl border border-stroke bg-surface px-4 py-3 text-left">
						<p className="text-xs font-bold uppercase tracking-[0.14em] text-text-muted">
							Reference
						</p>
						<p className="mt-1 break-all text-sm font-semibold text-text">
							{reference}
						</p>
					</div>
				)}

				{isSuccess && (
					<div className="mt-5 flex items-start gap-3 rounded-xl border border-stroke bg-surface px-4 py-3 text-left text-sm text-text-muted">
						<Clock className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
						<p>
							If the balance does not update immediately, give it a moment and refresh
							the waitlist page.
						</p>
					</div>
				)}

				<div className="mt-7 flex w-full flex-col gap-3 sm:flex-row">
					<Link href="/audience/waitlist" className="flex-1">
						<Button className="w-full">
							{isSuccess ? "Back to Waitlist" : "Try Again"}
						</Button>
					</Link>
					<Link href="/wallet" className="flex-1">
						<Button variant="outline" className="w-full">
							View Wallet
						</Button>
					</Link>
				</div>
			</div>
		</main>
	);
}
