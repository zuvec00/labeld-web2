/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useSearchParams, useRouter } from "next/navigation";
import {
	MapPin,
	Calendar,
	ArrowLeft,
	ArrowRight,
	Instagram,
	Youtube,
	Twitter,
	Music,
	Clock,
	X,
} from "lucide-react";
import {
	collection,
	query,
	where,
	getDocs,
	orderBy,
	limit,
	getCountFromServer,
	Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase/firebaseConfig";
import { useDashboardContext } from "@/hooks/useDashboardContext";
import { useEffect, useState } from "react";
import Button from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import OptimizedImage from "@/components/ui/OptimizedImage";

/* -------------------------------------------------------------------------- */
/*                            AFTER HOURS TEMPLATE                            */
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
/*                            AFTER HOURS TEMPLATE                            */
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
/*                            AFTER HOURS COMPONENTS                          */
/* -------------------------------------------------------------------------- */

import { EventModel } from "@/lib/models/event";

// Helper to format date safely
const getEventDate = (date: any): Date | null => {
	if (!date) return null;
	if (date instanceof Date) return date;
	if (typeof date.toDate === "function") return date.toDate();
	if (typeof date === "string" || typeof date === "number")
		return new Date(date);
	return null;
};

const formatEventTime = (date: Date | null) => {
	if (!date) return "FRI, AUG 24 · 10:00 PM"; // Mock Fallback
	return new Intl.DateTimeFormat("en-US", {
		weekday: "short",
		month: "short",
		day: "numeric",
		hour: "numeric",
		minute: "numeric",
	})
		.format(date)
		.toUpperCase();
};

export function AfterHoursHero({ config }: { config: any }) {
	const heroSettings = config?.sectionSettings?.["hero-1"] || {};
	const heroHeadline = heroSettings.headline || "ORGANIZER NAME";
	const heroSubheadline =
		heroSettings.subheadline ||
		"Curating the finest underground experiences since 2024.";
	const heroImage =
		heroSettings.imageUrl ||
		"https://images.unsplash.com/photo-1566737236500-c8ac43014a67?q=80&w=2670&auto=format&fit=crop";

	return (
		<section className="relative h-[85vh] w-full overflow-hidden flex flex-col items-center justify-center text-center px-6 text-white font-sans selection:bg-purple-500 selection:text-white">
			{/* Background Image Placeholder */}
			<div className="absolute inset-0 z-0">
				<div
					className="absolute inset-0 bg-cover bg-center opacity-60 grayscale-[50%] animate-in fade-in zoom-in duration-1000 transition-all"
					style={{ backgroundImage: `url('${heroImage}')` }}
				></div>
				<div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/50 to-transparent"></div>
				<div className="absolute inset-0 bg-neutral-950/20"></div>
			</div>

			{/* Content */}
			<div className="relative z-10 space-y-6 max-w-4xl animate-in slide-in-from-bottom-8 fade-in duration-1000 delay-300">
				<div className="inline-block px-3 py-1 border border-white/20 rounded-full bg-white/5 backdrop-blur-md text-xs font-medium tracking-widest uppercase mb-4 text-white">
					NIGHTLIFE · CULTURE · MUSIC
				</div>
				<h1 className="text-5xl md:text-8xl font-black tracking-tighter uppercase leading-none break-words text-white">
					{heroHeadline}
				</h1>
				<p className="text-base md:text-xl text-neutral-300 font-light max-w-lg mx-auto leading-relaxed">
					{heroSubheadline}
				</p>

				<div className="pt-8">
					<div className="animate-bounce mt-10">
						<ArrowRight className="w-6 h-6 rotate-90 mx-auto text-white/50" />
					</div>
				</div>
			</div>
		</section>
	);
}

export function AfterHoursFeatured({
	config,
	eventData,
}: {
	config: any;
	eventData?: EventModel;
}) {
	const featuredSettings = config?.sectionSettings?.["featured-1"] || {};
	const featuredTitle = featuredSettings.title || "Next Experience";

	// Data or Fallback
	const image =
		eventData?.coverImageURL ||
		"https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80";
	const title = eventData?.title || "MIDNIGHT \n SESSIONS";
	const dateStr = formatEventTime(getEventDate(eventData?.startAt));
	const location = eventData?.venue?.address || "Secret Location, Lagos";
	const description =
		eventData?.description ||
		"An immersive audio-visual journey through deep house and techno. Join us for an unforgettable night featuring international guest DJs and local legends.";

	return (
		<section className="py-12 md:py-20 px-4 md:px-8 max-w-7xl mx-auto text-white font-sans selection:bg-purple-500 selection:text-white">
			<div className="flex items-center gap-4 mb-8 md:mb-12">
				<div className="h-px bg-white/20 flex-1"></div>
				<span className="text-sm font-bold tracking-widest uppercase text-white/50">
					{featuredTitle}
				</span>
				<div className="h-px bg-white/20 flex-1"></div>
			</div>

			<div className="grid md:grid-cols-2 gap-8 md:gap-16 items-center group cursor-default">
				{/* Poster */}
				<div className="relative aspect-[3/4] md:aspect-[4/5] overflow-hidden bg-neutral-900 rounded-sm shadow-2xl shadow-purple-900/10">
					<OptimizedImage
						src={image}
						alt="Event Poster"
						fill
						className="object-cover group-hover:scale-105 transition-transform duration-700 grayscale-[20%] group-hover:grayscale-0"
					/>
					<Badge
						variant="success"
						className="absolute top-4 right-4 text-xs font-bold tracking-wider uppercase border-none"
					>
						Selling Fast
					</Badge>
				</div>

				{/* Details */}
				<div className="space-y-6 md:space-y-8">
					<div className="space-y-4">
						<div className="flex items-center gap-3 text-purple-400 font-mono text-sm">
							<Calendar className="w-4 h-4" />
							<span>{dateStr}</span>
						</div>
						<h2 className="text-4xl md:text-7xl font-bold tracking-tighter leading-none uppercase text-white whitespace-pre-line">
							{title}
						</h2>
						<div className="flex items-center gap-3 text-neutral-400">
							<MapPin className="w-5 h-5" />
							<span className="text-lg">{location}</span>
						</div>
					</div>

					<p className="text-neutral-400 leading-relaxed max-w-md line-clamp-4">
						{description}
					</p>

					<div className="pt-4">
						<button
							disabled
							className="px-8 py-4 bg-white text-black font-bold uppercase tracking-widest hover:bg-neutral-200 transition-colors w-full md:w-auto opacity-50 cursor-not-allowed"
						>
							View Event Details
						</button>
					</div>
				</div>
			</div>
		</section>
	);
}

export function AfterHoursUpcoming({ config }: { config: any }) {
	const upcomingSettings = config?.sectionSettings?.["upcoming-1"] || {};
	const title = upcomingSettings.title || "Upcoming";

	return (
		<section className="py-12 md:py-20 px-4 md:px-8 max-w-7xl mx-auto border-t border-white/10 text-white font-sans selection:bg-purple-500 selection:text-white">
			<div className="flex items-end justify-between mb-8 md:mb-12">
				<h3 className="text-2xl md:text-4xl font-bold tracking-tighter uppercase">
					{title}
				</h3>
				<button
					disabled
					className="text-sm font-mono text-neutral-500 hover:text-white transition-colors flex items-center gap-2 cursor-not-allowed"
				>
					VIEW ALL <ArrowRight className="w-4 h-4" />
				</button>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
				{[1, 2, 3].map((i) => (
					<div key={i} className="group cursor-default">
						<div className="relative aspect-[3/4] bg-neutral-900 overflow-hidden mb-4 rounded-sm">
							<div
								className={`absolute inset-0 bg-neutral-800 animate-pulse`}
							></div>
							{/* Placeholder for mock images */}
							{i === 1 && (
								<OptimizedImage
									src="https://images.unsplash.com/photo-1598387993441-a364f854c3e1?q=80&w=800&auto=format&fit=crop"
									fill
									className="object-cover opacity-60 group-hover:opacity-100 transition-opacity duration-500"
									alt="Event"
								/>
							)}
							{i === 2 && (
								<OptimizedImage
									src="https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=80"
									fill
									className="object-cover opacity-60 group-hover:opacity-100 transition-opacity duration-500"
									alt="Event"
								/>
							)}
							{i === 3 && (
								<OptimizedImage
									src="https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&w=800&q=80"
									fill
									className="object-cover opacity-60 group-hover:opacity-100 transition-opacity duration-500"
									alt="Event"
								/>
							)}

							<div className="absolute top-3 left-3">
								<Badge
									variant="outline"
									className="bg-black/50 border-white/20 text-white backdrop-blur-md"
								>
									{i === 1 ? "Live" : "Draft"}
								</Badge>
							</div>
						</div>
						<div className="space-y-1">
							<p className="text-xs font-mono text-purple-400">SEP {10 + i}</p>
							<h4 className="text-xl font-bold uppercase tracking-tight line-clamp-1 text-white">
								{i === 1
									? "Techno Bunker"
									: i === 2
										? "Rooftop Sunset"
										: "Warehouse Rave"}
							</h4>
							<p className="text-sm text-neutral-500">Lagos, Nigeria</p>
						</div>
					</div>
				))}
			</div>
		</section>
	);
}

export function AfterHoursPast({ config }: { config: any }) {
	const { user } = useDashboardContext();
	const [pastEvents, setPastEvents] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);

	// Config
	// Robust lookup for Past Events section
	let sectionConfig = config?.sectionSettings?.["pastEvents-1"];
	if (!sectionConfig && config?.sectionSettings) {
		// Fallback: find first section of type 'pastEvents'
		const foundId = Object.keys(config.sectionSettings).find(
			(key) => config.sectionSettings[key]?.type === "pastEvents",
		);
		if (foundId) sectionConfig = config.sectionSettings[foundId];
	}

	const settings = sectionConfig || {};
	const title = settings.title || "Past Experiences";
	const showAttendeeCount = settings.showAttendeeCount !== false;

	useEffect(() => {
		const fetchPast = async () => {
			if (!user?.uid) return;
			try {
				const now = new Date();
				const q = query(
					collection(db, "events"),
					where("createdBy", "==", user.uid),
					where("endAt", "<", now), // basic check, might need index
					orderBy("endAt", "desc"),
					limit(5),
				);

				// Keep it simple: if index missing, might fail.
				// Fallback: fetch recent and filter client side if needed,
				// but let's try strict query first.
				const snap = await getDocs(q);

				const eventsWithCounts = await Promise.all(
					snap.docs.map(async (d) => {
						const data = d.data();
						// Fetch Count
						const ticketsQ = query(
							collection(db, "attendeeTickets"),
							where("eventId", "==", d.id),
						);
						const countSnap = await getCountFromServer(ticketsQ);

						return {
							id: d.id,
							...data,
							attendeeCount: countSnap.data().count,
						};
					}),
				);

				setPastEvents(eventsWithCounts);
			} catch (e) {
				console.error("Failed to fetch past events", e);
				// Mock fallback if failed (e.g. index missing)
				setPastEvents([]);
			} finally {
				setLoading(false);
			}
		};

		fetchPast();
	}, [user?.uid]);

	// Fallback to Mocks if no real data (to show the design)
	const displayEvents = pastEvents.length > 0 ? pastEvents : [1, 2, 3];

	return (
		<section className="py-12 md:py-20 px-4 md:px-8 border-t border-white/10 overflow-hidden text-white font-sans selection:bg-purple-500 selection:text-white">
			<div className="max-w-7xl mx-auto">
				<h3 className="text-sm font-bold tracking-widest uppercase text-neutral-500 mb-8">
					{title}
				</h3>

				<div className="flex gap-6 overflow-x-auto pb-8 snap-x scrollbar-hide">
					{displayEvents.map((item, i) => {
						const isMock = typeof item === "number";
						// Mock Data
						if (isMock) {
							return (
								<div
									key={i}
									className="min-w-[280px] md:min-w-[320px] snap-center group opacity-50 hover:opacity-100 transition-opacity cursor-default"
								>
									<div className="aspect-video bg-neutral-900 rounded-sm overflow-hidden mb-3 relative">
										<div className="absolute inset-0 bg-white/5 group-hover:bg-transparent transition-colors"></div>
										<div className="absolute bottom-3 left-3 bg-black/80 px-2 py-1 text-[10px] font-bold uppercase text-white">
											Past Event
										</div>
									</div>
									<h4 className="font-bold text-lg uppercase text-white">
										Archive Vol. 0{item}
									</h4>
									{showAttendeeCount && (
										<p className="text-xs text-neutral-500 mt-1">
											Sold Out · 450 Attendees
										</p>
									)}
								</div>
							);
						}

						// Real Data
						const evt = item;
						return (
							<div
								key={evt.id}
								className="min-w-[280px] md:min-w-[320px] snap-center group opacity-80 hover:opacity-100 transition-opacity cursor-default"
							>
								<div className="aspect-video bg-neutral-900 rounded-sm overflow-hidden mb-3 relative">
									{evt.coverImageURL ? (
										<OptimizedImage
											src={evt.coverImageURL}
											fill
											alt={evt.title}
											className="object-cover grayscale group-hover:grayscale-0 transition-all"
										/>
									) : (
										<div className="w-full h-full bg-neutral-800 flex items-center justify-center text-neutral-600">
											<Music className="w-8 h-8" />
										</div>
									)}
									<div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors"></div>
								</div>
								<h4 className="font-bold text-lg uppercase text-white line-clamp-1">
									{evt.title}
								</h4>
								{showAttendeeCount && (
									<p className="text-xs text-neutral-500 mt-1">
										{evt.attendeeCount > 0 ? (
											<>{evt.attendeeCount} Attendees</>
										) : (
											<>Wrapped Up</>
										)}
									</p>
								)}
							</div>
						);
					})}
				</div>
			</div>
		</section>
	);
}

