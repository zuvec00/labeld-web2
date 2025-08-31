import Card from "../Card";

export function Kpi({
	label,
	value,
	sub,
}: {
	label: string;
	value: string;
	sub?: string;
}) {
	return (
		<Card className="p-0">
			<div className="px-5 pt-4 pb-2 text-sm text-text-muted">{label}</div>
			<div className="px-5 pb-4 text-[28px] font-heading font-semibold">{value}</div>
			{sub && <div className="px-5 pb-4 text-xs text-text-muted">{sub}</div>}
		</Card>
	);
}
