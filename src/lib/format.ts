export function formatWithCommasDouble(n: number) {
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

/** Minor units (kobo) to a display price, e.g. 2500000 -> "₦25,000". */
export function formatNaira(minor: number) {
  return `₦${formatWithCommasDouble(minor / 100)}`;
}

// Flutter: Utils().getCurrencyTypeFromMap(piece.currency!)
export function getCurrencyFromMap(currency: Record<string, string> | string | null | undefined) {
  if (!currency) return "";
  if (typeof currency === "string") return currency; // already code like "USD"
  // try common keys
  return currency["abbreviation"] || currency["code"] || currency["symbol"] || "";
}
