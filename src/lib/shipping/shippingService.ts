import { 
  quoteShipping, 
  upsertFulfillmentLine,
  type ShippingQuoteRequest,
  type FulfillmentLineRequest 
} from "@/lib/firebase/callables/shipping";
import { CartItem } from "@/hooks/useCheckoutCart";

export interface ShippingQuote {
  vendorId: string;
  feeMinor: number;
}

export interface VendorShippingInfo {
  vendorId: string;
  items: CartItem[];
  quote?: ShippingQuote;
}

export class ShippingService {
  private static instance: ShippingService;
  private quoteCache = new Map<string, ShippingQuote>();

  private constructor() {}

  public static getInstance(): ShippingService {
    if (!ShippingService.instance) {
      ShippingService.instance = new ShippingService();
    }
    return ShippingService.instance;
  }

  /**
   * Get unique vendors from cart items
   */
  public getVendorsFromCart(items: CartItem[]): VendorShippingInfo[] {
    console.log("🚚 ShippingService: Getting vendors from cart", { items });
    const vendorMap = new Map<string, CartItem[]>();

    items.forEach(item => {
      if (item._type === "merch" && item.brandId) {
        const vendorId = item.brandId;
        if (!vendorMap.has(vendorId)) {
          vendorMap.set(vendorId, []);
        }
        vendorMap.get(vendorId)!.push(item);
        console.log("🚚 ShippingService: Added merch item to vendor", { vendorId, item });
      } else if (item._type === "merch" && !item.brandId) {
        console.warn("🚚 ShippingService: Merch item missing brandId", { item });
      }
    });

    const vendors = Array.from(vendorMap.entries()).map(([vendorId, items]) => ({
      vendorId,
      items,
    }));

    console.log("🚚 ShippingService: Final vendors", { vendors });
    return vendors;
  }

  /**
   * Quote shipping for a vendor and location
   */
  public async quoteShippingForVendor(
    vendorId: string, 
    state: string, 
    city?: string
  ): Promise<ShippingQuote> {
    const cacheKey = `${vendorId}-${state}-${city || ""}`;
    console.log("🚚 ShippingService: Quote shipping for vendor", { vendorId, state, city, cacheKey });
    
    // Check cache first
    if (this.quoteCache.has(cacheKey)) {
      const cachedQuote = this.quoteCache.get(cacheKey)!;
      console.log("🚚 ShippingService: Using cached quote", { cachedQuote });
      return cachedQuote;
    }

    try {
      const request: ShippingQuoteRequest = {
        vendorId,
        state,
        city,
      };

      console.log("🚚 ShippingService: Making API call for quote", { request });
      const result = await quoteShipping(request);
      console.log("🚚 ShippingService: API response", { result });
      
      const quote: ShippingQuote = {
        vendorId,
        feeMinor: result.data.feeMinor,
      };

      console.log("🚚 ShippingService: Processed quote", { quote });
      // Cache the result
      this.quoteCache.set(cacheKey, quote);
      return quote;
    } catch (error) {
      console.error("🚚 ShippingService: Failed to quote shipping:", error);
      // Return zero fee as fallback
      const fallbackQuote = {
        vendorId,
        feeMinor: 0,
      };
      console.log("🚚 ShippingService: Returning fallback quote", { fallbackQuote });
      return fallbackQuote;
    }
  }

  /**
   * Quote shipping for all vendors in cart
   */
  public async quoteShippingForAllVendors(
    vendors: VendorShippingInfo[],
    state: string,
    city?: string
  ): Promise<VendorShippingInfo[]> {
    console.log("🚚 ShippingService: Quote shipping for all vendors", { vendors, state, city });
    
    const quotes = await Promise.all(
      vendors.map(async (vendor) => {
        console.log("🚚 ShippingService: Processing vendor", { vendor });
        const quote = await this.quoteShippingForVendor(vendor.vendorId, state, city);
        const result = {
          ...vendor,
          quote,
        };
        console.log("🚚 ShippingService: Vendor result", { result });
        return result;
      })
    );

    console.log("🚚 ShippingService: All vendor quotes completed", { quotes });
    return quotes;
  }

  /**
   * Create fulfillment lines for all merch items after order is finalized
   */
  public async createFulfillmentLines(
    orderId: string,
    vendors: VendorShippingInfo[],
    shippingMethod: "delivery" | "pickup",
    shippingAddress?: Record<string, unknown>
  ): Promise<void> {
    console.log("Creating fulfillment lines for orderId:", orderId);
    console.log("Vendors:", vendors);
    console.log("Shipping method:", shippingMethod);
    console.log("Shipping address:", shippingAddress);
    
    const fulfillmentPromises: Promise<unknown>[] = [];

    vendors.forEach((vendor) => {
      vendor.items.forEach((item) => {
        if (item._type === "merch") {
          const lineKey = `merch:${item.merchItemId}`;
          const request: FulfillmentLineRequest = {
            orderId,
            lineKey,
            vendorId: vendor.vendorId,
            qtyOrdered: item.qty,
            shipping: {
              method: shippingMethod,
              address: shippingMethod === "delivery" ? shippingAddress : undefined,
              feeMinor: vendor.quote?.feeMinor || 0,
            },
          };

          console.log("Creating fulfillment line:", request);
          fulfillmentPromises.push(upsertFulfillmentLine(request));
        }
      });
    });

    try {
      await Promise.all(fulfillmentPromises);
      console.log("All fulfillment lines created successfully");
    } catch (error) {
      console.error("Failed to create fulfillment lines:", error);
      throw error;
    }
  }

  /**
   * Calculate total shipping fees
   */
  public calculateTotalShippingFee(vendors: VendorShippingInfo[]): number {
    console.log("🚚 ShippingService: Calculating total shipping fee", { vendors });
    
    const total = vendors.reduce((total, vendor) => {
      const vendorFee = vendor.quote?.feeMinor || 0;
      console.log("🚚 ShippingService: Adding vendor fee", { vendorId: vendor.vendorId, vendorFee, runningTotal: total });
      return total + vendorFee;
    }, 0);
    
    console.log("🚚 ShippingService: Final total shipping fee", { total });
    return total;
  }

  /**
   * Clear quote cache
   */
  public clearCache(): void {
    this.quoteCache.clear();
  }
}

export const shippingService = ShippingService.getInstance();
