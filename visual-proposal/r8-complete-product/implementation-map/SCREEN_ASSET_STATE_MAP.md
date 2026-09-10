# R8 Screen / Asset / State Implementation Map

Status: COVERAGE COMPLETE — MEDIA CONTRACT ADDED — FINAL SCREENSHOT / BINARY / FINAL-MAIN / OWNER-APPROVAL GATES OPEN

This map converts the screen contracts, surface contracts, asset matrix and proposal compositions into the remaining closure queue. Senior production implementation remains deferred until final approval and final-main reconciliation.

Current product study anchor:

`ea96ff1280b5e63962b7ee1a6a8c0980fe4e3686` / `1.9.1-r13` / MDP `77.50`.

Current product delta reconciled: Shared Multi Season progression.

| Screen | Contract | Asset resolution | Character decision | Proposal composition | Remaining closure work |
| --- | --- | --- | --- | --- | --- |
| `mainMenu` | `screens/01_HOME_MAIN_MENU.md` + `surfaces/07_MEDIA_PLAYER.md` | H01 stadium packaged; exact A01/A02 source bytes verified but proposal binary copies still open; native soundtrack files not selected until rights audit | A02 Daniel left, A01 Nik right wide only; omitted <=1179px | `prototypes/01-home-reference.html`; media architecture in `prototypes/25-native-music-player-reference.html` | exact byte-safe A01/A02 placement; reconcile compact Showdown Radio into Home; Home wide/reduced-wide/Chromebook/mobile screenshots |
| `createShowdown` | `screens/02_CREATE_SHOWDOWN.md` | S02 rivalry divider + DOM/CSS | none | `prototypes/02-create-showdown-reference.html` | desktop/mobile screenshot QA PASS; final owner-review screenshots after reconciliation; real-DOM focus/validation later |
| `leagueWheelScreen` | `screens/03_LEAGUE_WHEEL.md` | S03 wheel halo + real wheel | no new character asset | `prototypes/03-league-wheel-reference.html` | ready/resolved/shared screenshot sampling; wheel safe-zone QA |
| `clubWheelScreen` | `screens/04_CLUB_ASSIGNMENT.md` | S04 original pack frame + DOM text | no new character asset | `prototypes/04-club-assignment-reference.html` | sealed/reveal/locked/shared screenshots |
| `dashboard` | `screens/05_SHOWDOWN_HOME_DASHBOARD.md` | DOM/CSS/procedural only | none | `prototypes/05-dashboard-reference.html` | r13 Season 2+ sampling; Journey Reconnect reconciliation if/when visible |
| `transferChallenge` | `screens/06_TRANSFER_CHALLENGE.md` | DOM/CSS; I02 available | none | `prototypes/06-transfer-challenge-reference.html` | privacy/active/verdict responsive screenshots; field/focus QA later |
| `seasonEntry` | `screens/07_SEASON_RESULTS_ENTRY.md` | DOM/CSS only | none | `07a-season-results-local-reference.html`; `07b-season-results-shared-reference.html` | shared r13 desktop + exact mobile PASS; local states and later reconnect/reconciliation states still open |
| `seasonSummary` | `screens/08_SEASON_SUMMARY.md` | DOM/CSS + I01 optional | no new celebration asset justified | `prototypes/08-season-summary-reference.html` | winner/draw/terminal screenshots; final-main action reconciliation |
| `statistics` | `screens/09_RIVALRY_STATISTICS.md` | DOM/CSS/lightweight native bars | none | `prototypes/09-rivalry-statistics-reference.html` | populated/sparse/tied/mobile screenshots |
| `careerStatistics` | `screens/10_CAREER_STATISTICS.md` | DOM/CSS + I01 optional | none | `prototypes/10-career-statistics-reference.html` | empty/unresolved/populated screenshots |
| `trophyRoom` | `screens/11_TROPHY_ROOM.md` | I01 original generic trophy-symbol family | none | `prototypes/11-trophy-room-reference.html` | empty/populated/mobile screenshots; no official-trophy resemblance |
| `legacy` | `screens/12_LEGACY.md` | DOM/CSS + I01/I02 optional | none | `prototypes/12-legacy-reference.html` | desktop PASS; mobile was fixed but retained final ID is missing, so refresh; corrupt/fail-closed screenshot open |
| `ruleBook` | `screens/13_RULE_BOOK.md` | DOM/CSS + I01 optional | none | `prototypes/13-rule-book-reference.html` | standard/mobile/long-copy screenshots; final content-staleness check |

