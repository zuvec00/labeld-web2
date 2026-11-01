# Labeld Studio — Mobile → Web Gap Analysis

> **Audit type: static code audit + a read-only live pass of the WEB app.**
> The web app (studio.labeld.app) was exercised with a Pro brand test account
> through a headless browser, read-only (no saves, purchases, payouts or
> deletions). The **mobile app was not run** (no device/emulator access), so
> mobile behaviour is taken from code and is the reference "as written". Runtime
> items not covered by the live pass are marked `UNVERIFIED — needs manual pass`.
> Live findings are in §3A; where they contradict the static audit, the
> contradiction is called out and the register is corrected.

## 1. Test environment

| Item | Value |
|---|---|
| Audit date | 2026-10-13 |
| Mobile reference | `labeld_studio_mobile` @ `8fe9957` (main), `pubspec.yaml` = **1.30.1+14**. A commit message says "version 1.31.0" — see M-1. Installed build number **not captured** (no device). |
| Web target | `labeld-web2` — code read at `7fc6d6d` (`fix/google-button-position`, which is `main` + one Google-button commit; `main` is `8dbc015`), Next.js 16 / React 19. Deployed build behind studio.labeld.app **not captured**. |
| Accounts | One test account (a Pro brand + event account, "Deloca") was used on **web**. **No credentials are recorded in this document or any file.** No mobile account was exercised. |
| Live web pass | 2026-10-13, headless Chromium 131 (Playwright) at 1440×900, against the deployed studio.labeld.app. Deployed build id not exposed in the UI. Read-only. |
| Screenshots | `docs/screenshots/` holds the four non-sensitive captures referenced below. Other captures (wallet, orders, customers) contain balances, bank digits or customer PII and were deliberately **not** committed. |
| Prior art | `docs/STUDIO_WEB_BACKLOG.md` (audited 2026-09-06 @ `1f864ca`). Re-verified here; 14 web commits have landed since. |
| Web feature flags | `src/lib/featureFlags.ts`: events/orders/wallet/sales/brandspace/collabs are server-gated; prod/staging defaults are **off** (collabs explicitly off). What a given account sees on studio.labeld.app depends on deployed env vars — **not verifiable from code**. |

### Method
1. Mobile inventory from `app_router.dart` (109 routes), `lib/app/features/*`, and the (partly stale) `docs/labeld_studio_mobile_feature_documentation.md`.
2. **Callable diff**: every Firebase callable name referenced in mobile `lib/` (122) vs. any reference in web `src/` (64 wired). Script: scan for `httpsCallable('name')` / wrapper patterns, then a plain string search of web `src/`. **90 mobile callables have no reference anywhere in web.** Several are dev/admin tooling (excluded below).
3. Route/screen and keyword diff, then manual reading of the web files that matched to separate real UI from model-only or marketing copy.
4. Design layer diff: `lib/app/theme/colors.dart`, `typography.dart` vs `src/app/globals.css`.

Limits: callable detection is pattern-based and could miss exotic wrappers; each gap row cites the file where the mobile call lives so it can be double-checked.

---

## 2. Mobile feature inventory

