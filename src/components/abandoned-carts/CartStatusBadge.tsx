import type { CartStatus } from "@/lib/models/abandoned-cart";

const CONFIG: Record<CartStatus, { label: string; className: string }> = {
  pending:       { label: "Pending",       className: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" },
  contacted:     { label: "Contacted",     className: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  recovered:     { label: "Recovered",     className: "bg-green-500/10 text-green-500 border-green-500/20" },
  expired:       { label: "Expired",       className: "bg-stroke/40 text-text-muted border-stroke/40" },
  uncontactable: { label: "No Email",      className: "bg-stroke/40 text-text-muted border-stroke/40" },
};

export default function CartStatusBadge({ status }: { status: CartStatus }) {
  const { label, className } = CONFIG[status] ?? CONFIG.pending;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${className}`}>
      {label}
    </span>
  );
}
