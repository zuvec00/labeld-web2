import { 
  collection, 
  query, 
  where, 
  getCountFromServer,
  getFirestore 
} from "firebase/firestore";

export interface TicketStats {
  totalTickets: number;
  checkedInTickets: number;
  activeTickets: number;
}

/**
 * Get ticket statistics for an event using Firestore aggregation queries
 * @param eventId - The event ID to get stats for
 * @returns Promise<TicketStats> - Object containing ticket counts
 */
export async function getEventTicketStats(eventId: string): Promise<TicketStats> {
  const db = getFirestore();
  const attendeeTicketsRef = collection(db, "attendeeTickets");

  try {
    // Get total tickets for this event
    const totalQuery = query(
      attendeeTicketsRef,
      where("eventId", "==", eventId)
    );
    const totalSnapshot = await getCountFromServer(totalQuery);
    const totalTickets = totalSnapshot.data().count;

    // Get checked-in tickets (status === "used")
    const checkedInQuery = query(
      attendeeTicketsRef,
      where("eventId", "==", eventId),
      where("status", "==", "used")
    );
    const checkedInSnapshot = await getCountFromServer(checkedInQuery);
    const checkedInTickets = checkedInSnapshot.data().count;

    // Get active tickets (status === "active")
    const activeQuery = query(
      attendeeTicketsRef,
      where("eventId", "==", eventId),
      where("status", "==", "active")
    );
    const activeSnapshot = await getCountFromServer(activeQuery);
    const activeTickets = activeSnapshot.data().count;

    return {
      totalTickets,
      checkedInTickets,
      activeTickets,
    };
  } catch (error) {
    console.error("Error getting ticket stats:", error);
    // Return zero counts on error
    return {
      totalTickets: 0,
      checkedInTickets: 0,
      activeTickets: 0,
    };
  }
}

/**
 * Get ticket statistics for multiple events in batch
 * @param eventIds - Array of event IDs to get stats for
 * @returns Promise<Record<string, TicketStats>> - Map of eventId to ticket stats
 */
export async function getMultipleEventTicketStats(
  eventIds: string[]
): Promise<Record<string, TicketStats>> {
  const stats: Record<string, TicketStats> = {};
  
  // Process events in parallel for better performance
  const promises = eventIds.map(async (eventId) => {
    const eventStats = await getEventTicketStats(eventId);
    stats[eventId] = eventStats;
  });

  await Promise.all(promises);
  return stats;
}
