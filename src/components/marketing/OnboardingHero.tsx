"use client";

import AuthForm from "@/app/marketing/auth/AuthFom";
import { useAuth } from "@/lib/auth/AuthContext";
import BrandOnboardingModal from "./BrandOnboardingModal";
import EventOrganizerOnboardingModal from "./EventOrganizerOnboardingModal";
import Image from "next/image";
import { startTransition, Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import BrandRegistrationModal from "./BrandRegistrationModal";

function VideoWithFallback({
	src = "/videos/intro.mp4",
	poster = "/images/onboarding.JPG",
	className = "",
}: {
	src?: string;
	poster?: string;
	className?: string;
}) {
	const ref = useRef<HTMLVideoElement | null>(null);
	const [useImage, setUseImage] = useState(false);
	const [isMounted, setIsMounted] = useState(false);

	// Only render video on client to avoid hydration mismatch
	useEffect(() => {
		setIsMounted(true);
	}, []);

	useEffect(() => {
		if (!isMounted) return;
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
	}, [isMounted]);

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

	// Show poster image during SSR to avoid hydration mismatch
	if (!isMounted) {
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
			suppressHydrationWarning
		>
			<source src={src} type="video/mp4" />
			<source src="/videos/intro.mp4" type="video/mp4" />
			Your browser does not support the video tag.
		</video>
	);
}

// Action Card Component
function ActionCard({
	title,
	description,
	backgroundImage,
	onClick,
	className = "",
	hoverBorderColor = "accent",
}: {
	title: string;
	description: string;
	backgroundImage: string;
	onClick: () => void;
	className?: string;
	hoverBorderColor?: string; // accepts a tailwind color key, e.g., 'accent', 'cta', or custom color class
}) {
	// Note: hoverBorderColor prop is available for future use

	return (
		<button
			onClick={onClick}
			className={`group relative aspect-[3/2] w-full rounded-[20px] overflow-hidden border border-stroke bg-surface transition-all duration-300 hover:border-accent ${className}`}
		>
			{/* Background Image */}
			<div className="absolute inset-0">
				<Image
					src={backgroundImage}
					alt={title}
					fill
					className="object-cover group-hover:scale-105 transition-transform duration-300"
				/>
				{/* Overlay */}
				<div className="absolute inset-0 [#0b0b0b]-gradient-to-t from-[#0b0b0b]/90 via-[#0b0b0b]/50 to-transparent" />
			</div>

			{/* Content */}
			<div className="absolute inset-0 flex flex-col justify-end p-6">
				<h3 className="font-heading font-semibold text-xl text-white mb-2">
					{title}
				</h3>
				<p className="text-sm text-white/80">{description}</p>
			</div>
		</button>
	);
}

// Auth Modal Component
function AuthModal({
	isOpen,
	onClose,
	mode,
	onModeChange,
	redirectPath,
}: {
	isOpen: boolean;
	onClose: () => void;
	mode: "login" | "signup";
	onModeChange: (mode: "login" | "signup") => void;
	redirectPath?: string;
}) {
	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
			{/* Backdrop */}
			<div
				className="absolute inset-0 bg-bg/80 backdrop-blur-sm"
				onClick={onClose}
			/>

			{/* Modal Content */}
			<div className="relative bg-bg border border-stroke rounded-2xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
				{/* Close Button */}
				<button
					onClick={onClose}
					className="absolute top-4 right-4 text-text-muted hover:text-text transition-colors"
				>
					<svg
						className="w-6 h-6"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				</button>

				<AuthForm
					mode={mode}
					onModeChange={onModeChange}
					redirectPath={redirectPath}
				/>
			</div>
		</div>
	);
}

// Popup Trigger Component
function PopupTrigger({ onTrigger }: { onTrigger: () => void }) {
	const searchParams = useSearchParams();

	useEffect(() => {
		if (searchParams?.get("popup") === "true") {
			// Small delay to ensure modal is ready
			const t = setTimeout(() => {
				onTrigger();
			}, 500);
			return () => clearTimeout(t);
		}
	}, [searchParams, onTrigger]);

	return null;
}

