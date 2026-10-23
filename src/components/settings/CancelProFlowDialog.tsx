"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
	CheckCircle,
	Globe,
	Layers,
	LayoutTemplate,
	MessageCircle,
	Percent,
	Store,
} from "lucide-react";
import Button from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { DialogFrame } from "@/components/wallet/AddBankAccountDialog";
import { formatCurrency } from "@/lib/wallet/mock";
import {
	acceptRetentionOffer,
	cancelBrandProSubscription,
	getCancellationSaveContext,
	getRetentionOffer,
	recordCancellationFlow,
	type AcceptOfferResult,
	type CancelReason,
	type CancellationSaveContext,
	type OfferShown,
	type RetentionOffer,
	type SwitchingTo,
} from "@/lib/firebase/callables/proBilling";

/** Labeld team WhatsApp for the "help me get my first sale" offer. */
const SUPPORT_WHATSAPP = "2349064158389";

const REASONS: { code: CancelReason; label: string }[] = [
	{ code: "budget", label: "It doesn't fit my budget" },
	{ code: "no_sales", label: "I'm not making sales yet" },
	{ code: "not_using", label: "I'm not using the Pro features" },
	{ code: "break", label: "I'm taking a break or closing my brand" },
	{
		code: "missing_or_switching",
		label: "Something's missing, or I'm moving platform",
	},
	{ code: "other", label: "Other" },
];

const PLATFORMS: { code: SwitchingTo; label: string }[] = [
	{ code: "shopify", label: "Shopify" },
	{ code: "bumpa", label: "Bumpa" },
	{ code: "social_only", label: "Instagram / WhatsApp only" },
	{ code: "another_platform", label: "Another platform" },
];

// What the matched screen offers for each reason. No money moves here except
// the server-priced retention discount for "budget".
function offerForReason(reason: CancelReason): OfferShown {
	switch (reason) {
		case "no_sales":
			return "help_call";
		case "not_using":
			return "feature_tour";
		case "missing_or_switching":
			return "feedback_board";
		default:
			return "none";
	}
}

const HEADERS: Record<CancelReason, { title: string; body: string }> = {
	budget: {
		title: "Pro isn't for every month",
		body: "If money is tight you can stay on Free. Your store stays live. Here is what changes.",
	},
	no_sales: {
		title: "Let's get your first sale",
		body: "Most stores need one or two changes to start selling. We will help you find them.",
	},
	not_using: {
		title: "Pro can do more for your store",
		body: "A few things you may not have tried yet.",
	},
	break: {
		title: "Taking a break is fine",
		body: "Your store stays live on Free while you are away, and you can come back to Pro anytime.",
	},
	missing_or_switching: {
		title: "Help us fix that",
		body: "Tell us what is missing. We read every suggestion.",
	},
	other: {
		title: "Thanks for telling us",
		body: "Here is what changes if you go ahead.",
	},
};

const day = (d: Date) =>
	new Intl.DateTimeFormat("en-NG", {
		day: "numeric",
		month: "long",
		year: "numeric",
	}).format(d);

type Step = "reason" | "offer" | "done" | "accepted";

interface Props {
	isOpen: boolean;
	onClose: () => void;
	brandName: string;
}

/**
 * Cancel-Pro save flow, same as mobile: reason -> matched offer -> cancel.
 * Cancelling only switches the renewal off; Pro stays active until the paid
 * period ends. The billing screen is realtime so it updates on its own.
 */
