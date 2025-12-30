"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Spinner } from "@/components/ui/spinner";
import Button from "@/components/ui/button";
import { useAuth } from "@/lib/auth/AuthContext";
import {
	getEventInviteCF,
	acceptEventInviteCF,
	type InviteDetails,
} from "@/lib/firebase/callables/invite";
import {
	addUserCF,
	updateUserCF,
	checkUsernameUniqueCF,
} from "@/lib/firebase/callables/users";
import {
	Shield,
	Settings,
	QrCode,
	Calendar,
	User,
	Mail,
	Lock,
	CheckCircle,
	AlertTriangle,
	ArrowRight,
	Ticket,
} from "lucide-react";

type Step =
	| "loading"
	| "invite-details"
	| "auth"
	| "register"
	| "accepting"
	| "success"
	| "error";

const roleConfig: Record<
	string,
	{ label: string; icon: typeof Shield; color: string }
> = {
	owner: { label: "Owner", icon: Shield, color: "text-red-500" },
	manager: { label: "Manager", icon: Settings, color: "text-blue-500" },
	scanner: { label: "Scanner", icon: QrCode, color: "text-green-500" },
};

export default function InviteAcceptPage() {
	const { token } = useParams<{ token: string }>();
	const router = useRouter();
	const {
		user,
		signUpWithEmail,
		signInWithEmail,
		signInWithGoogle,
		signInWithApple,
	} = useAuth();

	const [step, setStep] = useState<Step>("loading");
	const [invite, setInvite] = useState<InviteDetails | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [acceptResult, setAcceptResult] = useState<{
		eventId: string;
		eventTitle?: string;
		roles: string[];
	} | null>(null);

	// Auth form state
	const [authMode, setAuthMode] = useState<"signin" | "signup">("signup");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [authLoading, setAuthLoading] = useState(false);
	const [authError, setAuthError] = useState<string | null>(null);

	// Registration form state (for new users after Firebase Auth)
	const [displayName, setDisplayName] = useState("");
	const [username, setUsername] = useState("");
	const [usernameError, setUsernameError] = useState<string | null>(null);
	const [registerLoading, setRegisterLoading] = useState(false);

	// Load invite details
	useEffect(() => {
		if (!token) {
			setError("Invalid invite link");
			setStep("error");
			return;
		}

		(async () => {
			try {
				const details = await getEventInviteCF(token);
				if (details) {
					setInvite(details);
					// Pre-fill email field with invited email
					if (details.email) {
						setEmail(details.email);
					}
					setStep("invite-details");
				} else {
					setError("Invite not found");
					setStep("error");
				}
			} catch (err: unknown) {
				console.error("Error loading invite:", err);
				const message =
					err instanceof Error ? err.message : "Failed to load invite";
				// Handle specific error codes
				if (message.includes("expired")) {
					setError(
						"This invite has expired. Please ask the organizer to send a new invite."
					);
				} else if (
					message.includes("not found") ||
					message.includes("not-found")
				) {
					setError("This invite link is invalid or has already been used.");
				} else if (message.includes("already been")) {
					setError("This invite has already been accepted.");
				} else {
					setError(message);
				}
				setStep("error");
			}
		})();
	}, [token]);

	// Auto-accept if user is already logged in
	useEffect(() => {
		if (step === "invite-details" && user && invite) {
			handleAcceptInvite();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [step, user, invite]);

	async function handleAcceptInvite() {
		if (!token) return;
		setStep("accepting");
		try {
			const result = await acceptEventInviteCF(token);
			setAcceptResult({
				eventId: result.eventId,
				eventTitle: result.eventTitle,
				roles: result.roles,
			});
			setStep("success");
		} catch (err: unknown) {
			console.error("Error accepting invite:", err);
			setError(err instanceof Error ? err.message : "Failed to accept invite");
			setStep("error");
		}
	}

	async function handleAuth(e: React.FormEvent) {
		e.preventDefault();
		setAuthLoading(true);
		setAuthError(null);

		try {
			if (authMode === "signup") {
				await signUpWithEmail(email, password);
				// New user → need to register in Labeld ecosystem
				setStep("register");
			} else {
				await signInWithEmail(email, password);
				// Existing user → auto-accept will trigger via useEffect
			}
		} catch (err: unknown) {
			console.error("Auth error:", err);
			const message =
				err instanceof Error ? err.message : "Authentication failed";
			if (message.includes("email-already-in-use")) {
				setAuthError(
					"An account with this email already exists. Try signing in instead."
				);
			} else if (
				message.includes("wrong-password") ||
				message.includes("invalid-credential")
			) {
				setAuthError("Incorrect password. Please try again.");
			} else if (message.includes("user-not-found")) {
				setAuthError(
					"No account found with this email. Try signing up instead."
				);
			} else if (message.includes("weak-password")) {
				setAuthError("Password should be at least 6 characters.");
			} else {
				setAuthError(message);
			}
		} finally {
			setAuthLoading(false);
		}
	}

	async function handleSocialAuth(provider: "google" | "apple") {
		setAuthLoading(true);
		setAuthError(null);

		try {
			if (provider === "google") {
				await signInWithGoogle();
			} else {
				await signInWithApple();
			}
			// Check if user needs registration (handled in register step)
			setStep("register");
		} catch (err: unknown) {
			console.error("Social auth error:", err);
			setAuthError(
				err instanceof Error ? err.message : "Authentication failed"
			);
		} finally {
			setAuthLoading(false);
		}
	}

	async function handleRegister(e: React.FormEvent) {
		e.preventDefault();
		if (!username.trim() || !displayName.trim()) return;

		setRegisterLoading(true);
		setUsernameError(null);

		try {
			// Check username availability
			const isAvailable = await checkUsernameUniqueCF(username.toLowerCase());
			if (!isAvailable) {
				setUsernameError("This username is already taken");
				setRegisterLoading(false);
				return;
			}

			// Create user document in Firestore
			await addUserCF({
				email: user?.email,
				username: username.toLowerCase(),
				displayName,
				isBrand: false,
				brandSpaceSetupComplete: false,
			});

			// Mark profile as complete
			await updateUserCF({
				profileSetupComplete: true,
			});

			// Now accept the invite
			await handleAcceptInvite();
		} catch (err: unknown) {
			console.error("Registration error:", err);
			setUsernameError(
				err instanceof Error ? err.message : "Registration failed"
			);
		} finally {
			setRegisterLoading(false);
		}
	}

	const expiresIn = useMemo(() => {
		if (!invite?.expiresAt) return null;
		const days = Math.ceil(
			(new Date(invite.expiresAt).getTime() - Date.now()) /
				(1000 * 60 * 60 * 24)
		);
		return days > 0 ? `${days} day${days !== 1 ? "s" : ""}` : "soon";
	}, [invite?.expiresAt]);

	// Loading state
	if (step === "loading") {
		return (
			<div className="min-h-dvh bg-bg flex items-center justify-center">
				<div className="text-center">
					<Spinner size="lg" />
					<p className="mt-4 text-text-muted">Loading invite...</p>
				</div>
			</div>
		);
	}

	// Error state
	if (step === "error") {
		return (
			<div className="min-h-dvh bg-bg flex items-center justify-center p-6">
				<div className="max-w-md w-full bg-surface border border-stroke rounded-2xl p-8 text-center">
					<div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-500/10 flex items-center justify-center">
						<AlertTriangle className="w-8 h-8 text-red-500" />
					</div>
					<h1 className="font-heading font-semibold text-xl mb-2">
						Invite Error
					</h1>
					<p className="text-text-muted mb-6">{error}</p>
					<Button
						variant="outline"
						text="Go to Homepage"
						onClick={() => router.push("/")}
					/>
				</div>
			</div>
		);
	}

	// Accepting state
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

	// Success state
	if (step === "success" && acceptResult) {
		return (
			<div className="min-h-dvh bg-bg flex items-center justify-center p-6">
				<div className="max-w-md w-full bg-surface border border-stroke rounded-2xl p-8 text-center">
					<div className="w-16 h-16 mx-auto mb-6 rounded-full bg-green-500/10 flex items-center justify-center">
						<CheckCircle className="w-8 h-8 text-green-500" />
					</div>
					<h1 className="font-heading font-semibold text-xl mb-2">
						You&apos;re in!
					</h1>
					<p className="text-text-muted mb-2">
						You&apos;ve joined{" "}
						<span className="font-medium text-text">
							{acceptResult.eventTitle || "the event"}
						</span>{" "}
						as:
					</p>
					<div className="flex flex-wrap justify-center gap-2 mb-6">
						{acceptResult.roles.map((role) => {
							const config = roleConfig[role] || {
								label: role,
								icon: User,
								color: "text-text-muted",
							};
							const Icon = config.icon;
							return (
								<span
									key={role}
									className={`inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full ${config.color} bg-current/10`}
								>
									<Icon className="w-4 h-4" />
									{config.label}
								</span>
							);
						})}
					</div>

					<div className="space-y-3">
						{acceptResult.roles.includes("scanner") && (
							<Button
								variant="primary"
								text="Start Scanning Tickets"
								leftIcon={<Ticket className="w-4 h-4" />}
								onClick={() =>
									router.push(`/scan?eventId=${acceptResult.eventId}`)
								}
								className="w-full"
							/>
						)}
						<Button
							variant="outline"
							text="Go to Event Dashboard"
							rightIcon={<ArrowRight className="w-4 h-4" />}
							onClick={() => router.push(`/events/${acceptResult.eventId}`)}
							className="w-full"
						/>
					</div>
				</div>
			</div>
		);
	}

	// Registration form (for new Firebase users without Labeld account)
	if (step === "register") {
		return (
			<div className="min-h-dvh bg-bg flex items-center justify-center p-6">
				<div className="max-w-md w-full">
					{/* Logo */}
					<div className="flex items-center justify-center gap-2 mb-8">
						<Image
							src="/labeld_logo.png"
							alt="Labeld"
							width={48}
							height={48}
							className="h-12 w-12"
						/>
						<span className="font-heading font-semibold text-cta text-xl">
							LABELD
						</span>
					</div>

					<div className="bg-surface border border-stroke rounded-2xl p-6 sm:p-8">
						<div className="text-center mb-6">
							<h1 className="font-heading font-semibold text-xl sm:text-2xl mb-2">
								Welcome to Labeld!
							</h1>
							<p className="text-text-muted text-sm sm:text-base">
								Just a few details to get you set up.
							</p>
						</div>

						<form onSubmit={handleRegister} className="space-y-4">
							<div>
								<label className="block text-sm font-medium mb-2">
									Display Name
								</label>
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
								<label className="block text-sm font-medium mb-2">
									Username
								</label>
								<div className="relative">
									<span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
										@
									</span>
									<input
										type="text"
										value={username}
										onChange={(e) => {
											setUsername(
												e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "")
											);
											setUsernameError(null);
										}}
										placeholder="your_username"
										className={`w-full rounded-xl bg-bg border ${
											usernameError ? "border-red-500" : "border-stroke"
										} pl-8 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors`}
										required
									/>
								</div>
								{usernameError && (
									<p className="text-red-500 text-xs mt-1">{usernameError}</p>
								)}
							</div>

							<Button
								variant="primary"
								text={registerLoading ? "Setting up..." : "Complete Setup"}
								onClick={() => {}}
								type="submit"
								disabled={
									registerLoading || !displayName.trim() || !username.trim()
								}
								className="w-full mt-6"
							/>
						</form>
					</div>
				</div>
			</div>
		);
	}

	// Invite details + Auth form
	return (
		<div className="min-h-dvh bg-bg flex items-center justify-center p-6">
			<div className="max-w-md w-full">
				{/* Logo */}
				<div className="flex items-center justify-center gap-2 mb-8">
					<Image
						src="/labeld_logo.png"
						alt="Labeld"
						width={48}
						height={48}
						className="h-12 w-12"
					/>
					<span className="font-heading font-semibold text-cta text-xl">
						LABELD
					</span>
				</div>

				{/* Invite Card */}
				{invite && (
					<div className="bg-surface border border-stroke rounded-2xl p-6 sm:p-8 mb-6">
						<div className="text-center mb-6">
							<div className="w-14 h-14 mx-auto mb-4 rounded-full bg-accent/10 flex items-center justify-center">
								<Calendar className="w-7 h-7 text-accent" />
							</div>
							<h1 className="font-heading font-semibold text-xl sm:text-2xl mb-2">
								You&apos;re Invited!
							</h1>
							<p className="text-text-muted text-sm sm:text-base">
								<span className="font-medium text-text">
									{invite.inviterName}
								</span>{" "}
								invited you to join
							</p>
							<p className="font-medium text-lg text-text mt-1">
								{invite.eventTitle}
							</p>
						</div>

						{/* Roles */}
						<div className="flex flex-wrap justify-center gap-2 mb-4">
							{invite.roles.map((role) => {
								const config = roleConfig[role] || {
									label: role,
									icon: User,
									color: "text-text-muted",
								};
								const Icon = config.icon;
								return (
									<span
										key={role}
										className={`inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full ${config.color} bg-current/10`}
									>
										<Icon className="w-4 h-4" />
										{config.label}
									</span>
								);
							})}
						</div>

						{/* Invited Email */}
						{invite.email && (
							<div className="bg-bg/50 rounded-xl p-3 mb-4">
								<div className="flex items-center justify-center gap-2 text-sm">
									<Mail className="w-4 h-4 text-text-muted" />
									<span className="text-text-muted">Invite sent to</span>
									<span className="font-medium text-text">{invite.email}</span>
								</div>
							</div>
						)}

						{expiresIn && (
							<p className="text-xs text-text-muted text-center">
								Expires in {expiresIn}
							</p>
						)}
					</div>
				)}

				{/* Auth Form */}
				{step === "invite-details" && !user && (
					<div className="bg-surface border border-stroke rounded-2xl p-6 sm:p-8">
						<div className="text-center mb-6">
							<h2 className="font-heading font-semibold text-lg mb-1">
								{authMode === "signup" ? "Create Your Account" : "Sign In"}
							</h2>
							<p className="text-text-muted text-sm">
								{authMode === "signup"
									? "Join the Labeld ecosystem to accept this invite."
									: "Sign in to accept this invite."}
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
										placeholder="you@example.com"
										className="w-full rounded-xl bg-bg border border-stroke pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors"
										required
									/>
								</div>
							</div>

							<div>
								<label className="block text-sm font-medium mb-2">
									Password
								</label>
								<div className="relative">
									<Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
									<input
										type="password"
										value={password}
										onChange={(e) => setPassword(e.target.value)}
										placeholder={
											authMode === "signup"
												? "Create a password"
												: "Enter your password"
										}
										className="w-full rounded-xl bg-bg border border-stroke pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors"
										required
										minLength={6}
									/>
								</div>
							</div>

							<Button
								variant="primary"
								text={
									authLoading
										? "Please wait..."
										: authMode === "signup"
										? "Create Account"
										: "Sign In"
								}
								onClick={() => {}}
								type="submit"
								disabled={authLoading}
								className="w-full"
							/>
						</form>

						{/* Divider */}
						<div className="flex items-center gap-4 my-6">
							<div className="flex-1 h-px bg-stroke" />
							<span className="text-xs text-text-muted">or continue with</span>
							<div className="flex-1 h-px bg-stroke" />
						</div>

						{/* Social Auth */}
						<div className="grid grid-cols-2 gap-3">
							<button
								onClick={() => handleSocialAuth("google")}
								disabled={authLoading}
								className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-stroke hover:bg-stroke/20 transition-colors disabled:opacity-50"
							>
								<svg className="w-5 h-5" viewBox="0 0 24 24">
									<path
										fill="currentColor"
										d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
									/>
									<path
										fill="currentColor"
										d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
									/>
									<path
										fill="currentColor"
										d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
									/>
									<path
										fill="currentColor"
										d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
									/>
								</svg>
								<span className="text-sm font-medium">Google</span>
							</button>
							<button
								onClick={() => handleSocialAuth("apple")}
								disabled={authLoading}
								className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-stroke hover:bg-stroke/20 transition-colors disabled:opacity-50"
							>
								<svg
									className="w-5 h-5"
									viewBox="0 0 24 24"
									fill="currentColor"
								>
									<path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
								</svg>
								<span className="text-sm font-medium">Apple</span>
							</button>
						</div>

						{/* Toggle Auth Mode */}
						<p className="text-center text-sm text-text-muted mt-6">
							{authMode === "signup" ? (
								<>
									Already have an account?{" "}
									<button
										onClick={() => setAuthMode("signin")}
										className="text-cta font-medium hover:underline"
									>
										Sign In
									</button>
								</>
							) : (
								<>
									Don&apos;t have an account?{" "}
									<button
										onClick={() => setAuthMode("signup")}
										className="text-cta font-medium hover:underline"
									>
										Sign Up
									</button>
								</>
							)}
						</p>
					</div>
				)}
			</div>
		</div>
	);
}
