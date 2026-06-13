"use client";

import { useState, useEffect, useRef } from "react";
import {
  X,
  Search,
  Plus,
  Minus,
  Trash2,
  ImageIcon,
  ChevronRight,
  Circle,
  CircleDot,
} from "lucide-react";
import Image from "next/image";
import { useAuth } from "@/lib/auth/AuthContext";
import { getProductListForBrand } from "@/lib/firebase/queries/product";
import {
  logManualSale,
  ManualSaleError,
  type ManualSaleItem,
  type SaleChannel,
  type PaymentMethod,
} from "@/lib/firebase/manual-sale";
import { customerFullName, type CustomerDetails } from "@/lib/firebase/customers";
import type { Product } from "@/lib/models/product";
import { formatCurrency } from "@/lib/wallet/mock";
import VariantSelectorModal from "./record-sale/VariantSelectorModal";
import CustomerSheet from "./record-sale/CustomerSheet";
import MaskIcon from "./record-sale/MaskIcon";

const ICON = "/icons/manual-sale";

// ─── helpers ──────────────────────────────────────────────────────────────

function buildVariantKey(size?: string | null, color?: string | null): string {
  return [size ?? "", color ?? ""].filter(Boolean).join("-");
}

function calculatedRemaining(p: Product): number {
  if (p.stockMode === "variants" && p.variantStock) {
    return Object.values(p.variantStock).reduce((sum, v) => sum + v, 0);
  }
  return p.stockRemaining ?? 0;
}

/** No defined capacity limit — matches mobile's ProductModel.isUnlimited. */
function isUnlimited(p: Product): boolean {
  return (p.stockMode === "global" || p.stockMode == null) && p.stockRemaining == null;
}

function isSoldOut(p: Product): boolean {
  return !isUnlimited(p) && calculatedRemaining(p) <= 0;
}

function isLowStock(p: Product): boolean {
  const r = calculatedRemaining(p);
  return !isUnlimited(p) && r > 0 && r < 5;
}

