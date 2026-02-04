export type EventSectionType =
  | "hero"
  | "featuredEvent"
  | "upcomingEvents"
  | "pastEvents"
  | "gallery"
  | "aboutOrganizer"
  | "venueInfo"
  | "menu"
  | "faq"
  | "socialProof"
  | "footer";

export interface EventBaseSection {
  id: string;               // e.g. "upcoming-1"
  type: EventSectionType;
  enabled: boolean;
  isRequired?: boolean;
  isLocked?: boolean;
  title?: string; // Custom title for the section in the editor
}

export interface EventHeroSection extends EventBaseSection {
  type: "hero";
  variant: "immersive" | "minimal";
  headline?: string;        // override
  subheadline?: string;     // override
  imageUrl?: string;        // override
  primaryCta?: { label: string; action: "viewTickets" | "viewEvents" | "scroll" | "custom"; target?: string };
  secondaryCta?: { label: string; action: "viewMenu" | "scroll" | "custom"; target?: string };
}

export interface FeaturedEventSection extends EventBaseSection {
  type: "featuredEvent";
  layout: "card" | "split";
  showPriceFrom?: boolean;
  showDateBadge?: boolean;
  cta?: { label: string; action: "viewTickets" | "viewEvent" };
  // optional override if organizer wants to pin a specific eventId later
  pinnedEventId?: string;
  title?: string; // override for "Next Experience" / "Next Gathering"
}

export interface UpcomingEventsSection extends EventBaseSection {
  type: "upcomingEvents";
  enabled: boolean;
  isRequired: true;
  layout: "cards" | "posterGrid";   // cards like Labeld Events
  maxItems?: number;
  filter?: "all" | "liveOnly" | "upcomingOnly" | "manual";
  manualEventIds?: string[]; // For "Curated Nights" selection
  title?: string; // override
}

export interface PastEventsSection extends EventBaseSection {
  type: "pastEvents";
  layout: "posterCarousel" | "grid";
  maxItems?: number;
  title?: string;
  showAttendeeCount?: boolean;
}

export interface GallerySection extends EventBaseSection {
  type: "gallery";
  layout: "masonry" | "carousel";
  images?: Array<{ url: string; alt?: string }>;        // override from organizer uploads
}

export interface VenueInfoSection extends EventBaseSection {
  type: "venueInfo";
  address?: string;
  mapLink?: string; // Google Maps embed URL or link
  dressCode?: string;
  ageLimit?: string;
  operatingHours?: string; // Simple text or JSON string for schedule
  showMap?: boolean;
}

export interface MenuSection extends EventBaseSection {
  type: "menu";
  items?: Array<{ label: string; url: string; fileType?: "image" | "pdf" }>;
}

export interface EventAboutSection extends EventBaseSection {
  type: "aboutOrganizer";
  description?: string;
  pullQuote?: string; // For editorial vibe
}

export interface FooterSection extends EventBaseSection {
  type: "footer";
  enabled: boolean;
  isRequired: true;
  showSocialLinks: boolean;
  showContactInfo: boolean;
  disclaimerText?: string;
}

// Fallback for sections not yet fully detailed
export interface GenericSection extends EventBaseSection {
    type: "faq" | "socialProof"; 
    // Add specific fields later as needed
}

export type EventSection =
  | EventHeroSection
  | FeaturedEventSection
  | UpcomingEventsSection
  | PastEventsSection
  | GallerySection
  | VenueInfoSection
  | MenuSection
  | EventAboutSection
  | FooterSection
  | GenericSection;

export interface EventOrganizerIdentity {
  primaryColor?: string;
  themeMode?: "dark" | "light";
  logoUrl?: string;
  faviconUrl?: string;
  coverImageUrl?: string;
}

export interface EventSiteConfig {
  templateId: string;
  enabledSections: string[];
  sectionOrder: string[];
  sectionSettings?: Record<string, Partial<EventSection>>;
  identity?: EventOrganizerIdentity;
  activatedAt?: Date;
}
