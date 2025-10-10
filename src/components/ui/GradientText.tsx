import { cn } from "@/lib/utils";

interface GradientTextProps {
	text: string;
	className?: string;
	/**
	 * Gradient direction
	 * @default "to-r" (left to right)
	 */
	direction?:
		| "to-r"
		| "to-l"
		| "to-b"
		| "to-t"
		| "to-br"
		| "to-bl"
		| "to-tr"
		| "to-tl";
	/**
	 * Gradient color stops
	 * @default from-cta to-accent (orange to accent)
	 */
	fromColor?: string;
	toColor?: string;
	/**
	 * Text size
	 * @default "text-xl md:text-2xl" (responsive)
	 */
	size?: string;
	/**
	 * Font weight
	 * @default "font-bold"
	 */
	weight?: string;
	/**
	 * Enable animated gradient effect
	 * @default false
	 */
	animated?: boolean;
}

export const GradientText = ({
	text,
	className,
	direction = "to-r",
	fromColor = "from-cta",
	toColor = "to-accent",
	size = "text-xl md:text-2xl",
	weight = "font-bold",
	animated = false,
}: GradientTextProps) => {
	const gradientClasses = cn(
		"font-unbounded",
		weight,
		size,
		"bg-gradient-" + direction,
		fromColor,
		toColor,
		"bg-clip-text text-transparent",
		animated && "bg-[length:200%_auto] animate-gradient",
		className
	);

	return <span className={gradientClasses}>{text}</span>;
};
