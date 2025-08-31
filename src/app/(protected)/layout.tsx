"use client";

import { AuthGuard } from "@/lib/auth/AuthContext";

export default function ProtectedLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return <AuthGuard>{children}</AuthGuard>;
}
