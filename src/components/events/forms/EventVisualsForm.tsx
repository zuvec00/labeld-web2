"use client";

import { useEventOrganizerOnboard } from "@/lib/stores/eventOrganizerStore";
import UploadImage from "@/components/ui/upload-image";

export default function EventVisualsForm() {
	const { data, setData } = useEventOrganizerOnboard();

	return (
		<div className="rounded-2xl bg-surface border border-stroke p-6">
			{/* Profile Image / Logo (required) */}
			<div className="">
				<label className="block text-sm text-text-muted mb-1">
					Organizer Logo <span className="text-cta">*</span>
				</label>
				<UploadImage
					value={data.profileFile}
					onChange={(file) => setData({ profileFile: file })}
					text="Upload a clean logo or image that reps your brand"
				/>
			</div>

			{/* Cover Image / Banner (optional) */}
			<div className="mt-4">
				<label className="block text-sm text-text-muted mb-1">
					Cover Image{" "}
					<span className="text-xs text-text-muted">(optional)</span>
				</label>
				<UploadImage
					backgroundColor="var(--color-calm-1)"
					value={data.coverFile}
					onChange={(file) => setData({ coverFile: file })}
					text="Set the vibe (trust me, you want to add this)"
				/>
			</div>

			<hr className="my-6 border-stroke" />

			{/* Bio */}
			<div className="">
				<label className="block text-sm text-text-muted mb-1">
					Bio / About{" "}
					<span className="text-xs text-text-muted">(optional)</span>
				</label>
				<textarea
					value={data.bio}
					onChange={(e) => setData({ bio: e.target.value })}
					placeholder="Short description of what kind of events you host (e.g. streetwear pop-ups, fashion raves, underground art shows)"
					rows={4}
					className="w-full rounded-xl border border-stroke px-4 py-3 text-text placeholder:text-text-muted focus:border-accent outline-none resize-none"
				/>
			</div>
		</div>
	);
}
