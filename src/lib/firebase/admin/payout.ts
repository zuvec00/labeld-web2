import { 
  collection, 
  doc, 
  writeBatch, 
  query, 
  where, 
  getDocs, 
  Timestamp,
  getDoc,
  setDoc
} from "firebase/firestore";
import { db } from "@/lib/firebase/firebaseConfig";
import { WalletLedgerEntry } from "@/types/wallet";

export interface ReconciliationResult {
  success: boolean;
  message: string;
  logs: string[];
  batchId?: string;
}

export async function reconcileManualPayout(
  vendorId: string, 
  amountMinor: number
): Promise<ReconciliationResult> {
  const logs: string[] = [];
  const log = (msg: string) => {
    console.log(msg);
    logs.push(msg);
  };

  try {
    const MANUAL_BATCH_ID = `manual_payout_${new Date().toISOString().split('T')[0]}_fixed_${Date.now()}`;
    
    log(`Starting reconciliation for Vendor: ${vendorId}, Amount: ${amountMinor}`);
    
    const batch = writeBatch(db);

    // --- STEP A: CREATE DEBIT RECORD ---
    const debitRef = doc(collection(db, "walletLedger")); 
    
    const debitEntry = {
      vendorId: vendorId,
      amountMinor: amountMinor,
      type: "debit_payout",
      source: "event", // Assumed source based on context, or could be 'manual'
      currency: "NGN",
      payoutBatchId: MANUAL_BATCH_ID,
      createdAt: Date.now(),
      paidAt: Date.now(), // It's already paid manually
      note: "Manual payout processed externally (Balance adjusted manually)",
      orderRef: { collection: "orders", id: "manual_adjustment" },
      createdBy: "admin_manual_script",
      // Required by WalletLedgerEntry type but not strictly relevant for debit:
      targetPayoutAt: Date.now(), 
      targetPayoutKey: "MANUAL",
    };

    batch.set(debitRef, debitEntry);
    log("Prepared Debit Record...");

    // --- STEP B: CLOSE OLD CREDITS ---
    // Fetch unpaid credits to "pay off"
    const walletRef = collection(db, "walletLedger");
    const q = query(
      walletRef,
      where("vendorId", "==", vendorId),
      where("type", "==", "credit_eligible"),
      where("payoutBatchId", "==", null) // Find ones NOT yet paid
    );

    const snapshot = await getDocs(q);
    
    // Sort in memory (Oldest first - FIFO)
    const credits = snapshot.docs
      .map(doc => ({ id: doc.id, ref: doc.ref, data: doc.data() as WalletLedgerEntry }))
      .sort((a, b) => a.data.createdAt - b.data.createdAt);

    let remainingToAccountFor = amountMinor;
    
    for (const credit of credits) {
      if (remainingToAccountFor <= 0) break; // We have accounted for everything
      
      const creditAmount = credit.data.amountMinor;
      
      if (creditAmount <= remainingToAccountFor) {
        // CASE 1: FULLY CONSUME THIS CREDIT
        batch.update(credit.ref, {
          payoutBatchId: MANUAL_BATCH_ID,
          paidAt: Date.now(), // Mark as paid now
          note: (credit.data.note || "") + " [Manually Paid]"
        });
        log(`- Closing Full Credit: ${creditAmount}`);
        remainingToAccountFor -= creditAmount;
      } else {
        // CASE 2: PARTIAL SPLIT
        // This credit is BIGGER than what's left. We must split it.
        const consumedAmount = remainingToAccountFor;
        const remainderAmount = creditAmount - consumedAmount;
        
        // Update Original: Mark as paid by this manual batch (for the consumed amount effectively)
        batch.update(credit.ref, {
          payoutBatchId: MANUAL_BATCH_ID,
          paidAt: Date.now(),
          note: (credit.data.note || "") + ` [Split: ${consumedAmount} paid, ${remainderAmount} carried forward]`
        });
        
        // Create New: Carry forward the unpaid remainder
        const newCreditRef = doc(collection(db, "walletLedger"));
        const newCreditEntry = {
          ...credit.data, 
          amountMinor: remainderAmount, // ONLY the unpaid part
          note: `Remainder from split of ${credit.id}`,
          createdAt: Date.now(), // New timestamp to push it to end of queue? Or keep original? 
          // Logic says: It is effectively a "new" credit for the remainder.
          // Yet, typically we might want to prioritize it. But strictly "new ledger entry" = new timestamp.
          payoutBatchId: null, // Ready for NEXT payout
          paidAt: null // Not paid yet
        };
        
        // Ensure undefined fields are not passed if they were missing in original data but required by type?
        // Firestore handles spreading well usually.
        
        batch.set(newCreditRef, newCreditEntry);
        log(`- SPLIT Credit: Paid ${consumedAmount}, Carried forward ${remainderAmount}`);
        remainingToAccountFor = 0; // Done
      }
    }

    if (remainingToAccountFor > 0) {
      const msg = `WARNING: User was paid ${amountMinor} but only had eligible credits for ${amountMinor - remainingToAccountFor}. The ledger is now technically "overdrawn" by ${remainingToAccountFor}.`;
      log(msg);
    }

    // --- COMMIT ---
    await batch.commit();
    log("SUCCESS! Database reconciled.");
    
    return {
      success: true,
      message: "Database reconciled successfully.",
      logs,
      batchId: MANUAL_BATCH_ID
    };

  } catch (error: any) {
    console.error("Manual payout reconciliation failed:", error);
    log(`ERROR: ${error.message}`);
    return {
      success: false,
      message: error.message || "Unknown error occurred",
      logs
    };
  }
}

