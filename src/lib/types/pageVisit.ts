import { Timestamp } from "firebase/firestore";

export type Environment = 'development' | 'production';
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
