# START NEXT VISUAL SESSION — R8.27 Media + Final Screenshot Approval Safe Transfer

Status: SAFE TRANSFER / CONTINUITY AUTHORITY — PROPOSAL NOT FINAL

This document supersedes earlier visual-session starter files for day-to-day continuation. Earlier R8.26 and predecessor handoffs remain historical evidence only.

## 0. Non-negotiable branch and authority boundary

Repository:

`nikahanghojjati-oss/fifa17-career-showdown2`

Visual proposal branch:

`developer/r8-26-complete-proposal-asset-build-r13-work`

Pre-transfer-document proposal HEAD:

`3b46540ae52894fd5b207a1aff9c18209241b4e8`

This handoff file itself advances that branch, so the successor MUST independently resolve the exact current branch HEAD before doing any work. Never assume the pre-transfer HEAD is current.

Production `main` MUST NOT be edited, committed to, merged, deployed or otherwise mutated by the visual track.

Last independently verified production `main`:

`ea96ff1280b5e63962b7ee1a6a8c0980fe4e3686`

Version:

`1.9.1-r13`

MDP:

`77.50`

Main commit meaning:

`MDP: record r13 Multi Season integration at 77.50 (#241)`

Known next product-development direction at this stopping point:

`MDP100 / Journey Reconnect`

The successor must re-check live `main` before editing the proposal because the parallel developer session may have advanced it.

## 1. Why this is the correct transition point

This session reached a clean semantic boundary rather than stopping mid-edit:

- the interrupted Save Library mobile QA loop was completed and passed after a readability fix;
- Connected/private-play mobile QA was completed and passed after a readability fix;
- exact repository Shared Season Results mobile QA was completed and passed, replacing the prior transcription-only proof;
- the owner’s new final screenshot approval requirement was converted into a hard, auditable proposal gate;
- the broken current menu-media experience was investigated against the actual r13 production code;
- a zero-dollar media architecture decision was made and documented;
- a new media surface contract and full desktop/mobile proposal composition were built;
- both media compositions passed internal visual QA;
- `main` was re-checked after this work and remained at the r13 anchor;
- the HTML/CSS renderer quota is now 47/50 with overages disabled, leaving only three renders before reset.

This is therefore a materially better handoff boundary than spending the last three renders or beginning another large page-state batch under heavy context pressure.

## 2. Proposal package root

`visual-proposal/r8-complete-product/`

Important top-level files:

- `ASSET_BUILD_MATRIX.md`
- `QA_AND_PROTOTYPE_FINDINGS.md`
- `README.md`
- `SENIOR_DEVELOPER_FINAL_HANDOFF_REQUIREMENTS.md`
- `START_NEXT_VISUAL_SESSION_R8_26_COMPLETE_PROPOSAL_ASSET_BUILD_SAFE_TRANSFER.md` — historical predecessor
- `START_NEXT_VISUAL_SESSION_R8_27_MEDIA_AND_FINAL_SCREENSHOT_APPROVAL_SAFE_TRANSFER.md` — this continuity authority

Directories:

- `assets/`
- `design-system/`
- `evidence/`
- `implementation-map/`
- `prototypes/`
- `screens/`
- `surfaces/`

## 3. Current proposal status

Current status is:

`COMPLETE COVERAGE, ACTIVE CLOSURE — NOT FINAL`

Do not call the proposal final simply because most screens have contracts/prototypes.

The owner established a new hard finality rule in this session:

1. every built routed page must have a final screenshot;
2. every substantial non-route surface must have a final screenshot;
3. every materially different user-visible version/state must also be represented;
4. screenshots must come from the final reconciled proposal, not obsolete exploration;
5. the entire screenshot package must be shown to the owner;
6. the owner must explicitly approve the final screenshot set;
7. only then may R8 be treated as visually final, subject to the other final gates.

Internal QA PASS is not owner approval.

Authoritative ledger:

`evidence/FINAL_SCREENSHOT_APPROVAL_INDEX.md`

All owner-approved fields are currently NO.

## 4. Core prototype inventory

Routed/reference compositions:

