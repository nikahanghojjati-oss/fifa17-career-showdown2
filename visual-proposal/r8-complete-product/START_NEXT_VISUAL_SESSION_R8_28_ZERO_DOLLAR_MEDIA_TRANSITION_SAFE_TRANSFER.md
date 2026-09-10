# START NEXT VISUAL SESSION — R8.28 ZERO-DOLLAR MEDIA TRANSITION + FINAL ASSET/SCREENSHOT CLOSURE — SAFE TRANSFER

Status: MEDIA RESEARCH TRANSITIONED / PROPOSAL BUILD CONTINUES / OWNER FINAL APPROVAL OPEN

This file supersedes `START_NEXT_VISUAL_SESSION_R8_27_MEDIA_MASTER_CLOSURE_SCREENSHOT_BUILD_SAFE_TRANSFER.md` wherever that older transfer describes the media-provider architecture. Preserve all non-conflicting R8.27 asset recovery, frozen-master, screen coverage and finality instructions.

Do not restart the visual project. Do not generate random images. Do not regenerate the approved Nik/Daniel masters. Do not patch/deploy production `main` from this visual branch. Do not call the proposal final until final-main reconciliation, complete screenshot evidence and explicit owner approval are complete.

## 1. Current repository anchors

Repository:

`nikahanghojjati-oss/fifa17-career-showdown2`

Production main re-resolved during the media transition:

`97c28b1efea6ee6e901e6076a834ec419cbad5aa`

Commit:

`SSJR r14: Journey Reconnect and coherent r14 shell (#242)`

Visual working branch:

`developer/r8-26-complete-proposal-asset-build-r13-work`

This transfer file necessarily advances the visual head. Resolve the current tip before editing.

## 2. Owner locks

- zero-dollar permanently;
- no paid API tier;
- no payment-card prerequisite;
- no automatic overage or automatic upgrade;
- no listener Premium subscription as the default experience;
- Firebase Spark only / billing off remains untouched;
- Manager 1 = Daniel;
- Manager 2 = Nik;
- approved A01/A02 masters remain frozen exact binaries;
- proposal follows actual product UI/UX and state authority;
- no invented product features;
- no random asset generation;
- final screenshots must be presented to and explicitly approved by the owner before the proposal is `FINAL`.

## 3. Why media research is now transitioned

The broad provider search is closed. The remaining media work is proof, composition, QA and owner review.

Authoritative files:

- `surfaces/07_MEDIA_PLAYER.md`
- `evidence/MEDIA_PLAYER_FEASIBILITY_2026-09-10.md`
- `evidence/MEDIA_PROVIDER_ZERO_DOLLAR_DECISION_2026-09-10.md`
- `evidence/MEDIA_SCREENSHOT_APPROVAL_ADDENDUM_2026-09-10.md`
- `prototypes/25-native-music-player-reference.html`
- `prototypes/26-native-music-player-functional-reference.html`
- `prototypes/26-soundcloud-fifa17-audio-provider-reference.html`
- `SENIOR_DEVELOPER_FINAL_HANDOFF_REQUIREMENTS.md`

The old R8.27 statement that native Showdown Radio is necessarily the primary exact-soundtrack route is superseded.

## 4. Final zero-dollar provider architecture

### Exact six FIFA 17 songs

Per track:

1. preferred: SoundCloud HTML5 Widget only after full-length device proof;
2. fallback: hardened visible YouTube IFrame Player API;
3. if both fail: `TRACK UNAVAILABLE` without affecting Career Mode.

All six current project songs have exact public SoundCloud candidate pages recorded in `MEDIA_PROVIDER_ZERO_DOLLAR_DECISION_2026-09-10.md`:

- Two Door Cinema Club — Are We Ready? (Wreck)
- Bastille — Send Them Off!
- Glass Animals — Youth
- Porter Robinson & Madeon — Shelter
- Saint Motel — Move
- Empire Of The Sun — High And Low

SoundCloud is audio-first and its standard Widget API provides real provider state events. It avoids the permanent large-video experience for tracks that pass proof.

Public-page availability is not proof of full embedded playback. SoundCloud Go catalogue tracks may expose only a short embedded preview, and uploaders can control embedding. Eligibility is therefore per track.

### Trailer

The FIFA 17 gameplay trailer remains YouTube video provider content.

### Optional additional radio

Browser-native rights-verified audio and Audius may provide additive Showdown Radio music later.

Audius is currently a strong zero-dollar open-audio option, with official documentation recording a Free plan of 10 requests/second and 500,000 requests/month and describing that plan as always free with no restrictions. Its exact catalogue search did not establish dependable official copies of the current six FIFA 17 commercial tracks, so it is not the exact-six replacement.

## 5. Financial fail-closed invariant

Conceptual product lock:

`paidUpgradeAllowed = false`

If SoundCloud, Audius, YouTube or any future provider changes terms such that payment is required:

- disable that provider path;
- use another already-approved zero-dollar provider if available;
- otherwise show media unavailable;
- never purchase, upgrade, add billing, create overage exposure or make Career Mode unusable.

No media provider owns Career Mode availability.

## 6. Production YouTube failure remains current on r14

The r14 `js/menuExperience.js` still uses the same problematic authority model studied on r13:

