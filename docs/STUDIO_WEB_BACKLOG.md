# Studio Web — Parity & Correctness Backlog

Tracking what `studio.labeld.app` is behind on relative to Studio Mobile and the
backend. Audited 2026-09-06 off `main` (`1f864ca`).

**Method.** Two objective measures, not impressions:

1. All 217 backend callables (`onCall`, both v1 and v2 syntax), diffed by which
   client actually references each name. **55 are used by mobile and appear
   nowhere in Studio Web's `src/`.**
2. Studio Web's route tree vs. mobile's `*_screen.dart` list.

Regenerate measure 1 with:

```
grep -rhzoE "export const [a-zA-Z0-9_]+ = (functions[^=]*\.onCall|onCall)" \
  backend/labeld-backend/functions/src | tr '\0' '\n' \
  | sed -E 's/export const ([a-zA-Z0-9_]+) =.*/\1/' | sort -u
```

Status key: `[ ]` open · `[~]` in progress · `[x]` done

---

## P0 — Broken or actively losing data

### [ ] P0-1 · Product image upload on web still goes straight to Cloudinary

**This is almost certainly the "can't upload products on web" complaint.**

Mobile migrated product images to ImageKit (Firebase Storage as the only
fallback; the code comment states Cloudinary "is being retired, so it is NO
LONGER a fallback") — `media_upload_service.dart:199`. The backend agrees:
`MEDIA_UPLOAD_ORDER` defaults to `"imagekit,firebase"`, with Cloudinary absent
from the chain entirely.

**Studio Web has zero ImageKit references.** `uploadFileDirectCloudinary`
(`src/lib/storage/cloudinary.ts:345`) fetches a signature and then `POST`s the
file directly to `https://api.cloudinary.com/v1_1/{cloudName}/image/upload` from
the browser. That bypasses the backend's provider routing completely — no
ImageKit, no Firebase fallback, and an unconditional `throw` on failure. If the
Cloudinary account is retired, downgraded, or over quota, web uploads fail hard
while mobile keeps working.

Blast radius — every caller of `uploadFileDirectCloudinary`:

- `pieces/new` ← product creation
- `brand-space/piece/[id]/edit`
- `brand-space/piece/import/instagram/edit/[index]`
- `brand-space/piece/import/instagram/review`
- `events/[eventId]/moments`
- `components/brand/site-customization/SectionInspector.tsx`
- `components/events/site-customization/EventSectionInspector.tsx`

**Fix:** port `getImageKitUploadAuth` + direct-to-ImageKit multipart upload to
web (mirror `_uploadFileDirectImageKit`, `media_upload_service.dart:111`), and
keep the progress callback the current UI depends on.

**Note the second path is fine and can stay:** the misleadingly-named
`uploadImageToCloudinary` callable internally routes through
`uploadImageWithProviders` and honours `MEDIA_UPLOAD_ORDER`, with a Firebase
data-URI fallback. Only the *direct* browser→Cloudinary path is broken. 16 web
files use the safe `uploadImageCloudinary` wrapper; leave those alone for now.

- [ ] Confirm against production: is the Cloudinary account actually disabled or
      just quota-limited? Determines urgency and whether this is the whole story.
- [ ] Port ImageKit direct upload to web
- [ ] Repoint the 7 `uploadFileDirectCloudinary` call sites
- [ ] Audit remaining web upload paths for other mobile/web provider drift
      (`uploadProfileImage` on mobile still calls `_uploadImageCloudinary` —
      confirm that is intentional)

### [ ] P0-2 · Shipping settings can silently downgrade a Terminal Live config

`ShippingSettings.tsx:21` types `mode` as `"flat_all" | "flat_by_state"`. Mobile
writes a third value, `'terminal_live'` (`shipping_model.dart:199`).

A brand on Terminal Live opens web settings and sees **no mode selected** — an
unrepresentable state. The stored value survives if untouched, but the natural
reaction is to pick a radio, which overwrites live carrier rates with a flat fee.
Mobile's `FallbackStrategy` is not editable on web at all.

- [ ] Add `terminal_live` to the union; render it (read-only is acceptable v1)
- [ ] Surface the fallback strategy

---

## P1 — Route exists, the action behind it does not

### [ ] P1-1 · Premium themes are an unlocked dead end

`site-customization/page.tsx:40` feeds `AVAILABLE_TEMPLATES` into the gallery
with no filter on `status` or `access`. `templates.ts:4` casts the manifest
`as unknown as Template[]` because the web `Template` model has no `access`,
`status`, `regularPriceMinor`, or `proPriceMinor` — those fields are discarded at
the type boundary. The only gate is `TemplateCard.tsx:28`
(`!isProUser && template.isProOnly`), and both premium themes are
`isProOnly: false`.

Result: CHASSIS (₦25,000) and ORBIT (₦36,000) render as free, unlocked cards.
Activation then fails with `permission-denied / PREMIUM_THEME_REQUIRED` from
`storefront.ts:114`. Not a security hole — the backend enforces correctly — but a
guaranteed dead-end click. The missing `status` filter also meant ORBIT was
visible while still `draft`.

Mobile does this right: `site_customization_screen.dart:108` filters
`status == 'live' || entitled || showHidden`, splits included vs. premium, and
has `theme_checkout_sheet.dart` for purchase.

Missing callables: `getStorefrontThemeEntitlements`, `createThemePurchase`,
`devGrantChassisThemeEntitlement`, `devGrantOrbitThemeEntitlement`.

- [ ] Extend the web `Template` model with `access` / `status` / price fields
- [ ] Filter the gallery on `status` and entitlement
- [ ] Lock + price on `TemplateCard`
- [ ] Purchase flow (`createThemePurchase`)

### [ ] P1-2 · Wallet has no withdrawal

`/wallet` exists but `requestWithdrawal`, `getWithdrawalPreview`, and
`cancelWithdrawalRequest` are referenced nowhere in web. Brands can see a balance
they cannot move.

### [ ] P1-3 · Billing is read-only

`BillingSettings.tsx` renders status but calls neither
`cancelBrandProSubscription` nor `retryProSubscriptionCharge`. A brand can
subscribe on web but can't cancel or retry a failed charge there. Mobile's
`billing_subscription_screen` does both. Two callables; closes a recurring
support burden.

### [ ] P1-4 · Orders can't produce documents

`generateStoreOrderInvoice`, `generateStoreOrderReceipt`,
`prepareManualSalePaymentLink` all unused on web.

### [ ] P1-5 · Account deletion may be incomplete

Web uses `deleteAuthenticatedUser`; mobile uses `deleteUserAccountAndData`.
Worth a compliance check — confirm which one actually purges brand data.

---

## P2 — Whole features absent from web

### [ ] P2-1 · Shipping & fulfillment (Terminal Africa) — the largest hole

16 orphaned callables: `getRates`, `createShipment`, `createParcel`,
`createPackaging`, `createAddress`, `createPickupAddress`, `validateAddress`,
`arrangePickup`, `bookCustomerSelectedTerminalShipment`,
`cancelTerminalShipment`, `saveTerminalShipment`, `getTerminalShipmentStatus`,
`getTerminalCities`, `initializeTerminalShippingPayment`,
`reconcileTerminalShippingPayment`, `batchUpdateStoreFulfillmentStatus`.
Mobile drives all of it from `arrange_shipping_screen.dart`. Web has nothing.

### [ ] P2-2 · Discounts & coupons

Mobile: `discounts_screen`, `add_discount`, `discount_details`,
`discount_analytics`, `add_coupon`, `coupon_details`. Web has no route;
"discount" appears only as a per-product field and in pricing marketing copy,
"coupon" in zero files. Callable: `generateDiscountCampaignCopy`.

### [ ] P2-3 · Newsletter

Mobile: `newsletter_screen`, `send_newsletter_campaign`,
`newsletter_csv_import`, `newsletter_popup_settings`. Web: marketing copy and a
footer link. Callables: `createNewsletterSubscriber`, `generateCampaignEmailCopy`.
Dormant branch `feat/newsletter` — check for salvage before starting fresh.

### [ ] P2-4 · Expenses

Mobile: `expenses_screen`, `add_expense`, `create_expense_category`. Web: the
word appears only in `pricing/pricingData.tsx`. Callables:
`autoLogOrderShippingExpense`, `backfillAllBrandsShippingExpenses`. Dormant
branch `feat/expense-credit-import-maintenance`.

### [ ] P2-5 · Customer groups, profiles & CSV import

Mobile: `customer_groups_screen`, `create_customer_group`,
`customer_profile_screen`, `customer_csv_import` + history. Web has `/customers`
and `/customers/campaign` only; "customer-group" appears in zero files.
Callables: `addCustomerAddress`, `backfillCustomersFromOrders`.

### [ ] P2-6 · AI / Assistant

"assistant" appears in **zero** web files. Callables: `askAssistant`,
`rateAssistantMessage`, `generateProductCopy`, `removeImageBackground`,
`generateMonthlyBrandReport`. Mobile also has `studio_credits_screen` covering AI
generations / background removals / messaging credits — web only has waitlist
credits via `PurchaseCreditsDialog`.

### [ ] P2-7 · Storefront settings gaps

`updateStorefrontSeo` (mobile: `seo_integrations_screen`),
`updateClosedStorefrontSettings`, `setStorefrontPasswordProtection` — all unused
on web.

### [ ] P2-8 · Product CSV / AI import

Mobile: `csv_import_screen` + history, `ai_import_review_screen`. Web has
Instagram import only. Dormant branch `feat/import-products`.

### [ ] P2-9 · Smaller mobile-only screens

`record_sale`, `return_policy_settings`, `whats_new` (callables `getLMoments`,
`markLMomentsSeen`), `typography_screen`, `notifyBrandOnboardingComplete`.

---

## Where web is ahead — do not regress

Events is far richer on web: create flow, merch, moments, review, tickets,
site-customization + preview, `events-analytics`. Plus `bookings`,
`organizer-space`, `reports`, the full `admin/*` suite, and Instagram import.
Mobile has no equivalents.

---

## Cross-repo hygiene

### [ ] H-1 · Backend source of truth is uncommitted

`backend/labeld-backend` on `main` has uncommitted `verifyDNS.ts` (the www
CNAME/ALIAS acceptance fix), the manifest source JSON, four wallet files, plus
untracked `src/search/`, `payoutHolds.ts`, `reindex-algolia.mjs`. Studio Web's
committed manifest and its `SERVER_IP` change both depend on that backend work,
so the web repo is currently ahead of what the backend has committed.

### [ ] H-2 · Storefront template installment prices are stale

CHASSIS and ORBIT carry identical installment values (3 × ₦14,000 = ₦42,000
regular; 3 × ₦11,500 = ₦34,500 pro) despite different one-time prices. Against
CHASSIS pro at ₦10,000 one-time, the installment total is 3.45×. These were not
updated when the one-time prices were repriced.

Currently harmless — the fields reach the mobile model but nothing reads them for
display or charging. The generator's validator checks types and required fields
but never cross-checks installments against the one-time price, so it passes
silently.

- [ ] Decide the real numbers, fix in `storefrontTemplateManifest.source.json`
- [ ] Add an installment sanity check to the generator's `validateManifest`

### [ ] H-3 · Stale feature branches

`feat/newsletter`, `feat/expense-credit-import-maintenance`,
`feat/import-products`, `feat/studio-web-premium-revamp`,
`redesign/feat-additions`, `fix/pricing`. Triage: salvage or delete.