- `prototypes/01-home-reference.html`
- `prototypes/02-create-showdown-reference.html`
- `prototypes/03-league-wheel-reference.html`
- `prototypes/04-club-assignment-reference.html`
- `prototypes/05-dashboard-reference.html`
- `prototypes/06-transfer-challenge-reference.html`
- `prototypes/07a-season-results-local-reference.html`
- `prototypes/07b-season-results-shared-reference.html`
- `prototypes/08-season-summary-reference.html`
- `prototypes/09-rivalry-statistics-reference.html`
- `prototypes/10-career-statistics-reference.html`
- `prototypes/11-trophy-room-reference.html`
- `prototypes/12-legacy-reference.html`
- `prototypes/13-rule-book-reference.html`

Substantial non-route/reference compositions:

- `prototypes/20-settings-save-library-reference.html`
- `prototypes/21-connected-private-rivalry-reference.html`
- `prototypes/22-restore-recovery-reference.html`
- `prototypes/23-cross-product-state-system-reference.html`
- `prototypes/24-startup-header-runtime-reference.html`
- `prototypes/25-native-music-player-reference.html`

Shared reference stylesheet:

`prototypes/r8-proposal-reference.css`

## 5. Frozen character master authority

A01 Nik authoritative SHA-256:

`17972b8afb73b90483c8f874c4bd964ac1bda196daa76e134a6030676bbd4219`

A02 Daniel authoritative SHA-256:

`9b1545b52a5d96a240c92b9901dcd8a4558148dde05a0331882df7bd988177cc`

Source bytes have already been recovered and hash-verified.

Do NOT regenerate A01 or A02.

Do NOT substitute direct user photos.

Manager mapping remains fixed:

- Manager 1 = Daniel
- Manager 2 = Nik

Open binary blocker:

Exact proposal copies under `assets/masters/` are still not packaged because the available GitHub UTF-8 file-write path must not transform/recompress binary image bytes. The successor must use a truly byte-safe repository route, then recompute SHA-256 and verify exact equality before Home final QA.

Home character usage contract:

- wide: A02 Daniel left, A01 Nik right;
- <=1179px current proposal intentionally omits the large character composition before controls are compressed;
- any final responsive change must preserve identity and safe zones.

No evidence currently justifies A03–A06 or new character generation.

## 6. Existing packaged supporting assets

Original/procedural rights-safe supporting assets already resolved:

- `H01_HOME_STADIUM_ATMOSPHERE`
- `S02_TWO_MANAGER_RIVALRY_DIVIDER`
- `S03_WHEEL_STAGE_HALO`
- `S04_CLUB_PACK_FRAME`
- `I01_TROPHY_SYMBOL_FAMILY`
- `I02_SYSTEM_STATE_SYMBOL_FAMILY`

Consult `assets/ASSET_MANIFEST.json` and `ASSET_BUILD_MATRIX.md` before adding anything.

## 7. Screenshot QA authority and retained evidence

Primary QA ledger:

`evidence/PROPOSAL_SCREENSHOT_QA_R13_2026-09-10.md`

Retained PASS evidence:

### Create Showdown desktop

Viewport: `1600×900`

Asset ID:

`01a08bb7-6c59-7f5c-a6af-85c5fd2020ff`

### Create Showdown mobile

Viewport: `390×844`

Asset ID:

`01a08bb7-e245-7fed-8913-3c0736478844`

### Shared Season Results / r13 Multi Season desktop

Viewport: `1600×1100`

Asset ID:

`01a08bb8-b035-7fb2-8cbb-7466818f0554`

### Shared Season Results / exact repository mobile

Viewport: `390px class mobile`

Asset ID:

`01a08bc5-c225-763c-b0ea-84cfe7c774b9`

This supersedes historical transcription-only exploration:

`01a08bb9-3ebd-7d2c-96b7-6b54d56f55a5`

### Legacy desktop

Viewport: `1600×900`

Asset ID:

`01a08bb9-d628-71c1-bea3-b5d7d4620b0c`

