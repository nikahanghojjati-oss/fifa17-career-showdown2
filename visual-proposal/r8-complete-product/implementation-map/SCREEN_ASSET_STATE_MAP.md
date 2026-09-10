# R8 Screen / Asset / State Implementation Map

Status: COVERAGE COMPLETE THROUGH r15 — AUDIUS-FIRST MEDIA — FINAL SCREENSHOT / DEVICE-PROOF / FINAL-MAIN / OWNER-APPROVAL GATES OPEN

Current production reconciliation anchor:

`4d202126ce1606a4e3f74c09b31201cf4ec51c6e` / `1.9.1-r15`.

Reconciled production additions:

- r13 Shared Multi Season progression;
- r14 Shared Journey Reconnect;
- r15 Shared Journey Conflicts.

Senior production implementation remains deferred until final owner screenshot approval and final-main reconciliation.

## Routed product map

| Screen | Contract | Asset / character decision | Proposal composition | Remaining closure work |
| --- | --- | --- | --- | --- |
| `mainMenu` | `screens/01_HOME_MAIN_MENU.md` + `surfaces/07_MEDIA_PLAYER.md` | H01 stadium; exact A02 Daniel left + A01 Nik right wide only; characters omitted <=1179; no new characters | `01-home-reference.html`; primary media direction `27-audius-showdown-radio-reference.html` | local final-capture candidates now exist for wide/Chromebook/mobile; package them; Audius real-device proof + track approval remain |
| `createShowdown` | `screens/02_CREATE_SHOWDOWN.md` | S02 divider; no character | `02-create-showdown-reference.html` | fresh wide/mobile local capture candidates exist; final-main/owner gate remains; validation/error only if materially real |
| `leagueWheelScreen` | `screens/03_LEAGUE_WHEEL.md` | S03 wheel halo behind real wheel; no character | `03-league-wheel-reference.html` | first capture exposed disabled-state ambiguity; CSS corrected; refresh ready/resolved/shared captures and safe hit-area proof |
| `clubWheelScreen` | `screens/04_CLUB_ASSIGNMENT.md` | S04 original pack frame; DOM text; no official crests | `04-club-assignment-reference.html` | readability pass applied; sealed/reveal/locked captures remain |
| `dashboard` | `screens/05_SHOWDOWN_HOME_DASHBOARD.md` | DOM/CSS only | `05-dashboard-reference.html` | Season 1/Season 2+/terminal-if-real captures; r14 reconnect may appear above this route |
| `transferChallenge` | `screens/06_TRANSFER_CHALLENGE.md` | DOM/CSS; I02 optional | `06-transfer-challenge-reference.html` | privacy/active/verdict responsive captures |
| `seasonEntry` | `screens/07_SEASON_RESULTS_ENTRY.md` | DOM/CSS only | `07a-season-results-local-reference.html`; `07b-season-results-shared-reference.html` | local entry states; r15 conflict consequences covered separately by surface 09 |
| `seasonSummary` | `screens/08_SEASON_SUMMARY.md` | DOM/CSS; no new celebration raster justified | `08-season-summary-reference.html` | winner/draw/terminal captures |
| `statistics` | `screens/09_RIVALRY_STATISTICS.md` | lightweight DOM/CSS bars; no chart dependency | `09-rivalry-statistics-reference.html` | populated/sparse/tied/mobile captures |
| `careerStatistics` | `screens/10_CAREER_STATISTICS.md` | DOM/CSS | `10-career-statistics-reference.html` | empty/populated/unresolved-if-real captures |
| `trophyRoom` | `screens/11_TROPHY_ROOM.md` | I01 original generic trophy family | `11-trophy-room-reference.html` | empty/populated/mobile captures; final similarity QA |
| `legacy` | `screens/12_LEGACY.md` | surface-aware contrast treatment | `12-legacy-reference.html` | desktop QA exists; mobile refresh + corrupt/fail-closed state |
| `ruleBook` | `screens/13_RULE_BOOK.md` | DOM/CSS | `13-rule-book-reference.html` | wide/mobile/long-copy captures; final content check |

## Cross-product map

| Surface | Contract | Composition | Closure state |
| --- | --- | --- | --- |
| Startup / Header / Runtime | `surfaces/01_STARTUP_HEADER_RUNTIME.md` | `24-startup-header-runtime-reference.html` | composition built; final visual/focus evidence open |
| Settings / Save Library / Local Profiles | `surfaces/02_SETTINGS_SAVE_LIBRARY_LOCAL_PROFILES.md` | `20-settings-save-library-reference.html` | mobile QA fix exists; final desktop/state captures open |
| Connected Account / Pairing / Rivalry / Remote Joining | `surfaces/03_CONNECTED_ACCOUNT_PAIRING_RIVALRY_REMOTE_JOINING.md` | `21-connected-private-rivalry-reference.html` | mobile QA exists; final desktop/recovery evidence open |
| Backup / Import / Restore / Recovery | `surfaces/04_BACKUP_IMPORT_RESTORE_RECOVERY.md` | `22-restore-recovery-reference.html` | desktop QA exists; mobile refresh + apply-ready/critical states open |
| Shared play / Multi Season | `surfaces/05_SHARED_PLAY_STATE_SYSTEM.md` | primarily `07b` | reconciled through r13; r14 reconnect and r15 conflict handling remain distinct additive status/error authorities |
| Empty / Error / Offline / Update / Reduced Motion | `surfaces/06_EMPTY_ERROR_OFFLINE_UPDATE_REDUCED_MOTION.md` | `23-cross-product-state-system-reference.html` | final representative captures open |
| Music / Media | `surfaces/07_MEDIA_PLAYER.md` | `27-audius-showdown-radio-reference.html`; older 25/26 files retained as evidence | Audius-first architecture current; zero-billing guard locked; device proof, track taste/rights and final player captures open |
| Journey Reconnect r14 | `surfaces/08_JOURNEY_RECONNECT_R14.md` | `28-journey-reconnect-r14-reference.html` | five actual r14 phases represented; desktop local review candidate exists; mobile/package proof remains |
| Journey Conflicts r15 | `surfaces/09_JOURNEY_CONFLICTS_R15.md` | `29-journey-conflicts-r15-reference.html` | runtime classifications mapped to existing action contexts; final state-review captures open |

