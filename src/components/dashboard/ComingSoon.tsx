// src/components/dashboard/ComingSoon.tsx
import Card from "./Card";

export default function ComingSoon({
	title,
	blurb,
}: {
	title: string;
	blurb?: string;
}) {
	return (
		<Card title={title}>
			<div className="relative">
				<div className="absolute inset-0 backdrop-blur-[1px] bg-bg/25 rounded-[16px]" />
				<div className="relative text-center py-10">
					<div className="text-sm text-text-muted mb-2">Launching soon</div>
					<p className="text-text-muted/90">
						{blurb || "We’re putting the final touches on this feature."}
					</p>
				</div>
			</div>
		</Card>
	);
}
