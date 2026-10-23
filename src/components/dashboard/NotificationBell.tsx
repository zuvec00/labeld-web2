"use client";

import { useState, useEffect, useRef } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/firebaseConfig";
import { useAuth } from "@/lib/auth/AuthContext";
import { Announcement } from "@/types/announcement";
import { Bell } from "lucide-react";

const FEED_LIMIT = 10;

function createdAtMs(item: Announcement): number {
	const c: any = item.createdAt;
	if (c?.toMillis) return c.toMillis();
	if (c?.seconds) return c.seconds * 1000;
	return 0;
}

export default function NotificationBell() {
	const { user } = useAuth();
	const [announcements, setAnnouncements] = useState<Announcement[]>([]);
	const [isOpen, setIsOpen] = useState(false);
	const [unreadCount, setUnreadCount] = useState(0);
	const dropdownRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const fetchFeed = async () => {
			// The feed is the brand's own notifications merged with global
			// announcements, newest first (same as the mobile bell). Sorted
			// client-side so neither query needs a composite index.
			const load = async (path: string[]) => {
				const snapshot = await getDocs(
					query(
						collection(db, path[0], ...path.slice(1)),
						where("isActive", "==", true),
					),
				);
				return snapshot.docs.map((d) => ({
					id: d.id,
					...d.data(),
				})) as Announcement[];
			};

			// allSettled: a failure in one source must not blank the other.
			const [mine, global] = await Promise.allSettled([
				user?.uid
					? load(["users", user.uid, "notifications"])
					: Promise.resolve([] as Announcement[]),
				load(["announcements"]),
			]);
			if (mine.status === "rejected") {
				console.error("Error fetching user notifications:", mine.reason);
			}
			if (global.status === "rejected") {
				console.error("Error fetching announcements:", global.reason);
			}

			const data = [
				...(mine.status === "fulfilled" ? mine.value : []),
				...(global.status === "fulfilled" ? global.value : []),
			]
				.sort((a, b) => createdAtMs(b) - createdAtMs(a))
				.slice(0, FEED_LIMIT);

			setAnnouncements(data);

			// Calculate unread count
			if (data.length > 0) {
				let lastRead = 0;
				try {
					const lastReadStr = localStorage.getItem("lastReadAnnouncementAt");
					lastRead = lastReadStr ? parseInt(lastReadStr, 10) : 0;
				} catch {
					// storage unavailable: treat everything as unread
				}
				setUnreadCount(data.filter((item) => createdAtMs(item) > lastRead).length);
			} else {
				setUnreadCount(0);
			}
		};

		fetchFeed();
	}, [user?.uid]);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				dropdownRef.current &&
				!dropdownRef.current.contains(event.target as Node)
			) {
				setIsOpen(false);
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	const handleOpenDropdown = () => {
		setIsOpen(!isOpen);
		if (!isOpen && unreadCount > 0) {
			setUnreadCount(0);
			try {
				localStorage.setItem("lastReadAnnouncementAt", Date.now().toString());
			} catch {
				// storage unavailable: unread badge will reappear next load
			}
		}
	};

	const getBadgeClasses = (type: string) => {
		switch (type) {
			case "New":
				return "bg-green-500/10 text-green-500 border-green-500/20";
			case "Update":
				return "bg-blue-500/10 text-blue-500 border-blue-500/20";
			case "Fix":
				return "bg-amber-500/10 text-amber-500 border-amber-500/20";
			case "Promo":
				return "bg-purple-500/10 text-purple-500 border-purple-500/20";
			default:
				return "bg-stroke text-text-muted border-stroke";
		}
	};

	const formatDate = (timestamp: any) => {
		if (!timestamp) return "";
		const dateObj = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
		return dateObj.toLocaleDateString("en-US", {
			month: "short",
			day: "numeric",
		});
	};

	return (
		<div className="relative" ref={dropdownRef}>
			<button
				onClick={handleOpenDropdown}
				className="p-2 rounded-lg border border-stroke text-text-muted hover:text-text hover:bg-surface transition-colors relative"
			>
				<Bell className="w-5 h-5" />
				{unreadCount > 0 && (
					<span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white rounded-full border-2 border-surface flex items-center justify-center text-[10px] font-bold">
						{unreadCount > 9 ? "9+" : unreadCount}
					</span>
				)}
			</button>

			{isOpen && (
				<div className="absolute right-0 top-full mt-2 w-80 md:w-96 rounded-2xl border border-stroke bg-surface shadow-xl shadow-black/5 animate-in fade-in slide-in-from-top-2 z-50 overflow-hidden flex flex-col max-h-[85vh]">
					<div className="p-4 border-b border-stroke flex items-center justify-between sticky top-0 bg-surface/95 backdrop-blur-sm z-10">
						<h3 className="font-semibold text-text">Latest changes</h3>
					</div>

					<div className="overflow-y-auto flex-1 p-2">
						{announcements.length === 0 ? (
							<div className="p-6 text-center text-sm text-text-muted">
								No new announcements.
							</div>
						) : (
							<div className="space-y-1">
								{announcements.map((item) => (
									<div
										key={item.id}
										className="p-3 hover:bg-bg/50 rounded-xl transition-colors group"
									>
										<div className="flex items-start gap-3">
											<div className="flex-1 min-w-0">
												<div className="flex items-center gap-2 mb-1.5 flex-wrap">
													<span
														className={`px-2 py-0.5 rounded-full border text-[10px] font-semibold tracking-wide uppercase ${getBadgeClasses(item.type)}`}
													>
														{item.type}
													</span>
													<h4 className="text-sm font-medium text-text leading-tight group-hover:text-accent transition-colors">
														{item.title}
													</h4>
												</div>
												<p className="text-sm text-text-muted leading-relaxed line-clamp-3">
													{item.content}
												</p>
												<span className="text-[10px] font-medium text-text-muted/70 mt-3 block uppercase tracking-wider">
													{formatDate(item.createdAt)}
												</span>
											</div>
										</div>
									</div>
								))}
							</div>
						)}
					</div>
				</div>
			)}
		</div>
	);
}
