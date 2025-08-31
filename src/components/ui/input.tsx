export function Input({
	className,
	...props
}: React.InputHTMLAttributes<HTMLInputElement> & { className?: string }) {
	return (
		<input
			{...props}
			className={[
				"w-full rounded-xl bg-bg border border-stroke px-4 py-3 outline-none",
				"focus:border-accent text-text placeholder:text-text-muted",
				className || "",
			].join(" ")}
		/>
	);
}