Legacy mobile was later visually fixed and passed, but that final renderer ID was not retained. Final owner approval therefore requires a fresh retained mobile Legacy screenshot. Do not invent an ID.

### Atomic Restore & Recovery desktop

Viewport: `1600×900`

Asset ID:

`01a08bba-8475-743a-ae79-d11cec41d6f9`

Restore mobile was later visually fixed and passed, but that final renderer ID was not retained. Final owner approval therefore requires a fresh retained mobile Restore screenshot.

### Connected Account / Pairing / Remote Joining mobile

First render, fix required:

`01a08bc3-e5e1-78bc-bb3b-72193ab32ac4`

Readability fix commit:

`9bea16600dcdc653a5e836241f9ac0b34cf93fcc`

Final PASS renderer ID:

`01a08bc5-0e0f-7dc1-b992-5944186c9756`

### Settings / Save Library / Local Profiles mobile

First render, fix required:

`01a08bc6-4482-7c28-87c1-05aadec20ca2`

Readability fix commit:

`9d24dde34c064600fdd88b99f0087c6eda51bc05`

Final PASS renderer ID:

`01a08bc7-1b03-7785-a02b-dffd05df54ed`

### Showdown Radio / FIFA 17 Originals desktop

Viewport: `1600×1200`

Asset ID:

`01a08be3-8a1c-71c1-a33c-4896cd7ef504`

### Showdown Radio / FIFA 17 Originals mobile

Viewport: `390×2400`

Asset ID:

`01a08be4-10db-7751-9912-38f553d08602`

These are internal QA screenshots only. They are not yet the owner's final approved screenshot set.

## 8. Mobile typography floor learned by actual QA

Several compositions technically fit but failed quality review because small text became pinch-zoom territory.

Use this as the default final mobile floor:

- essential body/status: approximately 13–14px minimum;
- metadata/labels: approximately 11–12px minimum;
- button labels: approximately 12px minimum;
- touch targets: 44px minimum where interactive.

Do not shrink essential information merely to preserve an airy desktop-like composition.

## 9. Media player: actual r13 production failure mechanism

Production files studied:

- `index.html`
- `js/menuExperience.js`

Current Home exposes a YouTube-backed menu-media tile with six FIFA 17 songs and the gameplay trailer.

The current production implementation does NOT use the official `YT.Player` lifecycle as playback authority.

Observed r13 behavior in code:

1. the site Play click sets `menuMediaPlaying = true` immediately;
2. an iframe is created with `autoplay=1` and `enablejsapi=1`;
3. code treats the generic iframe DOM `load` event as a readiness point;
4. after iframe load it sends raw `postMessage` `playVideo` if the optimistic boolean still says playing;
5. custom button labels/status are projected from that local boolean;
6. the integration does not consume official YouTube `onReady`, `onStateChange`, `onAutoplayBlocked` or `onError` signals.

This allows site state to diverge from real provider state. The site can say PLAYING while YouTube is still initializing, buffering, blocked, in an advertisement transition, paused or errored. The owner's repeated pause/play “unstick” behavior is consistent with this race/state divergence.

Do NOT fix this by merely adding more raw play commands or timing delays.

## 10. YouTube audio-only decision

Decision:

`REJECT AS NATIVE/AUDIO-ONLY REPLACEMENT`

Official YouTube policy review established that the project must not:

- separate/isolate YouTube audio from video;
- separately promote a YouTube video's audio component as a custom audio stream;
- hide the provider player to create background-only playback;
- obscure/modify the embedded player in prohibited ways;
- suppress, skip, bypass or work around YouTube advertisements.

Therefore there is no approved design where the current commercial YouTube songs are silently converted to a custom audio-only player.

## 11. Media architecture decision

Read first:

- `surfaces/07_MEDIA_PLAYER.md`
- `evidence/MEDIA_PLAYER_FEASIBILITY_2026-09-10.md`
- `prototypes/25-native-music-player-reference.html`

Recommended architecture:

### Mode A — SHOWDOWN RADIO

Default lightweight native music experience.

