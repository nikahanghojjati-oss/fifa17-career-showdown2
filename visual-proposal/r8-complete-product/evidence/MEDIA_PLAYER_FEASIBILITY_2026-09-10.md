# Media Player Feasibility / Production Failure Study — 2026-09-10

Status: DECISION RECORDED — RECONCILED BY ZERO-DOLLAR PROVIDER STUDY

Proposal branch: `developer/r8-26-complete-proposal-asset-build-r13-work`

Original production study anchor: `ea96ff1280b5e63962b7ee1a6a8c0980fe4e3686` / `1.9.1-r13`

Rechecked live-main anchor: `97c28b1efea6ee6e901e6076a834ec419cbad5aa` / r14

Read the later provider decision before implementation:

`MEDIA_PROVIDER_ZERO_DOLLAR_DECISION_2026-09-10.md`

This evidence answers the owner request to investigate a genuinely free, smoother audio-first replacement for the current Home YouTube experience and to diagnose why the current player can require repeated Play / Pause interactions.

## 1. What production currently does

`index.html` exposes a Home `menuMusicTile` whose initial source is `ARE WE READY? (WRECK)` by Two Door Cinema Club. `js/menuExperience.js` defines six FIFA 17 music videos plus the FIFA 17 gameplay trailer, all by YouTube video ID.

The playback path is not built around the official `YT.Player` object. Instead it:

1. sets `menuMediaPlaying = true` when the site Play button is clicked;
2. creates an iframe with `autoplay=1` and `enablejsapi=1`;
3. waits for the iframe element's generic DOM `load` event;
4. then posts a raw `playVideo` command to the iframe if the optimistic local flag still says playing;
5. changes site UI labels using that local boolean;
6. never observes the YouTube player's actual state-change or autoplay-blocked events.

This means the site can display `PLAYING` while the embedded provider is not actually in YouTube's PLAYING state.

The r14 recheck found the same authority model still present. The diagnosis therefore remains current after the Journey Reconnect merge.

## 2. Why the reported bug is plausible

The owner's observed sequence — first press does not settle into playback, then Pause / Play sometimes makes it work — is consistent with the state divergence above.

A generic iframe `load` event only says the embedded document loaded. It is not the YouTube IFrame API's `onReady` event and it does not prove that the video has entered PLAYING state.

The official YouTube IFrame API exposes:

- `onReady` when the player can receive API calls;
- `onStateChange` with unstarted, ended, playing, paused, buffering and cued states;
- `onAutoplayBlocked` when browser autoplay/scripted playback is blocked;
- player error events.

The current production integration does not consume those signals. The UI can therefore become one interaction ahead of the provider. A later Pause / Play click happens after the provider has had more time to initialize, which can accidentally resynchronize behavior.

## 3. YouTube audio-only feasibility

Decision: REJECT as a hidden/native audio-only replacement.

Current YouTube Developer Policies prohibit API clients from separating, isolating or modifying the audio/video components of YouTube audiovisual content and impose presentation requirements on embedded playback. R8 must not design a hidden YouTube iframe whose audio is presented as a custom native music stream. It also must not attempt ad suppression or avoidance.

Official references reviewed 2026-09-10:

- https://developers.google.com/youtube/iframe_api_reference
- https://developers.google.com/youtube/terms/developer-policies
- https://developers.google.com/youtube/terms/developer-policies-guide
- https://developers.google.com/youtube/terms/required-minimum-functionality
- https://developers.google.com/youtube/player_parameters

YouTube remains acceptable as a visible, compliant zero-dollar fallback and as the trailer provider.

## 4. Exact commercial songs and native self-hosting

The six current FIFA 17 tracks are commercial recordings. Their existence on YouTube or SoundCloud is not permission to copy, rip or self-host the recordings.

A browser-native `<audio>` player requires a direct source the project is permitted to stream/package. No ripped or extracted YouTube/SoundCloud audio is approved.

## 5. Browser-native audio feasibility

Decision: TECHNICALLY RECOMMENDED FOR OPEN / RIGHTS-VERIFIED SHOWDOWN RADIO, NOT NECESSARY TO REPLACE THE EXACT SIX SONGS.

A native `<audio>` engine has no service subscription or iframe dependency and provides direct loading, playing, pause, ended, error, seek, duration and volume events. A functional isolated proof exists in the proposal branch using rights-clean candidate tracks.

Potential rights-safe discovery sources include Wikimedia Commons and Free Music Archive, but every track still needs its own license/provenance check.

References:

- https://commons.wikimedia.org/wiki/Commons:Reusing_content_outside_Wikimedia
- https://commons.wikimedia.org/wiki/Commons:Reusing_content_outside_Wikimedia/licenses
- https://freemusicarchive.org/faq

## 6. Spotify feasibility

Decision: REJECT as the default zero-dollar route.

Spotify Web Playback requires listener authentication and a Spotify Premium account. That violates the requirement for a frictionless universally free default and adds an unrelated account dependency.

References:

- https://developer.spotify.com/documentation/web-playback-sdk
- https://developer.spotify.com/documentation/web-playback-sdk/tutorials/getting-started

## 7. SoundCloud feasibility — REVISED AFTER EXACT-CATALOGUE SEARCH

Earlier decision in this study: optional candidate.

Reconciled decision: LEADING EXACT-SIX AUDIO-FIRST PROVIDER, SUBJECT TO PER-TRACK FULL-LENGTH EMBED PROOF.

