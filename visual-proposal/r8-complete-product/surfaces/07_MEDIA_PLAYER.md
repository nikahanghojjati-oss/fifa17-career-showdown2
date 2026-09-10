# Surface Group 07 — Menu Music / Media Player

Status: ACTIVE PROPOSAL CONTRACT — SOUNDTRACK PROVIDER PROOF PENDING

This contract replaces the assumption that the current YouTube iframe tile is an acceptable final menu-media experience. It is proposal-only. It does not change production playback code or `main`.

Read with:

- `evidence/MEDIA_PLAYER_FEASIBILITY_2026-09-10.md`
- `evidence/MEDIA_PROVIDER_ZERO_DOLLAR_DECISION_2026-09-10.md`
- `prototypes/25-native-music-player-reference.html`
- `prototypes/26-soundcloud-fifa17-audio-provider-reference.html` when present

## Owner requirement

The menu-media experience must be smooth, lightweight, understandable on the first press and permanently zero-dollar for the project. It must be visually integrated into the R8 black / charcoal / gold system.

The project must not depend on a paid API tier, payment card, automatic overage billing, Premium listener account, or future paid upgrade merely to keep Home usable. If any provider changes terms or becomes unavailable, media fails closed financially and Career Mode remains usable.

The owner has reported a production failure pattern in which YouTube playback can require repeated Play / Pause interactions before the selected song actually starts. The proposal therefore defines both a better presentation and a real provider-state contract.

## Production failure studied and rechecked

The r13 failure mechanism remains present on the r14 main reconciliation anchor `97c28b1efea6ee6e901e6076a834ec419cbad5aa`.

`js/menuExperience.js` still:

- optimistically flips `menuMediaPlaying = true` before the embedded player confirms playback;
- creates the YouTube iframe with `autoplay=1` after the user presses Play;
- treats iframe DOM `load` as readiness;
- sends raw postMessage commands;
- does not subscribe to the official YouTube `onReady`, `onStateChange`, `onAutoplayBlocked`, or `onError` lifecycle;
- can therefore render `PLAYING` while the provider is still loading, blocked, buffering, interrupted or otherwise not playing.

The senior implementation must not preserve that optimistic-state model.

## Revised zero-dollar architecture decision

### Mode A — FIFA 17 SOUNDTRACK / AUDIO-FIRST

For the six soundtrack songs already present in `MENU_MEDIA_SOURCES`, the preferred provider is the official SoundCloud HTML5 Widget when the exact track passes full-length embed proof on the owner device classes.

Why SoundCloud is now the leading exact-song candidate:

- all six current songs were located on public artist-branded SoundCloud pages;
- the standard SoundCloud Widget API is audio-first;
- it exposes provider events such as `READY`, `PLAY`, `PAUSE`, `FINISH`, `ERROR`, loading/progress and seek controls;
- the standard widget path does not require the project to buy an API plan or expose a paid API credential;
- one visible widget can be reused with `widget.load(...)` for track changes.

Current exact candidate mapping:

| Project key | Song | SoundCloud source |
| --- | --- | --- |
| `music` | Two Door Cinema Club — Are We Ready? (Wreck) | `https://soundcloud.com/two-door-cinema-club/are-we-ready-wreck` |
| `bastille` | Bastille — Send Them Off! | `https://soundcloud.com/bastilleuk/send-them-off` |
| `youth` | Glass Animals — Youth | `https://soundcloud.com/glassanimals/youth` |
| `shelter` | Porter Robinson & Madeon — Shelter | `https://soundcloud.com/porter-robinson/porter-robinson-madeon-shelter-5` |
| `move` | Saint Motel — Move | `https://soundcloud.com/saintmotel/move-1` |
| `highlow` | Empire Of The Sun — High And Low | `https://soundcloud.com/empireofthesunsound/high-and-low` |

Public-page discovery is not final playback proof. SoundCloud uploaders can control embedding, and SoundCloud Go catalogue tracks may expose only a short preview in embedded players. Each song therefore receives independent provider eligibility.

A song is marked `soundcloud_full` only after it proves full-length embedded playback on both:

1. iPhone Safari;
2. Chromebook browser.

Required proof per song:

- `READY` arrives;
- first enabled Play calls `widget.play()` and actual `PLAY` arrives without a Play / Pause / Play recovery ritual;
- duration is consistent with a full song rather than a short preview;
- Pause and resume are event-confirmed;
- switching tracks reaches a new ready state without stale state leakage;
- error state is recoverable;
- SoundCloud attribution/player remains visible and provider-compliant.

An individual song failing this proof does not invalidate the entire six-song set. That song falls back to YouTube.

### Mode B — YOUTUBE FALLBACK + TRAILER

YouTube remains the zero-dollar provider fallback for any exact song that cannot pass the SoundCloud full-length proof. The FIFA 17 gameplay trailer remains YouTube video content.

If YouTube is used:

- use the official IFrame Player API lifecycle;
- wait for `onReady` before treating the player as command-ready;
- derive playing / paused / buffering / ended state from `onStateChange`;
- handle `onAutoplayBlocked` and `onError` explicitly;
- keep the actual YouTube player visible and policy-compliant while active;
- preserve lazy creation for the heavy provider surface;
- never extract, isolate or disguise YouTube audio;
- never suppress, cover, skip or work around provider ads.

Required provider state machine:

`idle -> provider_loading -> ready -> play_requested -> playing | buffering | blocked | error -> paused | ended`

A local click is intent, not evidence of playback.

### Mode C — OPTIONAL SHOWDOWN RADIO

An additive open-audio mode may use browser-native `<audio>` and/or Audius for tracks that are individually rights-compatible.

