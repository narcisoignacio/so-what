# So What? — UX Evaluation

**Date:** 2026-09-28 (against spec rev. 10)
**Status:** Applied to spec rev. 11 and the voice doc (§8, §10). D6: the recommended fifth filter, labelled **"Unflagged"** rather than "Places not flagged". A fifth checkbox then proved too tall on phones, so it became a small switch on each places-list heading row and in the map legend (idea #10 on the [idea board](../wireframes/wireframes-glyphs-thumbnails.html)); the filter legend stays "Show risks". P2-3 settled on **"Air pollution"** as the air risk's name, since "Air quality — High" would read as good air.
**Related:** [design spec](../superpowers/specs/2026-09-27-so-what-design.md) · [voice and templates](../content/2026-09-28-so-what-voice-and-templates.md) · [grader's first 30 seconds](../journeys/2026-09-28-grader-first-30-seconds.md) · [accessibility review](../accessibility/2026-09-28-so-what-accessibility-review.md) · [states and edge cases](../resilience/2026-09-28-so-what-states-and-edge-cases.md)

**What this covers.** One pass over the whole design as specified in rev. 10, as a check on the journey, voice, accessibility, wireframe and resilience passes before M0:
- Nielsen's 10 heuristics;
- cognitive walkthroughs of six tasks;
- a scan against the Intent anti-pattern catalog;
- the WCAG 2.2 AA commitments in spec §7.5, checked for gaps rather than re-audited.

**What it doesn't cover.** Nothing is built, so every finding is about the spec, not observed behavior. The wireframes were not re-inspected (the spec encodes their decisions as of rev. 9). Visual design (palette, type, icon refinement) is still an open follow-up and isn't scored. Task metrics below are estimates from the walkthroughs, not measurements.

---

## 1. UX health score: 78 / 100

| Component | Weight | Score | Why |
|---|---|---|---|
| Heuristics | 40 | 31 | No heuristic above a 2 except one 3 (H7, finding 1). The earlier passes closed most of the usual gaps: status, errors, and recovery. |
| Task success | 40 | 29 | The grader's path passes with one hesitation. The resident's central question, "what about the stop I use?", fails for every place that isn't flagged. Phone map mode has an unspecified step. |
| Anti-patterns | 20 | 18 | Clean. Two small watch items: location privacy and stigma on share images. |

**In one line:** the design is strong for the audience it was built around (a grader watching a video, then clicking the example) and weaker for the one its problem statement names (an LA resident asking about their own bus stop).

---

## 2. Anti-pattern verdict: Clean

No deceptive, coercive, urgency, addictive or consent patterns. There are no accounts, no stored user data, no analytics in the spec, and no notifications. The voice rules ban alarm words and "safe", and the design keeps projections from setting levels, which prevents the most likely harm in this domain: overstating certainty.

Two watch items, both minor:

| Item | Severity | Where |
|---|---|---|
| **The user's location can leak.** "Use my location" sends exact coordinates to `/api/places/nearest` (logged by Vercel with every request), and `MapView` "syncs with URL". If the start page's map centre is written to the URL after locating, a copied link carries the person's home location. | Medium (privacy) | §7.1, §7.4 |
| **Share images can put a label on a named school.** The OG image shows a place name and its "top risk". "Lincoln Elementary — Air: Severe" on social media is the kind of label voice principle 3 exists to avoid, and without the sentence it lacks the scope ("than 97% of California neighborhoods"). | Low (stigma) | §7.1 `opengraph-image.tsx` |

Fixes are in §3 (P2-7, P3-5).

---

## 3. Priority issues

No P0s. The resilience pass removed the two that existed.

### P1 — Major

**P1-1. A place that isn't flagged can't be found, so its climate story can't be read.**
- **What:** visibility (§5.3) requires a flagged level or a sea flag. Unflagged places are on neither the map nor either list, and there's no name search. The only way to reach one is a URL.
- **Where the story breaks:** a resident reads the problem statement's question, "what does this mean for the bus stop I wait at, and is it getting worse?", uses their location, and scans the list. If their stop is below the 75th percentile on all three risks, it isn't there. Neither the map nor the list says so. They conclude the app doesn't know their stop, or, worse, that it's missing because it's fine.
- **Why it matters beyond residents:** the spec deliberately keeps a `low` card with a trend line expanded, because "a place that isn't flagged today can still be getting worse, and saying so is the climate story" (§5.5, §7.4). For places with nothing flagged, that content is written, validated and never shown.
- **Scale:** depends on M1's distributions, but by construction a large share of places is below `elevated` on all three risks.
- **Route:** `/journey` and `/organize`. Decision D6 (§7).

**P1-2. On phones, tapping a pin in map view has no specified result.**
- **What:** below the list-first breakpoint, the map and the list/panel are alternate views (§7.5, `ViewToggle`). Tapping a pin navigates to the place, but nothing says the view switches to the panel. If `view=map` persists, the URL and focus change while the screen still shows the map, and the only visible change is a selected marker.
- **Route:** `/journey`. Fix: opening a place from the map on narrow screens switches to the panel view. The toggle then reads "Show map" and returns to the map centred on the place.

**P1-3. The start page never says what the site is.**
- **What:** the start panel is three actions (§7.4). The only statement of purpose is the `<title>`. The start page has no `<h1>` specified (§7.5 defines one only for place pages), and the name "So What?" doesn't explain itself.
- **Where the story breaks:** a grader arriving from the README has seen the video, so they're fine. An LA resident arriving from a shared link to the home page sees "Use my location" with no reason to share it.
- **Route:** `/articulate`. Fix: an `<h1>` and one sentence above the actions, e.g. "What climate risks mean at LA County bus stops, parks, playgrounds and schools." It should also say what using location does ("to show places near you; it isn't stored").

**P1-4. "Today" overstates how recent the data is.**
- **What:** cards, the collapsed line ("Not flagged today"), and the spec's framing present CalEnviroScreen and the heat island index as today's conditions. CalEnviroScreen 4.0 was released in 2021, and its PM2.5 indicator averages several earlier years (believed to be 2015–2017; confirm in M1). The fire maps are current (2025). Only the build date is shown ("Data as of"), which is the date of the snapshot, not of the measurements.
- **Why it matters:** voice principle 2 is "honest about time", and the design takes care to separate today from projections. A reader who notices that "today" means 2016 will doubt everything else. Graders are exactly the people who check sources.
- **Route:** `/articulate`. Fix: each `detail` line names its data years ("PM2.5: 91st percentile, 2015–2017 average (statewide)"). The About page defines "today" as "the most recent data available for each risk". Consider "Not flagged now" or "Not flagged in current data" for the collapsed line. The "today vs. projected" split is still right; only the claim of recency changes.

### P2 — Minor

**P2-1. Place pages have no route home, and no zip search.** Someone arriving from a share link can't search their own zip without guessing that the site name is a link. The header's contents aren't specified. **Route:** `/journey`. Fix: the header has the site name linking to `/` and, from a medium width up, the zip field.

**P2-2. The back link has nothing to go back to after a direct load.** "← Places near here" restores "the list as it was when the place was opened" (§7.4). After a share link or the example link, there was no list. **Route:** `/fortify`. Fix: with no saved list, it shows the list measured from this place ("Distances from {place}.") and focuses its heading.

**P2-3. Risk names aren't defined in one place.** The same risk appears as "Air" (list item), "air" (collapsed line), and presumably "Air quality" somewhere else. Fire appears as "fire" (type), "Wildfire" (headings, filters?) and "wildfire" (collapsed line). Lists use "Heat: High"; headings and chips use "Heat — High". **Route:** `/articulate`. Fix: one display-name table in voice doc §8 (Air quality / Heat / Wildfire / Sea level rise, or the shorter set), used by filters, headings, chips, list items and messages. Pick one separator.

**P2-4. The legend has no specified place.** `Legend.tsx` exists, but not where it sits, especially in phone map view, where it's most needed. **Route:** `/wireframe` (or the visual design pass).

**P2-5. What clicking a cluster does isn't specified.** Server-side clusters are custom markers, so Leaflet's default cluster behavior doesn't apply. **Route:** `/journey`. Fix: clicking a cluster zooms two levels in, centred on it (instant with reduced motion).

**P2-6. Only the 20 nearest places are listable.** No "show more", so the list path can't reach the 21st place, which the map can show. **Route:** `/journey`. Fix: a "Show 20 more" button (N is capped at 50 in §6.4; raise it or page it).

**P2-7. Location privacy (anti-pattern watch item).** **Route:** spec §7.4, §9. Fix: round coordinates to 3 decimal places (about 100 m) before any request; never write the user's own location to the URL (the map centre after locating isn't synced until the user pans); say on the start panel that location isn't stored.

### P3 — Polish

- **P3-1.** "Back to list" (§7.5) and "← Places near here" (§7.4) name the same link. Use the second. → `/articulate`
- **P3-2.** No share control. On phones the URL bar is hidden. A "Share" button using the Web Share API, falling back to "Copy link", fits the success criterion about shared URLs. → `/journey`
- **P3-3.** Nothing on the card links to how levels are set. A small "How levels work" link to the About page's thresholds section, next to the level badge's first use. → `/articulate`
- **P3-4.** Pins have no name on hover on desktop. A tooltip with the place name makes the map explorable before committing to a click. Pins stay out of the tab order (§7.5). → `/journey`
- **P3-5.** Share images should carry the scope, not just the level: the So What? sentence's first clause ("…higher than in 97% of California neighborhoods") or the level plus "neighborhood". → `/articulate`

---

## 4. Heuristic scores

| Heuristic | Score | Findings |
|---|---|---|
| **H1** Visibility of system status | 1 | After rev. 10: loading, pending links, busy lists, announcements and the "Distances from" line are all specified. Remaining: P1-2 (phone map mode gives no visible result). |
| **H2** Match with the real world | 2 | Plain words throughout; "neighborhood" vs "this area" vs "this stop" matches the data's scale. Against it: "today" for data several years old (P1-4); "Severe" next to CAL FIRE's "Very High" (already on the voice doc's test list). |
| **H3** User control and freedom | 1 | No modals; filters reversible; entry actions don't fight each other. The fly-to after a denial moves the map without asking, but it's explained and one step from zip search. |
| **H4** Consistency and standards | 2 | Card anatomy is consistent everywhere, including OG images and video. Risk names and separators vary (P2-3); one link has two names (P3-1). |
| **H5** Error prevention | 0 | Zip format checked in the browser; filters can't produce an invalid state; `validate.py` blocks bad data before it ships. |
| **H6** Recognition rather than recall | 1 | Levels are in words next to every glyph; list items carry levels; chips summarize. The legend's placement is open (P2-4), and nothing on the card explains the levels (P3-3). |
| **H7** Flexibility and efficiency | 3 | Filters and share links are in the URL, and three entry points suit different users. But there's no way to reach a place that isn't flagged, and no name search (P1-1); the list stops at 20 (P2-6). |
| **H8** Aesthetic and minimalist design | 1 | Consequence first, detail folded away on phones, `low` cards collapsed, one list per page. A place with four flagged cards is long, but each card earns its place. |
| **H9** Recognize, diagnose, recover from errors | 0 | Every error names what failed and offers a way forward (voice doc §10). |
| **H10** Help and documentation | 1 | The About page covers method, thresholds, limitations and tips. No path from a card to the relevant part of it (P3-3). |

---

## 5. Cognitive walkthroughs

Four questions per step: will they try (motivation), will they see the control (visibility), will they understand it (understanding), will they see it worked (feedback).

### T1. Grader: open the site and understand the featured place

| Step | M | V | U | F | Rating |
|---|---|---|---|---|---|
| Land on the start page | No: nothing says what the site is (P1-3). A grader who saw the video knows; one who didn't doesn't. | Yes | Yes | — | Hesitation |
| Activate "Show me an example" | Yes | Yes | Yes | Yes: pending link state, then the panel; focus on `<h1>` | Pass |
| Read the heat card | Yes | Yes: chips and card order | Yes: level in words, consequence in plain language | — | Pass |
| Read the trend | Yes | Yes | Yes: "Projected" comes first | — | Pass |

**Estimate:** near 100% completion, under 30 seconds after the click. The one hesitation is before the click.

### T2. Resident: check the stop I use (location or zip)

| Step | M | V | U | F | Rating |
|---|---|---|---|---|---|
| Use my location / search a zip | Yes, if they know why (P1-3) | Yes | Yes | Yes: busy state, announcement, list | Pass |
| Find my stop in the list | Yes | **No, if it isn't flagged** | **No: nothing says unflagged places are hidden** | — | **Failure** (for unflagged stops) |
| Open it | Yes | Yes | Yes | Yes | Pass |

**Estimate:** completes for flagged stops; fails for every unflagged one, with no message explaining why (P1-1).

### T3. Resident on a phone: find a place with the map

| Step | M | V | U | F | Rating |
|---|---|---|---|---|---|
| Tap "Show map" | Yes | Yes | Yes | Yes | Pass |
| Tap a pin | Yes | Yes | Yes (with a legend, P2-4) | **Unspecified** (P1-2) | Hesitation, or Failure if the view doesn't switch |
| Read the panel | Yes | Depends on the previous step | Yes | — | — |

### T4. Filter to one risk

| Step | M | V | U | F | Rating |
|---|---|---|---|---|---|
| Uncheck the other risks | Yes | Yes: filters always visible, also on phones | Yes: native checkboxes with a legend | Yes: announced count "in view" | Pass |
| Sea only, far inland | Yes | Yes | Yes: the message explains that sea level rise affects the coast | Yes | Pass |

### T5. Share a place

| Step | M | V | U | F | Rating |
|---|---|---|---|---|---|
| Copy the link | Yes | Desktop yes; phone: URL bar hidden, no share control (P3-2) | Yes | Browser's own feedback | Pass on desktop; Hesitation on phones |
| Recipient opens it | Yes | Yes | Yes: server-rendered, meaningful preview | — | Pass |
| Recipient looks up their own area | Yes | **No: no home link or zip field on place pages** (P2-1) | — | — | Hesitation |

### T6. Keyboard and screen reader (the three §11 tasks)

All three pass on paper: the example's heat level and trend in a few heading jumps; zip 90012 and the second list item; the filter count announced. Confirmed in M7 with VoiceOver, as planned.

---

## 6. What works (protect these)

1. **Consequence first, and the order holds everywhere.** The same card anatomy in the panel, share images and video means one design decision serves all three audiences. Keep it when the visual design pass starts pushing on hierarchy.
2. **Levels come from today's data only.** Projections can't move a pin or a level, and sea level rise is a flag, not a level. This is the most important honesty decision in the spec, and it's enforced in `validate.py` rather than left to discipline.
3. **The voice rules are enforceable.** Banned words, word caps checked on rendered text, "never safe" for `low`. Most products write voice guides; this one tests them.
4. **The list is a real path, not an accessibility afterthought.** It's backed by the same proved ring search as the map, and it makes the app usable without sight or a mouse. It's also what lets a grader skim places without reading a map of a city they don't know.
5. **Every stated risk comes with a next step,** and unflagged risks don't. That avoids both anxiety with nowhere to go and advice that implies a risk the data doesn't show.
6. **Failure is designed, not hoped away.** After rev. 10, every error names what failed and what still works, and the demo path survives a database outage.
7. **Nothing is asked of the user.** No accounts, no data kept, no prompts. The most valuable page is one link from the start.
8. **Citations reach down to the consequence claims,** not just the data. Few student projects, or products, check that "children breathe more air per pound" has a source.

---

## 7. Decision for you

**D6. How does someone reach a place that isn't flagged?**

- **(Recommended)** Add a fifth checkbox to the filters, off by default: **"Places not flagged"**. When on, the visibility clause drops its `≥ 1` condition, so every place in view appears. Unflagged ones get a small neutral pin with no level meter, and they appear in the list and nearest search like any other place. The URL gets `types=…,unflagged`. It reuses the filters, list, pins and cluster fallback that already exist, keeps the default map about flagged places, and gives the list path (not just the map) a way to them. Add a line to the empty-viewport messages: "Places not flagged are hidden. Turn on 'Places not flagged' to see them."
- **Name search** ("Find a place by name") in the header. It answers "my stop" directly, but it's a new query shape (a prefix search on `name` needs an index, and full-text search may not be available on Turso), a new component, and new states. Better as a later addition than the fix.
- **Leave it**, and say on the About page and in the list's heading that only flagged places are shown. Honest, and the cheapest, but the resident's question stays unanswered for most places, and the written `low`-with-trend content stays unreachable for places with nothing flagged.

---

## 8. Recommended actions, by skill

| Skill | Issues | Notes |
|---|---|---|
| **`/journey`** | P1-1 (with D6), P1-2, P2-1, P2-5, P2-6, P3-2, P3-4 | Mostly small spec additions to §7.4. P1-1 and P1-2 first. |
| **`/articulate`** | P1-3, P1-4, P2-3, P3-1, P3-3, P3-5 | Start-panel intro, data years on `detail` lines, one risk-name table. All go in the voice doc, then the spec. |
| **`/fortify`** | P2-2 | One more state for the back link. |
| **`/wireframe`** or visual design | P2-4 | Legend placement, especially phone map view. Fits the pending visual design pass. |
| **Spec §7.4, §9 directly** | P2-7 | Location rounding and URL rule. |
| **M1** | P1-4 | Confirm each source's data years for the `detail` lines. |

**Suggested order:** decide D6, then apply everything above as spec rev. 11 in one pass. None of it changes the architecture or the pipeline's shape, and D6's recommended option is a change to one clause in the visibility query plus a filter.
