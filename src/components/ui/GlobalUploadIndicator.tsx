"use client";

import { useUploadStore, type BackgroundUpload } from "@/lib/stores/upload";
import { X, Loader2, Square } from "lucide-react";

export default function GlobalUploadIndicator() {
	const { uploads, removeUpload, cancelUpload } = useUploadStore();

	if (uploads.length === 0) return null;

	return (
		<div className="fixed bottom-4 right-4 z-50 space-y-2 max-w-sm">
			{uploads.map((upload) => (
				<UploadToast
					key={upload.id}
					upload={upload}
					onRemove={removeUpload}
					onCancel={cancelUpload}
				/>
			))}
		</div>
	);
}

function UploadToast({
	upload,
	onRemove,
	onCancel,
}: {
	upload: BackgroundUpload;
	onRemove: (id: string) => void;
	onCancel: (id: string) => void;
}) {
	const getStatusIcon = () => {
		switch (upload.status) {
			case "uploading":
				return <Loader2 className="w-4 h-4 animate-spin text-accent" />;
			case "completed":
				return <span className="text-green-500">✓</span>;
			case "error":
				return <span className="text-alert">✗</span>;
			case "cancelled":
				return <span className="text-text-muted">⏹</span>;
			default:
				return null;
		}
	};

	const getStatusColor = () => {
		switch (upload.status) {
			case "uploading":
				return "border-stroke";
			case "completed":
				return "border-green-500/50";
			case "error":
				return "border-alert/50";
			case "cancelled":
				return "border-text-muted/50";
			default:
				return "border-stroke";
		}
	};

	return (
		<div
			className={`bg-surface border ${getStatusColor()} rounded-xl p-4 shadow-lg backdrop-blur-sm`}
		>
			<div className="flex items-start justify-between gap-3">
				<div className="flex-1 min-w-0">
					<div className="flex items-center gap-2">
						{getStatusIcon()}
						<p className="text-sm font-medium text-text truncate">
							{upload.fileName}
						</p>
					</div>

					{upload.status === "uploading" && (
						<div className="mt-2">
							<div className="flex items-center justify-between text-xs text-text-muted mb-1">
								<span>Uploading {upload.type}...</span>
								<span>{upload.progress}%</span>
							</div>
							<div className="w-full h-1.5 bg-bg rounded-full overflow-hidden">
								<div
									className="h-full bg-accent transition-all duration-300"
									style={{ width: `${upload.progress}%` }}
								/>
							</div>
						</div>
					)}

					{upload.status === "completed" && (
						<p className="text-xs text-green-600 mt-1">Upload completed!</p>
					)}

					{upload.status === "error" && (
						<p className="text-xs text-alert mt-1">{upload.error}</p>
					)}

					{upload.status === "cancelled" && (
						<p className="text-xs text-text-muted mt-1">Upload cancelled</p>
					)}
				</div>

				{upload.status === "uploading" && (
					<button
						onClick={() => onCancel(upload.id)}
						className="text-text-muted hover:text-alert transition-colors"
						title="Cancel upload"
					>
						<Square className="w-4 h-4" />
					</button>
				)}

				{(upload.status === "error" ||
					upload.status === "completed" ||
					upload.status === "cancelled") && (
					<button
						onClick={() => onRemove(upload.id)}
						className="text-text-muted hover:text-text transition-colors"
						title="Dismiss"
					>
						<X className="w-4 h-4" />
					</button>
				)}
			</div>
		</div>
	);
}
