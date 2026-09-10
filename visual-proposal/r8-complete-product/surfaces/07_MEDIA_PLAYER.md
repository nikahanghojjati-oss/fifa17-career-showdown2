# Surface Group 07 — Showdown Radio / Media

Status: ACTIVE PROPOSAL CONTRACT — AUDIUS LOCKED PRIMARY / NO AUTOPLAY / DEVICE + TRACK PROOF OPEN

This contract replaces the current YouTube-based music experience. It is proposal-only and does not modify production `main`.

Current production reconciliation anchor: `4d202126ce1606a4e3f74c09b31201cf4ec51c6e` / `1.9.1-r15`.

Read with:

- `evidence/MEDIA_PROVIDER_ZERO_DOLLAR_DECISION_2026-09-10.md`
- `evidence/AUDIUS_DEVICE_AND_TRACK_PROOF_MATRIX.md`
- `prototypes/27-audius-showdown-radio-reference.html`
- `prototypes/01-home-reference.html`

## 1. Owner-locked direction

Primary music provider: Audius.

Playback engine: one browser HTML `<audio>` element.

Experience goals:

- audio-only;
- lightweight;
- compact and visually integrated into Home;
- explicit Play/Pause/Previous/Next;
- no music video;
- no YouTube music fallback;
- no listener Premium subscription;
- no billing dependency;
- no automatic paid upgrade;
- Career Mode remains fully usable when music is unavailable.

Owner explicitly rejected autoplay after browser-policy review. Do not reintroduce autoplay as a required behavior.

## 2. Free-plan and billing boundary

Official Audius documentation reviewed 2026-09-10 states:

- Free: 10 requests/second;
- Free: 500,000 requests/month;
- Free plan described as always free with no restrictions;
- Unlimited is a separate higher-limit plan reached by contacting Audius.

The project is expected to use only a tiny fraction of that quota. Nevertheless, the product rule is stricter than the provider's marketing language:

`paidUpgradeAllowed = false`

Before production adoption, API-key creation must be verified not to require a payment card or billing enrollment. If setup requires billing details, pay-as-you-go acceptance, paid overage, credits, or automatic conversion, Audius is disqualified rather than accommodated.

If a free quota is exhausted or the provider becomes unavailable:

- stop requesting media;
- show a local player-unavailable state;
- never purchase capacity;
- never block Career Mode.

## 3. Request discipline

Request quota is not equivalent to song-play count.

The final implementation minimizes requests even though expected use is tiny:

1. ship a small curated track manifest with stable Audius track IDs and display metadata;
2. do not search/trend on ordinary Home entry;
3. do not resolve a canonical URL on every play once an approved track ID is known;
4. keep exactly one audio element;
5. request only the selected track;
6. do not preload the full queue;
7. cache safe metadata locally where appropriate;
8. use bounded retry/backoff;
9. no polling loop for music state;
10. provider/quota failure terminates locally.

## 4. No-autoplay decision

The player UI may load eagerly because it is small DOM/CSS and does not contain a heavy video iframe.

Audio bytes must not begin automatically on page load.

The first actual playback requires deliberate user Play input. This avoids browser autoplay blocking, especially on iPhone Safari, and eliminates a class of first-load playback failures.

After a user has deliberately started audio, normal Pause/Resume/Next/Previous behavior may continue within the same allowed browser session according to platform rules. Returning to Home must never unexpectedly start sound without browser permission and the product's explicit session rule.

No hidden muted autoplay/unmute trick is permitted for music.

## 5. State authority

Required state machine:

`idle -> ready -> loading/play_requested -> playing | buffering | error -> paused | ended`

Rules:

- Play expresses intent; it does not assert `PLAYING`.
- only the audio element's `playing` event produces the visible PLAYING state;
- `waiting` / `stalled` produce BUFFERING without blocking Home;
- `pause` produces PAUSED;
- `ended` advances according to the final queue policy;
- media/provider failure is player-local;
- track changes reset stale state before the new source becomes current;
- there is never more than one playback authority.