- local `menuMediaPlaying` changes before provider confirmation;
- iframe constructed with autoplay intent;
- generic iframe DOM `load` used as readiness;
- raw postMessage play/pause commands;
- no official `YT.Player` `onReady` / `onStateChange` / `onAutoplayBlocked` / `onError` state authority.

Do not port this behavior into the final design implementation.

Required YouTube conceptual state machine:

`idle -> provider_loading -> ready -> play_requested -> playing | buffering | blocked | error -> paused | ended`

A click expresses intent. It is not evidence that playback started.

Do not create hidden audio-only YouTube playback, extract commercial audio or work around ads.

## 7. New SoundCloud exact-song functional reference

File:

`prototypes/26-soundcloud-fifa17-audio-provider-reference.html`

It is proposal/reference code, not production authority.

It contains:

- one visible SoundCloud widget;
- the exact six current FIFA 17 song URLs;
- current YouTube fallback IDs;
- no project API key;
- no paid plan;
- `auto_play=false`;
- Play disabled until provider `READY`;
- UI `PLAYING` only after provider `PLAY`;
- `PAUSE`, `FINISH`, `ERROR` and `PLAY_PROGRESS` state handling;
- `widget.load(...)` for track switching;
- duration inspection to flag a likely short preview;
- provider-visible attribution;
- explicit per-track YouTube fallback metadata;
- responsive R8 black/charcoal/gold composition.

Do not interpret a successful desktop load as final proof. Device proof remains mandatory.

## 8. Immediate media proof task

Test every one of the six exact SoundCloud candidates on:

1. iPhone Safari;
2. Chromebook browser.

Record for every track:

- `READY` arrives;
- first enabled Play starts without Play / Pause / Play recovery;
- provider `PLAY` event arrives;
- reported duration is consistent with full song, not a short preview;
- Pause / resume works and is event-confirmed;
- switching to/from the track resets/reaches new ready state correctly;
- error/fallback behavior works;
- visible SoundCloud attribution remains intact.

Final per-track result must be one of:

- `soundcloud_full`;
- `youtube_fallback`;
- `unavailable`.

Do not force all six onto the same provider if only some qualify.

## 9. Revised media screenshot hard gate

Read:

`evidence/MEDIA_SCREENSHOT_APPROVAL_ADDENDUM_2026-09-10.md`

Required final media states include:

- SoundCloud loading / ready;
- SoundCloud playing / paused;
- six-song queue / track switch;
- preview-only or ineligible state when real proof exposes it;
- hardened visible YouTube fallback;
- media unavailable/provider error;
- gameplay trailer;
- optional native/Audius Showdown Radio only if retained in the final proposal.

Older native Showdown Radio QA remains historical internal evidence. It does not substitute for revised exact-song provider screenshots.

## 10. Frozen character authority remains unchanged

Never regenerate the owner-approved masters.

A01 Nik:

- `A01_NIK_CORE_THINKING_HERO_OWNER_APPROVED_V1.png`
- 1086 × 1448 RGBA
- SHA-256 `17972b8afb73b90483c8f874c4bd964ac1bda196daa76e134a6030676bbd4219`

A02 Daniel:

- `A02_DANIEL_CORE_POINTING_HERO_OWNER_APPROVED_V1.png`
- 1086 × 1448 RGBA
- SHA-256 `9b1545b52a5d96a240c92b9901dcd8a4558148dde05a0331882df7bd988177cc`

Manager-label lock:

- Manager 1 = Daniel
- Manager 2 = Nik

Preserve the R8.27 exact-binary package/recovery rules.

## 11. Broader project continuation after media proof

The project goal remains a complete product UI/UX + asset proposal, not a music-player side project.

Once the per-track provider matrix is known:

1. reconcile the final media composition into `01-home-reference.html` without crowding primary Home actions;
2. capture Home wide, Chromebook/reduced-wide and mobile evidence;
3. continue the final screenshot build across routed screens 02 through 13 and substantial surfaces 20 through 24;
4. incorporate real r14/Journey Reconnect user-visible deltas instead of relying on the older r13 inventory;
5. resolve remaining asset roles from `ASSET_BUILD_MATRIX.md` using DOM/CSS/procedural art first where appropriate;
6. generate any new raster only when a real unresolved screen role has a written brief and acceptance criteria;
7. run visual/readability/accessibility/identity/provenance QA;
8. perform final-main reconciliation against the actual development stopping point;
9. assemble the complete final screenshot approval package;
10. present all required screenshots to the owner;
11. revise rejected states and only then mark explicit approvals;
12. after all final gates close, create the senior implementation handoff.

## 12. Do not lose the build-first discipline

The media investigation was useful because it closed an actual product UX defect and a zero-dollar dependency question. Do not allow it to become another endless research loop.

Next work is evidence-producing build/QA work:

- real provider proof;
- exact Home composition;
- final screenshots;
- asset closure;
- product drift reconciliation;
- owner approval.

Do not start another broad music-service survey unless both SoundCloud and the hardened YouTube fallback become unusable under the zero-dollar rules.

## 13. Current milestone statement

`MEDIA PROVIDER SEARCH CLOSED / ZERO-DOLLAR ARCHITECTURE TRANSITIONED / SOUNDCLOUD EXACT-TRACK PROOF OPEN / YOUTUBE HARDENED FALLBACK DEFINED / FULL ASSET + SCREENSHOT PROPOSAL BUILD CONTINUES / OWNER FINAL APPROVAL OPEN`
