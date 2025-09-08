// components/orders/Date.tsx
import { formatLagos, formatLagosDate } from "@/lib/orders/helpers";
import { Timestamp } from "firebase/firestore";

interface DateProps {
	timestamp: Timestamp | number | Date;
	format?: "full" | "date";
	className?: string;
}

export default function Date({
	timestamp,
	format = "full",
	className = "",
}: DateProps) {
	const formatted =
		format === "date" ? formatLagosDate(timestamp) : formatLagos(timestamp);

	return <span className={`text-sm ${className}`}>{formatted}</span>;
}
