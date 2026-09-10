# R8 Screen / Asset / State Implementation Map

Status: COVERAGE COMPLETE THROUGH r16 — AUDIUS LOCKED — SIX-POSE CHARACTER LANE OPEN — FINAL SCREENSHOT / DEVICE-PROOF / OWNER-APPROVAL GATES OPEN

Current production reconciliation anchor:

`613e031c648d8d5cdb4e260e74cd93f895f49872` / `1.9.1-r16`.

Reconciled production additions:

- r13 Shared Multi Season progression;
- r14 Shared Journey Reconnect;
- r15 Shared Journey Conflicts;
- r16 Shared Journey Local Reconciliation, presented inside the existing Settings / Connected Rivalry authority.

Senior production implementation remains deferred until final owner screenshot approval and a fresh final-main reconciliation.

## Routed product map

| Screen | Contract / composition | Character / asset decision | Remaining closure work |
| --- | --- | --- | --- |
| Home | `screens/01_HOME_MAIN_MENU.md`, `surfaces/07_MEDIA_PLAYER.md`, `prototypes/01-home-reference.html` | H01 stadium; exact A02 Daniel left + A01 Nik right on wide; omit large art <=1179; Audius compact player | fresh final captures after current Home media edit; Audius real-device proof + track approval |
| Create Showdown | `screens/02_CREATE_SHOWDOWN.md`, `02-create-showdown-reference.html` | S02 divider; character optional, default omit | final-main check; wide/mobile owner captures; validation state only if materially real |
| League Wheel | `screens/03_LEAGUE_WHEEL.md`, `03-league-wheel-reference.html` | S03 halo; A07/A08 focused poses optional only if wheel safe-zone remains clear | refresh ready/resolved/shared captures after disabled-state/readability correction |
| Club Assignment | `screens/04_CLUB_ASSIGNMENT.md`, `04-club-assignment-reference.html` | S04 original pack frame + preferred A05/A06 pack-opening variants | build/isolate final A05/A06, integrate, capture sealed/reveal/locked |
| Showdown Home | `screens/05_SHOWDOWN_HOME_DASHBOARD.md`, `05-dashboard-reference.html` | A03/A04 confident or A07/A08 focused optional; score/history remains hero | active/later-season/terminal-if-real captures |
| Transfer Challenge | `screens/06_TRANSFER_CHALLENGE.md`, `06-transfer-challenge-reference.html` | A07/A08 optional; privacy/timer/input density wins | ready/active/verdict captures |
| Season Results | `screens/07_SEASON_RESULTS_ENTRY.md`, `07a`, `07b` | character normally omitted | local entry states; shared state refresh only if final-main changes contract; r15 conflict consequences separate |
| Season Summary | `screens/08_SEASON_SUMMARY.md`, `08-season-summary-reference.html` | preferred A09/A10 winner + A11/A12 setback on wide; neutral/focused for draw | build/isolate outcome assets; winner/draw/terminal captures |
| Rivalry Statistics | `screens/09_RIVALRY_STATISTICS.md`, `09-rivalry-statistics-reference.html` | no character by default | populated/sparse/tied/mobile captures |
| Career Statistics | `screens/10_CAREER_STATISTICS.md`, `10-career-statistics-reference.html` | no character by default | empty/populated/unresolved-if-real captures |
| Trophy Room | `screens/11_TROPHY_ROOM.md`, `11-trophy-room-reference.html` | I01 original generic trophy family; A09/A10 optional small celebratory support | empty/populated/mobile captures + similarity QA |
| Legacy | `screens/12_LEGACY.md`, `12-legacy-reference.html` | archive-first; neutral/reflective crop optional but not required | mobile refresh + corrupt/fail-closed capture |
| Rule Book | `screens/13_RULE_BOOK.md`, `13-rule-book-reference.html` | character omitted | wide/mobile/long-copy captures + final content check |

## Cross-product map

