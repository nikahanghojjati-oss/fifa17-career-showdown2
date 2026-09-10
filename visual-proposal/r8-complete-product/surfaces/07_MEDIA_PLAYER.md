# Surface Group 07 — Menu Music / Media Player

Status: ACTIVE PROPOSAL CONTRACT — AUDIUS-FIRST / DEVICE PROOF + OWNER TRACK APPROVAL OPEN

This contract replaces the assumption that the current YouTube iframe tile is an acceptable final music experience. It is proposal-only and does not modify production `main`.

Read with:

- `evidence/MEDIA_PLAYER_FEASIBILITY_2026-09-10.md`
- `evidence/MEDIA_PROVIDER_ZERO_DOLLAR_DECISION_2026-09-10.md`
- `prototypes/25-native-music-player-reference.html` as historical visual exploration
- `prototypes/26-native-music-player-functional-reference.html` as native event-authority proof
- `prototypes/26-soundcloud-fifa17-audio-provider-reference.html` as secondary-provider proof
- `prototypes/27-audius-showdown-radio-reference.html` as current primary music direction

## Owner requirement

Music must be audio-only, smooth on the first deliberate Play, replayable, lightweight and permanently zero-dollar for the project. Exact FIFA 17 soundtrack fidelity is desirable but secondary to a better player. The project may use a new track list if that creates a materially better long-term experience.

The Home screen must remain fully usable if every media provider fails.

## Current production defect

The r14 main anchor `97c28b1efea6ee6e901e6076a834ec419cbad5aa` still carries the old YouTube music authority model: local `menuMediaPlaying` can move to true before provider-confirmed playback, iframe DOM `load` is treated as readiness, and raw postMessage play/pause commands are used without official provider state events.

The final proposal must not reproduce that model.

## Mode A — SHOWDOWN RADIO / AUDIUS

Decision: primary music direction.

Architecture:

- curated Audius public-track queue;
- one browser HTML `<audio>` element is the playback authority;
- no music video or iframe;
- no listener login for ordinary public playback;
- no autoplay on application startup;
- selected stream source assigned only after deliberate user intent or controlled pre-resolution that does not download audio bytes prematurely;
- actual HTML media events own player state;
- no paid fallback.

Current official Audius Free-plan documentation reviewed 2026-09-10 states 10 requests/second and 500,000 requests/month and describes the Free plan as always free with no restrictions. These are API-request limits, not song-play counts. A play may involve more than one network/API request, so the proposal does not equate one play with one request.

Expected project use is extremely small relative to that ceiling. The implementation still minimizes requests:

1. ship/cache a curated manifest of track IDs and display metadata;
2. do not search/trend on every Home visit;
3. keep one audio element;
4. request only the selected track;
5. do not preload the whole queue;
6. use bounded retry/backoff;
7. stop retries on provider/quota failure;
8. never purchase additional capacity.

### Audius state authority

Required state machine:

`idle -> resolving -> ready -> play_requested -> playing | buffering | error -> paused | ended`

Rules:

- Play expresses intent; it never directly asserts `PLAYING`.
- `play` / accepted play promise may produce `PLAY REQUESTED` or `LOADING`.
- only the audio element's `playing` event produces `PLAYING`.
- `waiting` / `stalled` produce `BUFFERING` or `RECONNECTING AUDIO` without blocking Home.
- `pause` produces `PAUSED`.
- `ended` advances according to the queue preference.
- media/provider error produces a local player error, never an application-wide failure.
- page transitions must not create duplicate simultaneous players.

### Audius catalogue and rights

Do not label the Audius queue `FIFA 17 SOUNDTRACK` unless the actual recording is legitimately that soundtrack item and the provider metadata proves it.

Primary label: `SHOWDOWN RADIO`.

Track selection should target FIFA-17-era energy: upbeat indie/electronic pop, house, synth-pop and matchday pacing. Every final track must have a rights/provenance decision. Audius's Open Music License can provide strong Music Player rights for covered material, but not every track may use that license; creator-selected or alternative rights must be respected.

Candidate discovery is not owner approval. The owner must hear and approve the final queue separately from approving the UI screenshots.

## Mode B — FIFA 17 PICKS / SOUNDCLOUD

Decision: optional nostalgia catalogue, not primary playback authority.

Purpose: preserve access to the existing six FIFA 17 song choices when SoundCloud exposes them cleanly in its standard audio widget.

All six current project songs have public artist-branded SoundCloud candidate pages recorded in the media evidence. Eligibility remains per track.

Allowed outcomes:

- `FULL` — provider exposes a full playable track;
- `PREVIEW` — provider exposes only a clearly labelled short preview;
- `UNAVAILABLE` — no usable embed.

A preview must never masquerade as a full recording. The owner has accepted a short SoundCloud preview as an optional secondary experience.

Use one reusable SoundCloud widget, real READY/PLAY/PAUSE/FINISH/ERROR events, visible attribution, and no optimistic site state.

