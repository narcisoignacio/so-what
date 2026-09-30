# M0 Deployment Spike Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prove the whole production path works before any feature work. The live subdomain serves the Next.js app with an Open Graph tag built from `NEXT_PUBLIC_SITE_URL`. The app reads a tiny Turso Cloud database through Drizzle, `/api/health` reports on it, the same queries pass in Vitest against a local database, and a tile provider is chosen.

**Architecture:** `pipeline/schema.sql` is the one database contract. A shell script builds a six-place spike database from it, and `turso db import` uploads that file to Turso Cloud. `drizzle-kit pull` generates the Drizzle schema from the database, so nobody hand-writes it. Every query in `src/lib/db/queries.ts` takes a `db` argument. Production passes the Turso Cloud client from `client.ts`, and tests pass an in-memory database from Turso's embedded engine, built from the same `schema.sql`.

**Tech Stack:** Next.js 16.3.6 (App Router, `src/` layout), pnpm 12, Drizzle ORM and drizzle-kit `1.0.0-rc.4`, `@tursodatabase/serverless` 1.4.0 (production driver), `@tursodatabase/database` 0.7.2 (test driver), Vitest 5.0.2, Turso CLI v1.0.32, Vercel Hobby, `sqlite3` CLI 3.54.

**Spec:** [docs/superpowers/specs/2026-09-27-so-what-design.md](../specs/2026-09-27-so-what-design.md) (rev. 12). M0 is defined in §8.3 and §12. Also read §5.3 (schema), §6.1 (grid), §7.1–7.2 (web structure, Drizzle), §8.1 (hosting), §9 (security) and §11 (testing).

---

## Before you start: facts already checked

These were verified on 2026-09-28 in a scratch project, so you don't need to rediscover them:

- `drizzle-orm@rc` is `1.0.0-rc.4`. It ships both drivers M0 needs:
  - `drizzle-orm/tursodatabase-serverless` for Turso Cloud;
  - `drizzle-orm/tursodatabase/database` for the local embedded engine. **The spec calls this `drizzle-orm/tursodatabase-database` (§11). That path is wrong. Use the one with a slash.**
- `@tursodatabase/database` must be opened with `await connect(':memory:')`. `new Database(...)` throws "The database connection is not open". `client.exec(sql)` runs a whole multi-statement file, including `--` comments.
- Through the local driver, a query that uses SQLite's multi-argument `max(a, b)` inside a Drizzle `sql` template, together with `between`, returns the right rows.
- The type `SQLiteAsyncDatabase<'async', unknown>` (from `drizzle-orm/sqlite-core`) accepts both drivers' database objects, so `queries.ts` can take either one.
- `drizzle-kit pull` with `dialect: 'turso'` and a `file:` URL introspects the full §5.3 schema, and the generated `schema.ts` type-checks. Three quirks to expect:
  - It writes `schema.ts`, `relations.ts` **and** a timestamped migration folder into `out`.
  - Inline `CHECK` constraints that sit next to a `--` comment, or that span several lines, come out garbled inside `check(...)` calls. Queries never use these, and the project has no migrations, so this is harmless. Record it and don't hand-edit the file.
  - `UNIQUE` on `slug` and `source_key` may not appear in the output. This is also harmless for reads.
- A failed remote query throws `DrizzleQueryError`.
- `@tursodatabase/database` installs prebuilt binaries and has no install script, so pnpm's `allowBuilds` needs no change.
- In this Next.js version, `GET` route handlers are **not cached by default** (see `web/node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md`). `/api/health` runs on every request without any extra config.
- `34.05 / 0.01` is `3404.9999999999995` in IEEE doubles, in both JavaScript and Python. So a place at latitude exactly 34.05 is in `cell_row` **3404**, not 3405. That's fine as long as the pipeline and the app compute cells the same way, and one seed place pins this down.

## Values you supply

Several steps need values only you have. Set them once in your shell for the session:

```bash
export SITE_HOST=sowhat.<your-domain>      # the subdomain, no scheme
export TURSO_DB=sowhat-m0                  # created in Task 5 from data/sowhat-m0.db
```

## Global Constraints

- Pin exact versions (`pnpm add --save-exact`): `drizzle-orm@1.0.0-rc.4`, `@tursodatabase/serverless@1.4.0`; dev: `drizzle-kit@1.0.0-rc.4`, `@tursodatabase/database@0.7.2`, `vitest@5.0.2`.
- Package manager is pnpm, run inside `web/`. Don't add an npm or yarn lockfile.
- The app uses a `src/` layout. The spec's `web/app/…` is `web/src/app/…` and `web/lib/…` is `web/src/lib/…`, and the `@/*` alias maps to `./src/*`. Tests live in `web/tests/`.
- "`pipeline/schema.sql` is authoritative." The generated Drizzle schema is never hand-edited, and there are no Drizzle migrations (§7.2).
- "`lib/db/client.ts` … the only file that knows the driver." Every query takes a Drizzle `db` argument (§7.1).
- "The app's Turso token is read-only; no route accepts writes" (§9).
- "All SQL goes through Drizzle's parameterized builder / `sql` template (no string concatenation)" (§9).
- "Every absolute URL the app writes … comes from `NEXT_PUBLIC_SITE_URL`, never a hard-coded host" (§8.1).
- Env vars: `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN` (read-only token), `NEXT_PUBLIC_SITE_URL` (§8.1). The spec's `NEXT_PUBLIC_TILE_KEY` was dropped in Task 7: Stadia Maps uses domain-based auth, not a browser key.
- Free tiers only. Vercel Hobby, Turso free plan.
- `CELL_SIZE_DEG = 0.01`, and `cell = floor(value / CELL_SIZE_DEG)` with `floor`, not truncation (§6.1).
- The author writes the spatial queries, and AI-assisted code is cited in a code comment (§13). This applies to the viewport query and cell math in Task 3.
- Code style follows `web/src/app/layout.tsx`: single quotes, semicolons, 2-space indent, `function` declarations, and exports grouped at the bottom of the file.
- Before writing any Next.js code, read the relevant guide in `web/node_modules/next/dist/docs/`, as `web/AGENTS.md` requires. This version differs from older Next.js.
- Commits use Conventional Commits with a subject of 50 characters or fewer. `origin` already uses the `github.com-learning` SSH alias, so push with plain `git push`.

## Review Focus

The spec implies these five cases, and each one is pinned by a test in the task that owns the code:

1. **Exactly one risk type selected.** With one argument, SQLite's `max()` is the aggregate function, so the query would return a single row for the whole viewport. Each place should get its own rank. Covered by Task 3's "single type" test.
2. **No risk types selected.** This should return an empty list without running a query. If the visibility clause is dropped, every place in view comes back (§6.2). Covered by Task 3's "no types" test.
3. **A place exactly on a cell boundary, or a viewport edge on one.** A place at `(34.05, -118.25)` should appear when the viewport's south and west edges are exactly 34.05 and -118.25. Covered by Task 3's "boundary" test, and by the seed-consistency test that checks every stored cell equals `Math.floor(value / CELL_SIZE_DEG)`.
4. **Database unreachable, token rejected, or `meta` row missing.** `/api/health` should return `503 { ok: false }` and log the error. It shouldn't crash with a 500 (§10.1). Covered by Task 4's health tests.
5. **Env vars missing.** `next build` should still succeed, because the client is created lazily. At runtime, `/api/health` should answer 503 with a clear logged error. Covered by Task 4's client test and the build step run with no env vars.

