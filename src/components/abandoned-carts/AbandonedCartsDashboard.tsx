"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ShoppingCart,
  TrendingUp,
  Mail,
  RefreshCw,
  Settings2,
  Search,
} from "lucide-react";
import { useAbandonedCarts } from "@/lib/hooks/useAbandonedCarts";
import { useAuth } from "@/lib/auth/AuthContext";
import { formatCurrency } from "@/lib/utils";
import type { AbandonedCart, CartStatus } from "@/lib/models/abandoned-cart";
import CartStatusBadge from "./CartStatusBadge";
import CartDetailDrawer from "./CartDetailDrawer";
import { Input } from "@/components/ui/input";
import Button from "@/components/ui/button";
import { testAbandonedCartEmailCF } from "@/lib/firebase/callables/brand";
import { Timestamp } from "firebase/firestore";

function formatDate(ts: Timestamp | null | undefined) {
  if (!ts) return "—";
  return new Intl.DateTimeFormat("en-NG", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(ts.toDate());
}

function StatCard({
  icon,
  label,
  value,
  helper,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <div className="rounded-2xl border border-stroke bg-surface p-4 sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-text-muted">
            {label}
          </p>
          <p className="mt-3 font-unbounded text-2xl font-semibold text-text sm:text-3xl">
            {value}
          </p>
          <p className="mt-2 text-sm text-text-muted">{helper}</p>
        </div>
        <div className="rounded-xl bg-bg p-3 text-accent">{icon}</div>
      </div>
    </div>
  );
}

function CartRow({
  cart,
  onClick,
}: {
  cart: AbandonedCart;
  onClick: () => void;
}) {
  return (
    <tr
      className="border-b border-stroke/70 last:border-0 cursor-pointer hover:bg-bg/40 transition-colors"
      onClick={onClick}
    >
      <td className="min-w-[220px] px-4 py-4">
        <div className="font-semibold text-text">
          {cart.customerName ?? "Unknown customer"}
        </div>
        <div className="mt-1 text-xs text-text-muted">{cart.customerEmail}</div>
      </td>
      <td className="px-4 py-4 text-sm text-text-muted">
        {cart.itemCount} item{cart.itemCount !== 1 ? "s" : ""}
      </td>
      <td className="px-4 py-4">
        <span className="font-semibold text-text">
          {formatCurrency(cart.amount)}
        </span>
      </td>
      <td className="px-4 py-4 text-sm text-text-muted">
        {formatDate(cart.detectedAt)}
      </td>
      <td className="px-4 py-4">
        <CartStatusBadge status={cart.status} />
      </td>
    </tr>
  );
}

const STATUS_OPTIONS: { value: CartStatus | "all"; label: string }[] = [
  { value: "all",           label: "All statuses"   },
  { value: "pending",       label: "Pending"         },
  { value: "contacted",     label: "Contacted"       },
  { value: "recovered",     label: "Recovered"       },
  { value: "expired",       label: "Expired"         },
  { value: "uncontactable", label: "No Email"        },
];

// Debug-only: UID of the account allowed to see the test email button
const DEBUG_UID = "gYU1Zmtg6AWVlql8E1XA3CYTjJF2";

export default function AbandonedCartsDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const { carts, loading, stats } = useAbandonedCarts();

  const [statusFilter, setStatusFilter] = useState<CartStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<AbandonedCart | null>(null);
  const [testSending, setTestSending] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  const isDebugUser = user?.uid === DEBUG_UID;

  const handleTestEmail = async () => {
    setTestSending(true);
    setTestResult(null);
    try {
      const { sentTo } = await testAbandonedCartEmailCF();
      setTestResult(`✓ Test email sent to ${sentTo}`);
    } catch (e: any) {
      setTestResult(`✗ ${e?.message ?? "Failed"}`);
    } finally {
      setTestSending(false);
    }
  };

  const filtered = carts
    .filter((c) => statusFilter === "all" || c.status === statusFilter)
    .filter((c) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        c.customerEmail.toLowerCase().includes(q) ||
        (c.customerName ?? "").toLowerCase().includes(q)
      );
    });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-36 animate-pulse rounded-2xl bg-surface" />
        <div className="h-80 animate-pulse rounded-2xl bg-surface" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-accent">
            Audience
          </p>
          <h1 className="mt-2 font-unbounded text-2xl font-semibold text-text sm:text-3xl">
            Abandoned Carts
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-text-muted sm:text-base">
            Customers who started checkout but didn't complete it. Recovery emails
            are sent automatically based on your settings.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/abandoned-carts/settings")}
          leftIcon={<Settings2 className="h-4 w-4" />}
        >
          Recovery Settings
        </Button>
      </div>

      {/* DEBUG: test email button — only visible to debug UID */}
      {isDebugUser && (
        <div className="flex items-center gap-3 rounded-xl border border-dashed border-yellow-500/40 bg-yellow-500/5 px-4 py-3">
          <span className="text-xs font-bold uppercase tracking-wider text-yellow-600">Debug</span>
          <button
            onClick={handleTestEmail}
            disabled={testSending}
            className="px-3 py-1.5 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-xs font-medium text-yellow-700 hover:bg-yellow-500/20 transition-colors disabled:opacity-50"
          >
            {testSending ? "Sending…" : "Send test recovery email to me"}
          </button>
          {testResult && (
            <span className={`text-xs font-medium ${testResult.startsWith("✓") ? "text-green-600" : "text-red-500"}`}>
              {testResult}
            </span>
          )}
        </div>
      )}

      {/* Stat cards */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={<ShoppingCart className="h-5 w-5" />}
          label="Abandoned"
          value={String(stats.total)}
          helper={`${stats.pending} still pending`}
        />
        <StatCard
          icon={<TrendingUp className="h-5 w-5" />}
          label="Total Value"
          value={formatCurrency(stats.totalValue)}
          helper="Across all carts"
        />
        <StatCard
          icon={<RefreshCw className="h-5 w-5" />}
          label="Recovered"
          value={formatCurrency(stats.recoveredValue)}
          helper={`${stats.recovered} cart${stats.recovered !== 1 ? "s" : ""} recovered`}
        />
        <StatCard
          icon={<Mail className="h-5 w-5" />}
          label="Recovery Rate"
          value={`${stats.recoveryRate}%`}
          helper="Recovered vs total"
        />
      </div>

      {/* Table card */}
      <div className="rounded-2xl border border-stroke bg-surface">
        {/* Table header */}
        <div className="flex flex-col gap-4 border-b border-stroke p-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="font-unbounded text-lg font-semibold text-text">
              Carts
            </h2>
            <p className="mt-1 text-sm text-text-muted">
              {filtered.length} showing from {carts.length} detected.
            </p>
          </div>
          <div className="relative min-w-0 sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name or email"
              className="pl-10"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="border-b border-stroke p-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as CartStatus | "all")}
            className="rounded-xl border border-stroke bg-bg px-4 py-3 text-sm text-text outline-none focus:border-accent"
          >
            {STATUS_OPTIONS.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        {/* Empty states */}
        {carts.length === 0 ? (
          <div className="flex min-h-[320px] flex-col items-center justify-center px-4 py-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-bg text-accent">
              <ShoppingCart className="h-6 w-6" />
            </div>
            <h3 className="mt-5 font-unbounded text-xl font-semibold text-text">
              No abandoned carts yet.
            </h3>
            <p className="mt-2 max-w-md text-sm leading-6 text-text-muted">
              When a customer starts checkout and doesn't complete it, they'll
              appear here automatically.
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-4 py-12 text-center text-sm text-text-muted">
            No carts match those filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left">
              <thead className="bg-bg/70 text-xs uppercase tracking-[0.14em] text-text-muted">
                <tr>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Items</th>
                  <th className="px-4 py-3">Value</th>
                  <th className="px-4 py-3">Detected</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((cart) => (
                  <CartRow
                    key={cart.id}
                    cart={cart}
                    onClick={() => setSelected(cart)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <CartDetailDrawer cart={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
