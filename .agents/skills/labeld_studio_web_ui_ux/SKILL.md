---
name: labeld-studio-web-ui-ux
description: UI/UX and layout guide for revamping Labeld Studio web as a premium desktop extension of Labeld Studio mobile, informed by Shopify's calm operational patterns.
---

# Labeld Studio Web UI/UX Skill

Use this skill whenever designing, reviewing, or implementing Labeld Studio web screens, especially dashboard, products, orders, analytics, store setup, forms, settings, and commerce workflows.

The goal is simple: Studio web must feel like the premium desktop extension of Labeld Studio mobile. Users should recognize the same product, energy, and workflow confidence, while getting the extra speed, density, and calm control expected from a serious web admin tool.

## 1. Product Direction

Labeld Studio web combines two references:

- **Labeld Studio mobile is the brand truth.** Preserve its premium minimalism, rounded cards, strong black/white contrast, large confident commerce numbers, pill controls, clear status chips, and focused creator-commerce workflows.
- **Shopify admin is the usability benchmark.** Borrow its dense but breathable information architecture: compact side navigation, small practical font sizes, light surfaces, quiet cards, searchable layouts, sticky action bars, easy forms, and dashboard grids.

The result should not look like Shopify with a Labeld logo. It should look like Labeld grew up into a premium desktop studio.

## 2. Brand Principles

- **Premium, not decorative.** Use restraint, whitespace, sharp hierarchy, and beautiful product imagery. Avoid busy gradients, oversized hero treatment inside the app, and decorative flourishes that slow down work.
- **Operational calm.** The web app is a control room for brands. Make repeat tasks scan quickly: orders, fulfillment, drops, products, customers, analytics, domains, and campaigns.
- **Mobile parity, web advantage.** Anything important on mobile should have a clear web equivalent, but web should expose more comparison, bulk action, filters, and side-by-side editing.
- **Commerce first.** Money, products, orders, fulfillment, channels, inventory, and audience growth should always be easy to find and act on.
- **Small type, generous breathing room.** Shopify's small-label approach works because it creates whitespace and reduces noise. Use compact text sizes with excellent contrast and line height.

## 3. Foundations

### Typography

Follow the existing Labeld font model:

- **Display / emphasis:** `Unbounded`
- **Body / UI / forms:** `Manrope`

For Studio web, use smaller type than mobile in dense areas:

- Page title: `text-xl` to `text-2xl`, semibold/bold.
- Section title: `text-sm` to `text-base`, semibold.
- Card title: `text-sm`, semibold.
- Body and form text: `text-sm`.
- Metadata, labels, helper text: `text-xs`.
- KPI values: `text-2xl` to `text-4xl` depending on importance.

Use `Unbounded` sparingly in the app shell. It is best for brand moments, primary CTAs, big metrics, and empty-state confidence. Dense forms and tables should stay in `Manrope`.

### Color

Use the existing CSS tokens from `src/app/globals.css`. Do not introduce new hardcoded color systems.

- Background: `bg-bg`
- Surface: `bg-surface`
- Text: `text-text`
- Muted text: `text-text-muted`
- Stroke: `border-stroke`
- Primary black action: black/near-black in light mode, token-compatible in dark mode
- Labeld green success/accent: `bg-accent`, `text-accent`
- Labeld orange energy/action: `bg-cta`, `text-cta`
- Alert/destructive: `text-alert`, `border-alert`, `bg-alert`

Status colors should be soft fills with clear borders:

- Paid/success: green text, pale green fill, green border.
- Unfulfilled/warning: orange text, pale orange fill, orange border.
- Sold out/error: alert red text, pale red fill, red border.
- Protected/private: muted gray fill with lock icon.
- Pro/new/beta: small capsule, not large banners unless onboarding.

### Radius, Borders, Shadows

- Use clean rounded rectangles, generally `rounded-xl` to `rounded-2xl`.
- Cards may be larger-radius than Shopify because Labeld mobile uses softer, premium cards.
- Avoid nesting cards inside cards. Use sections, split panes, or bordered groups instead.
- Borders should usually be `border border-stroke`.
- Shadows should be subtle. Prefer border and spacing over heavy elevation.

### Spacing

- Prefer a quiet, spacious canvas with compact components.
- Desktop page gutters: `px-6` to `px-8`.
- Main content max width for forms: roughly `960px` to `1180px`.
- Analytics and tables can use full available width.
- Card padding: `p-4` for dense cards, `p-5` to `p-6` for premium summaries.
- Form field gaps: `gap-3` to `gap-4`.
- Section gaps: `gap-5` to `gap-8`.

## 4. Web App Shell

Use a stable admin shell inspired by Shopify:

- Left sidebar with compact icon + label navigation.
- Top bar with search, account/brand switcher, notifications, quick actions, and save state when editing.
- Main content on light gray/off-white background.
- White content surfaces with thin borders.
- Active nav item uses a soft filled pill or rounded row.
- Group navigation by business area: Home, Products, Orders, Customers, Analytics, Brand Space, Site Customization, Domains, Newsletter/Campaigns, Settings.

Avoid mobile bottom-tab patterns on desktop. Translate them:

- Mobile `Home`, `Products`, `Orders`, `More` becomes desktop sidebar primary sections.
- Mobile segmented controls become desktop tabs or segmented controls inside content headers.
- Mobile floating add button becomes a top-right primary action or table toolbar action.

## 5. Page Layout Patterns

### Dashboard / Home

The web home should feel like mobile's brand intelligence overview, expanded:

- Brand header with logo, brand name, plan badge, store protection state, visit/share actions.
- Attention strip/cards for new orders, sold out items, failed payments, abandoned carts.
- Labeld Intelligence card for opportunities, copy suggestions, product fixes, and growth prompts.
- KPI row for total sales, orders, conversion, audience, fulfillment.
- Secondary grid for recent orders, product health, top channels, and tasks.

