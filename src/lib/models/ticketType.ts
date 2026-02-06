export type AdmitType = "general" | "vip" | "backstage";

export type TicketTypeDoc = {
  id: string;                // doc id
  name: string;
  description?: string;
  price?: number;            // int (e.g. kobo)
  currency?: "NGN" | "USD";
  quantityTotal: number | null;        // null = unlimited
  quantityRemaining: number | null;    // initialize == quantityTotal
  salesWindow?: { startAt?: Date | null; endAt?: Date | null };
  admitType?: AdmitType;
  limits?: { perUserMax?: number | null };
  isActive: boolean;
  sortOrder: number;
  perks?: string[];          // List of perks included with the ticket
  // Optional UI conveniences
  kind?: "single" | "group";
  groupSize?: number;
  transferFeesToGuest?: boolean;
};