| # | Area | Mobile routes / screens | Web status |
|---|---|---|---|
| 1 | Auth (email/password, forgot, terms) | `/login` `/sign-up` `/forgot-password` `/terms-of-use` | Present (`/login`, `/user/setup`) — runtime UNVERIFIED |
| 2 | Role + onboarding (brand 4 steps, event 5 steps, intros, checklist, guided tours) | `/role-selection` `/brand-setup/*` `/event-setup/*` | Present (`/onboarding`, `/brand/setup`, tutorial lib) — step parity UNVERIFIED |
| 3 | Home: store toggle, sales snapshot, chart, Labeld Intelligence, urgent actions, bell, What's New | `/dashboard`, `/home-intelligence` | Partial — dashboard present; Intelligence / What's New (L moments) absent (G-016) |
| 4 | Products + collections | `/add-product` `/product-details` `/add-collection` `/collection-details` | Present (`/pieces`, `/collections`, `brand-space/*`) |
| 5 | AI product copy, background removal | in add-product, brand identity | **Absent** (G-012) |
| 6 | Product import: Shopify/Bumpa CSV + history, AI import review | `/csv-import` `/csv-import-history` | **Absent** — web has Instagram import only (G-010) |
| 7 | Pinterest import | `/pinterest-connect` `/pinterest-import` | **Absent** (G-011). Instagram routes are commented out on mobile; present on web |
| 8 | Radar (multi-media) | `/add-radar` `/radar-details` | Present (`/radar`, `/radar/new`) — multi-media parity UNVERIFIED |
| 9 | Store orders, details, fulfillment lines/timeline, manual status | `/order-details` | Present (`/orders`, drawer) — partial (G-004, G-005) |
| 10 | Record manual sale | `record_sale_screen` | Present (`RecordSaleDrawer.tsx`) — field parity UNVERIFIED (G-018) |
| 11 | Invoice / receipt / payment link | order details | **Absent** (G-004) |
| 12 | Production summary | `/production-summary` | **Absent** (G-017) |
| 13 | Terminal Africa shipping (arrange, rates, pay, pickup, track, cancel, sender verification) | `arrange_shipping_screen`, `tracking_sheet`, `sender_verification_sheet` | Partial — settings/strategy/pickup addresses only (G-005) |
| 14 | Shipping settings / strategy | `/shipping-settings` | Present, Terminal Live editor added (bda20c6) |
| 15 | Events: list, details, 5-step create, tickets, merch, moments, event orders | `/create-event/*` `/event-orders/:id` | Present and **richer on web** |
| 16 | Ticket check-in | `/ticket-scanner/:eventId` | Present (`/scan`, `/staff/scan`, `/bookings/check-ins`) |
| 17 | Storefront customization: templates, sections, identity, typography | `/site-customization` `/customize-template/:id` `/edit-section/:id` `/typography` | Present — typography presets exist in `BrandIdentityView` |
| 18 | Premium theme purchase / entitlements | `theme_checkout_sheet` | **Absent / dead end** (G-006) |
| 19 | Password-protected & closed storefront, SEO integrations | `/seo-integrations`, customize screen | **Absent** (G-013) |
| 20 | Return / shipping policy settings | `/return-policy-settings` `/shipping-policy-settings` | **Absent** (manifest strings only) (G-014) |
| 21 | Domain settings | `/domain-settings` | Present (`/domains`) |
| 22 | Analytics: storefront, marketplace, studio overview, monthly report | `/storefront-analytics` `/marketplace-analytics` `/studio-overview` | Present except monthly report (G-015) |
| 23 | Wallet, transactions, payout settings | `/wallet` `/transaction-history` `/payout-settings` | Present; **withdrawal missing** (G-002) |
| 24 | Billing / pricing | `/billing-subscription` `/pricing` | Present, **read-only** (G-003) |
| 25 | Studio credits (AI, bg removal, messaging) | `/studio-credits` | **Absent** — web has waitlist credits only (G-012) |
| 26 | Expenses (recurring, categories, AI receipt) | `/expenses*` `/expense-categories/new` | **Absent** (G-008) |
| 27 | Customers + profile | `/customers` `/customer-details` | Present (`/customers`) — profile parity UNVERIFIED |
| 28 | Customer groups, CSV import + history | `/customer-groups` `/create-customer-group` `/customer-csv-import*` | **Groups absent** — query layer exists, no screen uses it (G-009, confirmed live: Customers has only All/New/Returning/Top/Lapsed tabs). **Customer CSV import is present** (live: "Import CSV" on Customers) — static audit was wrong; import *history* UNVERIFIED |
| 29 | Customer campaigns (AI draft) | `/send-customer-campaign` | Present (`/customers/campaign`) without AI draft (G-012) |
| 30 | Waitlist + notify | `/messaging` `/messaging/notify-waitlist` | Present (`/audience/waitlist`, `/notify`) |
| 31 | Newsletter + popup + send + CSV | `/newsletter*` | **Absent** (G-009b) |
| 32 | Abandoned carts + recovery settings | `/abandoned-carts*` | Present |
| 33 | Discounts, coupons, analytics, AI copy | `/discounts` `/add-discount` `/add-coupon` `/discount-analytics` | **Absent** (G-007) |
| 34 | Collabs (Pro) | `/collabs*` | **Absent — intentional deferral** (D-1) |
| 35 | Lebi assistant / L moments | `assistant/*` | **Absent** (G-012, G-016) |
| 36 | Brand progress dashboard | `/brand-progress` | **Absent** (G-016) |
| 37 | Marketplace invitation | `/marketplace-invitation` | **Absent** (G-016) |
| 38 | Feedback board / suggest improvement | `/suggest-improvement` | Unclear — keyword hits only; UNVERIFIED |
| 39 | Account security / delete account | `/account-security` | Present; delete path differs (G-019) |
| 40 | Push (OneSignal), RevenueCat paywall, native share, camera crop | n/a | Intentional platform differences (§6) |

