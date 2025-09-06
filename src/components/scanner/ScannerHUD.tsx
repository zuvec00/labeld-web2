"use client";

import { useState } from "react";
import Button from "@/components/ui/button";

interface ScannerHUDProps {
	eventName: string;
	gateName?: string;
	counts: {
		accepted: number;
		duplicate: number;
		invalid: number;
	};
	isScanning: boolean;
	onToggleScanning: () => void;
	onManualEntry: () => void;
	onToggleSound: () => void;
	soundEnabled: boolean;
}

export default function ScannerHUD({
	eventName,
	gateName,
	counts,
	isScanning,
	onToggleScanning,
	onManualEntry,
	onToggleSound,
	soundEnabled,
}: ScannerHUDProps) {
	const [showStats, setShowStats] = useState(false);

	const totalScanned = counts.accepted + counts.duplicate + counts.invalid;

	return (
		<div className="bg-surface border-b border-stroke">
			{/* Header */}
			<div className="px-4 py-3">
				<div className="flex items-center justify-between">
					<div>
						<h1 className="font-heading font-semibold text-lg">{eventName}</h1>
						{gateName && (
							<p className="text-sm text-text-muted">Gate: {gateName}</p>
						)}
					</div>

					<div className="flex items-center gap-2">
						{/* Sound toggle */}
						<button
							onClick={onToggleSound}
							className={`p-2 rounded-lg border ${
								soundEnabled
									? "bg-accent text-bg border-accent"
									: "bg-bg text-text-muted border-stroke"
							}`}
							title={soundEnabled ? "Sound On" : "Sound Off"}
						>
							{soundEnabled ? "🔊" : "🔇"}
						</button>

						{/* Stats toggle */}
						<button
							onClick={() => setShowStats(!showStats)}
							className="p-2 bg-bg text-text-muted border border-stroke rounded-lg hover:bg-surface"
							title="Show Statistics"
						>
							📊
						</button>
					</div>
				</div>
			</div>

			{/* Statistics Panel */}
			{showStats && (
				<div className="px-4 pb-3 border-t border-stroke">
					<div className="grid grid-cols-3 gap-4 mt-3">
						<div className="text-center">
							<div className="text-2xl font-bold text-green-500">
								{counts.accepted}
							</div>
							<div className="text-xs text-text-muted">Accepted</div>
						</div>
						<div className="text-center">
							<div className="text-2xl font-bold text-amber-500">
								{counts.duplicate}
							</div>
							<div className="text-xs text-text-muted">Duplicate</div>
						</div>
						<div className="text-center">
							<div className="text-2xl font-bold text-red-500">
								{counts.invalid}
							</div>
							<div className="text-xs text-text-muted">Invalid</div>
						</div>
					</div>

					{totalScanned > 0 && (
						<div className="mt-3 pt-3 border-t border-stroke">
							<div className="flex justify-between text-sm">
								<span className="text-text-muted">Total Scanned:</span>
								<span className="font-medium">{totalScanned}</span>
							</div>
							<div className="flex justify-between text-sm">
								<span className="text-text-muted">Success Rate:</span>
								<span className="font-medium text-green-500">
									{Math.round((counts.accepted / totalScanned) * 100)}%
								</span>
							</div>
						</div>
					)}
				</div>
			)}

			{/* Controls */}
			<div className="px-4 py-3 border-t border-stroke">
				<div className="flex gap-3">
					<Button
						text={isScanning ? "Pause Scanning" : "Start Scanning"}
						variant={isScanning ? "secondary" : "primary"}
						onClick={onToggleScanning}
						className="flex-1"
					/>

					<Button
						text="Manual Entry"
						variant="secondary"
						onClick={onManualEntry}
						className="px-4"
					/>
				</div>
			</div>

			{/* Status Indicator */}
			<div className="px-4 pb-3">
				<div className="flex items-center gap-2">
					<div
						className={`w-2 h-2 rounded-full ${
							isScanning ? "bg-green-500 animate-pulse" : "bg-gray-400"
						}`}
					/>
					<span className="text-sm text-text-muted">
						{isScanning ? "Scanning active" : "Scanning paused"}
					</span>
				</div>
			</div>
		</div>
	);
}
