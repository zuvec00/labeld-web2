"use client";

import { useEffect, useState } from "react";
import { ScanResult as ScanResultType } from "@/hooks/useScanner";

interface ScanResultProps {
	result: ScanResultType;
	onClose: () => void;
}

export default function ScanResult({ result, onClose }: ScanResultProps) {
	const [isVisible, setIsVisible] = useState(false);

	useEffect(() => {
		setIsVisible(true);

		// Auto-hide after 3 seconds
		const timer = setTimeout(() => {
			setIsVisible(false);
			setTimeout(onClose, 300); // Wait for animation to complete
		}, 3000);

		return () => clearTimeout(timer);
	}, [onClose]);

	const getResultStyles = () => {
		switch (result.type) {
			case "success":
				return {
					bgColor: "bg-green-500",
					borderColor: "border-green-400",
					textColor: "text-white",
					icon: "✅",
				};
			case "duplicate":
				return {
					bgColor: "bg-amber-500",
					borderColor: "border-amber-400",
					textColor: "text-white",
					icon: "⚠️",
				};
			case "invalid":
				return {
					bgColor: "bg-red-500",
					borderColor: "border-red-400",
					textColor: "text-white",
					icon: "❌",
				};
		}
	};

	const styles = getResultStyles();

	return (
		<div
			className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${
				isVisible ? "opacity-100" : "opacity-0"
			} transition-opacity duration-300`}
		>
			{/* Backdrop */}
			<div
				className="absolute inset-0 bg-black bg-opacity-50"
				onClick={onClose}
			/>

			{/* Result Card */}
			<div
				className={`relative ${styles.bgColor} ${
					styles.borderColor
				} border-2 rounded-2xl p-6 max-w-sm w-full text-center shadow-2xl transform ${
					isVisible ? "scale-100" : "scale-95"
				} transition-transform duration-300`}
			>
				{/* Close button */}
				<button
					onClick={onClose}
					className="absolute top-2 right-2 text-white text-opacity-70 hover:text-opacity-100 text-xl"
				>
					×
				</button>

				{/* Icon */}
				<div className="text-6xl mb-4">{styles.icon}</div>

				{/* Message */}
				<h3
					className={`${styles.textColor} font-heading font-semibold text-xl mb-2`}
				>
					{result.message}
				</h3>

				{/* Ticket details for successful scans */}
				{result.ticket && (
					<div className={`${styles.textColor} text-sm space-y-1 mt-4`}>
						<div className="bg-black bg-opacity-20 rounded-lg p-3">
							<div className="font-medium">Ticket Code</div>
							<div className="font-mono text-lg">
								{result.ticket.ticketCode}
							</div>
						</div>

						<div className="bg-black bg-opacity-20 rounded-lg p-3">
							<div className="font-medium">Ticket Type</div>
							<div>{result.ticket.ticketTypeId}</div>
						</div>
					</div>
				)}

				{/* Timestamp */}
				<div className={`${styles.textColor} text-xs mt-4 opacity-70`}>
					{result.timestamp.toLocaleTimeString()}
				</div>

				{/* Action button */}
				<button
					onClick={onClose}
					className={`mt-4 px-6 py-2 bg-black bg-opacity-20 ${styles.textColor} rounded-lg font-medium hover:bg-opacity-30 transition-colors`}
				>
					Continue Scanning
				</button>
			</div>
		</div>
	);
}
