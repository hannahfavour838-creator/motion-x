-- ════════════════════════════════════════════════════════════════════════════
-- MOTION X — storage buckets & policies
-- Objects are stored under "<auth.uid()>/<...>" so ownership is enforced by
-- path. Size and MIME type limits are enforced by the bucket itself.
-- ════════════════════════════════════════════════════════════════════════════

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('vehicle-images', 'vehicle-images', true, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'image/avif']),
  ('dealer-logos', 'dealer-logos', true, 2097152, array['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Public buckets serve files by URL; listing and writing still require policies.
create policy "upload own vehicle images" on storage.objects for insert to authenticated
  with check (bucket_id = 'vehicle-images' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "delete own vehicle images" on storage.objects for delete to authenticated
  using (bucket_id = 'vehicle-images' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "read own vehicle image objects" on storage.objects for select to authenticated
  using (bucket_id = 'vehicle-images' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "upload own dealer logo" on storage.objects for insert to authenticated
  with check (bucket_id = 'dealer-logos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "replace own dealer logo" on storage.objects for update to authenticated
  using (bucket_id = 'dealer-logos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "delete own dealer logo" on storage.objects for delete to authenticated
  using (bucket_id = 'dealer-logos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "read own dealer logo objects" on storage.objects for select to authenticated
  using (bucket_id = 'dealer-logos' and (storage.foldername(name))[1] = auth.uid()::text);
