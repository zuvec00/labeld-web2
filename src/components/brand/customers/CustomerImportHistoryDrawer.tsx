"use client";

import { useEffect, useState } from "react";
import { X, CheckCircle2, AlertCircle, Clock, Loader2, Ban, AlertTriangle, FileText } from "lucide-react";
import { format } from "date-fns";
import { subscribeCustomerImportHistory, ImportHistory, ImportStatus } from "@/lib/firebase/queries/importHistory";
import { cancelImport } from "@/lib/firebase/callables/csvImport";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  brandId: string;
  onBadgeChange?: (count: number) => void;
}

export default function CustomerImportHistoryDrawer({ isOpen, onClose, brandId, onBadgeChange }: Props) {
  const [imports, setImports] = useState<ImportHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingIds, setCancellingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!brandId) return;
    let isActive = true;
    const unsub = subscribeCustomerImportHistory(
      brandId,
      (list) => {
        if (!isActive) return;
        setImports(list);
        setLoading(false);
        onBadgeChange?.(list.filter((i) => i.status === "pending" || i.status === "processing").length);
      },
      () => { if (isActive) setLoading(false); }
    );
    return () => { isActive = false; unsub(); };
  }, [brandId, onBadgeChange]);

  const handleCancel = async (imp: ImportHistory) => {
    if (!confirm("Stop this import? Customers already imported will remain.")) return;
    setCancellingIds((prev) => new Set(prev).add(imp.id));
    try {
      await cancelImport(imp.id);
    } catch (e) {
      alert(`Failed to cancel: ${e instanceof Error ? e.message : "Unknown error"}`);
    } finally {
      setCancellingIds((prev) => { const n = new Set(prev); n.delete(imp.id); return n; });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-end">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full sm:w-[420px] h-[85dvh] sm:h-full sm:max-h-screen bg-surface flex flex-col rounded-t-3xl sm:rounded-none shadow-2xl border-l border-stroke/50">
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-stroke" />
        </div>

        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-stroke/50 flex-shrink-0">
          <div>
            <h2 className="font-heading font-semibold text-base text-text">Import History</h2>
            <p className="text-xs text-text-muted mt-0.5">Customer CSV imports</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-bg transition-colors text-text-muted">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {loading && (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 rounded-2xl bg-bg animate-pulse border border-stroke/50" />
              ))}
            </div>
          )}
          {!loading && imports.length === 0 && (
            <div className="flex flex-col items-center justify-center h-[50vh] text-center gap-3 px-8">
              <div className="w-14 h-14 rounded-full bg-bg border border-stroke flex items-center justify-center">
                <FileText className="w-6 h-6 text-text-muted" />
              </div>
              <p className="font-semibold text-text text-sm">No imports yet</p>
              <p className="text-xs text-text-muted leading-relaxed">Customer CSV import history will appear here.</p>
            </div>
          )}
          {!loading && imports.map((imp) => (
            <ImportCard key={imp.id} imp={imp} cancelling={cancellingIds.has(imp.id)} onCancel={() => handleCancel(imp)} />
          ))}
        </div>
      </div>
    </div>
  );
}

function ImportCard({ imp, cancelling, onCancel }: { imp: ImportHistory; cancelling: boolean; onCancel: () => void }) {
  const canCancel = imp.status === "pending" || imp.status === "processing";
  return (
    <div className="bg-bg rounded-2xl border border-stroke/70 p-4 space-y-3">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-surface border border-stroke flex items-center justify-center flex-shrink-0">
          <FileText className="w-4 h-4 text-text-muted" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-text truncate" title={imp.fileName}>{imp.fileName}</p>
          <p className="text-xs text-text-muted mt-0.5">AI Auto-detect · Customer CSV</p>
        </div>
        <StatusIcon status={imp.status} />
      </div>
      <div className="h-px bg-stroke/50" />
      <div className="flex items-center justify-between text-xs text-text-muted">
        <span>{imp.createdAt ? format(imp.createdAt, "dd MMM yyyy, h:mm a") : "—"}</span>
        <StatusLabel imp={imp} />
      </div>
      {imp.aiExhausted && (
        <div className="flex items-center gap-2 bg-edit/10 rounded-xl px-3 py-2">
          <AlertTriangle className="w-3.5 h-3.5 text-edit flex-shrink-0" />
          <p className="text-xs text-edit font-medium">AI limit reached — some customers imported without enrichment</p>
        </div>
      )}
      {imp.errorMessage && (
        <div className="bg-alert/8 rounded-xl px-3 py-2">
          <p className="text-xs text-alert">{imp.errorMessage}</p>
        </div>
      )}
      {canCancel && (
        <button onClick={onCancel} disabled={cancelling} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-alert/30 bg-alert/5 text-alert text-xs font-semibold hover:bg-alert/10 transition-colors disabled:opacity-60">
          {cancelling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
          {cancelling ? "Cancelling…" : "Cancel Import"}
        </button>
      )}
    </div>
  );
}

function StatusIcon({ status }: { status: ImportStatus }) {
  switch (status) {
    case "success": return <CheckCircle2 className="w-4 h-4 text-accent flex-shrink-0" />;
    case "partial_success": return <AlertTriangle className="w-4 h-4 text-edit flex-shrink-0" />;
    case "failed": return <AlertCircle className="w-4 h-4 text-alert flex-shrink-0" />;
    case "cancelled": return <Ban className="w-4 h-4 text-text-muted flex-shrink-0" />;
    case "processing": return <Loader2 className="w-4 h-4 text-blue-500 animate-spin flex-shrink-0" />;
    default: return <Clock className="w-4 h-4 text-edit flex-shrink-0" />;
  }
}

function StatusLabel({ imp }: { imp: ImportHistory }) {
  switch (imp.status) {
    case "success":
      return <span className="font-semibold text-accent">{imp.successCount ?? 0}/{imp.totalProducts ?? "?"} imported{imp.skippedCount ? ` · ${imp.skippedCount} skipped` : ""}</span>;
    case "partial_success":
      return <span className="text-edit font-semibold">{imp.successCount ?? 0} imported (partial)</span>;
    case "failed": return <span className="text-alert font-semibold">Failed</span>;
    case "cancelled": return <span className="text-text-muted font-semibold">Cancelled{imp.successCount ? ` · ${imp.successCount} saved` : ""}</span>;
    case "processing": return <span className="text-blue-500 font-semibold">Processing…</span>;
    default: return <span className="text-edit font-semibold">Pending…</span>;
  }
}
