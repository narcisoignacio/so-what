-- M0 spike seed: six illustrative places with made-up ranks, not real data.
-- Replaced by the M2 pipeline build (build.py).
-- cell_row = floor(lat / 0.01), cell_col = floor(lon / 0.01), in IEEE doubles (spec §6.1).
-- main-1st sits exactly on 34.05, and 34.05 / 0.01 = 3404.9999999999995, so its cell_row is 3404.
INSERT INTO places (id, slug, source_key, name, kind, lat, lon, zip, tract_id, cell_row, cell_col, air_rank, fire_rank, heat_rank, sea_flag) VALUES
  (1, 'vermont-sunset', 'm0:1', 'Vermont / Sunset', 'bus_stop', 34.0980, -118.2916, '90027', 'm0-tract-1', 3409, -11830, 2, 0, 3, 0),
  (2, 'echo-park', 'm0:2', 'Echo Park', 'park', 34.0729, -118.2606, '90026', 'm0-tract-2', 3407, -11827, 1, 0, 1, 0),
  (3, 'grand-park', 'm0:3', 'Grand Park', 'park', 34.0561, -118.2468, '90012', 'm0-tract-3', 3405, -11825, 3, 0, 2, 0),
  (4, 'sample-beach-playground', 'm0:4', 'Sample Beach Playground', 'playground', 33.9850, -118.4695, '90291', 'm0-tract-4', 3398, -11847, 0, 0, 0, 1),
  (5, 'sample-elementary-school', 'm0:5', 'Sample Elementary School', 'school', 34.1478, -118.1445, '91107', 'm0-tract-5', 3414, -11815, 0, 1, 0, 0),
  (6, 'main-1st', 'm0:6', 'Main / 1st', 'bus_stop', 34.05, -118.25, '90012', 'm0-tract-6', 3404, -11825, 0, 0, 2, 0);

INSERT INTO meta (key, value) VALUES
  ('build_date', '2026-09-28'),
  ('cell_size_deg', '0.01'),
  ('schema_version', '1'),
  ('row_count_places', '6');