# Launching MOTION X

A step-by-step checklist for the first production deployment. Steps marked
**(owner)** need someone with access to the accounts involved; nothing here is
done automatically by the codebase.

## 1. Accounts you need

| Service | Why | Cost to start |
|---|---|---|
| [Supabase](https://supabase.com) | Accounts, listings, enquiries, photo storage, admin | Free tier is enough to launch; upgrade for backups and higher limits |
| [Vercel](https://vercel.com) | Hosting, HTTPS, daily exchange-rate cron | Hobby is free but for non-commercial use; a commercial marketplace needs **Pro** |
| A domain registrar | Your own domain (optional — `*.vercel.app` works) | Varies |
| GitHub (or GitLab/Bitbucket) | Vercel deploys from a Git repository | Free |
| Optional: [Plausible](https://plausible.io) | Cookieless analytics | Paid |

## 2. Environment variables

Set these in **Vercel → Project → Settings → Environment Variables** (Production).
Never commit real values; `.env.local` is git-ignored for local use.

### Required for a working marketplace

| Variable | Value | Exposed to browser? |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | Your public URL, e.g. `https://motionx.com` (no trailing slash). Used for canonical URLs, the sitemap and links in confirmation / password-reset emails. | Yes (not secret) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API → Project URL | Yes (not secret) |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable key (`sb_publishable_…`) or legacy anon key | Yes (safe: Row Level Security protects data) |
| `NEXT_PUBLIC_SHOW_DEMO_INVENTORY` | `false` in production | Yes |
| `RATE_LIMIT_SALT` | A long random string (e.g. `openssl rand -hex 32`) | **No — secret** |

### Required for exchange-rate conversion (optional feature)

| Variable | Value | Secret? |
|---|---|---|
| `EXCHANGE_RATES_PROVIDER` | `open-er-api` (includes AED) or `frankfurter` | No |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service-role / secret key — used **only** by the cron job | **Yes — never prefix with `NEXT_PUBLIC_`** |
| `CRON_SECRET` | A long random string; Vercel Cron sends it automatically | **Yes** |

### Optional

`NEXT_PUBLIC_CONTACT_EMAIL`, `NEXT_PUBLIC_DISPLAY_CURRENCIES` (default `USD,EUR,GBP,AED`),
`NEXT_PUBLIC_PLAUSIBLE_DOMAIN`, `NEXT_PUBLIC_PLAUSIBLE_SRC`, and the four
`NEXT_PUBLIC_SOCIAL_*` links (each footer link appears only when set).

A production build prints `⚠ MOTION X config:` warnings for anything important that is missing.
`NEXT_PUBLIC_*` values are baked in at build time — **redeploy after changing them**.

## 3. Database setup (owner)

1. Create a Supabase project in the region closest to most buyers.
2. Apply the migrations **in order** (Supabase CLI `supabase link` + `supabase db push`, or paste each into the SQL editor):
   1. `supabase/migrations/20261009000000_core_schema.sql`
   2. `supabase/migrations/20261009000100_storage.sql`
   3. `supabase/migrations/20261009000200_showroom_assets.sql`
3. **Do not run `supabase/seed.sql` in production.** It is fictional demonstration data for local/staging databases.
4. Authentication → URL configuration: set **Site URL** to `NEXT_PUBLIC_SITE_URL` and add `https://<your-domain>/auth/callback` to **Redirect URLs** (add the `*.vercel.app` URL too while testing).
5. Authentication → keep **Confirm email** on. Configure a custom SMTP sender before launch — Supabase's built-in email service is rate-limited and meant for testing.
6. Sign up on the live site with your own email, then make yourself an administrator (SQL editor):
   ```sql
   insert into public.admin_users (user_id, note)
   select id, 'founder' from auth.users where email = 'you@example.com';
   ```
7. Run Supabase's **Security Advisor** and **Performance Advisor** and review any findings.

## 4. Deploy to Vercel (owner approval required)

1. Push this repository to GitHub (private is fine).
2. Vercel → **Add New Project** → import the repository. Framework preset: **Next.js**; root directory: the folder containing `package.json`. No build-command changes are needed.
3. Add the environment variables from §2, then **Deploy**.
4. The daily cron in `vercel.json` (`/api/cron/exchange-rates`, 05:15 UTC) activates automatically; it does nothing until the exchange-rate variables are set.

## 5. Custom domain (owner)

1. Vercel → Project → **Domains** → add your domain and follow the DNS records Vercel shows (A/CNAME at your registrar). HTTPS certificates are automatic.
2. Update `NEXT_PUBLIC_SITE_URL` and Supabase's Site URL / Redirect URLs to the new domain, then redeploy.

## 6. Smoke test after deploying

Nothing below can be verified without a live Supabase project, so test each item once:

- [ ] Sign up → confirmation email arrives → link signs you in (`/auth/callback`)
- [ ] Sign in / sign out; "forgot password" email → reset works
- [ ] Buyer: save a vehicle, see it under Account → Saved
- [ ] Seller: become a seller, create a draft listing, upload and reorder photos, submit for review
- [ ] Admin (`/admin`): approve the listing; it appears on `/cars`
- [ ] Another account sends an enquiry; the seller sees and replies to it in the dashboard
- [ ] Report a listing; it appears in Admin → Reports
- [ ] A non-admin account gets a 404 at `/admin`
- [ ] `/sitemap.xml` and page metadata use your real domain
- [ ] Optional: trigger the cron once (`curl -H "Authorization: Bearer $CRON_SECRET" https://<domain>/api/cron/exchange-rates`)

## 7. Before calling it "launched"

- Have a lawyer review `/privacy` and `/terms` for each market you serve.
- Decide on transactional email notifications (none are sent today — sellers check their dashboard).
- Enable Supabase backups (paid plans) and set up an uptime monitor.
