"use client";

import { useState } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/firebaseConfig";
import { useAuth } from "@/lib/auth/AuthContext";
import { useDashboardContext } from "@/hooks/useDashboardContext";
import { Loader2, Lightbulb, CheckCircle2 } from "lucide-react";
import Button from "@/components/ui/button";

export default function FeatureRequests() {
	const { user } = useAuth();
	const { activeRole, roleDetection } = useDashboardContext();

	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isSuccess, setIsSuccess] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!title.trim() || !description.trim()) {
			setError("Please fill out both the title and description.");
			return;
		}
		if (!user) {
			setError("You must be logged in to submit a request.");
			return;
		}

		setIsSubmitting(true);
		setError(null);

		try {
			await addDoc(collection(db, "feature_requests"), {
				userId: user.uid,
				brandId: activeRole === "brand" ? user.uid : null,
				organizerId: activeRole === "eventOrganizer" ? user.uid : null,
				title: title.trim(),
				description: description.trim(),
				status: "Under Review",
				createdAt: serverTimestamp(),
			});

			setIsSuccess(true);
			setTitle("");
			setDescription("");

			// Reset success state after a few seconds
			setTimeout(() => {
				setIsSuccess(false);
			}, 5000);
		} catch (err: any) {
			console.error("Error submitting feature request:", err);
			setError("There was an issue submitting your request. Please try again.");
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className="max-w-2xl">
			<div className="mb-8">
				<h2 className="text-xl font-semibold text-text mb-2">
					Suggest an Improvement
				</h2>
				<p className="text-sm text-text-muted">
					We're always looking to make Labeld Studio better. Tell us what
					features or improvements you'd like to see next!
				</p>
			</div>

			<div className="bg-surface rounded-2xl border border-stroke p-6 sm:p-8">
				{isSuccess ? (
					<div className="flex flex-col items-center justify-center py-8 text-center animate-in fade-in zoom-in duration-300">
						<div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-6">
							<CheckCircle2 className="w-8 h-8 text-green-500" />
						</div>
						<h3 className="text-xl font-semibold text-text mb-2">
							Request Received!
						</h3>
						<p className="text-text-muted mb-8 max-w-sm">
							Thank you for helping us improve Labeld. Our team will review your
							suggestion shortly.
						</p>
						<Button
							text="Submit Another Idea"
							variant="outline"
							onClick={() => setIsSuccess(false)}
						/>
					</div>
				) : (
					<form onSubmit={handleSubmit} className="space-y-6">
						<div className="space-y-2">
							<label
								htmlFor="title"
								className="text-sm font-medium text-text flex items-center gap-2"
							>
								Feature Title <span className="text-red-500">*</span>
							</label>
							<input
								id="title"
								type="text"
								value={title}
								onChange={(e) => setTitle(e.target.value)}
								placeholder="e.g. Add dark mode, Export orders to CSV..."
								className="w-full px-4 py-3 rounded-xl border border-stroke bg-bg/50 text-text placeholder:text-text-muted/50 focus:outline-none focus:border-accent transition-colors"
								disabled={isSubmitting}
							/>
						</div>

						<div className="space-y-2">
							<label
								htmlFor="description"
								className="text-sm font-medium text-text flex items-center gap-2"
							>
								Details & Use Case <span className="text-red-500">*</span>
							</label>
							<p className="text-xs text-text-muted mb-2">
								How would you use this feature? What problem does it solve for
								you?
							</p>
							<textarea
								id="description"
								value={description}
								onChange={(e) => setDescription(e.target.value)}
								placeholder="Please describe the feature and how it would help your workflow..."
								className="w-full px-4 py-3 rounded-xl border border-stroke bg-bg/50 text-text placeholder:text-text-muted/50 focus:outline-none focus:border-accent min-h-[160px] resize-y transition-colors"
								disabled={isSubmitting}
							/>
						</div>

						{error && (
							<div className="px-4 py-3 rounded-xl bg-red-500/10 text-red-500 text-sm flex items-start gap-2 animate-in fade-in slide-in-from-top-2">
								<svg
									className="w-5 h-5 flex-shrink-0"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
									/>
								</svg>
								{error}
							</div>
						)}

						<div className="pt-4 flex items-center justify-between border-t border-stroke">
							<div className="flex items-center gap-2 text-text-muted text-xs sm:text-sm">
								<Lightbulb className="w-4 h-4 text-accent" />
								<span>We read every single request!</span>
							</div>

							<button
								type="submit"
								disabled={isSubmitting || !title.trim() || !description.trim()}
								className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-accent text-white font-medium hover:bg-accent/90 transition-all disabled:opacity-50 disabled:hover:scale-100 outline-none"
							>
								{isSubmitting ? (
									<>
										<Loader2 className="w-4 h-4 animate-spin" />
										<span>Submitting...</span>
									</>
								) : (
									<span>Submit Idea</span>
								)}
							</button>
						</div>
					</form>
				)}
			</div>
		</div>
	);
}
