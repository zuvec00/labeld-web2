/* eslint-disable @typescript-eslint/no-explicit-any */
import { Play, Image } from "lucide-react";
import { useState, useEffect } from "react";
import { fetchEventById } from "@/lib/firebase/queries/event";
import EventStatusCapsule from "@/components/ui/EventStatusCapsule";

interface Moment {
	id: string;
	text?: string;
	mediaURL?: string;
	type: "image" | "video" | "text";
	eventId: string;
	authorUserId: string;
	visibility: "attendeesOnly" | "public";
	createdAt: any; // Firestore Timestamp
}

interface MomentCardProps {
	moment: Moment;
	autoHeight?: boolean;
	compact?: boolean;
}

export default function MomentCard({
	moment,
	autoHeight = false,
	compact = false,
}: MomentCardProps) {
	const [eventData, setEventData] = useState<any>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		async function fetchEventData() {
			try {
				const event = await fetchEventById(moment.eventId);
				setEventData(event);
			} catch (error) {
				console.error("Error fetching event data:", error);
			} finally {
				setLoading(false);
			}
		}

		fetchEventData();
	}, [moment.eventId]);

	return (
		<div className={`group cursor-pointer ${compact ? "w-64" : "w-80"}`}>
			<div className="bg-surface rounded-2xl border border-stroke overflow-hidden  hover:border-[#C6FF00]/50 hover:shadow-[0_0_20px_rgba(198,255,0,0.2)] transition-all duration-300">
				{/* Image placeholder */}
				<div
					className={`${
						autoHeight ? "h-auto" : "aspect-[3/4]"
					} bg-gray-800 relative`}
				>
					{moment.mediaURL ? (
						<img
							src={moment.mediaURL}
							alt={moment.text || "Moment image"}
							className={`${
								autoHeight
									? "relative w-full h-auto"
									: "absolute inset-0 w-full h-full"
							} object-cover`}
						/>
					) : (
						<div className="absolute inset-0 w-full h-full flex items-center justify-center text-gray-500 text-3xl font-bold">
							<Image className="h-12 w-12" />
						</div>
					)}
					{/* <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/80" /> */}

					{/* Event Status Capsule */}
					{!loading && eventData && (
						<div className="absolute top-4 left-4">
							<EventStatusCapsule
								startDate={eventData.startAt?.toDate?.() || eventData.startAt}
								shortText={false}
							/>
						</div>
					)}

					{/* Play button overlay for video moments */}
					{moment.type === "video" && (
						<div className="absolute top-4 right-4">
							<div className="bg-black/50 rounded-full p-2">
								<Play className="h-4 w-4 text-white fill-white" />
							</div>
						</div>
					)}

					{/* Content overlay */}
					<div className="absolute bottom-0 left-0 right-0 p-4">
						{/* <h3 className="text-white font-unbounded font-bold text-lg mb-1 line-clamp-1">
							{moment.text || "Moment"}
						</h3> */}
						{/* <p className="text-gray-300 text-sm line-clamp-2 font-manrope">
							{moment.type === "video"
								? "Video moment"
								: moment.type === "image"
								? "Image moment"
								: "Text moment"}
						</p> */}
					</div>
				</div>
			</div>
		</div>
	);
}
