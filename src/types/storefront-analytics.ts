export interface StorefrontDailyMetrics {
  date: string; // YYYY-MM-DD
  sessions: number;
  uniqueVisitors: number;
  totalProductViews: number;
  totalAddToCarts: number;
  totalCheckoutsStarted: number;
  totalPurchases: number;
  grossRevenue: number;
  trafficSources: {
    direct: number;
    social: number;
    discovery: number;
    referral: number;
    unknown: number;
    [key: string]: number;
  };
}

export interface ProductPerformanceMetric {
  productId: string;
  productName: string; // Hydrated from catalog
  imageUrl?: string;   // Hydrated from catalog
  views: number;
  addToCarts: number;
  purchases: number;
  revenue: number;
  conversionRate: number; // Calculated: purchases / views * 100
}

export interface SectionPerformanceMetric {
  sectionId: string;
  sectionType: string;
  sectionName?: string; // Friendly name if available
  impressions: number;
  ctaClicks: number;
  ctr: number; // Calculated: ctaClicks / impressions * 100
}

export interface StorefrontAnalyticsSummary {
  // Aggregated totals for the selected period
  totalVisits: number;
  visitsTrend: number; // % change vs previous period
  
  uniqueVisitors: number;
  uniqueVisitorsTrend: number;
  
  conversionRate: number;
  conversionRateTrend: number;
  
  revenue: number;
  revenueTrend: number;
  
  // Chart data
  dailyTrend: StorefrontDailyMetrics[];
  
  // Top lists
  topProducts: ProductPerformanceMetric[];
  sectionPerformance: SectionPerformanceMetric[];
  
  // Source breakdown for pie chart
  trafficSourceBreakdown: Array<{ name: string; value: number }>;
}
