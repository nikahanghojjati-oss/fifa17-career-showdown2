# Media Player Feasibility / Production Failure Study — 2026-09-10

Status: DECISION RECORDED — IMPLEMENTATION DEFERRED

Proposal branch: `developer/r8-26-complete-proposal-asset-build-r13-work`

Production study anchor: `ea96ff1280b5e63962b7ee1a6a8c0980fe4e3686` / `1.9.1-r13`

This evidence answers the owner request to investigate a genuinely free, smoother audio-first replacement for the current Home YouTube experience and to diagnose why the current player can require repeated Play / Pause interactions.

## 1. What production currently does

`index.html` exposes a Home `menuMusicTile` whose initial source is `ARE WE READY? (WRECK)` by Two Door Cinema Club. The placeholder says selected media stays unloaded until the user presses Play.

`js/menuExperience.js` defines six FIFA 17 music videos plus the FIFA 17 gameplay trailer, all by YouTube video ID.

The playback path is not built around the official `YT.Player` object. Instead it:

1. sets `menuMediaPlaying = true` when the site Play button is clicked;
2. creates an iframe with `autoplay=1` and `enablejsapi=1`;
3. waits for the iframe element's generic DOM `load` event;
4. then posts a raw `playVideo` command to the iframe if the optimistic local flag still says playing;
5. changes site UI labels using that local boolean;
6. never observes the YouTube player's actual state-change or autoplay-blocked events.

This means the site can display `PLAYING` while the embedded provider is not actually in YouTube's PLAYING state.

## 2. Why the reported bug is plausible

The owner's observed sequence — first press does not settle into playback, then Pause / Play sometimes makes it work — is consistent with the state divergence above.

A generic iframe `load` event only says the embedded document loaded. It is not the YouTube IFrame API's `onReady` event and it does not prove that the video has entered PLAYING state.

The official YouTube IFrame API exposes:

- `onReady` when the player can receive API calls;
- `onStateChange` with unstarted, ended, playing, paused, buffering and cued states;
- `onAutoplayBlocked` when browser autoplay/scripted playback is blocked;
- player error events.

The current production integration does not consume those signals.

Therefore the UI can become one interaction ahead of the provider. A later pause/play click happens after the provider has had more time to initialize, which can accidentally resynchronize behavior. That is not a reliable playback contract.

## 3. YouTube audio-only feasibility

Decision: REJECT as the native/audio-only replacement.

Current YouTube Developer Policies prohibit API clients from:

- modifying or blocking advertisements served by YouTube;
- modifying/building upon/blocking portions of the YouTube player;
- separating, isolating or modifying the audio or video components of YouTube audiovisual content;
- separately promoting the audio or video component;
- creating background playback where the player is not displayed in the active page/tab/screen.

The Required Minimum Functionality also requires compliant embedded-player presentation and forbids obscuring portions of the embedded player.

Therefore R8 must not design a hidden YouTube iframe whose audio is presented as though it were a custom native music stream. R8 also must not attempt to bypass the advertisement transition the owner is encountering.

Official references reviewed 2026-09-10:

- https://developers.google.com/youtube/iframe_api_reference
- https://developers.google.com/youtube/terms/developer-policies
- https://developers.google.com/youtube/terms/developer-policies-guide
- https://developers.google.com/youtube/terms/required-minimum-functionality
- https://developers.google.com/youtube/player_parameters

## 4. Can the exact current FIFA 17 songs become native audio?

Not merely because they are on YouTube.

The current list contains commercial recordings. A browser-native `<audio>` player needs an audio file/source that the project is permitted to stream or package. R8 has no evidence that the project has rights to self-host the commercial soundtrack recordings.

Therefore the proposal keeps exact FIFA 17 originals only in a separate permitted provider mode unless a future source provides explicit usable rights.

No ripped/extracted YouTube audio is approved.

## 5. Best zero-dollar default — native HTML audio + individually licensed tracks

Decision: RECOMMENDED.

A browser-native `<audio>` engine has no service subscription, third-party player iframe or account dependency. It supports direct event authority for loading, playing, pause, ended, errors, seeking, duration and volume. It also lets the R8 UI remain visually compact.

The project should curate a small soundtrack whose individual files are confirmed under suitable rights such as:

- CC0/public domain;
- CC BY with correct attribution;
- other explicit licenses permitting this web use.

