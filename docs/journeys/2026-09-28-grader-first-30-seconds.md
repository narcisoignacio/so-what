# Journey: A grader's first 30 seconds

**Date:** 2026-09-28
**Status:** Draft
**Related:** [So What? design spec](../superpowers/specs/2026-09-27-so-what-design.md) §1 (success criteria), §5.5 (showcase), §7.4 (entry flow), §12 (milestones)
**Diagram:** [2026-09-28-grader-first-30-seconds.html](2026-09-28-grader-first-30-seconds.html)

---

## 1. Problem statement

The spec's first success criterion is *"a grader outside LA can … understand a real LA place's risks within ~30 seconds."* That was written as if the grader opens the live site. In practice, a CS50 grader meets the project through the **3-minute demo video**, and the video is the only thing guaranteed to be seen. The live site is optional for them.

So the design question is:

> In the first 30 seconds of the video, can someone who has never been to Los Angeles say (a) what So What? does, (b) one concrete risk at one real place, and (c) that there's real CS work underneath?

**What gets in the way today:**
- CS50 requires a fixed opening section (title, name, GitHub and edX usernames, city and country, date). That uses about 5 of the 30 seconds before any content.
- The core idea only lands through *contrast*: abstract data versus a concrete consequence. The spec has no moment that shows the "before," so the "after" has nothing to be measured against.
- The viewer has no LA geography. Neighborhood names, freeway names and "the Valley" mean nothing to them.
- Graders often watch many videos in a row, sometimes at 1.5–2× speed. *(Assumption. Plan for it anyway.)*

## 2. Who is watching (kept separate, not blended into one persona)

| Viewer | What they bring | What they need from 0:00–0:30 | Served by this design? |
|---|---|---|---|
| **CS50 grader** | Watching many videos, possibly at 2×, possibly with sound off, not in LA. Checks the required opening and wants to know the scope. | The required card, the idea, and a signal that the project is substantial. | Yes, primary. |
| **Portfolio viewer** (future employer or peer, via the YouTube link or README) | Judging the author's skill. Likely to click through to the live site. | The idea, craft, and a reason to open the site. | Mostly. Beat 4 names the engineering. |
| **LA resident** | Wants to know about *their* place. | "Can I look up my stop?" | No. This is deferred to the product demo (~0:30–1:30). The live site's entry flow (§7.4) serves them. |

The three groups need different things. This journey optimizes for the first and accepts that the third waits.

## 3. The 30 seconds, beat by beat

A four-beat structure: **setup → abstraction → turn → scale.** The emotional curve is curiosity, then mild confusion (deliberate), then recognition, then "oh, it's everywhere."

### Beat 1 — Required card (0:00–0:05)

**On screen:** The CS50-required title card: *So What?*, name, GitHub and edX usernames, city and country, recording date. Put it over a dimmed, slow-drifting still of the LA County map so the product is visible from the first frame.
**Voice-over:** "This is So What?, my CS50 final project."

**Why it exists:** CS50 requires it. The design job is to keep it short and let it carry atmosphere. The card and the voice-over run in parallel, so nothing waits on the card.
**Why the map sits behind it:** the viewer's first image is the product, not a blank slide.

### Beat 2 — The abstraction (0:05–0:11)

**On screen:** A real, unedited row of the source data: a CalEnviroScreen record with its census tract ID and a percentile. Highlight one number.
**Voice-over:** "Climate data about LA usually looks like this: a census tract and a percentile. So what?"

**Why it exists:** This is the complication. Without seeing the raw form, the viewer can't see what the app changes. Ending the line on the product's name makes the title the question the rest of the video answers.
**Why real data:** it's honest (no manufactured tension; see §6), and it quietly shows that the author worked with the real source.

### Beat 3 — The turn: one place (0:11–0:22)

**On screen:** A cut to the live site on the **video place** (§4.1): the map centred on one bus stop, with the place panel open and one risk card in focus. The So What? sentence is the largest text in the frame and is also burned in as a caption. The source line is visible under it.
**Optional:** a 1–2 second photo of the actual stop taken by the author, just before the cut to the map. Nothing grounds "a place you'd actually stand" faster for someone who has never been there.
**Voice-over:** reads the card's So What? sentence nearly verbatim (§5).

**Why a bus stop:** everyone knows what waiting at a bus stop is like, in any city. It needs no LA knowledge, and it implies exposure (outdoors, waiting, no choice) without saying so. A playground is the second choice. Parks and schools are less vivid in one sentence.
**Why the voice-over matches the card:** sound-off and 2× viewers get the same message from the screen alone.

### Beat 4 — Scale and hand-off (0:22–0:30)

**On screen:** Zoom out from the stop to the county, where the pins merge into server-side clusters (§6.3). Show the real place count from `meta.row_count_places`.
**Voice-over:** "It does this for [N] bus stops, parks, playgrounds and schools across LA County, all from public data. Here's how it works."

**Why it exists:** It turns one example into a system, and "here's how it works" tells the grader that the CS content comes next. The zoom-out itself shows a spatial feature (clustering) without explaining it yet.

