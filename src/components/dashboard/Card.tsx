// src/components/dashboard/Card.tsx
export default function Card({
	title,
	right,
	children,
	className = "",
}: {
	title?: string;
	right?: React.ReactNode;
	children: React.ReactNode;
	className?: string;
}) {
	return (
		<section
			className={`rounded-[20px] bg-surface border border-stroke ${className}`}
		>
			{(title || right) && (
				<header className="flex items-center justify-between px-5 py-3 border-b border-stroke/60">
					<h4 className="font-semibold">{title}</h4>
					{right}
				</header>
			)}
			<div className="p-5">{children}</div>
		</section>
	);
}
