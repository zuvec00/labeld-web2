# Studio Web — Parity Implementation Plan

Companion to `GAP_ANALYSIS.md` (gap IDs refer to that register). Source of truth
is the mobile app (`labeld_studio_mobile` @ `8fe9957`). Sizes: **S** ≤ 1 day,
**M** 2–5 days, **L** > 1 week.

> Plan status: draft from a **static audit**. Acceptance criteria describe the
> mobile behaviour as read from code; confirm each against a live mobile run
> before building. Nothing here changes the backend; anything that may need it is
> marked **needs backend review**.

## Conventions to follow (existing web patterns)

- **Callables**: one file per domain in `src/lib/firebase/callables/*.ts`
  (`getFunctions(getApp())` + `httpsCallable`). Add new callable wrappers there,
  typed, not inline in components.
- **Firestore reads**: `src/lib/firebase/queries/*.ts` with `subscribe*` for live lists.
- **Gating**: add a key to `src/lib/featureFlags.ts` and wrap nav in
  `components/GatedNavItem.tsx` / pages in `FeatureGate`. New flags default off in
  staging/prod until verified.
- **Pages** live under `src/app/(protected)/(dashboard)/…`; settings sections go in
  `src/components/settings/*` and are mounted from `settings/page.tsx`.
- **Styling**: Tailwind with existing tokens (`--color-*`, `font-heading`); tokens
  already match mobile, so reuse them — do not introduce new colours.
- **Uploads**: only `src/lib/storage/imagekit.ts` or the safe
  `uploadImageCloudinary` wrapper; never the legacy direct-Cloudinary path.
- **Money flows** (withdrawal, shipping payment, theme purchase) must use
  idempotency (`src/lib/idempotency.ts`) and survive full-page redirects.

---

## Phase 0 — Verify & unblock (do first, ~1 week of calendar time)

| Task | Closes | What to do | Files | Dep. | Size |
|---|---|---|---|---|---|
| T-0.1 Confirm upload fix in production | G-001 | Verify Cloudinary account state; upload a product image, a moment, and a section image on web against real ImageKit creds. Audit `uploadProfileImage`-style paths for provider drift. | `src/lib/storage/{imagekit,cloudinary,upload}.ts` | prod creds | S |
| T-0.2 Resolve account-deletion path | G-019 | **needs backend review** — decide canonical callable; if `deleteUserAccountAndData`, swap and add a confirm dialog matching mobile. | `src/components/settings/AccountSecurity.tsx`, `src/lib/firebase/callables/users.ts` | backend answer | S |
| T-0.3 Live parity pass of present features | G-018, G-020, G-021 | Run the §7 checklist of the gap analysis; file new gap rows with screenshots. | — | test accounts | M |
| T-0.4 Decide open questions | — | Answer GAP_ANALYSIS §6 (Instagram/Pinterest, themes, withdrawal hold, `/reports`) plus Q9/Q10 below. | — | product owner | S |
| T-0.5 Copy fix: stop promising a withdrawal that doesn't exist | G-002 (interim) | Until T-1.3 ships, change "Ready to withdraw" / "Available for withdrawal" on Wallet and Home to neutral wording and link to the mobile app for payouts. | `components/wallet/BalanceHeader.tsx`, `EarningsOverview.tsx`, `WalletMini.tsx`, `components/dashboard/MoneySnapshot.tsx` | none | S |
| T-0.6 Not-found page | G-022 | Replace the bare 503 "Offline" response for unknown routes with a branded 404; keep the offline fallback only when actually offline. | `src/app/not-found.tsx` (new), service-worker/offline config | check PWA/service-worker setup | S |
| T-0.7 Home loading states — **DONE (branch `feat/web-ui-state-kit`, uncommitted)** | G-024 | Fixed the loading-flag semantics in `useBrandSpace` (flags true while fetching; stale runs ignored; `refresh()` now really refetches). Added the shared state kit and used it in `MomentumSection`. | `src/hooks/useBrandSpace.ts`, `src/components/ui/{EmptyState,ErrorState,DataState,skeleton}.tsx`, `components/dashboard/MomentumSection.tsx`, `dashboard/page.tsx` | none | S |
| T-0.7b Adopt the state kit elsewhere | G-020 | Replace hand-rolled spinners / "No x yet" blocks with `DataState` + `EmptyState` + `ErrorState` on Orders, Customers, Products, Collections, Waitlist, Abandoned Carts, Wallet, Analytics. Pass a real `error` and `onRetry` so failures stop looking like empty data. | each page's data component | T-0.7 | M |
| T-0.8 Entitlement consistency | G-023 | **needs backend review** — decide the single source of truth for Pro (badge, Billing, gated nav). Align header badge and Billing, and show an "Expired — renew" state. | `components/settings/BillingSettings.tsx`, header/user menu, `src/lib/plans/*` | backend answer | M |
| T-0.9 Small UI polish | G-025, G-026 | Close "Choose your look" on Escape/backdrop and remember dismissal; enable the Profile Settings card to link to `brand-space/profile/edit`. | theme prompt component, `app/(protected)/(dashboard)/settings/page.tsx` | none | S |

