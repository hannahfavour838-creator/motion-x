-- ════════════════════════════════════════════════════════════════════════════
-- MOTION X — core schema
-- Profiles, dealers, vehicles, media, buyer activity, trust & safety, moderation.
-- Every table has Row Level Security enabled. Privileged columns are guarded
-- by triggers so that a client cannot grant itself verification, approval or
-- administrator status, regardless of what it sends.
-- ════════════════════════════════════════════════════════════════════════════

create extension if not exists pgcrypto;

-- ─── Helpers ────────────────────────────────────────────────────────────────

create or replace function public.mx_slugify(input text)
returns text
language sql
immutable
as $$
  select trim(both '-' from regexp_replace(lower(coalesce(input, '')), '[^a-z0-9]+', '-', 'g'));
$$;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ─── Markets ───────────────────────────────────────────────────────────────

create table public.countries (
  code          char(2) primary key check (code ~ '^[A-Z]{2}$'),
  name          text not null,
  currency      char(3) not null check (currency ~ '^[A-Z]{3}$'),
  distance_unit text not null default 'km' check (distance_unit in ('km', 'mi')),
  locale        text not null default 'en',
  enabled       boolean not null default true,
  created_at    timestamptz not null default now()
);

insert into public.countries (code, name, currency, distance_unit, locale) values
  ('US','United States','USD','mi','en-US'), ('CA','Canada','CAD','km','en-CA'),
  ('MX','Mexico','MXN','km','es-MX'), ('BR','Brazil','BRL','km','pt-BR'),
  ('GB','United Kingdom','GBP','mi','en-GB'), ('IE','Ireland','EUR','km','en-IE'),
  ('DE','Germany','EUR','km','de-DE'), ('FR','France','EUR','km','fr-FR'),
  ('IT','Italy','EUR','km','it-IT'), ('ES','Spain','EUR','km','es-ES'),
  ('NL','Netherlands','EUR','km','nl-NL'), ('BE','Belgium','EUR','km','nl-BE'),
  ('AT','Austria','EUR','km','de-AT'), ('PT','Portugal','EUR','km','pt-PT'),
  ('CH','Switzerland','CHF','km','de-CH'), ('SE','Sweden','SEK','km','sv-SE'),
  ('NO','Norway','NOK','km','nb-NO'), ('AE','United Arab Emirates','AED','km','en-AE'),
  ('SA','Saudi Arabia','SAR','km','en-SA'), ('QA','Qatar','QAR','km','en-QA'),
  ('JP','Japan','JPY','km','ja-JP'), ('KR','South Korea','KRW','km','ko-KR'),
  ('CN','China','CNY','km','zh-CN'), ('HK','Hong Kong','HKD','km','en-HK'),
  ('SG','Singapore','SGD','km','en-SG'), ('IN','India','INR','km','en-IN'),
  ('AU','Australia','AUD','km','en-AU'), ('NZ','New Zealand','NZD','km','en-NZ'),
  ('ZA','South Africa','ZAR','km','en-ZA'), ('NG','Nigeria','NGN','km','en-NG'),
  ('KE','Kenya','KES','km','en-KE'), ('GH','Ghana','GHS','km','en-GH'),
  ('EG','Egypt','EGP','km','en-EG');

-- Exchange rates: units of `currency` per 1 USD. Written only by the trusted
-- rates job (service role). Converted prices are always labelled as estimates.
create table public.exchange_rates (
  currency   char(3) primary key check (currency ~ '^[A-Z]{3}$'),
  rate       numeric(20, 8) not null check (rate > 0),
  provider   text not null,
  fetched_at timestamptz not null default now()
);

-- ─── Platform settings & administrators ─────────────────────────────────────

create table public.platform_settings (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now()
);

insert into public.platform_settings (key, value) values
  ('listing_moderation', '"required"'),      -- 'required' | 'auto'
  ('enquiries_per_hour', '6'),
  ('reports_per_hour', '10');

-- Administrator grants live in their own table. There is NO policy allowing
-- clients to write it: admins are granted via SQL / the service-role script.
create table public.admin_users (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  granted_at timestamptz not null default now(),
  note       text
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admin_users where user_id = auth.uid());
$$;

-- A write is "trusted" when it comes from an administrator or from a
-- server-side role (service role, migrations, seed). Clients connect as
-- `anon` or `authenticated`.
create or replace function public.is_trusted_writer()
returns boolean
language sql
stable
as $$
  select current_user not in ('anon', 'authenticated') or public.is_admin();
$$;

