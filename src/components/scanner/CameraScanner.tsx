"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Spinner } from "@/components/ui/spinner";
import { QrCode } from "lucide-react";

interface CameraScannerProps {
	onQRCodeDetected: (qrString: string) => void;
	isActive: boolean;
	className?: string;
}

export default function CameraScanner({
	onQRCodeDetected,
	isActive,
	className = "",
}: CameraScannerProps) {
	const videoRef = useRef<HTMLVideoElement>(null);
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const streamRef = useRef<MediaStream | null>(null);
	const animationRef = useRef<number | undefined>(undefined);
	const lastDecodeRef = useRef<number>(0);

	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
	const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
	const [isTorchSupported, setIsTorchSupported] = useState(false);
	const [isTorchOn, setIsTorchOn] = useState(false);
	const [hasStarted, setHasStarted] = useState(false);

	// Begin scanning - request permission first, then enumerate devices
	const beginScanning = useCallback(async () => {
		try {
			setIsLoading(true);
			setError(null);

			// Ask for any camera (no deviceId yet) so labels become available
			const tmp = await navigator.mediaDevices.getUserMedia({
				video: true,
				audio: false,
			});
			tmp.getTracks().forEach((t) => t.stop());

			// Now enumerate with labels
			const all = await navigator.mediaDevices.enumerateDevices();
			const vids = all.filter((d) => d.kind === "videoinput");
			setDevices(vids);

			// Prefer back camera if available, otherwise first camera
			const preferred =
				vids.find((d) => /back|rear|environment/i.test(d.label))?.deviceId ||
				vids[0]?.deviceId;

			if (!preferred) throw new Error("No camera found");

			setSelectedDeviceId(preferred);
			setHasStarted(true);
		} catch (e: unknown) {
			setError(e instanceof Error ? e.message : "Camera permission failed");
		} finally {
			setIsLoading(false);
		}
	}, []);

	// Start camera stream
	const startCamera = useCallback(async (deviceId?: string) => {
		try {
			setIsLoading(true);
			setError(null);

			// Stop existing stream
			if (streamRef.current) {
				streamRef.current.getTracks().forEach((track) => track.stop());
			}

			const constraints: MediaStreamConstraints = {
				video: {
					deviceId: deviceId ? { exact: deviceId } : undefined,
					facingMode: deviceId ? undefined : { ideal: "environment" as const },
					// smaller frame = faster jsQR
					width: { ideal: 640 },
					height: { ideal: 480 },
					// some browsers accept these hints:
					frameRate: { ideal: 15 },
				},
				audio: false,
			};

			const stream = await navigator.mediaDevices.getUserMedia(constraints);
			streamRef.current = stream;

			if (videoRef.current) {
				const v = videoRef.current;
				v.setAttribute("playsinline", "true"); // iOS Safari
				v.setAttribute("autoplay", "true");
				v.muted = true;
				v.srcObject = stream;
				await v.play(); // important to await
			}

			// Torch support (Android Chrome only)
			const videoTrack = stream.getVideoTracks()[0];
			if (videoTrack && "getCapabilities" in videoTrack) {
				try {
					const caps = (videoTrack as any).getCapabilities();
					setIsTorchSupported(Boolean(caps?.torch));
				} catch {
					setIsTorchSupported(false);
				}
			} else {
				setIsTorchSupported(false);
			}

			setIsLoading(false);
		} catch (err: unknown) {
			console.error("Error starting camera:", err);
			setError(err instanceof Error ? err.message : "Failed to access camera");
			setIsLoading(false);
		}
	}, []);

	// Stop camera stream
	const stopCamera = useCallback(() => {
		if (streamRef.current) {
			streamRef.current.getTracks().forEach((track) => track.stop());
			streamRef.current = null;
		}
		if (videoRef.current) {
			videoRef.current.srcObject = null;
		}
		if (animationRef.current) {
			cancelAnimationFrame(animationRef.current);
		}
	}, []);

	// Toggle torch
	const toggleTorch = useCallback(async () => {
		if (!streamRef.current || !isTorchSupported) return;

		try {
			const videoTrack = streamRef.current.getVideoTracks()[0];
			if (videoTrack && "applyConstraints" in videoTrack) {
				await videoTrack.applyConstraints({
					advanced: [{ torch: !isTorchOn } as Record<string, unknown>],
				});
				setIsTorchOn(!isTorchOn);
			}
		} catch (err) {
			console.error("Error toggling torch:", err);
		}
	}, [isTorchSupported, isTorchOn]);

	// Enhanced QR Code detection with multiple scanning strategies
	const detectQRCode = useCallback(async () => {
		if (!videoRef.current || !canvasRef.current || !isActive) {
			animationRef.current = requestAnimationFrame(detectQRCode);
			return;
		}

		// throttle to ~10 fps for better responsiveness
		const now = performance.now();
		if (now - lastDecodeRef.current < 100) {
			animationRef.current = requestAnimationFrame(detectQRCode);
			return;
		}
		lastDecodeRef.current = now;

		const video = videoRef.current;
		const canvas = canvasRef.current;
		const context = canvas.getContext("2d");

		if (!context || video.readyState !== video.HAVE_ENOUGH_DATA) {
			animationRef.current = requestAnimationFrame(detectQRCode);
			return;
		}

		// Use higher resolution for better detection
		const targetW = 640;
		const scale = targetW / video.videoWidth;
		const w = targetW;
		const h = Math.floor(video.videoHeight * scale);
		canvas.width = w;
		canvas.height = h;
		context.drawImage(video, 0, 0, w, h);

		try {
			const { default: jsQR } = await import("jsqr");
			const imageData = context.getImageData(0, 0, w, h);

			// Try multiple detection strategies for better success rate
			const detectionStrategies = [
				// 1. Full frame scan
				{ imageData, width: w, height: h },
				// 2. Center region scan (most common QR placement)
				{
					imageData: context.getImageData(w * 0.2, h * 0.2, w * 0.6, h * 0.6),
					width: w * 0.6,
					height: h * 0.6,
				},
				// 3. Top-left region scan
				{
					imageData: context.getImageData(0, 0, w * 0.7, h * 0.7),
					width: w * 0.7,
					height: h * 0.7,
				},
				// 4. Top-right region scan
				{
					imageData: context.getImageData(w * 0.3, 0, w * 0.7, h * 0.7),
					width: w * 0.7,
					height: h * 0.7,
				},
				// 5. Bottom region scan
				{
					imageData: context.getImageData(0, h * 0.3, w, h * 0.7),
					width: w,
					height: h * 0.7,
				},
			];

			// Try each detection strategy
			for (const strategy of detectionStrategies) {
				const code = jsQR(
					strategy.imageData.data,
					strategy.width,
					strategy.height
				);
				if (code && code.data) {
					onQRCodeDetected(code.data);
					return; // stop after success
				}
			}
		} catch (err) {
			console.error("QR decode error:", err);
		}

		animationRef.current = requestAnimationFrame(detectQRCode);
	}, [isActive, onQRCodeDetected]);

	// Initialize cleanup on mount
	useEffect(() => {
		return () => {
			stopCamera();
		};
	}, [stopCamera]);

	// Start camera when device is selected (after permission granted)
	useEffect(() => {
		if (hasStarted && selectedDeviceId) {
			startCamera(selectedDeviceId);
		}
	}, [hasStarted, selectedDeviceId, startCamera]);

	// Start/stop QR detection based on isActive
	useEffect(() => {
		if (isActive && !isLoading && !error && hasStarted) {
			detectQRCode();
		} else if (animationRef.current) {
			cancelAnimationFrame(animationRef.current);
		}
	}, [isActive, isLoading, error, hasStarted, detectQRCode]);

	// Watchdog to avoid infinite "Starting camera..."
	useEffect(() => {
		if (!hasStarted) return;
		const t = setTimeout(() => {
			if (isLoading) {
				setError(
					"Camera is taking too long to start. Close other apps using the camera and retry."
				);
			}
		}, 5000);
		return () => clearTimeout(t);
	}, [hasStarted, isLoading]);

	// Keep screen awake
	useEffect(() => {
		if (!isActive) return;

		let wakeLock: unknown = null;

		const requestWakeLock = async () => {
			try {
				if ("wakeLock" in navigator) {
					const nav = navigator as unknown as Record<string, unknown>;
					wakeLock = await (
						nav.wakeLock as { request: (type: string) => Promise<unknown> }
					).request("screen");
				}
			} catch {
				console.log("Wake lock not supported or failed");
			}
		};

		requestWakeLock();

		return () => {
			if (
				wakeLock &&
				typeof wakeLock === "object" &&
				"release" in wakeLock &&
				typeof wakeLock.release === "function"
			) {
				wakeLock.release();
			}
		};
	}, [isActive]);

	if (error) {
		return (
			<div
				className={`flex flex-col items-center justify-center p-8 bg-surface rounded-2xl border border-stroke ${className}`}
			>
				<div className="text-alert text-center">
					<p className="font-medium">Camera Error</p>
					<p className="text-sm mt-1">{error}</p>
				</div>
				<button
					onClick={() => startCamera(selectedDeviceId)}
					className="mt-4 px-4 py-2 bg-accent text-bg rounded-lg text-sm font-medium"
				>
					Retry
				</button>
			</div>
		);
	}

	return (
		<div
			className={`relative bg-black rounded-2xl overflow-hidden ${className}`}
		>
			{/* Open Camera button overlay */}
			{!hasStarted && (
				<div className="absolute inset-0 flex items-center justify-center bg-black/60 z-20">
					<button
						onClick={beginScanning}
						disabled={isLoading}
						className="px-6 py-3 bg-accent text-bg rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{isLoading ? (
							<>
								<Spinner size="sm" />
								Opening Camera...
							</>
						) : (
							<>
								<QrCode className="w-4 h-4" />
								Open Camera
							</>
						)}
					</button>
				</div>
			)}

			{isLoading && (
				<div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-10">
					<div className="text-center text-white">
						<Spinner size="lg" />
						<p className="mt-2 text-sm">Starting camera...</p>
					</div>
				</div>
			)}

			<video
				ref={videoRef}
				className="w-full h-full object-cover"
				playsInline
				muted
			/>

			{/* QR Code scanning overlay */}
			{isActive && hasStarted && (
				<div className="absolute inset-0 pointer-events-none">
					{/* Full frame scanning indicator */}
					<div className="absolute inset-0">
						{/* Subtle border around entire frame */}
						<div className="absolute inset-0 border-2 border-accent border-opacity-30 rounded-2xl"></div>

						{/* Corner indicators for guidance */}
						<div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-accent rounded-tl-lg"></div>
						<div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-accent rounded-tr-lg"></div>
						<div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-accent rounded-bl-lg"></div>
						<div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-accent rounded-br-lg"></div>

						{/* Scanning line animation that moves across the frame */}
						<div className="absolute inset-0 overflow-hidden rounded-2xl">
							<div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-accent to-transparent animate-pulse"></div>
							<div
								className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-accent to-transparent animate-pulse"
								style={{ animationDelay: "0.5s" }}
							></div>
						</div>
					</div>

					{/* Instructions */}
					<div className="absolute bottom-8 left-0 right-0 text-center text-white">
						<p className="text-sm bg-black bg-opacity-70 px-4 py-2 rounded-lg inline-block backdrop-blur-sm">
							Point camera at QR code anywhere in frame
						</p>
					</div>
				</div>
			)}

			{/* Hidden canvas for QR detection */}
			<canvas ref={canvasRef} className="hidden" />

			{/* Camera controls */}
			{hasStarted && (
				<div className="absolute top-4 right-4 flex gap-2">
					{/* Device selector */}
					{devices.length > 1 && (
						<select
							value={selectedDeviceId}
							onChange={(e) => setSelectedDeviceId(e.target.value)}
							className="px-3 py-1 bg-black bg-opacity-50 text-white text-sm rounded-lg border border-white border-opacity-20"
						>
							{devices.map((device) => (
								<option key={device.deviceId} value={device.deviceId}>
									{device.label || `Camera ${device.deviceId.slice(0, 8)}`}
								</option>
							))}
						</select>
					)}

					{/* Torch toggle */}
					{isTorchSupported && (
						<button
							onClick={toggleTorch}
							className={`px-3 py-1 bg-black bg-opacity-50 text-white text-sm rounded-lg border border-white border-opacity-20 ${
								isTorchOn ? "bg-accent bg-opacity-80" : ""
							}`}
						>
							{isTorchOn ? "🔦" : "💡"}
						</button>
					)}
				</div>
			)}
		</div>
	);
}
