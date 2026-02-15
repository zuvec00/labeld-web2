// components/dashboard/DashboardContextSwitch.tsx
"use client";

import React from "react";
import { ChevronDown } from "lucide-react";
import { DashboardRole } from "@/hooks/useDashboardContext";

interface DashboardContextSwitchProps {
	activeRole: DashboardRole | "all";
	onRoleChange: (role: DashboardRole | "all") => void;
	canSwitch: boolean;
	isCompact?: boolean;
	includeAll?: boolean;
}

export default function DashboardContextSwitch({
	activeRole,
	onRoleChange,
	isCompact = false,
	includeAll = false,
}: DashboardContextSwitchProps & { isCompact?: boolean }) {
	const [isOpen, setIsOpen] = React.useState(false);

	const allRoles: { value: DashboardRole | "all"; label: string }[] = [
		{ value: "all", label: "All" }, // New option per user request
		{ value: "brand", label: "Brand" },
		{ value: "eventOrganizer", label: "Events" },
	];

	const roles = includeAll
		? allRoles
		: allRoles.filter((r) => r.value !== "all");

	const activeLabel =
		roles.find((r) => r.value === activeRole)?.label || "Brand";

	return (
		<div className="relative inline-block w-full">
			<button
				onClick={() => setIsOpen(!isOpen)}
				className={`w-full !font-sans flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors border border-transparent hover:bg-surface-neutral/50 hover:border-stroke/50 ${
					isCompact ? "" : "bg-surface-neutral/30 border-stroke/30"
				}`}
			>
				<div className="flex !font-sans items-center gap-2">
					<span className="text-text-muted text-xs font-medium uppercase tracking-wide">
						{isCompact ? "" : "Viewing:"}
					</span>
					<span className="font-semibold text-text">{activeLabel} Space</span>
				</div>
				<ChevronDown
					className={`w-4 h-4 text-text-muted transition-transform ${
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
					<div className="absolute top-full left-0 right-0 mt-1 z-50 py-1 bg-surface border border-stroke rounded-lg shadow-xl animate-in fade-in zoom-in-95 duration-200">
						{roles.map((role) => (
							<button
								key={role.value}
								onClick={() => {
									onRoleChange(role.value);
									setIsOpen(false);
								}}
								className={`w-full text-left px-3 py-2 text-sm transition-colors flex items-center justify-between group ${
									activeRole === role.value
										? "text-cta font-medium bg-cta/5"
										: "text-text-muted hover:text-text hover:bg-surface-neutral"
								}`}
							>
								<span>{role.label}</span>
								{activeRole === role.value && (
									<div className="w-1.5 h-1.5 rounded-full bg-cta" />
								)}
							</button>
						))}
					</div>
				</>
			)}
		</div>
	);
}
