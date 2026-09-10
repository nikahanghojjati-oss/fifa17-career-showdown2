# R8 Screen / Asset / State Implementation Map

Status: ACTIVE PROPOSAL MAP — NOT SENIOR IMPLEMENTATION AUTHORITY YET

This map converts the screen contracts and asset matrix into a deterministic proposal queue. Senior production implementation remains deferred until final approval and final-main reconciliation.

| Screen | Contract | Current external asset decision | Character decision | Proposal composition | Primary remaining work |
| --- | --- | --- | --- | --- | --- |
| `mainMenu` | `screens/01_HOME_MAIN_MENU.md` | H01 stadium SVG packaged; A01/A02 exact binary copies still open | A02 Daniel left, A01 Nik right wide only | reference CSS exists; final wide composition blocked by exact binary placement | exact A01/A02 proposal copies; wide visual QA; mobile/Chromebook proof |
| `createShowdown` | `screens/02_CREATE_SHOWDOWN.md` | S02 rivalry-divider SVG packaged | none | `prototypes/02-create-showdown-reference.html` | browser/responsive/focus QA; reconcile against final main |
| `leagueWheelScreen` | `screens/03_LEAGUE_WHEEL.md` | S03 wheel halo SVG packaged | none required | `prototypes/03-league-wheel-reference.html` | verify real wheel safe zone and shared host/peer states |
| `clubWheelScreen` | `screens/04_CLUB_ASSIGNMENT.md` | S04 pack frame SVG packaged | none required | `prototypes/04-club-assignment-reference.html` | sealed/reveal/locked variants; shared confirmations; responsive QA |
| `dashboard` | `screens/05_SHOWDOWN_HOME_DASHBOARD.md` | CSS/procedural only | none | not yet built | build populated/new/terminal compositions and responsive proof |
| `transferChallenge` | `screens/06_TRANSFER_CHALLENGE.md` | CSS/procedural board and optional original icons | none | not yet built | build timer/active/private/verdict compositions; no baked text |
| `seasonEntry` | `screens/07_SEASON_RESULTS_ENTRY.md` | DOM/CSS only | none | not yet built | build local entry plus shared publish/commit/ack/canonical/history states |
| `seasonSummary` | `screens/08_SEASON_SUMMARY.md` | DOM/CSS plus optional procedural celebration | no new celebration asset currently justified | not yet built | build winner/draw/terminal compositions; reconsider celebration only after final-main proof |
| `statistics` | `screens/09_RIVALRY_STATISTICS.md` | DOM/CSS, optional lightweight SVG data motifs | none | not yet built | build populated/sparse/tied/leader responsive compositions |
| `careerStatistics` | `screens/10_CAREER_STATISTICS.md` | DOM/CSS, procedural empty-state motif | none | not yet built | build empty/unresolved/populated/leader compositions |
| `trophyRoom` | `screens/11_TROPHY_ROOM.md` | original trophy/shelf SVG family required | none | not yet built | design rights-safe trophy icon family and cabinet/empty compositions |
| `legacy` | `screens/12_LEGACY.md` | DOM/CSS; no raster | none | reference CSS exists | full populated/empty/corrupt/import/restore browser contrast sweep |
| `ruleBook` | `screens/13_RULE_BOOK.md` | DOM/CSS; optional original rule icons | none | not yet built | handbook/scoring-table composition; final content-staleness check |

## Cross-product surface contracts

The following non-route families are normalized under `surfaces/`:

- startup/header/runtime notices;
- Settings/Save Library/Local Profiles;
- Connected Account/Pairing/Connected Rivalry/Remote Joining;
- backup/import/restore/recovery;
- shared-play state system;
- empty/error/offline/update/reduced-motion grammar.

These are not optional. Each must receive final-product-quality composition/state examples and QA before the proposal is final.

## Current asset authority

### Frozen character masters

A01 Nik and A02 Daniel source bytes are recovered and hash-verified. Their proposal binary copies remain open because exact multi-megabyte PNG transfer must preserve bytes without text conversion/recompression.

Do not generate replacements.

### Packaged procedural assets

- `H01_HOME_STADIUM_ATMOSPHERE`
- `S02_TWO_MANAGER_RIVALRY_DIVIDER`
- `S03_WHEEL_STAGE_HALO`
- `S04_CLUB_PACK_FRAME`

All are original, rights-safe, text-free proposal assets recorded in `assets/ASSET_MANIFEST.json`.

## Required next asset order

1. Trophy Room original trophy/shelf SVG family.
2. Optional lightweight statistics grid/record motif if composition proves DOM/CSS alone is insufficient.
3. Optional transfer/private/lock icon family only if actual composition benefits.
4. A01/A02 exact binary copy placement when a byte-safe repository transfer path is available.
5. No new character generation unless a later screen contract proves a role that cannot be solved by existing masters, crops, procedural assets or omission.

## Composition order

Continue in product-flow order:

1. Dashboard.
2. Transfer Challenge.
3. Season Results local entry.
4. Shared Season Results states.
5. Season Summary.
6. Rivalry Statistics.
7. Career Statistics.
8. Trophy Room.
9. Legacy state family.
10. Rule Book.
11. Settings/Save Library/Local Profiles.
12. Connected Account/Pairing/Rivalry/Remote Joining.
13. Backup/import/restore/recovery.
14. Cross-product responsive/reduced-motion/state sweep.

## Final gates

Do not mark this map complete until:

- exact A01/A02 proposal binaries are packaged and re-hashed;
- every row has a final-product-quality proposal composition or explicit DOM/CSS-only resolution with QA;
- all substantial non-route states have composition/QA evidence;
- final `main` is re-inventoried after the main developer reaches the final checkpoint;
- proposal defects are fixed and reverified;
- final senior implementation mapping and concise handoff prompt are complete.