"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ChevronLeft,
  X,
  Search,
  Plus,
  Megaphone,
  Link2,
  AlertTriangle,
  Loader2,
  Users,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import { subscribeBrandCustomers, Customer } from "@/lib/firebase/queries/customers";
import { sendCustomerCampaign } from "@/lib/firebase/customers";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/firebaseConfig";

type SegmentKey = "all" | "new" | "returning" | "top" | "lapsed";

const SEGMENTS: { key: SegmentKey; label: string }[] = [
  { key: "all",       label: "All Customers" },
  { key: "new",       label: "New Customers" },
  { key: "returning", label: "Returning Customers" },
  { key: "top",       label: "Top Customers (Top 10%)" },
  { key: "lapsed",    label: "Lapsed (30+ days inactive)" },
];

export default function SendCampaignPage() {
  const { user } = useAuth();
  const brandId = user?.uid ?? "";
  const router = useRouter();
  const searchParams = useSearchParams();

  // Pre-filled from query params (e.g. from customer profile or group)
  const initCustomerIds = searchParams.get("customerIds")?.split(",").filter(Boolean) ?? [];
  const initSegment     = (searchParams.get("segment") as SegmentKey) ?? "all";

  // Mode: broadcast (segment) vs targeted (specific customers)
  const [mode, setMode]         = useState<"segment" | "targeted">(initCustomerIds.length > 0 ? "targeted" : "segment");
  const [segment, setSegment]   = useState<SegmentKey>(initSegment);
  const [pickedIds, setPickedIds] = useState<Set<string>>(new Set(initCustomerIds));

  // Email content
  const [subject, setSubject]   = useState("New collection drop 🚀");
  const [message, setMessage]   = useState("");
  const [ctaText, setCtaText]   = useState("");
  const [ctaLink, setCtaLink]   = useState("");
  const [showCta, setShowCta]   = useState(false);

  // Customer data
  const [customers, setCustomers]   = useState<Customer[]>([]);
  const [loadingCx, setLoadingCx]   = useState(true);
  const [creditsBalance, setCreditsBalance] = useState<number>(0);

  // Picker sheet
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerSearch, setPickerSearch] = useState("");

  // Submit
  const [sending, setSending]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [sent, setSent]         = useState(false);

  // Load customers + credits
  useEffect(() => {
    if (!brandId) return;
    let isActive = true;
    const unsub = subscribeBrandCustomers(brandId, (list) => {
      if (!isActive) return;
      setCustomers(list);
      setLoadingCx(false);
    });
    getDoc(doc(db, "brands", brandId)).then((snap) => {
      if (!isActive) return;
      const data = snap.data();
      setCreditsBalance(Number(data?.credits?.balance ?? 0));
    });
    return () => { isActive = false; unsub(); };
  }, [brandId]);

  // Compute recipient count
  const recipientCount = useMemo(() => {
    if (mode === "targeted") return pickedIds.size;
    const THIRTY_DAYS_AGO = new Date(Date.now() - 30 * 86400000);
    switch (segment) {
      case "new":       return customers.filter((c) => c.totalOrders === 1).length;
      case "returning": return customers.filter((c) => c.totalOrders >= 2).length;
      case "top": {
        const withSpend = customers.filter((c) => c.totalSpendMinor > 0);
        return Math.max(1, Math.ceil(withSpend.length * 0.1));
      }
      case "lapsed":    return customers.filter((c) => c.lastOrderAt && c.lastOrderAt < THIRTY_DAYS_AGO).length;
      default:          return customers.length;
    }
  }, [mode, segment, pickedIds, customers]);

  const creditsOk = creditsBalance >= recipientCount;

  async function handleSend() {
    if (!subject.trim()) { setError("Subject is required"); return; }
    if (!message.trim()) { setError("Message is required"); return; }
    if (recipientCount === 0) { setError("No recipients selected"); return; }
    if (!creditsOk) { setError(`Insufficient credits. You need ${recipientCount} but have ${creditsBalance}.`); return; }

    setSending(true);
    setError(null);
    try {
      await sendCustomerCampaign({
        brandId,
        subject: subject.trim(),
        message: message.trim(),
        ...(mode === "segment" ? { segment } : { customerIds: [...pickedIds] }),
        ...(showCta && ctaText.trim() ? { ctaText: ctaText.trim(), ctaLink: ctaLink.trim() } : {}),
      });
      setSent(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to send campaign");
    } finally {
      setSending(false);
    }
  }

  // ── Picker sheet filtered list
  const pickerFiltered = customers.filter((c) => {
    const q = pickerSearch.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      (c.email ?? "").toLowerCase().includes(q) ||
      (c.phoneNumber ?? "").includes(pickerSearch)
    );
  });

  if (sent) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-5 px-8">
        <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center">
          <CheckCircle2 className="w-10 h-10 text-accent" />
        </div>
        <div>
          <h2 className="font-heading font-semibold text-xl text-text">Campaign sent!</h2>
          <p className="text-sm text-text-muted mt-2 leading-relaxed">
            Your campaign is on its way to {recipientCount} recipient{recipientCount !== 1 ? "s" : ""}.
          </p>
        </div>
        <button
          onClick={() => router.push("/customers")}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cta text-bg text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          Back to Customers
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-xl border border-stroke hover:bg-surface text-text-muted hover:text-text transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="font-heading font-semibold text-xl text-text">Send Campaign</h1>
          <p className="text-sm text-text-muted mt-0.5">Email your customers directly</p>
        </div>
      </div>

      {/* Audience */}
      <section className="bg-surface rounded-2xl border border-stroke p-5 space-y-4">
        <h2 className="font-semibold text-sm text-text flex items-center gap-2">
          <Users className="w-4 h-4 text-text-muted" /> Audience
        </h2>

        {/* Mode toggle */}
        <div className="flex rounded-xl border border-stroke overflow-hidden text-sm font-semibold">
          {(["segment", "targeted"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex-1 py-2 transition-colors ${
                mode === m ? "bg-cta/10 text-cta" : "text-text-muted hover:text-text hover:bg-bg"
              }`}
            >
              {m === "segment" ? "By Segment" : "Specific Customers"}
            </button>
          ))}
        </div>

        {mode === "segment" ? (
          <div className="space-y-2">
            {SEGMENTS.map((s) => (
              <button
                key={s.key}
                onClick={() => setSegment(s.key)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left ${
                  segment === s.key
                    ? "border-cta/40 bg-cta/5 text-cta"
                    : "border-stroke bg-bg text-text hover:border-stroke/80"
                }`}
              >
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${segment === s.key ? "border-cta" : "border-stroke"}`}>
                  {segment === s.key && <div className="w-2 h-2 rounded-full bg-cta" />}
                </div>
                <span className="text-sm font-medium">{s.label}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {/* Selected chips */}
            {pickedIds.size > 0 && (
              <div className="flex flex-wrap gap-2">
                {[...pickedIds].map((id) => {
                  const c = customers.find((cx) => cx.id === id);
                  return (
                    <span key={id} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cta/10 text-cta text-xs font-semibold border border-cta/20">
                      {c?.name ?? id}
                      <button onClick={() => setPickedIds((p) => { const n = new Set(p); n.delete(id); return n; })}>
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
            <button
              onClick={() => setPickerOpen(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl border border-stroke text-sm font-semibold text-text-muted hover:text-text hover:border-accent/40 transition-colors"
            >
              <Plus className="w-4 h-4" />
              {pickedIds.size === 0 ? "Add Recipients" : "Add More"}
            </button>
          </div>
        )}

        {/* Recipient count + credits */}
        <div className={`flex items-center justify-between px-4 py-3 rounded-xl border ${creditsOk ? "border-stroke bg-bg" : "border-alert/30 bg-alert/5"}`}>
          <span className="text-sm text-text-muted">
            {loadingCx ? "Counting recipients…" : `${recipientCount} recipient${recipientCount !== 1 ? "s" : ""}`}
          </span>
          <span className={`text-xs font-semibold ${creditsOk ? "text-accent" : "text-alert"}`}>
            {creditsBalance} credits available
          </span>
        </div>
        {!creditsOk && recipientCount > 0 && (
          <div className="flex items-start gap-2 px-4 py-3 rounded-xl bg-alert/8 border border-alert/20">
            <AlertTriangle className="w-4 h-4 text-alert flex-shrink-0 mt-0.5" />
            <p className="text-xs text-alert leading-relaxed">
              You need <strong>{recipientCount}</strong> credits to send this campaign but only have <strong>{creditsBalance}</strong>. Purchase credits to continue.
            </p>
          </div>
        )}
      </section>

      {/* Content */}
      <section className="bg-surface rounded-2xl border border-stroke p-5 space-y-4">
        <h2 className="font-semibold text-sm text-text flex items-center gap-2">
          <Megaphone className="w-4 h-4 text-text-muted" /> Email Content
        </h2>

        <div>
          <label className="text-xs font-medium text-text-muted block mb-1.5">Subject *</label>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="e.g. New collection drop 🚀"
            className="w-full px-4 py-2.5 rounded-xl border border-stroke bg-bg text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-text-muted block mb-1.5">Message *</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Write your campaign message here…"
            rows={6}
            className="w-full px-4 py-2.5 rounded-xl border border-stroke bg-bg text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors resize-none"
          />
        </div>
      </section>

      {/* CTA Button (optional) */}
      <section className="bg-surface rounded-2xl border border-stroke p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-sm text-text flex items-center gap-2">
            <Link2 className="w-4 h-4 text-text-muted" /> Call-to-Action Button
            <span className="text-[10px] font-normal text-text-muted bg-stroke/50 px-2 py-0.5 rounded-full">optional</span>
          </h2>
          <button
            onClick={() => setShowCta((p) => !p)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${showCta ? "border-cta/30 bg-cta/5 text-cta" : "border-stroke text-text-muted hover:text-text"}`}
          >
            {showCta ? "Remove" : "Add CTA"}
          </button>
        </div>

        {showCta && (
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-text-muted block mb-1.5">Button Text</label>
              <input
                value={ctaText}
                onChange={(e) => setCtaText(e.target.value)}
                placeholder="e.g. Shop Now"
                className="w-full px-4 py-2.5 rounded-xl border border-stroke bg-bg text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-text-muted block mb-1.5">Button Link</label>
              <input
                value={ctaLink}
                onChange={(e) => setCtaLink(e.target.value)}
                placeholder="https://your-store.labeld.app"
                className="w-full px-4 py-2.5 rounded-xl border border-stroke bg-bg text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
              />
            </div>
          </div>
        )}
      </section>

      {/* Error + Send */}
      {error && (
        <div className="flex items-start gap-2 px-4 py-3 rounded-xl bg-alert/8 border border-alert/20">
          <AlertTriangle className="w-4 h-4 text-alert flex-shrink-0 mt-0.5" />
          <p className="text-sm text-alert">{error}</p>
        </div>
      )}

      <button
        onClick={handleSend}
        disabled={sending || !creditsOk || recipientCount === 0}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-cta text-bg text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-40"
      >
        {sending ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</>
        ) : (
          <><Megaphone className="w-4 h-4" /> Send to {recipientCount} recipient{recipientCount !== 1 ? "s" : ""}</>
        )}
      </button>

      {/* Recipient picker sheet */}
      {pickerOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setPickerOpen(false)} />
          <div className="relative z-10 w-full sm:max-w-md bg-surface rounded-t-3xl sm:rounded-2xl shadow-2xl border border-stroke/50 flex flex-col max-h-[85dvh]">
            <div className="flex justify-center pt-3 pb-1 sm:hidden">
              <div className="w-10 h-1 rounded-full bg-stroke" />
            </div>
            <div className="flex items-center justify-between px-5 pt-4 pb-4 border-b border-stroke/50">
              <h3 className="font-heading font-semibold text-base text-text">Add Recipients</h3>
              <button onClick={() => setPickerOpen(false)} className="p-2 rounded-xl hover:bg-bg text-text-muted">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-5 py-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" />
                <input
                  value={pickerSearch}
                  onChange={(e) => setPickerSearch(e.target.value)}
                  placeholder="Search customer…"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-stroke bg-bg text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-accent"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-5 pb-5 divide-y divide-stroke/50">
              {pickerFiltered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center gap-2">
                  <Users className="w-6 h-6 text-text-muted" />
                  <p className="text-sm text-text-muted">No customers found</p>
                </div>
              ) : pickerFiltered.map((c) => {
                const selected = pickedIds.has(c.id);
                return (
                  <button
                    key={c.id}
                    onClick={() => setPickedIds((p) => {
                      const n = new Set(p);
                      if (n.has(c.id)) n.delete(c.id); else n.add(c.id);
                      return n;
                    })}
                    className="w-full flex items-center gap-3 py-3 text-left"
                  >
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${selected ? "border-cta bg-cta" : "border-stroke"}`}>
                      {selected && <div className="w-2.5 h-2.5 rounded-sm bg-bg" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-text truncate">{c.name}</p>
                      <p className="text-xs text-text-muted truncate">{c.email || c.phoneNumber || "—"}</p>
                    </div>
                    <span className="text-xs text-text-muted flex-shrink-0">{c.totalOrders} orders</span>
                  </button>
                );
              })}
            </div>
            <div className="px-5 py-4 border-t border-stroke/50">
              <button
                onClick={() => setPickerOpen(false)}
                className="w-full py-3 rounded-xl bg-cta text-bg text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                Done · {pickedIds.size} selected
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