export function AfterHoursFooter({ config }: { config: any }) {
	const heroSettings = config?.sectionSettings?.["hero-1"] || {};
	const heroHeadline = heroSettings.headline || "ORGANIZER NAME";

	return (
		<footer className="py-12 border-t border-white/10 bg-neutral-950 text-white font-sans selection:bg-purple-500 selection:text-white">
			<div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-8">
				<div className="text-center md:text-left">
					<h5 className="font-black text-2xl tracking-tighter uppercase mb-2">
						{heroHeadline}
					</h5>
					<p className="text-sm text-neutral-500">
						© 2024. All rights reserved.
					</p>
				</div>

				<div className="flex gap-6">
					<div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-white hover:text-black transition-colors cursor-not-allowed">
						<Instagram className="w-5 h-5" />
					</div>
					<div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-white hover:text-black transition-colors cursor-not-allowed">
						<Twitter className="w-5 h-5" />
					</div>
					<div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-white hover:text-black transition-colors cursor-not-allowed">
						<Music className="w-5 h-5" />
					</div>
				</div>

				<div className="text-xs text-neutral-600 font-medium">
					POWERED BY <span className="text-white font-bold ml-1">LABELD</span>
				</div>
			</div>
		</footer>
	);
}

/* -------------------------------------------------------------------------- */
/*                            AFTER HOURS TEMPLATE                            */
/* -------------------------------------------------------------------------- */
export function AfterHoursTemplate({ config }: { config: any }) {
	return (
		<div className="min-h-screen bg-neutral-950 text-white font-sans selection:bg-purple-500 selection:text-white">
			<AfterHoursHero config={config} />
			<AfterHoursFeatured config={config} />
			<AfterHoursUpcoming config={config} />
			<AfterHoursPast config={config} />
			<AfterHoursFooter config={config} />
		</div>
	);
}

