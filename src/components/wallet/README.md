# Bank Account Management Feature

This feature allows users to add and verify their bank account details for receiving payouts from their event earnings.

## Components

### AddBankAccountDialog
A modal dialog that handles the complete bank account verification flow:
1. **Bank Selection**: User selects their bank from a list fetched from Paystack
2. **Account Number Input**: User enters their 10-digit account number
3. **Verification**: Account is verified with Paystack to get the account name
4. **Data Storage**: Bank details are saved to the user's document in Firestore

### BankAccountBanner
Displays the current bank account status and provides actions:
- **No Bank Account**: Shows alert banner with "Add Bank Account" button
- **Unverified**: Shows warning banner with verification status
- **Verified**: Shows success banner with account details

## Firebase Functions Required

The following Firebase callable functions must be deployed:

1. **getBankList**: Fetches list of Nigerian banks from Paystack
2. **verifyAccount**: Verifies bank account details with Paystack

## Data Structure

Bank account information is stored in the user document under:
```javascript
{
  wallet: {
    payout: {
      bank: {
        bankName: "Access Bank",
        bankCode: "044",
        accountNumber: "0098689359",
        accountName: "PRINCE IZUCHUKWU IBEKWE",
        isVerified: true
      }
    }
  }
}
```

## Usage

```tsx
import AddBankAccountDialog from "@/components/wallet/AddBankAccountDialog";
import { useBankAccount } from "@/hooks/useBankAccount";

function MyComponent() {
  const [showDialog, setShowDialog] = useState(false);
  const { verifyAccount, saveBankAccount } = useBankAccount();

  return (
    <AddBankAccountDialog
      isOpen={showDialog}
      onClose={() => setShowDialog(false)}
      onSuccess={() => {
        // Handle successful bank account addition
        console.log("Bank account added successfully!");
      }}
    />
  );
}
```

## Error Handling

The component handles various error scenarios:
- Network errors when fetching banks
- Invalid account numbers
- Account verification failures
- Paystack API errors
- Firestore save errors

## Security

- All API calls go through Firebase callable functions
- Account verification is done server-side with Paystack
- Bank details are stored securely in Firestore
- User authentication is required for all operations
- No subaccount creation - simplified bank account verification only