---

## File map

| Path                                                   | Responsibility                                                                        | Task |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------- | ---- |
| `pipeline/schema.sql`                                  | The database contract, verbatim from spec §5.3                                        | 1    |
| `pipeline/seed_m0.sql`                                 | Six illustrative places and four `meta` rows. Spike only; M2's `build.py` replaces it | 1    |
| `pipeline/build_m0.sh`                                 | Builds `data/sowhat-m0.db` (VACUUM, WAL) for `turso db import`                        | 1    |
| `.gitignore` (root)                                    | Ignores `data/raw/` and `data/sowhat-*.db*`                                           | 1    |
| `web/package.json`                                     | Drizzle, Turso drivers, Vitest; `test`, `typecheck`, `db:pull` scripts                | 2    |
| `web/vitest.config.mts`                                | Vitest config with the `@` alias                                                      | 2    |
| `web/drizzle.config.ts`                                | `drizzle-kit pull` config (`dialect: 'turso'`)                                        | 2    |
| `web/src/lib/db/generated/schema.ts`, `relations.ts`   | Generated by `drizzle-kit pull`; never hand-edited                                    | 2    |
| `web/tests/fixtures/build-fixture.ts`                  | In-memory database from `schema.sql` and the seed                                     | 2    |
| `web/tests/schema-drift.test.ts`                       | Drift guard: `PRAGMA table_info` vs Drizzle columns (§7.2)                            | 2    |
| `web/src/lib/geo.ts`                                   | `CELL_SIZE_DEG`, `BoundingBox`, `cellRange`                                           | 3    |
| `web/src/lib/db/queries.ts`                            | `Db` type, `getPlaceCount`, spike `viewportPins`                                      | 3    |
| `web/tests/geo.test.ts`, `web/tests/queries.test.ts`   | Tests for the two files above                                                         | 3    |
| `web/src/lib/db/client.ts`                             | Lazy Turso Cloud Drizzle client                                                       | 4    |
| `web/src/app/api/health/route.ts`                      | `GET` → `{ ok, places }` or 503                                                       | 4    |
| `web/src/app/api/spike/viewport/route.ts`              | Throwaway latency probe; removed in Task 8                                            | 4    |
| `web/tests/client.test.ts`, `web/tests/health.test.ts` | Tests for the client and the health route                                             | 4    |
| `web/.env.example`, `web/.gitignore`                   | Documents the env vars; un-ignores the example file                                   | 4    |
| `web/vercel.json`                                      | Function region matched to the Turso database                                         | 6    |
| `docs/superpowers/spikes/2026-09-28-m0-findings.md`    | Results, choices, measurements                                                        | 5–8  |
| Spec (rev. 13)                                         | Corrections from M0 (paths, driver name, tile provider)                               | 8    |

---

### Task 1: Database contract and spike build

**Files:**
- Create: `pipeline/schema.sql`
- Create: `pipeline/seed_m0.sql`
- Create: `pipeline/build_m0.sh`
- Modify: `.gitignore` (root; currently holds `.agents` and `.claude` with no trailing newline)

