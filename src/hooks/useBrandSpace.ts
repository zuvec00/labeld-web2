// hooks/useBrandSpace.ts
import { useState, useEffect, useMemo, useRef } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase/firebaseConfig";
import { 
  collection, 
  query, 
  where, 
  getCountFromServer, 
  getDocs, 
  orderBy, 
  limit,
  Timestamp
} from "firebase/firestore";
import { db } from "@/lib/firebase/firebaseConfig";
import { getDateRange } from "@/lib/orders/helpers";

// Simple in-memory cache with TTL
const cache = new Map<string, { data: unknown; timestamp: number; ttl: number }>();

function getCachedData<T>(key: string): T | null {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < cached.ttl) {
    return cached.data as T;
  }
  cache.delete(key);
  return null;
}

function setCachedData<T>(key: string, data: T, ttlMs: number = 30000): void {
  cache.set(key, { data, timestamp: Date.now(), ttl: ttlMs });
}

export type BrandSpaceRange = "today" | "7days" | "30days" | "custom";

export interface BrandSpaceFilters {
  range: BrandSpaceRange;
  customDateRange?: { start: Date; end: Date };
}

export interface BrandSpaceKPIs {
  heatScore: number;
  heatTrend: "up" | "down" | "flat";
  followersCount: number;
  followersChange7d: number;
  piecesCount: number;
  piecesAvailable: number;
  collectionsCount: number;
  collectionsPublished: number;
  nextLaunchDate?: Date;
  postsCount: number;
  lastPostDate?: Date;
}

export interface EngagementData {
  totalInteractions: number;
  uniqueUsers: number;
  engagementPerPost: number;
  dailyBreakdown: Array<{
    date: string;
    discovery: number;
    product: number;
    social: number;
    linkouts: number;
  }>;
}

export interface ReactionsData {
  totalReactions: number;
  postsInRange: number;
  avgReactionsPerPost: number;
  postingStreak: number;
  postingCadence: Array<{
    date: string;
    hasPost: boolean;
  }>;
}

export interface CatalogItem {
  id: string;
  name: string;
  mainVisualUrl?: string;
  isAvailableNow: boolean;
  updatedAt: Date;
}

export interface ContentItem {
  id: string;
  caption?: string;
  teaserImageUrl?: string;
  visibility: "public" | "private";
  isPublished: boolean;
  reactionsCount: number; // Total count of all emoji reactions
  reactions?: Record<string, number>; // Raw reactions map with emoji keys
  createdAt: Date;
}

export interface BrandSpaceData {
  kpis: BrandSpaceKPIs;
  engagement: EngagementData;
  reactions: ReactionsData;
  catalogItems: CatalogItem[];
  recentContent: ContentItem[];
  heatLog: Array<{
    score: number;
    timestamp: Date;
  }>;
}

