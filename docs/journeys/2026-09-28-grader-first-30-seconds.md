# Journey: A grader's first 30 seconds

**Date:** 2026-09-28 (updated for spec rev. 7: today first, then the trend)
**Status:** Draft
**Related:** [So What? design spec](../superpowers/specs/2026-09-27-so-what-design.md) §1 (intent and success criteria), §5.5 (text and featured place), §7.4 (card order), §12 (milestones) · [voice and templates](../content/2026-09-28-so-what-voice-and-templates.md)
**Diagram:** [2026-09-28-grader-first-30-seconds.html](2026-09-28-grader-first-30-seconds.html)

---

## 1. Problem statement

The spec's first success criterion is *"a grader outside LA can … understand a real LA place's risks within ~30 seconds."* That was written as if the grader opens the live site. In practice, a CS50 grader meets the project through the **3-minute demo video**, and the video is the only thing guaranteed to be seen. The live site is optional for them.

So the design question is:

> In the first 30 seconds of the video, can someone who has never been to Los Angeles say (a) what So What? does, (b) one concrete risk at one real place, (c) that climate change is making it worse there, and (d) that there's real CS work underneath?

Point (c) is new since spec rev. 6. The app's intent is climate change: today's conditions make the card believable, and the projected trend makes it a climate story. The video has to land both.

**What gets in the way:**
- CS50 requires a fixed opening section (title, name, GitHub and edX usernames, city and country, date). That uses about 4 of the 30 seconds before any content.
- The core idea only lands through *contrast*: abstract data versus a concrete consequence. Without a "before," the "after" has nothing to be measured against.
- The viewer has no LA geography. Neighborhood names, freeway names and "the Valley" mean nothing to them.
- There are now two ideas to land (today, then the trend) in the same 30 seconds, which leaves no room for slack in the voice-over.
- Graders often watch many videos in a row, sometimes at 1.5–2× speed. *(Assumption. Plan for it anyway.)*

## 2. Who is watching (kept separate, not blended into one persona)

| Viewer | What they bring | What they need from 0:00–0:30 | Served by this design? |
|---|---|---|---|
| **CS50 grader** | Watching many videos, possibly at 2×, possibly with sound off, not in LA. Checks the required opening and wants to know the scope. | The required card, the idea, and a signal that the project is substantial. | Yes, primary. |
| **Portfolio viewer** (future employer or peer, via the YouTube link or README) | Judging the author's skill. Likely to click through to the live site. | The idea, craft, and a reason to open the site. | Mostly. Beat 5 names the engineering. |
| **LA resident** | Wants to know about *their* place. | "Can I look up my stop?" | No. This is deferred to the product demo (~0:30–1:20). The live site's entry flow (spec §7.4) serves them. |

The three groups need different things. This journey optimizes for the first and accepts that the third waits.

## 3. The 30 seconds, beat by beat

Five beats: **setup → abstraction → today → the turn → scale.** The emotional curve is curiosity, then mild confusion (deliberate), then recognition ("I know what waiting at a hot bus stop is like"), then concern ("and it's getting worse"), then "oh, it's everywhere."

The turn used to be seeing the place. Now the place is the **recognition** beat, and the **trend line is the turn**. That puts the climate story at the one moment built to be remembered.

### Beat 1 — Required card (0:00–0:04)

**On screen:** The CS50-required title card: *So What?*, name, GitHub and edX usernames, city and country, recording date. Put it over a dimmed, slow-drifting still of the LA County map so the product is visible from the first frame.
**Voice-over:** "This is So What?, my CS50 final project."

**Why it exists:** CS50 requires it. The design job is to keep it short and let it carry atmosphere. The card and the voice-over run in parallel, so nothing waits on the card.

### Beat 2 — The abstraction (0:04–0:08)

**On screen:** A real, unedited row of the source data: the heat island index record for the featured stop's census tract, with its tract ID and percentile. Highlight the percentile.
**Voice-over:** "Climate data usually looks like this. So what?"

**Why it exists:** This is the complication. Without seeing the raw form, the viewer can't see what the app changes. The screen shows what "this" is (a tract ID and a percentile), so the voice-over doesn't have to list it. Ending on the product's name makes the title the question the rest of the video answers.
**Why the heat record, and real data:** it's the same risk the next two beats are about, so the before-and-after is exact. Real data is honest (no manufactured tension; see §6), and it quietly shows that the author worked with the real source.

