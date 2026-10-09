-- ════════════════════════════════════════════════════════════════════════════
-- MOTION X — security hardening (additive)
-- Applies on top of 20261009000000_core_schema, …0100_storage, …0200_showroom.
-- Nothing here disables RLS, widens a policy or grants new privileges to
-- anon/authenticated. Every statement is idempotent (create or replace,
-- drop … if exists, alter … set, revoke/grant, deterministic updates), so
-- re-applying this file leaves the database in the same state.
-- Do not wrap in BEGIN/COMMIT: the Supabase CLI and SQL editor already run
-- each migration file in a single transaction.
-- ════════════════════════════════════════════════════════════════════════════


-- ─── 1. USD reference price cannot be set by clients ───────────────────────
-- guard_vehicle() only recalculates price_reference_usd when price or currency
-- changes, and does not protect the column, so an untrusted seller could
-- PATCH it directly to win "price: low to high" and cross-currency filters.
-- A second BEFORE trigger (fires after "vehicles_guard": triggers run in name
-- order) always derives the value from price + currency + exchange_rates.

create or replace function private.sync_price_reference()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.price_reference_usd := public.price_to_usd(new.price, new.currency);
  return new;
end;
$$;

drop trigger if exists vehicles_price_reference on public.vehicles;
create trigger vehicles_price_reference
  before insert or update of price, currency, price_reference_usd on public.vehicles
  for each row execute function private.sync_price_reference();

-- Correct any values that were written before this migration (no-op on a new project).
update public.vehicles
   set price_reference_usd = public.price_to_usd(price, currency)
 where price_reference_usd is distinct from public.price_to_usd(price, currency);


-- ─── 2. Dealer logos: no SVG ────────────────────────────────────────────────
-- SVG can carry script and the bucket is public. The app only offers PNG,
-- JPEG and WebP (createLogoUpload). Existing objects are not touched.

update storage.buckets
   set allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
 where id = 'dealer-logos';


-- ─── 3. Function execute permissions ───────────────────────────────────────
-- Supabase grants EXECUTE on new public functions to anon and authenticated
-- by default, so every public function is callable through /rest/v1/rpc.

-- 3a. View counting: only the server (service role) may record a view.
--     The app's recordView() server action calls this with the service-role
--     client after its own per-IP limit; visitors can no longer call it
--     directly to inflate view_count.
revoke execute on function public.record_vehicle_view(uuid) from public, anon, authenticated;
grant execute on function public.record_vehicle_view(uuid) to service_role;