/* -------------------------------------------------------------------------- */
/*                            SOCIALITE TEMPLATE                              */
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
/*                            SOCIALITE TEMPLATE                              */
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
/*                            SOCIALITE COMPONENTS                            */
/* -------------------------------------------------------------------------- */

export function SocialiteHero({ config }: { config: any }) {
	const heroSettings = config?.sectionSettings?.["soc-hero-1"] || {};
	const heroHeadline = heroSettings.headline || "The Sunday Collective";
	const heroSubheadline =
		heroSettings.subheadline ||
		"Curating soulful brunches and creative mixers for the modern city dweller.";
	const heroImage =
		heroSettings.imageUrl ||
		"https://images.unsplash.com/photo-1543007630-9710e4a00a20?q=80&w=2000&auto=format&fit=crop";

	return (
		<section className="relative h-[60vh] w-full overflow-hidden flex flex-col items-center justify-center text-center px-6">
			{/* Background */}
			<div className="absolute inset-0 z-0">
				<OptimizedImage
					src={heroImage}
					alt="Social gathering"
					fill
					className="object-cover opacity-90"
				/>
				<div className="absolute inset-0 bg-stone-50/80 backdrop-blur-[2px]"></div>
				<div className="absolute inset-0 bg-gradient-to-t from-stone-50 to-transparent"></div>
			</div>

			{/* Content */}
			<div className="relative z-10 space-y-4 max-w-2xl animate-in slide-in-from-bottom-8 fade-in duration-1000">
				<div className="mx-auto w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden border-2 border-stone-200 shadow-xl mb-4">
					<OptimizedImage
						src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80"
						alt="Organizer"
						width={100}
						height={100}
						className="object-cover w-full h-full"
					/>
				</div>
				<h1 className="text-4xl md:text-6xl font-light tracking-tight text-stone-800 break-words">
					{heroHeadline}
				</h1>
				<p className="text-lg md:text-xl text-stone-600 font-light max-w-lg mx-auto leading-relaxed italic">
					"{heroSubheadline}"
				</p>

				<div className="flex justify-center gap-4 pt-4 text-stone-400">
					<Instagram className="w-5 h-5 hover:text-stone-800 transition-colors cursor-pointer" />
					<Twitter className="w-5 h-5 hover:text-stone-800 transition-colors cursor-pointer" />
					<Youtube className="w-5 h-5 hover:text-stone-800 transition-colors cursor-pointer" />
				</div>
			</div>
		</section>
	);
}

