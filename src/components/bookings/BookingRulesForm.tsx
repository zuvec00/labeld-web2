// components/bookings/BookingRulesForm.tsx
"use client";

import React from "react";
import { SlotInterval } from "@/lib/models/booking";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface BookingRulesFormProps {
	slotIntervalMinutes: SlotInterval;
	maxBookingsPerSlot: number;
	maxPartySize: number;
	minLeadTimeMinutes: number;
	maxAdvanceDays: number;
	onChange: (field: string, value: number) => void;
}

export default function BookingRulesForm({
	slotIntervalMinutes,
	maxBookingsPerSlot,
	maxPartySize,
	minLeadTimeMinutes,
	maxAdvanceDays,
	onChange,
}: BookingRulesFormProps) {
	const slotIntervals: SlotInterval[] = [30, 60, 90];

	return (
		<div className="space-y-6">
			{/* Slot Interval */}
			<div className="space-y-2">
				<Label className="text-sm font-medium text-text">
					Time Slot Interval
				</Label>
				<div className="flex flex-wrap gap-2">
					{slotIntervals.map((interval) => (
						<button
							key={interval}
							type="button"
							onClick={() => onChange("slotIntervalMinutes", interval)}
							className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
								slotIntervalMinutes === interval
									? "bg-primary text-primary-foreground"
									: "bg-surface-secondary text-text hover:bg-stroke"
							}`}
						>
							{interval} min
						</button>
					))}
				</div>
				<p className="text-xs text-text-muted">
					How long each booking slot should be
				</p>
			</div>

			{/* Max Bookings Per Slot */}
			<div className="space-y-2">
				<Label
					htmlFor="maxBookingsPerSlot"
					className="text-sm font-medium text-text"
				>
					Max Bookings Per Slot
				</Label>
				<Input
					id="maxBookingsPerSlot"
					type="number"
					min={1}
					max={50}
					value={maxBookingsPerSlot}
					onChange={(e) =>
						onChange("maxBookingsPerSlot", parseInt(e.target.value) || 1)
					}
					className="max-w-xs"
				/>
				<p className="text-xs text-text-muted">
					Maximum number of reservations for each time slot
				</p>
			</div>

			{/* Max Party Size */}
			<div className="space-y-2">
				<Label htmlFor="maxPartySize" className="text-sm font-medium text-text">
					Max Party Size
				</Label>
				<Input
					id="maxPartySize"
					type="number"
					min={1}
					max={100}
					value={maxPartySize}
					onChange={(e) =>
						onChange("maxPartySize", parseInt(e.target.value) || 1)
					}
					className="max-w-xs"
				/>
				<p className="text-xs text-text-muted">
					Maximum number of guests per reservation
				</p>
			</div>

			{/* Min Lead Time */}
			<div className="space-y-2">
				<Label
					htmlFor="minLeadTimeMinutes"
					className="text-sm font-medium text-text"
				>
					Minimum Advance Notice (minutes)
				</Label>
				<Input
					id="minLeadTimeMinutes"
					type="number"
					min={0}
					step={30}
					value={minLeadTimeMinutes}
					onChange={(e) =>
						onChange("minLeadTimeMinutes", parseInt(e.target.value) || 0)
					}
					className="max-w-xs"
				/>
				<p className="text-xs text-text-muted">
					How far in advance guests must book (e.g., 120 = 2 hours)
				</p>
			</div>

			{/* Max Advance Days */}
			<div className="space-y-2">
				<Label
					htmlFor="maxAdvanceDays"
					className="text-sm font-medium text-text"
				>
					Max Advance Booking (days)
				</Label>
				<Input
					id="maxAdvanceDays"
					type="number"
					min={1}
					max={365}
					value={maxAdvanceDays}
					onChange={(e) =>
						onChange("maxAdvanceDays", parseInt(e.target.value) || 1)
					}
					className="max-w-xs"
				/>
				<p className="text-xs text-text-muted">
					How far in advance guests can book (e.g., 90 = 3 months)
				</p>
			</div>
		</div>
	);
}
