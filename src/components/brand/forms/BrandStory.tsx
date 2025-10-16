"use client";

import { useBrandOnboard } from "@/lib/stores/brandOnboard";
import { useState } from "react";

export default function BrandStoryForm() {
	const { bio, tags, set } = useBrandOnboard();
	const [tagInput, setTagInput] = useState("");

	const addTag = () => {
		const t = tagInput.trim();
		if (!t) return;
		if (tags.includes(t)) return;
		if (tags.length >= 3) return;
		set("tags", [...tags, t]);
		setTagInput("");
	};

	const removeTag = (t: string) =>
		set(
			"tags",
			tags.filter((x) => x !== t)
		);

	return (
		<div>
			{/* <h3 className="font-heading font-semibold text-2xl">Tell Your Story</h3> */}
			<p className="text-text-muted mt-1">
				Sum up your brand’s vibe in one sentence.
			</p>
			<div className=" mt-5 rounded-2xl bg-surface border border-stroke p-6">
				<div className="">
					<label className="block text-sm text-text-muted mb-1">
						Bio / Tagline{" "}
						<span className="text-xs text-text-muted">(max 120)</span>
					</label>
					<textarea
						value={bio}
						maxLength={120}
						onChange={(e) => set("bio", e.target.value)}
						placeholder="Keep it short & punchy (1–2 lines is best)"
						className="w-full rounded-xl  border border-stroke px-4 py-3 text-text placeholder:text-text-muted focus:border-accent outline-none min-h-[100px]"
					/>
					<p className="text-xs text-text-muted mt-2">
						🧏‍♂️ Remember less is more
					</p>
				</div>

				<div className="mt-4">
					<label className="block text-sm text-text-muted mb-2">
						Brand Tags (up to 3)
					</label>
					<div className="flex gap-2">
						<input
							value={tagInput}
							onChange={(e) => setTagInput(e.target.value)}
							onKeyDown={(e) =>
								e.key === "Enter" && (e.preventDefault(), addTag())
							}
							placeholder="Add a tag and press Enter"
							className="flex-1 rounded-xl border border-stroke px-4 py-3 text-text placeholder:text-text-muted focus:border-accent outline-none"
						/>
						<button
							type="button"
							onClick={addTag}
							className="rounded-xl bg-accent text-bg px-4 py-3 font-semibold"
						>
							Add
						</button>
					</div>

					{!!tags.length && (
						<div className="flex flex-wrap gap-2 mt-3">
							{tags.map((t) => (
								<span
									key={t}
									className="inline-flex items-center gap-2 bg-surface border border-stroke px-3 py-1.5 rounded-full"
								>
									#{t}
									<button
										onClick={() => removeTag(t)}
										className="text-text-muted hover:text-text"
									>
										×
									</button>
								</span>
							))}
						</div>
					)}

					<p className="text-xs text-text-muted mt-3">
						Tags help people find and connect with your brand.
					</p>
				</div>
			</div>
		</div>
	);
}
