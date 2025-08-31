"use client";

import { Minus, Plus } from "lucide-react";

interface QtySelectorProps {
	value: number;
	onChange: (qty: number) => void;
	min?: number;
	max?: number;
	disabled?: boolean;
	className?: string;
}

export default function QtySelector({
	value,
	onChange,
	min = 0,
	max,
	disabled = false,
	className = "",
}: QtySelectorProps) {
	const handleIncrement = () => {
		if (disabled || (max !== undefined && value >= max)) return;
		onChange(value + 1);
	};

	const handleDecrement = () => {
		if (disabled || value <= min) return;
		onChange(value - 1);
	};

	return (
		<div
			className={`flex items-center border border-stroke rounded-lg bg-surface ${className}`}
		>
			<button
				type="button"
				onClick={handleDecrement}
				disabled={disabled || value <= min}
				className="p-2 text-text-muted hover:text-text disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
			>
				<Minus className="w-4 h-4" />
			</button>

			<span className="px-3 py-2 text-sm font-medium text-text min-w-[2rem] text-center">
				{value}
			</span>

			<button
				type="button"
				onClick={handleIncrement}
				disabled={disabled || (max !== undefined && value >= max)}
				className="p-2 text-text-muted hover:text-text disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
			>
				<Plus className="w-4 h-4" />
			</button>
		</div>
	);
}