- browser-native `<audio>` engine;
- custom R8 compact controls;
- no autoplay on application startup;
- `preload="metadata"` or `preload="none"` after measured implementation choice;
- only the selected source becomes an active media request;
- UI state follows actual audio events;
- no paid service/account required;
- track queue is data, not multiple preloaded media instances.

Only individually rights-verified tracks may enter the final playlist.

Suitable rights classes may include:

- CC0/public domain;
- CC BY with correct attribution;
- other explicit licenses that permit the intended web use.

Every track requires its own rights ledger. A free-to-browse hosting site is not itself a blanket license.

### Mode B — FIFA 17 ORIGINALS

Optional provider-backed mode for the commercial FIFA 17 soundtrack/trailer the owner likes.

If YouTube remains the provider:

- lazy-create after explicit intent;
- use official IFrame Player API lifecycle;
- wait for real readiness;
- project PLAYING/PAUSED/BUFFERING/ENDED/BLOCKED/ERROR from real provider state;
- handle `onAutoplayBlocked` and errors explicitly;
- keep the actual YouTube player visible and compliant;
- do not extract audio;
- do not bypass ads.

This preserves the favorite originals without pretending they are a self-hosted audio library.

## 12. Other free-provider findings

### Spotify

Rejected as the default free route because Web Playback requires the listening user to authenticate with Spotify Premium. That violates the project goal of a frictionless universally free default path and adds an irrelevant account dependency.

### SoundCloud

Technically a valid optional provider surface because its Widget API exposes stateful READY/PLAY/PAUSE/FINISH/error events plus playback controls. However, track availability/permission is still track/provider-specific. It cannot be assumed to contain or legally reproduce the current FIFA 17 commercial soundtrack.

### Wikimedia Commons / Free Music Archive

Useful discovery sources, but every file/track's specific license and attribution terms must be verified. “Free” does not mean unrestricted reuse.

## 13. Native soundtrack rights ledger requirement

Before any native Showdown Radio track is accepted, record at minimum:

- display title;
- artist/creator;
- canonical source page;
- direct media source or packaged asset path;
- exact license/public-domain basis;
- required attribution;
- whether modification is permitted;
- verification date;
- packaged file hash if applicable;
- review status.

No final playlist entry may say `license unknown`.

The four track names currently shown in the media prototype are VISUAL FIXTURES ONLY, not selected/approved songs.

## 14. New media artifacts and commits

### Media surface contract

Path:

`surfaces/07_MEDIA_PLAYER.md`

Creation commit:

`d4c8f010cfc6c8b675034062cd4de83cac07dec4`

### Feasibility / production failure evidence

Path:

`evidence/MEDIA_PLAYER_FEASIBILITY_2026-09-10.md`

Creation commit:

`822526365955be6055e17006bfab30d029ec7198`

### Media proposal composition

Path:

`prototypes/25-native-music-player-reference.html`

Creation commit:

`48e1022ef59fb0e6e0e43ec1ebca910fa26117a0`

Known blob at creation:

`8bb72e68ce946d705b255a66cf0afb393835ca24`

### Final screenshot approval index

Path:

`evidence/FINAL_SCREENSHOT_APPROVAL_INDEX.md`

Creation commit:

`0a4336c2605d6ebb00bd24c89571d0d4724b50c2`

### QA ledger extension

Path:

`evidence/PROPOSAL_SCREENSHOT_QA_R13_2026-09-10.md`

Update commit:

`012a66c06a3f31dc593bd388151165860fa9a8b8`

Known resulting blob:

`d9c0fe489f2f9e86a42035c9b30024e40b37b734`

### Implementation map reconciliation

Path:

`implementation-map/SCREEN_ASSET_STATE_MAP.md`

Update commit:

`4e18ae8b36630f7259a8ce29dad67f616a4ec846`

Known resulting blob:

`7ecb06bb8ea4bb2e189c0548a08f32a2c34ed2fc`

### Senior handoff requirements reconciliation

Path:

`SENIOR_DEVELOPER_FINAL_HANDOFF_REQUIREMENTS.md`

Update commit / pre-transfer HEAD:

`3b46540ae52894fd5b207a1aff9c18209241b4e8`

