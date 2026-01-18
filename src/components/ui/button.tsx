// src/components/ui/button.tsx
import React, { useMemo } from "react";
import { Spinner } from "./spinner";

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
	text?: string;
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
	children?: React.ReactNode;
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
	children,
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
			) : children ? (
				children
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
	text?: string;
	variant?:
		| "primary"
		| "cta"
		| "outline"
		| "secondary"
		| "disabled"
		| "danger"
		| "calmAccent2"
		| "ghost"; // Added ghost
	size?: "sm" | "md" | "lg"; // Added size
	outlineColor?: string;
	className?: string;
	isLoading?: boolean;
	loadingText?: string;
	leftIcon?: React.ReactNode;
	rightIcon?: React.ReactNode;
};

export function Button2({
	text,
	variant = "primary",
	size = "md",
	outlineColor = "cta",
	className,
	isLoading = false,
	loadingText,
	leftIcon,
	rightIcon,
	disabled,
	children,
	...props
}: ButtonProps2 & { children?: React.ReactNode }) {
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
			case "ghost":
				return "bg-transparent text-text hover:bg-surface border border-transparent";
			default: // "primary"
				return "bg-accent text-bg";
		}
	}, [variant, outlineColor]);

	const sizeStyle = useMemo(() => {
		switch (size) {
			case "sm":
				return "px-3 py-1.5 text-sm";
			case "lg":
				return "px-6 py-4 text-lg";
			default:
				return "px-4 py-3";
		}
	}, [size]);

	const isDisabled = disabled || isLoading;

	return (
		<button
			{...props}
			disabled={isDisabled}
			aria-busy={isLoading || undefined}
			className={[
				"group rounded-[12px] font-semibold transition",
				isDisabled ? "opacity-70 cursor-not-allowed" : "hover:opacity-90",
				"inline-flex items-center justify-center gap-2",
				style,
				sizeStyle,
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
					{/* Prioritize children, then text */}
					{children ? children : text && <span>{text}</span>}
					{rightIcon}
				</>
			)}
		</button>
	);
}

export default Button2;
