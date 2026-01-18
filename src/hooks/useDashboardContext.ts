"use client";

import { useState, useEffect, useCallback } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, db } from "@/lib/firebase/firebaseConfig";
import { doc, onSnapshot } from "firebase/firestore";

export type DashboardRole = "brand" | "eventOrganizer";

interface RoleDetectionResult {
  hasEventOrganizerProfile: boolean;
  hasBrandProfile: boolean;
  hasPieces: boolean;
  hasEvents: boolean;
  brandName?: string;
  phoneNumber?: string | null;
  organizerName?: string;
  brandPhoneNumber?: string | null;
  brandSubscriptionTier?: "free" | "pro";
  brandSubscriptionStatus?: "active" | "expired" | "past_due" | "cancelled";
  brandBillingCycle?: "monthly" | "quarterly" | "biannual" | "annual";
  brandSubscriptionEndsAt?: Date;
  brandUsername?: string;
  brandSlug?: string;
  brandLogoUrl?: string;
  acquisitionSurvey?: {
    source: string;
    subSource?: string;
    otherDetail?: string;
    skipped?: boolean;
    respondedAt: Date;
  } | null;
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

    setLoading(true);

    // We need to manage subscriptions
    let unsubscribeBrand: (() => void) | undefined;
    let unsubscribeOrganizer: (() => void) | undefined;

    const setupListeners = async () => {
       const { db } = await import("@/lib/firebase/firebaseConfig");
       const { doc, onSnapshot } = await import("firebase/firestore");
       
       // Real-time listener for Event Organizer Profile
       unsubscribeOrganizer = onSnapshot(doc(db, "eventOrganizers", user.uid), async (snap) => {
           const hasEventOrganizerProfile = snap.exists();
           const organizerName = hasEventOrganizerProfile ? snap.data().organizerName : undefined;
           
           updateDetectionState((prev) => ({
               ...prev,
               hasEventOrganizerProfile,
               organizerName
           }));
       });

       // Real-time listener for Brand Profile
       unsubscribeBrand = onSnapshot(doc(db, "brands", user.uid), async (snap) => {
           const hasBrandProfile = snap.exists();
           const brandName = hasBrandProfile ? snap.data().brandName : undefined;
           const brandUsername = hasBrandProfile ? snap.data().username : undefined;
           const brandSlug = hasBrandProfile ? (snap.data().brandSlug || snap.data().username) : undefined;
           const brandLogoUrl = hasBrandProfile ? snap.data().logoUrl : undefined;
           const brandPhoneNumber = hasBrandProfile ? snap.data().phoneNumber : undefined;
           const brandSubscriptionTier = hasBrandProfile 
               ? (snap.data().subscriptionTier as "free" | "pro" | undefined) 
               : undefined;

           // Subscription Details
           const brandSubscriptionStatus = hasBrandProfile 
               ? (snap.data().subscriptionStatus as any) 
               : undefined;
           const brandBillingCycle = hasBrandProfile 
               ? (snap.data().billingCycle as any) 
               : undefined;
           
           // Handle Timestamp conversion safely
           const endsAtRaw = hasBrandProfile ? snap.data().subscriptionEndsAt : undefined;
           const brandSubscriptionEndsAt = endsAtRaw && typeof endsAtRaw.toDate === 'function' 
               ? endsAtRaw.toDate() 
               : undefined;

           // Acquisition Survey
           const surveyRaw = hasBrandProfile ? snap.data().acquisitionSurvey : undefined;
           const acquisitionSurvey = surveyRaw ? {
               ...surveyRaw,
               respondedAt: surveyRaw.respondedAt && typeof surveyRaw.respondedAt.toDate === 'function' 
                   ? surveyRaw.respondedAt.toDate() 
                   : (surveyRaw.respondedAt instanceof Date ? surveyRaw.respondedAt : new Date())
           } : undefined;

           updateDetectionState((prev) => ({
               ...prev,
               hasBrandProfile,
               brandName,
               brandUsername,
               brandSlug,
               brandLogoUrl,
               phoneNumber: brandPhoneNumber, 
               brandPhoneNumber,
               brandSubscriptionTier,
               brandSubscriptionStatus,
               brandBillingCycle,
               brandSubscriptionEndsAt,
               acquisitionSurvey
           }));
       });
       
       checkCounts(user.uid);
    };

    setupListeners();

    return () => {
        if (unsubscribeBrand) unsubscribeBrand();
        if (unsubscribeOrganizer) unsubscribeOrganizer();
    };
  }, [user?.uid]);

  // Helper to update state and derive active roles
  const updateDetectionState = (updater: (prev: RoleDetectionResult) => RoleDetectionResult) => {
      setRoleDetection(prev => {
          const defaultState: RoleDetectionResult = {
              hasEventOrganizerProfile: false,
              hasBrandProfile: false,
              hasPieces: false,
              hasEvents: false,
          };
          const newState = updater(prev || defaultState);
          
          // Re-calculate derived active roles if needed
          if (!prev) {
             // Initial load logic effectively
             let defaultRole: DashboardRole = "brand";
                if (newState.hasEventOrganizerProfile && (!newState.hasBrandProfile || !newState.hasPieces)) {
                    defaultRole = "eventOrganizer";
                } else if (newState.hasBrandProfile || newState.hasPieces) {
                    defaultRole = "brand";
                } else if (newState.hasEventOrganizerProfile || newState.hasEvents) {
                    defaultRole = "eventOrganizer";
                }
                setDetectedRole(defaultRole);
                if (typeof window !== 'undefined' && !localStorage.getItem(STORAGE_KEY)) {
                     setActiveRoleState(defaultRole);
                }
          }
          
          return newState;
      });
      setLoading(false);
  };

  const checkCounts = async (uid: string) => {
      try {
        const { collection, query, where, getCountFromServer } = await import("firebase/firestore");
        const { db } = await import("@/lib/firebase/firebaseConfig");

        const piecesQuery = query(collection(db, "dropProducts"), where("userId", "==", uid));
        const piecesCount = await getCountFromServer(piecesQuery);
        const hasPieces = piecesCount.data().count > 0;

        const eventsQuery = query(collection(db, "events"), where("createdBy", "==", uid));
        const eventsCount = await getCountFromServer(eventsQuery);
        const hasEvents = eventsCount.data().count > 0;

        updateDetectionState(prev => ({ ...prev, hasPieces, hasEvents }));
      } catch (err) {
          console.error("Error fetching counts", err);
      }
  };

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