Known resulting blob:

`730babed413cf48282543ec2ffacd5a24fa87807`

## 15. Renderer quota: important operational constraint

At transition:

- used: `47`
- allowed: `50`
- remaining: `3`
- overages: `disabled`
- reported reset: `2026-10-09T18:54:39Z`

Do NOT casually spend the final three renders.

The full owner approval set is much larger than three screenshots. A successor should preserve those remaining renders for a high-value defect check, exact Home blocker proof, or another urgent state unless a legitimate fresh/reset/alternative rendering capacity becomes available.

Never enable paid overages. Zero-dollar rule remains permanent.

## 16. Final screenshot approval inventory

Read the full authoritative table:

`evidence/FINAL_SCREENSHOT_APPROVAL_INDEX.md`

It covers routed screens and substantial non-route surfaces including:

- Home wide/reduced-wide/Chromebook/mobile/media integration;
- Create Showdown desktop/mobile/validation if material;
- League Wheel ready/resolved/shared states;
- Club Assignment sealed/reveal/locked;
- Dashboard active/multi-season/terminal where material;
- Transfer ready/active/verdict;
- Local Season Results incomplete/completed;
- Shared Season Results desktop/mobile and all three r13 Multi Season states;
- Season Summary winner/draw/terminal;
- Rivalry Stats populated/sparse/tied;
- Career Stats empty/populated/unresolved where reachable;
- Trophy Room empty/populated;
- Legacy desktop/mobile/fail-closed;
- Rule Book wide/mobile;
- Save Library desktop/mobile/delete/empty where reachable;
- Connected/Pairing/Remote Joining/reconciliation/recovery pending;
- Restore verify/apply-ready/critical recovery/conflict;
- shared empty/error/offline/update/reduced-motion grammar;
- Startup/header/runtime notices;
- Showdown Radio desktop/mobile/provider/failure and actual Home compact integration.

Do not pre-invent Journey Reconnect screenshots. Add exact rows after real production UI/state exists.

## 17. Open blockers in priority order

### P0 — re-resolve live main

First successor action. If main advanced, study only the actual visible delta and reconcile without throwing away unaffected proposal work.

### P1 — exact A01/A02 byte-safe packaging

Find a binary-safe repository route, copy exact masters under proposal assets, recompute SHA-256 and prove exact equality.

No regeneration.

### P2 — integrate compact Showdown Radio into Home proposal

`25-native-music-player-reference.html` is a review sheet, not yet the exact actual Home composition.

Reconcile its compact native player into `01-home-reference.html` while preserving Home primary Career actions and character safe zones.

Keep FIFA 17 Originals as an optional/lazy provider mode, not a huge always-loaded block on Home.

### P3 — native track curation / rights ledger

Search for a small football/FIFA-era-feeling playlist from genuinely reusable sources.

Do not optimize only for “free”. Optimize for:

- rights certainty;
- zero-dollar hosting/playback;
- energetic but non-intrusive menu vibe;
- high audio quality;
- reasonable file size;
- stable source availability;
- clear attribution.

Record each candidate's exact license before it appears as final content.

### P4 — Home final QA

After exact masters + compact media integration:

- wide desktop;
- reduced-wide;
- Chromebook/tablet;
- mobile.

Home is the most important remaining visual target.

### P5 — final screenshot approval index execution

Work systematically through `FINAL_SCREENSHOT_APPROVAL_INDEX.md`.

Do not use one default screenshot per prototype when materially distinct states exist.

Do not manufacture irrelevant states merely to inflate coverage.

### P6 — refresh retained mobile evidence gaps

When renderer capacity allows:

- Legacy mobile final retained screenshot;
- Restore/Recovery mobile final retained screenshot.

Both had prior successful post-fix visual reviews, but their IDs were not retained. Final approval requires stable retained evidence.

### P7 — renderer/state/accessibility QA

Continue representative visual QA and preserve:

- responsive typography floor;
- focus requirements;
- no control/art collision;
- reduced motion rules;
- provider/local authority distinction;
- destructive states;
- no baked/mirrored UI text.

