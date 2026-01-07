// components/dashboard/DashboardContextSwitch.tsx
"use client";

import React from "react";
import { ChevronDown } from "lucide-react";
import { DashboardRole } from "@/hooks/useDashboardContext";

interface DashboardContextSwitchProps {
	activeRole: DashboardRole;
	onRoleChange: (role: DashboardRole) => void;
	canSwitch: boolean;
}

export default function DashboardContextSwitch({
	activeRole,
	onRoleChange,
}: DashboardContextSwitchProps) {
	const [isOpen, setIsOpen] = React.useState(false);

	const roles: { value: DashboardRole; label: string }[] = [
		{ value: "brand", label: "Brand" },
		{ value: "eventOrganizer", label: "Events" },
	];

	const activeLabel =
		roles.find((r) => r.value === activeRole)?.label || "Brand";

	return (
		<div className="relative inline-block">
			<button
				onClick={() => setIsOpen(!isOpen)}
				className="inline-flex items-center gap-1 text-xs text-text-muted hover:text-text transition-colors"
			>
				<span>Viewing:</span>
				<span className="font-medium text-text">{activeLabel}</span>
				<ChevronDown
					className={`w-3 h-3 transition-transform ${
						isOpen ? "rotate-180" : ""
					}`}
				/>
			</button>

			{isOpen && (
				<>
					{/* Backdrop to close menu */}
					<div
						className="fixed inset-0 z-40"
						onClick={() => setIsOpen(false)}
					/>

					{/* Dropdown menu */}
					<div className="absolute top-full left-0 mt-1 z-50 min-w-[120px] py-1 bg-surface border border-stroke rounded-lg shadow-lg">
						{roles.map((role) => (
							<button
								key={role.value}
								onClick={() => {
									onRoleChange(role.value);
									setIsOpen(false);
								}}
								className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${
									activeRole === role.value
										? "text-cta font-medium bg-cta/5"
										: "text-text-muted hover:text-text hover:bg-bg"
								}`}
							>
								{role.label}
							</button>
						))}
					</div>
				</>
			)}
		</div>
	);
}
