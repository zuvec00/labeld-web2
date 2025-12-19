"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Spinner } from "@/components/ui/spinner";
import { QrCode, Camera, Zap, ZapOff } from "lucide-react";

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
					width: { ideal: 1280 },
					height: { ideal: 720 },
					// some browsers accept these hints:
					frameRate: { ideal: 30 },
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
		}, 8000); // Increased timeout
		return () => clearTimeout(t);
	}, [hasStarted, isLoading]);

	// Keep screen awake
	useEffect(() => {
		if (!isActive) return;

		let wakeLock: any = null;

		const requestWakeLock = async () => {
			try {
				if ("wakeLock" in navigator) {
					const nav = navigator as unknown as any;
					wakeLock = await nav.wakeLock.request("screen");
				}
			} catch (e) {
				console.log("Wake lock not supported or failed", e);
			}
		};

		requestWakeLock();

		return () => {
			if (wakeLock) {
				wakeLock.release().catch(() => {});
			}
		};
	}, [isActive]);

	if (error) {
		return (
			<div
				className={`flex flex-col items-center justify-center p-8 bg-surface/50 rounded-lg border border-white/10 ${className}`}
			>
				<div className="text-alert text-center">
					<p className="font-heading font-semibold text-lg max-w-xs">{error}</p>
				</div>
				<button
					onClick={() => startCamera(selectedDeviceId)}
					className="mt-6 px-6 py-2 bg-white text-black rounded-full text-sm font-bold hover:bg-gray-200 transition"
				>
					Retry
				</button>
			</div>
		);
	}

	return (
		<div
			className={`relative bg-black rounded-3xl overflow-hidden shadow-2xl ${className}`}
		>
			{/* Open Camera button overlay (Initial State) */}
			{!hasStarted && (
				<div className="absolute inset-0 flex flex-col items-center justify-center bg-surface/10 backdrop-blur-sm z-20 p-6 text-center">
					<div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6">
						<Camera className="w-8 h-8 text-white/50" />
					</div>
					<h3 className="text-white font-heading font-semibold text-xl mb-2">
						Ready to Scan?
					</h3>
					<p className="text-text-muted text-sm mb-8 max-w-xs">
						Grant camera access to start validating tickets.
					</p>

					<button
						onClick={beginScanning}
						disabled={isLoading}
						className="px-8 py-3 bg-accent text-bg rounded-full text-sm font-bold hover:bg-accent/90 transition-all active:scale-95 flex items-center gap-2 group"
					>
						{isLoading ? (
							<>
								<Spinner size="sm" />
								<span>initializing...</span>
							</>
						) : (
							<>
								<Camera className="w-4 h-4" />
								<span>Enable Camera Access</span>
							</>
						)}
					</button>
				</div>
			)}

			{isLoading && (
				<div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10 backdrop-blur-md">
					<div className="text-center text-white">
						<Spinner size="lg" className="mb-4" />
						<p className="text-sm font-medium tracking-wide">
							INITIALIZING OPTICS...
						</p>
					</div>
				</div>
			)}

			<video
				ref={videoRef}
				className="w-full h-full object-cover"
				playsInline
				muted
			/>

			{/* Active Scanning Overlay */}
			{isActive && hasStarted && (
				<div className="absolute inset-0 pointer-events-none">
					{/* Darken outer edges to focus user */}
					<div
						className="absolute inset-0 bg-black/30 mask-scan-area"
						style={{
							maskImage:
								"radial-gradient(circle at center, transparent 40%, black 100%)",
							WebkitMaskImage:
								"radial-gradient(circle at center, transparent 40%, black 100%)",
						}}
					/>

					{/* Center Frame */}
					<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 sm:w-80 sm:h-80">
						{/* Animated Corners */}
						<div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-accent rounded-tl-xl shadow-[0_0_15px_rgba(196,255,48,0.5)]"></div>
						<div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-accent rounded-tr-xl shadow-[0_0_15px_rgba(196,255,48,0.5)]"></div>
						<div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-accent rounded-bl-xl shadow-[0_0_15px_rgba(196,255,48,0.5)]"></div>
						<div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-accent rounded-br-xl shadow-[0_0_15px_rgba(196,255,48,0.5)]"></div>

						{/* Scanning beam */}
						<div className="absolute inset-0 overflow-hidden rounded-xl">
							<div className="absolute w-full h-[2px] bg-gradient-to-r from-transparent via-accent to-transparent shadow-[0_0_20px_rgba(196,255,48,1)] animate-scan-beam top-0"></div>
						</div>
					</div>

					{/* Helper Text */}
					<div className="absolute bottom-8 left-0 right-0 text-center">
						<div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black/60 backdrop-blur-md border border-white/10">
							<div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
							<span className="text-xs text-white/90 font-medium">
								LIVE SCANNING
							</span>
						</div>
					</div>
				</div>
			)}

			<canvas ref={canvasRef} className="hidden" />

			{/* Camera Controls (Floating) */}
			{hasStarted && (
				<div className="absolute top-4 right-4 flex flex-col gap-2 pointer-events-auto">
					{/* Torch toggle */}
					{isTorchSupported && (
						<button
							onClick={toggleTorch}
							className={`p-3 rounded-full backdrop-blur-md transition-all ${
								isTorchOn
									? "bg-accent text-bg shadow-lg shadow-accent/20"
									: "bg-black/50 text-white border border-white/10 hover:bg-black/70"
							}`}
						>
							{isTorchOn ? (
								<Zap size={20} fill="currentColor" />
							) : (
								<ZapOff size={20} />
							)}
						</button>
					)}

					{/* Device selector (if multiple) */}
					{devices.length > 1 && (
						<select
							value={selectedDeviceId}
							onChange={(e) => setSelectedDeviceId(e.target.value)}
							className="p-2 bg-black/50 text-white text-xs rounded-lg border border-white/10 backdrop-blur-md max-w-[120px] truncate outline-none"
						>
							{devices.map((device) => (
								<option
									key={device.deviceId}
									value={device.deviceId}
									className="text-black"
								>
									{device.label || `Camera ${device.deviceId.slice(0, 4)}`}
								</option>
							))}
						</select>
					)}
				</div>
			)}
		</div>
	);
}
