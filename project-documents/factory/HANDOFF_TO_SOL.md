# Handoff to GPT-5.6 Sol: Team V visual package (job 239)

From: Claude (Team V visual lead). To: GPT-5.6 Sol. Date: 04 Oct 2026. Branch `factory/v1-wtt5ye`; draft tracker PR #311 is never merged. Nothing in this package is on main and no step here touches main.

Start with `project-documents/factory/PACKAGE.md`: it lists every screen, folder, shared kit piece, asset pointer and known gap.

## What is ready

- Fifteen screens built to Nik's mockups under `visual-assets/v10_1/`: Home, League, Club, Transfer (Transfer War), Loading, Trophy Room, Career Statistics, Rivalry Statistics, Legacy (History), Season Results, Final Winner, Start / Join, Standings, Rule Book, Settings.
- Shared kit: tokens, type, UI parts, stage and motion, fonts, the top navigation (5 tabs plus settings icon, `shared/navbar/NAV_CONTRACT.md`), the system plate, and Home tile art.
- A showcase (`showcase/index.html`) that opens every screen from one place, and screens that render Team G's model-true fixtures (`shared/fixtures/data-contract-v1/`, contract in `project-documents/factory/DATA_CONTRACT_V1.md`).
- Quality gate: every job was scored on real screens against `QUALITY_BAR.md` (pass average 4.2 or more, nothing under 3). Scores are in each `<screen>/review/REVIEW.md`.
- Original crests (CREST-V1) and league marks V2; no real logos, trophies or players, except the one allowed Marco Reus Loading photo with its CC BY 2.0 credit (OWNER-4).

## What must go through POS20 to reach main

Per `AGENTS.md`, POS20 governs every change meant for main. Before any mutation, resolve live main, open PRs, the POS20 candidate and recovery refs, exact-head checks and reviews; recorded heads here are observations only. Nothing here earns SSJR or MDP credit.

1. **Screen integration.** Each screen is currently a standalone folder fed by its own `fixtures.json`. Moving them into the live app means wiring each to real state through the top navigation locks (`nav.locked`, `nav.reason`), under the existing storage, private scope, pairing and ACTIVE rules. Team G's relay (V2G / G2V, tracker PR #312) says which screens are wireable; V2G-012 says every screen is.
2. **Data candidate.** Team G owns History data (closed Showdowns, no backfill). The fixtures in `shared/fixtures/data-contract-v1/` are the agreed shape; a live data candidate must come from Team G, not from this package.
3. **Startup budget.** Startup JS is near its gzip budget, so visual code must lazy-load per screen.
4. **Loading photo.** `assets/marco-reus-2015-cc-by.webp` lives on main, not on this branch; keep its credit line and both links.
5. **Guards stay as they are.** Billing OFF, Firebase Spark only, Firestore memory-only, popup-only Google Auth, exactly two private managers, Candidate C alone owns destructive Apply. Visuals add no new storage or network paths.
6. **Order.** Final package review (job 108, Codex) and final fixes (job 109) come first, then Nik's approval of `showcase/APPROVAL.html`, then a full two-player play-through, then Nik's OK to merge.

## Open questions

- Does Team G want screens wired one at a time or as one integration PR?
- League, Club and Versus brush wordmarks and the Start / Join title picture were never made; accept the font stand-ins, or make the pictures first?
- Which main commit is the integration base once POS20 is active?
- Phone and 1366x640 leftovers listed in PACKAGE.md "Known gaps": fix before integration or after?

## Not done here

- No hashes were recomputed; use each asset folder's `intake_report.md` / `phone_intake.md`.
- `showcase/APPROVAL.html` was still being built by jobs 110, 236 and 237 when this was written.

## Music

The Home soundtrack is `home/soundtrack.js`, with 4 Audius tracks whose ids are in `home/fixtures.json` under `strings.media`. At integration it must keep playing across screens. Main's 6 YouTube songs and the FIFA 17 trailer are not carried over (owner's decision, 04 Oct 2026).
