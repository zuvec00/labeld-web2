"use client";

import { ArrowRight, Rocket } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface ReadyStepProps {
	onComplete: () => Promise<void>;
	label?: string;
}

export default function ReadyStep({
	onComplete,
	label = "Enter Brand Space",
}: ReadyStepProps) {
	const [isLoading, setIsLoading] = useState(false);
	const router = useRouter();

	const handleLaunch = async () => {
		setIsLoading(true);
		try {
			await onComplete();
			// Redirection handled by parent or here if needed, but safe to do here too
		} catch (error) {
			console.error("Failed to complete onboarding:", error);
			setIsLoading(false);
		}
	};

	return (
		<div className="flex flex-col h-full animate-in fade-in zoom-in-95 duration-700">
			<div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full text-center">
				<div className="w-24 h-24 bg-accent/10 rounded-full flex items-center justify-center mb-8 animate-bounce-slow">
					<Rocket className="w-12 h-12 text-accent" />
				</div>

				<h1 className="text-4xl font-heading font-bold mb-4">
					You're Ready to Launch
				</h1>
				<p className="text-text-muted mb-10 text-lg max-w-xs mx-auto">
					Your space is claimed. Now it's time to build your legacy.
				</p>

				<button
					onClick={handleLaunch}
					disabled={isLoading}
					className="w-full max-w-xs bg-cta text-white py-4 rounded-full font-bold text-lg hover:opacity-90 hover:scale-105 transition-all shadow-lg hover:shadow-xl active:scale-95 flex items-center justify-center gap-2"
				>
					{isLoading ? (
						"Launching..."
					) : (
						<>
							{label}
							<ArrowRight className="w-5 h-5" />
						</>
					)}
				</button>
			</div>
		</div>
	);
}