### Beat 3 — Today: one place (0:08–0:17)

**On screen:** A cut to the live site on the **featured place** (spec §5.5): the map centred on one bus stop, the place panel open, the heat card in focus. Its So What? sentence is the largest text in the frame. The source line is visible under it.
**Optional:** a 1–2 second photo of the actual stop taken by the author, just before the cut to the map. Nothing grounds "a place you'd actually stand" faster for someone who has never been there.
**Voice-over:** "At this bus stop, the neighborhood traps more heat than 94% of LA County neighborhoods. A long summer wait can cause heat illness."

**Why a bus stop:** everyone knows what waiting at a bus stop is like, in any city. It needs no LA knowledge, and it implies exposure (outdoors, waiting, no choice) without saying so.
**Why the voice-over is shorter than the card:** the full card sentence is 30 words, and the beat has room for about 23 at a pace people can follow. The voice-over keeps the meaning (and the word "neighborhoods," which carries the honesty about scale) and drops only detail the viewer can read on the card. The burned-in caption shows the **spoken** words, so sound-off viewers get the same message.

### Beat 4 — The turn: it's getting worse (0:17–0:24)

**On screen:** The heat card's trend line comes into focus. The "Projected" label is clearly visible, and the trend sentence is captioned.
**Voice-over:** "And it's projected to get hotter: from about 6 extreme-heat days a year to 20 by mid-century." *(numbers from the real build)*

**Why it exists:** It turns a local hazard into a climate story, which is the app's intent. It comes after today's condition, not before, because the viewer has to believe the present before a projection means anything.
**Why "projected" is spoken:** it's the honest word, and it costs one word. Without it, the voice-over would state a model output as fact.

### Beat 5 — Scale and hand-off (0:24–0:30)

**On screen:** Zoom out from the stop to the county, where the pins merge into server-side clusters (spec §6.3). Show the real place count from `meta.row_count_places` on screen. As the view passes the coast, outlined "projected flooding" pins are visible for a moment. That's a visual preview of sea level rise, which the voice-over doesn't mention here.
**On-screen text:** the place count and the four kinds, e.g. "[N] bus stops, parks, playgrounds and schools."
**Voice-over:** "Across LA County, thousands of places. Here's how it works."

**Why it exists:** It turns one example into a system, and "here's how it works" tells the grader that the CS content comes next. The zoom-out itself shows a spatial feature (clustering) without explaining it yet.
**Why the kinds are on screen rather than spoken:** listing all four took the beat to 180 words a minute. Text on screen carries them without crowding the voice-over.
**Why "thousands" rather than "every":** the bus stops are LA Metro's. Other operators' stops aren't included, so "every" would overclaim. The exact number is on screen.

**Exit state at 0:30:** the viewer can say what the app does, name a risk at one place and how it's changing, and expects an explanation of the machinery. The rest of the video builds on that (§8).

## 4. What the product must provide for these 30 seconds to work

The video can only film what exists, so this journey puts requirements back on the spec. Items 4.1 and 4.2 are now in the spec (rev. 5–7).

### 4.1 The featured place (spec §5.5)

- A bus stop, at least `high` on two of today's risks, one of them heat, **with a heat trend line**. It is also the site's featured starting spot, so the video and "Show me an example" tell the same story.
- Chosen at the end of **M1**. Its showcase entry is written and cited in M2.
- Beat 2 needs that stop's own heat island record, so capture it when you choose the stop.

### 4.2 Card order (spec §7.4)

So What? sentence → trend line (labelled "Projected") → detail → level label → source line. Beats 3 and 4 film that order top to bottom, so the camera never has to jump around the card.

### 4.3 Legible at 1080p and 2×

- The So What? sentence (≤ 30 words) and the trend line (≤ 25 words) must each read in a couple of seconds at 2×.
- Record the browser window at a size where panel text is still readable when the video is viewed at 720p.
- The "Projected" label must be legible on its own in the frame. It's what keeps Beat 4 honest for viewers who have the sound off.

### 4.4 A clean zoom-out

Beat 5 needs the cluster rendering (M3) to look settled when zooming out: no pin flicker and no half-loaded tiles. The outlined sea-level pins must be visible at the zoom level the camera passes through, or the coastal preview is lost. Record against production, in the same region, after warming the tile cache.

## 5. Voice-over script

