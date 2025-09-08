// hooks/useWallet.ts
import { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase/firebaseConfig";
import { watchWalletData, getWalletData } from "@/lib/firebase/queries/wallet";
import { WalletSummary, WalletLedgerEntry, EarningsBySource } from "@/types/wallet";

export interface UseWalletReturn {
  user: User | null;
  loading: boolean;
  walletData: {
    summary: WalletSummary | null;
    entries: WalletLedgerEntry[];
    earningsBySource: EarningsBySource;
  };
  error: string | null;
  refetch: () => Promise<void>;
}

export function useWallet(): UseWalletReturn {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [walletData, setWalletData] = useState<{
    summary: WalletSummary | null;
    entries: WalletLedgerEntry[];
    earningsBySource: EarningsBySource;
  }>({
    summary: null,
    entries: [],
    earningsBySource: {
      event: { eligibleMinor: 0, onHoldMinor: 0 },
      store: { eligibleMinor: 0, onHoldMinor: 0 },
    },
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user?.uid) {
      setWalletData({
        summary: null,
        entries: [],
        earningsBySource: {
          event: { eligibleMinor: 0, onHoldMinor: 0 },
          store: { eligibleMinor: 0, onHoldMinor: 0 },
        },
      });
      return;
    }

    setError(null);
    const unsubscribe = watchWalletData(user.uid, (data) => {
      setWalletData(data);
    }, (err) => {
      setError(err.message || "Failed to load wallet data");
    });

    return () => unsubscribe();
  }, [user?.uid]);

  const refetch = async () => {
    if (!user?.uid) return;
    
    try {
      setError(null);
      const data = await getWalletData(user.uid);
      setWalletData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to refetch wallet data");
    }
  };

  return {
    user,
    loading,
    walletData,
    error,
    refetch,
  };
}
