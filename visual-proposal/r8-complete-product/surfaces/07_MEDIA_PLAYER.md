# Surface Group 07 — Menu Music / Media Player

Status: ACTIVE PROPOSAL CONTRACT

This contract replaces the assumption that the current YouTube iframe tile is an acceptable final menu-media experience. It is proposal-only. It does not change production playback code or `main`.

## Owner requirement

The menu-media experience must be smooth, lightweight, understandable on the first press, permanently zero-dollar for the project, and visually integrated into the R8 black / charcoal / gold system.

The owner has reported a production failure pattern in which YouTube playback often requires repeated Play / Pause interactions before the selected song actually starts. The visual proposal must therefore define both a better presentation and a more reliable runtime integration boundary.

## Production failure studied

At the r13 study anchor, `js/menuExperience.js`:

- optimistically flips `menuMediaPlaying = true` before the embedded player has confirmed playback;
- creates the YouTube iframe with `autoplay=1` after the user presses Play;
- treats the iframe DOM `load` event as the point at which it can send `playVideo`;
- sends raw postMessage commands to the embedded iframe;
- does not subscribe to the official YouTube player `onReady`, `onStateChange`, `onError`, or `onAutoplayBlocked` events;
- therefore allows the site control state to diverge from the real provider state during ad transitions, autoplay blocking, buffering or provider pauses.

The senior implementation must not preserve that optimistic-state model.

## Architecture decision

### Default mode — SHOWDOWN RADIO

Use the browser-native HTML `<audio>` element as the playback engine for a small curated library of audio files that are individually verified as licensed for the intended web use and stored with explicit provenance.

The player chrome is custom R8 UI. The underlying audio element remains the single playback authority.

Preferred source classes:

- CC0 / public-domain audio;
- CC BY audio with complete attribution and source/license metadata;
- other explicitly licensed tracks whose terms permit this use.

Every candidate track requires an individual license check. A hosting site being free to browse does not make every track reusable.

Do not ship a candidate merely because it sounds right.

### Secondary mode — FIFA 17 ORIGINALS

The existing commercial FIFA 17 soundtrack list may remain available as a separate provider-backed mode only through a permitted audiovisual provider integration. It is not converted to, extracted as, promoted as, or disguised as an audio-only YouTube stream.

If YouTube remains the provider:

- use the official IFrame Player API lifecycle;
- wait for `onReady` before issuing player commands;
- derive local playing / paused / buffering / ended state from `onStateChange`, never from the click alone;
- handle `onAutoplayBlocked` and `onError` explicitly;
- do not attempt to skip, suppress, cover or work around ads;
- keep the actual YouTube player visible and policy-compliant while provider playback is active;
- preserve lazy creation for this heavy provider surface;
- destroy or pause provider video according to the existing menu-exit contract and provider rules.

This mode exists to preserve access to exact soundtrack songs, not to pretend that YouTube is a native audio library.

## Why not Spotify as the primary free route

Spotify Web Playback requires the listening user to authenticate with a Spotify Premium account. That violates the project goal of a frictionless universally free playback path and would also add account/provider complexity unrelated to Career Mode identity.

It may be reconsidered only if the owner later explicitly accepts Premium-account dependency. It is not the R8 recommendation.

## Why SoundCloud is not the primary authority

SoundCloud's Widget API is technically capable of play, pause, seek, volume, next/previous and READY/PLAY/PAUSE/FINISH events. It is a materially better stateful embed surface than an unobserved raw iframe.

However, catalogue availability and the permission to embed/reuse a particular track are provider/track specific. It therefore cannot be treated as a guaranteed replacement library for the current FIFA 17 commercial soundtrack.

It remains an optional source/provider candidate for individually verified tracks, not the canonical player architecture.

## Native player visual anatomy

The default compact player contains:

