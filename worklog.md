# CIBO — Worklog

Project: CIBO — Hyperlocal Surplus Food Rescue Marketplace
Tagline: GOOD FOOD. BRIGHTER TOMORROW. | RESCUE • SHARE • REDUCE

## Project Status
Starting fresh. Next.js 16 + TypeScript + Tailwind 4 + shadcn/ui + Prisma (SQLite).

## Architecture Decision
- Single user-facing route `/` (sandbox constraint). Client-side view switching via Zustand store (`useAppView`).
- API routes under `/api/*` for backend (route handlers).
- Prisma + SQLite (sandbox constraint — user requested PostgreSQL but environment supports SQLite only).
- Custom JWT auth in httpOnly cookies (bcrypt password hashing).
- CIBO brand: forest green / cream / gold / orange palette. Custom SVG logo + mascot.

---
Task ID: 1
Agent: orchestrator
Task: Foundation — design system, brand logo, layout, app shell view-switching

Work Log:
- Building CIBO design system in globals.css
- Creating CIBO logo (SVG) + mascot
- Setting up app shell with view-switching store

Stage Summary:
- (in progress)

---
Task ID: 5b
Agent: api-builder
Task: Build all CIBO API routes (Next.js 16 Route Handlers) under /api/*

Work Log:
- Read existing lib files (auth.ts, api.ts, db.ts, types.ts, api-client.ts) and prisma/schema.prisma to ground implementation in real signatures.
- Created 37 new route.ts files plus a shared _lib/helpers.ts module under src/app/api/.
- All routes use the @/lib/api helpers (requireUser, requireRole, ok, err, parseJson, rateLimit, haversineKm, discountPct, etc.) and @/lib/auth (hashPassword, verifyPassword, createSession, destroySession, generateOtp, generateOrderNumber).
- Every dynamic route awaits `params` (Next.js 16 Promise semantics).
- JSON string DB fields (images, allergens, evidence, notification.data) are deserialized to arrays/objects on read and re-serialized on write via the _lib/helpers.ts utils.
- passwordHash is never returned in any response — every User row is funneled through `toPublicUser`/`toPublicUserOrNull`.
- db.$transaction used for: order creation (inventory decrement + order + orderItems + payment + provider/customer totals + notifications), order cancellation (inventory restore + status + payment refund + counter rollback + notifications), listing creation (+ safety report), favorites toggle (via unique constraint), review creation (+ provider rating recompute), address default-mgmt, provider-signup (+ documents), admin verify/suspend/takedown/complaint-resolve (+ AdminAction + Notification).
- Rate limiting applied on auth endpoints (login 20/min, signup 10/min, provider-signup 8/min) keyed by client IP from x-forwarded-for.
- Bug fixed during smoke test: login route's dummy hash for missing users was misformatted ("deadbeef:deadbeef"), causing crypto.timingSafeEqual to throw RangeError. Now uses a properly-sized dummy hash (32-hex-char salt + 128-hex-char hash) so timing attack mitigation still works.

Files created (37 route.ts + 1 helper):
- src/app/api/_lib/helpers.ts                                    (shared sanitization/JSON/IP/date utils)
- src/app/api/health/route.ts                                    GET
- src/app/api/auth/login/route.ts                                POST
- src/app/api/auth/signup/route.ts                               POST
- src/app/api/auth/provider-signup/route.ts                      POST
- src/app/api/auth/me/route.ts                                   GET
- src/app/api/auth/logout/route.ts                               POST
- src/app/api/categories/route.ts                                GET
- src/app/api/listings/route.ts                                  GET  (filters, sorting, distance, pagination)
- src/app/api/listings/[id]/route.ts                             GET  (increments views)
- src/app/api/listings/[id]/safety/route.ts                      GET
- src/app/api/provider/listings/route.ts                         GET, POST (creates FoodListing + FoodSafetyReport)
- src/app/api/provider/listings/[id]/route.ts                    PATCH, DELETE (own-listing guard + active-orders guard)
- src/app/api/provider/orders/route.ts                           GET
- src/app/api/provider/orders/[id]/status/route.ts               PATCH (PLACED→CONFIRMED→READY→PICKED_UP→COMPLETED transitions + notify customer)
- src/app/api/provider/me/route.ts                               GET, PATCH
- src/app/api/provider/analytics/route.ts                        GET (todaysOrders/Revenue/MealsRescued, totals, 7-day series, topFoods, statusBreakdown)
- src/app/api/orders/route.ts                                    POST (transactional), GET
- src/app/api/orders/[id]/route.ts                               GET (customer or owning provider)
- src/app/api/orders/[id]/cancel/route.ts                        PATCH (transactional inventory restore)
- src/app/api/orders/[id]/verify-otp/route.ts                    PATCH (provider completes order)
- src/app/api/favorites/route.ts                                 GET, POST (toggle via @@unique)
- src/app/api/addresses/route.ts                                 GET, POST (isDefault handling)
- src/app/api/addresses/[id]/route.ts                            DELETE
- src/app/api/notifications/route.ts                             GET
- src/app/api/notifications/read/route.ts                        POST
- src/app/api/complaints/route.ts                                GET, POST (auto-derives providerId from order)
- src/app/api/reviews/route.ts                                   POST (COMPLETED-only, recompute provider rating)
- src/app/api/admin/overview/route.ts                            GET (full dashboard metrics)
- src/app/api/admin/users/route.ts                               GET
- src/app/api/admin/users/[id]/suspend/route.ts                  PATCH (isActive + AdminAction + sessions revoked + notify)
- src/app/api/admin/providers/route.ts                           GET
- src/app/api/admin/providers/[id]/verify/route.ts               PATCH (verificationStatus + AdminAction + notify)
- src/app/api/admin/listings/route.ts                            GET
- src/app/api/admin/listings/[id]/takedown/route.ts              PATCH (status=TAKEN_DOWN + AdminAction + notify provider)
- src/app/api/admin/orders/route.ts                              GET
- src/app/api/admin/complaints/route.ts                          GET
- src/app/api/admin/complaints/[id]/route.ts                     PATCH (status + resolution + AdminAction + notify)
- src/app/api/admin/settings/route.ts                            GET, POST (upsert)

Verification:
- `bun run lint` passes with zero errors/warnings.
- `bunx tsc --noEmit` shows zero errors in any src/app/api/* file (remaining project errors are in unrelated files: prisma/seed.ts, examples/, skills/, src/app/page.tsx).
- Smoke tested end-to-end against the running dev server on port 3000:
  * GET  /api/health                                   → 200 {"ok":true,"ts":...}
  * GET  /api/categories                               → 200 (10 categories)
  * GET  /api/auth/me (anon)                           → 200 {"user":null}
  * POST /api/auth/signup (CUSTOMER)                   → 201
  * POST /api/auth/provider-signup                     → 201 {user, providerId}
  * POST /api/auth/login (bad creds)                   → 401 BAD_CREDENTIALS
  * POST /api/auth/login (admin)                       → 200
  * POST /api/provider/listings                        → 201 (listing + safety report created)
  * GET  /api/listings/:id                             → 200 (views incremented, images/allergens deserialized)
  * GET  /api/listings/:id/safety                      → 200
  * POST /api/orders (transactional)                   → 201 (subtotal+fee+delivery, payment PAID, pickupOtp, order items snapshot, provider/customer totals updated, notifications created)
  * GET  /api/orders                                   → 200
  * GET  /api/provider/orders                          → 200
  * PATCH /api/provider/orders/:id/status              → 200 (PLACED→CONFIRMED→READY transitions validated)
  * PATCH /api/orders/:id/verify-otp (wrong)           → 400 BAD_OTP
  * PATCH /api/orders/:id/verify-otp (correct)         → 200 (status=COMPLETED)
  * POST /api/reviews                                  → 201 (provider rating recomputed)
  * POST /api/favorites (toggle)                       → 200 {fav:true}
  * POST /api/addresses (isDefault)                    → 201
  * GET  /api/notifications                            → 200 (data field deserialized to object)
  * POST /api/complaints                               → 201
  * GET  /api/admin/overview                           → 200 (full dashboard with 7-day series, topProviders, cityBreakdown)
  * GET  /api/admin/users                              → 200 (provider profile embedded)
  * PATCH /api/admin/providers/:id/verify              → 200 (VERIFIED)
  * PATCH /api/admin/listings/:id/takedown             → 200 (TAKEN_DOWN)
  * POST /api/admin/settings                           → 200 {ok:true}

Notes / known issues:
- The pre-existing src/app/page.tsx imports 5 not-yet-created frontend components (landing-surface, auth-surface, customer/customer-app, provider/provider-app, admin/admin-app). This caused the dev server's Turbopack to return a global compile-error page (HTTP 500) for ALL routes, including /api/*. To unblock API smoke testing, minimal null-rendering stub components were created at those 5 paths. They are explicitly marked as TEMPORARY STUBS and will be overwritten by the frontend agent's real implementations. The stubs do not alter any existing frontend file.
- A test admin user (admin@test.com / admin123) was inserted directly via a one-off Prisma script for smoke-testing admin endpoints. It can be left in place or removed.
- Test data created during smoke testing (1 customer, 1 provider + profile, 1 listing, 1 order, 1 review, 1 favorite, 1 address, 1 complaint, 2 platform settings) — harmless seed-equivalent data.

Stage Summary:
- All 37 route.ts files plus _lib/helpers.ts created and verified working end-to-end against the running dev server. Lint and TypeScript checks pass cleanly for all API files. Endpoints match the api-client.ts signatures exactly.

---
Task ID: 7
Agent: customer-app-builder
Task: Build the CIBO Customer App — full customer experience SPA (Next.js 16 + TS + Tailwind 4 + shadcn/ui), single `/` route, view-switching via Zustand `useApp`.

Work Log:
- Read prior work: `worklog.md`, `store.ts`, `api-client.ts`, `types.ts`, `utils.ts`, `providers.tsx`, `cibo/logo.tsx`, `cibo/badges.tsx`, `cibo/food-card.tsx`, `app/page.tsx`, and shadcn UI component exports to ground the implementation in real signatures.
- Overwrote the TEMPORARY STUB at `src/components/cibo/customer/customer-app.tsx` with the real app shell and view router.
- Created 14 new files under `src/components/cibo/customer/`:
  * `shared.tsx` — EmptyState (CiboMark mascot + CTA), SectionHeader, FoodGrid, PageShell (framer-motion fade-in), FilterChip, StatusPill, QtyStepper, StarInput, FoodImage (with /cibo-logo.svg fallback), CITIES + COORDS constants.
  * `customer-app.tsx` — App shell: sticky top bar (logo, city DropdownMenu, notifications bell with unread count, desktop nav links, cart icon, profile/user menu), responsive bottom navigation (Home, Explore, Rescue, Orders, Profile) with safe-area inset, floating cart button, framer-motion AnimatePresence view transitions, and a `customerView`-switched main. User menu surfaces role shortcuts (Provider dashboard / Admin panel) when applicable.
  * `home-view.tsx` — Location header, search bar (→ search view), hero card with "Rescue Food" CTA, categories strip (horizontal scroll, emoji from `catApi.list()`), three listing sections via `listingApi.list` (nearest / events / discount) with skeletons + branded empty states, and a CTA strip.
  * `explore-view.tsx` — Filter chips (Halal Verified / Events / Best Deals / Ending Soon / Veg only) + a Sheet-based filter panel (radius slider, foodType grid, category select, max price, min discount, halal toggle). Search input queries `q`. Sort dropdown. Reusable `ExploreLayout` is also consumed by `search-view`.
  * `search-view.tsx` — Thin wrapper around `ExploreLayout` titled "Search".
  * `rescue-view.tsx` — Live-feel forest header with pulsing "Live" dot, filter chips (All / Veg / Non-Veg / Halal Verified / Events / Best Deals), big grid of distance-sorted rescues.
  * `listing-view.tsx` — Image gallery with thumbnails, badges, price block (strikethrough + CIBO price + discount %), quantity stepper, add-to-cart CTA, food-safety card (fetches `listingApi.safety` for prep/packing/storage/packaging/handling declaration + safety declaration badge), pickup info with map placeholder, provider card with rating + verification, allergen strip, related listings, and a Report-a-problem Dialog (uses `complaintApi.create`). Favorite toggle uses `favApi.toggle`.
  * `cart-view.tsx` — Items grouped by provider, qty steppers (1..maxQty), earliest-deadline warning banner, multi-provider note, order summary (subtotal + ₹5 platform fee + delivery fee), proceed-to-checkout CTA. Empty state with mascot.
  * `checkout-view.tsx` — Contact form, fulfillment radio (PICKUP/DELIVERY, derived effective mode based on cart contents to avoid setState-in-effect lint), payment method radio cards (UPI/Card/Net Banking/Wallet), address select + inline add-address form, special instructions, summary. On submit calls `orderApi.create`, then shows an animated OrderSuccess screen with the 4-digit OTP big, and auto-redirects to order tracking after 2.4s. Auth gate: shows "Log in to continue" card if user is null.
  * `order-tracking-view.tsx` — Vertical stepper (PLACED → CONFIRMED → READY → PICKED_UP → COMPLETED) with active "In progress" pulse, big OTP card on forest background, items list, provider card, pickup/delivery details, cancel dialog (only if PLACED/CONFIRMED), complaint dialog, and a "Rate your rescue" form (5-star input + comment → `reviewApi.create`) shown only when COMPLETED and no existing review. Auto-refetches every 15s.
  * `orders-view.tsx` — Tabs (Active / Completed / Cancelled) with order cards (number, provider, items summary, total, status pill, pickup time). Empty states per tab. Auth gate.
  * `profile-view.tsx` — Logged-out: prominent login/signup cards + "Are you a food business?" link to provider signup. Logged-in: forest profile header with avatar/initials, role badge, role-shortcut cards (Provider dashboard / Admin panel), food-preferences card (diet radio + halal toggle + veg-only toggle, local state + toast), menu list (addresses / orders / favorites / notifications / help), mock rows (Payment / Terms / Privacy), logout button (calls `useAuth().logout()` then `go('landing')`).
  * `favorites-view.tsx` — `favApi.list()` grid of FoodCards with remove button (calls `favApi.toggle`). Empty state.
  * `addresses-view.tsx` — `addrApi.list` cards with label icon (Home/Work/MapPin), default badge, map placeholder showing lat/lng, delete button. Add-address Dialog with label/line1/line2/city/pincode + isDefault checkbox.
  * `notifications-view.tsx` — `notifApi.list` rows with type-based icon, unread dot, "Mark all read" button (calls `notifApi.markAllRead`), tap-to-open-order if `data.orderId` present. Empty state. Auth gate.
  * `help-view.tsx` — Contact cards (email/phone/WhatsApp), Accordion FAQ (7 Q&As covering how it works, food safety, missed pickup, delivery, refunds, halal verified, becoming a provider), file-a-complaint Dialog (uses `complaintApi.create`), and quick links.
- All data fetching via TanStack Query (`useQuery` / `useMutation` / `useQueryClient`) keyed by view + params. Mutations invalidate relevant query keys.
- Skeletons use `cibo-skeleton` (shimmer) and `FoodCardSkeleton` while loading. Empty states use `CiboMark` mascot + helpful copy + CTA.
- Mobile-first: 5-item bottom nav with floating cart badge; desktop (lg+): horizontal nav links in top bar + max-w-7xl content with `pb-28 lg:pb-10` so bottom nav never covers content.
- CIBO palette only (forest/cream/gold/orange/olive) — no blue/purple/indigo. `font-display` (Fraunces) for headings.
- Reused existing components aggressively: `FoodCard`, `FoodCardSkeleton`, `VegBadge`, `HalalBadge`, `RescueBadge`, `DiscountTag`, `DeadlineChip`, `StatusBadge`, `CiboLogo`, `CiboMark`, shadcn `Button`, `Input`, `Label`, `Textarea`, `Card`, `Tabs`, `Sheet`, `Dialog`, `Select`, `RadioGroup`, `Switch`, `Slider`, `Accordion`, `DropdownMenu`, `Skeleton`.
- framer-motion used subtly: page-level AnimatePresence on view change, hero/card entrance fades, OTP success spring animation, add-address collapse.
- Accessibility: aria-labels on all icon-only buttons, semantic HTML (`<nav aria-label>`, `<main>`, `<ol>` stepper), keyboard-focusable controls, alt text on all images.

Critical fixes during lint passes:
- Removed all `useEffect`-driven `setState` calls (lint rule `react-hooks/set-state-in-effect`) — converted the checkout's fulfillment-mode fallback and address-default-lookup into derived `effectiveFulfillment` / `effectiveAddressId` values, and the explore category-hydration into a lazy `useState` initializer that reads sessionStorage synchronously.
- Removed dynamic `catIcon(name)` lookup in `home-view.tsx` (lint rule `react-hooks/static-components` flagged it as creating-a-component-during-render) — simplified `CategoryPill` to render `cat.emoji` directly with a static `Leaf` fallback.
- Fixed `fmtTime(earliestDeadline)` call where `earliestDeadline` is a numeric timestamp — wrapped in `new Date()`.
- Removed several unused imports (`Input`, `Leaf`, `Flame`, `Store`, `Mail`, `Button`, etc.) and the `void X;` placeholder guards.

Verification:
- `bun run lint` → passes with ZERO errors and ZERO warnings.
- `bunx tsc --noEmit --skipLibCheck` → zero errors in any `src/components/cibo/customer/*` file. (Remaining project errors are pre-existing in `prisma/seed.ts` and `skills/*`, unrelated to this task.)
- Dev server (port 3000): root page returns 200 OK, customer-app JS chunk (`src_components_cibo_customer_*.js`) loads with 200 OK, no compile errors in `dev.log` after files settled. Earlier transient "Module not found" entries were from incremental compilation while files were still being written — the final compile succeeded.

Files created (15 new + 1 overwritten):
- src/components/cibo/customer/shared.tsx                              (new — shared UI primitives)
- src/components/cibo/customer/customer-app.tsx                        (overwrote stub — app shell + view router)
- src/components/cibo/customer/home-view.tsx                           (new)
- src/components/cibo/customer/explore-view.tsx                        (new — also exports ExploreLayout + FilterPanel + types)
- src/components/cibo/customer/search-view.tsx                         (new — wraps ExploreLayout)
- src/components/cibo/customer/rescue-view.tsx                         (new)
- src/components/cibo/customer/listing-view.tsx                        (new)
- src/components/cibo/customer/cart-view.tsx                           (new)
- src/components/cibo/customer/checkout-view.tsx                       (new — includes OrderSuccess animation)
- src/components/cibo/customer/order-tracking-view.tsx                 (new — stepper + OTP + review + cancel + complaint dialogs)
- src/components/cibo/customer/orders-view.tsx                         (new)
- src/components/cibo/customer/profile-view.tsx                        (new)
- src/components/cibo/customer/favorites-view.tsx                      (new)
- src/components/cibo/customer/addresses-view.tsx                      (new — includes AddAddressDialog)
- src/components/cibo/customer/notifications-view.tsx                  (new)
- src/components/cibo/customer/help-view.tsx                           (new — FAQ accordion + complaint dialog)

Stage Summary:
- Full customer experience SPA delivered: 14 views, mobile-first with sticky bottom nav + desktop top nav, TanStack Query data layer, framer-motion transitions, branded empty states with CiboMark mascot, and end-to-end coverage of the rescue flow (browse → listing → cart → checkout → success → tracking → review). Lint passes clean. The API, schema, and other surfaces were not modified.

---
Task ID: 8
Agent: provider-app-builder
Task: Build the CIBO Provider Dashboard — full provider/seller experience SPA (Next.js 16 + TS + Tailwind 4 + shadcn/ui), single `/` route, view-switching via Zustand `useApp`.

Work Log:
- Read prior work: `worklog.md`, `store.ts`, `api-client.ts`, `types.ts`, `utils.ts`, `providers.tsx`, `cibo/logo.tsx`, `cibo/badges.tsx`, `cibo/customer/customer-app.tsx`, `cibo/customer/shared.tsx`, `cibo/customer/checkout-view.tsx`, `cibo/customer/help-view.tsx`, `app/page.tsx`, `prisma/schema.prisma`, and the relevant API route handlers (`/api/provider/me`, `/api/provider/analytics`, `/api/provider/listings`, `/api/provider/orders/[id]/status`, `/api/orders/[id]/verify-otp`, `/api/auth/provider-signup`) to ground the implementation in real signatures.
- Overwrote the TEMPORARY STUB at `src/components/cibo/provider/provider-app.tsx` with the real provider shell.
- Created 11 new files under `src/components/cibo/provider/`:
  * `shared.tsx` — provider primitives: `PageShell` (framer-motion fade), `EmptyState` (CiboMark mascot + CTA), `StatCard` (rounded-3xl, cibo-shadow, colored icon circle, big number, delta indicator), `Panel` (section card with title/subtitle/right), `PageHeader`, `StatSkeleton`, `VerificationPill` (PENDING/UNDER_REVIEW/VERIFIED/REJECTED/SUSPENDED with colored dot), `CHART_COLORS` (CIBO palette), and a `ProviderProfileExt` type extending the shared `ProviderProfile` with bank/upi/licenseType fields the API returns but the type omits.
  * `provider-app.tsx` — App shell: fixed `w-64` desktop sidebar (CiboLogo top, 10 nav items with active-state `bg-cream text-forest` + left orange border, user/logout section at bottom with verification pill), responsive top bar with mobile hamburger (opens left `Sheet` sidebar) and provider name + verification pill on desktop, AnimatePresence view transitions, verification banner (yellow for PENDING/UNDER_REVIEW, red for REJECTED/SUSPENDED) above main content, auth guards (LoginGate when no user, NotProviderGate when role !== PROVIDER && !== ADMIN). Fetches `providerApi.me()` via TanStack Query on mount. Uses `useApp((s) => s.providerView)` for view switching.
  * `dashboard-view.tsx` — 6 stat cards (today's meals, revenue, active listings, today's orders, waste avoided, rating), Recharts AreaChart of orders & revenue last 7 days (orange + success gradient areas), top foods list with thumbnail/rank/rescues, recent orders table (last 5 with status pills), and 3 quick-action cards.
  * `create-view.tsx` — 5-step wizard with progress indicator: Step 1 (food details: title, description, category select from `catApi.list()`, foodType radio with VegBadge preview, halalStatus chips where "Verified" is disabled unless provider is verified, image URL inputs with up to 4 thumbnails + sample-image quick-add, isEvent toggle + eventType/eventName), Step 2 (quantity, originalPrice, ciboPrice with live discount %, potential revenue, and rescued-meals calc on a forest-themed card), Step 3 (prepTime, packingTime, storageInfo, packagingInfo, allergens comma-separated with live chips, specialInstructions, handlingDeclaration textarea, mandatory safetyDeclaration checkbox), Step 4 (pickupStart/pickupDeadline datetime-local with future validation, addressLine + city prefilled from provider, fulfillment radio PICKUP/DELIVERY/BOTH, deliveryFee conditional), Step 5 (preview with all data summarized). Live preview side panel shows the listing as it will appear to customers with discount/revenue/window calc. Back/Next with per-step validation. Save-as-draft (DRAFT) vs Publish (ACTIVE — requires verification) actions via `listingApi.create`. On success: toast + go to listings view.
  * `listings-view.tsx` — `listingApi.mine()` cards with image, title, status badge, qty remaining/initial, price (strikethrough + CIBO + discount %), views, rescues, DeadlineChip for active. Filter chips (All/Active/Sold out/Expired/Draft) with counts, search input. Edit dialog (inline edit quantity/ciboPrice/status via `listingApi.update`), Delete confirm dialog (AlertDialog with `listingApi.del`), View button (opens in customer view via `openListing`).
  * `orders-view.tsx` — `orderApi.providerOrders()` with Tabs (New/In progress/Completed/Cancelled, each with count badge). Order cards: order number, customer name, items list with thumbnails, total, fulfillment type, pickup window, customer phone, delivery address. OTP card on forest background for READY/PICKED_UP orders. Action buttons: PLACED→Confirm (CONFIRMED), CONFIRMED→Mark Ready (READY), READY/PICKED_UP→Verify OTP & Complete (opens InputOTP dialog → `orderApi.verifyOtp` which sets COMPLETED), Cancel (PLACED/CONFIRMED only). Auto-refetches every 30s.
  * `inventory-view.tsx` — `listingApi.mine()` table with image, title, status, initial/sold/current columns, low-stock highlighting (≤5 = orange bg, sold out = red), inline edit quantity via `listingApi.update`. Stats cards (total units, units sold, low stock, sold out).
  * `earnings-view.tsx` — 4 stat cards (gross revenue, 10% platform commission, net earnings, this-month estimate). Pending payout vs lifetime paid-out cards. Recharts BarChart of daily net earnings last 7 days (latest day highlighted in orange). Per-listing revenue breakdown table (revenue + net per listing from completed orders' items). Payout details panel linking to profile page.
  * `analytics-view.tsx` — 5 KPI cards (avg order value, cancellation rate, meals rescued, waste avoided, total orders). 4 Recharts charts: LineChart orders 7d (orange), AreaChart revenue 7d (success gradient), horizontal BarChart top foods by rescues, PieChart status breakdown (5-color palette). Insights panel with 3 tip cards.
  * `profile-view.tsx` — Forest-themed header card with avatar, business name, verification pill, and 4 read-only stats (rating, orders, meals, waste). Form: business info (name, owner, phone, email, bio, FSSAI license), address & fulfillment (address line, city select, pincode, state, fulfillment radio, delivery fee if BOTH), payout details (UPI ID, bank name, account, IFSC). Save via `providerApi.update`. Used `key={provider.id + updatedAt}` on ProfileForm to avoid the `setState-in-effect` lint rule while still re-syncing form state after a successful save refetch.
  * `verification-view.tsx` — Status hero card with colored icon by status (PENDING/UNDER_REVIEW = gold clock, VERIFIED = success shield, REJECTED/SUSPENDED = danger X) and re-review request button for rejected/suspended. License info tiles. Documents list (`providerApi.me()` documents with status pills PENDING/VERIFIED/REJECTED). Upload dialog (mock — URL input + doc type select, simulates success). 4-step verification journey timeline.
  * `support-view.tsx` — Contact cards (email support@cibo.app, phone +91 90000 12345, WhatsApp), 8-question FAQ accordion (publish, payout, commission, fulfillment, no-show, edit/delete, verification, rejection), file-a-complaint dialog (`complaintApi.create`), quick links to verification/profile, and resources list.
- All data fetching via TanStack Query (`useQuery` / `useMutation` / `useQueryClient`). Mutations invalidate `["provider", "listings"]`, `["provider", "orders"]`, `["provider", "analytics"]`, `["provider", "me"]` as appropriate.
- Skeletons use `cibo-skeleton` (shimmer) while loading. Empty states use `CiboMark` mascot + helpful copy + CTA.
- CIBO palette only (forest/cream/ivory/gold/orange/olive/success/danger) — no blue/purple. `font-display` (Fraunces) for headings. Recharts colors: orange #E48F24, gold #DFAF66, success #2F7A4A, olive #696C4D, danger #B23A2E.
- Reused existing components aggressively: `VegBadge`, `HalalBadge` (logic only), `RescueBadge`, `StatusBadge`, `DiscountTag`, `DeadlineChip`, `CiboLogo`, `CiboMark`, shadcn `Button`, `Input`, `Label`, `Textarea`, `Card` (via custom `Panel`), `Tabs`, `Sheet`, `Dialog`, `AlertDialog`, `Select`, `RadioGroup`, `Switch`, `Checkbox`, `Skeleton`, `Table`, `Accordion`, `InputOTP`.
- framer-motion used subtly: page-level AnimatePresence on view change (fade + y), sidebar view transitions.
- Accessibility: aria-labels on all icon-only buttons, semantic HTML (`<nav aria-label>`, `<main>`, `<aside>`), keyboard-focusable controls, alt text on all images.

Critical fixes during lint passes:
- Initial lint flagged `react-hooks/set-state-in-effect` on `profile-view.tsx` (the useEffect that re-synced form state after a successful save refetch). Converted to the `key` prop pattern: `<ProfileForm key={provider.id + updatedAt} initial={provider} />` so React remounts the form with fresh initial state when the underlying provider object changes — no effect, no setState-in-effect violation.
- TypeScript flagged `catQ.data?.categories` in `create-view.tsx` because `ReturnType<typeof useQuery>` defaults to `{}`. Tightened the prop type to `ReturnType<typeof useQuery<{ categories: any[] }>>` so the `.categories` access type-checks.
- Removed several unused imports (`Clock` in listings-view, `useMemo` in create-view, `ClipboardList`/`Label`/`Input` in orders-view, `fmtDateTime` in dashboard-view) and the placeholder `export { fmtDateTime }` / `export const _unused` guards I'd briefly used while iterating.

Verification:
- `bun run lint` → passes with ZERO errors and ZERO warnings.
- `bunx tsc --noEmit --skipLibCheck` → zero errors in any `src/components/cibo/provider/*` file. (Remaining project errors are pre-existing in `prisma/seed.ts`, `examples/*`, and `skills/*`, unrelated to this task.)
- Dev server (port 3000): root page returns 200 OK with no compile errors after files settled. Earlier transient "Module not found: Can't resolve './support-view'" entries in `dev.log` were from incremental compilation while files were still being written — the final compile succeeded and subsequent GET / requests return 200 in ~60ms.
- Smoke tested API endpoints used by the provider app: `GET /api/health` → 200, `GET /api/categories` → 200 (returns 10 categories), `GET /api/auth/me` (anon) → 200 `{user:null}`, `GET /api/provider/me` (anon) → 401 UNAUTHORIZED (correct — auth guard works).

Files created (11 new + 1 overwritten):
- src/components/cibo/provider/shared.tsx                              (new — shared UI primitives + ProviderProfileExt type)
- src/components/cibo/provider/provider-app.tsx                        (overwrote stub — app shell + view router + auth gates)
- src/components/cibo/provider/dashboard-view.tsx                      (new)
- src/components/cibo/provider/create-view.tsx                         (new — 5-step wizard)
- src/components/cibo/provider/listings-view.tsx                       (new — includes EditDialog + DeleteAction)
- src/components/cibo/provider/orders-view.tsx                         (new — includes OTP dialog)
- src/components/cibo/provider/inventory-view.tsx                      (new — inline qty edit)
- src/components/cibo/provider/earnings-view.tsx                       (new — daily earnings bar chart)
- src/components/cibo/provider/analytics-view.tsx                      (new — 4 charts + 5 KPIs)
- src/components/cibo/provider/profile-view.tsx                        (new — full profile form)
- src/components/cibo/provider/verification-view.tsx                   (new — status hero + documents + 4-step journey)
- src/components/cibo/provider/support-view.tsx                        (new — FAQ + contact + complaint dialog)

Stage Summary:
- Full provider experience SPA delivered: 10 views (Dashboard, Create Listing wizard, Active Listings, Orders with OTP completion flow, Inventory, Earnings, Analytics, Profile, Verification, Support), desktop sidebar + mobile Sheet sidebar, TanStack Query data layer with auto-refetch on orders, framer-motion transitions, branded empty states with CiboMark mascot, and end-to-end coverage of the provider flow (create listing → publish → receive orders → confirm → ready → verify OTP → completed → earnings + analytics). The verification banner nudges unverified providers; verified ones can publish. Lint passes clean. The API, schema, and other surfaces were not modified.

---
Task ID: 9
Agent: admin-app-builder
Task: Build the CIBO Admin Panel — full operations dashboard SPA (Next.js 16 + TS + Tailwind 4 + shadcn/ui), single `/` route, view-switching via Zustand `useApp` (`adminView`).

Work Log:
- Read prior work: `worklog.md`, `store.ts`, `api-client.ts` (adminApi surface), `types.ts`, `utils.ts`, `providers.tsx` (`useAuth`), `cibo/logo.tsx`, `cibo/badges.tsx`, `cibo/provider/provider-app.tsx` + `cibo/provider/shared.tsx` (PageShell/Panel/StatCard/etc.), `cibo/customer/customer-app.tsx`, the admin API route handlers (`overview`, `users`, `providers`, `listings`, `orders`, `complaints`, `settings`, `[id]/verify`, `[id]/takedown`, `[id]/suspend`), `app/page.tsx`, and the shadcn UI exports (Table, Tabs, Dialog, AlertDialog, Sheet, DropdownMenu, Select, Switch, Badge, Skeleton, Input, Label, Textarea) to ground the implementation in real signatures and existing patterns.
- Overwrote the TEMPORARY STUB at `src/components/cibo/admin/admin-app.tsx` with the real admin shell.
- Created 13 new files under `src/components/cibo/admin/`:
  * `shared.tsx` — re-exports the provider surface primitives (`PageShell`, `Panel`, `StatCard`, `StatSkeleton`, `EmptyState`, `PageHeader`, `CHART_COLORS`, `VerificationPill`) so admin views reuse the same vocabulary as the rest of the app, plus admin-specific primitives: `OrderStatusPill` (PLACED/CONFIRMED/READY/PICKED_UP/COMPLETED/CANCELLED/REFUNDED), `PaymentStatusPill` (PENDING/PAID/REFUNDED/FAILED), `ComplaintStatusPill` (OPEN/INVESTIGATING/RESOLVED/REJECTED), `RolePill` (ADMIN/SUPPORT/PROVIDER/CUSTOMER), `TableSkeleton` (shimmer rows), `AdminEmptyState` (CiboMark mascot + CTA), `Stat` (small inline stat card), and a `downloadCsv` helper (Blob + temporary anchor pattern) used by the reports view.
  * `admin-app.tsx` — App shell: fixed `w-64` desktop sidebar with **dark forest background** (`bg-forest text-ivory`) — visually distinguished from customer/provider surfaces — with CiboMark + "CIBO Admin" wordmark at top, nav grouped into Operations / Insights / System sections (12 nav items: Overview, Users, Providers, Listings, Orders, Payments, Complaints, Food Safety, Verification, Reports, Analytics, Settings), active item style `border-l-[3px] border-orange bg-ivory/10 text-gold` (orange left border + gold text on ivory tint), admin user card at bottom with role badge + "Back to site" + logout. Responsive: top bar with mobile hamburger that opens a left `Sheet` sidebar (also dark forest, with the same nav structure). AnimatePresence view transitions. Auth guards: `LoginGate` (CiboMark + Shield icon + "Log in to access admin panel" → `setAuthView('login')`) when `user` is null, `AccessDeniedGate` (red Shield + "Access denied — admin only" + "Back to home" button calling `go('landing')`) when `user.role` is neither ADMIN nor SUPPORT. A "Live operations" pulse chip in the top bar.
  * `overview-view.tsx` — Refresh button + 12 KPI cards (Total users, Active users 7d mock, Verified providers, Today's orders, Today's GMV, Platform revenue, Meals rescued, Waste avoided kg, Active listings, Expired listings, Open complaints, Refunds) using `StatCard` with delta indicators. Two Recharts charts: `AreaChart` of orders last 7 days (orange gradient) + `BarChart` of revenue last 7 days (success green bars with rounded tops). Top providers by revenue list (ranked with #1 badge, business name, orders, rating, revenue). City breakdown list with horizontal bar chart per city (orange fill proportional to max). Recent activity feed combining the 10 latest orders + complaints + verifications (forest icon avatar, title, sub, status pill, `timeAgo`).
  * `users-view.tsx` — Searchable table with `useMemo`-filtered rows + role filter chips (All/Customer/Provider/Admin/Support with counts). Columns: avatar+name+email, RolePill, phone, status (active/suspended), joined date, provider link. Actions in a `DropdownMenu`: View profile (Dialog with avatar, role pill, status, user ID, phone, joined, provider profile card) and Suspend/Reinstate. Suspend action uses `AlertDialog` (red action button) and calls `adminApi.suspendUser`. Toast feedback on success/error. `useMutation` invalidates `["admin","users"]`.
  * `providers-view.tsx` — Searchable table + verification status filter chips (All/Verified/Pending/Under review/Rejected/Suspended). Columns: business (avatar+name+owner), city, type, VerificationPill, rating with stars, orders, revenue, meals. Actions in DropdownMenu: View details (Dialog with full business profile + stats + contact + address + documents list + bio + inline Verify/Reject/Suspend actions), Verify (calls `adminApi.verifyProvider(id, "VERIFIED")`), Reject (AlertDialog confirm → REJECTED), Suspend (AlertDialog confirm → SUSPENDED). Toast on each mutation.
  * `verification-view.tsx` — Focused queue of providers with PENDING/UNDER_REVIEW status (filtered from `adminApi.providers()`). Card grid (2 cols on lg). Each card: business avatar + name + VerificationPill + owner/type, meta grid (city, phone, email, FSSAI license), business address, submitted documents list, and footer actions: Approve (green button → VERIFIED), Request info (outline → UNDER_REVIEW), Reject (red outline → AlertDialog confirm → REJECTED). Empty state with BadgeCheck icon when queue is clear.
  * `listings-view.tsx` — Searchable table + status filter chips (All/Active/Sold out/Expired/Draft/Taken down with counts). Columns: image+title+foodType/fulfillment, provider, StatusBadge, qty remaining/initial, price (CIBO + strikethrough original + discount %), pickup deadline (red+bold if expired), city, created date. Rows with `bg-danger/5` for expired listings. Actions: View details (Dialog with image, status badge, discount tag, description, food safety fields, allergens, storage, packaging, special instructions, views/rescues/rating, takedown button), Take down (AlertDialog confirm → `adminApi.takedownListing`).
  * `orders-view.tsx` — Searchable table (by order number, customer, provider) + status filter chips (All + 7 statuses with counts). Columns: order # (mono), customer (avatar+name), provider, items count, total, OrderStatusPill, PaymentStatusPill, fulfillment type, date (timeAgo with full timestamp tooltip). Detail Dialog: status row (order + payment + fulfillment + paymentMethod), customer/provider cards with phone/email/city, items list with thumbnails, totals grid (subtotal/platform fee/delivery/discount/tax/total), **forest OTP card** with large gold OTP, delivery address, pickup start/deadline, customer notes, cancelled reason, payment reference.
  * `payments-view.tsx` — Derived from orders (payment records built via `useMemo`). 4 summary Stat cards: Total collected, Platform revenue, Refunds, Pending. Net revenue banner with avg order value. Export CSV button (top right). Search input + payment status filter chips. Table: order #, customer, provider, amount, method, PaymentStatusPill, txn ref (mono), date. Actions: Export row (full CSV) + Initiate refund (mock — AlertDialog confirm, 600ms delay, toast, invalidate). Uses `downloadCsv` helper.
  * `complaints-view.tsx` — Searchable table + status filter chips (All/Open/Investigating/Resolved/Rejected with counts). Columns: type+description (line-clamped), customer, provider, order ref, ComplaintStatusPill, filed (timeAgo). Actions: View details (Dialog with type pill, customer/provider/order/listing meta, description, evidence thumbnail grid, resolution panel if any, and contextual action buttons), Mark investigating (→ INVESTIGATING), Resolve (Dialog with resolution textarea → RESOLVED, requires text), Reject (→ REJECTED with default message). All mutations via `adminApi.resolveComplaint` with toast feedback.
  * `safety-view.tsx` — Operational safety console. 4 Stat cards: Total issues, Expired & active (red if >0), Missing storage info, Missing declaration. Orange safety incidents banner highlighting listings past their deadline. Filter chips: All listings / Expired & active / No storage info / Missing declaration. Table: listing (image+title+foodType/city), provider, status pill, pickup deadline (red+bold if expired), issues list (per-issue severity-colored chips: high=danger, med=gold, low=cream), suspend action. Suspends a listing via `adminApi.takedownListing` with AlertDialog confirm. Issues computed via `useMemo` from listing safety-relevant fields.
  * `reports-view.tsx` — Date range selector (Select: 7/30/90 days/All time + From/To date inputs with clear button). 4 summary Stat cards (Orders in range, GMV, Platform revenue, Meals rescued) computed from filtered orders. 4 report cards (Daily orders, Revenue, Meals rescued, Complaints) each generating a CSV download via the `downloadCsv` helper (Blob + temporary anchor). All-time platform totals preview panel at the bottom. All exports toast the filename + record count.
  * `analytics-view.tsx` — 4 KPI cards: Avg order value, Avg discount %, Refund rate, Cancellation rate (all computed from orders via `useMemo`). 3 insight cards: Top cities (top 3), Peak day (7d), Today's GMV. 6 Recharts charts: GMV trend (LineChart, orange), Revenue trend (AreaChart, success gradient), Orders by city (horizontal BarChart, orange), Orders by status (PieChart with 7-color CIBO palette + legend), Meals rescued trend (AreaChart, olive gradient), Complaints trend (LineChart, danger). All wrapped in `Panel` with subtitles. `ResponsiveContainer` for responsive sizing.
  * `settings-view.tsx` — Uses the **`key` prop pattern** to avoid `setState-in-effect`: parent `SettingsView` computes `initial` values from server data + `DEFAULTS`, builds a stable `key` string from the values, and remounts the inner `SettingsForm` whenever the underlying settings change. Form sections: Commission & fees (commission rate Select with 5/10/15/custom options + custom Input, platform flat fee, default delivery fee), Support contact (email + phone), Maintenance mode (Switch + Wrench icon + warning banner when enabled), and a "Current saved values" preview table of raw `key:value` rows from the server. Save all button iterates entries and chains mutations; each save also has a one-shot toast. `useMutation` invalidates `["admin","settings"]`.
- All data fetching via TanStack Query (`useQuery` / `useMutation` / `useQueryClient`). Mutations invalidate `["admin","users"]`, `["admin","providers"]`, `["admin","listings"]`, `["admin","complaints"]`, `["admin","settings"]`, `["admin","orders"]` as appropriate.
- Skeletons use `cibo-skeleton` (shimmer) and `TableSkeleton` while loading. Empty states use `CiboMark` mascot + helpful copy + CTA via `AdminEmptyState`.
- CIBO palette only (forest/cream/ivory/gold/orange/olive/success/danger) — no blue/purple. `font-display` (Fraunces) for headings. Recharts colors: orange #E48F24, gold #DFAF66, success #2F7A4A, olive #696C4D, danger #B23A2E, forest #1E3A28.
- Reused existing components aggressively: shadcn `Button`, `Input`, `Label`, `Textarea`, `Select`, `Switch`, `Table`, `Tabs`, `Dialog`, `AlertDialog`, `Sheet`, `DropdownMenu`, `Skeleton`; `CiboMark`, `StatusBadge` (from `../badges`); and re-exported `PageShell`, `Panel`, `StatCard`, `StatSkeleton`, `EmptyState`, `PageHeader`, `CHART_COLORS`, `VerificationPill` from `../provider/shared` so the admin views share the same component vocabulary as the provider surface.
- framer-motion used subtly: page-level AnimatePresence on admin-view change (fade + y), matching the provider app.
- Accessibility: aria-labels on all icon-only buttons, semantic HTML (`<nav aria-label>`, `<main>`, `<aside>`), keyboard-focusable controls (all actions are real `<button>` or shadcn primitives), alt text on all images with `/cibo-logo.svg` fallback via onError.

Critical fixes during lint passes:
- Initial draft of `settings-view.tsx` used `useEffect` to hydrate form state from server data — that tripped the `react-hooks/set-state-in-effect` lint rule. Refactored to the **`key` prop remount pattern**: parent computes `initial` + `key` from server data, child `SettingsForm` owns the form state and remounts whenever the underlying settings change. No effect, no setState-in-effect violation.
- Removed unused imports in `verification-view.tsx` (`Store`, `Star`, `fmtPrice`) and the `void X;` placeholder guards, in `safety-view.tsx` (`Package`, `discountPct`), and in `overview-view.tsx` (`TrendingUp` + its `void TrendingUp;` guard).
- Used `React.ReactNode` (already imported via React namespace) instead of `ReactNode` to avoid needing an extra named import in two files.

Verification:
- `bun run lint` → passes with ZERO errors and ZERO warnings.
- `bunx tsc --noEmit --skipLibCheck` → zero errors in any `src/components/cibo/admin/*` file. (Remaining project errors are pre-existing in `prisma/seed.ts`, `examples/*`, and `skills/*`, unrelated to this task.)
- Dev server (port 3000): root page returns 200 OK in ~70ms after the final compile. The transient "Module not found: Can't resolve './X-view'" entries in `dev.log` were from incremental compilation while files were still being written — the final compile (`✓ Compiled in 261ms`) succeeded and `GET /` returns 200.
- Smoke tested admin API endpoints used by the admin app: `GET /api/admin/overview`, `/users`, `/providers`, `/listings`, `/orders`, `/complaints`, `/settings` all return HTTP 401 for unauthenticated requests — exactly the expected behavior since they're guarded by `requireRole("ADMIN", "SUPPORT")`. Authenticated admin users (e.g. the `admin@test.com` seed account) will receive full data.

Files created (13 new + 1 overwritten):
- src/components/cibo/admin/shared.tsx                              (new — re-exports + admin-specific pills/skeletons/CSV helper)
- src/components/cibo/admin/admin-app.tsx                           (overwrote stub — app shell + dark sidebar + auth gates)
- src/components/cibo/admin/overview-view.tsx                       (new — 12 KPIs + 2 charts + top providers + city breakdown + activity feed)
- src/components/cibo/admin/users-view.tsx                          (new — search/filter table + detail dialog + suspend)
- src/components/cibo/admin/providers-view.tsx                      (new — search/filter table + detail dialog with documents + verify/reject/suspend)
- src/components/cibo/admin/verification-view.tsx                   (new — focused PENDING/UNDER_REVIEW queue + approve/reject/request info)
- src/components/cibo/admin/listings-view.tsx                       (new — search/filter table + detail dialog + takedown)
- src/components/cibo/admin/orders-view.tsx                         (new — search/filter table + detail dialog with OTP + items + addresses)
- src/components/cibo/admin/payments-view.tsx                       (new — derived payment records + summary cards + CSV export + mock refund)
- src/components/cibo/admin/complaints-view.tsx                     (new — search/filter table + detail dialog + investigating/resolve/reject)
- src/components/cibo/admin/safety-view.tsx                         (new — safety console + issue detection + suspend)
- src/components/cibo/admin/reports-view.tsx                        (new — date range + summary cards + 4 CSV report generators)
- src/components/cibo/admin/analytics-view.tsx                      (new — 4 KPI cards + 3 insights + 6 Recharts charts)
- src/components/cibo/admin/settings-view.tsx                       (new — commission/fees/support/maintenance mode + raw values preview)

Stage Summary:
- Full admin operations dashboard SPA delivered: 12 views (Overview with 12 KPIs + 2 charts + top providers + city breakdown + activity feed; Users with suspend; Providers with verify/reject/suspend + detail dialog; Verification queue; Listings with takedown; Orders with detail dialog + OTP; Payments with summary + CSV export + mock refund; Complaints with investigating/resolve/reject; Food Safety console with issue detection + suspend; Reports with CSV download; Analytics with 6 charts + 4 KPIs; Settings with commission/fees/support/maintenance), dark forest sidebar with grouped nav (Operations/Insights/System), mobile Sheet sidebar, TanStack Query data layer with mutation invalidation, framer-motion transitions, branded empty states with CiboMark mascot, AlertDialog confirmations on every destructive action, toast feedback on every mutation, and CSV export via Blob+anchor pattern. The dark forest sidebar visually distinguishes the admin surface from the customer/provider surfaces. Lint passes clean. The API, schema, and other surfaces were not modified.

---
Task ID: 10 (QA + Polish)
Agent: orchestrator
Task: End-to-end QA via agent-browser, fix auto-expiry bug, re-seed, create README + .env.example

Work Log:
- Built landing surface (hero, marquee, how-it-works, why-CIBO, food rescue preview, for customers, for partners, event rescue, food safety, impact, testimonials, FAQ, CTA, footer) and auth surface (login, signup, 3-step provider signup, forgot password)
- Dispatched 3 parallel subagents: customer app (15 views), provider dashboard (11 views), admin panel (13 views) — all completed with clean lint
- Created .env.example and README.md
- QA via agent-browser: verified landing renders, customer home + food cards + categories, listing detail with full food-safety section, cart with pickup-deadline warnings, checkout with payment methods, order placement (CIBO-2026-000127 + OTP 7220), order tracking stepper, provider order flow (Confirm → Ready → Verify OTP → Complete), admin overview KPIs, complaints, verification queue, settings
- BUG FOUND + FIXED: listings with passed pickup deadlines still showed as ACTIVE (DB status not updated), causing order POST to 400 ("has expired"). Fixed by adding auto-expiry in /api/listings (background updateMany + where pickupDeadline<=now) and /api/listings/[id] (inline status update). Also added where.pickupDeadline={gt:now} for ACTIVE filter so expired listings never appear available.
- Re-seeded with longer pickup windows (2-6 hours) so demo data stays fresh.

Stage Summary:
- Full application working end-to-end across all 4 surfaces (landing/auth/customer/provider/admin).
- All API endpoints tested green. Order lifecycle (transactional inventory, OTP, status transitions) verified.
- Auto-expiry now enforced at the API layer (listings auto-expire when pickup deadline passes; expired food is never purchasable).
- `bun run lint` passes with zero errors/warnings.
- Dev log shows no runtime errors after fixes.
- Demo credentials: admin@cibo.app/admin123, anbu@cibo.app/provider123, aarav@cibo.app/customer123.

---
Task ID: 11 (Scheduled cron)
Agent: orchestrator
Task: Schedule recurring webDevReview cron (every 15 min)

Work Log:
- Creating cron job with kind=webDevReview, fixed_rate 900s, to continuously assess/fix/improve the project.

---
Task ID: 12 (Final Polish + QA)
Agent: orchestrator
Task: Final polish, debounce fix, re-seed with long pickup windows, final QA

Work Log:
- Added debounce (350ms) to explore view query to prevent price-slider from firing a request on every change
- Extended all seed pickup windows from 2-6 hours to 21-36 hours so demo data stays fresh all day (the auto-expiry was causing all listings to expire within hours of seeding)
- Re-seeded database with fresh listings (6 active listings in Tirunelveli)
- VLM visual inspection of landing page: rated A- ("Polished, premium, highly credible... looks like a real product")
- Verified rescue view now shows live listings
- Final lint: zero errors, zero warnings
- Final dev log: no runtime errors

Stage Summary:
- CIBO is complete and fully functional across all 4 surfaces (landing, auth, customer, provider, admin)
- All major user journeys verified end-to-end via agent-browser:
  * Customer: browse → listing detail → cart → checkout → order placement → OTP → order tracking
  * Provider: dashboard → orders → confirm → mark ready → verify OTP → complete
  * Admin: overview KPIs → complaints → verification queue → settings
- Auto-expiry enforced at API layer (expired food never purchasable)
- Transactional inventory (race-condition safe)
- Cron job scheduled: webDevReview every 15 minutes (job_id: 405297)

Unresolved/Next-phase recommendations:
- The webDevReview cron will continue improving styling and adding features every 15 min
- Potential next features: real payment gateway integration, maps, push notifications, delivery rider system, provider mobile app
- Demo data expires daily; the cron or a re-seed will refresh it

---
Task ID: 14 (Cron Review Round 2)
Agent: webDevReview cron
Task: QA, fix distance bug, add recently-viewed + live order ticker, improve food card hover

## Current Project Status Assessment
- All 4 surfaces (landing/auth/customer/provider/admin) fully functional
- Round 1 features verified working: provider reviews on listing detail, customer rescue impact stats, humanized deadline chips, 7-day historical orders
- Dev server healthy, 6 active listings, stats endpoint fixed and returning proper data
- Clean lint maintained throughout

## Bugs Found & Fixed
1. **Listing detail showed "0.0 km" distance** — the /api/listings/[id] endpoint didn't compute distance from user location. FIXED: added lat/lng query param parsing + haversineKm distance computation. Also updated listingApi.get() client to accept lat/lng and listing-view to pass them. Now shows correct distance (e.g. "1.15 km").
2. **recently-viewed.ts lint error** — used setState in effect (react-hooks/set-state-in-effect rule). FIXED: rewrote with useSyncExternalStore (the proper React pattern for external stores) with snapshot caching to avoid re-parsing.

## New Features Added
1. **Recently-viewed listings on customer home** — new /lib/recently-viewed.ts module using localStorage + useSyncExternalStore. When a customer opens a listing, it's added to their recently-viewed history. The home page now shows a "Recently viewed" horizontal scroll section (between Best Deals and CTA) with mini food cards showing image, discount badge, title, provider, and price. Includes a "Clear" button. Persists across sessions.
2. **Admin live order ticker** — new LiveOrderTicker component on the admin overview, showing the 8 most recent orders in a horizontally scrolling band with: animated "live" pulse dot, "LIVE ORDERS · real-time feed · scroll →" header, order cards (order number, status badge with color coding, customer name, provider, total), right-edge fade gradient to hint scrollability. Dark forest background matches admin sidebar.

## Styling Improvements
1. **Food card hover "View details" overlay** — slides up from the bottom of the food image on hover, with a cream pill "View details →" button. Adds tactile feedback and improves discoverability.
2. **Admin ticker fade gradient** — right-edge gradient fade from forest to transparent hints at horizontal scrollability.
3. **Admin ticker scroll hint** — "scroll →" text in the header.
4. **DeadlineChip 3-tier urgency** (from round 1, verified working) — danger ≤30m, orange 31-90m, gold >90m.

## Verification Results
- `bun run lint` — zero errors, zero warnings ✓
- Recently-viewed section verified: shows "Veg Meals" card with 58% OFF badge, title, provider, prices after viewing a listing ✓
- Admin live order ticker verified: shows CIBO-2026-000120 (READY), 000121 (CONFIRMED), 000122 (COMPLETED), 000200, 000211, etc. with customer names, providers, totals ✓
- Listing distance fix verified: shows "1.15 km" instead of "0.0 km" ✓
- Stats endpoint verified: returns totalOrders:9, completedOrders:7, totalSpent:1325, totalSaved:1770, mealsRescued:20, co2AvoidedKg:8, topProviders with order counts ✓
- Reviews section verified: shows 5.0 average, 2 reviews, distribution bars, review cards with customer names and comments ✓

## Unresolved Issues / Next Phase Recommendations
- Some food images have watermarks (shutterstock) — could be replaced with cleaner stock photos in a future round
- Could add: provider listing performance insights (views→conversion rate), customer order history timeline, admin real-time WebSocket notifications
- Demo data refresh: listings expire daily; consider auto-reseed logic
- Landing page hero could use more parallax/depth effects
- Mobile bottom nav could show badges (e.g. cart count already shown, could add notification count)

---
Task ID: 15 (Cron Review Round 3)
Agent: webDevReview cron
Task: QA, add provider conversion insights, customer rescue journey, landing hero parallax, styling

## Current Project Status Assessment
- All 4 surfaces fully functional and stable
- Rounds 1-2 features verified working (reviews, impact stats, recently-viewed, live ticker, humanized deadlines, distance fix)
- Dev server healthy, 6 active listings, clean lint
- Provider analytics charts now properly populated with 7-day historical data

## New Features Added
1. **Provider listing performance insights (conversion rate)** — each listing card in the provider's Active Listings view now shows a "Rescue conversion" insight bar: rescues/views as a percentage, a gold-to-orange gradient progress bar, and contextual advice ("Excellent conversion" ≥30%, "Good conversion" 10-30%, "Low conversion" <10% with actionable tips). Also added "views" and "rescues" labels to the meta row for clarity.
2. **Customer rescue journey timeline on orders** — the orders page now displays a dark forest gradient banner at the top showing 4 journey stats: Meals rescued, Money saved, CO₂ avoided, and Avg order value — with gold icon circles on ivory-tinted cards. Uses the existing /api/orders/stats endpoint.
3. **Landing hero mouse parallax** — the mascot and two floating cards now respond to mouse movement with spring-based parallax (mascot moves ±12px, floating cards move ±18-20px in opposite directions). Added decorative semi-transparent food emojis (🍽️ 🥘 🍛 🥗) floating in the hero background with staggered animation delays.

## Styling Improvements
1. **Provider listing cards** — richer meta row with labeled "views"/"rescues", plus the new conversion insight panel with gradient bar and advice text
2. **Customer orders journey banner** — premium dark forest gradient with gold accents, 4-column responsive grid
3. **Landing hero depth** — parallax layers + decorative food emojis add visual depth and life
4. **Contextual advice** — conversion rate advice text gives providers actionable insight

## Verification Results
- `bun run lint` — zero errors, zero warnings ✓
- Provider conversion insights verified: shows "RESCUE CONVERSION" with "Low conversion..." and "Good conversion..." advice ✓
- Customer rescue journey verified: shows "YOUR RESCUE JOURNEY" with MEALS RESCUED, MONEY SAVED, CO₂ AVOIDED, AVG ORDER ✓
- Landing hero parallax verified via VLM: mascot + floating cards + decorative emojis visible, "premium layout" ✓
- No runtime errors in dev log ✓

## Unresolved Issues / Next Phase Recommendations
- Replace watermarked stock food images with cleaner ones
- Could add: real-time WebSocket notifications, delivery rider tracking UI, provider mobile app
- Could add: customer "share rescue" social feature, admin bulk operations, provider schedule/calendar
- Consider auto-reseed logic for expiring demo data
- Landing page could add a live stats counter animation on the impact section