---

## 3. Gap register

Categories: Missing · Partial · Behavioral · UI · State.
Severity per brief. "Backend" = whether web work appears to need backend review.

| ID | Feature / flow | Cat. | Sev. | Mobile behaviour | Web behaviour | Evidence (code) | Backend |
|---|---|---|---|---|---|---|---|
| G-001 | Product/media upload provider | Behavioral | **P0** (pending verification) | Uploads via ImageKit with Firebase fallback; Cloudinary retired | Code now routes via ImageKit (6ff7bc1) but production verification not done; remaining web upload paths unaudited | M: `data/services/media_upload_service.dart`; W: `src/lib/storage/imagekit.ts`, `cloudinary.ts`, backlog P0-1 | Needs prod check (account/credentials) |
| G-002 | Wallet withdrawal | Missing | **P1** | `requestWithdrawal`, `getWithdrawalPreview`, `cancelWithdrawalRequest` | Withdraw button is commented out ("Coming soon"); brands see balance they cannot move | M: `data/services/wallet_service.dart:238`; W: `components/wallet/BalanceHeader.tsx:32-38` | Callables exist; confirm payout-hold rules |
| G-003 | Billing: cancel / retry Pro | Partial | **P1** | `cancelBrandProSubscription`, `retryProSubscriptionCharge` | Status display only | M: `data/services/subscription_checkout_service.dart`; W: `components/settings/BillingSettings.tsx` | No |
| G-004 | Order documents: invoice, receipt, payment link | Missing | **P1** | `generateStoreOrderInvoice`, `generateStoreOrderReceipt`, `prepareManualSalePaymentLink`, share PDF/link | Not available; record-sale exists but can't produce a payment link/invoice | M: `orders/screens/order_details_screen.dart`, `orders/widgets/invoice_sheets.dart`; W: `orders/page.tsx`, `RecordSaleDrawer.tsx` | No (callables exist) |
| G-005 | Shipping & fulfillment console (Terminal Africa) | Partial | **P1** | Address→packaging→parcel→shipment→rates→pay→pickup→save; tracking; cancel; batch status; NIN sender verification; COD vs prepaid | Only settings, strategy, pickup address CRUD (Phase 1). No arrange, tracking, cancel, batch status, sender verification | M: `orders/screens/arrange_shipping_screen.dart`, `widgets/tracking_sheet.dart`, `widgets/sender_verification_sheet.dart`; W: `components/settings/ShippingSettings.tsx`, `PickupAddressManager.tsx` | Payment redirect/return + `reconcileTerminalShippingPayment` need review |
| G-006 | Premium theme gating & purchase | Behavioral | **P1** | Filters by `status`/entitlement; locked + priced cards; `createThemePurchase` | Premium themes render as unlocked; activation fails with `PREMIUM_THEME_REQUIRED` | M: `more/screens/site_customization_screen.dart`; W: `app/.../site-customization/page.tsx`, `TemplateCard.tsx`, manifest `isProOnly:false` | Entitlement callables exist |
| G-007 | Discounts & coupons | Missing | **P1** | Storewide/product/collection discounts, coupons, details, analytics, AI campaign copy, share link | No route; "discount" only a per-product field; zero coupon references | M: `more/screens/discounts_screen.dart`, `add_discount_screen.dart`, `add_coupon_screen.dart`, `discount_analytics_screen.dart`; W: `lib/models/product.ts` only | Check storefront/checkout enforcement of coupon codes |
| G-008 | Expenses | Missing | **P1** | Log/edit/delete, recurring, categories, receipt AI extract, system expenses, period totals | Absent | M: `more/screens/expenses_screen.dart`, `add_expense_screen.dart`; W: none | No |
| G-009 | Customer groups (CSV import: see note) | Partial | **P2** | Groups list/create/target; CSV import + history | `customers.ts` has `subscribeCustomerGroups`/`createCustomerGroup`; no UI uses them. **Customer CSV import exists on web** ("Import CSV" on Customers, live-confirmed) — only import *history* remains UNVERIFIED | M: `more/screens/customer_groups_screen.dart`; W: `lib/firebase/queries/customers.ts`; live: `/customers` | No |
| G-009b | Newsletter (subscribers, popup settings, send) | Missing | **P2** | Subscriber list, popup + email gate, send campaign, CSV | Footer signup only; query/model exist, no dashboard UI | M: `more/screens/newsletter_screen.dart`, `send_newsletter_campaign_screen.dart`; W: `lib/firebase/queries/newsletter.ts` | Dormant branch `feat/newsletter` |
| G-010 | Product CSV import + AI import review | Missing | **P2** | Shopify/Bumpa parsers, preview, history | Instagram import only | M: `products/screens/csv_import_screen.dart`, `ai_import_review_screen.dart`; W: `pieces/import/instagram` | No |
| G-011 | Pinterest import | Missing | **P2** | Connect + pins import (`startPinterestAuth`, `getPinterestPins`, `importPinterestPins`) | Only a social-handle field in onboarding | M: `products/screens/pinterest_*`; W: `onboarding/steps/BrandVisualsStep.tsx` | OAuth redirect flow needs review |
| G-012 | AI: product copy, campaign copy, discount copy, background removal, Lebi assistant, studio credits | Missing | **P2** | `generateProductCopy`, `generateCampaignEmailCopy`, `removeImageBackground`, `askAssistant`, `/studio-credits` | Zero references; waitlist credits dialog only | M: `data/services/ai_product_service.dart`, `features/assistant/*`, `more/screens/studio_credits_screen.dart` | Credit metering/entitlement review |
| G-013 | Storefront access & SEO settings | Missing | **P2** | Password protection, closed-store settings, SEO integrations | No UI or calls for the three callables | M: `data/services/site_customization_service.dart` (`setStorefrontPasswordProtection`, `updateClosedStorefrontSettings`, `updateStorefrontSeo`) | No |
| G-014 | Return & shipping policy editors | Missing | **P2** | Toggle + text editors rendered on storefront | Strings in template manifest only | M: `more/screens/return_policy_settings_screen.dart`, `shipping_policy_settings_screen.dart` | Confirm stored fields |
| G-015 | Monthly brand report | Missing | **P2** | `generateMonthlyBrandReport` PDF/email on demand | Web has `/reports` (admin-style) — brand-facing monthly report absent | M: `data/services/storefront_analytics_service.dart`; W: `reports/` | Verify `/reports` scope |
| G-016 | Brand progress, What's New / L moments, marketplace invitation, Labeld Intelligence | Missing | **P2** | `getBrandProgress`, `getLMoments`, `respondMarketplaceInvitation`, intelligence cards | Absent | M: `progress/*`, `home/widgets/labeld_intelligence.dart`, `more/screens/marketplace_invitation_screen.dart` | No |
| G-017 | Production summary | Missing | **P2** | Aggregated production quantities from orders | Absent | M: `orders/screens/production_summary_screen.dart` | No |
| G-018 | Record sale parity | Behavioral | **P2** (UNVERIFIED) | Channel, payment method, notes, variant stock via FieldPath, customer picker, payment link | Drawer exists with channel/payment/variant; link/pending states and stock update not compared | M: `orders/screens/record_sale_screen.dart`; W: `components/orders/RecordSaleDrawer.tsx` | No |
| G-019 | Account deletion path | Behavioral | **P1** (compliance) | `deleteUserAccountAndData` | Uses `deleteAuthenticatedUser` | M: `firebase_auth_service.dart`; W: `settings/AccountSecurity.tsx` | **Needs backend review** — which one purges brand data |
| G-020 | Empty / loading / error states | State | **P2** (UNVERIFIED) | Skeleton/shimmer + empty-state components on most lists | Not assessed | M: shimmer widgets (`workspace_shimmer`, `abandoned_carts_empty_state`) | n/a |
| G-021 | Copy / terminology | UI | **P3** (UNVERIFIED) | e.g. "collab" not "drop"; "L"/Lebi naming | Not compared | — | n/a |

