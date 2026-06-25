"use client";

import { type CustomerDetails } from "@/lib/firebase/customers";
import { SharedCustomerForm } from "./SharedCustomerForm";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  brandId: string;
  initial?: CustomerDetails | null;
  onDeleted?: () => void;
}

export default function CustomerFormSheet({ isOpen, onClose, brandId, initial, onDeleted }: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-end">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 flex w-full max-w-md flex-col bg-surface shadow-2xl">
        <SharedCustomerForm
          brandId={brandId}
          initial={initial}
          onSaved={() => onClose()}
          onBack={onClose}
          showDelete={!!initial?.customerId}
          onDeleted={() => { onDeleted?.(); onClose(); }}
        />
      </div>
    </div>
  );
}
