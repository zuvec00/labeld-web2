interface EventStatusCapsuleProps {
	startDate: Date | string;
	shortText?: boolean;
	className?: string;
}

export default function EventStatusCapsule({
	startDate,
	shortText = false,
	className = "",
}: EventStatusCapsuleProps) {
	// Convert string to Date if needed
	const eventDate =
		typeof startDate === "string" ? new Date(startDate) : startDate;

	if (!eventDate || isNaN(eventDate.getTime())) {
		return null;
	}

	const now = new Date();
	const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
	const eventDay = new Date(
		eventDate.getFullYear(),
		eventDate.getMonth(),
		eventDate.getDate()
	);

	const daysDiff = Math.floor(
		(eventDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
	);

	// Capsule config
	let bgColor: string;
	let text: string;
	let emoji: string;
	let textColor: string;

	if (daysDiff > 0) {
		// Upcoming Event
		bgColor = "bg-accent/90";
		emoji = "⏳";
		if (daysDiff === 1) {
			text = shortText ? "Tomorrow" : "Event Tomorrow";
		} else {
			text = shortText ? `In ${daysDiff}d` : `Event in ${daysDiff} days`;
		}
		textColor = "text-black";
	} else if (daysDiff === 0) {
		if (now < eventDate) {
			// Event is today but hasn't started yet
			bgColor = "bg-edit/90";
			emoji = "‼️";
			text = shortText ? "Today" : "Event Today";
			textColor = "text-black";
		} else {
			// Event is happening now
			bgColor = "bg-cta/90";
			emoji = "🔥";
			text = shortText ? "Live" : "Event Live Now!";
			textColor = "text-white";
		}
	} else if (daysDiff === -1) {
		// Event was yesterday
		bgColor = "bg-alert/90";
		emoji = "🎉";
		text = shortText ? "Yesterday" : "Event Yesterday";
		textColor = "text-white";
	} else if (daysDiff === -2) {
		// Event was 2 days ago
		bgColor = "bg-alert/90";
		emoji = "🎉";
		text = shortText ? "2 days ago" : "Event 2 days ago";
		textColor = "text-white";
	} else {
		// Old event, don't show
		return null;
	}

	return (
		<div
			className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-heading font-normal ${bgColor} ${textColor} ${className}`}
		>
			<span className="mr-1">{emoji}</span>
			<span>{text}</span>
		</div>
	);
}
