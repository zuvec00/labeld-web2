import type {} from "next";
import { Manrope, Unbounded } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth/AuthContext";
import RegisterSW from "@/components/pwa/RegisterSW";
import { Analytics } from "@vercel/analytics/next";
import InstallPrompt from "@/components/pwa/InstallPrompt";
import PageTracker from "@/components/analytics/PageTracker";
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
	title: {
		default: "Labeld Studio — Brand & Event Management Platform by Labeld",
		template: "%s | Labeld Studio",
	},
	description:
		"Labeld Studio is the official brand and event management platform by Labeld. Brands and organizers manage drops, events, orders, wallets, and content from one unified dashboard.",
	keywords: [
		"streetwear",
		"fashion brands",
		"event management",
		"african fashion",
		"brand studio",
		"merch drops",
		"ticketing platform",
		"culture",
	],
	authors: [{ name: "Labeld" }],
	creator: "Labeld",
	publisher: "Labeld",
	manifest: "/manifest.webmanifest",
	themeColor: "#FF5E2E",
	viewport:
		"width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover",
	appleWebApp: {
		capable: true,
		statusBarStyle: "black-translucent",
		title: "Labeld",
	},
	icons: {
		icon: [
			{ url: "/labeld_logo.ico", sizes: "192x192", type: "image/x-icon" },
			{ url: "/labeld_logo.ico", sizes: "512x512", type: "image/x-icon" },
		],
		apple: [
			{ url: "/labeld_logo.ico", sizes: "152x152", type: "image/x-icon" },
			{ url: "/labeld_logo.ico", sizes: "192x192", type: "image/x-icon" },
		],
	},
	openGraph: {
		type: "website",
		locale: "en_US",
		url: "https://studio.labeld.app",
		siteName: "Labeld Studio",
		title: "Labeld Studio - For the Culture, Not the Clout",
		description:
			"The platform where brands and event organizers manage their creative space, drops, and events. For the culture, not the clout.",
		images: [
			{
				url: "/labeld_logo.ico",
				width: 1200,
				height: 630,
				alt: "Labeld Studio",
			},
		],
	},
	twitter: {
		card: "summary_large_image",
		title: "Labeld Studio - For the Culture, Not the Clout",
		description:
			"The platform where brands and event organizers manage their creative space, drops, and events.",
		images: ["/labeld_logo.ico"],
		creator: "@labeld",
	},
	robots: {
		index: true,
		follow: true,
		googleBot: {
			index: true,
			follow: true,
			"max-video-preview": -1,
			"max-image-preview": "large",
			"max-snippet": -1,
		},
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
				<link rel="apple-touch-startup-image" href="/labeld_logo.png" />

				{/* Theme Colors */}
				<meta name="theme-color" content="#FF5E2E" />
				<meta name="msapplication-TileColor" content="#FF5E2E" />
				<meta name="msapplication-config" content="/browserconfig.xml" />

				{/* Prevent zoom on iOS */}
				<meta
					name="viewport"
					content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover"
				/>
			</head>
			<body className={`${unbounded.variable} ${manrope.variable} antialiased`}>
				<RegisterSW />
				{/* <InstallPrompt /> */}
				<AuthProvider>{children}</AuthProvider>
				{/* Analytics */}
				<Analytics />
				<PageTracker />
			</body>
		</html>
	);
}