SoundCloud failure does not trigger YouTube music fallback. It returns to Showdown Radio or another SoundCloud item.

## Mode C — FIFA 17 GAMEPLAY TRAILER / YOUTUBE

YouTube is video-only in the final music architecture.

The gameplay trailer may remain as an intentional video surface. Music does not fall back to YouTube because the owner wants music to remain audio-only and YouTube policy does not permit hiding/isolating the audio component as a custom audio player.

If the trailer remains:

- lazy-create the visible YouTube player only after deliberate intent;
- use official `YT.Player` lifecycle events;
- wait for `onReady`;
- derive playing/paused/buffering/ended from `onStateChange`;
- handle `onAutoplayBlocked` and `onError`;
- do not suppress, cover, skip or work around ads;
- destroy/pause according to the existing navigation contract.

## Primary player visual anatomy

Compact Home player:

1. `SHOWDOWN RADIO` eyebrow;
2. `AUDIUS` source badge;
3. current title and creator;
4. previous, play/pause and next;
5. elapsed time / duration where reliable;
6. seek rail with usable touch target;
7. mute/volume where platform behavior supports it;
8. queue/expand action;
9. explicit loading/buffering/error/offline status;
10. small source/provenance affordance in expanded view.

The player must remain subordinate to Career Mode actions.

Expanded queue:

- one column on mobile;
- selected row clearly indicated by structure plus color;
- title, creator and duration;
- no album art dependency;
- no automatic stream request for every row;
- optional `FIFA 17 PICKS` SoundCloud section visually separated from Showdown Radio.

## Required material states

### Audius ready

Track identity present; Play enabled; no false playback indicator.

### Audius playing / paused

State follows HTML audio events. Progress changes without layout shift.

### Audius buffering / reconnecting

Show local media state; keep Home usable; do not encourage repeated button hammering.

### Audius provider/quota error

Bounded retry. Then player-level unavailable state. Never buy or upgrade.

### Queue / track switch

One player reused. Old state is reset before new track becomes ready.

### SoundCloud Full / Preview / Unavailable

Provider-labelled and independently understandable. Preview duration/limitation is explicit.

### YouTube trailer

Separate intentional video surface, never presented as the music player.

## Responsive contract

At 390px class mobile width:

- essential body/status copy >=13px;
- metadata >=11px;
- control labels >=12px;
- touch targets >=44px;
- no horizontal overflow;
- queue stacks to one column;
- seek rail retains a usable hit target;
- source/provenance text wraps rather than shrinking below the typography floor.

At Chromebook/reduced-wide widths, retain the compact player. Do not expand music into a large provider rectangle.

## Accessibility

- explicit accessible names on transport controls;
- play/pause label reflects real current state;
- elapsed/duration exposed textually where known;
- seek keyboard-operable;
- meaningful state changes in a polite live region;
- progress ticks are not live-announced;
- focus does not jump when a track changes;
- reduced motion suppresses equalizer/wave decoration only, never state information.

## Performance

- one Audius/HTML-audio authority;
- no simultaneous preloads for the queue;
- metadata cached locally where appropriate;
- no discovery/search request on normal Home entry;
- provider errors are local;
- SoundCloud widget instantiated only if optional FIFA 17 Picks is opened or intentionally warmed within measured cost;
- YouTube trailer remains fully lazy.

## Permanent zero-dollar boundary

Conceptual invariant:

`paidUpgradeAllowed = false`

If Audius, SoundCloud, YouTube or any future provider changes terms so this path requires payment, a payment card, overage billing or a paid listener subscription:

- disable that provider path;
- use another already-approved zero-dollar path if available;
- otherwise show media unavailable;
- never add billing or automatically upgrade;
- never make Career Mode unavailable.

## Final owner-review disclosure

The final proposal presentation must tell the owner:

- primary provider: Audius;
- playback engine: browser HTML audio;
- current Free-plan basis at verification date;
- that request quota is not the same as song-play count;
- exact final queue and why each track is allowed;
- which optional FIFA 17 Picks are full vs preview;
- whether gameplay trailer is retained;
- which functions are proven on iPhone Safari and Chromebook;
- any known platform limitation, including mobile volume behavior if applicable.

The owner must be able to try the functional player/reference and separately approve both the chosen tracks and the final UI screenshots.

## Acceptance

This surface is proposal-complete only when:

- Audius-first functional reference exists;
- final candidate queue has rights/provenance entries;
- first-play / pause-resume / next-previous / seek / failure behavior is device-tested on iPhone Safari and Chromebook;
- optional SoundCloud exact-song items are classified Full/Preview/Unavailable if retained;
- YouTube is absent from music fallback and limited to intentional video;
- desktop/mobile player screenshots pass layout/readability QA;
- Home integration screenshot exists;
- zero-dollar fail-closed behavior is explicit;
- owner sees and explicitly approves the final media screenshots and track selection.
