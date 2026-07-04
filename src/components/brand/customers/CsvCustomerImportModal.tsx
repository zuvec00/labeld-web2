"use client";

import { useState, useRef, useCallback } from "react";
import { X, Upload, CheckCircle2, ChevronLeft, FileText, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage, db } from "@/lib/firebase/firebaseConfig";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  brandId: string;
  onViewHistory: () => void;
}

type Step = "upload" | "success";

export default function CsvCustomerImportModal({ isOpen, onClose, brandId, onViewHistory }: Props) {
  const [step, setStep] = useState<Step>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setStep("upload");
    setFile(null);
    setDragging(false);
    setLoading(false);
    setError(null);
  };

  const handleClose = () => { reset(); onClose(); };

  const acceptFile = (f: File) => {
    setError(null);
    if (!f.name.toLowerCase().endsWith(".csv") && f.type !== "text/csv") {
      setError("Please select a CSV file (.csv)");
      return;
    }
    setFile(f);
  };

  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) acceptFile(dropped);
  }, []);

  const handleSubmit = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const timestamp = Date.now();
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const storagePath = `importFiles/customers/${brandId}/${timestamp}_${safeName}`;
      const fileRef = ref(storage, storagePath);
      await uploadBytes(fileRef, file, { contentType: "text/csv" });
      const fileUrl = await getDownloadURL(fileRef);
      await addDoc(collection(db, "importHistory"), {
        brandId,
        fileName: file.name,
        fileUrl,
        platform: "ai",
        publishStatus: "csv",
        type: "customers",
        status: "pending",
        createdAt: serverTimestamp(),
      });
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
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative z-10 w-full sm:max-w-md bg-surface rounded-t-3xl sm:rounded-2xl shadow-2xl border border-stroke/50 flex flex-col max-h-[90dvh]">
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-stroke" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-4 pb-4 border-b border-stroke/50">
          <h2 className="font-heading font-semibold text-base text-text">
            {step === "upload" ? "Import Customers" : "Import Queued"}
          </h2>
          <button onClick={handleClose} className="p-2 rounded-xl hover:bg-bg transition-colors text-text-muted">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-5 flex-1">
          {step === "upload" && (
            <div className="space-y-5">
              <p className="text-sm text-text-muted">
                Upload any CSV with customer contact info. AI will map the columns automatically.
              </p>

              {/* Drop zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleFileDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative cursor-pointer rounded-2xl border-2 border-dashed transition-all p-8 text-center ${
                  dragging ? "border-accent bg-accent/5" : file ? "border-accent/50 bg-accent/5" : "border-stroke hover:border-stroke/80 hover:bg-bg"
                }`}
              >
                <input ref={fileInputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) acceptFile(f); }} />
                {file ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                      <FileText className="w-6 h-6 text-accent" />
                    </div>
                    <p className="font-semibold text-sm text-text">{file.name}</p>
                    <p className="text-xs text-text-muted">{(file.size / 1024).toFixed(1)} KB · Click to change</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-xl bg-surface border border-stroke flex items-center justify-center">
                      <Upload className="w-6 h-6 text-text-muted" />
                    </div>
                    <p className="font-semibold text-sm text-text">Drop your CSV here</p>
                    <p className="text-xs text-text-muted">or click to browse · .csv files only</p>
                  </div>
                )}
              </div>

              {error && <p className="text-sm text-alert bg-alert/8 px-4 py-3 rounded-xl">{error}</p>}
            </div>
          )}

          {step === "success" && (
            <div className="flex flex-col items-center text-center py-4 gap-4">
              <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-accent" />
              </div>
              <div>
                <h3 className="font-heading font-semibold text-lg text-text">Import started!</h3>
                <p className="text-sm text-text-muted mt-1.5 leading-relaxed">
                  Your customer CSV is being processed. We&apos;ll notify you when it&apos;s done.
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

        {step === "upload" && (
          <div className="px-6 py-4 border-t border-stroke/50">
            <Button text="Start Import" variant="primary" className="w-full" disabled={!file} isLoading={loading} loadingText="Uploading..." onClick={handleSubmit} />
          </div>
        )}
      </div>
    </div>
  );
}
