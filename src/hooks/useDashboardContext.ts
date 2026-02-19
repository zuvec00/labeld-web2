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
  organizerLogoUrl?: string;
  eventSubscriptionTier?: "free" | "pro";
  eventSlug?: string;
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

// Helper to determine the best role based on available data
function determineDefaultRole(state: RoleDetectionResult): DashboardRole {
  const hasBrandData = state.hasBrandProfile || state.hasPieces;
  const hasEventData = state.hasEventOrganizerProfile || state.hasEvents;

  // If user has brand data, prefer brand
  if (hasBrandData) return "brand";
  // If user only has event data, use event organizer
  if (hasEventData) return "eventOrganizer";
  // Default fallback (new user with no data yet)
  return "brand";
}

// Helper to validate if a stored role is valid for the user's current data
function isRoleValidForUser(role: DashboardRole, state: RoleDetectionResult): boolean {
  // Always allow switching to any role, even if profile doesn't exist yet (for onboarding)
  return true;
}

export function useDashboardContext(): UseDashboardContextReturn {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeRole, setActiveRoleState] = useState<DashboardRole>("brand");
  const [detectedRole, setDetectedRole] = useState<DashboardRole>("brand");
  const [roleDetection, setRoleDetection] = useState<RoleDetectionResult | null>(null);
  const [hasInitializedRole, setHasInitializedRole] = useState(false);

  // Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (!user) {
        // Reset state when user logs out
        setRoleDetection(null);
        setHasInitializedRole(false);
        setActiveRoleState("brand");
        setDetectedRole("brand");
      }
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
    let unsubscribeUser: (() => void) | undefined;

    const setupListeners = async () => {
       const { db } = await import("@/lib/firebase/firebaseConfig");
       const { doc, onSnapshot } = await import("firebase/firestore");

       // Real-time listener for User Profile (for Acquisition Survey & other user-level flags)
       unsubscribeUser = onSnapshot(doc(db, "users", user.uid), async (snap) => {
           const userData = snap.data();
           const surveyRaw = userData?.acquisitionSurvey;
           
           const acquisitionSurvey = surveyRaw ? {
               ...surveyRaw,
               respondedAt: surveyRaw.respondedAt && typeof surveyRaw.respondedAt.toDate === 'function' 
                   ? surveyRaw.respondedAt.toDate() 
                   : (surveyRaw.respondedAt instanceof Date ? surveyRaw.respondedAt : new Date())
           } : undefined;

           updateDetectionState((prev) => ({
               ...prev,
               acquisitionSurvey
           }));
       });
       
       // Real-time listener for Event Organizer Profile
       unsubscribeOrganizer = onSnapshot(doc(db, "eventOrganizers", user.uid), async (snap) => {
           const hasEventOrganizerProfile = snap.exists();
           const organizerName = hasEventOrganizerProfile ? snap.data().organizerName : undefined;
           const organizerLogoUrl = hasEventOrganizerProfile ? snap.data().logoUrl : undefined;
           
           // Extract subscription data (default to undefined -> handled as free in UI)
           const eventSubscriptionTier = hasEventOrganizerProfile 
               ? (snap.data().subscriptionTier as "free" | "pro" | undefined) 
               : undefined;
               
           // Extract slug (prefer 'slug' field, fallback to 'username')
           const eventSlug = hasEventOrganizerProfile 
               ? (snap.data().slug || snap.data().username) 
               : undefined;

           updateDetectionState((prev) => ({
               ...prev,
               hasEventOrganizerProfile,
               organizerName,
               organizerLogoUrl,
               eventSubscriptionTier,
               eventSlug
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
           }));
       });
       
       checkCounts(user.uid);
    };

    setupListeners();

    return () => {
        if (unsubscribeBrand) unsubscribeBrand();
        if (unsubscribeOrganizer) unsubscribeOrganizer();
        if (unsubscribeUser) unsubscribeUser();
    };
  }, [user?.uid]);

  // Helper to update state
  const updateDetectionState = (updater: (prev: RoleDetectionResult) => RoleDetectionResult) => {
      setRoleDetection(prev => {
          const defaultState: RoleDetectionResult = {
              hasEventOrganizerProfile: false,
              hasBrandProfile: false,
              hasPieces: false,
              hasEvents: false,
          };
          const newState = updater(prev || defaultState);
          return newState;
      });
      setLoading(false);
  };

  // Effect to set the active role based on detection results
  // This runs whenever roleDetection changes
  useEffect(() => {
    if (!roleDetection) return;

    // Only initialize once we have checked both profiles
    // (We wait until we have actual profile data, not just defaults)
    const hasCheckedProfiles = roleDetection.hasBrandProfile !== undefined || 
                                roleDetection.hasEventOrganizerProfile !== undefined;
    
    if (!hasCheckedProfiles) return;

    // Calculate the best role based on current data
    const bestRole = determineDefaultRole(roleDetection);
    setDetectedRole(bestRole);

    // Only set active role if not already initialized
    if (!hasInitializedRole) {
      // Check stored preference
      const storedRole = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) as DashboardRole | null : null;

      if (storedRole && isRoleValidForUser(storedRole, roleDetection)) {
        // Stored role is valid, use it
        setActiveRoleState(storedRole);
      } else {
        // No stored role or stored role is invalid (e.g., user had brand before, now only has event)
        setActiveRoleState(bestRole);
        // Clear invalid stored role and save the correct one
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEY, bestRole);
        }
      }

      setHasInitializedRole(true);
    } else {
      // Already initialized, but check if current activeRole is still valid
      // This handles the case where data loads in pieces
      const storedRole = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) as DashboardRole | null : null;
      if (storedRole && !isRoleValidForUser(storedRole, roleDetection)) {
        // Stored role became invalid (e.g., brand data was deleted), switch to valid role
        setActiveRoleState(bestRole);
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEY, bestRole);
        }
      }
    }
  }, [roleDetection, hasInitializedRole]);

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
  // Always allow switching to support cross-role adoption
  const canSwitchRoles = true;

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
