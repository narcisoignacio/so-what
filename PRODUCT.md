# Product

<!-- impeccable:product-schema 1 -->

Source of truth for behavior, data and copy is the [design spec](docs/superpowers/specs/2026-09-27-so-what-design.md) (rev. 12) and the [voice doc](docs/content/2026-09-28-so-what-voice-and-templates.md). This file records the durable product facts design work must respect; where they disagree, the spec wins and this file is updated.

## Platform

web

## Stack

Decided in the spec (§3, §7, §8): Next.js App Router on Vercel Hobby, Turso Cloud (SQLite) through Drizzle ORM, Leaflet for the map, a Python ETL pipeline that builds the database. Deployed on a subdomain of the author's personal domain, on free tiers.

## Users

- **CS50 graders and demo-video viewers.** Most are not in Los Angeles and have no local knowledge. They open the site (or watch the video) once and must understand a real LA place's risks within about 30 seconds.
- **LA County residents** who find the public site and look up places they use: their bus stop, their kid's school or playground, their park.

**Priority changes at the submission deadline (2027-06-30 4:59 PM PDT):**
- **Until then:** graders come first and residents second. When the two pull in different directions, the graders win.
- **After it passes:** residents become the primary users. The 30-second test stays in place as the bar for anyone new to the site, but it no longer overrides what residents need.

Design choices that favor graders (a featured example, video-friendly copy) should be ones that still work for residents or are easy to change after the deadline.

## Product Purpose

Climate data is too abstract for most people: county projections and percentile scores don't answer "what does this mean for the bus stop I wait at, and is it getting worse?" So What? is an interactive map of LA County that pins everyday places (bus stops, parks, playgrounds, schools) and, for each, states the specific climate-related risk and its "So What?": the concrete human consequence.

Success means:
- a grader outside LA understands a real place's risks within ~30 seconds;
- every claim on a card traces to a cited public source;
- every task (find a place, read its risks, filter, share) works by keyboard alone and with a screen reader, without the map;
- a place's URL shares with a meaningful preview;
- hosting stays on free tiers with no user-visible cold start.

## Positioning

- **Places, not areas.** It pins specific, everyday places instead of shading zip codes or tracts. Places are what make the consequence land.
- **Consequence first.** The "So What?" sentence is the most prominent thing on every card; the level, metric and source support it, not the other way round.
- **Works without the map.** The "Places near here" list, the place panel's "Nearby places", zip search and filters make every task possible without the map. The map is optional; the list is not.

## Operating Context

- Graders meet it through the ≤3-minute demo video and a single visit, often at 2× speed; card text must work as one caption line.
- Residents arrive from a shared place link (often on a phone, from social media or a message) or search by zip or location.
- Entry points: "Use my location", zip search, "Show me an example" (the featured bus stop).
- Data is a snapshot rebuilt by hand; the footer shows "Data as of {build date}". The UI says "current data", never "today".

## Capabilities and Constraints

- **Scope:** LA County only; four place kinds (`bus_stop`, `park`, `playground`, `school`); four risks: Air pollution, Heat, Wildfire (levelled from current data: low / elevated / high / severe) and Sea level rise (projection-only, flagged as "Projected", never levelled).
- **Today first, then the trend:** levels come only from current data; climate-worsening risks add one projected-change line (heat, and wildfire if M1 confirms data). Projections never set a level, visibility or filter.
- **Risk names** are fixed: "Air pollution", "Heat", "Wildfire", "Sea level rise", used identically in filters, chips, lists and messages.
- **Card order** (DOM and visual): heading with risk + level → So What? sentence → trend line (labelled "Projected" first) → detail → source → tip. Details in spec §7.4.
- **Unflagged switch** (off by default) on every places-list heading and in the legend; unflagged places are never hidden without saying so.
- **Text limits:** `so_what` ≤ 30 words, trend line ≤ 25 words, enforced by the pipeline.
- **Out of scope:** accounts or user data, areas outside LA County, inland flooding, languages other than English, LLM-generated text, area-shading (choropleth) views, live data.
- **Undecided:** tile provider (chosen in M0); CVD-safe pin palette, typography and overall visual direction (visual design pass); featured place (end of M1); wildfire trend line (M1).

## Brand Commitments

- **Name:** "So What?" (with the question mark).
- **No logo or wordmark exists.** Don't invent one without asking.
- **Glyphs decided:** risk icon set #15 from the [risk icon exploration](docs/design/risk-icons.html) (air: wind with particles; heat: thermometer; wildfire: rounded flame; sea level rise: waves under a dashed level line) on a 24-unit grid, 1.75 round stroke, `currentColor`; plus the three-slot level meter. Both are `aria-hidden` and always paired with words. One refinement pass is still owed (thermometer ticks cramped at 16px).
- **Voice** (voice doc §1): concrete, not clinical; honest about scale, time and certainty; describe conditions, not communities; calm, with something to do; plain enough to read at a glance. No alarm words, no exclamation marks, never "will" for projections, never calls a place safe.

## Evidence on Hand

- Public data sources only (CalEnviroScreen 4.0, CAL FIRE hazard zones, CalEPA Urban Heat Island Index, Cal-Adapt LOCA2, OPC sea-level guidance, USGS CoSMoS, Census TIGER/ZCTA, LA Metro GTFS, CDE schools, OpenStreetMap); each confirmed in M1.
- Written content: templates, tips, messages and verified health-claim citations in the voice doc; ~15–20 hand-written showcase entries to come in M6.
- Planning artifacts: [wireframes](docs/wireframes/), [journey](docs/journeys/), [accessibility review](docs/accessibility/), [resilience review](docs/resilience/), [UX evaluation](docs/evaluation/).
- **Absent, and must not be fabricated:** testimonials, users, usage numbers, press, partner or official endorsements. The site is not an official hazard assessment.

## Product Principles

1. **The consequence is the product.** If a design choice makes the So What? sentence less prominent than a metric, badge or map, it's wrong.
2. **Thirty seconds, no local knowledge.** A viewer who has never been to LA must get it from one place and one card.
3. **Honest about scale, time and certainty.** Present and projected are never visually or verbally confused; area data is never dressed as a site measurement.
4. **The map is a convenience, not the path.** Nothing is reachable only by pointer or only by sight.
5. **Every stated risk comes with a next step,** and nothing is ever declared safe.

## Accessibility & Inclusion

- **WCAG 2.2 AA**, part of the baseline tier, not an add-on ([accessibility review](docs/accessibility/2026-09-28-so-what-accessibility-review.md), spec §7.5).
- Colour is never the only signal: levels use the level meter and words; pins use a CVD-safe sequential palette (not red/green) with a halo and 3:1 contrast on light and dark tiles.
- Reflow at 320 CSS px / 400% zoom with a list/map toggle; base text ≥ 16px; touch targets ≥ 24px (44px for primary buttons); visible 2px+ focus rings; reduced motion removes fly/zoom animation.
- 8th-grade reading level, written for screen readers, video captions and readers whose first language isn't English.
- English only, stated as a limitation, because many residents in the most affected neighborhoods speak Spanish at home and machine-translated health claims aren't acceptable.