Audius is approved as a zero-dollar candidate because its current Free API plan documents a large free allowance and the client SDK supports search/streaming, while its Open Music License can provide strong Music Player rights for covered tracks. However, targeted discovery did not establish dependable official Audius copies of the current six commercial FIFA 17 songs.

Therefore Audius is not the exact-six replacement and must not delay the exact soundtrack solution.

The functional native-audio proof remains useful because it demonstrates the correct principle: UI playback state follows real media events, never an optimistic click boolean.

## Smooth first-press contract

The final exact-song path must feel deterministic.

For SoundCloud-eligible songs:

1. create or reuse one visible SoundCloud widget with `auto_play=false`;
2. allow it to reach `READY` before enabling normal Play, or clearly label the control `LOADING TRACK` until ready;
3. first enabled Play calls `widget.play()`;
4. UI remains `PLAY REQUESTED` / `LOADING` until SoundCloud emits `PLAY`;
5. `PAUSE` changes UI to paused;
6. `FINISH` advances according to queue rules;
7. `ERROR` or preview-only capability exposes the YouTube fallback rather than pretending playback succeeded;
8. switching songs uses `widget.load(...)` and resets provider-derived state.

No menu audio autoplays on application startup.

## Player visual anatomy

The compact Home player contains:

1. source eyebrow such as `FIFA 17 SOUNDTRACK` or `SHOWDOWN RADIO`;
2. current track title and artist;
3. explicit provider badge when SoundCloud or YouTube is active;
4. previous, play/pause and next controls;
5. elapsed time, seek rail and duration where the provider supplies reliable values;
6. volume / mute where supported;
7. queue / expand control;
8. explicit `LOADING`, `READY`, `PLAY REQUESTED`, `PLAYING`, `PAUSED`, `BUFFERING`, `PREVIEW ONLY`, `BLOCKED`, `ERROR` and `UNAVAILABLE` states as applicable;
9. visible provider attribution/player area required by the active provider.

The player must not dominate primary Career Mode actions.

## Required visual modes

### A. SoundCloud loading / ready

- exact track identity visible;
- provider visible/attributed;
- Play disabled or clearly loading until `READY`;
- no false `PLAYING` state.

### B. SoundCloud playing / paused

- state is driven by Widget API events;
- progress updates without layout shifts;
- Home remains interactive.

### C. SoundCloud preview-only / ineligible

- explain that full embedded playback is unavailable;
- offer compliant YouTube fallback;
- never silently loop a short preview as though it were the full song.

### D. YouTube fallback

- actual YouTube player is visible;
- ready / playing / paused / buffering / autoplay-blocked / error states come from official IFrame API events;
- custom controls never contradict the real player.

### E. Optional open-audio Showdown Radio

- native/Audius tracks are visually distinct from the commercial FIFA 17 provider catalogue;
- every non-provider-hosted track carries a rights/provenance decision before final acceptance.

### F. Unavailable / offline

- preserve track identity;
- offer Retry, another eligible track, or provider fallback where appropriate;
- do not escalate media failure into a global application failure;
- Career Mode actions remain usable.

## Responsive contract

At 390px class mobile width:

- essential body/status text >= 13px;
- metadata >= 11px;
- control labels >= 12px;
- touch targets >= 44px;
- progress/seek target has a usable touch hit area even if the visible rail is thin;
- no horizontal overflow;
- queue becomes one column;
- provider attribution wraps rather than shrinking below the typography floor.

At Chromebook/reduced-wide widths, retain a compact player. A provider video fallback may expand deliberately when selected, but it must not force the entire Home layout into a permanent large video tile.

## Accessibility

- buttons have explicit accessible names;
- play/pause exposes actual provider/media state;
- elapsed/duration text is available where known;
- seek control is keyboard-operable when exposed;
- meaningful state changes use a polite live region, while progress ticks do not spam announcements;
- focus does not move automatically when a song changes;
- reduced motion suppresses decorative equalizer/wave animation while preserving playback state.

## Performance

- do not create six provider players;
- use one active provider instance and a data-driven track queue;
- SoundCloud may be warmed only enough to reach deterministic readiness without autoplay;
- YouTube fallback remains lazy-loaded;
- optional native audio should request only the selected source;
- provider/media failure must not delay Home startup or block Career Mode controls.

## Permanent zero-dollar boundary

Conceptual invariant:

`paidUpgradeAllowed = false`

R8 may use only provider/browser paths that do not require the project to purchase a subscription or paid API tier.

If a future provider policy/pricing change makes payment necessary:

- disable that provider path;
- fall back to another approved zero-dollar path when available;
- otherwise show media unavailable;
- never auto-upgrade, add billing or create an overage charge.

## Rights and provider ledger

For provider-hosted commercial songs record:

- project track key;
- exact provider source page;
- provider type;
- embed eligibility;
- full-length proof result;
- verified duration;
- iPhone Safari result;
- Chromebook result;
- fallback provider/video ID;
- verification date;
- reviewer status.

For locally packaged or independently licensed audio additionally record exact license, attribution, modification rights and file hash.

No native/self-hosted track enters the final implementation set with `license unknown`.

## Acceptance

This surface is proposal-complete only when:

- all six exact songs have a recorded SoundCloud full-length eligibility result;
- each ineligible SoundCloud song has a working hardened YouTube fallback contract;
- the trailer remains a hardened YouTube video provider path;
- the exact-song provider reference composition covers loading, ready, playing, paused, preview-only/fallback and unavailable states;
- desktop and mobile screenshots pass readability/layout QA;
- first-press interaction proof is completed on iPhone Safari and Chromebook;
- zero-dollar fail-closed behavior is preserved;
- the senior handoff prohibits hidden YouTube audio, ad suppression and paid-provider escalation;
- the owner sees and explicitly approves all materially different final media screenshots as part of the final proposal approval gate.
