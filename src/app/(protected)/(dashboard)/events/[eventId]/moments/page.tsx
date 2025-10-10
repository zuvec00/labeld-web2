// app/events/[eventId]/moments/page.tsx
"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Stepper from "@/components/ticketing/Stepper";
import Button from "@/components/ui/button";
import { Camera, Plus } from "lucide-react";

import type { MomentDoc } from "@/lib/models/moment";
import { getAuth } from "firebase/auth";
import { Spinner } from "@/components/ui/spinner";
import {
	createMoment,
	deleteMoment,
	listMomentsForEvent,
} from "@/lib/firebase/queries/moment";
import { uploadFileGetURL } from "@/lib/storage/upload";
import {
	uploadImageCloudinary,
	uploadFileDirectCloudinary,
} from "@/lib/storage/cloudinary";
import { MomentRow } from "@/components/moments/MomentRow";
import { useUploadStore } from "@/lib/stores/upload";

const STEPS = [
	{ key: "details", label: "Details" },
	// { key: "theme", label: "Theme" },
	{ key: "tickets", label: "Tickets" },
	{ key: "merch", label: "Merch", optional: true },
	{ key: "moments", label: "Moments", optional: true },
	{ key: "review", label: "Review" },
];

export default function EventMomentsPage() {
	const router = useRouter();
	const { eventId } = useParams<{ eventId: string }>();
	const eventIdString = eventId as string;

	const [items, setItems] = useState<MomentDoc[]>([]);
	const [open, setOpen] = useState(false);
	const [loading, setLoading] = useState(true);

	const { addUpload, updateUpload, removeUpload } = useUploadStore();

	useEffect(() => {
		let mounted = true;
		(async () => {
			try {
				const list = await listMomentsForEvent(eventIdString);
				if (mounted) setItems(list);
			} finally {
				if (mounted) setLoading(false);
			}
		})();
		return () => {
			mounted = false;
		};
	}, [eventIdString]);

	const handleBackgroundUpload = async (
		file: File,
		thumbnailFile: File | null,
		type: "image" | "video",
		caption: string,
		visibility: "attendeesOnly" | "public"
	) => {
		const auth = getAuth();
		const user = auth.currentUser;
		if (!user) return;

		// Add to global upload store
		const uploadId = addUpload({
			type,
			fileName: file.name,
			progress: 0,
			status: "uploading",
		});

		// Get the cancel controller for this upload
		const upload = useUploadStore
			.getState()
			.uploads.find((u) => u.id === uploadId);
		const abortController = upload?.cancelController;

		try {
			let mediaURL: string | undefined;
			let thumbURL: string | undefined;

			// Upload main file
			const folder = `moments/${user.uid}`;
			const tags = ["moment", "event", eventIdString, type];

			// Check if upload was cancelled before starting
			if (abortController?.signal.aborted) {
				throw new Error("Upload cancelled");
			}

			if (type === "image") {
				mediaURL = await uploadImageCloudinary(file, { folder, tags });
			} else {
				mediaURL = await uploadFileDirectCloudinary(
					file,
					{ folder, tags, resourceType: "video" },
					(progress) => {
						// Check if cancelled during progress updates
						if (abortController?.signal.aborted) {
							throw new Error("Upload cancelled");
						}
						updateUpload(uploadId, { progress: Math.round(progress) });
					}
				);
			}

			// Upload thumbnail if provided
			if (thumbnailFile && type === "video") {
				try {
					const thumbFolder = `moments/${user.uid}/thumbnails`;
					const thumbTags = ["moment-thumbnail", "event", eventIdString];
					thumbURL = await uploadImageCloudinary(thumbnailFile, {
						folder: thumbFolder,
						tags: thumbTags,
					});
				} catch (error) {
					console.warn("Thumbnail upload failed:", error);
					thumbURL = await uploadFileGetURL(
						thumbnailFile,
						`moments/${user.uid}/thumbnails/${crypto.randomUUID()}-${
							thumbnailFile.name
						}`
					);
				}
			}

			// Create moment in database
			const docIn: Omit<MomentDoc, "id" | "createdAt"> = {
				eventId: eventIdString,
				authorUserId: user.uid,
				type,
				mediaURL,
				...(thumbURL && { thumbURL }), // Only include thumbURL if it exists
				...(caption.trim() && { text: caption.trim() }), // Only include text if not empty
				visibility,
			};

			const id = await createMoment(docIn);
			const newMoment = { id, ...docIn, createdAt: new Date() } as MomentDoc;

			// Update list
			setItems((prev) => [newMoment, ...prev]);

			// Mark upload as completed
			updateUpload(uploadId, { status: "completed", progress: 100 });

			// Remove completed upload after 3 seconds
			setTimeout(() => {
				removeUpload(uploadId);
			}, 3000);
		} catch (error) {
			console.error("Background upload error:", error);

			// Check if it was cancelled
			if (error instanceof Error && error.message === "Upload cancelled") {
				updateUpload(uploadId, {
					status: "cancelled",
				});
			} else {
				updateUpload(uploadId, {
					status: "error",
					error:
						error instanceof Error
							? error.message
							: "Upload failed. Please try again.",
				});
			}
		}
	};

	if (loading) {
		return (
			<div className="min-h-dvh grid place-items-center">
				<Spinner size="lg" />
			</div>
		);
	}

	return (
		<div className="min-h-dvh px-4 sm:px-6 py-8 max-w-3xl mx-auto">
			<Stepper steps={STEPS} activeKey="moments" />

			<div className="mt-6 flex items-center justify-between">
				<div>
					<h1 className="font-heading font-semibold text-2xl">
						Add event moments
					</h1>
					<p className="text-text-muted mt-1">
						Optional: hype posts before, during, or after the event.
					</p>
				</div>
				<Button
					text="Add moment"
					variant="primary"
					leftIcon={<Plus className="w-4 h-4" />}
					onClick={() => setOpen(true)}
				/>
			</div>

			{/* List / Empty */}
			<div className="mt-6">
				{items.length ? (
					<div className="grid gap-4">
						{items.map((m) => (
							<MomentRow
								key={m.id}
								m={m}
								onDelete={async () => {
									await deleteMoment(m.id);
									setItems((prev) => prev.filter((x) => x.id !== m.id));
								}}
							/>
						))}
					</div>
				) : (
					<div className="rounded-2xl bg-surface border border-stroke p-10 text-center">
						<Camera className="mx-auto w-10 h-10 text-text-muted" />
						<h3 className="mt-3 font-medium">No moments yet</h3>
						<p className="text-text-muted text-sm mt-1">
							Add your first photo, video, or text update.
						</p>
						<Button
							className="mt-4"
							variant="primary"
							text="Add moment"
							leftIcon={<Plus className="w-4 h-4" />}
							onClick={() => setOpen(true)}
						/>
					</div>
				)}
			</div>

			{/* Footer */}
			<div className="flex justify-between pt-8 mt-10 border-t border-stroke">
				<Button
					variant="outline"
					text="Back"
					onClick={() => router.push(`/events/${eventIdString}/merch`)}
				/>
				<Button
					variant="primary"
					text="Continue → Review"
					onClick={() => router.push(`/events/${eventIdString}/review`)}
				/>
			</div>

			{open && (
				<CreateMomentDialog
					onClose={() => setOpen(false)}
					onBackgroundUpload={handleBackgroundUpload}
				/>
			)}
		</div>
	);
}