export function SocialiteFeatured({
	config,
	eventData,
}: {
	config: any;
	eventData?: EventModel;
}) {
	const featuredSettings = config?.sectionSettings?.["soc-featured-1"] || {};
	const featuredTitle = featuredSettings.title || "Next Gathering";

	// Data or Fallback
	const image =
		eventData?.coverImageURL ||
		"https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=1000&q=80";
	const title = eventData?.title || "Botanical Brunch & Paint";
	const dateStr = formatEventTime(getEventDate(eventData?.startAt));
	const location = eventData?.venue?.name || "The Greenhouse, Lekki";
	const locationCity = eventData?.venue?.city || "";
	const fullLocation = locationCity ? `${location}, ${locationCity}` : location;

	return (
		<section className="py-12 md:py-20 px-4 md:px-8 max-w-5xl mx-auto -mt-20 relative z-20">
			<div className="bg-white rounded-xl shadow-2xl shadow-stone-200/50 overflow-hidden grid md:grid-cols-2 group cursor-default border border-stone-100">
				{/* Image */}
				<div className="relative aspect-square md:aspect-auto h-full min-h-[300px] overflow-hidden">
					<OptimizedImage
						src={image}
						alt="Brunch"
						fill
						className="object-cover group-hover:scale-105 transition-transform duration-700"
					/>
					<Badge className="absolute top-4 left-4 bg-white/90 text-stone-800 font-medium backdrop-blur-sm border-none shadow-sm">
						Upcoming
					</Badge>
				</div>

				{/* Content */}
				<div className="p-8 md:p-12 flex flex-col justify-center space-y-6">
					<div>
						<p className="text-orange-500 font-bold uppercase tracking-widest text-xs mb-2">
							{featuredTitle}
						</p>
						<h2 className="text-3xl md:text-4xl font-serif font-medium text-stone-900 leading-tight">
							{title}
						</h2>
					</div>

					<div className="space-y-3 text-stone-500">
						<div className="flex items-center gap-3">
							<Calendar className="w-5 h-5 text-orange-400" />
							<span>{dateStr}</span>
						</div>
						<div className="flex items-center gap-3">
							<MapPin className="w-5 h-5 text-orange-400" />
							<span>{fullLocation}</span>
						</div>
						<div className="flex items-center gap-3">
							<Clock className="w-5 h-5 text-orange-400" />
							<span>Coming Soon</span>
						</div>
					</div>

					<div className="pt-4">
						<button
							disabled
							className="w-full py-3 bg-stone-900 text-white rounded-lg font-medium hover:bg-stone-800 transition-colors opacity-50 cursor-not-allowed"
						>
							Reserve Your Spot
						</button>
					</div>
				</div>
			</div>
		</section>
	);
}

