"use client";

import { useEffect, useState } from "react";
import {
  X,
  CheckCircle2,
  AlertCircle,
  Clock,
  Loader2,
  Ban,
  AlertTriangle,
  Sparkles,
  FileText,
} from "lucide-react";
import { format } from "date-fns";
import {
  subscribeImportHistory,
  ImportHistory,
  ImportStatus,
} from "@/lib/firebase/queries/importHistory";
import { cancelImport } from "@/lib/firebase/callables/csvImport";

interface ImportHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  brandId: string;
}

export default function ImportHistoryDrawer({
  isOpen,
  onClose,
  brandId,
}: ImportHistoryDrawerProps) {
  const [imports, setImports] = useState<ImportHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingIds, setCancellingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!isOpen) return;
    let isActive = true;
    setLoading(true);
    const unsub = subscribeImportHistory(
      brandId,
      (list) => {
        if (!isActive) return;
        setImports(list);
        setLoading(false);
      },
      () => { if (isActive) setLoading(false); }
    );
    return () => {
      isActive = false;
      unsub();
    };
  }, [isOpen, brandId]);

  const handleCancel = async (imp: ImportHistory) => {
    if (!confirm("Stop this import? Products already imported will remain.")) return;
    setCancellingIds((prev) => new Set(prev).add(imp.id));
    try {
      await cancelImport(imp.id);
    } catch (e) {
      alert(`Failed to cancel: ${e instanceof Error ? e.message : "Unknown error"}`);
    } finally {
      setCancellingIds((prev) => {
        const next = new Set(prev);
        next.delete(imp.id);
        return next;
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div className="relative z-10 w-full sm:w-[420px] h-[85dvh] sm:h-full sm:max-h-screen bg-surface flex flex-col rounded-t-3xl sm:rounded-none shadow-2xl border-l border-stroke/50">
        {/* Drag handle (mobile) */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-stroke" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-stroke/50 flex-shrink-0">
          <div>
            <h2 className="font-heading font-semibold text-base text-text">
              Import History
            </h2>
            <p className="text-xs text-text-muted mt-0.5">Product CSV imports</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-bg transition-colors text-text-muted"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {loading && (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-20 rounded-2xl bg-bg animate-pulse border border-stroke/50"
                />
              ))}
            </div>
          )}

          {!loading && imports.length === 0 && (
            <div className="flex flex-col items-center justify-center h-[50vh] text-center gap-3 px-8">
              <div className="w-14 h-14 rounded-full bg-bg border border-stroke flex items-center justify-center">
                <FileText className="w-6 h-6 text-text-muted" />
              </div>
              <p className="font-semibold text-text text-sm">No imports yet</p>
              <p className="text-xs text-text-muted leading-relaxed">
                When you import products from CSV files, the history will appear here.
              </p>
            </div>
          )}

          {!loading &&
            imports.map((imp) => (
              <ImportCard
                key={imp.id}
                imp={imp}
                cancelling={cancellingIds.has(imp.id)}
                onCancel={() => handleCancel(imp)}
              />
            ))}
        </div>
      </div>
    </div>
  );
}

function ImportCard({
  imp,
  cancelling,
  onCancel,
}: {
  imp: ImportHistory;
  cancelling: boolean;
  onCancel: () => void;
}) {
  const canCancel = imp.status === "pending" || imp.status === "processing";

  return (
    <div className="bg-bg rounded-2xl border border-stroke/70 p-4 space-y-3">
      {/* Top row */}
      <div className="flex items-start gap-3">
        <PlatformIcon platform={imp.platform} />
        <div className="flex-1 min-w-0">
          <p
            className="font-semibold text-sm text-text truncate"
            title={imp.fileName}
          >
            {imp.fileName}
          </p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <PlatformBadge platform={imp.platform} />
            <PublishBadge status={imp.publishStatus} />
          </div>
        </div>
        <StatusIcon status={imp.status} />
      </div>

      {/* Divider */}
      <div className="h-px bg-stroke/50" />

      {/* Bottom row */}
      <div className="flex items-center justify-between text-xs text-text-muted">
        <span>
          {imp.createdAt ? format(imp.createdAt, "dd MMM yyyy, h:mm a") : "—"}
        </span>
        <StatusLabel imp={imp} />
      </div>

      {/* AI exhausted note */}
      {imp.aiExhausted && (
        <div className="flex items-center gap-2 bg-edit/10 rounded-xl px-3 py-2">
          <AlertTriangle className="w-3.5 h-3.5 text-edit flex-shrink-0" />
          <p className="text-xs text-edit font-medium">
            AI limit reached — some products imported without enrichment
          </p>
        </div>
      )}

      {/* Error message */}
      {imp.errorMessage && (
        <div className="bg-alert/8 rounded-xl px-3 py-2">
          <p className="text-xs text-alert">{imp.errorMessage}</p>
        </div>
      )}

      {/* Cancel button */}
      {canCancel && (
        <button
          onClick={onCancel}
          disabled={cancelling}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-alert/30 bg-alert/5 text-alert text-xs font-semibold hover:bg-alert/10 transition-colors disabled:opacity-60"
        >
          {cancelling ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <X className="w-3.5 h-3.5" />
          )}
          {cancelling ? "Cancelling…" : "Cancel Import"}
        </button>
      )}
    </div>
  );
}

