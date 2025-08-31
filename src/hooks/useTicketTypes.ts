import { useState, useEffect } from "react";
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

// Mock data
const mockTicketTypes: TicketTypeDoc[] = [
  {
    id: "ticket-1",
    name: "Nolly Solo Star",
    description: "This gives you access to the trivia night",
    price: 7000, // ₦70.00
    currency: "NGN",
    quantityTotal: 100,
    quantityRemaining: 45,
    admitType: "general",
    isActive: true,
    sortOrder: 1,
    kind: "single",
  },
  {
    id: "ticket-2",
    name: "Early Bird: Nolly Solo Star",
    description: "Access to the trivia night only.",
    price: 6000, // ₦60.00
    currency: "NGN",
    quantityTotal: 50,
    quantityRemaining: 0, // Sold out
    admitType: "general",
    isActive: true,
    sortOrder: 2,
    kind: "single",
  },
  {
    id: "ticket-3",
    name: "Early Bird: Nolly Crew",
    description: "The more the merrier, the more you save! This ticket admit 6 people and makes you a complete squad for the night",
    price: 32000, // ₦320.00
    currency: "NGN",
    quantityTotal: 20,
    quantityRemaining: 0, // Sold out
    admitType: "general",
    isActive: true,
    sortOrder: 3,
    kind: "group",
    groupSize: 6,
  },
  {
    id: "ticket-4",
    name: "Nolly Crew",
    description: "The more the merrier, the more you save! This ticket admit 6 people and makes you a complete squad for the night",
    price: 36000, // ₦360.00
    currency: "NGN",
    quantityTotal: 30,
    quantityRemaining: 12,
    admitType: "general",
    isActive: true,
    sortOrder: 4,
    kind: "group",
    groupSize: 6,
  },
];

export function useTicketTypes(eventId: string) {
  const [ticketTypes, setTicketTypes] = useState<TicketTypeDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Simulate API call
    const fetchTicketTypes = async () => {
      try {
        setLoading(true);
        // TODO: Replace with actual API call
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Filter active ticket types
        const activeTypes = mockTicketTypes.filter(ticket => ticket.isActive);
        setTicketTypes(activeTypes);
      } catch (err) {
        setError("Failed to fetch ticket types");
      } finally {
        setLoading(false);
      }
    };

    fetchTicketTypes();
  }, [eventId]);

  return { ticketTypes, loading, error };
}
