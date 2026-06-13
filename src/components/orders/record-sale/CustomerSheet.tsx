"use client";

import { useEffect, useState } from "react";
import {
  X,
  Search,
  Plus,
  Check,
  Pencil,
  Users,
  Truck,
  ChevronDown,
  ChevronUp,
  ShoppingBag,
  Coins,
  CalendarDays,
} from "lucide-react";
import {
  listCustomers,
  createCustomer,
  updateCustomer,
  customerToDetails,
  type Customer,
  type CustomerDetails,
} from "@/lib/firebase/customers";
import { formatCurrency } from "@/lib/wallet/mock";
import countriesJson from "@/data/countries_and_states.json";

// Build { [countryName]: [stateName, ...] } once at module load.
const COUNTRY_PAYLOAD = countriesJson as {
  data?: { name: string; states?: { name?: string }[] }[];
};
const COUNTRY_LIST: string[] = (COUNTRY_PAYLOAD.data ?? []).map((c) => c.name);
const COUNTRY_TO_STATES: Record<string, string[]> = (() => {
  const map: Record<string, string[]> = {};
  for (const c of COUNTRY_PAYLOAD.data ?? []) {
    map[c.name] = (c.states ?? []).map((s) => s?.name).filter(Boolean) as string[];
  }
  return map;
})();

// ─── helpers ──────────────────────────────────────────────────────────────

