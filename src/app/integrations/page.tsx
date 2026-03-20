"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle, Instagram, ArrowLeft, Globe, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GradientText } from "@/components/ui/GradientText";
import Image from "next/image";

function IntegrationsContent() {
	const searchParams = useSearchParams();
	const router = useRouter();
	const status = searchParams.get("status");
	const reason = searchParams.get("reason");

	const isSuccess = status === "success";
	const isError = status === "error";

	const handleClose = () => {
		if (window.opener) {
			window.close();
		} else {
			router.push("/dashboard");
		}
	};

	const handleContinueWeb = () => {
		router.push("/dashboard");
	};

	return (
		<div className="min-h-screen bg-bg text-text flex flex-col items-center justify-center p-6 relative overflow-hidden">
			{/* Background Ambience */}
			<div className="absolute inset-0 pointer-events-none">
				<div className={`absolute top-0 left-0 w-full h-full bg-gradient-to-br ${isError ? 'from-alert/5' : 'from-accent/5'} to-transparent opacity-50`} />
				<div className="absolute -top-24 -right-24 w-96 h-96 bg-cta/10 blur-[120px] rounded-full" />
				<div className={`absolute -bottom-24 -left-24 w-96 h-96 ${isError ? 'bg-alert/10' : 'bg-accent/10'} blur-[120px] rounded-full`} />
			</div>

			<motion.div 
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.6, ease: "easeOut" }}
				className="w-full max-w-md bg-surface border border-stroke rounded-[32px] p-8 md:p-10 shadow-2xl relative z-10 backdrop-blur-sm"
			>
				<div className="flex flex-col items-center text-center">
					{/* Logo */}
					<div className="mb-8">
						<Image src="/labeld_logo.png" alt="Labeld" width={48} height={48} className="w-12 h-12" />
					</div>

					{/* Icon State */}
					<motion.div
						initial={{ scale: 0.8, opacity: 0 }}
						animate={{ scale: 1, opacity: 1 }}
						transition={{ delay: 0.2, duration: 0.5, type: "spring" }}
						className="mb-6"
					>
						{isSuccess ? (
							<div className="w-20 h-20 bg-accent/10 rounded-full flex items-center justify-center relative">
								<motion.div
									initial={{ scale: 0 }}
									animate={{ scale: 1 }}
									transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
								>
									<CheckCircle2 className="w-12 h-12 text-accent" />
								</motion.div>
								<div className="absolute inset-0 bg-accent/20 rounded-full animate-ping opacity-20" />
							</div>
						) : isError ? (
							<div className="w-20 h-20 bg-alert/10 rounded-full flex items-center justify-center relative">
								<motion.div
									initial={{ scale: 0 }}
									animate={{ scale: 1 }}
									transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
								>
									<XCircle className="w-12 h-12 text-alert" />
								</motion.div>
							</div>
						) : (
							<div className="w-20 h-20 bg-surface border border-stroke rounded-full flex items-center justify-center">
								<Instagram className="w-10 h-10 text-text-muted" />
							</div>
						)}
					</motion.div>

					{/* Title */}
					<div className="mb-4">
						{isSuccess ? (
							<GradientText 
								text="Instagram Connected" 
								size="text-2xl md:text-3xl"
								animated
							/>
						) : (
							<GradientText 
								text={isError ? "Integration Failed" : "Instagram Integration"} 
								fromColor={isError ? "from-alert" : "from-cta"}
								toColor={isError ? "to-cta" : "to-accent"}
								size="text-2xl md:text-3xl"
							/>
						)}
					</div>

					{/* Message */}
					<p className="text-text-muted leading-relaxed mb-10">
						{isSuccess 
							? "Instagram connected successfully. You can return to Labeld Studio and continue importing your posts." 
							: isError 
								? (reason || "Something went wrong while connecting your Instagram account. Please try again.")
								: "Please wait while we process your request."
						}
					</p>

					{/* CTAs */}
					<div className="w-full space-y-3">
						<Button 
							variant="cta" 
							className="w-full py-4 text-lg"
							onClick={handleClose}
							leftIcon={<ArrowLeft className="w-5 h-5" />}
							text="Back to Labeld Studio"
						/>
						
						{isSuccess && (
							<Button 
								variant="outline" 
								outlineColor="text"
								className="w-full py-4 text-lg border-stroke hover:bg-surface"
								onClick={handleContinueWeb}
								leftIcon={<Globe className="w-5 h-5" />}
								text="Continue on web"
							/>
						)}
					</div>

					{/* Safety Hint */}
					<div className="mt-8 pt-8 border-t border-stroke w-full">
						<p className="text-xs text-text-muted flex items-center justify-center gap-2">
							<span className="w-1 h-1 bg-text-muted/30 rounded-full" />
							You can safely close this window
							<span className="w-1 h-1 bg-text-muted/30 rounded-full" />
						</p>
					</div>
				</div>
			</motion.div>

			{/* Corner Close Button (Extra Premium) */}
			<button 
				onClick={handleClose}
				className="absolute top-8 right-8 p-3 bg-surface/50 hover:bg-surface border border-stroke rounded-full transition-colors z-20 backdrop-blur-md group"
			>
				<X className="w-5 h-5 text-text-muted group-hover:text-text transition-colors" />
			</button>
		</div>
	);
}

export default function IntegrationsPage() {
	return (
		<Suspense fallback={
			<div className="min-h-screen bg-bg flex items-center justify-center">
				<div className="w-12 h-12 border-2 border-accent border-t-transparent rounded-full animate-spin" />
			</div>
		}>
			<IntegrationsContent />
		</Suspense>
	);
}
