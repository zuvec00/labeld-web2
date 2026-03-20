import { httpsCallable } from "firebase/functions";
import { functions } from "../firebaseConfig";
import { 
  InstagramConnection, 
  InstagramMedia, 
  GeneratedProduct 
} from "../../models/instagram";

// Request/Response Types
export interface StartInstagramAuthResponse {
  authUrl: string;
}

export interface GetInstagramMediaRequest {
  limit?: number;
}

export interface GetInstagramMediaResponse {
  data: InstagramMedia[];
}

export interface GenerateProductsRequest {
  posts: any[];
  category?: string;
}

export interface GenerateProductsResponse {
  result: GeneratedProduct[];
}

export interface DisconnectInstagramResponse {
  success: boolean;
}

// Callable functions
export const getInstagramConnection = httpsCallable<void, InstagramConnection>(
  functions,
  'getInstagramConnection'
);

export const startInstagramAuth = httpsCallable<void, StartInstagramAuthResponse>(
  functions,
  'startInstagramAuth'
);

export const getInstagramMedia = httpsCallable<GetInstagramMediaRequest, GetInstagramMediaResponse>(
  functions,
  'getInstagramMedia'
);

export const generateProductsFromPosts = httpsCallable<GenerateProductsRequest, GenerateProductsResponse>(
  functions,
  'generateProductsFromPosts'
);

export const disconnectInstagram = httpsCallable<void, DisconnectInstagramResponse>(
  functions,
  'disconnectInstagram'
);
