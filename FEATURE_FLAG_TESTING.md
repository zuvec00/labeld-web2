# Feature Flag Test

## Environment Variables for Testing

Create a .env.local file with these settings to test different scenarios:

### Test All Features Locked
FEATURE_OVERRIDE_EVENTS=false
FEATURE_OVERRIDE_ORDERS=false
FEATURE_OVERRIDE_WALLET=false
FEATURE_OVERRIDE_SALES=false
FEATURE_OVERRIDE_BRANDSPACE=false

### Test All Features Unlocked (Development Default)
# No .env.local file needed, or set all to true

### Test Mixed States
FEATURE_OVERRIDE_EVENTS=true
FEATURE_OVERRIDE_ORDERS=false
FEATURE_OVERRIDE_WALLET=true
FEATURE_OVERRIDE_SALES=false
FEATURE_OVERRIDE_BRANDSPACE=true

## Expected Behavior

1. **Locked Features**: Show with 'Dropping soon' badge, lock icon, disabled interaction
2. **Unlocked Features**: Normal interactive behavior
3. **Dashboard Banner**: Appears when any monetization features are locked
4. **Navigation**: Gated items show appropriate locked/unlocked states
5. **Tooltips**: 'Coming this season' on hover for locked items

## Testing Checklist

- [ ] Navigation items show correct locked/unlocked states
- [ ] Dashboard banner appears/disappears based on feature flags
- [ ] Locked items are not clickable
- [ ] Tooltips work on hover
- [ ] Visual design matches existing UI
- [ ] Responsive behavior works on mobile
- [ ] Accessibility attributes are present

## Development Notes

- Feature flags are server-only (no NEXT_PUBLIC_ variables)
- Environment defaults: development=unlocked, production=locked
- Local overrides take precedence over environment defaults
- Server enable flags take precedence over local overrides

