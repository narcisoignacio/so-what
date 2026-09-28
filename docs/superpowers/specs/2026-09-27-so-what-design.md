# So What? — Design Spec

**Date:** 2026-09-27 (rev. 9, 2026-09-28: place panel decisions from the [wireframes](../../wireframes/wireframes-place-panel.html) — signal-meter level glyph, risk glyphs, at-a-glance row, low cards with a trend stay expanded, one places list per page, "About this data" on phones. Rev. 8: accessibility — "Places near here" list and N-nearest search, level in card headings, pin glyphs, focus/announcement/reflow rules, WCAG 2.2 AA target, English only; from the [accessibility review](../../accessibility/2026-09-28-so-what-accessibility-review.md). Rev. 7: sea level rise added as a projection-only risk; intermediate emissions scenario. Rev. 6: today's conditions as the core of each card, plus one projected-change line for risks climate change is making worse. Rev. 5: featured place chosen in M1, consequence-first risk cards, So What? length cap — from [grader's first 30 seconds](../../journeys/2026-09-28-grader-first-30-seconds.md))
**Status:** Draft, awaiting review
**Context:** CS50x final project (due before 2027-06-30 4:59 PM PDT), also deployed publicly on a custom domain, on free tiers.

---

## 1. Intent

**Problem.** Climate data is too abstract for the average person. County-level projections and percentile scores don't answer "what does this mean for the bus stop I wait at, and is it getting worse?"

**Solution.** An interactive map of Los Angeles County that pins specific, everyday places — bus stops, parks, playgrounds, schools — and, for each, states the specific climate-related risk and its **"So What?"**: the concrete, human consequence.

**Today first, then the trend.** Each card is built on **today's conditions**, because people can check them against their own experience, act on them now, and because present-day data is fine-grained enough for neighboring places to differ. For risks that climate change is making worse, the card adds **one projected-change line** ("and it's getting hotter: …"), which turns a local hazard into a climate story. Projections support the card; they never set its level (§5.4).

| Risk | Today (sets the level) | Projected change (one line) |
|---|---|---|
| Heat | Urban heat island, by tract | Extreme-heat days per year, now vs. mid-century |
| Wildfire | CAL FIRE hazard zone | Only if M1 finds usable neighborhood-scale projections |
| Air | Fine-particle pollution, by tract | None. Labelled as present-day; no neighborhood-scale air projections are known to exist. |
| Sea level rise | None of its own. The card's "today" content comes from the other three risks' findings, if any. | Whether the place lies inside the projected coastal flood area at mid-century. Coastal places only. |

**Sea level rise is the one projection-only risk.** It has no level, because levels describe today (§5.4). Instead a place is *flagged* when it lies inside the projected flood area, and a flagged place is visible on the map when the sea-level filter is on, even if it has no elevated findings today (§5.3, §6.2). Its pin and card are styled as "Projected" so present and future are never confused.

**Audience.** Primary: CS50 graders and demo-video viewers (most of whom are *not* in LA). Secondary: LA residents who find the public site.

**Success looks like:**
- A grader outside LA can open the site and understand a real LA place's risks within ~30 seconds.
- Every claim on a card traces to a cited public data source.
- Every task — finding a place, reading its risks, filtering, sharing — can be completed with a keyboard alone and with a screen reader, without using the map. The site meets **WCAG 2.2 AA** (§7.5).
- A place's URL can be shared and renders a meaningful preview.
- The README (≥ ~750 words) can explain every file and design decision clearly.
- Hosting stays on free tiers with no user-visible cold start.

**Author background.** Web developer (Next.js-experienced, bootcamp-trained) taking CS50x to fill CS fundamentals. The CS-heavy work — the ETL pipeline, point-in-polygon, a hand-written spatial grid index, and nearest-neighbor search — is therefore the heart of the project, not the web framework.

## 2. Scope

