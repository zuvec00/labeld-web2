import { db } from "./firebaseConfig";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export interface BrandRegistrationData {
	brandName: string;
	phone: string;
	email: string;
	socials: {
		tiktok?: string;
		instagram?: string;
	};
	description: string;
	visuals: {
		type: "file" | "link";
		data: string[] | { url: string; title?: string }[];
	};
	createdAt?: any;
	status: "pending" | "reviewed" | "approved" | "rejected";
}

export async function createBrandRegistration(data: Omit<BrandRegistrationData, "createdAt" | "status">) {
	try {
        const registrationData: BrandRegistrationData = {
            ...data,
            createdAt: serverTimestamp(),
            status: "pending"
        };
        
		const docRef = await addDoc(collection(db, "brand_registrations"), registrationData);
		return { success: true, id: docRef.id };
	} catch (error) {
		console.error("Error creating brand registration:", error);
		throw new Error("Failed to submit brand registration");
	}
}
