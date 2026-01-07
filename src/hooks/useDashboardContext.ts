// hooks/useDashboardContext.ts
"use client";

import { useState, useEffect, useCallback } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, db } from "@/lib/firebase/firebaseConfig";
import { doc, getDoc, collection, query, where, getCountFromServer } from "firebase/firestore";

export type DashboardRole = "brand" | "eventOrganizer";

interface RoleDetectionResult {
  hasEventOrganizerProfile: boolean;
  hasBrandProfile: boolean;
  hasPieces: boolean;
  hasEvents: boolean;
  brandName?: string;
  organizerName?: string;
}

interface UseDashboardContextReturn {
  user: User | null;
  loading: boolean;
  activeRole: DashboardRole;
  setActiveRole: (role: DashboardRole) => void;
  detectedRole: DashboardRole;
  roleDetection: RoleDetectionResult | null;
  canSwitchRoles: boolean;
}

const STORAGE_KEY = "labeld-dashboard-role";

export function useDashboardContext(): UseDashboardContextReturn {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeRole, setActiveRoleState] = useState<DashboardRole>("brand");
  const [detectedRole, setDetectedRole] = useState<DashboardRole>("brand");
  const [roleDetection, setRoleDetection] = useState<RoleDetectionResult | null>(null);

  // Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Role detection logic
  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    const detectRole = async () => {
      try {
        setLoading(true);

        // Check for event organizer profile
        const eventOrganizerRef = doc(db, "eventOrganizers", user.uid);
        const eventOrganizerSnap = await getDoc(eventOrganizerRef);
        const hasEventOrganizerProfile = eventOrganizerSnap.exists();
        const organizerName = hasEventOrganizerProfile ? eventOrganizerSnap.data().organizerName : undefined;

        // Check for brand profile
        const brandRef = doc(db, "brands", user.uid);
        const brandSnap = await getDoc(brandRef);
        const hasBrandProfile = brandSnap.exists();
        const brandName = hasBrandProfile ? brandSnap.data().brandName : undefined;

        // Check for pieces (products)
        const piecesQuery = query(
          collection(db, "dropProducts"),
          where("userId", "==", user.uid)
        );
        const piecesCount = await getCountFromServer(piecesQuery);
        const hasPieces = piecesCount.data().count > 0;

        // Check for events
        const eventsQuery = query(
          collection(db, "events"),
          where("createdBy", "==", user.uid)
        );
        const eventsCount = await getCountFromServer(eventsQuery);
        const hasEvents = eventsCount.data().count > 0;

        const detection: RoleDetectionResult = {
          hasEventOrganizerProfile,
          hasBrandProfile,
          hasPieces,
          hasEvents,
          brandName,
          organizerName,
        };
        setRoleDetection(detection);

        // Determine default role based on detection
        // Event Organizer if: has organizer profile AND (no brand profile OR no pieces)
        // Brand if: has brand profile OR has pieces
        let defaultRole: DashboardRole = "brand";

        if (hasEventOrganizerProfile && (!hasBrandProfile || !hasPieces)) {
          defaultRole = "eventOrganizer";
        } else if (hasBrandProfile || hasPieces) {
          defaultRole = "brand";
        } else if (hasEventOrganizerProfile || hasEvents) {
          defaultRole = "eventOrganizer";
        }

        setDetectedRole(defaultRole);

        // Check localStorage for saved preference
        const savedRole = localStorage.getItem(STORAGE_KEY) as DashboardRole | null;
        
        // Only use saved role if user has access to that role
        if (savedRole) {
          const canUseSavedRole = 
            (savedRole === "brand" && (hasBrandProfile || hasPieces)) ||
            (savedRole === "eventOrganizer" && (hasEventOrganizerProfile || hasEvents));
          
          if (canUseSavedRole) {
            setActiveRoleState(savedRole);
          } else {
            setActiveRoleState(defaultRole);
          }
        } else {
          setActiveRoleState(defaultRole);
        }

      } catch (error) {
        console.error("Error detecting dashboard role:", error);
        setActiveRoleState("brand"); // Fallback to brand
        setDetectedRole("brand");
      } finally {
        setLoading(false);
      }
    };

    detectRole();
  }, [user?.uid]);

  // Set active role with persistence
  const setActiveRole = useCallback((role: DashboardRole) => {
    setActiveRoleState(role);
    localStorage.setItem(STORAGE_KEY, role);
  }, []);

  // Determine if user can switch between roles
  const canSwitchRoles = Boolean(
    roleDetection &&
    (roleDetection.hasBrandProfile || roleDetection.hasPieces) &&
    (roleDetection.hasEventOrganizerProfile || roleDetection.hasEvents)
  );

  return {
    user,
    loading,
    activeRole,
    setActiveRole,
    detectedRole,
    roleDetection,
    canSwitchRoles,
  };
}