66 words for 30 seconds. No beat is faster than about 150 words a minute (checked by script), which is brisk but easy to follow. The final sentence texts come from the [voice and templates](../content/2026-09-28-so-what-voice-and-templates.md) doc. Numbers in the script are illustrative and must come from the real build.

| Time | Voice-over | Words | Pace (wpm) |
|---|---|---|---|
| 0:00 | This is So What?, my CS50 final project. | 8 | 120 |
| 0:04 | Climate data usually looks like this. So what? | 8 | 120 |
| 0:08 | At this bus stop, the neighborhood traps more heat than 94% of LA County neighborhoods. A long summer wait can cause heat illness. | 23 | 153 |
| 0:17 | And it's projected to get hotter: from about 6 extreme-heat days a year to 20 by mid-century. | 17 | 146 |
| 0:24 | Across LA County, thousands of places. Here's how it works. | 10 | 100 |

**If a rehearsal runs long,** shorten Beat 3's second sentence to "Summer waits can cause heat illness." Don't cut "projected," "about," or "neighborhoods": they're what keep the script honest.

## 6. Honesty checks

- **Don't overstate precision.** The heat data describes the census tract, not the stop. The voice-over says "neighborhoods," and the source line stays visible. This matches spec §15.
- **Don't state projections as fact.** Say "projected," "about" and "by mid-century." Never "will" or a specific year. Show the "Projected" label in frame. The scenario and periods are on the card's source line for anyone who pauses.
- **No manufactured tension** (Intent anti-pattern catalog, Category 10). No wildfire stock footage, no alarm music, no disaster imagery, and no flood imagery over the coastal pins. The before-and-after contrast and the trend have to carry the story on their own.
- **Choosing the place isn't neutral.** Picking the most dramatic stop in a low-income neighborhood makes a real community the backdrop for a pitch. Prefer a stop the author knows or uses, name it plainly, and avoid negative words about the neighborhood itself. The spec rejected zip codes because they read like a report card (§14), and the same risk applies here.
- **Beat 2 must be real data, shown as it is,** not a mock-up made to look worse than the source.

## 7. How we'll know it works

**Test (cheap, before M7):** Show a rough cut of just 0:00–0:30 to 3–5 people who haven't been to LA. Have at least one watch at 2× and one with sound off. Stop at 0:30 and ask:

1. What does this app do?
2. Name one risk at the place you saw, and who it affects.
3. Is that risk changing? How sure is that?
4. What do you expect the rest of the video to show?

**Pass:**
- At least 4 of 5 answer (1) and (2) correctly without prompting.
- At least 4 of 5 say the risk is getting worse **and** describe it as a projection or estimate rather than a certainty. Someone saying "it *will* be 20 days" is a partial fail: the trend landed, but the honesty didn't.
- Answers to (4) mention data or "how it's built."

**If it fails:**
- (1) failing points to Beat 2 (the contrast isn't landing).
- (2) failing points to the card hierarchy or caption (§4.2–4.3).
- (3) failing points to Beat 4. Either the trend isn't registering (the timing is too fast), or the "Projected" label isn't visible enough.

Five people is directional, not conclusive. It will catch the big problems, not settle close calls.

## 8. What comes after 0:30 (outline for context, not designed here)

| Time | Section | Purpose |
|---|---|---|
| 0:30–1:20 | Product demo | Geolocation fallback, zip search, filters, a coastal place with a sea-level-rise card, share link and OG preview. Serves the LA-resident viewer. |
| 1:20–2:30 | How it works | Pipeline, point-in-polygon (tracts, fire zones, flood extents), grid index, projection-grid join, nearest-neighbor proof. The CS core. |
| 2:30–3:00 | Limits and close | Area-level data, projections as one scenario, snapshot date, sources, URL. |

## 9. Pending questions

- **Which stop?** Needs M1 data. Can the author photograph it?
- **Recorded voice-over or live narration?** A scripted voice-over is recommended for the first 30 s, because the timing now has no slack.
- **Rehearse the script against a stopwatch** before recording the screen capture. If it runs over 30 s, apply the cut in §5 first.
- **Beat 1 is 4 seconds.** Check that the required card can be read in that time. If not, let it overlap the start of Beat 2 rather than slowing the voice-over.
- **Assumption to check:** that graders watch at speed or with sound off. The design holds either way, but if it's wrong the caption requirement matters less.
- **Hand to `/include`:** caption file (.srt, not auto-captions), on-screen contrast, and whether the "Projected" treatment is distinguishable without colour.
