import React from "react";
import {
	StorefrontAnalyticsSummary,
	ProductPerformanceMetric,
} from "@/types/storefront-analytics";
import Card from "@/components/ui/Card";

import { formatCurrency } from "@/lib/utils";
import { AlertCircle, CheckCircle2, TrendingDown } from "lucide-react";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";

interface ProductsTabProps {
	data: StorefrontAnalyticsSummary;
}

export default function ProductsTab({ data }: ProductsTabProps) {
	return (
		<div className="space-y-6">
			<Card
				className="shadow-sm border-stroke"
				title="Product Performance"
				sub="How your inventory is performing from impression to purchase."
			>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead className="w-[300px]">Product</TableHead>
							<TableHead className="text-right">Views</TableHead>
							<TableHead className="text-right">Add to Cart</TableHead>
							<TableHead className="text-right">Purchases</TableHead>
							<TableHead className="text-right">Conv. Rate</TableHead>
							<TableHead className="text-right">Revenue</TableHead>
							<TableHead className="pl-6">Insight</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{data.topProducts.map((product) => (
							<TableRow key={product.productId}>
								<TableCell className="font-medium">
									<div className="flex items-center gap-3">
										<div className="h-10 w-10 rounded-md bg-surface-neutral overflow-hidden flex-shrink-0">
											{/* In real app, render image here */}
											<img
												src={product.imageUrl}
												alt=""
												className="h-full w-full object-cover opacity-80"
											/>
										</div>
										<span
											className="truncate max-w-[200px]"
											title={product.productName}
										>
											{product.productName}
										</span>
									</div>
								</TableCell>
								<TableCell className="text-right text-text-muted">
									{product.views.toLocaleString()}
								</TableCell>
								<TableCell className="text-right text-text-muted">
									{product.addToCarts.toLocaleString()}
								</TableCell>
								<TableCell className="text-right text-text-muted">
									{product.purchases.toLocaleString()}
								</TableCell>
								<TableCell className="text-right font-medium">
									<span className={getConversionColor(product.conversionRate)}>
										{product.conversionRate.toFixed(2)}%
									</span>
								</TableCell>
								<TableCell className="text-right font-medium text-text">
									{formatCurrency(product.revenue, "NGN")}
								</TableCell>
								<TableCell className="pl-6">
									<ProductInsight product={product} />
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</Card>
		</div>
	);
}

function getConversionColor(rate: number) {
	if (rate >= 3.0) return "text-emerald-600";
	if (rate >= 1.5) return "text-text";
	return "text-rose-500";
}

function ProductInsight({ product }: { product: ProductPerformanceMetric }) {
	// Simple rule-based insights
	const cartAbandonment =
		(product.addToCarts - product.purchases) / product.addToCarts;
	const viewToCart = product.addToCarts / product.views;

	if (cartAbandonment > 0.8 && product.addToCarts > 10) {
		return (
			<div className="flex items-center text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded w-fit">
				<AlertCircle className="h-3 w-3 mr-1" />
				High Abandonment
			</div>
		);
	}

	if (viewToCart < 0.05 && product.views > 100) {
		return (
			<div className="flex items-center text-xs text-rose-600 bg-rose-50 px-2 py-1 rounded w-fit">
				<TrendingDown className="h-3 w-3 mr-1" />
				Low Interest
			</div>
		);
	}

	if (product.conversionRate > 3.0) {
		return (
			<div className="flex items-center text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded w-fit">
				<CheckCircle2 className="h-3 w-3 mr-1" />
				Top Performer
			</div>
		);
	}

	return null;
}
