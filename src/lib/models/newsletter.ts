import { Timestamp } from "firebase/firestore";

export interface NewsletterSubscription {
	id?: string; // Document ID
	email: string;
	createdAt: Timestamp | Date;
	status: "active" | "unsubscribed";
	source: "footer" | "popup" | "other";
}
