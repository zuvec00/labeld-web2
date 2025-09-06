import { useState, useCallback, useEffect } from "react";
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

  // const throttleRef = useRef<NodeJS.Timeout | null>(null);

  // Start scanning session
  const startScanning = useCallback(async () => {
    try {
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
      }));
    } catch (err) {
      console.error("Failed to start scan session:", err);
      throw err;
    }
  }, [eventId]);

  // End scanning session
  const stopScanning = useCallback(async () => {
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
    }));
  }, [state.sessionId]);

  // Process QR code scan
  const processQRCode = useCallback(async (qrString: string) => {
    const now = Date.now();
    
    // Throttle scans to prevent spam (800ms cooldown)
    if (now - state.lastScanTime < 800) {
      return;
    }

    if (state.isProcessing) {
      return;
    }

    setState(prev => ({ ...prev, isProcessing: true, lastScanTime: now }));

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
      setState(prev => ({ ...prev, isProcessing: false }));
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
