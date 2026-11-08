# Brief · Handcrafted art prompts V2: rich, not plain (follow-up to V1)

| Field | Value |
|---|---|
| Who | New Team V project thread, Opus 5.5, effort MAX, one Ultra Code workflow (Nik's ask, 8 Nov 2026 3:28 p.m. Eastern) |
| Budget | STOP at about 2 hours or about $50, whichever comes first. At 80%, stop adding scope and commit. At most 12 helpers in one run. |
| Branch | `claude/handcrafted-prompts-v2`, cut from `origin/claude/handcrafted-prompts-v1` |
| Output | `project-documents/factory/tickets/TICKET-HANDCRAFTED_V2.md` (≤450 lines) + `project-documents/factory/reviews/HANDCRAFTED_V2/BUILD_RESULT.md`. Text only. No game code. |

## Why this job exists
V1 ("One House, built as a set") fixed the AI tells, but it did that by emptying the rooms: bare stone walls, one lamp, nothing else. Nik's verdict on the first results: **plain empty rooms are a downgrade.** He wants the screens to feel rich, lived-in and premium, with objects that make sense in each room, and still never look like cheap AI pictures. He also said: **no hanging pendant lamps in view** (they look bad), from now on.

## Do NOT redo
Keep everything V1 got right: the One House idea (one clubhouse, one night, rooms per screen), the materials list, real light sources, the men-lock and phone guide method, the gates, the weights, the screen-by-screen map, the free-tool check (stay on ChatGPT), and the HO-066 rows. Read V1's ticket, BUILD_RESULT and the studies; reuse them, do not re-study what they already cover.

## The one question
How do we put the right objects back into each room, so it reads as a real, rich, expensive clubhouse photographed for a magazine, instead of either (a) an empty showroom or (b) an AI poster with gold everywhere? And how do we prompt ChatGPT image so it renders those objects with real detail and no AI look?

## Read first
1. `claude/handcrafted-prompts-v1`: `project-documents/factory/tickets/TICKET-HANDCRAFTED_V1.md`, `project-documents/factory/reviews/HANDCRAFTED_V1/BUILD_RESULT.md`. Project files: `factory/handcrafted/STUDIES_V1.json`.
2. `leads/relay`: `project-documents/leads-relay/handoffs/HO-062/G_ANSWERS.md` and `HUNT_LOOK.md` (Team G's AI-tell list; still the law).
3. The V1 results so far, on `claude/project-thread-kxgun9` in `project-documents/factory/reviews/HC/`: HC01 (approved Home lounge), HC02 (phone), HC03 (stone slab), and the two HC04 board-room tries (A without lamps, B with pendant lamps that Nik rejected). Look at them.
4. The old rich plates Nik liked for their life and character: `gameplay/r90` `visual-assets/v10_1/plates-v2/` (Home, Legacy, Trophy Room, Transfer, League). Name what made them feel alive and what made them look AI, and keep the first.
5. `factory/v1-wtt5ye`: `project-documents/factory/QUALITY_BAR.md`, `PRODUCT_TRUTH.md`.

## Fixed rules (never break)
- Daniel LEFT, Nik RIGHT, never mirrored; faces come from approved pictures, never described anew. Managers always stay.
- No dim filters (no grey/dark overlay, blur, vignette, see-through). Realistic light.
- No words in pictures (no slogans, banners with text, numbers, wordmarks, fake UI); no real crests, league logos, sponsors, EA/FIFA art, player photos, real trophy shapes.
- Black and gold house; no bright blue, no sparkle storms, light beams, LED strips, glossy plastic, mirror floors. **No hanging pendant lamps in view.**
- Keep the calm zones the page needs (title band, panel areas, the empty column where the page draws the wheel, packs or cup), and Team G's weights (desktop 1X ≤200 KB, 2X ≤450 KB, phone ≤250 KB + 590 W ≤90 KB). Richness goes AROUND those zones, not over them.

## What the ticket must contain
- A short plain-words answer: the "rich but real" grammar. For example: a few hero objects per room with a reason to be there, real wear and use, layered depth (foreground, mid, back), believable clutter only where people would leave it, real reference language (interior photography, specific objects and brands-free materials), and how many objects is too many.
- Per room (lounge, tunnel, directors' box, office, board room, archive): an object list (what, where in frame, why it belongs, which calm zone it must avoid), and what makes each one look handmade, not generated.
- New prompts for every HC picture still to run (HC 04-14, and HC 01/02 redone only if the grammar says Home is too empty; say so and why). Same format as V1: attach, prompt, pass check, fix line. The V1 house paragraph and ban list stay; add the object layer.
- For Home (HC 01) give 2 richness levels (medium, rich) so Nik can pick the level on one picture before the rest run.
- A short "how to prompt ChatGPT image for detail" section, with dated sources only if web search is used.

## Work plan (one workflow)
1. Study (≤5 helpers): old rich plates vs V1 results; object grammar per room group; GPT-image prompting for rich detail.
2. Design (≤3): three object-grammar proposals; 1 judge picks or merges.
3. Write (1) the ticket; check (≤2) every prompt against HUNT_LOOK, the fixed rules and the calm zones.

## Done
Ticket + BUILD_RESULT (time, cost estimate, helpers, anything cut) pushed. Message the Team V thread "Remove plate slogans and fix phone face crops" with the branch and SHA; Claude there reviews it before Nik makes any picture.
