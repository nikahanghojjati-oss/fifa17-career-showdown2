# HO-004 findings: live 2.0 screens vs Team V approved frames (job V-245)

**Compared:** live app at `origin/main` 00a1eb8 (runtime 1.9.1-r56)
against Team V's standalone frames at `factory/v1-wtt5ye` 5e05a1f (`visual-assets/v10_1/<screen>/index.html?frame=<ID>`,
). Chromium/Playwright, DPR 1, reduced-motion off,
sizes **1920x1080 (`d1080`), 1920x910 (`d910`), 390x844 (`m390`)**.
Screenshots: side-by-sides (live on top or left, frame below or right) in `project-documents/factory/evidence-claude-check/V-245/`, linked in each row.

**How live was reached** (no real accounts, nothing written to the repo):
the page was opened, `#onlinePlayerIdentityOverlay` (the Sign-in gate) was removed, then
– Home/Start-Join: `showScreen(...)`;
– League / Dashboard / Transfer / Season Results: a fixture Save Library in `localStorage` (`careerModeShowdown.saveLibrary`,
  shaped like `tests/browser/identity-safe-career-analytics-audit.cjs`) + `ensureSaveLibraryRuntimeAuthority()` + `resumeSavedShowdown()`;
– Rule Book / Settings / Career Statistics / Trophy Room / Rivalry / History: `openOptionalModule(...)`;
– Standings / Final Winner: provider stubs built from `tests/support/active-showdown-fixtures.cjs` (identity, pair, multi-season,
  history convergence, final reconciliation, terminal close);
– Transfer War: the provider stub pattern from `tests/browser/shared-transfer-challenge-replay-audit.cjs` (phases `WINDOW_OPEN`, `COMPLETED`);
– Loading: screenshot taken during startup before the splash hides.

**Not covered / could not be reached**
- **Club Assignment** and the **header chips / footer band** — excluded by the ticket.
- **Start/Join signed-in states (SJ2–SJ8: code created, joining, paired)** — need real Google sign-in + pairing. Only the
  signed-out screen was compared, so the row below for Start/Join may partly be a "not signed in" state rather than a wiring bug.
- **History (Legacy) with data**: live would not accept a stubbed career model — it always rendered the
  "Your Showdown history could not be loaded." state (`history-*-live.png`), so only the unavailable state could be compared
  against LG1. The Career Statistics / Trophy Room / Rivalry screens did accept the stub and were compared with data.
- **Season Results shared (two-device) path**: live was reached through the local season-entry engine, so live shows both
  managers' input panels where frame SR1 shows one panel + "WAITING FOR NIK". That difference is the route, not the skin, and is
  not listed as a finding.
- Numbers, club names and manager state differ everywhere because the frames run on fixture data — content differences are not listed.

**Counts:** 20 differences — 19 "wiring bug (Team G)", 1 "design change (Team V)".

