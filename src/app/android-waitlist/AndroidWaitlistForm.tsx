"use client";

import { FormEvent, useState } from "react";
import { ArrowRight, Check, Loader2 } from "lucide-react";
import { joinAndroidWaitlist } from "@/lib/firebase/androidWaitlist";

type FormState = {
	email: string;
	name: string;
	brandName: string;
	handle: string;
	country: string;
};

const initialState: FormState = {
	email: "",
	name: "",
	brandName: "",
	handle: "",
	country: "",
};

export function AndroidWaitlistForm() {
	const [form, setForm] = useState<FormState>(initialState);
	const [submitting, setSubmitting] = useState(false);
	const [message, setMessage] = useState("");
	const [success, setSuccess] = useState(false);

	function update<K extends keyof FormState>(key: K, value: FormState[K]) {
		setForm((current) => ({ ...current, [key]: value }));
	}

	async function onSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setSubmitting(true);
		setMessage("");

		try {
			const result = await joinAndroidWaitlist(form);
			setSuccess(true);
			setMessage(result.message);
			if (!result.alreadyJoined) setForm(initialState);
		} catch (error) {
			setSuccess(false);
			setMessage(error instanceof Error ? error.message : "Something went wrong. Try again.");
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<form
			onSubmit={onSubmit}
			className="border border-border bg-surface p-5 shadow-2xl shadow-black/5 sm:p-6"
		>
			<div className="grid gap-3">
				<label className="grid gap-2">
					<span className="font-body text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
						Email for testing access <span className="text-cta">*</span>
					</span>
					<input
						type="email"
						required
						value={form.email}
						onChange={(event) => update("email", event.target.value)}
						placeholder="you@brand.com"
						className="h-12 border border-border bg-bg px-4 font-body text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-cta"
					/>
				</label>

				<div className="grid gap-3 sm:grid-cols-2">
					<label className="grid gap-2">
						<span className="font-body text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
							Name
						</span>
						<input
							value={form.name}
							onChange={(event) => update("name", event.target.value)}
							placeholder="Your name"
							className="h-12 border border-border bg-bg px-4 font-body text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-cta"
						/>
					</label>
					<label className="grid gap-2">
						<span className="font-body text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
							Brand
						</span>
						<input
							value={form.brandName}
							onChange={(event) => update("brandName", event.target.value)}
							placeholder="Brand name"
							className="h-12 border border-border bg-bg px-4 font-body text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-cta"
						/>
					</label>
				</div>

				<div className="grid gap-3 sm:grid-cols-2">
					<label className="grid gap-2">
						<span className="font-body text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
							Brand social handle
						</span>
						<input
							value={form.handle}
							onChange={(event) => update("handle", event.target.value)}
							placeholder="@yourbrand"
							className="h-12 border border-border bg-bg px-4 font-body text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-cta"
						/>
					</label>
					<label className="grid gap-2">
						<span className="font-body text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
							Country
						</span>
						<input
							value={form.country}
							onChange={(event) => update("country", event.target.value)}
							placeholder="Nigeria"
							className="h-12 border border-border bg-bg px-4 font-body text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-cta"
						/>
					</label>
				</div>
			</div>

			<button
				type="submit"
				disabled={submitting}
				className="mt-5 flex h-12 w-full items-center justify-center gap-3 bg-cta px-6 font-heading text-xs font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-cta/90 disabled:opacity-60"
			>
				{submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
				Join Android Waitlist
			</button>

			{message ? (
				<p
					className={`mt-4 flex items-start gap-2 font-body text-sm leading-6 ${
						success ? "text-accent" : "text-alert"
					}`}
				>
					{success ? <Check className="mt-0.5 h-4 w-4 shrink-0" /> : null}
					{message}
				</p>
			) : null}
		</form>
	);
}
