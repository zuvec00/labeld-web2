"use client";

import { useEffect, useState, useCallback } from "react";
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

	// Handle QR code detection
	const handleQRCodeDetected = (qrString: string) => {
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
		(qrString: string) => {
			processQRCode(qrString);
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
			<div className="min-h-screen flex items-center justify-center bg-bg">
				<div className="text-center">
					<Spinner size="lg" />
					<p className="mt-4 text-text-muted">Verifying access...</p>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-bg p-4">
				<div className="max-w-md w-full text-center">
					<div className="text-6xl mb-4">🚫</div>
					<h1 className="font-heading font-semibold text-xl mb-2">
						Access Denied
					</h1>
					<p className="text-text-muted mb-6">{error}</p>
					<Button
						text="Go Back"
						variant="primary"
						onClick={() => router.back()}
					/>
				</div>
			</div>
		);
	}

	if (!hasAccess || !eventId) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-bg p-4">
				<div className="max-w-md w-full text-center">
					<div className="text-6xl mb-4">🔒</div>
					<h1 className="font-heading font-semibold text-xl mb-2">No Access</h1>
					<p className="text-text-muted mb-6">
						You don&apos;t have permission to scan tickets for this event.
					</p>
					<Button
						text="Go Back"
						variant="primary"
						onClick={() => router.back()}
					/>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-bg flex flex-col">
			{/* HUD */}
			<ScannerHUD
				eventName={eventName}
				gateName="Main Gate" // TODO: Get from session or user preference
				counts={counts}
				isScanning={isScanning}
				onToggleScanning={handleToggleScanning}
				onManualEntry={handleManualEntry}
				onToggleSound={() => setSoundEnabled(!soundEnabled)}
				soundEnabled={soundEnabled}
			/>

			{/* Camera Scanner */}
			<div className="flex-1 p-4">
				<CameraScanner
					onQRCodeDetected={handleQRCodeDetected}
					isActive={isScanning}
					className="h-full max-h-[calc(100vh-200px)]"
				/>
			</div>

			{/* Scan Result Modal */}
			{currentResult && (
				<ScanResult
					result={currentResult}
					onClose={() => setCurrentResult(null)}
				/>
			)}

			{/* Manual Entry Modal */}
			<ManualEntryModal
				isOpen={showManualEntry}
				onClose={() => setShowManualEntry(false)}
				onLookup={handleLookupTicket}
				onUseTicket={handleUseTicket}
			/>
		</div>
	);
}
