"use client";

import { useState, useEffect, useRef } from "react";
import {
	collection,
	query,
	where,
	orderBy,
	limit,
	getDocs,
} from "firebase/firestore";
import { db } from "@/lib/firebase/firebaseConfig";
import { Announcement } from "@/types/announcement";
import { Bell } from "lucide-react";

export default function NotificationBell() {
	const [announcements, setAnnouncements] = useState<Announcement[]>([]);
	const [isOpen, setIsOpen] = useState(false);
	const [unreadCount, setUnreadCount] = useState(0);
	const dropdownRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const fetchAnnouncements = async () => {
			try {
				const q = query(
					collection(db, "announcements"),
					where("isActive", "==", true),
					orderBy("createdAt", "desc"),
					limit(5),
				);
				const snapshot = await getDocs(q);
				const data = snapshot.docs.map((doc) => ({
					id: doc.id,
					...doc.data(),
				})) as Announcement[];

				setAnnouncements(data);

				// Calculate unread count
				if (data.length > 0) {
					const lastReadStr = localStorage.getItem("lastReadAnnouncementAt");
					const lastRead = lastReadStr ? parseInt(lastReadStr, 10) : 0;

					const count = data.filter((item) => {
						const timestamp = item.createdAt?.toMillis
							? item.createdAt.toMillis()
							: item.createdAt?.seconds
								? item.createdAt.seconds * 1000
								: Date.now();
						return timestamp > lastRead;
					}).length;

					setUnreadCount(count);
				}
			} catch (error) {
				console.error("Error fetching announcements:", error);
			}
		};

		fetchAnnouncements();
	}, []);

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
			localStorage.setItem("lastReadAnnouncementAt", Date.now().toString());
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
