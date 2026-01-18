"use client";

import React, { useState, useRef, useEffect } from "react";
import ColorTokenControl from "@/components/brand/site-customization/ColorTokenControl";
import Button from "@/components/ui/button";
import { BrandIdentity } from "@/lib/models/site-customization";
import {
	UploadCloud,
	Image as ImageIcon,
	Type,
	Loader2,
	X,
	Globe,
	UserCircle,
} from "lucide-react";
import { useDashboardContext } from "@/hooks/useDashboardContext";
import { uploadBrandImageWeb } from "@/lib/storage/upload";
import { useToast } from "@/app/hooks/use-toast";

interface BrandIdentityViewProps {
	isPro: boolean;
	initialIdentity?: BrandIdentity;
	brandProfileLogo?: string;
	onUpdate: (identity: BrandIdentity) => void;
	onLockedAction: () => void;
	isSaving?: boolean;
}

export default function BrandIdentityView({
	isPro,
	initialIdentity,
	brandProfileLogo,
	onUpdate,
	onLockedAction,
	isSaving = false,
}: BrandIdentityViewProps) {
	const { user } = useDashboardContext();
	const { toast } = useToast();
	const [identity, setIdentity] = useState<BrandIdentity>(
		initialIdentity || {
			primaryColor: "#000000",
			secondaryColor: "#ffffff",
			themeMode: "light",
		}
	);

	// Sync with prop when fetched
	useEffect(() => {
		if (initialIdentity) {
			setIdentity(initialIdentity);
		}
	}, [initialIdentity]);

	const [uploadingLogo, setUploadingLogo] = useState(false);
	const [uploadingFavicon, setUploadingFavicon] = useState(false);

	const logoInputRef = useRef<HTMLInputElement>(null);
	const faviconInputRef = useRef<HTMLInputElement>(null);

	const handleChange = (key: keyof BrandIdentity, value: any) => {
		const newIdentity = { ...identity, [key]: value };
		setIdentity(newIdentity);
	};

	const handleUseProfileLogo = () => {
		if (!brandProfileLogo) return;
		handleChange("logoUrl", brandProfileLogo);
		toast({
			title: "Logo Updated",
			description: "Using your brand profile logo.",
		});
	};

	const handleFileUpload = async (
		e: React.ChangeEvent<HTMLInputElement>,
		type: "logo" | "favicon"
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

			const url = await uploadBrandImageWeb(file, user.uid);

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
		<div className="max-w-3xl space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-300">
			{/* Header */}
			<div>
				<h2 className="font-heading font-semibold text-lg text-text mb-1">
					Brand Identity
				</h2>
				<p className="text-text-muted text-sm">
					Define how your brand looks across your storefront. Changes apply
					globally.
				</p>
			</div>

			{/* Section 0: Theme Mode */}
			<div className="space-y-6">
				<h3 className="text-xs font-bold uppercase tracking-wider text-text-muted/60 flex items-center gap-2">
					Theme Mode
				</h3>
				<div className="grid grid-cols-2 gap-4">
					<button
						onClick={() => handleChange("themeMode", "light")}
						className={`relative flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all ${
							identity.themeMode === "light" || !identity.themeMode
								? "border-text bg-surface"
								: "border-stroke hover:border-text/30 bg-surface/50"
						}`}
					>
						<div className="w-12 h-12 rounded-full bg-white border border-stroke shadow-sm flex items-center justify-center">
							<div className="w-6 h-6 rounded-full bg-amber-400" />
						</div>
						<div className="text-center">
							<span className="block font-medium text-sm text-text">
								Light Mode
							</span>
							<span className="block text-xs text-text-muted mt-1">
								Clean white background
							</span>
						</div>
						{(identity.themeMode === "light" || !identity.themeMode) && (
							<div className="absolute top-3 right-3 w-4 h-4 bg-text rounded-full text-bg flex items-center justify-center">
								<svg
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="3"
									className="w-2.5 h-2.5"
								>
									<polyline points="20 6 9 17 4 12" />
								</svg>
							</div>
						)}
					</button>

					<button
						onClick={() => handleChange("themeMode", "dark")}
						className={`relative flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all ${
							identity.themeMode === "dark"
								? "border-text bg-surface"
								: "border-stroke hover:border-text/30 bg-surface/50"
						}`}
					>
						<div className="w-12 h-12 rounded-full bg-black border border-stroke shadow-sm flex items-center justify-center">
							<div className="w-6 h-6 rounded-full bg-slate-700" />
						</div>
						<div className="text-center">
							<span className="block font-medium text-sm text-text">
								Dark Mode
							</span>
							<span className="block text-xs text-text-muted mt-1">
								Sleek black background
							</span>
						</div>
						{identity.themeMode === "dark" && (
							<div className="absolute top-3 right-3 w-4 h-4 bg-text rounded-full text-bg flex items-center justify-center">
								<svg
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="3"
									className="w-2.5 h-2.5"
								>
									<polyline points="20 6 9 17 4 12" />
								</svg>
							</div>
						)}
					</button>
				</div>
			</div>

			<hr className="border-stroke/50" />

			{/* Section 1: Color Tokens */}
			<div className="space-y-6">
				<h3 className="text-xs font-bold uppercase tracking-wider text-text-muted/60 flex items-center gap-2">
					Color Tokens
				</h3>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
					<ColorTokenControl
						label="Theme Brand Color"
						description="Used for main actions, buttons, and key highlights. Pick a color that contrasts well with white."
						value={identity.primaryColor}
						onChange={(val) => handleChange("primaryColor", val)}
						isPro={isPro}
						onLockedClick={onLockedAction}
						isRequired
					/>
				</div>
			</div>

			<hr className="border-stroke/50" />

			{/* Section 2: Logo */}
			<div className="space-y-6">
				<div className="flex justify-between">
					<h3 className="text-xs font-bold uppercase tracking-wider text-text-muted/60">
						Logo & Assets
					</h3>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					{/* Logo Upload */}
					<div className="space-y-4">
						<div
							className={`border border-dashed border-stroke rounded-xl p-8 flex flex-col items-center justify-center text-center gap-4 transition-colors relative overflow-hidden bg-surface/30 ${
								isPro ? "hover:bg-surface hover:border-text/20" : "opacity-60"
							}`}
						>
							{/* Hidden Input */}
							<input
								type="file"
								accept="image/png, image/jpeg, image/svg+xml"
								className="hidden"
								ref={logoInputRef}
								onChange={(e) => handleFileUpload(e, "logo")}
								disabled={!isPro || uploadingLogo}
							/>

							{/* Visual State */}
							{identity.logoUrl ? (
								<div className="relative group w-full h-full flex flex-col items-center">
									<div className="w-24 h-24 relative mb-4">
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
										{identity.logoUrl !== brandProfileLogo &&
											brandProfileLogo && (
												<Button
													variant="ghost"
													size="sm"
													className="text-text-muted hover:text-destructive"
													onClick={() => handleChange("logoUrl", undefined)}
													leftIcon={<X className="w-4 h-4" />}
												/>
											)}
									</div>
								</div>
							) : (
								<>
									<div className="w-12 h-12 rounded-full bg-surface border border-stroke flex items-center justify-center">
										{uploadingLogo ? (
											<Loader2 className="w-5 h-5 text-accent animate-spin" />
										) : (
											<ImageIcon className="w-5 h-5 text-text-muted" />
										)}
									</div>
									<div>
										<h4 className="font-medium text-sm text-text mb-1">
											Brand Logo
										</h4>
										<p className="text-xs text-text-muted">
											SVG, PNG, or JPG.
											<br />
											Max 2MB.
										</p>
									</div>
									{isPro ? (
										<div className="flex flex-col gap-2 w-full px-8">
											<Button
												text={uploadingLogo ? "Uploading..." : "Upload Logo"}
												variant="secondary"
												className="h-8 text-xs w-full"
												onClick={() => logoInputRef.current?.click()}
												disabled={uploadingLogo}
											/>
											{brandProfileLogo && (
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
							className={`border border-dashed border-stroke rounded-xl p-8 flex flex-col items-center justify-center text-center gap-4 transition-colors bg-surface/30 ${
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
									<div className="w-12 h-12 mb-4 bg-surface rounded-lg border border-stroke flex items-center justify-center">
										<img
											src={identity.faviconUrl}
											alt="Favicon"
											className="w-8 h-8 object-contain"
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
									<div className="w-12 h-12 rounded-full bg-surface border border-stroke flex items-center justify-center">
										{uploadingFavicon ? (
											<Loader2 className="w-5 h-5 text-accent animate-spin" />
										) : (
											<Globe className="w-5 h-5 text-text-muted" />
										)}
									</div>
									<div>
										<h4 className="font-medium text-sm text-text mb-1">
											Favicon
										</h4>
										<p className="text-xs text-text-muted">
											Browser tab icon.
											<br />
											32x32px recommended.
										</p>
									</div>
									{isPro ? (
										<div className="flex flex-col gap-2 w-full px-8">
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
													Use brand logo
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

			<hr className="border-stroke/50" />

			{/* Section 4: Typography (Locked) */}
			<div className="space-y-4 opacity-60 pointer-events-none select-none grayscale">
				<div className="flex items-center justify-between">
					<h3 className="text-xs font-bold uppercase tracking-wider text-text-muted/60 flex items-center gap-2">
						Typography
						<span className="normal-case font-normal text-[10px] bg-accent/10 text-accent px-1.5 py-0.5 rounded">
							Coming Soon
						</span>
					</h3>
				</div>
				<div className="p-6 bg-surface border border-stroke rounded-xl flex flex-col md:flex-row items-center gap-6">
					<div className="w-12 h-12 rounded-full bg-stroke/20 flex items-center justify-center">
						<Type className="w-5 h-5 text-text-muted" />
					</div>
					<div>
						<h4 className="text-2xl font-heading font-bold text-text">
							Unbounded
						</h4>
						<p className="text-sm text-text-muted">Primary Heading Font</p>
					</div>
					<div className="w-full h-px md:w-px md:h-8 bg-stroke" />
					<div>
						<p className="text-xl font-sans text-text">Manrope</p>
						<p className="text-sm text-text-muted">Body Text Font</p>
					</div>
				</div>
				<p className="text-xs text-text-muted italic max-w-md">
					Detailed typography controls are coming soon. Currently, your
					storefront uses a curated system designed for optimal readability and
					performance.
				</p>
			</div>
			{/* Save Action */}
			<div className="pt-4 flex justify-end">
				<Button
					text={isSaving ? "Saving..." : "Save Changes"}
					disabled={!isPro || isSaving}
					onClick={() => onUpdate(identity)} // onUpdate now means "Save this identity"
					className="w-full sm:w-auto"
				/>
			</div>
		</div>
	);
}