export async function backfillPayoutBatch(
  vendorId: string,
  amountMinor: number,
  batchIdString: string
): Promise<ReconciliationResult> {
  const logs: string[] = [];
  const log = (msg: string) => {
    console.log(msg);
    logs.push(msg);
  };

  try {
    log(`Starting Batch Backfill for: ${batchIdString}`);

    // 1. FETCH VENDOR DETAILS
    const vendorDoc = await getDoc(doc(collection(db, "users"), vendorId));
    if (!vendorDoc.exists()) {
      log(`Error: Vendor ${vendorId} not found!`);
      throw new Error(`Vendor ${vendorId} not found`);
    }

    const vendorData = vendorDoc.data();
    const vendorName = vendorData.displayName || vendorData.username || "Unknown Vendor";
    log(`Found vendor: ${vendorName}`);

    // 2. CONSTRUCT PAYOUT BATCH DATA
    const payoutBatch = {
      batchId: batchIdString,
      createdAt: Date.now(),
      totalVendors: 1,
      totalAmountMinor: amountMinor,
      status: "completed",
      results: [
        {
          vendorId: vendorId,
          vendorName: vendorName,
          success: true,
          amountMinor: amountMinor,
          transferCode: "MANUAL_PAYOUT",
        }
      ]
    };

    // 3. WRITE TO FIRESTORE
    const batchRef = doc(collection(db, "eventPayoutBatches"), batchIdString);
    
    const existingFn = await getDoc(batchRef);
    if (existingFn.exists()) {
       log(`Batch ${batchIdString} already exists! Overwriting...`);
    }

    await setDoc(batchRef, payoutBatch);
    log("SUCCESS! Payout batch record created.");

    return {
      success: true,
      message: "Payout batch backfilled successfully.",
      logs,
      batchId: batchIdString
    };
  } catch (error: any) {
    console.error("Backfill failed:", error);
    log(`ERROR: ${error.message}`);
    return {
      success: false,
      message: error.message,
      logs
    };
  }
}

/**
 * Get upcoming payout details for a vendor
 * Checks eligible credits that will be paid out in the next cycle
 */
