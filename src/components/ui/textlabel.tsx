export default function TextLabel({
	label,
	isRequired,
}: {
	label: string;
	isRequired?: boolean;
}) {
	return (
		<label className="block text-sm mb-1 text-text-muted">
			<span>{label} </span>
			{isRequired ? (
				<span className="text-cta font-bold">*</span>
			) : (
				<span className="text-xs"> (optional)</span>
			)}
		</label>
	);
}
