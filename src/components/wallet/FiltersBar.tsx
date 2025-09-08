// components/wallet/FiltersBar.tsx
import { useState } from "react";
import { LedgerType, LedgerSource } from "@/types/wallet";
import Card from "@/components/dashboard/Card";

interface FiltersBarProps {
	onFiltersChange: (filters: {
		sources: LedgerSource[];
		types: LedgerType[];
		minAmount: number | null;
		maxAmount: number | null;
	}) => void;
}

export default function FiltersBar({ onFiltersChange }: FiltersBarProps) {
	const [selectedSources, setSelectedSources] = useState<LedgerSource[]>([]);
	const [selectedTypes, setSelectedTypes] = useState<LedgerType[]>([]);
	const [minAmount, setMinAmount] = useState<string>("");
	const [maxAmount, setMaxAmount] = useState<string>("");

	// Handle source filter toggle
	const toggleSource = (source: LedgerSource) => {
		const newSources = selectedSources.includes(source)
			? selectedSources.filter((s) => s !== source)
			: [...selectedSources, source];
		setSelectedSources(newSources);
		applyFilters({
			sources: newSources,
			types: selectedTypes,
			minAmount: minAmount ? parseFloat(minAmount) * 100 : null, // Convert to minor units
			maxAmount: maxAmount ? parseFloat(maxAmount) * 100 : null,
		});
	};

	// Handle type filter toggle
	const toggleType = (type: LedgerType) => {
		const newTypes = selectedTypes.includes(type)
			? selectedTypes.filter((t) => t !== type)
			: [...selectedTypes, type];
		setSelectedTypes(newTypes);
		applyFilters({
			sources: selectedSources,
			types: newTypes,
			minAmount: minAmount ? parseFloat(minAmount) * 100 : null,
			maxAmount: maxAmount ? parseFloat(maxAmount) * 100 : null,
		});
	};

	// Handle amount changes
	const handleAmountChange = (field: "min" | "max", value: string) => {
		if (field === "min") {
			setMinAmount(value);
		} else {
			setMaxAmount(value);
		}
	};

	// Apply filters
	const applyFilters = (filters: {
		sources: LedgerSource[];
		types: LedgerType[];
		minAmount: number | null;
		maxAmount: number | null;
	}) => {
		onFiltersChange(filters);
	};

	// Clear all filters
	const clearFilters = () => {
		setSelectedSources([]);
		setSelectedTypes([]);
		setMinAmount("");
		setMaxAmount("");
		onFiltersChange({
			sources: [],
			types: [],
			minAmount: null,
			maxAmount: null,
		});
	};

	return (
		<Card title="Filters">
			<div className="space-y-4">
				{/* Source Filter */}
				<div>
					<label className="text-sm font-medium text-text-muted mb-2 block">
						Source
					</label>
					<div className="flex flex-wrap gap-2">
						{[
							{ label: "Events", value: "event" as LedgerSource },
							{ label: "Store", value: "store" as LedgerSource },
						].map((source) => (
							<button
								key={source.value}
								onClick={() => toggleSource(source.value)}
								className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
									selectedSources.includes(source.value)
										? "bg-cta text-text border-cta font-semibold"
										: "bg-stroke text-text-muted border-stroke hover:bg-stroke/80"
								}`}
							>
								{source.label}
							</button>
						))}
					</div>
				</div>

				{/* Type Filter */}
				<div>
					<label className="text-sm font-medium text-text-muted mb-2 block">
						Type
					</label>
					<div className="flex flex-wrap gap-2">
						{[
							{
								label: "Credit Eligible",
								value: "credit_eligible" as LedgerType,
							},
							{ label: "Debit Hold", value: "debit_hold" as LedgerType },
							{ label: "Debit Payout", value: "debit_payout" as LedgerType },
							{ label: "Debit Refund", value: "debit_refund" as LedgerType },
							{
								label: "Credit Release",
								value: "credit_release" as LedgerType,
							},
						].map((type) => (
							<button
								key={type.value}
								onClick={() => toggleType(type.value)}
								className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
									selectedTypes.includes(type.value)
										? "bg-cta text-text border-cta font-semibold"
										: "bg-stroke text-text-muted border-stroke hover:bg-stroke/80"
								}`}
							>
								{type.label}
							</button>
						))}
					</div>
				</div>

				{/* Amount Range */}
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<div>
						<label className="text-sm font-medium text-text-muted mb-2 block">
							Min Amount (₦)
						</label>
						<input
							type="number"
							value={minAmount}
							onChange={(e) => handleAmountChange("min", e.target.value)}
							placeholder="0"
							className="w-full px-3 py-2 rounded-lg bg-surface text-text border border-stroke focus:border-accent focus:outline-none"
						/>
					</div>
					<div>
						<label className="text-sm font-medium text-text-muted mb-2 block">
							Max Amount (₦)
						</label>
						<input
							type="number"
							value={maxAmount}
							onChange={(e) => handleAmountChange("max", e.target.value)}
							placeholder="1000000"
							className="w-full px-3 py-2 rounded-lg bg-surface text-text border border-stroke focus:border-accent focus:outline-none"
						/>
					</div>
				</div>

				{/* Actions */}
				<div className="flex items-center justify-between pt-4 border-t border-stroke/60">
					<button
						onClick={clearFilters}
						className="text-sm text-text-muted hover:text-text hover:underline transition-colors"
					>
						Clear filters
					</button>
					<button
						onClick={() =>
							applyFilters({
								sources: selectedSources,
								types: selectedTypes,
								minAmount: minAmount ? parseFloat(minAmount) * 100 : null,
								maxAmount: maxAmount ? parseFloat(maxAmount) * 100 : null,
							})
						}
						className="px-4 py-2 text-sm rounded-lg bg-cta text-text font-semibold hover:bg-cta/90 transition-colors"
					>
						Apply Filters
					</button>
				</div>
			</div>
		</Card>
	);
}
