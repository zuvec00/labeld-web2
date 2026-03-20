import { create } from 'zustand';
import { Product } from '@/lib/models/product';

type DraftProduct = Partial<Product> & {
  localFile?: File | null;
  galleryFiles?: (File | null)[];
  sizeGuideFile?: File | null;
};

interface InstagramImportStore {
  draftProducts: DraftProduct[];
  setDraftProducts: (products: DraftProduct[]) => void;
  updateDraftProduct: (index: number, product: Partial<DraftProduct>) => void;
  removeDraftProduct: (index: number) => void;
  clearDraftProducts: () => void;
}

export const useInstagramImportStore = create<InstagramImportStore>((set) => ({
  draftProducts: [],
  setDraftProducts: (products) => set({ draftProducts: products }),
  updateDraftProduct: (index, updatedFields) =>
    set((state) => ({
      draftProducts: state.draftProducts.map((p, i) =>
        i === index ? { ...p, ...updatedFields } : p
      ),
    })),
  removeDraftProduct: (index) =>
    set((state) => ({
      draftProducts: state.draftProducts.filter((_, i) => i !== index),
    })),
  clearDraftProducts: () => set({ draftProducts: [] }),
}));