**Interfaces:**
- Produces: `pipeline/schema.sql` (read by the Task 2 fixture), `pipeline/seed_m0.sql` (read by the Task 2 fixture; the tests in Tasks 3–4 rely on its exact rows), and `data/sowhat-m0.db` (read by Task 2's `drizzle-kit pull`, uploaded in Task 5).

- [x] **Step 1: Run the check before anything exists, and see it fail**

Run from the repo root: `sqlite3 data/sowhat-m0.db "SELECT count(*) FROM places;"`
Expected: an error such as `Error: in prepare, no such table: places`. If sqlite3 created an empty file, delete it with `rm -f data/sowhat-m0.db`.

- [x] **Step 2: Write `pipeline/schema.sql`**

Copy this verbatim from spec §5.3:

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

- [x] **Step 3: Write `pipeline/seed_m0.sql`**

The Task 3 and Task 4 tests assert on these exact rows, so don't change them without updating those tests.

```sql
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
```

- [x] **Step 4: Write `pipeline/build_m0.sh` and make it executable**

```bash
#!/usr/bin/env bash
# M0 spike: build a tiny database from schema.sql + seed_m0.sql for `turso db import`.
# Replaced by build.py in M2. Steps follow spec §5.6 "write": fresh file, VACUUM, then WAL.
set -euo pipefail
cd "$(dirname "$0")/.."

out=data/sowhat-m0.db
mkdir -p data
rm -f "$out" "$out-wal" "$out-shm"
sqlite3 "$out" < pipeline/schema.sql
sqlite3 "$out" < pipeline/seed_m0.sql
sqlite3 "$out" 'VACUUM; PRAGMA journal_mode=WAL;' > /dev/null
echo "built $out"
```

Run: `chmod +x pipeline/build_m0.sh`

- [x] **Step 5: Ignore build output**

Append to the root `.gitignore`. It has no trailing newline, so start with one:

```bash
printf '\n\n# pipeline output (spec §4)\ndata/raw/\ndata/sowhat-*.db\ndata/sowhat-*.db-wal\ndata/sowhat-*.db-shm\n' >> .gitignore
```

- [x] **Step 6: Build and verify**

Run: `pipeline/build_m0.sh && sqlite3 data/sowhat-m0.db "SELECT count(*) FROM places; SELECT value FROM meta WHERE key='row_count_places'; PRAGMA journal_mode; PRAGMA integrity_check;"`
Expected:
```
built data/sowhat-m0.db
6
6
wal
ok
```
Then run `git status --short`. It should show `.gitignore` and the three `pipeline/` files, and no `data/` entries.

- [x] **Step 7: Commit**

```bash
git add .gitignore pipeline/schema.sql pipeline/seed_m0.sql pipeline/build_m0.sh
git commit -m "feat(pipeline): add schema and M0 spike build"
```

---

### Task 2: Test harness, generated schema and drift guard

**Files:**
- Modify: `web/package.json` (dependencies and scripts)
- Modify: `web/eslint.config.mjs` (ignore generated code)
- Modify: `web/.gitignore` (ignore pull's migration folders)
- Create: `web/vitest.config.mts`
- Create: `web/drizzle.config.ts`
- Create (generated): `web/src/lib/db/generated/schema.ts`, `web/src/lib/db/generated/relations.ts`
- Create: `web/tests/fixtures/build-fixture.ts`
- Test: `web/tests/schema-drift.test.ts`

**Interfaces:**
- Consumes: `pipeline/schema.sql`, `pipeline/seed_m0.sql`, `data/sowhat-m0.db` (Task 1).
- Produces:
  - `@/lib/db/generated/schema` exports the tables `places`, `risks`, `sources`, `zips` and `meta`. Column properties are camelCase (`cellRow`, `cellCol`, `airRank`, `fireRank`, `heatRank`, `seaFlag`, `isShowcase`, …).
  - `buildFixture(options?: { seed?: boolean }): Promise<{ client: Database; db: TursoDatabaseDatabase }>` comes from `web/tests/fixtures/build-fixture.ts`. `seed` defaults to `true`.
  - pnpm scripts: `test`, `test:watch`, `typecheck`, `db:pull`.

- [x] **Step 1: Install pinned dependencies**

Run in `web/`:
```bash
pnpm add --save-exact drizzle-orm@1.0.0-rc.4 @tursodatabase/serverless@1.4.0
pnpm add --save-exact -D drizzle-kit@1.0.0-rc.4 @tursodatabase/database@0.7.2 vitest@5.0.2
```
Expected: installs with no "ignored build scripts" warning for the Turso packages. If pnpm does warn about `@tursodatabase/database`, add `'@tursodatabase/database': true` under `allowBuilds` in `web/pnpm-workspace.yaml` and run `pnpm install` again.

- [x] **Step 2: Add scripts to `web/package.json`**

Replace the `scripts` block with:

```json
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "db:pull": "drizzle-kit pull"
  },
```

- [x] **Step 3: Write `web/vitest.config.mts`**

```ts
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
```

- [x] **Step 4: Write `web/drizzle.config.ts`**

This config is used only by `drizzle-kit pull`. By default it reads the local spike build. In Task 5 you'll run it against Turso Cloud by exporting the env vars first.

```ts
import { defineConfig } from 'drizzle-kit';

// Used only for `drizzle-kit pull`; pipeline/schema.sql owns the schema and there are no migrations (spec §7.2).
export default defineConfig({
  dialect: 'turso',
  out: './src/lib/db/generated',
  dbCredentials: {
    url: process.env.TURSO_DATABASE_URL ?? 'file:../data/sowhat-m0.db',
    authToken: process.env.TURSO_AUTH_TOKEN,
  },
});
```

- [x] **Step 5: Keep generated output out of lint and out of git where it isn't wanted**

In `web/eslint.config.mjs`, add `"src/lib/db/generated/**",` to the `globalIgnores([...])` list, after `"next-env.d.ts",`.

Append to `web/.gitignore`:

```
# drizzle-kit pull writes a migration folder next to schema.ts; the project has no migrations (spec §7.2)
/src/lib/db/generated/*/
```

- [x] **Step 6: Write the fixture builder `web/tests/fixtures/build-fixture.ts`**

```ts
import { readFileSync } from 'node:fs';
import { connect } from '@tursodatabase/database';
import { drizzle } from 'drizzle-orm/tursodatabase/database';

// tests/fixtures → tests → web → repo root
const PIPELINE_DIR = new URL('../../../pipeline/', import.meta.url);

// A fresh in-memory database built from the real schema (spec §7.1, §11).
async function buildFixture(options: { seed?: boolean } = {}) {
  const client = await connect(':memory:');
  await client.exec(readFileSync(new URL('schema.sql', PIPELINE_DIR), 'utf8'));
  if (options.seed !== false) {
    await client.exec(readFileSync(new URL('seed_m0.sql', PIPELINE_DIR), 'utf8'));
  }
  return { client, db: drizzle({ client }) };
}

export { buildFixture };
```

- [x] **Step 7: Write the failing drift-guard test `web/tests/schema-drift.test.ts`**

```ts
import { is, sql } from 'drizzle-orm';
import { getTableConfig, SQLiteTable } from 'drizzle-orm/sqlite-core';
import { describe, expect, it } from 'vitest';
import * as schema from '@/lib/db/generated/schema';
import { buildFixture } from './fixtures/build-fixture';

interface ColumnInfo {
  name: string;
  type: string;
}

// Drift guard (spec §7.2): the generated Drizzle schema must match pipeline/schema.sql.
describe('generated Drizzle schema', () => {
  const tables = Object.values(schema).filter((value) => is(value, SQLiteTable));

  it('covers exactly the tables in schema.sql', async () => {
    const { db } = await buildFixture({ seed: false });
    const rows = await db.all<{ name: string }>(
      sql`SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name`,
    );
    const drizzleNames = tables.map((table) => getTableConfig(table).name).sort();
    expect(drizzleNames).toEqual(rows.map((row) => row.name));
  });

  it.each(tables.map((table) => [getTableConfig(table).name, table] as const))(
    '%s has the same columns and types',
    async (name, table) => {
      const { db } = await buildFixture({ seed: false });
      const info = await db.all<ColumnInfo>(sql`PRAGMA table_info(${sql.identifier(name)})`);
      const fromSql = info.map((column) => [column.name, column.type.toLowerCase()]).sort();
      const fromDrizzle = getTableConfig(table)
        .columns.map((column) => [column.name, column.getSQLType().toLowerCase()])
        .sort();
      expect(fromDrizzle).toEqual(fromSql);
    },
  );
});
```

- [x] **Step 8: Run the test to verify it fails**

Run in `web/`: `pnpm test`
Expected: FAIL. Vite can't resolve `@/lib/db/generated/schema` because the file doesn't exist yet.

- [x] **Step 9: Generate the schema**

Run in `web/`: `pnpm db:pull`
Expected: output ending with `Your schema file is ready ➜ src/lib/db/generated/schema.ts`. `src/lib/db/generated/` should now hold `schema.ts`, `relations.ts` and one timestamped folder, which git ignores. **Don't edit `schema.ts`**, even though some `check(...)` lines look garbled (see "Before you start").

- [x] **Step 10: Run the tests to verify they pass**

Run in `web/`: `pnpm test && pnpm typecheck && pnpm lint`
Expected: 6 tests pass (1 table-list test and 5 per-table tests), and typecheck and lint both exit 0. If `column.getSQLType` doesn't exist on rc.4, use `column.columnType` and map `SQLiteInteger`→`integer`, `SQLiteText`→`text` and `SQLiteReal`→`real` in the test. Note the change in the findings doc.

- [x] **Step 11: Commit**

```bash
git add web/package.json web/pnpm-lock.yaml web/pnpm-workspace.yaml web/vitest.config.mts web/drizzle.config.ts \
  web/eslint.config.mjs web/.gitignore web/src/lib/db/generated/schema.ts web/src/lib/db/generated/relations.ts \
  web/tests/fixtures/build-fixture.ts web/tests/schema-drift.test.ts
git commit -m "test(web): add Vitest, pulled schema, drift guard"
```

---

### Task 3: Grid cell math and the spike queries

> **Author-written code (spec §13).** `cellRange` and `viewportPins` are part of the spatial-query work the author must write. Write them yourself from the tests in Steps 1 and 5, then compare with the reference code in Steps 3 and 7. If you use the reference code, keep the `AI-assisted` comment.

**Files:**
- Create: `web/src/lib/geo.ts`
- Create: `web/src/lib/db/queries.ts`
- Test: `web/tests/geo.test.ts`
- Test: `web/tests/queries.test.ts`

**Interfaces:**
- Consumes: `buildFixture` (Task 2); `places` and `meta` from `@/lib/db/generated/schema` (Task 2).
- Produces:
  - `@/lib/geo`: `CELL_SIZE_DEG: number` (0.01); `type BoundingBox = { west: number; south: number; east: number; north: number }`; `type CellRange = { rowMin: number; rowMax: number; colMin: number; colMax: number }`; `cellRange(boundingBox: BoundingBox): CellRange`.
  - `@/lib/db/queries`: `type Db = SQLiteAsyncDatabase<'async', unknown>`; `type TodayRiskType = 'air' | 'fire' | 'heat'`; `interface SpikePin { slug: string; name: string; lat: number; lon: number; rank: number }`; `getPlaceCount(db: Db): Promise<number>`, which throws if `meta.row_count_places` is missing; `viewportPins(db: Db, boundingBox: BoundingBox, types: TodayRiskType[]): Promise<SpikePin[]>`, which sorts by slug.

- [x] **Step 1: Write the failing geo tests `web/tests/geo.test.ts`**

```ts
import { eq } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';
import { meta, places } from '@/lib/db/generated/schema';
import { CELL_SIZE_DEG, cellRange } from '@/lib/geo';
import { buildFixture } from './fixtures/build-fixture';

describe('cellRange', () => {
  it('floors negative longitudes instead of truncating toward zero (spec §6.1)', () => {
    const range = cellRange({ west: -118.2916, south: 34.098, east: -118.2606, north: 34.098 });
    expect(range).toEqual({ rowMin: 3409, rowMax: 3409, colMin: -11830, colMax: -11827 });
  });

  it('puts an edge that lies exactly on 34.05 / -118.25 in the same cell the pipeline stores', () => {
    const range = cellRange({ west: -118.25, south: 34.05, east: -118.25, north: 34.05 });
    expect(range).toEqual({ rowMin: 3404, rowMax: 3404, colMin: -11825, colMax: -11825 });
  });
});

describe('CELL_SIZE_DEG', () => {
  it('equals meta.cell_size_deg (spec §6.1)', async () => {
    const { db } = await buildFixture();
    const rows = await db.select({ value: meta.value }).from(meta).where(eq(meta.key, 'cell_size_deg'));
    expect(Number(rows[0].value)).toBe(CELL_SIZE_DEG);
  });

  it('gives every stored place the cell the app would compute', async () => {
    const { db } = await buildFixture();
    const rows = await db.select().from(places);
    for (const place of rows) {
      expect([place.slug, place.cellRow, place.cellCol]).toEqual([
        place.slug,
        Math.floor(place.lat / CELL_SIZE_DEG),
        Math.floor(place.lon / CELL_SIZE_DEG),
      ]);
    }
  });
});
```

- [x] **Step 2: Run to verify it fails**

Run in `web/`: `pnpm test tests/geo.test.ts`
Expected: FAIL. `@/lib/geo` can't be resolved.

- [x] **Step 3: Write `web/src/lib/geo.ts`**

```ts
// Grid-index cell size in degrees (spec §6.1). Must equal pipeline/grid.py and meta.cell_size_deg.
const CELL_SIZE_DEG = 0.01;

interface BoundingBox {
  west: number;
  south: number;
  east: number;
  north: number;
}

interface CellRange {
  rowMin: number;
  rowMax: number;
  colMin: number;
  colMax: number;
}

/**
 * Computes the grid cell range enclosing a bounding box.
 * Uses Math.floor to correctly handle negative coordinates (spec §6.1).
 */
function cellRange(boundingBox: BoundingBox): CellRange {
  return {
    rowMin: Math.floor(boundingBox.south / CELL_SIZE_DEG),
    rowMax: Math.floor(boundingBox.north / CELL_SIZE_DEG),
    colMin: Math.floor(boundingBox.west / CELL_SIZE_DEG),
    colMax: Math.floor(boundingBox.east / CELL_SIZE_DEG),
  };
}

export { CELL_SIZE_DEG, cellRange, type BoundingBox, type CellRange };

```

- [x] **Step 4: Run to verify it passes**

Run in `web/`: `pnpm test tests/geo.test.ts`
Expected: 4 tests pass.

- [x] **Step 5: Write the failing query tests `web/tests/queries.test.ts`**

The expected values come from the seed rows in Task 1, Step 3.

```ts
import { beforeAll, describe, expect, it } from 'vitest';
import { type Db, getPlaceCount, viewportPins } from '@/lib/db/queries';
import type { BoundingBox } from '@/lib/geo';
import { buildFixture } from './fixtures/build-fixture';

// Roughly LA County's bounds; contains every seed place.
const ALL_LA: BoundingBox = { west: -118.95, south: 33.7, east: -117.64, north: 34.83 };

let db: Db;

beforeAll(async () => {
  ({ db } = await buildFixture());
});

describe('getPlaceCount', () => {
  it('reads meta.row_count_places', async () => {
    expect(await getPlaceCount(db)).toBe(6);
  });

  it('throws when the meta row is missing', async () => {
    const { db: empty } = await buildFixture({ seed: false });
    await expect(getPlaceCount(empty)).rejects.toThrow('row_count_places');
  });
});

describe('viewportPins', () => {
  it('ranks each place by the highest selected rank and hides low places', async () => {
    const pins = await viewportPins(db, ALL_LA, ['air', 'fire', 'heat']);
    expect(pins.map((pin) => [pin.slug, pin.rank])).toEqual([
      ['echo-park', 1],
      ['grand-park', 3],
      ['main-1st', 2],
      ['sample-elementary-school', 1],
      ['vermont-sunset', 3],
    ]);
  });

  it('returns one row per place when a single type is selected', async () => {
    // SQLite's one-argument max() is the aggregate and would return a single row.
    const pins = await viewportPins(db, ALL_LA, ['heat']);
    expect(pins.map((pin) => [pin.slug, pin.rank])).toEqual([
      ['echo-park', 1],
      ['grand-park', 2],
      ['main-1st', 2],
      ['vermont-sunset', 3],
    ]);
  });

  it('returns nothing, without querying, when no types are selected', async () => {
    const unusable = null as unknown as Db;
    expect(await viewportPins(unusable, ALL_LA, [])).toEqual([]);
  });

  it('excludes places in an edge cell that lie outside the viewport', async () => {
    // grand-park (34.0561) shares cell row 3405 with this viewport's north edge but lies north of it.
    const pins = await viewportPins(db, { west: -118.26, south: 34.04, east: -118.24, north: 34.055 }, ['heat']);
    expect(pins.map((pin) => pin.slug)).toEqual(['main-1st']);
  });

  it('includes a place that sits exactly on the viewport corner and a cell boundary', async () => {
    const pins = await viewportPins(db, { west: -118.25, south: 34.05, east: -118.24, north: 34.06 }, ['heat']);
    expect(pins.map((pin) => pin.slug)).toEqual(['grand-park', 'main-1st']);
  });

  it('ignores duplicate types', async () => {
    const pins = await viewportPins(db, ALL_LA, ['fire', 'fire']);
    expect(pins.map((pin) => [pin.slug, pin.rank])).toEqual([['sample-elementary-school', 1]]);
  });
});
```

- [x] **Step 6: Run to verify it fails**

Run in `web/`: `pnpm test tests/queries.test.ts`
Expected: FAIL. `@/lib/db/queries` can't be resolved.

- [x] **Step 7: Write `web/src/lib/db/queries.ts`**

```ts
import { BoundingBox, cellRange } from '@/lib/geo';
import { and, between, eq, gte, sql } from 'drizzle-orm';
import { SQLiteAsyncDatabase } from 'drizzle-orm/sqlite-core';
import { meta, places } from './generated/schema';

type Db = SQLiteAsyncDatabase<'async', unknown>;
type TodayRiskType = 'air' | 'fire' | 'heat';

interface SpikePin {
  slug: string;
  name: string;
  lat: number;
  lon: number;
  rank: number;
}

const RANK_COLUMNS = {
  air: places.airRank,
  fire: places.fireRank,
  heat: places.heatRank,
};

/**
 * Reads and returns the total number of places stored in the database from the metadata table.
 */
async function getPlaceCount(db: Db): Promise<number> {
  const rows = await db
    .select({ value: meta.value })
    .from(meta)
    .where(eq(meta.key, 'row_count_places'));

  if (rows.length === 0) {
    throw new Error('row_count_places metadata is missing');
  }

  return Number(rows[0].value);
}

/**
 * Retrieves viewport map pins within a given bounding box, filtered and ranked by selected risk types.
 * Leverages grid cell index ranges for coarse spatial filtering followed by precise coordinate bounds.
 */
async function viewportPins(
  db: Db,
  boundingBox: BoundingBox,
  types: TodayRiskType[],
): Promise<SpikePin[]> {
  const uniqueTypes = Array.from(new Set(types));

  if (uniqueTypes.length === 0) {
    return [];
  }

  const { rowMin, rowMax, colMin, colMax } = cellRange(boundingBox);
  const rankColumns = uniqueTypes.map((type) => RANK_COLUMNS[type]);

  // SQLite treats one-argument max() as an aggregate, use the column
  // directly for one selected risk type.
  const rank =
    rankColumns.length === 1
      ? sql`${rankColumns[0]}`
      : sql`max(${sql.join(rankColumns, sql`, `)})`;

  const subq = db
    .select({
      slug: places.slug,
      name: places.name,
      lat: places.lat,
      lon: places.lon,
      rank: rank.mapWith(Number).as('rank'),
    })
    .from(places)
    .where(
      and(
        between(places.cellRow, rowMin, rowMax),
        between(places.cellCol, colMin, colMax),
        between(places.lat, boundingBox.south, boundingBox.north),
        between(places.lon, boundingBox.west, boundingBox.east),
      ),
    )
    .as('subq');

  return db.select().from(subq).where(gte(subq.rank, 1)).orderBy(subq.slug);
}

export {
  getPlaceCount,
  viewportPins,
  type Db,
  type SpikePin,
  type TodayRiskType,
};
```

- [x] **Step 8: Run to verify it passes**

Run in `web/`: `pnpm test && pnpm typecheck && pnpm lint`
Expected: every test passes (6 drift, 4 geo, 8 queries), and typecheck and lint exit 0.

- [x] **Step 9: Commit**

```bash
git add web/src/lib/geo.ts web/src/lib/db/queries.ts web/tests/geo.test.ts web/tests/queries.test.ts
git commit -m "feat(web): add grid cell math and spike queries"
```

---

### Task 4: Turso client, `/api/health` and the latency probe

Read `web/node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md` first.

**Files:**
- Create: `web/src/lib/db/client.ts`
- Create: `web/src/app/api/health/route.ts`
- Create: `web/src/app/api/spike/viewport/route.ts`
- Create: `web/.env.example`
- Modify: `web/.gitignore` (un-ignore `.env.example`)
- Test: `web/tests/client.test.ts`
- Test: `web/tests/health.test.ts`

**Interfaces:**
- Consumes: `Db`, `getPlaceCount`, `viewportPins` (Task 3); `buildFixture` (Task 2).
- Produces:
  - `@/lib/db/client`: `getDb(): Db`. It's lazy and cached, and throws `Error('TURSO_DATABASE_URL and TURSO_AUTH_TOKEN must be set')` when either env var is missing.
  - `GET /api/health` → `200 { ok: true, places: number }` or `503 { ok: false }`.
  - `GET /api/spike/viewport` → `200 { queryMs: number, count: number, region: string }` or `503 { ok: false }`. Throwaway; removed in Task 8.

- [x] **Step 1: Write the failing client test `web/tests/client.test.ts`**

```ts
import { afterEach, describe, expect, it, vi } from 'vitest';
import { getDb } from '@/lib/db/client';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('getDb', () => {
  it('fails with a clear message when the Turso env vars are missing', () => {
    vi.stubEnv('TURSO_DATABASE_URL', '');
    vi.stubEnv('TURSO_AUTH_TOKEN', '');
    expect(() => getDb()).toThrow('TURSO_DATABASE_URL and TURSO_AUTH_TOKEN must be set');
  });
});
```

- [x] **Step 2: Write the failing health tests `web/tests/health.test.ts`**

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GET } from '@/app/api/health/route';
import { getDb } from '@/lib/db/client';
import { buildFixture } from './fixtures/build-fixture';

vi.mock('@/lib/db/client', () => ({ getDb: vi.fn() }));

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('GET /api/health', () => {
  it('reports the place count', async () => {
    const { db } = await buildFixture();
    vi.mocked(getDb).mockReturnValue(db);
    const response = await GET();
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, places: 6 });
  });

  it('answers 503 when the client cannot be created', async () => {
    vi.mocked(getDb).mockImplementation(() => {
      throw new Error('TURSO_DATABASE_URL and TURSO_AUTH_TOKEN must be set');
    });
    const response = await GET();
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ ok: false });
    expect(console.error).toHaveBeenCalled();
  });

  it('answers 503 when the query fails', async () => {
    const { client, db } = await buildFixture();
    await client.exec("DELETE FROM meta WHERE key = 'row_count_places'");
    vi.mocked(getDb).mockReturnValue(db);
    const response = await GET();
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ ok: false });
  });
});
```

- [x] **Step 3: Run to verify they fail**

Run in `web/`: `pnpm test tests/client.test.ts tests/health.test.ts`
Expected: FAIL. `@/lib/db/client` and `@/app/api/health/route` can't be resolved.

- [x] **Step 4: Write `web/src/lib/db/client.ts`**

```ts
import { drizzle } from 'drizzle-orm/tursodatabase-serverless';
import type { Db } from '@/lib/db/queries';