export default function CancelProFlowDialog({
	isOpen,
	onClose,
	brandName,
}: Props) {
	const [step, setStep] = useState<Step>("reason");
	const [reason, setReason] = useState<CancelReason | null>(null);
	const [switchingTo, setSwitchingTo] = useState<SwitchingTo | null>(null);
	const [otherText, setOtherText] = useState("");

	const [data, setData] = useState<CancellationSaveContext | null>(null);
	const [retention, setRetention] = useState<RetentionOffer | null>(null);
	const [confirmingOffer, setConfirmingOffer] = useState(false);

	const [submitting, setSubmitting] = useState(false);
	const [accepting, setAccepting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [endDate, setEndDate] = useState<Date | null>(null);
	const [accepted, setAccepted] = useState<AcceptOfferResult | null>(null);

	// Log "left without cancelling" at most once per open
	const logged = useRef(false);

	useEffect(() => {
		if (!isOpen) return;
		logged.current = false;
		setStep("reason");
		setReason(null);
		setSwitchingTo(null);
		setOtherText("");
		setData(null);
		setRetention(null);
		setConfirmingOffer(false);
		setError(null);
		setEndDate(null);
		setAccepted(null);
		let live = true;
		getCancellationSaveContext().then((c) => live && setData(c));
		return () => {
			live = false;
		};
	}, [isOpen]);

	if (!isOpen) return null;

	const shownOffer: OfferShown | null = !reason
		? null
		: reason === "budget" && retention
			? "retention_discount"
			: offerForReason(reason);

	const flow = () => ({
		reason,
		switchingTo,
		offerShown: step === "offer" ? shownOffer : null,
		otherText,
	});

	const leave = (saved: boolean) => {
		if (!logged.current) {
			logged.current = true;
			void recordCancellationFlow(saved, flow());
		}
		onClose();
	};

	// Closing never logs after cancel/accept: those are already recorded.
	const handleClose = () => {
		if (accepting) return;
		if (step === "done" || step === "accepted") return onClose();
		leave(step === "offer" && !!reason);
	};

	const canContinue =
		!!reason && (reason !== "other" || otherText.trim().length > 0);

	const goToOffer = () => {
		setStep("offer");
		setRetention(null);
		setConfirmingOffer(false);
		setError(null);
		if (reason === "budget") {
			getRetentionOffer().then((o) => setRetention(o));
		}
	};

	const cancel = async (skipSurvey = false) => {
		if (submitting || accepting) return;
		setSubmitting(true);
		setError(null);
		try {
			const res = await cancelBrandProSubscription(
				skipSurvey
					? undefined
					: {
							reason,
							switchingTo,
							offerShown: shownOffer,
							otherText,
						},
			);
			logged.current = true;
			setEndDate(res.subscriptionEndsAt ? new Date(res.subscriptionEndsAt) : null);
			setStep("done");
		} catch (e) {
			setError(
				(e as { message?: string })?.message ||
					"Could not cancel Pro renewal. Please try again.",
			);
		} finally {
			setSubmitting(false);
		}
	};

	const accept = async () => {
		if (!retention || accepting) return;
		setAccepting(true);
		setError(null);
		try {
			const res = await acceptRetentionOffer();
			logged.current = true;
			setAccepted(res);
			setConfirmingOffer(false);
			setStep("accepted");
		} catch (e) {
			const message =
				(e as { message?: string })?.message ||
				"Could not apply the offer. Please try again.";
			setError(message);
			setConfirmingOffer(false);
			if (message.includes("isn't available")) setRetention(null);
		} finally {
			setAccepting(false);
		}
	};

	const whatsAppHref = `https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent(
		`Hi Labeld, I'm ${brandName || "a Labeld brand"}. I'm thinking about cancelling Pro because I haven't made sales yet. Can you help me?`,
	)}`;

	const title =
		step === "done"
			? "Cancelled"
			: step === "accepted"
				? "Offer applied"
				: "Cancel Pro";

	return (
		<DialogFrame title={title} onClose={handleClose} className="max-w-xl">
			{step === "reason" && (
				<div className="space-y-5">
					<Header
						title="Before you go"
						body="What's the main reason? It takes a few seconds and helps us make Labeld better."
					/>
					<div className="space-y-2">
						{REASONS.map((r) => (
							<button
								key={r.code}
								type="button"
								onClick={() => {
									setReason(r.code);
									if (r.code !== "budget") setRetention(null);
								}}
								className={`w-full text-left rounded-xl border px-4 py-3 text-sm transition ${
									reason === r.code
										? "border-text bg-surface-neutral text-text font-medium"
										: "border-stroke text-text-muted hover:border-text/40 hover:text-text"
								}`}
							>
								{r.label}
							</button>
						))}
					</div>
					{reason === "other" && (
						<Input
							value={otherText}
							onChange={(e) => setOtherText(e.target.value)}
							placeholder="Tell us in a few words"
							maxLength={300}
							className="text-sm"
						/>
					)}
					{error && <p className="text-sm text-red-400">{error}</p>}
					<div className="flex gap-3 pt-1">
						<Button
							variant="outline"
							text="Keep Pro"
							onClick={() => leave(false)}
							className="flex-1"
						/>
						<Button
							variant={canContinue ? "primary" : "disabled"}
							text="Continue"
							onClick={goToOffer}
							disabled={!canContinue}
							className="flex-1"
						/>
					</div>
					<div className="text-center">
						<button
							type="button"
							onClick={() => cancel(true)}
							disabled={submitting}
							className="text-xs text-text-muted underline hover:text-text disabled:opacity-50"
						>
							{submitting ? "Cancelling..." : "Skip and cancel"}
						</button>
					</div>
				</div>
			)}

			{step === "offer" && reason && (
				<div className="space-y-5">
					<Header {...HEADERS[reason]} />

					{reason === "budget" && retention && (
						<Card
							title={`${formatCurrency(retention.discountKobo)} off your next month`}
							hint="Stay on Pro for one more month at a lower price."
						>
							{confirmingOffer ? (
								<div className="space-y-3">
									<p className="text-sm text-text">
										We will charge {formatCurrency(retention.payKobo)} to the
										card you already use for Pro.
									</p>
									<Line label="Charged today" value={formatCurrency(retention.payKobo)} />
									<Line label="Pro runs until" value={day(retention.extendedUntil)} />
									<Line
										label="From then"
										value={`${formatCurrency(retention.fullKobo)} a month`}
									/>
									<p className="text-xs text-text-muted">
										You can cancel again any time before then.
									</p>
									<div className="flex gap-3">
										<Button
											variant="outline"
											text="Not now"
											onClick={() => setConfirmingOffer(false)}
											disabled={accepting}
											className="flex-1"
										/>
										<Button
											variant="primary"
											text={
												accepting
													? "Processing..."
													: `Pay ${formatCurrency(retention.payKobo)}`
											}
											onClick={accept}
											disabled={accepting}
											className="flex-1"
										/>
									</div>
								</div>
							) : (
								<div className="space-y-3">
									<Line label="You pay today" value={formatCurrency(retention.payKobo)} />
									<Line label="Pro runs until" value={day(retention.extendedUntil)} />
									<p className="text-xs text-text-muted">
										{formatCurrency(retention.fullKobo)} a month, as usual
									</p>
									<Button
										variant="primary"
										text="Accept offer"
										onClick={() => setConfirmingOffer(true)}
										className="w-full"
									/>
								</div>
							)}
						</Card>
					)}

					{reason === "no_sales" && (
						<Card
							title="Free setup help"
							hint="Chat with our team and we'll look at your store with you."
						>
							<Fact
								icon={<Store className="w-4 h-4" />}
								title="We review your store"
								body="Products, photos and links: what to change to get that first order."
							/>
							<a
								href={whatsAppHref}
								target="_blank"
								rel="noopener noreferrer"
								className="mt-2 flex items-center justify-center gap-2 rounded-2xl bg-text text-bg px-4 py-3 text-sm font-semibold hover:opacity-90"
							>
								<MessageCircle className="w-4 h-4" /> Chat on WhatsApp
							</a>
						</Card>
					)}

					{reason === "not_using" && (
						<Card title="Things Pro can do for you">
							{!data?.hasCustomDomain && (
								<Fact
									icon={<Globe className="w-4 h-4" />}
									title="Use your own domain"
									body="yourbrand.com instead of a labeld.app link."
									href="/domains"
								/>
							)}
							<Fact
								icon={<LayoutTemplate className="w-4 h-4" />}
								title="Make your store look yours"
								body="Themes, sections and your own hero."
								href="/brand-space/site-customization"
							/>
						</Card>
					)}

					{reason === "missing_or_switching" && (
						<>
							<Card
								title="Tell us what's missing"
								hint="Suggestions go straight to the team."
							>
								<Link
									href="/settings?section=feature-requests"
									className="inline-block rounded-2xl border border-stroke px-4 py-2.5 text-sm font-semibold text-text hover:bg-surface-neutral"
								>
									Open the feedback board
								</Link>
							</Card>
							<Card
								title="Moving somewhere else?"
								hint="Optional. It helps us see what we should match."
							>
								<div className="flex flex-wrap gap-2">
									{PLATFORMS.map((p) => (
										<button
											key={p.code}
											type="button"
											onClick={() =>
												setSwitchingTo(switchingTo === p.code ? null : p.code)
											}
											className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${
												switchingTo === p.code
													? "bg-text text-bg border-text"
													: "border-stroke text-text hover:border-text/40"
											}`}
										>
											{p.label}
										</button>
									))}
								</div>
							</Card>
						</>
					)}

					{data &&
						(data.productsOverLimit > 0 ||
							data.feeSavedMinor > 0 ||
							data.hasCustomDomain) && (
						<Card title="Your Pro right now">
							{data.productsOverLimit > 0 && (
								<Fact
									icon={<Layers className="w-4 h-4" />}
									title={`${data.productsOverLimit} of your products would stop selling`}
									body={`Free sells your newest ${data.freeProductLimit}. You have ${data.activeProductCount} active.`}
								/>
							)}
							{data.feeSavedMinor > 0 && (
								<Fact
									icon={<Percent className="w-4 h-4" />}
									title="Fees Pro saved you"
									body={
										data.feeSavedSince
											? `Since ${day(data.feeSavedSince)} · ${formatCurrency(data.feeSavedMinor)}`
											: formatCurrency(data.feeSavedMinor)
									}
								/>
							)}
							{data.hasCustomDomain && (
								<Fact
									icon={<Globe className="w-4 h-4" />}
									title="You use a custom domain"
									body="Custom domains are a Pro feature."
								/>
							)}
						</Card>
					)}

					<FreePlanCard productLimit={data?.freeProductLimit ?? 12} />

					{error && <p className="text-sm text-red-400">{error}</p>}

					<div className="flex gap-3 pt-1">
						<Button
							variant="outline"
							text="Keep Pro"
							onClick={() => leave(true)}
							disabled={accepting}
							className="flex-1"
						/>
						<Button
							variant="danger"
							text={submitting ? "Cancelling..." : "Cancel renewal"}
							onClick={() => cancel()}
							disabled={submitting || accepting}
							className="flex-1"
						/>
					</div>
					<div className="text-center">
						<button
							type="button"
							onClick={() => setStep("reason")}
							disabled={submitting || accepting}
							className="text-xs text-text-muted underline hover:text-text"
						>
							Back
						</button>
					</div>
				</div>
			)}

			{step === "done" && (
				<div className="space-y-5 text-center py-2">
					<Done />
					<Header
						centered
						title="Your renewal is cancelled"
						body={`${brandName ? `Hi ${brandName}, thanks` : "Thanks"} for giving Pro a try. ${
							endDate
								? `Pro stays active until ${day(endDate)}.`
								: "Pro stays active until your paid period ends."
						} You will not be charged again.`}
					/>
					<div className="text-left">
						<FreePlanCard
							productLimit={data?.freeProductLimit ?? 12}
							title={endDate ? `After ${day(endDate)}` : "After Pro ends"}
						/>
					</div>
					<Button variant="primary" text="Done" onClick={onClose} className="w-full" />
				</div>
			)}

			{step === "accepted" && accepted && (
				<div className="space-y-5 text-center py-2">
					<Done />
					<Header
						centered
						title="You're all set"
						body={
							accepted.completed
								? `We charged ${formatCurrency(accepted.payKobo)} to your card. ${
										accepted.extendedUntil
											? `Pro is on until ${day(accepted.extendedUntil)}, then `
											: "After this month it is "
									}${formatCurrency(retention?.fullKobo ?? 500000)} a month, unless you cancel.`
								: `Your ${formatCurrency(accepted.payKobo)} payment went through. We are finishing the last step, and your billing page will update in a few minutes.`
						}
					/>
					<Button variant="primary" text="Done" onClick={onClose} className="w-full" />
				</div>
			)}

			{(submitting || accepting) && step !== "done" && step !== "accepted" && (
				<div className="mt-4 flex justify-center">
					<Spinner size="sm" />
				</div>
			)}
		</DialogFrame>
	);
}

