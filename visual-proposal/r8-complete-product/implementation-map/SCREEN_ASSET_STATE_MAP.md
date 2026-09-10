# R8 Screen / Asset / State Implementation Map

Status: COVERAGE COMPLETE THROUGH r14 — AUDIUS-FIRST MEDIA — FINAL SCREENSHOT / BINARY / FINAL-MAIN / OWNER-APPROVAL GATES OPEN

Current production reconciliation anchor:

`97c28b1efea6ee6e901e6076a834ec419cbad5aa` / `1.9.1-r14`.

Reconciled production additions:

- r13 Shared Multi Season progression;
- r14 Shared Journey Reconnect.

Senior production implementation remains deferred until final owner screenshot approval and final-main reconciliation.

## Routed product map

| Screen | Contract | Asset / character decision | Proposal composition | Remaining closure work |
| --- | --- | --- | --- | --- |
| `mainMenu` | `screens/01_HOME_MAIN_MENU.md` + `surfaces/07_MEDIA_PLAYER.md` | H01 stadium; exact A02 Daniel left + A01 Nik right wide only; characters omitted <=1179; no new characters | `01-home-reference.html`; primary media direction `27-audius-showdown-radio-reference.html` | exact-byte master render access; integrate final Audius compact player into Home; final wide/Chromebook/mobile screenshots |
| `createShowdown` | `screens/02_CREATE_SHOWDOWN.md` | S02 divider; no character | `02-create-showdown-reference.html` | existing desktop/mobile QA can survive only if final reconciliation leaves composition unchanged; validation/focus proof later |
| `leagueWheelScreen` | `screens/03_LEAGUE_WHEEL.md` | S03 wheel halo behind real wheel; no character | `03-league-wheel-reference.html` | ready/resolved/shared-state screenshots; safe hit-area proof |
| `clubWheelScreen` | `screens/04_CLUB_ASSIGNMENT.md` | S04 original pack frame; DOM text; no official crests | `04-club-assignment-reference.html` | sealed/reveal/locked screenshots |
| `dashboard` | `screens/05_SHOWDOWN_HOME_DASHBOARD.md` | DOM/CSS only | `05-dashboard-reference.html` | Season 2+ screenshots; r14 reconnect banner may appear above this route through surface 08 |
| `transferChallenge` | `screens/06_TRANSFER_CHALLENGE.md` | DOM/CSS; I02 optional | `06-transfer-challenge-reference.html` | privacy/active/verdict responsive screenshots |
| `seasonEntry` | `screens/07_SEASON_RESULTS_ENTRY.md` | DOM/CSS only | `07a-season-results-local-reference.html`; `07b-season-results-shared-reference.html` | local states; shared final screenshot refresh only if later main changes state contract |
| `seasonSummary` | `screens/08_SEASON_SUMMARY.md` | DOM/CSS; no new celebration raster justified | `08-season-summary-reference.html` | winner/draw/terminal screenshots |
| `statistics` | `screens/09_RIVALRY_STATISTICS.md` | lightweight DOM/CSS bars; no chart dependency | `09-rivalry-statistics-reference.html` | populated/sparse/tied/mobile screenshots |
| `careerStatistics` | `screens/10_CAREER_STATISTICS.md` | DOM/CSS | `10-career-statistics-reference.html` | empty/populated/unresolved-if-real screenshots |
| `trophyRoom` | `screens/11_TROPHY_ROOM.md` | I01 original generic trophy family | `11-trophy-room-reference.html` | empty/populated/mobile screenshots; final similarity QA |
| `legacy` | `screens/12_LEGACY.md` | surface-aware contrast treatment | `12-legacy-reference.html` | desktop QA exists; mobile refresh + corrupt/fail-closed state |
| `ruleBook` | `screens/13_RULE_BOOK.md` | DOM/CSS | `13-rule-book-reference.html` | wide/mobile/long-copy screenshots; final content check |

## Cross-product map

| Surface | Contract | Composition | Closure state |
| --- | --- | --- | --- |
| Startup / Header / Runtime | `surfaces/01_STARTUP_HEADER_RUNTIME.md` | `24-startup-header-runtime-reference.html` | composition built; final visual/focus evidence open |
| Settings / Save Library / Local Profiles | `surfaces/02_SETTINGS_SAVE_LIBRARY_LOCAL_PROFILES.md` | `20-settings-save-library-reference.html` | mobile QA fix exists; final desktop/state screenshots open |
| Connected Account / Pairing / Rivalry / Remote Joining | `surfaces/03_CONNECTED_ACCOUNT_PAIRING_RIVALRY_REMOTE_JOINING.md` | `21-connected-private-rivalry-reference.html` | mobile QA exists; final desktop/recovery evidence open |
| Backup / Import / Restore / Recovery | `surfaces/04_BACKUP_IMPORT_RESTORE_RECOVERY.md` | `22-restore-recovery-reference.html` | desktop QA exists; mobile refresh + apply-ready/critical states open |
| Shared play / Multi Season | `surfaces/05_SHARED_PLAY_STATE_SYSTEM.md` | primarily `07b` | reconciled through r13; r14 reconnect stays a distinct overlay/status authority |
| Empty / Error / Offline / Update / Reduced Motion | `surfaces/06_EMPTY_ERROR_OFFLINE_UPDATE_REDUCED_MOTION.md` | `23-cross-product-state-system-reference.html` | final representative screenshots open |
| Music / Media | `surfaces/07_MEDIA_PLAYER.md` | `27-audius-showdown-radio-reference.html`; older 25/26 files retained as evidence | Audius-first architecture current; device proof, track taste/rights, final Home integration screenshots open |
| Journey Reconnect r14 | `surfaces/08_JOURNEY_RECONNECT_R14.md` | `28-journey-reconnect-r14-reference.html` | five actual r14 phases represented; final desktop/mobile screenshot evidence open |

