// src/components/brand/brandspace/DropStatusCapsule.tsx
"use client";

import React from "react";

export default function DropStatusCapsule({
	launchDate,
	shortText = false,
	className = "",
}: {
	launchDate?: Date | null;
	shortText?: boolean;
	className?: string;
}) {
	if (!launchDate) return null;

	const now = new Date();
	const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
	const dayLaunch = new Date(
		launchDate.getFullYear(),
		launchDate.getMonth(),
		launchDate.getDate()
	);
	const daysDiff = Math.floor(
		(dayLaunch.getTime() - today.getTime()) / 86400000
	);

	let bg = "";
	let text = "";
	let emoji = "";
	let txt = "";

	if (daysDiff > 0) {
		bg = "bg-vibeaccent"; // map this to your Tailwind color or use inline style
		emoji = "⏳";
		text =
			daysDiff === 1
				? shortText
					? "Tomorrow"
					: "Drops Tomorrow"
				: shortText
				? `In ${daysDiff} d`
				: `Drops in ${daysDiff} days`;
		txt = "text-black";
	} else if (daysDiff === 0) {
		if (now < launchDate) {
			bg = "bg-edit";
			emoji = "‼️";
			text = shortText ? "Today" : "Drops Today";
			txt = "text-black";
		} else {
			bg = "bg-cta";
			emoji = "🔥";
			text = shortText ? "Dropped" : "Just Dropped!";
			txt = "text-white";
		}
	} else if (daysDiff === -1) {
		bg = "bg-alert";
		emoji = "🚨";
		text = shortText ? "Yesterday" : "Dropped Yesterday";
		txt = "text-white";
	} else if (daysDiff === -2) {
		bg = "bg-alert";
		emoji = "🚨";
		text = shortText ? "2 days ago" : "Dropped 2 days ago";
		txt = "text-white";
	} else {
		return null;
	}

	console.log(daysDiff);

	return (
		<span
			className={[
				"inline-flex items-center gap-2 rounded-full px-2.5 py-1",
				bg,
				txt,
				"backdrop-saturate-150",
				className,
			].join(" ")}
		>
			<span aria-hidden>{emoji}</span>
			<span className="font-medium text-[13px]">{text}</span>
		</span>
	);
}