---

## Phase 1 — Quick wins (S/M, mostly existing callables)

### T-1.1 Billing: cancel & retry Pro — G-003 · **S**
- **Build**: add *Cancel subscription* and *Retry charge* actions with confirmation dialogs; show failed-charge state.
- **Files**: modify `src/components/settings/BillingSettings.tsx`; extend `src/lib/firebase/callables/subscriptions.ts` with `cancelBrandProSubscription`, `retryProSubscriptionCharge`.
- **Dependencies**: none.
- **Acceptance** (mobile: `billing_subscription_screen.dart`, `subscription_checkout_service.dart`): cancel asks for confirmation, then shows the end-of-period state; retry is offered only when the last charge failed and refreshes status on success; errors surface a toast and leave state unchanged.
- **Manual test**: with a Pro test brand, open Settings → Billing, retry on a failed-charge account, cancel on an active one (stop at the confirmation dialog for any live charge); compare resulting status chip with mobile.

### T-1.2 Premium theme gating (no purchase yet) — G-006 (part 1) · **S**
- **Build**: extend web `Template` model with `access`, `status`, `regularPriceMinor`, `proPriceMinor`; filter gallery on `status === 'live'` or entitlement; render locked/priced cards instead of activate buttons.
- **Files**: `src/lib/models/site-customization.ts`, `src/lib/constants/storefront-template-manifest.ts` (stop `as unknown as` cast in `templates.ts`), `src/app/(protected)/(dashboard)/brand-space/site-customization/page.tsx`, `components/brand/site-customization/TemplateCard.tsx`.
- **Dependencies**: Q2 answered.
- **Acceptance** (mobile: `site_customization_screen.dart:~108`): draft themes hidden; premium themes without entitlement show lock + price and cannot be activated; included themes activate normally.
- **Manual test**: non-entitled account → CHASSIS/ORBIT show locked; entitled account → activatable; compare gallery order with mobile.

### T-1.3 Unhide wallet withdrawal — G-002 · **M**
- **Build**: preview → confirm → request flow; pending withdrawals list with cancel.
- **Files**: `src/components/wallet/BalanceHeader.tsx` (replace commented block), new `WithdrawDialog.tsx`, extend `src/lib/firebase/callables/payout.ts` (`getWithdrawalPreview`, `requestWithdrawal`, `cancelWithdrawalRequest`), `PayoutsTable.tsx` for cancel.
- **Dependencies**: Q4 (why hidden); linked bank account (`BankAccountBanner`).
- **Acceptance** (mobile: `wallet_service.dart:238`, `payout_settings_screen.dart`): button disabled without linked bank or zero balance; preview shows amount/fees/net before confirm; success and failure states match mobile; pending request cancellable until processed.
- **Manual test**: walk to the **confirmation step only** with the test account; do not submit.

### T-1.4 Customer groups UI — G-009 (part) · **M**
- **Build**: groups list/create/edit and "send campaign to group" using the existing `subscribeCustomerGroups` / `createCustomerGroup`.
- **Files**: new `src/app/(protected)/(dashboard)/customers/groups/page.tsx`, new `components/brand/customers/Group*.tsx`; extend `customers/campaign` page to accept `?group=`.
- **Acceptance** (mobile: `customer_groups_screen.dart`, `create_customer_group_screen.dart`): same selection UX and counts; saved group is selectable as campaign audience.
- **Manual test**: create group on web, confirm it appears on mobile and vice versa.

### T-1.5 Policies & storefront access settings — G-013, G-014 · **M**
- **Build**: return policy and shipping policy editors; password protection and closed-store settings; SEO integrations form.
- **Files**: new sections in `components/brand/site-customization/` (or `components/settings/`), callables in `src/lib/firebase/callables/siteCustomization.ts` (`setStorefrontPasswordProtection`, `updateClosedStorefrontSettings`, `updateStorefrontSeo`).
- **Acceptance** (mobile: `site_customization_service.dart`, policy screens): password is write-only (never read back); enabling/disabling reflects on the storefront; policy text renders in the storefront modal/link.
- **Manual test**: set a password, open the storefront in a private window and verify gate; remove it and verify access.