## Current media architecture

Primary music:

`SHOWDOWN RADIO -> AUDIUS -> one HTML <audio> authority`

- custom compact black/charcoal/gold UI;
- audio-only;
- curated track manifest rather than search on every Home visit;
- current documented Free-plan basis: 10 requests/sec and 500,000 requests/month;
- request limits are HTTP/API requests, not a direct song-play count;
- no listener Premium account;
- no autoplay;
- no paid fallback;
- real audio events own playback state;
- owner approves final track taste separately from UI.

Optional nostalgia:

`FIFA 17 PICKS -> SOUNDCLOUD`

- exact current song candidates where provider permits;
- `FULL`, explicitly labelled `PREVIEW`, or `UNAVAILABLE`;
- no YouTube music fallback.

Intentional video only:

`FIFA 17 GAMEPLAY TRAILER -> YOUTUBE`

- visible/lazy provider video;
- official IFrame Player API required if retained;
- never hidden audio-only extraction.

Permanent invariant:

`paidUpgradeAllowed = false`

If any media path starts requiring payment/card/overage/subscription, that path disables and Career Mode remains available.

## r14 Journey Reconnect implementation impact

Production owns `#sharedJourneyReconnectStatus` beneath `#topHeader` for shared journeys.

R8 preserves exact phases:

- `OFFLINE_HOLD` — non-authoritative offline preservation;
- `RECOVERY_PENDING` — exact private-session operation unresolved;
- `FRESH_SESSION_REQUIRED` — old/expired session not authority, durable journey may remain resumable;
- `ACTIVE_RECOVERED` — active season/history recovered without reset/redraw;
- `TERMINAL_RECOVERED` — completed season plan remains terminal.

This is read-only status presentation. It never mutates Save Library, duplicates Remote Joining, performs provider writes/listing or changes billing.

## Asset authority

Frozen A01/A02 remain unchanged:

- A01 Nik SHA-256 `17972b8afb73b90483c8f874c4bd964ac1bda196daa76e134a6030676bbd4219`
- A02 Daniel SHA-256 `9b1545b52a5d96a240c92b9901dcd8a4558148dde05a0331882df7bd988177cc`

Do not regenerate them.

Original/procedural assets:

- `H01_HOME_STADIUM_ATMOSPHERE`
- `S02_TWO_MANAGER_RIVALRY_DIVIDER`
- `S03_WHEEL_STAGE_HALO`
- `S04_CLUB_PACK_FRAME`
- `I01_TROPHY_SYMBOL_FAMILY`
- `I02_SYSTEM_STATE_SYMBOL_FAMILY`

No current screen contract justifies A03–A06.

## Screenshot authority

Final gate:

`evidence/FINAL_SCREENSHOT_APPROVAL_INDEX.md`

Internal historical QA:

`evidence/PROPOSAL_SCREENSHOT_QA_R13_2026-09-10.md`

Existing passes are reusable only if the final reconciled composition remains unchanged. Audius-first media requires new screenshots; old native/YouTube media sheets are historical only.

Mobile practical floor remains:

- essential body/status ~13–14px minimum;
- metadata/labels ~11–12px minimum;
- button labels ~12px minimum;
- touch targets 44px minimum.

## Closure order

1. Keep broad media-provider research closed; only perform bounded Audius device/track proof and rights/taste selection.
2. Integrate Audius compact player into final Home proposal.
3. Resolve exact A01/A02 binary render access without transforming their bytes.
4. Capture/QA Home wide, reduced-wide/Chromebook and mobile.
5. Capture the five r14 Journey Reconnect states plus longest mobile state.
6. Work through every remaining row in `FINAL_SCREENSHOT_APPROVAL_INDEX.md` in product-journey order.
7. Fix any visual/readability defect exposed by screenshots and replace stale evidence.
8. Re-verify assets/provenance/hashes.
9. Re-resolve `main`; reconcile only new real user-visible drift after r14.
10. Present the complete final screenshot set, final Audius/SoundCloud track/provider disclosure and functional-player status to the owner.
11. Revise rejected pages/states.
12. Only after explicit complete owner approval create the senior-developer implementation handoff.

## True final gates

R8 is not `FINAL` until:

- exact frozen masters are available for required wide Home final render and remain hash-identical;
- final Audius queue has device proof plus rights/provenance/taste approval;
- every required routed/non-route state has a final screenshot;
- all materially different responsive/state variants are represented;
- r14 and any later production-visible additions are reconciled;
- known defects are fixed/reverified;
- owner explicitly approves every required final screenshot and final track selection;
- final implementation map/handoff is sealed.

Current status:

`COMPLETE COVERAGE THROUGH r14 / ACTIVE FINALIZATION — NOT FINAL`.
