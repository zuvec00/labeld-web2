"use client";

import { X, Mail, Phone, Package, Hash, Clock, RefreshCw } from "lucide-react";
import type { AbandonedCart } from "@/lib/models/abandoned-cart";
import { formatCurrency } from "@/lib/utils";
import CartStatusBadge from "./CartStatusBadge";
import { Timestamp } from "firebase/firestore";

function fmtDate(ts: Timestamp | null | undefined) {
  if (!ts) return "—";
  return ts.toDate().toLocaleDateString("en-NG", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-stroke/50 last:border-0">
      <span className="text-sm text-text-muted shrink-0">{label}</span>
      <span className="text-sm font-medium text-right">{value}</span>
    </div>
  );
}

export default function CartDetailDrawer({
  cart,
  onClose,
}: {
  cart: AbandonedCart | null;
  onClose: () => void;
}) {
  if (!cart) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer */}
      <aside className="fixed right-0 top-0 h-full w-full max-w-sm z-50 bg-bg border-l border-stroke flex flex-col shadow-2xl animate-in slide-in-from-right-8 duration-300">
        {/* Header */}
        <header className="flex items-center justify-between px-5 py-4 border-b border-stroke">
          <div>
            <p className="font-semibold">{cart.customerName ?? "Unknown customer"}</p>
            <p className="text-xs text-text-muted mt-0.5">{cart.customerEmail}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-surface transition-colors text-text-muted"
          >
            <X className="w-4 h-4" />
          </button>
        </header>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
          {/* Amount + status */}
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs text-text-muted mb-1">Cart Value</p>
              <p className="text-3xl font-heading font-bold">
                {formatCurrency(cart.amount)}
              </p>
            </div>
            <CartStatusBadge status={cart.status} />
          </div>

          {/* Details */}
          <div>
            <Row label="Items" value={`${cart.itemCount} item${cart.itemCount !== 1 ? "s" : ""}`} />
            <Row label="Channel" value={<span className="capitalize">{cart.channel}</span>} />
            <Row label="Reference" value={<span className="font-mono text-xs">{cart.reference}</span>} />
            <Row label="Phone" value={cart.phone || "—"} />
            <Row label="Detected" value={fmtDate(cart.detectedAt)} />
            <Row label="Source" value={<span className="capitalize">{cart.source}</span>} />
          </div>

          {/* Recovery info */}
          <div>
            <p className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2">Recovery</p>
            <Row label="Emails sent" value={cart.emailsSentCount} />
            <Row label="Next email" value={fmtDate(cart.nextEmailAt)} />
            {cart.recoveredAt && (
              <Row label="Recovered at" value={fmtDate(cart.recoveredAt)} />
            )}
            {cart.recoveryReference && (
              <Row
                label="Recovery ref"
                value={<span className="font-mono text-xs">{cart.recoveryReference}</span>}
              />
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
