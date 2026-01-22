"use client";

import { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import {
	fetchUserDoc,
	doesBrandDocExist,
} from "@/lib/firebase/queries/brandspace";
import Button from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import RadarTab from "@/components/brand/brandspace/Radar/RadarTab";

type GateState =
	| { status: "loading" }
	| { status: "unauthenticated" }
	| {
			status: "incomplete";
			reason: "no-user" | "brand-not-setup" | "brand-doc-missing";
	  }
	| { status: "complete"; uid: string };

export default function RadarPage() {
	const router = useRouter();
	const [state, setState] = useState<GateState>({ status: "loading" });

	useEffect(() => {
		const auth = getAuth();
		const unsub = onAuthStateChanged(auth, async (user) => {
			if (!user) {
				setState({ status: "unauthenticated" });
				return;
			}
			try {
				// 1) read user doc
				const userDoc = await fetchUserDoc(user.uid);
				if (!userDoc) {
					setState({ status: "incomplete", reason: "no-user" });
					return;
				}

				// 3) brand doc must exist as brands/{uid}
				const exists = await doesBrandDocExist(user.uid);
				if (!exists) {
					setState({ status: "incomplete", reason: "brand-doc-missing" });
					return;
				}

				// ✅ all good
				setState({ status: "complete", uid: user.uid });
			} catch (e) {
				console.error(e);
				setState({ status: "incomplete", reason: "brand-not-setup" });
			}
		});
		return () => unsub();
	}, []);

	// UI states
	if (state.status === "loading") {
		return (
			<div className="min-h-dvh grid place-items-center">
				<Spinner size="lg" />
				<p className="text-text-muted">Checking your BrandSpace…</p>
			</div>
		);
	}

	if (state.status === "unauthenticated") {
		return (
			<div className="min-h-dvh grid place-items-center">
				<div className="text-center">
					<h1 className="font-heading font-semibold text-2xl">
						Sign in to continue
					</h1>
					<p className="text-text-muted mt-2">
						You need an account to access Radar.
					</p>
					<Button
						text="Go to Sign In"
						className="mt-4"
						onClick={() => router.push("/")}
					/>
				</div>
			</div>
		);
	}

	if (state.status === "incomplete") {
		const copy = {
			"no-user": {
				title: "Finish setting up your profile",
				subtitle: "We couldn't find your user record.",
				cta: "Go to Profile Setup",
				href: "/user/setup",
			},
			"brand-not-setup": {
				title: "Launch your BrandSpace",
				subtitle:
					"Get started to share you content and let the culture see what your brand represents",
				cta: "Start Onboarding",
				href: "/brand-space/setup",
			},
			"brand-doc-missing": {
				title: "We couldn't find your BrandSpace",
				subtitle:
					"Your setup shows as complete, but the brand record is missing. Let's recreate it.",
				cta: "Fix Now",
				href: "/brand-space/setup",
			},
		}[state.reason]!;

		return (
			<div className="min-h-dvh grid place-items-center px-6">
				<div className="max-w-md text-center">
					<h1 className="font-heading font-semibold text-2xl">{copy.title}</h1>
					<p className="text-text-muted mt-2">{copy.subtitle}</p>
					<Button
						text={copy.cta}
						className="mt-5"
						variant="primary"
						onClick={() => router.push(copy.href)}
					/>
				</div>
			</div>
		);
	}

	// ✅ status === "complete"
	return <RadarTab brandId={state.uid} isBrand={true} />;
}
