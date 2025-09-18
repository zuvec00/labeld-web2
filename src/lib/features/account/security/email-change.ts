import {
	Auth,
	User,
	verifyBeforeUpdateEmail,
	reauthenticateWithCredential,
	EmailAuthProvider,
	GoogleAuthProvider,
	OAuthProvider,
	signInWithPopup,
	sendPasswordResetEmail,
} from "firebase/auth";

// Error mapping for user-friendly messages
export const ERROR_MESSAGES = {
	"auth/requires-recent-login": "For security, please confirm your identity to continue.",
	"auth/invalid-email": "That email looks invalid. Check and try again.",
	"auth/email-already-in-use": "That email is already used by another account.",
	"auth/network-request-failed": "Network error. Please check your connection and retry.",
	"auth/user-mismatch": "This account doesn't match the current user.",
	"auth/user-not-found": "User account not found.",
	"auth/wrong-password": "Incorrect password. Please try again.",
	"auth/too-many-requests": "Too many attempts. Please try again later.",
} as const;

export function getErrorMessage(error: any): string {
	const code = error?.code;
	if (code && ERROR_MESSAGES[code as keyof typeof ERROR_MESSAGES]) {
		return ERROR_MESSAGES[code as keyof typeof ERROR_MESSAGES];
	}
	// Always show the actual Firebase error message if available
	return error?.message || "Something went wrong. Please try again.";
}

// Basic email validation
export function isValidEmail(email: string): boolean {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email.trim());
}

/**
 * Checks if the user's email has been verified
 * @param user Firebase User object
 * @returns boolean indicating if email is verified
 */
export function isEmailVerified(user: User): boolean {
	return user.emailVerified;
}

/**
 * Gets the user's current email verification status
 * @param user Firebase User object
 * @returns object with verification status and details
 */
export function getEmailVerificationStatus(user: User): {
	isVerified: boolean;
	email: string | null;
	lastSignInTime: string | null;
} {
	return {
		isVerified: user.emailVerified,
		email: user.email,
		lastSignInTime: user.metadata.lastSignInTime,
	};
}

// Check if user has password credential
export function hasPasswordCredential(user: User): boolean {
	return user.providerData.some(provider => provider.providerId === "password");
}

// Get user's federated providers
export function getFederatedProviders(user: User): string[] {
	return user.providerData
		.filter(provider => provider.providerId !== "password")
		.map(provider => provider.providerId);
}

export async function requestEmailChange({
	auth,
	user,
	newEmail,
}: {
	auth: Auth;
	user: User;
	newEmail: string;
}): Promise<{ success: boolean; error?: string }> {
	try {
		// Basic validation
		if (!isValidEmail(newEmail)) {
			return { success: false, error: ERROR_MESSAGES["auth/invalid-email"] };
		}

		if (newEmail.toLowerCase() === user.email?.toLowerCase()) {
			return { success: false, error: "This is already your current email address." };
		}

		// Send verification email
		await verifyBeforeUpdateEmail(user, newEmail);
		return { success: true };
	} catch (error: any) {
		console.error("Email change request failed:", error);
		return { success: false, error: getErrorMessage(error) };
	}
}

export async function reauthWithPassword({
	user,
	currentPassword,
}: {
	user: User;
	currentPassword: string;
}): Promise<{ success: boolean; error?: string }> {
	try {
		if (!user.email) {
			return { success: false, error: "No email address found for this account." };
		}

		const credential = EmailAuthProvider.credential(user.email, currentPassword);
		await reauthenticateWithCredential(user, credential);
		return { success: true };
	} catch (error: any) {
		console.error("Password reauth failed:", error);
		return { success: false, error: getErrorMessage(error) };
	}
}

export async function reauthWithProvider({
	auth,
	providerId,
}: {
	auth: Auth;
	providerId: "google.com" | "apple.com";
}): Promise<{ success: boolean; error?: string; user?: User }> {
	try {
		let provider;
		if (providerId === "google.com") {
			provider = new GoogleAuthProvider();
		} else if (providerId === "apple.com") {
			provider = new OAuthProvider("apple.com");
			provider.addScope("email");
			provider.addScope("name");
		} else {
			return { success: false, error: "Unsupported provider" };
		}

		const result = await signInWithPopup(auth, provider);
		return { success: true, user: result.user };
	} catch (error: any) {
		console.error("Provider reauth failed:", error);
		return { success: false, error: getErrorMessage(error) };
	}
}

export async function requestPasswordReset({
	auth,
	email,
}: {
	auth: Auth;
	email: string;
}): Promise<{ success: boolean; error?: string }> {
	try {
		if (!isValidEmail(email)) {
			return { success: false, error: ERROR_MESSAGES["auth/invalid-email"] };
		}

		await sendPasswordResetEmail(auth, email);
		return { success: true };
	} catch (error: any) {
		console.error("Password reset request failed:", error);
		return { success: false, error: getErrorMessage(error) };
	}
}