## 3A. Live web pass results (2026-10-13, read-only)

Routes walked while authenticated: dashboard, brand-space, radar, products,
collections, site customization, waitlist, abandoned carts, customers, orders
(+ one order drawer), wallet, analytics ×3, settings, billing, domains, reports,
events. All loaded; no crashes.

| Ref | Finding | Links to | Evidence |
|---|---|---|---|
| L-1 | **Wallet shows an eligible balance labelled "Ready to withdraw" / "Available for withdrawal" with no way to withdraw.** Home also shows "Payout Eligible … Ready to withdraw". Store earnings are "Manual payout", so the user is directed to an action that does not exist on web. | G-002 (confirmed) — recommend raising copy fix to quick win | live `/wallet`, `/dashboard` (not committed: contains balances) |
| L-2 | **Billing shows "Labeld Pro — Expired" (renewal date in the past) with only a "Manage Subscription" button; "Payment History — Coming soon".** No cancel, retry or renew action. | G-003 (confirmed) | `docs/screenshots/web-billing.png` |
| L-3 | **The header shows a "PRO" badge while billing shows the subscription as Expired.** Either the badge reads a different entitlement source than Billing, or an expired plan keeps Pro access (grace/lifetime). | new **G-023** (behavioral, P2, needs backend review) | `web-billing.png` vs header on any page |
| L-4 | **Premium themes CHASSIS and ORBIT render with a "PREMIUM" tag and an enabled "Activate" button — no price, lock or purchase path** (mobile shows locked/priced cards and a checkout sheet). Site customization says "5 Layouts Available". | G-006 (confirmed) | `docs/screenshots/web-site-customization-themes.png` |
| L-5 | **Unknown routes (`/discounts`, `/expenses`, `/newsletter`, `/collabs`) return HTTP 503 with a bare "Offline – Please check your connection" page**, not a branded 404. Misleading for a user who typed or was linked to a missing page. | new **G-022** (state/UI, P3) | `docs/screenshots/web-unknown-route-offline.png` |
| L-6 | **False empty state on Home while data loads:** "Recent Products — No pieces yet · Add your first piece →" is shown first and corrects to the real product after ~10 s. Mobile uses shimmer/skeleton placeholders instead. | new **G-024** (state, P2) | observed live on `/dashboard`; screenshot not committed |
| L-7 | **First-run "Choose your look" theme dialog blocks every page and is not dismissed by Escape** (only its close button/choice). | new **G-025** (UI/a11y, P3) | observed on every route |
| L-8 | Order drawer shows payment/fulfilment status, customer info, address, notes, items; only actions are **Refresh Data / Close** (plus a mark-fulfilment control further down). **No invoice, receipt, payment link, arrange-shipping or tracking action.** | G-004, G-005 (confirmed) | live `/orders` (not committed: customer PII) |
| L-9 | Orders page counters read "Awaiting fulfilment 42 · Unpaid 0 · Completed 0 · Total 42" while Home (default period) shows "Delivered (1)". Likely a period/definition difference; **cannot tell if "Completed" excludes delivered orders**. | Open question Q9 | live `/orders`, `/dashboard` |
| L-10 | Customers list contains repeated name/email entries with 0 orders (e.g. the same person listed more than once). Could be test data or import duplicates; mobile de-dupe behaviour not checked. | Open question Q10 | live `/customers` (not committed: PII) |
| L-11 | Settings has a disabled "Profile Settings — Coming Soon" card although a profile editor route exists (`brand-space/profile/edit`). Mobile exposes Edit Brand/Organizer Profile directly. | new **G-026** (UI, P3) | `docs/screenshots/web-settings.png` |
| L-12 | **Record Sale options on web:** channels In-store, Pop-up/Event, Instagram, WhatsApp, Snapchat, TikTok, Other; status Paid/Unpaid; method Cash/Transfer/POS; optional customer details. Mobile's list was not compared. | G-018 (still UNVERIFIED; web side now recorded) | live `/orders` → Record Sale |

