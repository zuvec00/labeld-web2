"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/ui/spinner";
import { addUserCF, ensureUserDoc } from "@/lib/firebase/callables/users";
import { useAuth } from "@/lib/auth/AuthContext";
import { toast } from "@/app/hooks/use-toast";
import { auth, db } from "@/lib/firebase/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";

type Mode = "login" | "signup";

interface Props {
	mode: Mode;
	onModeChange?: (mode: Mode) => void;
}

export default function AuthForm({ mode, onModeChange }: Props) {
	const router = useRouter();
	const {
		user,
		signUpWithEmail,
		signInWithEmail,
		signInWithGoogle,
		signInWithApple,
	} = useAuth();

	const [showPw, setShowPw] = useState(false);
	const [isIOS, setIsIOS] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// if already logged in, bounce
	useEffect(() => {
		if (!user) return; // not logged in → stay on auth page

		let cancelled = false;

		(async () => {
			// 1) read user doc
			const ref = doc(db, "users", user.uid);
			const snap = await getDoc(ref);

			// 2) if missing, create minimal doc then go to onboarding
			if (!snap.exists()) {
				await ensureUserDoc(user.uid, {
					email: user.email,
					username: "",
					displayName: user.displayName ?? "",
					profileImageUrl: user.photoURL ?? null,
					isBrand: false,
					brandSpaceSetupComplete: false,
				});
				if (!cancelled) router.replace("/user/setup");
				return;
			}

			// 3) route by flags
			const data = snap.data();

			if (data?.profileSetupComplete !== true) {
				if (!cancelled) router.replace("/user/setup");
				return;
			}

			// (optional) brand flow
			if (data?.isBrand === true && data?.brandSpaceSetupComplete !== true) {
				if (!cancelled) router.replace("/brand/setup"); // adjust if your route differs
				return;
			}

			// 4) fully onboarded → dashboard
			if (!cancelled) router.replace("/dashboard"); // route is /dashboard (not /(protected)/dashboard)
		})();

		return () => {
			cancelled = true;
		};
	}, [user, router]);

	useEffect(() => {
		if (typeof navigator !== "undefined") {
			const ua = navigator.userAgent || navigator.vendor;
			setIsIOS(/iPad|iPhone|iPod|Macintosh/.test(ua));
		}
	}, []);

	async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setError(null);
		setSubmitting(true);
		try {
			const fd = new FormData(e.currentTarget);
			const email = String(fd.get("email") || "").trim();
			const password = String(fd.get("password") || "");

			if (mode === "signup") {
				const u = await signUpWithEmail(email, password);

				await auth.currentUser?.getIdToken(true);

				// create user doc via your callable (server sets createdAt/updatedAt)
				await addUserCF({
					email: u.email,
					username: "",
					displayName: u.displayName ?? "",
					profileImageUrl: u.photoURL ?? null,
					isBrand: false,
					brandSpaceSetupComplete: false,
				});

				toast({
					title: "Welcome to the Culture! 🎉",
					description: "Account created.",
					duration: 5000,
				});

				// go to onboarding
				router.push("/user/setup");
			} else {
				await signInWithEmail(email, password);

				toast({
					title: "Back in the culture 💚",
					description: "Let’s pick up where you left off.",
					duration: 4000,
				});

				// optional OneSignal + notif via CF later
				router.replace("/dashboard");
			}
		} catch (err) {
			setError(
				"Authentication failed. Please try again:" + (err as Error).message
			);
		} finally {
			setSubmitting(false);
		}
	}

	async function handleGoogle() {
		setError(null);
		try {
			const u = await signInWithGoogle();
			await auth.currentUser?.getIdToken(true);

			// ensure user doc for first-time Google users
			await ensureUserDoc(u.uid, {
				email: u.email,
				username: "",
				displayName: u.displayName ?? "",
				profileImageUrl: u.photoURL ?? null,
				isBrand: false,
				brandSpaceSetupComplete: false,
			});

			toast({
				title:
					mode === "signup"
						? "Welcome to the Culture! 🎉"
						: "Back in the culture 💚",
				description: mode === "signup" ? "Account created." : "Signed in.",
				duration: 4000,
			});

			// optional: await sendNotificationCF({ title:"Back in the culture 💚", content:"Let’s pick up where you left off.", externalUserIds:[u.uid] });
			router.replace(mode === "signup" ? "/user/setup" : "/dashboard");
		} catch (err) {
			setError("Google sign-in failed: " + (err as Error).message);
		}
	}

	async function handleApple() {
		setError(null);
		try {
			const u = await signInWithApple();
			await auth.currentUser?.getIdToken(true);

			await ensureUserDoc(u.uid, {
				email: u.email,
				username: "",
				displayName: u.displayName ?? "",
				profileImageUrl: u.photoURL ?? null,
				isBrand: false,
				brandSpaceSetupComplete: false,
			});

			toast({
				title:
					mode === "signup"
						? "Welcome to the Culture! 🎉"
						: "Back in the culture 💚",
				description: mode === "signup" ? "Account created." : "Signed in.",
				duration: 4000,
			});

			router.replace(mode === "signup" ? "/user/setup" : "/dashboard");
		} catch (err) {
			console.error("Apple sign-in error:", err);
			setError("Apple sign-in failed: " + (err as Error).message);
		}
	}

	// … keep your JSX as-is, just swap handlers:
	// - form: onSubmit={handleSubmit}
	// - Google button: onClick={handleGoogle}
	// - Apple button: onClick={handleApple}

	// For the submit button text:
	const submitText = submitting ? (
		<Spinner size="sm" className="mr-2" />
	) : mode === "login" ? (
		"Enter the Culture"
	) : (
		"Join the Culture"
	);

	const headline = mode === "login" ? "Welcome Back" : "Sign up";
	const subcopy =
		mode === "login"
			? "Pick up where you left off and keep building your lane in the culture."
			: "Create your Labeld account and start shaping your space in the culture!";

	const dividerText =
		mode === "login" ? "Or enter the culture with" : "Or join the culture with";

	return (
		<div className="">
			{/* Top-left logo */}
			<div className="mb-32">
				<Image
					src="/labeld_logo.png"
					alt="Labeld"
					width={80}
					height={80}
					className="h-20 w-20"
					priority
				/>
			</div>

			<div>
				{/* Header & subcopy */}
				<div className="space-y-2">
					<h2 className="font-heading font-semibold text-2xl">{headline}</h2>
					<p className="text-text-muted font-medium">{subcopy}</p>
				</div>

				{/* Mode toggle pills */}
				{/* <div className="mt-6 grid grid-cols-2 rounded-xl border border-stroke p-1 bg-bg">
				<button
					type="button"
					onClick={() => onModeChange?.("login")}
					className={`rounded-lg py-2 font-semibold transition ${
						mode === "login"
							? "bg-accent text-bg"
							: "text-text-muted hover:text-text"
					}`}
				>
					Log In
				</button>
				<button
					type="button"
					onClick={() => onModeChange?.("signup")}
					className={`rounded-lg py-2 font-semibold transition ${
						mode === "signup"
							? "bg-cta text-bg"
							: "text-text-muted hover:text-text"
					}`}
				>
					Sign Up
				</button>
			</div> */}

				{/* Form */}
				<form onSubmit={handleSubmit} className="mt-6 space-y-4">
					{/* Email */}
					<div>
						<TextLabel label="Email Address" isRequired />
						<Input
							id="email"
							name="email"
							type="email"
							placeholder="e.g example@email.com"
							required
						/>
					</div>

					{/* Password */}
					<div>
						<TextLabel label="Password" isRequired />
						<div className="relative">
							<Input
								id="password"
								name="password"
								type={showPw ? "text" : "password"}
								placeholder="********"
								required
								className="pr-10"
							/>
							<button
								type="button"
								onClick={() => setShowPw((s) => !s)}
								className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text"
								aria-label={showPw ? "Hide password" : "Show password"}
							>
								{showPw ? (
									<EyeOff className="size-5" />
								) : (
									<Eye className="size-5" />
								)}
							</button>
						</div>
					</div>

					{/* Terms (signup only) */}
					{mode === "signup" && (
						<p className="text-xs text-text-muted">
							By signing up, you agree to Labeld&apos;s{" "}
							<a
								className="underline hover:text-accent text-cta"
								href="/legal/terms"
								target="_blank"
							>
								Terms of use
							</a>{" "}
							and{" "}
							<a
								className="underline hover:text-accent text-cta"
								href="/legal/privacy"
								target="_blank"
							>
								Privacy Policy
							</a>
							.
						</p>
					)}

					{/* Divider */}
					<div className="flex items-center gap-3 my-6">
						<div className="h-px flex-1 bg-stroke" />
						<span className="text-xs text-text-muted">{dividerText}</span>
						<div className="h-px flex-1 bg-stroke" />
					</div>

					{/* Social buttons */}
					<div className="grid grid-cols-2 gap-3">
						<IconButton
							text="Google"
							iconSrc="/icons/google.svg"
							onClick={handleGoogle}
							variant="outline"
						/>
						{isIOS && (
							<IconButton
								text="Apple"
								iconSrc="/icons/apple-white.png"
								onClick={handleApple}
								variant="outline"
							/>
						)}
					</div>

					{/* Submit */}
					<Button
						type="submit"
						text={mode === "login" ? "Enter the Culture" : "Join the Culture"}
						variant="cta"
						className="w-full mt-2"
					/>
				</form>

				{/* Swap link */}
				<p className="mt-4 text-center text-sm text-text-muted">
					{mode === "login" ? (
						<>
							New here?{" "}
							<button
								onClick={() => onModeChange?.("signup")}
								className="text-cta font-semibold"
							>
								{submitText}
							</button>
						</>
					) : (
						<>
							Already have an account?{" "}
							<button
								onClick={() => onModeChange?.("login")}
								className="text-cta font-semibold"
							>
								Log In
							</button>
						</>
					)}
				</p>
			</div>
		</div>
	);
}