| Surface | Contract / composition | Closure state |
| --- | --- | --- |
| Startup / Header / Runtime | `surfaces/01_STARTUP_HEADER_RUNTIME.md`, `24-startup-header-runtime-reference.html` | final visual/focus evidence open |
| Settings / Save Library / Local Profiles | `surfaces/02_SETTINGS_SAVE_LIBRARY_LOCAL_PROFILES.md`, `20-settings-save-library-reference.html` | mobile readability fix exists; final desktop/state captures open |
| Connected Account / Pairing / Rivalry / Remote Joining | `surfaces/03_CONNECTED_ACCOUNT_PAIRING_RIVALRY_REMOTE_JOINING.md`, `21-connected-private-rivalry-reference.html` | reconciled through r16; r16 Local Reconciliation is an additive Settings / Connected Rivalry state family; final desktop/mobile/recovery/reconciliation captures open |
| Backup / Import / Restore / Recovery | `surfaces/04_BACKUP_IMPORT_RESTORE_RECOVERY.md`, `22-restore-recovery-reference.html` | Candidate C remains product Apply authority; desktop QA exists; mobile/apply-ready/critical captures open |
| Shared Play / Multi Season | `surfaces/05_SHARED_PLAY_STATE_SYSTEM.md`, primarily `07b` | reconciled through r13; r14/r15/r16 remain additive status/action-context layers without a new route |
| Empty / Error / Offline / Update / Reduced Motion | `surfaces/06_EMPTY_ERROR_OFFLINE_UPDATE_REDUCED_MOTION.md`, `23-cross-product-state-system-reference.html` | final representative captures open |
| Music / Media | `surfaces/07_MEDIA_PLAYER.md`, `27-audius-showdown-radio-reference.html`, Home compact player | Audius locked; autoplay rejected; SoundCloud default lane deferred; device/rights/taste proof open |
| Journey Reconnect r14 | `surfaces/08_JOURNEY_RECONNECT_R14.md`, `28-journey-reconnect-r14-reference.html` | five actual phases represented; final desktop/mobile evidence open |
| Journey Conflicts r15 | `surfaces/09_JOURNEY_CONFLICTS_R15.md`, `29-journey-conflicts-r15-reference.html` | classifications mapped to existing action contexts; final state-review evidence open |
| Local Reconciliation r16 | `surfaces/03_CONNECTED_ACCOUNT_PAIRING_RIVALRY_REMOTE_JOINING.md`, `21-connected-private-rivalry-reference.html`, `evidence/R16_SHARED_JOURNEY_LOCAL_RECONCILIATION_2026-09-10.md` | existing Settings / Connected Rivalry ownership proven; Candidate B preview + Candidate C backup-first explicit Apply preserved; final state-review evidence open |

## Character system authority

Manager mapping is immutable:

- Manager 1 = Daniel;
- Manager 2 = Nik.

Frozen identity anchors remain unchanged:

- A01 Nik SHA-256 `17972b8afb73b90483c8f874c4bd964ac1bda196daa76e134a6030676bbd4219`;
- A02 Daniel SHA-256 `9b1545b52a5d96a240c92b9901dcd8a4558148dde05a0331882df7bd988177cc`.

Owner-directed final target is six role variants per manager, not repeated A01/A02 everywhere.

Nik target:

- A01 core thinking hero;
- A03 confident presentation;
- A05 club-pack opening;
- A07 focused/determined;
- A09 victory/happy;
- A11 natural setback.

Daniel target:

- A02 core pointing hero;
- A04 confident presentation;
- A06 club-pack opening;
- A08 focused/determined;
- A10 victory/happy;
- A12 natural setback.

Authority:

`assets/CHARACTER_POSE_LIBRARY_PLAN.md`

Victory/setback selection is deterministic presentation derived from existing authoritative outcome data. It never adds Firestore/local-storage fields and never modifies Spark/Firebase/provider authority.

Pages may omit character art where it would reduce clarity. Utility/recovery/settings/rule surfaces remain character-free.

## Media architecture

Primary:

`SHOWDOWN RADIO -> AUDIUS -> one HTML <audio> authority`

- audio-only;
- compact custom black/charcoal/gold player;
- UI shell and curated manifest may load eagerly;
- audio stream bytes begin only after deliberate Play;
- autoplay OFF by owner decision;
- no hidden muted-autoplay trick;
- no YouTube music fallback;
- no listener Premium account;
- no paid fallback;
- real audio events own READY/PLAYING/PAUSED/BUFFERING/ENDED/ERROR.

Current Audius Free documentation reference:

- 10 requests/second;
- 500,000 requests/month;
- Free described as always free;
- Unlimited separate.

Project financial invariants:

`paidUpgradeAllowed = false`

`autoOverageAllowed = false`

`paymentMethodAllowed = false`

Before production adoption, API-key creation must be proven without billing enrollment. Any required card/pay-as-you-go/paid-overage path disqualifies Audius.

SoundCloud exact-song nostalgia is DEFERRED from the default proposal. Historical research remains available if the owner explicitly reopens it.

YouTube is never a music fallback. It may remain only for an intentional visible gameplay trailer.

## r14 Journey Reconnect

Production owns `#sharedJourneyReconnectStatus` beneath `#topHeader`.

R8 preserves:

- `OFFLINE_HOLD`;
- `RECOVERY_PENDING`;
- `FRESH_SESSION_REQUIRED`;
- `ACTIVE_RECOVERED`;
- `TERMINAL_RECOVERED`.

Read-only status presentation only; no Save mutation, no duplicate Remote Joining flow, no billing.

## r15 Journey Conflicts

r15 wraps existing Shared Setup and Shared Season Commit mutation paths with a non-authorizing conflict guard.

R8 maps:

