/* === Drop-in replacement: MultiImagePicker.tsx (or inline at bottom of page) === */

import { useMemo, useState } from "react";

const MAX_GALLERY = 4;

export function MultiImagePicker({
	existingUrls,
	files,
	onPick,
	onClearExisting,
	onRemoveExisting,
	maxFiles = 4,
}: {
	existingUrls: string[];
	files: File[];
	onPick: (next: File[]) => void; // replace current files
	onClearExisting: () => void; // clear server URLs
	onRemoveExisting: (url: string) => void; // remove a single server URL
	maxFiles?: number;
}) {
	const [msg, setMsg] = useState<string | null>(null);

	const totalCount = (existingUrls?.length || 0) + (files?.length || 0);
	const slotsLeft = Math.max(0, maxFiles - totalCount);

	const previews = useMemo(
		() => [...existingUrls, ...files.map((f) => URL.createObjectURL(f))],
		[existingUrls, files]
	);

	function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
		const picked = Array.from(e.target.files ?? []);
		if (!picked.length) return;

		if (slotsLeft <= 0) {
			setMsg(`You can only upload up to ${maxFiles} images.`);
			e.currentTarget.value = "";
			return;
		}

		const limited = picked.slice(0, slotsLeft); // enforce cap
		// append to current local files (keep existingUrls separate)
		onPick([...files, ...limited]);

		if (picked.length > limited.length) {
			setMsg(
				`Only ${slotsLeft} more image${
					slotsLeft === 1 ? "" : "s"
				} allowed (max ${maxFiles}).`
			);
		} else {
			setMsg(null);
		}

		e.currentTarget.value = "";
	}

	function removeLocalAt(i: number) {
		const next = files.filter((_, idx) => idx !== i);
		onPick(next);
	}

	function clearAllLocal() {
		onPick([]);
	}

	return (
		<div className="rounded-2xl border border-stroke bg-surface p-4">
			{/* dashed picker zone */}
			<label className="block">
				<div className="border border-dashed border-stroke/70 rounded-xl p-4 text-center cursor-pointer hover:bg-bg">
					<div className="text-sm text-text">
						Upload extra angles, close-ups, or detail shots to show off the
						piece&apos;s vibe.
					</div>
					<div className="text-xs text-text-muted mt-1">
						{totalCount} / {maxFiles} selected
					</div>
				</div>
				<input
					type="file"
					accept="image/*"
					multiple
					className="sr-only"
					onChange={handleInput}
				/>
			</label>

			{/* thumbnails */}
			{previews.length > 0 && (
				<>
					<div className="mt-3 h-16 overflow-x-auto">
						<div className="flex items-center gap-2">
							{/* existing first */}
							{existingUrls.map((url) => (
								<div key={url} className="relative">
									<img
										src={url}
										alt=""
										className="h-16 w-16 rounded-lg object-cover border border-stroke"
									/>
									<button
										type="button"
										className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-black/75 text-white text-sm leading-6"
										title="Remove"
										onClick={() => onRemoveExisting(url)}
									>
										×
									</button>
								</div>
							))}
							{/* local files after */}
							{files.map((f, i) => {
								const url = URL.createObjectURL(f);
								return (
									<div key={`${f.name}-${i}`} className="relative">
										<img
											src={url}
											alt=""
											className="h-16 w-16 rounded-lg object-cover border border-stroke"
										/>
										<button
											type="button"
											className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-black/75 text-white text-sm leading-6"
											title="Remove"
											onClick={() => removeLocalAt(i)}
										>
											×
										</button>
									</div>
								);
							})}
						</div>
					</div>

					{/* clear actions */}
					<div className="mt-2 flex items-center gap-3">
						{files.length > 0 && (
							<button
								type="button"
								onClick={clearAllLocal}
								className="text-alert text-sm border border-alert/30 rounded-lg px-2.5 py-1 hover:bg-alert/5"
							>
								Clear local
							</button>
						)}
						{existingUrls.length > 0 && (
							<button
								type="button"
								onClick={onClearExisting}
								className="text-alert text-sm border border-alert/30 rounded-lg px-2.5 py-1 hover:bg-alert/5"
							>
								Clear current
							</button>
						)}
					</div>
				</>
			)}

			{msg && <div className="text-xs text-alert mt-2">{msg}</div>}
		</div>
	);
}
