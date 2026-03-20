import { 
  getInstagramConnection as getConn,
  startInstagramAuth as startAuth,
  getInstagramMedia as getMedia,
  generateProductsFromPosts as generateProducts,
  disconnectInstagram as disconnect
} from "../callables/instagram";
import { InstagramConnection, InstagramMedia, GeneratedProduct, InstagramMediaType } from "../../models/instagram";

export class InstagramService {
  static async getInstagramConnection(): Promise<InstagramConnection> {
    try {
      const result = await getConn();
      const data = result.data as any;
      if (!data) return { isConnected: false };

      return {
        isConnected: data.isConnected ?? false,
        username: data.username,
        instagramUserId: data.instagramUserId,
        connectedAt: data.connectedAt ? new Date(data.connectedAt) : null,
      };
    } catch (e) {
      console.error('Error fetching Instagram connection:', e);
      return { isConnected: false };
    }
  }

  static async startInstagramAuth(): Promise<string | null> {
    try {
      const result = await startAuth();
      return result.data?.authUrl || null;
    } catch (e) {
      console.error('Error starting Instagram auth:', e);
      return null;
    }
  }

  static async getInstagramMedia(limit: number = 50): Promise<InstagramMedia[]> {
    try {
      const result = await getMedia({ limit });
      const rawData = result.data?.data || [];
      
      return rawData.map((m: any) => ({
        id: m.id ?? '',
        caption: m.caption,
        mediaUrl: m.media_url ?? '',
        mediaType: m.media_type as InstagramMediaType,
        timestamp: new Date(m.timestamp ?? ''),
        permalink: m.permalink ?? '',
        thumbnailUrl: m.thumbnail_url,
      }));
    } catch (e) {
      console.error('Error fetching Instagram media:', e);
      return [];
    }
  }

  static async generateProductsFromPosts(
    posts: any[], 
    category?: string
  ): Promise<GeneratedProduct[]> {
    try {
      const result = await generateProducts({ posts, category });
      return result.data?.result || [];
    } catch (e) {
      console.error('Error generating products from AI:', e);
      return [];
    }
  }

  static async disconnectInstagram(): Promise<boolean> {
    try {
      const result = await disconnect();
      return result.data?.success === true;
    } catch (e) {
      console.error('Error disconnecting Instagram:', e);
      return false;
    }
  }
}
