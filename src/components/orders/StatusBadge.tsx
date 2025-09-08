// components/orders/StatusBadge.tsx
import { OrderStatus, VendorLineStatus } from "@/types/orders";
import {
	getStatusColor,
	getVendorStatusColor,
	getStatusLabel,
	getVendorStatusLabel,
} from "@/lib/orders/helpers";

interface StatusBadgeProps {
	status: OrderStatus | VendorLineStatus;
	type?: "order" | "vendor";
	className?: string;
}

export default function StatusBadge({
	status,
	type = "order",
	className = "",
}: StatusBadgeProps) {
	const colorClass =
		type === "vendor"
			? getVendorStatusColor(status as VendorLineStatus)
			: getStatusColor(status as OrderStatus);
	const label =
		type === "vendor"
			? getVendorStatusLabel(status as VendorLineStatus)
			: getStatusLabel(status as OrderStatus);

	return (
		<span
			className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${colorClass} ${className}`}
		>
			{label}
		</span>
	);
}