function PlatformIcon({ platform }: { platform: string }) {
  const logo =
    platform === "bumpa"
      ? "/images/bumpa-logo.png"
      : platform === "shopify"
      ? "/images/shopify-logo.png"
      : null;

  return (
    <div className="w-9 h-9 rounded-xl bg-surface border border-stroke flex items-center justify-center flex-shrink-0">
      {logo ? (
        <img
          src={logo}
          alt={platform}
          className="w-5 h-5 object-contain"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      ) : (
        <Sparkles className="w-4 h-4 text-accent" />
      )}
    </div>
  );
}

function PlatformBadge({ platform }: { platform: string }) {
  const label =
    platform === "bumpa"
      ? "Bumpa"
      : platform === "shopify"
      ? "Shopify"
      : "AI Auto-detect";
  return (
    <span className="px-2 py-0.5 rounded-full bg-accent/10 text-accent text-[10px] font-semibold uppercase tracking-wide">
      {label}
    </span>
  );
}

function PublishBadge({ status }: { status: string }) {
  const label =
    status === "publish"
      ? "Publish All"
      : status === "unpublish"
      ? "Save Drafts"
      : "Use CSV Status";
  return (
    <span className="px-2 py-0.5 rounded-full bg-stroke/50 text-text-muted text-[10px] font-medium">
      {label}
    </span>
  );
}

function StatusIcon({ status }: { status: ImportStatus }) {
  switch (status) {
    case "success":
      return <CheckCircle2 className="w-4 h-4 text-accent flex-shrink-0" />;
    case "partial_success":
      return <AlertTriangle className="w-4 h-4 text-edit flex-shrink-0" />;
    case "failed":
      return <AlertCircle className="w-4 h-4 text-alert flex-shrink-0" />;
    case "cancelled":
      return <Ban className="w-4 h-4 text-text-muted flex-shrink-0" />;
    case "processing":
      return <Loader2 className="w-4 h-4 text-blue-500 animate-spin flex-shrink-0" />;
    case "pending":
    default:
      return <Clock className="w-4 h-4 text-edit flex-shrink-0" />;
  }
}

function StatusLabel({ imp }: { imp: ImportHistory }) {
  switch (imp.status) {
    case "success":
      if (imp.successCount != null && imp.totalProducts != null) {
        return (
          <span className="font-semibold text-accent">
            {imp.successCount}/{imp.totalProducts} imported
            {imp.skippedCount ? ` · ${imp.skippedCount} skipped` : ""}
          </span>
        );
      }
      return <span className="text-accent font-semibold">Complete</span>;
    case "partial_success":
      return (
        <span className="text-edit font-semibold">
          {imp.successCount ?? 0} imported (partial)
        </span>
      );
    case "failed":
      return <span className="text-alert font-semibold">Failed</span>;
    case "cancelled":
      return (
        <span className="text-text-muted font-semibold">
          Cancelled{imp.successCount ? ` · ${imp.successCount} saved` : ""}
        </span>
      );
    case "processing":
      return <span className="text-blue-500 font-semibold">Processing…</span>;
    case "pending":
    default:
      return <span className="text-edit font-semibold">Pending…</span>;
  }
}
