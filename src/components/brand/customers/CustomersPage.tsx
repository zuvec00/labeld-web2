"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  UserPlus,
  Search,
  ArrowDownUp,
  FileSpreadsheet,
  History,
  X,
  Phone,
  Mail,
  Instagram,
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
  Megaphone,
} from "lucide-react";
import { format, subDays } from "date-fns";
import { useAuth } from "@/lib/auth/AuthContext";
import { subscribeBrandCustomers, Customer } from "@/lib/firebase/queries/customers";
import { formatWithCommasDouble } from "@/lib/format";
import CsvCustomerImportModal from "./CsvCustomerImportModal";
import CustomerImportHistoryDrawer from "./CustomerImportHistoryDrawer";
import CustomerFormSheet from "./CustomerFormSheet";
import type { CustomerDetails } from "@/lib/firebase/customers";

type Segment = "all" | "new" | "returning" | "top" | "lapsed";
type SortKey = "spend" | "orders" | "recency";

const PAGE_SIZE = 25;
const THIRTY_DAYS_AGO = subDays(new Date(), 30);

export default function CustomersPage() {
  const { user } = useAuth();
  const brandId = user?.uid ?? "";
  const router = useRouter();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [segment, setSegment] = useState<Segment>("all");
  const [sortBy, setSortBy] = useState<SortKey>("spend");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [isCsvImportOpen, setIsCsvImportOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<CustomerDetails | null>(null);
  const [pendingImportCount, setPendingImportCount] = useState(0);

  // Customer list stream
  useEffect(() => {
    if (!brandId) return;
    let isActive = true;
    setLoading(true);
    const unsub = subscribeBrandCustomers(
      brandId,
      (list) => { if (isActive) { setCustomers(list); setLoading(false); } },
      () => { if (isActive) setLoading(false); }
    );
    return () => { isActive = false; unsub(); };
  }, [brandId]);

  // KPI metrics (computed from full customer list)
  const metrics = useMemo(() => {
    const total = customers.length;
    const ltv = customers.reduce((s, c) => s + c.totalSpendMinor, 0);
    const avg = total > 0 ? ltv / total : 0;
    return { total, ltv, avg };
  }, [customers]);

  // Segment filter
  const segmented = useMemo(() => {
    const sorted30dAgo = THIRTY_DAYS_AGO;
    switch (segment) {
      case "new":
        return customers.filter((c) => c.totalOrders === 1);
      case "returning":
        return customers.filter((c) => c.totalOrders >= 2);
      case "top": {
        const withSpend = customers.filter((c) => c.totalSpendMinor > 0);
        const threshold = Math.ceil(withSpend.length * 0.1);
        return [...withSpend]
          .sort((a, b) => b.totalSpendMinor - a.totalSpendMinor)
          .slice(0, Math.max(threshold, 1));
      }
      case "lapsed":
        return customers.filter(
          (c) => c.lastOrderAt && c.lastOrderAt < sorted30dAgo
        );
      default:
        return customers;
    }
  }, [customers, segment]);

  // Search
  const searched = useMemo(() => {
    if (!search.trim()) return segmented;
    const q = search.toLowerCase();
    return segmented.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.email ?? "").toLowerCase().includes(q) ||
        (c.phoneNumber ?? "").includes(q) ||
        (c.instagramHandle ?? "").toLowerCase().includes(q)
    );
  }, [segmented, search]);

  // Sort
  const sorted = useMemo(() => {
    return [...searched].sort((a, b) => {
      switch (sortBy) {
        case "orders":
          return b.totalOrders - a.totalOrders;
        case "recency":
          return (b.lastOrderAt?.getTime() ?? 0) - (a.lastOrderAt?.getTime() ?? 0);
        case "spend":
        default:
          return b.totalSpendMinor - a.totalSpendMinor;
      }
    });
  }, [searched, sortBy]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const paginated = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Reset to page 1 when filters change
  useEffect(() => { setPage(1); }, [segment, search, sortBy]);

  const cycleSortBy = () => {
    const opts: SortKey[] = ["spend", "orders", "recency"];
    setSortBy(opts[(opts.indexOf(sortBy) + 1) % opts.length]);
  };

  const sortLabel = { spend: "LTV", orders: "Orders", recency: "Recent" }[sortBy];

  const SEGMENTS: { key: Segment; label: string }[] = [
    { key: "all", label: "All" },
    { key: "new", label: "New" },
    { key: "returning", label: "Returning" },
    { key: "top", label: "Top Customers" },
    { key: "lapsed", label: "Lapsed" },
  ];

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading font-semibold text-xl text-text">Customers</h1>
          <p className="text-sm text-text-muted mt-0.5">Your full customer CRM</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsHistoryOpen(true)}
            className="relative p-2 rounded-xl border border-stroke hover:bg-surface text-text-muted hover:text-text transition-colors"
            title="Import History"
          >
            <History className="w-4 h-4" />
            {pendingImportCount > 0 && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-cta text-bg text-[8px] font-bold flex items-center justify-center">
                {pendingImportCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setIsCsvImportOpen(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-stroke bg-surface text-sm font-semibold text-text hover:bg-bg transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span className="hidden sm:inline">Import CSV</span>
          </button>
          <button
            onClick={() => router.push("/customers/campaign")}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-stroke bg-surface text-sm font-semibold text-text hover:bg-bg transition-colors"
          >
            <Megaphone className="w-4 h-4" />
            <span className="hidden sm:inline">Send Campaign</span>
          </button>
          <button
            onClick={() => { setEditingCustomer(null); setIsFormOpen(true); }}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-cta text-bg text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            <UserPlus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Customer</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-3">
        <KpiCard
          label="Total Customers"
          value={metrics.total.toLocaleString()}
          icon={<Users className="w-4 h-4" />}
        />
        <KpiCard
          label="Lifetime Value"
          value={`₦${formatWithCommasDouble(metrics.ltv / 100)}`}
          icon={<ShoppingBag className="w-4 h-4" />}
        />
        <KpiCard
          label="Avg. Spend"
          value={`₦${formatWithCommasDouble(metrics.avg / 100)}`}
          icon={<ArrowDownUp className="w-4 h-4" />}
        />
      </div>

      {/* Segment Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {SEGMENTS.map((s) => (
          <button
            key={s.key}
            onClick={() => setSegment(s.key)}
            className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
              segment === s.key
                ? "bg-cta/10 text-cta border border-cta/20"
                : "bg-surface border border-stroke text-text-muted hover:text-text hover:border-stroke/80"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Search + Sort row */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" />
          <input
            type="text"
            placeholder="Search name, email, phone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-stroke bg-surface text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <button
          onClick={cycleSortBy}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-stroke text-xs font-medium hover:bg-surface text-text-muted hover:text-text transition-colors flex-shrink-0"
        >
          <ArrowDownUp className="w-3.5 h-3.5" />
          Sort: {sortLabel}
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-16 rounded-2xl bg-surface border border-stroke animate-pulse" />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <EmptyState
          search={search}
          segment={segment}
          onAdd={() => setIsFormOpen(true)}
          onImport={() => setIsCsvImportOpen(true)}
        />
      ) : (
        <>
          <div className="text-xs text-text-muted px-1">
            {sorted.length} customer{sorted.length !== 1 ? "s" : ""}
            {search ? ` matching "${search}"` : ""}
          </div>
          <div className="space-y-2">
            {paginated.map((c) => (
              <CustomerRow
                key={c.id}
                customer={c}
                onClick={() => router.push(`/customers/${c.id}`)}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg border border-stroke bg-bg disabled:opacity-50 hover:bg-surface transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-text-muted font-medium">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-lg border border-stroke bg-bg disabled:opacity-50 hover:bg-surface transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}

      {/* Modals */}
      <CsvCustomerImportModal
        isOpen={isCsvImportOpen}
        onClose={() => setIsCsvImportOpen(false)}
        brandId={brandId}
        onViewHistory={() => { setIsCsvImportOpen(false); setIsHistoryOpen(true); }}
      />
      <CustomerImportHistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        brandId={brandId}
        onBadgeChange={setPendingImportCount}
      />
      <CustomerFormSheet
        isOpen={isFormOpen}
        onClose={() => { setIsFormOpen(false); setEditingCustomer(null); }}
        brandId={brandId}
        initial={editingCustomer}
      />
    </div>
  );
}

function KpiCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="bg-surface rounded-2xl border border-stroke p-4 space-y-2">
      <div className="flex items-center gap-2 text-text-muted">
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className="font-heading font-semibold text-lg text-text leading-none">{value}</p>
    </div>
  );
}

function CustomerRow({ customer: c, onClick }: { customer: Customer; onClick: () => void }) {
  const initials = c.name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-4 px-4 py-3.5 bg-surface rounded-2xl border border-stroke hover:border-accent/30 hover:bg-bg transition-all text-left group"
    >
      {/* Avatar */}
      <div className="w-10 h-10 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center flex-shrink-0">
        <span className="text-sm font-semibold text-accent">{initials || "?"}</span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-text group-hover:text-accent transition-colors truncate">
          {c.name}
        </p>
        <div className="flex items-center gap-3 mt-0.5 flex-wrap">
          {c.email && (
            <span className="flex items-center gap-1 text-xs text-text-muted">
              <Mail className="w-3 h-3" /> {c.email}
            </span>
          )}
          {c.phoneNumber && (
            <span className="flex items-center gap-1 text-xs text-text-muted">
              <Phone className="w-3 h-3" /> {c.phoneNumber}
            </span>
          )}
          {c.instagramHandle && (
            <span className="flex items-center gap-1 text-xs text-text-muted">
              <Instagram className="w-3 h-3" /> @{c.instagramHandle}
            </span>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="flex-shrink-0 text-right space-y-0.5">
        <p className="text-sm font-semibold text-text">
          ₦{formatWithCommasDouble(c.totalSpendMinor / 100)}
        </p>
        <p className="text-xs text-text-muted">
          {c.totalOrders} order{c.totalOrders !== 1 ? "s" : ""}
          {c.lastOrderAt ? ` · ${format(c.lastOrderAt, "dd MMM yy")}` : ""}
        </p>
      </div>
    </button>
  );
}

function EmptyState({
  search,
  segment,
  onAdd,
  onImport,
}: {
  search: string;
  segment: Segment;
  onAdd: () => void;
  onImport: () => void;
}) {
  if (search) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
        <Search className="w-8 h-8 text-text-muted" />
        <p className="text-text font-semibold">No results for "{search}"</p>
        <p className="text-sm text-text-muted">Try a different name, email, or phone number.</p>
      </div>
    );
  }
  if (segment !== "all") {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
        <Users className="w-8 h-8 text-text-muted" />
        <p className="text-text font-semibold">No customers in this segment</p>
        <p className="text-sm text-text-muted">Switch to "All" to see everyone.</p>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center gap-4 px-8">
      <div className="w-16 h-16 rounded-full bg-surface border border-stroke flex items-center justify-center">
        <Users className="w-7 h-7 text-text-muted" />
      </div>
      <div>
        <p className="font-heading font-semibold text-lg text-text">No customers yet</p>
        <p className="text-sm text-text-muted mt-1.5 leading-relaxed max-w-xs">
          Add customers manually or import them from a CSV file.
        </p>
      </div>
      <div className="flex items-center gap-3 flex-wrap justify-center">
        <button
          onClick={onAdd}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-stroke bg-surface text-sm font-semibold text-text hover:bg-bg transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          Add manually
        </button>
        <button
          onClick={onImport}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cta text-bg text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          <FileSpreadsheet className="w-4 h-4" />
          Import from CSV
        </button>
      </div>
    </div>
  );
}
