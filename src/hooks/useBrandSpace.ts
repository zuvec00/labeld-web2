// hooks/useBrandSpace.ts
import { useState, useEffect, useMemo } from "react";
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
  collectionGroup,
  Timestamp
} from "firebase/firestore";
import { db } from "@/lib/firebase/firebaseConfig";
import { getDateRange } from "@/lib/orders/helpers";

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
  reactionsCount: number;
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

    const fetchBrandSpaceData = async () => {
      try {
        setLoading(true);
        setError(null);

        const brandId = user.uid; // Assuming user.uid is the brandId

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
              .slice(-30) // Last 30 entries
              .map((entry: any) => ({
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

        // Fetch pieces count
        const piecesQuery = query(
          collection(db, "dropProducts"),
          where("userId", "==", brandId)
        );
        const piecesSnapshot = await getCountFromServer(piecesQuery);
        const piecesCount = piecesSnapshot.data().count;

        // Fetch available pieces count
        const availablePiecesQuery = query(
          collection(db, "dropProducts"),
          where("userId", "==", brandId),
          where("isAvailableNow", "==", true)
        );
        const availablePiecesSnapshot = await getCountFromServer(availablePiecesQuery);
        const piecesAvailable = availablePiecesSnapshot.data().count;

        // Fetch collections count
        const collectionsQuery = query(
          collection(db, "drops"),
          where("brandId", "==", brandId),
          where("isDeleted", "==", false)
        );
        const collectionsSnapshot = await getCountFromServer(collectionsQuery);
        const collectionsCount = collectionsSnapshot.data().count;

        // Fetch published collections count
        const publishedCollectionsQuery = query(
          collection(db, "drops"),
          where("brandId", "==", brandId),
          where("isDeleted", "==", false),
          where("isPublished", "==", true)
        );
        const publishedCollectionsSnapshot = await getCountFromServer(publishedCollectionsQuery);
        const collectionsPublished = publishedCollectionsSnapshot.data().count;

        // Fetch next launch date
        const upcomingLaunchesQuery = query(
          collection(db, "drops"),
          where("brandId", "==", brandId),
          where("isDeleted", "==", false),
          where("launchDate", ">", Timestamp.now()),
          orderBy("launchDate", "asc"),
          limit(1)
        );
        const upcomingLaunchesSnapshot = await getDocs(upcomingLaunchesQuery);
        const nextLaunchDate = upcomingLaunchesSnapshot.empty 
          ? undefined 
          : upcomingLaunchesSnapshot.docs[0].data().launchDate?.toDate();

        // Fetch posts count
        const postsQuery = query(
          collection(db, "dropContents"),
          where("userId", "==", brandId),
          where("isDeleted", "==", false)
        );
        const postsSnapshot = await getCountFromServer(postsQuery);
        const postsCount = postsSnapshot.data().count;

        // Fetch last post date
        const lastPostQuery = query(
          collection(db, "dropContents"),
          where("userId", "==", brandId),
          where("isDeleted", "==", false),
          orderBy("createdAt", "desc"),
          limit(1)
        );
        const lastPostSnapshot = await getDocs(lastPostQuery);
        const lastPostDate = lastPostSnapshot.empty 
          ? undefined 
          : lastPostSnapshot.docs[0].data().createdAt?.toDate();

        // Fetch followers change in last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        const followersChangeQuery = query(
          collection(db, `brands/${brandId}/interactions`),
          where("actionType", "==", "followBrand"),
          where("timestamp", ">=", Timestamp.fromDate(sevenDaysAgo))
        );
        const followersChangeSnapshot = await getCountFromServer(followersChangeQuery);
        const followersChange7d = followersChangeSnapshot.data().count;

        // Fetch engagement data for last 7 days
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
        }, {} as Record<string, any[]>);

        Object.entries(interactionsByDay).forEach(([date, dayInteractions]) => {
          const breakdown = {
            date,
            discovery: 0,
            product: 0,
            social: 0,
            linkouts: 0
          };

          dayInteractions.forEach(interaction => {
            const actionType = interaction.actionType;
            if (actionBuckets.discovery.includes(actionType)) breakdown.discovery++;
            else if (actionBuckets.product.includes(actionType)) breakdown.product++;
            else if (actionBuckets.social.includes(actionType)) breakdown.social++;
            else if (actionBuckets.linkouts.includes(actionType)) breakdown.linkouts++;
          });

          dailyBreakdown.push(breakdown);
        });

        // Calculate engagement per post
        const postsInRangeQuery = query(
          collection(db, "dropContents"),
          where("userId", "==", brandId),
          where("isDeleted", "==", false),
          where("createdAt", ">=", Timestamp.fromDate(dateRange.start)),
          where("createdAt", "<", Timestamp.fromDate(dateRange.end))
        );
        const postsInRangeSnapshot = await getCountFromServer(postsInRangeQuery);
        const postsInRange = postsInRangeSnapshot.data().count;
        const engagementPerPost = postsInRange > 0 ? totalInteractions / postsInRange : 0;

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
          if (data.reactionsCount) {
            totalReactions += data.reactionsCount;
          }
        });

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

        for (const date of last14Days) {
          const dayStart = new Date(date);
          const dayEnd = new Date(date);
          dayEnd.setDate(dayEnd.getDate() + 1);

          const dayPostsQuery = query(
            collection(db, "dropContents"),
            where("userId", "==", brandId),
            where("isDeleted", "==", false),
            where("createdAt", ">=", Timestamp.fromDate(dayStart)),
            where("createdAt", "<", Timestamp.fromDate(dayEnd))
          );
          const dayPostsSnapshot = await getCountFromServer(dayPostsQuery);
          const hasPost = dayPostsSnapshot.data().count > 0;

          postingCadence.push({ date, hasPost });

          if (hasPost) {
            currentStreak++;
            postingStreak = Math.max(postingStreak, currentStreak);
          } else {
            currentStreak = 0;
          }
        }

        // Fetch catalog items (top 5 by freshness)
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
            name: data.name || "Untitled",
            mainVisualUrl: data.mainVisualUrl,
            isAvailableNow: data.isAvailableNow || false,
            updatedAt: data.updatedAt?.toDate?.() || new Date()
          };
        });

        // Fetch recent content (last 3)
        const recentContentQuery = query(
          collection(db, "dropContents"),
          where("userId", "==", brandId),
          where("isDeleted", "==", false),
          orderBy("createdAt", "desc"),
          limit(3)
        );
        const recentContentSnapshot = await getDocs(recentContentQuery);
        const recentContent: ContentItem[] = recentContentSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            caption: data.caption,
            teaserImageUrl: data.teaserImageUrl,
            visibility: data.visibility || "public",
            isPublished: data.isPublished || false,
            reactionsCount: data.reactionsCount || 0,
            createdAt: data.createdAt?.toDate?.() || new Date()
          };
        });

        const brandSpaceData: BrandSpaceData = {
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
          engagement: {
            totalInteractions,
            uniqueUsers,
            engagementPerPost,
            dailyBreakdown
          },
          reactions: {
            totalReactions,
            postsInRange,
            avgReactionsPerPost,
            postingStreak,
            postingCadence
          },
          catalogItems,
          recentContent,
          heatLog
        };

        setData(brandSpaceData);
      } catch (err) {
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
    dateRange
  };
}
