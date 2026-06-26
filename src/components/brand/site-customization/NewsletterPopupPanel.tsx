"use client";

import React, { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import Textarea from "@/components/ui/textarea";
import UploadImage from "@/components/ui/upload-image";
import { uploadFileDirectCloudinary } from "@/lib/storage/cloudinary";
import { useUploadStore } from "@/lib/stores/upload";
import { useToast } from "@/app/hooks/use-toast";
import { useDashboardContext } from "@/hooks/useDashboardContext";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/firebaseConfig";
import { RotateCcw, Mail } from "lucide-react";

interface NewsletterPopupConfig {
	enabled: boolean;
	header?: string | null;
	subheader?: string | null;
	backgroundImageUrl?: string | null;
}

interface NewsletterPopupPanelProps {
	brandId: string;
	initialConfig?: NewsletterPopupConfig | null;
}

export default function NewsletterPopupPanel({
	brandId,
	initialConfig,
}: NewsletterPopupPanelProps) {
	const { user } = useDashboardContext();
	const { toast } = useToast();
	const { addUpload, updateUpload, removeUpload } = useUploadStore();

	const [enabled, setEnabled] = useState(initialConfig?.enabled ?? false);
	const [header, setHeader] = useState(initialConfig?.header ?? "");
	const [subheader, setSubheader] = useState(initialConfig?.subheader ?? "");
	const [bgImageUrl, setBgImageUrl] = useState(
		initialConfig?.backgroundImageUrl ?? null,
	);
	const [uploading, setUploading] = useState(false);
	const [saving, setSaving] = useState(false);

	// Sync when parent provides new config (from Firestore watch)
	useEffect(() => {
		if (initialConfig) {
			setEnabled(initialConfig.enabled ?? false);
			setHeader(initialConfig.header ?? "");
			setSubheader(initialConfig.subheader ?? "");
			setBgImageUrl(initialConfig.backgroundImageUrl ?? null);
		}
	}, [initialConfig?.enabled, initialConfig?.header, initialConfig?.subheader, initialConfig?.backgroundImageUrl]);

	const saveConfig = async (patch: Partial<NewsletterPopupConfig>) => {
		if (!brandId) return;
		setSaving(true);
		try {
			const config: NewsletterPopupConfig = {
				enabled,
				header: header || null,
				subheader: subheader || null,
				backgroundImageUrl: bgImageUrl,
				...patch,
			};
			await updateDoc(doc(db, "brands", brandId), {
				"storefrontConfig.sectionSettings.newsletter-popup": config,
				updatedAt: serverTimestamp(),
			});
		} catch (e) {
			console.error(e);
			toast({ title: "Failed to save popup settings", variant: "destructive" });
		} finally {
			setSaving(false);
		}
	};

	const handleToggle = async (checked: boolean) => {
		setEnabled(checked);
		await saveConfig({ enabled: checked });
	};

	const handleImageUpload = async (file: File | null) => {
		if (!file || !user?.uid) return;
		const uploadId = addUpload({
			type: "image",
			fileName: file.name,
			progress: 0,
			status: "uploading",
		});
		const upload = useUploadStore.getState().uploads.find((u) => u.id === uploadId);
		const abort = upload?.cancelController;
		try {
			setUploading(true);
			const url = await uploadFileDirectCloudinary(
				file,
				{ folder: `brandImages/${user.uid}/newsletter`, tags: ["newsletter-popup", user.uid] },
				(progress) => {
					if (abort?.signal.aborted) throw new Error("Cancelled");
					updateUpload(uploadId, { progress: Math.round(progress) });
				},
			);
			setBgImageUrl(url);
			await saveConfig({ backgroundImageUrl: url });
			updateUpload(uploadId, { status: "completed", progress: 100 });
			setTimeout(() => removeUpload(uploadId), 3000);
			toast({ title: "Image uploaded" });
		} catch (e) {
			updateUpload(uploadId, { status: "error", error: "Upload failed" });
			toast({ title: "Upload failed", variant: "destructive" });
		} finally {
			setUploading(false);
		}
	};

	const handleBlur = () => saveConfig({});

	return (
		<div className="space-y-5">
			<div className="flex items-start justify-between gap-4">
				<div className="flex items-start gap-3">
					<div className="w-9 h-9 rounded-lg bg-bg border border-stroke flex items-center justify-center flex-shrink-0 text-text-muted mt-0.5">
						<Mail className="w-4 h-4" />
					</div>
					<div>
						<p className="text-sm font-semibold text-text">Newsletter Popup</p>
						<p className="text-xs text-text-muted mt-0.5">
							Shows after visitors scroll 50% of the page — once per session.
						</p>
					</div>
				</div>
				<Switch
					checked={enabled}
					onCheckedChange={handleToggle}
					className="mt-1 flex-shrink-0 data-[state=checked]:bg-cta border-transparent"
				/>
			</div>

			{enabled && (
				<div className="space-y-5 pt-2 border-t border-stroke">
					{/* Background Image */}
					<div className="space-y-2">
						<div className="flex items-center justify-between">
							<label className="text-xs font-medium text-text-muted uppercase tracking-wider">
								Background Image (Optional)
							</label>
							{bgImageUrl && (
								<button
									onClick={() => { setBgImageUrl(null); saveConfig({ backgroundImageUrl: null }); }}
									className="text-text-muted hover:text-text transition-colors p-1 hover:bg-surface-2 rounded"
									title="Remove image"
								>
									<RotateCcw className="w-3 h-3" />
								</button>
							)}
						</div>
						<UploadImage
							text="Popup Background"
							value={null}
							onChange={handleImageUpload}
							onlineImage={bgImageUrl ?? undefined}
							singleImage={true}
							backgroundColor="var(--color-bg)"
							textColor="var(--color-text-muted)"
						/>
					</div>

					{/* Header */}
					<div className="space-y-2">
						<label className="text-xs font-medium text-text-muted uppercase tracking-wider">
							Headline
						</label>
						<Input
							value={header}
							onChange={(e) => setHeader(e.target.value)}
							onBlur={handleBlur}
							placeholder="e.g. Stay in the loop"
							className="bg-surface"
						/>
					</div>

					{/* Subheader */}
					<div className="space-y-2">
						<label className="text-xs font-medium text-text-muted uppercase tracking-wider">
							Subheadline
						</label>
						<Textarea
							value={subheader}
							onChange={(e) => setSubheader(e.target.value)}
							onBlur={handleBlur}
							placeholder="e.g. Get early access to new drops."
							className="bg-surface min-h-[80px]"
						/>
						<p className="text-[10px] text-text-muted">
							Name (optional) + Email fields are always shown below your headline.
						</p>
					</div>

					{saving && (
						<p className="text-xs text-text-muted animate-pulse flex items-center gap-1">
							<RotateCcw className="w-3 h-3 animate-spin" /> Saving...
						</p>
					)}
				</div>
			)}
		</div>
	);
}
