"use client";

import { useState, useRef, useCallback } from "react";
import {
  X,
  Upload,
  CheckCircle2,
  ChevronLeft,
  FileText,
  Sparkles,
  History,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { queueCsvImport, ImportPlatform, PublishStatus } from "@/lib/firebase/queries/importHistory";

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  brandId: string;
  onViewHistory: () => void;
}

type Step = "platform" | "upload" | "success";

const PLATFORMS: { key: ImportPlatform; label: string; description: string; logo?: string }[] = [
  {
    key: "bumpa",
    label: "Bumpa",
    description: "Export from Bumpa and import here directly",
    logo: "/images/bumpa-logo.png",
  },
  {
    key: "shopify",
    label: "Shopify",
    description: "Use a Shopify product export CSV",
    logo: "/images/shopify-logo.png",
  },
  {
    key: "ai",
    label: "Auto-detect",
    description: "Any CSV — AI maps the columns automatically",
  },
];

const PUBLISH_OPTIONS: { value: PublishStatus; label: string; sub: string }[] = [
  { value: "csv", label: "Use status from CSV", sub: "Recommended — keeps original availability" },
  { value: "publish", label: "Publish all products", sub: "Make every product live immediately" },
  { value: "unpublish", label: "Save as drafts", sub: "Import without making them visible" },
];

export default function CsvImportModal({
  isOpen,
  onClose,
  brandId,
  onViewHistory,
}: CsvImportModalProps) {
  const [step, setStep] = useState<Step>("platform");
  const [platform, setPlatform] = useState<ImportPlatform>("ai");
  const [publishStatus, setPublishStatus] = useState<PublishStatus>("csv");
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setStep("platform");
    setPlatform("ai");
    setPublishStatus("csv");
    setFile(null);
    setDragging(false);
    setLoading(false);
    setError(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) acceptFile(dropped);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0];
    if (picked) acceptFile(picked);
  };

  const acceptFile = (f: File) => {
    setError(null);
    if (!f.name.toLowerCase().endsWith(".csv") && f.type !== "text/csv") {
      setError("Please select a CSV file (.csv)");
      return;
    }
    setFile(f);
  };

  const handleSubmit = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      await queueCsvImport({ brandId, file, platform, publishStatus });
      setStep("success");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Upload failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Sheet */}
      <div className="relative z-10 w-full sm:max-w-lg bg-surface rounded-t-3xl sm:rounded-2xl shadow-2xl border border-stroke/50 flex flex-col max-h-[90dvh]">
        {/* Drag handle (mobile) */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-stroke" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-4 pb-4 border-b border-stroke/50">
          <div className="flex items-center gap-3">
            {step === "upload" && (
              <button
                onClick={() => setStep("platform")}
                className="p-1.5 rounded-lg hover:bg-bg transition-colors text-text-muted"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
            <h2 className="font-heading font-semibold text-base text-text">
              {step === "platform" && "Import Products"}
              {step === "upload" && "Upload CSV"}
              {step === "success" && "Import Queued"}
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-xl hover:bg-bg transition-colors text-text-muted"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto px-6 py-5 flex-1">
          {/* ── Step 1: Platform ── */}
          {step === "platform" && (
            <div className="space-y-3">
              <p className="text-sm text-text-muted mb-4">
                Where is your product catalog coming from?
              </p>
              {PLATFORMS.map((p) => (
                <button
                  key={p.key}
                  onClick={() => {
                    setPlatform(p.key);
                    setStep("upload");
                  }}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl border border-stroke/70 bg-bg hover:border-accent hover:bg-accent/5 transition-all text-left group"
                >
                  <div className="w-10 h-10 rounded-xl bg-surface border border-stroke flex items-center justify-center flex-shrink-0">
                    {p.logo ? (
                      <img
                        src={p.logo}
                        alt={p.label}
                        className="w-6 h-6 object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <Sparkles className="w-5 h-5 text-accent" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-text group-hover:text-accent transition-colors">
                      {p.label}
                    </p>
                    <p className="text-xs text-text-muted mt-0.5">{p.description}</p>
                  </div>
                  <ChevronLeft className="w-4 h-4 text-text-muted rotate-180 flex-shrink-0" />
                </button>
              ))}
            </div>
          )}

          {/* ── Step 2: Upload + Options ── */}
          {step === "upload" && (
            <div className="space-y-5">
              {/* Selected platform pill */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-text-muted">Platform:</span>
                <span className="px-2.5 py-1 rounded-full bg-accent/10 text-accent text-xs font-semibold">
                  {PLATFORMS.find((p) => p.key === platform)?.label}
                </span>
              </div>

              {/* Drop zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleFileDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative cursor-pointer rounded-2xl border-2 border-dashed transition-all p-8 text-center ${
                  dragging
                    ? "border-accent bg-accent/5"
                    : file
                    ? "border-accent/50 bg-accent/5"
                    : "border-stroke hover:border-stroke/80 hover:bg-bg"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={handleFileChange}
                />
                {file ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                      <FileText className="w-6 h-6 text-accent" />
                    </div>
                    <p className="font-semibold text-sm text-text">{file.name}</p>
                    <p className="text-xs text-text-muted">
                      {(file.size / 1024).toFixed(1)} KB · Click to change
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-xl bg-surface border border-stroke flex items-center justify-center">
                      <Upload className="w-6 h-6 text-text-muted" />
                    </div>
                    <p className="font-semibold text-sm text-text">
                      Drop your CSV here
                    </p>
                    <p className="text-xs text-text-muted">
                      or click to browse · .csv files only
                    </p>
                  </div>
                )}
              </div>

              {/* Publish status */}
              <div>
                <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2.5">
                  Publishing Status
                </p>
                <div className="space-y-2">
                  {PUBLISH_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setPublishStatus(opt.value)}
                      className={`w-full flex items-center gap-3 p-3.5 rounded-xl border transition-all text-left ${
                        publishStatus === opt.value
                          ? "border-accent bg-accent/5"
                          : "border-stroke/70 bg-bg hover:border-stroke"
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                          publishStatus === opt.value
                            ? "border-accent"
                            : "border-stroke"
                        }`}
                      >
                        {publishStatus === opt.value && (
                          <div className="w-2 h-2 rounded-full bg-accent" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-text">{opt.label}</p>
                        <p className="text-xs text-text-muted">{opt.sub}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <p className="text-sm text-alert bg-alert/8 px-4 py-3 rounded-xl">
                  {error}
                </p>
              )}
            </div>
          )}

          {/* ── Step 3: Success ── */}
          {step === "success" && (
            <div className="flex flex-col items-center text-center py-4 gap-4">
              <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-accent" />
              </div>
              <div>
                <h3 className="font-heading font-semibold text-lg text-text">
                  Import started!
                </h3>
                <p className="text-sm text-text-muted mt-1.5 leading-relaxed">
                  Your CSV is being processed in the background. We&apos;ll send you a notification when it&apos;s complete.
                </p>
              </div>
              <button
                onClick={() => { handleClose(); onViewHistory(); }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-stroke text-sm font-semibold text-text hover:bg-bg transition-colors"
              >
                <History className="w-4 h-4" />
                View Import History
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        {step === "upload" && (
          <div className="px-6 py-4 border-t border-stroke/50">
            <Button
              text="Start Import"
              variant="primary"
              className="w-full"
              disabled={!file}
              isLoading={loading}
              loadingText="Uploading..."
              onClick={handleSubmit}
            />
          </div>
        )}
      </div>
    </div>
  );
}
