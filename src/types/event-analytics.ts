export interface OrganizerDailyMetrics {
  date: string; // YYYY-MM-DD
  
  // Site-wide traffic by route type
  pageViews: {
    home: number;
    eventDetail: number;
    pastEventDetail: number;
    checkout: number;
    success: number;
    [key: string]: number;
  };

  // Funnel Steps
  funnel: {
    eventDetailViews: number;
    ticketIntent: number; // User opened ticket modal/selection
    checkoutStarted: number;    // User proceeded to payment info
    ordersPlaced: number;       // Completed transactions
    ticketsSold: number;        // Total tickets (count)
  };

  // Audience
  uniqueVisitors: number;
  sessions: number;
  
  // Financials
  revenue: {
    gross: number;
    refunds: number;
    net: number;
  };

  // Traffic
  trafficSources: {
    direct: number;
    social: number;
    email: number;
    referral: number;
    [key: string]: number;
  };
}

export interface EventPerformanceMetric {
  eventId: string;
  title: string;
  eventDate: string; // ISO string
  status: "upcoming" | "past" | "live";
  
  views: number; // event detail views
  ordersPlaced: number;
  ticketsSold: number;
  
  revenue: {
    gross: number;
    net: number;
  };

  conversionRate: number; // ordersPlaced / views

  // Optional ticket breakdown
  ticketTypes?: {
    name: string;
    sold: number;
    revenue: number;
  }[];
}

export interface EventAnalyticsSummary {
  // Period Aggregates
  totalRevenue: number;
  revenueTrend: number; // % change vs previous period
  
  totalTicketsSold: number;
  ticketsTrend: number;
  
  totalPageViews: number;
  viewsTrend: number;
  
  avgConversionRate: number;
  
  // Chart Data
  dailyTrend: OrganizerDailyMetrics[];
  
  // Lists
  topEvents: EventPerformanceMetric[];
  trafficSourceBreakdown: Array<{ name: string; value: number }>;
}
