"use client";

import { useState, useEffect } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { useAuth } from "@/lib/auth/AuthContext";
import Button from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import TextLabel from "@/components/ui/textlabel";
import {
	requestEmailChange,
	reauthWithPassword,
	reauthWithProvider,
	requestPasswordReset,
	hasPasswordCredential,
	getFederatedProviders,
	isValidEmail,
	isEmailVerified,
	getEmailVerificationStatus,
} from "@/lib/features/account/security/email-change";
import { useToast } from "@/app/hooks/use-toast";

interface PasswordModalProps {
	isOpen: boolean;
	onClose: () => void;
	onConfirm: (password: string) => void;
	loading: boolean;
}

function PasswordModal({
	isOpen,
	onClose,
	onConfirm,
	loading,
}: PasswordModalProps) {
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");

	if (!isOpen) return null;

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!password.trim()) {
			setError("Password is required");
			return;
		}
		onConfirm(password);
	};

	return (
		<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
			<div className="bg-surface rounded-2xl p-6 w-full max-w-md">
				<h3 className="text-lg font-heading font-semibold text-text mb-4">
					Confirm Your Identity
				</h3>
				<p className="text-text-muted text-sm mb-6">
					For security, please enter your current password to continue.
				</p>

				<form onSubmit={handleSubmit} className="space-y-4">
					<div>
						<TextLabel label="Current Password" isRequired />
						<Input
							type="password"
							value={password}
							onChange={(e) => {
								setPassword(e.target.value);
								setError("");
							}}
							placeholder="Enter your current password"
							aria-invalid={!!error}
						/>
						{error && <p className="mt-2 text-sm text-cta">{error}</p>}
					</div>

					<div className="flex gap-3 pt-2">
						<Button
							type="button"
							text="Cancel"
							variant="secondary"
							onClick={onClose}
							disabled={loading}
							className="flex-1"
						/>
						<Button
							type="submit"
							text={loading ? "Verifying..." : "Confirm"}
							variant="primary"
							disabled={loading || !password.trim()}
							className="flex-1"
						/>
					</div>
				</form>
			</div>
		</div>
	);
}

interface ProviderReauthProps {
	isOpen: boolean;
	onClose: () => void;
	onConfirm: (providerId: "google.com" | "apple.com") => void;
	loading: boolean;
	providers: string[];
}

function ProviderReauthModal({
	isOpen,
	onClose,
	onConfirm,
	loading,
	providers,
}: ProviderReauthProps) {
	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
			<div className="bg-surface rounded-2xl p-6 w-full max-w-md">
				<h3 className="text-lg font-heading font-semibold text-text mb-4">
					Confirm Your Identity
				</h3>
				<p className="text-text-muted text-sm mb-6">
					For security, please sign in again with your provider to continue.
				</p>

				<div className="space-y-3">
					{providers.map((providerId) => (
						<Button
							key={providerId}
							text={`Sign in with ${
								providerId === "google.com" ? "Google" : "Apple"
							}`}
							variant="primary"
							onClick={() =>
								onConfirm(providerId as "google.com" | "apple.com")
							}
							disabled={loading}
							className="w-full"
						/>
					))}

					<Button
						text="Cancel"
						variant="secondary"
						onClick={onClose}
						disabled={loading}
						className="w-full"
					/>
				</div>
			</div>
		</div>
	);
}

