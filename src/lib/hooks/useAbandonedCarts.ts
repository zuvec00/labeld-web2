"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { subscribeAbandonedCarts } from "@/lib/firebase/abandoned-carts";
import type { AbandonedCart, CartStatus } from "@/lib/models/abandoned-cart";

export function useAbandonedCarts() {
  const { user } = useAuth();
  const [carts, setCarts] = useState<AbandonedCart[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;
    const unsub = subscribeAbandonedCarts(user.uid, (data) => {
      setCarts(data);
      setLoading(false);
    });
    return unsub;
  }, [user?.uid]);

  const stats = {
    total: carts.length,
    totalValue: carts.reduce((s, c) => s + c.amount, 0),
    recovered: carts.filter((c) => c.status === "recovered").length,
    recoveredValue: carts
      .filter((c) => c.status === "recovered")
      .reduce((s, c) => s + c.amount, 0),
    recoveryRate:
      carts.length > 0
        ? Math.round((carts.filter((c) => c.status === "recovered").length / carts.length) * 100)
        : 0,
    pending: carts.filter((c) => c.status === "pending").length,
  };

  return { carts, loading, stats };
}
