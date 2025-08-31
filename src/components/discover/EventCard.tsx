/* eslint-disable @typescript-eslint/no-explicit-any */
import { Calendar, MapPin } from "lucide-react";
import { useRouter } from "next/navigation";

interface Event {
	id: string;
	slug: string;
	title: string;
	startAt: any; // Firestore Timestamp
	venue: {
		name: string;
		address: string;
		city?: string;
		state: string;
		country: string;
	};
	coverImageURL: string;
	type: string;
}

interface EventCardProps {
	event: Event;
}

export default function EventCard({ event }: EventCardProps) {
	const router = useRouter();

	const formatDate = (timestamp: any) => {
		if (!timestamp) return "TBD";

		let date: Date;
		if (timestamp instanceof Date) {
			date = timestamp;
		} else if (timestamp?.toDate) {
			date = timestamp.toDate();
		} else {
			return "TBD";
		}

		return date.toLocaleDateString("en-US", {
			month: "short",
			day: "numeric",
			year: "numeric",
		});
	};

	const getLocation = () => {
		const venue = event.venue;
		if (venue?.city && venue?.state) {
			return `${venue.city}, ${venue.state}`;
		} else if (venue?.state) {
			return venue.state;
		} else if (venue?.country) {
			return venue.country;
		}
		return "Location TBD";
	};

	const handleClick = () => {
		router.push(`/e/${event.id}-${event.slug}`);
	};

	return (
		<div
			className="group cursor-pointer"
			onClick={handleClick}
			role="button"
			tabIndex={0}
			onKeyDown={(e) => {
				if (e.key === "Enter" || e.key === " ") {
					handleClick();
				}
			}}
		>
			<div className="bg-surface rounded-2xl border border-stroke overflow-hidden  hover:border-[#C6FF00]/50 hover:shadow-[0_8px_40px_rgba(0,0,0,0.45)] transition-all duration-300">
				{/* Event cover image */}
				<div className="aspect-[4/5] bg-surface relative">
					{event.coverImageURL ? (
						<img
							src={event.coverImageURL}
							alt={event.title}
							className="absolute inset-0 w-full h-full object-cover"
						/>
					) : (
						<div className="absolute inset-0 w-full h-full bg-gray-800 flex items-center justify-center text-gray-500 text-3xl font-bold">
							No Image
						</div>
					)}
					{/* Stronger/darker shadow at the bottom, fading up */}
					<div
						className="absolute inset-0 pointer-events-none"
						style={{
							background:
								"linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.55) 35%, rgba(0,0,0,0.15) 70%, rgba(0,0,0,0.00) 100%)",
						}}
					/>
					<div className="absolute bottom-0 left-0 right-0 p-4 pb-8 text-center">
						<div className="flex items-center justify-center text-gray-300 text-sm">
							<MapPin className="h-4 w-4 mr-1" />
							{getLocation()}
						</div>
						<h2 className="text-text font-unbounded font-bold text-2xl mb-2 line-clamp-3">
							{event.title}
						</h2>
						<div className="flex items-center justify-center text-text text-md mb-1">
							<Calendar className="h-4 w-4 mr-1" />
							{formatDate(event.startAt)}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
