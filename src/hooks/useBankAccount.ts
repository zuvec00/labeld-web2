// hooks/useBankAccount.ts
import { useState, useCallback } from "react";
import { doc, updateDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/firebaseConfig";
import { useAuth } from "@/lib/auth/AuthContext";
import {
  fetchBankList,
  verifyBankAccount,
  Bank,
} from "@/lib/firebase/callables/bank";

export interface BankAccountData {
  bankName: string;
  bankCode: string;
  accountNumber: string;
  accountName: string;
  isVerified: boolean;
}

export interface UseBankAccountReturn {
  loading: boolean;
  error: string | null;
  banks: Bank[];
  fetchBanks: () => Promise<void>;
  verifyAccount: (
    accountNumber: string,
    bankCode: string,
    bankName: string
  ) => Promise<BankAccountData>;
  saveBankAccount: (bankData: BankAccountData) => Promise<void>;
  clearError: () => void;
}

export function useBankAccount(): UseBankAccountReturn {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [banks, setBanks] = useState<Bank[]>([]);

  const fetchBanks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const bankList = await fetchBankList(true); // Use live environment
      setBanks(bankList);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch banks";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const verifyAccount = useCallback(
    async (
      accountNumber: string,
      bankCode: string,
      bankName: string
    ): Promise<BankAccountData> => {
      setLoading(true);
      setError(null);
      try {
        // Verify the account with Paystack
        const verifyResult = await verifyBankAccount(accountNumber, bankCode, true);
        
        if (!verifyResult.status) {
          throw new Error("Account verification failed");
        }

        return {
          bankName,
          bankCode,
          accountNumber,
          accountName: verifyResult.data.account_name,
          isVerified: true,
        };
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Account verification failed";
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const saveBankAccount = useCallback(
    async (bankData: BankAccountData) => {
      if (!user?.uid) {
        throw new Error("User not authenticated");
      }

      setLoading(true);
      setError(null);
      try {
        const userRef = doc(db, "users", user.uid);

        await setDoc(userRef, {
          wallet: {
            payout: {
              bank: {
                bankName: bankData.bankName,
                bankCode: bankData.bankCode,
                accountNumber: bankData.accountNumber,
                accountName: bankData.accountName,
                isVerified: bankData.isVerified,
              }
            }
          }
        }, { merge: true });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to save bank account";
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [user?.uid]
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    banks,
    fetchBanks,
    verifyAccount,
    saveBankAccount,
    clearError,
  };
}
