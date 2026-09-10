# Media Provider Zero-Dollar Decision — 2026-09-10

Status: ACTIVE PROPOSAL AUTHORITY — AUDIUS-FIRST AUDIO / OWNER TRACK TASTE + DEVICE PROOF OPEN

This decision supersedes the earlier SoundCloud-first music hierarchy. The owner has clarified that smooth audio-only playback, replayability, reliability and permanent zero-dollar operation matter more than preserving every current FIFA 17 song. The exact FIFA 17 songs remain desirable where a clean audio-only provider can supply them, but the proposal must not keep a worse player merely to preserve the old catalogue.

Current live-main reconciliation anchor: `97c28b1efea6ee6e901e6076a834ec419cbad5aa` (`1.9.1-r14`, Journey Reconnect). Production music still uses the older YouTube iframe integration and is not modified by this visual branch.

## 1. What the Audius limits actually mean

Audius documents its Free API plan as:

- 10 API requests per second;
- 500,000 API requests per month;
- `No Restrictions. Always Free.` / `The Free plan is always free with no restrictions.`

These are request quotas, not a statement that one song play equals one request. A player can make metadata/search requests plus a stream request, and browser streaming may involve byte-range traffic. The correct engineering rule is therefore not to translate 500,000 directly into 500,000 song plays.

For this project, that distinction is practically harmless: expected usage is tiny relative to the published ceiling. The player should cache its small curated queue metadata, avoid repeated discovery calls, request only the selected track and never poll Audius unnecessarily.

Official references reviewed:

- https://api.audius.co/plans
- https://docs.audius.co/sdk/
- https://api.audius.co/v1
- https://docs.audius.co/learn/architecture/content-node/
- https://docs.audius.co/learn/architecture/discovery-node/
- https://audius.org/open-music-license.pdf

Important financial boundary: the proposal does not assume commercial terms can never change. It assumes only the currently documented free plan. If Audius ever requires payment, a card, overage billing or a paid upgrade for this use, Audius is disabled until a new zero-dollar path is approved. No automatic upgrade is permitted.

## 2. Why Audius is now the primary music provider

Decision: PRIORITIZE AUDIUS FOR THE FINAL AUDIO-ONLY PLAYER, SUBJECT TO DEVICE PROOF AND OWNER TRACK APPROVAL.

Audius is a better architectural match than SoundCloud for the owner's final music-player goal because:

- it is natively an audio catalogue rather than a video provider;
- the API is explicitly intended for apps that query and stream tracks;
- the current API exposes `GET /tracks/{track_id}/stream` as a streamable MP3 endpoint and supports HTTP Range requests;
- most read-only API endpoints are documented as working without credentials, while a Free API key provides the published higher quota;
- Audius documents its frontend API key as safe to include client-side; a bearer token is not required for the read-only player design;
- the player can use one normal HTML `<audio>` element as playback authority, giving R8 full control of compact player UI without an embedded video or large provider widget;
- public, non-gated tracks can be streamed without requiring the listener to sign into Audius;
- Audius content/discovery infrastructure is distributed across nodes and its content-node design explicitly targets replicated content availability;
- the Audius Open Music License grants Music Players broad streaming/use rights for covered material, while alternative per-track licenses and creator restrictions still have to be respected.

This gives the desired interaction model: click Play, one selected audio source loads, and the site's PLAYING state comes from the browser media element's actual `playing` event.

## 3. Audius request-budget policy

The player should behave as though quota is precious even though expected usage is extremely low.

Recommended request discipline:

1. ship a small curated track manifest with Audius track IDs and display metadata;
2. do not call search/trending on every Home visit;
3. use discovery only for deliberate playlist curation/refresh, not ordinary playback;
4. request the stream only for the selected track after user intent;
5. keep one `<audio>` element and reuse it for the queue;
6. do not create multiple simultaneous stream requests;
7. cache non-sensitive metadata locally where appropriate;
8. retry with bounded backoff, never a request storm;
9. if a provider quota/error occurs, stop retrying and keep Career Mode usable.

At the owner's stated usage level, the published 500,000-request monthly allowance is many orders of magnitude above the expected workload. The proposal nevertheless treats 500,000 as a hard free ceiling, not as permission to move to Unlimited.

## 4. Audius catalogue decision

Targeted discovery has not established dependable official Audius copies of all six current FIFA 17 commercial recordings. Searches surfaced unrelated tracks and remixes, including unofficial Shelter variants, rather than a trustworthy exact six-song set.

That is no longer a blocker because the owner explicitly permits a revised track list when doing so produces a substantially better player.

The final Audius queue should therefore be curated for the FIFA 17 / Career Mode Showdown feeling rather than pretending it contains the original FIFA 17 soundtrack. Candidate discovery should favor:

- upbeat electronic;
- indie/electronic pop;
- dance/house energy;
- bright, competitive matchday pacing;
- full tracks with public streamability;
- creator/provider metadata sufficient for required attribution and rights review.

Candidate examples found during discovery include Audius tracks tagged Electronic/Upbeat or Alternative/Upbeat. These are listening candidates only; no candidate becomes final until the owner hears/approves it and the track's current streamability/license metadata is checked.

The UI should label this catalogue `SHOWDOWN RADIO`, not `FIFA 17 SOUNDTRACK`.

## 5. SoundCloud's new role

Decision: SECONDARY EXACT-SONG OPTION, NOT PRIMARY PLAYER AUTHORITY.

