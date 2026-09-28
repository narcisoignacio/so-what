# So What? — States and Edge Cases

**Date:** 2026-09-28 (against spec rev. 9)
**Status:** Applied to spec rev. 10 (§4, §5.2, §5.6, §6.2, §6.4, §7.1, §7.4–7.6, §8.2, §9, §10, §11, §12), with every recommendation in §6 accepted as written.
**Related:** [design spec](../superpowers/specs/2026-09-27-so-what-design.md) §6 (queries), §7.4 (behavior), §7.5 (accessibility), §10.1 (runtime errors) · [voice and templates](../content/2026-09-28-so-what-voice-and-templates.md) §10 (the copy for every message here) · [accessibility review](../accessibility/2026-09-28-so-what-accessibility-review.md)

The spec designs the happy path carefully and lists failures in §10.1 as server behavior: a status code for each case. This document covers what the **person** sees in each of those cases, and in the states the spec doesn't list at all. Each finding says what happens today under the spec, what should happen, and how much it matters.

Nothing is built yet, so every fix here is a spec change, not a retrofit. Most are small.

**Priorities:**

| Priority | Meaning |
|---|---|
| **P0** | A normal action produces a wrong result or an error. |
| **P1** | The user is stuck, misled, or loses their place; or a spec promise (such as returning focus to the item that opened a place) can't be kept. |
| **P2** | Missing feedback or unclear wording that costs trust. |
| **P3** | Polish. |

---

## 1. The findings that matter most

Two of these are bugs in the current query design, not missing polish.

1. **P0 — Unchecking every risk filter shows every place.** The visibility clause in §6.2 is built from the selected types: the `max(...)` part is "omitted if no today type is selected" and the `sea_flag` part is "included only if 'sea' is selected." With nothing selected, both parts are omitted, the `WHERE` clause has no visibility filter, and every place in view comes back, including thousands of `low` ones drawn as pins. The spec's own empty message ("No places match these filters") can never appear.
   **Fix:** zero selected types is its own case. The API returns an empty result without querying, and the list shows "No risk types selected." The URL represents it explicitly (`?types=none`), because a missing `types` parameter means the default (all four).

2. **P0 — Zooming out past the county returns an error.** §10.1 says a `bbox` "larger than LA County" gets a 400. On a wide monitor, zooming out one or two steps from county view produces exactly that bbox, so an ordinary zoom turns into an error.
   **Fix:** the server **clips** the bbox to the county's bounds instead of rejecting it; 400 stays for malformed input only. The map also gets `maxBounds` (with some give) and a `minZoom`, so people can't drift far from the data.

3. **P1 — The open place can vanish from the map.** A place page centres the map on its place, but pins only show for places that are visible under the current filters. Two common cases leave the map centred on nothing:
   - the user turns off the filter that made the place visible (the panel still shows the place, but its pin disappears);
   - a share link opens a place with nothing flagged, which is never visible (§5.3). This happens when a rebuild lowers a place's levels, because `published_slugs.txt` keeps its URL alive.

   **Fix:** the open place always gets a **selected marker**, drawn regardless of filters and visibility, in a style distinct from level pins. Also state in §7.4 that filters apply to the map and lists, never to the panel: the panel always shows all of a place's risks.

