# Surface Group 07 — Showdown Radio / Media

Status: ACTIVE PROPOSAL CONTRACT — AUDIUS LOCKED PRIMARY / NO AUTOPLAY / PUBLIC RIGHTS+ZERO-DOLLAR PROOF ADVANCED / DEVICE + TRACK APPROVAL OPEN

This contract replaces the current YouTube-based music experience. It is proposal-only and does not modify production `main`.

Current production reconciliation anchor: `613e031c648d8d5cdb4e260e74cd93f895f49872` / `1.9.1-r16`.

Read with:

- `evidence/MEDIA_PROVIDER_ZERO_DOLLAR_DECISION_2026-09-10.md`
- `evidence/AUDIUS_FREE_QUOTA_AND_BILLING_GUARD_2026-09-10.md`
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

SoundCloud nostalgia is deferred from the default proposal unless the owner explicitly reopens it.

## 2. Free-plan and billing boundary

Official Audius public material rechecked 2026-09-10 states:

- API Plans Free: 10 requests/second;
- API Plans Free: 500,000 requests/month;
- Free is labelled `No Restrictions. Always Free.`;
- Unlimited is a separate higher-limit plan reached by contacting Audius;
- most read-only REST endpoints are described as working without credentials, with API keys available for higher rate limits.

The product rule is stricter than the provider's marketing language:

`paidUpgradeAllowed = false`

`autoOverageAllowed = false`

`paymentMethodAllowed = false`

Preferred static-site strategy:

`publicReadOnlyFirst = true`

The final player should first prove public read-only resolve/stream on iPhone Safari and Chromebook. If a Free API key later proves necessary for stable production use, its creation must be verified not to require a payment card, paid overage agreement or billing enrollment. Bearer tokens, write secrets or authenticated mutation credentials never belong in the browser music player.

If a free quota is exhausted or the provider becomes unavailable:

- stop requesting media;
- show a local player-unavailable state;
- never purchase capacity;
- never block Career Mode.

## 3. Rights / provenance boundary

Audius's Open Music License, last updated 2025-07-02 and rechecked 2026-09-10, provides the provider-level rights basis for an Audius Music Player unless a particular track supplies an Alternative License URI.

The OML grants Music Players a worldwide, non-exclusive, royalty-free, perpetual and irrevocable right to reproduce, publicly perform, distribute, electronically/digitally transmit and stream Licensed Material in connection with Music Player services, including sublicensing rights.

This does not eliminate per-track review. Final queue records still verify:

- creator/source identity;
- canonical Audius material URL;
- exact API track ID;
- public stream/gating result;
- OML or Alternative License field;
- attribution requirements;
- suspicious or inconsistent provenance signals;
- device playback;
- owner taste.

If a track's Alternative License conflicts with the project or its stream becomes gated/unavailable, reject that track rather than weakening the rights/zero-dollar rules.

## 4. Request discipline

Request quota is not equivalent to song-play count.

The final implementation minimizes requests even though expected use is tiny:

1. ship a small curated track manifest with stable Audius track IDs and display metadata;
2. do not search/trend on ordinary Home entry;
3. do not resolve a canonical URL on every play once an approved track ID is known;
4. keep exactly one audio element;
5. request only the selected track after deliberate Play;
6. do not preload the full queue;
7. cache safe metadata locally where appropriate;
8. use bounded user-driven retry/backoff;
9. no polling loop for music state;
10. provider/quota failure terminates locally.

## 5. No-autoplay decision

The player UI may load eagerly because it is small DOM/CSS and does not contain a heavy video iframe.

Audio bytes must not begin automatically on page load.

The first actual playback requires deliberate user Play input. This avoids browser autoplay blocking, especially on iPhone Safari, and eliminates a class of first-load playback failures.

After a user has deliberately started audio, normal Pause/Resume/Next/Previous behavior may continue within the same allowed browser session according to platform rules. Returning to Home must never unexpectedly start sound without browser permission and the product's explicit session rule.

No hidden muted autoplay/unmute trick is permitted for music.

## 6. State authority

Required state machine:

`idle -> ready -> loading/play_requested -> playing | buffering | error -> paused | ended`

Rules:

- Play expresses intent; it does not assert `PLAYING`;
- only the audio element's `playing` event produces the visible PLAYING state;
- `waiting` / `stalled` produce BUFFERING without blocking Home;
- `pause` produces PAUSED;
- `ended` does not silently autoplay a new track;
- media/provider failure is player-local;
- track changes reset stale state before the new source becomes current;
- there is never more than one playback authority;
- no automatic retry/request storm is permitted.

## 7. Track catalogue

Primary label: `SHOWDOWN RADIO`.

Do not call the Audius queue `FIFA 17 SOUNDTRACK` unless an exact recording is legitimately available under acceptable rights and provider access.

Target feeling:

- upbeat indie/electronic pop;
- house/electronic energy;
- bright competitive matchday pacing;
- clean full-track public streamability;
- clear creator/source metadata;
- rights/provenance suitable for a Music Player.

Current listening candidates are recorded in `evidence/AUDIUS_DEVICE_AND_TRACK_PROOF_MATRIX.md` and remain non-final.

Candidate discovery is not owner approval. Final tracks require:

- stream proof;
- OML / Alternative License and attribution review;
- iPhone Safari proof;
- Chromebook proof;
- owner listening/taste approval.

## 8. SoundCloud and YouTube status

SoundCloud exact-song nostalgia research is retained only as historical evidence. It is not part of the default functional player or current closure work.

Do not build a second music product unless the owner explicitly reopens SoundCloud nostalgia.

YouTube is not a music fallback.

A gameplay trailer may remain a separate intentional video surface if the final Home design still includes it. That video remains lazy-loaded and uses the official YouTube player lifecycle. It must never be hidden to extract audio.

## 9. Player anatomy

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

## 10. Responsive and accessibility contract

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
- Play/Pause label follows actual media state and user intent;
- seek is keyboard-operable;
- meaningful state changes use a polite live region;
- progress ticks are not announced continuously;
- track changes do not move focus;
- reduced motion removes decoration only.

## 11. Performance contract

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

## 12. r16 compatibility

r16 Shared Journey Local Reconciliation adds no media authority and requires no new media state. Showdown Radio remains independent of Connected Rivalry / Candidate C and must not write shared/local gameplay state.

The media surface remains proposal-only, Firebase-independent for playback, and unaffected by r16 except for the current-main reconciliation anchor.

## 13. Final owner-review disclosure

The final owner package must state:

- primary provider: Audius;
- playback engine: browser HTML audio;
- autoplay: OFF by design;
- lightweight UI shell: eagerly available;
- stream bytes: requested only for selected user-started playback;
- current Free-plan verification basis;
- whether public read-only playback passed without an API key;
- if a Free API key is used, whether creation required any billing information;
- exact final queue and OML / Alternative License / attribution status;
- actual iPhone Safari and Chromebook results;
- any platform-specific volume/seek limitation;
- no YouTube music fallback;
- gameplay trailer status if retained;
- SoundCloud default lane: deferred.

## 14. Acceptance

Media is proposal-complete only when:

- public read-only or Free-key playback path is proven without enrolling billing;
- final queue has rights/provenance records;
- first Play works without a Play/Pause/Play ritual on iPhone Safari and Chromebook;
- Pause/Resume/Previous/Next/seek/failure behavior is tested;
- no autoplay dependency exists;
- no duplicate-player bug exists;
- desktop/Chromebook/mobile screenshots pass visual QA;
- final Home integration screenshot exists;
- owner hears/approves the final track selection;
- owner explicitly approves the final player screenshots.
