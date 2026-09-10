# R8 Structural QA — r16 Reconciliation / Character / Media Closure

Status: PARTIAL STRUCTURAL QA PASS — NO OWNER FINALITY CLAIM

Verification date: 2026-09-10.

This is proposal-only QA. It records checks actually performed against the live visual branch and current production authority. It does not substitute for final browser/device screenshots, real-device Audius playback, final character generation or owner approval.

## 1. Live source / containment

PASS — current production main was re-resolved during the session to:

`4c4975c1d3982ce6b2d8d4b37c0a6a15d94b625a`

The one-commit advance after executable r16 (`613e031...`) is MDP accounting/provenance-only. Its changed files are milestone/readiness/accounting contracts, not HTML/CSS/runtime JS/Firestore Rules/service-worker product source.

PASS — the visual branch remained based on the R8.26 authority base:

`4f35d9e881267abf9b4daaea3022bf9b4799be10`

Latest containment checkpoint before this QA record:

- visual head `79e872073318f8d14ad59fce847573bff1c61a3b`;
- ahead 145;
- behind 0;
- every changed path returned by compare is under `visual-proposal/r8-complete-product/`.

No production source path has been modified by this proposal branch.

## 2. r16 ownership / authority boundary

PASS — exact executable r16 source was inspected:

- `R16_LOCAL_RECONCILIATION_CANDIDATE.md`;
- `js/sharedLocalReconciliation.js`;
- `js/productionSharedLocalReconciliation.js`;
- `js/sparkConnectedRivalry.js`.

PASS — user-visible ownership is the existing Settings overlay / Connected Rivalry panel. No new route is justified.

PASS — proposal preserves:

- Candidate B as non-mutating preview/observation;
- Candidate C as the sole destructive local Apply authority;
- explicit confirmation;
- online authority revalidation;
- verified backup before local mutation;
- exact remote revision/content and exact local target guards;
- fail-closed offline Apply;
- unrelated-save immutability;
- no direct r16 adapter write to canonical local storage.

PASS — `surfaces/03_CONNECTED_ACCOUNT_PAIRING_RIVALRY_REMOTE_JOINING.md`, `prototypes/21-connected-private-rivalry-reference.html`, `implementation-map/SCREEN_ASSET_STATE_MAP.md` and `evidence/FINAL_SCREENSHOT_APPROVAL_INDEX.md` now represent r16 as an additive Connected Rivalry state family only.

## 3. Manager mapping / character authority

PASS — `assets/ASSET_MANIFEST.json` parses structurally as a single manifest and retains:

- `manager1 = Daniel`;
- `manager2 = Nik`;
- `productionAuthority = false`.

PASS — immutable A01/A02 source bytes were recovered from the Showdown visual Library package and independently re-hashed:

- A01 Nik: `17972b8afb73b90483c8f874c4bd964ac1bda196daa76e134a6030676bbd4219`, 1086 × 1448 RGBA;
- A02 Daniel: `9b1545b52a5d96a240c92b9901dcd8a4558148dde05a0331882df7bd988177cc`, 1086 × 1448 RGBA.

PASS — the manifest contains the same immutable hashes and keeps both masters in packaging-open rather than falsely claiming repository binary placement.

PASS WITH OPEN FINALIZATION — recovered A05/A06 pack candidates were measured and reviewed individually. Both are useful full-size RGBA candidates, but both retain baked generated `CLUB PACK / CM17` prop text. They remain internal candidates requiring text-free prop cleanup/rebuild and new QA; they are not promoted as final masters.

OPEN — A03/A04/A07/A08/A09/A10/A11/A12 final generations.

OPEN — A05/A06 cleaned final isolated masters.

OPEN — exact A01/A02 byte-safe `assets/masters/` repository placement.

## 4. r14 / r15 / r16 state inventories

PASS — r14 surface contract includes all five actual Journey Reconnect phases:

- `OFFLINE_HOLD`;
- `RECOVERY_PENDING`;
- `FRESH_SESSION_REQUIRED`;
- `ACTIVE_RECOVERED`;
- `TERMINAL_RECOVERED`.

PASS — r15 surface contract includes the production conflict classification family:

- `ACCEPTED`;
- `STALE`;
- `REPLAY_ALTERED`;
- `UNAUTHORIZED`;
- `QUOTA`;
- `TRANSIENT`;
- `DENIED`;
- `RECEIPT_EXPIRED`.

PASS — r16 final screenshot gate includes waiting/observed, preview-ready, offline-preview-only, confirmed Apply-ready, applied, blocked/error and mobile confirmation evidence rows without inventing a route.

## 5. Audius structural checks

PASS — `prototypes/27-audius-showdown-radio-reference.html` contains one native HTML `<audio>` authority with `preload="none"`.

PASS — no `autoplay` attribute is present and first stream source assignment occurs only inside deliberate Play handling.

PASS — visible PLAYING state is driven by the audio element's `playing` event rather than by the button click alone.

PASS — `ended` does not auto-start the next queue item.

PASS — provider/network error remains player-local and does not call a paid or video fallback.

PASS — the current functional prototype contains no SoundCloud runtime lane and no YouTube music fallback. SoundCloud remains deferred. Optional YouTube is described only as a separate intentional gameplay-video surface.

PASS — current public Audius documentation was rechecked for Free-plan limits and public read-only API behavior, and the Open Music License Music Player basis was added to the media evidence. This is provider/rights evidence only, not device playback proof.

OPEN — exact final track IDs / Alternative License fields and attribution records.

OPEN — iPhone Safari playback proof.

OPEN — Chromebook playback proof.

OPEN — seek/volume/platform behavior proof.

OPEN — owner listening/taste approval.

## 6. Finality / screenshot gate

PASS — `evidence/FINAL_SCREENSHOT_APPROVAL_INDEX.md` remains explicitly OPEN / NOT FINAL.

PASS — all required current owner-approval cells remain `NO`; no `OWNER APPROVED` item was introduced by internal QA.

PASS — r16 rows were added to the final screenshot gate.

OPEN — final wide / Chromebook / mobile screen captures.

OPEN — r14/r15/r16 final state evidence.

OPEN — character contact sheets and affected Club Assignment / Season Summary captures.

OPEN — Audius READY/PLAYING/PAUSED/ERROR/queue/Home captures.

External HTML renderer budget remains protected at the prior observed 47/50 usage with overages disabled. No new external render was consumed during this QA pass.

## 7. Automation execution boundary

The branch currently has no GitHub Actions workflow runs of its own. Therefore this record does not claim branch CI execution.

A local zero-cost browser capture was attempted but the available sandbox browser blocks both local `file://` and loopback page loading by policy. No browser screenshot from that environment is counted as evidence and no external renderer allowance was spent to bypass the restriction.

Full automated file-system validation remains an open closure item because an executable checkout of the visual branch was not available in this environment. Source-level structural checks above were performed directly against live repository files and exact compare results.

## 8. Result

Current structural result:

`R16 OWNERSHIP PASS / PROPOSAL CONTAINMENT PASS / MANAGER MAPPING PASS / A01-A02 HASH PASS / R14-R16 STATE INVENTORY PASS / AUDIUS STRUCTURAL PASS / FINAL CHARACTER, REAL-DEVICE, FULL AUTOMATED CHECKOUT QA, SCREENSHOT AND OWNER-APPROVAL GATES OPEN`

This proposal must remain `NOT FINAL` until those open gates close and Nik explicitly approves the complete final review package.
