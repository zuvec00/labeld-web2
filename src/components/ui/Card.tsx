export default function Card({
	children,
	className = "",
	title,
	sub,
	right,
}: {
	children?: React.ReactNode;
	className?: string;
	title?: string;
	sub?: string;
	right?: React.ReactNode;
}) {
	return (
		<section
			className={`rounded-2xl bg-surface border border-stroke ${className}`}
		>
			{(title || right) && (
				<div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-stroke">
					<div>
						{title && <h3 className="font-semibold">{title}</h3>}
						{sub && <p className="text-sm text-text-muted">{sub}</p>}
					</div>
					{right}
				</div>
			)}
			<div className="p-4 sm:p-5">{children}</div>
		</section>
	);
}