create or replace function public.setting(p_key text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select value from public.platform_settings where key = p_key;
$$;

-- ─── Rate limiting ─────────────────────────────────────────────────────────
-- Lives in a schema that is NOT exposed through the Data API, so clients
-- cannot call or read it directly; only database triggers use it.

create schema if not exists private;
grant usage on schema private to anon, authenticated;

create table private.rate_limit_events (
  id         bigint generated always as identity primary key,
  action     text not null,
  key        text not null,
  created_at timestamptz not null default now()
);
create index rate_limit_events_lookup on private.rate_limit_events (action, key, created_at desc);
revoke all on private.rate_limit_events from public, anon, authenticated;

-- Returns true and records the event if under the limit; false otherwise.
create or replace function private.consume_rate_limit(p_action text, p_key text, p_max int, p_window interval)
returns boolean
language plpgsql
security definer
set search_path = private, public
as $$
declare
  recent int;
begin
  if p_key is null or length(p_key) = 0 then
    return true;
  end if;
  delete from private.rate_limit_events where created_at < now() - interval '2 days';
  select count(*) into recent from private.rate_limit_events
    where action = p_action and key = p_key and created_at > now() - p_window;
  if recent >= p_max then
    return false;
  end if;
  insert into private.rate_limit_events (action, key) values (p_action, p_key);
  return true;
end;
$$;
grant execute on function private.consume_rate_limit(text, text, int, interval) to anon, authenticated;

-- ─── Profiles ──────────────────────────────────────────────────────────────

create table public.profiles (
  id                   uuid primary key references auth.users (id) on delete cascade,
  account_type         text not null default 'buyer' check (account_type in ('buyer', 'private_seller', 'dealer')),
  display_name         text not null check (char_length(display_name) between 2 and 80),
  avatar_url           text,
  bio                  text check (char_length(bio) <= 1000),
  country_code         char(2) references public.countries (code),
  city                 text check (char_length(city) <= 80),
  status               text not null default 'active' check (status in ('active', 'suspended')),
  suspended_reason     text,
  identity_verified_at timestamptz,
  is_demo              boolean not null default false,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

-- Private account data, readable only by its owner and administrators.
create table public.profile_private (
  id                 uuid primary key references public.profiles (id) on delete cascade,
  phone              text check (char_length(phone) <= 32),
  marketing_opt_in   boolean not null default false,
  updated_at         timestamptz not null default now()
);

create table public.dealer_profiles (
  id                   uuid primary key references public.profiles (id) on delete cascade,
  slug                 text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  business_name        text not null check (char_length(business_name) between 2 and 120),
  logo_url             text,
  description          text check (char_length(description) <= 4000),
  country_code         char(2) not null references public.countries (code),
  region               text check (char_length(region) <= 80),
  city                 text not null check (char_length(city) <= 80),
  address_line         text check (char_length(address_line) <= 200),
  website              text check (website is null or website ~* '^https?://'),
  public_email         text check (public_email is null or public_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  public_phone         text check (char_length(public_phone) <= 32),
  whatsapp             text check (whatsapp is null or whatsapp ~ '^\+[1-9][0-9]{6,14}$'),
  business_verified_at timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();
create trigger dealer_profiles_touch before update on public.dealer_profiles
  for each row execute function public.touch_updated_at();
create trigger profile_private_touch before update on public.profile_private
  for each row execute function public.touch_updated_at();

-- Guard privileged profile columns.
create or replace function public.guard_profile()
returns trigger
language plpgsql
as $$
begin
  if public.is_trusted_writer() then
    return new;
  end if;
  if tg_op = 'INSERT' then
    new.is_demo := false;
    new.status := 'active';
    new.identity_verified_at := null;
  end if;
  if tg_op = 'UPDATE' then
    if new.id <> old.id
       or new.status is distinct from old.status
       or new.suspended_reason is distinct from old.suspended_reason
       or new.identity_verified_at is distinct from old.identity_verified_at
       or new.is_demo is distinct from old.is_demo
       or new.created_at is distinct from old.created_at then
      raise exception 'You cannot change protected profile fields' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;
create trigger profiles_guard before insert or update on public.profiles
  for each row execute function public.guard_profile();

create or replace function public.guard_dealer_profile()
returns trigger
language plpgsql
as $$
begin
  if public.is_trusted_writer() then
    return new;
  end if;
  if tg_op = 'INSERT' then
    new.business_verified_at := null;
  elsif new.business_verified_at is distinct from old.business_verified_at
     or new.slug is distinct from old.slug then
    raise exception 'You cannot change protected dealer fields' using errcode = '42501';
  end if;
  return new;
end;
$$;
create trigger dealer_profiles_guard before insert or update on public.dealer_profiles
  for each row execute function public.guard_dealer_profile();

-- Create a profile automatically when a user signs up. Account type comes
-- from sign-up metadata but is restricted to non-privileged values.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested text := coalesce(new.raw_user_meta_data ->> 'account_type', 'buyer');
  name text := nullif(trim(coalesce(new.raw_user_meta_data ->> 'display_name', '')), '');
begin
  if requested not in ('buyer', 'private_seller', 'dealer') then
    requested := 'buyer';
  end if;
  if name is null or char_length(name) < 2 then
    name := split_part(coalesce(new.email, 'Member'), '@', 1);
  end if;
  if char_length(name) < 2 then
    name := 'Member';
  end if;
  insert into public.profiles (id, account_type, display_name)
    values (new.id, requested, left(name, 80))
    on conflict (id) do nothing;
  insert into public.profile_private (id) values (new.id) on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─── 3D assets ─────────────────────────────────────────────────────────────

create table public.vehicle_3d_assets (
  id             uuid primary key default gen_random_uuid(),
  slug           text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name           text not null,
  format         text not null check (format in ('glb', 'gltf')),
  url            text not null,
  poster_url     text,
  file_bytes     bigint,
  credit         text not null,
  license        text not null,
  license_url    text,
  -- Paint options the asset genuinely supports: [{ "id": "...", "name": "...", "color": "#hex", "metalness": 1, "roughness": 0.3 }]
  paint_options  jsonb not null default '[]'::jsonb,
  description    text,
  is_published   boolean not null default true,
  created_at     timestamptz not null default now()
);

-- ─── Vehicles ──────────────────────────────────────────────────────────────

create table public.vehicles (
  id                    uuid primary key default gen_random_uuid(),
  seller_id             uuid not null references public.profiles (id) on delete cascade,
  slug                  text not null unique,
  make                  text not null check (char_length(make) between 1 and 60),
  model                 text not null check (char_length(model) between 1 and 80),
  variant               text check (char_length(variant) <= 120),
  year                  int not null check (year between 1886 and 2100),
  price                 numeric(16, 2) not null check (price > 0 and price < 100000000000),
  currency              char(3) not null check (currency ~ '^[A-Z]{3}$'),
  price_reference_usd   numeric(18, 2),
  country_code          char(2) not null references public.countries (code),
  region                text check (char_length(region) <= 80),
  city                  text not null check (char_length(city) between 1 and 80),
  mileage               int not null check (mileage between 0 and 3000000),
  mileage_unit          text not null default 'km' check (mileage_unit in ('km', 'mi')),
  mileage_km            int generated always as (
                          case when mileage_unit = 'mi' then round(mileage * 1.609344)::int else mileage end
                        ) stored,
  condition             text not null check (condition in ('new', 'used')),
  body_style            text not null check (body_style in ('coupe','sedan','suv','hatchback','estate','convertible','roadster','pickup','van','mpv')),
  transmission          text not null check (transmission in ('automatic','manual','dual_clutch','single_speed')),
  fuel_type             text not null check (fuel_type in ('petrol','diesel','hybrid','plug_in_hybrid','electric','hydrogen')),
  drivetrain            text check (drivetrain in ('rwd','fwd','awd','4wd')),
  segment               text not null default 'everyday' check (segment in ('supercar','luxury','performance','everyday','classic')),
  exterior_colour       text check (char_length(exterior_colour) <= 60),
  interior_colour       text check (char_length(interior_colour) <= 60),
  engine                text check (char_length(engine) <= 120),
  power_hp              int check (power_hp between 1 and 5000),
  doors                 smallint check (doors between 1 and 7),
  seats                 smallint check (seats between 1 and 12),
  description           text check (char_length(description) <= 8000),
  status                text not null default 'draft' check (status in ('draft','pending_review','active','paused','sold','rejected','suspended')),
  rejection_reason      text,
  is_demo               boolean not null default false,
  featured              boolean not null default false,
  inspection_available  boolean not null default false,
  inspected_at          timestamptz,
  inspection_note       text,
  history_checked_at    timestamptz,
  history_check_note    text,
  asset_id              uuid references public.vehicle_3d_assets (id) on delete set null,
  view_count            int not null default 0,
  submitted_at          timestamptz,
  approved_at           timestamptz,
  published_at          timestamptz,
  sold_at               timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  search_tsv            tsvector generated always as (
                          setweight(to_tsvector('simple', coalesce(make, '') || ' ' || coalesce(model, '')), 'A') ||
                          setweight(to_tsvector('simple', coalesce(variant, '') || ' ' || coalesce(year::text, '')), 'B') ||
                          setweight(to_tsvector('simple', coalesce(body_style, '') || ' ' || coalesce(fuel_type, '') || ' ' || coalesce(exterior_colour, '')), 'C') ||
                          setweight(to_tsvector('simple', coalesce(description, '')), 'D')
                        ) stored
);

create index vehicles_status_published on public.vehicles (status, published_at desc);
create index vehicles_seller on public.vehicles (seller_id);
create index vehicles_country on public.vehicles (country_code, status);
create index vehicles_make_model on public.vehicles (lower(make), lower(model));
create index vehicles_price_ref on public.vehicles (price_reference_usd);
create index vehicles_currency_price on public.vehicles (currency, price);
create index vehicles_year on public.vehicles (year);
create index vehicles_mileage on public.vehicles (mileage_km);
create index vehicles_search on public.vehicles using gin (search_tsv);

-- Price in USD for cross-currency filtering and sorting, if rates are known.
create or replace function public.price_to_usd(p_price numeric, p_currency text)
returns numeric
language sql
stable
security definer
set search_path = public
as $$
  select case
    when p_currency = 'USD' then round(p_price, 2)
    else (select round(p_price / rate, 2) from public.exchange_rates where currency = p_currency)
  end;
$$;

create or replace function public.guard_vehicle()
returns trigger
language plpgsql
as $$
declare
  trusted boolean := public.is_trusted_writer();
  moderation text := coalesce(public.setting('listing_moderation') #>> '{}', 'required');
  seller_ok boolean;
begin
  -- Slug & derived fields (always)
  if tg_op = 'INSERT' and (new.slug is null or new.slug = '') then
    new.slug := public.mx_slugify(concat_ws(' ', new.year::text, new.make, new.model, new.variant))
                || '-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 6);
  end if;
  new.updated_at := now();
  if tg_op = 'INSERT' or new.price is distinct from old.price or new.currency is distinct from old.currency then
    new.price_reference_usd := public.price_to_usd(new.price, new.currency);
  end if;

  if not trusted then
    if tg_op = 'INSERT' then
      select exists (
        select 1 from public.profiles p
        where p.id = auth.uid() and p.status = 'active' and p.account_type in ('private_seller', 'dealer')
      ) into seller_ok;
      if not seller_ok or new.seller_id is distinct from auth.uid() then
        raise exception 'Only active seller accounts can create listings' using errcode = '42501';
      end if;
      if new.status not in ('draft', 'pending_review') then
        raise exception 'New listings must start as a draft or be submitted for review' using errcode = '42501';
      end if;
      new.is_demo := false;
      new.featured := false;
      new.inspected_at := null; new.inspection_note := null;
      new.history_checked_at := null; new.history_check_note := null;
      new.asset_id := null;
      new.view_count := 0;
      new.approved_at := null; new.published_at := null; new.sold_at := null;
      new.rejection_reason := null;
      new.created_at := now();
    else
      if new.seller_id <> old.seller_id or new.slug <> old.slug
         or new.is_demo <> old.is_demo or new.featured <> old.featured
         or new.inspected_at is distinct from old.inspected_at
         or new.inspection_note is distinct from old.inspection_note
         or new.history_checked_at is distinct from old.history_checked_at
         or new.history_check_note is distinct from old.history_check_note
         or new.asset_id is distinct from old.asset_id
         or new.view_count <> old.view_count
         or new.approved_at is distinct from old.approved_at
         or new.published_at is distinct from old.published_at
         or new.rejection_reason is distinct from old.rejection_reason
         or new.created_at <> old.created_at then
        raise exception 'You cannot change protected listing fields' using errcode = '42501';
      end if;

      if old.status = 'suspended' and new.status <> 'suspended' then
        raise exception 'This listing is suspended. Contact support to resolve it.' using errcode = '42501';
      end if;

      if new.status <> old.status and not (
           (old.status in ('draft', 'rejected') and new.status = 'pending_review')
        or (old.status = 'pending_review' and new.status = 'draft')
        or (old.status = 'active' and new.status in ('paused', 'sold'))
        or (old.status = 'paused' and new.status in ('active', 'sold') and old.approved_at is not null)
        or (old.status = 'sold' and new.status = 'active' and old.approved_at is not null)
      ) then
        raise exception 'Status change from % to % is not allowed', old.status, new.status using errcode = '42501';
      end if;

      -- Material edits to a live listing go back through review when moderation is required.
      if moderation = 'required' and old.status in ('active', 'paused') and new.status in ('active', 'paused') and (
           new.make is distinct from old.make or new.model is distinct from old.model
        or new.variant is distinct from old.variant or new.year is distinct from old.year
        or new.description is distinct from old.description or new.condition is distinct from old.condition
        or new.body_style is distinct from old.body_style
      ) then
        new.status := 'pending_review';
      end if;
    end if;

    if new.status = 'pending_review' and (tg_op = 'INSERT' or old.status <> 'pending_review') then
      new.submitted_at := now();
      if moderation = 'auto' then
        new.status := 'active';
        new.approved_at := now();
        new.published_at := coalesce(case when tg_op = 'UPDATE' then old.published_at end, now());
      end if;
    end if;
  end if;

  -- Lifecycle timestamps (trusted and untrusted)
  if new.status = 'active' and (tg_op = 'INSERT' or old.status <> 'active') then
    new.approved_at := coalesce(new.approved_at, now());
    new.published_at := coalesce(new.published_at, now());
  end if;
  if new.status = 'sold' and (tg_op = 'INSERT' or old.status <> 'sold') then
    new.sold_at := now();
  end if;
  return new;
end;
$$;

create trigger vehicles_guard before insert or update on public.vehicles
  for each row execute function public.guard_vehicle();

create table public.vehicle_images (
  id            uuid primary key default gen_random_uuid(),
  vehicle_id    uuid not null references public.vehicles (id) on delete cascade,
  storage_path  text,                -- object path in the `vehicle-images` bucket
  url           text,                -- static URL (demonstration renders only)
  alt           text check (char_length(alt) <= 200),
  width         int,
  height        int,
  position      int not null default 0,
  created_at    timestamptz not null default now(),
  check (storage_path is not null or url is not null)
);
create index vehicle_images_vehicle on public.vehicle_images (vehicle_id, position);

create or replace function public.guard_vehicle_image()
returns trigger
language plpgsql
as $$
declare
  owner uuid;
  total int;
begin
  if public.is_trusted_writer() then
    return new;
  end if;
  select seller_id into owner from public.vehicles where id = new.vehicle_id;
  if owner is distinct from auth.uid() then
    raise exception 'Not your listing' using errcode = '42501';
  end if;
  if new.url is not null then
    raise exception 'Images must be uploaded to storage' using errcode = '42501';
  end if;
  if new.storage_path is null or split_part(new.storage_path, '/', 1) <> auth.uid()::text then
    raise exception 'Invalid image path' using errcode = '42501';
  end if;
  if tg_op = 'INSERT' then
    select count(*) into total from public.vehicle_images where vehicle_id = new.vehicle_id;
    if total >= 24 then
      raise exception 'A listing can have at most 24 photographs' using errcode = '23514';
    end if;
  end if;
  return new;
end;
$$;
create trigger vehicle_images_guard before insert or update on public.vehicle_images
  for each row execute function public.guard_vehicle_image();

-- Daily listing views for seller performance analytics.
create table public.vehicle_view_stats (
  vehicle_id uuid not null references public.vehicles (id) on delete cascade,
  day        date not null default current_date,
  views      int not null default 0,
  primary key (vehicle_id, day)
);

create or replace function public.record_vehicle_view(p_vehicle_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from public.vehicles where id = p_vehicle_id and status in ('active', 'sold')) then
    return;
  end if;
  insert into public.vehicle_view_stats (vehicle_id, day, views) values (p_vehicle_id, current_date, 1)
    on conflict (vehicle_id, day) do update set views = public.vehicle_view_stats.views + 1;
  update public.vehicles set view_count = view_count + 1 where id = p_vehicle_id;
end;
$$;

-- ─── Buyer activity ────────────────────────────────────────────────────────

create table public.favourites (
  user_id    uuid not null references public.profiles (id) on delete cascade,
  vehicle_id uuid not null references public.vehicles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, vehicle_id)
);
create index favourites_vehicle on public.favourites (vehicle_id);

create table public.enquiries (
  id                uuid primary key default gen_random_uuid(),
  vehicle_id        uuid not null references public.vehicles (id) on delete cascade,
  seller_id         uuid not null references public.profiles (id) on delete cascade,
  buyer_id          uuid references public.profiles (id) on delete set null,
  name              text not null check (char_length(name) between 2 and 80),
  email             text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' and char_length(email) <= 254),
  phone             text check (char_length(phone) <= 32),
  preferred_contact text not null default 'email' check (preferred_contact in ('email', 'phone', 'whatsapp')),
  message           text not null check (char_length(message) between 10 and 3000),
  status            text not null default 'new' check (status in ('new', 'read', 'replied', 'closed', 'spam')),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index enquiries_seller on public.enquiries (seller_id, created_at desc);
create index enquiries_buyer on public.enquiries (buyer_id, created_at desc);
create index enquiries_vehicle on public.enquiries (vehicle_id);

create table public.enquiry_messages (
  id          uuid primary key default gen_random_uuid(),
  enquiry_id  uuid not null references public.enquiries (id) on delete cascade,
  sender_id   uuid not null references public.profiles (id) on delete cascade,
  body        text not null check (char_length(body) between 1 and 3000),
  created_at  timestamptz not null default now()
);
create index enquiry_messages_enquiry on public.enquiry_messages (enquiry_id, created_at);

create table public.inspection_requests (
  id              uuid primary key default gen_random_uuid(),
  vehicle_id      uuid not null references public.vehicles (id) on delete cascade,
  seller_id       uuid not null references public.profiles (id) on delete cascade,
  buyer_id        uuid references public.profiles (id) on delete set null,
  name            text not null check (char_length(name) between 2 and 80),
  email           text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  phone           text check (char_length(phone) <= 32),
  preferred_date  date,
  inspector       text check (char_length(inspector) <= 160),
  message         text check (char_length(message) <= 2000),
  status          text not null default 'requested' check (status in ('requested','acknowledged','scheduled','completed','declined','cancelled')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index inspection_requests_seller on public.inspection_requests (seller_id, created_at desc);

-- Shared guard for buyer → seller submissions (enquiries & inspection requests).
create or replace function public.prepare_buyer_submission()
returns trigger
language plpgsql
as $$
declare
  v record;
  per_hour int := coalesce((public.setting('enquiries_per_hour') #>> '{}')::int, 6);
begin
  select id, seller_id, status, inspection_available into v from public.vehicles where id = new.vehicle_id;
  if v.id is null or v.status <> 'active' then
    raise exception 'This vehicle is not available for enquiries' using errcode = '42501';
  end if;
  new.seller_id := v.seller_id;
  if current_user in ('anon', 'authenticated') then
    if new.buyer_id is not null and new.buyer_id is distinct from auth.uid() then
      raise exception 'Invalid buyer' using errcode = '42501';
    end if;
    if auth.uid() is not null then
      new.buyer_id := auth.uid();
    end if;
    if new.buyer_id = v.seller_id then
      raise exception 'You cannot enquire about your own listing' using errcode = '42501';
    end if;
    if tg_table_name = 'enquiries' then
      new.status := 'new';
    else
      new.status := 'requested';
      if not v.inspection_available then
        raise exception 'This seller has not enabled inspection requests' using errcode = '42501';
      end if;
    end if;
    if not private.consume_rate_limit(tg_table_name, lower(new.email), per_hour, interval '1 hour')
       or not private.consume_rate_limit(tg_table_name || ':user', coalesce(auth.uid()::text, ''), per_hour, interval '1 hour') then
      raise exception 'Too many requests. Please try again later.' using errcode = 'P0429';
    end if;
  end if;
  return new;
end;
$$;

create trigger enquiries_prepare before insert on public.enquiries
  for each row execute function public.prepare_buyer_submission();
create trigger inspection_requests_prepare before insert on public.inspection_requests
  for each row execute function public.prepare_buyer_submission();
create trigger enquiries_touch before update on public.enquiries
  for each row execute function public.touch_updated_at();
create trigger inspection_requests_touch before update on public.inspection_requests
  for each row execute function public.touch_updated_at();

-- Sellers may only change the status of submissions they received.
create or replace function public.guard_submission_update()
returns trigger
language plpgsql
as $$
begin
  if public.is_trusted_writer() then
    return new;
  end if;
  if new.vehicle_id <> old.vehicle_id or new.seller_id <> old.seller_id
     or new.buyer_id is distinct from old.buyer_id or new.name <> old.name
     or new.email <> old.email or new.phone is distinct from old.phone
     or new.created_at <> old.created_at then
    raise exception 'Only the status can be changed' using errcode = '42501';
  end if;
  if tg_table_name = 'enquiries' and (new.message <> old.message or new.preferred_contact <> old.preferred_contact) then
    raise exception 'Only the status can be changed' using errcode = '42501';
  end if;
  return new;
end;
$$;
create trigger enquiries_guard_update before update on public.enquiries
  for each row execute function public.guard_submission_update();
create trigger inspection_requests_guard_update before update on public.inspection_requests
  for each row execute function public.guard_submission_update();

create or replace function public.after_enquiry_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.enquiries
     set status = case when seller_id = new.sender_id then 'replied' else status end,
         updated_at = now()
   where id = new.enquiry_id;
  return new;
end;
$$;
create trigger enquiry_messages_after after insert on public.enquiry_messages
  for each row execute function public.after_enquiry_message();

-- ─── Trust & safety ────────────────────────────────────────────────────────

create table public.listing_reports (
  id              uuid primary key default gen_random_uuid(),
  vehicle_id      uuid not null references public.vehicles (id) on delete cascade,
  reporter_id     uuid references public.profiles (id) on delete set null,
  reason          text not null check (reason in ('fraud_or_scam','misleading_information','duplicate','wrong_price','sold_or_unavailable','offensive','other')),
  details         text check (char_length(details) <= 2000),
  contact_email   text check (contact_email is null or contact_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  status          text not null default 'open' check (status in ('open','reviewing','resolved','dismissed')),
  resolution_note text,
  resolved_by     uuid references public.profiles (id) on delete set null,
  resolved_at     timestamptz,
  created_at      timestamptz not null default now()
);
create index listing_reports_status on public.listing_reports (status, created_at desc);

create or replace function public.prepare_report()
returns trigger
language plpgsql
as $$
declare
  per_hour int := coalesce((public.setting('reports_per_hour') #>> '{}')::int, 10);
begin
  if current_user in ('anon', 'authenticated') then
    if new.reporter_id is not null and new.reporter_id is distinct from auth.uid() then
      raise exception 'Invalid reporter' using errcode = '42501';
    end if;
    new.reporter_id := auth.uid();
    new.status := 'open';
    new.resolution_note := null; new.resolved_by := null; new.resolved_at := null;
    if not private.consume_rate_limit('report', coalesce(auth.uid()::text, lower(new.contact_email), ''), per_hour, interval '1 hour') then
      raise exception 'Too many reports. Please try again later.' using errcode = 'P0429';
    end if;
  end if;
  return new;
end;
$$;
create trigger listing_reports_prepare before insert on public.listing_reports
  for each row execute function public.prepare_report();

create table public.verification_requests (
  id              uuid primary key default gen_random_uuid(),
  profile_id      uuid not null references public.profiles (id) on delete cascade,
  kind            text not null check (kind in ('identity', 'business')),
  status          text not null default 'pending' check (status in ('pending','approved','rejected','cancelled')),
  -- Applicant-supplied details (e.g. registered business name & number). Owner + admins only.
  details         jsonb not null default '{}'::jsonb,
  applicant_note  text check (char_length(applicant_note) <= 2000),
  reviewer_note   text,
  reviewed_by     uuid references public.profiles (id) on delete set null,
  reviewed_at     timestamptz,
  created_at      timestamptz not null default now()
);
create unique index verification_one_pending on public.verification_requests (profile_id, kind) where status = 'pending';

create or replace function public.apply_verification()
returns trigger
language plpgsql
as $$
begin
  if current_user in ('anon', 'authenticated') and not public.is_admin() then
    if tg_op = 'INSERT' then
      if new.profile_id is distinct from auth.uid() then
        raise exception 'Invalid applicant' using errcode = '42501';
      end if;
      new.status := 'pending';
      new.reviewer_note := null; new.reviewed_by := null; new.reviewed_at := null;
      return new;
    end if;
    -- Applicants may only cancel their own pending request.
    if not (old.status = 'pending' and new.status = 'cancelled')
       or new.details is distinct from old.details or new.kind <> old.kind then
      raise exception 'Only administrators can review verification requests' using errcode = '42501';
    end if;
    return new;
  end if;

  if tg_op = 'UPDATE' and new.status <> old.status and new.status in ('approved', 'rejected') then
    new.reviewed_at := now();
    new.reviewed_by := coalesce(new.reviewed_by, auth.uid());
    if new.status = 'approved' then
      if new.kind = 'identity' then
        update public.profiles set identity_verified_at = now() where id = new.profile_id;
      else
        update public.dealer_profiles set business_verified_at = now() where id = new.profile_id;
      end if;
    end if;
  end if;
  return new;
end;
$$;
create trigger verification_requests_apply before insert or update on public.verification_requests
  for each row execute function public.apply_verification();

create table public.moderation_actions (
  id           uuid primary key default gen_random_uuid(),
  actor_id     uuid references public.profiles (id) on delete set null,
  target_type  text not null check (target_type in ('vehicle', 'profile', 'dealer', 'report', 'verification')),
  target_id    uuid not null,
  action       text not null,
  from_status  text,
  to_status    text,
  note         text,
  created_at   timestamptz not null default now()
);
create index moderation_actions_target on public.moderation_actions (target_type, target_id, created_at desc);

-- Every listing status change is recorded for accountability.
create or replace function public.log_vehicle_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.moderation_actions (actor_id, target_type, target_id, action, to_status)
      values (auth.uid(), 'vehicle', new.id, 'created', new.status);
  elsif new.status <> old.status then
    insert into public.moderation_actions (actor_id, target_type, target_id, action, from_status, to_status, note)
      values (auth.uid(), 'vehicle', new.id,
              case when public.is_admin() then 'admin_status_change' else 'status_change' end,
              old.status, new.status,
              case when new.status in ('rejected', 'suspended') then new.rejection_reason end);
  end if;
  return null;
end;
$$;
create trigger vehicles_log_status after insert or update on public.vehicles
  for each row execute function public.log_vehicle_status();

create table public.contact_messages (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (char_length(name) between 2 and 80),
  email      text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  topic      text not null check (topic in ('buying', 'selling', 'dealer', 'trust', 'press', 'other')),
  message    text not null check (char_length(message) between 10 and 4000),
  status     text not null default 'new' check (status in ('new', 'handled')),
  created_at timestamptz not null default now()
);

create or replace function public.prepare_contact_message()
returns trigger
language plpgsql
as $$
begin
  if current_user in ('anon', 'authenticated') then
    new.status := 'new';
    if not private.consume_rate_limit('contact', lower(new.email), 3, interval '1 hour') then
      raise exception 'Too many messages. Please try again later.' using errcode = 'P0429';
    end if;
  end if;
  return new;
end;
$$;
create trigger contact_messages_prepare before insert on public.contact_messages
  for each row execute function public.prepare_contact_message();

-- ─── Search ────────────────────────────────────────────────────────────────

-- Builds a safe prefix tsquery ("porsc 911" → 'porsc':* & '911':*).
create or replace function public.mx_prefix_query(p_q text)
returns tsquery
language sql
immutable
as $$
  select case when count(*) = 0 then null else to_tsquery('simple', string_agg(quote_literal(w) || ':*', ' & ')) end
  from regexp_split_to_table(lower(regexp_replace(coalesce(p_q, ''), '[^[:alnum:]\s]+', ' ', 'g')), '\s+') as w
  where length(w) > 0;
$$;

-- Marketplace search. SECURITY INVOKER: Row Level Security decides which
-- listings the caller may see; this function only filters and orders them.
create or replace function public.search_vehicles(
  p_q              text default null,
  p_country        text default null,
  p_city           text default null,
  p_make           text default null,
  p_min_price      numeric default null,
  p_max_price      numeric default null,
  p_price_currency text default null,
  p_min_year       int default null,
  p_max_year       int default null,
  p_condition      text default null,
  p_max_mileage_km int default null,
  p_min_mileage_km int default null,
  p_body           text default null,
  p_transmission   text default null,
  p_fuel           text default null,
  p_seller_type    text default null,
  p_segment        text default null,
  p_availability   text default 'available',
  p_has_3d         boolean default null,
  p_seller_id      uuid default null,
  p_include_demo   boolean default true,
  p_sort           text default 'relevance',
  p_limit          int default 24,
  p_offset         int default 0
)
returns table (vehicle_id uuid, total_count bigint)
language sql
stable
security invoker
set search_path = public
as $$
  with params as (
    select
      public.mx_prefix_query(nullif(trim(p_q), '')) as tsq,
      case when p_price_currency is null or p_price_currency = 'USD' then 1::numeric
           else (select rate from public.exchange_rates where currency = p_price_currency) end as price_rate
  ),
  matches as (
    select v.id, v.featured, v.published_at, v.price, v.currency, v.price_reference_usd, v.year, v.mileage_km,
           case when params.tsq is null then 0 else ts_rank(v.search_tsv, params.tsq) end as rank
    from public.vehicles v
    join public.profiles s on s.id = v.seller_id
    cross join params
    where s.status = 'active'
      and case coalesce(p_availability, 'available')
            when 'available' then v.status = 'active'
            when 'sold' then v.status = 'sold'
            else v.status in ('active', 'sold') end
      and (params.tsq is null or v.search_tsv @@ params.tsq)
      and (p_country is null or v.country_code = upper(p_country))
      and (p_city is null or lower(v.city) = lower(p_city))
      and (p_make is null or lower(v.make) = lower(p_make))
      and (p_min_year is null or v.year >= p_min_year)
      and (p_max_year is null or v.year <= p_max_year)
      and (p_condition is null or v.condition = p_condition)
      and (p_max_mileage_km is null or v.mileage_km <= p_max_mileage_km)
      and (p_min_mileage_km is null or v.mileage_km >= p_min_mileage_km)
      and (p_body is null or v.body_style = p_body)
      and (p_transmission is null or v.transmission = p_transmission)
      and (p_fuel is null or v.fuel_type = p_fuel)
      and (p_segment is null or v.segment = p_segment)
      and (p_has_3d is null or (p_has_3d and v.asset_id is not null) or (not p_has_3d and v.asset_id is null))
      and (p_seller_id is null or v.seller_id = p_seller_id)
      and (p_include_demo or not v.is_demo)
      and (p_seller_type is null
           or (p_seller_type = 'dealer' and s.account_type = 'dealer')
           or (p_seller_type = 'private' and s.account_type = 'private_seller'))
      and (
        (p_min_price is null and p_max_price is null)
        -- Same-currency listings compare exactly.
        or (v.currency = coalesce(p_price_currency, v.currency)
            and (p_min_price is null or v.price >= p_min_price)
            and (p_max_price is null or v.price <= p_max_price))
        -- Other currencies compare via USD reference prices when rates are configured.
        or (p_price_currency is not null and v.currency <> p_price_currency
            and params.price_rate is not null and v.price_reference_usd is not null
            and (p_min_price is null or v.price_reference_usd >= p_min_price / params.price_rate)
            and (p_max_price is null or v.price_reference_usd <= p_max_price / params.price_rate))
      )
  )
  select m.id, count(*) over () as total_count
  from matches m
  order by
    case when p_sort = 'relevance' then m.rank end desc nulls last,
    case when p_sort = 'relevance' then m.featured::int end desc,
    case when p_sort = 'price_asc' then m.price_reference_usd end asc nulls last,
    case when p_sort = 'price_desc' then m.price_reference_usd end desc nulls last,
    case when p_sort in ('price_asc', 'price_desc') then m.currency end asc,
    case when p_sort = 'price_asc' then m.price end asc,
    case when p_sort = 'price_desc' then m.price end desc,
    case when p_sort = 'year_desc' then m.year end desc,
    case when p_sort = 'year_asc' then m.year end asc,
    case when p_sort = 'mileage_asc' then m.mileage_km end asc,
    m.published_at desc nulls last,
    m.id
  limit greatest(1, least(p_limit, 60))
  offset greatest(0, p_offset);
$$;

-- Recalculate USD reference prices after the rates job runs.
create or replace function public.refresh_price_references()
returns int
language plpgsql
as $$
declare
  n int;
begin
  if current_user in ('anon', 'authenticated') and not public.is_admin() then
    raise exception 'Not allowed' using errcode = '42501';
  end if;
  update public.vehicles set price_reference_usd = public.price_to_usd(price, currency)
   where price_reference_usd is distinct from public.price_to_usd(price, currency);
  get diagnostics n = row_count;
  return n;
end;
$$;

-- Aggregate platform statistics for the admin overview.
create or replace function public.admin_platform_stats()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Administrators only' using errcode = '42501';
  end if;
  return jsonb_build_object(
    'listings_live', (select count(*) from public.vehicles v join public.profiles p on p.id = v.seller_id
                       where v.status = 'active' and p.status = 'active' and not v.is_demo),
    'listings_pending', (select count(*) from public.vehicles where status = 'pending_review'),
    'listings_demo', (select count(*) from public.vehicles where is_demo),
    'sellers', (select count(*) from public.profiles where account_type in ('private_seller', 'dealer')),
    'dealers', (select count(*) from public.dealer_profiles),
    'buyers', (select count(*) from public.profiles where account_type = 'buyer'),
    'enquiries_30d', (select count(*) from public.enquiries where created_at > now() - interval '30 days'),
    'reports_open', (select count(*) from public.listing_reports where status in ('open', 'reviewing')),
    'verifications_pending', (select count(*) from public.verification_requests where status = 'pending')
  );
end;
$$;

-- ════════════════════════════════════════════════════════════════════════════
-- Row Level Security
-- ════════════════════════════════════════════════════════════════════════════

alter table public.countries enable row level security;
alter table public.exchange_rates enable row level security;
alter table public.platform_settings enable row level security;
alter table public.admin_users enable row level security;
alter table public.profiles enable row level security;
alter table public.profile_private enable row level security;
alter table public.dealer_profiles enable row level security;
alter table public.vehicle_3d_assets enable row level security;
alter table public.vehicles enable row level security;
alter table public.vehicle_images enable row level security;
alter table public.vehicle_view_stats enable row level security;
alter table public.favourites enable row level security;
alter table public.enquiries enable row level security;
alter table public.enquiry_messages enable row level security;
alter table public.inspection_requests enable row level security;
alter table public.listing_reports enable row level security;
alter table public.verification_requests enable row level security;
alter table public.moderation_actions enable row level security;
alter table public.contact_messages enable row level security;

-- Reference data
create policy "countries are public" on public.countries for select using (true);
create policy "admins manage countries" on public.countries for all using (public.is_admin()) with check (public.is_admin());
create policy "rates are public" on public.exchange_rates for select using (true);
create policy "settings readable by admins" on public.platform_settings for select using (public.is_admin());
create policy "admins update settings" on public.platform_settings for update using (public.is_admin()) with check (public.is_admin());
create policy "admins see own grant" on public.admin_users for select using (user_id = auth.uid());

-- Profiles: sellers are public; buyers are visible only to themselves and admins.
create policy "public seller profiles" on public.profiles for select
  using ((account_type in ('private_seller', 'dealer') and status = 'active') or id = auth.uid() or public.is_admin());
create policy "update own profile" on public.profiles for update
  using (id = auth.uid() or public.is_admin()) with check (id = auth.uid() or public.is_admin());

create policy "own private data" on public.profile_private for select using (id = auth.uid() or public.is_admin());
create policy "update own private data" on public.profile_private for update using (id = auth.uid()) with check (id = auth.uid());
create policy "insert own private data" on public.profile_private for insert with check (id = auth.uid());

create policy "public dealer profiles" on public.dealer_profiles for select
  using (exists (select 1 from public.profiles p where p.id = dealer_profiles.id and p.status = 'active') or id = auth.uid() or public.is_admin());
create policy "dealers create own profile" on public.dealer_profiles for insert
  with check (id = auth.uid() and exists (select 1 from public.profiles p where p.id = auth.uid() and p.status = 'active'));
create policy "dealers update own profile" on public.dealer_profiles for update
  using (id = auth.uid() or public.is_admin()) with check (id = auth.uid() or public.is_admin());

-- 3D assets
create policy "published assets are public" on public.vehicle_3d_assets for select using (is_published or public.is_admin());
create policy "admins manage assets" on public.vehicle_3d_assets for all using (public.is_admin()) with check (public.is_admin());

-- Vehicles: the public sees approved, available (or sold) listings from active sellers.
create policy "public listings" on public.vehicles for select using (
  (status in ('active', 'sold') and exists (select 1 from public.profiles p where p.id = vehicles.seller_id and p.status = 'active'))
  or seller_id = auth.uid()
  or public.is_admin()
);
create policy "sellers create listings" on public.vehicles for insert with check (seller_id = auth.uid());
create policy "sellers update own listings" on public.vehicles for update
  using (seller_id = auth.uid() or public.is_admin()) with check (seller_id = auth.uid() or public.is_admin());
create policy "sellers delete unpublished listings" on public.vehicles for delete
  using ((seller_id = auth.uid() and status in ('draft', 'rejected', 'pending_review')) or public.is_admin());

-- Images follow the visibility of their vehicle (RLS applies inside the subquery).
create policy "images visible with vehicle" on public.vehicle_images for select
  using (exists (select 1 from public.vehicles v where v.id = vehicle_images.vehicle_id));
create policy "sellers add images" on public.vehicle_images for insert
  with check (exists (select 1 from public.vehicles v where v.id = vehicle_images.vehicle_id and v.seller_id = auth.uid()));
create policy "sellers edit images" on public.vehicle_images for update
  using (exists (select 1 from public.vehicles v where v.id = vehicle_images.vehicle_id and v.seller_id = auth.uid()) or public.is_admin());
create policy "sellers remove images" on public.vehicle_images for delete
  using (exists (select 1 from public.vehicles v where v.id = vehicle_images.vehicle_id and v.seller_id = auth.uid()) or public.is_admin());

create policy "sellers see own stats" on public.vehicle_view_stats for select
  using (exists (select 1 from public.vehicles v where v.id = vehicle_view_stats.vehicle_id and (v.seller_id = auth.uid() or public.is_admin())));

-- Favourites
create policy "own favourites" on public.favourites for select using (user_id = auth.uid());
create policy "add favourites" on public.favourites for insert
  with check (user_id = auth.uid() and exists (select 1 from public.vehicles v where v.id = favourites.vehicle_id and v.status in ('active', 'sold')));
create policy "remove favourites" on public.favourites for delete using (user_id = auth.uid());

-- Enquiries: visible only to the buyer who sent it, the receiving seller and admins.
create policy "send enquiries" on public.enquiries for insert
  with check (buyer_id is null or buyer_id = auth.uid());
create policy "parties read enquiries" on public.enquiries for select
  using (buyer_id = auth.uid() or seller_id = auth.uid() or public.is_admin());
create policy "sellers update enquiry status" on public.enquiries for update
  using (seller_id = auth.uid() or public.is_admin()) with check (seller_id = auth.uid() or public.is_admin());

create policy "parties read messages" on public.enquiry_messages for select using (
  exists (select 1 from public.enquiries e where e.id = enquiry_messages.enquiry_id
          and (e.buyer_id = auth.uid() or e.seller_id = auth.uid() or public.is_admin())));
create policy "parties send messages" on public.enquiry_messages for insert with check (
  sender_id = auth.uid() and exists (select 1 from public.enquiries e where e.id = enquiry_messages.enquiry_id
          and e.status <> 'spam' and (e.buyer_id = auth.uid() or e.seller_id = auth.uid())));

create policy "request inspections" on public.inspection_requests for insert
  with check (buyer_id is null or buyer_id = auth.uid());
create policy "parties read inspection requests" on public.inspection_requests for select
  using (buyer_id = auth.uid() or seller_id = auth.uid() or public.is_admin());
create policy "sellers update inspection requests" on public.inspection_requests for update
  using (seller_id = auth.uid() or public.is_admin()) with check (seller_id = auth.uid() or public.is_admin());

-- Reports
create policy "anyone can report" on public.listing_reports for insert with check (reporter_id is null or reporter_id = auth.uid());
create policy "reporters and admins read reports" on public.listing_reports for select using (reporter_id = auth.uid() or public.is_admin());
create policy "admins handle reports" on public.listing_reports for update using (public.is_admin()) with check (public.is_admin());

-- Verification
create policy "apply for verification" on public.verification_requests for insert with check (profile_id = auth.uid());
create policy "applicants and admins read verification" on public.verification_requests for select using (profile_id = auth.uid() or public.is_admin());
create policy "applicants cancel, admins review" on public.verification_requests for update
  using (profile_id = auth.uid() or public.is_admin()) with check (profile_id = auth.uid() or public.is_admin());

-- Moderation log: admins see everything; sellers see the history of their own listings.
create policy "moderation log visibility" on public.moderation_actions for select using (
  public.is_admin()
  or (target_type = 'vehicle' and exists (select 1 from public.vehicles v where v.id = moderation_actions.target_id and v.seller_id = auth.uid())));
create policy "admins write moderation log" on public.moderation_actions for insert with check (public.is_admin() and actor_id = auth.uid());

-- Contact
create policy "anyone can contact" on public.contact_messages for insert with check (true);
create policy "admins read contact" on public.contact_messages for select using (public.is_admin());
create policy "admins update contact" on public.contact_messages for update using (public.is_admin()) with check (public.is_admin());

-- ─── Grants (Supabase roles) ───────────────────────────────────────────────
grant usage on schema public to anon, authenticated;
grant select on all tables in schema public to anon, authenticated;
grant insert, update, delete on all tables in schema public to authenticated;
grant insert on public.enquiries, public.inspection_requests, public.listing_reports, public.contact_messages to anon;
revoke execute on function public.refresh_price_references() from public, anon, authenticated;
grant execute on function public.search_vehicles to anon, authenticated;
grant execute on function public.record_vehicle_view(uuid) to anon, authenticated;
grant execute on function public.admin_platform_stats() to authenticated;
grant execute on function public.is_admin() to anon, authenticated;

-- ─── Seller analytics (aggregates over the caller's own listings only) ─────
create or replace function public.seller_listing_stats()
returns table (vehicle_id uuid, views_total int, views_30d bigint, saves bigint, enquiries bigint)
language sql
stable
security definer
set search_path = public
as $$
  select v.id,
         v.view_count,
         coalesce((select sum(s.views) from public.vehicle_view_stats s where s.vehicle_id = v.id and s.day > current_date - 30), 0)::bigint,
         (select count(*) from public.favourites f where f.vehicle_id = v.id),
         (select count(*) from public.enquiries e where e.vehicle_id = v.id and e.status <> 'spam')
  from public.vehicles v
  where v.seller_id = auth.uid();
$$;

create or replace function public.seller_views_daily(p_days int default 30)
returns table (day date, views bigint)
language sql
stable
security definer
set search_path = public
as $$
  select d::date, coalesce(sum(s.views), 0)::bigint
  from generate_series(current_date - (least(greatest(p_days, 1), 180) - 1), current_date, interval '1 day') d
  left join public.vehicle_view_stats s
    on s.day = d::date and s.vehicle_id in (select id from public.vehicles where seller_id = auth.uid())
  group by d
  order by d;
$$;

revoke execute on function public.seller_listing_stats() from public, anon;
revoke execute on function public.seller_views_daily(int) from public, anon;
grant execute on function public.seller_listing_stats() to authenticated;
grant execute on function public.seller_views_daily(int) to authenticated;

-- The exchange-rate job runs with the service role.
grant execute on function public.refresh_price_references() to service_role;
