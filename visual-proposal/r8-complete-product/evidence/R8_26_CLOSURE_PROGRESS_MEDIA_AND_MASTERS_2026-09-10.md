# R8.26 Closure Progress — Media + Frozen Masters — 2026-09-10

Status: SUBSTANTIVE CLOSURE MILESTONE — PROPOSAL STILL NOT FINAL

Production study anchor at this checkpoint:

- `main`: `ea96ff1280b5e63962b7ee1a6a8c0980fe4e3686`
- runtime: `1.9.1-r13`
- MDP: `77.50`
- next known product work: `MDP100 / Journey Reconnect`

Visual work branch:

`developer/r8-26-complete-proposal-asset-build-r13-work`

## 1. Frozen A01/A02 source recovery is no longer hypothetical

The exact owner-approved character files were recovered from the Project conversation file surface and materialized without transformation.

A01:

- file: `A01_NIK_CORE_THINKING_HERO_OWNER_APPROVED_V1.png`
- dimensions: `1086 × 1448`
- mode: `RGBA`
- SHA-256: `17972b8afb73b90483c8f874c4bd964ac1bda196daa76e134a6030676bbd4219`

A02:

- file: `A02_DANIEL_CORE_POINTING_HERO_OWNER_APPROVED_V1.png`
- dimensions: `1086 × 1448`
- mode: `RGBA`
- SHA-256: `9b1545b52a5d96a240c92b9901dcd8a4558148dde05a0331882df7bd988177cc`

Both hashes exactly match the frozen authority already recorded in the proposal asset matrix.

Manager lock remains:

- Manager 1 = Daniel
- Manager 2 = Nik

No regeneration is permitted.

## 2. Exact binary handoff package created and verified

A byte-preserving archive was created:

`A01_A02_FROZEN_MASTERS_EXACT_R8_26.zip`

Archive SHA-256 at creation:

`72be49e9b011dff1d880fc616a78a55778d041ce24979dfcaf2320a014d80405`

The archive was extracted into a clean verification directory and both enclosed PNG checksums passed against `SHA256SUMS.txt`.

A copy has been placed in the ChatGPT personal Library under the Showdown Visual / R8.26 area so a successor session does not need to recover the sources again.

Important remaining boundary:

The currently available connected GitHub file writer is UTF-8 text oriented and does not provide a byte-preserving binary repository upload action. Therefore the exact masters are recovered and safely packaged, but the canonical `assets/masters/` repository placement is still open. Do not replace this with base64 text, a screenshot, a recompressed PNG, or a regenerated image merely to make the path exist.

## 3. Media investigation advanced from concept to executable proof

New executable proposal prototype:

`prototypes/26-native-music-player-functional-reference.html`

It uses a real browser `<audio>` authority rather than a fake click-state simulation.

The proof includes:

- no media source assignment on initial page load;
- source assignment only after explicit Play intent;
- one selected source at a time;
- actual native `play`, `playing`, `waiting`, `pause`, `ended`, `error`, metadata and time events;
- Play / Pause, Previous / Next, seek and volume controls;
- state labels driven by observed media state;
- local failure handling rather than app-wide failure;
- no subscription or provider account;
- no YouTube audio extraction;
- no ad suppression;
- no commercial FIFA 17 recording inside the native audio lane.

This addresses the core architectural defect found in production, where UI play state is currently optimistic and can diverge from YouTube's real player state.

## 4. Rights-clean prototype candidates established

New rights ledger:

`evidence/NATIVE_SOUNDTRACK_RIGHTS_LEDGER_2026-09-10.md`

Two current prototype candidates are accepted for isolated R8 proof:

1. `Synth pop with 4 on the floor` — Mesostic — self-published / Own work — CC0 — 3:18.
2. `GameBGM` — Yuyuyunoyuusuke1 — self-published / Own work — CC0 — approximately 3:57.

They are not owner-approved final soundtrack selections. Their role is to prove a genuinely free, native, controllable playback route using tracks with individually checked rights.

The existing commercial FIFA 17 songs stay in the optional visible provider lane unless explicit reusable audio rights are obtained later.

## 5. Home media surface was reconciled

`prototypes/01-home-reference.html` now uses the compact Showdown Radio treatment rather than the old generic menu-media placeholder.

The integrated Home proposal shows:

- compact `SHOWDOWN RADIO` identity;
- candidate track and provenance summary;
- lightweight previous/play controls;
- compact progress treatment;
- explicit `FIFA 17 ORIGINALS` separate-provider entry;
- no auto-load promise;
- no heavy provider iframe in the default Home composition.

Wide Home still references the frozen A02 Daniel left / A01 Nik right master paths. Reduced-wide/Chromebook and mobile continue to omit character art by design.

## 6. What is now decided about the media architecture

Recommended implementation direction remains:

1. default Home audio: native Showdown Radio with individually verified reusable tracks;
2. exact FIFA 17 commercial soundtrack: separate visible lazy YouTube provider mode if retained;
3. current YouTube code, if kept, must use actual provider readiness/state/error events rather than optimistic local state;
4. no audio-only hidden YouTube workaround;
5. no paid subscription dependency.

This gives the project a smooth free lane without sacrificing optional access to the original commercial soundtrack through its permitted provider presentation.

## 7. What remains open before owner-final screenshot review

This milestone does not close the overall visual proposal.

Still open:

- binary-safe repository placement of exact A01/A02 sources or an explicitly accepted binary handoff method for senior implementation;
- final native soundtrack taste selection and packaged-file hashes for any tracks carried into implementation;
- final Home wide / reduced-wide / Chromebook / mobile rendering with exact masters and compact Showdown Radio;
- every remaining screenshot row in `FINAL_SCREENSHOT_APPROVAL_INDEX.md`;
- refreshed retained mobile Legacy and Restore screenshots;
- representative states for League Wheel, Club Assignment, Dashboard, Transfer Challenge, local Season Results, Season Summary, Statistics, Career Statistics, Trophy Room, Rule Book and remaining cross-product surfaces;
- Journey Reconnect and any later product-visible deltas once they exist on `main`;
- final-main reconciliation at the main developer's real product checkpoint;
- explicit owner approval of the complete final screenshot package.

Current conclusion:

`MEDIA ARCHITECTURE PROVEN + FROZEN MASTER SOURCES RECOVERED — ACTIVE CLOSURE CONTINUES — NOT FINAL`.