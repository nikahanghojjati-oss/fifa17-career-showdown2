# Cloud brief · Handcrafted art prompts V1 (HO-061 + HO-062)

| Field | Value |
|---|---|
| Surface | claude.ai/code, Ultra Code (workflow) |
| Model / effort | Opus 5.5 · High |
| STOP_BUDGET | 90 minutes or about $30, whichever comes first (raised by Nik, 8 Nov 10:18 a.m. Eastern). At 80%, stop adding scope and commit. At 100%, stop. |
| Helpers | 12 subagents at most, in one workflow run. No second run. |
| Branch | `claude/handcrafted-prompts-v1`, cut from `origin/gameplay/r90`. Never push to main or gameplay/*. |
| Output | ONE ticket file plus up to 12 small guide pictures. No game code, no CSS, no new art pixels. |

## The one question
How do the Showdown backgrounds and Home icons stop looking prompted, and instead read as a handcrafted product two friends have built over years? Same heroes, same black-and-gold house, much more restraint and detail. Answer it with prompts Nik can run in ChatGPT image (Plus) in under 2 minutes each.

## Read first, in this order (repo paths; fetch each branch with an explicit refspec)
1. `leads/relay`: `project-documents/leads-relay/handoffs/HO-062/G_ANSWERS.md` and `HO-062/HUNT_LOOK.md`. These are Team G's no-AI-look bar. They are the law for this job.
2. `notes/handcrafted-look-brief`: `notes/HANDCRAFTED_LOOK_BRIEF_FOR_G_LEAD.md`.
3. `leads/relay`: `project-documents/leads-relay/handoffs/HO-061_*.md` (slogans, phone faces).
4. `gameplay/r90`: `docs/QUALITY_LEVELS.md`, and `visual-assets/v10_1/coordination/LIKENESS_IMAGE_WORKFLOW_V1.md`.
5. `factory/v1-wtt5ye`: `project-documents/factory/QUALITY_BAR.md`, `PRODUCT_TRUTH.md`, and the approved mockups in `project-documents/factory/mockups/` (NEXT_* desktop, PHONE_*_MARBLE phone).
6. The current plates: `gameplay/r90` `visual-assets/v10_1/plates-v2/`, `plates-v3/`, `plates-v5/`. Look at them; don't just list them.

## Fixed rules (never break)
- Daniel = Manager 1, always LEFT. Nik = Manager 2, RIGHT. Never mirror. Their likeness comes from the existing plates, attached as reference. Never describe a new face.
- Managers always stay on screens that have them. NO dim filters: no grey or dark overlay, blur, see-through or vignette. Lighting stays realistic.
- No words in any picture: no slogans, banners with text, subtitles, numbers, "CMS"/"FIFA 17" wordmarks or fake UI. CM17 only where it already lives on a prop. Banners are blank, or carry nothing.
- No real crests, league logos, sponsors or EA/FIFA art, and no player photos (the Marco Reus loading photo is the only exception and is not in scope). Crests: leave space; the page draws the flat patch crests.
- Colour: black and gold. Daniel's accents white/silver, Nik's gold. No bright blue, no sunny sky in a night scene, no sparkle storms, no light beams, no glossy plastic.
- Phone: faces at about 35% of a 390x844 screen, with a clean band at the top for the title. No scroll at 393x660, 360x640 and 375x553.
- Weights (Team G): desktop 1X 1536x864 ≤ 200 KB; 2X ≤ 450 KB (High and up only); phone 1179x2096 ≤ 250 KB plus a ~590 W copy ≤ 90 KB; icons ≤ 20 KB each with a 256 W copy. No 4K/8K for 2D screens. Prompts must ask for low-noise, calm areas so the files compress small.

## Scope (from Team G answer 3; change it only with a reason written in the ticket)
- New pictures: Home (desktop + phone), Connect Players, Legacy, Season Results / Final Winner (one trophy, one asset everywhere), Transfer War, Club Assignment, League.
- Quieter: Settings, Rule Book, Story, Career Statistics, Standings, Trophy Room. Here, decide between one calm, low-contrast dark-marble or dark-cloth surface with no scene, and keeping today's plate cleaned. Recommend one.
- Home icons: ONLY IF this brief's header says `ICONS: YES`. Then write one family: engraved gold on black marble, struck-medal low relief, one warm key light, same angle and line weight, no text, readable at 48 px; the same family later covers trophy cups and league marks. If `ICONS: NO`, leave icons out (Team G's W9 owns them in code).

ICONS: YES (Nik, 8 Nov 2026, 10:14 a.m. Eastern; Team G W9 stops its code icon redraw)

## Bounded work plan (workflow)
1. Study (≤ 7 helpers, in parallel, about one per new-picture screen plus one for the reading screens and one for icons): each takes its part and returns at most 8 short bullets: what reads as prompted, what to keep, and the one picture it needs.
2. Free-tool check (1 helper, web search, 10 minutes max): is any FREE image tool clearly better than ChatGPT image (Plus) for photo-real interiors that keep two real faces from a reference? Only recommend a switch with concrete evidence (a dated source). Otherwise say "stay on ChatGPT".
3. Write (1 helper): the ticket.
4. Review (≤ 3 helpers, by screen group): check every prompt against HUNT_LOOK rows L01-L34 and the fixed rules; fix it, or cut that prompt.

## The ticket file
`project-documents/factory/tickets/TICKET-HANDCRAFTED_V1.md`, at most 400 lines. Contents:
- A one-page answer to the question: the design language in plain words. Material, light, restraint, wear, one grammar.
- A table: screen → keep / new picture / quieter surface → why → which HUNT_LOOK rows it fixes.
- Total picture count; aim for 15 or fewer.
- For each picture: code, what to attach (existing plate/mockup paths), the exact prompt (likeness lock, no-invention block, bans list), the pass check, and one fix line. Write each prompt for a NEW normal ChatGPT chat outside any project.
- Plain words. Nik reads this on an iPhone. Use clickable GitHub links. Write "GPT-5.6 Sol" / "Sol Work mode" in full if named.

## Done
Ticket committed and pushed. `BUILD_RESULT.md` on the branch says time used, cost estimate, helper count, and anything cut for budget. Send the session link to Nik; Claude (Team V thread "Remove plate slogans and fix phone face crops") reviews it before Nik makes any picture.