function CreateMomentDialog({
	onClose,
	onBackgroundUpload,
}: {
	onClose: () => void;
	onBackgroundUpload: (
		file: File,
		thumbnailFile: File | null,
		type: "image" | "video",
		caption: string,
		visibility: "attendeesOnly" | "public"
	) => void;
}) {
	const auth = getAuth();
	const [type, setType] = useState<"image" | "video">("image");
	const [file, setFile] = useState<File | null>(null);
	const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
	const [caption, setCaption] = useState("");
	const [visibility, setVisibility] = useState<"attendeesOnly" | "public">(
		"public"
	);
	const [fileError, setFileError] = useState<string | null>(null);
	const [filePreview, setFilePreview] = useState<string | null>(null);
	const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);

	// Cleanup preview URLs on unmount
	useEffect(() => {
		return () => {
			if (filePreview) {
				URL.revokeObjectURL(filePreview);
			}
			if (thumbnailPreview) {
				URL.revokeObjectURL(thumbnailPreview);
			}
		};
	}, [filePreview, thumbnailPreview]);

	async function onSave() {
		const user = auth.currentUser;
		if (!user || !file) return;

		// Validate file size based on type
		const maxSize = type === "video" ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
		if (file.size > maxSize) {
			setFileError(
				`File size must be ${type === "video" ? "50MB" : "10MB"} or less.`
			);
			return;
		}

		// Validate thumbnail size if provided
		if (thumbnailFile) {
			const maxThumbSize = 5 * 1024 * 1024;
			if (thumbnailFile.size > maxThumbSize) {
				setFileError("Thumbnail size must be 5MB or less.");
				return;
			}
		}

		// For videos, validate duration (basic size-based check)
		if (type === "video") {
			const estimatedDuration = (file.size / (50 * 1024 * 1024)) * 30;
			if (estimatedDuration > 35) {
				setFileError(
					"Video appears to be longer than 30 seconds. Please trim it."
				);
				return;
			}
		}

		// For videos, always use background upload
		// For images, also use background upload for consistency
		onBackgroundUpload(file, thumbnailFile, type, caption, visibility);

		// Close dialog immediately - upload continues in background
		onClose();
	}

	return (
		<DialogFrame title="Add moment" onClose={onClose}>
			{fileError && (
				<div className="text-alert text-sm mb-4 p-3 bg-alert/10 rounded-lg border border-alert/20">
					{fileError}
				</div>
			)}
			<div className="grid gap-6">
				{/* type selector */}
				<div>
					<label className="block text-sm text-text-muted mb-2">
						Type <span className="text-cta">*</span>
					</label>
					<select
						value={type}
						onChange={(e) => {
							const newType = e.target.value as "image" | "video";
							setType(newType);
							// Clear thumbnail when switching to image type
							if (newType === "image") {
								setThumbnailFile(null);
								if (thumbnailPreview) {
									URL.revokeObjectURL(thumbnailPreview);
									setThumbnailPreview(null);
								}
							}
						}}
						className="w-full rounded-xl border border-stroke px-4 py-3 bg-surface text-text outline-none focus:border-accent"
					>
						<option value="image">Image</option>
						<option value="video">Video</option>
					</select>
				</div>

				{/* File upload */}
				<div>
					<label className="block text-sm text-text-muted mb-2">
						{type === "image" ? "Image" : "Video"}{" "}
						<span className="text-cta">*</span>
					</label>
					<input
						type="file"
						accept={type === "image" ? "image/*" : "video/*"}
						onChange={(e) => {
							const selectedFile = e.target.files?.[0] ?? null;
							setFile(selectedFile);
							setFileError(null); // Clear any previous errors

							// Create preview URL
							if (selectedFile) {
								const url = URL.createObjectURL(selectedFile);
								setFilePreview(url);
							} else {
								setFilePreview(null);
							}
						}}
						className="block w-full text-sm text-text file:mr-3 file:rounded-lg file:border file:border-stroke file:bg-bg file:px-3 file:py-2 file:text-sm file:font-semibold hover:file:bg-surface"
					/>
					<p className="text-xs text-text-muted mt-2">
						{type === "image"
							? "Upload an image for your moment. Recommended: JPG/PNG/WebP, max 10MB."
							: "Upload a video for your moment. 30s max duration, 50MB max file size, 720-1080p recommended. Video will upload in the background so you can continue working."}
					</p>

					{/* File Preview */}
					{filePreview && (
						<div className="mt-3">
							{type === "image" ? (
								// eslint-disable-next-line @next/next/no-img-element
								<img
									src={filePreview}
									alt="Preview"
									className="w-full max-h-48 object-cover rounded-xl border border-stroke"
								/>
							) : (
								<video
									src={filePreview}
									className="w-full max-h-48 object-cover rounded-xl border border-stroke"
									controls
									muted
								/>
							)}
						</div>
					)}
				</div>

				{/* Thumbnail upload (only for videos) */}
				{type === "video" && (
					<div>
						<label className="block text-sm text-text-muted mb-2">
							Video Thumbnail (optional)
						</label>
						<input
							type="file"
							accept="image/*"
							onChange={(e) => {
								const selectedFile = e.target.files?.[0] ?? null;
								setThumbnailFile(selectedFile);

								// Create preview URL
								if (selectedFile) {
									const url = URL.createObjectURL(selectedFile);
									setThumbnailPreview(url);
								} else {
									setThumbnailPreview(null);
								}
							}}
							className="block w-full text-sm text-text file:mr-3 file:rounded-lg file:border file:border-stroke file:bg-bg file:px-3 file:py-2 file:text-sm file:font-semibold hover:file:bg-surface"
						/>
						<p className="text-xs text-text-muted mt-2">
							Upload a custom thumbnail for your video. Recommended:
							JPG/PNG/WebP, max 5MB.
						</p>

						{/* Thumbnail Preview */}
						{thumbnailPreview && (
							<div className="mt-3">
								{/* eslint-disable-next-line @next/next/no-img-element */}
								<img
									src={thumbnailPreview}
									alt="Thumbnail preview"
									className="w-full max-h-48 object-cover rounded-xl border border-stroke"
								/>
							</div>
						)}
					</div>
				)}

				{/* Caption (optional) */}
				<div>
					<label className="block text-sm text-text-muted mb-2">
						Caption (optional)
					</label>
					<textarea
						className="w-full rounded-xl border border-stroke px-4 py-3 text-text outline-none focus:border-accent"
						rows={6}
						value={caption}
						onChange={(e) => setCaption(e.target.value)}
						placeholder="Add a caption to your moment..."
					/>
				</div>

				<div>
					<label className="block text-sm text-text-muted mb-2">
						Visibility <span className="text-cta">*</span>
					</label>
					<select
						value={visibility}
						onChange={(e) =>
							setVisibility(e.target.value as "attendeesOnly" | "public")
						}
						className="w-full rounded-xl border border-stroke px-4 py-3 bg-surface text-text outline-none focus:border-accent"
					>
						<option value="public">Public</option>
						<option value="attendeesOnly">Attendees only</option>
					</select>
				</div>
			</div>

			<div className="mt-6 flex items-center justify-end gap-2">
				<Button variant="outline" text="Cancel" onClick={onClose} />
				<Button
					variant={file ? "primary" : "disabled"}
					disabled={!file}
					text={type === "video" ? "Upload in Background" : "Upload"}
					onClick={onSave}
				/>
			</div>
		</DialogFrame>
	);
}

/* ---------- small primitives ---------- */

function DialogFrame({
	title,
	children,
	onClose,
}: {
	title: string;
	children: React.ReactNode;
	onClose: () => void;
}) {
	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
			<div className="w-full max-w-2xl max-h-[90vh] rounded-2xl bg-surface border border-stroke flex flex-col">
				<div className="flex items-center justify-between p-6 border-b border-stroke">
					<h3 className="font-heading font-semibold text-lg">{title}</h3>
					<button className="text-text-muted hover:text-text" onClick={onClose}>
						✕
					</button>
				</div>
				<div className="flex-1 overflow-y-auto p-6">{children}</div>
			</div>
		</div>
	);
}