export function useBrandSpace(filters: BrandSpaceFilters) {
  const [user, setUser] = useState<User | null>(null);
  const [data, setData] = useState<BrandSpaceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingProgress, setLoadingProgress] = useState({
    kpis: false,
    engagement: false,
    reactions: false,
    catalog: false,
    content: false
  });
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });

    return () => unsubscribe();
  }, []);

  const dateRange = useMemo(() => {
    return getDateRange(filters.range, filters.customDateRange);
  }, [filters.range, filters.customDateRange]);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    const fetchBrandSpaceData = async () => {
      try {
        setLoading(true);
        setError(null);
        setLoadingProgress({
          kpis: false,
          engagement: false,
          reactions: false,
          catalog: false,
          content: false
        });

        const brandId = user.uid;

        // Initialize with empty data structure for progressive loading
        const initialData: BrandSpaceData = {
          kpis: {
            heatScore: 0,
            heatTrend: "flat",
            followersCount: 0,
            followersChange7d: 0,
            piecesCount: 0,
            piecesAvailable: 0,
            collectionsCount: 0,
            collectionsPublished: 0,
            postsCount: 0
          },
          engagement: {
            totalInteractions: 0,
            uniqueUsers: 0,
            engagementPerPost: 0,
            dailyBreakdown: []
          },
          reactions: {
            totalReactions: 0,
            postsInRange: 0,
            avgReactionsPerPost: 0,
            postingStreak: 0,
            postingCadence: []
          },
          catalogItems: [],
          recentContent: [],
          heatLog: []
        };

        setData(initialData);

        // 1. Load KPIs first (most critical)
        setLoadingProgress(prev => ({ ...prev, kpis: true }));
        const kpisData = await fetchKPIsData(brandId, dateRange);
        setData(prev => prev ? { ...prev, kpis: kpisData.kpis, heatLog: kpisData.heatLog } : null);
        setLoadingProgress(prev => ({ ...prev, kpis: false }));

        // 2. Load engagement data in parallel with catalog
        const [engagementData, catalogData] = await Promise.all([
          fetchEngagementData(brandId, dateRange),
          fetchCatalogData(brandId)
        ]);

        setLoadingProgress(prev => ({ ...prev, engagement: true }));
        setData(prev => prev ? { ...prev, engagement: engagementData } : null);
        setLoadingProgress(prev => ({ ...prev, engagement: false }));

        setLoadingProgress(prev => ({ ...prev, catalog: true }));
        setData(prev => prev ? { ...prev, catalogItems: catalogData } : null);
        setLoadingProgress(prev => ({ ...prev, catalog: false }));

        // 3. Load reactions and content in parallel
        const [reactionsData, contentData] = await Promise.all([
          fetchReactionsData(brandId, dateRange),
          fetchContentData(brandId)
        ]);

        setLoadingProgress(prev => ({ ...prev, reactions: true }));
        setData(prev => prev ? { ...prev, reactions: reactionsData } : null);
        setLoadingProgress(prev => ({ ...prev, reactions: false }));

        setLoadingProgress(prev => ({ ...prev, content: true }));
        setData(prev => prev ? { ...prev, recentContent: contentData } : null);
        setLoadingProgress(prev => ({ ...prev, content: false }));

      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          return; // Request was cancelled
        }
        console.error("Error fetching BrandSpace data:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };

    fetchBrandSpaceData();
  }, [user, dateRange]);

  const refresh = () => {
    if (user) {
      setData(null);
      setError(null);
      setLoading(true);
    }
  };

  return {
    user,
    data,
    loading,
    error,
    refresh,
    filters,
    dateRange,
    loadingProgress
  };
}