**Navigation confirmed live** — sidebar contains: Dashboard · Brand Space ·
Radar · Products · Collections · Site Customization · Waitlist · Abandoned
Carts · Customers · Orders · Wallet · Analytics (Overview, Storefront,
Marketplace) · Settings · Domains. There is **no entry** for Discounts, Coupons,
Expenses, Newsletter, Customer Groups, Collabs, AI/Credits or Production
Summary, matching G-007/G-008/G-009/G-009b/G-012/G-017 and D-1.

### Register additions from the live pass
| ID | Feature / flow | Cat. | Sev. | Mobile | Web | Backend |
|---|---|---|---|---|---|---|
| G-022 | Missing-route handling | State/UI | P3 | Router error → in-app not-found | 503 "Offline" text page | No |
| G-023 | Pro entitlement consistency (badge vs billing status) | Behavioral | P2 | Single RevenueCat/backend entitlement drives badge and gating | Badge says PRO while billing says Expired | **Needs backend review** |
| G-024 | Loading state on Home product/radar cards | State | P2 | Shimmer/skeleton | False "No pieces yet" empty state. **Root cause:** `useBrandSpace` set `loadingProgress.catalog/content` true only *after* each fetch resolved, so the page passed `loading=false` while data was still the empty initial object. **Fixed on branch `feat/web-ui-state-kit` (uncommitted); verified live — false empty shown for ~6 s before, 0 samples after.** | No |
| G-025 | First-run theme dialog | UI/a11y | P3 | n/a (follows system theme) | Blocking modal, Escape ignored | No |
| G-026 | Profile settings entry | UI | P3 | Direct edit-profile entry | "Coming Soon" card though editor exists | No |