| Screen | Size | Frame shows | Live shows | Screenshot path | Type |
|---|---|---|---|---|---|
| Career Statistics, Trophy Room, Rivalry, History (one cause) | d1080, d910 | Stage fills the whole viewport (full-bleed plate, managers at the far edges) | Stage clamped to `--safe-width: 1510px` (`.screen` in css/app.css) so a black band is left on each side and above/below; managers are cut by the band | [cmp-careerstats-d1080](../evidence-claude-check/V-245/cmp-careerstats-d1080.jpg), cmp-trophyroom-d1080.png, cmp-rivalry-d1080.png, cmp-history-d1080.png | wiring bug (Team G) |
| Loading | d1080, d910, m390 | Team V gold loading frame: brushed `CAREER MODE SHOWDOWN 17` wordmark art, gold grade, gold progress rule | Old steel/blue splash: flat `CM 17` roundel, Segoe/Barlow text wordmark, blue-grey plate, cyan pulse dots | [cmp-loading-d1080](../evidence-claude-check/V-245/cmp-loading-d1080.jpg), cmp-loading-m390.png | wiring bug (Team G) — Team V's `visual-assets/v10_1/loading` is never registered in js/v10Screens.js |
| Home | all | 7 tiles: Continue, Start a Showdown, **Legacy**, **Statistics**, **Trophy Room**, Rule Book, Settings (the three extra carry "Pair with your rival first") | Only 4 tiles (Continue, Start a Showdown, Rule Book, Settings); `#legacyButton, #careerStatisticsButton, #rivalryStatisticsButton` are `display:none !important` (css/app.css:206) | [cmp-home-d1080](../evidence-claude-check/V-245/cmp-home-d1080.jpg), cmp-home-m390.png | wiring bug (Team G) |
| Home — menu tiles | all | Shared cut-corner panel: `clip-path: polygon(12px 0 …)` plus a 4px inset gold rule (`.sd-panel` class on each tile) | Square corners (`clip-path: none`), 2px inset rule; tiles never get the `sd-panel` class | [cmp-home-d1080](../evidence-claude-check/V-245/cmp-home-d1080.jpg) (work/cs-home.txt `.menuTile`) | wiring bug (Team G) |
| Home — soundtrack tile | all | Cream text `rgb(233,223,200)`, transparent player well | Pure white text `rgb(255,255,255)`, opaque `#1f262c` player well with a 3px white-ish left rule (old app.css `.menuMusicPlayer`) | [cmp-home-d1080](../evidence-claude-check/V-245/cmp-home-d1080.jpg) (cs-home.txt `.menuMusicTile/.menuMusicPlayer`) | wiring bug (Team G) |
| Rule Book — hero summary | all | `Barlow, system-ui` at 78% opacity (`rgba(244,241,234,.78)`) | `"Segoe UI", Helvetica Neue, Arial` at full `rgb(244,241,234)` — old `css/rulebook.css .ruleBookHero > p` beats `.sd-body` | [cmp-rulebook-d1080](../evidence-claude-check/V-245/cmp-rulebook-d1080.jpg) (cs-rulebook.txt) | wiring bug (Team G) |
| Rule Book — eyebrow + tagline | all | Eyebrow 600 wt / 6.9px tracking; tagline 600 wt in cream `rgb(233,223,200)` | Eyebrow 800 wt / 2.4px tracking; tagline 900 wt in `rgb(244,241,234)` — `css/rulebook.css .ruleBookHero > span/strong` out-specify `.sd-eyebrow/.sd-tagline` | [cmp-rulebook-d1080](../evidence-claude-check/V-245/cmp-rulebook-d1080.jpg) | wiring bug (Team G) |
| Rule Book — section number chip | all | `#ffd34d` on near-black `rgba(25,20,10,.9)` | `#f5c518` on translucent gold `rgba(219,178,94,.15)` | [cmp-rulebook-d1080](../evidence-claude-check/V-245/cmp-rulebook-d1080.jpg) | wiring bug (Team G) |
| Rule Book — scoring table | all | Table 78px tall, every row 14.5px, "MAXIMUM PER MANAGER / SEASON" the same height as a row | Table 48.9px, rows 13.3px, maximum row 32.3px — rows cramped, totals row double height | [cmp-rulebook-d1080](../evidence-claude-check/V-245/cmp-rulebook-d1080.jpg) | wiring bug (Team G) |
| Rule Book — BACK TO MAIN MENU | all | 210px wide button under the grid | Stretches to the full 600px column (`css/rulebook.css .ruleBookActions .backButton{width:100%}` beats `.sd-btn`) | [cmp-rulebook-d1080](../evidence-claude-check/V-245/cmp-rulebook-d1080.jpg) | wiring bug (Team G) |
| Settings — eyebrow | all | "CAREER MODE SHOWDOWN" 16px, cream `rgb(244,241,234)`, 6.7px tracking | 9px, **light blue `#9fdef0`**, 3.8px tracking (`css/settings.css .settingsEyebrow`) | [cmp-settings-d1080](../evidence-claude-check/V-245/cmp-settings-d1080.jpg) (cs-settings.txt) | wiring bug (Team G) |
| Settings — rule above DONE | all | Footer bar is transparent, no rule | 1px `rgb(189,200,205)` light rule across the full width above DONE: `css/settings.css .settingsFooter{border-top:1px solid #bdc8cd!important}` beats `css/rulesSettingsV10.css` (`border:0`, no `!important`) | [cmp-settings-d1080](../evidence-claude-check/V-245/cmp-settings-d1080.jpg) | wiring bug (Team G) |
| Settings — panels | all | Cut-corner `clip-path: polygon(12px 0 …)`, 20px padding | `clip-path: none`, 16px padding; panels are plain rectangles | [cmp-settings-d1080](../evidence-claude-check/V-245/cmp-settings-d1080.jpg) | wiring bug (Team G) |
| Settings — "UPDATE TO LATEST VERSION" / "OPEN HISTORY & BACKUP" | all | Auto-width gold-text buttons (154px / 201px) with cut corners | Full-width bars (480px / 879px), cream text `rgb(245,241,232)`, no cut corner (old `.menuButton`/`.settingsDataButton` rules) | [cmp-settings-d1080](../evidence-claude-check/V-245/cmp-settings-d1080.jpg) | wiring bug (Team G) |
| Settings — tagline | all | "TWO MANAGERS. ONE LEGACY." under the wordmark (`.settingsTagline`) | Element absent; wordmark sits directly on the panels | [cmp-settings-m390](../evidence-claude-check/V-245/cmp-settings-m390.jpg) | wiring bug (Team G) |
| Season Entry / Season Results | d1080, d910 | "SEASON RESULTS" brushed wordmark at the top of the stage | A legacy football-visual card ("SEASON PRESSURE / ANTOINE GRIEZMANN", blue panel + photo, from `css/footballVisuals*.css`) is drawn over the top of the stage and hides the wordmark | [cmp-seasonentry-d1080](../evidence-claude-check/V-245/cmp-seasonentry-d1080.jpg), cmp-seasonentry-d910.png | wiring bug (Team G) |
| League | d1080, d910 | Two side copy blocks ("DIFFERENT LEAGUES / DIFFERENT STORIES / SAME PASSION", "WHERE RIVALS CREATE LEGENDS") at the bottom corners; SPIN WHEEL and BACK as the only controls | Those blocks are missing; instead the legacy "FIND YOUR STAGE / CRISTIANO RONALDO" blue card is drawn under the wheel and is cut by the viewport | [cmp-league-d1080](../evidence-claude-check/V-245/cmp-league-d1080.jpg), cmp-league-m390.png | wiring bug (Team G) |
| Standings | d910 | Whole head-to-head panel fits (through "Total Trophies") | Panel is clipped at the bottom — "Domestic Cups" and "Total Trophies" rows are cut off (stage does not fit under the 52px nav reserve at 910px) | [cmp-standings-d910](../evidence-claude-check/V-245/cmp-standings-d910.jpg) | wiring bug (Team G) |
| Transfer War — local (non-shared) route | all | Team V plate: TRANSFER WAR key art, glass cards, gold rail | Entirely unskinned old steel screen (light grey panels, `SEASON 2 TRANSFER CHALLENGE` title, blue step chips, legacy Rashford/Martial photo cards). The skin in `js/transferScreenV10.js` only mounts for the shared/production transfer provider | [transferlocal-d1080-live](../evidence-claude-check/V-245/transferlocal-d1080-live.jpg) vs transfer-WINDOW_OPEN-d1080-frame.png | wiring bug (Team G) |
| Transfer War — shared route, status + early-end button | all | Status line "WINDOW OPEN · BUILD YOUR SQUAD"; button "END EARLY" (Team V strings `f1Action`) | "TRANSFER WINDOW LIVE · BUILD YOUR FIFA 17 SQUAD"; button "REQUEST EARLY END" (production's own element is kept, by design of the skin) | shots/cmp-transfer-WINDOW_OPEN-d1080.png | design change (Team V) — the frame's shorter copy no longer matches the shipped two-step early-end wording; Team V should re-approve the string, not Team G re-label production's button |
| History (Legacy) | d1080, d910 | No stand-alone back control over the stage (nav bar + "VIEW SEASON HISTORY") | A legacy "BACK TO MAIN MENU" button floats over the top-left of the stage, overlapping the art | [cmp-history-d1080](../evidence-claude-check/V-245/cmp-history-d1080.jpg) | wiring bug (Team G) |

Notes for whoever picks this up:
- The Rule Book / Settings rows above are the concrete instances of Team G's "~74 Rule Book and ~80 Settings elements" note: in every
  case the old sheet wins either by higher specificity (`#ruleBook .ruleBookHero > p` vs `.sd-body`) or by `!important`
  (`css/settings.css .settingsFooter`). Dropping `css/rulebook.css` / `css/settings.css` on these two screens would fix the
  whole group; the shared class names (`.backButton`, `.menuButton`, `.settingsFooter`, `.ruleSection*`) are what they collide on.
- The letterboxing row (first line) is one rule: `.screen{width:min(var(--safe-width),96vw)}` in `css/app.css`. Standings, Season
  Results, Rule Book and Settings escape it (own stage/overlay); Career Statistics, Trophy Room, Rivalry and History do not.

## Team V's own item (design change)
Transfer War copy: Team V's frame strings ("WINDOW OPEN · BUILD YOUR SQUAD", "END EARLY") predate production's two-step early end. Production wording wins (product truth); Team V will align the frame strings to "TRANSFER WINDOW LIVE" / "REQUEST EARLY END" in a later V- job. Nothing for Team G to change there.
