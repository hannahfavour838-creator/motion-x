-- Security & workflow tests for the MOTION X schema.
-- Run with:  npm run db:test   (requires a local PostgreSQL 15+; see README)
\set ON_ERROR_STOP on
set client_min_messages = notice;

create schema test;
grant usage on schema test to anon, authenticated;

create function test.ok(cond boolean, msg text) returns void language plpgsql as $$
begin
  if not coalesce(cond, false) then raise exception 'FAIL: %', msg; end if;
  raise notice 'ok  %', msg;
end $$;

create function test.fails(stmt text, msg text) returns void language plpgsql as $$
begin
  begin
    execute stmt;
  exception when others then
    raise notice 'ok  % (rejected: %)', msg, sqlerrm;
    return;
  end;
  raise exception 'FAIL: % — statement unexpectedly succeeded', msg;
end $$;

create function test.act_as(p_role text, p_uid uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claim.sub', coalesce(p_uid::text, ''), false);
  perform set_config('request.jwt.claim.role', p_role, false);
  execute format('set role %I', p_role);
end $$;
grant execute on all functions in schema test to anon, authenticated;

-- ── Fixtures (as the database owner) ─────────────────────────────────────
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000000a', 'seller@example.test', '{"account_type":"private_seller","display_name":"Alex Seller"}'),
  ('00000000-0000-0000-0000-00000000000b', 'dealer@example.test', '{"account_type":"dealer","display_name":"Northline Motors"}'),
  ('00000000-0000-0000-0000-00000000000c', 'buyer@example.test',  '{"account_type":"buyer","display_name":"Casey Buyer"}'),
  ('00000000-0000-0000-0000-00000000000d', 'admin@example.test',  '{"account_type":"admin","display_name":"Dana Admin"}'),
  ('00000000-0000-0000-0000-00000000000e', 'gone@example.test',   '{"account_type":"private_seller","display_name":"Suspended Seller"}');

insert into public.admin_users (user_id, note) values ('00000000-0000-0000-0000-00000000000d', 'test');
insert into public.dealer_profiles (id, slug, business_name, country_code, city)
  values ('00000000-0000-0000-0000-00000000000b', 'northline-motors', 'Northline Motors', 'GB', 'Manchester');
update public.profiles set status = 'suspended' where id = '00000000-0000-0000-0000-00000000000e';
insert into public.exchange_rates (currency, rate, provider) values ('GBP', 0.80, 'test'), ('EUR', 0.90, 'test'), ('JPY', 150, 'test');

select test.ok((select account_type from public.profiles where id = '00000000-0000-0000-0000-00000000000d') = 'buyer',
  'sign-up metadata cannot request an admin account type');

insert into public.vehicles (seller_id, make, model, year, price, currency, country_code, city, mileage, condition, body_style, transmission, fuel_type, status)
  values ('00000000-0000-0000-0000-00000000000e', 'Ford', 'Focus', 2018, 9000, 'GBP', 'GB', 'Leeds', 40000, 'used', 'hatchback', 'manual', 'petrol', 'active');

-- ── Seller A creates and submits a listing ───────────────────────────────
select test.act_as('authenticated', '00000000-0000-0000-0000-00000000000a');

insert into public.vehicles (seller_id, make, model, variant, year, price, currency, country_code, city, mileage, mileage_unit,
                             condition, body_style, transmission, fuel_type, segment, status, is_demo, featured, inspected_at)
  values ('00000000-0000-0000-0000-00000000000a', 'Porsche', '911', 'Carrera S', 2021, 98000, 'GBP', 'GB', 'London', 12000, 'mi',
          'used', 'coupe', 'dual_clutch', 'petrol', 'performance', 'draft', true, true, now());

select test.ok((select is_demo = false and featured = false and inspected_at is null and slug like '2021-porsche-911-carrera-s-%'
                from public.vehicles where make = 'Porsche'), 'seller cannot self-assign demo/featured/inspected flags; slug generated');
select test.ok((select mileage_km from public.vehicles where make = 'Porsche') = 19312, 'mileage normalised to km');

select test.fails($$insert into public.vehicles (seller_id, make, model, year, price, currency, country_code, city, mileage, condition, body_style, transmission, fuel_type, status)
  values ('00000000-0000-0000-0000-00000000000a', 'BMW', 'M3', 2022, 70000, 'EUR', 'DE', 'Munich', 5000, 'used', 'sedan', 'automatic', 'petrol', 'active')$$,
  'seller cannot publish a listing directly');

select test.fails($$insert into public.vehicles (seller_id, make, model, year, price, currency, country_code, city, mileage, condition, body_style, transmission, fuel_type)
  values ('00000000-0000-0000-0000-00000000000b', 'BMW', 'M3', 2022, 70000, 'EUR', 'DE', 'Munich', 5000, 'used', 'sedan', 'automatic', 'petrol')$$,
  'seller cannot create a listing for another account');

update public.vehicles set status = 'pending_review' where make = 'Porsche';
select test.ok((select status = 'pending_review' and submitted_at is not null from public.vehicles where make = 'Porsche'), 'draft submitted for review');

select test.fails($$update public.vehicles set status = 'active' where make = 'Porsche'$$, 'seller cannot approve own listing');
select test.fails($$update public.vehicles set featured = true where make = 'Porsche'$$, 'seller cannot feature own listing');
select test.fails($$update public.profiles set identity_verified_at = now() where id = auth.uid()$$, 'seller cannot self-verify identity');
select test.fails($$insert into public.admin_users (user_id) values (auth.uid())$$, 'seller cannot grant admin');
select test.ok(not public.is_admin(), 'seller is not admin');

insert into storage.objects (bucket_id, name) values ('vehicle-images', '00000000-0000-0000-0000-00000000000a/listing/photo-1.jpg');
select test.fails($$insert into storage.objects (bucket_id, name) values ('vehicle-images', '00000000-0000-0000-0000-00000000000b/listing/photo.jpg')$$,
  'seller cannot upload into another user''s folder');
insert into public.vehicle_images (vehicle_id, storage_path, position)
  select id, '00000000-0000-0000-0000-00000000000a/listing/photo-1.jpg', 0 from public.vehicles where make = 'Porsche';
select test.fails($$insert into public.vehicle_images (vehicle_id, storage_path) select id, '00000000-0000-0000-0000-00000000000b/x.jpg' from public.vehicles where make = 'Porsche'$$,
  'image path must be inside the seller''s folder');
select test.fails($$insert into public.vehicle_images (vehicle_id, url) select id, 'https://example.com/x.jpg' from public.vehicles where make = 'Porsche'$$,
  'sellers cannot attach arbitrary external image URLs');
reset role;

-- ── Visibility before approval ───────────────────────────────────────────
select test.act_as('anon', null);
select test.ok((select count(*) from public.vehicles) = 0, 'public sees no pending listings (and nothing from suspended sellers)');
select test.ok((select count(*) from public.search_vehicles()) = 0, 'search returns nothing before approval');
select test.ok((select count(*) from public.profiles where account_type = 'buyer') = 0, 'buyer profiles are private');
select test.ok((select count(*) from public.profiles where id = '00000000-0000-0000-0000-00000000000a') = 1, 'seller profiles are public');
select test.ok((select count(*) from public.profile_private) = 0, 'private profile data hidden from public');
select test.fails($$select count(*) from private.rate_limit_events$$, 'rate-limit table not readable by clients');
reset role;

-- ── Another seller cannot touch A's listing ──────────────────────────────
select test.act_as('authenticated', '00000000-0000-0000-0000-00000000000b');
update public.vehicles set price = 1 where make = 'Porsche';
delete from public.vehicles where make = 'Porsche';
reset role;
select test.ok((select price from public.vehicles where make = 'Porsche') = 98000, 'other seller cannot edit or delete the listing');

-- ── Admin approves ───────────────────────────────────────────────────────
select test.act_as('authenticated', '00000000-0000-0000-0000-00000000000d');
select test.ok(public.is_admin(), 'admin recognised via admin_users');
update public.vehicles set status = 'active' where make = 'Porsche';
select test.ok((select approved_at is not null and published_at is not null from public.vehicles where make = 'Porsche'), 'approval stamps approval & publish dates');
select test.ok((select count(*) from public.moderation_actions where action = 'admin_status_change' and to_status = 'active') = 1, 'approval recorded in moderation log');
select test.ok((public.admin_platform_stats() ->> 'listings_live')::int = 1, 'admin statistics available');
reset role;

select test.act_as('authenticated', '00000000-0000-0000-0000-00000000000c');
select test.fails($$select public.admin_platform_stats()$$, 'non-admins cannot read platform statistics');
reset role;

-- ── Public search ────────────────────────────────────────────────────────
select test.act_as('anon', null);
select test.ok((select count(*) from public.vehicles) = 1, 'approved listing is public');
select test.ok((select count(*) from public.vehicle_images) = 1, 'images of public listings are public');
select test.ok((select count(*) from public.search_vehicles(p_q => 'porsc')) = 1, 'prefix search matches make');
select test.ok((select count(*) from public.search_vehicles(p_q => '911 carrera')) = 1, 'multi-word search');
select test.ok((select count(*) from public.search_vehicles(p_q => 'ferrari')) = 0, 'non-matching search');
select test.ok((select count(*) from public.search_vehicles(p_country => 'gb', p_body => 'coupe', p_seller_type => 'private')) = 1, 'combined filters');
select test.ok((select count(*) from public.search_vehicles(p_seller_type => 'dealer')) = 0, 'seller type filter');
select test.ok((select count(*) from public.search_vehicles(p_max_price => 100000, p_price_currency => 'GBP')) = 1, 'same-currency price filter');
-- 98,000 GBP ≈ 122,500 USD at the test rate
select test.ok((select count(*) from public.search_vehicles(p_min_price => 120000, p_max_price => 125000, p_price_currency => 'USD')) = 1, 'cross-currency price filter via rates');
select test.ok((select count(*) from public.search_vehicles(p_max_price => 110000, p_price_currency => 'USD')) = 0, 'cross-currency upper bound respected');
select test.ok((select count(*) from public.search_vehicles(p_max_mileage_km => 15000)) = 0, 'mileage filter compares in km');
select test.ok((select count(*) from public.search_vehicles(p_max_mileage_km => 20000)) = 1, 'mileage filter in km includes listing');
select public.record_vehicle_view(id) from public.vehicles where make = 'Porsche';
select test.fails($$select public.refresh_price_references()$$, 'public cannot run the rates refresh');

-- Enquiry from an anonymous visitor
insert into public.enquiries (vehicle_id, seller_id, name, email, message)
  select id, '00000000-0000-0000-0000-00000000000c', 'Visitor', 'visitor@example.test', 'Is the car still available for viewing?' from public.vehicles where make = 'Porsche';
select test.ok((select count(*) from public.enquiries) = 0, 'anonymous sender cannot read enquiries back');
insert into public.listing_reports (vehicle_id, reason, details)
  select id, 'misleading_information', 'Photos do not match.' from public.vehicles where make = 'Porsche';
select test.ok((select count(*) from public.listing_reports) = 0, 'reports are not publicly readable');
insert into public.contact_messages (name, email, topic, message) values ('Visitor', 'visitor@example.test', 'buying', 'Hello, I have a question.');
reset role;

select test.ok((select seller_id from public.enquiries limit 1) = '00000000-0000-0000-0000-00000000000a', 'enquiry routed to the real seller, not the client-supplied one');
select test.ok((select view_count from public.vehicles where make = 'Porsche') = 1, 'view recorded');

-- Rate limiting
select test.act_as('anon', null);
do $$
declare i int;
begin
  for i in 1..5 loop
    insert into public.enquiries (vehicle_id, seller_id, name, email, message)
      select id, seller_id, 'Visitor', 'visitor@example.test', 'Follow-up message number ' || i from public.vehicles where make = 'Porsche';
  end loop;
end $$;
select test.fails($$insert into public.enquiries (vehicle_id, seller_id, name, email, message)
  select id, seller_id, 'Visitor', 'visitor@example.test', 'Seventh message in an hour' from public.vehicles where make = 'Porsche'$$,
  'enquiries are rate limited per email');
select test.fails($$insert into public.inspection_requests (vehicle_id, seller_id, name, email)
  select id, seller_id, 'Visitor', 'other@example.test' from public.vehicles where make = 'Porsche'$$,
  'inspection requests require the seller to enable them');
reset role;

-- ── Buyer ────────────────────────────────────────────────────────────────
select test.act_as('authenticated', '00000000-0000-0000-0000-00000000000c');
select test.fails($$insert into public.enquiries (vehicle_id, seller_id, buyer_id, name, email, message)
  select id, seller_id, '00000000-0000-0000-0000-00000000000b', 'Casey', 'buyer@example.test', 'Impersonating somebody else' from public.vehicles where make = 'Porsche'$$,
  'buyer cannot send an enquiry as someone else');
insert into public.enquiries (vehicle_id, seller_id, name, email, message)
  select id, seller_id, 'Casey', 'buyer@example.test', 'I would like to arrange a viewing.' from public.vehicles where make = 'Porsche';
select test.ok((select count(*) from public.enquiries) = 1, 'buyer sees only their own enquiry');
select test.ok((select buyer_id from public.enquiries) = auth.uid(), 'buyer id attached server-side');
update public.enquiries set status = 'closed';
select test.ok((select status from public.enquiries) = 'new', 'buyer cannot change enquiry status');
insert into public.favourites (user_id, vehicle_id) select auth.uid(), id from public.vehicles where make = 'Porsche';
select test.ok((select count(*) from public.favourites) = 1, 'buyer can save a public vehicle');
select test.fails($$insert into public.vehicles (seller_id, make, model, year, price, currency, country_code, city, mileage, condition, body_style, transmission, fuel_type)
  values (auth.uid(), 'Kia', 'Ceed', 2020, 12000, 'EUR', 'FR', 'Lyon', 30000, 'used', 'hatchback', 'manual', 'petrol')$$,
  'buyer accounts cannot create listings');
reset role;

-- ── Seller handles enquiries ─────────────────────────────────────────────
select test.act_as('authenticated', '00000000-0000-0000-0000-00000000000a');
select test.ok((select count(*) from public.enquiries) = 7, 'seller sees enquiries for their listings');
update public.enquiries set status = 'read' where email = 'visitor@example.test';
select test.fails($$update public.enquiries set message = 'tampered' where email = 'buyer@example.test'$$, 'seller cannot alter enquiry content');
insert into public.enquiry_messages (enquiry_id, sender_id, body)
  select id, auth.uid(), 'Yes — viewings are available on weekdays.' from public.enquiries where email = 'buyer@example.test';
select test.ok((select status from public.enquiries where email = 'buyer@example.test') = 'replied', 'reply marks enquiry as replied');
select test.ok((select count(*) from public.listing_reports) = 0, 'seller cannot read reports about their listing');
select test.ok((select count(*) from public.moderation_actions) >= 2, 'seller can read their listing history');

-- Price change keeps listing live; material edit returns it to review
update public.vehicles set price = 95000 where make = 'Porsche';
select test.ok((select status = 'active' and price_reference_usd = 118750 from public.vehicles where make = 'Porsche'), 'price change stays live and re-computes USD reference');
update public.vehicles set description = 'Now with a different story' where make = 'Porsche';
select test.ok((select status from public.vehicles where make = 'Porsche') = 'pending_review', 'material edit returns listing to review');
delete from public.vehicles where make = 'Ford';
reset role;
select test.ok((select count(*) from public.vehicles where make = 'Ford') = 1, 'seller cannot delete another seller''s listing');

select test.act_as('authenticated', '00000000-0000-0000-0000-00000000000b');
select test.ok((select count(*) from public.enquiries) = 0, 'other sellers cannot read the enquiries');
select test.ok((select count(*) from public.enquiry_messages) = 0, 'other sellers cannot read messages');
insert into public.verification_requests (profile_id, kind, details) values (auth.uid(), 'business', '{"registration_number":"12345678"}');
select test.fails($$update public.verification_requests set status = 'approved'$$, 'dealer cannot approve own verification');
select test.fails($$update public.dealer_profiles set business_verified_at = now()$$, 'dealer cannot self-verify business');
reset role;

-- ── Admin reviews ────────────────────────────────────────────────────────
select test.act_as('authenticated', '00000000-0000-0000-0000-00000000000d');
select test.ok((select count(*) from public.listing_reports) = 1, 'admin sees reports');
select test.ok((select count(*) from public.contact_messages) = 1, 'admin sees contact messages');
update public.verification_requests set status = 'approved', reviewer_note = 'Companies register checked';
update public.vehicles set status = 'suspended', rejection_reason = 'Under investigation' where make = 'Porsche';
reset role;
select test.ok((select business_verified_at is not null from public.dealer_profiles where id = '00000000-0000-0000-0000-00000000000b'), 'approved verification sets the business badge');
select test.ok((select reviewed_by = '00000000-0000-0000-0000-00000000000d' from public.verification_requests), 'reviewer recorded');

select test.act_as('authenticated', '00000000-0000-0000-0000-00000000000a');
select test.fails($$update public.vehicles set status = 'active' where make = 'Porsche'$$, 'seller cannot lift a suspension');
reset role;
select test.act_as('anon', null);
select test.ok((select count(*) from public.vehicles) = 0, 'suspended listing disappears from public view');
reset role;

-- Auto moderation mode
update public.platform_settings set value = '"auto"' where key = 'listing_moderation';
select test.act_as('authenticated', '00000000-0000-0000-0000-00000000000a');
insert into public.vehicles (seller_id, make, model, year, price, currency, country_code, city, mileage, condition, body_style, transmission, fuel_type, status)
  values (auth.uid(), 'Toyota', 'Corolla', 2020, 2400000, 'JPY', 'JP', 'Osaka', 30000, 'used', 'hatchback', 'automatic', 'hybrid', 'pending_review');
select test.ok((select status = 'active' and price_reference_usd = 16000 from public.vehicles where make = 'Toyota'), 'auto moderation publishes immediately (JPY converted)');
reset role;



-- Seller analytics only cover the caller's listings
select test.act_as('authenticated', '00000000-0000-0000-0000-00000000000a');
select test.ok((select count(*) from public.seller_listing_stats()) = 2, 'seller stats cover own listings');
select test.ok((select saves from public.seller_listing_stats() s join public.vehicles v on v.id = s.vehicle_id where v.make = 'Porsche') = 1, 'saves aggregated without exposing who saved');
select test.ok((select count(*) from public.seller_views_daily(30)) = 30, 'daily view series returns 30 days');
reset role;
select test.act_as('authenticated', '00000000-0000-0000-0000-00000000000b');
select test.ok((select count(*) from public.seller_listing_stats()) = 0, 'other sellers see none of these stats');
reset role;
select test.act_as('anon', null);
select test.fails($$select * from public.seller_listing_stats()$$, 'anonymous users cannot call seller stats');
reset role;
\echo 'Seller analytics tests passed.'
\echo 'All MOTION X database security tests passed.'