### Design layer (no gap found in tokens)
| Token | Mobile | Web | Result |
|---|---|---|---|
| Background / surface / text / muted | `#FAFAFA` `#FFF` `#0B0B0B` `#6E6E6E` | same | Match |
| CTA / alert / accent / edit / stroke | `#FF5E2E` `#E53935` `#5FBF00` `#FFC107` `#E6E6E6` | same | Match |
| Dark bg / surface / text / accent | `#0B0B0B` `#1C1C1C` `#FAF7F1` `#C4FF30` | same | Match |
| Display / body fonts | Unbounded / Manrope | `--font-unbounded` / `--font-manrope` | Match |
| Icons | `lucide_icons_flutter` | `lucide-react` | Match (family) |

Component-level spacing, radii, button styles and layout were **not** compared (needs visual pass).

---

## 4. Known deferrals / intentional differences (not counted as gaps)

| ID | Item | Basis |
|---|---|---|
| D-1 | **Collabs** (list, create/invite, workspace, handoff, analytics) | Backlog P2-0; web shows "edit this collab product in the app"; flag `collabs` off in staging/prod. 17 collab callables unused on web. |
| D-2 | RevenueCat paywall / customer center | Mobile IAP; web uses Paystack subscription. |
| D-3 | OneSignal push, native share sheet, image cropper, video compress | Platform capabilities. |
| D-4 | Camera ticket scanner UX | Web has its own `/scan` / `/staff/scan`. |
| D-5 | Dev/admin callables (`backfill*`, `testZeptoMail`, `adminReconcilePaystackProPayment`, Terminal webhook register/list/reset) | Dev tooling behind mobile Developer Options. |

