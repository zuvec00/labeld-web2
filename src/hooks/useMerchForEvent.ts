import { useState, useEffect } from "react";
import { collection, query, where, orderBy, getDocs, getFirestore } from "firebase/firestore";

export type MerchItemDoc = {
  id: string;
  eventId?: string | null;
  brandId: string;
  name: string;
  images: { url: string; alt?: string }[];
  priceMinor: number;
  currency: "NGN" | "USD";
  stockTotal: number | null;
  stockRemaining: number | null;
  sizeOptions?: string[];
  colorOptions?: string[];
  isActive: boolean;
  visibility?: "public" | "hidden";
  createdAt?: any;
  updatedAt?: any;
};

export function useMerchForEvent(eventId: string) {
  const [merchItems, setMerchItems] = useState<MerchItemDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMerch = async () => {
      if (!eventId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const db = getFirestore();
        const merchRef = collection(db, "merchItems");
        
        // Query for active merch items for this event
        const q = query(
          merchRef,
          where("eventId", "==", eventId),
          where("isActive", "==", true),
          where("visibility", "==", "public"),
          orderBy("createdAt", "desc")
        );

        const querySnapshot = await getDocs(q);
        
        const fetchedMerchItems: MerchItemDoc[] = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            eventId: data.eventId || null,
            brandId: data.brandId || "",
            name: data.name || "",
            images: data.images || [],
            priceMinor: data.priceMinor || 0,
            currency: data.currency || "NGN",
            stockTotal: data.stockTotal || null,
            stockRemaining: data.stockRemaining || null,
            sizeOptions: data.sizeOptions || [],
            colorOptions: data.colorOptions || [],
            isActive: data.isActive || false,
            visibility: data.visibility || "hidden",
            createdAt: data.createdAt || null,
            updatedAt: data.updatedAt || null,
          };
        });

        setMerchItems(fetchedMerchItems);
      } catch (err) {
        console.error("Error fetching merch items:", err);
        setError("Failed to fetch merch items. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchMerch();
  }, [eventId]);

  return { merchItems, loading, error };
}
