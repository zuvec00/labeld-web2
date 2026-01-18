import React from "react";
import { FooterSection } from "@/lib/models/site-customization";
import { Lock } from "lucide-react";

export default function PreviewFooter({ section }: { section: FooterSection }) {
	return (
		<footer className="relative w-full py-12 px-6 bg-black text-white group border-t border-stroke/20">
			{/* Required Badge (Light on Dark) */}
			<div className="absolute top-2 right-2 flex items-center gap-1.5 px-2 py-1 bg-white/10 border border-white/10 text-white/50 text-[10px] font-medium rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
				<Lock className="w-3 h-3" />
				<span>Required Section</span>
			</div>

			<div className="max-w-4xl mx-auto flex flex-col md:flex-row justify-between gap-10">
				{/* Brand Column */}
				<div className="space-y-3">
					<h4 className="font-heading text-lg font-bold tracking-tight">
						BRAND
					</h4>
					<p className="text-white/40 text-xs max-w-[200px] leading-relaxed">
						&copy; 2024 Brand Name. All rights reserved. <br />
						Built with Labeld.
					</p>
				</div>

				{/* Links Columns */}
				<div className="flex gap-12 md:gap-16">
					<div className="space-y-3">
						<h5 className="font-bold text-[10px] uppercase tracking-widest text-white/40">
							Shop
						</h5>
						<ul className="space-y-2 text-xs text-white/70">
							<li className="hover:text-white transition-colors cursor-default">
								New Arrivals
							</li>
							<li className="hover:text-white transition-colors cursor-default">
								Collections
							</li>
							<li className="hover:text-white transition-colors cursor-default">
								Accessories
							</li>
						</ul>
					</div>

					{section.showContactInfo && (
						<div className="space-y-3">
							<h5 className="font-bold text-[10px] uppercase tracking-widest text-white/40">
								Support
							</h5>
							<ul className="space-y-2 text-xs text-white/70">
								<li className="hover:text-white transition-colors cursor-default">
									Contact Us
								</li>
								<li className="hover:text-white transition-colors cursor-default">
									Shipping
								</li>
								<li className="hover:text-white transition-colors cursor-default">
									Returns
								</li>
							</ul>
						</div>
					)}

					{section.showSocialLinks && (
						<div className="space-y-3">
							<h5 className="font-bold text-[10px] uppercase tracking-widest text-white/40">
								Social
							</h5>
							<ul className="space-y-2 text-xs text-white/70">
								<li className="hover:text-white transition-colors cursor-default">
									Instagram
								</li>
								<li className="hover:text-white transition-colors cursor-default">
									Twitter
								</li>
								<li className="hover:text-white transition-colors cursor-default">
									TikTok
								</li>
							</ul>
						</div>
					)}
				</div>
			</div>
		</footer>
	);
}