### Web is ahead (do not regress)
Events create/merch/moments/review/tickets, `events-analytics`, `bookings` (+availability, check-ins), `organizer-space`, `reports`, `admin/*`, Instagram import, event site customization.

---

## 5. Suspected mobile bugs (not changed)

| ID | Observation | Evidence |
|---|---|---|
| M-1 | Version mismatch: commit `d6dee82` says "version 1.31.0" but `pubspec.yaml` is `1.30.1+14` | `pubspec.yaml:19`, git log |
| M-2 | `/developer-options` route is not guarded; only the More menu entry is `kDebugMode`-gated. Screen exposes admin/backfill callables. | `app_router.dart:691`, `more/screens/more.dart:~514` |
| M-3 | `/instagram-connect` and `/instagram-import` routes are commented out while the screens and web support remain | `app_router.dart:696-701` |
| M-4 | Repo hygiene: `.env`, `bearer_secret_generation.py`, `tmp_fix.py`, `tmp_unfocus.py` are tracked; `README.md` contains pasted chat text | `git ls-files` |
| M-5 | Feature documentation is stale (omits collabs, assistant, Pinterest, credits, SEO, progress, production summary) | `docs/labeld_studio_mobile_feature_documentation.md` |

---

## 6. Open questions

1. **Instagram vs Pinterest on mobile (M-3):** is Instagram import intentionally retired on mobile? If so, should web keep it, or should web gain Pinterest (G-011) and drop Instagram?
2. **Premium themes on web:** `isProOnly:false` on CHASSIS/ORBIT — intended "unlocked but fails on activation" or a data error? Which entitlement model should web mirror?
3. **Account deletion (G-019):** which callable is canonical, and should web switch to `deleteUserAccountAndData`?
4. **Web wallet withdrawal:** was the button hidden deliberately (payout holds, KYC) or just unfinished?
5. **`/reports` on web:** brand-facing or admin-only? Does it cover the monthly brand report (G-015)?
6. **Collabs timeline:** keep deferred (D-1) or promote to P1 once Pro growth work starts?
7. **Deployed flag state:** which of events/orders/wallet/sales are actually enabled on studio.labeld.app for brand accounts? This changes what the live pass will show.
9. **Orders "Completed" counter (L-9):** does it exclude delivered orders, or is the Home "Delivered (1)" from a different period? Which definition should web follow (mobile's)?
10. **Duplicate customers (L-10):** are repeated customer rows expected (import/test data), or should web de-dupe like mobile?
8. **Severity scale for whole-feature absences:** treated as P1 where money/ops are involved and P2 for growth/marketing; confirm.

---

## 7. What still needs a live pass (cannot be done statically)

Per area, run the mobile flow and the web flow with the test account (walk money flows only to the confirmation step): onboarding steps/validation; product add/edit incl. variants, media, background save; orders list/filters/details/fulfillment; record sale; wallet and payout settings; site customization save/preview; waitlist/notify; abandoned carts; empty/loading/error states and copy on every screen above. Record app build numbers at that time.