The player itself costs nothing. Only verified tracks are admitted.

Potential discovery sources reviewed:

### Wikimedia Commons

Commons explains that most media is under free licenses or public domain, but each file has its own terms and reusers must verify and comply with the file-specific attribution/license requirements.

References:

- https://commons.wikimedia.org/wiki/Commons:Reusing_content_outside_Wikimedia
- https://commons.wikimedia.org/wiki/Commons:Reusing_content_outside_Wikimedia/licenses

### Free Music Archive

FMA explicitly warns that `free` does not mean unrestricted reuse. Tracks may use different Creative Commons terms, so the individual license must be checked. This makes FMA useful for discovery, not a blanket rights grant.

Reference:

- https://freemusicarchive.org/faq

R8 intentionally does not lock a final track list in this feasibility slice. Track selection requires a dedicated per-track rights ledger rather than guessing from a provider name.

## 6. Spotify feasibility

Decision: REJECT as default free route.

Spotify's Web Playback SDK requires the listening user to authenticate and have Spotify Premium. Official docs also describe additional platform policy restrictions.

References reviewed:

- https://developer.spotify.com/documentation/web-playback-sdk
- https://developer.spotify.com/documentation/web-playback-sdk/tutorials/getting-started

This does not meet the owner's requirement for a frictionless universally free project player.

## 7. SoundCloud feasibility

Decision: VALID OPTIONAL PROVIDER, NOT CANONICAL PLAYER.

SoundCloud's official Widget API exposes READY, PLAY, PAUSE, FINISH and error events plus play, pause, seek, volume, next and previous controls. Technically, that is a more observable provider integration than the current raw YouTube postMessage path.

Reference:

- https://developers.soundcloud.com/docs/api/html5-widget

However, the availability and reuse/embed suitability of individual tracks remains track/provider dependent. It cannot be assumed to reproduce the current commercial FIFA 17 soundtrack for free.

## 8. Recommended product architecture

### Mode 1 — SHOWDOWN RADIO

Default, compact, native audio UI using rights-verified tracks.

Runtime concept:

- one `<audio>` authority;
- no autoplay on app startup;
- `preload="metadata"` or `none` according to measured performance;
- first user Play starts only the selected track;
- site state follows actual audio events;
- queue loaded as data, not as multiple simultaneous media requests;
- no cloud/provider account.

### Mode 2 — FIFA 17 ORIGINALS

Optional provider drawer for the current commercial soundtrack and gameplay trailer.

If YouTube remains the provider:

- lazy-create only after explicit selection/intent;
- use the official IFrame Player API;
- wait for `onReady`;
- state UI follows `onStateChange`;
- handle `onAutoplayBlocked` and errors;
- keep provider player visible;
- never suppress or skip ads;
- no audio extraction/background disguise.

This gives the owner both experiences: a clean music-first default and continuing legal/provider access to favorite FIFA 17 songs.

## 9. Senior implementation guidance for the existing bug

Even if native audio is not integrated immediately, the existing YouTube integration should be hardened independently.

Do not treat the click as proof of playback.

Conceptual state machine:

`idle -> loading_provider -> ready -> play_requested -> playing | buffering | blocked | error -> paused | ended`

Site button labels/status must be projected from provider-observed state rather than from a boolean toggled optimistically by the click handler.

The initial explicit user Play should create the player. When the actual `onReady` arrives, issue at most the appropriate play request. Do not combine `autoplay=1`, iframe DOM-load guessing and a second raw play command as the authority model.

## 10. What R8 will and will not implement

R8 visual branch MAY:

- define the UX contract;
- build native-player and provider-mode reference compositions;
- produce responsive screenshot evidence;
- define the track-rights ledger and implementation state machine.

R8 visual branch MUST NOT:

- patch production `main`;
- rip commercial audio;
- add a paid music service;
- introduce a new account dependency;
- claim a final playlist before per-track license verification;
- attempt ad avoidance.

## 11. Current decision

The proposal direction is accepted internally for continued design work:

`native rights-verified Showdown Radio` + `separate compliant FIFA 17 Originals provider mode`.

This is not owner-final approval. The media compositions must enter the final screenshot approval package with all materially different states, and the owner must approve those screenshots before the overall R8 proposal can be called final.
