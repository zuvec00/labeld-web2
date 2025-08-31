/* eslint-disable @typescript-eslint/no-explicit-any */
import Button from "@/components/ui/button";
import {
	Image as ImageIcon,
	Video as VideoIcon,
	Eye,
	Lock,
} from "lucide-react";
import type { MomentDoc } from "@/lib/models/moment";

export function MomentRow({
	m,
	onDelete,
	onEdit,
}: {
	m: MomentDoc;
	onDelete: () => void;
	onEdit?: () => void;
}) {
	// const isMedia = m.type === "image" || m.type === "video";
	const badge =
		m.visibility === "public" ? (
			<span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full border border-stroke">
				<Eye className="w-3 h-3" /> Public
			</span>
		) : (
			<span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full border border-stroke">
				<Lock className="w-3 h-3" /> Attendees only
			</span>
		);

	return (
		<div className="rounded-2xl bg-surface border border-stroke p-4 flex gap-4">
			{/* Preview */}
			<div className="w-24 h-24 rounded-xl border border-stroke overflow-hidden bg-bg grid place-items-center">
				{m.type === "image" && (m.thumbURL || m.mediaURL) ? (
					<img
						src={m.thumbURL || m.mediaURL}
						alt=""
						className="w-full h-full object-cover"
					/>
				) : m.type === "video" && m.mediaURL ? (
					<video
						src={m.mediaURL}
						className="w-full h-full object-cover"
						muted
						playsInline
					/>
				) : (
					<div className="p-2 text-text-muted text-xs text-center line-clamp-5">
						{m.type === "text" ? (
							m.text || "Text moment"
						) : m.type === "image" ? (
							<div className="flex flex-col items-center gap-1">
								<ImageIcon className="w-5 h-5" /> Image
							</div>
						) : (
							<div className="flex flex-col items-center gap-1">
								<VideoIcon className="w-5 h-5" /> Video
							</div>
						)}
					</div>
				)}
			</div>

			{/* Info */}
			<div className="flex-1 min-w-0">
				<div className="flex items-center justify-between gap-3">
					<div className="text-sm text-text-muted capitalize">{m.type}</div>
					{badge}
				</div>

				{m.text && <div className="text-sm mt-1 line-clamp-2">{m.text}</div>}

				<div className="text-xs text-text-muted mt-2">
					{formatWhen(m.createdAt)}
				</div>
			</div>

			{/* Actions */}
			<div className="flex items-center gap-2">
				{onEdit && <Button variant="outline" text="Edit" onClick={onEdit} />}
				<Button variant="danger" text="Delete" onClick={onDelete} />
			</div>
		</div>
	);
}

function formatWhen(d: Date | any) {
	const date = d instanceof Date ? d : d?.toDate?.() ?? new Date(d);
	const diff = Date.now() - date.getTime();
	const mins = Math.floor(diff / 60000);
	if (mins < 1) return "Just now";
	if (mins < 60) return `${mins}m ago`;
	const hrs = Math.floor(mins / 60);
	if (hrs < 24) return `${hrs}h ago`;
	const days = Math.floor(hrs / 24);
	if (days < 7) return `${days}d ago`;
	return date.toLocaleDateString();
}
