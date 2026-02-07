// hooks/useBookingRequests.ts
"use client";

import { useState, useEffect, useCallback } from "react";
import { BookingRequest, BookingStatus } from "@/lib/models/booking";
import { watchBookingRequests, updateBookingRequestStatus } from "@/lib/firebase/queries/bookings";

export function useBookingRequests(organizerId: string | null, statusFilter: BookingStatus | "all" = "all") {
  const [requests, setRequests] = useState<BookingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!organizerId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const unsubscribe = watchBookingRequests(
      organizerId,
      (updatedRequests) => {
        setRequests(updatedRequests);
        setLoading(false);
      },
      (err) => {
        console.error("Error in booking requests listener:", err);
        setError(err.message);
        setLoading(false);
      },
      statusFilter
    );

    return () => unsubscribe();
  }, [organizerId, statusFilter]);

  const updateStatus = useCallback(async (
    requestId: string,
    status: BookingStatus,
    patch?: Partial<BookingRequest>
  ) => {
    try {
      await updateBookingRequestStatus(requestId, status, patch);
    } catch (err) {
      console.error("Error updating booking status:", err);
      throw err;
    }
  }, []);

  return {
    requests,
    loading,
    error,
    updateStatus,
  };
}
