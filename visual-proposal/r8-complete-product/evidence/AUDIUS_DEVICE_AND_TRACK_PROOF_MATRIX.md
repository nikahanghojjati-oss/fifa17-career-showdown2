# Audius Showdown Radio — Device / Track Proof Matrix

Status: EXECUTION MATRIX — OPEN

Primary prototype:

`prototypes/27-audius-showdown-radio-reference.html`

Provider decision:

`evidence/MEDIA_PROVIDER_ZERO_DOLLAR_DECISION_2026-09-10.md`

This matrix separates four different questions that must not be conflated:

1. Is the Audius player architecture technically functional?
2. Is a candidate track publicly streamable and stable enough for the queue?
3. Is its rights/provenance status acceptable for this project?
4. Does the owner actually like the track?

A candidate is not final until all applicable gates pass.

## Current Free-plan reference

Verification date: 2026-09-10.

Official Audius documentation at verification time states:

- 10 requests/second;
- 500,000 requests/month;
- Free plan described as always free with no restrictions;
- browser SDK API key may be present client-side;
- bearer token must never be exposed client-side;
- most read-only REST endpoints work without credentials, with API key used for higher rate limits.

Request quota is not equivalent to song-play count.

Production financial invariant:

`paidUpgradeAllowed = false`

If current terms cease to provide the required zero-dollar path, mark provider `FINANCIAL_HOLD` and do not upgrade.

## Functional player matrix

| Proof | iPhone Safari | Chromebook | Acceptance |
| --- | --- | --- | --- |
| Home loads without fetching every track stream | OPEN | OPEN | only active/selected media may request audio |
| First enabled Play begins without Play/Pause/Play ritual | OPEN | OPEN | PASS on both |
| UI waits for real `playing` before showing PLAYING | OPEN | OPEN | PASS on both |
| Pause and resume follow media events | OPEN | OPEN | PASS on both |
| Previous / Next resets stale source state | OPEN | OPEN | PASS on both |
| Queue click selects exactly one stream | OPEN | OPEN | PASS on both |
| Seek works on chosen Audius stream path | OPEN | OPEN | PASS on both or documented provider limitation resolved |
| Duration/progress remain coherent | OPEN | OPEN | PASS on both |
| Volume/mute behavior documented | OPEN | OPEN | platform limitations explicitly recorded |
| Buffer/stall state is understandable | OPEN | OPEN | no false PLAYING |
| Provider/network error stays local to player | OPEN | OPEN | Career Mode remains usable |
| Retry is bounded | OPEN | OPEN | no loop/request storm |
| Navigate away/back does not create duplicate audio | OPEN | OPEN | one authority only |
| Returning Home never autoplays unexpectedly | OPEN | OPEN | PASS on both |
| Keyboard focus/controls | N/A mobile-specific | OPEN | Chromebook keyboard PASS |
| Reduced motion does not hide state | OPEN | OPEN | PASS on both |

## Initial listening candidates

These are deliberately not called the final soundtrack.

| ID | Candidate | Audius source | Why sampled | Stream proof | Rights review | Owner taste |
| --- | --- | --- | --- | --- | --- | --- |
| AUM-01 | `Be Right There` — Nightingale EDM | `https://audius.co/nightingale_edm/be-right-there-%7C-edm-non-copyright-%7C-dmca-free` | House / energizing; source description claims DMCA-free Creative Commons | OPEN | OPEN — exact license terms still verify | OPEN |
| AUM-02 | `Neon Heartline` — EvoSoniX | `https://audius.co/EvoSoniX/lytora-neon-heartline` | synthwave / house / energizing; FIFA-era menu energy candidate | OPEN | OPEN | OPEN |
| AUM-03 | `Many Sails` — Neon Tidewater | `https://audius.co/neontidewater/many-sails` | electronic / upbeat; concise two-minute candidate | OPEN | OPEN — source mentions freely licensed material but exact governing reuse basis still verify | OPEN |

Do not promote these to `FINAL` solely because their public pages are reachable.

## Track acceptance record template

For every final queue item record:

- stable queue ID;
- display title;
- creator;
- Audius canonical URL;
- Audius track ID;
- provider-reported duration;
- public stream access result;
- access/gating status;
- governing license / rights statement;
- required attribution;
- source verification date;
- iPhone Safari playback proof;
- Chromebook playback proof;
- first-play result;
- seek result;
- owner taste decision;
- final status.

Allowed final statuses:

- `APPROVED_FULL`;
- `REJECTED_TASTE`;
- `REJECTED_RIGHTS`;
- `REJECTED_TECHNICAL`;
- `PROVIDER_UNAVAILABLE`;
- `FINANCIAL_HOLD`.

## Optional SoundCloud nostalgia matrix

Only complete this if `FIFA 17 PICKS` remains in the final owner-approved Home design.

Per exact FIFA 17 candidate, classify:

- `FULL`;
- `PREVIEW`;
- `UNAVAILABLE`.

A 30-second preview is acceptable as optional nostalgia only when the UI labels it `PREVIEW` clearly. It is not the main Showdown Radio queue and it does not fall back to YouTube music.

## Owner final media approval

Before media can be marked final, the owner receives:

1. the functional Audius player or a testable equivalent;
2. the exact candidate queue with listening/source links;
3. the completed device matrix;
4. final wide/Chromebook/mobile screenshots;
5. SoundCloud Full/Preview classifications if the nostalgia panel remains;
6. explicit statement that YouTube is trailer-only;
7. zero-dollar terms verification date and fail-closed policy.

Owner approval of the visual player does not automatically approve the track list. Track taste is an explicit separate gate.
