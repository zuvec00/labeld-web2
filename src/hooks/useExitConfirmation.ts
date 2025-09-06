import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCheckoutCart } from "./useCheckoutCart";

export function useExitConfirmation(eventId: string) {
	const router = useRouter();
	const { clear, items } = useCheckoutCart();

	const hasItems = items.length > 0;

	const handleExit = () => {
		if (hasItems) {
			const confirmed = window.confirm(
				"Are you sure you want to exit? This will release your tickets and clear your cart."
			);
			if (confirmed) {
				clear();
				router.push(`/e/${eventId}`);
			}
		} else {
			router.push(`/e/${eventId}`);
		}
	};

	const handleBackButton = () => {
		if (hasItems) {
			const confirmed = window.confirm(
				"Are you sure you want to go back? This will release your tickets and clear your cart."
			);
			if (confirmed) {
				clear();
				router.back();
			}
		} else {
			router.back();
		}
	};

	// Handle browser back/forward buttons
	useEffect(() => {
		const handleBeforeUnload = (e: BeforeUnloadEvent) => {
			if (hasItems) {
				e.preventDefault();
				e.returnValue = "You have items in your cart. Are you sure you want to leave?";
				return e.returnValue;
			}
		};

		window.addEventListener("beforeunload", handleBeforeUnload);
		return () => window.removeEventListener("beforeunload", handleBeforeUnload);
	}, [hasItems]);

	return {
		handleExit,
		handleBackButton,
		hasItems,
	};
}
