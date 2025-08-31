"use client";
import React, {
	createContext,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react";
import {
	onAuthStateChanged,
	signInWithPopup,
	GoogleAuthProvider,
	OAuthProvider,
	createUserWithEmailAndPassword,
	signInWithEmailAndPassword,
	signOut,
	User,
} from "firebase/auth";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/ui/spinner";
import { auth } from "../firebase/firebaseConfig";

// ——— Context ———
interface AuthState {
	user: User | null;
	loading: boolean;

	// email/password
	signUpWithEmail: (email: string, password: string) => Promise<User>;
	signInWithEmail: (email: string, password: string) => Promise<User>;

	// providers
	signInWithGoogle: () => Promise<User>;
	signInWithApple: () => Promise<User>;

	// other
	signOutApp: () => Promise<void>;
}

const Ctx = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const [user, setUser] = useState<User | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const unsub = onAuthStateChanged(auth, (u) => {
			setUser(u);
			setLoading(false);
		});
		return () => unsub();
	}, []);

	const value = useMemo<AuthState>(
		() => ({
			user,
			loading,

			async signUpWithEmail(email, password) {
				const cred = await createUserWithEmailAndPassword(
					auth,
					email,
					password
				);
				return cred.user;
			},
			async signInWithEmail(email, password) {
				const cred = await signInWithEmailAndPassword(auth, email, password);
				return cred.user;
			},

			// 🔹 Google Sign-In (popup)
			async signInWithGoogle() {
				const provider = new GoogleAuthProvider();

				try {
					const cred = await signInWithPopup(auth, provider);
					return cred.user!;
				} catch (err) {
					// Helpful error mapping for UI
					const code = err as string | undefined;
					if (code === "auth/popup-closed-by-user") {
						throw new Error("Sign-in cancelled.");
					}
					if (code === "auth/popup-blocked") {
						throw new Error(
							"Popup blocked by the browser. Please allow popups or try again."
						);
					}
					if (code === "auth/operation-not-allowed") {
						throw new Error("Google sign-in is disabled in Firebase.");
					}
					throw err;
				}
			},
			async signInWithApple() {
				const provider = new OAuthProvider("apple.com");
				provider.addScope("email");
				provider.addScope("name");
				const cred = await signInWithPopup(auth, provider);
				return cred.user!;
			},

			async signOutApp() {
				await signOut(auth);
			},
		}),
		[user, loading]
	);

	return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
	const ctx = useContext(Ctx);
	if (!ctx) throw new Error("useAuth must be used within AuthProvider");
	return ctx;
}

// ——— Minimal guard ———
export function AuthGuard({
	children,
	redirectTo = "/",
}: {
	children: React.ReactNode;
	redirectTo?: string;
}) {
	const { user, loading } = useAuth();
	const router = useRouter();

	useEffect(() => {
		if (!loading && !user) router.replace(redirectTo);
	}, [loading, user, router, redirectTo]);

	if (loading)
		return (
			<div className="flex h-[60vh] items-center justify-center">
				<Spinner size="md" className="mr-2" />;
			</div>
		);
	if (!user) return null;
	return <>{children}</>;
}
