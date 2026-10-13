import React from "react";
import ErrorState from "@/components/ui/ErrorState";

export interface DataStateProps {
	/** True until the first result for this section has arrived. */
	loading?: boolean;
	/** Set when the request failed; shows an error with retry. */
	error?: string | null;
	/** True only when the request succeeded and returned nothing. */
	isEmpty?: boolean;
	skeleton: React.ReactNode;
	empty: React.ReactNode;
	onRetry?: () => void;
	errorTitle?: string;
	children: React.ReactNode;
}

/**
 * Renders exactly one of: skeleton, error, empty, content - in that order.
 *
 * The order is the point. Empty is only reachable once loading has finished
 * without error, so a slow query can never flash a false "nothing here" state.
 */
export default function DataState({
	loading = false,
	error,
	isEmpty = false,
	skeleton,
	empty,
	onRetry,
	errorTitle,
	children,
}: DataStateProps) {
	if (loading) return <>{skeleton}</>;
	if (error) {
		return (
			<ErrorState
				title={errorTitle}
				message="We couldn't load this right now."
				onRetry={onRetry}
			/>
		);
	}
	if (isEmpty) return <>{empty}</>;
	return <>{children}</>;
}
