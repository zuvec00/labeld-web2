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
import { MomentRow } from "@/components/moments/MomentRow";

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
					eventId={eventIdString}
					onClose={() => setOpen(false)}
					onCreated={(doc) => setItems((prev) => [doc, ...prev])}
				/>
			)}
		</div>
	);
}

function CreateMomentDialog({
	eventId,
	onClose,
	onCreated,
}: {
	eventId: string;
	onClose: () => void;
	onCreated: (doc: MomentDoc) => void;
}) {
	const auth = getAuth();
	const [type, setType] = useState<"image" | "video" | "text">("image");
	const [file, setFile] = useState<File | null>(null);
	const [text, setText] = useState("");
	const [visibility, setVisibility] = useState<"attendeesOnly" | "public">(
		"public"
	);
	const [saving, setSaving] = useState(false);
	const [fileError, setFileError] = useState<string | null>(null);
	const [filePreview, setFilePreview] = useState<string | null>(null);

	// Cleanup preview URL on unmount
	useEffect(() => {
		return () => {
			if (filePreview) {
				URL.revokeObjectURL(filePreview);
			}
		};
	}, [filePreview]);

	async function onSave() {
		const user = auth.currentUser;
		if (!user) return;
		setSaving(true);
		setFileError(null);
		try {
			let mediaURL: string | undefined;
			if (file) {
				// Validate file size
				if (file.size > 25 * 1024 * 1024) {
					// 25MB
					throw new Error("File size must be 25MB or less.");
				}

				// For videos, validate duration (basic check - in real app you'd use a video library)
				if (type === "video") {
					// Note: This is a basic check. For production, you'd want to use a proper video library
					// to get actual duration. This is just a placeholder for the UI.
					if (file.size > 50 * 1024 * 1024) {
						// Rough estimate for 15s video
						throw new Error("Video appears to be longer than 15 seconds.");
					}
				}

				mediaURL = await uploadFileGetURL(
					file,
					`moments/${user.uid}/${crypto.randomUUID()}-${file.name}`
				);
			}
			// Only include the "text" field if it's a text moment
			const docIn: Omit<MomentDoc, "id" | "createdAt"> =
				type === "text"
					? {
							eventId,
							authorUserId: user.uid,
							type,
							mediaURL,
							text,
							visibility,
					  }
					: {
							eventId,
							authorUserId: user.uid,
							type,
							mediaURL,
							visibility,
					  };
			const id = await createMoment(docIn);
			onCreated({ id, ...docIn, createdAt: new Date() } as MomentDoc);
			onClose();
		} catch (error: unknown) {
			setFileError(
				error instanceof Error ? error.message : "Failed to save moment."
			);
		} finally {
			setSaving(false);
		}
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
						onChange={(e) =>
							setType(e.target.value as "image" | "video" | "text")
						}
						className="w-full rounded-xl border border-stroke px-4 py-3 bg-surface text-text outline-none focus:border-accent"
					>
						<option value="image">Image</option>
						<option value="video">Video</option>
						<option value="text">Text</option>
					</select>
				</div>

				{type === "text" ? (
					<textarea
						className="w-full rounded-xl border border-stroke px-4 py-3 text-text outline-none focus:border-accent"
						rows={4}
						value={text}
						onChange={(e) => setText(e.target.value)}
						placeholder="Write your update..."
					/>
				) : (
					<div>
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
								? "Upload an image for your moment. Recommended: JPG/PNG/WebP, max 2MB."
								: "Upload a video for your moment. 15s max duration, 25MB max file size, 720-1080p recommended."}
						</p>

						{/* File Preview */}
						{filePreview && (
							<div className="mt-3">
								{type === "image" ? (
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
				)}

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
					variant={text || file ? "primary" : "disabled"}
					disabled={(!text && !file) || saving}
					text={saving ? "Saving…" : "Save"}
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
