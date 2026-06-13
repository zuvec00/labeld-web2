"use client";

import { useMemo, useState } from "react";
import { X, Minus, Plus, ImageIcon } from "lucide-react";
import Image from "next/image";
import type { Product, ProductColor } from "@/lib/models/product";
import { formatCurrency } from "@/lib/wallet/mock";
import type { ManualSaleItem } from "@/lib/firebase/manual-sale";

function buildVariantKey(size?: string | null, color?: string | null): string {
  return [size ?? "", color ?? ""].filter(Boolean).join("-");
}

interface Props {
  product: Product;
  onClose: () => void;
  onAdd: (item: ManualSaleItem) => void;
}

export default function VariantSelectorModal({ product, onClose, onAdd }: Props) {
  const sizes = product.sizeOptions ?? [];
  const colors = product.colors ?? [];

  const [size, setSize] = useState<string | null>(sizes[0] ?? null);
  const [color, setColor] = useState<ProductColor | null>(colors[0] ?? null);
  const [quantity, setQuantity] = useState(1);

  // global/null stockMode with null stockRemaining = unlimited (matches mobile)
  const globalUnlimited =
    (product.stockMode === "global" || product.stockMode == null) &&
    product.stockRemaining == null;

  const maxQty = useMemo(() => {
    if (product.stockMode === "variants") {
      if (!product.variantStock) return 0;
      const key = buildVariantKey(size, color?.label);
      return product.variantStock[key] ?? 0;
    }
    // global or unset
    if (globalUnlimited) return 999999;
    return product.stockRemaining ?? 0;
  }, [product, size, color, globalUnlimited]);

  function isVariantAvailable(s: string | null, c: string | null): boolean {
    if (product.stockMode === "variants") {
      if (!product.variantStock) return false;
      const key = buildVariantKey(s, c);
      return (product.variantStock[key] ?? 0) > 0;
    }
    if (globalUnlimited) return true;
    return (product.stockRemaining ?? 0) > 0;
  }

  function isSizeAvailable(s: string): boolean {
    if (product.stockMode !== "variants") {
      if (globalUnlimited) return true;
      return (product.stockRemaining ?? 0) > 0;
    }
    if (!product.variantStock) return false;
    if (colors.length === 0) return isVariantAvailable(s, null);
    return colors.some((c) => isVariantAvailable(s, c.label));
  }

  const clampedQty = quantity > maxQty ? (maxQty > 0 ? maxQty : 1) : quantity;
  const outOfStock = maxQty <= 0;

  function handleConfirm() {
    if (outOfStock) return;
    const variantKey =
      product.stockMode === "variants"
        ? buildVariantKey(size, color?.label)
        : null;
    const unitPriceMinor = Math.round(product.price * 100);
    onAdd({
      productId: product.id,
      name: product.dropName,
      mainVisualUrl: product.mainVisualUrl,
      unitPriceMinor,
      quantity: clampedQty,
      size: size ?? null,
      color: color?.label ?? null,
      variantKey,
      subtotalMinor: unitPriceMinor * clampedQty,
      stockMode: (product.stockMode ?? "unlimited") as ManualSaleItem["stockMode"],
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm rounded-2xl bg-surface p-5 font-sans shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="font-sans text-base font-semibold text-text">Select Option</h3>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Product summary */}
        <div className="mt-4 flex items-center gap-3">
          {product.mainVisualUrl ? (
            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg">
              <Image src={product.mainVisualUrl} alt={product.dropName} fill className="object-cover" />
            </div>
          ) : (
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-bg text-text-muted">
              <ImageIcon className="h-4 w-4" />
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-text">{product.dropName}</p>
            <p className="text-xs text-text-muted">
              {formatCurrency(product.price * 100)}
            </p>
          </div>
        </div>

        {/* Sizes */}
        {sizes.length > 0 && (
          <div className="mt-5">
            <p className="mb-2 text-xs font-medium text-text-muted">Size</p>
            <div className="flex flex-wrap gap-2">
              {sizes.map((s) => {
                const available = isSizeAvailable(s);
                const selected = size === s;
                return (
                  <button
                    key={s}
                    onClick={() => setSize(s)}
                    className={`rounded-lg border px-4 py-2 text-xs font-medium transition-colors ${
                      selected
                        ? "border-transparent bg-text text-bg"
                        : "border-stroke bg-bg text-text hover:border-text/40"
                    } ${available ? "" : "opacity-40 line-through"}`}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Colors */}
        {colors.length > 0 && (
          <div className="mt-5">
            <p className="mb-2 text-xs font-medium text-text-muted">Colour</p>
            <div className="flex flex-wrap gap-2">
              {colors.map((c) => {
                const available = isVariantAvailable(size, c.label);
                const selected = color?.label === c.label;
                return (
                  <button
                    key={c.label}
                    onClick={() => setColor(c)}
                    className={`flex items-center gap-1.5 rounded-lg border px-4 py-2 text-xs font-medium transition-colors ${
                      selected
                        ? "border-transparent bg-text text-bg"
                        : "border-stroke bg-bg text-text hover:border-text/40"
                    } ${available ? "" : "opacity-40 line-through"}`}
                  >
                    {c.hex && (
                      <span
                        className="h-3 w-3 rounded-full border border-white/20"
                        style={{ background: c.hex }}
                      />
                    )}
                    {c.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Quantity */}
        <div className="mt-5">
          <p className="mb-2 text-xs font-medium text-text-muted">Quantity</p>
          <div className="flex items-center gap-3">
            <div className="flex items-center rounded-lg border border-stroke">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="flex h-9 w-10 items-center justify-center text-text-muted hover:text-text"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <span className="w-8 text-center text-sm font-semibold text-text">
                {clampedQty}
              </span>
              <button
                onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
                disabled={clampedQty >= maxQty}
                className="flex h-9 w-10 items-center justify-center text-text-muted hover:text-text disabled:opacity-30"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
            {maxQty > 0 && maxQty < 999999 && (
              <span
                className={`text-xs font-medium ${
                  maxQty < 5 ? "text-orange-500" : "text-text-muted"
                }`}
              >
                {maxQty} left in stock
              </span>
            )}
          </div>
        </div>

        {/* Confirm */}
        <button
          onClick={handleConfirm}
          disabled={outOfStock}
          className="mt-6 w-full rounded-xl bg-text py-3 text-sm font-semibold text-bg transition-opacity hover:opacity-80 disabled:opacity-40"
        >
          {outOfStock ? "Out of Stock" : "Confirm"}
        </button>
      </div>
    </div>
  );
}