## Current media architecture

Primary music:

`SHOWDOWN RADIO -> AUDIUS -> one HTML <audio> authority`

- custom compact black/charcoal/gold UI;
- audio-only;
- curated track manifest rather than search on every Home visit;
- current documented Free-plan basis: 10 requests/sec and 500,000 requests/month;
- request limits are API/network requests, not a guaranteed one-request-per-song count;
- conservative capacity planning currently assumes 3–5 counted requests per song start, about 100,000–166,000 starts/month;
- no listener Premium account;
- no autoplay;
- no paid fallback;
- no payment method allowed as an API-overage dependency;
- real audio events own playback state;
- owner approves final track taste separately from UI.

Quota/billing authority:

`evidence/AUDIUS_FREE_QUOTA_AND_BILLING_GUARD_2026-09-10.md`

Project rule:

`paidUpgradeAllowed = false`

`autoOverageAllowed = false`

`paymentMethodAllowed = false`

If Audius ever requires a card, paid overage or an upgrade for the required path, Audius becomes `FINANCIAL_HOLD` and the music lane is disabled rather than charged.

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

## r14 Journey Reconnect implementation impact

Production owns `#sharedJourneyReconnectStatus` beneath `#topHeader` for shared journeys.

R8 preserves exact phases:

- `OFFLINE_HOLD` — non-authoritative offline preservation;
- `RECOVERY_PENDING` — exact private-session operation unresolved;
- `FRESH_SESSION_REQUIRED` — old/expired session not authority, durable journey may remain resumable;
- `ACTIVE_RECOVERED` — active season/history recovered without reset/redraw;
- `TERMINAL_RECOVERED` — completed season plan remains terminal.

This is read-only status presentation. It never mutates Save Library, duplicates Remote Joining, performs provider writes/listing or changes billing.

## r15 Journey Conflicts implementation impact

r15 wraps existing Shared Setup and Shared Season Commit mutations with a non-authorizing conflict guard.

R8 maps the runtime classifications to existing action-context messages rather than inventing a new route:

- `ACCEPTED` — normal success, no conflict warning;
- `STALE` — one bounded retry; if still stale, refresh/review current shared state;
- `REPLAY_ALTERED` — integrity block, changed request not applied;
- `UNAUTHORIZED` — restore exact account/device/private-session authority through existing flows;
- `QUOTA` — provider unavailable, local Career Mode remains available, no paid fallback;
- `TRANSIENT` — bounded retry/refresh;
- `DENIED` — no force bypass;
- `RECEIPT_EXPIRED` — refresh and perform a fresh deliberate action; rivalry itself is not expired.

Firebase transaction/CAS remains the mutation authority. Receipts remain in-memory, non-authorizing, non-canonical and billing-free.

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

1. Keep broad provider research closed; only bounded Audius device/track/rights proof remains.
2. Package the already captured Home wide/Chromebook/mobile and r14 review candidates; do not regenerate frozen characters.
3. Refresh League Wheel after the disabled-state/readability correction.
4. Capture Club Assignment, Dashboard, Transfer, Season Entry/Summary, Statistics, Trophy, Legacy and Rule Book in product-journey order.
5. Capture settings/account/remote joining/restore/cross-product/startup surfaces.
6. Capture the r15 Journey Conflicts review sheet and 390px representative if needed.
7. Fix defects exposed by the final captures and replace stale evidence.
8. Complete real iPhone Safari + Chromebook Audius playback proof and curate final rights-safe queue for owner taste approval.
9. Re-verify frozen/procedural assets and provenance.
10. Re-resolve `main`; reconcile only new real user-visible drift after r15.
11. Present the complete final screenshot set, final media disclosure and device-proof status to the owner.
12. Revise rejected pages/states.
13. Only after explicit complete owner approval create the senior-developer implementation handoff.

## True final gates

R8 is not `FINAL` until:

- exact frozen masters remain hash-identical wherever required;
- final Audius queue has device proof plus rights/provenance/taste approval, or Audius is dropped under the zero-billing guard;
- every required routed/non-route state has a final screenshot;
- all materially different responsive/state variants are represented;
- r15 and any later production-visible additions are reconciled;
- known defects are fixed/reverified;
- owner explicitly approves every required final screenshot and final track selection;
- final implementation map/handoff is sealed.

Current status:

`COMPLETE COVERAGE THROUGH r15 / ACTIVE FINALIZATION — NOT FINAL`.
