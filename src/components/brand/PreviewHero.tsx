"use client";

import Image from "next/image";
import { useMemo } from "react";
import Button from "../ui/button";

export default function PreviewHero({
	bgFile,
	headline,
	subtext,
	ctaText,
	disabled,
	loading,
	onClick,
}: {
	bgFile?: File | null;
	headline: string;
	subtext: React.ReactNode;
	ctaText: string;
	disabled?: boolean;
	loading?: boolean;
	onClick?: () => void;
}) {
	const src = useMemo(() => {
		if (bgFile) return URL.createObjectURL(bgFile);
		return "/images/onboarding-hero.jpeg";
	}, [bgFile]);

	return (
		<div className="relative flex-1 rounded-[20px] overflow-hidden">
			<Image src={src} alt="" fill priority className="object-cover" />
			<div className="absolute inset-0 bg-gradient-to-t from-bg/85 via-bg/40 to-transparent" />
			{disabled && (
				<div className="absolute inset-0 backdrop-blur-[2px] bg-bg/30 pointer-events-none" />
			)}

			<div className="absolute inset-0 flex items-end">
				<div className="w-full px-6 sm:px-10 pb-10 max-w-xl">
					<h2 className="font-heading font-semibold leading-tight tracking-tight text-3xl sm:text-4xl">
						{headline}
					</h2>
					<p className="mt-3 text-text-muted">{subtext}</p>

					<Button
						text={loading ? "Launching BrandSpace..." : ctaText}
						isLoading={loading}
						disabled={disabled || loading}
						onClick={onClick}
					/>
				</div>
			</div>
		</div>
	);
}
