// components/orders/NoteModal.tsx
"use client";

import { useState } from "react";
import { X } from "lucide-react";

interface NoteModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSubmit: (note: string) => void;
	loading?: boolean;
	title?: string;
	placeholder?: string;
}

export default function NoteModal({
	isOpen,
	onClose,
	onSubmit,
	loading = false,
	title = "Add Note",
	placeholder = "Enter your note...",
}: NoteModalProps) {
	const [note, setNote] = useState("");

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (note.trim()) {
			onSubmit(note.trim());
			setNote("");
		}
	};

	const handleClose = () => {
		setNote("");
		onClose();
	};

	if (!isOpen) return null;

	return (
		<>
			{/* Backdrop */}
			<div className="fixed inset-0 bg-black/50 z-50" onClick={handleClose} />

			{/* Modal */}
			<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
				<div className="bg-bg border border-stroke rounded-lg w-full max-w-md">
					<div className="p-6">
						{/* Header */}
						<div className="flex items-center justify-between mb-4">
							<h3 className="text-lg font-semibold text-text">{title}</h3>
							<button
								onClick={handleClose}
								className="p-1 hover:bg-surface rounded-lg transition-colors"
								disabled={loading}
							>
								<X className="w-5 h-5 text-text-muted" />
							</button>
						</div>

						{/* Form */}
						<form onSubmit={handleSubmit} className="space-y-4">
							<div>
								<label className="block text-sm font-medium text-text mb-2">
									Note <span className="text-cta">*</span>
								</label>
								<textarea
									value={note}
									onChange={(e) => setNote(e.target.value)}
									placeholder={placeholder}
									rows={4}
									className="w-full px-3 py-2 bg-background border border-stroke rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cta/20 focus:border-cta resize-none"
									required
									disabled={loading}
								/>
							</div>

							{/* Actions */}
							<div className="flex items-center gap-3 pt-4">
								<button
									type="button"
									onClick={handleClose}
									className="flex-1 px-4 py-2 text-sm font-medium text-text-muted hover:text-text transition-colors"
									disabled={loading}
								>
									Cancel
								</button>
								<button
									type="submit"
									disabled={loading || !note.trim()}
									className="flex-1 px-4 py-2 bg-cta hover:bg-cta/90 disabled:bg-stroke disabled:text-text-muted text-black font-heading font-semibold rounded-lg transition-colors disabled:cursor-not-allowed"
								>
									{loading ? "Adding..." : "Add Note"}
								</button>
							</div>
						</form>
					</div>
				</div>
			</div>
		</>
	);
}