Keep the dashboard actionable. Every card should answer: "What happened?" and "What can I do next?"

### Products

Match mobile's visual product confidence, then add desktop efficiency:

- Search and filters at the top.
- Tabs for Products, Collections, Radar if applicable.
- Grid/list toggle.
- Product cards should feature large clean imagery, product name, price, compare-at price, stock/sold-out state, and quick actions.
- Table/list mode should support bulk selection, inventory, status, collection, price, and last updated.
- Primary action: Add product / Drop a product.

Do not bury product imagery. Labeld is for brands; products need visual presence.

### Orders

Use mobile's order status language and Shopify's dense order management:

- Tabs or segmented filters: Needs Action, In Progress, Completed, Cancelled/Archived.
- Search by customer, order number, product, channel.
- Order rows/cards show customer, order number, date, amount, paid status, fulfillment status, channel, and quick view.
- Order detail uses a two-column desktop layout: main fulfillment/timeline/items on the left, customer/payment/notes/actions on the right.
- Preserve the mobile order timeline states: Placed, Paid, Fulfilled, Shipped, In Transit, Delivered.
- Sticky action bar for major actions such as arrange shipping, mark delivered, generate receipt, share order, refund/cancel.

### Forms

Use Shopify's clarity and mobile's big comfortable fields:

- Group related fields into bordered white sections.
- Use compact labels (`text-sm`) and generous field height.
- Required fields use a small `*` in Labeld action color.
- Helper text is muted and short.
- Use two-column layouts only when fields are naturally paired, such as currency + price.
- Keep side panels for status, publishing, organization, tags, and metadata on edit screens.
- Use sticky save/discard bars for long edit forms.

Forms should feel easy and unthreatening, especially product creation, manual sales, domain setup, and campaign creation.

### Analytics

Borrow Shopify's dashboard grid, but make it Labeld:

- Compact filter row for date range, channel, currency, product/event, and export.
- KPI cards across the top.
- Larger primary chart first.
- Secondary cards for breakdowns, conversion, sales by product, channels, device/location, cohort, and audience.
- Use empty states that are calm and useful, not blank walls.
- Charts should use Labeld tokens and restrained color. Avoid rainbow dashboards.

## 6. Components

### Buttons

- Primary actions: black/near-black or Labeld accent when the action is clearly positive.
- Secondary actions: white surface with border.
- Destructive: alert color, usually secondary until confirmation.
- Use icons from `lucide-react` when they clarify the action.
- Buttons should have stable heights and not resize when labels change.

### Cards

- Cards should hold one clear object: a product, order, KPI, insight, form section, or settings group.
- Use title, primary value/content, metadata, then actions.
- Avoid oversized cards for simple admin content.
- Use larger image cards only where visual inspection matters.

### Pills, Chips, Badges

- Use pills for status, filters, segments, and plan markers.
- Active pills can be black with white text.
- Inactive pills use white/transparent surface with border and muted text.
- Badges must be compact: Pro, New, Beta, Paid, Unfulfilled, Sold Out.

### Inputs

- Inputs should be clear, calm, and easy to scan.
- Use label above input for forms.
- Use placeholder text lightly; it should not replace labels.
- Search inputs should include an icon and can be wider than standard fields.
- Selects should look like inputs with a right-side chevron.

### Tables

- Use tables for dense operational workflows.
- Keep row height comfortable but compact.
- Use sticky headers for long tables when useful.
- Provide selection, filters, sorting, and bulk actions where expected.
- Never make users open every item just to inspect key status.

## 7. Responsive Translation

Desktop and mobile should feel like the same product:

- Desktop side nav maps to mobile bottom nav.
- Desktop tabs map to mobile pill/segmented controls.
- Desktop drawers or right panels map to mobile full-screen detail pages.
- Desktop sticky action bars map to mobile bottom action bars.
- Desktop data tables collapse into mobile cards.

When implementing web changes, check mobile breakpoints too. A premium desktop revamp must not damage responsive behavior.

## 8. Interaction Standards

- Keep primary actions obvious and near the work area.
- Show loading, disabled, empty, success, and error states.
- Use confirmation for destructive actions.
- Prefer inline validation for forms.
- Preserve user input during async errors.
- Use optimistic UI only when rollback is clear.
- Use keyboard-accessible controls, focus states, labels, and semantic buttons.

## 9. Implementation Rules

- Use existing components and tokens before creating new ones.
- Use Tailwind token classes tied to `globals.css`; avoid hardcoded hex values.
- Use `lucide-react` icons for common actions.
- Keep components small and composable.
- Use server/client component boundaries intentionally in Next.
- Do not add decorative gradients, blobs, or marketing hero sections inside Studio.
- Do not make dense operational screens look like landing pages.
- Do not hide important commerce actions behind vague menus.

## 10. Review Checklist

Before completing a Studio web UI change, verify:

- [ ] Does it feel like Labeld Studio mobile translated to desktop?
- [ ] Does it borrow Shopify's clarity without copying Shopify's brand?
- [ ] Are fonts using `Unbounded` and `Manrope` appropriately?
- [ ] Are colors using existing Labeld tokens?
- [ ] Is the layout clean, breathable, and operationally dense where needed?
- [ ] Are key workflows from mobile represented on web?
- [ ] Are forms compact, clear, and forgiving?
- [ ] Are product images, order statuses, and money values easy to scan?
- [ ] Are loading, empty, error, disabled, and success states handled?
- [ ] Does it work across desktop and mobile breakpoints?
- [ ] Are buttons, inputs, cards, and tables accessible by keyboard and screen readers?

