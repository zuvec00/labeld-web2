# Feature Flags System

This project uses a server-only feature flag system to control the visibility and functionality of different features.

## Architecture

- **Server-only flags**: Feature flags are evaluated on the server and never exposed to the browser
- **Environment-based defaults**: Different default states for development, staging, and production
- **Local developer overrides**: Developers can override flags locally via `.env.local`
- **Production controls**: Server-side environment variables for staging/production enablement

## Features

- `events` - Events management and ticketing
- `orders` - Order management and fulfillment
- `wallet` - Wallet and payout functionality
- `sales` - Sales analytics and reporting
- `brandspace` - Brand space and content management

## Environment Variables

### Development Overrides (Local Only)

Create a `.env.local` file in your project root:

```bash
# Enable specific features for local development
FEATURE_OVERRIDE_EVENTS=true
FEATURE_OVERRIDE_ORDERS=true
FEATURE_OVERRIDE_WALLET=true
FEATURE_OVERRIDE_SALES=true
FEATURE_OVERRIDE_BRANDSPACE=true

# To simulate locked features in development, set to false
# FEATURE_OVERRIDE_EVENTS=false
```

### Production/Staging Controls

Set these on your server for staging/production:

```bash
# Enable features in production
FEATURE_ENABLE_EVENTS=false
FEATURE_ENABLE_ORDERS=false
FEATURE_ENABLE_WALLET=false
FEATURE_ENABLE_SALES=false
FEATURE_ENABLE_BRANDSPACE=true
```

## Default Behavior

- **Development**: All features enabled by default
- **Test**: All features disabled by default
- **Staging**: All features disabled by default
- **Production**: All features disabled by default

## Priority Order

1. Local developer override (`.env.local`)
2. Server enable flags (staging/prod secrets)
3. Environment defaults

## UI Components

### GatedNavItem

Use for navigation items that should be gated:

```tsx
<GatedNavItem
  feature="events"
  href="/events"
  label="Events"
  icon={<TicketIcon />}
/>
```

### FeatureGate

Use for conditional rendering:

```tsx
<FeatureGate feature="wallet" enabled={isWalletEnabled}>
  <WalletComponent />
</FeatureGate>
```

### FeatureBanner

Automatically shows when features are locked:

```tsx
<FeatureBanner 
  lockedFeatures={['events', 'wallet']}
  message="Events & Wallet dropping this season"
/>
```

## Security Notes

- Never use `NEXT_PUBLIC_*` for feature flags
- Feature flags are server-only and cannot be manipulated by users
- All flag evaluation happens on the server side
- Client components only receive boolean values, never the flag logic

## Development Workflow

1. **Local Development**: Features are enabled by default
2. **Testing Locked State**: Set `FEATURE_OVERRIDE_*=false` in `.env.local`
3. **Production Deployment**: Use `FEATURE_ENABLE_*` server variables
4. **Gradual Rollout**: Enable features one by one in production
