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

interface FirebaseError {
	code?: string;
	message?: string;
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
	const [googleLoading, setGoogleLoading] = useState(false);
	const [appleLoading, setAppleLoading] = useState(false);
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

			// if (data?.profileSetupComplete !== true) {
			// 	if (!cancelled) router.replace("/user/setup");
			// 	return;
			// }

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
					description: "Let's pick up where you left off.",
					duration: 4000,
				});

				// optional OneSignal + notif via CF later
				router.replace("/dashboard");
			}
		} catch (err: unknown) {
			// Handle Firebase Auth errors with user-friendly messages
			const errorCode = (err as FirebaseError)?.code;
			let errorMessage = "Authentication failed. Please try again.";

			switch (errorCode) {
				// Sign up errors
				case "auth/email-already-in-use":
					errorMessage =
						"This email is already registered. Try signing in instead.";
					break;
				case "auth/invalid-email":
					errorMessage = "Please enter a valid email address.";
					break;
				case "auth/weak-password":
					errorMessage = "Password should be at least 6 characters long.";
					break;
				case "auth/operation-not-allowed":
					errorMessage = "Email/password accounts are not enabled.";
					break;

				// Sign in errors
				case "auth/user-not-found":
					errorMessage =
						"No account found with this email. Check your email or sign up.";
					break;
				case "auth/wrong-password":
					errorMessage = "Incorrect password. Please try again.";
					break;
				case "auth/invalid-credential":
					errorMessage =
						"Invalid email or password. Please check your credentials.";
					break;
				case "auth/user-disabled":
					errorMessage =
						"This account has been disabled. Please contact support.";
					break;
				case "auth/too-many-requests":
					errorMessage = "Too many failed attempts. Please try again later.";
					break;

				// Network errors
				case "auth/network-request-failed":
					errorMessage =
						"Network error. Please check your connection and try again.";
					break;
				case "auth/timeout":
					errorMessage = "Request timed out. Please try again.";
					break;

				// Generic fallback - show Firebase's raw error message
				default:
					errorMessage =
						(err as FirebaseError)?.message ||
						"Authentication failed. Please try again.";
					break;
			}

			setError(errorMessage);
		} finally {
			setSubmitting(false);
		}
	}

	async function handleGoogle() {
		setError(null);
		setGoogleLoading(true);
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

			// optional: await sendNotificationCF({ title:"Back in the culture 💚", content:"Let's pick up where you left off.", externalUserIds:[u.uid] });
			router.replace(mode === "signup" ? "/user/setup" : "/dashboard");
		} catch (err: unknown) {
			// Handle Google sign-in specific errors
			const errorCode = (err as FirebaseError)?.code;
			let errorMessage = "Google sign-in failed. Please try again.";

			switch (errorCode) {
				case "auth/popup-closed-by-user":
					errorMessage = "Sign-in was cancelled. Please try again.";
					break;
				case "auth/popup-blocked":
					errorMessage =
						"Popup was blocked by your browser. Please allow popups and try again.";
					break;
				case "auth/operation-not-allowed":
					errorMessage =
						"Google sign-in is not enabled. Please contact support.";
					break;
				case "auth/account-exists-with-different-credential":
					errorMessage =
						"An account already exists with this email using a different sign-in method.";
					break;
				case "auth/network-request-failed":
					errorMessage =
						"Network error. Please check your connection and try again.";
					break;
				default:
					errorMessage =
						(err as FirebaseError)?.message ||
						"Google sign-in failed. Please try again.";
					break;
			}

			setError(errorMessage);
		} finally {
			setGoogleLoading(false);
		}
	}

	async function handleApple() {
		setError(null);
		setAppleLoading(true);
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
		} catch (err: unknown) {
			console.error("Apple sign-in error:", err);

			// Handle Apple sign-in specific errors
			const errorCode = (err as FirebaseError)?.code;
			let errorMessage = "Apple sign-in failed. Please try again.";

			switch (errorCode) {
				case "auth/popup-closed-by-user":
					errorMessage = "Sign-in was cancelled. Please try again.";
					break;
				case "auth/popup-blocked":
					errorMessage =
						"Popup was blocked by your browser. Please allow popups and try again.";
					break;
				case "auth/operation-not-allowed":
					errorMessage =
						"Apple sign-in is not enabled. Please contact support.";
					break;
				case "auth/account-exists-with-different-credential":
					errorMessage =
						"An account already exists with this email using a different sign-in method.";
					break;
				case "auth/network-request-failed":
					errorMessage =
						"Network error. Please check your connection and try again.";
					break;
				default:
					errorMessage =
						(err as FirebaseError)?.message ||
						"Apple sign-in failed. Please try again.";
					break;
			}

			setError(errorMessage);
		} finally {
			setAppleLoading(false);
		}
	}

	// … keep your JSX as-is, just swap handlers:
	// - form: onSubmit={handleSubmit}
	// - Google button: onClick={handleGoogle}
	// - Apple button: onClick={handleApple}

	// For the submit button text:
	const submitText = submitting
		? mode === "login"
			? "Entering..."
			: "Joining..."
		: mode === "login"
		? "Enter the Culture"
		: "Join the Culture";

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

				{/* Error Message */}
				{error && (
					<div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200">
						<p className="text-sm text-red-600">{error}</p>
					</div>
				)}

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
							disabled={submitting || googleLoading || appleLoading}
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
								disabled={submitting || googleLoading || appleLoading}
							/>
							<button
								type="button"
								onClick={() => setShowPw((s) => !s)}
								className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text disabled:opacity-50 disabled:cursor-not-allowed"
								aria-label={showPw ? "Hide password" : "Show password"}
								disabled={submitting || googleLoading || appleLoading}
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
								href="https://www.freeprivacypolicy.com/live/e26d176d-2fa5-429a-aeb4-eb9d8b2409c8"
								target="_blank"
								rel="noopener noreferrer"
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
							text={googleLoading ? "Signing in..." : "Google"}
							iconSrc="/icons/google.svg"
							onClick={handleGoogle}
							variant="outline"
							disabled={submitting || googleLoading || appleLoading}
							loading={googleLoading}
						/>
						{isIOS && (
							<IconButton
								text={appleLoading ? "Signing in..." : "Apple"}
								iconSrc="/icons/apple-white.png"
								onClick={handleApple}
								variant="outline"
								disabled={submitting || googleLoading || appleLoading}
								loading={appleLoading}
							/>
						)}
					</div>

					{/* Submit */}
					<Button
						type="submit"
						text={submitText}
						variant="cta"
						className="w-full mt-2"
						disabled={submitting || googleLoading || appleLoading}
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
								Join the Culture
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
	disabled,
	...props
}: React.InputHTMLAttributes<HTMLInputElement> & { className?: string }) {
	return (
		<input
			{...props}
			disabled={disabled}
			className={[
				"w-full rounded-xl bg-bg border border-stroke px-4 py-3 outline-none",
				"focus:border-accent text-text placeholder:text-text-muted",
				"disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-stroke/20",
				className || "",
			].join(" ")}
		/>
	);
}

function Button({
	text,
	variant = "primary",
	className,
	disabled,
	...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
	text: string | React.ReactNode;
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
			disabled={disabled}
			className={[
				"rounded-2xl px-4 py-3 font-semibold transition hover:opacity-90",
				"disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:opacity-50",
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
	disabled = false,
	loading = false,
}: {
	text: string;
	iconSrc: string;
	onClick?: () => void;
	variant?: "outline" | "solid";
	disabled?: boolean;
	loading?: boolean;
}) {
	const style =
		variant === "solid"
			? "bg-accent text-bg border-transparent"
			: "bg-bg text-text border border-stroke hover:bg-surface";

	return (
		<button
			type="button"
			onClick={onClick}
			disabled={disabled}
			className={`rounded-xl px-3 py-3 font-unbounded font-regular text-text transition ${style} disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-surface`}
		>
			<span className="inline-flex items-center gap-2 justify-center w-full">
				{loading ? (
					<Spinner size="sm" />
				) : (
					<Image src={iconSrc} alt="" width={18} height={18} />
				)}
				{text}
			</span>
		</button>
	);
}
