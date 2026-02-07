// components/bookings/BookingStatusPill.tsx
"use client";

import React from "react";
import {
	BookingStatus,
	getStatusColorClass,
	getStatusLabel,
} from "@/lib/models/booking";
import { cn } from "@/lib/utils";

interface BookingStatusPillProps {
	status: BookingStatus;
	className?: string;
}

export default function BookingStatusPill({
	status,
	className,
}: BookingStatusPillProps) {
	return (
		<span
			className={cn(
				"inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
				getStatusColorClass(status),
				className,
			)}
		>
			{getStatusLabel(status)}
		</span>
	);
}
