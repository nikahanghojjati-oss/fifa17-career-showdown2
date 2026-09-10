# R8 Native Soundtrack Rights Ledger — 2026-09-10

Status: PROTOTYPE CANDIDATES VERIFIED — OWNER AESTHETIC APPROVAL OPEN — PRODUCTION PLAYLIST NOT FINAL

Purpose: provide a zero-dollar, browser-native soundtrack lane without extracting commercial YouTube audio, requiring a subscription, or assuming that a provider-wide label grants reuse rights.

This ledger is deliberately per-track. A source is not admitted merely because a site calls itself free.

## Acceptance classes

- `PROTOTYPE-ACCEPTED`: rights evidence is strong enough for an isolated R8 playback proof. This does not mean the owner has approved the track musically.
- `PRODUCTION-CANDIDATE`: may be packaged/streamed in the eventual product after final file/hash verification and owner taste approval.
- `HOLD`: do not package as canonical audio until the listed rights or distribution question is resolved.
- `REJECTED-FOR-NATIVE`: not suitable for the native lane under the zero-dollar/no-extraction rules.

## Candidate 01 — Synth Pop with 4 on the Floor

Stable ID: `M01_SYNTH_POP_4_FLOOR_CC0`

- title: `Synth pop with 4 on the floor`
- author/uploader: Mesostic
- source page: https://commons.wikimedia.org/wiki/File:Synth_pop_with_4_on_the_floor.ogg
- source statement: Own work
- source date: 2017-08-15
- duration: 3:18
- original format: Ogg Vorbis
- original size reported by Commons: 5.82 MB
- MP3 transcode: Commons reports a completed MP3 transcode; the functional proof uses the Commons transcode URL
- license: Creative Commons CC0 1.0 Universal Public Domain Dedication
- self-published evidence: yes; Commons categorizes the file as self-published
- rights text: Commons states the copyright holder published the work under CC0 and permits copying, modification, distribution and performance, including commercial use
- prototype status: `PROTOTYPE-ACCEPTED`
- production status: `PRODUCTION-CANDIDATE`
- owner music/taste status: `OPEN`
- final packaged-file SHA-256: `OPEN` until a binary is deliberately packaged
- notes: strongest current first candidate because it is a complete electronic/synth-pop track, self-published, CC0, and has an MP3 transcode suitable for broad browser playback.

## Candidate 02 — GameBGM

Stable ID: `M02_GAME_BGM_CC0`

- title: `GameBGM`
- author/uploader: Yuyuyunoyuusuke1
- source page: https://commons.wikimedia.org/wiki/File:GameBGM.ogg
- source statement: Own work
- source date: 2024-09-22
- duration: approximately 3:57 / 237.2 seconds
- original format: Ogg Vorbis
- original size reported by Commons: 3,997,545 bytes / approximately 3.81 MB
- Commons source checksum: SHA-1 `80c5164ae22dcff0714d9b55ae4ab259e37a4bcc`
- MP3 transcode: Commons reports a completed MP3 transcode
- license: Creative Commons CC0 1.0 Universal Public Domain Dedication
- self-published evidence: yes; Commons records original creation by uploader and self-published work
- rights text: Commons states the copyright holder published the work under CC0 and permits copying, modification, distribution and performance, including commercial use
- prototype status: `PROTOTYPE-ACCEPTED`
- production status: `PRODUCTION-CANDIDATE`
- owner music/taste status: `OPEN`
- final packaged-file SHA-256: `OPEN` until a binary is deliberately packaged
- notes: useful second candidate for proving queue switching and native event authority. The isolated proof uses the original Ogg source and fails visibly rather than lying about playback if a browser reports no Ogg Vorbis support. A final product package should prefer a verified broadly compatible derivative and record its exact SHA-256.

## Candidate investigated but not admitted — Pixabay library

Status: `HOLD` for repo-native packaging.

Pixabay contains many attractive free sports/electronic tracks and its Content License permits broad free use and modification. Its license summary also restricts selling or distributing content on a standalone basis. Because this project is a public GitHub site and a packaged audio file could be independently downloadable from the repository, R8 will not treat a Pixabay track as an automatic repo-native asset without a more specific rights/distribution determination for that use.

This is a caution decision, not a claim that all Pixabay web use is prohibited.

Reference: https://pixabay.com/service/license-summary/

## Exact FIFA 17 commercial soundtrack

Status: `REJECTED-FOR-NATIVE` unless a future rights source explicitly authorizes native streaming/packaging.

The production menu currently points to commercial recordings through YouTube. Presence on YouTube does not grant this project permission to download, extract, re-host or package their audio.

Therefore tracks such as `ARE WE READY? (WRECK)`, `SEND THEM OFF!`, `YOUTH`, `SHELTER`, `MOVE`, and `HIGH AND LOW` remain eligible only for the separate compliant provider mode under the current evidence.

No commercial FIFA 17 recording is approved for the native queue.

## Functional proof mapping

Prototype:

`prototypes/26-native-music-player-functional-reference.html`

The proof contains exactly the two `PROTOTYPE-ACCEPTED` candidates above. It deliberately:

- creates no provider account dependency;
- assigns no media source on initial page load;
- assigns only the selected track after explicit Play intent;
- derives visible state from the native audio element's actual events;
- exposes loading, playing, buffering, paused, ended and error states;
- keeps an unsupported/error condition local to the player;
- never places FIFA 17 commercial recordings inside `<audio>`;
- never attempts ad suppression, audio extraction or hidden YouTube playback.

## Before any native track becomes final

For each final accepted track, record all of the following:

1. source page and direct source file URL;
2. author/uploader and source statement;
3. exact license and evidence date;
4. downloaded/package filename;
5. container format and codec;
6. exact byte size;
7. SHA-256 of the packaged file;
8. any required attribution text;
9. responsive/performance decision (`preload="none"` or measured alternative);
10. explicit owner music/taste approval.

Until those fields are closed, the native soundtrack is a technically and legally feasible proposal lane, not a final playlist.