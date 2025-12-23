import { db } from "./firebaseConfig";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { PageVisit } from "@/lib/types/pageVisit";

export const logPageVisit = async (visit: Omit<PageVisit, 'id' | 'timestamp'>) => {
  try {
    const pageVisitsRef = collection(db, "page_visits");
    await addDoc(pageVisitsRef, {
      ...visit,
      timestamp: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error logging page visit:", error);
  }
};
