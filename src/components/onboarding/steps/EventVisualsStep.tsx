"use client";

import { useEventOrganizerOnboard } from "@/lib/stores/eventOrganizerStore";
import { ArrowRight, Image as ImageIcon, Upload } from "lucide-react";
import Image from "next/image";
import { useRef } from "react";

interface EventVisualsStepProps {
	onNext: () => void;
	onBack: () => void;
}

export default function EventVisualsStep({
	onNext,
	onBack,
}: EventVisualsStepProps) {
	const { data, setData } = useEventOrganizerOnboard();
	const { profileFile, coverFile } = data; // Note: store uses profileFile for logo/avatar

	const logoInputRef = useRef<HTMLInputElement>(null);
	const coverInputRef = useRef<HTMLInputElement>(null);

	const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files && e.target.files[0]) {
			setData({ profileFile: e.target.files[0] });
		}
	};

	const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files && e.target.files[0]) {
			setData({ coverFile: e.target.files[0] });
		}
	};

	return (
		<div className="flex flex-col h-full animate-in fade-in slide-in-from-right-8 duration-500">
			<div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
				<h2 className="text-3xl font-heading font-bold mb-2">
					Visual Identity
				</h2>
				<p className="text-text-muted mb-8">
					Upload your organizer logo and cover image.
				</p>

				<div className="space-y-8">
					{/* Logo/Avatar Upload */}
					<div className="space-y-3">
						<label className="text-sm font-medium text-text-muted uppercase tracking-wider">
							Organizer Logo
						</label>
						<div
							onClick={() => logoInputRef.current?.click()}
							className="relative w-32 h-32 rounded-full border-2 border-dashed border-stroke hover:border-accent cursor-pointer transition-colors flex items-center justify-center overflow-hidden bg-surface group"
						>
							{profileFile ? (
								<Image
									src={URL.createObjectURL(profileFile)}
									alt="Logo Preview"
									fill
									className="object-cover"
								/>
							) : (
								<div className="flex flex-col items-center gap-2 text-text-muted group-hover:text-accent transition-colors">
									<ImageIcon className="w-8 h-8" />
									<span className="text-xs font-medium">Upload</span>
								</div>
							)}
							<input
								ref={logoInputRef}
								type="file"
								accept="image/*"
								onChange={handleLogoChange}
								className="hidden"
							/>
						</div>
					</div>

					{/* Cover Upload */}
					<div className="space-y-3">
						<label className="text-sm font-medium text-text-muted uppercase tracking-wider">
							Cover Image
						</label>
						<div
							onClick={() => coverInputRef.current?.click()}
							className="relative w-full aspect-[3/1] rounded-xl border-2 border-dashed border-stroke hover:border-accent cursor-pointer transition-colors flex items-center justify-center overflow-hidden bg-surface group"
						>
							{coverFile ? (
								<Image
									src={URL.createObjectURL(coverFile)}
									alt="Cover Preview"
									fill
									className="object-cover"
								/>
							) : (
								<div className="flex flex-col items-center gap-2 text-text-muted group-hover:text-accent transition-colors">
									<Upload className="w-8 h-8" />
									<span className="text-xs font-medium">Upload Cover</span>
								</div>
							)}
							<input
								ref={coverInputRef}
								type="file"
								accept="image/*"
								onChange={handleCoverChange}
								className="hidden"
							/>
						</div>
					</div>
				</div>
			</div>

			<div className="pt-8 flex items-center justify-between">
				<button
					onClick={onBack}
					className="text-text-muted hover:text-text transition-colors px-4 py-2"
				>
					Back
				</button>
				<button
					onClick={onNext}
					className="group bg-cta text-white px-8 py-3 rounded-full font-semibold transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
				>
					Next Step
					<ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
				</button>
			</div>
		</div>
	);
}
