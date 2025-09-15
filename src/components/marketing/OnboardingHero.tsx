"use client";

import AuthForm from "@/app/marketing/auth/AuthFom";
import Image from "next/image";
import { useState, useRef, useEffect } from "react";
// import AuthForm from "./auth/AuthForm";

export default function OnboardingSplit() {
	const [mode, setMode] = useState<"login" | "signup">("login");
	const [showVideo, setShowVideo] = useState(true);
	const videoRef = useRef<HTMLVideoElement>(null);

	// Handle video errors and fallback to image
	useEffect(() => {
		const video = videoRef.current;
		if (!video) return;

		const handleVideoError = () => {
			console.log("Video failed to load, falling back to image");
			setShowVideo(false);
		};

		const handleVideoLoadStart = () => {
			// Set a timeout to fallback if video doesn't start playing within 5 seconds
			const timeout = setTimeout(() => {
				if (video.readyState < 3) {
					// HAVE_FUTURE_DATA or higher
					console.log("Video took too long to load, falling back to image");
					setShowVideo(false);
				}
			}, 5000);

			// Clear timeout if video starts playing
			const handleCanPlay = () => {
				clearTimeout(timeout);
			};

			video.addEventListener("canplay", handleCanPlay, { once: true });
			video.addEventListener("error", handleVideoError);

			return () => {
				clearTimeout(timeout);
				video.removeEventListener("canplay", handleCanPlay);
				video.removeEventListener("error", handleVideoError);
			};
		};

		video.addEventListener("loadstart", handleVideoLoadStart, { once: true });

		return () => {
			video.removeEventListener("loadstart", handleVideoLoadStart);
		};
	}, []);

	return (
		<div className="min-h-dvh bg-bg text-text">
			{/* Mobile Layout */}
			<div className="lg:hidden">
				{/* Mobile Hero Section */}
				<section className="relative h-[50vh] min-h-[400px]">
					{/* Video with fallback to image */}
					{showVideo ? (
						<video
							ref={videoRef}
							autoPlay
							loop
							muted
							playsInline
							className="object-cover w-full h-full"
							poster="/images/onboarding.JPG"
							onError={() => setShowVideo(false)}
						>
							<source src="/videos/intro.mp4" type="video/mp4" />
							Your browser does not support the video tag.
						</video>
					) : (
						<Image
							src="/images/onboarding.JPG"
							alt="Creators showcasing a label drop"
							fill
							priority
							className="object-cover"
						/>
					)}
					{/* Mobile overlay for contrast */}
					<div className="absolute inset-0 bg-gradient-to-t from-bg/90 via-bg/50 to-transparent" />

					{/* Mobile Hero Text */}
					<div className="absolute inset-0 flex items-end">
						<div className="w-full px-6 pb-8">
							<h1 className="font-heading font-semibold text-3xl leading-tight tracking-tight">
								<span className="block">LABELD is Where</span>
								<span className="block text-accent">Culture Drops</span>
							</h1>
							<p className="mt-3 text-sm text-text-muted">
								From statement fits to bold ideas. Labeld is where culture
								connects and comes alive.
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
					{/* Video with fallback to image */}
					{showVideo ? (
						<video
							ref={videoRef}
							autoPlay
							loop
							muted
							playsInline
							className="object-cover rounded-[20px] w-full h-full absolute inset-0"
							poster="/images/onboarding.JPG"
							onError={() => setShowVideo(false)}
						>
							<source src="/videos/intro.mp4" type="video/mp4" />
							Your browser does not support the video tag.
						</video>
					) : (
						<Image
							src="/images/onboarding.JPG"
							alt="Creators showcasing a label drop"
							fill
							priority
							className="object-cover rounded-[20px]"
						/>
					)}
					{/* Desktop overlay for contrast */}
					<div className="absolute inset-0 bg-gradient-to-t from-bg/85 via-bg/40 to-transparent rounded-[20px]" />

					{/* Desktop Hero Text */}
					<div className="absolute inset-0 flex items-end">
						<div className="w-full px-6 sm:px-10 pb-12 max-w-xl">
							<h1 className="font-heading font-semibold text-4xl sm:text-5xl xl:text-[40px] leading-tight tracking-tight">
								<span className="">LABELD is Where</span>
								<span className="block text-accent">Culture Drops</span>
							</h1>
							<p className="mt-4 text-base sm:text-lg text-text-muted max-w-md">
								From statement fits to bold ideas.
							</p>
							<p className="text-base sm:text-lg text-text-muted max-w-md">
								Labeld is where culture connects and comes alive.
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
