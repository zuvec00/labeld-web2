/* eslint-disable @typescript-eslint/no-explicit-any */
import { collection, addDoc, query, where, getDocs, serverTimestamp } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { NewsletterSubscription } from "@/lib/models/newsletter";
// import { NewsletterSubscription } from "@/lib/models/newsletter";

export async function subscribeToNewsletter(email: string, source: "footer" | "popup" | "other" = "footer"): Promise<{ success: boolean; message: string }> {
	try {
		// Check if email already exists
		const newsletterRef = collection(db, "newsletter_subscriptions");
		const q = query(newsletterRef, where("email", "==", email.toLowerCase().trim()));
		const querySnapshot = await getDocs(q);
		
		if (!querySnapshot.empty) {
			return {
				success: false,
				message: "This email is already subscribed to our newsletter."
			};
		}

		// Add new subscription
		const subscription: Omit<NewsletterSubscription, "id"> = {
			email: email.toLowerCase().trim(),
			createdAt: serverTimestamp() as any,
			status: "active",
			source
		};

		await addDoc(newsletterRef, subscription);
		
		return {
			success: true,
			message: "Successfully subscribed to our newsletter!"
		};
	} catch (error) {
		console.error("Error subscribing to newsletter:", error);
		return {
			success: false,
			message: "An error occurred. Please try again later."
		};
	}
}

export async function getAllNewsletterSubscriptions(): Promise<NewsletterSubscription[]> {
	try {
		const newsletterRef = collection(db, "newsletter_subscriptions");
		const q = query(newsletterRef);
		const querySnapshot = await getDocs(q);
		
		const subscriptions: NewsletterSubscription[] = [];
		querySnapshot.forEach((doc) => {
			const data = doc.data() as Omit<NewsletterSubscription, "id">;
			subscriptions.push({
				id: doc.id,
				...data,
			});
		});
		
		return subscriptions;
	} catch (error) {
		console.error("Error fetching newsletter subscriptions:", error);
		throw error;
	}
}
