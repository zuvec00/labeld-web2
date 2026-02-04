import React from "react";
import {
	MapPin,
	Clock,
	Phone,
	Instagram,
	ArrowRight,
	ChevronDown,
	CalendarDays,
	Users,
	Sparkles,
	ChefHat,
	Wine,
	Menu as MenuIcon,
} from "lucide-react";

export function VenueTemplate({ config }: { config: any }) {
	const heroSettings = config?.sectionSettings?.["venue-hero-1"] || {};
	const heroHeadline = heroSettings.headline || "ORGANIZER NAME";
	const heroSubheadline =
		heroSettings.subheadline || "Dinner · Lounge · Late Nights";
	const heroImage =
		heroSettings.imageUrl ||
		"https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?q=80&w=2670&auto=format&fit=crop";
	const primaryCta = heroSettings.primaryCta?.label || "View Packages";
	const secondaryCta = heroSettings.secondaryCta?.label || "Menu";

	const identitySettings = config?.sectionSettings?.["venue-identity-1"] || {};
	const aboutDescription =
		identitySettings.description ||
		"A rooftop sanctuary blending fine dining with late-night energy. Where culinary artistry meets the city's pulse.";
	const pullQuote = identitySettings.pullQuote || "";

	const venueInfoSettings = config?.sectionSettings?.["venue-location-1"] || {}; // Access for header if needed, but header usually just links

	return (
		<div className="w-full bg-[#0F0F0F] text-[#E0E0E0] font-sans min-h-screen selection:bg-orange-500/30 selection:text-orange-50 scroll-smooth">
			{/* 0. HEADER (Sticky & Editorial) */}
			<header className="sticky top-0 z-[60] bg-[#0F0F0F]/90 backdrop-blur-xl border-none border-white/5 h-20 px-6 md:px-12 flex items-center justify-between transition-all duration-300">
				{/* Logo */}
				<div className="font-heading font-black text-2xl tracking-tighter text-white uppercase cursor-pointer hover:text-neutral-200 transition-colors">
					{heroHeadline}
				</div>

				{/* Desktop Nav */}
				<nav className="hidden md:flex items-center gap-10 text-xs font-bold uppercase tracking-[0.2em] text-neutral-400">
					<a
						href="#"
						className="hover:text-white transition-colors duration-300"
					>
						Menu
					</a>
					<a
						href="#"
						className="hover:text-white transition-colors duration-300"
					>
						Experiences
					</a>
					<a
						href="#"
						className="hover:text-white transition-colors duration-300"
					>
						Location
					</a>
				</nav>

				{/* Primary Action */}
				<div className="flex items-center gap-4">
					<button className="hidden md:block px-8 py-3 bg-white text-black text-xs !font-sans font-bold uppercase tracking-widest hover:bg-neutral-200 transition-colors transform hover:scale-[1.02] active:scale-95 duration-200">
						Reserve
					</button>
					<button className="md:hidden text-white p-2">
						<MenuIcon className="w-6 h-6" />
					</button>
				</div>
			</header>

			{/* 1. HERO SECTION (Confidence & Restraint) */}
			<section className="relative px-4 pt-4 md:px-8 md:pt-8 pb-0">
				<div className="relative h-[85vh] min-h-[600px] flex items-center justify-center overflow-hidden">
					{/* Background */}
					<div className="absolute inset-0 z-0 select-none">
						<img
							src={heroImage}
							alt="Venue Ambiance"
							className="w-full h-full object-cover opacity-60 scale-105 animate-slow-zoom"
						/>
						<div className="absolute inset-0 bg-gradient-to-t from-[#0F0F0F] via-transparent to-black/40"></div>
						<div className="absolute inset-0 bg-[#0F0F0F]/20 mix-blend-multiply"></div>
					</div>

					{/* Hero Content */}
					<div className="relative z-10 text-center max-w-5xl px-6 flex flex-col items-center gap-8 animate-in slide-in-from-bottom-10 fade-in duration-1000">
						<h1 className="text-5xl md:text-8xl font-heading font-black tracking-tighter text-white uppercase leading-[0.85] shadow-xl">
							{heroHeadline}
						</h1>
						<p className="text-sm md:text-base text-neutral-200 font-bold tracking-[0.3em] uppercase border-y border-white/20 py-3 px-8 backdrop-blur-sm">
							{heroSubheadline}
						</p>

						<div className="flex flex-col sm:flex-row gap-6 pt-8 w-full justify-center">
							<button className="px-10 py-5 bg-white text-black !font-sans font-bold uppercase tracking-widest hover:bg-neutral-200 transition-all transform hover:-translate-y-1 shadow-[0_0_20px_rgba(255,255,255,0.2)] min-w-[220px]">
								{primaryCta}
							</button>
							<button className="px-10 py-5 bg-transparent border !font-sans  border-white/30 text-white font-bold uppercase tracking-widest hover:bg-white/10 hover:border-white transition-all min-w-[220px]">
								{secondaryCta}
							</button>
						</div>
					</div>
				</div>
			</section>

			{/* 2. RESERVATION STRIP (The Labeld Differentiator) - KEEP AS IS OR HIDE IF NOT NEEDED? Left commented out as in previous file */}

			{/* 3. EXPERIENCES (Tickets as Moments) */}
			<section className="py-20 px-6 max-w-[1400px] mx-auto">
				{/* Editorial Intro */}
				<div className="max-w-2xl mb-24 border-l-2 border-[#E54D2E] pl-8 py-2">
					<h3 className="text-xl md:text-2xl font-serif text-neutral-300 leading-relaxed italic">
						"{aboutDescription}"
					</h3>
					{pullQuote && (
						<p className="text-sm text-neutral-500 mt-4 uppercase tracking-widest font-bold">
							— {pullQuote}
						</p>
					)}
				</div>

				<div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-8 border-b border-white/10 pb-8">
					<h2 className="text-4xl md:text-6xl font-heading font-black text-white uppercase tracking-tighter">
						{config?.sectionSettings?.["venue-nights-1"]?.title ||
							"Curated Nights"}
					</h2>
					<button className="text-xs font-bold !font-sans uppercase tracking-widest text-neutral-500 hover:text-white transition-colors flex items-center gap-2 group">
						View Calendar{" "}
						<ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
					</button>
				</div>

				<div className="grid md:grid-cols-3 gap-1">
					{/* Card 1 */}
					<div className="group relative aspect-[3/4] overflow-hidden cursor-pointer bg-neutral-900">
						<img
							src="https://images.unsplash.com/photo-1543007630-9710e4a00a20"
							className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 grayscale-[20%] group-hover:grayscale-0"
						/>
						<div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80"></div>
						<div className="absolute top-6 right-6 bg-white text-black px-3 py-1 text-[10px] font-bold uppercase tracking-widest">
							Every Friday
						</div>
						<div className="absolute bottom-0 left-0 p-8 w-full group-hover:-translate-y-2 transition-transform duration-500">
							<div className="text-[#E54D2E] text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
								<Sparkles className="w-3 h-3" /> Lounge Series
							</div>
							<h3 className="text-3xl font-heading font-bold text-white mb-2 uppercase leading-none">
								After Hours
							</h3>
							<p className="text-neutral-400 text-sm mb-6 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100 transform translate-y-2 group-hover:translate-y-0">
								Deep house sessions and signature cocktails until 3AM.
							</p>
							<div className="h-px w-full bg-white/20 group-hover:bg-[#E54D2E] transition-colors duration-500"></div>
						</div>
					</div>

					{/* Card 2 */}
					<div className="group relative aspect-[3/4] overflow-hidden cursor-pointer bg-neutral-900">
						<img
							src="https://images.unsplash.com/photo-1559339352-11d035aa65de"
							className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 grayscale-[20%] group-hover:grayscale-0"
						/>
						<div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80"></div>
						<div className="absolute top-6 right-6 bg-transparent border border-white/30 text-white px-3 py-1 text-[10px] font-bold uppercase tracking-widest">
							Nov 24
						</div>
						<div className="absolute bottom-0 left-0 p-8 w-full group-hover:-translate-y-2 transition-transform duration-500">
							<div className="text-purple-400 text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
								<ChefHat className="w-3 h-3" /> Tasting Menu
							</div>
							<h3 className="text-3xl font-heading font-bold text-white mb-2 uppercase leading-none">
								Chef's Table
							</h3>
							<p className="text-neutral-400 text-sm mb-6 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100 transform translate-y-2 group-hover:translate-y-0">
								An intimate 7-course journey through local flavors.
							</p>
							<div className="h-px w-full bg-white/20 group-hover:bg-purple-500 transition-colors duration-500"></div>
						</div>
					</div>

					{/* Card 3 */}
					<div className="group relative aspect-[3/4] overflow-hidden cursor-pointer bg-neutral-900">
						<img
							src="https://images.unsplash.com/photo-1510915361894-db8b60106cb1"
							className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 grayscale-[20%] group-hover:grayscale-0"
						/>
						<div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80"></div>
						<div className="absolute top-6 right-6 bg-transparent border border-white/30 text-white px-3 py-1 text-[10px] font-bold uppercase tracking-widest">
							Sundays
						</div>
						<div className="absolute bottom-0 left-0 p-8 w-full group-hover:-translate-y-2 transition-transform duration-500">
							<div className="text-emerald-400 text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
								<Wine className="w-3 h-3" /> Social
							</div>
							<h3 className="text-3xl font-heading font-bold text-white mb-2 uppercase leading-none">
								Jazz & Vines
							</h3>
							<p className="text-neutral-400 text-sm mb-6 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100 transform translate-y-2 group-hover:translate-y-0">
								Live smooth jazz accompanied by our sommelier's selection.
							</p>
							<div className="h-px w-full bg-white/20 group-hover:bg-emerald-500 transition-colors duration-500"></div>
						</div>
					</div>
				</div>
			</section>

			{/* 4. ATMOSPHERE (Pure Vibe) */}
			<section className="py-12 bg-[#0A0A0A] border-y border-white/5">
				{(() => {
					const gallerySettings =
						config?.sectionSettings?.["venue-gallery-1"] || {};
					const images = gallerySettings.images || [
						"https://images.unsplash.com/photo-1572116469696-31de0f17cc34",
						"https://images.unsplash.com/photo-1550966871-3ed3c47e2ce2",
						"https://images.unsplash.com/photo-1566417713940-fe7c737a9ef2",
						"https://images.unsplash.com/photo-1517248135467-4c7edcad34c4",
					];

					return (
						<div className="grid grid-cols-2 md:grid-cols-4 w-full">
							{images.map((img: string, i: number) => (
								<div
									key={i}
									className="relative group overflow-hidden border-r border-white/5 aspect-[3/4] md:aspect-auto md:h-[500px]"
								>
									<img
										src={img}
										className="w-full h-full object-cover transition-all duration-700 opacity-60 group-hover:opacity-100 hover:scale-105"
										alt={`Atmosphere ${i + 1}`}
									/>
								</div>
							))}
						</div>
					);
				})()}
			</section>

			{/* 5. MENU PREVIEW (Teaser/Files) */}
			<section className="py-32 px-6 bg-[#0F0F0F]">
				{(() => {
					const menuSettings = config?.sectionSettings?.["venue-menu-1"] || {};
					const menuTitle = menuSettings.title || "Seasonal Highlights";

					// Prefer user items, else mock fallback
					const hasUserItems =
						menuSettings.items && menuSettings.items.length > 0;
					const menuItems = hasUserItems
						? menuSettings.items
						: [
								{ label: "Dinner Menu", url: "#", fileType: "pdf" },
								{ label: "Cocktails & Spirits", url: "#", fileType: "pdf" },
								{ label: "Dessert Collection", url: "#", fileType: "image" },
							];

					return (
						<div className="max-w-3xl mx-auto text-center">
							<span className="text-[#E54D2E] text-xs font-bold uppercase tracking-[0.3em] mb-6 block">
								Taste
							</span>
							<h2 className="text-4xl md:text-5xl font-heading font-black text-white uppercase tracking-tighter mb-16">
								{menuTitle}
							</h2>

							<div className="grid gap-4 max-w-2xl mx-auto text-left">
								{menuItems.map((item: any, i: number) => (
									<a
										key={i}
										href={item.url}
										target="_blank"
										rel="noreferrer"
										className="group flex items-center justify-between p-6 border-b border-white/10 hover:border-[#E54D2E] transition-all cursor-pointer"
									>
										<div className="flex items-center gap-4">
											{/* Icon Placeholder */}
											<div className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 text-neutral-400 group-hover:bg-[#E54D2E] group-hover:text-white transition-colors">
												{item.fileType === "pdf" ? (
													<svg
														className="w-5 h-5"
														fill="none"
														viewBox="0 0 24 24"
														stroke="currentColor"
													>
														<path
															strokeLinecap="round"
															strokeLinejoin="round"
															strokeWidth={2}
															d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
														/>
													</svg>
												) : (
													<svg
														className="w-5 h-5"
														fill="none"
														viewBox="0 0 24 24"
														stroke="currentColor"
													>
														<path
															strokeLinecap="round"
															strokeLinejoin="round"
															strokeWidth={2}
															d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
														/>
													</svg>
												)}
											</div>
											<div>
												<h4 className="text-lg md:text-xl font-bold text-white group-hover:text-[#E54D2E] transition-colors uppercase tracking-wider">
													{item.label}
												</h4>
												<p className="text-xs text-neutral-500 font-mono uppercase tracking-widest mt-1">
													{item.fileType?.toUpperCase() || "FILE"}
												</p>
											</div>
										</div>

										<div className="opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
											<span className="text-xs font-bold uppercase tracking-widest text-[#E54D2E] flex items-center gap-2">
												View <ArrowRight className="w-4 h-4" />
											</span>
										</div>
									</a>
								))}
							</div>

							{!hasUserItems && (
								<p className="mt-12 text-neutral-600 text-xs uppercase tracking-widest">
									Upload your menus to replace this preview
								</p>
							)}
						</div>
					);
				})()}
			</section>

			{/* 6. LOCATION & HOURS (Compressed) */}
			<section className="py-24 bg-[#0A0A0A] border-t border-white/5">
				<div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
					<div className="space-y-12">
						<div>
							<h3 className="text-xs font-bold text-neutral-500 uppercase tracking-[0.2em] mb-6">
								Location
							</h3>
							<p className="text-3xl font-heading font-medium text-white mb-2">
								{venueInfoSettings.address || "16 Akin Adesola St"}
							</p>
							<p className="text-xl text-neutral-400 font-light">
								Victoria Island, Lagos
							</p>
							<div className="mt-8">
								<a
									href={venueInfoSettings.mapLink || "#"}
									target="_blank"
									rel="noreferrer"
									className="text-xs font-bold uppercase tracking-widest text-[#E54D2E] hover:text-white transition-colors flex items-center gap-2"
								>
									<MapPin className="w-4 h-4" /> Get Directions
								</a>
							</div>
						</div>

						<div>
							<h3 className="text-xs font-bold text-neutral-500 uppercase tracking-[0.2em] mb-6">
								Hours
							</h3>
							<div className="space-y-3 text-neutral-300 font-mono text-sm tracking-wide whitespace-pre-line">
								{venueInfoSettings.operatingHours || (
									<>
										<div className="flex justify-between max-w-xs border-b border-white/5 pb-2">
											<span className="text-neutral-500">Tue - Thu</span>
											<span>16:00 - 23:00</span>
										</div>
										<div className="flex justify-between max-w-xs border-b border-white/5 pb-2 text-white font-bold">
											<span className="text-neutral-500">Fri - Sat</span>
											<span>14:00 - 02:00</span>
										</div>
										<div className="flex justify-between max-w-xs">
											<span className="text-neutral-500">Sunday</span>
											<span>12:00 - 22:00</span>
										</div>
									</>
								)}
							</div>
						</div>
					</div>

					{venueInfoSettings.showMap !== false && (
						<div className="h-[400px] w-full bg-neutral-900 overflow-hidden grayscale invert filter contrast-125 rounded-sm relative group">
							{/* Mock Map */}
							<div className="absolute inset-0 bg-[url('https://api.mapbox.com/styles/v1/mapbox/dark-v10/static/3.424,6.431,14,0/800x600?access_token=pk.eyJ1IjoibGFiZWxkIiwiYSI6ImNrbjV4b3Z5bTAwMmwydnA3b3V6b3Z5In0.1')] bg-cover bg-center opacity-50 group-hover:opacity-80 transition-opacity"></div>
							<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
								<div className="relative">
									<div className="w-4 h-4 bg-[#E54D2E] rounded-full animate-ping absolute inset-0"></div>
									<div className="w-4 h-4 bg-[#E54D2E] rounded-full border-2 border-black relative z-10"></div>
								</div>
							</div>
						</div>
					)}
				</div>
			</section>

			{/* 7. FOOTER */}
			<footer className="py-16 bg-black border-t border-white/10 text-center">
				<div className="flex justify-center gap-10 mb-10">
					{config?.sectionSettings?.["venue-footer-1"]?.showSocialLinks !==
						false && (
						<>
							<a
								href="#"
								className="text-neutral-500 hover:text-white transition-colors"
							>
								<Instagram className="w-5 h-5" />
							</a>
							<a
								href="#"
								className="text-neutral-500 hover:text-white transition-colors"
							>
								<Phone className="w-5 h-5" />
							</a>
							<a
								href="#"
								className="text-neutral-500 hover:text-white transition-colors"
							>
								<Clock className="w-5 h-5" />
							</a>
						</>
					)}
				</div>
				<div className="flex justify-center gap-8 text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-600 mb-12">
					<a href="#" className="hover:text-neutral-400">
						Press
					</a>
					<a href="#" className="hover:text-neutral-400">
						Careers
					</a>
					<a href="#" className="hover:text-neutral-400">
						Terms
					</a>
					<a href="#" className="hover:text-neutral-400">
						Privacy
					</a>
				</div>
				<p className="text-[10px] font-bold text-neutral-800 uppercase tracking-widest">
					<span className="block mb-2 text-neutral-500">
						{config?.sectionSettings?.["venue-footer-1"]?.disclaimerText || ""}
					</span>
					Powered by <span className="text-neutral-700">Labeld</span>
				</p>
			</footer>
		</div>
	);
}
