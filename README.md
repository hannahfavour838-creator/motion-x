# MOTION X — The world is your showroom

A premium international automotive marketplace with a cinematic real-time 3D hero, an interactive 3D showroom, real search and filtering, buyer accounts, private-seller and dealership tools, and a moderated administration area.

**Stack:** Next.js 16 (App Router, Turbopack) · React 19 · TypeScript · Tailwind CSS 4 · Three.js · React Three Fiber · drei · GSAP + ScrollTrigger · Supabase (Auth, Postgres, Storage) · Vercel.

---

## Quick start

```bash
npm install
cp .env.example .env.local     # optional — the site runs without it
npm run dev                    # http://localhost:3000
```

Without Supabase credentials the app runs in **preview mode**: the marketplace, search, filters, vehicle pages, collections, compare and the 3D showroom all work against clearly-labelled **demonstration inventory**. Accounts, enquiries, seller tools and admin show an explanatory notice until Supabase is configured.

| Command | What it does |
|---|---|
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build / server |
| `npm run lint` · `npm run typecheck` | ESLint · TypeScript |
| `npm run db:test` | Applies all migrations + seed to a throwaway local PostgreSQL and runs the security test suite |
| `npm run test:e2e` | Playwright end-to-end tests (`BASE_URL=http://localhost:3000`; set `CHROMIUM_PATH` if needed) |
| `npm run test:unit` | Unit tests for security helpers (safe redirects) |
| `npm run test:a11y` | axe-core WCAG 2.1 A/AA audit of public pages at desktop and mobile widths (`BASE_URL`, `CHROMIUM_PATH`) |
| `npm run seed:generate` | Regenerates `supabase/seed.sql` from the demo inventory |
| `npm run admin:grant -- you@example.com` | Grants admin rights (needs the service-role key) |
| `npm run photos` | Downloads the demo-listing photographs listed in `tools/photos/manifest.mjs` from Wikimedia Commons, blurs plates, crops and writes WebP + credits |
| `npm run renders` | Re-renders the hero/showroom fallback stills of the 3D concept car |

---

## Configure Supabase