function initials(name: string): string {
  const parts = name.trim().split(" ").filter(Boolean);
  if (parts.length === 0) return "?";
  return parts
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

function formatLastOrder(date?: Date | null): string {
  if (!date) return "No orders yet";
  const now = new Date();
  const diffDays = Math.floor(
    (new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() -
      new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()) /
      86400000
  );
  if (diffDays === 0) return "Last order today";
  if (diffDays === 1) return "Last order yesterday";
  if (diffDays < 7) return `Last order ${diffDays} days ago`;
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `Last order ${months[date.getMonth()]} ${date.getDate()}`;
}

function lastOrderShort(date?: Date | null): string {
  if (!date) return "Never";
  const now = new Date();
  const diffDays = Math.floor(
    (new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() -
      new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()) /
      86400000
  );
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 30) return `${diffDays}d ago`;
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${months[date.getMonth()]} ${date.getDate()}`;
}

// ─── customer form view ───────────────────────────────────────────────────

function CustomerForm({
  brandId,
  initial,
  onSaved,
  onBack,
}: {
  brandId: string;
  initial?: CustomerDetails | null;
  onSaved: (d: CustomerDetails) => void;
  onBack: () => void;
}) {
  const [firstName, setFirstName] = useState(initial?.firstName ?? "");
  const [lastName, setLastName] = useState(initial?.lastName ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [address, setAddress] = useState(initial?.address ?? "");
  const [city, setCity] = useState(initial?.city ?? "");
  const [state, setState] = useState(initial?.state ?? "");
  const [country, setCountry] = useState(initial?.country ?? "Nigeria");
  const [postalCode, setPostalCode] = useState(initial?.postalCode ?? "");
  const [shippingOpen, setShippingOpen] = useState(
    !!(initial?.address || initial?.city || initial?.state)
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEdit = !!initial?.customerId;
  const valid = firstName.trim() && phone.trim() && email.trim();

  async function handleSave() {
    if (!valid) return;
    setSaving(true);
    setError(null);
    const name = [firstName.trim(), lastName.trim()].filter(Boolean).join(" ");
    const addresses = address.trim()
      ? [{ address: address.trim(), city: city.trim() || null, state: state.trim() || null, country: country.trim() || null, postalCode: postalCode.trim() || null }]
      : [];
    try {
      let customerId = initial?.customerId;
      if (isEdit && customerId) {
        await updateCustomer({ brandId, customerId, name, phoneNumber: phone.trim() || null, email: email.trim() || null, addresses });
      } else {
        const res = await createCustomer({ brandId, name, phoneNumber: phone.trim() || null, email: email.trim() || null, addresses });
        customerId = res.customerId;
      }
      onSaved({
        customerId,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        address: address.trim(),
        city: city.trim(),
        state: state.trim(),
        country: country.trim(),
        postalCode: postalCode.trim(),
        totalOrders: initial?.totalOrders,
        totalSpendMinor: initial?.totalSpendMinor,
        lastOrderAt: initial?.lastOrderAt,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save customer");
    } finally {
      setSaving(false);
    }
  }

  const inputCls =
    "w-full rounded-xl border border-stroke bg-bg px-3.5 py-2.5 text-sm text-text placeholder:text-text-muted outline-none focus:border-accent";
  const labelCls = "mb-1.5 block text-xs font-medium text-text-muted";

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-stroke px-5 py-4">
        <div>
          <h2 className="font-sans text-base font-semibold text-text">
            {isEdit ? "Edit Customer" : "Customer Details"}
          </h2>
          <p className="mt-0.5 text-xs text-text-muted">
            Connect this sale to a customer.
          </p>
        </div>
        <button onClick={onBack} className="text-text-muted hover:text-text">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
        {/* Insights for existing customer */}
        {isEdit && (
          <div className="flex items-center rounded-xl border border-stroke bg-bg p-4">
            {[
              { icon: <ShoppingBag className="h-4 w-4" />, label: "Total Orders", value: String(initial?.totalOrders ?? 0) },
              { icon: <Coins className="h-4 w-4" />, label: "Total Spend", value: formatCurrency(initial?.totalSpendMinor ?? 0) },
              { icon: <CalendarDays className="h-4 w-4" />, label: "Last Order", value: lastOrderShort(initial?.lastOrderAt) },
            ].map((m, i) => (
              <div key={m.label} className={`flex flex-1 flex-col items-center text-center ${i > 0 ? "border-l border-stroke" : ""}`}>
                <span className="text-text-muted">{m.icon}</span>
                <span className="mt-1.5 text-sm font-bold text-text">{m.value}</span>
                <span className="mt-0.5 text-[10px] text-text-muted">{m.label}</span>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>First Name *</label>
            <input className={inputCls} value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="e.g. John" />
          </div>
          <div>
            <label className={labelCls}>Last Name</label>
            <input className={inputCls} value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="e.g. Doe" />
          </div>
        </div>
        <div>
          <label className={labelCls}>Phone Number *</label>
          <input className={inputCls} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g. 08012345678" />
        </div>
        <div>
          <label className={labelCls}>Email Address *</label>
          <input className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="e.g. john@example.com" />
        </div>

        <div className="border-t border-stroke pt-3">
          <button
            onClick={() => setShippingOpen((p) => !p)}
            className="flex w-full items-center justify-between"
          >
            <span className="flex items-center gap-2 text-sm font-semibold text-text">
              <Truck className="h-4 w-4" /> Shipping Address (optional)
            </span>
            {shippingOpen ? <ChevronUp className="h-4 w-4 text-text-muted" /> : <ChevronDown className="h-4 w-4 text-text-muted" />}
          </button>
          {shippingOpen && (
            <div className="mt-4 space-y-3">
              <div>
                <label className={labelCls}>Street Address</label>
                <input className={inputCls} value={address} onChange={(e) => setAddress(e.target.value)} placeholder="e.g. No 9 Alaafin close" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Country</label>
                  <select
                    className={inputCls}
                    value={country}
                    onChange={(e) => {
                      setCountry(e.target.value);
                      setState("");
                    }}
                  >
                    <option value="">Select Country</option>
                    {COUNTRY_LIST.map((c, i) => (
                      <option key={`${c}-${i}`} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>State</label>
                  <select
                    className={`${inputCls} disabled:opacity-50`}
                    value={state}
                    disabled={!country}
                    onChange={(e) => setState(e.target.value)}
                  >
                    <option value="">
                      {country ? "Select State" : "Select country first"}
                    </option>
                    {(COUNTRY_TO_STATES[country] ?? []).map((s, i) => (
                      <option key={`${s}-${i}`} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>City</label>
                  <input className={inputCls} value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Ajah" />
                </div>
                <div>
                  <label className={labelCls}>Postal / Zip (optional)</label>
                  <input className={inputCls} value={postalCode} onChange={(e) => setPostalCode(e.target.value)} placeholder="e.g. 106104" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-stroke px-5 py-4 space-y-3">
        {!valid && (
          <p className="text-xs text-accent">
            * First Name, Phone Number, and Email Address are required.
          </p>
        )}
        {error && <p className="text-xs text-red-500">{error}</p>}
        <button
          onClick={handleSave}
          disabled={!valid || saving}
          className="w-full rounded-xl bg-text py-3 text-sm font-semibold text-bg transition-opacity hover:opacity-80 disabled:opacity-40"
        >
          {saving ? "Saving…" : isEdit ? "Save Changes" : "Save Customer"}
        </button>
      </div>
    </div>
  );
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
          <CustomerForm
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