export async function getUpcomingPayout(vendorId?: string) {
  try {
    // 1. Determine Vendor ID (Current or Requested)
    // Note: In client SDK, to check another vendor, the user must look up the ID passed in.
    // If no vendorId passed, assume current user? 
    // Usually these admin functions are called BY admins FOR vendors. 
    // If called without vendorId, we might fail or require it.
    // Let's require it if it's an "admin" function, or default to current user if possible?
    if (!vendorId) {
        throw new Error("Vendor ID is required");
    }

    const { computeNextWeeklyPayoutUtcMillis } = await import("@/lib/payout/utils");
    
    // 2. Fetch vendor's wallet balance for verification
    const userDoc = await getDocs(query(
      collection(db, "users"),
      where("__name__", "==", vendorId)
    ));
    
    let walletBalance = 0;
    if (!userDoc.empty) {
      const userData = userDoc.docs[0].data();
      walletBalance = userData.wallet?.eligibleBalanceMinor || 0;
    }
    
    // 3. Calculate Steps
    const nextPayoutTime = computeNextWeeklyPayoutUtcMillis();
    
    // 4. Query Eligible Credits
    const walletRef = collection(db, "walletLedger");
    const q = query(
        walletRef,
        where("vendorId", "==", vendorId),
        where("type", "==", "credit_eligible"),
        where("source", "==", "event"),
        where("payoutBatchId", "==", null),
        where("targetPayoutAt", "<=", nextPayoutTime)
    );

    const snapshot = await getDocs(q);

    let totalAmountMinor = 0;
    const breakdown: {eventId: string; amountMinor: number}[] = [];
    
    // Detailed transactions list
    const transactions = snapshot.docs.map(doc => {
      const data = doc.data();
      const amount = data.amountMinor || 0;
      totalAmountMinor += amount;

      // Add to breakdown if new event or sum up?
      // Simple aggregation for breakdown
      const existing = breakdown.find(b => b.eventId === (data.eventId || "unknown"));
      if (existing) {
        existing.amountMinor += amount;
      } else {
        breakdown.push({
            eventId: data.eventId || "unknown",
            amountMinor: amount
        });
      }

      return {
        id: doc.id,
        createdAt: data.createdAt,
        targetPayoutAt: data.targetPayoutAt,
        amountMinor: amount,
        eventId: data.eventId || "unknown",
        orderId: data.orderRef?.id || "unknown"
      };
    });

    // Sort transactions by date (oldest first or newest?)
    // Usually for payout processing verification, oldest first (FIFO) is good, 
    // but for "what happened recently", newest first.
    // Let's do newest first for visibility of recent sales.
    transactions.sort((a, b) => b.createdAt - a.createdAt);

    console.log(`[getUpcomingPayout] Checked for ${vendorId}`, {
        count: snapshot.size,
        total: totalAmountMinor,
        nextPayoutTime: new Date(nextPayoutTime).toISOString()
    });

    // 5. Query Future Payouts (credits scheduled AFTER the next payout)
    const futurePayoutsQuery = await getDocs(query(
      walletRef,
      where("vendorId", "==", vendorId),
      where("type", "==", "credit_eligible"),
      where("source", "==", "event"),
      where("payoutBatchId", "==", null),
      where("targetPayoutAt", ">", nextPayoutTime)
    ));

    let futureAmountMinor = 0;
    const futureTransactions = futurePayoutsQuery.docs.map(doc => {
      const data = doc.data();
      const amount = data.amountMinor || 0;
      futureAmountMinor += amount;

      return {
        id: doc.id,
        createdAt: data.createdAt,
        targetPayoutAt: data.targetPayoutAt,
        amountMinor: amount,
        eventId: data.eventId || "unknown",
        orderId: data.orderRef?.id || "unknown"
      };
    });

    // Sort future transactions by target payout date
    futureTransactions.sort((a, b) => a.targetPayoutAt - b.targetPayoutAt);

    console.log(`[getUpcomingPayout] Future payouts for ${vendorId}`, {
        count: futurePayoutsQuery.size,
        total: futureAmountMinor
    });

    return {
        vendorId,
        nextPayoutDate: new Date(nextPayoutTime).toISOString(),
        nextPayoutTimestamp: nextPayoutTime,
        totalAmountMinor,
        futureAmountMinor,
        walletBalanceMinor: walletBalance,
        currency: "NGN",
        eligibleCount: snapshot.size,
        futureCount: futurePayoutsQuery.size,
        breakdown,
        transactions,
        futureTransactions
    };

  } catch (error: any) {
    console.error("Failed to get upcoming payout", error);
    throw new Error(error.message || "Failed to retrieve payout details.");
  }
}
