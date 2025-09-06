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
      transferFeesToGuest?: boolean;
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
  contact?: { firstName?: string; lastName?: string; email?: string; phone?: string };
  termsAccepted?: boolean;
  setEventId: (id: string) => void;
  addItem: (item: CartItem) => void;
  updateQty: (key: { _type: "ticket" | "merch"; id: string; variantKey?: string }, qty: number) => void;
  removeItem: (key: { _type: "ticket" | "merch"; id: string; variantKey?: string }) => void;
  setContact: (contact: { firstName?: string; lastName?: string; email?: string; phone?: string }) => void;
  setTermsAccepted: (accepted: boolean) => void;
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
  // If qty is 0, remove the item
  if (qty === 0) {
    return items.filter(item => {
      if (item._type !== _type) return true;
      
      if (_type === "ticket" && "ticketTypeId" in item && item.ticketTypeId === id) {
        return false;
      }
      
      if (_type === "merch" && "merchItemId" in item && item.merchItemId === id) {
        const itemVariantKey = `${item.size || ""}-${item.color || ""}`;
        return itemVariantKey !== (variantKey || "");
      }
      
      return true;
    });
  }

  // Check if item exists
  const existingItemIndex = items.findIndex(item => {
    if (item._type !== _type) return false;
    
    if (_type === "ticket" && "ticketTypeId" in item && item.ticketTypeId === id) {
      return true;
    }
    
    if (_type === "merch" && "merchItemId" in item && item.merchItemId === id) {
      const itemVariantKey = `${item.size || ""}-${item.color || ""}`;
      return itemVariantKey === (variantKey || "");
    }
    
    return false;
  });

  if (existingItemIndex >= 0) {
    // Update existing item
    const updatedItems = [...items];
    updatedItems[existingItemIndex] = { ...updatedItems[existingItemIndex], qty };
    return updatedItems;
  } else {
    // This shouldn't happen for tickets since we need the ticket data
    // For merch, we'd need to fetch the merch data to create a new item
    console.warn("Cannot update quantity for non-existent item");
    return items;
  }
};

const removeLine = (
  items: CartItem[], 
  _type: "ticket" | "merch", 
  id: string, 
  variantKey: string | undefined
): CartItem[] => {
  return items.filter(item => {
    if (item._type !== _type) return true;
    
    if (_type === "ticket" && "ticketTypeId" in item && item.ticketTypeId === id) {
      return false;
    }
    
    if (_type === "merch" && "merchItemId" in item && item.merchItemId === id) {
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
      
      setTermsAccepted: (termsAccepted) => set({ termsAccepted }),
      
      clear: () => set({ 
        items: [], 
        eventId: null, 
        contact: undefined,
        termsAccepted: undefined
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
