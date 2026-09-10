# R8 Screen / Asset / State Implementation Map

Status: COVERAGE COMPLETE — QA / BINARY / FINAL-MAIN GATES OPEN

This map converts the screen contracts, asset matrix and proposal compositions into the remaining closure queue. Senior production implementation remains deferred until final approval and final-main reconciliation.

Current product study anchor:

`ea96ff1280b5e63962b7ee1a6a8c0980fe4e3686` / `1.9.1-r13` / MDP `77.50`.

Current product delta reconciled: Shared Multi Season progression.

| Screen | Contract | Asset resolution | Character decision | Proposal composition | Remaining closure work |
| --- | --- | --- | --- | --- | --- |
| `mainMenu` | `screens/01_HOME_MAIN_MENU.md` | H01 stadium SVG packaged; exact A01/A02 source bytes verified but proposal copies still open | A02 Daniel left, A01 Nik right wide only; omitted <=1179px | `prototypes/01-home-reference.html` | exact byte-safe A01/A02 placement; Home wide + responsive screenshot QA |
| `createShowdown` | `screens/02_CREATE_SHOWDOWN.md` | S02 rivalry divider + DOM/CSS | none | `prototypes/02-create-showdown-reference.html` | desktop/mobile screenshot QA PASS; real-DOM focus/validation verification later |
| `leagueWheelScreen` | `screens/03_LEAGUE_WHEEL.md` | S03 wheel halo + real wheel | no new character asset | `prototypes/03-league-wheel-reference.html` | exact wheel safe-zone screenshot sampling; shared host/peer state QA |
| `clubWheelScreen` | `screens/04_CLUB_ASSIGNMENT.md` | S04 original pack frame + DOM text | no new character asset | `prototypes/04-club-assignment-reference.html` | sealed/reveal/locked/shared state screenshot sampling |
| `dashboard` | `screens/05_SHOWDOWN_HOME_DASHBOARD.md` | DOM/CSS/procedural only | none | `prototypes/05-dashboard-reference.html` | r13 Season 2–10 label sampling; future Journey Reconnect reconciliation if visible |
| `transferChallenge` | `screens/06_TRANSFER_CHALLENGE.md` | DOM/CSS; I02 available for supporting state icon use | none | `prototypes/06-transfer-challenge-reference.html` | privacy/active/verdict responsive sampling; real-DOM field/focus QA |
| `seasonEntry` | `screens/07_SEASON_RESULTS_ENTRY.md` | DOM/CSS only | none | `07a-season-results-local-reference.html`; `07b-season-results-shared-reference.html` | r13 desktop PASS; exact-file mobile proof open; later reconnect/reconciliation state reconciliation |
| `seasonSummary` | `screens/08_SEASON_SUMMARY.md` | DOM/CSS + I01 optional achievement symbols | no new celebration asset justified | `prototypes/08-season-summary-reference.html` | winner/draw/terminal responsive sampling; final-main action reconciliation |
| `statistics` | `screens/09_RIVALRY_STATISTICS.md` | DOM/CSS/lightweight native bars | none | `prototypes/09-rivalry-statistics-reference.html` | sparse/tied/mobile sampling; real analytics remains production authority |
| `careerStatistics` | `screens/10_CAREER_STATISTICS.md` | DOM/CSS + I01 optional | none | `prototypes/10-career-statistics-reference.html` | empty/unresolved/populated responsive sampling |
| `trophyRoom` | `screens/11_TROPHY_ROOM.md` | I01 original generic trophy-symbol family packaged | none | `prototypes/11-trophy-room-reference.html` | empty/populated/mobile sampling; verify no official-trophy resemblance introduced during senior integration |
| `legacy` | `screens/12_LEGACY.md` | DOM/CSS + I01/I02 optional supporting symbols | none | `prototypes/12-legacy-reference.html` | desktop contrast-boundary screenshot PASS; mobile/corrupt/fail-closed final sampling open |
| `ruleBook` | `screens/13_RULE_BOOK.md` | DOM/CSS + I01 optional | none | `prototypes/13-rule-book-reference.html` | mobile/long-copy sampling; final content-staleness check against final main |

## Cross-product surface contracts and compositions

