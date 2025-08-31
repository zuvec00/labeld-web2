"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useBrandOnboard } from "@/lib/stores/brandOnboard";
import BrandIdentityForm from "@/components/brand/forms/BrandIdentity";
import BrandVisualsForm from "@/components/brand/forms/BrandVisuals";
import Button from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

/** Simple lock wrapper: blurs + blocks pointer events when locked */
function LockSection({
	locked,
	children,
}: {
	locked: boolean;
	children: React.ReactNode;
}) {
	return (
		<div className="relative">
			{/* content */}
			<div className={locked ? "pointer-events-none select-none" : ""}>
				{children}
			</div>

			{/* blur/overlay */}
			{locked && (
				<div className="absolute inset-0 rounded-[20px] overflow-hidden">
					<div className="absolute inset-0 backdrop-blur-sm bg-bg/30" />
				</div>
			)}
		</div>
	);
}

export default function BrandSetupStep1() {
	const router = useRouter();
	const { brandName, brandUsername, brandCategory, logoFile } =
		useBrandOnboard();

	// same username rule as Flutter
	const usernameValid = useMemo(() => {
		const u = (brandUsername || "").trim();
		if (u.length < 3 || u.length > 15) return false;
		if (/\s/.test(u)) return false;
		const re = /^[a-zA-Z0-9](?!.*[_.]{2})[a-zA-Z0-9._]{1,13}[a-zA-Z0-9]$/;
		return re.test(u);
	}, [brandUsername]);

	// unlock right form only when identity valid
	const identityValid =
		brandName.trim().length > 0 && usernameValid && !!brandCategory;

	// next enabled when identity valid + logo chosen (mirrors Flutter)
	const canGoNext = identityValid && !!logoFile;
	const skip = () => router.push("/dashboard");

	return (
		<div className="min-h-dvh bg-bg text-text grid grid-cols-1 lg:grid-cols-2">
			{/* LEFT: Brand Identity */}
			<section className="flex justify-center m-8">
				<div className="w-full max-w-xl">
					<div className="">
						<h3 className="font-heading font-semibold text-2xl ">
							Brand Identity
						</h3>
						<p className="text-text-muted mt-1">Let’s start with the basics</p>
						<div className="mt-5">
							<BrandIdentityForm />
						</div>
					</div>
				</div>
			</section>

			{/* RIGHT: Brand Visuals (locked until identity valid) */}
			<section className="m-8">
				<LockSection locked={!identityValid}>
					<div className="">
						<h3 className="font-heading font-semibold text-2xl">Brand Looks</h3>
						<p className="text-text-muted mt-1">
							Build your brand’s first impression
						</p>

						<div className="mt-5">
							<BrandVisualsForm />
						</div>

						{/* Next CTA – go to step 2 when ready */}
						<div className="mt-6">
							<button
								onClick={() => router.push("/brand/setup/finish")}
								disabled={!canGoNext}
								className={`w-full rounded-[12px] px-4 py-3 font-semibold transition ${
									canGoNext
										? "bg-cta text-text hover:opacity-90"
										: "bg-stroke text-text-muted cursor-not-allowed"
								}`}
							>
								Next: Your Story
							</button>
							{!identityValid && (
								<p className="mt-2 text-xs text-text-muted">
									Complete{" "}
									<span className="font-semibold text-text">
										Brand Identity
									</span>{" "}
									to unlock this section.
								</p>
							)}
						</div>
					</div>
				</LockSection>
			</section>
			{/* Floating Skip (bottom-left) */}
			<div className="fixed left-4 bottom-4 lg:left-8 lg:bottom-8 z-50">
				<Button
					text="Skip"
					variant="secondary"
					className="shadow-sm"
					onClick={skip}
					rightIcon={
						<ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
					}
				/>
			</div>
		</div>
	);
}
