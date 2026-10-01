#!/usr/bin/env node
// Headless-Chromium driver for the So What? web app.
// Reads one command per line from stdin (pipe a heredoc), runs them in order
// against a single page, and stops at the first failing command (exit 1).
//
//   node .claude/skills/run-web/driver.mjs <<'EOF'
//   nav /
//   wait-for role=heading[level=1]
//   screenshot start
//   console-errors
//   EOF
//
// Env: BASE_URL (default http://localhost:3000), SHOTS (default test-results/run-web).
// Uses the Chromium that `pnpm exec playwright install chromium` downloads.
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { createInterface } from 'node:readline';
import { chromium } from '@playwright/test';

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000';
const SHOTS = resolve(process.env.SHOTS ?? 'test-results/run-web');
mkdirSync(SHOTS, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page = await context.newPage();
const consoleErrors = [];
page.on('console', (m) => m.type() === 'error' && consoleErrors.push(m.text()));
page.on('pageerror', (e) => consoleErrors.push(e.message));

// "text=Foo" and "role=heading[level=1]" are Playwright selector engines,
// so plain page.locator() covers CSS, text and role selectors alike.
const loc = (sel) => page.locator(sel).first();
const shotPath = (name) => resolve(SHOTS, `${name || `shot-${Date.now()}`}.png`);
const split = (rest) => {
  const i = rest.indexOf(' ');
  return i === -1 ? [rest, ''] : [rest.slice(0, i), rest.slice(i + 1)];
};

const commands = {
  // nav <path-or-url>: relative paths resolve against BASE_URL; prints the HTTP status.
  async nav(arg) {
    const res = await page.goto(new URL(arg || '/', BASE_URL).href, { waitUntil: 'load' });
    console.log(`status ${res?.status()} ${page.url()}`);
  },
  // wait-for <selector>: waits up to 30s (first dev-mode compile can be slow).
  async 'wait-for'(arg) {
    await loc(arg).waitFor({ timeout: 30_000 });
    console.log(`found ${arg}`);
  },
  async click(arg) { await loc(arg).click(); },
  // fill <selector> <text>: selector must not contain spaces.
  async fill(rest) { const [sel, text] = split(rest); await loc(sel).fill(text); },
  async press(arg) { await page.keyboard.press(arg); },
  // viewport <width> <height>
  async viewport(rest) { const [w, h] = rest.split(/\s+/).map(Number); await page.setViewportSize({ width: w, height: h }); },
  // screenshot [name]: full page.
  async screenshot(arg) { const p = shotPath(arg); await page.screenshot({ path: p, fullPage: true }); console.log(`saved ${p}`); },
  // screenshot-el <selector> [name]: one element.
  async 'screenshot-el'(rest) { const [sel, name] = split(rest); const p = shotPath(name); await loc(sel).screenshot({ path: p }); console.log(`saved ${p}`); },
  // text <selector>: prints the element's text.
  async text(arg) { console.log(await loc(arg).innerText()); },
  // meta: prints <title>, description and every og:/twitter: tag, for share-preview work.
  async meta() {
    const rows = await page.evaluate(() => [
      ['title', document.title],
      ...[...document.querySelectorAll('meta[name="description"], meta[property^="og:"], meta[name^="twitter:"]')]
        .map((m) => [m.getAttribute('property') ?? m.getAttribute('name'), m.getAttribute('content')]),
    ]);
    for (const [k, v] of rows) console.log(`${k}: ${v}`);
  },
  // eval <js>: evaluates an expression in the page and prints the JSON result.
  async eval(arg) { console.log(JSON.stringify(await page.evaluate(arg))); },
  // console-errors: prints errors seen so far; fails the run if there are any.
  async 'console-errors'() {
    if (consoleErrors.length) throw new Error(`console errors:\n${consoleErrors.join('\n')}`);
    console.log('no console errors');
  },
};

let failed = false;
for await (const raw of createInterface({ input: process.stdin })) {
  const line = raw.trim();
  if (!line || line.startsWith('#')) continue;
  const [name, rest] = split(line);
  const run = commands[name];
  console.log(`> ${line}`);
  try {
    if (!run) throw new Error(`unknown command "${name}" (known: ${Object.keys(commands).join(', ')})`);
    await run(rest.trim());
  } catch (error) {
    console.error(`FAILED: ${error.message.split('\n').slice(0, 6).join('\n')}`);
    failed = true;
    break;
  }
}
await browser.close();
process.exit(failed ? 1 : 0);
