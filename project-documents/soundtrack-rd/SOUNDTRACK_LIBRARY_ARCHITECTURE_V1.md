# Soundtrack Library Architecture V1

Status: R&D ACTIVE
Owner: Nik
Worker: GPT-5.6 Sol · Soundtrack R&D
Branch: r-and-d/persian-soundtrack-lab
Date: 2026-10-06

## Decision

Recommend a maximum of seven visible soundtrack tabs, each showing up to ten songs.

The library should use one canonical track registry plus tab membership by track key. A song may appear in more than one tab without duplicating its Audius metadata.

This means seven tabs do not require seventy unique songs. The likely mature catalog is about 40–55 unique verified tracks, with the strongest tracks reused in FEATURED / SHOWDOWN.

## Why seven is the upper sweet spot

The current Home player already supports eleven Audius choices in a scrollable sheet. On phone, choices are laid out two per row. Ten songs therefore make a clean five-row tab.

Seven tabs are still understandable if the tab rail scrolls horizontally. More than seven begins to feel like a streaming service rather than a FIFA-style game soundtrack selector.

The current audio engine is also favorable to a larger catalog: it creates one persistent audio element, sets preload=none, and does not request a stream until the player presses Play or advances to a track. A larger metadata catalog therefore does not mean dozens of simultaneous Audius streams.

## Recommended tabs

### 1. SHOWDOWN
Purpose: default signature mix for Career Mode Showdown.

Up to ten strongest songs across the entire library. This is not a separate inventory; it references tracks that also belong to artist or genre tabs.

Target mood arc:
1. stylish menu opener
2. confident football-business track
3. rivalry track
4. transfer-war track
5. celebration track
6. darker tension track
7. comeback track
8. relaxed browsing track
9. international change-of-pace
10. closing / replay-safe track

Initial anchor: Behzad Leito / Sijal and collaborators — Business.

### 2. ZEDBAZI
Purpose: a dedicated Zedbazi lane because the group fits the rivalry/social/swagger side of the game particularly well.

Target: ten Audius-verified tracks.

Already surfaced in current research:
- Nakoni Bavar ft. Behzad Leito
- Mahdekoodak
- Cigare Soorati
- Khodesh Midoone Khoobe
- Chera Badi ft. Hichkas
- Tabestoon Kootahe (separate uploader; provenance weaker)

Launch rule: at least eight of ten final entries should have strong Audius durability evidence. Prefer tracks tied to the Zedbazi Audius profile over fan reuploads.

### 3. SHAYEA
Purpose: harder, more modern Persian rap energy.

Target: ten tracks, but this tab is not yet production-qualified.

Current verified research anchor:
- Asabani

If ten durable Audius candidates cannot be found, do not pad the tab with weak or unrelated uploads. Merge Shayea into PERSIAN RAP and keep a smaller featured artist section instead.

### 4. GDAAL + FRIENDS
Purpose: Gdaal, collaborations, party/club energy, and closely connected Persian hip-hop tracks.

Working interpretation: the owner's spoken "G.Dot" reference is being treated as Gdaal because Gdaal is the artist already present in this R&D shortlist. If a different G.Dot was intended, revise before production.

Current Audius evidence:
- Hala Na ft. Erfan, Sami Beigi, Madgal
- Dideh o Del ft. Imanemun
- Abrhaaye Noghrei Vol.2 is present as an Audius album

This is intentionally "Gdaal + Friends" rather than promising ten solo Gdaal tracks before the catalog is fully verified.

### 5. PERSIAN LEGENDS
Purpose: breadth and historical weight; harder and more cinematic Persian rap outside the dedicated artist tabs.

Candidate pool:
- Hichkas
- Reza Pishro
- Ho3ein
- Ali Sorena
- Bahram
- Yas
- Sadegh
- Behzad Leito / Sijal / Khalse when not better placed elsewhere

