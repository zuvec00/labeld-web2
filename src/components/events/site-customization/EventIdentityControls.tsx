"use client";

import React, { useState, useEffect, useRef } from "react";
// Reuse the generic ColorTokenControl from brand components
import ColorTokenControl from "@/components/brand/site-customization/ColorTokenControl";
import Button from "@/components/ui/button";
import { EventOrganizerIdentity } from "@/lib/models/eventSite";
import { useDashboardContext } from "@/hooks/useDashboardContext";
import {
	UserCircle,
	UploadCloud,
	Image as ImageIcon,
	Loader2,
	X,
	Globe,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { uploadBrandImageWeb } from "@/lib/storage/upload";
import { useToast } from "@/app/hooks/use-toast";

interface EventIdentityControlsProps {
	isPro: boolean;
	initialIdentity?: EventOrganizerIdentity;
	userProfileLogo?: string | null;
	onUpdate: (identity: EventOrganizerIdentity) => void;
	onLockedAction: () => void;
	isSaving?: boolean;
	themeModeLocked?: boolean;
	defaultThemeMode?: "light" | "dark";
}

export default function EventIdentityControls({
	isPro,
	initialIdentity,
	userProfileLogo,
	onUpdate,
	onLockedAction,
	isSaving = false,
	themeModeLocked = false,
	defaultThemeMode,
}: EventIdentityControlsProps) {
	const router = useRouter();
	const { user } = useDashboardContext();
	const { toast } = useToast();
	const [identity, setIdentity] = useState<EventOrganizerIdentity>(
		initialIdentity || {
			primaryColor: "#000000",
			themeMode: defaultThemeMode || "light",
		},
	);

	const [uploadingLogo, setUploadingLogo] = useState(false);
	const [uploadingFavicon, setUploadingFavicon] = useState(false);

	const logoInputRef = useRef<HTMLInputElement>(null);
	const faviconInputRef = useRef<HTMLInputElement>(null);

	// Sync with prop when fetched
	useEffect(() => {
		if (initialIdentity) {
			setIdentity((prev) => ({
				...prev,
				...initialIdentity,
			}));
		}
	}, [initialIdentity]);

	// Force default theme if locked
	useEffect(() => {
		if (
			themeModeLocked &&
			defaultThemeMode &&
			identity.themeMode !== defaultThemeMode
		) {
			handleChange("themeMode", defaultThemeMode);
		}
	}, [themeModeLocked, defaultThemeMode, identity.themeMode]);

	const handleChange = (key: keyof EventOrganizerIdentity, value: any) => {
		const newIdentity = { ...identity, [key]: value };
		setIdentity(newIdentity);
	};

	const handleUseProfileLogo = () => {
		if (!userProfileLogo) return;
		handleChange("logoUrl", userProfileLogo);
		toast({
			title: "Logo Updated",
			description: "Using your profile logo.",
		});
	};

	const handleFileUpload = async (
		e: React.ChangeEvent<HTMLInputElement>,
		type: "logo" | "favicon",
	) => {
		const file = e.target.files?.[0];
		if (!file || !user?.uid) return;

		if (file.size > 2 * 1024 * 1024) {
			toast({
				title: "File too large",
				description: "Max size is 2MB",
				variant: "destructive",
			});
			return;
		}

		try {
			if (type === "logo") setUploadingLogo(true);
			else setUploadingFavicon(true);

			// Reuse the generic brand upload function as it handles user-scoped storage path
			const options = type === "favicon" ? { format: "ico" } : undefined;
			const url = await uploadBrandImageWeb(file, user.uid, options);

			if (type === "logo") {
				handleChange("logoUrl", url);
			} else {
				handleChange("faviconUrl", url);
			}

			toast({ title: "Upload Complete" });
		} catch (error) {
			console.error("Upload failed", error);
			toast({ title: "Upload Failed", variant: "destructive" });
		} finally {
			if (type === "logo") setUploadingLogo(false);
			else setUploadingFavicon(false);

			// Reset input
			if (e.target) e.target.value = "";
		}
	};

	return (
		<div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h2 className="font-heading font-semibold text-lg text-text mb-1">
						Visual Identity
					</h2>
					<p className="text-text-muted text-sm">
						Customize the look and feel of your event site.
					</p>
				</div>
			</div>

			{/* Section 1: Theme Mode */}
			<div className="space-y-4">
				<div className="flex items-center justify-between">
					<h3 className="text-xs font-bold uppercase tracking-wider text-text-muted/60 flex items-center gap-2">
						Theme Mode
					</h3>
					{themeModeLocked && (
						<span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 flex items-center gap-1">
							Locked by Template
						</span>
					)}
				</div>
				<div className="grid grid-cols-2 gap-4">
					<button
						onClick={() =>
							!themeModeLocked && handleChange("themeMode", "light")
						}
						disabled={themeModeLocked}
						className={`relative flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all ${
							identity.themeMode === "light"
								? "border-text bg-surface"
								: "border-stroke bg-surface/50"
						} ${!themeModeLocked ? "hover:border-text/30" : "opacity-50 cursor-not-allowed grayscale"}`}
					>
						<div className="w-10 h-10 rounded-full bg-white border border-stroke shadow-sm flex items-center justify-center">
							<div className="w-5 h-5 rounded-full bg-amber-400" />
						</div>
						<div className="text-center">
							<span className="block font-medium text-sm text-text">Light</span>
						</div>
					</button>

					<button
						onClick={() =>
							!themeModeLocked && handleChange("themeMode", "dark")
						}
						disabled={themeModeLocked}
						className={`relative flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all ${
							identity.themeMode === "dark"
								? "border-text bg-surface"
								: "border-stroke bg-surface/50"
						} ${!themeModeLocked ? "hover:border-text/30" : "opacity-50 cursor-not-allowed grayscale"}`}
					>
						<div className="w-10 h-10 rounded-full bg-black border border-stroke shadow-sm flex items-center justify-center">
							<div className="w-5 h-5 rounded-full bg-slate-700" />
						</div>
						<div className="text-center">
							<span className="block font-medium text-sm text-text">Dark</span>
						</div>
					</button>
				</div>
			</div>

			<hr className="border-stroke/50" />

			{/* Section 2: Color Tokens */}
			<div className="space-y-4">
				<h3 className="text-xs font-bold uppercase tracking-wider text-text-muted/60 flex items-center gap-2">
					Brand Color
				</h3>
				<ColorTokenControl
					label="Primary Accent"
					description="Used for buttons, links, and key highlights."
					value={identity.primaryColor || "#000000"}
					onChange={(val) => handleChange("primaryColor", val)}
					isPro={isPro}
					onLockedClick={onLockedAction}
					isRequired
				/>
			</div>

			<hr className="border-stroke/50" />

			{/* Section 3: Logo & Assets */}
			<div className="space-y-6">
				<div className="flex justify-between">
					<h3 className="text-xs font-bold uppercase tracking-wider text-text-muted/60">
						Logo & Assets
					</h3>
				</div>

				<div className="grid grid-cols-1 gap-6">
					{/* Logo Upload */}
					<div className="space-y-4">
						<div
							className={`border border-dashed border-stroke rounded-xl p-6 flex flex-col items-center justify-center text-center gap-4 transition-colors relative overflow-hidden bg-surface/30 ${
								isPro ? "hover:bg-surface hover:border-text/20" : "opacity-60"
							}`}
						>
							<input
								type="file"
								accept="image/png, image/jpeg, image/svg+xml"
								className="hidden"
								ref={logoInputRef}
								onChange={(e) => handleFileUpload(e, "logo")}
								disabled={!isPro || uploadingLogo}
							/>

							{identity.logoUrl ? (
								<div className="relative group w-full h-full flex flex-col items-center">
									<div className="w-20 h-20 relative mb-4">
										<img
											src={identity.logoUrl}
											alt="Brand Logo"
											className="w-full h-full object-contain"
										/>
									</div>
									<div className="flex gap-2">
										<Button
											text="Change"
											variant="secondary"
											size="sm"
											disabled={!isPro || uploadingLogo}
											onClick={() =>
												isPro ? logoInputRef.current?.click() : onLockedAction()
											}
										/>
										<Button
											variant="ghost"
											size="sm"
											className="text-text-muted hover:text-destructive"
											onClick={() => handleChange("logoUrl", undefined)}
											leftIcon={<X className="w-4 h-4" />}
										/>
									</div>
								</div>
							) : (
								<>
									<div className="w-10 h-10 rounded-full bg-surface border border-stroke flex items-center justify-center">
										{uploadingLogo ? (
											<Loader2 className="w-4 h-4 text-accent animate-spin" />
										) : (
											<ImageIcon className="w-4 h-4 text-text-muted" />
										)}
									</div>
									<div>
										<h4 className="font-medium text-sm text-text mb-0.5">
											Site Logo
										</h4>
										<p className="text-[10px] text-text-muted">
											SVG, PNG, or JPG. Max 2MB.
										</p>
									</div>
									{isPro ? (
										<div className="flex flex-col gap-2 w-full px-4">
											<Button
												text={uploadingLogo ? "Uploading..." : "Upload Logo"}
												variant="secondary"
												className="h-8 text-xs w-full"
												onClick={() => logoInputRef.current?.click()}
												disabled={uploadingLogo}
											/>
											{userProfileLogo && (
												<button
													onClick={handleUseProfileLogo}
													className="text-[10px] text-text-muted hover:text-accent underline decoration-dotted underline-offset-2 transition-colors flex items-center justify-center gap-1.5"
												>
													<UserCircle className="w-3 h-3" />
													Use profile logo
												</button>
											)}
										</div>
									) : (
										<Button
											text="Unlock Upload"
											variant="outline"
											className="h-8 text-xs"
											leftIcon={<UploadCloud className="w-3 h-3" />}
											onClick={onLockedAction}
										/>
									)}
								</>
							)}
						</div>
					</div>

					{/* Favicon Upload */}
					<div className="space-y-4">
						<div
							className={`border border-dashed border-stroke rounded-xl p-6 flex flex-col items-center justify-center text-center gap-4 transition-colors bg-surface/30 ${
								isPro ? "hover:bg-surface hover:border-text/20" : "opacity-60"
							}`}
						>
							<input
								type="file"
								accept="image/png, image/jpeg, image/x-icon"
								className="hidden"
								ref={faviconInputRef}
								onChange={(e) => handleFileUpload(e, "favicon")}
								disabled={!isPro || uploadingFavicon}
							/>

							{identity.faviconUrl ? (
								<div className="relative w-full flex flex-col items-center">
									<div className="w-10 h-10 mb-4 bg-surface rounded-lg border border-stroke flex items-center justify-center">
										<img
											src={identity.faviconUrl}
											alt="Favicon"
											className="w-6 h-6 object-contain"
										/>
									</div>
									<div className="flex gap-2">
										<Button
											text="Change"
											variant="secondary"
											size="sm"
											disabled={!isPro || uploadingFavicon}
											onClick={() =>
												isPro
													? faviconInputRef.current?.click()
													: onLockedAction()
											}
										/>
										<Button
											variant="ghost"
											size="sm"
											onClick={() => handleChange("faviconUrl", undefined)}
											leftIcon={<X className="w-4 h-4" />}
										/>
									</div>
								</div>
							) : (
								<>
									<div className="w-10 h-10 rounded-full bg-surface border border-stroke flex items-center justify-center">
										{uploadingFavicon ? (
											<Loader2 className="w-4 h-4 text-accent animate-spin" />
										) : (
											<Globe className="w-4 h-4 text-text-muted" />
										)}
									</div>
									<div>
										<h4 className="font-medium text-sm text-text mb-0.5">
											Favicon
										</h4>
										<p className="text-[10px] text-text-muted">
											Browser tab icon. 32x32px.
										</p>
									</div>
									{isPro ? (
										<div className="flex flex-col gap-2 w-full px-4">
											<Button
												text={uploadingFavicon ? "Uploading..." : "Upload Icon"}
												variant="secondary"
												className="h-8 text-xs w-full"
												onClick={() => faviconInputRef.current?.click()}
												disabled={uploadingFavicon}
											/>
											{identity.logoUrl && (
												<button
													onClick={() =>
														handleChange("faviconUrl", identity.logoUrl)
													}
													className="text-[10px] text-text-muted hover:text-accent underline decoration-dotted underline-offset-2 transition-colors"
												>
													Use uploaded logo
												</button>
											)}
										</div>
									) : (
										<Button
											text="Unlock Upload"
											variant="outline"
											className="h-8 text-xs"
											leftIcon={<UploadCloud className="w-3 h-3" />}
											onClick={onLockedAction}
										/>
									)}
								</>
							)}
						</div>
					</div>
				</div>
			</div>

			{/* Save Action */}
			<div className="pt-2 flex justify-end">
				<Button
					text={isSaving ? "Saving..." : "Save Visuals"}
					disabled={!isPro || isSaving}
					onClick={() => onUpdate(identity)}
					className="w-full bg-events"
					variant="primary"
				/>
			</div>
		</div>
	);
}
