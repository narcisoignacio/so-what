# So What?

**Video Demo:** <URL HERE>

**Live site:** <URL HERE>

## Description

Climate data is hard to connect to everyday life. A county heat projection or a
tract-level pollution percentile doesn't tell you what it means for the bus stop
where you wait every morning, or whether it's getting worse.

So What? is an interactive map of Los Angeles County that pins everyday places:
bus stops, parks, playgrounds and schools. For each place it names the
climate-related risks there (air pollution, heat, wildfire and sea level rise)
and gives each one a "So What?": one plain sentence about what that risk means
for a person at that place. For example, at a bus stop in a strong urban heat
island: *"This neighborhood traps more heat from pavement and buildings than 94%
of LA County neighborhoods. A long summer wait in direct sun can cause heat
illness, especially for older riders."*

The site is my final project for Harvard's CS50x. It's also meant to be a public
site for LA County residents. The first goal is that someone who has never been
to LA can open one place and understand its risks in about 30 seconds.

## Status

This is a work in progress. The submission deadline is June 30, 2027.

| Milestone | State |
|---|---|
| M0: deployment spike (Next.js on Vercel reading Turso through Drizzle, grid-indexed viewport query, tile provider) | Done |
| M1: data spike (confirm every source, its license, CRS and vintage) | Next |
| M2: Python pipeline (fetch, reproject, point-in-polygon joins, scoring, text) | Not started |
| M3: visual design | In progress (direction board, risk icons) |
| M4–M6: map and API, place pages, entry flow | Not started |
| M7–M8: content, About page, ship | Not started |

The database currently holds six made-up places for testing. Everything below
describes the design in the [spec](docs/superpowers/specs/2026-09-27-so-what-design.md).
Sections about parts that aren't built yet say so.

## How it works

*Planned behavior; the current app is a placeholder page and a health check.*

You start on a short intro with three ways in: **Use my location**, **zip code
search**, or **Show me an example**, which opens a featured bus stop. The map
moves to that point, and a **"Places near here"** list shows the 20 nearest
places that have something flagged, each with its levels and distance.

Opening a place shows one card per risk. Each card leads with the So What?
sentence. Then comes a **trend line** where the data supports one, labelled
"Projected" (for example, extreme-heat days per year now versus mid-century).
After that come the specific measurement, its source and data years, and one
thing you can do about it, with a link.

Today's conditions set each risk's level: low, elevated, high or severe.
Projections never change a level. Sea level rise is the exception: it has no
present-day layer, so a place is *flagged* if it sits inside the projected
mid-century coastal flood area. Its card is marked "Projected", never given a
level.

Filters turn each risk on or off. An **Unflagged** switch, off by default, also
shows places with nothing flagged, so a resident can still find their stop and
read its trend. Every place has a stable URL that shares with a preview image.
The map is optional: the nearest-places list, zip search and filters cover every
task by keyboard and screen reader.

## Data

All sources are public. Each one gets confirmed in M1 (availability, license,
format, coordinate reference system and vintage).

| Risk or layer | Source | Grain |
|---|---|---|
| Air pollution | CalEnviroScreen 4.0 (OEHHA): PM2.5 and diesel PM percentiles | 2010 census tracts |
| Heat, today | CalEPA Urban Heat Island Index | Census tracts |
| Heat, trend | Cal-Adapt LOCA2 downscaled projections, SSP2-4.5: extreme-heat days per year | Grid, a few km |
| Wildfire | CAL FIRE Fire Hazard Severity Zones (SRA and adopted 2025 LRA maps) | Polygons, EPSG:3310 |
| Sea level rise | OPC 2024 guidance, Intermediate scenario (how much rise) + USGS CoSMoS flood extents (where it floods) | Tide gauge; polygons |
| Tracts | Census TIGER/Line **2010** tracts, to match CalEnviroScreen | Polygons |
| Zip codes | Census 2020 ZCTAs | Polygons |
| Places | LA Metro GTFS `stops.txt`, LA County parks layer, CDE school directory, OpenStreetMap `leisure=playground` | Points and polygons |

**From values to levels.** Air uses the higher of the PM2.5 and diesel PM
statewide percentiles: elevated at 75 or above, high at 90, severe at 97. Heat
uses the same cutoffs on the percentile within LA County tracts. Wildfire maps
the hazard class directly: Moderate is elevated, High is high, Very High is
severe. Every cutoff lives in one file with a comment explaining it, and may be
tuned once I can see the real distributions.

**Where the text comes from.** So What? sentences are filled-in templates, keyed
by risk, place kind and level, plus 15 to 20 hand-written entries for showcase
places, each with a citation. The pipeline rejects any sentence over 30 words and
any trend line over 25. No text is generated by an LLM.

