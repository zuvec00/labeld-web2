"use client";

import { useEffect, useState } from "react";
import { ScanResult as ScanResultType } from "@/hooks/useScanner";
import { CheckCircle, AlertTriangle, XCircle, X } from "lucide-react";

interface ScanResultProps {
	result: ScanResultType;
	onClose: () => void;
}

export default function ScanResult({ result, onClose }: ScanResultProps) {
	const [isVisible, setIsVisible] = useState(false);

	useEffect(() => {
		// Small delay to allow enter animation
		const t1 = setTimeout(() => setIsVisible(true), 10);

		// Auto-hide
		const t2 = setTimeout(() => {
			setIsVisible(false);
			setTimeout(onClose, 300);
		}, 4000);

		return () => {
			clearTimeout(t1);
			clearTimeout(t2);
		};
	}, [onClose]);

	const getConfig = () => {
		switch (result.type) {
			case "success":
				return {
					bg: "bg-surface/90 border-green-500/50",
					text: "text-green-400",
					icon: <CheckCircle className="w-8 h-8 text-green-500" />,
					glow: "shadow-[0_0_30px_-5px_rgba(34,197,94,0.3)]",
				};
			case "duplicate":
				return {
					bg: "bg-surface/90 border-amber-500/50",
					text: "text-amber-400",
					icon: <AlertTriangle className="w-8 h-8 text-amber-500" />,
					glow: "shadow-[0_0_30px_-5px_rgba(245,158,11,0.3)]",
				};
			case "invalid":
				return {
					bg: "bg-surface/90 border-red-500/50",
					text: "text-red-400",
					icon: <XCircle className="w-8 h-8 text-red-500" />,
					glow: "shadow-[0_0_30px_-5px_rgba(239,68,68,0.3)]",
				};
		}
	};

	const config = getConfig();

	return (
		<div
			className={`absolute bottom-8 left-4 right-4 z-40 flex justify-center pointer-events-none transition-all duration-500 transform ${
				isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
			}`}
		>
			<div
				className={`relative w-full max-w-md backdrop-blur-xl border-2 rounded-2xl p-4 flex items-start gap-4 pointer-events-auto shadow-2xl ${config.bg} ${config.glow}`}
			>
				{/* Icon */}
				<div className="shrink-0 pt-1">{config.icon}</div>

				{/* Content */}
				<div className="flex-1 min-w-0">
					<h3
						className={`font-heading font-bold text-lg leading-tight mb-1 ${config.text}`}
					>
						{result.message}
					</h3>

					{result.ticket && (
						<div className="space-y-1 text-sm text-text-muted mt-2 bg-black/20 p-2 rounded-lg">
							<div className="flex justify-between">
								<span>Type:</span>
								<span className="font-medium text-white">
									{result.ticket.ticketTypeId}
								</span>
							</div>
							<div className="flex justify-between">
								<span>Code:</span>
								<span className="font-mono text-white/80">
									{result.ticket.ticketCode}
								</span>
							</div>
						</div>
					)}

					<div className="text-xs text-text-muted mt-2 opacity-60">
						{result.timestamp.toLocaleTimeString()}
					</div>
				</div>

				{/* Close Button */}
				<button
					onClick={() => {
						setIsVisible(false);
						setTimeout(onClose, 300);
					}}
					className="absolute top-2 right-2 p-1 text-white/30 hover:text-white transition-colors"
				>
					<X size={16} />
				</button>
			</div>
		</div>
	);
}
