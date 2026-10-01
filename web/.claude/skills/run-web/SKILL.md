---
name: run-web
description: Build, start, run, and drive the So What? Next.js web app (web/). Use when asked to start or run the app or dev server, take a screenshot of a page, check a page's Open Graph/share metadata, hit /api/health, interact with the running site in a headless browser, or run its unit/e2e tests.
---

The So What? web app is a Next.js 16 app in `web/`. Start the dev server in the background, then drive it with `.claude/skills/run-web/driver.mjs`. That's a small headless-Chromium script that reads commands from a heredoc, built on the project's own `@playwright/test`. For work inside the database query code, Vitest is the direct path (see Test).

All paths below are relative to `web/`. Verified on macOS (Darwin, arm64) with Node 24.20 and pnpm 12.6.

## Prerequisites

- Node 24 and pnpm 12 (`packageManager` in `package.json` pins `pnpm@12.6.0`).
- `.env.local` with `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN` and `NEXT_PUBLIC_SITE_URL` (template: `.env.example`). Without valid Turso credentials, pages still render but `/api/health` returns 503.

## Setup

```bash
pnpm install
pnpm exec playwright install chromium
```

## Run (agent path)

Start the dev server and wait until it answers. macOS has no `timeout` command, so poll in a loop:

```bash
(node_modules/.bin/next dev --port 3000 > /tmp/so-what-web.log 2>&1 &)
for i in $(seq 60); do curl -sf -o /dev/null http://localhost:3000 && break; sleep 0.5; done
```

Drive it. One command per line; the run stops at the first failing command and exits 1:

```bash
node .claude/skills/run-web/driver.mjs <<'EOF'
nav /
wait-for role=heading[level=1]
text role=heading[level=1]
meta
screenshot start
viewport 320 640
screenshot start-320
nav /api/health
text body
console-errors
EOF
```

Screenshots go to `test-results/run-web/<name>.png` (gitignored). Set `SHOTS=<dir>` to change that, or `BASE_URL=<url>` to drive another server. **Open the screenshot and look at it** before claiming a page works.

| command | what it does |
|---|---|
| `nav <path-or-url>` | Go to a page; prints the HTTP status. Paths resolve against `BASE_URL`. |
| `wait-for <selector>` | Wait up to 30s. CSS, `text=…` and `role=…[…]` selectors all work. |
| `click <selector>` / `fill <selector> <text>` / `press <key>` | Interact. `fill`'s selector can't contain spaces. |
| `viewport <w> <h>` | Resize. The default is 1280×800; use `320 640` for the spec's narrowest layout. |
| `screenshot [name]` / `screenshot-el <selector> [name]` | Full page, or one element. |
| `text <selector>` | Print an element's text (`text body` shows a JSON route's response). |
| `meta` | Print the title, the description, and every `og:`/`twitter:` tag. |
| `eval <js>` | Evaluate an expression in the page and print its JSON value. |
| `console-errors` | Fail if the page logged errors. End every run with it. |

Stop the server by killing whatever listens on the port:

```bash
lsof -ti:3000 -sTCP:LISTEN | xargs kill
```

## Run (human path)

`pnpm dev`, open http://localhost:3000, and stop it with Ctrl-C.

## Test

```bash
pnpm test                         # Vitest: 22 tests, about 1s, local fixture db, no network
pnpm test tests/queries.test.ts   # one file: the direct path for query and geo changes
pnpm test:e2e                     # Playwright, e2e/*.spec.ts; starts its own server
pnpm lint
pnpm typecheck                    # run `pnpm build` first if it reports a missing route (Troubleshooting)
```

`pnpm test:e2e` reuses a server that's already on port 3000. Otherwise it starts one and stops it afterwards.

## Gotchas

- **Health with bad credentials looks like an outage.** `/api/health` returns 503 `{"ok":false}`, and the real cause appears only in `/tmp/so-what-web.log` (`DatabaseError: HTTP error! status: 400` for a bad token). Variables set in the process override `.env.local`, so `TURSO_AUTH_TOKEN=invalid node_modules/.bin/next dev …` reproduces it without touching the file.
- **The production database currently holds the M0 spike data.** `/api/health` reports `"places":6`, not a real build.
- **In dev, `og:url` and `og:image` disagree.** `og:url` comes from `NEXT_PUBLIC_SITE_URL` (the production domain in `.env.local`), but Next points `og:image` at `http://localhost:3000/opengraph-image.png?…`. That's expected in dev; don't "fix" it.
- **Start the server with `node_modules/.bin/next dev`, not `pnpm dev`, whenever something else has to stop it.** pnpm doesn't pass on SIGTERM. That's why `playwright.config.ts` launches the binary directly: under `pnpm dev`, Playwright's teardown timed out after 120s and left the server running.
- **Don't use `pkill -f "next dev"` broadly.** Kill by port (above) instead.

## Troubleshooting

- **`FAILED: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/`**: the dev server isn't running. Start it and poll, as in Run (agent path).
- **`pnpm typecheck` fails with `.next/types/validator.ts: Cannot find module '../../src/app/api/spike/viewport/route.js'`**: a stale generated type file from a build made before the spike route was removed (commit `8544dd3`). Running `next dev` doesn't regenerate it; `pnpm build` does, and typecheck then passes.
- **`Timed out waiting 120s for the teardown for plugin setup to run`** from `pnpm test:e2e`: `webServer.command` was `pnpm dev`. Use the binary, as the config now does.
