// hooks/useTimeline.ts
import { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/firebaseConfig";
import { TimelineEvent } from "@/types/orders";

export function useTimeline(orderId: string) {
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) {
      setTimeline([]);
      setLoading(false);
      return;
    }

    const timelineRef = collection(db, "orders", orderId, "timeline");
    const q = query(timelineRef, orderBy("at", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const events: TimelineEvent[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          events.push({
            type: data.type,
            actor: data.actor,
            message: data.message,
            meta: data.meta,
            at: data.at,
          });
        });
        setTimeline(events);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error("Error fetching timeline:", err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [orderId]);

  return { timeline, loading, error };
}
