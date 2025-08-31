export default function AndrioidApple() {
	return (
		<div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
	<button
		className="bg-cta hover:bg-cta/90 text-text font-normal px-8 py-2 rounded-xl text-lg transition-all duration-300 hover:shadow-glow group drop-shadow-lg"
		onClick={() =>
			window.open("https://apps.apple.com/ng/app/labeld/id6748664223", "_blank")
		}
	>
		<span className="flex items-center justify-center gap-3">
			<img
				src="/apple_logo.svg"
				alt="Apple logo"
				className="h-7 w-7 object-contain align-middle"
				style={{
					display: "inline-block",
					verticalAlign: "middle",
					filter: "invert(1)",
				}}
			/>
			<span className="flex flex-col items-start gap-0">
				<span
					className="text-xs font-medium text-gray-200 leading-none"
					style={{ fontFamily: "var(--font-manrope)" }}
				>
					Download on the
				</span>
				<span className="text-base font-bold font-heading text-white leading-tight">
					App Store
				</span>
				{/* <span className="flex items-center gap-2 mt-1">
										<span>Join iOS TestFlight</span>
										<ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
									</span> */}
			</span>
		</span>
	</button>

	<button
		className="bg-accent hover:bg-accent/90 text-bg font-heading font-medium px-8 py-3 rounded-xl text-lg transition-all duration-300 hover:shadow-glow group drop-shadow-lg"
		onClick={() => window.open("https://labeld.app/", "_blank")}
	>
		<span className="flex items-center justify-center gap-3">
			<img
				src="/android_logo_fill.svg"
				alt="Android logo"
				className="h-5 w-5 object-contain align-middle"
				style={{
					display: "inline-block",
					verticalAlign: "middle",
				}}
			/>
			<span className="flex items-center gap-2">
				<span>Join Android Beta</span>
				{/* <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" /> */}
			</span>
				</span>
			</button>
		</div>
	);
}
