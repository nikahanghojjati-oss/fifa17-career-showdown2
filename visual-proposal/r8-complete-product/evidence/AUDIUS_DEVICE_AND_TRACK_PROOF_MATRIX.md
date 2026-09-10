# Audius Showdown Radio — Device / Track Proof Matrix

Status: PUBLIC PROVIDER / RIGHTS PROOF ADVANCED — REAL DEVICE EXECUTION OPEN

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

## Current public provider verification

Verification date: 2026-09-10.

Official Audius API material currently establishes:

- API Plans lists Free as `No Restrictions. Always Free.`;
- Free usage: 10 requests/second;
- Free usage: 500,000 requests/month;
- Unlimited is a separate plan reached through Audius contact;
- the API root describes most read-only endpoints as available without credentials, with an API key available for higher rate limits;
- writes require stronger authenticated authority and are irrelevant to this player;
- Audius exposes read-only track resolution and streaming operations suitable for a Music Player.

Project financial invariants remain stricter than provider language:

`paidUpgradeAllowed = false`

`autoOverageAllowed = false`

`paymentMethodAllowed = false`

Preferred credential strategy for the static proposal is now:

`publicReadOnlyFirst = true`

The final implementation should first prove that public read-only resolve/stream is sufficient on the actual devices. If a Free API key is technically necessary for stable production use, its creation flow must be separately verified to require no payment method, paid overage agreement or billing enrollment. A bearer token or write secret is never placed in client code.

Request quota is not equivalent to song-play count.

## Audius Open Music License basis

Audius's Open Music License, last updated 2025-07-02 and rechecked 2026-09-10, states that content published to or accessed on the Audius Protocol is licensed under the OML unless the licensor supplies an Alternative License URI.

For Music Players, the OML grants a worldwide, non-exclusive, royalty-free, perpetual and irrevocable license to reproduce, publicly perform, distribute, electronically/digitally transmit and stream Licensed Material in connection with the Music Player's services, with sublicensing rights.

Commercial attribution requirements exist under the OML. Therefore the final queue still records creator identity, the Audius material URL, OML notice/link where applicable, copyright/source information to the extent reasonably practicable, and any Alternative License declared by the track.

This provider-level license basis materially improves the rights case, but it does not make an individual track final if:

- the track declares an Alternative License that is incompatible;
- the public stream is gated/unavailable;
- creator/provenance signals are materially inconsistent;
- device playback fails;
- or the owner rejects the track on taste.

## Functional player matrix

| Proof | iPhone Safari | Chromebook | Acceptance |
| --- | --- | --- | --- |
| Home loads without fetching every track stream | OPEN | OPEN | only selected media may request audio |
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

No device row is changed to PASS without actual device evidence.

## Initial listening candidates

These are deliberately not called the final soundtrack.

| ID | Candidate | Public-page verification | Rights / provenance review | Device stream proof | Owner taste |
| --- | --- | --- | --- | --- | --- |
| AUM-01 | `Be Right There` — Nightingale EDM | PASS — public Audius page reachable; House/Energizing; 6:34; creator description calls it DMCA-free Creative Commons | OML BASE PASS; creator supplies an additional free/Creative-Commons claim in description; exact track Alternative License field still verify before final | OPEN | OPEN |
| AUM-02 | `Neon Heartline` — EvoSoniX | PASS — public Audius page reachable; House/Energizing; 3:37 | OML BASE PASS; no incompatible Alternative License observed on public page; exact API license field still verify before final | OPEN | OPEN |
| AUM-03 | `Many Sails` — Neon Tidewater | PASS — public Audius page reachable; Electronic/Upbeat; 2:01; description says synthesized from code and freely-licensed material | OML BASE PASS; creator provenance statement is supportive; exact API license field / attribution detail still verify before final | OPEN | OPEN |

Public Audius sources:

- `https://audius.co/nightingale_edm/be-right-there-%7C-edm-non-copyright-%7C-dmca-free`
- `https://audius.co/EvoSoniX/lytora-neon-heartline`
- `https://audius.co/neontidewater/many-sails`

Do not promote these to `FINAL` solely because their public pages are reachable or because the OML supplies a Music Player license.

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
- governing OML / Alternative License statement;
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

## SoundCloud status

SoundCloud nostalgia is deferred and is not part of the required default Showdown Radio proof matrix. Do not spend closure time classifying SoundCloud tracks unless the owner explicitly reopens that lane.

YouTube remains trailer/video-only if retained and is never a Showdown Radio fallback.

## Owner final media approval

Before media can be marked final, the owner receives:

1. the functional Audius player or a testable equivalent;
2. the exact candidate queue with listening/source links;
3. the completed device matrix;
4. final wide/Chromebook/mobile screenshots;
5. exact governing OML / Alternative License and attribution notes per final track;
6. explicit statement that YouTube is trailer-only;
7. zero-dollar terms verification date and fail-closed policy.

Owner approval of the visual player does not automatically approve the track list. Track taste is an explicit separate gate.

## Current closure state

Completed in this reconciliation pass:

- public Free-plan numbers rechecked;
- public read-only API path rechecked;
- OML Music Player rights basis added;
- all three candidate public pages rechecked;
- candidate metadata/provenance notes updated;
- SoundCloud removed from the default functional prototype;
- no-autoplay / one-audio authority retained.

Still open:

- exact API track IDs and Alternative License fields where available;
- iPhone Safari playback proof;
- Chromebook playback proof;
- seek/volume/platform behavior;
- final track taste approval;
- final responsive screenshots.
