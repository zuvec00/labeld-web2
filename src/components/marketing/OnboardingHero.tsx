"use client";

import AuthForm from "@/app/marketing/auth/AuthFom";
import Image from "next/image";
import { useState, useRef, useEffect } from "react";

function VideoWithFallback({
	src = "/videos/intro2.MP4",
	poster = "/images/onboarding.JPG",
	className = "",
}: {
	src?: string;
	poster?: string;
	className?: string;
}) {
	const ref = useRef<HTMLVideoElement | null>(null);
	const [useImage, setUseImage] = useState(false);

	useEffect(() => {
		const v = ref.current;
		if (!v) return;

		const onError = () => {
			console.log("Video failed to load, falling back to image");
			setUseImage(true);
		};

		const onCanPlay = () => {
			v.play().catch(() => {
				console.log("Video play failed, falling back to image");
				setUseImage(true);
			});
		};

		v.addEventListener("error", onError);
		v.addEventListener("canplay", onCanPlay);

		// Safety timeout in case canplay never fires
		const t = setTimeout(() => {
			if (v.readyState < 2) {
				console.log("Video took too long to load, falling back to image");
				setUseImage(true);
			}
		}, 3000);

		return () => {
			clearTimeout(t);
			v.removeEventListener("error", onError);
			v.removeEventListener("canplay", onCanPlay);
		};
	}, []);

	if (useImage) {
		return (
			<Image
				src={poster}
				alt="Creators showcasing a label drop"
				fill
				priority
				className={className}
			/>
		);
	}

	return (
		<video
			ref={ref}
			className={className}
			poster={poster}
			autoPlay
			muted
			loop
			playsInline
			preload="metadata"
			onError={() => setUseImage(true)}
		>
			<source src={src} type="video/mp4" />
			<source src="/videos/intro2.mp4" type="video/mp4" />
			Your browser does not support the video tag.
		</video>
	);
}

export default function OnboardingSplit() {
	const [mode, setMode] = useState<"login" | "signup">("login");

	return (
		<div className="min-h-dvh bg-bg text-text">
			{/* Mobile Layout */}
			<div className="lg:hidden">
				{/* Mobile Hero Section */}
				<section className="relative h-[50vh] min-h-[400px]">
					<VideoWithFallback className="object-cover w-full h-full" />
					{/* Mobile overlay for contrast */}
					<div className="absolute inset-0 bg-gradient-to-t from-bg/90 via-bg/50 to-transparent" />

					{/* Mobile Hero Text */}
					<div className="absolute inset-0 flex items-end">
						<div className="w-full px-6 pb-8">
							<h1 className="font-heading font-semibold text-3xl leading-tight tracking-tight">
								<span className="block">
									LABELD <span className="text-text">STUDIO</span>
								</span>
								<span className="block">
									Your <span className="text-accent">Creative</span> Hub
								</span>
							</h1>
							<p className="mt-3 text-sm text-text-muted">
								Manage your brand, create events, and drop culture that
								connects.
							</p>
						</div>
					</div>
				</section>

				{/* Mobile Auth Section */}
				<section className="px-4 py-8 bg-bg">
					<div className="w-full max-w-sm mx-auto">
						<AuthForm mode={mode} onModeChange={setMode} />
					</div>
				</section>
			</div>

			{/* Desktop Layout */}
			<div className="hidden lg:grid lg:grid-cols-2 min-h-dvh">
				{/* LEFT: Hero */}
				<section className="relative m-8">
					<VideoWithFallback className="object-cover rounded-[20px] w-full h-full absolute inset-0" />
					{/* Desktop overlay for contrast */}
					<div className="absolute inset-0 bg-gradient-to-t from-bg/85 via-bg/40 to-transparent rounded-[20px]" />

					{/* Desktop Hero Text */}
					<div className="absolute inset-0 flex items-end">
						<div className="w-full px-6 sm:px-10 pb-12 max-w-xl">
							<h1 className="font-heading font-semibold text-4xl sm:text-5xl xl:text-[40px] leading-tight tracking-tight">
								<span className="">
									LABELD <span className="text-text">STUDIO</span>
								</span>
								<span className="block">
									Your <span className="text-accent">Creative</span> Hub
								</span>
							</h1>
							<p className="mt-4 text-base sm:text-lg text-text-muted max-w-md">
								Manage your brand, create events, and drop culture that
								connects.
							</p>
						</div>
					</div>
				</section>

				{/* RIGHT: Auth */}
				<section className="flex justify-center m-8 py-16 px-4 sm:px-8 bg-bg">
					<div className="w-full max-w-md">
						<AuthForm mode={mode} onModeChange={setMode} />
					</div>
				</section>
			</div>
		</div>
	);
}
