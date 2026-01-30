import { create } from "zustand";
import { EventOrganizerModel } from "@/lib/models/eventOrganizer";

// Helper type for onboarding (includes Files which aren't in the DB model)
export interface EventOrganizerOnboardingData {
	// Core Info
	organizerName: string;
	username: string; // Aligned with Model
	profileFile: File | null;
	coverFile: File | null;
	bio: string;
	eventCategory: string;
	
	// Location & Reach
	baseCity: string;
	activeSince: string;
	
	// Contact & Links
	email: string;
	phone: string;
	instagram: string;
	tiktok: string;
	twitter: string;
	website: string;
}

interface EventOrganizerStore {
	data: EventOrganizerOnboardingData;
	setData: (data: Partial<EventOrganizerOnboardingData>) => void;
	reset: () => void;
}

const initialState: EventOrganizerOnboardingData = {
	organizerName: "",
	username: "",
	profileFile: null,
	coverFile: null,
	bio: "",
	eventCategory: "",
	baseCity: "",
	activeSince: "",
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
