"use client";
import { useEffect, useRef } from "react";
import QRCode from "qrcode";

type Props = {
	value: string;
	size?: number;
	className?: string;
};

export function TicketQR({ value, size = 256, className = "" }: Props) {
	const ref = useRef<HTMLCanvasElement>(null);

	useEffect(() => {
		if (!ref.current) return;

		QRCode.toCanvas(
			ref.current,
			value,
			{
				margin: 1,
				width: size,
				color: {
					dark: "#FFFFFF", // White QR code on dark background
					light: "#000000", // Black background
				},
			},
			(err: Error | null | undefined) => {
				if (err) console.error("QR render error:", err);
			}
		);
	}, [value, size]);

	return (
		<div
			className={`bg-surface border border-stroke rounded-2xl p-4 ${className}`}
		>
			<canvas ref={ref} aria-label="Ticket QR Code" className="rounded-xl" />
		</div>
	);
}
