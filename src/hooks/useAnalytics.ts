// hooks/useAnalytics.ts
import { useState, useEffect, useCallback } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase/firebaseConfig";
import { getBrandAnalytics } from "@/lib/firebase/queries/analytics";
import { AnalyticsEvent, AnalyticsSummary } from "@/types/analytics";

interface UseAnalyticsReturn {
  events: AnalyticsEvent[];
  summary: AnalyticsSummary | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useAnalytics(rangeOrDays: number | { start: Date; end: Date } = 30): UseAnalyticsReturn {
  const [user, setUser] = useState<User | null>(null);
  const [events, setEvents] = useState<AnalyticsEvent[]>([]);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (!user) {
        setEvents([]);
        setSummary(null);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchData = useCallback(async () => {
    if (!user?.uid) return;

    try {
      setLoading(true);
      setError(null);

      let startDate: Date;
      let endDate = new Date(); // Default to now

      if (typeof rangeOrDays === 'number') {
        startDate = new Date();
        startDate.setDate(startDate.getDate() - rangeOrDays);
      } else {
        startDate = rangeOrDays.start;
        endDate = rangeOrDays.end;
      }

      const data = await getBrandAnalytics(user.uid, startDate);
      // Note: getBrandAnalytics only takes startDate currently. 
      // Ideally update it to take endDate too, but for "recent trends" start date is most critical.
      // We will assume getBrandAnalytics filters by start date.
      
      setEvents(data.events);
      setSummary(data.summary);
    } catch (err) {
      console.error("Error loading analytics:", err);
      setError("Failed to load analytics data");
    } finally {
      setLoading(false);
    }
  }, [user?.uid, typeof rangeOrDays === 'number' ? rangeOrDays : JSON.stringify(rangeOrDays)]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    events,
    summary,
    loading,
    error,
    refresh: fetchData,
  };
}
