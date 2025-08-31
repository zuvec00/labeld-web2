// src/components/ui/button.tsx
import React, { useMemo } from "react";
import { Spinner } from "./spinner";

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
	text: string;
	variant?:
		| "primary"
		| "cta"
		| "outline"
		| "secondary"
		| "disabled"
		| "danger"
		| "calmAccent2";
	outlineColor?: string;
	className?: string;
	isLoading?: boolean;
	loadingText?: string;
	leftIcon?: React.ReactNode;
	rightIcon?: React.ReactNode;
};

export function Button({
	text,
	variant = "primary",
	outlineColor = "cta",
	className,
	isLoading = false,
	loadingText,
	leftIcon,
	rightIcon,
	disabled,
	...props
}: ButtonProps) {
	const style = useMemo(() => {
		switch (variant) {
			case "cta":
				return "bg-cta text-text";
			case "outline":
				return `bg-transparent text-${outlineColor} border border-${outlineColor}`;
			case "calmAccent2":
				return "bg-calm-2 text-text";
			case "secondary":
				return "bg-text-muted text-bg border border-text-muted";
			case "disabled":
				return "bg-stroke text-text-muted cursor-not-allowed";
			case "danger":
				return "bg-alert text-text border-alert";
			default:
				return "bg-accent text-bg";
		}
	}, [variant, outlineColor]);

	// When loading, force-disabled to prevent double submits
	const isDisabled = disabled || isLoading;

	return (
		<button
			{...props}
			disabled={isDisabled}
			aria-busy={isLoading || undefined}
			className={[
				"group rounded-[12px] px-4 py-3 font-semibold transition",
				isDisabled ? "opacity-70 cursor-not-allowed" : "hover:opacity-90",
				"inline-flex items-center justify-center gap-2",
				style,
				className || "",
			].join(" ")}
		>
			{isLoading ? (
				<>
					<Spinner size="sm" className="mr-1" />
					<span>{loadingText ?? text}</span>
				</>
			) : (
				<>
					{leftIcon}
					<span>{text}</span>
					{rightIcon}
				</>
			)}
		</button>
	);
}

export type ButtonProps2 = React.ButtonHTMLAttributes<HTMLButtonElement> & {
	text?: string; // optional now, because you may only want icons
	variant?:
		| "primary"
		| "cta"
		| "outline"
		| "secondary"
		| "disabled"
		| "danger"
		| "calmAccent2";
	outlineColor?: string; // for outline variant
	className?: string;
	isLoading?: boolean;
	loadingText?: string;
	leftIcon?: React.ReactNode;
	rightIcon?: React.ReactNode;
};



export function Button2({
	text,
	variant = "primary",
	outlineColor = "cta",
	className,
	isLoading = false,
	loadingText,
	leftIcon,
	rightIcon,
	disabled,
	...props
}: ButtonProps) {
	const style = useMemo(() => {
		switch (variant) {
			case "cta":
				return "bg-cta text-text";
			case "outline":
				return `bg-transparent text-${outlineColor} border border-${outlineColor}`;
			case "calmAccent2":
				return "bg-calm-2 text-text";
			case "secondary":
				return "bg-text-muted text-bg border border-text-muted";
			case "disabled":
				return "bg-stroke text-text-muted cursor-not-allowed";
			case "danger":
				return "bg-alert text-text border-alert";
			default: // "primary"
				return "bg-accent text-bg";
		}
	}, [variant, outlineColor]);

	const isDisabled = disabled || isLoading;

	return (
		<button
			{...props}
			disabled={isDisabled}
			aria-busy={isLoading || undefined}
			className={[
				"group rounded-[12px] px-4 py-3 font-semibold transition",
				isDisabled ? "opacity-70 cursor-not-allowed" : "hover:opacity-90",
				"inline-flex items-center justify-center gap-2",
				style,
				className || "",
			].join(" ")}
		>
			{isLoading ? (
				<>
					<Spinner size="sm" className="mr-1" />
					<span>{loadingText ?? text}</span>
				</>
			) : (
				<>
					{leftIcon}
					{text && <span>{text}</span>}
					{rightIcon}
				</>
			)}
		</button>
	);
}

export default Button2;