4. **P1 — Opening a place from the list can destroy the list item that opened it.** List items can lie outside the current view (§7.4, panning). Opening one has to move the map to the place. That move ends with the map settling, which triggers a list refresh (§7.4), which reorders the list around the new centre. The item that opened the place may no longer be in it, so "the back link returns focus to the item that opened the place" (§7.5) can't be kept.
   **Fix:** map moves caused by the app (opening a place, an entry action's fly-to) don't refresh the list; only moves the user makes do. The back link restores the list as it was when the place was opened. If the item is gone anyway, focus goes to the list's heading.

5. **P1 — The spec doesn't say what the first screen shows.** §7.4 defines the start panel's three actions but not the map's initial view, or what "Places near here" holds before any action. The default near-to point would be the map's centre. LA County's geographic centre is in the Angeles National Forest, so the first list a grader sees would be places near a mountain road. See decision D1 (§6).

6. **P1 — "Inside LA County" has no definition in the app.** The geolocation flow branches on it (§7.4), but the app has no county outline: the pipeline clips to the boundary, and the database only holds zip bounds. A bounding box alone would count most of the Pacific between the mainland and Catalina as "inside." See decision D2.

---

## 2. State inventory

Each surface against the states it can be in. "—" means the state can't occur. **Bold** rows are new or changed relative to the spec. The exact wording of every message is in voice doc §10.

### 2.1 Start panel and entry actions

| State | What the user sees | What they can do | Recovery / next |
|---|---|---|---|
| Default | Three actions: Use my location · Zip code field + Search · Show me an example | Any of the three | — |
| **Locating** | "Use my location" reads "Finding your location…", `aria-busy` | Zip search and example stay enabled | If the user starts another action, a late location result is **ignored**: it never moves the map away from what they chose. |
| **Waiting on the permission prompt** | Same as Locating | Same | `getCurrentPosition`'s `timeout` only starts counting once permission is granted, so an ignored prompt waits forever. The app adds its own 15-second limit covering the prompt, after which it runs the "timed out" fallback. |
| Location denied | Fallback message (denied variant), map flies to the featured place | Zip search | Message says location is off, not that they're outside LA. |
| Location timed out / unavailable | Fallback message (unavailable variant), fly to featured place | Zip search, retry location | — |
| Outside LA County | Fallback message (outside variant), fly to featured place | Zip search | — |
| **Location blocked in browser settings** | The button's hint says location is blocked (via the Permissions API, where supported) | Zip search, example | Avoids a button that fails instantly every time. P3. |
| Zip: empty submit | Inline error under the field | Type a zip | Error clears on input. |
| **Zip: wrong format** | Inline error | Fix it | Validated in the browser, so malformed input never reaches the API. Accept and trim `90012-1234` and surrounding spaces. |
| Zip: not found | Inline error | Try another zip, or use location | Wording covers PO-box-only LA zips too (they have no ZCTA), and drops "(yet)", which promises coverage outside LA that §2 rules out. |
| **Zip: service unavailable** | Inline error | Retry; example still works (D5) | Not "that zip isn't in LA." |
| Entry succeeds, places in view | Map moves; list refreshes; announcement | — | — |
| Entry succeeds, **nothing flagged in view** | Message naming the nearest flagged place; map flies there | — | Variants for location vs. zip, and for sea-only filters (§3.2). |
| **Entry succeeds, no types selected** | "No risk types selected" in the list; map moves, no nearest search | Turn on a filter | Follows from finding 1. |

### 2.2 Map

| State | What the user sees | What they can do | Recovery / next |
|---|---|---|---|
| **Loading the map code** | A placeholder the map's size, "Loading map…" | Use the list and panel | Leaflet is a client-only import. Reserving the space avoids a layout jump. |
| **Fetching pins after a pan or filter change** | The previous pins stay until the new ones arrive (no clearing, no spinner) | Keep panning | Each new request **aborts** the one before it, so an out-of-order response can never draw pins for an old view or old filters. P1. |
| **More than 1,000 pins in view** | Clusters instead of pins | Zoom in | Today the `LIMIT 1000` silently drops pins in whatever order SQLite returns them. Query `LIMIT 1001`; if 1,001 rows come back, answer in cluster mode for that view. P1. |
| **Outside the county** | Nothing drawn outside; a note on the list | Pan back | Mostly prevented by `maxBounds` (finding 2). |
| Tile failure | Pins on a blank background, plus a small notice in the map region | Everything except seeing the basemap | Today the spec says only "basemap blank," which looks like a broken site. Show the notice after several `tileerror` events. P2. |
| **Tiles on preview deployments** | Blank basemap on every `*.vercel.app` preview | — | The tile key is restricted to the production domain and localhost (§9), so previews will fail. Add the project's preview domain pattern to the key, or accept it knowingly. P3. |
| Data unavailable (503) | Last pins stay; a notice with a Try again button | Retry; use the About page | Announced once. |
| **Offline** | Last pins stay; an offline notice | Wait | Clears itself on the browser's `online` event. No service worker (YAGNI). P3. |
| **Selected place** | A selected marker, always drawn (finding 3) | — | — |

### 2.3 "Places near here" list

| State | What the user sees | What they can do | Recovery / next |
|---|---|---|---|
| **Before any entry action** | Decision D1 | — | — |
| Default | 20 links, nearest first, with a line under the heading saying what the distances are measured from | Open a place | The line is new: "0.3 miles" doesn't say from what, and after a pan it's from the map's centre, not the user. |
| **Refreshing** | The old list stays, dimmed slightly, `aria-busy="true"` | Keep using it | No announcement for refreshes after panning (§7.5 already). |
| **Refresh removes the focused item** | Focus moves to the list heading (`tabindex="-1"`) | — | Otherwise focus drops to `<body>`. P2. |
| Nothing flagged in view | Note above the list; the list shows the nearest anyway | — | Existing spec. Separate sea-only wording. |
| **Map outside the county** | Note: this part of the map is outside LA County | — | — |
| No types selected | Message; empty list | Turn on a filter | Finding 1. |
| Data unavailable / offline | Message with Try again | Retry | — |
| **Two places with the same name** | Today: two identical rows, e.g. "Vermont / Sunset — bus stop — 0.1 miles" twice (one stop on each side of the street) | — | A screen-reader user can't tell them apart. Decision D3. P1. |
| **Place with no name** | Decision D4 | — | — |
| **Very long name** | Wraps; never truncated in the list or the `<h1>` | — | Truncate only where space is fixed: the OG image (two lines, then an ellipsis) and `<title>` (no limit needed). |

### 2.4 Place panel (`/places/[slug]`)

| State | What the user sees | What they can do | Recovery / next |
|---|---|---|---|
| **Navigating from the list** | The link being opened shows a pending state (`useLinkStatus`); the panel keeps its current content until the new one is ready | — | Avoids a click that seems to do nothing while the server renders. Focus moves to the new `<h1>` when it arrives (§7.5). P2. |
| Default | Cards in spec order | — | — |
| **Nothing flagged today, no trend, no sea** | The collapsed "Not flagged today…" line and the Nearby places list | — | Reachable only by URL (finding 3). Confirm the page doesn't look broken with no cards. |
| **A card without a trend line** | The card, without a trend | — | Correct as specified. The About page adds one sentence on why a trend line can be missing: the change is below the meaningful-change threshold, or the projection grid has no value for that spot. P3. |
| **Filtered out** | The panel as normal; the selected marker on the map | — | Finding 3. |
| **Nearby places: none match** | A line: no other places nearby match these filters | Change filters | Possible with sparse filter sets (e.g. sea only, far inland). |
| Unknown slug | Not-found page, HTTP 404 | Go to the map, or Show me an example | Wording in voice doc §10. Covers both a mistyped link and a place removed on purpose. |
| **Data unavailable (503)** | Error state (`error.tsx`) with Try again (`reset()`) | Retry; About page; the example (D5) | Returns a 5xx status, not 200, so link-preview services and crawlers don't cache the error page as the place. |
| **`generateMetadata` fails** | Page title falls back to "So What?"; site-level OG image | — | Today a metadata error fails the whole page even if the body could render. P2. |
| **OG image generation fails** | The site's default OG image | — | Catch errors in `opengraph-image.tsx` and return the default. P2. |
| **Share link with bad parameters** | The page, with default filters | — | Page URLs parse `types` and `view` leniently: drop unknown values, and fall back to the default if nothing valid remains. The API keeps returning 400 for malformed input; only page URLs are lenient. P2. |

### 2.5 Filters

| State | What the user sees | Recovery / next |
|---|---|---|
| Change | Pins and list update; announcement "Showing {n} places in view for {types}." | {n} counts places **in view** (the pins, or the sum of cluster counts). Say "in view" so the number isn't read as a county total. |
| **Change leaves nothing in view** | Announcement says so and that the list shows the nearest | — |
| None selected | Finding 1 | — |
| **Change while a place is open** | Panel unchanged; selected marker stays | Finding 3 |

### 2.6 Announcements (additions to the table in spec §7.5)

The spec's table covers four events. These are the gaps, all polite, none assertive:

| Event | Why it needs one |
|---|---|
| Zip error | The error appears under the field with `aria-describedby`, but on submit, focus stays on the button and the description isn't read. Announce the same text. |
| Nothing flagged near an entry point; flying to the nearest | The map moves on its own. A screen-reader user needs to know why the list now centres somewhere else. |
| No types selected | Otherwise the list just empties. |
| Offline / back online | Otherwise the list silently stops updating. |

Loading is never announced. Results are.

---

## 3. Edge case catalog

Grouped by the skill's stress categories. Only the cases that apply to this product and aren't already covered in §2.

### 3.1 Content

| Scenario | Under the current spec | Recommended | Priority |
|---|---|---|---|
| **OSM playgrounds without a `name` tag.** Many have none. | `places.name` is `NOT NULL`, so the insert fails, or the pipeline invents an empty string and the slug becomes `playground-12345-`. | Decision D4. | P1 |
| **Two bus stops with the same name**, one per direction. | Identical list rows and identical `<title>`s. | Decision D3. | P1 |
| **Names in all caps** (common in county GIS layers: "KENNETH HAHN STATE RECREATION AREA"). | Shown as is; reads as shouting, and some screen readers spell it out. | `normalize.py` title-cases names that are entirely upper case, with a short exception list (LA, USC, "de", "del"). Test it. | P2 |
| **Names with accents or non-Latin script** ("Niños", Korean names in OSM). | The slugifier may drop every character, leaving an empty name part in the slug. | Transliterate to ASCII (NFKD, then strip combining marks); if nothing remains, the slug is `<kind>-<source_id>`. Slugs stay deterministic, so §5.2 still holds. Check the OG image font covers accented Latin. | P2 |
| **Very long names** in the OG image. | The fixed canvas overflows. | Two lines, then an ellipsis; the full name stays in `og:title`. | P2 |
| **Distances** under 0.1 miles, exactly 1, and 10 or more. | Not specified: "0.0 miles", "1 miles". | "less than 0.1 miles", "1 mile", one decimal under 10, whole numbers from 10 up. A small tested helper, like the ordinals helper in the voice doc. | P3 |
| **Counts over 999** in cluster markers and announcements. | "1234". | Format with `Intl.NumberFormat('en-US')`: "1,234". | P3 |

### 3.2 Volume

| Scenario | Under the current spec | Recommended | Priority |
|---|---|---|---|
| More than 1,000 visible places in view at zoom 13+ (downtown, all four kinds). | Silently truncated. | Cluster fallback (§2.2). | P1 |
| **Only `sea` selected, far inland** (e.g. Pasadena). | The list's nearest sea-flagged places are 20+ miles away, under the note "No flagged places in view." After an entry action, the map flies 20 miles to the coast with the message "No elevated risks right around you." That's accurate, but it doesn't say why, and "elevated" is wrong for a projection. | Sea-only wording (voice doc §10) that says sea level rise only affects places near the coast. After an entry action with only `sea` selected, **don't fly** if the nearest flagged place is more than 10 miles away; show the message and let the list carry it. | P2 |
| **Nearest search reaches `K_MAX` with nothing.** | "Message; no map movement" (§10.1), no wording. | With finding 1 fixed, this only happens if the selected types match no place in the county at all (e.g. M1 finds almost no sea-flagged places). Use the "No places match these filters" message. | P3 |

### 3.3 Time

| Scenario | Under the current spec | Recommended | Priority |
|---|---|---|---|
| Location arrives after the user already searched a zip. | The map jumps to their location. | Ignore late results (§2.1). | P1 |
| Permission prompt ignored. | Waits forever. | App-level 15-second limit (§2.1). | P1 |
| **Turso quota exceeded** (`BLOCKED`), which lasts until the monthly reset. | 503 with "Try again in a few minutes" (§7.5), which is false for up to a month. | Wording that doesn't promise a time: "Try again later." The quota is also why D5 matters. | P2 |
| **The data is a snapshot.** | The build date is only in `meta` and the About page (§15). | A footer line on every page: "Data as of {build date}." Costs one `meta` read, cached. | P3 |
| **A share link opened after a rebuild** changed the place's levels. | Renders the new levels, which is correct. If the place is now `low` everywhere, see finding 3. | No change beyond finding 3. | — |

### 3.4 Network

| Scenario | Under the current spec | Recommended | Priority |
|---|---|---|---|
| Out-of-order responses while panning or toggling filters. | Not addressed. | Abort superseded requests (§2.2). The same applies to list refreshes. | P1 |
| Turso unreachable during a demo or grading. | Every place page shows the error state, including the featured place. | Decision D5. | P1 |
| Connection lost mid-session. | Fetches fail; treated as 503. | Offline notice (§2.2). Place navigation falls back to the browser's own offline page, which is acceptable. | P3 |
| Tile provider down or over its free quota. | Blank basemap, no explanation. | Notice (§2.2). | P2 |

### 3.5 User behavior

| Scenario | Under the current spec | Recommended | Priority |
|---|---|---|---|
| Double-clicking "Use my location" or Search. | Two requests; the second may override the first. | Ignore activations while one is in progress. | P3 |
| Back button after opening several places in a row. | The URL changes and the panel follows; the map doesn't say. | The map recentres on the place the URL names, as it does on a direct load. No list refresh (finding 4). | P2 |
| Opening a list item that's outside the view. | Not specified whether the map moves. | Pan to it (instant with reduced motion). No list refresh (finding 4). | P1 |
| Panning with the list half-read by a screen-reader user. | The list refreshes under them. | Focus rule (§2.3). Worth checking in the M7 VoiceOver pass. | P2 |
| JavaScript fails or is slow to load. | Place pages are server-rendered and work; the start panel doesn't. | Make "Show me an example" a real link to `/places/{featured_slug}`, and zip search a real `<form method="get">` that the server resolves. The two actions that don't need location then work before hydration, and the example opens instantly. | P3 |

---

## 4. Stress test results

Run against spec rev. 9, as written. "Fail" means the spec specifies wrong or missing behavior; the fix is in §1–3.

| Prompt | Result | Where |
|---|---|---|
| 0 filters selected | **Fail** | Finding 1 |
| Zoomed out beyond the data | **Fail** | Finding 2 |
| Current place hidden by filters or levels | **Fail** | Finding 3 |
| Open an off-screen list item, then go back | **Fail** | Finding 4 |
| First screen before any action | **Fail** (unspecified) | Finding 5, D1 |
| Location in the ocean inside the county's bounds | **Fail** (unspecified) | Finding 6, D2 |
| 1,001 places in view | **Fail** | §3.2 |
| Two actions in flight at once (location + zip; two pans) | **Fail** | §3.3, §3.4 |
| Permission prompt never answered | **Fail** | §2.1 |
| Place with no name / duplicate name | **Fail** | D3, D4 |
| Only `sea` selected, inland | Partial: works, wording wrong | §3.2 |
| Database down, quota exceeded | Partial: status codes defined, no UI, misleading wording | §2.4, §3.3 |
| Tile failure | Partial: works, looks broken | §2.2 |
| Unknown slug | Pass (copy to write) | §2.4 |
| Non-LA zip | Pass (copy to fix) | §2.1 |
| Card without a trend line | Pass | §2.4 |
| Place with nothing flagged, reached by link | Pass once finding 3 is fixed | §2.4 |
| 320px wide, 400% zoom, screen reader, keyboard | Pass on paper | Owned by the accessibility review; confirmed in M7 |
| Reduced motion | Pass | §7.5 |

---

## 5. First-run experience

**Who's first-running:** a grader following a link from the README or video, or an LA resident who found the site. The grader probably isn't in LA and will deny or fail geolocation. The demo video is the grader's guaranteed first run (journey doc); the live site is the second.

**What works already:** value-first by design. "Show me an example" is one click from a finished, cited place page. There's no sign-up, and the geolocation fallback lands a non-LA visitor on the same example. That's the right shape.

**What's missing:**

1. **The first screen itself** (finding 5, D1).
2. **The fallback message conflates three different situations.** "So What? covers LA County — here's a place to start" (§7.4) is right for someone outside LA, wrong for someone in LA who denied permission, and unhelpful after a timeout. Three variants, one announcement (voice doc §10).
3. **Denying location is a choice, and the app moves anyway.** Flying to the example after a denial is still the right default for graders, but the message should say what happened and keep zip search one step away, rather than read as if the app ignored the user.
4. **The example doesn't depend on JavaScript** once it's a real link (§3.5), so the grader's most likely click is also the fastest and sturdiest.

No onboarding tour. The legend and the "Projected" labels teach the two ideas the product needs, in context.

---

## 6. Decisions for you

Each needs your call before the spec can be updated. My recommendation is first.

**D1. What does the first screen show before any entry action?**
- **(Recommended)** The start panel is the main content; "Places near here" isn't rendered until the user picks an entry action. The map starts at county zoom (clusters only), centred on the populated basin rather than the county's geographic centre. Nothing on the first screen suggests places near a point the user didn't pick.
- The list is shown from the start, measured from the featured place, with the line "Distances from {featured place}". More content immediately, but it quietly makes one bus stop the centre of the site.

**D2. How does the app decide a location is inside LA County?**
- **(Recommended)** Ship a simplified county outline (a few hundred points) from the pipeline as static JSON, and test points with a TypeScript port of `geometry.py`'s ray casting, checked against the same test vectors (as §6.1 does for the grid). No database read, and the same outline gives the "outside LA County" note when panning.
- Bounding box plus a distance cap: inside the county's bbox **and** within 5 miles of some place. No new file, but it needs a nearest-place search that ignores filters, and the 5 miles is arbitrary.

**D3. How are two places with the same name told apart?**
- **(Recommended)** M1 checks what Metro's `stops.txt` offers (a direction or description field). If nothing usable, `normalize.py` detects same-kind, same-name places within about 150 m and appends a compass side: "Vermont / Sunset (east side)". The disambiguated name is used in the list, `<h1>`, `<title>` and slug.
- Merge them into one place. Simpler to read, but two stops become one `source_key`, which fights §5.2's stable identity.

**D4. What happens to playgrounds with no name?**
- **(Recommended)** Name them after the park that contains them ("Playground in Echo Park"), using the parks layer already in the pipeline and the same point-in-polygon code. Drop the ones in no park, and have `validate.py` report the count so it's visible.
- Keep all of them as "Playground" with a street-based locator. More complete, but it needs reverse geocoding, a new dependency, and a source to cite.

**D5. Should the showcase place pages be built ahead of time?**
- **(Recommended)** Yes. Prerender the ~15–20 showcase pages (including the featured one) with `generateStaticParams` at build time. The data only changes when a new build is published, which already requires a redeploy (§8.2), so this costs nothing. The example, the demo path and the most-shared pages then load instantly and **keep working if Turso is down or over quota**.
- No; every page renders on request. Simpler, but a database outage takes down the one page every grader opens.

---

## 7. Resilience recommendations, in order

| # | Priority | Change | Spec sections |
|---|---|---|---|
| 1 | P0 | Zero selected types: empty result without a query, `types=none` in the URL, message | §6.2, §7.4, §10.1, §11 (new test) |
| 2 | P0 | Clip oversize bboxes; `maxBounds` and `minZoom` on the map | §6.2, §10.1 |
| 3 | P1 | Selected marker always drawn; filters never apply to the panel | §7.4 |
| 4 | P1 | App-caused map moves don't refresh the list; back link restores it | §7.4, §7.5 |
| 5 | P1 | First screen (D1) | §7.4 |
| 6 | P1 | County test (D2) | §5.6, §7.1, §7.4 |
| 7 | P1 | Abort superseded requests; ignore late location results; 15-second location limit | §7.4 |
| 8 | P1 | `LIMIT 1001` → cluster fallback | §6.2 |
| 9 | P1 | Duplicate and missing names (D3, D4) | §5.2, §5.6, §10.2 |
| 10 | P1 | Prerender showcase pages (D5) | §7.1, §8.2 |
| 11 | P2 | Place-page error state with a 5xx status; metadata and OG fallbacks | §7.1, §10.1 |
| 12 | P2 | Every message in voice doc §10; the four new announcements | §7.4, §7.5, voice doc |
| 13 | P2 | Map placeholder, stale-while-refreshing pins and list, pending link state | §7.4 |
| 14 | P2 | Lenient page-URL parsing | §7.4, §9 |
| 15 | P2 | Tile-failure notice | §7.4, §10.1 |
| 16 | P2 | Name normalization (casing, transliteration, empty slug part) | §5.2, §5.6, §11 |
| 17 | P2 | Focus rule when a refresh removes the focused item | §7.5 |
| 18 | P3 | Offline notice; double-activation guard; blocked-location hint; "Data as of" footer; distance and count formatting; example link and zip form without JavaScript; preview tile domains; About-page sentence on missing trend lines | various |

**Tests this adds** (for §11): zero types returns empty; an oversize bbox is clipped, not rejected; 1,001 rows switch to clusters; the county test on shared vectors (D2); the distance formatter at 0.05, 1 and 10 miles; the name normalizer and slugifier on all-caps, accented and non-Latin names. Playwright: deny geolocation and see the denied message, not the outside-LA one; uncheck all filters and see the message; open a place, turn off its filter, and the selected marker stays.