function formatSaleDate(d: Date): string {
  const now = new Date();
  const isToday =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  let hours = d.getHours() % 12;
  if (hours === 0) hours = 12;
  const mins = d.getMinutes().toString().padStart(2, "0");
  const ampm = d.getHours() >= 12 ? "PM" : "AM";
  const time = `${hours}:${mins} ${ampm}`;
  if (isToday) return `Today, ${time}`;
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${months[d.getMonth()]} ${d.getDate()}, ${time}`;
}

function toDatetimeLocal(d: Date): string {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// ─── channel config ─────────────────────────────────────────────────────────

const CHANNELS: { value: SaleChannel; label: string; icon: string }[] = [
  { value: "physical_store", label: "In-store", icon: `${ICON}/store.svg` },
  { value: "pop_up", label: "Pop-up/Event", icon: `${ICON}/tents.svg` },
  { value: "instagram", label: "Instagram", icon: `${ICON}/instagram-bold.svg` },
  { value: "whatsapp", label: "WhatsApp", icon: `${ICON}/whatsapp.svg` },
  { value: "snapchat", label: "Snapchat", icon: `${ICON}/snapchat.svg` },
  { value: "tiktok", label: "TikTok", icon: `${ICON}/tiktok.svg` },
  { value: "other", label: "Other", icon: `${ICON}/circle-dashed.svg` },
];

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "cash", label: "Cash" },
  { value: "transfer", label: "Transfer" },
  { value: "pos", label: "POS" },
];

// ─── shared bits ──────────────────────────────────────────────────────────

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <p className="font-sans text-sm font-semibold text-text">
      {children}
      {required && <span className="text-accent"> *</span>}
    </p>
  );
}

function GroupCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-stroke/60 bg-surface p-5">{children}</div>
  );
}

// ─── product cart card ──────────────────────────────────────────────────────

function CartCard({
  item,
  onQty,
}: {
  item: ManualSaleItem;
  onQty: (delta: number) => void;
}) {
  const variantText = [item.color, item.size].filter(Boolean).join(" / ");
  return (
    <div className="mb-3 flex items-center gap-3 rounded-xl border border-stroke/60 bg-surface p-3 last:mb-0">
      {item.mainVisualUrl ? (
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg">
          <Image src={item.mainVisualUrl} alt={item.name} fill className="object-cover" />
        </div>
      ) : (
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-bg text-text-muted">
          <ImageIcon className="h-5 w-5" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-text">{item.name}</p>
        {variantText && <p className="mt-0.5 text-xs text-text-muted">{variantText}</p>}
        <p className="mt-1 text-sm font-semibold text-text">
          {formatCurrency(item.unitPriceMinor)}
        </p>
      </div>
      <div className="flex items-center rounded-lg border border-stroke/60">
        <button
          onClick={() => onQty(-1)}
          className="flex h-8 w-9 items-center justify-center text-text-muted hover:text-text"
        >
          {item.quantity === 1 ? (
            <Trash2 className="h-4 w-4 text-red-500" />
          ) : (
            <Minus className="h-4 w-4" />
          )}
        </button>
        <span className="w-7 text-center text-sm font-semibold text-text">{item.quantity}</span>
        <button
          onClick={() => onQty(1)}
          className="flex h-8 w-9 items-center justify-center text-text-muted hover:text-text"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// ─── product picker sub-sheet ─────────────────────────────────────────────────

function ProductPickerSheet({
  products,
  loading,
  cart,
  onToggle,
  onPickVariant,
  onClose,
}: {
  products: Product[];
  loading: boolean;
  cart: ManualSaleItem[];
  onToggle: (p: Product) => void;
  onPickVariant: (p: Product) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");
  const filtered = products.filter((p) =>
    p.dropName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[60] flex items-stretch justify-end">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 flex w-full max-w-md flex-col bg-surface font-sans shadow-2xl">
        <div className="flex items-center justify-between border-b border-stroke px-5 py-4">
          <h2 className="font-sans text-base font-semibold text-text">Add Products</h2>
          <button onClick={onClose} className="text-text-muted hover:text-text">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-5 py-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search product…"
              className="w-full rounded-xl border border-stroke bg-bg py-2.5 pl-9 pr-3 text-sm text-text placeholder:text-text-muted outline-none focus:border-accent"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-5 pb-5">
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <div key={n} className="h-16 animate-pulse rounded-xl bg-bg" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <MaskIcon src={`${ICON}/box-add.svg`} size={32} className="text-text-muted" />
              <p className="mt-3 font-sans text-sm font-semibold text-text-muted">
                {search ? "No matching products" : "No products found"}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-stroke/60">
              {filtered.map((p) => {
                const soldOut = isSoldOut(p);
                const selectedItems = cart.filter((c) => c.productId === p.id);
                const isSelected = selectedItems.length > 0;
                const isVariant = p.stockMode === "variants";
                return (
                  <div
                    key={p.id}
                    className={`flex items-center gap-3 py-3 ${soldOut ? "opacity-50" : "cursor-pointer"}`}
                    onClick={() => {
                      if (soldOut) return;
                      if (isVariant) onPickVariant(p);
                      else onToggle(p);
                    }}
                  >
                    {p.mainVisualUrl ? (
                      <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg border border-stroke/60">
                        <Image src={p.mainVisualUrl} alt={p.dropName} fill className="object-cover" />
                      </div>
                    ) : (
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-bg text-text-muted">
                        <ImageIcon className="h-4 w-4" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-semibold text-text">{p.dropName}</p>
                        {soldOut ? (
                          <span className="rounded border border-stroke px-1.5 py-0.5 text-[9px] font-bold tracking-wide text-red-500">
                            SOLD OUT
                          </span>
                        ) : isLowStock(p) ? (
                          <span className="rounded border border-orange-500/30 bg-orange-500/10 px-1.5 py-0.5 text-[9px] font-bold tracking-wide text-orange-500">
                            LOW STOCK
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-0.5 text-xs text-text-muted">
                        {formatCurrency(p.price * 100)}
                      </p>
                      {isSelected && isVariant && (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {selectedItems.map((it) => (
                            <span
                              key={it.variantKey}
                              className="rounded border border-stroke bg-bg px-1.5 py-0.5 text-[10px] font-semibold text-text"
                            >
                              {[it.color, it.size].filter(Boolean).join(" / ")} ({it.quantity})
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    {!isVariant && (
                      <div
                        className={`flex h-5 w-5 items-center justify-center rounded border ${
                          isSelected ? "border-text bg-text text-bg" : "border-text-muted"
                        }`}
                      >
                        {isSelected && <Plus className="h-3 w-3 rotate-45" />}
                      </div>
                    )}
                    {isVariant && <ChevronRight className="h-4 w-4 text-text-muted" />}
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div className="border-t border-stroke px-5 py-4">
          <button
            onClick={onClose}
            className="w-full rounded-xl bg-text py-3 text-sm font-semibold text-bg transition-opacity hover:opacity-80"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── main drawer ──────────────────────────────────────────────────────────

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function RecordSaleDrawer({ open, onClose, onSuccess }: Props) {
  const { user } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  const [cart, setCart] = useState<ManualSaleItem[]>([]);
  const [channel, setChannel] = useState<SaleChannel | null>(null);
  const [isPaid, setIsPaid] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>("cash");
  const [shipping, setShipping] = useState("");
  const [note, setNote] = useState("");
  const [saleDate, setSaleDate] = useState<Date>(new Date());
  const [customer, setCustomer] = useState<CustomerDetails | null>(null);

  const [pickerOpen, setPickerOpen] = useState(false);
  const [variantProduct, setVariantProduct] = useState<Product | null>(null);
  const [customerSheetOpen, setCustomerSheetOpen] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dateInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open || !user?.uid) return;
    setLoadingProducts(true);
    getProductListForBrand(user.uid)
      .then(setProducts)
      .finally(() => setLoadingProducts(false));
  }, [open, user?.uid]);

  useEffect(() => {
    if (!open) {
      setCart([]);
      setChannel(null);
      setIsPaid(true);
      setPaymentMethod("cash");
      setShipping("");
      setNote("");
      setSaleDate(new Date());
      setCustomer(null);
      setError(null);
      setPickerOpen(false);
      setVariantProduct(null);
      setCustomerSheetOpen(false);
    }
  }, [open]);

  // ── cart ops ──
  function toggleProduct(p: Product) {
    const exists = cart.find((c) => c.productId === p.id && !c.variantKey);
    if (exists) {
      setCart((prev) => prev.filter((c) => !(c.productId === p.id && !c.variantKey)));
      return;
    }
    const unitPriceMinor = Math.round(p.price * 100);
    setCart((prev) => [
      ...prev,
      {
        productId: p.id,
        name: p.dropName,
        mainVisualUrl: p.mainVisualUrl,
        unitPriceMinor,
        quantity: 1,
        size: null,
        color: null,
        variantKey: null,
        subtotalMinor: unitPriceMinor,
        stockMode: (p.stockMode ?? "unlimited") as ManualSaleItem["stockMode"],
      },
    ]);
  }

  function addVariantItem(item: ManualSaleItem) {
    setCart((prev) => {
      const idx = prev.findIndex(
        (c) => c.productId === item.productId && c.size === item.size && c.color === item.color
      );
      if (idx >= 0) {
        return prev.map((c, i) =>
          i === idx
            ? { ...c, quantity: c.quantity + item.quantity, subtotalMinor: c.unitPriceMinor * (c.quantity + item.quantity) }
            : c
        );
      }
      return [...prev, item];
    });
  }

  function updateQty(idx: number, delta: number) {
    setCart((prev) =>
      prev
        .map((c, i) => {
          if (i !== idx) return c;
          const q = c.quantity + delta;
          return { ...c, quantity: q, subtotalMinor: c.unitPriceMinor * q };
        })
        .filter((c) => c.quantity > 0)
    );
  }

  const totalItems = cart.reduce((s, c) => s + c.quantity, 0);
  const itemsMinor = cart.reduce((s, c) => s + c.subtotalMinor, 0);
  const shippingNaira = parseInt(shipping.trim() || "0", 10) || 0;
  const grandTotalMinor = itemsMinor + shippingNaira * 100;

  const showShipping =
    cart.length > 0 && channel !== "physical_store" && channel !== "pop_up";

  const canSubmit =
    cart.length > 0 &&
    channel !== null &&
    (!isPaid || paymentMethod !== null) &&
    !submitting;

  async function handleSubmit() {
    if (!user?.uid || !canSubmit || !channel) return;
    setSubmitting(true);
    setError(null);

    const deliverTo = customer
      ? {
          fullName: customerFullName(customer),
          ...(customer.email ? { email: customer.email } : {}),
          ...(customer.phone ? { phone: customer.phone } : {}),
          ...(customer.address ? { address: customer.address } : {}),
          ...(customer.city ? { city: customer.city } : {}),
          ...(customer.state ? { state: customer.state } : {}),
          ...(customer.country ? { country: customer.country } : {}),
          ...(customer.postalCode ? { postalCode: customer.postalCode } : {}),
          notes: "",
        }
      : undefined;

    try {
      await logManualSale({
        brandId: user.uid,
        recordedBy: user.uid,
        items: cart,
        saleChannel: channel,
        paymentMethod: isPaid ? (paymentMethod as PaymentMethod) : "pending",
        note: note.trim() || undefined,
        shippingMinor: showShipping ? shippingNaira * 100 : 0,
        deliverTo,
        saleDate,
      });
      onSuccess();
      onClose();
    } catch (e) {
      setError(e instanceof ManualSaleError ? e.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-bg font-sans shadow-2xl transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stroke px-5 py-4">
          <h2 className="font-heading text-lg font-semibold text-text">Record a Sale</h2>
          <button onClick={onClose} className="text-text-muted hover:text-text transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
          <p className="text-sm text-text-muted">
            Log a manual sale to keep your inventory and revenue in sync.
          </p>

          {/* ── Sales Source ── */}
          <GroupCard>
            <div className="flex items-start justify-between gap-3">
              <Label required>Where did the order happen?</Label>
              <button
                onClick={() => dateInputRef.current?.showPicker?.()}
                className="relative flex items-center gap-1 font-sans text-xs !font-sans font-semibold text-accent"
              >
                {formatSaleDate(saleDate)}
                <MaskIcon src={`${ICON}/calendar-edit.svg`} size={14} />
                <input
                  ref={dateInputRef}
                  type="datetime-local"
                  value={toDatetimeLocal(saleDate)}
                  max={toDatetimeLocal(new Date())}
                  onChange={(e) => e.target.value && setSaleDate(new Date(e.target.value))}
                  className="absolute inset-0 h-0 w-0 opacity-0"
                />
              </button>
            </div>
            <p className="mt-1 text-xs text-text-muted">
              Log where the sale closed, not discovery.
            </p>
            <div className="mt-4 grid grid-cols-3 gap-2.5">
              {CHANNELS.map((c) => {
                const selected = channel === c.value;
                return (
                  <button
                    key={c.value}
                    onClick={() => setChannel(c.value)}
                    className={`flex !font-sans flex-col items-center justify-center gap-1.5 rounded-2xl border py-3.5 transition-colors ${
                      selected
                        ? "border-text/50 bg-text/10 text-text"
                        : "border-stroke/60 bg-surface text-text-muted hover:border-text/30"
                    }`}
                  >
                    <MaskIcon src={c.icon} size={20} />
                    <span className={`font-sans text-[11px] ${selected ? "font-semibold text-text" : "font-medium"}`}>
                      {c.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </GroupCard>

          {/* ── Products ── */}
          <GroupCard>
            <div className="flex items-center justify-between">
              <Label required>Products</Label>
              {cart.length > 0 && (
                <button
                  onClick={() => setPickerOpen(true)}
                  className="text-sm !font-sans font-semibold text-text hover:opacity-70"
                >
                  + Add more
                </button>
              )}
            </div>
            <div className="mt-3">
              {cart.length === 0 ? (
                <button
                  onClick={() => setPickerOpen(true)}
                  className="flex !font-sans w-full flex-col items-center justify-center gap-2 rounded-xl border border-stroke bg-surface py-6 text-text-muted hover:border-text/30 transition-colors"
                >
                  <MaskIcon src={`${ICON}/box-add.svg`} size={28} />
                  <span className="font-sans text-sm font-semibold text-text">+ Add products</span>
                </button>
              ) : (
                cart.map((item, idx) => (
                  <CartCard
                    key={`${item.productId}-${item.variantKey ?? "none"}`}
                    item={item}
                    onQty={(d) => updateQty(idx, d)}
                  />
                ))
              )}
            </div>
          </GroupCard>

          {/* ── Payment ── */}
          <GroupCard>
            <Label required>Payment Status</Label>
            <div className="mt-3 flex items-center gap-6">
              {[
                { paid: true, label: "Paid" },
                { paid: false, label: "Unpaid" },
              ].map((opt) => {
                const selected = isPaid === opt.paid;
                return (
                  <button
                    key={opt.label}
                    onClick={() => {
                      setIsPaid(opt.paid);
                      if (opt.paid) {
                        if (!paymentMethod) setPaymentMethod("cash");
                      } else {
                        setPaymentMethod(null);
                      }
                    }}
                    className="flex !font-sans items-center gap-2"
                  >
                    {selected ? (
                      <CircleDot className="h-5 w-5 text-text" />
                    ) : (
                      <Circle className="h-5 w-5 text-text-muted" />
                    )}
                    <span className={`text-sm ${selected ? "font-semibold text-text" : "text-text-muted"}`}>
                      {opt.label}
                    </span>
                  </button>
                );
              })}
            </div>

            {isPaid && (
              <div className="mt-4">
                <Label required>Payment Method</Label>
                <div className="mt-3 flex flex-wrap gap-2">
                  {PAYMENT_METHODS.map((m) => {
                    const selected = paymentMethod === m.value;
                    return (
                      <button
                        key={m.value}
                        onClick={() => setPaymentMethod(m.value)}
                        className={`rounded-full !font-sans border px-4 py-2 text-sm transition-colors ${
                          selected
                            ? "border-text/50 bg-text/10 font-semibold text-text"
                            : "border-stroke/60 bg-surface font-medium text-text-muted hover:border-text/30"
                        }`}
                      >
                        {m.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </GroupCard>

          {/* ── Shipping ── */}
          {showShipping && (
            <GroupCard>
              <Label>Shipping Fee (optional)</Label>
              <div className="mt-3 flex items-center rounded-xl border border-stroke bg-surface px-3.5">
                <span className="text-sm font-semibold text-text-muted">₦</span>
                <input
                  type="number"
                  min="0"
                  value={shipping}
                  onChange={(e) => setShipping(e.target.value)}
                  placeholder="e.g. 1500"
                  className="w-full bg-transparent py-2.5 pl-2 text-sm text-text placeholder:text-text-muted outline-none"
                />
              </div>
            </GroupCard>
          )}

          {/* ── Customer ── */}
          <GroupCard>
            <div className="flex items-center justify-between">
              <Label>Customer Details</Label>
              {customer && (
                <button
                  onClick={() => setCustomer(null)}
                  className="text-xs !font-sans font-semibold text-red-500 hover:opacity-70"
                >
                  Remove
                </button>
              )}
            </div>
            <div className="mt-3">
              {!customer ? (
                <button
                  onClick={() => setCustomerSheetOpen(true)}
                  className="flex !font-sans w-full items-center gap-2 rounded-xl border border-stroke bg-surface px-4 py-3.5 text-text-muted hover:border-text/30 transition-colors"
                >
                  <MaskIcon src={`${ICON}/profile-add.svg`} size={20} />
                  <span className="font-sans text-sm font-medium">Add Customer Details (optional)</span>
                </button>
              ) : (
                <button
                  onClick={() => setCustomerSheetOpen(true)}
                  className="flex w-full items-center gap-3 rounded-xl border border-stroke/60 bg-surface p-3 text-left"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-text/5 text-text">
                    <MaskIcon src={`${ICON}/profile.svg`} size={20} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-text">
                      {customerFullName(customer)}
                    </p>
                    {(customer.phone || customer.email) && (
                      <p className="truncate text-xs text-text-muted">
                        {[customer.phone, customer.email].filter(Boolean).join(" • ")}
                      </p>
                    )}
                    {customer.address && (
                      <p className="truncate text-xs text-text-muted">
                        {[customer.address, customer.city, customer.state].filter(Boolean).join(", ")}
                      </p>
                    )}
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-text-muted" />
                </button>
              )}
            </div>
          </GroupCard>

          {/* ── Reference ── */}
          <GroupCard>
            <Label>Reference (optional)</Label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder='e.g. "IG DM", "Pop-up customer"…'
              className="mt-3 w-full resize-none rounded-xl border border-stroke bg-surface px-3.5 py-2.5 text-sm text-text placeholder:text-text-muted outline-none focus:border-accent"
            />
          </GroupCard>
        </div>

        {/* Footer */}
        <div className="border-t border-stroke px-5 py-4">
          {error && (
            <p className="mb-3 rounded-xl bg-red-500/10 px-4 py-2.5 text-sm text-red-500">{error}</p>
          )}
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <p className="text-xs font-medium text-text-muted">
                {totalItems} item{totalItems === 1 ? "" : "s"}
                {showShipping && shippingNaira > 0 ? " + shipping" : ""}
              </p>
              <p className="mt-0.5 text-lg font-bold text-text">
                {formatCurrency(grandTotalMinor)}
              </p>
            </div>
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="flex-1 rounded-xl bg-text py-3 text-sm font-semibold text-bg transition-opacity hover:opacity-80 disabled:opacity-40"
            >
              {submitting ? "Recording…" : "Record Sale"}
            </button>
          </div>
        </div>
      </div>

      {/* Sub-sheets */}
      {pickerOpen && (
        <ProductPickerSheet
          products={products}
          loading={loadingProducts}
          cart={cart}
          onToggle={toggleProduct}
          onPickVariant={(p) => setVariantProduct(p)}
          onClose={() => setPickerOpen(false)}
        />
      )}

      {variantProduct && (
        <VariantSelectorModal
          product={variantProduct}
          onClose={() => setVariantProduct(null)}
          onAdd={addVariantItem}
        />
      )}

      {customerSheetOpen && user?.uid && (
        <CustomerSheet
          brandId={user.uid}
          selected={customer}
          onSelect={setCustomer}
          onClose={() => setCustomerSheetOpen(false)}
        />
      )}
    </>
  );
}
