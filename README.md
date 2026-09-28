# So What?

**Video Demo:** <URL HERE>

**Live site:** <URL HERE>

## Description

<!-- 2–3 paragraphs. What the site is, the problem it solves (climate data is too
abstract to answer "what does this mean for my bus stop?"), and who it's for.
Source: PRODUCT.md "Product Purpose", spec §1. -->

TODO

## How it works

<!-- A walkthrough from the user's side: open the map, pick a place, read its risks,
its "So What?", and the trend line. Mention the nearest-places list and the
Unflagged switch. Source: spec §7.4. -->

TODO

## Data

<!-- The sources and what each one contributes (air, heat, wildfire, sea level rise,
projections), how raw values become levels, and where the "So What?" text comes
from (templates plus hand-written showcase entries). Source: spec §5. -->

TODO

## Architecture

<!-- The Python pipeline builds a SQLite database, which is published to Turso and
read by the Next.js app through Drizzle. Say why the pipeline is offline and the
app is read-only. Source: spec §3, §8. -->

TODO

## Files

<!-- CS50 asks for what each file you wrote contains and does. Group by directory;
one or two sentences per file. Source: spec §4. -->

### `pipeline/`

TODO

### `web/`

TODO

### `data/`

TODO

## Design decisions

<!-- The choices you debated and why you made them. Pick the strongest few from
spec §14 (grid index vs. H3/PostGIS/R*Tree, templates vs. LLM text, places vs.
zip codes, today's conditions plus one trend line vs. projections only) and
write each in your own words. -->

TODO

## Testing

<!-- What's tested (pytest for the pipeline, validate.py integrity checks, app
tests) and how to run them. Source: spec §10.2, §11. -->

TODO

## Limitations

<!-- Short version of spec §15; the full list lives on the About page. -->

TODO

## Background

<!-- 1–2 sentences: working web developer from a bootcamp, took CS50 to fill in the
fundamentals, and how this project uses both. -->

TODO

## Acknowledgments and AI use

<!-- Required by CS50: which AI tools you used and for what (planning, spec and
design docs, specific code), and that the core work (geometry.py, grid.py,
spatial queries, nearest-neighbor search) is your own. AI-assisted code is also
cited in code comments. Credit data sources here too. Source: spec §13. -->

TODO