// The only file that knows the driver (spec §7.1). Created on first use, not at import,
// so `next build` works without database credentials.
let db: Db | undefined;

/**
 * Initializes and retrieves a singleton instance of the Drizzle database connection.
 *
 * Uses lazy initialization (created on first use) to ensure that build processes
 * (like `next build`) can execute successfully without requiring database credentials
 * in the environment.
 */
function getDb(): Db {
  if (db) {
    return db;
  }
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  if (!url || !authToken) {
    throw new Error('TURSO_DATABASE_URL and TURSO_AUTH_TOKEN must be set');
  }
  db = drizzle({ connection: { url, authToken } });
  return db;
}

export { getDb };
```

- [x] **Step 5: Write `web/src/app/api/health/route.ts`**

```ts
import { getDb } from '@/lib/db/client';
import { getPlaceCount } from '@/lib/db/queries';

/**
 * Uptime check (spec §7.1, §8.1): one row read;
 * 503 when the database can't be reached (spec §10.1).
 */
async function GET() {
  try {
    const places = await getPlaceCount(getDb());
    return Response.json({ ok: true, places });
  } catch (error) {
    console.error('health check failed', error);
    return Response.json({ ok: false }, { status: 503 });
  }
}

export { GET };
```

- [x] **Step 6: Run to verify they pass**

Run in `web/`: `pnpm test`
Expected: every test passes (6 drift, 4 geo, 8 queries, 1 client, 3 health).

- [x] **Step 7: Write the latency probe `web/src/app/api/spike/viewport/route.ts`**

It takes no input, which is why it has no validation. Task 8 deletes it.

```ts
import { getDb } from '@/lib/db/client';
import { viewportPins } from '@/lib/db/queries';

