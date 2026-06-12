import { WaitlistSection } from "@/lib/models/site-customization";

export default function PreviewWaitlist({ section }: { section: WaitlistSection }) {
	const title = section.title || "Join the Waitlist";
	const subtitle = section.subtitle || "Be the first to know when we go live.";
	const ctaText = section.ctaText || "Notify Me";

	return (
		<section className="relative flex min-h-[420px] items-center justify-center overflow-hidden border-y border-white/10 bg-black px-5 py-16 text-white">
			{section.imageUrl && (
				<div
					className="absolute inset-0 bg-cover bg-center"
					style={{ backgroundImage: `url(${section.imageUrl})` }}
				/>
			)}
			<div className="absolute inset-0 bg-black/60" />
			<div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/35" />

			<div className="relative mx-auto flex w-full max-w-xl flex-col items-center text-center">
				<h3 className="font-unbounded text-[42px] font-black uppercase leading-[0.92] tracking-normal text-white sm:text-[64px]">
					{title}
				</h3>
				<p className="mx-auto mt-6 max-w-md text-sm leading-6 text-white/70 sm:text-base">
					{subtitle}
				</p>
				<div className="mt-9 flex w-full max-w-md flex-col gap-4">
					<div className="h-14 border border-white/15 bg-black/45 px-5 text-center text-sm leading-[3.5rem] text-white/35 backdrop-blur-sm">
						Enter your email
					</div>
					<button className="h-14 bg-black px-5 text-xs font-semibold uppercase tracking-[0.18em] text-white transition">
						{ctaText || "Notify Me"}
					</button>
				</div>
			</div>
		</section>
	);
}
