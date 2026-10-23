"use client";

import AppleIcon from "@/components/ui/AppleIcon";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { doc, getDoc } from "firebase/firestore";
import { Spinner } from "@/components/ui/spinner";
import Button from "@/components/ui/button";
import StaffAppLinks from "@/components/staff/StaffAppLinks";
import { useAuth } from "@/lib/auth/AuthContext";
import { db } from "@/lib/firebase/firebaseConfig";
import {
	acceptStaffInviteCF,
	declineStaffInviteCF,
	getStaffInviteCF,
	staffCallableMessage,
	type StaffInvitePreview,
} from "@/lib/firebase/callables/staffInvite";
import {
	addUserCF,
	updateUserCF,
	checkUsernameUniqueCF,
} from "@/lib/firebase/callables/users";
import {
	AlertTriangle,
	CheckCircle,
	Lock,
	Mail,
	User,
	Users,
} from "lucide-react";

type Step =
	| "loading"
	| "details"
	| "accepting"
	| "success"
	| "declined"
	| "error";

/**
 * Staff invite: `studio.labeld.app/invite/staff/<token>`.
 *
 * Same shape as the event organizer invite page, with one deliberate
 * difference: nobody is added automatically. A signed-in person always sees the
 * invite and chooses Accept or Decline. Staff do their work in the Studio app,
 * so after joining we point them there.
 */