### T-1.6 Production summary — G-017 · **S**
- **Build**: aggregated quantity-by-product/variant view for filtered orders.
- **Files**: new `components/orders/ProductionSummary.tsx`, entry from `orders/page.tsx`; pure client aggregation over `storeOrders.ts`.
- **Acceptance** (mobile: `production_summary_screen.dart`): totals match mobile for the same order set and filters.

---

## Phase 2 — Core commerce builds (M/L)

### T-2.1 Order documents — G-004 · **M**
- **Build**: invoice options sheet (due terms, notes, bank details toggle, payment link), generate/share PDF + link; receipt; manual-sale payment link.
- **Files**: `components/orders/StoreOrderDetailDrawer.tsx`, new `InvoiceDialog.tsx`; callables `generateStoreOrderInvoice`, `generateStoreOrderReceipt`, `prepareManualSalePaymentLink` in a new `src/lib/firebase/callables/orders.ts`; download helper `src/lib/download.ts`.
- **Acceptance** (mobile: `orders/widgets/invoice_sheets.dart`): invoice only offered for eligible unpaid/offline orders; options map 1:1; generated link/PDF identical content to mobile.
- **Manual test**: generate an invoice for a test unpaid order and compare PDF fields to mobile; do not collect payment.

### T-2.2 Discounts & coupons — G-007 · **L**
- **Build**: list, create/edit (storewide/product/collection, % / fixed, dates), coupons, details, analytics (client-side from `storeOrders`), share link, "send campaign" prefill.
- **Files**: new routes `(dashboard)/discounts/{page,new,[id]}`, `coupons/{new,[id]}`, `discounts/[id]/analytics`; new `src/lib/firebase/queries/{discounts,coupons}.ts` against `brands/{id}/discounts|coupons`; models in `src/lib/models`; nav in dashboard sidebar behind a new `discounts` flag.
- **Dependencies**: **needs backend review** that checkout/shop applies coupon codes identically regardless of creating client; analytics formulas from `discount_analytics_screen.dart`.
- **Acceptance**: every field validation and scope behaviour equals mobile; analytics KPIs equal mobile for the same dataset.
- **Manual test**: create a discount on web, view it on mobile, place a test order on the storefront and compare analytics on both.

### T-2.3 Expenses — G-008 · **L**
- **Build**: list with period/category filters and totals, add/edit/delete, categories, recurring (incl. projection and "stop"), receipt upload + AI extraction (after T-3.1), system expense display.
- **Files**: new `(dashboard)/expenses/*`, `queries/expenses.ts` (`brands/{id}/expenses`, `expenseCategories`), models; sidebar item behind `expenses` flag.
- **Acceptance** (mobile: `expenses_screen.dart`, `add_expense_screen.dart`; amounts are **major units**): required fields name/category/amount/date; recurring intervals weekly…annual; system rows read-only.
- **Manual test**: add, edit, stop-recurring, delete; confirm sync with mobile.

### T-2.4 Shipping console — G-005 · **L (phased)**
Follow backlog P2-1 phasing; Phase 1 is done.
- **2.4a** Arrange-shipping through rate selection (`createPickupAddress → createAddress → createPackaging → createParcel → createShipment → getRates`; `validateAddress`, `getTerminalCities`). No money moves — **safe to test end-to-end**.
- **2.4b** Payment + pickup + save (`initializeTerminalShippingPayment` → Paystack redirect → `arrangePickup` → `saveTerminalShipment`). **needs backend review** for redirect/return and `reconcileTerminalShippingPayment`; persist pipeline state across navigation (session storage + server record).
- **2.4c** Sender verification (NIN: `startSenderVerification`, `getSenderVerificationStatus`, `completeSenderVerification`).
- **2.4d** Orders integration: tracking (`getTerminalShipmentStatus`), cancel (`cancelTerminalShipment`), manual fulfillment hidden for Terminal-managed orders, `batchUpdateStoreFulfillmentStatus`, logistics payment section.
- **Files**: new `components/orders/shipping/*`, `src/lib/firebase/callables/shipping.ts`, `StoreOrderDetailDrawer.tsx`, `StoreOrdersTable.tsx`.
- **Acceptance** (mobile: `arrange_shipping_screen.dart`, `tracking_sheet.dart`, `logistics_payment_section.dart`): same step order and error handling; COD vs prepaid labels; Terminal-managed orders hide manual delivered controls.
- **Manual test**: 2.4a fully; 2.4b stop at payment redirect; 2.4d use a sandbox shipment.

