import { create } from "zustand";
import { persist } from "zustand/middleware";

export type AdmitType = "general" | "vip" | "backstage";

export type CartItem =
  | { 
      _type: "ticket"; 
      ticketTypeId: string; 
      name: string; 
      unitPriceMinor: number; 
      currency: "NGN" | "USD"; 
      qty: number; 
      groupSize?: number;
      admitType?: AdmitType;
    }
  | { 
      _type: "merch"; 
      merchItemId: string; 
      name: string; 
      unitPriceMinor: number; 
      currency: "NGN" | "USD"; 
      qty: number; 
      size?: string; 
      color?: string;
    };

type CartState = {
  eventId: string | null;
  items: CartItem[];
  contact?: { email?: string; phone?: string };
  setEventId: (id: string) => void;
  addItem: (item: CartItem) => void;
  updateQty: (key: { _type: "ticket" | "merch"; id: string; variantKey?: string }, qty: number) => void;
  removeItem: (key: { _type: "ticket" | "merch"; id: string; variantKey?: string }) => void;
  setContact: (contact: { email?: string; phone?: string }) => void;
  clear: () => void;
};

// Helper functions for cart operations
const mergeByKindAndVariant = (items: CartItem[], newItem: CartItem): CartItem[] => {
  const existingIndex = items.findIndex(item => {
    if (item._type !== newItem._type) return false;
    if (item._type === "ticket" && newItem._type === "ticket") {
      return item.ticketTypeId === newItem.ticketTypeId;
    }
    if (item._type === "merch" && newItem._type === "merch") {
      const variantKey1 = `${item.size || ""}-${item.color || ""}`;
      const variantKey2 = `${newItem.size || ""}-${newItem.color || ""}`;
      return item.merchItemId === newItem.merchItemId && variantKey1 === variantKey2;
    }
    return false;
  });

  if (existingIndex >= 0) {
    const updated = [...items];
    updated[existingIndex] = { ...updated[existingIndex], qty: newItem.qty };
    return updated;
  }

  return [...items, newItem];
};

const patchQty = (
  items: CartItem[], 
  _type: "ticket" | "merch", 
  id: string, 
  variantKey: string | undefined, 
  qty: number
): CartItem[] => {
  return items.map(item => {
    if (item._type !== _type) return item;
    
    if (_type === "ticket" && item.ticketTypeId === id) {
      return { ...item, qty };
    }
    
    if (_type === "merch" && item.merchItemId === id) {
      const itemVariantKey = `${item.size || ""}-${item.color || ""}`;
      if (itemVariantKey === (variantKey || "")) {
        return { ...item, qty };
      }
    }
    
    return item;
  }).filter(item => item.qty > 0);
};

const removeLine = (
  items: CartItem[], 
  _type: "ticket" | "merch", 
  id: string, 
  variantKey: string | undefined
): CartItem[] => {
  return items.filter(item => {
    if (item._type !== _type) return true;
    
    if (_type === "ticket" && item.ticketTypeId === id) {
      return false;
    }
    
    if (_type === "merch" && item.merchItemId === id) {
      const itemVariantKey = `${item.size || ""}-${item.color || ""}`;
      return itemVariantKey !== (variantKey || "");
    }
    
    return true;
  });
};

export const useCheckoutCart = create<CartState>()(
  persist(
    (set, get) => ({
      eventId: null,
      items: [],
      contact: undefined,
      
      setEventId: (eventId) => set({ eventId }),
      
      addItem: (item) => set({ 
        items: mergeByKindAndVariant(get().items, item) 
      }),
      
      updateQty: ({ _type, id, variantKey }, qty) => set({ 
        items: patchQty(get().items, _type, id, variantKey, qty) 
      }),
      
      removeItem: ({ _type, id, variantKey }) => set({ 
        items: removeLine(get().items, _type, id, variantKey) 
      }),
      
      setContact: (contact) => set({ contact }),
      
      clear: () => set({ 
        items: [], 
        eventId: null, 
        contact: undefined 
      }),
    }),
    {
      name: "checkout-cart",
      storage: {
        getItem: (name) => {
          const str = sessionStorage.getItem(name);
          return str ? JSON.parse(str) : null;
        },
        setItem: (name, value) => {
          sessionStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: (name) => {
          sessionStorage.removeItem(name);
        },
      },
    }
  )
);