Real DOM focus/dialog/runtime behavior belongs to senior implementation or an executable product-browser phase; static composition alone cannot prove it.

### P8 — Journey Reconnect and later production reconciliation

When `main` advances, add exact proposal coverage only for real new visible states.

Do not guess future product architecture.

### P9 — mandatory final-main reconciliation

After the main developer reaches the actual final product checkpoint:

- re-inventory every routed screen;
- inventory substantial overlays/panels/state families;
- compare against R8;
- revise stale proposal assumptions;
- record exact final-main commit.

No r13 anchor may substitute for this final reconciliation if development has advanced.

### P10 — owner final screenshot review

After all final reconciled screenshots are ready:

- present them all in screen order;
- group variants under their page/surface;
- make it easy for owner to approve/reject per state;
- fix anything rejected;
- record explicit approval only after the owner approves.

### P11 — final senior developer handoff

Only after owner screenshot approval and all other gates close, create the final concise implementation handoff.

Read:

`SENIOR_DEVELOPER_FINAL_HANDOFF_REQUIREMENTS.md`

The final handoff must state that visual proposal approval is not deployment approval and that the visual track never modified/deployed `main`.

## 18. First ten successor actions

1. Read this R8.27 safe transfer completely.
2. Independently fetch current proposal branch HEAD and current `main`.
3. If `main` changed from `ea96ff...`, inspect actual new visible UI/state behavior before touching R8.
4. Read `implementation-map/SCREEN_ASSET_STATE_MAP.md`.
5. Read `evidence/FINAL_SCREENSHOT_APPROVAL_INDEX.md`.
6. Read the media trio: `surfaces/07_MEDIA_PLAYER.md`, `evidence/MEDIA_PLAYER_FEASIBILITY_2026-09-10.md`, `prototypes/25-native-music-player-reference.html`.
7. Inspect the exact A01/A02 source-byte availability and solve packaging only through a binary-safe path.
8. Reconcile compact Showdown Radio into the real Home proposal without spending screenshot quota prematurely.
9. Begin a per-track rights candidate ledger for the native playlist, keeping all unverified tracks out of final UI claims.
10. Only after the composition is materially ready, spend renderer capacity on the highest-value unresolved proof, normally Home with exact masters.

## 19. Anti-drift / anti-random-generation guard

This project is a UI/UX production process, not a stream of random image generation.

Do not generate an image merely because a new session started.

Before any new generated art:

- prove a screen/state requires it;
- check existing A01/A02 and supporting assets;
- create a screen-specific brief;
- preserve Manager 1 Daniel / Manager 2 Nik;
- verify identity, anatomy, safe-zone, rights and responsive need;
- package and hash the accepted asset.

Most current unresolved work is composition, binary packaging, state QA, media rights, final-main reconciliation and screenshot approval—not new character generation.

## 20. Zero-dollar and product authority locks

Permanent:

- Firebase Spark only where Firebase is involved;
- billing remains off;
- no paid tiers/services required for the site;
- no public discovery/community/rankings;
- private two-manager scope remains intact;
- no new synchronization protocol from the visual layer;
- proposal does not own persistence/provider/network authority;
- no hidden paid media API dependency;
- no YouTube audio extraction/ad bypass;
- no production `main` edits by the visual track.

## 21. Final state at transfer

Proposal:

`NOT FINAL`

Main study anchor:

`ea96ff1280b5e63962b7ee1a6a8c0980fe4e3686` / `1.9.1-r13` / MDP `77.50`

Pre-transfer proposal HEAD:

`3b46540ae52894fd5b207a1aff9c18209241b4e8`

The successor must resolve the post-handoff branch HEAD fresh because creating this file advances it.

Largest remaining blockers:

- exact A01/A02 binary packaging;
- Home compact media integration;
- real native soundtrack rights selection;
- broad final screenshot set;
- final-main/Journey Reconnect reconciliation;
- owner explicit screenshot approval;
- only then final senior implementation handoff.

This is a safe transition point. Continue from here; do not restart the visual system or reinterpret earlier QA from scratch.