### T-2.5 Premium theme purchase — G-006 (part 2) · **M**
- **Build**: checkout sheet, `getStorefrontThemeEntitlements`, `createThemePurchase` with redirect return and entitlement refresh.
- **Files**: new `components/brand/site-customization/ThemeCheckoutDialog.tsx`, callables in `siteCustomization.ts`. Do **not** port `devGrant*` callables.
- **Dependencies**: T-1.2; **needs backend review** for callback URL on web.
- **Manual test**: reach the pay step only.

---

## Phase 3 — Growth & AI (L, lower urgency)

| Task | Closes | What to build | Key files | Dep. | Size |
|---|---|---|---|---|---|
| T-3.1 AI & credits | G-012 | Product copy, campaign/discount copy, background removal, studio credits screen + top-up, Lebi assistant panel | new `components/ai/*`, `src/lib/firebase/callables/ai.ts`, `(dashboard)/settings` credits section | **needs backend review** (credit metering) | L |
| T-3.2 Newsletter | G-009b | Subscribers, popup + email-gate settings, send campaign, CSV | new `(dashboard)/audience/newsletter/*`, existing `queries/newsletter.ts`; salvage `feat/newsletter` | T-3.1 for AI draft | L |
| T-3.3 Imports | G-010, G-011 | Shopify/Bumpa product CSV + history + AI review; Pinterest connect/import. (Customer CSV import already exists on web — only verify its history view against mobile.) | extend `callables/csvImport.ts`, `queries/importHistory.ts`; new `pieces/import/{csv,pinterest}` | Q1; **needs backend review** (Pinterest OAuth redirect) | L |
| T-3.4 Reporting & progress | G-015, G-016 | Monthly report generator, brand progress, What's New / L moments, marketplace invitation, intelligence cards | new `components/dashboard/*`, callables `getBrandProgress`, `getLMoments`, `markLMomentsSeen`, `respondMarketplaceInvitation` | Q5 | M |

---

## Phase 4 — Collabs (deferred, D-1)

Only after product sign-off: list, create/invite (Pro), workspace tabs
(overview, products + suggestions, sales, shipping hand-offs, activity), media
reorder, analytics, share link, deep-link tabs. 17 callables
(`createCollab`, `inviteToCollab`, `respondToCollabInvite`, …) are unused on
web. Keep behind the existing `collabs` flag. Replace the "edit in the app"
notice in `brand-space/piece/[id]/edit/page.tsx` only once workspace editing
exists. Size **L+**.

---

## Final verification pass checklist

Run with the test account on both platforms, recording build numbers:

- [ ] G-001 upload product / moment / section images on web; all succeed via ImageKit
- [ ] G-002 withdrawal preview + confirm step matches mobile (stop before submit)
- [ ] G-003 cancel/retry subscription flows match mobile states
- [ ] G-004 invoice/receipt/payment-link content equals mobile output
- [ ] G-005 arrange shipping through rates; payment redirect/return; tracking; cancel
- [ ] G-006 theme gallery filtering, locks, purchase confirmation step
- [ ] G-007 discount/coupon CRUD + analytics equal mobile on same orders
- [ ] G-008 expenses CRUD, recurring, categories, totals
- [ ] G-009/9b groups, customer import, newsletter
- [ ] G-010/011 product CSV and Pinterest import end to end
- [ ] G-012 AI generation, credits, background removal
- [ ] G-013/014 password protection, closed store, SEO, policies visible on storefront
- [ ] G-015/016/017 report, progress, What's New, production summary
- [ ] G-018 record-sale field/stock parity
- [ ] G-019 account deletion path confirmed (stop before deleting)
- [ ] G-022 unknown route shows branded 404, not "Offline" 503
- [ ] G-023 Pro badge, Billing status and gated nav agree for an expired and an active account
- [ ] G-024 Home shows skeletons, never a false "No pieces yet"
- [ ] G-025/026 theme dialog closes on Escape; Profile Settings card is enabled
- [ ] Q9/Q10 orders "Completed" counter vs Home "Delivered"; duplicate customers explained
- [ ] G-020/021 empty/loading/error/copy review across every screen above
- [ ] Re-run GAP_ANALYSIS §7 pass; each gap row marked closed with evidence
- [ ] Confirm "web is ahead" areas (events, bookings, reports, admin) did not regress