-- 3b. public.setting() is SECURITY DEFINER and is called by triggers that run
--     as anon/authenticated (guard_vehicle, prepare_buyer_submission,
--     prepare_report), so EXECUTE cannot be revoked. Instead it now returns a
--     value only inside trigger execution or to administrators, matching the
--     "settings readable by admins" policy. Same signature, so existing grants
--     and callers are unchanged.
create or replace function public.setting(p_key text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select value from public.platform_settings
   where key = p_key
     and (pg_trigger_depth() > 0 or public.is_admin());
$$;

-- 3c. Admin statistics already reject non-admins internally; anonymous
--     callers have no reason to reach it at all.
revoke execute on function public.admin_platform_stats() from public, anon;
grant execute on function public.admin_platform_stats() to authenticated;

-- Reviewed and intentionally unchanged:
--   is_admin()               — called by the app for anon/authenticated sessions; returns only the caller's own status.
--   search_vehicles(...)     — public search (SECURITY INVOKER; RLS decides visibility).
--   mx_prefix_query(text)    — used by search_vehicles as anon; pure function.
--   mx_slugify(text), is_trusted_writer() — used by triggers as authenticated; pure / caller-only.
--   price_to_usd(...)        — used by the vehicle triggers as authenticated; rates are public data.
--   seller_listing_stats(), seller_views_daily(int) — already revoked from anon; scoped to auth.uid().
--   refresh_price_references() — already restricted to service_role.
--   Trigger functions cannot be invoked through RPC ("can only be called as triggers").


-- ─── 4. Anonymous submission quotas (database-enforced) ────────────────────
-- Existing triggers limit by email address (rotatable) and, for reports, skip
-- the limit entirely when an anonymous reporter leaves contact_email empty.
-- These quotas key only on values the client cannot vary freely — the target
-- vehicle, the signed-in user id, or a single global bucket — and never on
-- request headers. Signed-in users keep their existing per-user limits.
-- Trade-off: during a flood, the global anonymous bucket can briefly refuse
-- legitimate anonymous submissions; signed-in users are unaffected.
--
--   enquiries            anonymous: 10 / listing / hour, 100 / hour overall
--   inspection_requests  anonymous:  5 / listing / hour,  50 / hour overall
--   listing_reports      anonymous:  5 / listing / hour,  30 / hour overall
--   contact_messages     anonymous: 30 / hour overall; signed-in: 5 / user / hour

create or replace function private.enforce_submission_quota()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  allowed boolean := true;
begin
  -- Only client roles are limited; the database owner, seed and service role are trusted.
  if current_user not in ('anon', 'authenticated') then
    return new;
  end if;

  if tg_table_name = 'enquiries' then
    if uid is null then
      allowed := private.consume_rate_limit('enquiries:anon:vehicle', new.vehicle_id::text, 10, interval '1 hour')
             and private.consume_rate_limit('enquiries:anon:all', 'all', 100, interval '1 hour');
    end if;
  elsif tg_table_name = 'inspection_requests' then
    if uid is null then
      allowed := private.consume_rate_limit('inspection_requests:anon:vehicle', new.vehicle_id::text, 5, interval '1 hour')
             and private.consume_rate_limit('inspection_requests:anon:all', 'all', 50, interval '1 hour');
    end if;
  elsif tg_table_name = 'listing_reports' then
    if uid is null then
      allowed := private.consume_rate_limit('report:anon:vehicle', new.vehicle_id::text, 5, interval '1 hour')
             and private.consume_rate_limit('report:anon:all', 'all', 30, interval '1 hour');
    end if;
  elsif tg_table_name = 'contact_messages' then
    if uid is null then
      allowed := private.consume_rate_limit('contact:anon:all', 'all', 30, interval '1 hour');
    else
      allowed := private.consume_rate_limit('contact:user', uid::text, 5, interval '1 hour');
    end if;
  end if;

  if not allowed then
    -- Same wording/code as the existing limits, so the app's error mapping applies.
    raise exception 'Too many requests. Please try again later.' using errcode = 'P0429';
  end if;
  return new;
end;
$$;

-- "_quota" sorts after "_prepare", so the existing validation (vehicle available,
-- buyer id, per-email limit) runs first and unavailable listings never consume quota.
drop trigger if exists enquiries_quota on public.enquiries;
create trigger enquiries_quota before insert on public.enquiries
  for each row execute function private.enforce_submission_quota();

drop trigger if exists inspection_requests_quota on public.inspection_requests;
create trigger inspection_requests_quota before insert on public.inspection_requests
  for each row execute function private.enforce_submission_quota();

drop trigger if exists listing_reports_quota on public.listing_reports;
create trigger listing_reports_quota before insert on public.listing_reports
  for each row execute function private.enforce_submission_quota();

drop trigger if exists contact_messages_quota on public.contact_messages;
create trigger contact_messages_quota before insert on public.contact_messages
  for each row execute function private.enforce_submission_quota();


-- ─── 5. Vehicle-image uploads limited to the uploader's own listings ───────
-- Previously any signed-in user (including buyers) could upload unlimited
-- files anywhere under their own folder of the public bucket. Uploads now
-- require the exact path the app uses — "<auth.uid()>/<vehicle id>/<file>" —
-- where the vehicle belongs to the uploader, the listing is not suspended,
-- the seller account is active, and the listing folder holds fewer than 30
-- objects (24 photos plus headroom for interrupted uploads).
-- `objects.name` is qualified so the subquery cannot capture `o.name`.

drop policy if exists "upload own vehicle images" on storage.objects;
drop policy if exists "upload images to own listings" on storage.objects;
create policy "upload images to own listings" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'vehicle-images'
    and array_length(storage.foldername(objects.name), 1) = 2
    and (storage.foldername(objects.name))[1] = auth.uid()::text
    and exists (
      select 1
        from public.vehicles v
        join public.profiles p on p.id = v.seller_id
       where v.id::text = (storage.foldername(objects.name))[2]
         and v.seller_id = auth.uid()
         and v.status <> 'suspended'
         and p.status = 'active'
    )
    and (
      select count(*)
        from storage.objects o
       where o.bucket_id = 'vehicle-images'
         and starts_with(o.name, (storage.foldername(objects.name))[1] || '/' || (storage.foldername(objects.name))[2] || '/')
    ) < 30
  );
-- The existing delete/select policies on own-folder objects are unchanged.


-- ─── 6. Photo changes on approved listings ─────────────────────────────────
-- Intentionally NOT changed here. Whether adding/replacing photos on a live
-- listing should return it to review is a product decision; see the review notes.


-- ─── 7. Pin search_path on the remaining functions ─────────────────────────
-- All SECURITY DEFINER functions already pin search_path. These are SECURITY
-- INVOKER (they run with the caller's rights), so this does not change their
-- privileges; it removes Supabase's "Function Search Path Mutable" warnings and
-- stops pg_temp objects from shadowing tables. Their bodies already
-- schema-qualify public/auth/private objects, so name resolution is unchanged.

alter function public.mx_slugify(text)                set search_path = public, pg_temp;
alter function public.touch_updated_at()              set search_path = public, pg_temp;
alter function public.is_trusted_writer()             set search_path = public, pg_temp;
alter function public.guard_profile()                 set search_path = public, pg_temp;
alter function public.guard_dealer_profile()          set search_path = public, pg_temp;
alter function public.guard_vehicle()                 set search_path = public, pg_temp;
alter function public.guard_vehicle_image()           set search_path = public, pg_temp;
alter function public.prepare_buyer_submission()      set search_path = public, pg_temp;
alter function public.guard_submission_update()       set search_path = public, pg_temp;
alter function public.prepare_report()                set search_path = public, pg_temp;
alter function public.apply_verification()            set search_path = public, pg_temp;
alter function public.prepare_contact_message()       set search_path = public, pg_temp;
alter function public.mx_prefix_query(text)           set search_path = public, pg_temp;
alter function public.refresh_price_references()      set search_path = public, pg_temp;