## Cross-product surface contracts and compositions

| Surface family | Contract | Composition | Current closure state |
| --- | --- | --- | --- |
| Startup / header / runtime notices | `surfaces/01_STARTUP_HEADER_RUNTIME.md` | `prototypes/24-startup-header-runtime-reference.html` | composition complete; screenshots + startup/focus integration QA open |
| Settings / Save Library / Local Profiles | `surfaces/02_SETTINGS_SAVE_LIBRARY_LOCAL_PROFILES.md` | `prototypes/20-settings-save-library-reference.html` | mobile fix + PASS recorded; final desktop/state captures and runtime focus trap open |
| Connected Account / Pairing / Rivalry / Remote Joining | `surfaces/03_CONNECTED_ACCOUNT_PAIRING_RIVALRY_REMOTE_JOINING.md` | `prototypes/21-connected-private-rivalry-reference.html` | mobile fix + PASS recorded; recovery-state/final desktop evidence open |
| Backup / Import / Restore / Recovery | `surfaces/04_BACKUP_IMPORT_RESTORE_RECOVERY.md` | `prototypes/22-restore-recovery-reference.html` | desktop PASS; mobile was fixed but retained final ID missing, so refresh; runtime atomic/focus QA open |
| Shared play state system | `surfaces/05_SHARED_PLAY_STATE_SYSTEM.md` | routed compositions, especially `07b` | reconciled through r13 Multi Season; desktop + exact mobile PASS; later Journey/Reconciliation states open |
| Empty / Error / Offline / Update / Reduced Motion | `surfaces/06_EMPTY_ERROR_OFFLINE_UPDATE_REDUCED_MOTION.md` | `prototypes/23-cross-product-state-system-reference.html` | composition complete; representative final screenshots and runtime reduced-motion QA open |
| Menu Music / Media Player | `surfaces/07_MEDIA_PLAYER.md` | `prototypes/25-native-music-player-reference.html` | native Showdown Radio + separate FIFA 17 Originals provider mode designed; desktop/mobile PASS; final licensed track curation + actual Home integration screenshot open |

## Media architecture decision

Evidence:

`evidence/MEDIA_PLAYER_FEASIBILITY_2026-09-10.md`

The r13 production player uses an optimistic local playing boolean, iframe DOM `load` and raw postMessage commands instead of the official provider ready/state/autoplay-blocked lifecycle. This can let site controls claim PLAYING while the provider is not actually playing.

R8 recommendation:

- default: browser-native audio engine with individually rights-verified tracks and compact R8 controls;
- optional: separate `FIFA 17 ORIGINALS` provider mode for the existing commercial songs/trailer;
- if YouTube remains that provider, use official IFrame Player API state/events and keep the provider player visible;
- no YouTube audio extraction, hidden background playback, ad suppression or paid subscription dependency;
- Spotify Premium is not the default route;
- SoundCloud may be considered per-track/provider but is not the canonical playback authority.

Media QA evidence:

- desktop 1600×1200 PASS: `01a08be3-8a1c-71c1-a33c-4896cd7ef504`;
- mobile 390×2400 PASS: `01a08be4-10db-7751-9912-38f553d08602`.

Native queue names in the prototype are visual fixtures only. No track becomes final without an exact license/provenance ledger.

## Current asset authority

### Frozen character masters

A01 Nik and A02 Daniel source bytes are recovered and hash-verified.

