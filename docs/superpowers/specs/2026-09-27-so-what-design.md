# So What? — Design Spec

**Date:** 2026-09-27 (rev. 12, 2026-09-28: LA County residents become the primary audience once the submission deadline passes. Rev. 11: findings from the [UX evaluation](../../evaluation/2026-09-28-so-what-ux-evaluation.md) — an "Unflagged" switch on every places-list heading (and in the map legend) so every place is reachable, wireframed as idea #10 on the [idea board](../../wireframes/wireframes-glyphs-thumbnails.html), start page `<h1>` and intro, data years on `detail` lines and "current data" instead of "today" in the UI, one set of risk names ("Air pollution"), phone map taps open the panel, header with home link and zip search, back link after a direct load, cluster clicks, legend placement, "Show 20 more", location privacy, share button, share images keep the scope. Rev. 10: states and edge cases from the [resilience review](../../resilience/2026-09-28-so-what-states-and-edge-cases.md) — zero selected types and oversize bboxes handled, cluster fallback over 1,000 pins, selected marker, app-caused map moves don't refresh the list, first screen, county outline test, name normalization and disambiguation, prerendered showcase pages, loading/empty/error states (§7.6). Rev. 9: place panel decisions from the [wireframes](../../wireframes/wireframes-place-panel.html) — signal-meter level glyph, risk glyphs, at-a-glance row, low cards with a trend stay expanded, one places list per page, "About this data" on phones. Rev. 8: accessibility — "Places near here" list and N-nearest search, level in card headings, pin glyphs, focus/announcement/reflow rules, WCAG 2.2 AA target, English only; from the [accessibility review](../../accessibility/2026-09-28-so-what-accessibility-review.md). Rev. 7: sea level rise added as a projection-only risk; intermediate emissions scenario. Rev. 6: today's conditions as the core of each card, plus one projected-change line for risks climate change is making worse. Rev. 5: featured place chosen in M1, consequence-first risk cards, So What? length cap — from [grader's first 30 seconds](../../journeys/2026-09-28-grader-first-30-seconds.md))
**Status:** Draft, awaiting review
**Context:** CS50x final project (due before 2027-06-30 4:59 PM PDT), also deployed publicly on a subdomain of the author's personal domain (a dedicated domain may come later, §8.1), on free tiers.

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

**Audience.** Until the submission deadline (2027-06-30 4:59 PM PDT): primary, CS50 graders and demo-video viewers (most of whom are *not* in LA); secondary, LA residents who find the public site. After the deadline, residents become the primary users. The 30-second test below stays as the bar for anyone new to the site, but it no longer overrides what residents need. Anything built mainly for graders (the featured example, video-friendly copy) should still work for residents or be easy to change after the deadline.

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
- Risk-type filters, plus an **Unflagged** switch (off by default) that also shows places with nothing flagged, both persisted in the URL.
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
                      web/ (Next.js App Router on Vercel Hobby) ◄── subdomain (HTTPS)
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
    normalize.py             clip to LA County, select fields, reproject to WGS84 lat/lon (pyproj); title-case
                             all-caps names (§5.2); write the simplified county outline for the app (§7.4)
    geometry.py              hand-written point-in-polygon (ray casting; holes; multipolygons) + bbox prefilter
    grid.py                  grid-cell assignment (§6.1); CELL_SIZE_DEG constant
    join.py                  name unnamed playgrounds, disambiguate names, make slugs (§5.2); assign tract_id,
                             fire zone, zip, projection cell to every place
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
    lib/county-outline.json  simplified LA County outline, written by the pipeline (committed; regenerated with each build)
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

**Names** are settled before slugs are made, and the result is the name everywhere: list, `<h1>`, `<title>`, OG image and slug. Casing happens in `normalize.py`. `join.py` then names unnamed playgrounds (it needs the park polygons), disambiguates duplicates, and makes slugs, in that order, so two unnamed playgrounds in one park are told apart too.
- **All-caps names** (common in county GIS layers) are title-cased, with a short exception list (LA, USC, "de", "del"). Mixed-case names are left alone.
- **Slugs are ASCII.** The slugifier transliterates (NFKD, then strips combining marks). If nothing remains, e.g. a name in a non-Latin script, the slug is `<kind>-<source_id>`.
- **Same name, same kind, within about 150 m** (typically a bus stop on each side of the street): M1 checks whether Metro's `stops.txt` has a usable direction or description field. If not, each name gets a compass side relative to the pair's midpoint: "Vermont / Sunset (east side)". Places are never merged, because each keeps its own `source_key`.
- **Unnamed playgrounds** (OSM playgrounds often lack a `name` tag) are named after the park that contains them, found with the same point-in-polygon code: "Playground in Echo Park". Unnamed playgrounds in no park are dropped, and `build.py` reports the count.

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
```

**Level ranks:** `low = 0`, `elevated = 1`, `high = 2`, `severe = 3`.

**Deliberate denormalization.** `air_rank`/`fire_rank`/`heat_rank` duplicate `risks.level` so that map queries (viewport, nearest, cluster) touch a single table with no join. For the active filter set, a place's pin level is SQLite's multi-argument `max(...)` over the selected rank columns (air, fire, heat). A place is **visible iff that value ≥ 1, or `sea` is selected and `sea_flag = 1`, or Unflagged is on and the place has nothing flagged at all** (`air_rank = 0 AND fire_rank = 0 AND heat_rank = 0 AND sea_flag = 0`). `validate.py` checks the ranks and `sea_flag` agree with `risks`.

Unflagged is a switch, not a risk filter: it adds the places no risk filter could ever show, and never adds places hidden by a risk filter the user turned off. Those places get a neutral pin (§7.4). Off by default, so the default map stays about flagged places.

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
- **Data years:** every today `detail` line ends with its source's `data_years` ("…(statewide, 2015–2017 data)"; formats in the voice doc §8). "Today" in this spec means *the most recent data available for each risk*, and some of it is several years old. The UI says "current data", never "today", and the About page defines it.
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
2. **normalize** — reproject to WGS84; clip to LA County boundary; polygons → representative points for parks/playgrounds (park polygons are kept for the playground-naming join); drop unused fields; title-case all-caps names (§5.2); write `web/lib/county-outline.json`, the county boundary simplified to a few hundred points (§7.4).
3. **join** — name unnamed playgrounds after the park that contains them and drop the rest; disambiguate duplicate names; make slugs (§5.2). Then for each place, find its tract, fire zone, and ZCTA using `geometry.py`: bbox prefilter over candidate polygons, then ray-casting point-in-polygon honoring holes and multipolygons. Places outside every tract are dropped and counted. Each place also gets its **projection grid cell**: if the projection source is a regular lat/lon grid, by index arithmetic (the same `floor` reasoning as §6.1, against the source grid's origin and spacing); otherwise by point-in-polygon over the cell outlines. Places whose cell has no value keep a NULL trend. Finally, each place is tested against the selected CoSMoS flood extent with the same point-in-polygon code; a hit sets `sea_flag = 1`. Only places near the coast are tested (bbox prefilter against the extent's overall bounds), so inland places cost nothing.
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

**Before querying:** a bbox that extends past LA County's bounds is **clipped** to them, not rejected (the map already limits how far out it can go, §7.4). If nothing is selected (no risk types, and Unflagged off), the route returns an empty result without querying: with nothing selected, every part of the visibility clause below would be omitted and every place in view, including `low` ones, would come back.

Convert the visible bounds to a cell range, then filter exactly (edge cells overhang the viewport):

```
WHERE cell_row BETWEEN :r_south AND :r_north
  AND cell_col BETWEEN :c_west  AND :c_east
  AND lat BETWEEN :south AND :north
  AND lon BETWEEN :west  AND :east
  AND ( max(<selected rank columns>) >= 1          -- omitted if no today type is selected
        OR sea_flag = 1                             -- included only if 'sea' is selected
        OR (air_rank = 0 AND fire_rank = 0          -- included only if Unflagged is on
            AND heat_rank = 0 AND sea_flag = 0) )
LIMIT 1001
```

**Overflow:** if 1,001 rows come back, the view holds more than 1,000 visible places, and the route answers in cluster mode (§6.3) for that view instead of silently dropping pins in whatever order SQLite returned them.

Returns `PinSummary[]` with `level` = the computed max rank (0 = `low` when the place is visible only through `sea_flag` or Unflagged), `sea` = `sea_flag = 1`, and `unflagged` = true when the place has nothing flagged at all. Row reads don't change with Unflagged: the grid already scans every place in the cells; only the number of pins returned grows, and the overflow rule below covers dense views. `queries.ts` builds the visibility clause from the selected types: with only `sea` selected it is just `sea_flag = 1`; with only one today type, `max()` gets a single argument, so the clause uses the column directly (SQLite's `max()` with one argument is the aggregate).

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

Typically 1–3 queries. `N` is capped at 100 (the list shows 20 and adds 20 at a time, §7.4). With nothing selected, it returns an empty array without querying (§6.2). Return shape: `NearbyPlace[]` (§7.3), sorted by distance; an empty array when nothing is visible.

Because each place row carries its rank columns and `sea_flag`, the list needs no join to show each place's levels (§5.3).

## 7. Web application (Next.js App Router)

### 7.1 Structure

```
web/
  drizzle.config.ts          dialect: 'turso'; used for `drizzle-kit pull` only (no migrations)
  app/
    layout.tsx               shell: skip link, <Header/>, filters, <PlacesList/>, <MapView/>, live region
                             (map and list persist across navigation)
    page.tsx                 start panel: "Use my location" · zip search (a real GET form) · "Show me an example" (a real link)
    opengraph-image.png      site-level default share image (fallback for every page)
    places/[slug]/
      page.tsx               server-rendered detail panel with "Nearby places" (5); generateMetadata for title, OG/Twitter tags,
                             image alt text (falls back to "So What?" if the database is unreachable); generateStaticParams
                             prerenders the showcase places (§7.6)
      opengraph-image.tsx    generated share image (place name, kind, top risk); returns the site default on error
      error.tsx              "This place didn't load" with Try again (reset) and a link to About (§7.6)
      not-found.tsx
    about/page.tsx           method, thresholds, sources, tip links, attribution, limitations
    api/
      places/route.ts        GET ?bbox=west,south,east,north&zoom=&types=air,fire,heat,sea&unflagged=1
                             → { mode: 'pins', pins } | { mode: 'clusters', clusters }
      places/nearest/route.ts GET ?lat=&lon=&types=&limit= (default 1, max 100) → NearbyPlace[] (§6.4);
                             lat/lon are rounded to 3 decimals by the client (§7.4)
      zips/[zip]/route.ts    GET → bounds + center, or 404
      health/route.ts        GET → { ok, places } via a 1-row meta lookup (uptime monitoring)
  lib/
    db/
      schema.ts              generated by drizzle-kit pull; never hand-edited
      client.ts              drizzle-orm/tursodatabase-serverless + @tursodatabase/serverless (TURSO_DATABASE_URL,
                           read-only TURSO_AUTH_TOKEN); the only file that knows the driver
      queries.ts             every query the app runs; each takes a Drizzle `db` argument; returns DTOs from types.ts
    geo.ts                   CELL_SIZE_DEG, S_MIN, cell math, haversine, bbox parsing and clipping, zoom→factor table
    county.ts                inLaCounty(lat, lon): ray casting over county-outline.json, ported from geometry.py (§7.4)
    format.ts                distances, counts, plurals, type lists for messages (voice doc §10)
    types.ts                 PinSummary, Cluster, PlaceDetail, Risk, Source, Tip (API/UI shapes)
    tips.ts                  one "what you can do" tip per RiskType (§7.4); fixed data, not in the database
  components/
    MapView.tsx              Leaflet (client-only), pins + clusters + the selected marker, syncs with URL; one tab stop,
                             pins not focusable (§7.5); size-reserving "Loading map…" placeholder; tile-failure notice
    PlacesList.tsx           "Places near here": N nearest as an ordered list of links; highlights the matching pin on focus/hover;
                             heading row with the Unflagged switch; "{n} flagged places near …" line; empty and error notes (§7.6)
    Legend.tsx               text legend for pin glyphs, levels, "Projected" and the neutral pin; a collapsible panel
                             inside the map region (§7.4)
    Header.tsx               site name linking to /; zip field on place and About pages from medium width up
    ShareButton.tsx          Web Share API, falling back to copying the link
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

interface PinSummary { slug: string; name: string; kind: PlaceKind; lat: number; lon: number; level: Level; sea: boolean; unflagged: boolean }
interface Cluster    { lat: number; lon: number; count: number; level: Level; sea: boolean }
interface NearbyPlace {
  slug: string; name: string; kind: PlaceKind; lat: number; lon: number; distanceM: number;
  levels: { air: Level; fire: Level; heat: Level }; sea: boolean;   // for list labels like "Heat: High, Air pollution: Elevated"
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

- **Selecting a place:** clicking a pin, or activating a link in "Places near here", navigates to `/places/[slug]`; the layout's map and list persist and the panel swaps. Focus moves to the panel's heading (§7.5). Direct loads of a share URL server-render the panel; the map centers on the place on hydration, and on back/forward navigation it recenters on the place the URL names.
  - If the place is outside the view (list items can be), the map pans to it (instant with reduced motion).
  - **On narrow screens in map view** (`view=map`), opening a place switches to the panel view; the toggle then reads "Show map" and returns to the map centred on the place. Otherwise a tap on a pin changes the URL and focus while the screen still shows the map.
  - **Clicking a cluster** zooms two levels in, centred on it (instant with reduced motion). It doesn't open anything.
  - **On hover** (pointer devices), a pin shows a tooltip with the place's name and kind. Pins stay out of the tab order (§7.5); the list is the keyboard path.
  - The open place always has a **selected marker**, drawn whatever the filters and whether or not the place is visible (§5.3), in a style distinct from level pins. Otherwise a place hidden by a filter, or a place with nothing flagged opened from a share link, leaves the map centred on nothing.
  - **Map moves the app makes don't refresh the list:** opening a place, and the fly-to after an entry action. Only moves the user makes do. Otherwise the refresh reorders the list around the new centre and can remove the item that opened the place, and focus can't return to it (§7.5).
- **Risk card order (consequence first):** each `RiskCard` is a `<section>` that reads top-down, in the DOM and visually, as
  1. a **heading** (`<h2>`) naming the risk and its level: "Heat — High"; for sea level rise, "Sea level rise — Projected". Risk names come from one table in the voice doc §8 ("Air pollution", "Heat", "Wildfire", "Sea level rise") and are used the same way in filters, chips, list items and messages. The first level badge in the panel is followed by a small "How levels work" link to the About page's thresholds. Visually the header row has the **risk glyph + risk name** on the left and the **level meter + level word** on the right, as a small badge; colour is reinforcement only, never the sole signal;
  2. the **So What?** sentence (`soWhat`), the most prominent text on the card;
  3. the **trend** line, when present, visually distinct from today's text, with its "Projected" label placed *before* the sentence in the DOM ("Projected: And it's getting hotter …") so a screen reader never reads a projection as today's fact;
  4. the specific risk (`detail`);
  5. the source line (name, linked), plus, when a trend is shown, the projection's source, scenario and periods (e.g. "Projection: Cal-Adapt LOCA2, {scenario}, {baseline} vs. {future}");
  6. the **tip** ("what you can do"), when shown: one action and a link.

  **On phones (below the list-first breakpoint, §7.5),** items 4–5 change: a short source line stays visible ("Source: CalEPA · Cal-Adapt"), and the `detail` line, full source names and links, and the projection's scenario and periods move behind an **"About this data"** disclosure (`<button aria-expanded>`, one per card), placed where item 4 would be. Wider screens show everything inline. The DOM order is the same at every width. Honesty doesn't depend on the collapsed part: "Projected", "about" and "by mid-century" are in the sentence itself.
- **Glyphs** (two systems, never in the same slot; both `aria-hidden`, always paired with words):
  - **Level meter** (`LevelMeter.tsx`): three slots of rising height; the filled slots are the level (1 = elevated, 2 = high, 3 = severe). The empty slots show where on the scale a place sits, and unequal heights can't be mistaken for a pause icon. Used in card headings and inside map pins. Sea level rise has no meter; its level slot says "Projected".
  - **Risk glyph** (`RiskGlyph.tsx`): one per risk type, in card headings and at-a-glance chips. Chosen set from the [risk icon exploration](../../design/risk-icons.html) (#15, "plain family with the dashed-level sea icon"):
    - air: wind carrying particles (#1);
    - heat: thermometer (#4);
    - wildfire: rounded flame (#7);
    - sea level rise: waves under a dashed level line (#12), also used inside projected pins. It is deliberately the odd one out: the only projected risk gets the only dashed icon, matching the dashed pin outline.

    Drawing system: 24-unit grid, 1.75 round stroke, `currentColor`, no fills except small particle dots. The SVGs in the exploration are usable as-is; give them one refinement pass during visual design (e.g. the thermometer's tick marks are cramped at 16px). Rejected options and why stay on the board.
- **At-a-glance row:** when a place has **2 or more flagged cards** (`elevated` or above today, or a sea card), the panel shows a `<nav aria-label="Risks at this place">` of chips under the place name. Each chip is a link to its card, reading e.g. "Heat — High" with that risk's glyph. The shared glyph ties chip to card; on phones it shows every level on the first screen.
  The consequence leads because it is the product's thesis: the metric supports the sentence, not the other way round. The level sits in the heading because screen-reader users navigate by headings: they can hear all four risks and their levels in four keystrokes instead of listening through each card. Visually the badge stays small, so the sentence is still what the eye lands on. The trend follows the sentence because "and it's getting worse" is what makes it a climate story. This order holds on the live site, in OG images (which omit the tip), and in the demo video. The level describes today only; the card must not imply the projection changed it.
- **Tips ("what you can do"):** each card that is `elevated` or above, and every sea-level-rise card, ends with one tip, so a stated risk always comes with a next step.
  - Defined in `web/lib/tips.ts` as fixed data keyed by `RiskType`: `{ text, linkText, url, org }`. One tip per type; tips don't vary by place, so they live in the app, not the database, and changing one needs no data rebuild.
  - Wording follows the [voice doc](../../content/2026-09-28-so-what-voice-and-templates.md) §7: a verb and a link, never repeating the `so_what`; about what to do now, even under a trend line.
  - `linkText` names the organization ("AirNow", "Ready LA County"), so a screen reader announces where the link goes. Links open in the same tab.
  - Not shown on `low` cards or on the collapsed "Not flagged in current data" line: a next step for a risk that isn't flagged would imply a risk the data doesn't show.
  - The About page lists every tip's organization and URL alongside the data sources.
- **Panel order:** today's cards (air, heat, fire) first, sorted by level; the sea-level-rise card last. Its level slot shows a **"Projected"** label instead of a level, and it uses the same visual treatment as trend lines. `low` cards without a trend line collapse into one line ("Not flagged in current data for air pollution or wildfire") after the flagged cards and above the sea-level-rise card, so the projection isn't mistaken for today's finding. The collapsed line is a `<button aria-expanded>` that reveals them. **A `low` card with a trend line stays expanded** (without a tip), after the flagged cards: collapsing it would hide the "getting hotter" line, and with it the climate story for every place that isn't flagged today. The panel ends with **"Nearby places"**: the 5 nearest visible places (§6.4) as links, so users can move between places without the map. Under the place name, next to the at-a-glance row, a **Share** button (`ShareButton.tsx`) uses the Web Share API where available and otherwise copies the link ("Link copied"), since phones hide the URL bar.
- **One places list per page:** on place pages, the layout's "Places near here" list collapses to a "← Places near here" back link at the top of the panel, and the panel's "Nearby places" replaces it. Showing both duplicated content and pushed the cards down. The back link restores the list as it was when the place was opened and returns focus to the item that opened it (§7.5). If that item is gone anyway, focus goes to the list's heading. **After a direct load** (a share link or the example link), there's no saved list: the back link shows the list measured from this place ("20 flagged places near {place}") and focuses its heading.
- **Header** (`Header.tsx`, every page): the site name, linking to the start page. On place and About pages, from medium width up, it also holds the zip field, so someone who arrived from a share link can look up their own area. On narrow screens the site name link is enough.
- **Pins:** level is encoded by **colour and the level meter** inside the pin (1, 2 or 3 filled slots of 3), in a palette that stays distinguishable under common colour-vision deficiencies (sequential, not red/green). Every pin and cluster has a white halo and dark outline so it keeps 3:1 contrast against light and dark tiles. A place visible only through `sea_flag` uses a **dashed outline with a wave glyph**; a place with both today's findings and `sea_flag` adds the wave glyph as a small badge. A place visible only through Unflagged gets a **neutral pin**: smaller, grey, no level meter. Nothing relies on colour alone.
- **Legend** (`Legend.tsx`): explains every symbol in text, including the neutral pin, and carries the Unflagged switch ("Show unflagged places"). It sits inside the map region as a collapsible panel (`<button aria-expanded>` "Legend"), open by default on wide screens and closed in phone map view, where it's one tap away. The About page repeats it. Exact placement is settled in the visual design pass.
- **Filters:** `?types=air,heat,fire,sea` in the URL, plus `&unflagged=1` when the Unflagged switch is on; applied to pins, clusters, nearest search and both places lists; preserved in share links. Default (no `types` parameter): all four risks, Unflagged off. Nothing selected: `?types=none`, and the list says "No risk types selected. Turn one on to see places." **Filters never apply to the place panel**, which always shows all of a place's risks. Page URLs parse `types`, `unflagged` and `view` leniently: unknown values are dropped, and if nothing valid remains the default applies. (The API still returns 400 for malformed input; only page URLs are lenient, so a mangled share link still opens the place.)
  - **Unflagged** (§5.3) is a small switch, not a fifth checkbox: it sits on the heading row of every places list ("Places near here", "Nearby places"), aligned to the heading's baseline, and in the map's Legend panel, all bound to the same setting. It shows places with nothing flagged, as neutral pins and in the lists, so a resident can find the stop they use even when nothing there is flagged, and read its trend line. It costs no height above the list: the filter block stays four checkboxes (wireframe idea #10; a fifth checkbox added a 32px row at 320px). The switch is a `button[role=switch]` with a visible `<label for>` ("Unflagged"; "Show unflagged places" in the legend), so the word is part of the touch target and the 32×20 track can be smaller than a standalone switch. While it's off, the line under the list heading says "flagged" ("20 flagged places near 90012"), and the nothing-flagged messages after an entry action say that unflagged places are hidden (voice doc §10). Unflagged places are never hidden without saying so.
- **First screen** (before any entry action): the start panel is the main content. It opens with the page's `<h1>` "So What?" and one sentence saying what the site is ("What climate risks mean at LA County bus stops, parks, playgrounds and schools."), then the three actions. The start panel is the only place that explains the site, and a visitor from a shared home-page link hasn't seen the video. "Places near here" isn't rendered until the user picks an entry action, so nothing suggests places near a point they didn't choose. The map starts at county zoom (clusters only), centred on the populated basin rather than the county's geographic centre, which is in the Angeles National Forest.
- **Entry flow:**
  1. Start panel offers **Use my location**, **zip search**, and **Show me an example**. "Show me an example" is a real link to `/places/{featured_slug}`, and zip search is a real `<form method="get">` that JavaScript enhances: without it, the start page resolves `?zip=` on the server and renders "Places near here" for that zip. Both then work before the map code has loaded.
  2. **Use my location:** the button reads "Finding your location…" (`aria-busy`) while waiting; zip search and the example stay enabled. The app applies its own **15-second limit**, which also covers an unanswered permission prompt (the browser's `timeout` only starts once permission is granted). If the user starts another entry action first, a late location result is **ignored** and never moves the map. Repeat activations while one is in progress are ignored. A standing hint under the button says what location is for ("Only used to find places near you."); where the Permissions API reports location as blocked, the hint says that instead.
     **Privacy:** the client rounds the position to 3 decimal places (about 100 m) before any request, and never writes the user's own position to the URL. The map view isn't synced to the URL after locating until the user moves the map, so a copied link can't carry where they are.
  3. **Inside LA County** means inside the simplified county outline (`web/lib/county-outline.json`, written by the pipeline), tested by `lib/county.ts`: the same ray casting as `geometry.py`, ported to TypeScript and checked against shared test vectors (as §6.1 does for the grid). No database read. A bounding box alone would count most of the ocean between the mainland and Catalina as inside.
  4. Geolocation inside LA County → center there. Otherwise → fly to the featured starting spot, with a message that fits the case: **denied** ("Location is off, so here's an example place. You can also search by zip code."), **timed out or unavailable**, or **outside LA County**. Wording for all three: voice doc §10.
  5. Zip search: the browser checks the format first (5 digits; `90012-1234` and surrounding spaces are accepted and trimmed), so malformed input never reaches the API → `/api/zips/[zip]` → fit bounds. Not found, or the service unavailable → inline message (voice doc §10).
  6. Every entry action also refreshes **"Places near here"** from that point (the user's location, the zip's center, or the featured spot), and the result is announced (§7.5).
- **"Places near here" list:** the 20 nearest visible places (§6.4) as an ordered list of links, each reading e.g. "Vermont / Sunset (east side) — bus stop — Heat: High, Air pollution: Elevated — 0.3 miles" (an unflagged place reads "… — Not flagged — …"). The heading row carries the Unflagged switch. A **"Show 20 more"** button below it extends the list, up to 100; focus stays on the button, and the new items are announced ("20 more places."), so the list path reaches as far as the map does in practice. One line under the heading gives the count and what distances are measured from, and says "flagged" while Unflagged is off: "20 flagged places near 90012" / "near your location" / "near the center of the map" / "near {place}". It is the visible twin of the list announcement. It follows the risk filters, refreshes after each entry action and when the map settles after a move the user made (debounced), and works at every zoom, including county zoom where the map shows only clusters. Focusing or hovering an item highlights its pin. While refreshing, the old list stays, slightly dimmed, with `aria-busy="true"`.
- **Empty-viewport check:**
  - After an entry action (geolocation or zip) yields zero visible pins → nearest search → a message naming the nearest flagged place and its distance, with variants for location, zip and sea-only filters (voice doc §10) → fly there. The message says "nothing is flagged," never that the area is safe or low-risk. **Sea only:** if the nearest flagged place is more than 10 miles away, don't fly; the message and the list carry it.
  - During manual panning → never auto-move. The list still shows the nearest places to the map's center, which may lie outside the view; when none are in view, a note above the list says "No flagged places in view. These are the nearest." (sea-only and outside-the-county variants in voice doc §10). The list is empty only when no types are selected, or when the selected types match no place in the county ("No places match these filters. Turn on more risk types.").
  - Distances are written out as "miles", never "mi", so screen readers read them correctly: "less than 0.1 miles", "1 mile", one decimal under 10, whole numbers from 10 up (`lib/format.ts`).
- **Map bounds:** `maxBounds` (with some give) around the county and a `minZoom`, so the map can't drift far from the data. The API still clips any oversize bbox (§6.2).
- **Map tiles:** free tier from a tile provider (MapTiler, Stadia, or Carto — chosen in M0); key in an env var, domain-restricted to the production domain, the project's Vercel preview domain pattern, and localhost; required attributions displayed.

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
  - One `<h1>` per page: the place name on place pages; "So What?" on the start page (§7.4).
  - Risk cards are `<h2>` sections (§7.4); "Places near here" and "Nearby places" are `<h2>` sections with `<ol>` lists.
- **Titles and share metadata:**
  - Place pages: `<title>{place name} ({kind}) — So What?`. Start page: "So What? — Climate risk at LA County places".
  - OG and Twitter images get `og:image:alt` / `twitter:image:alt`, e.g. "Vermont / Sunset bus stop. Heat — High: this neighborhood traps more heat from pavement and buildings than 94% of LA County neighborhoods."
  - The OG image never shows a level without its scope: the top risk as "Heat — High" plus the first clause of its So What? sentence. A named school labelled "Air pollution — Severe" on social media, with no "than 97% of California neighborhoods", is the kind of label the voice doc's principle 3 exists to avoid.
- **Focus:**
  - After navigating to a place, focus moves to the panel's `<h1>` (`tabindex="-1"`). Next.js also announces the route change from the page title.
  - The "← Places near here" back link returns focus to the list item that opened the place (§7.4).
  - Map moves, filter changes and list refreshes never move focus, with one exception: if a refresh removes the focused list item, focus moves to the list's heading (`tabindex="-1"`) instead of dropping to `<body>`.
  - Focus rings are always visible, 2px or more, with 3:1 contrast.
  - There are no modal dialogs. Any added later must close with Escape and return focus.
- **Announcements:** one polite live region (`Announcer.tsx`); nothing is `assertive`. Results and errors are announced once; loading never is. Full wording, including plurals and type lists: voice doc §10.

  | Event | Message |
  |---|---|
  | Filters changed | "Showing {n} places in view for {types}." With none in view: "No places in view for {types}. The list shows the nearest." |
  | No risk types selected | "No risk types selected." |
  | List refreshed after an entry action (not on every pan) | "{n} places near {zip or 'your location'}." |
  | Nothing flagged near an entry point; map flies to the nearest | The same text as the on-screen message (voice doc §10). |
  | Geolocation denied | "Location is off. Showing an example: {place}." |
  | Geolocation timed out or unavailable | "Location unavailable. Showing an example: {place}." |
  | Outside LA County | "Outside LA County. Showing an example: {place}." |
  | Zip error | The same text as the error under the field. Focus stays on the Search button after submit, so the field's description alone isn't read. |
  | Data unavailable (503) | "Place data isn't loading right now." |
  | Offline / back online | "You're offline." / "Back online." |
  | "Show 20 more" | "{n} more places." |
  | Share link copied (fallback) | "Link copied." |

- **Forms:**
  - Zip search has a visible `<label>` "Zip code", `inputmode="numeric"` and `autocomplete="postal-code"`. Errors appear under the field, linked with `aria-invalid` / `aria-describedby`.
  - Risk filters are native checkboxes in a `<fieldset>` with `<legend>Show risks</legend>`: "Air pollution", "Heat", "Wildfire", "Sea level rise". The sea label no longer says "(projected)", so it fits one line of the 2-column grid at 320px; the legend, the dashed pin and the card heading all say "Projected".
  - The Unflagged switch is outside the fieldset, on the places-list heading rows and in the Legend panel (§7.4).
- **Narrow screens and zoom (reflow at 320 CSS px / 400%):**
  - The list, or the place panel, is the main view in normal document flow.
  - A **"Show map / Show list"** toggle (`ViewToggle.tsx`, a button with `aria-pressed`, state kept in the URL) switches views.
  - No drag-only bottom sheet.
  - The filters stay visible above the list (about 84px; Unflagged adds nothing here, §7.4), rather than behind a disclosure, so filtering stays one tap.
- **Motion:** with `prefers-reduced-motion`, fly-to and zoom animations become instant `setView` jumps.
- **Sizes:** base text 16px or more; touch targets at least 24px, and 44px for primary buttons.

### 7.6 Loading, empty and error states

Every state below, with what the user can do in it, is in the [resilience review](../../resilience/2026-09-28-so-what-states-and-edge-cases.md) §2; every message is in voice doc §10. The rules:

- **Every message says what happened and offers a way forward:** a retry, another entry action, or a filter to turn on. No "Something went wrong," and no promised times ("in a few minutes"): when the database's free quota runs out it stays blocked until the monthly reset.
- **Keep what's on screen while fetching.** After a pan or filter change, the previous pins and list stay until new ones arrive; there are no spinners over the map. Each new pins or list request **aborts** the one before it, so an out-of-order response can never draw results for an old view or old filters.
- **Map code loading:** a placeholder the size of the map, "Loading map…", so nothing jumps when Leaflet arrives.
- **Opening a place:** the link being opened shows a pending state (`useLinkStatus`); the panel keeps its current content until the new one is ready.
- **Database unavailable (503):** map and list keep what they last showed, plus a notice with **Try again**. Place pages render `error.tsx` ("This place didn't load", Try again, a link to About) with a 5xx status, so link previews and crawlers don't cache the error as the place. `generateMetadata` falls back to the site title, and `opengraph-image.tsx` to the site's default image.
- **Showcase pages are prerendered.** `generateStaticParams` builds the ~15–20 showcase places, including the featured one, at deploy time. Data only changes with a publish, which already requires a redeploy (§8.2), so this costs nothing, and the example, the demo path and the most-shared pages keep working if Turso is down or over quota.
- **Tile failure:** after several `tileerror` events, a notice in the map area says the background isn't loading and that places and the list still work.
- **Offline:** a notice that clears on the browser's `online` event. No service worker; opening a place while offline falls back to the browser's own offline page.
- **Not found:** "We can't find that place", covering both a mistyped link and a place removed on purpose, with links to the map and the example. HTTP 404.
- **A place with nothing flagged and no sea card** (reachable with the Unflagged switch, or by URL) shows the collapsed "Not flagged in current data…" line, any trend lines, and "Nearby places". If no nearby place matches the filters: "No other places nearby match these filters."
- **Footer:** "Data as of {build date}" on every page, from `meta.build_date` (cached).
- The About page says in one sentence why a card may have no trend line: the projected change is below the meaningful-change threshold, or the projection grid has no value there.

## 8. Deployment

### 8.1 Hosting

- **App:** Vercel Hobby (non-commercial use), project root directory `web/`, served on a subdomain of the author's personal domain: a `CNAME` record to Vercel, which issues the HTTPS certificate. If the personal domain has `CAA` records, they must allow Let's Encrypt.
- **Site URL in one place.** Every absolute URL the app writes (Open Graph and Twitter tags, share links, `metadataBase`) comes from `NEXT_PUBLIC_SITE_URL`, never a hard-coded host. If the site later moves to a dedicated domain, the subdomain stays attached to the project and **permanently redirects** (308) every path to the new host, so share links already posted keep working, as §5.2 promises for slugs.
- **Database:** Turso free tier — 100 databases, 5 GB storage, 500M rows read/month; queries fail with `BLOCKED` once a quota is exceeded. Databases are files, not processes: they never sleep and have no cold start. Vercel Functions region set to match the database's region (e.g. `pdx1` ↔ `aws-us-west-2`).
- **Rows read is the budget that matters.** Turso counts rows *scanned*, not rows returned, so an unindexed viewport query over ~15k places would cost ~15k reads per map pan. The grid index (§6) keeps zoomed-in pans to a few hundred reads — the data structure directly protects the free quota. Zoomed-out cluster queries (§6.3) still scan every place in view (up to ~15k at county zoom, i.e. ~33k such views/month on the free quota — ample for demo traffic). If M3 measurements show otherwise, the pipeline precomputes a `cluster_summaries` table per zoom factor. `/api/health` uses `SELECT value FROM meta WHERE key = 'row_count_places'` (1 row read), not `count(*)`.
- **Env vars:** `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN` (read-only token), `NEXT_PUBLIC_TILE_KEY`, `NEXT_PUBLIC_SITE_URL` (the subdomain's `https://` origin).
- **Monitoring (optional):** UptimeRobot on `/api/health` for alerts (not keep-alive).

### 8.2 Publishing a data build

Blue/green, so a bad upload never affects the live site:
1. `build.py` produces and validates `data/sowhat-YYYYMMDD.db` (WAL mode).
2. `publish.sh` runs `turso db import data/sowhat-YYYYMMDD.db` (creates a new database named after the file), mints a read-only token (`turso db tokens create <db> --read-only`), and runs a smoke query.
3. Update `TURSO_DATABASE_URL` / `TURSO_AUTH_TOKEN` in Vercel; redeploy (env changes apply only to new deployments). The redeploy also rebuilds the prerendered showcase pages from the new database (§7.6), so both variables must be available at build time, not only at runtime.
4. After verifying production, append new slugs to `data/published_slugs.txt`, commit, and — with explicit confirmation — delete the previous database.

The free plan allows 100 databases, so blue/green costs nothing extra.

### 8.3 M0 deployment spike (retire platform risk first)

Before any feature work: a hello-world Next.js app on Vercel on the subdomain (with `NEXT_PUBLIC_SITE_URL` set and an OG tag using it), reading a tiny Turso database (created via `turso db import`) through Drizzle (a `places` table with the cell index), plus `/api/health`. Verify: `drizzle-orm@rc` + `@tursodatabase/serverless` works against Turso Cloud (including the `sql` template and multi-arg `max`); `drizzle-kit@rc pull` introspects the imported db; the same queries run in Vitest over a local driver (§11); viewport-query latency with Functions and database in the same region. Tile provider chosen.

## 9. Security

- The app's Turso token is read-only; no route accepts writes.
- All query parameters are parsed and range-checked in `geo.ts` before reaching `queries.ts`; all SQL goes through Drizzle's parameterized builder / `sql` template (no string concatenation).
- Tile key restricted to the production domain, the project's Vercel preview domains, and localhost.
- Page URLs (`types`, `view`) are parsed leniently in the page, but API parameters are still validated strictly (§7.4, §10.1).
- The user's location is rounded to about 100 m before it leaves the browser, and never written to the URL (§7.4). The app stores nothing about visitors; the only record of a request is the host's standard request log.

## 10. Error handling and validation

### 10.1 Runtime

| Situation | Behavior |
|---|---|
| Malformed `bbox` / `zoom` / `types` / non-numeric params | 400 with a JSON error message |
| `bbox` inverted | 400 |
| `bbox` larger than LA County | Clipped to the county's bounds, not rejected (§6.2) |
| No risk types selected | Empty result without a query; "No risk types selected" (§7.4) |
| More than 1,000 visible places in view | Cluster mode for that view (§6.2) |
| Zip not in `zips` table | 404 → "We don't have {zip} as an LA County zip code. Try a nearby zip, or use your location." Also true of PO-box-only LA zips, which have no ZCTA. |
| Unknown slug | `notFound()` → "We can't find that place", links to the map and the example (§7.6) |
| Geolocation denied / timeout / outside county | Fallback flow with a message for each case (§7.4) |
| Nearest search finds nothing within `K_MAX` | Only possible when the selected types match no place in the county: "No places match these filters." No map movement. |
| Tile provider failure | Basemap blank, with a notice; pins, panels, share links still work (§7.6) |
| Turso unreachable, auth failure, or quota exceeded | API routes return 503; map and list keep their last results and show a notice with Try again; place pages render `error.tsx` with a 5xx status, except the prerendered showcase pages, which keep working; `/api/health` reports `ok: false` (§7.6) |
| Offline | Notice; clears when the connection returns (§7.6) |

### 10.2 Pipeline (`validate.py`)

Fails the build (non-zero exit; nothing published) if any of:
- a place lacks `tract_id`, `cell_row`, or `cell_col`, or its cell doesn't match `floor(lat|lon / CELL_SIZE_DEG)`;
- a place lacks a `risks` row for air, fire or heat, or its rank columns disagree with `risks.level`;
- a `sea` row exists for a place with `sea_flag = 0`, or is missing for a place with `sea_flag = 1`;
- any sea row exists but `meta` lacks `sea_scenario`, `sea_rise`, `sea_flood_condition`, or `sea_period`;
- `sea_flag = 1` for a place outside the CoSMoS extent's overall bounds (catches a reprojection mistake);
- a `risks` row references a missing source, or a source used by a today risk has no `data_years`;
- duplicate slugs or source keys;
- two places of the same kind within about 150 m share a name (disambiguation missed them, §5.2), or any name is empty;
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
- Slug generation is deterministic and stable across runs; accented names transliterate; a name with no ASCII left gives `<kind>-<source_id>`.
- Names: all-caps names title-case with the exception list; same-name pairs within ~150 m get compass sides; an unnamed playground inside a park is named after it, and one in no park is dropped and counted.
- County outline: the written outline's test vectors (inside, outside, on Catalina, in the ocean inside the county's bbox) are shared with the web's `county.ts` test.
- `validate.py`: each failure condition triggers on a crafted bad input.

**Web (Vitest), against a local fixture db (no network):**

`@tursodatabase/serverless` is remote-only, so tests pass `queries.ts` a Drizzle instance over a *local* driver on the fixture file — `drizzle-orm/tursodatabase-database` (`@tursodatabase/database`, Turso's embedded engine) if available on the rc channel, else `drizzle-orm/libsql` with a `file:` URL. Chosen in M0. This works because every query takes `db` as an argument instead of importing the production client.
- `geo.ts`: haversine vs. known distances; bbox parsing/validation; an oversize bbox is clipped, an inverted one rejected; cell math matching `grid.py` on shared test vectors; `CELL_SIZE_DEG` equals `meta.cell_size_deg`.
- `county.ts`: the shared outline test vectors give the same answers as the pipeline.
- `format.ts`: distances at 0.05, 1 and 10 miles; "1 place" / "2 places"; type lists including "all risk types".
- `queries.ts`:
  - viewport query: edge cells overhanging the viewport are excluded; type filters; low-risk hiding; a sea-only place is visible with `sea` selected and hidden without it; `types=sea` alone and a single today type both build a valid clause; **no types selected returns nothing** (not every place); 1,001 visible places in view switch the response to clusters; `unflagged` adds exactly the places with nothing flagged (and `sea_flag = 0`), never a place with a flag the user turned off, and Unflagged on with no risk types is a valid clause.
  - clusters: coarse grouping is correct across negative columns (floor division).
  - nearest (`N = 1`): the **trap case** — the first non-empty box contains a point, but the true nearest lies just outside that box — returns the true nearest; the empty-until-cap case returns an empty array.
  - N nearest: the trap case generalized — the first box holds `N` candidates but the true `N`-th nearest lies just outside it — returns the true `N`; fewer than `N` visible places in the county returns all of them, sorted; results match a brute-force sort of the fixture on shared test vectors.
- Schema drift guard (§7.2).
- `tips.ts`: every `RiskType` has exactly one tip; every URL is `https`; `RiskCard` shows the tip for `elevated`+ and sea cards and hides it for `low`.

**End-to-end (Playwright, small):**
- A share URL renders the panel and correct OG tags.
- Zip search for an LA zip fits the map; a non-LA zip shows the message.
- Geolocation mocked outside LA triggers the fallback flow with the outside-LA message; denied geolocation shows the denied message, not the outside-LA one.
- Unchecking every filter shows "No risk types selected" and no pins.
- With Unflagged off, a place with nothing flagged isn't in the list and the line under the heading says "flagged"; turning on the switch (by its label) adds it, and the legend's switch shows the same state.
- On a 375px-wide viewport in map view, tapping a pin shows the place panel.
- Locating never puts coordinates in the URL; requests carry them to 3 decimal places.
- Open a place, turn off the filter that makes it visible: the selected marker stays, and the panel still shows every risk.
- An unknown slug returns 404 with the not-found page; a place page with the database unreachable returns a 5xx with the error state, and a showcase page still renders.
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
| **M1 — Data spike** | Every source in §5.1 confirmed (license, format, coordinate reference system, vintage); heat-island data confirmed; **fire hazard zones confirmed**: use the 2025 Local Responsibility Area maps as *adopted* by LA County and its cities (OSFM issued them as recommendations on 2025-03-24), plus the State Responsibility Area maps, and confirm that Moderate, High and Very High all appear in the downloaded data (older LRA maps showed only Very High, which would leave the fire levels in §5.4 with nothing to map); **climate projection confirmed**: grid resolution and format, extreme-heat-day definition, SSP2-4.5 available, baseline and mid-century periods; wildfire projection adopted or dropped; **sea level rise confirmed**: OPC Intermediate mid-century amount for the LA tide gauges, the matching CoSMoS increment, and whether "flooded" includes storm conditions; count of flagged places by kind (if almost none, revisit before M2); meaningful-change threshold set; thresholds sanity-checked against real distributions; **featured place chosen** (§5.5); whether Metro's `stops.txt` has a usable direction or description field for telling same-name stops apart (§5.2), and how many OSM playgrounds are unnamed; **each source's data years** for the `detail` lines (§5.5), including the years behind CalEnviroScreen 4.0's PM2.5 and diesel PM indicators and the heat island index. |
| **M2 — Pipeline** | Full ETL with tests; featured place's showcase entry written and cited; valid `data/sowhat-YYYYMMDD.db`; first publish to Turso. |
| **M3 — Map + API** | Viewport pins, server-side clusters, filters, N-nearest search, "Places near here" list, pin glyphs and legend, map keyboard behavior (§7.5); bbox clipping, map bounds, no-types case, cluster fallback over 1,000 pins, selected marker, aborted superseded requests, map and list loading/error/offline states (§7.6); Unflagged switch (list headings and legend) and neutral pins, legend panel, cluster clicks, pin tooltips, "Show 20 more", map-to-panel switch on narrow screens. |
| **M4 — Place pages** | Server-rendered panels, OG metadata and images (with scope), not-found, `error.tsx` and metadata/OG fallbacks, prerendered showcase pages (§7.6), header, Share button, back link after a direct load, "How levels work" link. |
| **M5 — Entry flow** | First screen with `<h1>` and intro, geolocation (with rounding and no location in the URL) (15-second limit, late results ignored, three fallback messages, county outline test), zip search, featured start, empty-viewport behavior, list refresh and announcements, narrow-screen list/map toggle. |
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
- Data is a snapshot as of the build date in `meta`. "Current data" means the most recent data available for each risk, and some of it describes conditions several years ago; each card's detail line gives the years.
- Trend lines are climate-model projections for one emissions scenario, averaged over a grid cell of a few kilometres. They describe the surrounding area's likely direction, not a forecast for a specific place or year, and other scenarios give different values.
- "Extreme-heat days" follow the projection source's definition, which may be relative to each area's own historical temperatures; counts show change over time more reliably than they compare one area with another.
- Air quality has no projection; its card describes present-day conditions only.
- Sea-level-rise flags use one scenario and one flood-extent layer. A place outside the flagged area can still flood under higher scenarios, larger storms, or later dates. Rising groundwater and erosion are not included.
- Not an official hazard assessment; links to authoritative sources for decisions.
- English only. The site is not available in Spanish or other languages, although many people in the most affected neighborhoods speak Spanish at home.
