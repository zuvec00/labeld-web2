export type AttendeeTicketDoc = {
  id: string;
  eventId: string;
  orderId: string;
  ticketTypeId: string;
  ticketCode: string;
  status: "active" | "used" | "cancelled" | "refunded";
  attendeeUserId: string;
  attendeeEmail: string;
  attendeeName?: string;
  ticketTypeName: string;
  admitType?: "general" | "vip" | "backstage";
  priceMinor: number;
  currency: "NGN" | "USD";
  createdAt: any; // Firestore Timestamp
  usedAt?: any; // Firestore Timestamp
  usedBy?: string; // Staff member who scanned the ticket
  qrString: string; // Signed QR string for verification
};