// M0 spike only (spec §8.3): times the viewport query from the deployed Function.
// Takes no input; removed at the end of M0.
const DOWNTOWN = { west: -118.3, south: 34.03, east: -118.22, north: 34.1 };

async function GET() {
  try {
    const db = getDb();
    const started = performance.now();
    const pins = await viewportPins(db, DOWNTOWN, ['air', 'fire', 'heat']);
    const queryMs = Math.round(performance.now() - started);
    return Response.json({ queryMs, count: pins.length, region: process.env.VERCEL_REGION ?? 'local' });
  } catch (error) {
    console.error('viewport spike failed', error);
    return Response.json({ ok: false }, { status: 503 });
  }
}

export { GET };
```

- [x] **Step 8: Document the env vars**

Create `web/.env.example`:

```bash
# Turso Cloud database for the current data build (spec §8.1, §8.2). The token must be read-only.
TURSO_DATABASE_URL="libsql://<database>-<org>.turso.io"
TURSO_AUTH_TOKEN=
# The site's https:// origin; every absolute URL comes from here (spec §8.1).
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
```

(This step originally also added `NEXT_PUBLIC_TILE_KEY`. Task 7 removed it and left a comment in its place.)

Append to `web/.gitignore`, directly under the `.env*` line:

```
!.env.example
```

- [x] **Step 9: Verify the build works without any env vars**

Run in `web/`: `env -u TURSO_DATABASE_URL -u TURSO_AUTH_TOKEN -u NEXT_PUBLIC_SITE_URL pnpm build`
Expected: the build succeeds, and the route list shows `/api/health` and `/api/spike/viewport` as dynamic (`ƒ`), not static.

- [x] **Step 10: Run the full check and commit**

Run in `web/`: `pnpm test && pnpm typecheck && pnpm lint`
Expected: all pass.

```bash
git add web/src/lib/db/client.ts web/src/app/api web/tests/client.test.ts web/tests/health.test.ts \
  web/.env.example web/.gitignore