**Scale.** Because most layers are tract- or zone-level, the text talks about
"this neighborhood" or "this area", not the exact spot. The exceptions are fire
zones and flood extents: those are detailed polygons, so the text can say "this
stop".

## Architecture

```
public data ──► pipeline/ (Python, run by hand)
                  fetch → normalize → join → grid → score → render → write → validate
                  ▼
               data/sowhat-YYYYMMDD.db   (SQLite file)
                  │  turso db import
                  ▼
               Turso Cloud (SQLite, read-only token)
                  ▲  Drizzle ORM
               web/ (Next.js on Vercel)
```

A Python pipeline does all the spatial work offline. It reprojects every layer to
WGS84, clips it to the county, and runs point-in-polygon joins to give each place
its tract, fire zone, zip and projection cell. It then scores the risks, renders
the text, and writes a fresh SQLite file. A validation step checks the file, and
if anything fails, nothing is published.

The web app only reads. It sends bounding-box and nearest-place queries to that
database through Drizzle.

The split exists because the data changes rarely. These sources update every
year or few years, so there is no reason to compute anything per request.
Rebuilding offline keeps the app small and the token read-only. It also lets each
build be checked before anyone sees it. A new build is uploaded as a new
database, and the app switches to it only after it's verified.

`pipeline/schema.sql` is the one contract between the two halves. The app's
Drizzle schema is generated from the database, never written by hand, and a test
fails if they drift apart.

## Spatial indexing

The heart of the project, and the part CS50 is meant to exercise, is the spatial
code, which I'm writing myself rather than delegating to a library.

- **Point-in-polygon** (`pipeline/geometry.py`, planned): ray casting with
  support for holes and multipolygons, plus a bounding-box prefilter. CoSMoS
  flood extents are a good stress test.
- **Grid index**: every place gets
  `cell_row = floor(lat / 0.01)` and `cell_col = floor(lon / 0.01)`. Cells are
  about 1.1 km north–south and 0.92 km east–west at LA's latitude. It has to be
  `floor`, not truncation, because every LA longitude is negative. A viewport
  query filters on the indexed cell range first, then on exact lat/lon. This
  part is built and tested.
- **N nearest** (planned): a ring search outward from the query cell. It stops
  once the N-th distance (haversine) is no more than `k × S_MIN`, where `S_MIN`
  is the shortest cell side anywhere in the county. At that point, nothing
  outside the box can be closer.
- **Clusters** (planned): at low zoom, the server groups places into coarser
  cells with integer division, offsetting columns to non-negative first because
  SQLite's division rounds toward zero.

The index also protects the free tier. Turso bills by rows *scanned*, so an
unindexed pan over about 15,000 places would read every row each time.

## Files

### `pipeline/`

- `schema.sql`: the database schema: places (with their grid cell and a
  denormalized rank per risk, so map queries need no join), risks, sources, zip
  bounds and build metadata.
- `build_m0.sh`: builds the tiny M0 test database from the schema and seed, in
  the WAL mode `turso db import` requires. Replaced by `build.py` in M2.
- `seed_m0.sql`: six made-up places, including one sitting exactly on a cell
  boundary to test floating-point cell math.

Planned: `fetch.py`, `normalize.py`, `geometry.py`, `grid.py`, `join.py`,
`score.py`, `thresholds.py`, `templates.py`, `render.py`, `showcase.yaml`,
`build.py`, `validate.py`, `publish.sh`, and pytest tests.

### `web/`

