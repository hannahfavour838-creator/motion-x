-- Licensed 3D assets available to the showroom.
-- "Car Concept" — model & textures © 2024 Darmstadt Graphics Group GmbH, by Eric Chadwick,
-- licensed CC BY 4.0, derived from a CC0 model by "Unity Fan". Modified for MOTION X:
-- logo surfaces removed, textures recompressed, geometry meshopt-compressed.
insert into public.vehicle_3d_assets (slug, name, format, url, poster_url, file_bytes, credit, license, license_url, description, paint_options)
values (
  'concept-car',
  'Silver Concept Car',
  'glb',
  '/models/concept-car.glb',
  '/renders/hero-fallback.webp',
  3356056,
  '“Car Concept” by Eric Chadwick / Darmstadt Graphics Group GmbH (2024), based on a CC0 model by Unity Fan. Modified.',
  'CC BY 4.0',
  'https://creativecommons.org/licenses/by/4.0/',
  'A low, wide electric concept coupé used as the MOTION X studio car. It is a showcase model and is not offered for sale.',
  '[
    {"id":"liquid-silver","name":"Liquid Silver","color":"#c9ced6","metalness":1,"roughness":0.18,"clearcoat":1},
    {"id":"obsidian","name":"Obsidian","color":"#0d0f13","metalness":0.9,"roughness":0.25,"clearcoat":1},
    {"id":"carmine","name":"Carmine Candy","color":"#8f0a0a","metalness":1,"roughness":0.22,"clearcoat":1},
    {"id":"pearl","name":"Pearl","color":"#e9e6df","metalness":0.6,"roughness":0.3,"clearcoat":1},
    {"id":"graphite","name":"Torched Graphite","color":"#2a2d33","metalness":1,"roughness":0.3,"clearcoat":1}
  ]'::jsonb
)
on conflict (slug) do nothing;
