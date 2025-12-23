import { Timestamp } from "firebase/firestore";

export interface PageVisit {
  id?: string;
  userId: string | null;
  url: string;
  path: string;
  platform: 'studio-web';
  timestamp: Timestamp;
  environment: 'development' | 'production';
  userAgent: string;
}