**In scope (MVP):**
- LA County only.
- Four risk types: **air quality, wildfire, extreme heat** (today's conditions, each with a level) and **sea level rise** (projection only, flagged rather than levelled).
- One projected-change line for heat (and for wildfire if M1 confirms data), plus the sea-level-rise card, all using **one intermediate emissions scenario** and **one mid-century period**, named on the card and the About page:
  - heat (and wildfire): **SSP2-4.5**, from Cal-Adapt's downscaled projections;
  - sea level rise: the **Intermediate** scenario in California's sea-level-rise guidance (Ocean Protection Council), which M1 confirms follows the NOAA interagency scenario names.
- Place kinds: `bus_stop`, `park`, `playground`, `school`.
- Entry points: browser Geolocation, zip-code search, featured starting spot.
- A **"Places near here" list** alongside the map: the N nearest visible places as ordinary links, so every task works without the map (§6.4, §7.5).
- Shareable, server-rendered place pages with Open Graph previews.
- Risk-type filters persisted in the URL.
- About page documenting method, thresholds, sources, and limitations.

**Out of scope (YAGNI):**
- User accounts, saved places, comments, or any user-written data.
- Areas outside LA County.
- Inland and street flooding (no reliable public "pooling intersections" dataset). Coastal flooding from sea level rise is in scope.
- Rising groundwater and coastal erosion (cliff and beach loss).
- **Languages other than English.** A large share of LA County residents speak Spanish at home, and they are over-represented in the neighborhoods with the highest pollution burden, so an English-only site leaves out many of the people it describes. Translation is still out of scope: the risk text is health wording that would need review by a fluent speaker, and machine-translated health claims are not acceptable. The About page states this limitation (§15).
- LLM-generated text.
- Zip-code choropleth / area-shading views.
- Live or real-time data (refreshed by manually re-running the pipeline).
- Multiple emissions scenarios, end-of-century (2100) horizons, or projection ranges on the card (the About page explains the scenario and uncertainty instead).
- Air-quality projections.
- Projections affecting a place's level, pin visibility, or filters.

## 3. Architecture overview

```
 public data sources ──► pipeline/ (Python ETL, run manually)
                              │  fetch → normalize → join → grid → score → render → write → validate
                              ▼
                      data/sowhat-YYYYMMDD.db  (local SQLite build artifact)
                              │  upload (turso CLI)
                              ▼
                      Turso Cloud database (free tier, read-only token for the app)
                              ▲
                              │  Drizzle ORM + @tursodatabase/serverless
                      web/ (Next.js App Router on Vercel Hobby) ◄── custom domain (HTTPS)
```

Two halves with one contract between them: **`pipeline/schema.sql`** (§5.3). The pipeline creates and fills the database; the app only reads it.

## 4. Repository layout

The project root is `final-project/` (submitted via `submit50`; `README.md` must live here).

```
final-project/
  README.md                  CS50 README: what, why, every file, design decisions, AI-use citation
  docs/superpowers/specs/    this spec (and later, the implementation plan)
  pipeline/                  Python ETL
    schema.sql               single source of truth for the database schema
    fetch.py                 download raw sources → data/raw/
    normalize.py             clip to LA County, select fields, reproject to WGS84 lat/lon (pyproj)
    geometry.py              hand-written point-in-polygon (ray casting; holes; multipolygons) + bbox prefilter
    grid.py                  grid-cell assignment (§6.1); CELL_SIZE_DEG constant
    join.py                  assign tract_id, fire zone, zip, projection cell to every place
    score.py                 raw values → levels, using thresholds.py
    thresholds.py            every cutoff in one place, each with a rationale comment
    templates.py             So What? templates keyed by (risk type, place kind, level); sea templates keyed by kind; trend templates keyed by risk type
    render.py                fill templates; apply showcase overrides
    showcase.yaml            ~15–20 hand-written, cited showcase entries
    build.py                 orchestrates the steps; writes data/sowhat-YYYYMMDD.db; runs validate
    validate.py              integrity checks; non-zero exit on failure
    publish.sh               uploads a validated build to Turso (§8.2)
    tests/                   pytest
    requirements.txt
  data/
    raw/                     downloaded source files (gitignored)
    sowhat-*.db              builds (gitignored; reproducible)
    published_slugs.txt      every slug ever published (committed; protects share links)
  web/                       Next.js app (§7)
    drizzle.config.ts
    lib/db/schema.ts         generated by `drizzle-kit pull` — never hand-edited
    …
```

## 5. Data

### 5.1 Sources

Each source must be confirmed during the data milestone (§12, M1): availability, license, format, coordinate reference system, and vintage.

| Purpose | Candidate source | Grain | Notes |
|---|---|---|---|
| Air quality | CalEnviroScreen 4.0 (OEHHA) — PM2.5 and Diesel PM percentiles | Census tract (**2010 vintage**) | Tract shapes must be the matching 2010 TIGER tracts, not 2020. |
| Wildfire | CAL FIRE Fire Hazard Severity Zones (SRA + LRA) | Polygons | Published in California Albers (EPSG:3310) — reproject. Use the most recent adopted maps. |
| Extreme heat (today) | CalEPA Urban Heat Island Index | Census tract | Sets the heat level. Measures extra heat trapped by the built environment, not absolute temperature; card wording must say so. |
| Heat projection | Cal-Adapt downscaled climate projections (LOCA2) — extreme-heat days per year | Regular grid, a few km | Baseline vs. mid-century, SSP2-4.5. M1 confirms: grid resolution and format, the extreme-heat-day definition (believed to be location-relative, e.g. above that cell's historical 98th-percentile maximum — verify), the scenario, and both periods. |
| Wildfire projection | Cal-Adapt wildfire projections | Grid (coarser) | **Optional.** Adopted only if M1 finds neighborhood-scale values that differ meaningfully across LA County; otherwise fire has no trend line. |
| Sea-level-rise amount | Ocean Protection Council, *State of California Sea Level Rise Guidance* (2024 update) | Per tide gauge (Santa Monica / Los Angeles) | How much rise the Intermediate scenario projects for mid-century. Used only to pick which flood-extent layer below applies. |
| Coastal flood extent | USGS CoSMoS (Coastal Storm Modeling System), Southern California | Polygons per sea-level-rise increment, with and without storm conditions | Pick the increment nearest the mid-century amount above. M1 decides whether "flooded" means everyday high tides with that rise, or also an annual storm — the card wording depends on it. Large, detailed multipolygons: a real test of `geometry.py`'s bbox prefilter. |
| Tract shapes | US Census TIGER/Line 2010 tracts, California | Polygons | Must match CalEnviroScreen vintage. |
| Zip codes | US Census 2020 ZCTAs | Polygons | ZCTAs approximate USPS zips; documented on the About page. |
| Bus stops | LA Metro GTFS (`stops.txt`) | Points | Stable `stop_id`. |
| Parks | LA County parks / open space GIS layer | Polygons → representative point | Use the dataset's own ID for the stable key. |
| Schools | California Department of Education public schools directory | Points | CDS code as the stable key. |
| Playgrounds | OpenStreetMap `leisure=playground` (Overpass export) | Points/polygons → point | ODbL: attribution required on About page and map. |

### 5.2 Stable identity

Shared URLs must survive re-imports. Every place's identity derives from its source, never from auto-increment:

- `source_key` = `"<source>:<source_id>"`, e.g. `metro_stop:3104`, `cde_school:19647336012345`.
- `slug` = `<kind>-<source_id>-<slugified-name>`, e.g. `bus-stop-3104-vermont-sunset`. Deterministic from `source_key` and name.
- `data/published_slugs.txt` accumulates every slug ever published. `validate.py` **fails if any listed slug is missing** from the new build. Intentional removal = explicit edit to that file.

### 5.3 Schema (`pipeline/schema.sql`)

```sql
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
  retrieved_on TEXT NOT NULL                 -- ISO date
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
```

**Level ranks:** `low = 0`, `elevated = 1`, `high = 2`, `severe = 3`.

**Deliberate denormalization.** `air_rank`/`fire_rank`/`heat_rank` duplicate `risks.level` so that map queries (viewport, nearest, cluster) touch a single table with no join. For the active filter set, a place's pin level is SQLite's multi-argument `max(...)` over the selected rank columns (air, fire, heat). A place is **visible iff that value ≥ 1, or `sea` is selected and `sea_flag = 1`**. `validate.py` checks the ranks and `sea_flag` agree with `risks`.

`sea_flag` is a flag, not a rank: sea level rise has no level (§5.4), so it can make a place visible but never sets its pin level. A place visible only through `sea_flag` gets the distinct "projected" pin style (§7.4). Rows in `risks` with `type = 'sea'` exist only for flagged places; the other three types have a row for every place.

### 5.4 Scoring (initial thresholds)

All cutoffs live in `thresholds.py` with a rationale comment and are reproduced on the About page.

| Risk | Metric | elevated | high | severe |
|---|---|---|---|---|
| Air | max(PM2.5 pctl, Diesel PM pctl), CalEnviroScreen statewide percentile | ≥ 75 | ≥ 90 | ≥ 97 |
| Fire | CAL FIRE FHSZ class containing the place | Moderate | High | Very High |
| Heat | Heat metric percentile **within LA County** tracts | ≥ 75 | ≥ 90 | ≥ 97 |

Anything below `elevated` is `low`. Thresholds may be tuned during M1 after inspecting real distributions; changes are recorded in `thresholds.py` and the About page.

**Sea level rise is not scored.** A place is flagged (`sea_flag = 1`) if it lies inside the selected CoSMoS flood extent (§5.1); otherwise it has no sea row. There is no sea-level-rise level, and nothing on the card or pin implies one.

**Levels come from today's conditions only.** Projections never change a level. The trend lines never affect visibility or filtering; the sea-level-rise flag affects visibility only through its own filter, as described in §5.3. Mixing a present-day percentile with a mid-century model output in one level would make the level mean nothing precise, and it would let the most uncertain number move the map.

### 5.5 "So What?" text

Voice, word list and full template drafts: [So What? voice and templates](../../content/2026-09-28-so-what-voice-and-templates.md).

- **Templates** (`templates.py`) keyed by `(type, kind, level)`, interpolating place-specific values. Example — `(heat, bus_stop, high)`: *"This neighborhood traps more heat from pavement and buildings than 94% of LA County neighborhoods. A long summer wait in direct sun can cause heat illness, especially for older riders."*
- Every `(type, kind, level ≥ elevated)` combination must have a template; `validate.py` enforces this. `low` rows get a short neutral sentence that never calls a place safe.
- **Length cap:** every rendered `so_what` is **≤ 30 words**, so it reads at a glance on the card and fits one caption line in the demo video, even at 2× speed. `validate.py` enforces this on rendered text (templates plus interpolated values, and showcase overrides).
- **Wording scope:** `so_what` describes the *neighborhood* ("than 94% of LA County neighborhoods"), never the exact spot, because the data is tract- or zone-level (§15).
- **Trend line** (`trend`): one sentence per risk type that has a projection, keyed by type only, not by kind or level. It states the direction and both values in plain units, and names the period. Example — heat: *"And it's getting hotter: this area is projected to go from about 6 to 20 extreme-heat days a year by mid-century."* (numbers illustrative)
  - Shown at **every** level, including `low`. A place that isn't flagged today can still be getting worse, and saying so is the climate story.
  - Says "this area", not "this neighborhood", because the projection grid is coarser than a tract.
  - **≤ 25 words**; `validate.py` enforces this.
  - Numbers are rounded to whole days and prefixed "about"; the scenario and periods appear on the detail line and About page, not in the sentence.
  - Only written when `trend_future` exceeds `trend_now` by a meaningful amount (threshold in `thresholds.py`). Otherwise `trend` is NULL rather than claiming a change the data doesn't show.
- **Sea-level-rise `so_what`**: templates keyed by kind only (no level). The sentence is itself a projection, so it names the period and uses "could". Example — `(sea, bus_stop)`: *"By mid-century, with about {rise} of sea level rise, {flood condition} could flood this stop. Riders may need other routes on those days."* (`{rise}` and `{flood condition}` set in M1; wording illustrative.)
  - Says "this stop / park / playground / school", not "this area": the flood extents are detailed polygons and point-in-polygon places each point exactly (as with fire).
  - Same 30-word cap as other `so_what` text.
  - `detail` names the source, scenario and increment (e.g. "USGS CoSMoS, {rise} sea level rise, {storm condition}; OPC Intermediate scenario, {period}").
- **Showcase overrides** (`showcase.yaml`): ~15–20 places with hand-written `detail` and `so_what` plus a citation URL per entry.
- **Featured place:** one showcase entry is the **featured starting spot**. It is used by "Show me an example", by the geolocation fallback, and as the place shown in the demo video's opening. It is **chosen at the end of M1**, once real distributions exist, and its showcase entry is written and validated in M2. It is marked `featured: true` in `showcase.yaml` (exactly one entry), and `build.py` writes its slug to `meta.featured_slug`, where the app reads it. Criteria:
  - kind is `bus_stop` (legible to viewers with no LA knowledge);
  - `high` or above on at least two risks, one of them heat; all three of today's risks `elevated`+ preferred;
  - has a heat `trend` line;
  - a readable stop name;
  - ideally a stop the author knows or uses, rather than the most dramatic one available.

### 5.6 Pipeline steps

1. **fetch** — download sources to `data/raw/`; record `retrieved_on`.
2. **normalize** — reproject to WGS84; clip to LA County boundary; polygons → representative points for parks/playgrounds; drop unused fields.
3. **join** — for each place, find its tract, fire zone, and ZCTA using `geometry.py`: bbox prefilter over candidate polygons, then ray-casting point-in-polygon honoring holes and multipolygons. Places outside every tract are dropped and counted. Each place also gets its **projection grid cell**: if the projection source is a regular lat/lon grid, by index arithmetic (the same `floor` reasoning as §6.1, against the source grid's origin and spacing); otherwise by point-in-polygon over the cell outlines. Places whose cell has no value keep a NULL trend. Finally, each place is tested against the selected CoSMoS flood extent with the same point-in-polygon code; a hit sets `sea_flag = 1`. Only places near the coast are tested (bbox prefilter against the extent's overall bounds), so inland places cost nothing.
4. **grid** — assign `cell_row`, `cell_col` (§6.1).
5. **score** — levels and ranks per §5.4.
6. **render** — `so_what` templates, then trend templates, then showcase overrides.
7. **write** — create a fresh `data/sowhat-YYYYMMDD.db` from `schema.sql` (never mutate a previous build), insert rows, write `meta`, `VACUUM`, then `PRAGMA journal_mode=WAL` (required by `turso db import`).
8. **validate** — §10.2. On failure, exit non-zero; nothing is published.

Publishing (upload to Turso) is a separate, explicit step (§8.2).

## 6. Spatial indexing and queries

### 6.1 Grid index

The map is divided into fixed square-in-degrees cells of `CELL_SIZE_DEG = 0.01` (≈ 1.11 km north–south; ≈ 0.91–0.93 km east–west across LA County's latitudes).

```
cell_row = floor(lat / CELL_SIZE_DEG)
cell_col = floor(lon / CELL_SIZE_DEG)
```

- `floor` (not truncation) is required: all LA longitudes are negative, and truncation toward zero would merge two columns of cells at every boundary.
- The constant is defined in `pipeline/grid.py` and `web/lib/geo.ts`, and written to `meta.cell_size_deg`. A web test asserts the TS constant equals the value in `meta`.
- `S_MIN` = the shortest cell side in metres anywhere in the county (east–west side at the county's northern edge), multiplied by a 0.99 safety factor to absorb haversine-vs-planar error. Used by the nearest-search stopping rule.

### 6.2 Viewport query

Convert the visible bounds to a cell range, then filter exactly (edge cells overhang the viewport):

```
WHERE cell_row BETWEEN :r_south AND :r_north
  AND cell_col BETWEEN :c_west  AND :c_east
  AND lat BETWEEN :south AND :north
  AND lon BETWEEN :west  AND :east
  AND ( max(<selected rank columns>) >= 1          -- omitted if no today type is selected
        OR sea_flag = 1 )                           -- included only if 'sea' is selected
LIMIT 1000
```

Returns `PinSummary[]` with `level` = the computed max rank (0 = `low` when the place is visible only through `sea_flag`) and `sea` = `sea_flag = 1`. `queries.ts` builds the visibility clause from the selected types: with only `sea` selected it is just `sea_flag = 1`; with only one today type, `max()` gets a single argument, so the clause uses the column directly (SQLite's `max()` with one argument is the aggregate).

### 6.3 Zoomed-out clusters (server-side aggregation)

Below a zoom threshold (initially zoom < 13), the API returns counts per coarse cell instead of pins:

```
GROUP BY cell_row / :f, cell_col / :f      -- integer division; :f chosen by zoom (table in geo.ts)
SELECT count(*), max(level), max(sea_flag), avg(lat), avg(lon)
```

Clusters use the same visibility clause as §6.2. `max(level)` covers today's ranks only; `max(sea_flag)` tells the cluster marker to show the projected-flooding indicator.

Integer division on negative `cell_col` rounds toward zero in SQLite, which would make the coarse cell straddling each multiple of `:f` twice as wide. Grouping therefore uses `(cell_col + COL_OFFSET) / :f`, where `COL_OFFSET = 36000` (a multiple of every zoom factor, and large enough that all columns become non-negative since `lon ≥ −180`). Rows are always positive in LA and need no offset. This is tested explicitly.

Client-side marker clustering is then only needed for dense zoomed-in views.

### 6.4 N nearest places (grid ring search)

Finds the **N nearest visible places** to a point. With `N = 1` it is the "nearest place" search used by the empty-viewport message; with `N = 20` it feeds the "Places near here" list (§7.5), which is the non-map way to find places.

Let the query point be in cell `(r0, c0)`. Define the *box of radius k* as all cells with `|row − r0| ≤ k` and `|col − c0| ≤ k`.

**Lower bound.** Any point outside the box of radius k lies at least `k` full cells away along rows or columns, so its distance is ≥ `k · S_MIN`.

**Algorithm (few round trips to Turso):**
1. `k = 1`.
2. Query the box of radius k (same visibility filter as §6.2); compute haversine distance to each candidate; sort ascending.
3. If there are at least `N` candidates and the `N`-th distance `d_N ≤ k · S_MIN` → return the first `N` (proved: every unseen place is at least `k · S_MIN ≥ d_N` away, so none of them can displace the first `N`).
4. Otherwise, `k = (at least N candidates) ? ceil(d_N / S_MIN) : 2k`, capped at a county-sized `K_MAX`; repeat from 2.
5. If `k` exceeds `K_MAX` → return all candidates found, sorted (the box now covers the county, so the result is complete; it may hold fewer than `N`, or none).

Typically 1–3 queries. `N` is capped at 50. Return shape: `NearbyPlace[]` (§7.3), sorted by distance; an empty array when nothing is visible.

Because each place row carries its rank columns and `sea_flag`, the list needs no join to show each place's levels (§5.3).

## 7. Web application (Next.js App Router)

### 7.1 Structure

```
web/
  drizzle.config.ts          dialect: 'turso'; used for `drizzle-kit pull` only (no migrations)
  app/
    layout.tsx               shell: skip link, header, risk filters, <PlacesList/>, <MapView/>, live region
                             (map and list persist across navigation)
    page.tsx                 start panel: "Use my location" · zip search · "Show me an example"
    places/[slug]/
      page.tsx               server-rendered detail panel with "Nearby places" (5); generateMetadata for title, OG/Twitter tags, image alt text
      opengraph-image.tsx    generated share image (place name, kind, top risk)
      not-found.tsx
    about/page.tsx           method, thresholds, sources, tip links, attribution, limitations
    api/
      places/route.ts        GET ?bbox=west,south,east,north&zoom=&types=air,fire,heat,sea
                             → { mode: 'pins', pins } | { mode: 'clusters', clusters }
      places/nearest/route.ts GET ?lat=&lon=&types=&limit= (default 1, max 50) → NearbyPlace[] (§6.4)
      zips/[zip]/route.ts    GET → bounds + center, or 404
      health/route.ts        GET → { ok, places } via a 1-row meta lookup (uptime monitoring)
  lib/
    db/
      schema.ts              generated by drizzle-kit pull; never hand-edited
      client.ts              drizzle-orm/tursodatabase-serverless + @tursodatabase/serverless (TURSO_DATABASE_URL,
                           read-only TURSO_AUTH_TOKEN); the only file that knows the driver
      queries.ts             every query the app runs; each takes a Drizzle `db` argument; returns DTOs from types.ts
    geo.ts                   CELL_SIZE_DEG, S_MIN, cell math, haversine, bbox parsing, zoom→factor table
    types.ts                 PinSummary, Cluster, PlaceDetail, Risk, Source, Tip (API/UI shapes)
    tips.ts                  one "what you can do" tip per RiskType (§7.4); fixed data, not in the database
  components/
    MapView.tsx              Leaflet (client-only), pins + clusters, syncs with URL; one tab stop, pins not focusable (§7.5)
    PlacesList.tsx           "Places near here": N nearest as an ordered list of links; highlights the matching pin on focus/hover
    Legend.tsx               text legend for pin glyphs, levels and "Projected"
    LevelMeter.tsx, RiskGlyph.tsx  the two glyph systems (§7.4); aria-hidden, always next to words
    Announcer.tsx            the single polite live region and its message helper (§7.5)
    PlacePanel.tsx, RiskCard.tsx, ZipSearch.tsx, LocateButton.tsx, RiskFilters.tsx, ViewToggle.tsx
  tests/
    fixtures/build-fixture.ts  builds a small local SQLite file from ../pipeline/schema.sql + seed rows
```

### 7.2 Drizzle usage

- **Driver:** `drizzle-orm/tursodatabase-serverless` over `@tursodatabase/serverless` (fetch-only; works in Vercel Functions). `drizzle-orm` and `drizzle-kit` are on the release-candidate channel, pinned to exact versions; move to stable 1.0 when released. Fallback: `drizzle-orm/libsql` + `@libsql/client`, changing only `lib/db/client.ts`.
- **Schema ownership:** `pipeline/schema.sql` is authoritative. After a schema change: rebuild the db, run `drizzle-kit pull` against it, commit the regenerated `schema.ts`. No Drizzle migrations exist.
- **Queries** use the query builder (`and`, `between`, `eq`, `inArray`) and the `sql` template where Drizzle lacks a helper (multi-arg `max(...)` over rank columns, floor-division grouping).
- **Row types** come from `InferSelectModel`; `queries.ts` maps rows to the DTOs in `types.ts` so the UI never depends on column names.
- **Drift guard:** a Vitest test builds the fixture db from `schema.sql` and compares `PRAGMA table_info` for each table against Drizzle's `getTableConfig` column names and types.

### 7.3 Core types

```ts
type RiskType = 'air' | 'fire' | 'heat' | 'sea';
type Level = 'low' | 'elevated' | 'high' | 'severe';
type PlaceKind = 'bus_stop' | 'park' | 'playground' | 'school';

interface PinSummary { slug: string; name: string; kind: PlaceKind; lat: number; lon: number; level: Level; sea: boolean }
interface Cluster    { lat: number; lon: number; count: number; level: Level; sea: boolean }
interface NearbyPlace {
  slug: string; name: string; kind: PlaceKind; lat: number; lon: number; distanceM: number;
  levels: { air: Level; fire: Level; heat: Level }; sea: boolean;   // for list labels like "Heat: High, Air: Elevated"
}

interface PlaceDetail {
  slug: string; name: string; kind: PlaceKind; lat: number; lon: number; zip: string | null;
  risks: {
    type: RiskType; level: Level | null;   // null only for 'sea'
    detail: string; soWhat: string; source: Source;
    trend: { text: string; now: number; future: number; source: Source } | null;
  }[];
}

interface Projection {                    // from meta
  scenario: string; baselinePeriod: string; futurePeriod: string;
  sea: { scenario: string; rise: string; floodCondition: string; period: string };
}
```

### 7.4 Behavior

- **Selecting a place:** clicking a pin, or activating a link in "Places near here", navigates to `/places/[slug]`; the layout's map and list persist and the panel swaps. Focus moves to the panel's heading (§7.5). Direct loads of a share URL server-render the panel; the map centers on the place on hydration.
- **Risk card order (consequence first):** each `RiskCard` is a `<section>` that reads top-down, in the DOM and visually, as
  1. a **heading** (`<h2>`) naming the risk and its level: "Heat — High"; for sea level rise, "Sea level rise — Projected". Visually the header row has the **risk glyph + risk name** on the left and the **level meter + level word** on the right, as a small badge; colour is reinforcement only, never the sole signal;
  2. the **So What?** sentence (`soWhat`), the most prominent text on the card;
  3. the **trend** line, when present, visually distinct from today's text, with its "Projected" label placed *before* the sentence in the DOM ("Projected: And it's getting hotter …") so a screen reader never reads a projection as today's fact;
  4. the specific risk (`detail`);
  5. the source line (name, linked), plus, when a trend is shown, the projection's source, scenario and periods (e.g. "Projection: Cal-Adapt LOCA2, {scenario}, {baseline} vs. {future}");
  6. the **tip** ("what you can do"), when shown: one action and a link.

  **On phones (below the list-first breakpoint, §7.5),** items 4–5 change: a short source line stays visible ("Source: CalEPA · Cal-Adapt"), and the `detail` line, full source names and links, and the projection's scenario and periods move behind an **"About this data"** disclosure (`<button aria-expanded>`, one per card), placed where item 4 would be. Wider screens show everything inline. The DOM order is the same at every width. Honesty doesn't depend on the collapsed part: "Projected", "about" and "by mid-century" are in the sentence itself.
- **Glyphs** (two systems, never in the same slot; both `aria-hidden`, always paired with words):
  - **Level meter** (`LevelMeter.tsx`): three slots of rising height; the filled slots are the level (1 = elevated, 2 = high, 3 = severe). The empty slots show where on the scale a place sits, and unequal heights can't be mistaken for a pause icon. Used in card headings and inside map pins. Sea level rise has no meter; its level slot says "Projected".
  - **Risk glyph** (`RiskGlyph.tsx`): one per risk type, in card headings and at-a-glance chips. Icon art is a visual-design task; the brief is air = particles or wind, heat = thermometer, wildfire = flame, sea level rise = the wave glyph also used on projected pins.
- **At-a-glance row:** when a place has **2 or more flagged cards** (`elevated` or above today, or a sea card), the panel shows a `<nav aria-label="Risks at this place">` of chips under the place name. Each chip is a link to its card, reading e.g. "Heat — High" with that risk's glyph. The shared glyph ties chip to card; on phones it shows every level on the first screen.
  The consequence leads because it is the product's thesis: the metric supports the sentence, not the other way round. The level sits in the heading because screen-reader users navigate by headings: they can hear all four risks and their levels in four keystrokes instead of listening through each card. Visually the badge stays small, so the sentence is still what the eye lands on. The trend follows the sentence because "and it's getting worse" is what makes it a climate story. This order holds on the live site, in OG images (which omit the tip), and in the demo video. The level describes today only; the card must not imply the projection changed it.
- **Tips ("what you can do"):** each card that is `elevated` or above, and every sea-level-rise card, ends with one tip, so a stated risk always comes with a next step.
  - Defined in `web/lib/tips.ts` as fixed data keyed by `RiskType`: `{ text, linkText, url, org }`. One tip per type; tips don't vary by place, so they live in the app, not the database, and changing one needs no data rebuild.
  - Wording follows the [voice doc](../../content/2026-09-28-so-what-voice-and-templates.md) §7: a verb and a link, never repeating the `so_what`; about what to do now, even under a trend line.
  - `linkText` names the organization ("AirNow", "Ready LA County"), so a screen reader announces where the link goes. Links open in the same tab.
  - Not shown on `low` cards or on the collapsed "Not flagged today" line: a next step for a risk that isn't flagged would imply a risk the data doesn't show.
  - The About page lists every tip's organization and URL alongside the data sources.
- **Panel order:** today's cards (air, heat, fire) first, sorted by level; the sea-level-rise card last. Its level slot shows a **"Projected"** label instead of a level, and it uses the same visual treatment as trend lines. `low` cards without a trend line collapse into one line ("Not flagged today for air or wildfire") after the flagged cards and above the sea-level-rise card, so the projection isn't mistaken for today's finding. The collapsed line is a `<button aria-expanded>` that reveals them. **A `low` card with a trend line stays expanded** (without a tip), after the flagged cards: collapsing it would hide the "getting hotter" line, and with it the climate story for every place that isn't flagged today. The panel ends with **"Nearby places"**: the 5 nearest visible places (§6.4) as links, so users can move between places without the map.
- **One places list per page:** on place pages, the layout's "Places near here" list collapses to a "← Places near here" back link at the top of the panel, and the panel's "Nearby places" replaces it. Showing both duplicated content and pushed the cards down. The back link restores the list and returns focus to the item that opened the place (§7.5).
- **Pins:** level is encoded by **colour and the level meter** inside the pin (1, 2 or 3 filled slots of 3), in a palette that stays distinguishable under common colour-vision deficiencies (sequential, not red/green). Every pin and cluster has a white halo and dark outline so it keeps 3:1 contrast against light and dark tiles. A place visible only through `sea_flag` uses a **dashed outline with a wave glyph**; a place with both today's findings and `sea_flag` adds the wave glyph as a small badge. Nothing relies on colour alone. `Legend.tsx` explains every symbol in text.
- **Filters:** `?types=air,heat,fire,sea` in the URL; applied to pins, clusters, nearest search; preserved in share links. Default: all four.
- **Entry flow:**
  1. Start panel offers **Use my location**, **zip search**, and **Show me an example**.
  2. Geolocation inside LA County → center there. Outside LA County, denied, or timed out → "So What? covers LA County — here's a place to start" → fly to the featured starting spot.
  3. Zip search → `/api/zips/[zip]` → fit bounds; non-LA zip → inline message.
  4. Every entry action also refreshes **"Places near here"** from that point (the user's location, the zip's center, or the featured spot), and the result is announced (§7.5).
- **"Places near here" list:** the 20 nearest visible places (§6.4) as an ordered list of links, each reading e.g. "Vermont / Sunset — bus stop — Heat: High, Air: Elevated — 0.3 miles". It follows the risk filters, refreshes after each entry action and when the map settles after panning (debounced), and works at every zoom, including county zoom where the map shows only clusters. Focusing or hovering an item highlights its pin.
- **Empty-viewport check:**
  - After an entry action (geolocation or zip) yields zero visible pins → nearest search → "No elevated risks right around you — nearest is *X*, 1.4 miles away" → fly there. The "relatively low-risk" message is stated explicitly.
  - During manual panning → never auto-move. The list still shows the nearest places to the map's center, which may lie outside the view; when none are in view, a note above the list says "No flagged places in view. These are the nearest." The list is empty only when the filters exclude every place ("No places match these filters. Turn on more risk types.").
  - Distances are written out as "miles", never "mi", so screen readers read them correctly.
- **Map tiles:** free tier from a tile provider (MapTiler, Stadia, or Carto — chosen in M0); key in an env var, domain-restricted; required attributions displayed.

### 7.5 Accessibility

**Target:** WCAG 2.2 AA. Details and rationale: [accessibility review](../../accessibility/2026-09-28-so-what-accessibility-review.md). Accessibility is part of the Good tier (§12), not an add-on.

**The map is optional; the list is not.** Every task can be done without the map, using "Places near here" (§7.4), the place panel's "Nearby places", zip search, and the filters.

- **Map keyboard behavior:**
  - The map container is **one tab stop**, labelled "Map. Use arrow keys to pan and + / − to zoom." Leaflet's built-in arrow-key panning and +/− zoom apply once it has focus.
  - Markers are created with `keyboard: false`, and the pin and cluster layers are hidden from assistive technology. A viewport can hold up to 1,000 pins, and making each one a tab stop would effectively trap keyboard users. The list is the keyboard and screen-reader path to each place.
  - Tile attribution links stay reachable.
- **Page structure:**
  - `lang="en"`; a "Skip to main content" link first.
  - Landmarks: `header`; `nav` (filters); `main` (panel and list); a labelled `region` for the map; `footer`.
  - One `<h1>` per page: the place name on place pages.
  - Risk cards are `<h2>` sections (§7.4); "Places near here" and "Nearby places" are `<h2>` sections with `<ol>` lists.
- **Titles and share metadata:**
  - Place pages: `<title>{place name} ({kind}) — So What?`. Start page: "So What? — Climate risk at LA County places".
  - OG and Twitter images get `og:image:alt` / `twitter:image:alt`, e.g. "Vermont / Sunset bus stop — Heat: High."
- **Focus:**
  - After navigating to a place, focus moves to the panel's `<h1>` (`tabindex="-1"`). Next.js also announces the route change from the page title.
  - "Back to list" returns focus to the list item that opened the place.
  - Map moves, filter changes and list refreshes never move focus.
  - Focus rings are always visible, 2px or more, with 3:1 contrast.
  - There are no modal dialogs. Any added later must close with Escape and return focus.
- **Announcements:** one polite live region (`Announcer.tsx`); nothing is `assertive`.

  | Event | Message |
  |---|---|
  | Filters changed | "Showing {n} places for {types}." |
  | List refreshed after an entry action (not on every pan) | "{n} places near {zip or 'your location'}." |
  | Geolocation denied, timed out, or outside LA County | "Location unavailable. Showing an example: {place}." |
  | Data unavailable (503) | "Place data isn't loading right now. Try again in a few minutes." |

- **Forms:**
  - Zip search has a visible `<label>` "Zip code", `inputmode="numeric"` and `autocomplete="postal-code"`. Errors appear under the field, linked with `aria-invalid` / `aria-describedby`.
  - Risk filters are native checkboxes in a `<fieldset>` with `<legend>Show risks</legend>`. The sea label reads "Sea level rise (projected)".
- **Narrow screens and zoom (reflow at 320 CSS px / 400%):**
  - The list, or the place panel, is the main view in normal document flow.
  - A **"Show map / Show list"** toggle (`ViewToggle.tsx`, a button with `aria-pressed`, state kept in the URL) switches views.
  - No drag-only bottom sheet.
  - The four risk filters stay visible above the list (about 80px), rather than behind a disclosure, so filtering stays one tap.
- **Motion:** with `prefers-reduced-motion`, fly-to and zoom animations become instant `setView` jumps.
- **Sizes:** base text 16px or more; touch targets at least 24px, and 44px for primary buttons.

## 8. Deployment

### 8.1 Hosting

- **App:** Vercel Hobby (non-commercial use), project root directory `web/`, custom domain via Vercel.
- **Database:** Turso free tier — 100 databases, 5 GB storage, 500M rows read/month; queries fail with `BLOCKED` once a quota is exceeded. Databases are files, not processes: they never sleep and have no cold start. Vercel Functions region set to match the database's region (e.g. `pdx1` ↔ `aws-us-west-2`).
- **Rows read is the budget that matters.** Turso counts rows *scanned*, not rows returned, so an unindexed viewport query over ~15k places would cost ~15k reads per map pan. The grid index (§6) keeps zoomed-in pans to a few hundred reads — the data structure directly protects the free quota. Zoomed-out cluster queries (§6.3) still scan every place in view (up to ~15k at county zoom, i.e. ~33k such views/month on the free quota — ample for demo traffic). If M3 measurements show otherwise, the pipeline precomputes a `cluster_summaries` table per zoom factor. `/api/health` uses `SELECT value FROM meta WHERE key = 'row_count_places'` (1 row read), not `count(*)`.
- **Env vars:** `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN` (read-only token), `NEXT_PUBLIC_TILE_KEY`.
- **Monitoring (optional):** UptimeRobot on `/api/health` for alerts (not keep-alive).

### 8.2 Publishing a data build

Blue/green, so a bad upload never affects the live site:
1. `build.py` produces and validates `data/sowhat-YYYYMMDD.db` (WAL mode).
2. `publish.sh` runs `turso db import data/sowhat-YYYYMMDD.db` (creates a new database named after the file), mints a read-only token (`turso db tokens create <db> --read-only`), and runs a smoke query.
3. Update `TURSO_DATABASE_URL` / `TURSO_AUTH_TOKEN` in Vercel; redeploy (env changes apply only to new deployments).
4. After verifying production, append new slugs to `data/published_slugs.txt`, commit, and — with explicit confirmation — delete the previous database.

The free plan allows 100 databases, so blue/green costs nothing extra.

### 8.3 M0 deployment spike (retire platform risk first)

Before any feature work: a hello-world Next.js app on Vercel with the custom domain, reading a tiny Turso database (created via `turso db import`) through Drizzle (a `places` table with the cell index), plus `/api/health`. Verify: `drizzle-orm@rc` + `@tursodatabase/serverless` works against Turso Cloud (including the `sql` template and multi-arg `max`); `drizzle-kit@rc pull` introspects the imported db; the same queries run in Vitest over a local driver (§11); viewport-query latency with Functions and database in the same region. Tile provider chosen.

## 9. Security

- The app's Turso token is read-only; no route accepts writes.
- All query parameters are parsed and range-checked in `geo.ts` before reaching `queries.ts`; all SQL goes through Drizzle's parameterized builder / `sql` template (no string concatenation).
- Tile key restricted to the production domain and localhost.

## 10. Error handling and validation

### 10.1 Runtime

| Situation | Behavior |
|---|---|
| Malformed `bbox` / `zoom` / `types` / non-numeric params | 400 with a JSON error message |
| `bbox` inverted or larger than LA County | 400 |
| Zip not in `zips` table | 404 → "That zip isn't in LA County (yet)." |
| Unknown slug | `notFound()` → friendly page linking back to the map |
| Geolocation denied / timeout / outside county | Fallback flow (§7.4) |
| Nearest search finds nothing within `K_MAX` | Message; no map movement |
| Tile provider failure | Basemap blank; pins, panels, share links still work |
| Turso unreachable, auth failure, or quota exceeded | API routes return 503; place pages render an error state; `/api/health` reports `ok: false` |

### 10.2 Pipeline (`validate.py`)

Fails the build (non-zero exit; nothing published) if any of:
- a place lacks `tract_id`, `cell_row`, or `cell_col`, or its cell doesn't match `floor(lat|lon / CELL_SIZE_DEG)`;
- a place lacks a `risks` row for air, fire or heat, or its rank columns disagree with `risks.level`;
- a `sea` row exists for a place with `sea_flag = 0`, or is missing for a place with `sea_flag = 1`;
- any sea row exists but `meta` lacks `sea_scenario`, `sea_rise`, `sea_flood_condition`, or `sea_period`;
- `sea_flag = 1` for a place outside the CoSMoS extent's overall bounds (catches a reprojection mistake);
- a `risks` row references a missing source;
- duplicate slugs or source keys;
- a `showcase.yaml` entry references a nonexistent `source_key` or lacks a citation;
- a required template `(type, kind, level ≥ elevated)` is missing;
- any rendered `so_what` exceeds 30 words, or any `trend` exceeds 25 words (§5.5);
- a `trend` exists for a risk type with no adopted projection source, or a `trend` claims an increase when `trend_future − trend_now` is below the meaningful-change threshold;
- any `trend` exists but `meta` lacks `projection_scenario`, `projection_baseline_period`, or `projection_future_period`;
- a place's rank columns differ from what today's data alone would produce (projections must not affect levels);
- no showcase entry is marked as the featured place, or it fails the featured-place criteria (§5.5);
- row counts fall outside expected ranges (configured in `validate.py`);
- any slug in `data/published_slugs.txt` is missing (§5.2).

## 11. Testing

**Pipeline (pytest) — primary focus:**
- `geometry.py`: inside/outside convex and concave polygons; point exactly on an edge and on a vertex (documented, deterministic rule); polygon with a hole; multipolygon; bbox prefilter never excludes a true hit.
- `grid.py`: points exactly on cell boundaries; negative longitudes (`floor`, not truncation).
- `score.py`: values exactly at, just below, and just above each threshold.
- `render.py`: every template renders with sample values; showcase overrides win; trend values round to whole days; below the meaningful-change threshold, `trend` is NULL.
- Sea-level-rise join: a hand-built coastline-like multipolygon with an inlet and an island (hole) flags the right points; places far inland are never tested (prefilter).
- Projection join: points on grid-cell boundaries and at the grid's edges land in exactly one cell, using the same test vectors approach as `grid.py`; a place in a cell with no value gets a NULL trend.
- Slug generation is deterministic and stable across runs.
- `validate.py`: each failure condition triggers on a crafted bad input.

**Web (Vitest), against a local fixture db (no network):**

`@tursodatabase/serverless` is remote-only, so tests pass `queries.ts` a Drizzle instance over a *local* driver on the fixture file — `drizzle-orm/tursodatabase-database` (`@tursodatabase/database`, Turso's embedded engine) if available on the rc channel, else `drizzle-orm/libsql` with a `file:` URL. Chosen in M0. This works because every query takes `db` as an argument instead of importing the production client.
- `geo.ts`: haversine vs. known distances; bbox parsing/validation; cell math matching `grid.py` on shared test vectors; `CELL_SIZE_DEG` equals `meta.cell_size_deg`.
- `queries.ts`:
  - viewport query: edge cells overhanging the viewport are excluded; type filters; low-risk hiding; a sea-only place is visible with `sea` selected and hidden without it; `types=sea` alone and a single today type both build a valid clause.
  - clusters: coarse grouping is correct across negative columns (floor division).
  - nearest (`N = 1`): the **trap case** — the first non-empty box contains a point, but the true nearest lies just outside that box — returns the true nearest; the empty-until-cap case returns an empty array.
  - N nearest: the trap case generalized — the first box holds `N` candidates but the true `N`-th nearest lies just outside it — returns the true `N`; fewer than `N` visible places in the county returns all of them, sorted; results match a brute-force sort of the fixture on shared test vectors.
- Schema drift guard (§7.2).
- `tips.ts`: every `RiskType` has exactly one tip; every URL is `https`; `RiskCard` shows the tip for `elevated`+ and sea cards and hides it for `low`.

**End-to-end (Playwright, small):**
- A share URL renders the panel and correct OG tags.
- Zip search for an LA zip fits the map; a non-LA zip shows the message.
- Geolocation mocked outside LA triggers the fallback flow.
- `@axe-core/playwright` scans the start page, a place page with and without a sea card, the About page and the not-found page; any violation fails the test.
- Keyboard only: from the start page, open "Show me an example" and reach the heat card; search a zip and open the second list item. No pointer events are used.

**Manual accessibility checks (M7, before the demo video):**
- The same three tasks, done by keyboard only and with VoiceOver on macOS and on iOS Safari:
  1. Open the featured example and hear its heat level and trend.
  2. Search zip 90012 and open the second place in the list.
  3. Turn off air and wildfire, and hear the announced count change.
- 200% and 400% zoom, and a 320px-wide viewport: no horizontal scrolling; the list/map toggle works.
- Pin palette and legend through a colour-vision-deficiency simulator; pins keep 3:1 contrast on light and dark tiles.
- With the OS "Reduce motion" setting on, there are no fly or zoom animations.

## 12. Milestones and outcome tiers

| Milestone | Deliverable |
|---|---|
| **M0 — Deployment spike** | §8.3. |
| **M1 — Data spike** | Every source in §5.1 confirmed (license, format, coordinate reference system, vintage); heat-island data confirmed; **fire hazard zones confirmed**: use the 2025 Local Responsibility Area maps as *adopted* by LA County and its cities (OSFM issued them as recommendations on 2025-03-24), plus the State Responsibility Area maps, and confirm that Moderate, High and Very High all appear in the downloaded data (older LRA maps showed only Very High, which would leave the fire levels in §5.4 with nothing to map); **climate projection confirmed**: grid resolution and format, extreme-heat-day definition, SSP2-4.5 available, baseline and mid-century periods; wildfire projection adopted or dropped; **sea level rise confirmed**: OPC Intermediate mid-century amount for the LA tide gauges, the matching CoSMoS increment, and whether "flooded" includes storm conditions; count of flagged places by kind (if almost none, revisit before M2); meaningful-change threshold set; thresholds sanity-checked against real distributions; **featured place chosen** (§5.5). |
| **M2 — Pipeline** | Full ETL with tests; featured place's showcase entry written and cited; valid `data/sowhat-YYYYMMDD.db`; first publish to Turso. |
| **M3 — Map + API** | Viewport pins, server-side clusters, filters, N-nearest search, "Places near here" list, pin glyphs and legend, map keyboard behavior (§7.5). |
| **M4 — Place pages** | Server-rendered panels, OG metadata and images, not-found. |
| **M5 — Entry flow** | Geolocation, zip search, featured start, empty-viewport behavior, list refresh and announcements, narrow-screen list/map toggle. |
| **M6 — Content** | Showcase entries written and cited; tip URLs checked by hand; About page. |
| **M7 — Ship** | Production deploy, manual accessibility checks (§11), README (≥ 750 words), demo video with an accurate caption file and a descriptive transcript, `submit50`. |

**Outcome tiers (CS50's "good / better / best"):**
- **Good:** map of LA County with pins for all four place kinds, today's three risk types, the heat trend line, template text, shareable place pages, the "Places near here" list and the §7.5 accessibility baseline (checked manually), deployed. (The trend line is in Good because without it the app isn't about climate change. The list and accessibility baseline are in Good because without them the app can't be used without a mouse and sight.)
- **Better:** + sea level rise, geolocation/zip entry flow, empty-viewport nearest search, server-side clusters, showcase text, OG images, Playwright suite with axe scans.
- **Best:** + polished About/method page, thresholds refined by distribution analysis.

## 13. Academic honesty and AI use

- The essence of the work — especially `pipeline/geometry.py`, `pipeline/grid.py`, the spatial queries, and the nearest-neighbor search — is written by the author.
- AI assistance is cited in code comments where used, per the CS50 final-project policy, and summarized in the README.
- `submit50` limit is 100 MB: `data/raw/`, `data/sowhat-*.db`, `node_modules/`, and `.next/` are excluded.

## 14. Alternatives considered (README material)

| Alternative | Why not |
|---|---|
| Flask + SQLite | Author already builds web apps; the CS gap is in data/algorithms, which live in the pipeline regardless of framework. |
| `better-sqlite3` on Vercel | Native module is incompatible with Vercel Serverless Functions. |
| Docker on Fly.io / Render | Fly.io has no free tier; Render's free tier sleeps, and its 750 free hours/month per workspace are already used by another always-on project. |
| SQLite R*Tree index | Turso Cloud's engine does not yet implement SQLite's virtual-table interface. |
| Uber H3 hexagonal index | The library would do the data-structure work the project exists to practice; its advantages (uniform neighbors, global consistency) matter mostly at global scale; child cells don't nest exactly; two language bindings to keep in sync. |
| PostGIS (Supabase/Neon) | Same objection — spatial work done by the database; plus a second query dialect. |
| Fully static site | No backend routing or database, dropping two of the three CS50 pillars. |
| LLM-generated "So What?" text | Hallucination risk, cost, and harder to defend; templates + hand-written showcase instead. |
| Zip codes as the unit | Too coarse and reads like a report card; places are what make "So What?" land. |
| Projections as the core of each card | The original idea. Projection grids are a few km across, so neighboring places would mostly share one number and the pins would stop saying much; every card would need a scenario and time horizon; and a 2050 number can't be checked against experience or acted on today. Kept as one supporting trend line instead. |
| Today's conditions only | Immediate and fine-grained, but air pollution and urban heat islands are environmental hazards, not climate *change*. Without the trend line it isn't a climate app. |
| Giving sea level rise a "today" core (e.g. FEMA coastal flood zones) | A second flood dataset, and FEMA zones are insurance and regulatory maps rather than conditions people experience. The other three risks already provide each coastal place's present-day content. |
| Scoring sea level rise into levels (e.g. by which increment first floods a place) | Would make levels mean "today" for three risks and "future" for one. A flag with its own filter keeps levels honest. |
| Two emissions scenarios on each card | Shows that choices matter, but doubles the numbers on a card meant to be read in seconds. One scenario on the card; the About page explains the others. |
| `drizzle-orm/libsql` + `@libsql/client` (stable Drizzle) | Turso now calls the libSQL SDKs legacy; its recommended SDK is `@tursodatabase/serverless` (fetch-only, no native deps), supported via `drizzle-orm/tursodatabase-serverless`. That driver is currently in Drizzle's release candidate, so exact versions are pinned and the libsql driver remains the fallback — a change confined to `lib/db/client.ts`. |
| Keyboard-focusable map pins as the accessible path | Up to 1,000 tab stops in no geographic order, and no sense of space for screen-reader users. A list of the N nearest places gives both groups a usable path, and it reuses the ring search. |
| Spanish translation | Many of the people most exposed speak Spanish, but the risk text is health wording that needs a fluent reviewer; machine-translated health claims aren't acceptable. Stated as a limitation instead. |
| Drizzle-owned schema with migrations | The pipeline rebuilds the db from scratch each time; migrations add nothing. `schema.sql` stays the single source of truth, and Drizzle introspects it. |

## 15. Limitations (stated on the About page)

- Risk levels are derived from area-level data (census tracts, hazard zones) applied to points; they describe the surrounding area, not site-specific measurements.
- CalEnviroScreen uses 2010 tract boundaries; ZCTAs approximate USPS zip codes.
- Data is a snapshot as of the build date in `meta`.
- Trend lines are climate-model projections for one emissions scenario, averaged over a grid cell of a few kilometres. They describe the surrounding area's likely direction, not a forecast for a specific place or year, and other scenarios give different values.
- "Extreme-heat days" follow the projection source's definition, which may be relative to each area's own historical temperatures; counts show change over time more reliably than they compare one area with another.
- Air quality has no projection; its card describes present-day conditions only.
- Sea-level-rise flags use one scenario and one flood-extent layer. A place outside the flagged area can still flood under higher scenarios, larger storms, or later dates. Rising groundwater and erosion are not included.
- Not an official hazard assessment; links to authoritative sources for decisions.
- English only. The site is not available in Spanish or other languages, although many people in the most affected neighborhoods speak Spanish at home.
