// src/lib/models/merch.ts
export type MerchImage = { url: string; alt?: string };
export type MerchOption = { label: string; values: string[] };

export type MerchItemDoc = {
  id: string;                 // doc id
  eventId?: string | null;    // null = evergreen
  brandId: string;            // owner (current user’s brand)
  name: string;
  images: MerchImage[];       // >=1 image
  priceMinor: number;         // int in kobo/cents
  currency: "NGN" | "USD";
  stockTotal: number | null;  // null = unlimited
  stockRemaining: number | null;
  sizeOptions?: string[];     // ["S","M","L","XL"]
  colorOptions?: string[];    // ["Black","White"]
  isActive: boolean;
  visibility?: "public" | "hidden";
  createdAt?: any;
  updatedAt?: any;
};