/* ---------- Reusable bits (TextLabel, Input, Button, IconButton) ---------- */

function TextLabel({
	label,
	isRequired,
}: {
	label: string;
	isRequired?: boolean;
}) {
	return (
		<label className="block text-sm mb-1 text-text-muted">
			<span>{label} </span>
			{isRequired ? (
				<span className="text-cta font-bold">*</span>
			) : (
				<span className="text-xs"> (optional)</span>
			)}
		</label>
	);
}

function Input({
	className,
	...props
}: React.InputHTMLAttributes<HTMLInputElement> & { className?: string }) {
	return (
		<input
			{...props}
			className={[
				"w-full rounded-xl bg-bg border border-stroke px-4 py-3 outline-none",
				"focus:border-accent text-text placeholder:text-text-muted",
				className || "",
			].join(" ")}
		/>
	);
}

function Button({
	text,
	variant = "primary",
	className,
	...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
	text: string;
	variant?: "primary" | "cta" | "outline";
	className?: string;
}) {
	const style = useMemo(() => {
		switch (variant) {
			case "cta":
				return "bg-cta text-text";
			case "outline":
				return "bg-transparent text-cta border border-cta";
			default:
				return "bg-accent text-bg";
		}
	}, [variant]);

	return (
		<button
			{...props}
			className={[
				"rounded-2xl px-4 py-3 font-semibold transition hover:opacity-90",
				style,
				className || "",
			].join(" ")}
		>
			{text}
		</button>
	);
}

function IconButton({
	text,
	iconSrc,
	onClick,
	variant = "outline",
}: {
	text: string;
	iconSrc: string;
	onClick?: () => void;
	variant?: "outline" | "solid";
}) {
	const style =
		variant === "solid"
			? "bg-accent text-bg border-transparent"
			: "bg-bg text-text border border-stroke hover:bg-surface";

	return (
		<button
			type="button"
			onClick={onClick}
			className={`rounded-xl px-3 py-3 font-unbounded font-regular text-text  transition ${style}`}
		>
			<span className="inline-flex items-center gap-2 justify-center w-full">
				<Image src={iconSrc} alt="" width={18} height={18} />
				{text}
			</span>
		</button>
	);
}
