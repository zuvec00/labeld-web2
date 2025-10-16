import { create } from "zustand";

interface EventOrganizerData {
	// Core Info (Required)
	organizerName: string;
	organizerUsername: string;
	profileFile: File | null;
	coverFile: File | null;
	bio: string;
	eventCategory: string;
	
	// Location & Reach (Optional)
	baseCity: string;
	activeSince: string;
	
	// Contact & Links (Optional)
	email: string;
	phone: string;
	instagram: string;
	tiktok: string;
	twitter: string;
	website: string;
}

interface EventOrganizerStore {
	data: EventOrganizerData;
	setData: (data: Partial<EventOrganizerData>) => void;
	reset: () => void;
}

const initialState: EventOrganizerData = {
	// Core Info
	organizerName: "",
	organizerUsername: "",
	profileFile: null,
	coverFile: null,
	bio: "",
	eventCategory: "",
	
	// Location & Reach
	baseCity: "",
	activeSince: "",
	
	// Contact & Links
	email: "",
	phone: "",
	instagram: "",
	tiktok: "",
	twitter: "",
	website: "",
};

export const useEventOrganizerOnboard = create<EventOrganizerStore>((set) => ({
	data: initialState,
	setData: (newData) =>
		set((state) => ({
			data: { ...state.data, ...newData },
		})),
	reset: () => set({ data: initialState }),
}));