// Helper functions for fetching data in chunks
async function fetchKPIsData(brandId: string, dateRange: { start: Date; end: Date }) {
  const cacheKey = `kpis-${brandId}-${dateRange.start.getTime()}-${dateRange.end.getTime()}`;
  const cached = getCachedData<{ kpis: BrandSpaceKPIs; heatLog: Array<{ score: number; timestamp: Date }> }>(cacheKey);
  if (cached) return cached;

  // Fetch brand document for heat score
  const brandDoc = await getDocs(
    query(collection(db, "brands"), where("__name__", "==", brandId))
  );

  let heatScore = 0;
  let heatLog: Array<{ score: number; timestamp: Date }> = [];

  if (!brandDoc.empty) {
    const brandData = brandDoc.docs[0].data();
    heatScore = brandData.heat || 0;
    
    if (brandData.heatLog && Array.isArray(brandData.heatLog)) {
      heatLog = brandData.heatLog
        .slice(-30)
        .map((entry: { score?: number; timestamp?: { toDate?: () => Date } }) => ({
          score: entry.score || 0,
          timestamp: entry.timestamp?.toDate?.() || new Date()
        }));
    }
  }

  // Fetch followers count from users collection
  const userDoc = await getDocs(
    query(collection(db, "users"), where("__name__", "==", brandId))
  );

  let followersCount = 0;
  if (!userDoc.empty) {
    const userData = userDoc.docs[0].data();
    followersCount = userData.followersCount || 0;
  }

  // Calculate heat trend
  const heatTrend = heatLog.length >= 2 
    ? heatLog[heatLog.length - 1].score > heatLog[heatLog.length - 2].score 
      ? "up" as const
      : heatLog[heatLog.length - 1].score < heatLog[heatLog.length - 2].score
      ? "down" as const
      : "flat" as const
    : "flat" as const;

  // Fetch all counts in parallel
  const [piecesSnapshot, availablePiecesSnapshot, collectionsSnapshot, publishedCollectionsSnapshot, postsSnapshot] = await Promise.all([
    getCountFromServer(query(collection(db, "dropProducts"), where("userId", "==", brandId))),
    getCountFromServer(query(collection(db, "dropProducts"), where("userId", "==", brandId), where("isAvailableNow", "==", true))),
    getCountFromServer(query(collection(db, "drops"), where("brandId", "==", brandId), where("isDeleted", "==", false))),
    getCountFromServer(query(collection(db, "drops"), where("brandId", "==", brandId), where("isDeleted", "==", false), where("isPublished", "==", true))),
    getCountFromServer(query(collection(db, "dropContents"), where("userId", "==", brandId), where("isDeleted", "==", false)))
  ]);

  const piecesCount = piecesSnapshot.data().count;
  const piecesAvailable = availablePiecesSnapshot.data().count;
  const collectionsCount = collectionsSnapshot.data().count;
  const collectionsPublished = publishedCollectionsSnapshot.data().count;
  const postsCount = postsSnapshot.data().count;

  // Fetch next launch date and last post date in parallel
  const [upcomingLaunchesSnapshot, lastPostSnapshot] = await Promise.all([
    getDocs(query(collection(db, "drops"), where("brandId", "==", brandId), where("isDeleted", "==", false), where("launchDate", ">", Timestamp.now()), orderBy("launchDate", "asc"), limit(1))),
    getDocs(query(collection(db, "dropContents"), where("userId", "==", brandId), where("isDeleted", "==", false), orderBy("createdAt", "desc"), limit(1)))
  ]);

  const nextLaunchDate = upcomingLaunchesSnapshot.empty 
    ? undefined 
    : upcomingLaunchesSnapshot.docs[0].data().launchDate?.toDate();

  const lastPostDate = lastPostSnapshot.empty 
    ? undefined 
    : lastPostSnapshot.docs[0].data().createdAt?.toDate();

  // Fetch followers change in last 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  const followersChangeSnapshot = await getCountFromServer(
    query(collection(db, `brands/${brandId}/interactions`), where("actionType", "==", "followBrand"), where("timestamp", ">=", Timestamp.fromDate(sevenDaysAgo)))
  );
  const followersChange7d = followersChangeSnapshot.data().count;

  const result = {
    kpis: {
      heatScore,
      heatTrend,
      followersCount,
      followersChange7d,
      piecesCount,
      piecesAvailable,
      collectionsCount,
      collectionsPublished,
      nextLaunchDate,
      postsCount,
      lastPostDate
    },
    heatLog
  };

  setCachedData(cacheKey, result, 60000); // Cache for 1 minute
  return result;
}

