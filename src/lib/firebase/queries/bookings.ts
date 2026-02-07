// lib/firebase/queries/bookings.ts
import {
  collection,
  doc,
  query,
  where,
  orderBy,
  onSnapshot,
  getDoc,
  getDocs,
  updateDoc,
  setDoc,
  Timestamp,
  QueryConstraint,
} from "firebase/firestore";
import { db } from "@/lib/firebase/firebaseConfig";
import {
  BookingRequest,
  BookingSettings,
  BookingStatus,
  DEFAULT_BOOKING_SETTINGS,
  generateCheckInCode,
} from "@/lib/models/booking";

// Real-time listener for booking requests
export function watchBookingRequests(
  organizerId: string,
  onUpdate: (requests: BookingRequest[]) => void,
  onError: (error: Error) => void,
  statusFilter?: BookingStatus | "all"
): () => void {
  try {
    const constraints: QueryConstraint[] = [
      where("organizerId", "==", organizerId),
      orderBy("createdAt", "desc"),
    ];

    // Add status filter if provided and not "all"
    if (statusFilter && statusFilter !== "all") {
      constraints.unshift(where("status", "==", statusFilter));
    }

    const q = query(collection(db, "bookingRequests"), ...constraints);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const requests: BookingRequest[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as BookingRequest[];

        onUpdate(requests);
      },
      (error) => {
        console.error("Error watching booking requests:", error);
        onError(error);
      }
    );

    return unsubscribe;
  } catch (error) {
    console.error("Error setting up booking requests watcher:", error);
    onError(error instanceof Error ? error : new Error("Unknown error"));
    return () => {}; // Return no-op unsubscribe
  }
}

// Fetch booking requests (one-time fetch)
export async function fetchBookingRequests(
  organizerId: string,
  statusFilter?: BookingStatus | "all"
): Promise<BookingRequest[]> {
  try {
    const constraints: QueryConstraint[] = [
      where("organizerId", "==", organizerId),
      orderBy("createdAt", "desc"),
    ];

    if (statusFilter && statusFilter !== "all") {
      constraints.unshift(where("status", "==", statusFilter));
    }

    const q = query(collection(db, "bookingRequests"), ...constraints);
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as BookingRequest[];
  } catch (error) {
    console.error("Error fetching booking requests:", error);
    throw error;
  }
}

// Update booking request status
export async function updateBookingRequestStatus(
  requestId: string,
  status: BookingStatus,
  patch?: Partial<BookingRequest>
): Promise<void> {
  try {
    const requestRef = doc(db, "bookingRequests", requestId);
    
    const updateData: any = {
      status,
      updatedAt: Timestamp.now(),
      ...patch,
    };

    // Add approval/decline metadata
    if (status === "approved") {
      updateData.internal = {
        ...patch?.internal,
        approvedAt: new Date().toISOString(),
      };
      
      // Generate check-in code if not provided
      if (!patch?.checkIn?.code) {
        updateData.checkIn = {
          code: generateCheckInCode(),
        };
      }
    } else if (status === "declined") {
      updateData.internal = {
        ...patch?.internal,
        declinedAt: new Date().toISOString(),
      };
    } else if (status === "checked_in") {
      updateData.checkIn = {
        ...patch?.checkIn,
        checkedInAt: new Date().toISOString(),
      };
    }

    await updateDoc(requestRef, updateData);
  } catch (error) {
    console.error("Error updating booking request status:", error);
    throw error;
  }
}

// Fetch booking settings
export async function fetchBookingSettings(
  organizerId: string
): Promise<BookingSettings | null> {
  try {
    const settingsRef = doc(db, "bookingSettings", organizerId);
    const settingsDoc = await getDoc(settingsRef);

    if (!settingsDoc.exists()) {
      return null;
    }

    return {
      organizerId,
      ...settingsDoc.data(),
    } as BookingSettings;
  } catch (error) {
    console.error("Error fetching booking settings:", error);
    throw error;
  }
}

// Update booking settings
export async function updateBookingSettings(
  organizerId: string,
  patch: Partial<BookingSettings>
): Promise<void> {
  try {
    const settingsRef = doc(db, "bookingSettings", organizerId);
    const settingsDoc = await getDoc(settingsRef);

    const updateData = {
      ...patch,
      organizerId,
      updatedAt: Timestamp.now(),
    };

    if (settingsDoc.exists()) {
      // Update existing settings
      await updateDoc(settingsRef, updateData);
    } else {
      // Create new settings with defaults
      await setDoc(settingsRef, {
        ...DEFAULT_BOOKING_SETTINGS,
        ...updateData,
        createdAt: Timestamp.now(),
      });
    }
  } catch (error) {
    console.error("Error updating booking settings:", error);
    throw error;
  }
}

// Watch booking settings for real-time updates
export function watchBookingSettings(
  organizerId: string,
  onUpdate: (settings: BookingSettings | null) => void,
  onError: (error: Error) => void
): () => void {
  try {
    const settingsRef = doc(db, "bookingSettings", organizerId);

    const unsubscribe = onSnapshot(
      settingsRef,
      (snapshot) => {
        if (snapshot.exists()) {
          onUpdate({
            organizerId,
            ...snapshot.data(),
          } as BookingSettings);
        } else {
          onUpdate(null);
        }
      },
      (error) => {
        console.error("Error watching booking settings:", error);
        onError(error);
      }
    );

    return unsubscribe;
  } catch (error) {
    console.error("Error setting up booking settings watcher:", error);
    onError(error instanceof Error ? error : new Error("Unknown error"));
    return () => {};
  }
}

// Search booking requests by guest name, phone, or check-in code
export async function searchBookingRequests(
  organizerId: string,
  searchTerm: string
): Promise<BookingRequest[]> {
  try {
    // Fetch all approved or checked_in requests for this organizer
    const q = query(
      collection(db, "bookingRequests"),
      where("organizerId", "==", organizerId),
      where("status", "in", ["approved", "checked_in"])
    );

    const snapshot = await getDocs(q);
    const requests = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as BookingRequest[];

    // Client-side filtering (Firestore doesn't support complex text search)
    const searchLower = searchTerm.toLowerCase();
    return requests.filter((request) => {
      const fullName = `${request.guest.firstName} ${request.guest.lastName}`.toLowerCase();
      const phone = request.guest.phone.toLowerCase();
      const code = request.checkIn?.code?.toLowerCase() || "";

      return (
        fullName.includes(searchLower) ||
        phone.includes(searchLower) ||
        code.includes(searchLower)
      );
    });
  } catch (error) {
    console.error("Error searching booking requests:", error);
    throw error;
  }
}

// Mark booking as checked in
export async function checkInBooking(requestId: string, checkedInBy?: string): Promise<void> {
  try {
    await updateBookingRequestStatus(requestId, "checked_in", {
      checkIn: {
        checkedInAt: new Date().toISOString(),
        checkedInBy,
      },
    });
  } catch (error) {
    console.error("Error checking in booking:", error);
    throw error;
  }
}