export function SocialiteUpcoming({ config }: { config: any }) {
	const upcomingSettings = config?.sectionSettings?.["soc-upcoming-1"] || {};
	const title = upcomingSettings.title || "Community Calendar";

	return (
		<section className="py-20 px-4 md:px-8 max-w-6xl mx-auto">
			<div className="text-center mb-16">
				<h3 className="text-2xl md:text-3xl font-serif font-medium text-stone-900 mb-4">
					{title}
				</h3>
				<div className="w-16 h-1 bg-orange-200 mx-auto rounded-full"></div>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10">
				{[1, 2, 3].map((i) => (
					<div
						key={i}
						className="group cursor-default bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-all border border-stone-100"
					>
						<div className="relative aspect-[4/3] rounded-xl overflow-hidden mb-5">
							{/* Images */}
							{i === 1 && (
								<OptimizedImage
									src="https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=800&q=80"
									fill
									className="object-cover group-hover:scale-105 transition-transform duration-500"
									alt="Founders Mixer"
								/>
							)}
							{i === 2 && (
								<OptimizedImage
									src="https://images.unsplash.com/photo-1498804103079-a6351b050096?auto=format&fit=crop&w=800&q=80"
									fill
									className="object-cover group-hover:scale-105 transition-transform duration-500"
									alt="Coffee & Code"
								/>
							)}
							{i === 3 && (
								<OptimizedImage
									src="https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?auto=format&fit=crop&w=800&q=80"
									fill
									className="object-cover group-hover:scale-105 transition-transform duration-500"
									alt="Sunset Yoga"
								/>
							)}
							<div className="absolute top-3 right-3">
								<Badge
									variant="secondary"
									className="bg-white/90 text-stone-800 backdrop-blur-sm"
								>
									{i === 1 ? "Sold Out" : "Open"}
								</Badge>
							</div>
						</div>

						<div className="px-2 pb-2">
							<p className="text-xs font-bold text-orange-500 uppercase tracking-wider mb-2">
								OCT {12 + i}
							</p>
							<h4 className="text-xl font-medium text-stone-900 mb-2">
								{i === 1
									? "Founders Mixer"
									: i === 2
										? "Coffee & Code"
										: "Sunset Yoga"}
							</h4>
							<p className="text-stone-500 text-sm line-clamp-2">
								Join us for an evening of connection and conversation with local
								creatives.
							</p>
						</div>
					</div>
				))}
			</div>
		</section>
	);
}