async function fetchEngagementData(brandId: string, dateRange: { start: Date; end: Date }): Promise<EngagementData> {
  const cacheKey = `engagement-${brandId}-${dateRange.start.getTime()}-${dateRange.end.getTime()}`;
  const cached = getCachedData<EngagementData>(cacheKey);
  if (cached) return cached;

  // Fetch engagement data for date range
  const engagementQuery = query(
    collection(db, `brands/${brandId}/interactions`),
    where("timestamp", ">=", Timestamp.fromDate(dateRange.start)),
    where("timestamp", "<", Timestamp.fromDate(dateRange.end))
  );
  const engagementSnapshot = await getDocs(engagementQuery);
  
  const interactions = engagementSnapshot.docs.map(doc => doc.data());
  const totalInteractions = interactions.length;
  const uniqueUsers = new Set(interactions.map(i => i.userId).filter(Boolean)).size;

  // Group interactions by day and action type
  const dailyBreakdown: Array<{
    date: string;
    discovery: number;
    product: number;
    social: number;
    linkouts: number;
  }> = [];

  const actionBuckets = {
    discovery: ["tapFeedDetail", "enterBrandProfile", "viewCollectionDetail"],
    product: ["viewProductDetail", "bookmarkProduct", "copNow"],
    social: ["followBrand", "bookmarkContent", "reactFireEmoji"],
    linkouts: ["tapSocialLink"]
  };

  // Group by day
  const interactionsByDay = interactions.reduce((acc, interaction) => {
    const date = interaction.timestamp?.toDate?.()?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0];
    if (!acc[date]) acc[date] = [];
    acc[date].push(interaction);
    return acc;
  }, {} as Record<string, Array<{ actionType: string; userId?: string; timestamp?: { toDate?: () => Date } }>>);

  // Fill in missing dates
  const startDate = new Date(dateRange.start);
  const endDate = new Date(dateRange.end);
  
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
     const dateKey = d.toISOString().split('T')[0];
     
     if (interactionsByDay[dateKey]) {
         // Process existing data
         const dayInteractions = interactionsByDay[dateKey];
         const breakdown = {
            date: dateKey,
            discovery: 0,
            product: 0,
            social: 0,
            linkouts: 0
         };

        dayInteractions.forEach((interaction: { actionType: string }) => {
            const actionType = interaction.actionType;
            if (actionBuckets.discovery.includes(actionType)) breakdown.discovery++;
            else if (actionBuckets.product.includes(actionType)) breakdown.product++;
            else if (actionBuckets.social.includes(actionType)) breakdown.social++;
            else if (actionBuckets.linkouts.includes(actionType)) breakdown.linkouts++;
        });
        dailyBreakdown.push(breakdown);
     } else {
         // Add zero entry for missing day
         dailyBreakdown.push({
             date: dateKey,
             discovery: 0,
             product: 0,
             social: 0,
             linkouts: 0
         });
     }
  }

  // Calculate engagement per post
  const postsInRangeSnapshot = await getCountFromServer(
    query(collection(db, "dropContents"), where("userId", "==", brandId), where("isDeleted", "==", false), where("createdAt", ">=", Timestamp.fromDate(dateRange.start)), where("createdAt", "<", Timestamp.fromDate(dateRange.end)))
  );
  const postsInRange = postsInRangeSnapshot.data().count;
  const engagementPerPost = postsInRange > 0 ? totalInteractions / postsInRange : 0;

  const result: EngagementData = {
    totalInteractions,
    uniqueUsers,
    engagementPerPost,
    dailyBreakdown
  };

  setCachedData(cacheKey, result, 30000); // Cache for 30 seconds
  return result;
}

