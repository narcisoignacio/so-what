# So What? — Accessibility Review

**Date:** 2026-09-28
**Reviewed:** [design spec](../superpowers/specs/2026-09-27-so-what-design.md) rev. 7, [voice and templates](../content/2026-09-28-so-what-voice-and-templates.md), [grader's first 30 seconds](../journeys/2026-09-28-grader-first-30-seconds.md)
**Target:** WCAG 2.2 AA as the minimum bar, plus inclusive-design practice beyond it.
**Status:** Applied to spec rev. 8 (§1, §2, §6.4, §7.1, §7.3–7.5, §11, §12, §14, §15), the journey (§4.2–4.3) and the voice doc (§8 labels). Nothing is built yet, so every fix here is a design decision, not a retrofit.

---

## Summary

The copy is already in good shape for accessibility: plain language, meaningful link text, text labels for levels. The structure is not. **The map is the only way to find a place**, and a map of up to 1,000 pins can't be used with a keyboard or screen reader in any practical way. The central recommendation is a **"Places near here" list**: an ordinary list of links, built on the nearest-neighbor search the spec already has, so every task can be done without the map.

That list isn't only for assistive-technology users. It helps anyone on a phone, anyone zoomed in to 400%, and anyone who just wants "what's near me?" without panning. The same idea as curb cuts: built for some, used by everyone.

| Priority | Count | Theme |
|---|---|---|
| P0: blocks access | 2 | No non-map way to find places; pins as 1,000 tab stops |
| P1: severely degrades | 6 | Level buried in reading order, colour-only pins, focus on navigation, reflow on phones, announcements, video without a text alternative |
| P2: fails a criterion or best practice | 6 | Motion, form details, filter semantics, OG image alt text, page titles, units |

---

## P0 — Blocks access

### P0-1. The map is the only way to find and select a place

**Who it blocks:** screen-reader users (all of them), keyboard-only users in practice, and people using voice control or switch access.

**Why:** today, every route to a place except "Show me an example" and a shared URL goes through the map. You pan, zoom, then click a pin. A screen reader can't perceive a map's spatial layout, and the zip search only moves the map. At county zoom the API returns clusters, which have no names at all.

**Fix: a "Places near here" list, as a first-class part of the layout.**
- An ordered list (`<ol>`) of the **N nearest visible places** (default 20) to a point: the user's location, the zip's centre, or the map's centre after it settles. Each item is a link to `/places/[slug]`, reading for example "Vermont / Sunset — bus stop — Heat: High, Air: Elevated — 0.3 miles."
- It respects the risk filters, like pins do.
- **Backend:** generalize §6.4 from "nearest" to "N nearest". The ring search stops once it has N candidates and the N-th best distance is ≤ k · S_MIN, which uses the same lower-bound proof. It works at every zoom level, so clusters don't matter.
- One more benefit: this is a good piece of CS for the README.
- `/api/places/nearest` gains a `limit` parameter (default 1, max 50). Queries stay cheap: a few boxes of grid cells.
- The entry flow (§7.4) fills the list: location, zip or example each move the map **and** refresh the list. The empty-viewport message becomes the list's empty state ("No flagged places in view. Nearest is …").
- The place page also shows "Nearby places" (5 items), so users can move between places without the map.

**Acceptance test:** with the map hidden, a user can go from the start page to reading a place's heat card using only the keyboard, and again using only VoiceOver.

### P0-2. Leaflet markers become one tab stop each

**Why:** Leaflet markers are keyboard-focusable by default (`keyboard: true`). A viewport of 1,000 pins means up to 1,000 Tab presses to get past the map, in an order unrelated to geography. That's effectively a keyboard trap.

**Fix:**
- Markers get `keyboard: false`, and the pin layer is hidden from assistive technology. The list (P0-1) is the keyboard and screen-reader path to each place.
- The map container is **one** tab stop, with a visible label: "Map. Use arrow keys to pan and + / − to zoom." Leaflet's built-in arrow-key panning and +/− zoom work once it has focus.
- **Keep the map and list in sync:** focusing or hovering a list item highlights its pin, so sighted keyboard users can see where a place is. Clicking a pin still works for mouse and touch users.
- Cluster markers aren't focusable either. At county zoom, keyboard users zoom with +/− or use the list.

---

## P1 — Severely degrades the experience

### P1-1. The level is buried at the end of each card for screen-reader users

**Why:** §7.4 puts the level fourth on the card, after the So What? sentence, the trend and the detail. A screen-reader user moving through four cards hears about 60 words per card before learning whether the risk is High or Low. Screen-reader users mostly navigate by headings, and the cards have none yet.

**Fix: give each card a heading that includes the level.**
- The panel is `<h1>{place name}</h1>` with the kind below it. Each card is a `<section>` with `<h2>Heat — High</h2>`, or for sea level rise `<h2>Sea level rise — Projected</h2>`. A screen-reader user can then scan all four cards in four keystrokes.
- **Visual prominence doesn't change.** The level shows as a small badge in the card's header row. The So What? sentence is still the largest text, so the consequence-first idea (spec rev. 5) holds.
- **This does change the §7.4 order.** The level moves from item 4 to the card header, in the DOM and visually.
- New DOM order: heading (risk + level) → So What? → trend line → detail → source → tip.
- The trend line's "Projected" label must come **before** its sentence in the DOM ("Projected: And it's getting hotter …"). If it were only a visual badge, a screen reader would read the projection as today's fact.
- The collapsed "Not flagged today for air, heat or wildfire" line is a `<button aria-expanded>` that reveals the three `low` cards.

### P1-2. Pins and clusters are encoded by colour, and projected pins by outline only

**Why:** §7.4 says pins don't rely on colour alone, but doesn't say what else encodes the level. About 8% of men have a colour vision deficiency. A thin outline on a busy basemap can fall below the 3:1 contrast that graphics need (WCAG 1.4.11).

**Fix:**
- **Level:** a colour **and** a count glyph inside the pin. For example, 1, 2 or 3 bars for elevated, high and severe, or the letters E/H/S. Use a palette that stays distinguishable under the common colour-vision deficiencies, sequential rather than red/green. Validate it in a CVD simulator.
- **Halo:** every pin and cluster gets a 2px white halo plus a dark outline, so it meets 3:1 against light and dark tiles alike.
- **Projected (sea-only):** a **dashed** outline with a wave glyph. The pattern and the glyph carry the meaning, so it doesn't depend on colour or line weight. A place with both today's findings and sea level rise gets the same wave glyph as a small badge.
- **Legend:** always available as text, not just colour swatches. List each symbol with its meaning and one line defining the levels. It's reachable by keyboard and appears on the About page.

### P1-3. Focus is lost when the panel swaps on navigation

**Why:** the map persists across navigation and the panel swaps client-side (§7.4). Without focus management, keyboard focus stays on the clicked link or falls back to `<body>`. A screen-reader user gets no indication the content changed beyond the route announcement.

**Fix:**
- After navigating to `/places/[slug]`, move focus to the panel's `<h1>`, with `tabindex="-1"` so it can receive focus programmatically. Next.js also announces route changes from the page title, so give each place page a real `<title>` (P2-5).
- "Back to list" returns focus to the list item that opened the place.
- Nothing moves focus on its own except navigation the user started. Map moves, filter changes and list refreshes never move focus.

### P1-4. On phones and at 400% zoom, a side-by-side map and panel won't reflow

**Why:** WCAG 1.4.10 requires content to fit at a width of 320 CSS pixels without scrolling in two directions. A map beside a panel can't do that, and the usual fix on phones, a draggable bottom sheet, relies on a drag gesture (WCAG 2.5.7 requires a single-pointer alternative) and hides content.

**Fix: at narrow widths, list first.**
- The list, or the place panel, is the main view in normal document flow. A "Show map" / "Show list" toggle swaps views. It's a real button with `aria-pressed`, and it keeps state in the URL.
- No drag-only bottom sheet. If a sheet is used, it needs a button that expands and collapses it.
- This fits the actual audience: people looking up a bus stop are usually on a phone.

### P1-5. Dynamic changes are silent

**Why:** several things change without a page load: the filter results, the geolocation fallback, zip errors, and the list after the map moves. A screen-reader user isn't told about any of them.

**Fix:** one polite live region (`aria-live="polite"`) in the layout, with short messages:

| Event | Announcement |
|---|---|
| Filter changed | "Showing 214 places for heat and air." |
| List refreshed after an entry action | "20 places near 90012." (Not on every map pan: too noisy.) |
| Geolocation denied, timed out, or outside LA County | "Location unavailable. Showing an example: {place}." |
| Zip not in LA County | Shown under the input and linked with `aria-describedby`, and announced once. |
| Data unavailable (503) | "Place data isn't loading right now. Try again in a few minutes." |

Use `assertive` for nothing. Nothing here is urgent enough to interrupt the user.

### P1-6. The demo video has no text alternative

**Why:** WCAG 1.2.2 requires captions and 1.2.5 requires audio description for prerecorded video. Beat 2's voice-over says "Climate data usually looks like this," and a blind viewer can't see what "this" is. Beat 5's place count appears only on screen.

**Fix:**
- **Captions:** upload an accurate caption file (`.srt`) to YouTube. Don't rely on auto-captions.
- **Drop the burned-in captions from the journey (§4.3).** The card already shows the full sentence on screen for sound-off viewers. Burned-in text plus YouTube captions puts two sets of text on the screen when captions are on.
- **Descriptive transcript:** put a short transcript in the YouTube description and the README, including what's on screen ("On screen: a census tract ID and a percentile, 94th"). This is the proportionate route to 1.2.5 for a 3-minute video. It avoids redubbing the voice-over, which has no spare time.
- **Visuals:** no flashing (nothing more than 3 flashes a second). Text on screen needs 4.5:1 contrast. The dimmed map behind the title card must not lower the card text's contrast.

---

## P2 — Fails a criterion or best practice

| # | Issue | Fix |
|---|---|---|
| P2-1 | `flyTo` animations, cluster transitions and the video's zoom-out ignore motion preferences. | Respect `prefers-reduced-motion`: use `setView` with no animation. |
| P2-2 | Zip search details aren't specified. | Visible `<label>` "Zip code". `inputmode="numeric"`, `autocomplete="postal-code"`. Errors under the field with `aria-invalid` and `aria-describedby`. The submit button reads "Search". |
| P2-3 | Risk filters are unspecified controls. | Native checkboxes in a `<fieldset>` with `<legend>Show risks</legend>`. The labels are the risk names, and the sea label says "(projected)". |
| P2-4 | OG images carry the place name and top risk, but have no text alternative. | Add `og:image:alt` and `twitter:image:alt` with the same text, e.g. "Vermont / Sunset bus stop — Heat: High." |
| P2-5 | Page titles aren't specified. | `<title>{place name} ({kind}) — So What?`. The start page is "So What? — Climate risk at LA County places". This is also what Next.js announces on navigation. |
| P2-6 | "1.4 mi" is read aloud as "one point four M-I" by some screen readers. | Write "1.4 miles" in the list and messages. |

Also required, and cheap if planned now:
- `lang="en"` on `<html>`.
- A "Skip to main content" link.
- Landmarks: `header`, `nav` for filters, `main` for panel and list, a labelled `region` for the map.
- Visible focus rings with 3:1 contrast.
- Touch targets ≥ 24px, and 44px for primary buttons.
- Base text ≥ 16px.
- The tile attribution links must stay reachable.

---

## Screen-reader flow for the place page (target)

1. Skip link → `main`
2. `h1` Vermont / Sunset · "Bus stop" · "0.3 miles from your location" (if known)
3. `h2` Heat — High → So What? → "Projected:" trend → detail → source → tip link "Find a cooling center (LA County)"
4. `h2` Air — Elevated → …
5. `button` "Not flagged today for wildfire" (collapsed)
6. `h2` Sea level rise — Projected → … (coastal places only)
7. `h2` Nearby places → `ol` of 5 links
8. Map region (one tab stop, can be skipped)

## Keyboard map

| Area | Keys |
|---|---|
| Skip link → main | Tab, Enter |
| Filters | Tab to the fieldset; Space toggles each checkbox |
| Zip search | Type, Enter |
| Places list | Tab through the links (N ≤ 20); Enter opens a place |
| Map | One Tab stop; arrow keys pan; + / − zoom. Pins are not focusable. |
| List / map toggle (narrow widths) | Enter or Space |
| Collapsed "not flagged" line | Enter or Space expands it |

No focus traps. There are no modal dialogs in the design, and none should be added without Escape-to-close and focus return.

---

## Testing (proposed additions to spec §11)

- **Automated:** `@axe-core/playwright` scan of the start page, a place page (with and without sea level rise), the About page and the not-found page. Any violation fails the test.
- **Manual, before M8:** complete three tasks with keyboard only, and again with VoiceOver on macOS and on iOS Safari:
  1. Open the featured example and hear its heat level and trend.
  2. Search zip 90012 and open the second place in the list.
  3. Turn off air and wildfire, and confirm the announced count changes.
- **Zoom and reflow:** 200% and 400%, and a 320px-wide viewport. No horizontal scrolling. The list/map toggle works.
- **Colour:** run the pin palette and legend through a CVD simulator, and check 3:1 contrast for pins against both light and dark tiles.
- **Motion:** with "Reduce motion" turned on in the OS, there are no fly or zoom animations.

---

## What this review doesn't cover

- **Language access.** A large share of LA County residents speak Spanish at home. An English-only site is a real barrier, and it isn't an accessibility criterion as such. It belongs in spec §2 "Out of scope" and in the limitations, as a deliberate decision.
- **Research with disabled users.** The manual tests above are the author's own checks. Testing with actual screen-reader users would be stronger, but is likely out of scope for CS50.
- **Visual design.** The final palette, type scale and spacing must meet the constraints above, but choosing them isn't part of this review.