export function SocialitePast({ config }: { config: any }) {
	const { user } = useDashboardContext();
	const [pastEvents, setPastEvents] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);

	// Robust lookup
	let sectionConfig = config?.sectionSettings?.["pastEvents-1"];
	if (!sectionConfig && config?.sectionSettings) {
		const foundId = Object.keys(config.sectionSettings).find(
			(key) => config.sectionSettings[key]?.type === "pastEvents",
		);
		if (foundId) sectionConfig = config.sectionSettings[foundId];
	}
	const settings = sectionConfig || {};
	const title = settings.title || "Past Memories";

	useEffect(() => {
		const fetchPast = async () => {
			if (!user?.uid) return;
			try {
				const now = new Date();
				const q = query(
					collection(db, "events"),
					where("createdBy", "==", user.uid),
					where("endAt", "<", now),
					orderBy("endAt", "desc"),
					limit(5),
				);
				const snap = await getDocs(q);
				const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
				setPastEvents(data);
			} catch (e) {
				console.error(e);
			} finally {
				setLoading(false);
			}
		};
		fetchPast();
	}, [user?.uid]);

	const displayEvents = pastEvents.length > 0 ? pastEvents : [1, 2, 3, 4];

	return (
		<section className="py-20 bg-white border-t border-stone-100">
			<div className="max-w-7xl mx-auto px-6">
				<div className="flex items-center justify-between mb-10">
					<h3 className="text-lg font-bold text-stone-400 uppercase tracking-widest">
						{title}
					</h3>
				</div>

				<div className="flex gap-6 overflow-x-auto pb-8 snap-x scrollbar-hide">
					{displayEvents.map((item, i) => {
						const isMock = typeof item === "number";
						if (isMock) {
							return (
								<div
									key={i}
									className="min-w-[280px] snap-center group opacity-70 hover:opacity-100 transition-opacity cursor-default"
								>
									<div className="aspect-[4/5] rounded-lg overflow-hidden mb-4 relative">
										<OptimizedImage
											src={`https://images.unsplash.com/photo-${
												i === 1
													? "1514525253440-b393452e3383"
													: i === 2
														? "1491438590914-bc09fcaaf77a"
														: i === 3
															? "1519671482502-9759101d4574"
															: "1529333166437-7750a6dd5a70"
											}?auto=format&fit=crop&w=600&q=80`}
											fill
											className="object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
											alt="Past"
										/>
									</div>
									<h4 className="font-medium text-stone-900">
										Vol. 0{item} Recaps
									</h4>
								</div>
							);
						}

						// Real Data
						const evt = item;
						return (
							<div
								key={evt.id}
								className="min-w-[280px] snap-center group opacity-70 hover:opacity-100 transition-opacity cursor-default"
							>
								<div className="aspect-[4/5] rounded-lg overflow-hidden mb-4 relative bg-stone-100">
									{evt.coverImageURL && (
										<OptimizedImage
											src={evt.coverImageURL}
											fill
											className="object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
											alt={evt.title}
										/>
									)}
								</div>
								<h4 className="font-medium text-stone-900 truncate">
									{evt.title}
								</h4>
							</div>
						);
					})}
				</div>
			</div>
		</section>
	);
}

