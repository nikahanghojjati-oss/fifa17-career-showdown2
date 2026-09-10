# Media Provider Zero-Dollar Decision — 2026-09-10

Status: ACTIVE PROPOSAL AUTHORITY — DEVICE PROOF STILL REQUIRED BEFORE OWNER FINAL APPROVAL

This decision continues the interrupted R8 media investigation and tightens the owner requirement: the project must not depend on a paid API tier, a listener subscription, a payment method, automatic overage billing, or a future upgrade in order for the Career Mode Showdown Home screen to remain usable.

Current live-main reconciliation anchor for this decision: `97c28b1efea6ee6e901e6076a834ec419cbad5aa` (`SSJR r14: Journey Reconnect and coherent r14 shell`). The Home media implementation on that head still uses the same optimistic YouTube iframe lifecycle studied in r13: local `menuMediaPlaying` state can advance before provider-confirmed playback and the integration still relies on iframe DOM `load` plus raw postMessage commands instead of official YouTube player events.

## 1. Permanent zero-dollar invariant

The media design must fail closed financially.

Allowed:

- browser-native media playback;
- provider embeds/widgets that do not require the project to purchase a plan;
- free API plans that do not auto-upgrade or create an overage charge;
- a client-visible public API key only when the provider explicitly documents that as safe;
- graceful provider unavailability with no effect on Career Mode data or controls.

Forbidden:

- payment-card dependency;
- paid API tier as a hidden prerequisite;
- automatic upgrade/overage path;
- Premium/paid listener account as the default experience;
- paid proxy/CDN introduced only to make music work;
- ripping, extracting or self-hosting commercial soundtrack audio without rights.

If a provider changes its commercial terms later, the product must disable that provider path or fall back to another approved zero-dollar path. It must never silently begin spending money.

## 2. SoundCloud Widget — leading exact-FIFA-17 audio candidate

Decision: FIRST-CHOICE CANDIDATE FOR THE SIX EXISTING FIFA 17 SONGS, SUBJECT TO FULL-LENGTH EMBED DEVICE PROOF.

Why it materially improves the current situation:

- the official SoundCloud HTML5 Widget is audio-first rather than a video surface;
- the Widget API can be used from a normal embedded player and exposes `READY`, `PLAY`, `PAUSE`, `FINISH`, `ERROR`, loading/progress, seek and volume controls;
- the documented widget setup uses the public `w.soundcloud.com/player/api.js` script and does not require a SoundCloud API key for the embedded Widget API path;
- one widget can be reused and pointed at a new track with `widget.load(...)` rather than constructing six simultaneous players;
- the player can remain visibly attributed to SoundCloud while the surrounding controls use the R8 black/charcoal/gold design.

Official references reviewed:

- https://developers.soundcloud.com/docs/api/html5-widget
- https://help.soundcloud.com/hc/en-us/articles/115003453587
- https://help.soundcloud.com/hc/en-us/articles/31423752369691-Embedding-tracks-FAQs
- https://help.soundcloud.com/hc/en-us/articles/31423603670043-Manage-your-track-s-permissions
- https://help.soundcloud.com/hc/en-us/articles/115003448167-Embedding-a-SoundCloud-Go-Track

### Exact current project tracks found on SoundCloud

All six songs currently listed in `MENU_MEDIA_SOURCES` have current public SoundCloud pages under artist-branded profiles:

| Key | Track | Artist | SoundCloud candidate |
| --- | --- | --- | --- |
| `music` | Are We Ready? (Wreck) | Two Door Cinema Club | https://soundcloud.com/two-door-cinema-club/are-we-ready-wreck |
| `bastille` | Send Them Off! | Bastille | https://soundcloud.com/bastilleuk/send-them-off |
| `youth` | Youth | Glass Animals | https://soundcloud.com/glassanimals/youth |
| `shelter` | Shelter | Porter Robinson & Madeon | https://soundcloud.com/porter-robinson/porter-robinson-madeon-shelter-5 |
| `move` | Move | Saint Motel | https://soundcloud.com/saintmotel/move-1 |
| `highlow` | High And Low | Empire Of The Sun | https://soundcloud.com/empireofthesunsound/high-and-low |

This is a stronger exact-catalogue match than Audius for the current six-song set.

### Important SoundCloud limitation

A public SoundCloud page is not by itself proof that the embedded player will provide the complete recording forever.

SoundCloud documents that:

- uploaders can control whether an embed code is exposed/allowed;
- SoundCloud Go catalogue tracks provide only a 30-second preview inside embeds because the embedded player cannot identify a signed-in Go subscriber.

Therefore each of the six exact tracks must pass an actual embedded-player proof before final adoption. A runtime or screenshot claim of “full FIFA 17 soundtrack playback” is prohibited until that proof exists.

Required proof on both owner device classes:

1. iPhone Safari;
2. Chromebook browser.

For each song verify:

- widget reaches `READY`;
- first deliberate Play starts playback without requiring a Play/Pause/Play recovery sequence;
- `PLAY` event arrives and site state follows it;
- duration is consistent with a full song rather than a roughly 30-second Go preview;
- Pause/Play resumes cleanly;
- track switch reaches a new `READY` state without stale state from the previous item;
- `ERROR` produces an understandable fallback state;
- provider attribution remains visible.

Any individual track that fails full-length embed proof stays on YouTube fallback rather than blocking the other tracks from using SoundCloud.

