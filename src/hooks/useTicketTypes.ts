import { useState, useEffect } from "react";
import { collection, query, where, orderBy, getDocs, getFirestore } from "firebase/firestore";
import { AdmitType } from "./useCheckoutCart";

export type TicketTypeDoc = {
  id: string;
  name: string;
  description?: string;
  price?: number; // minor (kobo/cents)
  currency?: "NGN" | "USD";
  quantityTotal: number | null; // null = unlimited
  quantityRemaining: number | null;
  salesWindow?: { startAt?: Date | null; endAt?: Date | null };
  admitType?: AdmitType;
  limits?: { perUserMax?: number | null };
  isActive: boolean;
  sortOrder: number;
  kind?: "single" | "group";
  groupSize?: number;
  transferFeesToGuest?: boolean;
};

export function useTicketTypes(eventId: string) {
  const [ticketTypes, setTicketTypes] = useState<TicketTypeDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTicketTypes = async () => {
      if (!eventId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const db = getFirestore();
        const ticketTypesRef = collection(db, "events", eventId, "ticketTypes");
        
        // Query for active ticket types, ordered by sortOrder
        const q = query(
          ticketTypesRef,
          where("isActive", "==", true),
          orderBy("sortOrder", "asc")
        );

        const querySnapshot = await getDocs(q);
        
        const fetchedTicketTypes: TicketTypeDoc[] = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name || "",
            description: data.description || "",
            price: data.price || 0,
            currency: data.currency || "NGN",
            quantityTotal: data.quantityTotal || null,
            quantityRemaining: data.quantityRemaining || null,
            salesWindow: data.salesWindow || null,
            admitType: data.admitType || "general",
            limits: data.limits || {},
            isActive: data.isActive || false,
            sortOrder: data.sortOrder || 0,
            kind: data.kind || "single",
            groupSize: data.groupSize || null,
            transferFeesToGuest: data.transferFeesToGuest || false,
          };
        });

        setTicketTypes(fetchedTicketTypes);
      } catch (err) {
        console.error("Error fetching ticket types:", err);
        setError("Failed to fetch ticket types. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchTicketTypes();
  }, [eventId]);

  return { ticketTypes, loading, error };
}