export function SocialiteFooter({ config }: { config: any }) {
	const heroSettings = config?.sectionSettings?.["soc-hero-1"] || {};
	const heroHeadline = heroSettings.headline || "The Sunday Collective";

	return (
		<footer className="py-12 bg-stone-100 text-stone-500 text-center">
			<div className="max-w-2xl mx-auto px-6 space-y-6">
				<h5 className="font-serif text-xl text-stone-800">{heroHeadline}</h5>
				<div className="flex justify-center gap-6">
					<span className="cursor-not-allowed hover:text-stone-800">
						Instagram
					</span>
					<span className="cursor-not-allowed hover:text-stone-800">
						Contact
					</span>
					<span className="cursor-not-allowed hover:text-stone-800">Terms</span>
				</div>
				<p className="text-xs pt-6 border-t border-stone-200">
					Powered by <span className="font-bold text-stone-600">Labeld</span>
				</p>
			</div>
		</footer>
	);
}

/* -------------------------------------------------------------------------- */
/*                            SOCIALITE TEMPLATE                              */
/* -------------------------------------------------------------------------- */
export function SocialiteTemplate({ config }: { config: any }) {
	return (
		<div className="min-h-screen bg-stone-50 text-stone-900 font-sans selection:bg-orange-200 selection:text-stone-900">
			<SocialiteHero config={config} />
			<SocialiteFeatured config={config} />
			<SocialiteUpcoming config={config} />
			<SocialitePast config={config} />
			<SocialiteFooter config={config} />
		</div>
	);
}

