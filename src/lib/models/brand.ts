import { Timestamp } from "firebase/firestore";

export interface BrandModel {
  uid: string;                 // same as user uid
  brandName: string;
  username: string;
  bio?: string | null;
  category: string;
  brandTags?: string[] | null;

  logoUrl: string;
  coverImageUrl?: string | null;

  state?: string | null;
  country?: string | null;

  heat: number;

  instagram?: string | null;
  youtube?: string | null;
  tiktok?: string | null;

  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
}

// (Optional) converter same pattern as user.ts if you want