- `src/lib/geo.ts`: the grid cell size (which must match the pipeline's) and
  the bounding box to cell range conversion.
- `src/lib/db/client.ts`: the only file that knows the database driver
  (`@tursodatabase/serverless`).
- `src/lib/db/queries.ts`: every query the app runs. Each takes the database as
  an argument, so tests can run the same queries against a local in-memory
  copy. It holds the place count and the grid-indexed viewport query.
- `src/lib/db/generated/`: Drizzle schema and relations generated by
  `drizzle-kit pull`.
- `src/app/page.tsx`, `layout.tsx`, `globals.css`: the placeholder home page and
  shell.
- `src/app/api/health/route.ts`: uptime check that reads one metadata row and
  returns 503 if the database can't be reached.
- `tests/`: Vitest tests for the grid math, the queries, the client, the health
  route, and schema drift. `tests/fixtures/build-fixture.ts` builds an in-memory
  database from `pipeline/schema.sql`.
- `e2e/smoke.spec.ts`: a Playwright smoke test.
- `drizzle.config.ts`, `vercel.json` (pins functions to `pdx1`, next to the
  database in Oregon), `next.config.ts`, `vitest.config.mts`,
  `playwright.config.ts`, `eslint.config.mjs`: configuration.
- `.env.example`: the environment variables the app needs.

### `data/`

Build output only, all gitignored: raw downloads and the dated `.db` files can
be rebuilt from the pipeline. Planned: `published_slugs.txt`, a committed list
of every place URL ever published. The pipeline will fail if a new build drops
one, so shared links don't break.

### `docs/`

Planning work done before writing code: the design spec, the M0 plan and
findings, the voice and text templates, an accessibility review, edge-case and
error states, a UX evaluation, a "first 30 seconds" journey, wireframes, and
visual-direction boards. `PRODUCT.md` summarizes the durable product decisions.

## Design decisions

**My own grid index instead of H3, PostGIS or an R-tree.** H3 or PostGIS would
do the spatial work for me, and that work is what I'm here to learn. At one
county's scale, H3's advantages (uniform neighbors, a global system) don't buy
much. SQLite's R*Tree would be the natural choice, but Turso Cloud doesn't
support SQLite virtual tables yet. A fixed grid in degrees is simple, easy to
prove correct for nearest-neighbor search, and cheap in rows read.

**Templates instead of LLM-generated text.** Each sentence makes a health claim
about a real place. Templates I wrote and checked can't hallucinate, cost
nothing per build, and I can defend every word.

**Places, not zip codes or shaded areas.** A choropleth by zip is too coarse and
reads like a report card. A specific bus stop or playground is what makes the
consequence land. The trade-off is honesty about scale: a point inherits its
tract's value, so the text describes the neighborhood, not the spot.

**Today's conditions first, plus one trend line.** My first idea was to build
each card on 2050 projections. But projection grids are a few kilometers across,
so neighboring places would mostly share one number. A 2050 value also can't be
checked against experience or acted on today. Present-day data is finer-grained
and actionable. Without any projection, though, it isn't a climate-change app,
since heat islands and air pollution aren't climate change by themselves. So
today's data sets the level, and a single "Projected" line shows the direction.

**Sea level rise as a flag, not a level.** If one risk's level meant "the
future" and three meant "today", no level would mean anything precise.

## Testing

What exists now:

```bash
cd web
pnpm install
pnpm test        # Vitest: grid math, queries, client, health route, schema drift
pnpm test:e2e    # Playwright smoke test
pnpm typecheck
pnpm lint
```

The query tests run against an in-memory database built from
`pipeline/schema.sql`, so they need no network.

To build the M0 database (needs `sqlite3`): `./pipeline/build_m0.sh`.

Planned: pytest for the pipeline (points on polygon edges and vertices, holes,
multipolygons, points exactly on cell boundaries, every threshold boundary), and
`validate.py` integrity checks on every build. On the web side: the
"trap case" for nearest-neighbor search, where the first non-empty box holds a
point but the true nearest is just outside it. Then Playwright with automated
accessibility scans, and manual VoiceOver checks before the demo.

## Limitations

- Levels come from area data (tracts and hazard zones) applied to points. They
  describe the surrounding area, not a measurement at the site.
- CalEnviroScreen uses 2010 tract boundaries; ZCTAs only approximate USPS zip
  codes.
- "Current data" means the latest available, and some of it is several years
  old. Each card gives its data years.
- Trend lines use one emissions scenario averaged over a grid cell of a few
  kilometers. They show likely direction, not a forecast for a place or year.
- Sea level rise uses one scenario and one flood layer. Places outside it can
  still flood under higher scenarios or bigger storms. Groundwater rise, erosion
  and inland flooding aren't included.
- It's not an official hazard assessment.
- English only, though many people in the most affected neighborhoods speak
  Spanish at home. Health wording needs a fluent reviewer, and machine
  translation isn't good enough for that.

## Background

I'm a working web developer who came up through a bootcamp, and I took CS50 to
fill in the fundamentals. This project uses both: the web app is familiar
ground, while the pipeline, point-in-polygon code, grid index and
nearest-neighbor search are where the CS50 learning goes.

## Acknowledgments and AI use

**AI use.** I used Claude (through Claude Code) to help plan the project: to
draft and review the design spec, the accessibility, edge-case and UX reviews,
the wireframes and design boards, and the M0 deployment plan. It also helped
with the M0 scaffolding and with this README. The core algorithmic work,
`geometry.py`, `grid.py`, the spatial queries and the nearest-neighbor search,
is my own. AI-assisted code is cited in comments where it appears, as CS50's
final-project policy requires.

**Data.** CalEnviroScreen 4.0 (OEHHA), CalEPA Urban Heat Island Index, Cal-Adapt
(LOCA2), CAL FIRE Fire Hazard Severity Zones, California Ocean Protection
Council, USGS CoSMoS, US Census TIGER/Line and ZCTAs, LA Metro, LA County, the
California Department of Education, and OpenStreetMap contributors (ODbL).
Map tiles © Stadia Maps, © OpenMapTiles, © OpenStreetMap.
