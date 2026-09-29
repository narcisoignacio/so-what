CREATE TABLE places (
  id          INTEGER PRIMARY KEY,          -- internal only
  slug        TEXT NOT NULL UNIQUE,         -- public, stable
  source_key  TEXT NOT NULL UNIQUE,
  name        TEXT NOT NULL,
  kind        TEXT NOT NULL CHECK (kind IN ('bus_stop','park','playground','school')),
  lat         REAL NOT NULL,
  lon         REAL NOT NULL,
  zip         TEXT,
  tract_id    TEXT NOT NULL,
  cell_row    INTEGER NOT NULL,             -- floor(lat / CELL_SIZE_DEG)
  cell_col    INTEGER NOT NULL,             -- floor(lon / CELL_SIZE_DEG)
  air_rank    INTEGER NOT NULL CHECK (air_rank  BETWEEN 0 AND 3),  -- denormalized from risks.level
  fire_rank   INTEGER NOT NULL CHECK (fire_rank BETWEEN 0 AND 3),
  heat_rank   INTEGER NOT NULL CHECK (heat_rank BETWEEN 0 AND 3),
  sea_flag    INTEGER NOT NULL DEFAULT 0 CHECK (sea_flag IN (0,1)),  -- inside projected mid-century coastal flood area
  is_showcase INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX places_cell ON places (cell_row, cell_col);

CREATE TABLE risks (
  place_id  INTEGER NOT NULL REFERENCES places(id),
  type      TEXT NOT NULL CHECK (type IN ('air','fire','heat','sea')),
  level     TEXT CHECK (level IN ('low','elevated','high','severe')),  -- NULL only for 'sea' (projection-only)
  value     REAL,                            -- raw metric (percentile, class code, etc.)
  detail    TEXT NOT NULL,                   -- the specific risk
  so_what   TEXT NOT NULL,                   -- the human consequence (today's conditions)
  source_id TEXT NOT NULL REFERENCES sources(id),
  trend           TEXT,                      -- projected-change sentence; NULL when the type has no projection
  trend_now       REAL,                      -- baseline-period value (e.g. extreme-heat days/yr)
  trend_future    REAL,                      -- mid-century value, same unit
  trend_source_id TEXT REFERENCES sources(id),
  CHECK ((trend IS NULL) = (trend_source_id IS NULL)
     AND (trend IS NULL) = (trend_now IS NULL)
     AND (trend IS NULL) = (trend_future IS NULL)),
  CHECK ((type = 'sea') = (level IS NULL)),
  CHECK (type <> 'sea' OR trend IS NULL),    -- a sea row is itself the projection; so_what carries it
  PRIMARY KEY (place_id, type)
);

CREATE TABLE sources (
  id           TEXT PRIMARY KEY,             -- e.g. 'calenviroscreen_4_0'
  name         TEXT NOT NULL,
  url          TEXT NOT NULL,
  retrieved_on TEXT NOT NULL,                -- ISO date
  data_years   TEXT                          -- years the measurements describe, e.g. '2015–2017' or '2025'; shown on
                                             -- `detail` lines (§5.5); NULL only for sources that aren't measurements (tips)
);

CREATE TABLE zips (
  zip TEXT PRIMARY KEY,
  min_lat REAL NOT NULL, max_lat REAL NOT NULL, min_lon REAL NOT NULL, max_lon REAL NOT NULL,
  center_lat REAL NOT NULL, center_lon REAL NOT NULL
);

CREATE TABLE meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);
-- keys: build_date, cell_size_deg, schema_version, row_count_places, featured_slug,
--       projection_scenario, projection_baseline_period, projection_future_period,
--       sea_scenario, sea_rise, sea_flood_condition, sea_period, source versions