git commit -m "feat(web): add Turso client and /api/health"
```

---

### Task 5: Publish the spike database to Turso Cloud

This task is manual and needs your Turso account. Record every result in the findings doc, which you create in Step 1.

**Files:**
- Create: `docs/superpowers/spikes/2026-09-28-m0-findings.md`
- Create (not committed): `web/.env.local`
- Possibly modify (generated): `web/src/lib/db/generated/schema.ts`

**Interfaces:**
- Consumes: `data/sowhat-m0.db` (Task 1), the `db:pull` script (Task 2), both routes (Task 4).
- Produces: a Turso database `$TURSO_DB` in a known region, its `libsql://` URL, and a read-only token. Task 6 uses these.

- [x] **Step 1: Start the findings doc**

Create `docs/superpowers/spikes/2026-09-28-m0-findings.md`:

```markdown
# M0 deployment spike: findings

Spec: [§8.3](../specs/2026-09-27-so-what-design.md). Plan: [M0 plan](../plans/2026-09-28-m0-deployment-spike.md).

## Versions

| Package                         | Version    |
| ------------------------------- | ---------- |
| next                            | 16.3.6     |
| drizzle-orm / drizzle-kit       | 1.0.0-rc.4 |
| @tursodatabase/serverless       | 1.4.0      |
| @tursodatabase/database (tests) | 0.7.2      |
| vitest                          | 5.0.2      |
| turso CLI                       | v1.0.32    |

## Choices

- **Local test driver:** `drizzle-orm/tursodatabase/database` over `@tursodatabase/database`, opened with `await connect(':memory:')`. (The spec's `drizzle-orm/tursodatabase-database` path doesn't exist.)
- **Generated schema path:** `web/src/lib/db/generated/schema.ts` (the spec says `web/lib/db/schema.ts`).

## drizzle-kit pull quirks

- Writes `schema.ts`, `relations.ts` and a migration folder; the folder is gitignored.
- Inline CHECK constraints next to `--` comments, or spanning lines, come out garbled in `check(...)`. Harmless: no migrations.

## Turso

## Vercel

## Latency

## Tile provider
```

- [x] **Step 2: Pick the database's region**

Run: `turso auth whoami && turso group list`
Expected: your account, plus at least one group with its location. The best choice is `aws-us-west-2` (Oregon), the AWS region closest to LA, which maps to Vercel's `pdx1`. If the default group is somewhere else, try `turso group create sowhat --location aws-us-west-2`. If the free plan refuses a new group, keep the existing group and use its region in Task 6. Common mappings: `aws-us-west-2`→`pdx1`, `aws-us-east-1`→`iad1`, `aws-us-east-2`→`cle1`.

- [x] **Step 3: Import the spike database**

Run from the repo root: `turso db import --help`. Confirm the flag for choosing a group, then:

```bash
pipeline/build_m0.sh
turso db import data/sowhat-m0.db            # add --group <group> if you chose one in Step 2
turso db show "$TURSO_DB"
```
Expected: a database named `sowhat-m0`, named after the file (§8.2), with its URL and location printed. Note the location in the findings doc under **Turso**.

- [x] **Step 4: Mint a read-only token and smoke-test it over HTTP**

```bash
export TURSO_DATABASE_URL="$(turso db show "$TURSO_DB" --url)"
export TURSO_AUTH_TOKEN="$(turso db tokens create "$TURSO_DB" --read-only)"
HTTP_URL="${TURSO_DATABASE_URL/libsql:\/\//https://}"

curl -s "$HTTP_URL/v2/pipeline" -H "Authorization: Bearer $TURSO_AUTH_TOKEN" -H 'Content-Type: application/json' \
  -d '{"requests":[{"type":"execute","stmt":{"sql":"SELECT value FROM meta WHERE key = '\''row_count_places'\''"}},{"type":"close"}]}'

curl -s "$HTTP_URL/v2/pipeline" -H "Authorization: Bearer $TURSO_AUTH_TOKEN" -H 'Content-Type: application/json' \
  -d '{"requests":[{"type":"execute","stmt":{"sql":"DELETE FROM meta"}},{"type":"close"}]}'
```
Expected: the first response contains `"value":"6"`. The second contains an error (the token is read-only) and deletes nothing. **If the delete succeeds, stop.** The token isn't read-only, which breaks §9. Rebuild and re-import before going on. Record both results in the findings doc.