async function fetchReactionsData(brandId: string, dateRange: { start: Date; end: Date }): Promise<ReactionsData> {
  const cacheKey = `reactions-${brandId}-${dateRange.start.getTime()}-${dateRange.end.getTime()}`;
  const cached = getCachedData<ReactionsData>(cacheKey);
  if (cached) return cached;

  // Fetch reactions data
  const reactionsQuery = query(
    collection(db, "dropContents"),
    where("userId", "==", brandId),
    where("isDeleted", "==", false),
    where("createdAt", ">=", Timestamp.fromDate(dateRange.start)),
    where("createdAt", "<", Timestamp.fromDate(dateRange.end))
  );
  const reactionsSnapshot = await getDocs(reactionsQuery);
  
  let totalReactions = 0;
  reactionsSnapshot.docs.forEach(doc => {
    const data = doc.data();
    if (data.reactions && typeof data.reactions === 'object') {
      Object.values(data.reactions).forEach((count: unknown) => {
        if (typeof count === 'number') {
          totalReactions += count;
        }
      });
    }
  });

  const postsInRange = reactionsSnapshot.docs.length;
  const avgReactionsPerPost = postsInRange > 0 ? totalReactions / postsInRange : 0;

  // Calculate posting streak and cadence
  const postingCadence: Array<{ date: string; hasPost: boolean }> = [];
  const last14Days = Array.from({ length: 14 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    return date.toISOString().split('T')[0];
  }).reverse();

  let postingStreak = 0;
  let currentStreak = 0;

  // Batch the day queries for better performance
  const dayQueries = last14Days.map(date => {
    const dayStart = new Date(date);
    const dayEnd = new Date(date);
    dayEnd.setDate(dayEnd.getDate() + 1);
    return getCountFromServer(
      query(collection(db, "dropContents"), where("userId", "==", brandId), where("isDeleted", "==", false), where("createdAt", ">=", Timestamp.fromDate(dayStart)), where("createdAt", "<", Timestamp.fromDate(dayEnd)))
    );
  });

  const dayResults = await Promise.all(dayQueries);

  dayResults.forEach((snapshot, index) => {
    const hasPost = snapshot.data().count > 0;
    postingCadence.push({ date: last14Days[index], hasPost });

    if (hasPost) {
      currentStreak++;
      postingStreak = Math.max(postingStreak, currentStreak);
    } else {
      currentStreak = 0;
    }
  });

  const result: ReactionsData = {
    totalReactions,
    postsInRange,
    avgReactionsPerPost,
    postingStreak,
    postingCadence
  };

  setCachedData(cacheKey, result, 30000); // Cache for 30 seconds
  return result;
}

async function fetchCatalogData(brandId: string): Promise<CatalogItem[]> {
  const cacheKey = `catalog-${brandId}`;
  const cached = getCachedData<CatalogItem[]>(cacheKey);
  if (cached) return cached;

  const catalogQuery = query(
    collection(db, "dropProducts"),
    where("userId", "==", brandId),
    orderBy("updatedAt", "desc"),
    limit(5)
  );
  const catalogSnapshot = await getDocs(catalogQuery);
  const catalogItems: CatalogItem[] = catalogSnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      name: data.dropName || "Untitled",
      mainVisualUrl: data.mainVisualUrl,
      isAvailableNow: data.isAvailableNow || false,
      updatedAt: data.updatedAt?.toDate?.() || new Date()
    };
  });

  setCachedData(cacheKey, catalogItems, 60000); // Cache for 1 minute
  return catalogItems;
}

async function fetchContentData(brandId: string): Promise<ContentItem[]> {
  const cacheKey = `content-${brandId}`;
  const cached = getCachedData<ContentItem[]>(cacheKey);
  if (cached) return cached;

  const recentContentQuery = query(
    collection(db, "dropContents"),
    where("userId", "==", brandId),
    where("isDeleted", "==", false),
    orderBy("createdAt", "desc"),
    limit(6)
  );
  const recentContentSnapshot = await getDocs(recentContentQuery);
  const recentContent: ContentItem[] = recentContentSnapshot.docs.map(doc => {
    const data = doc.data();
    
    // Calculate total reactions from the reactions map
    let totalReactionsCount = 0;
    if (data.reactions && typeof data.reactions === 'object') {
      Object.values(data.reactions).forEach((count: unknown) => {
        if (typeof count === 'number') {
          totalReactionsCount += count;
        }
      });
    }
    
    return {
      id: doc.id,
      caption: data.caption,
      teaserImageUrl: data.teaserImageUrl,
      visibility: data.visibility || "public",
      isPublished: data.isPublished || false,
      reactionsCount: totalReactionsCount,
      reactions: data.reactions || {},
      createdAt: data.createdAt?.toDate?.() || new Date()
    };
  });

  setCachedData(cacheKey, recentContent, 30000); // Cache for 30 seconds
  return recentContent;
}