1. small `SHOWDOWN RADIO` source eyebrow;
2. current track title and artist;
3. previous, play/pause and next controls;
4. elapsed time, seek rail and duration;
5. volume / mute;
6. `QUEUE` / expand control;
7. short license/source affordance in expanded view only;
8. explicit playback state text for loading, unavailable and offline states.

The compact form should fit inside the Home media zone without dominating primary Career actions.

The expanded queue is a drawer/panel, not a separate route. It contains the licensed playlist, track provenance and the optional FIFA 17 Originals provider switch.

## Required visual modes

### A. Native ready / paused

- track metadata visible;
- Play is the primary media action;
- no provider iframe loaded;
- `preload="metadata"` or `preload="none"` implementation preferred according to measured UX;
- never autoplay on initial page load.

### B. Native playing

- player state comes from the audio element's real events;
- pause icon/label replaces Play;
- progress updates without layout shifts;
- the rest of Home remains fully interactive.

### C. Expanded licensed library

- current row clearly selected;
- each row exposes title, artist and approximate duration;
- provenance/license details are one deliberate action away;
- no album art is required; typography and minimal waveform/equalizer geometry are sufficient.

### D. Unavailable / offline

- preserve track identity;
- state says the track cannot be loaded;
- offer Retry and another licensed track when appropriate;
- do not convert failure into a generic application error;
- local Career Mode controls remain usable.

### E. FIFA 17 Originals provider mode

- clearly labelled as provider playback;
- actual YouTube player remains visible when active;
- loading, ready, playing, paused, buffering, ad/provider interruption and blocked playback remain provider-observed states;
- custom surrounding controls never contradict the real player;
- if playback cannot start, show a direct understandable retry/provider action instead of pretending the track is playing.

## Responsive contract

At 390px class mobile width:

- essential body/status text >= 13px;
- metadata >= 11px;
- control labels >= 12px;
- touch targets >= 44px;
- progress/seek target has a usable touch hit area even if its visible rail is thin;
- no horizontal overflow;
- expanded queue becomes one column;
- source/license copy wraps rather than shrinking below the typography floor.

At Chromebook/reduced-wide widths, retain the compact player rather than turning the media area into a large video tile.

## Accessibility

- buttons have explicit accessible names;
- play/pause exposes the actual current state;
- elapsed/duration text is available without requiring visual inspection of the seek rail;
- seek control is keyboard-operable;
- status changes use a polite live region but progress ticks do not spam announcements;
- focus never moves automatically when a song changes;
- reduced motion suppresses decorative equalizer/wave animation while preserving playback state.

## Performance

Native audio mode is intentionally lighter than the current provider iframe model.

Do not load all audio files at startup. Metadata-only or no-preload is sufficient until user intent. Only the selected source should become the active audio request.

Provider mode remains lazy-loaded because it pulls a third-party player and provider resources.

## Zero-dollar boundary

R8 may use only browser-native playback and assets/sources whose use does not require a paid project subscription or paid API tier.

A third-party service must not become a hidden billing dependency. A service that requires each listener to own a paid subscription is not the default free route.

## Track-rights ledger requirement

Before any native track is accepted, record at minimum:

- display title;
- artist/creator;
- canonical source page;
- direct media source or packaged asset path;
- exact license / public-domain basis;
- required attribution;
- whether modification is permitted;
- verification date;
- file hash if packaged;
- reviewer status.

No track enters the final screenshot/implementation set with `license unknown`.

## Acceptance

This surface is proposal-complete only when:

- native compact player and expanded queue have final-quality compositions;
- unavailable/offline treatment exists;
- FIFA 17 Originals provider fallback is visually distinct from native licensed playback;
- desktop and mobile screenshots pass readability/layout QA;
- the media feasibility evidence records the real r13 failure mechanism and provider constraints;
- the senior handoff explicitly tells implementation not to extract YouTube audio or suppress ads;
- every native playlist track ultimately selected has a complete rights ledger;
- the owner sees and approves all materially different media-player screenshots as part of the final proposal approval gate.
