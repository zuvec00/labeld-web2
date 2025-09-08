// components/orders/Money.tsx
import { formatNaira } from "@/lib/orders/helpers";

interface MoneyProps {
	amountMinor: number;
	className?: string;
	showSign?: boolean;
}

export default function Money({
	amountMinor,
	className = "",
	showSign = false,
}: MoneyProps) {
	const formatted = formatNaira(amountMinor);
	const sign =
		showSign && amountMinor !== 0 ? (amountMinor > 0 ? "+" : "") : "";

	return (
		<span className={`font-medium ${className}`}>
			{sign}
			{formatted}
		</span>
	);
}