**Exit state at 0:30:** the viewer can say what the app does, name a risk at one place, and expects an explanation of the machinery. The rest of the video builds on that (§8).

## 4. What the product must provide for these 30 seconds to work

The video can only film what exists, so this journey puts requirements back on the spec.

### 4.1 Choose the "video place" early

- Criteria: a **bus stop**; **at least `high` on two risks, ideally all three**, and **heat among them**, since heat is the risk most easily felt by a non-LA viewer; a readable stop name; a `showcase.yaml` entry with a hand-written, cited So What?.
- It should also be the **featured starting spot** (§5.5), so the video and the live site's "Show me an example" tell the same story.
- **Spec change:** pick it at the end of **M1** (once real distributions exist), not in M6. The whole video depends on it, and its showcase entry should be written in M2 so it's tested like any other row.

### 4.2 Lead the risk card with the consequence

The schema orders `detail` before `so_what`, and the spec doesn't set a display order. For this beat the card must read top-down as:

1. **So What?** sentence (largest)
2. Specific risk (`detail`)
3. Level indicator (text label, not colour alone)
4. Source line

This is the product's thesis and it applies to the live site too, so it goes in §7 (RiskCard) as a stated rule rather than a video-only tweak.

### 4.3 Legible at 1080p and 2×

- The So What? sentence should be ≤ ~30 words so it fits a caption and can be read in ~1.5 s at 2×.
- Record the browser window at a size where panel text is still readable when the video is viewed at 720p.

### 4.4 A clean zoom-out

Beat 4 needs the cluster rendering (M3) to look settled when zooming out: no pin flicker and no half-loaded tiles. Record against production, in the same region, after warming the tile cache.

## 5. Voice-over draft

About 60 words spoken, for about 25 seconds at a natural pace. Detailed wording belongs to `/articulate`. Numbers in brackets must come from the real build.

> **[0:00]** This is So What?, my CS50 final project.
> **[0:05]** Climate data about LA usually looks like this: a census tract and a percentile. So what?
> **[0:11]** So What? pins that data to places you'd actually stand. *[card sentence, e.g.]* Riders here wait in one of the hottest [10%] of neighborhoods in LA County. Without shade, a summer wait can be a health risk, especially for older riders.
> **[0:22]** It does this for [N] bus stops, parks, playgrounds and schools across the county, all from public data. Here's how it works.

The heat wording depends on the heat source chosen in M1 (spec §5.1). If the source is a projection rather than a present-day index, the sentence has to change tense.

## 6. Honesty checks

- **Don't overstate precision.** The data describes the census tract, not the stop. The voice-over and card say "neighborhood(s)" and keep the source line visible. This matches Limitation §15.
- **No manufactured tension** (Intent anti-pattern catalog, Category 10). No wildfire stock footage, no alarm music, no disaster imagery. The contrast between Beat 2 and Beat 3 has to carry the story on its own.
- **Choosing the place isn't neutral.** Picking the most dramatic stop in a low-income neighborhood makes a real community the backdrop for a pitch. Prefer a stop the author knows or uses, name it plainly, and avoid negative words about the neighborhood itself. The spec rejected zip codes because they read like a report card (§14), and the same risk applies here.
- **Beat 2 must be real data, shown as it is,** not a mock-up made to look worse than the source.

## 7. How we'll know it works

**Test (cheap, before M7):** Show a rough cut of just 0:00–0:30 to 3–5 people who haven't been to LA. Have at least one watch at 2× and one with sound off. Stop at 0:30 and ask:

1. What does this app do?
2. Name one risk at the place you saw, and who it affects.
3. What do you expect the rest of the video to show?

**Pass:** at least 4 of 5 answer (1) and (2) correctly without prompting. Answers to (3) mention data or "how it's built."
**If it fails:** people failing (1) points to Beat 2 (the contrast isn't landing). People failing (2) points to the card hierarchy or caption (§4.2–4.3).

Five people is directional, not conclusive. It will catch the big problems, not settle close calls.

## 8. What comes after 0:30 (outline for context, not designed here)

| Time | Section | Purpose |
|---|---|---|
| 0:30–1:20 | Product demo | Geolocation fallback, zip search, filters, share link and OG preview. Serves the LA-resident viewer. |
| 1:20–2:30 | How it works | Pipeline, point-in-polygon, grid index, nearest-neighbor proof. The CS core. |
| 2:30–3:00 | Limits and close | Area-level data, snapshot date, sources, URL. |

## 9. Pending questions

- **Which stop?** Needs M1 data. Can the author photograph it?
- **Recorded voice-over or live narration?** A scripted voice-over is recommended for the first 30 s so it fits the timing.
- **Heat source** (spec §5.1) determines the Beat 3 wording.
- **Assumption to check:** that graders watch at speed or with sound off. The design holds either way, but if it's wrong the caption requirement matters less.
- **Hand to `/articulate`:** final So What? sentence and voice-over lines. **Hand to `/include`:** caption file (.srt, not auto-captions) and on-screen contrast.
