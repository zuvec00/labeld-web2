# Studio Web ↔ Studio Mobile — Parity Audit

Audited **2026-10-15**. Mobile (`labeld_studio_mobile`, v1.32.0+17, 464 Dart files) is the
source of truth. Web is `studio-labeld-app` (526 files). Backend is `labeld-backend`.

This supersedes the 2026-09-06 `STUDIO_WEB_BACKLOG.md`. That file is partly stale, see
[Corrections to the September backlog](#corrections-to-the-september-backlog).

Status key: **MISSING** (no web equivalent) · **PARTIAL** (exists, behind mobile) ·
**OUTDATED** (exists but reads/writes an old model, old service or a retired product
decision) · **BROKEN** (wrong today) · **OK** (matches).

---

## 0. How this was measured

Not impressions. Four mechanical passes, then manual reads of both sides for every area.

| Pass | Result |
|---|---|
| Backend callables (`onCall`, v1+v2) | **319** (was 217 on Sept 6) |
| Callables referenced by mobile / by web | **131 / 72** |
| Mobile-only callables (string search over both `src/` trees) | **~95**, listed in [Appendix A](#appendix-a--callables-mobile-uses-and-web-doesnt) |
| Firestore collections mobile reads/writes that web never touches | 20+, [Appendix B](#appendix-b--firestore-collections) |
| Mobile model keys (`map['x']` / `'x':`) that appear **nowhere** in web source | 20 models affected, [Appendix C](#appendix-c--model-fields-mobile-has-and-web-has-nowhere) |
| Per-screen: mobile user-visible strings and handlers vs web component | every route in `app_router.dart` mapped in [section 3](#3-route-by-route-matrix) |

**What is not exhaustively verified** (marked `verify` below): Events/bookings (web is ahead,
only spot-checked), the two onboarding wizards, `pricing/page.tsx` copy, depth of the three
analytics pages, and visual/UX parity. Those need a side-by-side QA pass during the build, not
more grepping.

Regenerate the callable diff: list backend callables (`export const X = …onCall`), then
intersect with every quoted identifier in each client's source (`lib/` for mobile, `src/` for web).

---

## 1. Headline findings

Four things matter more than the feature list.

1. **Money and data integrity bugs exist on web today** (section 2). Highest: web can mark a
   customer-paid courier order "delivered" without the courier ever being booked, and the web
   feedback form writes to a collection nothing reads any more.
2. **Web is a different product in the places Labeld changed its mind.** Payouts moved from
   paid schedules to instant withdrawals; shipping moved to live courier rates; feedback
   moved to a roadmap board; product import moved from Instagram to Pinterest. Web still
   implements the old decisions.
3. **The gap is widest in the money-adjacent and growth tools**: discounts/coupons,
   expenses, newsletter, collabs, AI, invoices/receipts, withdrawals, shipping fulfilment.
   Roughly 60 callables and ~25 mobile screens have no web counterpart.
4. **Web has several features mobile doesn't** (events suite, bookings, admin, Instagram
   import). They must survive the rebuild, see [section 5](#5-where-web-is-ahead--do-not-regress).

---

## 2. Broken or wrong on web right now

Fix before building anything new. Ordered by blast radius.

### B-1 · Web can complete a customer-paid courier order that was never booked — BROKEN

Mobile blocks manual fulfilment while a customer-selected Terminal courier is unbooked
(`order_details_screen.dart:159-330`, `_hasPendingCustomerCourierBooking`). The buyer's
shipping payment only settles with the courier when booking runs, so closing the order by
hand leaves the parcel un-dispatched and the money unmoved.

- Web `StoreOrderDetailDrawer.tsx` has **zero** terminal awareness (no match for
  `terminal` anywhere under `components/orders/` or `types/orders.ts`). The status dropdown
  is always live.
- Backend guard exists **only** in `batchUpdateStoreFulfillmentStatus`
  (`fulfillment/storeFulfillment.ts:488-499`). The single-line
  `updateStoreFulfillmentStatus` (`:268`), which **web calls**
  (`StoreOrderDetailDrawer.tsx:153`), and the legacy `setFulfillmentStatus` used by
  `FulfillmentLineManager.tsx:44` have no such check.
- **Fix is two-part:** add the same guard to the single-line callable (backend), and add the
  "book courier" flow to web (section 4, S-2). Until the second lands, web needs a UI lock.

### B-2 · Web feedback form writes to a dead collection — OUTDATED

`components/settings/FeatureRequests.tsx:36` does `addDoc(collection(db, "feature_requests"))`.
Mobile and the backend moved to `feedbackPosts` with votes, comments, status, attachments and
counters (`feedback/feedbackCounters.ts`, `feedbackNotifications.ts`,
`feature_request_service.dart:14`). Nothing in the new pipeline reads `feature_requests`, so a
request submitted on web never reaches the roadmap board or the team notification path.
Needs: re-point to `feedbackPosts`, plus board, vote, comment (section 4, F-1).

### B-3 · Customer rows link to a page that doesn't exist — BROKEN

`CustomersPage.tsx:283` → `router.push('/customers/${c.id}')`. There is no
`customers/[id]` route (only `customers/page.tsx` and `customers/campaign`). Every
customer row click 404s. Mobile has `customer_profile_screen.dart` (profile, private notes,
order history, create order, edit, delete).

### B-4 · Retired payout-schedule UI is still live — OUTDATED

`components/settings/PayoutSettings.tsx:81-125` still sells paid faster payout schedules
(0.5%–1% fee, caps ₦1,000/₦3,000) and writes `wallet.payout.schedule` in two non-atomic
`updateDoc` calls. Mobile retired this: `payout_settings_screen.dart` is now a stub kept
"only so any lingering navigation doesn't break" saying *Withdraw anytime from your Wallet*,
and nothing in mobile calls `updatePayoutSchedule` any more. Current model
(`wallet/withdrawals.ts:180-181`, `:538`): instant Paystack transfer, **flat ₦100 fee, ₦1,000
minimum, one open withdrawal at a time**. Web can't withdraw at all (`requestWithdrawal`,
`getWithdrawalPreview`, `cancelWithdrawalRequest` referenced nowhere). **Decision needed:**
retire the schedule selector and replace with withdrawals.

### B-5 · Web onboarding checklist is missing a step and may read the wrong phone — PARTIAL

Mobile has 5 steps (bank, profile, shipping, product, **website**). Web
(`hooks/useBrandOnboardingStatus.ts`) has 4, no "Set up your website"
(`storefrontConfig.activatedAt`, `onboarding_service.dart:84-91`). Also mobile's profile step
checks the phone number on the **user** doc (`userData['phoneNumber']`); web checks the
**brand** doc (`brand?.phoneNumber`, `:71`). `verify` which is the real source of truth
before touching it.

### B-6 · Storefront URL shown wrong — BROKEN

`StorefrontStatus.tsx:22-23` builds `${username}.labeld.app`. Mobile's
`BrandModel.preferredStorefrontUrl` (`brand_model.dart:112`) is the canonical rule: custom
domain if `useCustomDomain && customDomainStatus == 'active'`, else `brandSlug`, else
`username`. This is the exact bug that makes Search Console verification fail for brands with
a slug or custom domain. Web has no equivalent helper; add one and use it everywhere a
store link is shown (also share links in `BrandSpaceView`, dashboard header).

### B-7 · Premium themes are a dead end — OUTDATED (still open from Sept, P1-1)

`TemplateGallery` / `TemplateCard` don't read `access`, `status`, price or entitlement
(`lib/constants/templates.ts` casts the manifest `as unknown as Template[]`; web `Template`
type has none of those fields). CHASSIS/ORBIT render as free; activation then fails
`PREMIUM_THEME_REQUIRED`. Missing: `getStorefrontThemeEntitlements`, `createThemePurchase`.

### B-8 · Web product writes ignore four fields mobile now owns — PARTIAL

`lib/firebase/queries/product.ts:27-70` (`toProduct`) and `fetchProductById` drop, and the
form never sets: **`weightGrams`** (live courier rates fall back to the global default for every
web-created product), **`discountWindow`** (timed discounts), **`isPublished`** (draft/live
toggle; web only has launch date). Web uses `updateDoc`, so it won't erase these on save, but
it can't set or show them, and a mobile-authored draft looks live on web.

### B-9 · Web Radar posts are the pre-multi-media shape — OUTDATED

`radar/new/page.tsx:166-190` writes `teaserImageUrl` + `mediaType: "image"` + nested `brand`
only. Mobile writes `mediaItems[]` (up to 5 images or 1 video ≤30s), `imageWidth/Height/
AspectRatio` and flat `brand*` fields (`add_radar_screen.dart:242-283`,
`RADAR_MULTI_MEDIA_IMPLEMENTATION.md`). Web-posted moments have no aspect ratio, so the
consumer masonry layout needs the manual backfill script
(`scripts/backfillRadarImageDimensions.ts`) to lay them out. Also
`addDropContentCF` expects `{id}` back (`callables/dropContent.ts:9`) but the backend returns
only `{success: true}` (`brandHandlers.ts:~1010`), so web gets `""` for the new id.

### B-10 · Notifications bell shows only half the feed — PARTIAL

`NotificationBell.tsx:26` reads global `announcements` only. Mobile merges
`users/{uid}/notifications` (per-user) with announcements
(`announcement_service.dart:getNotificationFeed`). Per-user notifications never appear on web.

### B-11 · No account deletion on web — MISSING (compliance)

Sept backlog P1-5 said web uses `deleteAuthenticatedUser`. It doesn't; nothing in
`studio-labeld-app/src` references either deletion callable. `AccountSecurity.tsx` offers
email change + password reset only. Mobile offers `deleteUserAccountAndData` (full purge of
brand, events, orders data) behind re-auth. Note `deleteAuthenticatedUser` deletes **only the
Auth user** and must not be used for this.

### B-12 · Pro gating is inconsistent — PARTIAL

Mobile marks these PRO and gates the tap (`more.dart`): Waitlist, Abandoned Carts,
Newsletter, Send Campaign, Discounts & Coupons, Collabs, Storefront Analytics, Domains,
Integrations, Event Customization. Web gates only Domains, Storefront Analytics, Site
Customization and Event Customization. `audience/waitlist`, `abandoned-carts`,
`customers/campaign` have no `isPro` check and no upsell. `verify` whether the backend
enforces these; if it doesn't, a free brand can use them from web.

### B-13 · Hygiene: one-time admin pages are reachable by any signed-in user — BROKEN (security)

`(dashboard)/init-store`, `init-brands`, `init-fee-settings`, `admin/*`,
`(protected)/admin/slug-backfill`, `(protected)/dev/seed-announcements`. The only guard is
`AuthGuard` (signed-in). `init-store` is documented as a one-time DB-wide batch update on
`dropProducts`. Safety currently rests entirely on Firestore rules. Delete the one-time pages
or gate by admin claim. Also `wallet/page.tsx` still imports both `TestPayoutPanel` and
`TestStorePayoutPanel` (render is commented out; remove imports).

### B-14 · Smaller drifts

- **Brand profile edit** (`brand-space/profile/edit/page.tsx`): writes `youtube` (mobile never
  does), lacks `pinterest`, `snapchat`, `xHandle` fields that mobile edits.
- **Web `Brand` type** (`lib/models/brand.ts`) lacks `snapchat`, `marketplaceStatus`,
  `subscriptionCancelAtPeriodEnd/CancelledAt/CancellationSource`, `passwordProtectionEnabled`,
  `credits`.
- **Tutorials** persist in `users.onboarding.tutorials`; mobile uses a `tutorialProgress`
  collection with `completedTours/dismissedTours/skipAllTours`. Independent systems; fine if
  intentional, but "skip all tours" won't sync.
- **Template manifest** is a generated copy (`lib/constants/storefront-template-manifest.ts`).
  Hashes differ across web/backend/mobile only because of format; `verify` it was regenerated
  after the latest backend `storefrontTemplateManifest.source.json` change.

---

## 3. Route-by-route matrix

Every mobile route in `routes/app_router.dart`.

| Mobile route / screen | Web | Status | Gap |
|---|---|---|---|
| `/dashboard` Home | `/dashboard` | PARTIAL | No Urgent Actions, Labeld Intelligence, Sales Snapshot, feature carousel, blog, marketplace banner, assistant. [H-1](#h-1--home-dashboard) |
| `/home-intelligence` | – | MISSING | H-1 |
| `/blog` + blog cards | – | MISSING | I-2 |
| `/sign-up` `/login` `/forgot-password` `/terms-of-use` | `/login`, marketing auth | OK | Google/Apple/email present |
| `/role-selection` `/profile-setup` `/brand-setup/*` `/event-setup/*` | `/onboarding`, `/brand/setup/*`, `/user/setup` | OK `verify` | Not deep-compared |
| `/add-product` | `/pieces/new`, `/brand-space/piece/[id]/edit` | PARTIAL | [P-1](#p-1--product-form) |
| `/product-details` | `/brand-space/piece/[id]` | PARTIAL | No publish/unpublish, lifetime overview, share link |
| `/csv-import`, `/csv-import-history` | `CsvImportModal`, `ImportHistoryDrawer` | OK `verify` | Same `importHistory` queue; check cancel + details parity |
| `/ai_import_review` | `InstagramAIImportReview` | PARTIAL | AI review exists for Instagram only |
| `/pinterest-connect`, `/pinterest-import` | – | MISSING | P-4. Mobile retired Instagram import (commented out in router); web still ships it |
| `/add-collection`, `/collection-details` | `/collections/new`, `/brand-space/collection/[id]` | PARTIAL | No `CollectionPerformanceInsights` |
| `/add-radar`, `/radar-details` | `/radar/new`, `drop-content/[id]` | OUTDATED | B-9 |
| `/event-details`, `/create-event/*`, `/events`, `/event-orders`, `/ticket-scanner` | `/events/*`, `/staff/scan`, `/scan` | OK, web ahead | Section 5 |
| `/order-details` | Orders drawer | PARTIAL | [O-1](#o-1--order-details) |
| `/production-summary` | – | MISSING | O-4 |
| `/record-sale` | `RecordSaleDrawer` | PARTIAL | O-3 |
| `/arrange-shipping` (+ sheets) | – | MISSING | S-2 |
| `/brand-space`, `/organizer-space`, `/edit-brand-profile`, `/edit-organizer-profile` | same | PARTIAL | B-14 |
| `/brand-progress` | – | MISSING | I-3 |
| `/site-customization`, `/customize-template/:id`, `/edit-section/:id` | `/brand-space/site-customization` | PARTIAL | [C-1](#c-1--site-customization) |
| `/typography` | `BrandIdentityView` presets | OK | All 8 presets match |
| `/brand-identity` | `BrandIdentityView` | PARTIAL | No wordmark, no Orbit brand mark |
| `/return-policy-settings`, `/shipping-policy-settings` | – | MISSING | C-2 |
| `/marketplace-invitation` | – | MISSING | I-4 |
| `/studio-overview` | `/analytics/overview` | OK `verify` | |
| `/marketplace-analytics` | `/marketplace-analytics` | OK `verify` | |
| `/storefront-analytics` | `/storefront-analytics` | OK `verify` | traffic sources present |
| `/wallet`, `/transaction-history` | `/wallet`, `/monetization/*` | PARTIAL | B-4, M-1 |
| `/payout-settings` | `PayoutSettings` | OUTDATED | B-4 |
| `/studio-credits` | – | MISSING | M-3 |
| `/expenses`, `/expenses/add|edit`, `/expense-categories/new` | – | MISSING | M-2 |
| `/billing-subscription`, `/cancel-pro-flow` | `BillingSettings` | PARTIAL | M-4 |
| `/pricing` | `/pricing` | OK `verify` | web adds promo-claim flow |
| `/shipping-settings`, `/shipping-strategy` | `ShippingSettings` | OK | Phase 1 done |
| `/account-security` | `AccountSecurity` | PARTIAL | B-11 |
| `/suggest-improvement` | `FeatureRequests` | OUTDATED | B-2 |
| `/domain-settings` | `/domains` | OK | |
| `/seo-integrations` | – | MISSING | C-3 |
| `/developer-options` | – | n/a | internal tooling |
| `/messaging`, `/notify-waitlist` | `/audience/waitlist(/notify)` | OK | B-12 gating |
| `/newsletter`, `/popup-settings`, `/send-campaign`, `/newsletter-csv-import` | – | MISSING | G-2 |
| `/abandoned-carts`, `/abandoned-carts-settings`, `/all-abandoned-carts` | `/abandoned-carts(/settings)` | OK | minor: `heroImage`, `insufficientCreditsNotifiedAt` |
| `/customers` | `/customers` | PARTIAL | G-1 |
| `/customer-details` | – | BROKEN | B-3 |
| `/customer-groups`, `/create-customer-group` | – | MISSING | G-1 (`custom_segments` query exists, no UI) |
| `/send-customer-campaign` | `/customers/campaign` | PARTIAL | G-3 |
| `/customer-csv-import(+history)` | `CsvCustomerImportModal`, history drawer | OK | |
| `/collabs/*` (6 routes) | – | MISSING | CB-1 |
| `/discounts`, `/add-discount`, `/add-coupon`, `*-details`, `/discount-analytics` | – | MISSING | D-1 |
| `/whats_new`, notification bell, tours, assistant overlay | bell, tutorial | PARTIAL | I-1, B-10 |

---

## 4. What to build

Grouped by area. Each entry names the mobile source of truth, what web lacks, and the
backend surface (callables / collections) it already has, so no backend work is implied
unless stated. **[Bk]** = needs backend change.

### Home / dashboard

#### H-1 · Home dashboard
Mobile `home.dart` composes: `UrgentActions` (2045 lines), `LabeldIntelligence`,
`OnboardingChecklist`, `SalesSnapshot`, `BrandQuickActions`, `BlogSection`, feature-
announcement carousel, Pro upgrade banner, marketplace-invitation banner, notification bell.
Web has Brand Health, Momentum, Money snapshot, store toggle, checklist.

- **Urgent actions** (`urgent_actions_service.dart`): orders needing action; low/out-of-stock
  counts; payout not set up; website not set up; promo ended/expired; subscription expired;
  **recovery credits ≤ 20**; pending collab invites / suggestions; for organizers: pending
  bookings, ticket sold-out/low, reported moments, upcoming event.
- **Labeld Intelligence**: one dismissible insight at a time. Missing/short product
  descriptions (opens AI copy), Radar posts not linked to a product, recovery automation off,
  traffic up, views-without-purchases, remove image backgrounds, typography default,
  add wordmark, Search Console verify.
- **Sales snapshot**: all-time/this-year revenue, net revenue, next eligible payout, website
  visits; event variant.
- **Revenue vs expense chart** (needs Expenses, M-2).
- **Store toggle** (`brand_store_toggle.dart`, 1065 lines) beyond web's: product-readiness
  check (missing stock/sizes/images), password-protect prompt on close, "notify waitlist"
  prompt on open.
- **Feature carousel**, Pro upgrade banner, marketplace-invitation banner, blog section.

### Orders & fulfilment

#### O-1 · Order details
Web drawer lacks, all present on mobile `order_details_screen.dart`:
order number (`#1234` via `orderNumber`, fallback `#ST-…`); coupon + campaign-discount lines
(`coupon`, `campaignDiscount*`, `couponSavingsMinor`); fees breakdown incl. Paystack/Terminal
fees; **edit customer details** (`updateCustomerDetails`); **delete order** (manual sales);
share order; **mark paid**; **tracking** from Terminal (`getTerminalShipmentStatus`);
**cancel shipment** (`cancelTerminalShipment`); **reconcile paid-but-unreturned shipping
payment** (`reconcileTerminalShippingPayment`); **mark all delivered** (batch);
customer-paid-courier provenance badge; collab hand-off summary (`collabHandoff`).

#### O-2 · Invoices, receipts, payment links
`generateStoreOrderInvoice` (notes, terms, due date, include payment link, include bank
details), `generateStoreOrderReceipt`, `prepareManualSalePaymentLink`. Free-plan payment-link
limit surfaces as `FREE_PAYMENT_LINK_LIMIT_REACHED` → upgrade sheet. PDF and link sharing.
Web has none of the three.

#### O-3 · Manual sales
Web `RecordSaleDrawer` + `lib/firebase/manual-sale.ts` mirror the transaction well
(channels incl. snapchat/tiktok, stock decrement, fulfilment lines, customer sync). Missing:
`payment_link` payment method; **campaign discounts applied to line items**
(`getActiveCampaignDiscountForVariant`); editable unit price; **edit** (`updateManualSale`,
stock delta math), **delete** with stock restore (`deleteManualSale`), **mark paid**
(`markManualSaleAsPaid`); backdating is present.

#### O-4 · Production summary
`production_summary_screen.dart`: per-product, per-variant totals to produce across open
orders, segmented by status, for made-to-order / custom-production items. Pure client
aggregation over store orders; no backend.

#### O-5 · Orders list
Mobile `orders_filter_sheet`, `order_card`: filters + needs-action / in-progress /
completed / cancelled buckets derived from fulfilment lines. `verify` web filter parity.

### Shipping (largest backend surface, Sept P2-1)

#### S-1 · Phase 1 settings — **OK** (done, `bda20c6`)
Strategy, `terminal_live`, fallback, pickup addresses, default weight.

#### S-2 · Arrange shipping + customer-courier booking — MISSING
`arrange_shipping_screen.dart` (2422 lines): sender/receiver address CRUD with
`validateAddress`, `createPickupAddress → createAddress → createPackaging → createParcel →
createShipment → getRates`; rate cards; payment mode (`shippingPaymentMode`: brand-paid vs
wallet vs customer-paid); `initializeTerminalShippingPayment` → Paystack → `arrangePickup` →
`saveTerminalShipment`; `reconcileTerminalShippingPayment`.
Plus **customer-selected courier**: review sheet, `bookCustomerSelectedTerminalShipment`
(with `acceptAdditionalCost` re-confirm loop when the rate moved), and **sender
verification** (`getSenderVerificationStatus`, `startSenderVerification`,
`completeSenderVerification`, NIN-gated couriers like DHL). Web must redirect to Paystack
and resume, so pipeline state must survive a full navigation.
Callables: see Appendix A (`getRates`, `createShipment`, `createParcel`, `createPackaging`,
`createAddress`, `createPickupAddress`, `validateAddress`, `arrangePickup`,
`cancelTerminalShipment`, `saveTerminalShipment`, `getTerminalShipmentStatus`,
`getTerminalCities`, `initializeTerminalShippingPayment`, `reconcileTerminalShippingPayment`,
`bookCustomerSelectedTerminalShipment`, `batchUpdateStoreFulfillmentStatus`,
`autoLogOrderShippingExpense`). Skip the three `*TerminalAfricaWebhook*` (dev tools).

### Products & catalog

#### P-1 · Product form
Web `pieces/new` is 1866 lines but lacks vs `add_product_screen.dart` (4248 lines):
**package weight**, **publish/draft toggle** (`isPublished`), **timed discount**
(`discountWindow` start/end; web has only percent), **AI copy** (`generateProductCopy`:
product note + brand voice + image → name, description, highlights, tags, keywords; monthly
quota 50 free / 300 Pro via `users/{uid}/usage/ai_generation`), **background removal**
(`removeImageBackground`, per-image + batch; quota `usage/bg_removal`), **"hide while a
campaign discount is active"** logic, free-plan fee notice, collab "Suggest changes" flow,
cost price (present). Also `product_details`: unpublish/publish, lifetime overview, share.

#### P-2 · Collections
Missing `collection_performance_insights` (orders, revenue, sold, views).

#### P-3 · Product intelligence
`product_intelligence_section.dart` (Top Performer / Low Interest / High Abandonment from
`product_performance_daily`). Web has `components/pro/ProductIntelligence.tsx` but nothing
mounts it on a product page. `verify`.

#### P-4 · Pinterest import
`pinterest_connect/import_screen`, callables `startPinterestAuth`, `getPinterestConnection`,
`getPinterestBoards`, `getPinterestPins`, `importPinterestPins`, `disconnectPinterest`.
Pins → Radar drafts, "cover only", "already imported" tracking, reconnect-by date.

#### P-5 · Radar
Multi-media moments (B-9) and `radar_promotion_modal`.

### Storefront customization

#### C-1 · Site customization
Missing on web (all present on mobile and in `storefront_config_model.dart`):
- **Hero**: video (`videoUrl`, `videoThumbnailUrl`, MP4/MOV ≤20MB, replaces images),
  extra `backgroundImages`.
- **Footer**: `showReturnPolicy/returnPolicyText`, `showShippingPolicy/shippingPolicyText`.
- **New sections**: `newsletter` (header, subheader, background) and `lookbook`
  (`lookbookId`, hotspots in `lookbook_model.dart`) + **newsletter popup**
  (`NewsletterPopupConfig`: enabled, required/gate mode, header, background).
- **Identity**: `wordmarkUrl` (upload + remove-bg + crop), `showOrbitLandingBrandMark`.
- **Config**: `templateAccess`, `premiumThemeEntitled`, `closedPage` (description,
  `opensAt`, countdown), `seo`.
- **Gallery**: filter by `status`/entitlement, lock + price, installment fields, purchase
  (B-7; `theme_checkout_sheet.dart`).
- **Closed store**: closed-page editor, **password protection**
  (`setStorefrontPasswordProtection`, min 4 chars), "capture visitors" waitlist prompt
  (`store_closed` tag), `updateClosedStorefrontSettings`.
- Web `WaitlistSection` already matches mobile (tag, imageUrl, showOnClosedPage).
- Web's section list builds from `template.defaultSections` only
  (`site-customization/page.tsx:121-140`); a mobile-added newsletter/lookbook section
  not in the template default will not render in the web editor. `verify` it isn't dropped
  on a web save (saves go through `updateStorefrontSections`).

#### C-2 · Return and shipping policy pages
Two small editors (`return_policy_settings_screen`, `shipping_policy_settings_screen`) that
write the footer popup text.

#### C-3 · SEO / integrations
`seo_integrations_screen.dart`: Google Search Console + Bing verification code, validation
(rejects DNS-format values and URLs), uses canonical URL (B-6). `updateStorefrontSeo`. Pro.

### Money

#### M-1 · Wallet & withdrawals
`wallet_screen`, `request_withdrawal_sheet`, `link_bank_account_sheet`: available vs total on
platform, withdrawal preview (`getWithdrawalPreview`, flat fee), `requestWithdrawal`,
`cancelWithdrawalRequest`, payout history, bank change/remove. Web already has the ledger
and bank link; add withdrawal and retire B-4. `walletLedger` types match.

#### M-2 · Expenses — MISSING
`expenses_screen`, `add_expense_screen`, `create_expense_category_screen`.
`brands/{id}/expenses` and `expenseCategories`. 11 built-in categories + custom;
recurrence (`recurrenceInterval`, "stop recurring"); order linking; receipt attach +
**AI receipt extraction** (`extractExpenseFromReceipt`); auto-sources:
`ai_extracted`, `system_subscription`, `system_shipping`, `system_email_credits`. Period +
category filters, top category, highest single. Feeds the Home revenue/expense chart.
**Backend finding:** `extractExpenseFromReceipt` is called by mobile (`expense_service.dart:180`)
but does not exist anywhere in `labeld-backend/functions/src`. Either it is undeployed/
uncommitted work (compare Sept's H-1 note on uncommitted backend source) or the receipt
scan is broken in production. Settle this before building the web equivalent.

#### M-3 · Studio credits — MISSING
`studio_credits_screen`: AI generations (monthly reset, 50 / 300), background removals
(one-time allowance), messaging credits (top-up). `purchase_credits_modal` (Paystack).
Web only has waitlist credits (`PurchaseCreditsDialog`) and reads `brand.credits.balance`
in the campaign page. `BrandCredits` / `CreditTransaction` types absent.

#### M-4 · Billing & cancellation
Web `BillingSettings` is read-only. Mobile: retry failed renewal
(`retryProSubscriptionCharge`), cancel renewal (`cancelBrandProSubscription`, keeps Pro to
period end), resume (`resumeBrandProSubscription`), the full **cancel-Pro save flow**
(`getCancellationSaveContext`, `getRetentionOffer`, `acceptRetentionOffer`,
`recordCancellationFlow`: reason → tailored offer → confirm), payment history. Web already
handles the Paystack `aborted + isRedirect` resume case in `UpgradeConfirmModal`.

### Discounts & coupons — MISSING (Sept P2-2)
`brands/{id}/discounts` and `brands/{id}/coupons`, plain Firestore CRUD (no callable).
- **Campaign discount**: percent or fixed (+ max cap), scope storewide / products /
  collections, timing (ongoing or start/end), hero image, AI description, active toggle,
  overlap rules (storewide vs specific deactivate each other, with confirm), analytics screen
  (items sold, gross, discount given, net, best seller, by collection/product), promote via
  email campaign.
- **Coupon**: code (generate or custom, uniqueness check), cart vs product coupon, percent/
  fixed, min cart value, per-customer limit, total limit, `currentUsageCount`, status
  (Active / Scheduled / Expired / Usage Exhausted / Inactive), promote to segment.
- `generateDiscountCampaignCopy`. **Both skip collab lines** per the collabs spec.
- Product form already needs `discountWindow` (P-1).

### Audience

#### G-1 · Customers
Web: list, segments (all/new/returning/top/lapsed), search, sort, CSV import + history,
manual add, edit sheet. Missing: **profile page** (B-3), **customer groups**
(`custom_segments`: default segments All, Top Spenders, Returning, New, **Abandoned Carts**,
**No orders**, **Lapsed 30-90d**, custom groups; `streamCustomSegments` query exists in
`queries/customers.ts`, no UI), 6 sort orders (LTV, orders, recent, name±, email±),
**"Create order" from a profile**, private notes, delete.
`backfillCustomersFromOrders`, `addCustomerAddress` callables.

#### G-2 · Newsletter — MISSING (Sept P2-3)
`brands/{id}/newsletter_subscribers`. Add manually, **CSV import with AI column mapping**,
**convert to customer** (`convertNewsletterSubscriber`), popup settings, send campaign to
newsletter audience (`sendCustomerCampaign` with `audienceType: 'newsletter'`). Note the
web `newsletter_subscriptions` collection is the *platform* newsletter, unrelated.

#### G-3 · Customer campaign
Web sends to segment or picked customers. Missing: audiences **Newsletter subscribers**,
**Abandoned carts**, custom groups; **AI "Write / Improve with AI"**
(`generateCampaignEmailCopy`, shares the monthly AI quota); campaign **hero image**
(callable accepts `heroImage`; web UI doesn't expose it) — `sendCustomerCampaign` payload
also supports `audienceType`. Credits model matches (1 credit per recipient).

### Partnerships

#### CB-1 · Brand collabs (Pro) — MISSING (Sept P2-0)
Launch **Oct 28, 2026**; tracker: `Labeld Documents/collabs/COLLABS_V1_TRACKER.md`.
Web has the `collabs` feature flag (off in prod), a product-editor lock, no UI. Needs: list
(Active/Invitations/Completed), create/edit (brand search via Algolia, dates, hero image/
video, media gallery reorder), invite/respond/cancel, workspace (Overview, Products with
shared stock, Sales, Shipping hand-offs, Activity, Settings: pause/resume/end/delete),
partner product **suggestions** (approve/withdraw), analytics screen, **order hand-off**
("Ask a partner to ship", accept/decline, 24h expiry), product attach/detach, order
`collabHandoff`. Callables are `*Collab*`, `*FulfilmentHandoff`, `respondToProductSuggestion`,
`updateCollabProduct`. **Do not start until the collab backend is merged to `main`**
(tracker Phase 6) — the backend is live from the feature branch.

### Intelligence & engagement

#### I-1 · Assistant "L" and What's New
`features/assistant/*`: `askAssistant`, `rateAssistantMessage`, `getLMoments`,
`markLMomentsSeen`. Overlay, launcher, markdown, moments history. KB lives in backend
(`integrations/assistant/`).

#### I-2 · Blog in Studio
`blog_service.dart`: reads `publishing_articles`/`publishing_categories` (written by the
Publishing Engine), `summarizeBlogArticle`, `trackBlogEvent`, helpful votes.

#### I-3 · Brand Progress
`getBrandProgress`, `acknowledgeBrandProgressEvents`; model has percentile, cohort, benchmark,
`trendPct`, competence signals. Rings widget, feature sheets.

#### I-4 · Marketplace invitation
`respondMarketplaceInvitation`; requires a default pickup address; `marketplaceStatus`
(pending / accepted / suspended / removed). Home banner while `status == 'invited'`.

#### I-5 · Feedback board
B-2. `feedbackPosts` + `votes`, `comments` (threaded, admin badge, attachments), categories,
statuses, roadmap section, sort.

---

## 5. Where web is ahead — do not regress

Unchanged from September, and re-confirmed: Events (create flow, merch, moments, tickets,
review, event site customization + preview, `events-analytics`), `bookings` (availability,
check-ins), `organizer-space`, `reports`, the `admin/*` suite, the `pricing` promo-claim flow, customer
CSV import + history, `scan`/`staff/scan`, `invite/[token]`, feature flags.

Mobile still points organizers to web for event customization
(`more.dart` bottom sheet → `studio.labeld.app/events/site-customization`), so that URL is a
contract.

---

## 6. Corrections to the September backlog

| Sept item | Status now |
|---|---|
| P0-1 ImageKit upload | code landed `6ff7bc1`; production confirmation still open. Unchanged. |
| P0-2 Terminal Live downgrade | done `bda20c6` |
| P1-5 "Web uses `deleteAuthenticatedUser`" | **wrong** — web has no deletion at all (B-11) |
| P2-5 "customer-group appears in zero files" | `CustomerGroup` type and `custom_segments` query exist; only UI is missing |
| P2-8 Product CSV import | **already on web** (`CsvImportModal`, history, `queueCsvImport`); only Pinterest/AI-review remain |
| P2-9 `record_sale` | **already on web** (`RecordSaleDrawer`); remaining gaps in O-3 |
| 55 mobile-only callables | now ~95 (backend grew 217 → 319) |
| New since September | collabs, Pinterest, assistant L, blog, brand progress, withdrawals, cancel-save flow, premium-theme purchase, closed-page/password, video hero, wordmark, studio credits, invoices/receipts, sender verification, feedback board |

---

## 7. Build tracker

Rule (same as the collabs tracker): finish and review every box in a phase before starting
the next. ⛳ = verification gate. **[Bk]** = backend change, deploy backend first and
separately from web. Item IDs refer to section 4 / section 2. Update this section in the same
commit that lands the work, with the commit hash.

Status: Phase 0 ☐ · Phase 1 ☐ · Phase 2 ☐ · Phase 3 ☐ · Phase 4 ☐ · Phase 5 ☐ · Phase 6 ☐ · Phase 7 ☐

**Phase 0: Stop the bleeding**
- [ ] B-1 [Bk] Add the unbooked-courier guard to `updateStoreFulfillmentStatus` (copy from `batchUpdateStoreFulfillmentStatus`, `storeFulfillment.ts:488-499`)
- [ ] B-1 Web: lock the status control on `terminal_live` orders with no `terminalShipmentId` until S-2 lands
- [ ] [Bk] Pro enforcement for campaigns, waitlist notify, newsletter, abandoned-cart recovery, expenses (decision 2)
- [ ] [Bk] Firestore rules: Pro check on `brands/{id}/discounts|coupons` writes (emulator-test list queries; never touch the catch-all)
- [ ] B-2 Re-point feedback form to `feedbackPosts` (full board is I-5)
- [ ] B-3 Customer profile route `/customers/[id]` (fixes the 404)
- [ ] B-5 Onboarding checklist "Set up your website" step; settle user-doc vs brand-doc phone
- [ ] B-6 Canonical storefront URL helper, used everywhere a store link is shown
- [ ] B-7 Premium themes: extend `Template` model, filter by `status`/entitlement, lock + price on card
- [ ] B-10 Notification bell merges `users/{uid}/notifications`
- [ ] B-11 Account deletion via `deleteUserAccountAndData` with re-auth
- [ ] B-13 Delete one-time pages (`init-*`, `admin/slug-backfill`, `dev/seed-announcements`) or gate by admin claim; drop dead test-panel imports
- [ ] Remove Instagram import (decision 3): `components/brand/instagram/*`, `piece/import/instagram/*`, `useInstagram`, instagram callables
- [ ] ⛳ Gate: free-plan brand cannot use Pro tools from web or via a direct client write; courier order cannot be marked delivered unbooked; feedback appears on the mobile board

**Phase 1: Money**
- [ ] M-1 Withdrawals (`getWithdrawalPreview`, `requestWithdrawal`, `cancelWithdrawalRequest`) for brands and organizers
- [ ] B-4 Retire the payout-schedule selector (`PayoutSettings`, `PayoutScheduleSelector`, `PayoutFeeCalculator`)
- [ ] O-2 Invoices, receipts, payment links (incl. free-plan limit upsell)
- [ ] M-4 Billing: retry, cancel, resume, cancel-Pro save flow, payment history
- [ ] M-3 Studio credits page + purchase (`BrandCredits`, usage docs)
- [ ] [Bk] Resolve `extractExpenseFromReceipt` (not in backend source)
- [ ] ⛳ Gate: withdraw in Paystack test mode end to end; invoice PDF matches mobile's

**Phase 2: Selling tools**
- [ ] D-1 Discounts: list, create/edit, analytics, overlap rules, promote
- [ ] D-1 Coupons: list, create/edit, details, promote
- [ ] P-1 Product form: weight, `isPublished`, `discountWindow`, AI copy, background removal
- [ ] B-8 Product mapper/type: add `weightGrams`, `isPublished`, `discountWindow`
- [ ] O-1 Order detail gaps (order number, coupon/discount lines, fees, edit customer, delete, share)
- [ ] O-3 Manual sales: payment link method, campaign discounts, editable price, edit/delete/mark paid
- [ ] O-4 Production summary
- [ ] ⛳ Gate: web-created discount applies at storefront checkout; manual-sale edit restores stock correctly

**Phase 3: Fulfilment** (needs Terminal sandbox credentials)
- [ ] S-2 Rates pipeline through rate selection
- [ ] S-2 Payment, pickup, save (survives Paystack redirect); `reconcileTerminalShippingPayment`
- [ ] S-2 Customer-selected courier booking + sender verification
- [ ] S-2 Cancel shipment, tracking, batch status
- [ ] Retire legacy `setFulfillmentStatus` / `upsertFulfillmentLine` web paths
- [ ] ⛳ Gate: full sandbox order: customer pays courier at checkout, brand books from web, tracking shows

**Phase 4: Storefront**
- [ ] C-1 Hero video + background images; footer policies; wordmark; Orbit brand mark
- [ ] C-1 Closed page, password protection, waitlist-on-closed prompt
- [ ] C-1 Newsletter + lookbook sections, newsletter popup
- [ ] C-2 Return and shipping policy editors
- [ ] C-3 SEO / integrations
- [ ] B-7 Premium theme purchase (`createThemePurchase`)
- [ ] Confirm web editor never drops mobile-added sections on save
- [ ] ⛳ Gate: configure a store on web, open on mobile, then reverse; nothing lost

**Phase 5: Audience and growth**
- [ ] G-1 Customer groups, default segments, sorts, create order from profile
- [ ] G-2 Newsletter (subscribers, AI CSV import, convert, popup)
- [ ] G-3 Campaign audiences (newsletter, abandoned, groups) + AI copy + hero image
- [ ] M-2 Expenses (categories, recurring, receipts) and home revenue/expense chart
- [ ] H-1 Dashboard: urgent actions, intelligence, sales snapshot, store toggle checks, banners
- [ ] P-4 Pinterest import (replaces Instagram)
- [ ] P-5 / B-9 Multi-media Radar (up to 5 images or 1 video) with dimensions
- [ ] P-2 / P-3 Collection insights, product intelligence on product page
- [ ] ⛳ Gate: Home matches mobile for a brand with orders, low stock and no bank

**Phase 6: Newer surfaces**
- [ ] I-1 Assistant L + What's New
- [ ] I-2 Blog in Studio
- [ ] I-3 Brand progress
- [ ] I-4 Marketplace invitation
- [ ] I-5 Feedback board (votes, comments, roadmap)
- [ ] ⛳ Gate: side-by-side with mobile

**Phase 7: Collabs** — blocked on: Node 22 upgrade (before Oct 30), live collab E2E, `collabs/*/private|sales|buyers` rules, marketplace hiding. Branch merge is done.
- [ ] CB-1 List, create/edit, media, invite/respond
- [ ] CB-1 Workspace tabs, settings, suggestions, analytics
- [ ] CB-1 Order hand-off both directions
- [ ] Turn `collabs` flag on for launch brands only after the gate
- [ ] ⛳ Gate: two test brands run the full flow from web and mobile interchangeably

**Cross-cutting QA** (every phase): spot-check Events, onboarding wizards, pricing, analytics depth marked `verify` in section 3.

---

## 8. Decisions (resolved 2026-10-15)

1. **Payout schedules: retire for brands and events.** Mobile offers no schedule picker to
   either role. Caveat: the backend still honours a stored `wallet.payout.schedule` for both
   event and store payouts (`wallet/storePayoutProcessor.ts:450`, `customPayouts.ts:338`), so
   web drops the selector but the processors stay as they are. Open: confirm event organizers
   get the same instant-withdrawal flow (`requestWithdrawal` is wallet-wide, so it should).
2. **Pro gates must be enforced server-side. Today only some are.**
   - Enforced: storefront templates, Pro-only sections and content overrides
     (`brands/storefront.ts`), payment-link/invoice limits (`invoices/storeOrderInvoices.ts`),
     AI quota (`integrations/assistant`, `ai`), collabs (`collabs/collab.rules.ts:isProBrandData`),
     custom domain on the order path.
   - **Not enforced (no tier check found):** `sendCustomerCampaign` (`customers/
     customer.campaigns.ts`), `sendWaitlistNotification` (`waitlist/notifications.ts`),
     newsletter functions, abandoned-cart recovery, discounts and coupons (plain client
     Firestore writes, so only rules could gate them), expenses.
     Fix in the backend before or alongside the web build, otherwise web (and a modified
     mobile client) bypasses the paywall. Firestore rules for `brands/{id}/discounts|coupons`
     need a Pro check. Mind the rules rule: never touch the catch-all; emulator-test list queries.
3. **Instagram import: drop it on web.** Remove `components/brand/instagram/*`, the
   `brand-space/piece/import/instagram/*` routes, `useInstagram`, `lib/firebase/functions/
   instagram.ts` and `callables/instagram.ts`; Pinterest replaces it (P-4).
   Remove from Section 5.
4. **Collabs: full build on web (CB-1).** Branch status: `feature/brand-collabs` is already an
   ancestor of `main` in all four repos (backend, studio web, shop, studio mobile) and on
   `origin/main`. Nothing left to merge. Only unpushed work: backend `main` is 1 commit ahead
   of origin (`57f9006`, base-fee date; not collabs). Studio mobile has uncommitted
   `Info.plist` and `pubspec.yaml`.
   Tracker Phase 6 gates still open independent of merging: collab E2E on live data, Firestore
   rules for `collabs/*/private|sales|buyers`, hiding collab products on the marketplace, Node 22
   upgrade before **Oct 30**, then turn `features.collabs` on for launch brands.
5. **Assistant, blog, brand progress on web: in scope.** All of Section 4 is in scope.
6. **Tutorials:** still open (keep web's tour system or move to `tutorialProgress`).

---

## Appendix A — callables mobile uses and web doesn't

Generated 2026-10-15. Names only referenced as quoted identifiers.

```
acceptRetentionOffer acknowledgeBrandProgressEvents addCollabMedia addCustomerAddress
adminReconcilePaystackProPayment arrangePickup askAssistant attachProductToCollab
autoLogOrderShippingExpense backfillAbandonedCarts backfillAllBrandsShippingExpenses
backfillCustomersFromOrders backfillStoreOrderNumbers batchUpdateStoreFulfillmentStatus
bookCustomerSelectedTerminalShipment cancelBrandProSubscription cancelCollabInvite
cancelFulfilmentHandoff cancelTerminalShipment cancelWithdrawalRequest
completeSenderVerification convertNewsletterSubscriber createAddress createCollab
createNewsletterSubscriber createPackaging createParcel createPickupAddress createShipment
createThemePurchase deleteCollab deleteUserAccountAndData detachProductFromCollab
devGrantChassisThemeEntitlement devGrantOrbitThemeEntitlement disconnectPinterest endCollab
extractExpenseFromReceipt findBrandForCollab generateCampaignEmailCopy
generateDiscountCampaignCopy generateMonthlyBrandReport generateProductCopy
generateStoreOrderInvoice generateStoreOrderReceipt getBrandProgress
getCancellationSaveContext getHandoffOrder getLMoments getPinterestBoards
getPinterestConnection getPinterestPins getRates getRetentionOffer
getSenderVerificationStatus getStorefrontThemeEntitlements getTerminalCities
getTerminalShipmentStatus getWithdrawalPreview importPinterestPins
initializeTerminalShippingPayment inviteToCollab listTerminalAfricaWebhooks
markLMomentsSeen notifyBrandOnboardingComplete prepareManualSalePaymentLink
rateAssistantMessage reconcileTerminalShippingPayment recordCancellationFlow
registerTerminalAfricaWebhook removeCollabMedia removeImageBackground reorderCollabMedia
requestFulfilmentHandoff requestWithdrawal resetTerminalAfricaWebhooks
respondMarketplaceInvitation respondToCollabInvite respondToFulfilmentHandoff
respondToProductSuggestion resumeBrandProSubscription retryProSubscriptionCharge
saveTerminalShipment searchBrandsForCollab setCollabPaused setStorefrontPasswordProtection
startPinterestAuth startSenderVerification summarizeBlogArticle testZeptoMail
trackBlogEvent updateClosedStorefrontSettings updateCollab updateCollabProduct
updateStorefrontSeo validateAddress withdrawProductSuggestion
```

Not brand-facing, skip: `adminReconcilePaystackProPayment`, `backfill*`, `testZeptoMail`,
`devGrant*`, `*TerminalAfricaWebhook*`, `listTerminalAfricaWebhooks`.

Web-only callables (do not remove): `acceptEventInvite addBrand addCollection addDropContent
addDropProduct addEventOrganizerByEmail addTimelineNote checkBrandUsernameUnique
checkUsernameUnique deleteFileFromCloudinary ensureEventOwnerIfEmpty finalizeOrder
getCloudinarySignature getEventInvite getStoreFulfillmentLines getStoreOrderTimeline
listCustomers listEventOrganizers migrateEventPerformance quoteShipping
removeEventOrganizer sendMailGeneric setFulfillmentStatus startOrganizerProSubscription
test* updateBookingStatus updateCollection updateDropContent updateEventOrganizerRoles
upsertFulfillmentLine verifyBookingQr`. Candidates for retirement because mobile no longer
uses them: `setFulfillmentStatus`, `upsertFulfillmentLine` (legacy, the unguarded path in B-1).
`quoteShipping` is used by web's in-Studio checkout components (`components/checkout/*`), not
by the dashboard; leave it.

## Appendix B — Firestore collections

Mobile uses, web has **no** reference: `tutorialProgress`, `lookbooks`, `comments`, `votes`,
`expenses`, `expenseCategories`, `coupons`, `handoffs`, `feedbackPosts`,
`publishing_articles`, `publishing_categories`.
Mobile uses, web touches in ≤2 files (check depth): `discounts`, `collabs`,
`custom_segments`, `storefront_daily`, `product_performance_daily`,
`section_performance_daily`, `analytics_daily`, `pickupAddresses`, `market_benchmarks`,
`brand_recovery_settings`, `suggestions`.
Subcollections used by mobile under `brands/{id}`: `discounts`, `coupons`, `expenses`,
`expenseCategories`, `customers`, `custom_segments`, `newsletter_subscribers`, `lookbooks`.
Web uses and mobile doesn't: `feature_requests` (dead, B-2), `newsletter_subscriptions`
(platform newsletter), `page_visits`, `brand_registrations`, `eventPayoutBatches`.

## Appendix C — model fields mobile has and web has nowhere

Keys present in a mobile model's `fromMap`/`toMap` that do not appear as an identifier
anywhere in `studio-labeld-app/src`:

| Model | Missing on web |
|---|---|
| brand | marketplaceStatus passwordProtectionEnabled subscriptionCancelAtPeriodEnd subscriptionCancelledAt subscriptionCancellationSource |
| product | discountWindow (and `weightGrams`, `isPublished` are in code but not in the product type/mapper) |
| order (StoreOrder) | orderNumber coupon couponCode couponId couponDiscountMinor couponSavingsMinor campaignDiscountId/Name/SavingsMinor discountMinor cashToCollectMinor collabHandoff costPriceMinor isPreOrder labeldShippingFeeMinor paymentLinkGeneratedAt paystackFeeMinor paystackCollectionFeeMinor shippingPaymentMode shippingPaymentStatus terminalShipmentId terminalShippingCostMinor terminalServiceChargeMinor terminalSettlementStatus terminalWalletFundingFeeMinor terminalWalletFundingStatus terminalFundingPaymentFeeMinor totalChargeMinor walletFundingReserveMinor |
| storefront_config | seo closedPage opensAt googleSiteVerification bingSiteVerification wordmarkUrl backgroundImageUrl lookbookId subheader premiumThemeEntitled templateAccess showOrbitLandingBrandMark |
| shipping | senderVerification |
| coupon | codeNormalized couponType currentUsageCount maxDiscountAmount maxTotalUsage minCartValue usagePerCustomer |
| discount | heroImageUrl maxDiscountAmount |
| expense | recurrenceInterval |
| newsletter | convertedAt convertedToCustomerId sourceDetail subscribedAt unsubscribedAt |
| radar | mediaItems imageWidth imageHeight imageAspectRatio brandCountry brandState; radar_media_item: durationSeconds |
| collab | 33 keys (workspace, hand-off, stats, media) |
| credit / ai_usage / bg_removal | balanceAfter, useAi, lastCheckedTier, purchasedCredits, freeAllowanceGranted, freeAllowanceUsed |
| feature_request | attachments authorAvatarUrl authorBrandId authorName authorUid closedReason deletedAt isAdmin parentCommentId replyToAuthorName statusUpdatedAt statusUpdatedBy upvoteCount |
| brand_progress | benchmark brandValue cohortKey cohortLabel competenceSignals hasSufficientHistory percentile periodKey rangeHigh rangeLow targetSource trendPct |
| blog_article / summary | categoryId coverImage excerpt helpfulYes readingTime studioAppPinned utm_* readMinutes |
| lookbook | hotspots |
| pinterest | alreadyImported boardId isVideo pinCount profileImage reconnectBy |
| recovery_settings | insufficientCreditsNotifiedAt |
| tutorial | completedTours dismissedTours extraTop/Bottom/Left/RightPadding |
| parsed_import_product | suggestedVibe |

Models with **no** missing keys (still need a behaviour check): user, wallet, event, event
organizer, event site, ticket type, merch, moment, booking, customer, customer group,
waitlist, scanner, domain, announcement, abandoned cart, review, tutorial base.
