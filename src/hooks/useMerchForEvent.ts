import { useState, useEffect } from "react";

export type MerchItemDoc = {
  id: string;
  eventId?: string | null;
  brandId: string;
  name: string;
  images: { url: string; alt?: string }[];
  priceMinor: number;
  currency: "NGN" | "USD";
  stockTotal: number | null;
  stockRemaining: number | null;
  sizeOptions?: string[];
  colorOptions?: string[];
  isActive: boolean;
  visibility?: "public" | "hidden";
  createdAt?: any;
  updatedAt?: any;
};

// Mock data
const mockMerchItems: MerchItemDoc[] = [
  {
    id: "merch-1",
    eventId: "event-1",
    brandId: "brand-1",
    name: "Nolly Trivia T-Shirt",
    images: [
      { url: "https://via.placeholder.com/300x400/2A2A2A/FFFFFF?text=T-Shirt", alt: "Nolly Trivia T-Shirt" }
    ],
    priceMinor: 5000, // ₦50.00
    currency: "NGN",
    stockTotal: 100,
    stockRemaining: 75,
    sizeOptions: ["S", "M", "L", "XL"],
    colorOptions: ["Black", "White"],
    isActive: true,
    visibility: "public",
  },
  {
    id: "merch-2",
    eventId: "event-1",
    brandId: "brand-1",
    name: "Event Hoodie",
    images: [
      { url: "https://via.placeholder.com/300x400/2A2A2A/FFFFFF?text=Hoodie", alt: "Event Hoodie" }
    ],
    priceMinor: 12000, // ₦120.00
    currency: "NGN",
    stockTotal: 50,
    stockRemaining: 30,
    sizeOptions: ["M", "L", "XL"],
    colorOptions: ["Gray", "Navy"],
    isActive: true,
    visibility: "public",
  },
  {
    id: "merch-3",
    eventId: "event-1",
    brandId: "brand-1",
    name: "Event Cap",
    images: [
      { url: "https://via.placeholder.com/300x400/2A2A2A/FFFFFF?text=Cap", alt: "Event Cap" }
    ],
    priceMinor: 2500, // ₦25.00
    currency: "NGN",
    stockTotal: 200,
    stockRemaining: 150,
    colorOptions: ["Black", "White", "Red"],
    isActive: true,
    visibility: "public",
  },
];

export function useMerchForEvent(eventId: string) {
  const [merchItems, setMerchItems] = useState<MerchItemDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Simulate API call
    const fetchMerch = async () => {
      try {
        setLoading(true);
        // TODO: Replace with actual API call
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Filter merch for this event
        const eventMerch = mockMerchItems.filter(
          item => item.eventId === eventId && item.isActive && item.visibility === "public"
        );
        setMerchItems(eventMerch);
      } catch (err) {
        setError("Failed to fetch merch items");
      } finally {
        setLoading(false);
      }
    };

    fetchMerch();
  }, [eventId]);

  return { merchItems, loading, error };
}