| Surface family | Contract | Composition | Current closure state |
| --- | --- | --- | --- |
| Startup / header / runtime notices | `surfaces/01_STARTUP_HEADER_RUNTIME.md` | `prototypes/24-startup-header-runtime-reference.html` | composition complete; startup budget/focus remains senior integration QA |
| Settings / Save Library / Local Profiles | `surfaces/02_SETTINGS_SAVE_LIBRARY_LOCAL_PROFILES.md` | `prototypes/20-settings-save-library-reference.html` | composition complete; focus trap and state-family execution QA open |
| Connected Account / Pairing / Rivalry / Remote Joining | `surfaces/03_CONNECTED_ACCOUNT_PAIRING_RIVALRY_REMOTE_JOINING.md` | `prototypes/21-connected-private-rivalry-reference.html` | composition complete; exact capability/recovery runtime QA open |
| Backup / Import / Restore / Recovery | `surfaces/04_BACKUP_IMPORT_RESTORE_RECOVERY.md` | `prototypes/22-restore-recovery-reference.html` | desktop safety hierarchy screenshot PASS; runtime atomic/focus QA open |
| Shared play state system | `surfaces/05_SHARED_PLAY_STATE_SYSTEM.md` | shared states represented across routed compositions, especially `07b` | reconciled through r13 Multi Season; later journey states open |
| Empty / Error / Offline / Update / Reduced Motion | `surfaces/06_EMPTY_ERROR_OFFLINE_UPDATE_REDUCED_MOTION.md` | `prototypes/23-cross-product-state-system-reference.html` | composition complete; runtime and reduced-motion execution QA open |

## Current asset authority

### Frozen character masters

A01 Nik and A02 Daniel source bytes are recovered and hash-verified.

- A01 SHA-256: `17972b8afb73b90483c8f874c4bd964ac1bda196daa76e134a6030676bbd4219`
- A02 SHA-256: `9b1545b52a5d96a240c92b9901dcd8a4558148dde05a0331882df7bd988177cc`

Their exact proposal binary copies remain open because the available GitHub text-file path must not recompress or transform them. Do not generate replacements.

### Packaged procedural / original vector assets

- `H01_HOME_STADIUM_ATMOSPHERE`
- `S02_TWO_MANAGER_RIVALRY_DIVIDER`
- `S03_WHEEL_STAGE_HALO`
- `S04_CLUB_PACK_FRAME`
- `I01_TROPHY_SYMBOL_FAMILY`
- `I02_SYSTEM_STATE_SYMBOL_FAMILY`

All are original, rights-safe, text-free or text-independent supporting assets recorded in `assets/ASSET_MANIFEST.json`.

Current evidence still does not justify A03–A06 or any other new character generation.

## Screenshot QA evidence

See:

`evidence/PROPOSAL_SCREENSHOT_QA_R13_2026-09-10.md`

Current direct passes include:

- Create Showdown 1600×900;
- Create Showdown 390×844;
- Shared Season Results / r13 Multi Season 1600×1100;
- Legacy 1600×900;
- Restore & Recovery 1600×900.

Shared Season Results mobile has a directional/transcription proof but still requires exact-file mobile rendering before final acceptance.

## Closure order from here

1. Keep reconciling visible product drift from `main` without resetting unaffected proposal work.
2. Place exact A01/A02 proposal binaries through a byte-safe repository path when available; re-hash after placement.
3. Run Home wide/reduced-wide/Chromebook/mobile visual QA using those exact masters.
4. Complete representative responsive/state screenshot sampling for the remaining higher-risk compositions.
5. Verify asset manifest, provenance and hash ledger.
6. Prepare senior-developer implementation mapping only after final `main` stops changing materially.
7. Run mandatory final-main inventory/reconciliation.
8. Fix proposal gaps discovered by that reconciliation.
9. Produce the concise final senior-developer handoff prompt.

## True final gates

Do not mark this map or the visual proposal FINAL until all are simultaneously true:

- exact A01/A02 proposal binaries are packaged and re-hashed;
- every routed and substantial non-route surface has a final-quality composition or explicit DOM/CSS-only resolution;
- representative desktop/Chromebook/mobile and state/accessibility QA is recorded;
- r13 and every later visible product capability are reconciled;
- final `main` is re-inventoried after the main developer reaches its actual finishing checkpoint;
- known proposal defects are fixed and reverified;
- senior implementation mapping and final handoff prompt are complete.

Current status is therefore: COMPLETE COVERAGE, ACTIVE CLOSURE — NOT FINAL.