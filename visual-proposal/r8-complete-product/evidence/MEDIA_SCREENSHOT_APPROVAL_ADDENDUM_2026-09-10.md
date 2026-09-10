# R8 Media Screenshot Approval Addendum — 2026-09-10

Status: HARD-GATE ADDENDUM — OPEN

This addendum supersedes the media-specific interpretation of rows `25-1` through `25-5` in `FINAL_SCREENSHOT_APPROVAL_INDEX.md` after the zero-dollar provider research changed the preferred exact FIFA 17 soundtrack path.

The older Showdown Radio screenshots remain useful internal evidence for the optional native/open-audio lane, but they do not prove the revised exact-song SoundCloud-first architecture.

Before final owner approval, merge these rows into the main approval index or otherwise present them as one explicit part of the same final review package.

| ID | Surface / version | Why materially distinct | Required viewport | Evidence status | Owner approved |
| --- | --- | --- | --- | --- | --- |
| 26-1 | FIFA 17 soundtrack — SoundCloud loading / READY | proves no optimistic playback and first-press readiness contract | Chromebook/wide representative | OPEN | NO |
| 26-2 | FIFA 17 soundtrack — SoundCloud PLAYING / PAUSED | exact-song audio-first presentation with provider-visible attribution and event-owned state | wide + 390px if geometry changes | OPEN | NO |
| 26-3 | FIFA 17 soundtrack — queue / track switch | six exact songs, current selection, per-track provider eligibility | wide or Chromebook | OPEN | NO |
| 26-4 | Exact track — preview-only / SoundCloud-ineligible | explains why an individual song cannot use the audio-first provider and exposes fallback | representative | OPEN after device proof | NO |
| 26-5 | Exact track — hardened YouTube fallback | visible compliant provider state for any song failing SoundCloud proof | representative desktop + mobile if geometry changes | OPEN | NO |
| 26-6 | Media unavailable / provider error | media failure does not block Home or Career Mode | representative | OPEN | NO |
| 26-7 | FIFA 17 gameplay trailer | separate visible YouTube video provider treatment | representative | OPEN | NO |
| 26-8 | Optional Showdown Radio native/Audius | only if retained in the final owner proposal as an additive open-audio lane | representative | EXISTING native QA is historical; REFRESH if retained | NO |

## Device proof before rows 26-1 through 26-5 can be final

For every one of the six exact songs, record:

- SoundCloud page/track identity;
- iPhone Safari `READY` result;
- Chromebook `READY` result;
- first enabled Play result;
- provider `PLAY` event result;
- duration/full-length result;
- pause/resume result;
- track-switch result;
- error/fallback result;
- final provider eligibility: `soundcloud_full`, `youtube_fallback`, or `unavailable`.

No screenshot may label a track as full-length SoundCloud playback merely because its public SoundCloud page exists.

## Financial proof

Every final media screenshot/prototype is governed by:

`paidUpgradeAllowed = false`

No screenshot or implementation handoff may imply a Premium account, paid API plan, payment card, automatic upgrade or overage route.

## Owner approval rule

These rows remain `NO` until the owner explicitly approves the exact final screenshots. Internal browser/device proof is necessary but not sufficient for owner approval.
