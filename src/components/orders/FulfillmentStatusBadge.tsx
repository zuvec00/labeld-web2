// components/orders/FulfillmentStatusBadge.tsx
import { FulfillmentStatus, FulfillmentAggregateStatus } from "@/types/orders";
import {
	getFulfillmentStatusColor,
	getFulfillmentStatusLabel,
	getFulfillmentAggregateStatusColor,
	getFulfillmentAggregateStatusLabel,
} from "@/lib/orders/helpers";

interface FulfillmentStatusBadgeProps {
	status: FulfillmentStatus | FulfillmentAggregateStatus;
	type?: "individual" | "aggregate";
}

export default function FulfillmentStatusBadge({
	status,
	type = "individual",
}: FulfillmentStatusBadgeProps) {
	const colorClass =
		type === "aggregate"
			? getFulfillmentAggregateStatusColor(status as FulfillmentAggregateStatus)
			: getFulfillmentStatusColor(status as FulfillmentStatus);

	const label =
		type === "aggregate"
			? getFulfillmentAggregateStatusLabel(status as FulfillmentAggregateStatus)
			: getFulfillmentStatusLabel(status as FulfillmentStatus);

	return (
		<span
			className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full border ${colorClass}`}
		>
			{label}
		</span>
	);
}
