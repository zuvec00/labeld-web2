// components/bookings/QRScannerPlaceholder.tsx
"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Camera, QrCode } from "lucide-react";

export default function QRScannerPlaceholder() {
	const router = useRouter();

	const handleStartScan = () => {
		router.push("/scan-booking");
	};

	return (
		<div className="flex flex-col items-center justify-center h-full min-h-[400px] bg-surface-secondary rounded-lg p-8">
			<div className="text-center space-y-4">
				<div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-stroke/50 mb-4">
					<QrCode className="w-12 h-12 text-text-muted" />
				</div>

				<div>
					<h3 className="text-lg font-semibold text-text mb-2">
						QR Code Scanner
					</h3>
					<p className="text-sm text-text-muted max-w-sm">
						Scan an approved reservation QR code to check in guests
					</p>
				</div>

				<Button onClick={handleStartScan} size="lg" className="mt-4">
					<Camera className="w-4 h-4 mr-2" />
					Start Scanner
				</Button>

				<p className="text-xs text-text-muted mt-6">
					Opens full-screen camera scanner
				</p>
			</div>
		</div>
	);
}
