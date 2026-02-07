// hooks/useBookingSettings.ts
"use client";

import { useState, useEffect, useCallback } from "react";
import { BookingSettings, DEFAULT_BOOKING_SETTINGS } from "@/lib/models/booking";
import { 
  fetchBookingSettings, 
  updateBookingSettings as updateSettingsQuery,
  watchBookingSettings,
} from "@/lib/firebase/queries/bookings";

export function useBookingSettings(organizerId: string | null, realtime: boolean = true) {
  const [settings, setSettings] = useState<BookingSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!organizerId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    if (realtime) {
      // Use real-time listener
      const unsubscribe = watchBookingSettings(
        organizerId,
        (updatedSettings) => {
          setSettings(updatedSettings || {
            ...DEFAULT_BOOKING_SETTINGS,
            organizerId,
          });
          setLoading(false);
        },
        (err) => {
          console.error("Error in booking settings listener:", err);
          setError(err.message);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } else {
      // One-time fetch
      fetchBookingSettings(organizerId)
        .then((fetchedSettings) => {
          setSettings(fetchedSettings || {
            ...DEFAULT_BOOKING_SETTINGS,
            organizerId,
          });
          setLoading(false);
        })
        .catch((err) => {
          console.error("Error fetching booking settings:", err);
          setError(err.message);
          setLoading(false);
        });
    }
  }, [organizerId, realtime]);

  const updateSettings = useCallback(async (patch: Partial<BookingSettings>) => {
    if (!organizerId) {
      throw new Error("No organizer ID provided");
    }

    setSaving(true);
    setError(null);

    try {
      await updateSettingsQuery(organizerId, patch);
      setSaving(false);
    } catch (err) {
      console.error("Error updating booking settings:", err);
      setError(err instanceof Error ? err.message : "Failed to update settings");
      setSaving(false);
      throw err;
    }
  }, [organizerId]);

  return {
    settings,
    loading,
    error,
    saving,
    updateSettings,
  };
}
