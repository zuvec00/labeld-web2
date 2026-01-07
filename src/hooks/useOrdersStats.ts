import { useState, useEffect, useCallback } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, db } from "@/lib/firebase/firebaseConfig";
import { collection, query, where, getDocs, Timestamp, orderBy } from "firebase/firestore";
import { getStoreOrderCounts } from "@/lib/firebase/queries/storeOrders";
import { getMultipleEventTicketStats, TicketStats } from "@/lib/firebase/queries/attendeeTickets";
import { VendorScope } from "@/types/orders";
import { getVendorScope } from "@/lib/firebase/queries/orders";

export interface StoreStats {
    awaiting_fulfillment: number;
    unpaid: number;
    completed: number;
    total: number;
}

export interface EventStats {
    upcomingEventsCount: number;
    daysToNextEvent: number | null; // null if no upcoming events
    totalTicketsSold: number;
    totalCapacity: number | null; // null if unlimited total
    capacityUsedPercent: number;
}

interface UseOrdersStatsReturn {
    storeStats: StoreStats | null;
    eventStats: EventStats | null;
    loading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
}

export function useOrdersStats(): UseOrdersStatsReturn {
    const [user, setUser] = useState<User | null>(null);
    const [storeStats, setStoreStats] = useState<StoreStats | null>(null);
    const [eventStats, setEventStats] = useState<EventStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, setUser);
        return () => unsubscribe();
    }, []);

    const fetchStats = useCallback(async () => {
        if (!user) return;
        
        try {
            setLoading(true);
            setError(null);

            // 1. Fetch Store Stats
            const storeCounts = await getStoreOrderCounts(user.uid);
            setStoreStats(storeCounts);

            // 2. Fetch Event Stats
            // First get user's events to calculate "Upcoming" and get IDs for ticket stats
            const eventsQuery = query(
                collection(db, "events"),
                where("createdBy", "==", user.uid),
                orderBy("startAt", "asc") // Ascending to find next event easily
            );
            
            const eventsSnapshot = await getDocs(eventsQuery);
            const now = new Date();
            let upcomingCount = 0;
            let nextEventDate: Date | null = null;
            const eventIds: string[] = [];
            let totalCapacity = 0;
            let isCapacityUnlimited = false;

            eventsSnapshot.docs.forEach(doc => {
                const data = doc.data();
                const startAt = data.startAt?.toDate();
                eventIds.push(doc.id);

                if (startAt > now) {
                    upcomingCount++;
                    if (!nextEventDate) {
                        nextEventDate = startAt;
                    }
                }
                
                if (data.capacityMode === "unlimited") {
                    isCapacityUnlimited = true;
                } else {
                    totalCapacity += (data.capacityTotal || 0);
                }
            });

            // Calculate days to next event
            let daysToNextEvent = null;
            if (nextEventDate) {
                const diffTime = Math.abs((nextEventDate as Date).getTime() - now.getTime());
                daysToNextEvent = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
            }

            // Get Ticket Stats for capacity usage
            let totalTicketsSold = 0;
            if (eventIds.length > 0) {
                const ticketStatsMap = await getMultipleEventTicketStats(eventIds);
                Object.values(ticketStatsMap).forEach(stat => {
                    totalTicketsSold += stat.totalTickets;
                });
            }

            const capacityUsedPercent = isCapacityUnlimited || totalCapacity === 0 
                ? 0 
                : Math.round((totalTicketsSold / totalCapacity) * 100);

            setEventStats({
                upcomingEventsCount: upcomingCount,
                daysToNextEvent,
                totalTicketsSold,
                totalCapacity: isCapacityUnlimited ? null : totalCapacity,
                capacityUsedPercent
            });

        } catch (err) {
            console.error("Error fetching order stats:", err);
            setError(err instanceof Error ? err.message : "Failed to load stats");
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        if (user) {
            fetchStats();
        }
    }, [user, fetchStats]);

    return {
        storeStats,
        eventStats,
        loading,
        error,
        refresh: fetchStats
    };
}