export default function StaffInvitePage() {
	const { token } = useParams<{ token: string }>();
	const router = useRouter();
	const {
		user,
		loading: authLoading,
		signUpWithEmail,
		signInWithEmail,
		signInWithGoogle,
		signInWithApple,
		signOutApp,
	} = useAuth();

	const [step, setStep] = useState<Step>("loading");
	const [invite, setInvite] = useState<StaffInvitePreview | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [joined, setJoined] = useState<{ brandName: string } | null>(null);

	// Does the signed-in person have a Labeld profile yet? null = checking.
	const [profileReady, setProfileReady] = useState<boolean | null>(null);

	// Accept / decline
	const [acting, setActing] = useState(false);
	const [actionError, setActionError] = useState<string | null>(null);

	// Auth form
	const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [authBusy, setAuthBusy] = useState(false);
	const [authError, setAuthError] = useState<string | null>(null);

	// Profile form (new Labeld users)
	const [displayName, setDisplayName] = useState("");
	const [username, setUsername] = useState("");
	const [usernameError, setUsernameError] = useState<string | null>(null);
	const [registerBusy, setRegisterBusy] = useState(false);

	// Load the invite
	useEffect(() => {
		if (!token) {
			setError("This invite link is not valid.");
			setStep("error");
			return;
		}
		let cancelled = false;
		(async () => {
			try {
				const preview = await getStaffInviteCF(token);
				if (cancelled) return;
				setInvite(preview);
				setStep("details");
			} catch (err) {
				if (cancelled) return;
				setError(
					staffCallableMessage(err, "We could not open this invite.")
				);
				setStep("error");
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [token]);

	// Once signed in, check they have a Labeld profile (new sign-ups do not).
	useEffect(() => {
		if (!user) {
			setProfileReady(null);
			return;
		}
		let cancelled = false;
		(async () => {
			try {
				const snap = await getDoc(doc(db, "users", user.uid));
				if (!cancelled) setProfileReady(snap.exists());
			} catch (err) {
				console.warn("Could not check the Labeld profile", err);
				// Do not block someone on a lookup problem.
				if (!cancelled) setProfileReady(true);
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [user]);

	const expiresIn = useMemo(() => {
		if (!invite?.expiresAt) return null;
		const days = Math.ceil(
			(new Date(invite.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
		);
		return days > 0 ? `${days} day${days !== 1 ? "s" : ""}` : "soon";
	}, [invite?.expiresAt]);

	async function handleAccept() {
		if (!token) return;
		setActing(true);
		setActionError(null);
		try {
			const result = await acceptStaffInviteCF(token);
			setJoined({ brandName: result.brandName || invite?.brandName || "the brand" });
			setStep("success");
		} catch (err) {
			setActionError(
				staffCallableMessage(err, "We could not accept this invite. Try again.")
			);
		} finally {
			setActing(false);
		}
	}

	async function handleDecline() {
		if (!token) return;
		setActing(true);
		setActionError(null);
		try {
			await declineStaffInviteCF(token);
			setStep("declined");
		} catch (err) {
			setActionError(
				staffCallableMessage(err, "We could not decline this invite. Try again.")
			);
		} finally {
			setActing(false);
		}
	}

	async function handleAuth(e: React.FormEvent) {
		e.preventDefault();
		setAuthBusy(true);
		setAuthError(null);
		try {
			if (authMode === "signup") {
				await signUpWithEmail(email, password);
			} else {
				await signInWithEmail(email, password);
			}
		} catch (err) {
			const message = err instanceof Error ? err.message : "Authentication failed";
			if (message.includes("email-already-in-use")) {
				setAuthError("An account with this email already exists. Try signing in instead.");
			} else if (
				message.includes("wrong-password") ||
				message.includes("invalid-credential")
			) {
				setAuthError("Incorrect email or password. Please try again.");
			} else if (message.includes("user-not-found")) {
				setAuthError("No account found with this email. Try creating an account instead.");
			} else if (message.includes("weak-password")) {
				setAuthError("Password should be at least 6 characters.");
			} else {
				setAuthError(message);
			}
		} finally {
			setAuthBusy(false);
		}
	}

	async function handleSocialAuth(provider: "google" | "apple") {
		setAuthBusy(true);
		setAuthError(null);
		try {
			if (provider === "google") await signInWithGoogle();
			else await signInWithApple();
		} catch (err) {
			setAuthError(err instanceof Error ? err.message : "Authentication failed");
		} finally {
			setAuthBusy(false);
		}
	}

	async function handleRegister(e: React.FormEvent) {
		e.preventDefault();
		if (!username.trim() || !displayName.trim()) return;
		setRegisterBusy(true);
		setUsernameError(null);
		try {
			const isAvailable = await checkUsernameUniqueCF(username.toLowerCase());
			if (!isAvailable) {
				setUsernameError("This username is already taken");
				return;
			}
			await addUserCF({
				email: user?.email,
				username: username.toLowerCase(),
				displayName,
				isBrand: false,
				brandSpaceSetupComplete: false,
			});
			await updateUserCF({ profileSetupComplete: true });
			setProfileReady(true);
		} catch (err) {
			setUsernameError(err instanceof Error ? err.message : "Registration failed");
		} finally {
			setRegisterBusy(false);
		}
	}

	const logo = (
		<div className="flex items-center justify-center gap-2 mb-8">
			<Image
				src="/labeld_logo.png"
				alt="Labeld"
				width={48}
				height={48}
				className="h-12 w-12"
			/>
			<span className="font-heading font-semibold text-cta text-xl">LABELD</span>
		</div>
	);

	if (step === "loading" || authLoading) {
		return (
			<div className="min-h-dvh bg-bg flex items-center justify-center">
				<div className="text-center">
					<Spinner size="lg" />
					<p className="mt-4 text-text-muted">Loading invite...</p>
				</div>
			</div>
		);
	}

	if (step === "error") {
		return (
			<div className="min-h-dvh bg-bg flex items-center justify-center p-6">
				<div className="max-w-md w-full bg-surface border border-stroke rounded-2xl p-8 text-center">
					<div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-500/10 flex items-center justify-center">
						<AlertTriangle className="w-8 h-8 text-red-500" />
					</div>
					<h1 className="font-heading font-semibold text-xl mb-2">Invite problem</h1>
					<p className="text-text-muted mb-6">{error}</p>
					<Button variant="outline" text="Go to Homepage" onClick={() => router.push("/")} />
				</div>
			</div>
		);
	}

	if (step === "accepting") {
		return (
			<div className="min-h-dvh bg-bg flex items-center justify-center">
				<div className="text-center">
					<Spinner size="lg" />
					<p className="mt-4 text-text-muted">Joining the team...</p>
				</div>
			</div>
		);
	}

	if (step === "declined") {
		return (
			<div className="min-h-dvh bg-bg flex items-center justify-center p-6">
				<div className="max-w-md w-full bg-surface border border-stroke rounded-2xl p-8 text-center">
					<h1 className="font-heading font-semibold text-xl mb-2">Invite declined</h1>
					<p className="text-text-muted mb-6">
						You turned down the invite to join {invite?.brandName}. If that was a
						mistake, ask them to send a new one.
					</p>
					<Button variant="outline" text="Go to Homepage" onClick={() => router.push("/")} />
				</div>
			</div>
		);
	}

	if (step === "success") {
		return (
			<div className="min-h-dvh bg-bg flex items-center justify-center p-6">
				<div className="max-w-md w-full bg-surface border border-stroke rounded-2xl p-8">
					<div className="text-center mb-6">
						<div className="w-16 h-16 mx-auto mb-6 rounded-full bg-green-500/10 flex items-center justify-center">
							<CheckCircle className="w-8 h-8 text-green-500" />
						</div>
						<h1 className="font-heading font-semibold text-xl mb-2">You&apos;re in!</h1>
						<p className="text-text-muted">
							You&apos;ve joined{" "}
							<span className="font-medium text-text">{joined?.brandName}</span>
							{invite?.roleLabel ? (
								<>
									{" "}as <span className="font-medium text-text">{invite.roleLabel}</span>
								</>
							) : null}
							.
						</p>
					</div>
					<p className="text-sm text-text-muted text-center mb-4">
						Your work happens in the Labeld Studio app. Open it and sign in
						{user?.email ? <> with <span className="font-medium text-text">{user.email}</span></> : null}.
					</p>
					<StaffAppLinks />
				</div>
			</div>
		);
	}

	// A new Labeld account needs a name and username first.
	if (user && profileReady === false) {
		return (
			<div className="min-h-dvh bg-bg flex items-center justify-center p-6">
				<div className="max-w-md w-full">
					{logo}
					<div className="bg-surface border border-stroke rounded-2xl p-6 sm:p-8">
						<div className="text-center mb-6">
							<h1 className="font-heading font-semibold text-xl sm:text-2xl mb-2">
								Welcome to Labeld!
							</h1>
							<p className="text-text-muted text-sm sm:text-base">
								Just a few details to set up your account, then you can accept the invite.
							</p>
						</div>
						<form onSubmit={handleRegister} className="space-y-4">
							<div>
								<label className="block text-sm font-medium mb-2">Display name</label>
								<div className="relative">
									<User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
									<input
										type="text"
										value={displayName}
										onChange={(e) => setDisplayName(e.target.value)}
										placeholder="How should we call you?"
										className="w-full rounded-xl bg-bg border border-stroke pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors"
										required
									/>
								</div>
							</div>
							<div>
								<label className="block text-sm font-medium mb-2">Username</label>
								<div className="relative">
									<span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">@</span>
									<input
										type="text"
										value={username}
										onChange={(e) => {
											setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""));
											setUsernameError(null);
										}}
										placeholder="your_username"
										className={`w-full rounded-xl bg-bg border ${
											usernameError ? "border-red-500" : "border-stroke"
										} pl-8 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors`}
										required
									/>
								</div>
								{usernameError && <p className="text-red-500 text-xs mt-1">{usernameError}</p>}
							</div>
							<Button
								variant="primary"
								text={registerBusy ? "Setting up..." : "Continue"}
								onClick={() => {}}
								type="submit"
								disabled={registerBusy || !displayName.trim() || !username.trim()}
								className="w-full mt-6"
							/>
						</form>
					</div>
				</div>
			</div>
		);
	}

	// Invite details + (sign in | accept)
	return (
		<div className="min-h-dvh bg-bg flex items-center justify-center p-6">
			<div className="max-w-md w-full">
				{logo}

				{invite && (
					<div className="bg-surface border border-stroke rounded-2xl p-6 sm:p-8 mb-6">
						<div className="text-center mb-6">
							<div className="w-14 h-14 mx-auto mb-4 rounded-full bg-accent/10 flex items-center justify-center">
								<Users className="w-7 h-7 text-accent" />
							</div>
							<h1 className="font-heading font-semibold text-xl sm:text-2xl mb-2">
								You&apos;re invited!
							</h1>
							<p className="text-text-muted text-sm sm:text-base">
								{invite.firstName ? `Hi ${invite.firstName}, ` : ""}
								<span className="font-medium text-text">{invite.inviterName}</span> invited you to join
							</p>
							<p className="font-medium text-lg text-text mt-1">{invite.brandName}</p>
						</div>

						<div className="bg-bg/50 rounded-xl p-3 mb-3 text-center text-sm">
							<span className="text-text-muted">Your role: </span>
							<span className="font-medium text-text">{invite.roleLabel}</span>
						</div>

						{invite.emailHint && (
							<div className="bg-bg/50 rounded-xl p-3 mb-4">
								<div className="flex items-center justify-center gap-2 text-sm">
									<Mail className="w-4 h-4 text-text-muted" />
									<span className="text-text-muted">Invite sent to</span>
									<span className="font-medium text-text">{invite.emailHint}</span>
								</div>
							</div>
						)}

						{expiresIn && (
							<p className="text-xs text-text-muted text-center">Expires in {expiresIn}</p>
						)}
					</div>
				)}

				{user ? (
					<div className="bg-surface border border-stroke rounded-2xl p-6 sm:p-8">
						<p className="text-sm text-text-muted text-center mb-4">
							Signed in as <span className="font-medium text-text">{user.email}</span>
						</p>
						{actionError && (
							<div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-4">
								<p className="text-red-400 text-sm">{actionError}</p>
							</div>
						)}
						<div className="space-y-3">
							<Button
								variant="primary"
								text={acting ? "Please wait..." : "Accept invite"}
								onClick={handleAccept}
								disabled={acting || profileReady === null}
								className="w-full"
							/>
							<Button
								variant="outline"
								text="Decline"
								onClick={handleDecline}
								disabled={acting}
								className="w-full"
							/>
						</div>
						<p className="text-center text-sm text-text-muted mt-4">
							Wrong account?{" "}
							<button
								onClick={() => {
									setActionError(null);
									void signOutApp();
								}}
								className="text-cta font-medium hover:underline"
							>
								Use a different one
							</button>
						</p>
					</div>
				) : (
					<div className="bg-surface border border-stroke rounded-2xl p-6 sm:p-8">
						<div className="text-center mb-6">
							<h2 className="font-heading font-semibold text-lg mb-1">
								{authMode === "signup" ? "Create your account" : "Sign in"}
							</h2>
							<p className="text-text-muted text-sm">
								Use the email this invite was sent to.
							</p>
						</div>

						{authError && (
							<div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-4">
								<p className="text-red-400 text-sm">{authError}</p>
							</div>
						)}

						<form onSubmit={handleAuth} className="space-y-4">
							<div>
								<label className="block text-sm font-medium mb-2">Email</label>
								<div className="relative">
									<Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
									<input
										type="email"
										value={email}
										onChange={(e) => setEmail(e.target.value)}
										placeholder={invite?.emailHint || "you@example.com"}
										className="w-full rounded-xl bg-bg border border-stroke pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors"
										required
									/>
								</div>
							</div>
							<div>
								<label className="block text-sm font-medium mb-2">Password</label>
								<div className="relative">
									<Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
									<input
										type="password"
										value={password}
										onChange={(e) => setPassword(e.target.value)}
										placeholder={authMode === "signup" ? "Create a password" : "Enter your password"}
										className="w-full rounded-xl bg-bg border border-stroke pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors"
										required
										minLength={6}
									/>
								</div>
							</div>
							<Button
								variant="primary"
								text={authBusy ? "Please wait..." : authMode === "signup" ? "Create account" : "Sign in"}
								onClick={() => {}}
								type="submit"
								disabled={authBusy}
								className="w-full"
							/>
						</form>

						<div className="flex items-center gap-4 my-6">
							<div className="flex-1 h-px bg-stroke" />
							<span className="text-xs text-text-muted">or continue with</span>
							<div className="flex-1 h-px bg-stroke" />
						</div>

						<div className="grid grid-cols-2 gap-3">
							<button
								onClick={() => handleSocialAuth("google")}
								disabled={authBusy}
								className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-stroke hover:bg-stroke/20 transition-colors disabled:opacity-50"
							>
								<svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
									<path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
									<path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
									<path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
									<path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
								</svg>
								<span className="text-sm font-medium">Google</span>
							</button>
							<button
								onClick={() => handleSocialAuth("apple")}
								disabled={authBusy}
								className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-stroke hover:bg-stroke/20 transition-colors disabled:opacity-50"
							>
								<AppleIcon className="w-5 h-5" />
								<span className="text-sm font-medium">Apple</span>
							</button>
						</div>

						<p className="text-center text-sm text-text-muted mt-6">
							{authMode === "signup" ? (
								<>
									Already have an account?{" "}
									<button onClick={() => setAuthMode("signin")} className="text-cta font-medium hover:underline">
										Sign in
									</button>
								</>
							) : (
								<>
									New to Labeld?{" "}
									<button onClick={() => setAuthMode("signup")} className="text-cta font-medium hover:underline">
										Create an account
									</button>
								</>
							)}
						</p>

						<div className="border-t border-stroke mt-6 pt-4 text-center">
							{actionError && <p className="text-red-400 text-sm mb-2">{actionError}</p>}
							<button
								onClick={handleDecline}
								disabled={acting}
								className="text-sm text-text-muted hover:underline disabled:opacity-50"
							>
								Not interested? Decline this invite
							</button>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