/* -------------------------------------------------------------------------- */
/*                              PREVIEW SHELL                                 */
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
/*                              PREVIEW SHELL                                 */
/* -------------------------------------------------------------------------- */
import { useEventSiteCustomization } from "@/hooks/useEventSiteCustomization";
import { VenueTemplate } from "./VenueTemplate";
// import { VenueTemplate } from "./VenueTemplate";

export default function TemplatePreviewPage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const templateId = searchParams.get("template");

	// Connect Hook
	const { isTemplateActive, activateTemplate, isSaving, isPro, config } =
		useEventSiteCustomization();

	const isActive = templateId ? isTemplateActive(templateId) : false;

	const getTemplateName = (id: string | null) => {
		if (id === "after-hours") return "After Hours";
		if (id === "socialite") return "Socialite";
		return "Event Site Template";
	};

	const handleActivate = async () => {
		if (!templateId) return;
		if (!isPro) {
			router.push("/pricing");
			return;
		}
		if (
			window.confirm(
				`Set "${getTemplateName(templateId)}" as your active template?`,
			)
		) {
			await activateTemplate(templateId);
		}
	};

	return (
		<div className="fixed inset-0 z-[100] flex flex-col bg-black overflow-hidden">
			{/* Top Bar */}
			<div className="flex-none h-14 md:h-16 flex items-center justify-between px-3 md:px-6 border-b border-white/10 bg-neutral-900/90 backdrop-blur-md z-50">
				{/* Left: Template Info */}
				<div className="flex items-center gap-2 md:gap-4">
					<h2 className="font-bold text-base md:text-lg text-white tracking-tight leading-tight">
						{getTemplateName(templateId)}
					</h2>
				</div>

				{/* Center: Badge */}
				<div className="absolute left-1/2 -translate-x-1/2 hidden lg:flex items-center gap-2">
					<span
						className={`px-3 py-1 border rounded-full text-xs font-mono ${
							isActive
								? "bg-green-500/10 border-green-500/20 text-green-400"
								: "bg-white/5 border-white/10 text-neutral-400"
						}`}
					>
						{isActive ? "CURRENTLY ACTIVE TEPLATE" : "PREVIEW MODE · READ-ONLY"}
					</span>
				</div>

				{/* Right: Actions */}
				<div className="flex items-center gap-2 md:gap-3">
					{!isActive && (
						<>
							{/* Desktop Button */}
							<div className="hidden md:block">
								<Button
									variant="primary"
									className="h-10 px-4 bg-events border-none font-normal"
									text={isPro ? "Set as Active Template" : "Upgrade to use"}
									isLoading={isSaving}
									onClick={handleActivate}
								/>
							</div>
							{/* Mobile Button */}
							<div className="md:hidden">
								<Button
									variant="primary"
									className="h-8 px-3 text-xs bg-events border-none font-medium"
									text={isPro ? "Activate" : "Upgrade"}
									isLoading={isSaving}
									onClick={handleActivate}
								/>
							</div>
						</>
					)}

					<div className="h-6 w-px bg-white/10 mx-0.5 md:mx-1" />

					<Button
						variant="outline"
						className="h-8 md:h-9 px-2 md:px-4 text-xs md:text-md hover:bg-neutral-200 border-none font-normal bg-transparent text-white hover:text-black"
						onClick={() => router.back()}
						text="Close"
						leftIcon={<X className="w-4 h-4 md:w-5 md:h-5 mr-1 md:mr-2" />}
					/>
				</div>
			</div>
			{/* Scrollable Content Area */}
			<div className="flex-1 overflow-y-auto min-h-0 relative bg-black">
				{templateId === "after-hours" ? (
					<AfterHoursTemplate config={config} />
				) : templateId === "socialite" ? (
					<SocialiteTemplate config={config} />
				) : templateId === "venue" ? (
					<VenueTemplate config={config} />
				) : (
					<div className="min-h-full flex flex-col items-center justify-center text-white space-y-4">
						<div className="w-16 h-16 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
						<p className="text-neutral-400">
							Loading template or template coming soon...
						</p>
						<Button
							variant="secondary"
							text="Go Back"
							onClick={() => router.back()}
							className="mt-4"
						/>
					</div>
				)}
			</div>
		</div>
	);
}
