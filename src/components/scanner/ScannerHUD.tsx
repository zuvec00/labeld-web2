"use client";

import { useState } from "react";
import Button from "@/components/ui/button";
import {
	ChevronDown,
	ChevronUp,
	Volume2,
	VolumeX,
	BarChart2,
} from "lucide-react";

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
	isProcessing?: boolean;
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
	isProcessing = false,
}: ScannerHUDProps) {
	const [showStats, setShowStats] = useState(false);

	const totalScanned = counts.accepted + counts.duplicate + counts.invalid;
	const successRate =
		totalScanned > 0 ? Math.round((counts.accepted / totalScanned) * 100) : 0;

	return (
		<div className="bg-surface/80 backdrop-blur-md border-b border-white/10 shadow-lg z-30 transition-all duration-300">
			{/* Top Bar */}
			<div className="px-4 py-3 flex items-center justify-between">
				<div className="flex-1 min-w-0 mr-4">
					<h1 className="font-heading font-bold text-lg text-white truncate leading-tight">
						{eventName}
					</h1>
					{gateName && (
						<p className="text-xs text-text-muted mt-0.5 font-medium uppercase tracking-wider">
							{gateName}
						</p>
					)}
				</div>

				<div className="flex items-center gap-2 shrink-0">
					{/* Sound Toggle */}
					<button
						onClick={onToggleSound}
						className={`p-2.5 rounded-xl transition-all active:scale-95 ${
							soundEnabled
								? "bg-white/10 text-accent hover:bg-white/20"
								: "bg-transparent text-text-muted hover:bg-white/5"
						}`}
						title={soundEnabled ? "Mute Sound" : "Enable Sound"}
					>
						{soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
					</button>

					{/* Stats Toggle */}
					<button
						onClick={() => setShowStats(!showStats)}
						className={`p-2.5 rounded-xl transition-all active:scale-95 flex items-center gap-2 ${
							showStats
								? "bg-accent/20 text-accent"
								: "bg-transparent text-text-muted hover:bg-white/5"
						}`}
					>
						<BarChart2 size={20} />
						{showStats ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
					</button>
				</div>
			</div>

			{/* Stats Dashboard (Collapsible) */}
			<div
				className={`overflow-hidden transition-all duration-300 ease-in-out ${
					showStats ? "max-h-64 opacity-100" : "max-h-0 opacity-0"
				}`}
			>
				<div className="px-4 pb-4 pt-1">
					<div className="grid grid-cols-3 gap-3">
						<StatCard
							value={counts.accepted}
							label="Accepted"
							color="text-green-400"
							bg="bg-green-500/10 border-green-500/20"
						/>
						<StatCard
							value={counts.duplicate}
							label="Duplicate"
							color="text-amber-400"
							bg="bg-amber-500/10 border-amber-500/20"
						/>
						<StatCard
							value={counts.invalid}
							label="Invalid"
							color="text-red-400"
							bg="bg-red-500/10 border-red-500/20"
						/>
					</div>

					<div className="mt-3 flex justify-between items-center px-2 py-2 bg-white/5 rounded-lg text-sm border border-white/5">
						<span className="text-text-muted">
							Total Scans:{" "}
							<strong className="text-white">{totalScanned}</strong>
						</span>
						<span className="text-text-muted">
							Success Rate:{" "}
							<strong
								className={
									successRate > 90 ? "text-green-400" : "text-amber-400"
								}
							>
								{successRate}%
							</strong>
						</span>
					</div>
				</div>
			</div>

			{/* Action Bar */}
			<div className="px-4 py-3 pb-4 flex gap-3">
				<Button
					text={
						isProcessing
							? isScanning
								? "Pausing..."
								: "Resuming..."
							: isScanning
							? "Pause Scanning"
							: "Resume Scanning"
					}
					variant={isScanning ? "secondary" : "primary"}
					onClick={onToggleScanning}
					disabled={isProcessing}
					className={`flex-1 font-heading font-semibold tracking-wide shadow-lg ${
						isScanning
							? "bg-surface border-white/10 text-white hover:bg-white/5"
							: "bg-accent text-bg hover:opacity-90 shadow-accent/20"
					}`}
				/>

				<Button
					text="Manual"
					variant="secondary"
					onClick={onManualEntry}
					className="px-5 bg-surface border-white/10 text-white hover:bg-white/10"
				/>
			</div>

			{/* Active Indicator Line */}
			{isScanning && (
				<div className="h-1 w-full bg-surface overflow-hidden">
					<div className="h-full w-full bg-accent animate-progress-indeterminate origin-left" />
				</div>
			)}
		</div>
	);
}

function StatCard({
	value,
	label,
	color,
	bg,
}: {
	value: number;
	label: string;
	color: string;
	bg: string;
}) {
	return (
		<div
			className={`flex flex-col items-center justify-center p-3 rounded-xl border ${bg}`}
		>
			<span className={`text-2xl font-bold font-heading ${color}`}>
				{value}
			</span>
			<span className="text-xs text-text-muted uppercase tracking-wider font-medium mt-1">
				{label}
			</span>
		</div>
	);
}