The official SoundCloud HTML5 Widget API exposes `READY`, `PLAY`, `PAUSE`, `FINISH`, `ERROR`, loading/progress, seek, volume and track-load controls. It can be driven from one visible embedded widget and does not require the project to purchase a custom API plan for the standard widget path.

Exact public artist-branded SoundCloud pages were located for all six current project songs:

- Two Door Cinema Club — Are We Ready? (Wreck)
- Bastille — Send Them Off!
- Glass Animals — Youth
- Porter Robinson & Madeon — Shelter
- Saint Motel — Move
- Empire Of The Sun — High And Low

The exact URLs and fallback mapping are recorded in `MEDIA_PROVIDER_ZERO_DOLLAR_DECISION_2026-09-10.md`.

This is materially better exact-catalogue coverage than the Audius search produced.

However, page discovery is not final full-length embed proof. SoundCloud documents uploader-controlled embed permissions and a roughly 30-second embedded preview behavior for SoundCloud Go catalogue tracks. Therefore every song must be tested in the actual Widget on iPhone Safari and Chromebook before it is marked SoundCloud-eligible.

References:

- https://developers.soundcloud.com/docs/api/html5-widget
- https://help.soundcloud.com/hc/en-us/articles/115003453587
- https://help.soundcloud.com/hc/en-us/articles/31423752369691-Embedding-tracks-FAQs
- https://help.soundcloud.com/hc/en-us/articles/31423603670043-Manage-your-track-s-permissions
- https://help.soundcloud.com/hc/en-us/articles/115003448167-Embedding-a-SoundCloud-Go-Track

## 8. Audius feasibility

Decision: APPROVED ZERO-DOLLAR OPTIONAL OPEN-AUDIO SOURCE; NOT THE EXACT-SIX FIFA 17 REPLACEMENT.

Current official Audius documentation records:

- Free plan: 10 requests per second;
- Free plan: 500,000 requests per month;
- Free plan described as always free with no restrictions;
- browser/mobile SDK path using an API key that Audius documents as safe for client-side code;
- public-track streaming support;
- an Open Music License with unusually useful Music Player permissions for material covered by that license.

For the owner's expected occasional use, that free allowance is vastly above anticipated demand. The project nevertheless treats the free quota as a hard financial boundary: no automatic paid upgrade is ever allowed.

Targeted discovery did not establish dependable official Audius copies of the six current FIFA 17 songs. Searches surfaced unrelated works/remixes rather than a reliable exact commercial catalogue.

References:

- https://docs.audius.co/sdk/
- https://docs.audius.co/developers/introduction/overview/
- https://docs.audius.co/developers/guides/gate-release-access/
- https://audius.org/open-music-license.pdf

## 9. Reconciled recommended architecture

### Exact FIFA 17 soundtrack songs

Per song:

1. preferred: SoundCloud HTML5 Widget after full-length device proof;
2. fallback: compliant YouTube IFrame Player API;
3. final fallback: `TRACK UNAVAILABLE` while Career Mode remains fully usable.

Provider eligibility is per track. One SoundCloud failure does not force the other five back to YouTube.

### FIFA 17 gameplay trailer

YouTube remains the video provider.

### Optional Showdown Radio

Browser-native rights-verified audio and/or Audius can provide an additional open-audio soundtrack lane later. This is additive and must not delay the exact six-song solution.

## 10. Smooth provider state authority

No provider may repeat the current optimistic-state error.

Conceptual state machine:

`idle -> provider_loading -> ready -> play_requested -> playing | buffering | blocked | error -> paused | ended`

For SoundCloud:

- one visible widget;
- `auto_play=false`;
- Play enabled only after `READY`, or visibly marked loading until then;
- custom UI becomes `PLAYING` only after provider `PLAY`;
- `PAUSE`, `FINISH` and `ERROR` drive corresponding state;
- `widget.load(...)` changes tracks and resets state;
- preview-only/ineligible track exposes YouTube fallback.

For YouTube:

- use official `YT.Player`;
- wait for `onReady`;
- derive state from `onStateChange`;
- handle `onAutoplayBlocked` and `onError`;
- keep provider video visible;
- no audio extraction or ad workaround.

## 11. Permanent zero-dollar invariant

Conceptual contract:

`paidUpgradeAllowed = false`

The media system may not require a payment card, paid API tier, automatic overage, Premium listener account or paid proxy/CDN.

If a provider changes terms later and payment becomes necessary, disable that provider path and use another approved zero-dollar provider or an unavailable state. Never silently spend money.

Career Mode Showdown must remain fully usable if every media provider is unavailable.

## 12. What R8 will and will not implement

R8 visual branch MAY:

- define the final player UX/state contract;
- build SoundCloud, native/open-audio and YouTube-fallback reference compositions;
- create isolated functional provider proofs;
- create responsive screenshot evidence;
- define per-track provider/rights ledgers;
- record real device proof results.

R8 visual branch MUST NOT:

- patch/deploy production `main`;
- rip commercial audio;
- add a paid music service;
- add a Premium-listener dependency;
- introduce billing or automatic upgrade logic;
- claim SoundCloud full-length eligibility before real embed proof;
- attempt YouTube ad avoidance.

## 13. Transition decision

The media investigation is no longer an open provider search. It is transitioned into the proposal architecture:

`SoundCloud exact-song candidate -> hardened YouTube per-track fallback -> unavailable without harming Career Mode`

with optional:

`native/Audius Showdown Radio`.

The remaining media work is implementation-quality prototype/device proof/screenshot QA, not another broad search for providers. Final owner approval still occurs only through the complete final screenshot gate.
