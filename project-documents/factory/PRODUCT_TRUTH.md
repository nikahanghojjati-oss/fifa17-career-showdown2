# Product truth for factory workers

This page is binding. When a mockup and this page disagree, this page wins. When this page and the live product on `main` disagree about behaviour, `main` wins and you write the difference into your status file as a NOTE.

You never ask Nik product questions. If something is genuinely undecided, mark your status BLOCKED and write the exact question there. Claude answers it.

## 1. Who is who

- Two managers only: **Daniel = Manager 1**, **Nik = Manager 2**.
- **Daniel always stands on the LEFT, Nik always on the RIGHT.** Every screen, every card, every table column, every phone layout (on phone: Daniel first/top or left).
- **Never mirror character art.** A flipped photo turns a real person's face into a stranger. If a composition "needs" Daniel on the right, the composition is wrong.
- Daniel's look: black curly hair, light beard, charcoal pinstripe suit, open white shirt. Nik's look: short dark hair, full beard, dark suit, black shirt, black tie, wristwatch. Never invent other outfits on new art unless the job says so. No brand logos on any shirt.
- The handwritten tags in the mockups ("Daniel · Skill. Vision. Magic.", "Nik · Tactics. Discipline. Progress.") are allowed decorative brand text.

## 2. Scoring (OWNER-5, never change it)

| Achievement | Points |
| --- | --- |
| Champions League winner | 5 |
| League title | 3 |
| Domestic cup winner | 1 |
| 100 league points and/or 100 league goals (one shared performance bonus) | max 1 |
| Top scorer and/or top assist (one shared awards bonus) | max 1 |
| **Maximum season score** | **11** |

- Season winner tie-break: higher league position, then league points.
- The final Showdown winner is decided by **total Showdown points only** (season tie-breaks are not used for the final total; equal totals = draw).
- Trophy counts = wins (each title won is one trophy).
- The app **computes** the season score. The user never types it. (The Season Results mockup shows Daniel 9 but its own ticks give 10: CL 5 + cup 1 + top assist 1 + title 3 = 10. That number in the mockup is wrong; the screen must show the computed value.)
- League points and league goals are **number fields** (inputs with `inputmode="numeric"`, at least 16 px font), not dropdowns.

## 3. What the game records (do not invent stats)

The Showdown records per season and manager: league, club, league position, league points, league goals, domestic cup win, Champions League win, top scorer, top assist, computed season score, season winner. Transfer War records signings and guesses where the challenge completed.

It does **not** record: clean sheets, biggest win, European wins (other than CL winner), assists totals, player names as stats, match-by-match results. Any mockup tile that shows those is removed or replaced with a recorded stat. "Cian Cheets" in the Career Statistics mockup is a typo and an unrecorded stat: drop it.

Career leaders: no player photos. Use the manager's portrait crop (from the screen plate) or the club crest plus initials.

## 4. Online history (S2C-005R2, accepted 2026-10-01)

- The field names, screen states and value bounds every screen uses are in `DATA_CONTRACT_V1.md` (this folder), agreed with Team G. Online history itself is Team G's work; jobs 98–102 only track it.

- Career history comes from the provider (Firestore), not from local storage. Visual previews may use **labelled fixtures only** (a visible "Preview data" tag in preview frames).
- Abandoned Showdowns count for nothing. They may appear in History as a status-only row ("Abandoned · not counted").
- No historical backfill. Career history starts with Showdowns recorded after the new system ships.
- Until provider history is ready, the honest label is exactly: **"Current Showdown only. Career history is not yet available."**
- Final result with Terminal Close pending shows the result with a visible "Completion pending" state.
- States every history screen must design: loading, empty (new career), partial (some Showdowns unreadable, show coverage), unavailable, ready.
- Transfer history has its own availability. If transfers are unavailable, say so; never show zero signings.

## 5. Home (OWNER-5)

Final Home destinations, all reachable on phone: **Continue** (dominant), **Start/Join**, **History** (Legacy), **Statistics**, **Trophy Room** (its own tile), **Rule Book**, **Settings**. Rivalry Statistics is reached from Statistics and from the active Showdown. The Audius soundtrack card stays.

## 6. Rights and imagery (hard rules)

- No real club crests, no real league logos, no real trophies, no EA/FIFA art, no press photos, no AI-generated real players.
- Clubs use our original code-drawn crests (`js/visualIdentity.js` `getClubCrestSvg`, accepted CREST-V1 f1cfff4). Leagues use our original league marks (`getLeagueMark`; League Marks V2 pick pending from Nik).
- Trophies use our original trophy art (factory jobs 19–22).
- **No player photos anywhere**, with one exception: the Loading screen keeps its Marco Reus photo (`assets/marco-reus-2015-cc-by.webp`) with the credit line "Marco Reus photo: Tim Reckmann · CC BY 2.0 · Cropped for display", name linked to https://www.flickr.com/photos/foto_db/16204330530/, licence linked to https://creativecommons.org/licenses/by/2.0/, readable by screen readers.
- Nik and Daniel portraits are allowed (they are the owners). No other people.
- **Never bake live or private data into images**: no names as data, scores, fees, stats, timers, codes, guesses. Decorative brand text (CM17, "Football brings us together", banner slogans) is fine.
- Nothing may show or hint at the rival's private inputs or progress (Transfer War guesses stay sealed until reveal).

## 7. Layout rules

- **Phone target: iPhone 393 × 660 visible area in Safari. Everything visible, no page scroll.** Safety net: 360 × 640 no scroll. 375 × 553: the primary action must be visible without scrolling.
- Larger text settings and landscape may reflow and scroll; never shrink labels below readable size to avoid scrolling, never clip navigation.
- Desktop targets: 1366 × 768 (main), 1440 × 900, 1920 × 1080, and 1366 × 640 (short laptop).
- Live UI is semantic DOM, aligned to the screen. No skewed or rotated form text. Inputs at least 16 px on phone. Body text contrast at least 4.5:1.
- Top bar (agreed with Team G, DATA_CONTRACT_V1 §10): five tabs HOME / CAREER / STANDINGS / STATS / RULES plus a settings icon at the right end; no ABOUT, search or profile. Desktop: 52 px bar at the top, always visible; on the transfer window, season entry and both wheels it is locked ("Finish this step first"). Phone (≤ 900 px): a 5-icon bottom bar of 56 px plus the safe area, shown ONLY on hub screens (Home, Start / Join, Legacy, Trophy Room, Statistics / Rivalry, Standings, Rule Book, Settings) and hidden on Loading, both wheels, Transfer War, Season Results entry and the Final Winner reveal. Hub screens measure their phone fit above the bar's space. Job 125 builds the bar.
- Only buttons the real app has. If a mockup shows a button with no product behaviour, drop it.

## 8. Branches

- All factory work lives on **`factory/v1-wtt5ye`**. Never push to `main`. Never force-push. Never delete branches.
- Screen folders: `visual-assets/v10_1/<screen>/`. Shared kit: `visual-assets/v10_1/shared/`. Factory papers: `project-documents/factory/`.
- `main` is read-only: read product code from it, never change it.
