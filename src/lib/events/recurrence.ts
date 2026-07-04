export type RecurringFrequency = "daily" | "weekly" | "biweekly" | "monthly";

export type EventOccurrence = {
	startAt: Date;
	endAt?: Date;
};

type RecurringEventLike = {
	startAt?: unknown;
	endAt?: unknown;
	isRecurring?: boolean;
	frequency?: RecurringFrequency;
	recurringEndMode?: "date" | "occurrences";
	recurringEndDate?: unknown;
	recurringEndOccurrences?: number;
};

export function toDate(value: unknown): Date | null {
	if (!value) return null;
	if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
	if (typeof value === "object" && value !== null && "toDate" in value) {
		const date = (value as { toDate?: () => Date }).toDate?.();
		return date && !Number.isNaN(date.getTime()) ? date : null;
	}
	if (typeof value === "object" && value !== null && "seconds" in value) {
		const seconds = Number((value as { seconds?: number }).seconds);
		return Number.isFinite(seconds) ? new Date(seconds * 1000) : null;
	}
	const date = new Date(value as string | number);
	return Number.isNaN(date.getTime()) ? null : date;
}

function addFrequency(date: Date, frequency: RecurringFrequency) {
	const next = new Date(date);
	switch (frequency) {
		case "daily":
			next.setDate(next.getDate() + 1);
			break;
		case "weekly":
			next.setDate(next.getDate() + 7);
			break;
		case "biweekly":
			next.setDate(next.getDate() + 14);
			break;
		case "monthly":
			next.setMonth(next.getMonth() + 1);
			break;
	}
	return next;
}

export function getEventOccurrences(
	event: RecurringEventLike,
	limit = 1000,
): EventOccurrence[] {
	const startAt = toDate(event.startAt);
	if (!startAt) return [];

	const endAt = toDate(event.endAt);
	const durationMs =
		endAt && endAt > startAt ? endAt.getTime() - startAt.getTime() : 0;

	if (!event.isRecurring || !event.frequency) {
		return [
			{
				startAt,
				endAt:
					durationMs > 0
						? new Date(startAt.getTime() + durationMs)
						: endAt || undefined,
			},
		];
	}

	const maxOccurrences =
		event.recurringEndMode === "occurrences" && event.recurringEndOccurrences
			? event.recurringEndOccurrences
			: limit;
	const recurringEndDate =
		event.recurringEndMode === "date" ? toDate(event.recurringEndDate) : null;
	const occurrences: EventOccurrence[] = [];
	let current = new Date(startAt);

	for (let index = 0; index < maxOccurrences && occurrences.length < limit; index += 1) {
		if (recurringEndDate && current > recurringEndDate) break;
		occurrences.push({
			startAt: new Date(current),
			endAt:
				durationMs > 0 ? new Date(current.getTime() + durationMs) : undefined,
		});
		current = addFrequency(current, event.frequency);
	}

	return occurrences;
}

export function getLastOccurrence(event: RecurringEventLike): EventOccurrence | null {
	const all = getEventOccurrences(event);
	return all.at(-1) || null;
}

export function getUpcomingOccurrence(
	event: RecurringEventLike,
	now = new Date(),
): EventOccurrence | null {
	const all = getEventOccurrences(event);
	return (
		all.find((occurrence) => (occurrence.endAt || occurrence.startAt) >= now) ||
		null
	);
}

export function hasEventScheduleEnded(event: RecurringEventLike, now = new Date()) {
	const lastOccurrence = getLastOccurrence(event);
	const endTime = lastOccurrence?.endAt || lastOccurrence?.startAt;
	return endTime ? endTime < now : false;
}

export function getEventDisplayStart(
	event: RecurringEventLike,
	now = new Date(),
) {
	return (
		getUpcomingOccurrence(event, now)?.startAt ||
		getLastOccurrence(event)?.startAt ||
		toDate(event.startAt)
	);
}