All six existing songs have public SoundCloud candidate pages under artist-branded profiles. SoundCloud's HTML5 Widget API has real READY/PLAY/PAUSE/FINISH/ERROR/progress events and can provide an audio-first experience.

However, SoundCloud documents per-track access restrictions. Tracks can be fully playable, preview-only or blocked, and SoundCloud Go catalogue embeds may expose only a short preview. The user has said a 30-second version is acceptable as a secondary option, but it should not displace a smoother full Audius queue.

Therefore:

- SoundCloud can appear as an optional `FIFA 17 PICKS` section for exact existing songs that embed cleanly;
- full SoundCloud tracks are preferred over previews;
- a clearly labelled preview is acceptable when that is all the provider legally exposes;
- never present a preview as a full track;
- failure of any SoundCloud item never affects Audius Showdown Radio or Career Mode.

Official references:

- https://developers.soundcloud.com/docs/api/html5-widget
- https://developers.soundcloud.com/docs
- https://help.soundcloud.com/hc/en-us/articles/115003448167-Embedding-a-SoundCloud-Go-Track

## 6. YouTube's new role

Decision: REMOVE YOUTUBE AS A MUSIC FALLBACK FROM THE FINAL AUDIO-ONLY MUSIC PLAYER.

The owner does not want video merely to hear music, and YouTube's policies do not permit the proposal to hide the video and expose only extracted/isolated audio. Therefore retaining YouTube for songs would undermine the audio-only design goal.

YouTube remains only where video is intentional, specifically the existing FIFA 17 gameplay trailer if that trailer remains in the final Home design.

If the trailer remains, its integration must still be hardened around the official IFrame Player API rather than the current optimistic `menuMediaPlaying` boolean. Use real `onReady`, `onStateChange`, `onAutoplayBlocked` and `onError` signals. Do not suppress or work around provider ads.

## 7. Final provider hierarchy

### Primary music

`SHOWDOWN RADIO — AUDIUS`

- custom compact R8 player;
- one HTML `<audio>` authority;
- curated Audius queue;
- no autoplay on startup;
- no listener login;
- no video;
- no paid tier;
- no automatic overage/upgrade;
- actual media events own READY / PLAYING / PAUSED / BUFFERING / ENDED / ERROR state.

### Optional nostalgia catalogue

`FIFA 17 PICKS — SOUNDCLOUD`

- exact current soundtrack candidates when available;
- full track where provider exposes full playback;
- clearly marked preview where only preview is available;
- one reusable SoundCloud widget;
- provider attribution preserved.

### Video

`FIFA 17 GAMEPLAY TRAILER — YOUTUBE`

- video intentionally visible;
- lazy loaded;
- official provider lifecycle;
- separate from the music player.

## 8. Smoothness / reliability acceptance contract

Audius cannot be declared final merely from documentation. Before owner approval, the actual implementation/reference must prove on iPhone Safari and Chromebook:

- first enabled Play starts without a Play/Pause/Play recovery ritual;
- HTML audio reports `playing` before the UI says PLAYING;
- Pause/resume is confirmed by media events;
- Previous/Next changes tracks without stale state;
- seeking works for the chosen stream path;
- volume/mute behaves correctly where browser platform allows;
- a dropped/failed request becomes a local media error, not an app failure;
- a retry is bounded;
- changing pages does not accidentally create two simultaneous players;
- returning Home restores UI coherently without forced autoplay;
- a provider outage leaves all Career Mode actions usable.

SoundCloud candidate states need separate proof only if the optional FIFA 17 Picks panel is retained.

## 9. Player functionality to expose in owner review

The final screenshot/demo package must state plainly:

- provider: Audius for Showdown Radio;
- playback engine: browser HTML audio;
- playlist source: curated public Audius tracks;
- free-plan basis at review time: 10 requests/second, 500,000 requests/month, documented Always Free;
- no Premium listener account;
- no music video;
- no autoplay;
- Play/Pause;
- Previous/Next;
- seek/progress;
- mute/volume where platform-supported;
- queue selection;
- current title/artist;
- provider/source attribution;
- loading/buffering/error/offline feedback;
- zero-dollar fail-closed behavior.

The owner should be able to try the functional prototype before final approval. Track taste approval and UI screenshot approval remain separate owner gates.

## 10. Permanent zero-dollar invariant

Conceptual lock:

`paidUpgradeAllowed = false`

Allowed:

- Audius Free/read-only streaming path;
- SoundCloud standard embed/widget path when free;
- browser-native media APIs;
- provider-hosted public streams permitted by provider/track rights.

Forbidden:

- a payment card as a required project dependency;
- paid API tiers;
- listener Premium subscription as the main route;
- automatic overage or paid fallback;
- ripping/self-hosting commercial songs without rights;
- hiding a YouTube video to simulate audio-only playback.

If every music provider is unavailable, music becomes unavailable and the game continues normally.

## 11. Current media status

Media architecture research is now sufficiently bounded and must not consume the rest of R8.

Current direction:

`AUDIUS SHOWDOWN RADIO FIRST` -> optional `SOUNDCLOUD FIFA 17 PICKS` -> YouTube trailer only.

Remaining media tasks are implementation proof, curated-track taste selection, responsive composition and final screenshots. The visual track now returns to the complete product proposal and r14 Journey Reconnect reconciliation in parallel rather than continuing broad provider research.
