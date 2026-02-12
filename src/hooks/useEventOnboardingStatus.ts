import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useWallet } from "./useWallet";
import { useDashboardContext } from "./useDashboardContext";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/firebaseConfig";
import { useAuth } from "@/lib/auth/AuthContext";
import { listMyEventsLite } from "@/lib/firebase/queries/event";
import { countTicketTypes } from "@/lib/firebase/queries/event";

export type EventOnboardingStepId = "bank" | "profile" | "event" | "tickets";

export interface EventOnboardingStep {
	id: EventOnboardingStepId;
	title: string;
	description: string;
	isComplete: boolean;
	cta: string;
	href: string;
	actionType?: "link" | "modal";
}

export interface EventOnboardingStatus {
	steps: EventOnboardingStep[];
	percentage: number;
	isComplete: boolean;
	loading: boolean;
}

export function useEventOnboardingStatus(): EventOnboardingStatus {
	const { user } = useAuth();
	const { roleDetection } = useDashboardContext();
	const { walletData, loading: walletLoading } = useWallet();

	// 1. Organizer Profile
	const { data: organizerData, isLoading: organizerLoading } = useQuery({
		queryKey: ["eventOrganizer", user?.uid],
		queryFn: async () => {
			if (!user?.uid) return null;
			const snap = await getDoc(doc(db, "eventOrganizers", user.uid));
			return snap.exists() ? snap.data() : null;
		},
		enabled: !!user?.uid,
		staleTime: 1000 * 60 * 5, // 5 minutes
	});

	// 2. Events Count & First Event ID
	const { data: eventsData, isLoading: eventsLoading } = useQuery({
		queryKey: ["myEventsLite", user?.uid],
		queryFn: async () => {
			if (!user?.uid) return { count: 0, firstId: null };
			const events = await listMyEventsLite(user.uid);
			return {
				count: events.length,
				firstId: events.length > 0 ? events[0].id : null,
				events: events, // store full list if needed later
			};
		},
		enabled: !!user?.uid,
		staleTime: 1000 * 60 * 2, // 2 minutes
	});

	// 3. Ticket Types
	const { data: hasTicketTypes, isLoading: ticketTypesLoading } = useQuery({
		queryKey: ["hasTicketTypes", user?.uid, eventsData?.count],
		queryFn: async () => {
			if (!user?.uid || !eventsData?.events?.length) return false;
			
			// Check specifically the first few events or all? 
			// Original logic checked all until found.
			for (const event of eventsData.events) {
				const count = await countTicketTypes(event.id);
				if (count > 0) return true;
			}
			return false;
		},
		enabled: !!user?.uid && (eventsData?.count ?? 0) > 0,
		staleTime: 1000 * 60 * 2, // 2 minutes
	});

	if (!user) {
		return {
			steps: [],
			percentage: 0,
			isComplete: false,
			loading: true,
		};
	}

	const organizer = roleDetection; // context data
	const hasOrganizerDoc = !!organizer?.organizerName || !!organizerData;
	const organizerPhone = organizerData?.phone || null;
	const isProfileComplete = !!(hasOrganizerDoc && organizerPhone);

	const eventsCount = eventsData?.count ?? 0;
	const firstEventId = eventsData?.firstId ?? null;
	const isEventComplete = eventsCount > 0;

	const isTicketsComplete = !!hasTicketTypes;

	// 1. Bank Account (shared with brand)
	const isBankComplete = !!walletData.summary?.payout?.bank?.isVerified;

	const steps: EventOnboardingStep[] = [
		{
			id: "bank",
			title: "Add bank details to receive payments",
			description: "This will allow you to start collecting payments from ticket sales.",
			isComplete: isBankComplete,
			cta: "Add Bank Details",
			href: "/wallet",
		},
		{
			id: "profile",
			title: hasOrganizerDoc ? "Add Phone Number" : "Create your organizer profile",
			description: hasOrganizerDoc
				? "Update your profile with a phone number to complete setup"
				: "Set up your event organizer identity and profile to get started",
			isComplete: isProfileComplete,
			cta: hasOrganizerDoc ? "Update Profile" : "Setup Organizer",
			href: hasOrganizerDoc ? "/organizer-space/edit" : "/organizer-space",
		},
		{
			id: "event",
			title: "Create your first event",
			description: "Create an event to start selling tickets and managing attendees",
			isComplete: isEventComplete,
			cta: isProfileComplete ? "Create Event" : "Complete Profile First",
			href: isProfileComplete ? "/events/create/details" : (hasOrganizerDoc ? "/organizer-space/edit" : "/organizer-space"),
		},
		{
			id: "tickets",
			title: "Add ticket types to your event",
			description: "Create ticket types with pricing so people can purchase tickets",
			isComplete: isTicketsComplete,
			cta: isTicketsComplete ? "Manage Tickets" : (isEventComplete ? "Add Tickets" : "Create Event First"),
			href: isEventComplete
				? `/events/${firstEventId}/tickets`
				: (isProfileComplete ? "/events/create/details" : "/organizer-space"),
		},
	];

	const completedCount = steps.filter((s) => s.isComplete).length;
	const percentage = Math.round((completedCount / steps.length) * 100);
	const isComplete = completedCount === steps.length;

	// Global loading state
	const loading = walletLoading || organizerLoading || eventsLoading || ticketTypesLoading;

	return {
		steps,
		percentage,
		isComplete,
		loading,
	};
}