1. Create a project at [supabase.com](https://supabase.com). Copy the **Project URL**, the **publishable (or anon) key** and the **service-role key** into `.env.local` (see `.env.example`).
2. Apply the migrations in order — with the Supabase CLI (`supabase link` then `supabase db push`) or by pasting each file into the SQL editor:
   - `supabase/migrations/20261009000000_core_schema.sql` — tables, triggers, RLS policies, search function
   - `supabase/migrations/20261009000100_storage.sql` — `vehicle-images` and `dealer-logos` buckets + policies
   - `supabase/migrations/20261009000200_showroom_assets.sql` — the licensed 3D concept-car asset
3. **Development only:** load demo inventory with `supabase/seed.sql`, and set `NEXT_PUBLIC_SHOW_DEMO_INVENTORY=true`. Do not run the seed in production. Remove demo data any time with
   `delete from auth.users where email like '%@demo.motionx.invalid';`
   If you loaded an older seed (with `/renders/demo/` images), run that delete and re-run `supabase/seed.sql` to pick up the photographs.
4. **Auth settings** (Dashboard → Authentication):
   - Site URL: your `NEXT_PUBLIC_SITE_URL`; add `https://your-domain/auth/callback` to Redirect URLs.
   - Keep email confirmation on. The default templates work (PKCE `?code=`); token-hash templates pointing at `/auth/callback?token_hash={{ .TokenHash }}&type=…` also work.
5. **Make yourself an administrator** (admin rights can only be granted out-of-band):
   ```sql
   insert into public.admin_users (user_id, note)
   select id, 'founder' from auth.users where email = 'you@example.com';
   ```
   or `npm run admin:grant -- you@example.com`.

### Security model

- **Row Level Security on every table.** The public sees only `active`/`sold` listings from active sellers. Enquiries and inspection requests are readable only by the buyer, the receiving seller and admins. Buyer profiles and private contact data are never public.
- **Privileged columns are guarded by triggers**, so a client cannot self-approve a listing, mark it featured/inspected/demo, change its seller, self-verify, or grant itself admin — whatever it sends. Admin status lives in `admin_users`, which no client can write.
- **Moderation is enforced in the database.** New listings start as drafts or `pending_review`; material edits to a live listing return it to review (`platform_settings.listing_moderation` = `required` | `auto`). Every status change is written to `moderation_actions`.
- **Server actions re-check the session**; the service-role key is used only by the exchange-rate cron job and the admin script.
- **Abuse controls:** honeypot + minimum time-to-submit on public forms, a per-IP limiter in server actions, and authoritative per-email/per-account rate limits inside Postgres (`private.consume_rate_limit`, not exposed via the API).
- **Uploads:** images go straight to Supabase Storage through short-lived signed URLs into the uploader's own folder; buckets enforce size (10 MB) and MIME types; the database rejects image rows outside the seller's folder.

`npm run db:test` exercises all of this against real PostgreSQL (75 assertions; Supabase's `auth`/`storage` schemas are stubbed — see `supabase/tests/00_supabase_stubs.sql`).

---

## Exchange rates (optional)

Original asking prices are always shown unchanged in the seller's currency. To enable clearly-labelled estimates and cross-currency price filtering/sorting:

- Set `EXCHANGE_RATES_PROVIDER=open-er-api` (ExchangeRate-API open access — includes AED) or `frankfurter` (ECB reference rates — no AED).
- Set `SUPABASE_SERVICE_ROLE_KEY` and `CRON_SECRET`. `vercel.json` schedules `/api/cron/exchange-rates` daily; it stores rates and recalculates each listing's USD reference price.

Without a provider, the price filter compares listings in the selected currency only, and says so on the page.

## Analytics (optional)

Set `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` to enable cookieless Plausible analytics. Events: `search`, `listing_view`, `enquiry_submitted`, `inspection_requested`, `buyer_signup`, `seller_signup`, `listing_submitted`, `dealer_onboarding`, `showroom_open`. No personal data is sent; visitors can opt out at `/cookies`.

---

## Deploy to Vercel

**Full launch checklist (accounts, every environment variable, database, domain and post-deploy smoke test): [DEPLOYMENT.md](DEPLOYMENT.md).**

1. Push the repository and import it in Vercel (framework preset: Next.js).
2. Add the environment variables from `.env.example` (at least the Supabase URL/key and `NEXT_PUBLIC_SITE_URL`).
3. Deploy. The daily cron in `vercel.json` activates automatically when `CRON_SECRET` is set.
4. In Supabase Auth, add the production URL to Site URL / Redirect URLs.

`/models/*` is served with immutable caching — if you replace the GLB, give it a new filename and update `vehicle_3d_assets.url`.

---

## 3D assets & imagery

| Asset | Source | Licence | Action needed |
|---|---|---|---|
| `public/models/concept-car.glb` (hero + showroom) | “Car Concept” by Eric Chadwick / Darmstadt Graphics Group GmbH (2024), from the Khronos glTF-Sample-Assets repository, based on a CC0 model by “Unity Fan” | **CC BY 4.0** — attribution required | Keep the credit on `/credits` and the showroom page. Khronos logo surfaces were removed; textures recompressed (WebP, 1024 px) and geometry meshopt-compressed: 11.8 MB → 3.4 MB. |
| `public/photos/demo/*`, `public/photos/banners/*` | Wikimedia Commons photographs of the same make, model and generation as each demo listing (author and licence per file in `src/lib/demo/photos.generated.json`) | CC BY / CC BY-SA / public domain | Credited under each photo and on `/credits`. Labelled "Representative photo — not the vehicle listed". Plates blurred, cropped/extended to 3:2, WebP. Regenerate with `npm run photos`. |
| `public/renders/hero-fallback*.webp`, OG image | Captured from the live hero scene (`tools/qa/capture-poster.mjs`) | Derived from the CC BY model | — |

**Adding a 3D model to a listing:** upload a licensed `.glb` (meshopt or uncompressed; not Draco), insert a `vehicle_3d_assets` row with credit/licence and supported `paint_options`, then set `vehicles.asset_id`. Only listings with an asset show the 3D action. Paint swatches appear only when the asset declares them; the runtime recolours materials whose names start with `Paint 1`.

---

## Project structure

```
src/app/(site)/          Pages: home, /cars, /cars/[slug], /collections, /showroom, /sell, /dealers,
                         /account, /dashboard, /admin, auth & legal pages
src/app/actions/         Server actions (public forms, auth, seller tools, admin)
src/app/api/cron/        Exchange-rate job
src/components/          Design system (ui/), home, vehicles, three (R3F), dashboard, admin, forms
src/config/              Site, markets (countries/currencies), vehicle taxonomy & collections
src/lib/data/            Data access (Supabase or demo backend), mappers
src/lib/                 Auth (DAL), validation (zod), rates, rate limiting, analytics
supabase/                Migrations, seed, database tests
tools/photos/            Demo-listing photo pipeline (Commons → plates blurred → WebP + credits)
tools/studio-renderer/   Renderer for the 3D concept car's fallback stills
tools/qa/                Playwright E2E tests, screenshots, poster capture
```

---

## What has been tested

- **Database (PostgreSQL 16):** migrations + seed apply cleanly; 75 security/workflow assertions pass (RLS visibility, guarded columns, moderation transitions, enquiry routing, rate limits, verification, suspensions, storage paths, search incl. prefix, cross-currency and mileage filters, seller analytics).
- **App (production build, preview mode):** 37 Playwright tests — hero (live WebGL and model-failure fallback), navigation, quick search, combined filters, chip removal, sorting, year/transmission/mileage filters, pagination, sold availability, empty state, vehicle page (gallery, noindex for demo), server-side form validation, report dialog, compare, save prompt, private-route redirects, admin 404, 3D showroom controls, robots/sitemap/OG, 404s, mobile overflow on 9 pages, mobile menu and filters, no-WebGL fallbacks, no uncaught errors.
- `npm run lint`, `npm run typecheck` and `npm run build` pass.

## Not yet verified / remaining work

- **Live Supabase integration was not exercised end-to-end** in the build environment (PostgREST/Auth could not be run there). The SQL is tested on Postgres and the client code type-checks, but sign-up/sign-in, listing CRUD, photo upload via signed URLs, enquiries, favourites and admin actions must be smoke-tested against a real Supabase project before launch.
- **No email notifications** (new enquiry, listing approved, reply received) — sellers check their dashboard. Add Supabase database webhooks or a transactional email provider.
- **Verification is a manual review workflow** — there is no automated KYC/companies-registry integration, and document upload is intentionally not collected in-app.
- **Per-IP rate limiting is per server instance**; the authoritative limits are in Postgres. Use a shared store (e.g. Upstash Redis) for multi-region traffic.
- **Account deletion/export** is handled by request (`/contact`), not self-service.
- **Privacy policy and terms are drafts** and must be reviewed by a lawyer for each market.
- **Performance scores were not measured** with Lighthouse on real hardware; the 3D bundle is code-split and the hero poster is the LCP element.
- Paint options for uploaded GLBs depend on material naming conventions; arbitrary models may need a mapping.
