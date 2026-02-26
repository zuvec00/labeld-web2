import { Timestamp } from "firebase/firestore";

export type FeatureRequestStatus = "Under Review" | "Planned" | "In Progress" | "Completed";

export interface FeatureRequest {
	id?: string;
	userId: string;
	brandId?: string; // Optional if submitted by brand
	organizerId?: string; // Optional if submitted by organizer
	title: string;
	description: string;
	status: FeatureRequestStatus;
	createdAt: Timestamp | Date | number | any;
}