## 6. Track catalogue

Primary label: `SHOWDOWN RADIO`.

Do not call the Audius queue `FIFA 17 SOUNDTRACK` unless an exact recording is legitimately available under acceptable rights and provider access.

Target feeling:

- upbeat indie/electronic pop;
- house/electronic energy;
- bright competitive matchday pacing;
- clean full-track public streamability;
- clear creator/source metadata;
- rights/provenance suitable for a Music Player.

Candidate discovery is not owner approval. Final tracks require:

- stream proof;
- rights/provenance review;
- iPhone Safari proof;
- Chromebook proof;
- owner listening/taste approval.

## 7. SoundCloud and YouTube status

SoundCloud exact-song nostalgia research is retained as historical/optional evidence, but it is not required in the default final proposal now that the owner has selected Audius as the primary music experience.

Do not spend finalization time building a second music product unless the owner explicitly reopens `FIFA 17 PICKS`.

YouTube is not a music fallback.

A gameplay trailer may remain a separate intentional video surface if the final Home design still includes it. That video remains lazy-loaded and uses the official YouTube player lifecycle. It must never be hidden to extract audio.

## 8. Player anatomy

Compact Home player:

1. `SHOWDOWN RADIO` eyebrow;
2. `AUDIUS` source badge;
3. current title and creator;
4. previous, play/pause, next;
5. elapsed/duration when available;
6. usable seek rail;
7. mute/volume where platform-supported;
8. queue/expand action;
9. explicit ready/loading/playing/paused/buffering/error/offline state;
10. compact source/provenance affordance.

The player remains visually subordinate to Career Mode actions.

Expanded queue:

- one column on mobile;
- selected row indicated by structure plus color;
- title, creator, duration/status;
- no album-art dependency;
- no stream request for inactive rows;
- no hidden provider iframe.

## 9. Responsive and accessibility contract

At 390px:

- essential body/status copy >=13px;
- metadata >=11px;
- control labels >=12px;
- touch targets >=44px;
- no horizontal overflow;
- queue stacks vertically;
- seek remains touch-usable;
- provider/source text wraps rather than shrinking.

Accessibility:

- explicit names for transport controls;
- Play/Pause label follows actual state;
- seek is keyboard-operable;
- meaningful state changes use a polite live region;
- progress ticks are not announced continuously;
- track changes do not move focus;
- reduced motion removes decoration only.

## 10. Performance contract

The old YouTube music tile required heavy lazy-loading because it embedded video/provider UI. Showdown Radio does not.

Allowed eager work:

- player DOM/CSS;
- small static curated manifest;
- current track display metadata.

Deferred until user intent:

- selected stream request;
- optional nonessential provider metadata refresh.

Forbidden:

- preloading every track;
- autoplaying audio on Home entry;
- creating multiple audio elements;
- catalogue discovery calls on every navigation;
- unbounded retry;
- provider failure blocking route navigation.

## 11. Final owner-review disclosure

The final owner package must state:

- primary provider: Audius;
- playback engine: browser HTML audio;
- autoplay: OFF by design;
- lightweight UI shell: eagerly available;
- stream bytes: requested only for selected user-started playback;
- current Free-plan verification basis;
- whether API-key creation required any billing information;
- exact final queue and rights status;
- actual iPhone Safari and Chromebook results;
- any platform-specific volume/seek limitation;
- no YouTube music fallback;
- gameplay trailer status if retained.

## 12. Acceptance

Media is proposal-complete only when:

- Audius API-key/billing boundary is verified without enrolling billing;
- final queue has rights/provenance records;
- first Play works without a Play/Pause/Play ritual on iPhone Safari and Chromebook;
- Pause/Resume/Previous/Next/seek/failure behavior is tested;
- no autoplay dependency exists;
- no duplicate-player bug exists;
- desktop/Chromebook/mobile screenshots pass visual QA;
- final Home integration screenshot exists;
- owner hears/approves the final track selection;
- owner explicitly approves the final player screenshots.
