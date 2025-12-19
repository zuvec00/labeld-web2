"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getAuth } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/firebaseConfig";
import {
	useScanner,
	type ScanResult as ScanResultType,
} from "@/hooks/useScanner";
import CameraScanner from "@/components/scanner/CameraScanner";
import ScannerHUD from "@/components/scanner/ScannerHUD";
import ScanResult from "@/components/scanner/ScanResult";
import ManualEntryModal from "@/components/scanner/ManualEntryModal";
import { Spinner } from "@/components/ui/spinner";
import Button from "@/components/ui/button";
import OfflineIndicator from "@/components/pwa/OfflineIndicator";
import { ArrowLeft } from "lucide-react";

export default function ScannerPage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const auth = getAuth();

	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [eventId, setEventId] = useState<string | null>(null);
	const [eventName, setEventName] = useState<string>("");
	const [hasAccess, setHasAccess] = useState(false);

	const [showManualEntry, setShowManualEntry] = useState(false);
	const [currentResult, setCurrentResult] = useState<ScanResultType | null>(
		null
	);
	const [soundEnabled, setSoundEnabled] = useState(true);

	// Get eventId from URL params
	const urlEventId = searchParams.get("eventId");

	const {
		isScanning,
		results,
		counts,
		startScanning,
		stopScanning,
		processQRCode,
		lookupTicketByCode,
		isProcessing,
	} = useScanner(eventId || "");

	// Check authentication and permissions
	useEffect(() => {
		const checkAccess = async () => {
			try {
				const user = auth.currentUser;
				if (!user) {
					router.push("/");
					return;
				}

				// Get eventId from URL or prompt user
				const targetEventId = urlEventId;
				if (!targetEventId) {
					// TODO: Show event selection modal
					setError("Please select an event to scan tickets for");
					setIsLoading(false);
					return;
				}

				setEventId(targetEventId);

				// Check if user has scanner access for this event
				const organizerRef = doc(
					db,
					"events",
					targetEventId,
					"organizers",
					user.uid
				);
				const organizerSnap = await getDoc(organizerRef);

				if (!organizerSnap.exists()) {
					setError("You don't have access to scan tickets for this event");
					setIsLoading(false);
					return;
				}

				const organizerData = organizerSnap.data();
				const roles = organizerData?.roles || [];

				if (
					!roles.includes("owner") &&
					!roles.includes("manager") &&
					!roles.includes("scanner")
				) {
					setError("You don't have scanner permissions for this event");
					setIsLoading(false);
					return;
				}

				// Get event details
				const eventRef = doc(db, "events", targetEventId);
				const eventSnap = await getDoc(eventRef);

				if (eventSnap.exists()) {
					const eventData = eventSnap.data();
					setEventName(eventData?.title || "Unknown Event");
				}

				setHasAccess(true);
				setIsLoading(false);
			} catch (err: unknown) {
				console.error("Error checking access:", err);
				setError(
					err instanceof Error ? err.message : "Failed to verify access"
				);
				setIsLoading(false);
			}
		};

		checkAccess();
	}, [auth.currentUser, router, urlEventId]);

	// Local throttle for audio/feedback to prevent spamming while processing or immediately after
	const lastProcessedRef = useRef<{ code: string; time: number } | null>(null);

	// Handle QR code detection
	const handleQRCodeDetected = (qrString: string) => {
		// 1. Prevent processing if we are already busy
		if (isProcessing) return;

		const now = Date.now();

		// 2. Prevent re-processing the EXACT same code too quickly (spam prevention)
		// This is distinct from the hook's logic because we want to stop the *beep* too.
		if (
			lastProcessedRef.current &&
			lastProcessedRef.current.code === qrString &&
			now - lastProcessedRef.current.time < 2000 // 2s silence for same code
		) {
			return;
		}

		lastProcessedRef.current = { code: qrString, time: now };

		// Play sound if enabled
		if (soundEnabled) {
			// Simple beep using Web Audio API as fallback/primary to avoid asset dependencies
			try {
				const ctx = new (window.AudioContext ||
					(window as any).webkitAudioContext)();
				const osc = ctx.createOscillator();
				const gain = ctx.createGain();
				osc.connect(gain);
				gain.connect(ctx.destination);
				osc.type = "sine";
				osc.frequency.value = 880; // A5
				gain.gain.setValueAtTime(0.1, ctx.currentTime);
				gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
				osc.start();
				osc.stop(ctx.currentTime + 0.1);
			} catch (e) {
				console.error("Audio play failed", e);
			}
		}

		processQRCode(qrString);
	};

	// Handle manual entry
	const handleManualEntry = () => {
		setShowManualEntry(true);
	};

	// Handle ticket lookup
	const handleLookupTicket = async (code: string) => {
		if (!eventId) throw new Error("No event selected");
		return await lookupTicketByCode(code);
	};

	// Handle using ticket from manual lookup
	const handleUseTicket = useCallback(
		async (qrString: string) => {
			await processQRCode(qrString);
		},
		[processQRCode]
	);

	// Toggle scanning
	const handleToggleScanning = async () => {
		if (isScanning) {
			await stopScanning();
		} else {
			await startScanning();
		}
	};

	// Show latest result
	useEffect(() => {
		if (results.length > 0) {
			setCurrentResult(results[0]);
		}
	}, [results]);

	if (isLoading) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-bg relative overflow-hidden">
				{/* Loading Background Animation */}
				<div className="absolute inset-0 z-0">
					<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-accent/5 rounded-full blur-3xl animate-pulse"></div>
				</div>
				<div className="text-center relative z-10">
					<Spinner size="lg" />
					<p className="mt-4 text-text-muted font-medium tracking-wide animate-pulse">
						VERIFYING ACCESS...
					</p>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-bg p-4">
				<div className="max-w-md w-full text-center bg-surface/50 p-8 rounded-2xl border border-white/5 backdrop-blur-sm">
					<div className="text-6xl mb-6">🚫</div>
					<h1 className="font-heading font-semibold text-2xl mb-2 text-white">
						Access Denied
					</h1>
					<p className="text-text-muted mb-8 text-lg">{error}</p>
					<Button
						text="Go Back"
						variant="primary"
						onClick={() => router.back()}
						className="w-full"
					/>
				</div>
			</div>
		);
	}

	if (!hasAccess || !eventId) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-bg p-4">
				<div className="max-w-md w-full text-center bg-surface/50 p-8 rounded-2xl border border-white/5 backdrop-blur-sm">
					<div className="text-6xl mb-6">🔒</div>
					<h1 className="font-heading font-semibold text-2xl mb-2 text-white">
						No Access
					</h1>
					<p className="text-text-muted mb-8 text-lg">
						You don&apos;t have permission to scan tickets for this event.
					</p>
					<Button
						text="Go Back"
						variant="primary"
						onClick={() => router.back()}
						className="w-full"
					/>
				</div>
			</div>
		);
	}

	return (
		<div className="h-dvh bg-bg flex flex-col md:flex-row overflow-hidden relative selection:bg-accent selection:text-bg">
			<OfflineIndicator />

			{/* Background Ambient Glow */}
			<div className="fixed inset-0 pointer-events-none z-0">
				<div className="absolute top-[-20%] left-[-10%] w-[50vh] h-[50vh] bg-accent/5 rounded-full blur-[120px]" />
				<div className="absolute bottom-[-20%] right-[-10%] w-[60vh] h-[60vh] bg-blue-500/5 rounded-full blur-[150px]" />
			</div>

			{/* Left Column (Desktop) / Top Section (Mobile) - HUD & Info */}
			<div className="flex-none z-20 w-full md:w-[400px] md:h-full flex flex-col bg-surface/30 backdrop-blur-xl border-b md:border-b-0 md:border-r border-white/5 shadow-2xl transition-all">
				{/* Back Button */}
				<div className="p-4 flex items-center gap-2">
					<button
						onClick={() => router.back()}
						className="p-2 rounded-full hover:bg-white/10 text-text-muted hover:text-white transition-colors"
					>
						<ArrowLeft size={20} />
					</button>
					<span className="text-sm font-medium text-text-muted">
						Return to Dashboard
					</span>
				</div>

				<div className="flex-none md:flex-1 flex flex-col md:overflow-y-auto">
					{/* The HUD Component - Always visible */}
					<ScannerHUD
						eventName={eventName}
						gateName="Main Gate"
						counts={counts}
						isScanning={isScanning}
						onToggleScanning={handleToggleScanning}
						onManualEntry={handleManualEntry}
						onToggleSound={() => setSoundEnabled(!soundEnabled)}
						soundEnabled={soundEnabled}
						isProcessing={isProcessing}
					/>

					{/* Recent Activity Log (Desktop Only) */}
					<div className="hidden md:block flex-1 p-4 overflow-y-auto">
						<h3 className="text-sm font-heading font-semibold text-text-muted mb-4 uppercase tracking-wider">
							Recent Local Scans
						</h3>
						<div className="space-y-2">
							{results.slice(0, 5).map((res, i) => (
								<div
									key={i}
									className={`p-3 rounded-lg border ${
										res.type === "success"
											? "bg-green-500/5 border-green-500/10"
											: res.type === "duplicate"
											? "bg-amber-500/5 border-amber-500/10"
											: "bg-red-500/5 border-red-500/10"
									}`}
								>
									<div className="flex justify-between items-start">
										<span
											className={`font-medium ${
												res.type === "success"
													? "text-green-400"
													: res.type === "duplicate"
													? "text-amber-400"
													: "text-red-400"
											}`}
										>
											{res.message}
										</span>
										<span className="text-xs text-text-muted opacity-50">
											{res.timestamp.toLocaleTimeString([], {
												hour: "2-digit",
												minute: "2-digit",
											})}
										</span>
									</div>
									{res.ticket && (
										<div className="text-xs text-text-muted mt-1 font-mono">
											{res.ticket.ticketCode} • {res.ticket.ticketTypeId}
										</div>
									)}
								</div>
							))}
							{results.length === 0 && (
								<p className="text-sm text-text-muted italic opacity-50 text-center py-8">
									No scans yet this session
								</p>
							)}
						</div>
					</div>
				</div>
			</div>

			{/* Main Content - Scanner Viewport */}
			<div className="flex-1 relative z-10 flex flex-col min-h-0 md:h-full p-4 md:p-6 lg:p-8">
				<div className="flex-1 relative w-full h-full rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl border border-white/5 bg-black">
					<CameraScanner
						onQRCodeDetected={handleQRCodeDetected}
						isActive={isScanning}
						isProcessing={isProcessing}
						className="w-full h-full"
					/>
				</div>

				{/* Floating Results Overlay */}
				{currentResult && (
					<ScanResult
						result={currentResult}
						onClose={() => setCurrentResult(null)}
					/>
				)}

				{/* Manual Entry Overlay - Global */}
				<ManualEntryModal
					isOpen={showManualEntry}
					onClose={() => setShowManualEntry(false)}
					onLookup={handleLookupTicket}
					onUseTicket={handleUseTicket}
				/>
			</div>
		</div>
	);
}
