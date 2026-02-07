"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { verifyBookingQrCF } from "@/lib/firebase/callables/bookings";
import {
	searchBookingRequests,
	checkInBooking,
} from "@/lib/firebase/queries/bookings";
import { BookingRequest } from "@/lib/models/booking";
import CameraScanner from "@/components/scanner/CameraScanner";
import BookingStatusPill from "@/components/bookings/BookingStatusPill";
import { Spinner } from "@/components/ui/spinner";
import Button from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import OfflineIndicator from "@/components/pwa/OfflineIndicator";
import {
	ArrowLeft,
	CheckCircle2,
	XCircle,
	Calendar,
	Clock,
	Users,
	Mail,
	Phone,
	Search,
	ChevronDown,
	ChevronUp,
} from "lucide-react";
import { useToast } from "@/app/hooks/use-toast";

interface ScanResult {
	type: "success" | "error";
	message: string;
	booking?: {
		id: string;
		guest: {
			firstName: string;
			lastName: string;
			email: string;
			phone: string;
		};
		booking: {
			dateISO: string;
			time: string;
			partySize: number;
			notes?: string;
		};
		checkIn?: {
			code?: string;
			scannedAt?: unknown;
		};
		status: string;
	};
	timestamp: Date;
}

export default function BookingScannerPage() {
	const router = useRouter();
	const { user } = useAuth();
	const { toast } = useToast();

	const [isScanning, setIsScanning] = useState(false);
	const [isProcessing, setIsProcessing] = useState(false);
	const [currentResult, setCurrentResult] = useState<ScanResult | null>(null);
	const [recentScans, setRecentScans] = useState<ScanResult[]>([]);
	const [soundEnabled, setSoundEnabled] = useState(true);

	// Manual lookup state
	const [manualLookupOpen, setManualLookupOpen] = useState(false);
	const [searchTerm, setSearchTerm] = useState("");
	const [searchResults, setSearchResults] = useState<BookingRequest[]>([]);
	const [searching, setSearching] = useState(false);
	const [checkingIn, setCheckingIn] = useState(false);

	const lastProcessedRef = useRef<{ code: string; time: number } | null>(null);

	// Handle manual search
	const handleSearch = async () => {
		if (!user?.uid || !searchTerm.trim()) return;

		setSearching(true);
		try {
			const results = await searchBookingRequests(user.uid, searchTerm);
			setSearchResults(results);
			if (results.length === 0) {
				toast({
					title: "No reservations found",
					duration: 3000,
				});
			}
		} catch (error) {
			console.error("Error searching bookings:", error);
			toast({
				title: "Failed to search reservations",
				variant: "destructive",
			});
		} finally {
			setSearching(false);
		}
	};

	// Handle manual check-in
	const handleCheckIn = async (requestId: string) => {
		setCheckingIn(true);
		try {
			await checkInBooking(requestId, user?.uid);
			toast({
				title: "Guest checked in successfully!",
				duration: 3000,
			});

			// Update local state
			setSearchResults((prev) =>
				prev.map((r) =>
					r.id === requestId ? { ...r, status: "checked_in" as const } : r,
				),
			);
		} catch (error) {
			console.error("Error checking in guest:", error);
			toast({
				title: "Failed to check in guest",
				variant: "destructive",
			});
		} finally {
			setCheckingIn(false);
		}
	};

	// Handle QR code detection
	const handleQRCodeDetected = useCallback(
		async (qrString: string) => {
			if (isProcessing) return;

			const now = Date.now();

			// Prevent re-processing the same code too quickly
			if (
				lastProcessedRef.current &&
				lastProcessedRef.current.code === qrString &&
				now - lastProcessedRef.current.time < 3000
			) {
				return;
			}

			lastProcessedRef.current = { code: qrString, time: now };

			// Play beep sound
			if (soundEnabled) {
				try {
					const ctx = new (
						window.AudioContext || (window as any).webkitAudioContext
					)();
					const osc = ctx.createOscillator();
					const gain = ctx.createGain();
					osc.connect(gain);
					gain.connect(ctx.destination);
					osc.type = "sine";
					osc.frequency.value = 880;
					gain.gain.setValueAtTime(0.1, ctx.currentTime);
					gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
					osc.start();
					osc.stop(ctx.currentTime + 0.1);
				} catch (e) {
					console.error("Audio play failed", e);
				}
			}

			setIsProcessing(true);

			try {
				const result = await verifyBookingQrCF({ qrString });

				const scanResult: ScanResult = {
					type: "success",
					message: result.booking?.checkIn?.scannedAt
						? "Already scanned - Welcome back!"
						: "Booking verified successfully!",
					booking: result.booking,
					timestamp: new Date(),
				};

				setCurrentResult(scanResult);
				setRecentScans((prev) => [scanResult, ...prev.slice(0, 9)]);

				// Success sound
				playSound("success");
			} catch (error: any) {
				let message = "Invalid or unauthorized QR code";

				if (error?.message) {
					if (error.message.includes("not approved")) {
						message = "Booking not approved yet";
					} else if (error.message.includes("not found")) {
						message = "Booking not found";
					} else if (error.message.includes("not authorized")) {
						message = "You are not authorized to scan this booking";
					} else if (error.message.includes("Invalid QR")) {
						message = "Invalid QR code format";
					}
				}

				const scanResult: ScanResult = {
					type: "error",
					message,
					timestamp: new Date(),
				};

				setCurrentResult(scanResult);
				setRecentScans((prev) => [scanResult, ...prev.slice(0, 9)]);

				// Error sound
				playSound("error");
			} finally {
				setTimeout(() => {
					setIsProcessing(false);
				}, 500);
			}
		},
		[isProcessing, soundEnabled],
	);

	const handleToggleScanning = () => {
		setIsScanning(!isScanning);
	};

	const playSound = (type: "success" | "error") => {
		try {
			const audioContext = new (
				window.AudioContext || (window as any).webkitAudioContext
			)();
			const oscillator = audioContext.createOscillator();
			const gainNode = audioContext.createGain();

			oscillator.connect(gainNode);
			gainNode.connect(audioContext.destination);

			const frequencies = type === "success" ? [800, 1000, 1200] : [200, 150];

			oscillator.frequency.setValueAtTime(
				frequencies[0],
				audioContext.currentTime,
			);
			if (frequencies[1]) {
				oscillator.frequency.setValueAtTime(
					frequencies[1],
					audioContext.currentTime + 0.1,
				);
			}
			if (frequencies[2]) {
				oscillator.frequency.setValueAtTime(
					frequencies[2],
					audioContext.currentTime + 0.2,
				);
			}

			gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
			gainNode.gain.exponentialRampToValueAtTime(
				0.01,
				audioContext.currentTime + 0.3,
			);

			oscillator.start(audioContext.currentTime);
			oscillator.stop(audioContext.currentTime + 0.3);
		} catch {
			console.log("Audio not available");
		}
	};

	return (
		<div className="h-dvh bg-bg flex flex-col md:flex-row overflow-hidden relative">
			<OfflineIndicator />

			{/* Background */}
			<div className="fixed inset-0 pointer-events-none z-0">
				<div className="absolute top-[-20%] left-[-10%] w-[50vh] h-[50vh] bg-accent/5 rounded-full blur-[120px]" />
				<div className="absolute bottom-[-20%] right-[-10%] w-[60vh] h-[60vh] bg-blue-500/5 rounded-full blur-[150px]" />
			</div>

			{/* Left Sidebar - Fixed max height on mobile */}
			<div className="flex-none z-20 w-full md:w-[400px] h-auto md:h-full max-h-[40vh] md:max-h-full flex flex-col bg-surface/30 backdrop-blur-xl border-b md:border-b-0 md:border-r border-white/5 shadow-2xl overflow-hidden">
				{/* Back Button */}
				<div className="p-4 flex items-center gap-2 border-b border-white/5 flex-shrink-0">
					<button
						onClick={() => router.back()}
						className="p-2 rounded-full hover:bg-white/10 text-text-muted hover:text-white transition-colors"
					>
						<ArrowLeft size={20} />
					</button>
					<span className="text-sm font-medium text-text-muted">
						Booking Scanner
					</span>
				</div>

				{/* Scrollable content area */}
				<div className="flex-1 overflow-y-auto">
					{/* Controls */}
					<div className="p-4 space-y-4 border-b border-white/5">
						<div className="bg-surface-secondary/50 rounded-lg p-4">
							<h2 className="text-lg font-heading font-semibold text-text mb-2">
								Scanner Controls
							</h2>
							<div className="space-y-2">
								<Button
									onClick={handleToggleScanning}
									text={isScanning ? "Stop Scanning" : "Start Scanning"}
									variant={isScanning ? "danger" : "primary"}
									className="w-full"
									disabled={isProcessing}
								/>
								<button
									onClick={() => setSoundEnabled(!soundEnabled)}
									className="w-full p-2 text-sm rounded-lg border border-white/10 hover:bg-white/5 transition-colors text-text-muted"
								>
									Sound: {soundEnabled ? "On" : "Off"}
								</button>
							</div>
						</div>

						{isProcessing && (
							<div className="flex items-center justify-center gap-2 text-text-muted">
								<Spinner size="sm" />
								<span className="text-sm">Processing...</span>
							</div>
						)}
					</div>

					{/* Manual Lookup Section */}
					<div className="border-b border-white/5">
						<button
							onClick={() => setManualLookupOpen(!manualLookupOpen)}
							className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
						>
							<div className="flex items-center gap-2">
								<Search className="w-4 h-4 text-text-muted" />
								<span className="text-sm font-medium text-text">
									Manual Lookup
								</span>
							</div>
							{manualLookupOpen ? (
								<ChevronUp className="w-4 h-4 text-text-muted" />
							) : (
								<ChevronDown className="w-4 h-4 text-text-muted" />
							)}
						</button>

						{manualLookupOpen && (
							<div className="p-4 space-y-3 bg-surface-secondary/30">
								<p className="text-xs text-text-muted">
									Search by guest name, phone, or check-in code
								</p>
								<div className="flex gap-2">
									<Input
										placeholder="Name, phone, or code..."
										value={searchTerm}
										onChange={(e) => setSearchTerm(e.target.value)}
										onKeyDown={(e) => e.key === "Enter" && handleSearch()}
										className="flex-1 text-sm"
									/>
									<Button
										onClick={handleSearch}
										disabled={searching || !searchTerm.trim()}
										text={searching ? "..." : "Search"}
										size="sm"
									/>
								</div>

								{/* Search Results */}
								<div className="space-y-2 max-h-60 overflow-y-auto">
									{searchResults.map((booking) => (
										<div
											key={booking.id}
											className="p-3 rounded-lg bg-surface border border-stroke hover:border-primary/50 transition-colors"
										>
											<div className="flex items-start justify-between mb-2">
												<span className="font-medium text-text text-sm">
													{booking.guest.firstName} {booking.guest.lastName}
												</span>
												<BookingStatusPill status={booking.status} />
											</div>

											<div className="grid grid-cols-2 gap-2 text-xs text-text-muted mb-2">
												<div className="flex items-center gap-1">
													<Calendar className="w-3 h-3" />
													<span>{booking.booking.dateISO}</span>
												</div>
												<div className="flex items-center gap-1">
													<Clock className="w-3 h-3" />
													<span>{booking.booking.time}</span>
												</div>
											</div>

											{booking.status === "approved" && (
												<Button
													onClick={() => handleCheckIn(booking.id)}
													disabled={checkingIn}
													className="w-full"
													size="sm"
													text={checkingIn ? "Checking in..." : "Check In"}
												/>
											)}

											{booking.status === "checked_in" && (
												<div className="text-xs text-center text-green-400">
													✓ Already checked in
												</div>
											)}
										</div>
									))}

									{searchResults.length === 0 && searchTerm && !searching && (
										<div className="text-center py-4 text-xs text-text-muted">
											No reservations found
										</div>
									)}
								</div>
							</div>
						)}
					</div>

					{/* Recent Scans - Hidden on mobile to save space */}
					<div className="hidden md:block p-4">
						<h3 className="text-sm font-heading font-semibold text-text-muted mb-4 uppercase tracking-wider">
							Recent Scans
						</h3>
						<div className="space-y-2">
							{recentScans.map((scan, i) => (
								<div
									key={i}
									className={`p-3 rounded-lg border ${
										scan.type === "success"
											? "bg-green-500/5 border-green-500/10"
											: "bg-red-500/5 border-red-500/10"
									}`}
								>
									<div className="flex justify-between items-start">
										<span
											className={`font-medium text-sm ${
												scan.type === "success"
													? "text-green-400"
													: "text-red-400"
											}`}
										>
											{scan.message}
										</span>
										<span className="text-xs text-text-muted opacity-50">
											{scan.timestamp.toLocaleTimeString([], {
												hour: "2-digit",
												minute: "2-digit",
											})}
										</span>
									</div>
									{scan.booking && (
										<div className="text-xs text-text-muted mt-1">
											{scan.booking.guest.firstName}{" "}
											{scan.booking.guest.lastName} •{" "}
											{scan.booking.booking.partySize} guests
										</div>
									)}
								</div>
							))}
							{recentScans.length === 0 && (
								<p className="text-sm text-text-muted italic opacity-50 text-center py-8">
									No scans yet
								</p>
							)}
						</div>
					</div>
				</div>
			</div>

			{/* Scanner Viewport - Takes remaining space */}
			<div className="flex-1 relative z-10 flex flex-col min-h-[60vh] md:min-h-0 md:h-full p-4 md:p-6 lg:p-8">
				<div className="flex-1 relative w-full h-full rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl border border-white/5 bg-black">
					<CameraScanner
						onQRCodeDetected={handleQRCodeDetected}
						isActive={isScanning}
						isProcessing={isProcessing}
						className="w-full h-full"
					/>
				</div>

				{/* Result Overlay */}
				{currentResult && (
					<div className="absolute inset-0 flex items-center justify-center z-50 bg-black/70 backdrop-blur-sm">
						<div
							className={`max-w-lg w-full mx-4 rounded-2xl border ${
								currentResult.type === "success"
									? "bg-green-500/10 border-green-500/20"
									: "bg-red-500/10 border-red-500/20"
							} p-6 shadow-2xl`}
						>
							<div className="flex items-center gap-3 mb-4">
								{currentResult.type === "success" ? (
									<CheckCircle2 className="w-8 h-8 text-green-400" />
								) : (
									<XCircle className="w-8 h-8 text-red-400" />
								)}
								<h2
									className={`text-xl font-semibold ${
										currentResult.type === "success"
											? "text-green-400"
											: "text-red-400"
									}`}
								>
									{currentResult.message}
								</h2>
							</div>

							{currentResult.booking && (
								<div className="space-y-3 text-text">
									<div className="flex items-center gap-2">
										<Users className="w-4 h-4 text-text-muted" />
										<span className="font-medium">
											{currentResult.booking.guest.firstName}{" "}
											{currentResult.booking.guest.lastName}
										</span>
									</div>
									<div className="flex items-center gap-2">
										<Calendar className="w-4 h-4 text-text-muted" />
										<span>{currentResult.booking.booking.dateISO}</span>
									</div>
									<div className="flex items-center gap-2">
										<Clock className="w-4 h-4 text-text-muted" />
										<span>{currentResult.booking.booking.time}</span>
									</div>
									<div className="flex items-center gap-2">
										<Users className="w-4 h-4 text-text-muted" />
										<span>
											{currentResult.booking.booking.partySize} guests
										</span>
									</div>
									<div className="flex items-center gap-2">
										<Mail className="w-4 h-4 text-text-muted" />
										<span className="text-sm">
											{currentResult.booking.guest.email}
										</span>
									</div>
									<div className="flex items-center gap-2">
										<Phone className="w-4 h-4 text-text-muted" />
										<span className="text-sm">
											{currentResult.booking.guest.phone}
										</span>
									</div>
								</div>
							)}

							<Button
								onClick={() => setCurrentResult(null)}
								text="Continue Scanning"
								variant="secondary"
								className="w-full mt-6"
							/>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
