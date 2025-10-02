// lib/featureFlags.ts
// Server-only flags. Do NOT export anything that leaks secrets.
// We only expose booleans for gating UI.

export type FeatureKey = 'events' | 'orders' | 'wallet' | 'sales' | 'brandspace' | 'installPrompt';

export type FeatureConfig = Record<FeatureKey, boolean>;

// Default flags by environment
const defaults: Record<'development' | 'production' | 'test' | 'staging', FeatureConfig> = {
  development: { 
    events: true, 
    orders: true, 
    wallet: true, 
    sales: true,
    brandspace: true,
    installPrompt: true
  },
  test: { 
    events: true, 
    orders: true, 
    wallet: true, 
    sales: true,
    brandspace: true,
    installPrompt: true
  },
  staging: { 
    events: true, 
    orders: true, 
    wallet: true, 
    sales: true,
    brandspace: true,
    installPrompt: true
  },
  production: { 
    events: true, 
    orders: true, 
    wallet: true, 
    sales: true,
    brandspace: true,
    installPrompt: true
  },
};

// Helper to coerce env string -> boolean
const bool = (v: string | undefined): boolean => v === '1' || v === 'true';

const env = process.env.NODE_ENV as keyof typeof defaults || 'production';

// Optional per-feature **local** overrides (only on the dev box via .env.local)
// Never use NEXT_PUBLIC_* here. These are server-only.
const overrides: Partial<FeatureConfig> = {
  events: bool(process.env.FEATURE_OVERRIDE_EVENTS),
  orders: bool(process.env.FEATURE_OVERRIDE_ORDERS),
  wallet: bool(process.env.FEATURE_OVERRIDE_WALLET),
  sales: bool(process.env.FEATURE_OVERRIDE_SALES),
  installPrompt: bool(process.env.FEATURE_OVERRIDE_INSTALL_PROMPT),
//   brandspace: bool(process.env.FEATURE_OVERRIDE_BRANDSPACE),
};

// Optional CI/ops flags for staging/prod enablement (server secrets)
const serverEnables: Partial<FeatureConfig> = {
  events: bool(process.env.FEATURE_ENABLE_EVENTS),
  orders: bool(process.env.FEATURE_ENABLE_ORDERS),
  wallet: bool(process.env.FEATURE_ENABLE_WALLET),
  sales: bool(process.env.FEATURE_ENABLE_SALES),
  installPrompt: bool(process.env.FEATURE_ENABLE_INSTALL_PROMPT),
//   brandspace: bool(process.env.FEATURE_ENABLE_BRANDSPACE),
};

const base = defaults[env];

// Merge priority (highest → lowest):
// 1) local dev override (.env.local on my machine)
// 2) server enable flags (staging/prod secrets)
// 3) environment defaults
export function isFeatureEnabled(key: FeatureKey): boolean {
  if (typeof overrides[key] === 'boolean') return overrides[key] as boolean;
  if (typeof serverEnables[key] === 'boolean') return serverEnables[key] as boolean;
  return base[key];
}

// Get all feature states for debugging/admin purposes
export function getAllFeatureStates(): FeatureConfig {
  const result: FeatureConfig = {} as FeatureConfig;
  const keys: FeatureKey[] = ['events', 'orders', 'wallet', 'brandspace', 'installPrompt'];
  
  keys.forEach(key => {
    result[key] = isFeatureEnabled(key);
  });
  
  return result;
}

// Check if any features are locked (for showing banner)
export function hasLockedFeatures(): boolean {
  const states = getAllFeatureStates();
  return Object.values(states).some(enabled => !enabled);
}

// Get list of locked features (for banner display)
export function getLockedFeatures(): FeatureKey[] {
  const states = getAllFeatureStates();
  return Object.entries(states)
    .filter(([, enabled]) => !enabled)
    .map(([key]) => key as FeatureKey);
}
