// components/bookings/OpeningHoursEditor.tsx
"use client";

import React from "react";
import { DayOfWeek, DayHours, OpeningHours } from "@/lib/models/booking";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface OpeningHoursEditorProps {
	hours: OpeningHours;
	onChange: (hours: OpeningHours) => void;
}

const DAYS: { key: DayOfWeek; label: string }[] = [
	{ key: "mon", label: "Monday" },
	{ key: "tue", label: "Tuesday" },
	{ key: "wed", label: "Wednesday" },
	{ key: "thu", label: "Thursday" },
	{ key: "fri", label: "Friday" },
	{ key: "sat", label: "Saturday" },
	{ key: "sun", label: "Sunday" },
];

export default function OpeningHoursEditor({
	hours,
	onChange,
}: OpeningHoursEditorProps) {
	const handleDayChange = (
		day: DayOfWeek,
		field: keyof DayHours,
		value: string | boolean,
	) => {
		const currentDayHours = hours[day] || {
			open: "09:00",
			close: "22:00",
			enabled: true,
		};

		onChange({
			...hours,
			[day]: {
				...currentDayHours,
				[field]: value,
			},
		});
	};

	return (
		<div className="space-y-4">
			{DAYS.map(({ key, label }) => {
				const dayHours = hours[key] || {
					open: "09:00",
					close: "22:00",
					enabled: true,
				};

				return (
					<div
						key={key}
						className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-lg bg-surface-secondary"
					>
						<div className="flex items-center gap-3 flex-1">
							<Switch
								checked={dayHours.enabled}
								onCheckedChange={(checked) =>
									handleDayChange(key, "enabled", checked)
								}
							/>
							<Label className="text-sm font-medium text-text min-w-[80px]">
								{label}
							</Label>
						</div>

						<div
							className={cn(
								"flex items-center gap-3 transition-opacity",
								!dayHours.enabled && "opacity-50",
							)}
						>
							<div className="flex flex-1 items-center gap-2">
								<Label className="text-[10px] uppercase text-text-muted sm:hidden">
									Open
								</Label>
								<Input
									type="time"
									value={dayHours.open}
									onChange={(e) => handleDayChange(key, "open", e.target.value)}
									disabled={!dayHours.enabled}
									className="w-full sm:w-32 h-9 px-2 text-sm"
								/>
							</div>

							<span className="text-text-muted hidden sm:block">—</span>

							<div className="flex flex-1 items-center gap-2">
								<Label className="text-[10px] uppercase text-text-muted sm:hidden">
									Close
								</Label>
								<Input
									type="time"
									value={dayHours.close}
									onChange={(e) =>
										handleDayChange(key, "close", e.target.value)
									}
									disabled={!dayHours.enabled}
									className="w-full sm:w-32 h-9 px-2 text-sm"
								/>
							</div>
						</div>
					</div>
				);
			})}
		</div>
	);
}
