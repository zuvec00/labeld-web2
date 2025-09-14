import type {} from "next";
import { Manrope, Unbounded } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth/AuthContext";
import RegisterSW from "@/components/pwa/RegisterSW";
import InstallPrompt from "@/components/pwa/InstallPrompt";
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
	title: "Labeld Scanner",
	description:
		"Professional ticket scanning and event management for Labeld events",
	manifest: "/manifest.webmanifest",
	themeColor: "#FF5A2E",
	viewport:
		"width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover",
	appleWebApp: {
		capable: true,
		statusBarStyle: "black-translucent",
		title: "Labeld",
	},
	icons: {
		icon: [
			{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
			{ url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
		],
		apple: [
			{ url: "/icons/icon-152.png", sizes: "152x152", type: "image/png" },
			{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
		],
	},
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<head>
				{/* PWA Meta Tags */}
				<meta name="apple-mobile-web-app-capable" content="yes" />
				<meta
					name="apple-mobile-web-app-status-bar-style"
					content="black-translucent"
				/>
				<meta name="apple-mobile-web-app-title" content="Labeld" />
				<meta name="mobile-web-app-capable" content="yes" />
				<meta name="application-name" content="Labeld" />

				{/* iOS Splash Screens */}
				<link rel="apple-touch-startup-image" href="/icons/icon-512.png" />

				{/* Theme Colors */}
				<meta name="theme-color" content="#FF5A2E" />
				<meta name="msapplication-TileColor" content="#FF5A2E" />
				<meta name="msapplication-config" content="/browserconfig.xml" />

				{/* Prevent zoom on iOS */}
				<meta
					name="viewport"
					content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover"
				/>
			</head>
			<body className={`${unbounded.variable} ${manrope.variable} antialiased`}>
				<RegisterSW />
				<InstallPrompt />
				<AuthProvider>{children}</AuthProvider>
			</body>
		</html>
	);
}
