import { useState, useEffect, useCallback, useRef } from "react";
import { InstagramService } from "@/lib/firebase/functions/instagram";
import { InstagramConnection } from "@/lib/models/instagram";

export function useInstagram() {
  const [connection, setConnection] = useState<InstagramConnection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchConnection = useCallback(async () => {
    try {
      setLoading(true);
      const conn = await InstagramService.getInstagramConnection();
      setConnection(conn);
    } catch (err) {
      console.error("Error fetching Instagram connection:", err);
      setError("Failed to fetch Instagram connection status");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConnection();
  }, [fetchConnection]);

  const startAuth = async () => {
    try {
      const authUrl = await InstagramService.startInstagramAuth();
      if (authUrl) {
        window.open(authUrl, "_blank", "width=600,height=800");
        
        // Start polling for connection success when window regains focus
        const handleFocus = () => {
          fetchConnection();
        };

        window.addEventListener("focus", handleFocus, { once: true });
        
        // Also start a temporary interval as backup
        if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
        checkIntervalRef.current = setInterval(async () => {
          const conn = await InstagramService.getInstagramConnection();
          if (conn.isConnected) {
            setConnection(conn);
            if (checkIntervalRef.current) {
              clearInterval(checkIntervalRef.current);
              checkIntervalRef.current = null;
            }
          }
        }, 3000);

        // Clear interval after 5 minutes to avoid infinite polling
        setTimeout(() => {
          if (checkIntervalRef.current) {
            clearInterval(checkIntervalRef.current);
            checkIntervalRef.current = null;
          }
        }, 5 * 60 * 1000);
      }
    } catch (err) {
      console.error("Error starting Instagram auth:", err);
      setError("Failed to start Instagram authentication");
    }
  };

  const disconnect = async () => {
    try {
      setLoading(true);
      const success = await InstagramService.disconnectInstagram();
      if (success) {
        setConnection({ isConnected: false });
      }
    } catch (err) {
      console.error("Error disconnecting Instagram:", err);
      setError("Failed to disconnect Instagram");
    } finally {
      setLoading(false);
    }
  };

  return {
    connection,
    loading,
    error,
    refresh: fetchConnection,
    connect: startAuth,
    disconnect,
  };
}
