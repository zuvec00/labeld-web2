// components/dashboard/UpcomingEvents.tsx
"use client";

import { UpcomingEvent } from "@/hooks/useDashboard";
import { formatNaira } from "@/lib/orders/helpers";
import { Calendar, Users, DollarSign } from "lucide-react";
import { useRouter } from "next/navigation";

interface UpcomingEventsProps {
	events: UpcomingEvent[];
	loading?: boolean;
	className?: string;
}

export default function UpcomingEvents({
	events,
	loading = false,
	className = "",
}: UpcomingEventsProps) {
	const router = useRouter();

	if (loading) {
		return (
			<div
				className={`rounded-lg bg-surface border border-stroke p-4 ${className}`}
			>
				<h3 className="font-medium text-text mb-4">Upcoming Events</h3>
				<div className="space-y-3">
					{[1, 2, 3].map((i) => (
						<div
							key={i}
							className="animate-pulse p-3 border border-stroke rounded-lg"
						>
							<div className="flex items-center justify-between mb-2">
								<div className="h-4 bg-stroke rounded w-32"></div>
								<div className="h-3 bg-stroke rounded w-16"></div>
							</div>
							<div className="space-y-2">
								<div className="h-3 bg-stroke rounded w-24"></div>
								<div className="h-3 bg-stroke rounded w-20"></div>
							</div>
						</div>
					))}
				</div>
			</div>
		);
	}

	if (events.length === 0) {
		return (
			<div
				className={`rounded-lg bg-surface border border-stroke p-4 ${className}`}
			>
				<h3 className="font-medium text-text mb-4">Upcoming Events</h3>
				<div className="text-center py-8">
					<Calendar className="w-12 h-12 text-text-muted mx-auto mb-3" />
					<div className="text-text-muted">No upcoming events</div>
					<div className="text-xs text-text-muted mt-1">
						Create an event to get started
					</div>
				</div>
			</div>
		);
	}

	const formatEventDate = (date: Date): string => {
		const now = new Date();
		const diffMs = date.getTime() - now.getTime();
		const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

		if (diffDays <= 0) {
			return "Today";
		} else if (diffDays === 1) {
			return "Tomorrow";
		} else if (diffDays <= 7) {
			return `In ${diffDays} days`;
		} else {
			return date.toLocaleDateString("en-NG", {
				month: "short",
				day: "numeric",
			});
		}
	};

	const getCapacityPercentage = (event: UpcomingEvent): number | null => {
		if (!event.capacity || event.capacity <= 0) return null;
		return Math.round((event.ticketsSold / event.capacity) * 100);
	};

	return (
		<div
			className={`rounded-lg bg-surface border border-stroke p-4 ${className}`}
		>
			<div className="flex items-center justify-between mb-4">
				<h3 className="font-medium text-text">Upcoming Events</h3>
				<div className="text-xs text-text-muted">
					{events.length} event{events.length !== 1 ? "s" : ""}
				</div>
			</div>

			<div className="space-y-3">
				{events.map((event) => {
					const capacityPercentage = getCapacityPercentage(event);

					return (
						<div
							key={event.id}
							className="p-3 border border-stroke rounded-lg hover:border-cta/20 transition-colors cursor-pointer"
							onClick={() => router.push(`/events/${event.id}`)}
						>
							<div className="flex items-center justify-between mb-2">
								<h4 className="text-sm font-medium text-text truncate">
									{event.title}
								</h4>
								<span className="text-xs text-text-muted whitespace-nowrap ml-2">
									{formatEventDate(event.startAt)}
								</span>
							</div>

							<div className="space-y-2">
								{/* Tickets Sold */}
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2">
										<Users className="w-3 h-3 text-text-muted" />
										<span className="text-xs text-text-muted">
											Tickets sold
										</span>
									</div>
									<div className="text-xs text-text">
										{event.ticketsSold}
										{event.capacity && (
											<span className="text-text-muted">
												{" "}
												/ {event.capacity}
											</span>
										)}
										{capacityPercentage !== null && (
											<span className="text-text-muted">
												{" "}
												({capacityPercentage}%)
											</span>
										)}
									</div>
								</div>

								{/* GMV */}
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2">
										<DollarSign className="w-3 h-3 text-text-muted" />
										<span className="text-xs text-text-muted">GMV</span>
									</div>
									<div className="text-xs font-medium text-text">
										{formatNaira(event.gmv)}
									</div>
								</div>

								{/* Capacity bar */}
								{capacityPercentage !== null && (
									<div className="w-full bg-background rounded-full h-1.5 mt-2">
										<div
											className="bg-cta h-1.5 rounded-full transition-all"
											style={{ width: `${Math.min(capacityPercentage, 100)}%` }}
										></div>
									</div>
								)}
							</div>
						</div>
					);
				})}
			</div>

			{/* Footer */}
			<div className="mt-4 pt-3 border-t border-stroke/50">
				<div className="flex items-center justify-between text-xs text-text-muted">
					<span>Total Events: {events.length}</span>
					<span>
						Total GMV:{" "}
						{formatNaira(events.reduce((sum, event) => sum + event.gmv, 0))}
					</span>
				</div>
			</div>
		</div>
	);
}
