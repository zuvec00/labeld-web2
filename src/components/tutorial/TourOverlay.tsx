"use client";

import React, { useEffect, useState, useRef } from "react";
import { useTutorial } from "@/hooks/useTutorial";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";

export default function TourOverlay() {
	const {
		activeTourId,
		currentStepIndex,
		tourConfig,
		skipTour,
		nextStep,
		previousStep,
		completeTour,
	} = useTutorial();
	const router = useRouter();

	const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
	const [tooltipPosition, setTooltipPosition] = useState<{
		top: number;
		left: number;
		placement: string;
		align: "center" | "left" | "right";
	} | null>(null);
	const overlayRef = useRef<HTMLDivElement>(null);

	// Get current step
	const currentStep = tourConfig?.steps[currentStepIndex];
	const isFirstStep = currentStepIndex === 0;
	const isLastStep = currentStepIndex === (tourConfig?.steps.length || 0) - 1;
	const totalSteps = tourConfig?.steps.length || 0;

	// Calculate and update position based on target element
	// Calculate and update position based on target element
	const updatePosition = () => {
		if (!currentStep) return;

		const element = document.querySelector(currentStep.target) as HTMLElement;
		if (element) {
			setTargetElement(element);

			const rect = element.getBoundingClientRect();
			const placement = currentStep.placement || "bottom";

			let top = 0;
			let left = 0;
			let align: "center" | "left" | "right" = "center";

			const viewportWidth = window.innerWidth;
			const viewportHeight = window.innerHeight;

			// Approximate tooltip dimensions (will be used for boundary checks)
			// max-w-sm is 24rem (384px). We use 400px to include buffer.
			const approximateCardWidth = 400;

			// Calculate base position
			switch (placement) {
				case "top":
					top = rect.top - 12; // 12px gap
					left = rect.left + rect.width / 2;
					break;
				case "bottom":
					top = rect.bottom + 12;
					left = rect.left + rect.width / 2;
					break;
				case "left":
					top = rect.top + rect.height / 2;
					left = rect.left - 12;
					align = "right";
					break;
				case "right":
					top = rect.top + rect.height / 2;
					left = rect.right + 12;
					align = "left";
					break;
				case "center":
					top = viewportHeight / 2;
					left = viewportWidth / 2;
					break;
			}

			// --- Robust Clamping Logic ---
			// Ensure the tooltip never bleeds off screen.

			if (placement === "top" || placement === "bottom") {
				const cardHalfWidth = approximateCardWidth / 2;
				const minLeft = 16 + cardHalfWidth; // 16px padding from edge
				const maxLeft = viewportWidth - 16 - cardHalfWidth;

				if (left < minLeft) {
					left = Math.max(left, minLeft);
					// On very small screens, force center
					if (viewportWidth < 420) left = viewportWidth / 2;
					align = "center";
				} else if (left > maxLeft) {
					left = Math.min(left, maxLeft);
					if (viewportWidth < 420) left = viewportWidth / 2;
					align = "center";
				}
			}

			// Boundary checks for left/right placement
			if (placement === "left" || placement === "right") {
				const cardHalfHeight = 150; // approx 300px height / 2
				const minTop = 16 + cardHalfHeight;
				const maxTop = viewportHeight - 16 - cardHalfHeight;

				if (top < minTop) top = minTop;
				else if (top > maxTop) top = maxTop;
			}

			setTooltipPosition({ top, left, placement, align });
		} else {
			setTargetElement(null);
			setTooltipPosition(null);
		}
	};

	// Effect to handle step changes and initial find
	useEffect(() => {
		if (!currentStep || !activeTourId) {
			setTargetElement(null);
			setTooltipPosition(null);
			return;
		}

		// Function to attempt finding the element
		const attemptFind = () => {
			const element = document.querySelector(currentStep.target) as HTMLElement;
			if (element) {
				// Scroll into view first
				element.scrollIntoView({
					behavior: "smooth",
					block: "center",
					inline: "center",
				});

				// Then update position
				updatePosition();

				// Perform action if needed
				if (currentStep.action) {
					if (
						currentStep.action.type === "navigate" &&
						currentStep.action.href
					) {
						// Check if we are already on the page?
						// Actually if we just navigated, the element might be there now.
						// But if we need to navigate, we should do it.
						// However, if we are polling, we don't want to keep pushing.
						// Let's assume action.navigate is triggered ONCE when step starts.
						// But wait, if we navigate, the page unmounts/remounts logic?
						// No, TourOverlay persists.
						// So we should navigate once.
						// The issue is: we navigate -> wait for element.
						// We should probably navigate immediately, then pool.
					} else if (
						currentStep.action.type === "focus" &&
						currentStep.action.selector
					) {
						const focusElement = document.querySelector(
							currentStep.action.selector,
						) as HTMLElement;
						focusElement?.focus();
					}
				}

				return true; // Found
			}
			return false; // Not found
		};

		// Trigger navigation immediately if needed
		if (currentStep.action?.type === "navigate" && currentStep.action.href) {
			router.push(currentStep.action.href);
		}

		// Poll for element (up to 5 seconds)
		let attempts = 0;
		const maxAttempts = 50; // 50 * 100ms = 5s
		const interval = setInterval(() => {
			attempts++;
			const found = attemptFind();
			if (found || attempts >= maxAttempts) {
				clearInterval(interval);
				if (!found) {
					console.warn(
						`Tour target not found after polling: ${currentStep.target}`,
					);
				}
			}
		}, 100);

		// Also try immediately
		attemptFind();

		return () => clearInterval(interval);
	}, [currentStep, activeTourId, router]);

	// Effect to handle window resize and scroll events
	useEffect(() => {
		if (!activeTourId) return;

		window.addEventListener("resize", updatePosition);
		window.addEventListener("scroll", updatePosition, { capture: true }); // Capture to catch scrolling in overflow containers

		// Also loop updatePosition for a bit to catch animations?
		// Optional, but might help if the page is animating.
		let animationFrameId: number;
		const loop = () => {
			updatePosition();
			animationFrameId = requestAnimationFrame(loop);
		};
		// Only loop if we really need to track moving elements.
		// For now, let's stick to events + interval check maybe?
		// Let's add a periodic check (every 500ms) just in case DOM shifts without scroll/resize
		const interval = setInterval(updatePosition, 500);

		return () => {
			window.removeEventListener("resize", updatePosition);
			window.removeEventListener("scroll", updatePosition, { capture: true });
			clearInterval(interval);
			cancelAnimationFrame(animationFrameId);
		};
	}, [activeTourId, currentStep]); // Re-bind if step changes (though implementation uses closure correctly if we used refs, but here updatePosition depends on currentStep state if not careful. Actually updatePosition uses `currentStep` from closure. So we MUST include it.)

	// Handle keyboard navigation
	useEffect(() => {
		if (!activeTourId) return;

		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				skipTour();
			} else if (e.key === "ArrowRight" && !isLastStep) {
				nextStep();
			} else if (e.key === "ArrowLeft" && !isFirstStep) {
				previousStep();
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [activeTourId, isFirstStep, isLastStep, skipTour, nextStep, previousStep]);

	// Don't render if no active tour
	if (!activeTourId || !tourConfig || !currentStep) {
		return null;
	}

	// Get spotlight position
	const spotlightRect = targetElement
		? targetElement.getBoundingClientRect()
		: null;

	return (
		<div
			ref={overlayRef}
			className="fixed inset-0 z-[9999] pointer-events-auto"
			style={{ isolation: "isolate" }}
		>
			{/* Backdrop with blur */}
			<div
				className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-all duration-300"
				style={{
					maskImage: spotlightRect
						? `radial-gradient(circle ${Math.max(spotlightRect.width, spotlightRect.height) * 0.8}px at ${spotlightRect.left + spotlightRect.width / 2}px ${spotlightRect.top + spotlightRect.height / 2}px, transparent 40%, black 60%)`
						: undefined,
					WebkitMaskImage: spotlightRect
						? `radial-gradient(circle ${Math.max(spotlightRect.width, spotlightRect.height) * 0.8}px at ${spotlightRect.left + spotlightRect.width / 2}px ${spotlightRect.top + spotlightRect.height / 2}px, transparent 40%, black 60%)`
						: undefined,
				}}
				onClick={(e) => {
					// Prevent clicks outside from closing (user must use skip button)
					e.stopPropagation();
				}}
			/>

			{/* Tooltip Card */}
			{tooltipPosition && (
				<div
					className="absolute bg-bg border border-stroke rounded-xl shadow-2xl p-5 max-w-sm pointer-events-auto transition-all duration-100 ease-out"
					style={{
						top: `${tooltipPosition.top}px`,
						left: `${tooltipPosition.left}px`,
						transform:
							tooltipPosition.placement === "right"
								? "translateY(-50%)"
								: tooltipPosition.placement === "left"
									? "translate(-100%, -50%)"
									: tooltipPosition.placement === "top"
										? tooltipPosition.align === "left"
											? "translateY(-100%)"
											: tooltipPosition.align === "right"
												? "translate(-100%, -100%)"
												: "translate(-50%, -100%)"
										: tooltipPosition.placement === "center"
											? "translate(-50%, -50%)"
											: // bottom
												tooltipPosition.align === "left"
												? "translateY(0)"
												: tooltipPosition.align === "right"
													? "translate(-100%, 0)"
													: "translateX(-50%)",
					}}
				>
					{/* Header */}
					<div className="flex items-start justify-between gap-3 mb-3">
						<div className="flex-1">
							<h3 className="font-heading font-semibold text-text text-base">
								{currentStep.title}
							</h3>
							<p className="text-sm text-text-muted mt-1 leading-relaxed">
								{currentStep.description}
							</p>
						</div>
						<button
							onClick={skipTour}
							className="shrink-0 p-1 hover:bg-surface rounded transition-colors"
							aria-label="Skip tour"
						>
							<X className="w-4 h-4 text-text-muted" />
						</button>
					</div>

					{/* Progress */}
					<div className="flex items-center justify-between gap-3 mb-4">
						<span className="text-xs text-text-muted">
							{currentStepIndex + 1} of {totalSteps}
						</span>
						<div className="flex-1 h-1 bg-stroke rounded-full overflow-hidden">
							<div
								className="h-full bg-cta transition-all duration-300"
								style={{
									width: `${((currentStepIndex + 1) / totalSteps) * 100}%`,
								}}
							/>
						</div>
					</div>

					{/* Actions */}
					<div className="flex items-center justify-between gap-2">
						<button
							onClick={previousStep}
							disabled={isFirstStep}
							className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-text hover:text-cta disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
						>
							<ChevronLeft className="w-4 h-4" />
							Previous
						</button>

						<div className="flex items-center gap-2">
							<button
								onClick={skipTour}
								className="px-3 py-1.5 text-sm font-medium text-text-muted hover:text-text transition-colors"
							>
								Skip
							</button>
							{isLastStep ? (
								<button
									onClick={async () => {
										await completeTour();
									}}
									className="px-4 py-1.5 bg-cta text-text font-semibold rounded-lg hover:bg-cta/90 transition-colors text-sm"
								>
									Finish
								</button>
							) : (
								<button
									onClick={nextStep}
									className="px-4 py-1.5 bg-cta text-text font-semibold rounded-lg hover:bg-cta/90 transition-colors text-sm flex items-center gap-1.5"
								>
									Next
									<ChevronRight className="w-4 h-4" />
								</button>
							)}
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
