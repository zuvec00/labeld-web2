import React from "react";
import {
	StorefrontAnalyticsSummary,
	SectionPerformanceMetric,
} from "@/types/storefront-analytics";
import Card from "@/components/ui/Card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { LayoutTemplate, MousePointerClick, Eye } from "lucide-react";

interface ContentTabProps {
	data: StorefrontAnalyticsSummary;
}

export default function ContentTab({ data }: ContentTabProps) {
	return (
		<div className="space-y-6">
			<Card
				className="shadow-sm border-stroke"
				title="Section Performance"
				sub="Understand which parts of your homepage drive engagement."
			>
				<div className="rounded-md border border-stroke">
					<Table>
						<TableHeader>
							<TableRow className="bg-surface-neutral/50">
								<TableHead className="w-[300px]">Section Name</TableHead>
								<TableHead className="w-[150px]">Type</TableHead>
								<TableHead className="text-right">Impressions</TableHead>
								<TableHead className="text-right">CTA Clicks</TableHead>
								<TableHead className="text-right">Click-Through Rate</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{data.sectionPerformance.map((section) => (
								<TableRow key={section.sectionId}>
									<TableCell className="font-medium">
										<div className="flex items-center gap-2">
											<LayoutTemplate className="h-4 w-4 text-text-muted" />
											{section.sectionName || section.sectionId}
										</div>
									</TableCell>
									<TableCell className="text-text-muted text-xs uppercase tracking-wider">
										{section.sectionType.replace("_", " ")}
									</TableCell>
									<TableCell className="text-right text-text-muted">
										<div className="flex items-center justify-end gap-2">
											{section.impressions.toLocaleString()}
											<Eye className="h-3 w-3 text-text-muted/50" />
										</div>
									</TableCell>
									<TableCell className="text-right text-text-muted">
										<div className="flex items-center justify-end gap-2">
											{section.ctaClicks.toLocaleString()}
											<MousePointerClick className="h-3 w-3 text-text-muted/50" />
										</div>
									</TableCell>
									<TableCell className="text-right font-medium">
										<span
											className={
												section.ctr > 10 ? "text-emerald-600" : "text-text"
											}
										>
											{section.ctr.toFixed(1)}%
										</span>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>
			</Card>

			<div className="bg-surface-neutral/30 rounded-xl p-6 border border-dashed border-stroke text-center">
				<p className="text-sm text-text-muted max-w-lg mx-auto">
					These metrics are tracked automatically for all standard Labeld
					sections. Custom sections require manual instrumentation.
				</p>
			</div>
		</div>
	);
}
