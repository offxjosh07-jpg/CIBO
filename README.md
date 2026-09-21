# CIBO — Good Food. Brighter Tomorrow.

**CIBO** is a hyperlocal surplus-food rescue marketplace. Verified food providers (wedding caterers, restaurants, bakeries, hotels, cloud kitchens, canteens, event organizers) list safe surplus food at discounted prices. Nearby customers discover, reserve, pay for and collect it before the pickup deadline — turning would-be waste into value.

> **RESCUE · SHARE · REDUCE**

CIBO is **not** another food-delivery clone. It's a new category: a real-time hyperlocal food rescue marketplace, pickup-first, with structured food-safety declarations, honest reference pricing, transparent halal status, and automatic listing expiry.

---

## Features

### Customer experience
- Home with location-aware food rescue feed, categories & deals
- Explore with filters (distance, veg/non-veg, halal verified, price, discount, sort)
- **Rescue Near You** real-time view with urgency indicators
- Listing detail with full **Food Safety Information** section
- Cart grouped by provider with pickup-deadline warnings
- Checkout (UPI / Card / Net Banking / Wallet — mock gateway)
- Order tracking with vertical stepper + pickup **OTP**
- Favorites, addresses, notifications, profile & food preferences
- "Show only Halal verified food" filter

### Provider dashboard
- Dashboard with today's rescued meals, revenue, active listings, waste avoided
- **5-step Create Listing wizard** (food details → quantity & pricing → food safety → pickup → preview)
- Inventory with inline quantity editing & low-stock alerts
- Orders with status advancement + **OTP verification** to complete
- Earnings with commission breakdown
- Analytics (orders/revenue/top foods charts, AOV, cancellation rate)
- Profile, verification status & document upload
- Support

### Admin panel
- Overview KPIs (users, providers, GMV, platform revenue, meals rescued, waste avoided)
- Users management (suspend / reinstate)
- Providers & verification queue (approve / reject / request info)
- Listings management (takedown)
- Orders & payments (with CSV export)
- Complaints resolution
- **Food Safety console** (expired-active detection, missing declarations)
- Reports (CSV downloads)
- Analytics charts
- Settings (commission rate, fees, support contacts)

### Cross-cutting
- Role-based auth (CUSTOMER / PROVIDER / ADMIN / SUPPORT) with httpOnly session cookies
- Transactional inventory (race-condition safe order placement, auto SOLD_OUT at 0)
- Automatic listing **expiry** when pickup deadline passes
- Branded design system (forest green / cream / gold / orange)
- Mobile-first with bottom navigation; desktop sidebars
- Skeleton loaders, empty states, toast feedback, micro-interactions

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) + TypeScript 5 |
| Styling | Tailwind CSS 4 + shadcn/ui (New York) |
| Database | Prisma ORM + SQLite (sandbox) |
| State | Zustand (app/cart), TanStack Query (server) |
| Charts | Recharts |
| Auth | Custom JWT-session in httpOnly cookies (PBKDF2 password hashing) |
| Icons | lucide-react |
| Animation | Framer Motion |

> **Note on database:** The spec calls for PostgreSQL. This sandbox runs **SQLite** (Prisma client only). The schema is normalized and indexes/constraints are defined so swapping the Prisma `datasource` to PostgreSQL is a one-line change plus `db:push`.

---

## Architecture

```
src/
  app/
    api/                      Next.js Route Handlers (REST)
      auth/                   login, signup, provider-signup, me, logout
      categories/             food categories
      listings/               public catalog + safety
      provider/               provider listings, orders, profile, analytics
      orders/                 customer order lifecycle (transactional)
      favorites/  addresses/  notifications/  complaints/  reviews/
      admin/                  overview, users, providers, listings, orders,
                              complaints, settings + mutations
      _lib/helpers.ts         shared API helpers (sanitizeUser, listing includes)
    page.tsx                  Single client SPA entry — switches surfaces
    layout.tsx                Root layout (fonts, metadata, toaster)
    globals.css               CIBO design system (palette, utilities)
  lib/
    db.ts                     Prisma client
    auth.ts                   password hashing, sessions, OTP, order numbers
    api.ts                    requireUser/requireRole, ok/err, haversine, rate limit
    api-client.ts             typed frontend API client
    store.ts                  Zustand stores (useApp, useCart, useUi)
    types.ts                  shared TypeScript types
    utils.ts                  formatting helpers (client-safe)
  components/
    providers.tsx             QueryClientProvider + AuthProvider + useAuth
    cibo/
      logo.tsx                CIBO logo/mascot components
      badges.tsx              Veg/Halal/Rescue/Status/Discount badges
      food-card.tsx           FoodCard + skeleton
      landing/                marketing landing surface
      customer/               customer app (15 views)
      provider/               provider dashboard (11 views)
      admin/                  admin panel (13 views)
prisma/
  schema.prisma               full normalized schema
  seed.ts                     demo data (admin, providers, customers, listings, orders)
public/
  cibo-logo.svg               CIBO mascot logo
  cibo-wordmark.svg           logo + wordmark
  favicon.svg                 app icon
```

### Single-route SPA
The sandbox exposes only the `/` route. The app is a client-side SPA that switches "surfaces" (landing / auth / customer / provider / admin) and "views" within each surface via the Zustand `useApp` store. Backend logic lives in `/api/*` Route Handlers.

### Authentication
- PBKDF2 password hashing (100k iterations, SHA-512, 64-byte hash).
- Session token stored in an `httpOnly` `cibo_session` cookie; server-side `Session` table.
- `requireUser()` / `requireRole()` middleware on every protected route.
- Rate limiting on auth endpoints (IP-keyed).