export default function AccountSecurity() {
	const { user } = useAuth();
	const { toast } = useToast();
	const auth = getAuth();

	// Email change state
	const [newEmail, setNewEmail] = useState("");
	const [emailLoading, setEmailLoading] = useState(false);
	const [emailError, setEmailError] = useState("");

	// Password reset state
	const [passwordLoading, setPasswordLoading] = useState(false);

	// Reauth modals
	const [showPasswordModal, setShowPasswordModal] = useState(false);
	const [showProviderModal, setShowProviderModal] = useState(false);
	const [reauthLoading, setReauthLoading] = useState(false);
	const [pendingEmail, setPendingEmail] = useState("");
	const [originalEmail, setOriginalEmail] = useState<string>("");
	const [emailChanged, setEmailChanged] = useState(false);

	// Track email changes
	useEffect(() => {
		if (user?.email) {
			// Set original email on first load
			if (!originalEmail) {
				setOriginalEmail(user.email);
			}
			// Check if email has changed
			if (originalEmail && user.email !== originalEmail) {
				setEmailChanged(true);
				toast({
					title: "Email updated successfully! ✅",
					description: `Your email has been changed from ${originalEmail} to ${user.email}`,
					duration: 8000,
				});
				// Update original email to new one
				setOriginalEmail(user.email);
			}
		}
	}, [user?.email, originalEmail, toast]);

	// Listen for auth state changes to detect email updates
	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
			if (
				currentUser?.email &&
				originalEmail &&
				currentUser.email !== originalEmail
			) {
				setEmailChanged(true);
				toast({
					title: "Email updated successfully! ✅",
					description: `Your email has been changed from ${originalEmail} to ${currentUser.email}`,
					duration: 8000,
				});
				setOriginalEmail(currentUser.email);
			}
		});

		return () => unsubscribe();
	}, [auth, originalEmail, toast]);

	if (!user) {
		return (
			<div className="bg-surface rounded-2xl p-6">
				<h2 className="text-xl font-heading font-semibold text-text mb-4">
					Account Security
				</h2>
				<p className="text-text-muted">
					Please sign in to manage your account security.
				</p>
			</div>
		);
	}

	const handleEmailChange = async () => {
		if (!newEmail.trim()) {
			setEmailError("Email address is required");
			return;
		}

		if (!isValidEmail(newEmail)) {
			setEmailError("Please enter a valid email address");
			return;
		}

		setEmailLoading(true);
		setEmailError("");

		const result = await requestEmailChange({
			auth,
			user,
			newEmail: newEmail.trim(),
		});

		if (result.success) {
			toast({
				title: "Verification link sent! 📧",
				description: `Verification link sent to ${newEmail}. Click the link to confirm your new email. Your account UID stays the same. If you don't see the email, please check your spam folder.`,
				duration: 8000,
			});
			setNewEmail("");
		} else if (result.error?.includes("requires-recent-login")) {
			setPendingEmail(newEmail.trim());
			if (hasPasswordCredential(user)) {
				setShowPasswordModal(true);
			} else {
				const providers = getFederatedProviders(user);
				if (providers.length > 0) {
					setShowProviderModal(true);
				} else {
					setEmailError("Unable to verify identity. Please contact support.");
				}
			}
		} else {
			// Always show the error to the user
			const errorMessage = result.error || "Failed to send verification link";
			setEmailError(errorMessage);
			// Also show as toast for better visibility
			toast({
				title: "Failed to send verification link",
				description: errorMessage,
				variant: "destructive",
				duration: 6000,
			});
		}

		setEmailLoading(false);
	};

	const handlePasswordReauth = async (password: string) => {
		setReauthLoading(true);

		const result = await reauthWithPassword({
			user,
			currentPassword: password,
		});

		if (result.success) {
			setShowPasswordModal(false);
			// Retry email change
			const emailResult = await requestEmailChange({
				auth,
				user,
				newEmail: pendingEmail,
			});

			if (emailResult.success) {
				toast({
					title: "Verification link sent! 📧",
					description: `Verification link sent to ${pendingEmail}. Click the link to confirm your new email. Your account UID stays the same. If you don't see the email, please check your spam folder.`,
					duration: 8000,
				});
				setNewEmail("");
				setPendingEmail("");
			} else {
				const errorMessage =
					emailResult.error || "Failed to send verification link";
				setEmailError(errorMessage);
				toast({
					title: "Failed to send verification link",
					description: errorMessage,
					variant: "destructive",
					duration: 6000,
				});
			}
		} else {
			toast({
				title: "Authentication failed",
				description: result.error || "Please try again",
				variant: "destructive",
			});
		}

		setReauthLoading(false);
	};

	const handleProviderReauth = async (
		providerId: "google.com" | "apple.com"
	) => {
		setReauthLoading(true);

		const result = await reauthWithProvider({ auth, providerId });

		if (result.success) {
			setShowProviderModal(false);
			// Retry email change
			const emailResult = await requestEmailChange({
				auth,
				user,
				newEmail: pendingEmail,
			});

			if (emailResult.success) {
				toast({
					title: "Verification link sent! 📧",
					description: `Verification link sent to ${pendingEmail}. Click the link to confirm your new email. Your account UID stays the same. If you don't see the email, please check your spam folder.`,
					duration: 8000,
				});
				setNewEmail("");
				setPendingEmail("");
			} else {
				const errorMessage =
					emailResult.error || "Failed to send verification link";
				setEmailError(errorMessage);
				toast({
					title: "Failed to send verification link",
					description: errorMessage,
					variant: "destructive",
					duration: 6000,
				});
			}
		} else {
			toast({
				title: "Authentication failed",
				description: result.error || "Please try again",
				variant: "destructive",
			});
		}

		setReauthLoading(false);
	};

	const handlePasswordReset = async () => {
		if (!user.email) {
			toast({
				title: "No email address",
				description:
					"This account doesn't have an email address. Use your provider to sign in, or add a password first.",
				variant: "destructive",
			});
			return;
		}

		setPasswordLoading(true);

		const result = await requestPasswordReset({
			auth,
			email: user.email,
		});

		if (result.success) {
			toast({
				title: "Password reset email sent! 📧",
				description: `Password reset email sent to ${user.email}. If you don't see the email, please check your spam folder.`,
				duration: 8000,
			});
		} else {
			// Always show the actual Firebase error message
			const errorMessage = result.error || "Please try again";
			toast({
				title: "Failed to send reset email",
				description: errorMessage,
				variant: "destructive",
				duration: 6000,
			});
		}

		setPasswordLoading(false);
	};

	return (
		<>
			<div className="bg-surface rounded-2xl p-6 space-y-6">
				<div>
					<h2 className="text-xl font-heading font-semibold text-text mb-2">
						Account Security
					</h2>
					<p className="text-text-muted text-sm">
						Manage your account security settings and authentication
					</p>
				</div>

				{/* Change Email Section */}
				<div className="space-y-4">
					<div>
						<h3 className="text-lg font-medium text-text mb-2">Change Email</h3>
						<p className="text-text-muted text-sm mb-4">
							Update your email address. You'll receive a verification link to
							confirm the change.
						</p>

						{/* Current Email Status */}
						<div className="bg-cta/5 rounded-xl p-4 mb-4">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-sm font-medium text-text">Current Email</p>
									<p className="text-sm text-text-muted">
										{user.email || "No email address"}
									</p>
									{user.email && (
										<div className="flex items-center gap-2 mt-1">
											<div
												className={`w-2 h-2 rounded-full ${
													isEmailVerified(user)
														? "bg-green-500"
														: "bg-yellow-500"
												}`}
											></div>
											<span
												className={`text-xs font-medium ${
													isEmailVerified(user)
														? "text-green-600"
														: "text-yellow-600"
												}`}
											>
												{isEmailVerified(user) ? "Verified" : "Unverified"}
											</span>
										</div>
									)}
								</div>
								{emailChanged && (
									<div className="flex items-center gap-2">
										<div className="w-2 h-2 bg-green-500 rounded-full"></div>
										<span className="text-xs text-green-600 font-medium">
											Updated
										</span>
									</div>
								)}
							</div>
						</div>
					</div>

					<div className="space-y-3">
						<div style={{ maxWidth: "400px" }}>
							<TextLabel label="New email address" isRequired />
							<Input
								type="email"
								value={newEmail}
								onChange={(e) => {
									setNewEmail(e.target.value);
									setEmailError("");
								}}
								placeholder="Enter your new email address"
								aria-invalid={!!emailError}
								disabled={emailLoading}
							/>
							{emailError && (
								<p className="mt-2 text-sm text-cta">{emailError}</p>
							)}
						</div>

						<Button
							text={emailLoading ? "Sending..." : "Send verification link"}
							variant="cta"
							onClick={handleEmailChange}
							disabled={emailLoading || !newEmail.trim()}
							// className="w-full sm:w-auto"
						/>
					</div>
				</div>

				{/* Divider */}
				<div className="border-t border-stroke" />

				{/* Reset Password Section */}
				<div className="space-y-4">
					<div>
						<h3 className="text-lg font-medium text-text mb-2">
							Reset Password
						</h3>
						<p className="text-text-muted text-sm mb-4">
							Send a password reset link to your current email address.
						</p>
					</div>

					<div className="flex items-center justify-between p-4 bg-cta/5 rounded-xl">
						<div>
							<p className="text-sm font-medium text-text">Current email</p>
							<p className="text-sm text-text-muted">
								{user.email || "No email address"}
							</p>
						</div>
						<Button
							text={
								passwordLoading ? "Sending..." : "Send password reset email"
							}
							variant="secondary"
							onClick={handlePasswordReset}
							disabled={passwordLoading || !user.email}
							className="ml-4"
						/>
					</div>

					{!user.email && (
						<p className="text-sm text-text-muted">
							This account doesn't have a password. Use your provider to sign
							in, or add a password first.
						</p>
					)}
				</div>
			</div>

			{/* Reauth Modals */}
			<PasswordModal
				isOpen={showPasswordModal}
				onClose={() => {
					setShowPasswordModal(false);
					setPendingEmail("");
				}}
				onConfirm={handlePasswordReauth}
				loading={reauthLoading}
			/>

			<ProviderReauthModal
				isOpen={showProviderModal}
				onClose={() => {
					setShowProviderModal(false);
					setPendingEmail("");
				}}
				onConfirm={handleProviderReauth}
				loading={reauthLoading}
				providers={getFederatedProviders(user)}
			/>
		</>
	);
}
