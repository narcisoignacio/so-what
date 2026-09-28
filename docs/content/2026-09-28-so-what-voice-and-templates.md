# So What? — Voice and Templates

**Date:** 2026-09-28 (updated for spec rev. 7: today first, trend lines, sea level rise; §10 added from the [states and edge cases review](../resilience/2026-09-28-so-what-states-and-edge-cases.md); rev. 11: risk names, data years, "current data", start page and Unflagged labels, from the [UX evaluation](../evaluation/2026-09-28-so-what-ux-evaluation.md))
**Status:** Draft. Wildfire trend and sea-level-rise wording are provisional until M1 confirms the data.
**Related:** [design spec](../superpowers/specs/2026-09-27-so-what-design.md) §1 (today first, then the trend), §5.5 (text), §7.4 (card and panel order), §15 (limitations) · [grader's first 30 seconds](../journeys/2026-09-28-grader-first-30-seconds.md)

This document sets how every risk card speaks, then gives the text itself:

- a `so_what` template for every today risk (air, heat, fire) × place kind, plus a sentence for `low`;
- a **trend** template for each risk climate change is making worse (heat, and fire if adopted);
- a **sea-level-rise** template for each place kind (projection only);
- the `detail` line formats, the panel's fixed labels, and a proposed "what you can do" tip per risk type;
- the messages for loading, empty and error states (§10).

It addresses three gaps from the Intent review:

| Gap | Problem | Handled by |
|---|---|---|
| **2. No next step** | Cards stated a consequence and stopped, leaving worry with nowhere to go. | Principle 4 and the tip field (§7) |
| **4. False precision** | Tract-level data was worded as if it described the exact spot, and projections can be worded as if they were certain. | Principle 2 and the scope rules (§3) |
| **5. Stigma** | Risk labels could read as a verdict on a neighborhood and the people in it. | Principle 3 and the word list (§2) |

---

## 1. Voice principles

Five principles. Each has a boundary on both sides, so a disagreement ("is this too alarming?") has an answer.

### 1. Concrete, not clinical
Talk about people doing things in a place: riders waiting, children playing, students at recess. Numbers and technical names go in `detail`, never in `so_what`. Trend lines are the one place a number belongs in the sentence, because the change *is* the point, and it's a number anyone can picture (days a year).
- **Is:** "Riders breathe it every time they wait."
- **Isn't:** "PM2.5 exposure is associated with adverse respiratory outcomes." *(accurate but abstract)*
- **Isn't:** "Imagine gasping for air while you wait for the 204." *(concrete but made up)*

### 2. Honest about scale, time and certainty
The data describes an area or a scenario, not a guaranteed fact about one spot.
- **Space:** say "neighborhood" for tract data and "this area" for projection grids, which are coarser. Say "this stop" only where the data places the point exactly (fire zones, flood extents).
- **Time:** today's conditions are stated as present fact. Projections always say "projected" or "could," and always name the period ("by mid-century"). Never "will."
- **Baseline:** a trend's starting value is a modelled historical period, not a measurement of today, so trend lines say "go from about X to Y," never "today X."
- **Numbers:** state percentiles as the source gives them; round projected values and prefix "about."
- **Is:** "This area is projected to go from about 6 to 20 extreme-heat days a year by mid-century."
- **Isn't:** "By 2050 this stop will have 20 deadly heat days." *(certain, exact place, exact year, alarm word)*
- **Isn't:** "Some models suggest heat could possibly increase somewhat in coming decades." *(hedged until it says nothing)*

### 3. Describe conditions, not communities
Name what the air, heat, fire or water is doing. Never describe the neighborhood itself or the people who live there. No neighborhood names in `so_what`, and no demographics.
- **Is:** "Fine-particle air pollution here is higher than in 91% of California neighborhoods."
- **Isn't:** "One of LA's most polluted neighborhoods." *(a label that sticks to a place and its residents)*
- **Isn't:** "A vulnerable, at-risk community." *(talks about people as a problem)*

### 4. Calm, and point to something to do
State the consequence plainly, at the level of the data, then show a next step (§7). No alarm words, no exclamation marks. Don't soften a real risk into nothing, either. Projections especially: the aim is "worth knowing and planning for," not dread.
- **Is:** "A long summer wait in direct sun can cause heat illness, especially for older riders." + a tip about cooling centers.
- **Isn't:** "DANGER: Extreme heat zone!"
- **Isn't:** "It can get a little warm here in summer." *(softened until it misleads)*

### 5. Plain enough to read at a glance
Aim for an 8th-grade reading level. Keep each sentence under 25 words, the whole `so_what` at 30 words or fewer, and a trend line at 25 or fewer (both enforced by `validate.py`, spec §5.5). The text has to work read aloud by a screen reader, as a video caption at 2× speed, and for a reader whose first language isn't English.

---

## 2. Word list

| Use | Instead of | Why |
|---|---|---|
| neighborhood | area, census tract, community | For tract data. Matches the data's scale in plain words (tract goes in `detail`). "Community" pulls in the people. |
| this area | this neighborhood, here | For projection grids, which are a few km across. |
| projected, could | will, is going to | Projections are one scenario's model output, not a forecast. |
| by mid-century | by 2050, in the future | Names the period without false precision about a year. The exact period goes in `detail`. |
| go from about X to Y | today X, will reach Y | The baseline is a modelled historical period, not today. |
| fine-particle air pollution | PM2.5, particulate matter, smog | Plain, and accurate for both PM2.5 and diesel PM. |
| fire hazard zone | fire risk zone, danger zone | CAL FIRE's maps show *hazard* (how fire would behave), not the chance of a fire. |
| heat illness | heat stroke, heat death | Covers the whole range without jumping to the worst case. |
| sea level rise | rising oceans, the sea swallowing | The term people will search for. No imagery. |
| older riders / older adults | the elderly, seniors | People-first and less othering. |
| children, students | kids | Neutral register. "Kids" reads casual next to health claims. |
| can, may | will, is dangerous | The effect depends on the day and the person. |
| higher than in N% | top N%, worst N% | "Worst" ranks the place. "Higher than" describes the reading. |

**Never in `so_what` or `trend`:** safe, unsafe, dangerous, toxic, deadly, catastrophic, doomed, underwater, polluted (as a label for a place), at-risk, vulnerable, neighborhood names, exclamation marks, "will" about the future.

**Why "safe" is banned, even for `low`:** `low` only means below the 75th percentile, or outside a mapped zone. A place at the 74th percentile isn't "safe"; it just isn't flagged. The same goes for places without a sea-level-rise flag: they are outside one scenario's flood area, not guaranteed dry.

---

## 3. Scope rules for each risk

| Risk | What the data means | How to say it | Scope word | Time |
|---|---|---|---|---|
| **Air** | CalEnviroScreen percentile, **statewide**; level uses max(PM2.5, diesel PM) | "higher than in {p}% of **California** neighborhoods" | neighborhood | today |
| **Heat** | Urban heat island percentile **within LA County** | "than {p}% of **LA County** neighborhoods" | neighborhood | today |
| **Heat trend** | Cal-Adapt extreme-heat days, baseline vs. mid-century, SSP2-4.5 | "projected to go from about {now} to {future} … by mid-century" | this area | projected |
| **Fire** | The CAL FIRE zone that contains the point | "in CAL FIRE's {zone} fire hazard zone" | this stop / park / … | today |
| **Fire trend** *(if adopted)* | Cal-Adapt wildfire projection | "projected to {change} by mid-century" | around here | projected |
| **Sea level rise** | Inside the CoSMoS flood extent for the OPC Intermediate mid-century rise | "By mid-century, with about {rise} … could flood this {kind}" | this stop / park / … | projected |

Air and heat compare against **different populations** (all of California vs. LA County). The copy has to say which one every time, or two numbers side by side will look comparable when they aren't.

`{p}` is the source percentile as a whole number, always below 100. The level label ("High") carries today's severity, so today's sentences don't need intensity words.

---

## 4. Today: `so_what` templates

The spec keys templates by `(type, kind, level)`. For air and heat, the level is already carried by `{p}` and the card's level label, so one template per `(type, kind)` covers all three levels (`elevated`, `high`, `severe`). `templates.py` can expand these 12 templates into the 36 keys that `validate.py` checks. For fire, the level changes one phrase, `{spread}`:

| Level | CAL FIRE `{zone}` | `{spread}` |
|---|---|---|
| elevated | Moderate | could spread |
| high | High | could spread quickly |
| severe | Very High | could spread very quickly |

**When a sentence includes an action:** only when the action is specific to that kind of place, such as a school's pickup plan or closures at a park. General actions (air alerts, cooling centers, emergency alerts) go in the tip (§7), so no card repeats them.

Word counts are for the longest case (`{p}` = 97, `{zone}` = Very High), checked by script. All are at or under 30.

### Air

Shared first sentence: *Fine-particle air pollution here is higher than in {p}% of California neighborhoods.*

| Kind | Second sentence | Words |
|---|---|---|
| bus_stop | Riders breathe it every time they wait, and it adds up over years of commuting. | 27 |
| park | People exercising here breathe in more of it, which matters most for anyone with asthma. | 27 |
| playground | Children breathe more air for their size than adults, and their lungs are still developing. | 27 |
| school | Students breathe it all school day, and most deeply during recess and sports. | 25 |

### Heat

Shared first sentence: *This neighborhood traps more heat from pavement and buildings than {p}% of LA County neighborhoods.*

| Kind | Second sentence | Words |
|---|---|---|
| bus_stop | A long summer wait in direct sun can cause heat illness, especially for older riders. | 30 |
| park | Exercising here at midday in summer raises the risk of heat illness. | 27 |
| playground | Surfaces can get hot enough to burn skin, and children are more sensitive to heat. | 30 |
| school | Heat makes it harder for students to learn and makes outdoor recess and sports riskier. | 30 |

Why not "one of the hottest neighborhoods"? The heat island index measures the *extra* heat trapped by pavement and buildings compared with a rural baseline, not the absolute temperature. "Traps more heat" is what the metric actually measures, and it's still plain. How hot the area is getting is the trend line's job (§5).

### Fire

Shared first sentence: *This {kind} is in CAL FIRE's {zone} fire hazard zone.* (`{kind}` = stop / park / playground / school)

| Kind | Second sentence | Words |
|---|---|---|
| bus_stop | When wildfires burn nearby, smoke can make waiting outdoors unhealthy, and routes may close. | 25 |
| park | Vegetation and terrain mean fire {spread}, so check for closures on hot, windy days. | 28 |
| playground | Vegetation and terrain mean fire {spread}, so leave early when fire warnings are issued. | 28 |
| school | Fire {spread} here, so families should know the school's evacuation and pickup plan. | 27 |

### `low` (one per risk type, all place kinds)

| Type | Sentence | Words |
|---|---|---|
| air | Fine-particle air pollution here isn't among the highest 25% in California. | 11 |
| heat | This neighborhood isn't among the 25% of LA County neighborhoods that trap the most heat. | 15 |
| fire | This place isn't in a CAL FIRE fire hazard zone. Wildfire smoke can still reach it. | 16 |

These say what the data shows (not flagged) without claiming the place is safe. The "25%" comes from the `elevated` threshold (spec §5.4). If M1 changes that threshold, derive the number from `thresholds.py` rather than writing it by hand.

---

## 5. Projected: trend lines

One template per risk type, used at **every** level including `low`, because a place that isn't flagged today can still be getting worse (spec §5.5). The trend line is what makes the card a climate story, so its first words name the direction plainly. The card labels it "Projected" (§8), so the sentence doesn't need to repeat the scenario.

| Type | Template | Words |
|---|---|---|
| heat | And it's getting hotter: this area is projected to go from about {now} to {future} extreme-heat days a year by mid-century. | 21 |
| fire *(provisional)* | And fire risk is growing: the area burned by wildfires around here is projected to {change} by mid-century. | 19 |

- `{now}` and `{future}` are rounded to whole days. The line is omitted (NULL) when the change is below the meaningful-change threshold. Never write "and it's staying the same."
- "Extreme-heat days" may be defined relative to each area's own history (spec §15, to verify in M1). The About page explains the definition in one plain sentence. The card doesn't.
- `{change}` for fire is a plain phrase derived from the projected percentage change ("grow by about a third", "roughly double"). Its wording depends on the metric Cal-Adapt provides. If fire isn't adopted in M1, delete that row.

---

## 6. Projected: sea level rise

Keyed by place kind only, with no level (spec §5.4). The whole card is a projection, so the first sentence carries the period, the amount and "could."

Shared first sentence: *By mid-century, with about {rise} of sea level rise, {condition} could flood this {kind}.*

`{rise}` comes from the OPC Intermediate scenario for the LA tide gauges (e.g. "1 foot"). `{condition}` depends on M1's choice of CoSMoS layer:

| M1 choice | `{condition}` |
|---|---|
| Everyday tides only | high tides |
| Tides plus an annual storm | a typical winter storm |

| Kind | Second sentence | Words (storm version) |
|---|---|---|
| bus_stop | Service here may be moved or cut on those days. | 28 |
| park | The park may close on those days. | 25 |
| playground | Floodwater can leave contamination behind, so it may close until cleaned. | 29 |
| school | Flooding could close the school or block students' routes to it. | 29 |

- "This stop," not "this area": the flood extents are detailed polygons, and point-in-polygon places the point exactly.
- "Flood," never "underwater" or "lost." A flooded place on some days is not a place gone.
- There's no `low` sentence. Unflagged places have no sea row (spec §5.3), and the absence isn't a claim.

---

## 7. "What you can do": tip per risk type (gap 2)

Specified in spec §7.4: fixed data in `web/lib/tips.ts`, keyed by risk type, shown at the end of each card that is `elevated` or above and of every sea-level-rise card. No database change, because the tips don't vary by place. The About page lists where each one points.

| Type | Tip | Link |
|---|---|---|
| air | Check today's air quality before long waits or outdoor exercise. | AirNow — airnow.gov |
| heat | On hot days, cooling centers are open across LA County. Find one near you. | LA County heat resources — *URL to verify* |
| fire | Sign up for emergency alerts and learn your evacuation zone. | Ready LA County — *URL to verify* |
| sea | See how rising seas and storms could affect the coast near you. | Our Coast, Our Future (CoSMoS viewer) — *URL to verify* |

**Rules:**
- A tip is a verb plus a link. It never repeats the `so_what`.
- The heat tip is about today (cooling centers), even under a trend line. The trend explains *why* it matters more over time; the tip is what to do this summer.
- The link text names the organization, so a screen reader announces where the link goes.
- **Check every URL before M6.** Links from government agencies move. Add them to the `sources` table so they're cited the same way as the data sources.

---

## 8. `detail` lines and fixed labels

`detail` holds the specific measurement. It sits below the So What? sentence and any trend line (spec §7.4).

| Type | Format | Example |
|---|---|---|
| air | PM2.5: {pm25}th percentile · Diesel PM: {diesel}th percentile (statewide, {years} data) | PM2.5: 91st percentile · Diesel PM: 88th percentile (statewide, 2015–2017 data) *(years to confirm in M1)* |
| heat | Urban Heat Island Index: {p}th percentile in LA County ({years} data) | Urban Heat Island Index: 94th percentile in LA County ({years} data) |
| fire | CAL FIRE Fire Hazard Severity Zone: {zone} ({year} map) | CAL FIRE Fire Hazard Severity Zone: Very High (2025 map) |
| sea | USGS CoSMoS: {rise} sea level rise, {condition label} · OPC Intermediate scenario, {period} | USGS CoSMoS: 1 ft sea level rise, annual storm · OPC Intermediate scenario, 2040–2060 *(illustrative)* |
| trend source line | Projection: Cal-Adapt LOCA2, SSP2-4.5, {baseline} vs. {future} | Projection: Cal-Adapt LOCA2, SSP2-4.5, 1981–2010 vs. 2035–2064 *(illustrative)* |

- Ordinals need a helper function (91**st**, 92**nd**, 93**rd**, 11**th**–13**th**). Test it at the boundaries.
- Air shows both measures, because the level uses whichever is higher and a reader should be able to see which one it was.
- **Every today `detail` names its data years** (`{years}` from `sources`, set in M1). "Today" in this doc means *the most recent data available for each risk*, and some of it is several years old. The About page says so in those words. The panel's own wording says "current data", never "today" (see the collapsed line below).
- **A label mismatch to decide:** a Very High zone shows the app label **Severe** next to CAL FIRE's own words **Very High**. Keeping CAL FIRE's name in `detail` is right, because it's the official term people will search for. Check in testing whether the two labels together confuse people.

**Risk names.** One display name per risk type, used everywhere a person sees it: filters, card headings, chips, list items, the collapsed line, messages and share images.

| Type | Name (start of a label) | In a sentence |
|---|---|---|
| air | Air pollution | air pollution |
| heat | Heat | heat |
| fire | Wildfire | wildfire |
| sea | Sea level rise | sea level rise |

"Air pollution", not "Air quality": "Air quality — High" would read as *good* air.

**Risk and level together:** "Heat — High" in headings, chips and share images. List items use a colon ("Heat: High"), because their fields are already separated by dashes.

**Fixed labels on the panel:**

| Where | Text |
|---|---|
| Level slot on a today card | Low · Elevated · High · Severe |
| Label on a trend line, and in the level slot of a sea card | Projected |
| Collapsed line for a place with nothing flagged (spec §7.4) | Not flagged in current data for air pollution, heat or wildfire. |
| Map legend, dashed pin with wave glyph | Projected coastal flooding by mid-century |
| Map legend, neutral pin | Not flagged for any risk |
| Card heading (spec §7.4) | {Risk} — {Level}, e.g. "Heat — High"; "Sea level rise — Projected" |
| Link next to the first level badge in the panel | How levels work (to the About page's thresholds section) |
| Distances | "1.4 miles", never "1.4 mi" |
| Disclosure for detail and full sources, phones only (spec §7.4) | About this data |
| Short source line, phones (always visible) | Source: CalEPA · Cal-Adapt · Source: CalEnviroScreen (OEHHA) · Source: CAL FIRE · Source: USGS CoSMoS · OPC |
| At-a-glance chips (2+ flagged cards) | {Risk} — {Level}, e.g. "Heat — High"; nav label "Risks at this place" |
| Back link on place pages | ← Places near here |
| List item | {place} — {kind} — {Risk}: {Level}, … — {distance}, e.g. "Vermont / Sunset (east side) — bus stop — Heat: High, Air pollution: Elevated — 0.3 miles". Unflagged: "… — Not flagged — …". Sea: "Sea level rise: Projected". |

**Fixed labels elsewhere:**

| Where | Text |
|---|---|
| Start page `<h1>` | So What? |
| Start page intro, under the `<h1>` | What climate risks mean at LA County bus stops, parks, playgrounds and schools. |
| Hint under "Use my location" | Only used to find places near you. |
| Filter group legend | Show |
| Filter labels | Air pollution · Heat · Wildfire · Sea level rise (projected) · Unflagged |
| Header | So What? (links to the start page) · Zip code field on place and About pages, from medium width up |
| Share button (falls back to copying the link) | Share · after copying: "Link copied" |
| List, more places | Show 20 more |
| Share image | {place} ({kind}), then the top risk as "{Risk} — {Level}" with its So What? sentence's first clause, so the level never appears without its scope |

---

## 9. Worked examples

**The demo video's stop.** A heat-flagged bus stop at the 94th percentile, with a trend (numbers illustrative):

> **This neighborhood traps more heat from pavement and buildings than 94% of LA County neighborhoods. A long summer wait in direct sun can cause heat illness, especially for older riders.**
> *Projected* — And it's getting hotter: this area is projected to go from about 6 to 20 extreme-heat days a year by mid-century.
> Urban Heat Island Index: 94th percentile in LA County
> **High**
> Source: CalEPA Urban Heat Island Index · Projection: Cal-Adapt LOCA2, SSP2-4.5, {baseline} vs. {future}
> *On hot days, cooling centers are open across LA County. Find one near you →*

**A coastal park with nothing flagged** (storm version, numbers illustrative):

> Not flagged in current data for air pollution, heat or wildfire.
>
> **By mid-century, with about 1 foot of sea level rise, a typical winter storm could flood this park. The park may close on those days.**
> *Projected*
> USGS CoSMoS: 1 ft sea level rise, annual storm · OPC Intermediate scenario, {period}
> *See how rising seas and storms could affect the coast near you →*

---

## 10. Messages: loading, empty and error states

Every state in the [states and edge cases review](../resilience/2026-09-28-so-what-states-and-edge-cases.md) that shows words, as applied in spec rev. 10 (§7.4–7.6, §10.1). Where the spec previously had wording, the change and the reason are noted.

**Rules for these messages** (the five principles, applied):
- Say what happened, then what the person can do. Every message has a way forward: a retry, another entry action, or a filter to turn on.
- Never blame the person ("Invalid zip"). Never promise a time ("in a few minutes") we can't keep.
- "Flagged" means `elevated` or above in current data, or a sea-level-rise flag. It's the word the panel and the "Unflagged" filter already use, so it's safe to reuse. "Not flagged" never becomes "safe" or "low-risk" (§2).
- No "Oops", "Uh oh" or "Something went wrong." Name the thing that isn't working.
- Loading is shown, never announced. Results and errors are announced once, in the polite live region.
- `{n}` uses the plural helper ("1 place", "2 places"). `{types}` joins the in-sentence risk names (§8) with commas and "and" ("heat, air pollution and wildfire"), reads "all risk types" when all four risks are on, and ends "and unflagged places" when Unflagged is on ("all risk types and unflagged places").
- **Unflagged places are never hidden silently.** When the Unflagged filter is off, the list says so under its heading (below), and the "nothing flagged near an entry point" messages, which are announced, end with *Unflagged places are hidden. Turn on "Unflagged" to see them.* Otherwise someone looking for their own stop can't tell it's hidden rather than missing.

### Entry: location

| State | Shown | Announced |
|---|---|---|
| Finding location (button text) | Finding your location… | — |
| Denied | Location is off, so here's an example place. You can also search by zip code. | Location is off. Showing an example: {place}. |
| Timed out or unavailable | We couldn't get your location, so here's an example place. You can also search by zip code. | Location unavailable. Showing an example: {place}. |
| Outside LA County | You're outside LA County, the only area So What? covers. Here's an example place to start. | Outside LA County. Showing an example: {place}. |
| Blocked in browser settings (hint under the button) | Location is blocked in your browser settings. | — |

*Replaces* the spec's single "So What? covers LA County — here's a place to start," which was wrong for people in LA who said no.

### Entry: zip code

Errors appear under the field and are announced with the same text.

| State | Text |
|---|---|
| Empty | Enter a 5-digit zip code. |
| Wrong format | Zip codes are 5 digits, like 90012. |
| Not found | We don't have {zip} as an LA County zip code. Try a nearby zip, or use your location. |
| Service unavailable | Zip search isn't working right now. Try again, or see an example place. |

*Replaces* "That zip isn't in LA County (yet)." "(Yet)" promises coverage outside LA that spec §2 rules out. The new wording is also true for PO-box-only zips inside LA, which have no area on the map.

### Nothing flagged near an entry point

Shown in the list's note area and announced; the map then moves to the nearest flagged place.

| Entry | Text |
|---|---|
| Location | Nothing is flagged right around you with these filters. The nearest flagged place is {place}, {distance} away. |
| Zip | Nothing is flagged in {zip} with these filters. The nearest flagged place is {place}, {distance} away. |
| Only sea level rise selected | Projected coastal flooding only affects places near the coast. The nearest is {place}, {distance} away. |

*Replaces* "No elevated risks right around you — nearest is X, 1.4 miles away." "Elevated" was wrong for sea-only filters, "around you" was wrong after a zip search, and "no risks" came close to "safe."

### "Places near here" list

| State | Text |
|---|---|
| Line under the heading (what distances are measured from) | Distances from your location. · Distances from {zip}. · Distances from the center of the map. · Distances from {place}. |
| Line under the heading, Unflagged off | Showing flagged places only. *(with a link-styled button: "Show unflagged too", which turns on the filter)* |
| Nothing flagged in view | No flagged places in view. These are the nearest. *(unchanged)* |
| Nothing flagged in view, only sea level rise selected | No projected coastal flooding in view. These are the nearest places near the coast. |
| Map outside LA County | This part of the map is outside LA County. These are the nearest LA County places. |
| No risk types selected | No risk types selected. Turn one on to see places. |
| Filters match nothing in the county | No places match these filters. Turn on more risk types. *(unchanged)* |
| Place panel's "Nearby places", none match | No other places nearby match these filters. |
| Show more (below the list) | Show 20 more *(hidden at 100 places, the cap)* |

### Filter announcements

| State | Announced |
|---|---|
| Places in view | Showing {n} places in view for {types}. |
| None in view | No places in view for {types}. The list shows the nearest. |
| None selected | No risk types selected. |

*Changes* the spec's "Showing {n} places for {types}" by adding "in view," so the count isn't heard as a county total.

### Loading

| Where | Text |
|---|---|
| Map placeholder | Loading map… |
| List refreshing, place opening | No text. The list dims and is marked busy; the link being opened shows a pending state. |

### Errors and unavailable data

| State | Shown | Announced |
|---|---|---|
| Place data unavailable (map and list) | Place data isn't loading right now. Try again later. **[Try again]** | Place data isn't loading right now. |
| Place page can't load (`<h1>`) | This place didn't load | — |
| Place page can't load (body) | Place data isn't loading right now. Try again later, or read about the data in the meantime. **[Try again]** **[About the data]** | — |
| Map background not loading (notice in the map area) | The map background isn't loading. Places and the list still work. | — |
| Offline | You're offline. The map and list will update when you reconnect. | You're offline. |
| Back online | *(notice disappears)* | Back online. |

*Changes* the spec's "Try again in a few minutes" to "Try again later." When the database's free quota runs out, it stays blocked until the monthly reset, so "a few minutes" could be a month.

### Not found (`/places/[slug]` with an unknown slug)

- **`<h1>`:** We can't find that place
- **Body:** The link may be mistyped, or the place may no longer be in our data.
- **Actions:** Go to the map · Show me an example

### Formatting helpers

| Value | Rule | Examples |
|---|---|---|
| Distance | Under 0.1: "less than 0.1 miles". Under 10: one decimal. 10 and up: whole numbers. Exactly 1: "mile". Never "mi". | less than 0.1 miles · 1 mile · 0.3 miles · 12 miles |
| Counts | Thousands separator | 1,234 places |
| Footer | Data date from `meta.build_date` | Data as of March 4, 2027. |

---

## 11. Pending questions

- **M1 decides:** the extreme-heat-day definition; whether fire gets a trend line and what its metric is; the sea-level-rise amount, CoSMoS layer, and whether `{condition}` is tides or a storm.
- **Consequence claims need citations too.** The spec cites the *data* on each card, but not claims like "children are more sensitive to heat" or "heat makes it harder for students to learn." Proposal: the About page lists one public-health reference per claim (for example EPA for fine particles, CDC for heat illness, and published research on heat and learning), stored in `sources`. Each claim should be checked before M6. If one can't be supported, cut it. The same applies to the sea-level-rise consequences ("service may be moved", "may close").
  - **Verified 2026-09-28** (each page checked against the claim it supports):

    | Claim | Used in | Citation |
    |---|---|---|
    | Children breathe more air relative to body weight than adults, and their lungs are still developing | air / playground | **Primary:** U.S. EPA / AirNow, *Air Quality Guide for Particle Pollution*, EPA-452/F-23-002 (Feb 2023): children and teenagers are at greater risk "because their lungs are still developing, and they breathe more air per pound of body weight than adults." **Supporting:** Brumberg HL, Karr CJ, et al.; AAP Council on Environmental Health. "Ambient Air Pollution: Health Hazards to Children." *Pediatrics* 2021;147(6):e2021051484. doi:10.1542/peds.2021-051484. Its wording is confirmed only through AAP's HealthyChildren.org summary; the journal page couldn't be fetched. |
    | Fine-particle pollution harms health over months to years, not just on bad days | air / bus_stop ("adds up over years") | U.S. EPA, *Integrated Science Assessment for Particulate Matter* (2019) and its 2022 supplement. EPA's plain-language summary ("Clinical Outcomes Related to Particulate Matter Exposure and Cardiovascular Disease"): breathing PM2.5 "over many years can lead to a range of cardiovascular effects… including atherosclerotic plaque progression and death." |
    | People with asthma are at greater risk from particle pollution; lighter and shorter activity reduces exposure | air / park | U.S. EPA / AirNow, *Air Quality Guide for Particle Pollution*, EPA-452/F-23-002 (Feb 2023). It lists people with lung disease, including asthma, as at greater risk and advises "Choose a less intense activity" and "Shorten your outdoor activities." "Exercising… breathe in more of it" is an inference from that advice, not a sentence the guide states. |
    | Heat reduces students' learning | heat / school | Park RJ, Goodman J, Hurwitz M, Smith J. "Heat and Learning." *American Economic Journal: Economic Policy* 2020;12(2):306–39. doi:10.1257/pol.20180612. Checked against the abstract only. |
    | Wildfire smoke's fine particles are its main health threat; limit time outdoors when smoke is present | fire / bus_stop | U.S. EPA, "Wildfire Smoke and Health" (last updated 2026-07-23). If you cite *Wildfire Smoke: A Guide for Public Health Officials* instead, use its current edition, not the 2019 revision. |
    | Fire hazard zones are mapped from vegetation (fuels), terrain and weather; fire burns faster up steep slopes; the maps show hazard, not risk | fire / park, playground, school; word list ("fire hazard zone") | CAL FIRE Office of the State Fire Marshal, "Fire Hazard Severity Zones" page. The OSFM page blocked automated fetching, so confirm the wording in a browser. The same statements appear in CAL FIRE's 2007 FHSZ fact sheet, which is too old to cite. |
    | Older adults and young children are at high risk for heat-related illness | heat / bus_stop ("older riders"), heat / playground | CDC, "Protect Yourself From the Dangers of Extreme Heat" (Climate and Health; last reviewed 2024-06-25). Not CDC's "Infants and Children and Heat" page, which doesn't make the sensitivity claim. |
    | Playground equipment and surfacing, including plastics and rubbers, can get hot enough to burn a child's skin | heat / playground | U.S. Consumer Product Safety Commission, Fact Sheet Publication 3200 (2012), "Burn Safety Awareness on Playgrounds: Thermal Burns from Playground Equipment". |
    | Floodwater can reach playgrounds and leave microbial contamination; sand, mulch and wood chips may need replacing; reopening is decided case by case | sea / playground | CDC, "Reopening Outdoor Public Spaces After Flooding" (Environmental Health Response and Recovery). |

  - Note: the sources say "young children" (CDC) and children 2 and under are most at risk of burns (CPSC). The heat/playground template says "children", which is broader. Adding "young" would take it to 31 words, so trim elsewhere if you want the narrower claim.
- **Showcase entries** (`showcase.yaml`) are hand-written by you and follow these same principles and word caps. They are where the writing becomes most specific, so they should be in your own words.
- **Academic honesty:** these templates were drafted with AI assistance. Cite that in a comment in `pipeline/templates.py` and in the README (spec §13).
- **Test with 3–5 people:** show a card and ask what it means for someone who uses that place. Watch for:
  - anyone reading "Low" as "safe";
  - confusion between Severe and Very High;
  - **anyone reading the trend or sea card as today's condition, or as certain.** If this happens, the "Projected" label isn't doing its job.