- [x] **Step 5: Verify `drizzle-kit pull` against Turso Cloud**

Run in `web/` (in the same shell, so the exports from Step 4 apply):
```bash
pnpm db:pull
git diff --stat -- src/lib/db/generated/
```
Expected: the pull succeeds, and `git diff` shows no change to `schema.ts` or `relations.ts`. The remote database introspects the same as the local file. If there is a diff, record it in the findings doc. If the diff is only in `check(...)` text, commit the remote version, since production reads from it.

- [x] **Step 6: Run the app locally against Turso Cloud**

Create `web/.env.local` (git ignores it). Use the real values from Step 4:

```bash
TURSO_DATABASE_URL=libsql://...
TURSO_AUTH_TOKEN=...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Run `pnpm dev` in `web/`. In another shell:
```bash
curl -s localhost:3000/api/health
curl -s localhost:3000/api/spike/viewport
```
Expected: `{"ok":true,"places":6}` and `{"queryMs":…,"count":4,"region":"local"}`. The count of 4 comes from vermont-sunset, echo-park, grand-park and main-1st. This shows `drizzle-orm@rc`, `@tursodatabase/serverless`, the `sql` template and multi-argument `max` all work against Turso Cloud (§8.3). If the client rejects the `libsql://` URL, change the scheme to `https://` in `.env.local` and record that in the findings doc.

- [x] **Step 7: Commit**

```bash
git add docs/superpowers/spikes/2026-09-28-m0-findings.md web/src/lib/db/generated
git commit -m "docs(spike): record Turso import and pull results"
```

---

### Task 6: Deploy to Vercel on the subdomain

This task is manual and uses the Vercel dashboard and your DNS provider.

**Files:**
- Create: `web/vercel.json`
- Modify: `docs/superpowers/spikes/2026-09-28-m0-findings.md`

**Interfaces:**
- Consumes: the database region, URL and token (Task 5); `NEXT_PUBLIC_SITE_URL` handling in `web/src/app/layout.tsx` (already committed in `fa3205d`).
- Produces: `https://$SITE_HOST` serving the app, with `/api/health` live.

- [x] **Step 1: Pin the Function region to the database's region**

Create `web/vercel.json`, using the region that matches the database's location from Task 5:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "regions": ["pdx1"]
}
```

Then commit and push:
```bash
git add web/vercel.json
git commit -m "chore(web): pin Vercel Functions region"
git push
```

- [x] **Step 2: Create the Vercel project**

Go to Vercel → Add New → Project, and import `narcisoignacio/so-what` from the GitHub account that owns it. Set **Root Directory** to `web`. The framework preset should say Next.js. Before the first deploy, add these Environment Variables:

| Name                   | Value                           | Environments        |
| ---------------------- | ------------------------------- | ------------------- |
| `TURSO_DATABASE_URL`   | the URL from Task 5             | Production, Preview |
| `TURSO_AUTH_TOKEN`     | the read-only token from Task 5 | Production, Preview |
| `NEXT_PUBLIC_SITE_URL` | `https://$SITE_HOST`            | Production          |

Deploy. If the build log fails because it can't find pnpm 12, add `ENABLE_EXPERIMENTAL_COREPACK=1` as an env var so Vercel uses the `packageManager` version from `package.json`, then redeploy. Record whether you needed this.

- [x] **Step 3: Attach the subdomain**

Go to Project → Settings → Domains, add `$SITE_HOST`, and copy the `CNAME` target Vercel shows. At your DNS provider, create the CNAME record for the subdomain. Then check CAA:

```bash
dig +short CAA "${SITE_HOST#*.}"
```
Expected: either no output, or a list that includes `letsencrypt.org`. If there are CAA records without `letsencrypt.org`, add `0 issue "letsencrypt.org"` (§8.1). Wait until Vercel shows the domain as valid and the certificate as issued.

- [x] **Step 4: Verify the site, the OG tags and health**

```bash
curl -sI "https://$SITE_HOST" | head -1
curl -s "https://$SITE_HOST" | grep -o '<meta property="og:[^>]*>'
curl -s "https://$SITE_HOST/api/health"
curl -s "https://$SITE_HOST/api/spike/viewport"
```
Expected:
- `HTTP/2 200`.
- `og:title`, `og:description`, `og:url` with content `https://$SITE_HOST` (possibly with a trailing `/`), and `og:image` with content that starts with `https://$SITE_HOST/opengraph-image`. No `localhost` or `vercel.app` host anywhere.
- `{"ok":true,"places":6}`.
- `"count":4` and `"region":"pdx1"` (or the region you chose).

Paste one real share of `https://$SITE_HOST` into a link-preview checker, or a private message to yourself, and confirm the image shows.

- [x] **Step 5: Measure viewport-query latency (spec §8.3)**

Throw away the first two calls as warm-up, then take 20 samples:

```bash
for i in 1 2; do curl -s "https://$SITE_HOST/api/spike/viewport" > /dev/null; done
for i in $(seq 20); do curl -s "https://$SITE_HOST/api/spike/viewport" | grep -o '"queryMs":[0-9]*' | cut -d: -f2; done | sort -n | tr '\n' ' '; echo
for i in $(seq 20); do curl -s -o /dev/null -w '%{time_total}\n' "https://$SITE_HOST/api/spike/viewport"; done | sort -n | tr '\n' ' '; echo
```
Expected: two sorted lists of 20 numbers each. The median is the average of the 10th and 11th values. Record the median and maximum of the database query time (`queryMs`, measured inside the Function) and of the full request (`time_total`, measured from your machine). Explain any outliers in the findings doc. If the median `queryMs` is well above a same-region round trip (tens of milliseconds), check that `region` matches the database's location before you accept the number.

- [x] **Step 6: Record and commit**

In the findings doc, fill in **Vercel** (project root, region, whether the corepack env var was needed, the domain and CAA result) and **Latency** (the numbers from Step 5, with the date).

```bash
git add docs/superpowers/spikes/2026-09-28-m0-findings.md
git commit -m "docs(spike): record deploy and latency results"
```

---

### Task 7: Choose the tile provider

This is a research and account task. No app code changes, since Leaflet arrives in M3.

**Files:**
- Modify: `docs/superpowers/spikes/2026-09-28-m0-findings.md`
- Modify: `web/.env.example` (remove `NEXT_PUBLIC_TILE_KEY`, leave a comment saying why)

**Interfaces:**
- Produces: a chosen provider (Stadia Maps), a raster XYZ tile URL template with no key in it, the required attribution text, and `$SITE_HOST` registered as a Stadia property. M3's `MapView.tsx` uses these.

- [x] **Step 1: Compare the three candidates against the spec's requirements**

Check the current pricing and terms pages for MapTiler, Stadia Maps and CARTO basemaps. Fill in this table in the findings doc under **Tile provider**, with a link to each page you read:

| Requirement (spec)                                                                                     | MapTiler | Stadia | CARTO |
| ------------------------------------------------------------------------------------------------------ | -------- | ------ | ----- |
| Free tier allows non-commercial public use (§8.1)                                                      |          |        |       |
| Monthly free allowance vs demo traffic                                                                 |          |        |       |
| Key or auth can be restricted to `$SITE_HOST`, `*-<vercel-team>.vercel.app` and `localhost` (§7.4, §9) |          |        |       |
| Raster XYZ tiles usable from Leaflet                                                                   |          |        |       |
| Light and dark styles for pin contrast checks (§11)                                                    |          |        |       |
| Required attribution text                                                                              |          |        |       |

Pick the provider that meets every row. If none can restrict a key to domains, record that, and pick the one whose unrestricted use is allowed by its terms.

- [x] **Step 2: Register the domain (no API key)**

Stadia Maps API keys can't be restricted to domains, so a key in a `NEXT_PUBLIC_*` variable would be usable by anyone who reads the bundle. Use [domain-based authentication](https://docs.stadiamaps.com/authentication/#domain-based-authentication) instead:
- In the Stadia dashboard, add a property for `$SITE_HOST`. Requests from that origin need no key.
- `localhost` and `127.0.0.1` need no auth, so local dev works as-is.
- Vercel preview deployments (`*.vercel.app`) can't be registered, and a property allows only one domain. Previews load without base-map tiles. Accepted for now; record it under open questions.

Don't set `NEXT_PUBLIC_TILE_KEY` in Vercel or `.env.local`. Remove it from `web/.env.example` and leave a comment in its place.

- [x] **Step 3: Verify the restriction**

Fill in the provider's tile URL template for tile `z=10, x=175, y=408`, which covers downtown LA, then run:

```bash
TILE_URL='<template with z=10, x=175, y=408, no api_key>'
curl -s -o /dev/null -D - -H "Referer: https://$SITE_HOST/" -H "Origin: https://$SITE_HOST" "$TILE_URL" | grep -iE '^HTTP|stadia-property'
curl -s -o /dev/null -w '%{http_code}\n' -H 'Referer: https://sowhat-unregistered.invalid/' -H 'Origin: https://sowhat-unregistered.invalid' "$TILE_URL"
```
Expected: `200` for your host, with a `stadia-property` header that matches your property's ID in the dashboard. The second call should be refused (`401` or `403`). Don't test with `example.com`: another Stadia customer has registered it, so it returns `200` (billed to property 12196). If the provider only enforces restrictions in browsers, record that the second call succeeded from curl. Domain auth trusts the `Referer`/`Origin` headers, so anyone can spoof them from curl; that's the provider's model, not a leak.

- [x] **Step 4: Commit**

```bash
git add docs/superpowers/spikes/2026-09-28-m0-findings.md web/.env.example docs/superpowers/plans/2026-09-28-m0-deployment-spike.md
git commit -m "docs(spike): choose tile provider"
```

---

### Task 8: Close out M0 — spec corrections and cleanup

**Files:**
- Delete: `web/src/app/api/spike/viewport/route.ts`
- Modify: `docs/superpowers/specs/2026-09-27-so-what-design.md` (rev. 13)
- Modify: `docs/superpowers/spikes/2026-09-28-m0-findings.md`

**Interfaces:**
- Consumes: every finding from Tasks 2 and 5–7.
- Produces: a spec that matches reality, so M1 and later start from correct paths and choices.

- [x] **Step 1: Remove the latency probe**

The latency numbers are recorded, and the route adds a public endpoint that costs row reads. Git history keeps it if M3 needs to measure again.

```bash
git rm web/src/app/api/spike/viewport/route.ts
```
Run in `web/`: `pnpm test && pnpm typecheck && pnpm lint && pnpm build`
Expected: all pass, and the build's route list no longer includes `/api/spike/viewport`.

- [x] **Step 2: Update the spec to rev. 13**

Make these edits in `docs/superpowers/specs/2026-09-27-so-what-design.md`:
- **Header:** add `Rev. 13: M0 findings — src/ layout, generated schema path, local test driver, tile provider, function region.` to the start of the revision notes.
- **§4 and §7.1:** show `web/src/app/…` and `web/src/lib/…` instead of `web/app/…` and `web/lib/…`. Change `lib/db/schema.ts` to `src/lib/db/generated/schema.ts`, and note that `drizzle-kit pull` also writes `relations.ts` and a gitignored migration folder there. Tests stay at `web/tests/`.
- **§7.2:** add a line saying `drizzle-kit pull` garbles some inline `CHECK` constraints, that this is harmless because there are no migrations, and that the file is still never hand-edited.
- **§8.1:** name the chosen Vercel Functions region and Turso location.
- **§7.4 "Map tiles":** replace "chosen in M0" with the chosen provider and its attribution. Replace "key in an env var, domain-restricted to …" with Stadia's domain-based auth for the production domain, no auth needed on localhost, and no tiles on Vercel previews.
- **§8.1 "Env vars":** remove `NEXT_PUBLIC_TILE_KEY`.
- **§9:** replace "Tile key restricted to the production domain, the project's Vercel preview domains, and localhost" with "No tile key ships to the browser; tiles are authorized by domain (production) and are open on localhost."
- **§11:** change `drizzle-orm/tursodatabase-database` to `drizzle-orm/tursodatabase/database`, and "Chosen in M0" to "Chosen in M0: the embedded engine, opened with `connect(':memory:')`".

- [x] **Step 3: Finish the findings doc**

Add a short **Open questions for later milestones** section. List anything M0 left unresolved, such as a region mismatch you accepted, latency outliers, or a key restriction that's only enforced in browsers. If there are none, say so.

- [x] **Step 4: Commit and push**

```bash
git add docs/superpowers/specs/2026-09-27-so-what-design.md docs/superpowers/spikes/2026-09-28-m0-findings.md
git commit -m "docs(spec): record M0 findings as rev. 13"
git push
```

After the push deploys, check that `https://$SITE_HOST/api/spike/viewport` returns 404 and `https://$SITE_HOST/api/health` still returns `{"ok":true,"places":6}`.

---

## M0 exit checklist (spec §8.3)

- [ ] Hello-world Next.js app on Vercel, on the subdomain, over HTTPS (Task 6)
- [ ] `NEXT_PUBLIC_SITE_URL` set, and an OG tag uses it (Task 6, Step 4)
- [ ] A tiny Turso database, created via `turso db import`, with a `places` table and the cell index (Tasks 1, 5)
- [ ] Read through Drizzle, and `/api/health` works (Tasks 4–6)
- [ ] `drizzle-orm@rc` + `@tursodatabase/serverless` against Turso Cloud, including the `sql` template and multi-argument `max` (Task 5, Step 6)
- [ ] `drizzle-kit@rc pull` introspects the imported database (Task 5, Step 5)
- [ ] The same queries run in Vitest over a local driver (Tasks 2–4)
- [ ] Viewport-query latency measured with the Function and the database in the same region (Task 6, Step 5)
- [ ] Tile provider chosen (Task 7)
