import { Timestamp } from "firebase/firestore";

export type AnnouncementType = "New" | "Update" | "Fix" | "Promo";

export interface Announcement {
	id?: string;
	title: string;
	content: string;
	type: AnnouncementType;
	createdAt: Timestamp | Date | number | any;
	isActive: boolean;
}
