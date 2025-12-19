import { useState, useCallback, useEffect, useRef } from "react";

import { 
  startScanSession, 
  endScanSession, 
  verifyAndUseTicket, 
  lookupTicket,
  type TicketLookupResult 
} from "@/lib/firebase/callables/scanner";

export interface ScanResult {
  type: "success" | "duplicate" | "invalid";
  message: string;
  ticket?: {
    id: string;
    ticketCode: string;
    ticketTypeId: string;
    ownerUserId: string | null;
  };
  timestamp: Date;
}

export interface ScannerState {
  isScanning: boolean;
  sessionId: string | null;
  results: ScanResult[];
  counts: {
    accepted: number;
    duplicate: number;
    invalid: number;
  };
  lastScanTime: number;
  isProcessing: boolean;
}

export function useScanner(eventId: string) {
  const [state, setState] = useState<ScannerState>({
    isScanning: false,
    sessionId: null,
    results: [],
    counts: { accepted: 0, duplicate: 0, invalid: 0 },
    lastScanTime: 0,
    isProcessing: false,
  });

  // Track recently scanned codes to prevent spamming the server
  // Map of <qrString, timestamp>
  const recentScansRef = useRef<Map<string, number>>(new Map());

  // Start scanning session
  const startScanning = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isProcessing: true }));
      
      const deviceInfo = {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        timestamp: new Date().toISOString(),
      };
      
      const result = await startScanSession(eventId, deviceInfo);
      setState(prev => ({
        ...prev,
        isScanning: true,
        sessionId: result.sessionId,
        isProcessing: false,
      }));
    } catch (err) {
      console.error("Failed to start scan session:", err);
      setState(prev => ({ ...prev, isProcessing: false }));
      // throw err; // Don't throw, just log so UI doesn't break if session fails (can still try to scan)
    }
  }, [eventId]);

  // End scanning session
  const stopScanning = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isProcessing: true }));
      
      if (state.sessionId) {
        try {
          await endScanSession(state.sessionId);
        } catch (err) {
          console.error("Failed to end scan session:", err);
        }
      }
      
      setState(prev => ({
        ...prev,
        isScanning: false,
        sessionId: null,
        isProcessing: false,
      }));
    } catch (err) {
      console.error("Failed to stop scanning:", err);
      setState(prev => ({ ...prev, isProcessing: false }));
    }
  }, [state.sessionId]);

  // Process QR code scan
  const processQRCode = useCallback(async (qrString: string) => {
    const now = Date.now();
    
    // 1. Global Cooldown (reduced to 500ms for faster feel, but relying on dedupe for safety)
    if (now - state.lastScanTime < 500) {
      return;
    }

    if (state.isProcessing) {
      return;
    }

    // 2. Strict Deduplication: Don't process the same code if scanned successfully < 5 seconds ago
    // or if it failed < 2 seconds ago (to allow retrying faster if it was a flake)
    const lastSeen = recentScansRef.current.get(qrString);
    if (lastSeen && now - lastSeen < 3000) {
      console.log("Skipping duplicate scan:", qrString);
      return;
    }

    // Mark as processing immediately
    setState(prev => ({ ...prev, isProcessing: true, lastScanTime: now }));
    
    // Update strict cache
    recentScansRef.current.set(qrString, now);

    // Clean up old cache entries occasionally
    if (recentScansRef.current.size > 50) {
      const cutoff = now - 60000;
      for (const [key, time] of recentScansRef.current.entries()) {
        if (time < cutoff) recentScansRef.current.delete(key);
      }
    }

    try {
      const deviceInfo = {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        timestamp: new Date().toISOString(),
      };

      const result = await verifyAndUseTicket(
        qrString,
        eventId,
        deviceInfo,
        state.sessionId || undefined
      );

      const scanResult: ScanResult = {
        type: "success",
        message: "Ticket verified successfully",
        ticket: result.ticket,
        timestamp: new Date(),
      };

      setState(prev => ({
        ...prev,
        results: [scanResult, ...prev.results.slice(0, 9)], // Keep last 10 results
        counts: {
          ...prev.counts,
          accepted: prev.counts.accepted + 1,
        },
      }));

      // Play success sound
      playSound("success");
      
    } catch (err: unknown) {
      let resultType: "duplicate" | "invalid" = "invalid";
      let message = "Invalid ticket";

      if (err && typeof err === "object" && "code" in err && err.code === "failed-precondition") {
        const errorMessage = "message" in err ? String(err.message) : "";
        if (errorMessage.includes("already used") || errorMessage.includes("duplicate")) {
          resultType = "duplicate";
          message = "Ticket already used";
        } else if (errorMessage.includes("not found")) {
          message = "Ticket not found";
        } else if (errorMessage.includes("Event mismatch")) {
          message = "Wrong event";
        }
      }

      const scanResult: ScanResult = {
        type: resultType,
        message,
        timestamp: new Date(),
      };

      setState(prev => ({
        ...prev,
        results: [scanResult, ...prev.results.slice(0, 9)],
        counts: {
          ...prev.counts,
          [resultType === "duplicate" ? "duplicate" : "invalid"]: 
            prev.counts[resultType === "duplicate" ? "duplicate" : "invalid"] + 1,
        },
      }));

      // Play error sound
      playSound(resultType === "duplicate" ? "duplicate" : "error");
    } finally {
      // Small delay before unlocking "isProcessing" to allow UI animation to finish/prevent double-taps
      setTimeout(() => {
        setState(prev => ({ ...prev, isProcessing: false }));
      }, 500); 
    }
  }, [eventId, state.sessionId, state.lastScanTime, state.isProcessing]);

  // Manual ticket lookup
  const lookupTicketByCode = useCallback(async (codeOrTicketId: string): Promise<TicketLookupResult> => {
    try {
      const result = await lookupTicket(eventId, codeOrTicketId);
      return result;
    } catch (err) {
      console.error("Failed to lookup ticket:", err);
      throw err;
    }
  }, [eventId]);

  // Use ticket from manual lookup
  const useTicketFromLookup = useCallback(async (qrString: string) => {
    await processQRCode(qrString);
  }, [processQRCode]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Don't auto-end session on unmount, allows navigating away and back? 
      // Actually strictly better to end it to cleanup.
      if (state.sessionId) {
        endScanSession(state.sessionId).catch(console.error);
      }
    };
  }, [state.sessionId]);

  return {
    ...state,
    startScanning,
    stopScanning,
    processQRCode,
    lookupTicketByCode,
    useTicketFromLookup,
  };
}

// Simple sound feedback
function playSound(type: "success" | "duplicate" | "error") {
  try {
    const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Different frequencies for different sounds
    const frequencies = {
      success: [800, 1000, 1200],
      duplicate: [400, 300],
      error: [200, 150],
    };
    
    const freq = frequencies[type];
    oscillator.frequency.setValueAtTime(freq[0], audioContext.currentTime);
    
    if (freq.length > 1) {
      oscillator.frequency.setValueAtTime(freq[1], audioContext.currentTime + 0.1);
    }
    if (freq.length > 2) {
      oscillator.frequency.setValueAtTime(freq[2], audioContext.currentTime + 0.2);
    }
    
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  } catch {
    // Fallback to system beep or silent
    console.log("Audio not available");
  }
}