export default function OnboardingSplit() {
	const [mode, setMode] = useState<"login" | "signup">("login");
	const [showAuthModal, setShowAuthModal] = useState(false);
	const [showBrandModal, setShowBrandModal] = useState(false);
	const [showRegistrationModal, setShowRegistrationModal] = useState(false);
	const [showEventModal, setShowEventModal] = useState(false);
	const [authRedirectPath, setAuthRedirectPath] = useState<string | undefined>(
		undefined,
	);

	const router = useRouter();
	const pathname = usePathname();
	const { user } = useAuth();

	const handleLaunchBrand = () => {
		router.push("/onboarding?step=profile");
	};

	const handleRegistrationClose = () => {
		setShowRegistrationModal(false);
		router.replace(pathname);
	};

	const handleOpenAuth = () => {
		setMode("signup");
		setShowAuthModal(true);
	};

	const handleDropEvents = () => {
		// Show event organizer onboarding modal instead of auth modal
		// setShowEventModal(true);
		// New Flow:
		router.push("/onboarding?mode=event&step=profile");
	};

	const handleLoginClick = () => {
		setMode("login");
		setShowAuthModal(true);
	};

	const handleSignupClick = () => {
		setMode("signup");
		setShowAuthModal(true);
	};

	// Auth Trigger Component
	function AuthTrigger({
		onTrigger,
	}: {
		onTrigger: (mode: "login" | "signup") => void;
	}) {
		const searchParams = useSearchParams();

		useEffect(() => {
			const authMode = searchParams?.get("auth");
			if (authMode === "login" || authMode === "signup") {
				// Small delay to ensure modal is ready
				const t = setTimeout(() => {
					onTrigger(authMode);
				}, 500);
				return () => clearTimeout(t);
			}
		}, [searchParams, onTrigger]);

		return null;
	}

	return (
		<div className="min-h-dvh bg-bg text-text">
			{/* Mobile Layout */}
			<div className="lg:hidden">
				{/* Mobile Hero Section */}
				<section className="relative h-[50vh] min-h-[400px]">
					<VideoWithFallback className="object-cover w-full h-full" />
					{/* Mobile overlay for contrast */}
					<div className="absolute inset-0 [#0b0b0b]-gradient-to-t from-[#0b0b0b]/90 via-[#0b0b0b]/50 to-transparent" />

					{/* Mobile Hero Text */}
					<div className="absolute inset-0 flex items-end">
						<div className="w-full px-6 pb-8">
							<h1 className="font-heading font-semibold text-3xl leading-tight tracking-tight">
								<span className="block text-[#FAF7F1]">
									LABELD <span className="text-[#FAF7F1]">STUDIO</span>
								</span>
								<span className="block text-[#FAF7F1]">
									Your <span className="text-accent">Creative</span> Hub
								</span>
							</h1>
							<p className="mt-3 text-sm text-[#FAF7F1]">
								Manage your brand, create events, and drop culture that
								connects.
							</p>
						</div>
					</div>
				</section>

				{/* Mobile Action Cards Section */}
				<section className="px-4 py-8 bg-bg">
					<div className="w-full max-w-sm mx-auto space-y-4">
						{/* Action Cards */}
						<div className="space-y-4">
							<ActionCard
								title="Launch Your Brand"
								description="Set up your brand space, upload merch, manage orders, and track your sales."
								backgroundImage="/images/cerenity.jpg"
								onClick={handleLaunchBrand}
							/>
							<ActionCard
								title="Drop Events"
								// hoverBorderColor="accent"
								description="Create ticketed events, sell merch, and manage attendee check-ins."
								backgroundImage="/images/dj.jpg"
								onClick={handleDropEvents}
							/>
						</div>

						{/* Auth CTA */}
						<div className="mt-6 text-center space-y-2">
							<p className="text-sm text-text-muted">
								Already have an account?{" "}
								<button
									onClick={handleLoginClick}
									className="text-cta font-semibold hover:underline"
								>
									Log In
								</button>
							</p>
							{/* <p className="text-sm text-text-muted">
								New here?{" "}
								<button
									onClick={handleSignupClick}
									className="text-cta font-semibold hover:underline"
								>
									Join the Culture
								</button>
							</p> */}
						</div>
					</div>
				</section>
			</div>

			{/* Desktop Layout */}
			<div className="hidden lg:grid lg:grid-cols-2 min-h-dvh">
				{/* LEFT: Hero */}
				<section className="relative m-8">
					<VideoWithFallback className="object-cover rounded-[20px] w-full h-full absolute inset-0" />
					{/* Desktop overlay for contrast */}
					<div className="absolute inset-0 [#0b0b0b]-gradient-to-t from-[#0b0b0b]/85 via-[#0b0b0b]/40 to-transparent rounded-[20px]" />

					{/* Desktop Hero Text */}
					<div className="absolute inset-0 flex items-end">
						<div className="w-full px-6 sm:px-10 pb-12 max-w-xl">
							<h1 className="font-heading font-semibold text-4xl sm:text-5xl xl:text-[40px] leading-tight tracking-tight">
								<span className="text-[#FAF7F1]">
									LABELD <span className="text-[#FAF7F1]">STUDIO</span>
								</span>
								<span className="block text-[#FAF7F1]">
									Your <span className="text-accent">Creative</span> Hub
								</span>
							</h1>
							<p className="mt-4 text-base sm:text-lg text-[#FAF7F1] max-w-md">
								Manage your brand, create events, and drop culture that
								connects.
							</p>
						</div>
					</div>
				</section>

				{/* RIGHT: Action Cards */}
				<section className="flex justify-center m-8 py-16 px-4 sm:px-8 bg-bg">
					<div className="w-full max-w-md">
						{/* Logo */}
						<div className="mb-8 flex items-center gap-2">
							<Image
								src="/images/logo-nobg.png"
								alt="Labeld"
								width={60}
								height={60}
								className="h-15 w-15"
								priority
							/>
							<h2 className="font-heading font-semibold text-cta text-2xl">
								LABELD
							</h2>
						</div>

						{/* Action Cards */}
						<div className="space-y-4 mb-8">
							<ActionCard
								title="Launch Your Brand"
								description="Set up your brand space, upload merch, manage orders, and track your sales."
								backgroundImage="/images/cerenity.jpg"
								onClick={handleLaunchBrand}
							/>
							<ActionCard
								title="Drop Events"
								// hoverBorderColor="cta"
								description="Create ticketed events, sell merch, and manage attendee check-ins."
								backgroundImage="/images/dj.jpg"
								onClick={handleDropEvents}
							/>
						</div>

						{/* Auth CTA */}
						<div className="text-center space-y-2">
							<p className="text-sm text-text-muted">
								Already have an account?{" "}
								<button
									onClick={handleLoginClick}
									className="text-cta font-semibold hover:underline"
								>
									Log In
								</button>
							</p>
							{/* <p className="text-sm text-text-muted">
								New here?{" "}
								<button
									onClick={handleSignupClick}
									className="text-cta font-semibold hover:underline"
								>
									Join the Culture
								</button>
							</p> */}
						</div>
					</div>
				</section>
			</div>

			{/* Auth Modal */}
			<AuthModal
				isOpen={showAuthModal}
				onClose={() => {
					setShowAuthModal(false);
					setAuthRedirectPath(undefined);
				}}
				mode={mode}
				onModeChange={setMode}
				redirectPath={authRedirectPath}
			/>

			{/* Brand Onboarding Modal (Original) */}
			<BrandOnboardingModal
				isOpen={showBrandModal}
				onClose={() => setShowBrandModal(false)}
			/>

			{/* Brand Registration Modal (New Lead Gen) */}
			<BrandRegistrationModal
				isOpen={showRegistrationModal}
				onClose={handleRegistrationClose}
				onLaunchBrand={() => {
					handleRegistrationClose();
					handleLaunchBrand();
				}}
			/>

			<Suspense fallback={null}>
				<PopupTrigger onTrigger={() => setShowRegistrationModal(true)} />
			</Suspense>

			<Suspense fallback={null}>
				<AuthTrigger
					onTrigger={(m) => {
						setMode(m);
						setShowAuthModal(true);
					}}
				/>
			</Suspense>

			{/* Event Organizer Onboarding Modal */}
			<EventOrganizerOnboardingModal
				isOpen={showEventModal}
				onClose={() => setShowEventModal(false)}
			/>
		</div>
	);
}
