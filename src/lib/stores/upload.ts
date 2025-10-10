"use client";

import { create } from "zustand";

export interface BackgroundUpload {
	id: string;
	type: "image" | "video";
	fileName: string;
	progress: number;
	status: "uploading" | "completed" | "error" | "cancelled";
	error?: string;
	startTime: number;
	cancelController?: AbortController;
}

interface UploadState {
	uploads: BackgroundUpload[];
	
	// Actions
	addUpload: (upload: Omit<BackgroundUpload, "id" | "startTime">) => string;
	updateUpload: (id: string, updates: Partial<BackgroundUpload>) => void;
	removeUpload: (id: string) => void;
	clearCompleted: () => void;
	cancelUpload: (id: string) => void;
}

export const useUploadStore = create<UploadState>((set, get) => ({
	uploads: [],

	addUpload: (uploadData) => {
		const id = crypto.randomUUID();
		const upload: BackgroundUpload = {
			...uploadData,
			id,
			startTime: Date.now(),
			cancelController: new AbortController(),
		};

		set((state) => ({
			uploads: [...state.uploads, upload],
		}));

		return id;
	},

	updateUpload: (id, updates) => {
		set((state) => ({
			uploads: state.uploads.map((upload) =>
				upload.id === id ? { ...upload, ...updates } : upload
			),
		}));
	},

	removeUpload: (id) => {
		set((state) => ({
			uploads: state.uploads.filter((upload) => upload.id !== id),
		}));
	},

	clearCompleted: () => {
		set((state) => ({
			uploads: state.uploads.filter((upload) => upload.status !== "completed"),
		}));
	},

	cancelUpload: (id) => {
		const upload = get().uploads.find((u) => u.id === id);
		if (upload?.cancelController) {
			upload.cancelController.abort();
		}
		
		set((state) => ({
			uploads: state.uploads.map((upload) =>
				upload.id === id ? { ...upload, status: "cancelled" } : upload
			),
		}));
	},
}));
