"use client";

import { useState } from "react";
import {
  X,
  Truck,
  ChevronDown,
  ChevronUp,
  ShoppingBag,
  Coins,
  CalendarDays,
  Loader2,
  Trash2,
} from "lucide-react";
import {
  createCustomer,
  updateCustomer,
  deleteCustomer,
  type CustomerDetails,
} from "@/lib/firebase/customers";
import { formatCurrency } from "@/lib/wallet/mock";
import countriesJson from "@/data/countries_and_states.json";

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

export interface SharedCustomerFormProps {
  brandId: string;
  initial?: CustomerDetails | null;
  /** Called with saved details after create/update */
  onSaved: (d: CustomerDetails) => void;
  onBack: () => void;
  /** If true, shows delete button (for CRM edit mode) */
  showDelete?: boolean;
  onDeleted?: () => void;
}

export function SharedCustomerForm({
  brandId,
  initial,
  onSaved,
  onBack,
  showDelete,
  onDeleted,
}: SharedCustomerFormProps) {
  const [firstName, setFirstName] = useState(initial?.firstName ?? "");
  const [lastName, setLastName]   = useState(initial?.lastName  ?? "");
  const [phone, setPhone]         = useState(initial?.phone     ?? "");
  const [email, setEmail]         = useState(initial?.email     ?? "");
  const [address, setAddress]     = useState(initial?.address   ?? "");
  const [city, setCity]           = useState(initial?.city      ?? "");
  const [state, setState]         = useState(initial?.state     ?? "");
  const [country, setCountry]     = useState(initial?.country   ?? "Nigeria");
  const [postalCode, setPostal]   = useState(initial?.postalCode ?? "");
  const [shippingOpen, setShippingOpen] = useState(
    !!(initial?.address || initial?.city || initial?.state)
  );
  const [saving, setSaving]   = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const isEdit = !!initial?.customerId;
  const valid  = firstName.trim() && phone.trim() && email.trim();

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
        lastName:  lastName.trim(),
        email:     email.trim(),
        phone:     phone.trim(),
        address:   address.trim(),
        city:      city.trim(),
        state:     state.trim(),
        country:   country.trim(),
        postalCode: postalCode.trim(),
        totalOrders:    initial?.totalOrders,
        totalSpendMinor: initial?.totalSpendMinor,
        lastOrderAt:    initial?.lastOrderAt,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save customer");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!initial?.customerId) return;
    if (!confirm("Delete this customer? This cannot be undone.")) return;
    setDeleting(true);
    try {
      await deleteCustomer({ brandId, customerId: initial.customerId });
      onDeleted?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setDeleting(false);
    }
  }

  const inputCls =
    "w-full rounded-xl border border-stroke bg-bg px-3.5 py-2.5 text-sm text-text placeholder:text-text-muted outline-none focus:border-accent";
  const labelCls = "mb-1.5 block text-xs font-medium text-text-muted";

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-stroke px-5 py-4">
        <div>
          <h2 className="font-heading text-base font-semibold text-text">
            {isEdit ? "Edit Customer" : "Customer Details"}
          </h2>
          <p className="mt-0.5 text-xs text-text-muted">
            {isEdit ? "Update customer information." : "Add a customer to your CRM."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {showDelete && isEdit && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="p-2 rounded-xl hover:bg-alert/10 text-alert transition-colors disabled:opacity-50"
              title="Delete customer"
            >
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            </button>
          )}
          <button onClick={onBack} className="text-text-muted hover:text-text">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
        {/* Stats row for edit mode */}
        {isEdit && (
          <div className="flex items-center rounded-xl border border-stroke bg-bg p-4">
            {[
              { icon: <ShoppingBag className="h-4 w-4" />, label: "Total Orders",  value: String(initial?.totalOrders ?? 0) },
              { icon: <Coins className="h-4 w-4" />,        label: "Total Spend",   value: formatCurrency(initial?.totalSpendMinor ?? 0) },
              { icon: <CalendarDays className="h-4 w-4" />, label: "Last Order",    value: lastOrderShort(initial?.lastOrderAt) },
            ].map((m, i) => (
              <div key={m.label} className={`flex flex-1 flex-col items-center text-center ${i > 0 ? "border-l border-stroke" : ""}`}>
                <span className="text-text-muted">{m.icon}</span>
                <span className="mt-1.5 text-sm font-bold text-text">{m.value}</span>
                <span className="mt-0.5 text-[10px] text-text-muted">{m.label}</span>
              </div>
            ))}
          </div>
        )}

        {/* Name row */}
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
          <input className={inputCls} type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g. 08012345678" />
        </div>

        <div>
          <label className={labelCls}>Email Address *</label>
          <input className={inputCls} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="e.g. john@example.com" />
        </div>

        {/* Shipping Address */}
        <div className="border-t border-stroke pt-3">
          <button
            onClick={() => setShippingOpen((p) => !p)}
            className="flex w-full items-center justify-between"
          >
            <span className="flex items-center gap-2 text-sm font-semibold text-text">
              <Truck className="h-4 w-4" /> Shipping Address (optional)
            </span>
            {shippingOpen
              ? <ChevronUp className="h-4 w-4 text-text-muted" />
              : <ChevronDown className="h-4 w-4 text-text-muted" />}
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
                  <select className={inputCls} value={country} onChange={(e) => { setCountry(e.target.value); setState(""); }}>
                    <option value="">Select Country</option>
                    {COUNTRY_LIST.map((c, i) => <option key={`${c}-${i}`} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>State</label>
                  <select className={`${inputCls} disabled:opacity-50`} value={state} disabled={!country} onChange={(e) => setState(e.target.value)}>
                    <option value="">{country ? "Select State" : "Select country first"}</option>
                    {(COUNTRY_TO_STATES[country] ?? []).map((s, i) => <option key={`${s}-${i}`} value={s}>{s}</option>)}
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
                  <input className={inputCls} value={postalCode} onChange={(e) => setPostal(e.target.value)} placeholder="e.g. 106104" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-stroke px-5 py-4 space-y-3">
        {!valid && (
          <p className="text-xs text-accent">* First Name, Phone Number, and Email Address are required.</p>
        )}
        {error && <p className="text-xs text-alert">{error}</p>}
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
