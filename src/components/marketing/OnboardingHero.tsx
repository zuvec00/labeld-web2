"use client";

import AuthForm from "@/app/marketing/auth/AuthFom";
import Image from "next/image";
import { useState } from "react";
// import AuthForm from "./auth/AuthForm";

export default function OnboardingSplit() {
	const [mode, setMode] = useState<"login" | "signup">("login");

	return (
		<div className="min-h-dvh bg-bg text-text grid grid-cols-1 lg:grid-cols-2">
			{/* LEFT: Hero */}
			<section className="relative order-1 lg:order-none m-8 lg:col-span-1">
				<Image
					src="/images/onboarding-hero.jpeg"
					alt="Creators showcasing a label drop"
					fill
					priority
					className="object-cover rounded-[20px]"
				/>
				{/* overlay for contrast */}
				<div className="absolute inset-0 bg-gradient-to-t from-bg/85 via-bg/40 to-transparent" />

				<div className="absolute inset-0 flex items-end">
					<div className="w-full px-6 sm:px-10 pb-12 max-w-xl">
						<h1 className="font-heading font-semibold text-4xl sm:text-5xl xl:text-[40px] leading-tight tracking-tight">
							<span className="block  ">This is Where</span>
							<span className="block text-accent">Culture Drops</span>
						</h1>
						<p className="mt-4 text-base sm:text-lg text-text-muted max-w-md">
							From statement fits to bold ideas.
						</p>
						<p className=" text-base sm:text-lg text-text-muted max-w-md">
							Labeld is where culture connects and comes alive.
						</p>
					</div>
				</div>
			</section>

			{/* RIGHT: Auth */}
			<section className="flex justify-center m-8 py-16 lg:py-0 px-4 sm:px-8 bg-bg ">
				<div className="w-full max-w-md">
					<AuthForm mode={mode} onModeChange={setMode} />
				</div>
			</section>
		</div>
	);
}
