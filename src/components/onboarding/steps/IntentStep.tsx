"use client";

import { ArrowRight, Sparkles, Globe, Clock } from "lucide-react";

interface IntentStepProps {
	onSelect: (intent: "brand" | "explore" | "later") => void;
}

export default function IntentStep({ onSelect }: IntentStepProps) {
	return (
		<div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-4 duration-700">
			<div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
				<h1 className="text-3xl md:text-4xl font-heading font-bold text-center mb-2">
					Welcome to Labeld
				</h1>
				<p className="text-text-muted text-center mb-10 text-lg">
					What are you here to build?
				</p>

				<div className="space-y-4">
					<button
						onClick={() => onSelect("brand")}
						className="w-full text-left p-5 rounded-2xl border border-accent/20 bg-surface/50 hover:bg-surface hover:border-accent transition-all group relative overflow-hidden"
					>
						<div className="absolute inset-0 bg-accent/5 opacity-0 group-hover:opacity-100 transition-opacity" />
						<div className="flex items-start gap-4">
							<div className="p-3 rounded-full bg-accent/10 text-accent">
								<Sparkles className="w-6 h-6" />
							</div>
							<div className="flex-1">
								<h3 className="font-heading font-semibold text-lg mb-1 group-hover:text-accent transition-colors">
									Launch a Brand
								</h3>
								<p className="text-sm text-text-muted">
									Create your space, drop merch, and build your community.
								</p>
							</div>
							<ArrowRight className="w-5 h-5 text-text-muted group-hover:text-accent opacity-0 group-hover:opacity-100 transition-all transform -translate-x-2 group-hover:translate-x-0 mt-1" />
						</div>
					</button>

					<button
						onClick={() => onSelect("explore")}
						className="w-full text-left p-5 rounded-2xl border border-stroke bg-surface/30 hover:bg-surface hover:border-stroke hover:border-l-4 hover:border-l-accent transition-all group"
					>
						<div className="flex items-start gap-4">
							<div className="p-3 rounded-full bg-surface text-text-muted group-hover:text-text transition-colors">
								<Globe className="w-6 h-6" />
							</div>
							<div className="flex-1">
								<h3 className="font-heading font-semibold text-lg mb-1">
									Explore & Discover
								</h3>
								<p className="text-sm text-text-muted">
									Find new drops, events, and connect with the culture.
								</p>
							</div>
						</div>
					</button>

					<button
						onClick={() => onSelect("later")}
						className="w-full text-left p-5 rounded-2xl border border-stroke bg-surface/30 hover:bg-surface hover:border-stroke transition-all group"
					>
						<div className="flex items-start gap-4">
							<div className="p-3 rounded-full bg-surface text-text-muted group-hover:text-text transition-colors">
								<Clock className="w-6 h-6" />
							</div>
							<div className="flex-1">
								<h3 className="font-heading font-semibold text-lg mb-1">
									I'll set this up later
								</h3>
								<p className="text-sm text-text-muted">
									Skip setup and go straight to the dashboard.
								</p>
							</div>
						</div>
					</button>
				</div>
			</div>
		</div>
	);
}
