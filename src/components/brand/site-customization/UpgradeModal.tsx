"use client";

import React, { useEffect } from "react";
import { X, Check } from "lucide-react";
import Button from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface UpgradeModalProps {
	isOpen: boolean;
	onClose: () => void;
	onUpgrade: () => void;
	featureContext?: string; // e.g. "storefront templates"
}

export default function UpgradeModal({
	isOpen,
	onClose,
	onUpgrade,
	featureContext = "features",
}: UpgradeModalProps) {
	// Focus trap and body scroll lock
	useEffect(() => {
		if (isOpen) {
			document.body.style.overflow = "hidden";
			const handleEsc = (e: KeyboardEvent) => {
				if (e.key === "Escape") onClose();
			};
			window.addEventListener("keydown", handleEsc);
			return () => {
				document.body.style.overflow = "unset";
				window.removeEventListener("keydown", handleEsc);
			};
		}
	}, [isOpen, onClose]);

	if (!isOpen) return null;

	const benefits = [
		"Choose from curated storefront layouts designed for different brand goals.",
		"Switch templates anytime — no rebuilds, no downtime.",
		"Tell your brand story or optimize for conversion, on your terms.",
		"Unlock full control over layout, sections, and presentation.",
	];

	return (
		<div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-in fade-in duration-200">
			{/* Backdrop */}
			<div
				className="absolute inset-0 bg-black/80 backdrop-blur-sm"
				onClick={onClose}
			/>

			{/* Modal */}
			<div className="relative z-10 w-full max-w-lg bg-[#0A0A0A] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
				{/* Header */}
				<div className="flex items-start justify-between p-6 pb-2">
					<div className="space-y-1">
						<h2 className="text-xl md:text-2xl font-heading font-bold text-white">
							Unlock Pro Storefronts
						</h2>
						<p className="text-white/60 text-sm">
							Choose how your brand is presented to the world.
						</p>
					</div>
					<button
						onClick={onClose}
						className="p-1 rounded-full hover:bg-white/10 text-white/40 hover:text-white transition-colors"
					>
						<X className="w-5 h-5" />
					</button>
				</div>

				{/* Body */}
				<div className="p-6 pt-4 space-y-6">
					{/* Benefits */}
					<div className="space-y-3">
						{benefits.map((benefit, i) => (
							<div key={i} className="flex items-start gap-3">
								<div className="mt-0.5 min-w-[18px] h-[18px] rounded-full bg-white/10 flex items-center justify-center">
									<Check className="w-3 h-3 text-white" />
								</div>
								<p className="text-sm text-white/80 leading-relaxed">
									{benefit}
								</p>
							</div>
						))}
					</div>

					{/* Visual Context (Optional) */}
					<div className="p-3 rounded-lg bg-white/5 border border-white/5 flex items-center justify-between">
						<span className="text-xs uppercase tracking-wider font-bold text-white/40 pl-1">
							Includes
						</span>
						<div className="flex gap-2">
							{["Essential", "Editorial", "Commerce"].map((role) => (
								<span
									key={role}
									className="text-[10px] px-2 py-1 rounded bg-black border border-white/10 text-white/60"
								>
									{role}
								</span>
							))}
						</div>
					</div>
				</div>

				{/* Footer */}
				<div className="p-6 pt-2 bg-white/5 border-t border-white/5 flex flex-col gap-3">
					<Button
						text="Upgrade to Pro"
						variant="cta"
						className="w-full text-base h-11"
						onClick={onUpgrade}
					/>
					<div className="flex items-center justify-between px-1">
						<span className="text-xs text-white/40">
							You're currently on the Free plan
						</span>
						<button
							onClick={onUpgrade}
							className="text-xs text-white/60 hover:text-white underline underline-offset-2 decoration-white/20 hover:decoration-white/60 transition-colors"
						>
							View Pricing
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
