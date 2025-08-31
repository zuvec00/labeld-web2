import type {} from "next";
import { Manrope, Unbounded } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth/AuthContext";
const unbounded = Unbounded({
	subsets: ["latin"],
	variable: "--font-unbounded",
	display: "swap",
});

const manrope = Manrope({
	subsets: ["latin"],
	variable: "--font-manrope",
	display: "swap",
});

export const metadata = {
	title: "Labeld",
	description: "Built for labels, not just likes",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<body className={`${unbounded.variable} ${manrope.variable} antialiased`}>
				<AuthProvider>{children}</AuthProvider>
			</body>
		</html>
	);
}