### Inventory & orders
- Order creation runs inside `db.$transaction`, re-reading each listing inside the transaction to prevent oversell / race conditions.
- Quantity decremented atomically; `SOLD_OUT` set automatically at 0.
- Cancelled orders restore inventory (transactional).
- Pickup OTP generated per order; provider verifies to mark `COMPLETED`.

### Food safety
- Every listing has a linked `FoodSafetyReport` (prep time, packing time, storage, packaging, allergens, handling declaration, signed safety declaration).
- Listings auto-expire when `pickupDeadline` passes — expired food is never purchasable.
- Admin Food Safety console flags risky listings.

### Halal transparency
Three states, never fabricated:
- `VERIFIED` — provider's claim verified by admin against documentation
- `DECLARED` — provider states halal but not verified
- `UNSPECIFIED` — not stated
Customers can filter to "Halal verified only".

---

## Installation

```bash
# Install dependencies
bun install

# Copy env
cp .env.example .env

# Create the database & generate the client
bun run db:push

# Seed demo data (admin, providers, customers, listings, orders)
bun run prisma/seed.ts
```

### Demo credentials

| Role | Email | Password |
|---|---|---|
| Admin | admin@cibo.app | admin123 |
| Provider | anbu@cibo.app | provider123 |
| Customer | aarav@cibo.app | customer123 |

(Support: support@cibo.app / support123. Additional providers: spice@cibo.app, crust@cibo.app, ganga@cibo.app, veltech@cibo.app, royalfeast@cibo.app — all `provider123`. Additional customers: meena@cibo.app, rahul@cibo.app, sara@cibo.app — all `customer123`.)

---

## Development

```bash
bun run dev      # start dev server on http://localhost:3000
bun run lint     # ESLint
bun run db:push  # apply schema changes
bun run prisma/seed.ts   # re-seed (wipes & recreates demo data)
```

> **Preview:** In the sandbox, view the app via the **Preview Panel** on the right (or "Open in New Tab"). Do not navigate to `localhost:3000` directly.

---

## API overview

All endpoints return JSON. Protected routes require the `cibo_session` cookie.

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/auth/login` `/signup` `/provider-signup` `/logout` | Auth |
| GET | `/api/auth/me` | Current user |
| GET | `/api/categories` | Categories |
| GET | `/api/listings` | Search/filter listings (city, lat/lng, radius, q, foodType, halal, category, isEvent, sort, maxPrice, minDiscount, pagination) |
| GET | `/api/listings/:id` | Listing detail (increments views) |
| GET | `/api/listings/:id/safety` | Food safety report |
| GET/POST/PATCH/DELETE | `/api/provider/listings[/:id]` | Provider CRUD |
| GET | `/api/provider/orders` | Provider orders |
| PATCH | `/api/provider/orders/:id/status` | Advance order status |
| GET/PATCH | `/api/provider/me` | Provider profile |
| GET | `/api/provider/analytics` | Provider analytics |
| POST | `/api/orders` | Create order (transactional) |
| GET | `/api/orders` `/api/orders/:id` | Customer orders |
| PATCH | `/api/orders/:id/cancel` `/api/orders/:id/verify-otp` | Order lifecycle |
| GET/POST | `/api/favorites` | Favorites toggle |
| GET/POST/DELETE | `/api/addresses[/:id]` | Addresses |
| GET | `/api/notifications` · POST `/api/notifications/read` | Notifications |
| GET/POST | `/api/complaints` | Complaints |
| POST | `/api/reviews` | Reviews |
| GET | `/api/admin/overview` | Admin dashboard |
| GET | `/api/admin/users` `/providers` `/listings` `/orders` `/complaints` | Admin lists |
| PATCH | `/api/admin/providers/:id/verify` | Verify provider |
| PATCH | `/api/admin/users/:id/suspend` | Suspend user |
| PATCH | `/api/admin/listings/:id/takedown` | Takedown listing |
| PATCH | `/api/admin/complaints/:id` | Resolve complaint |
| GET/POST | `/api/admin/settings` | Platform settings |

---

## Security notes

- Passwords hashed with PBKDF2 (never plaintext, never returned in responses).
- Session tokens in `httpOnly`, `sameSite=lax` cookies.
- Role checks enforced server-side on every protected route (`requireRole`).
- Input validation on all mutations; `zod`-style checks in route handlers.
- Rate limiting on auth endpoints.
- Transactional inventory prevents oversell / race conditions.
- No raw card details stored (mock gateway; Razorpay/Stripe drop-in ready).
- Secrets via environment variables (see `.env.example`).
- File/document uploads are URL-referenced (storage service pluggable).

---

## Production build & deployment

```bash
bun run build    # standalone build
bun run start    # production server
```

Deployment targets: Vercel, Docker, or any Node host. For production, swap `DATABASE_URL` to PostgreSQL and provide real `PAYMENT_API_KEY`, `MAPS_API_KEY`, `EMAIL_API_KEY`, `SMS_API_KEY`, `STORAGE_API_KEY`.

---

## Roadmap (drop-in ready)
- Real payment gateway (Razorpay/Stripe) — replace mock in `src/app/api/orders/route.ts`
- Real Maps (Google Maps / Mapbox) — abstracted behind listing distance fields
- Delivery rider system (states already modelled: SEARCHING_RIDER → DELIVERED)
- Push notifications / SMS OTP
- Provider mobile app

---

© CIBO. Rescue · Share · Reduce.
