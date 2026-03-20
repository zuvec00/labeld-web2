export enum InstagramMediaType {
  image = 'IMAGE',
  video = 'VIDEO',
  carousel_album = 'CAROUSEL_ALBUM',
}

export interface InstagramConnection {
  isConnected: boolean;
  username?: string;
  instagramUserId?: string;
  connectedAt?: Date | string | null;
}

export interface InstagramMedia {
  id: string;
  caption?: string;
  mediaUrl: string;
  mediaType: InstagramMediaType;
  timestamp: Date | string;
  permalink: string;
  thumbnailUrl?: string;
}

export interface GeneratedProduct {
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
}
