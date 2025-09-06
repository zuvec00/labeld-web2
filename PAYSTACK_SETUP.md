# Paystack Payment Integration Setup

## Overview
This project now includes Paystack payment integration for processing ticket and merch purchases. The integration handles payment initialization, order creation, and success/failure scenarios.

## Setup Instructions

### 1. Environment Variables
Create a `.env.local` file in your project root and add:

```bash
# Paystack Configuration
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_your_paystack_public_key_here

# Make sure your Firebase configuration is also set up
```

### 2. Get Paystack Keys
1. Sign up at [Paystack](https://paystack.com)
2. Go to your dashboard
3. Navigate to Settings > API Keys
4. Copy your public key (starts with `pk_test_` for test mode, `pk_live_` for live mode)

### 3. Test Mode vs Live Mode
- **Test Mode**: Use `pk_test_...` keys for development and testing
- **Live Mode**: Use `pk_live_...` keys for production

## How It Works

### Payment Flow
1. User fills contact information
2. User accepts terms and conditions
3. User clicks "Proceed to Payment"
4. Paystack payment modal opens
5. User completes payment
6. Order is created in Firestore
7. User is redirected to success page

### Order Creation
- Orders are stored in the `orders` collection in Firestore
- Each order includes:
  - Event ID
  - Line items (tickets/merch)
  - Customer information
  - Payment details
  - Order status

### Error Handling
- Payment failures are caught and displayed
- Users can retry payments
- Failed orders are logged for debugging

## File Structure

```
src/
├── lib/
│   └── payment/
│       └── paystack.ts          # Paystack service
├── app/(public)/buy/[eventId]/
│   └── pay/
│       └── page.tsx             # Payment page
└── components/checkout/
    └── RightSummary.tsx         # Order summary
```

## Customization

### Adding More Payment Methods
To add additional payment methods (like Flutterwave), extend the `PaystackService` class or create new service classes.

### Order Status Updates
The service includes methods for updating order status. You can extend this to integrate with webhooks for real-time payment confirmations.

### Currency Support
Currently supports NGN (Nigerian Naira). To add USD support, update the currency handling in the payment service.

## Security Notes

- Never expose your Paystack secret key in the frontend
- Always validate payment responses on your backend
- Use webhooks for payment confirmations in production
- Implement proper error handling and logging

## Testing

1. Use test card numbers from Paystack documentation
2. Test both successful and failed payment scenarios
3. Verify order creation in Firestore
4. Test error handling and user feedback

## Production Checklist

- [ ] Switch to live Paystack keys
- [ ] Implement webhook handling
- [ ] Add proper error logging
- [ ] Test with real payment methods
- [ ] Implement order fulfillment logic
- [ ] Add payment analytics and monitoring
