"use client";

import Image from "next/image";
import { useMemo } from "react";
import Button from "../ui/button";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";

export default function LaunchHero({
	previewFile,
	displayName,
	disabled,
	loading = false, // NEW
	isBrand,
	onLaunch,
	dashboardPath = "/dashboard",
}: {
	previewFile: File | null;
	displayName: string;
	disabled: boolean;
	loading?: boolean; // NEW
	isBrand: boolean;
	onLaunch: () => void;
	dashboardPath?: string;
}) {
	const router = useRouter();

	// derive preview URL (falls back to your stock hero)
	const src = useMemo(() => {
		if (previewFile) return URL.createObjectURL(previewFile);
		return "/images/profile-hero.JPG";
	}, [previewFile]);

	// derive title & blurb based on brand vs non-brand
	const title = isBrand ? "Launch Your Brand" : "You’re Good to Go";
	const blurb = isBrand ? (
		displayName ? (
			<>
				Ready, <span className="text-text">{displayName}</span>? Let’s make your
				BrandSpace live.
			</>
		) : (
			<>Fill your profile on the left to unlock your BrandSpace.</>
		)
	) : displayName ? (
		<>
			Nice, <span className="text-text">{displayName}</span>. Head to your
			dashboard to get started.
		</>
	) : (
		<>Jump into your dashboard and start exploring.</>
	);

	// Go to dashboard when not a brand
	const goToDashboard = () => router.push(dashboardPath);

	return (
		<div className="relative flex-1 rounded-[20px] overflow-hidden">
			<Image src={src} alt="" fill priority className="object-cover" />
			<div className="absolute inset-0 bg-gradient-to-t from-bg/85 via-bg/40 to-transparent" />

			{/* Keep the blur/lock behavior tied to `disabled` regardless of brand */}
			{disabled && (
				<div className="absolute inset-0 backdrop-blur-[2px] bg-bg/30 pointer-events-none" />
			)}

			<div className="absolute inset-0 flex items-end">
				<div className="w-full px-6 sm:px-10 pb-10 max-w-xl">
					<h2 className="font-heading font-semibold leading-tight tracking-tight text-3xl sm:text-3xl">
						<span className="block">{title}</span>
					</h2>
					<p className="mt-3 text-text-muted">{blurb}</p>

					{/* CTA(s) */}

					{isBrand ? (
						<div className="flex justify-between">
							<Button
								text="Launch My BrandSpace"
								className="mt-6"
								isLoading={loading} // ✅ only spin when saving
								loadingText="Launching..."
								onClick={onLaunch}
								disabled={disabled}
							/>
							<Button
								text="Skip"
								className="mt-6"
								variant="secondary"
								disabled={loading} // let Skip work even if form invalid
								onClick={() => router.push("/brand/setup")}
								rightIcon={<ArrowRight className="ml-2 h-4 w-4" />}
							/>
						</div>
					) : (
						<div className="flex">
							<Button
								text="Go to Dashboard"
								className="mt-6"
								variant="cta"
								isLoading={loading} // ✅ only spin when loading
								disabled={loading}
								onClick={() => router.push(dashboardPath)}
							/>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