- A01 SHA-256: `17972b8afb73b90483c8f874c4bd964ac1bda196daa76e134a6030676bbd4219`
- A02 SHA-256: `9b1545b52a5d96a240c92b9901dcd8a4558148dde05a0331882df7bd988177cc`

Their exact proposal binary copies remain open because the available GitHub UTF-8 text-file route must not recompress or transform them. Do not generate replacements.

### Packaged procedural / original vector assets

- `H01_HOME_STADIUM_ATMOSPHERE`
- `S02_TWO_MANAGER_RIVALRY_DIVIDER`
- `S03_WHEEL_STAGE_HALO`
- `S04_CLUB_PACK_FRAME`
- `I01_TROPHY_SYMBOL_FAMILY`
- `I02_SYSTEM_STATE_SYMBOL_FAMILY`

Current evidence still does not justify A03–A06 or any new character generation.

## Screenshot authority

Internal QA ledger:

`evidence/PROPOSAL_SCREENSHOT_QA_R13_2026-09-10.md`

Final owner approval inventory:

`evidence/FINAL_SCREENSHOT_APPROVAL_INDEX.md`

Important: internal QA PASS is not the same as owner approval.

Current retained direct passes include:

- Create Showdown desktop and mobile;
- Shared Season Results / r13 Multi Season desktop and exact mobile;
- Legacy desktop;
- Restore & Recovery desktop;
- Connected/private rivalry mobile after readability fix;
- Save Library/Settings mobile after readability fix;
- Showdown Radio/FIFA 17 Originals desktop and mobile.

## Mobile typography rule learned from visual QA

Do not shrink information to preserve an airy composition.

Final 390px-class designs should normally keep:

- essential body/status copy around 13–14px minimum;
- metadata/labels around 11–12px minimum;
- button labels around 12px minimum;
- touch targets 44px minimum.

Legacy, Connected/private rivalry and Save Library screenshot loops demonstrated that sub-floor microtype is a real proposal defect even when geometry technically fits.

## Closure order from here

1. Recheck live `main` at the beginning of every successor session; reconcile only visible deltas without resetting unaffected proposal work.
2. Resolve exact byte-safe A01/A02 placement under proposal `assets/masters/`; re-hash after placement.
3. Reconcile the compact Showdown Radio proposal into the actual Home proposal; keep the provider mode lazy and separate.
4. Perform a dedicated per-track rights search/ledger before approving any native soundtrack source.
5. Run Home wide/reduced-wide/Chromebook/mobile visual QA with exact masters and final compact media treatment.
6. Work through `FINAL_SCREENSHOT_APPROVAL_INDEX.md` until every materially distinct final page/state has a stable screenshot.
7. Re-render any existing PASS after later proposal changes that materially affect it.
8. Verify asset manifest, provenance and hashes.
9. Wait for the main developer's actual final product checkpoint, then run mandatory final-main inventory/reconciliation, including Journey Reconnect and any later terminal/final-reconciliation capabilities.
10. Fix proposal gaps from final-main reconciliation.
11. Present the complete screenshot set to the owner and record explicit per-page/state approval.
12. Only after owner screenshot approval and all other gates close, produce the final senior-developer implementation handoff.

## True final gates

Do not mark R8 `FINAL` until all are simultaneously true:

- exact A01/A02 proposal binaries are packaged and re-hashed;
- native soundtrack tracks, if used, have complete individual rights/provenance records;
- every routed and substantial non-route surface has a final-quality composition or explicit DOM/CSS-only resolution;
- every materially distinct page/state in `FINAL_SCREENSHOT_APPROVAL_INDEX.md` has a final stable screenshot;
- responsive/state/accessibility QA is recorded;
- r13 and every later visible product capability are reconciled;
- final `main` is re-inventoried after the main developer reaches its actual finishing checkpoint;
- known proposal defects are fixed and reverified;
- the owner explicitly approves the full final screenshot package;
- senior implementation mapping and final handoff are complete.

Current status: `COMPLETE COVERAGE, ACTIVE CLOSURE — NOT FINAL`.
