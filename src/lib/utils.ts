import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Simple palette; tweak to match your Flutter Utils().getHeatColor
export function getHeatColor(score: number): string {
  if (score >= 80) return "--var(--color-heat-red)";   // red
  if (score >= 60) return "--var(--color-heat-hot)";   // orange
  if (score >= 30) return "--var(--color-heat-orange)";   // yellow
  return "--var(--color-heat-gray)";                    // gray-500 fallback
}


export function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export const sanitizeSlug = slugify;

export function formatCurrency(amount: number, currency: string = "NGN", options: { compact?: boolean } = {}): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: options.compact ? 1 : 2,
    notation: options.compact ? "compact" : "standard",
  }).format(amount / 100);
}