- `ACCEPTED` -> ordinary success;
- `STALE` -> bounded retry then refresh/review if still stale;
- `REPLAY_ALTERED` -> changed request not applied;
- `UNAUTHORIZED` -> existing account/device/private-session recovery;
- `QUOTA` -> cloud action temporarily unavailable, local Career Mode preserved, no paid fallback;
- `TRANSIENT` -> bounded retry/refresh;
- `DENIED` -> no force bypass;
- `RECEIPT_EXPIRED` -> refresh current shared state, then fresh deliberate action.

No new route or conflict inbox.

## r16 Shared Journey Local Reconciliation

Production ownership is the existing Settings overlay / Connected Rivalry panel. r16 projects Shared Journey state into the existing Candidate B/C recovery boundary; it does not own a second UI route or writer.

R8 maps the actual product phases to that existing panel:

- `WAITING_REMOTE` -> no remote envelope observed yet; no Apply affordance;
- `REMOTE_OBSERVED` -> exact remote revision/hash visible, observation only;
- `PREVIEW_READY` -> exact remote revision and exact local target reviewed in a non-mutating preview;
- `OFFLINE_FALLBACK` -> already-observed envelope may remain previewable, Apply explicitly unavailable;
- `APPLIED` -> reviewed revision completed through Candidate C after verified backup and guarded transaction;
- blocked/error -> fail-closed status, no force/bypass, local Career Mode availability preserved where runtime authority supports it.

Permanent r16 visual constraints:

- Candidate B remains read-only preview;
- Candidate C remains sole destructive local Apply authority;
- explicit confirmation before Apply;
- backup-first Apply language;
- no direct visual-layer canonical-storage mutation;
- no new Firestore/provider authority;
- no public discovery or new Remote Joining flow;
- Firebase Spark only and Billing OFF.

## Supporting visual assets

Original/procedural assets:

- `H01_HOME_STADIUM_ATMOSPHERE`;
- `S02_TWO_MANAGER_RIVALRY_DIVIDER`;
- `S03_WHEEL_STAGE_HALO`;
- `S04_CLUB_PACK_FRAME`;
- `I01_TROPHY_SYMBOL_FAMILY`;
- `I02_SYSTEM_STATE_SYMBOL_FAMILY`.

Character variant generation is now intentionally open only for A03–A12. No unrelated raster generation is justified.

## Screenshot and QA authority

Final gate:

`evidence/FINAL_SCREENSHOT_APPROVAL_INDEX.md`

Internal historical QA:

`evidence/PROPOSAL_SCREENSHOT_QA_R13_2026-09-10.md`

Mobile floor:

- essential body/status ~13–14px minimum;
- metadata/labels ~11–12px minimum;
- button labels ~12px minimum;
- touch targets 44px minimum.

External HTML renderer budget observed during closure: 47/50 included renders consumed, overages disabled. Remaining renders are reserved; zero-dollar closure must prefer local/self-contained capture and consolidated review sheets.

## Closure order

1. Keep provider research closed except bounded Audius API-key/billing and device proof.
2. Complete A03–A12 character production using the recovered approved identity/pose references; reject identity/anatomy drift.
3. Integrate A05/A06 into Club Assignment and A09–A12 into authoritative Season Summary outcome variants where safe.
4. Produce one character contact sheet for explicit owner approval.
5. Refresh Home wide/Chromebook/mobile after the final Audius control edit.
6. Refresh League Wheel after disabled-state/readability correction.
7. Capture/QA Club Assignment, Dashboard, Transfer, Season Results, Season Summary, Statistics, Trophy, Legacy and Rule Book in product-journey order.
8. Capture/QA Settings, Connected/Remote Joining, r16 Local Reconciliation, Restore/Recovery, cross-product states, Startup/Header, r14 Reconnect and r15 Conflict consequences.
9. Run structural/automated proposal checks and repair failures.
10. Complete real iPhone Safari + Chromebook Audius playback proof and final rights-safe queue selection.
11. Re-verify asset hashes/provenance.
12. Re-resolve `main`; reconcile only genuine new user-visible drift after r16.
13. Assemble every materially distinct final screenshot/version in journey order.
14. Present the complete package plus media functionality/track disclosure and character contact sheet to the owner.
15. Revise any rejected page/state/character.
16. Only after explicit complete owner approval seal the proposal and produce the senior-developer implementation handoff.

## True final gates

R8 is not `FINAL` until:

- A01/A02 remain hash-identical;
- at least five distinct approved roles per manager exist, target six including natural setback;
- final Audius queue has device proof plus rights/provenance/taste approval, or Audius is rejected under zero-billing guard;
- every required routed/non-route state has a final screenshot;
- materially different responsive/state variants are represented;
- r16 and any later production-visible additions are reconciled;
- known visual/structural defects are fixed and reverified;
- automated proposal checks pass;
- owner explicitly approves the final character set, final track selection and every required screenshot;
- final implementation handoff is sealed only afterward.

Current status:

`COMPLETE PRODUCT COVERAGE THROUGH r16 / ACTIVE ASSET + QA FINALIZATION — NOT FINAL`.
