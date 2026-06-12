"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ImagePlus, MailCheck, Send, Zap } from "lucide-react";
import Button from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Textarea from "@/components/ui/textarea";
import { useToast } from "@/app/hooks/use-toast";
import { sendWaitlistNotification } from "@/lib/firebase/queries/waitlist";
import { uploadImageCloudinary } from "@/lib/storage/cloudinary";
import PurchaseCreditsDialog from "./PurchaseCreditsDialog";
import { useWaitlistData } from "./useWaitlistData";

function normalizeTag(tag?: string | null): string {
	return tag?.trim() || "general";
}

function formatNumber(value: number): string {
	return new Intl.NumberFormat("en-NG").format(value);
}

export default function NotifyWaitlistForm() {
	const router = useRouter();
	const { toast } = useToast();
	const {
		user,
		brandId,
		activeEntries,
		tagOptions,
		credits,
		loading,
		error,
	} = useWaitlistData();
	const [audience, setAudience] = useState("everyone");
	const [subject, setSubject] = useState("We just dropped");
	const [message, setMessage] = useState("");
	const [ctaText, setCtaText] = useState("");
	const [ctaLink, setCtaLink] = useState("");
	const [imageFile, setImageFile] = useState<File | null>(null);
	const [sending, setSending] = useState(false);
	const [creditsOpen, setCreditsOpen] = useState(false);

	const recipients = useMemo(() => {
		if (audience === "everyone") return activeEntries;
		return activeEntries.filter((entry) => normalizeTag(entry.context) === audience);
	}, [activeEntries, audience]);

	const recipientCount = recipients.length;
	const hasEnoughCredits = credits >= recipientCount;
	const canSend =
		Boolean(subject.trim()) &&
		Boolean(message.trim()) &&
		recipientCount > 0 &&
		hasEnoughCredits &&
		!sending;

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (!canSend) {
			if (!hasEnoughCredits) setCreditsOpen(true);
			return;
		}

		setSending(true);
		try {
			let heroImage: string | undefined;
			if (imageFile) {
				heroImage = await uploadImageCloudinary(imageFile, {
					folder: `waitlist-notifications/${brandId}`,
					tags: ["waitlist-notification", brandId],
				});
			}

			const result = await sendWaitlistNotification({
				brandId,
				subject: subject.trim(),
				message: message.trim(),
				contextFilter: audience === "everyone" ? undefined : audience,
				ctaText: ctaText.trim() || undefined,
				ctaLink: ctaLink.trim() || undefined,
				heroImage,
			});

			toast({
				title: "Notification sent",
				description: `Sent to ${formatNumber(result.data.sentCount || recipientCount)} people.`,
			});
			router.push("/audience/waitlist");
		} catch (error) {
			toast({
				variant: "destructive",
				title: "Could not send notification",
				description:
					error instanceof Error ? error.message : "Please check your campaign and try again.",
			});
		} finally {
			setSending(false);
		}
	}

	if (loading) {
		return (
			<div className="space-y-6">
				<div className="h-28 animate-pulse rounded-2xl bg-surface" />
				<div className="h-[520px] animate-pulse rounded-2xl bg-surface" />
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
				<div>
					<Link
						href="/audience/waitlist"
						className="inline-flex items-center gap-2 text-sm font-semibold text-text-muted hover:text-text"
					>
						<ArrowLeft className="h-4 w-4" />
						Back to waitlist
					</Link>
					<h1 className="mt-4 font-unbounded text-2xl font-semibold text-text sm:text-3xl">
						Notify Waitlist
					</h1>
					<p className="mt-2 max-w-2xl text-sm leading-6 text-text-muted sm:text-base">
						Send one clean announcement to the people already waiting for your next
						product, drop, or storefront moment.
					</p>
				</div>
				<div className="rounded-2xl border border-stroke bg-surface p-4">
					<p className="text-xs font-bold uppercase tracking-[0.14em] text-text-muted">
						Available credits
					</p>
					<div className="mt-2 flex items-center gap-2 font-unbounded text-xl font-semibold text-text">
						<Zap className="h-5 w-5 text-accent" />
						{formatNumber(credits)}
					</div>
				</div>
			</div>

			{error && (
				<div className="rounded-2xl border border-alert/30 bg-alert/10 p-4 text-sm text-alert">
					{error}
				</div>
			)}

			<form onSubmit={handleSubmit} className="grid gap-6 xl:grid-cols-[1fr_360px]">
				<div className="space-y-5 rounded-2xl border border-stroke bg-surface p-4 sm:p-6">
					<div>
						<label className="text-sm font-semibold text-text">Target Audience</label>
						<div className="mt-3 flex flex-wrap gap-2">
							<button
								type="button"
								onClick={() => setAudience("everyone")}
								className={[
									"rounded-full border px-4 py-2 text-sm font-semibold transition",
									audience === "everyone"
										? "border-accent bg-accent text-bg"
										: "border-stroke bg-bg text-text-muted hover:text-text",
								].join(" ")}
							>
								Everyone
							</button>
							{tagOptions.map((tag) => (
								<button
									key={tag}
									type="button"
									onClick={() => setAudience(tag)}
									className={[
										"rounded-full border px-4 py-2 text-sm font-semibold transition",
										audience === tag
											? "border-accent bg-accent text-bg"
											: "border-stroke bg-bg text-text-muted hover:text-text",
									].join(" ")}
								>
									{tag}
								</button>
							))}
						</div>
					</div>

					<label className="block text-sm font-semibold text-text">
						Subject
						<Input
							value={subject}
							onChange={(event) => setSubject(event.target.value)}
							required
							className="mt-2"
							placeholder="Your drop is live"
						/>
					</label>

					<label className="block text-sm font-semibold text-text">
						Message
						<Textarea
							value={message}
							onChange={(event) => setMessage(event.target.value)}
							required
							rows={8}
							className="mt-2"
							placeholder="Write the announcement the way your brand would say it."
						/>
					</label>

					<div className="grid gap-4 md:grid-cols-2">
						<label className="block text-sm font-semibold text-text">
							CTA Button Text
							<Input
								value={ctaText}
								onChange={(event) => setCtaText(event.target.value)}
								className="mt-2"
								placeholder="Shop the drop"
							/>
						</label>
						<label className="block text-sm font-semibold text-text">
							Destination Link
							<Input
								type="url"
								value={ctaLink}
								onChange={(event) => setCtaLink(event.target.value)}
								className="mt-2"
								placeholder="https://..."
							/>
						</label>
					</div>

					<label className="block rounded-2xl border border-dashed border-stroke bg-bg p-5 text-sm text-text">
						<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
							<div className="flex items-center gap-3">
								<div className="rounded-xl bg-surface p-3 text-accent">
									<ImagePlus className="h-5 w-5" />
								</div>
								<div>
									<div className="font-semibold">Campaign image</div>
									<div className="text-text-muted">
										Optional image for the email hero.
									</div>
								</div>
							</div>
							<span className="font-semibold text-accent">
								{imageFile ? imageFile.name : "Choose file"}
							</span>
						</div>
						<input
							type="file"
							accept="image/*"
							className="sr-only"
							onChange={(event) => setImageFile(event.target.files?.[0] || null)}
						/>
					</label>
				</div>

				<aside className="h-fit rounded-2xl border border-stroke bg-surface p-4 sm:p-6">
					<div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent">
						<MailCheck className="h-6 w-6" />
					</div>
					<h2 className="mt-4 font-unbounded text-lg font-semibold text-text">
						Send Summary
					</h2>
					<div className="mt-5 space-y-4 text-sm">
						<div className="flex items-center justify-between gap-4">
							<span className="text-text-muted">Recipients</span>
							<span className="font-semibold text-text">{formatNumber(recipientCount)}</span>
						</div>
						<div className="flex items-center justify-between gap-4">
							<span className="text-text-muted">Credits required</span>
							<span className="font-semibold text-text">{formatNumber(recipientCount)}</span>
						</div>
						<div className="flex items-center justify-between gap-4">
							<span className="text-text-muted">After send</span>
							<span className={hasEnoughCredits ? "font-semibold text-text" : "font-semibold text-alert"}>
								{formatNumber(Math.max(credits - recipientCount, 0))}
							</span>
						</div>
					</div>

					{recipientCount === 0 && (
						<p className="mt-5 rounded-xl bg-bg p-3 text-sm text-text-muted">
							No active recipients match this audience.
						</p>
					)}

					{!hasEnoughCredits && recipientCount > 0 && (
						<div className="mt-5 rounded-xl border border-alert/30 bg-alert/10 p-3 text-sm text-alert">
							You need {formatNumber(recipientCount)} credits to send this campaign.
							<Button
								type="button"
								className="mt-3 w-full"
								onClick={() => setCreditsOpen(true)}
							>
								Top Up Credits
							</Button>
						</div>
					)}

					<Button
						type="submit"
						disabled={!canSend}
						isLoading={sending}
						loadingText={imageFile ? "Uploading and sending..." : "Sending..."}
						className="mt-6 w-full"
						leftIcon={<Send className="h-4 w-4" />}
					>
						Send to {formatNumber(recipientCount)} people
					</Button>
				</aside>
			</form>

			<PurchaseCreditsDialog
				open={creditsOpen}
				onClose={() => setCreditsOpen(false)}
				brandId={brandId}
				email={user?.email}
			/>
		</div>
	);
}