Research anchors already found:
- Ho3ein ft. Sadegh — Shaba
- Reza Pishro ft. Ho3ein — Miri Tu Lak
- Reza Pishro — Batel Shod
- Hichkas — Bezan / Khalafkaraye Asli remixes where provider provenance is acceptable
- Ali Sorena — Bezan Haroomi remix where provider provenance is acceptable

### 6. ENGLISH RAP
Purpose: international hip-hop lane for contrast without breaking the competitive tone.

Selection rule: choose Audius-native or clearly streamable tracks that feel like FIFA menu music, not simply the ten biggest rap records.

Desired range:
- confident / stylish
- playful
- high-energy
- one darker rivalry track
- one relaxed track
- no ten-song wall of maximum aggression

### 7. FIFA ALT
Purpose: rock, alternative, indie, electronic and crossover songs that preserve the classic FIFA soundtrack character.

Existing live-game anchors worth retaining or comparing:
- Mike Shinoda — Uproar
- Weezer — Tell Me What You Want
- RAC ft. Emerson Leif — Next To You
- Porter Robinson & Madeon — Shelter (Effugio Remix)
- grouptherapy. — Nasty
- Hadji Gaviota — Snow Globe
- Speelburg — Everything I Know

This tab gives the soundtrack breathing room and keeps Career Mode Showdown from becoming a pure rap jukebox.

## Catalog model

Recommended future shape:

- tracks: one canonical record per Audius track
  - key
  - title
  - artist
  - audiusTrackId
  - audiusUrl
  - uploader
  - officialOrReupload
  - availabilityVerifiedAt
  - streamVerifiedAt
  - durabilityGrade
  - fitScore
  - notes

- tabs: ordered tab definitions containing track keys
  - id
  - label
  - maxTracks = 10
  - trackKeys

A track may be in SHOWDOWN plus one artist/genre tab.

## Durability grades

A: official/credible artist profile, live track, API stream verified.
B: credible uploader or established remix profile, live track, API stream verified.
C: fan/reupload source, live now but disappearance risk is materially higher.
Reject: missing, gated in an incompatible way, API-restricted, duplicate/uncertain identity, or unreliable provenance.

SHOWDOWN should strongly prefer A/B tracks. C tracks can remain R&D candidates but should not silently become the signature soundtrack.

## Playback behavior recommendation

- Switching tabs should not stop the song currently playing.
- Selecting a new song changes playback only when the user chooses it.
- Next should advance inside the active tab.
- If the currently playing song is not in the newly selected tab, keep playing it until Next or a new selection.
- One persistent audio element remains authoritative.
- No preloading of every tab.
- Offline behavior remains the existing disabled-player behavior.
- Preserve the existing user-tap requirement for starting audio on iPhone and other browsers.

## UI recommendation

Desktop:
- soundtrack button opens a compact music panel
- horizontal tab rail
- active tab shows up to ten songs in two columns where space permits

Phone:
- existing TRACKS sheet remains the entry point
- horizontally scrollable tab chips at top
- active tab only is rendered as the ten-song, five-row list
- CLOSE remains fixed/obvious
- no nested vertical scroll regions beyond the existing sheet

Team V should own any final visual treatment. Team G should own production wiring/integration.

## Launch gate for an artist tab

An artist-specific tab is allowed only when:
1. at least eight strong candidates exist and ten can be filled without obvious padding;
2. all launch tracks are currently present on Audius;
3. every launch track has an exact Audius id;
4. API streaming has been tested;
5. uploader/provenance is recorded;
6. duplicate versions are resolved;
7. the tab has a coherent mood role in the game.

If an artist fails this gate, fold the strongest tracks into PERSIAN LEGENDS or SHOWDOWN.

## Current recommendation

Build toward seven tabs in R&D, but do not promise that all three proposed Persian artist tabs will ship independently.

Zedbazi currently looks strongest for a dedicated artist tab.
Gdaal is better treated as GDAAL + FRIENDS until the album catalog is fully enumerated and stream-verified.
Shayea remains a desired dedicated tab, conditional on finding enough durable Audius entries.

No production code change is authorized by this document.
