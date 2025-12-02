# Test Data Cleanup Page

## Purpose
This page allows users to safely clean up test data from their account, including:
- Attendee tickets linked to their events
- Orders for their events
- Wallet ledger entries
- Wallet balance reset

## Safety Features
1. **User-scoped queries**: All operations are scoped to the current user's UID
2. **Preview before delete**: Shows exactly what will be deleted before any action
3. **Confirmation required**: User must type "DELETE" to confirm
4. **Double confirmation**: Two-step confirmation process
5. **Batch processing**: Handles large datasets efficiently (respects Firestore limits)
6. **No event deletion**: Events themselves are NOT deleted, only related data

## Collections Affected
- `attendeeTickets` - Filtered by `eventId` (from user's events)
- `orders` - Filtered by `eventId` (from user's events)
- `walletLedger` - Filtered by `vendorId` (user's UID)
- `users/{userId}` - Updates `wallet.eligibleBalanceMinor` to 0

## Access
- Route: `/admin/cleanup-test-data`
- No special access control (for now)
- Requires authentication

## Usage
1. Navigate to `/admin/cleanup-test-data`
2. Click "Fetch My Test Data" to preview
3. Review the data summary
4. Select which data types to delete
5. Type "DELETE" to confirm
6. Click through the confirmation steps
7. Wait for completion

## Technical Details
- Uses Firestore batch writes (max 500 operations per batch)
- Handles Firestore 'in' query limits (max 30 items)
- Processes large datasets in chunks
- Updates wallet balance atomically
- All operations are logged to console for debugging

## Safety Checks
- Verifies user is authenticated before any operation
- All queries are scoped to user's UID or their event IDs
- No cross-user data access possible
- Events are fetched using `createdBy` field
- Wallet ledger uses `vendorId` field
- Orders and tickets use `eventId` from user's events only

