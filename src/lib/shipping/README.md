# Shipping Integration

This module handles shipping functionality for merchandise items in the checkout process.

## Features

- **Shipping Quotes**: Get shipping fees for vendors based on location
- **Fulfillment Lines**: Create fulfillment records for merch items after order completion
- **Address Collection**: Collect shipping addresses for delivery
- **Pickup Option**: Allow customers to choose pickup at event venue

## Usage

### 1. Cart Items with BrandId

Merch items in the cart must include `brandId` for shipping quotes to work:

```typescript
const merchItem: CartItem = {
  _type: "merch",
  merchItemId: "merch_123",
  name: "Event T-Shirt",
  unitPriceMinor: 500000, // ₦5,000
  currency: "NGN",
  qty: 1,
  size: "L",
  color: "Black",
  brandId: "brand_456" // Required for shipping
};
```

### 2. Shipping Form

The shipping form appears on the contact page when merch items are in the cart:

- **Delivery**: Collects full shipping address
- **Pickup**: Shows pickup information

### 3. Shipping Quotes

Shipping quotes are calculated automatically when:
- Merch items are added to cart
- Shipping address state/city changes
- Shipping method changes

### 4. Fulfillment Lines

After successful payment, fulfillment lines are created for each merch item:

```typescript
// Automatically called after finalizeOrder
await shippingService.createFulfillmentLines(
  orderId,
  vendorShipping,
  shipping.method,
  shipping.address
);
```

## Backend Functions Required

Make sure these Firebase functions are deployed:

- `quoteShipping` - Get shipping fee for vendor/location
- `upsertFulfillmentLine` - Create/update fulfillment line
- `setFulfillmentStatus` - Update fulfillment status (vendor use)
- `addTimelineNote` - Add notes to order timeline

## Flow

1. **Add Merch to Cart** → Include `brandId`
2. **Contact Page** → Shipping form appears if merch in cart
3. **Shipping Quotes** → Calculated based on address
4. **Payment** → Total includes shipping fees
5. **Order Finalization** → Fulfillment lines created
6. **Vendor Management** → Vendors can update fulfillment status

## Error Handling

- Shipping quotes default to ₦0 if backend fails
- Fulfillment line creation is logged but doesn't fail the order
- Validation ensures required shipping info is collected