## 3. Audius — excellent zero-dollar open-audio option, not the exact-six replacement

Decision: APPROVED AS AN OPTIONAL SHOWDOWN-RADIO / OPEN-CATALOGUE SOURCE, NOT AS THE CURRENT FIFA 17 ORIGINALS REPLACEMENT.

Official Audius developer documentation currently states:

- Free plan: 10 requests/second;
- Free plan: 500,000 requests/month;
- the Free plan is described as “always free with no restrictions”;
- browser/mobile SDK use requires only the API key;
- Audius documents the API key as safe for client-side code;
- bearer tokens must not be exposed in the frontend;
- the SDK supports searching and streaming tracks;
- public tracks without access authorities can be streamed without a gate signature.

Official references reviewed:

- https://docs.audius.co/sdk/
- https://docs.audius.co/developers/introduction/overview/
- https://docs.audius.co/developers/guides/gate-release-access/
- https://audius.org/open-music-license.pdf

Audius's Open Music License is unusually favorable for third-party music players: for covered content it grants Music Players a worldwide, non-exclusive, royalty-free, perpetual and irrevocable right to stream/use the licensed material in connection with a Music Player. Alternative per-track licenses can still apply and must be honored.

For the owner's expected usage of only occasional sessions, the current 500,000-request monthly free allowance is orders of magnitude above expected demand. The architecture must nevertheless treat the free quota as a hard ceiling, never an invitation to buy an Unlimited plan.

### Exact FIFA 17 catalogue result

Targeted web discovery did not establish official Audius copies of the six current commercial FIFA 17 songs. The searches returned unrelated tracks and unofficial remixes/bootlegs, including Shelter remixes, rather than a dependable official six-song catalogue.

Therefore Audius does not replace SoundCloud/YouTube for the existing exact soundtrack set at this stage.

## 4. YouTube — retained as trailer authority and zero-dollar per-track fallback

Decision: KEEP, BUT FIX THE INTEGRATION. DO NOT USE HIDDEN AUDIO-ONLY YOUTUBE.

YouTube remains useful because:

- the project already has exact video IDs for all six songs and the FIFA 17 gameplay trailer;
- the embed path does not require the project to pay for playback;
- it is the required fallback when a SoundCloud track is not fully embeddable.

However, the current integration must not survive into final implementation unchanged.

Required implementation model:

`idle -> provider_loading -> ready -> play_requested -> playing | buffering | blocked | error -> paused | ended`

Use the official YouTube IFrame Player API and derive UI state from:

- `onReady`;
- `onStateChange`;
- `onAutoplayBlocked`;
- `onError`.

Do not treat a click, iframe DOM `load`, or local boolean as proof of playback.

The visible YouTube player must remain policy-compliant. Do not extract/isolate its audio and do not suppress or work around ads.

## 5. Recommended final provider architecture

### Music tracks

For each of the six current FIFA 17 songs:

1. preferred provider: SoundCloud HTML5 Widget, after that exact track passes full-length embed/device proof;
2. fallback provider: compliant YouTube IFrame Player API;
3. if both are unavailable, show `TRACK UNAVAILABLE` without affecting the rest of Home.

No all-or-nothing provider migration is required. Provider eligibility is stored per track.

### Trailer

The FIFA 17 gameplay trailer remains YouTube video provider content.

### Optional future Showdown Radio

Audius or individually licensed local/native audio may supply additional zero-dollar tracks later. This is additive and must not delay the exact FIFA 17 soundtrack decision.

## 6. Smooth first-press contract

For SoundCloud tracks, do not repeat the current YouTube mistake of creating the provider and claiming “PLAYING” at the same instant.

Preferred reference lifecycle:

1. create one visible SoundCloud widget for the selected track in `auto_play=false` mode early enough that it can reach `READY` before the first Play is enabled;
2. Play control is disabled or explicitly says `LOADING TRACK` until provider `READY`;
3. the user's first enabled Play invokes `widget.play()`;
4. UI changes to `PLAYING` only after the Widget API `PLAY` event;
5. UI changes to `PAUSED` only after `PAUSE`;
6. `FINISH` advances according to queue rules;
7. `ERROR` or preview-only capability routes to the YouTube fallback affordance;
8. one widget is reused with `widget.load(...)` for track changes.

This may trade a small amount of metadata/widget startup network work for a materially smoother first Play. It does not autoplay audio.

## 7. Zero-billing failover behavior

The final implementation must contain an explicit invariant:

`paidUpgradeAllowed = false`

Conceptually, provider failure handling is:

- SoundCloud unavailable/restricted -> try approved YouTube fallback;
- Audius free quota unavailable -> disable Audius additions for the period; never purchase Unlimited automatically;
- YouTube unavailable -> show unavailable state;
- any provider policy/pricing change requiring payment -> provider disabled until a new zero-dollar decision is approved.

Career Mode Showdown remains fully usable with no media provider at all.

## 8. Proposal transition status

The media research is now transitioned from open investigation into the R8 proposal architecture:

- SoundCloud is the leading exact-song audio-only candidate;
- Audius is retained as a strong optional open-audio source;
- YouTube remains the hardened fallback and trailer provider;
- no paid path is approved;
- final SoundCloud adoption is gated by real full-length embed proof on iPhone Safari and Chromebook;
- final visual approval remains owner-gated with screenshots for ready, playing, loading, fallback and unavailable states.