function Header({
	title,
	body,
	centered = false,
}: {
	title: string;
	body: string;
	centered?: boolean;
}) {
	return (
		<div className={centered ? "text-center" : ""}>
			<h4 className="font-heading font-semibold text-xl text-text">{title}</h4>
			<p className="mt-2 text-sm text-text-muted leading-relaxed">{body}</p>
		</div>
	);
}

/** What the brand keeps on the Free plan (same facts and wording as mobile). */
function FreePlanCard({
	productLimit,
	title = "On Free you keep",
}: {
	productLimit: number;
	title?: string;
}) {
	return (
		<Card title={title}>
			<Fact icon={<Store className="w-4 h-4" />} title="Your store stays live" />
			<Fact
				icon={<Layers className="w-4 h-4" />}
				title={`Your newest ${productLimit} products keep selling`}
			/>
			<Fact
				icon={<Percent className="w-4 h-4" />}
				title="A 5% Labeld fee applies to storefront sales"
			/>
		</Card>
	);
}

function Done() {
	return (
		<div className="w-14 h-14 mx-auto rounded-full bg-accent/10 flex items-center justify-center">
			<CheckCircle className="w-7 h-7 text-accent" />
		</div>
	);
}

function Card({
	title,
	hint,
	children,
}: {
	title: string;
	hint?: string;
	children: React.ReactNode;
}) {
	return (
		<div className="rounded-2xl border border-stroke bg-bg p-4 space-y-3">
			<div>
				<h5 className="text-sm font-semibold text-text">{title}</h5>
				{hint && <p className="text-xs text-text-muted mt-0.5">{hint}</p>}
			</div>
			<div className="space-y-2">{children}</div>
		</div>
	);
}

function Fact({
	icon,
	title,
	body,
	href,
}: {
	icon: React.ReactNode;
	title: string;
	body?: string;
	href?: string;
}) {
	const inner = (
		<div className="flex items-start gap-3 py-1">
			<div className="p-2 rounded-lg border border-stroke/60 bg-surface text-text">
				{icon}
			</div>
			<div>
				<p className="text-sm font-medium text-text">{title}</p>
				{body && <p className="text-xs text-text-muted mt-0.5">{body}</p>}
			</div>
		</div>
	);
	return href ? (
		<Link href={href} className="block hover:opacity-80">
			{inner}
		</Link>
	) : (
		inner
	);
}

function Line({ label, value }: { label: string; value: string }) {
	return (
		<div className="flex items-center justify-between text-sm">
			<span className="text-text-muted">{label}</span>
			<span className="font-medium text-text">{value}</span>
		</div>
	);
}
