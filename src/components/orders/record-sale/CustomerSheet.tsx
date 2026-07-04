"use client";

import { useEffect, useState } from "react";
import { X, Search, Plus, Check, Pencil, Users } from "lucide-react";
import {
  listCustomers,
  customerToDetails,
  type Customer,
  type CustomerDetails,
} from "@/lib/firebase/customers";
import { SharedCustomerForm } from "@/components/brand/customers/SharedCustomerForm";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
// ─── helpers ──────────────────────────────────────────────────────────────

function initials(name: string): string {
  const parts = name.trim().split(" ").filter(Boolean);
  if (parts.length === 0) return "?";
  return parts.slice(0, 2).map((p) => p[0]).join("").toUpperCase();
}

function formatLastOrder(date?: Date | null): string {
  if (!date) return "No orders yet";
  const now = new Date();
  const diffDays = Math.floor(
    (new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() -
      new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()) / 86400000
  );
  if (diffDays === 0) return "Last order today";
  if (diffDays === 1) return "Last order yesterday";
  if (diffDays < 7) return `Last order ${diffDays} days ago`;
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `Last order ${months[date.getMonth()]} ${date.getDate()}`;
}

// ─── main customer sheet ────────────────────────────────────────────────────

interface Props {
  brandId: string;
  selected: CustomerDetails | null;
  onSelect: (d: CustomerDetails) => void;
  onClose: () => void;
}

export default function CustomerSheet({ brandId, selected, onSelect, onClose }: Props) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"list" | "form">("list");
  const [editing, setEditing] = useState<CustomerDetails | null>(null);

  useEffect(() => {
    listCustomers(brandId)
      .then(setCustomers)
      .finally(() => setLoading(false));
  }, [brandId]);

  const filtered = customers.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      (c.email ?? "").toLowerCase().includes(q) ||
      (c.phoneNumber ?? "").includes(search)
    );
  });

  function handleSaved(d: CustomerDetails) {
    onSelect(d);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-stretch justify-end">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 flex w-full max-w-md flex-col bg-surface font-sans shadow-2xl">
        {view === "form" ? (
          <SharedCustomerForm
            brandId={brandId}
            initial={editing}
            onSaved={handleSaved}
            onBack={() => setView("list")}
          />
        ) : (
          <>
            <div className="flex items-center justify-between border-b border-stroke px-5 py-4">
              <h2 className="font-sans text-base font-semibold text-text">Select Customer</h2>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => { setEditing(null); setView("form"); }}
                  className="flex items-center gap-1 rounded-lg border border-stroke px-2.5 py-1.5 text-xs font-semibold text-text hover:border-text/40"
                >
                  <Plus className="h-3.5 w-3.5" /> Add New
                </button>
                <button onClick={onClose} className="text-text-muted hover:text-text">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="px-5 py-4">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search customer…"
                  className="w-full rounded-xl border border-stroke bg-bg py-2.5 pl-9 pr-3 text-sm text-text placeholder:text-text-muted outline-none focus:border-accent"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 pb-5">
              {loading ? (
                <div className="space-y-2">
                  {[1, 2, 3, 4].map((n) => (
                    <div key={n} className="h-16 animate-pulse rounded-xl bg-bg" />
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Users className="h-8 w-8 text-text-muted" />
                  <p className="mt-3 text-sm font-semibold text-text-muted">
                    {search ? "No matching customers" : "No customers found"}
                  </p>
                  <p className="mt-1 text-xs text-text-muted">
                    Tap &quot;Add New&quot; to create a customer.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-stroke/60">
                  {filtered.map((c) => {
                    const det = customerToDetails(c);
                    const isSel = selected?.customerId === c.id;
                    return (
                      <div
                        key={c.id}
                        className="flex items-center gap-3 py-3 cursor-pointer"
                        onClick={() => { onSelect(det); onClose(); }}
                      >
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                            isSel ? "bg-text text-bg" : "bg-bg text-text"
                          }`}
                        >
                          {initials(c.name)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-text">{c.name}</p>
                          <p className="truncate text-xs text-text-muted">
                            {[c.phoneNumber || c.email, `${c.totalOrders} order${c.totalOrders === 1 ? "" : "s"}`].filter(Boolean).join(" · ")}
                          </p>
                          <p className="truncate text-[11px] text-text-muted/70">
                            {formatLastOrder(det.lastOrderAt)}
                          </p>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); setEditing(det); setView("form"); }}
                          className="text-text-muted hover:text-text"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        {isSel && <Check className="h-4 w-4 text-text" />}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
