# JOB-25 · G-13 part 2b: Home, music and Loading

| Lane | Depends on | Code branch | PR into | Budget |
| --- | --- | --- | --- | --- |
| **codex** (Nik pastes the lead's box into the Codex app; the lead checks in a browser and merges) | job 24: start from branch `gameplay/job-24-v10-foundation` (PR #349) now; the PR goes into recovery and becomes clean once 24 merges | Codex's own branch | `gameplay/recovery-v1` | one Codex task |

Read `jobs/G13_PART2_COMMON.md` first, then job 24's PR body for the loader API (`js/v10Screens.js`).

## Screens

- Team V source (at `5e05a1f`): `home/` (`home.css`, `home.js`, `soundtrack.js`, referenced art) and `loading/`.
- App screens: `mainMenu` (Home) and `loadingScreen` (Loading).

## Build

- **Home** keeps every existing tile id and the click paths behind them (`#newShowdown` and its JOIN / NEW text from `js/onlinePlayerIdentity.js`, `#ruleBookButton`, `#settingsButton`, Continue Career, Statistics). Team V's tiles must call the same handlers. Daniel sees START A SHOWDOWN and Nik sees JOIN DANIEL'S SHOWDOWN, exactly as today.
- **Music.** Nik's decision (V2G-013): the Home music card plays his 4-song Audius playlist (`home/soundtrack.js`, track ids in `home/fixtures.json` `strings.media`). It replaces main's YouTube songs and the trailer.
  - Nothing is requested until Play is tapped.
  - Music keeps playing across screen changes, so move the `<audio>` element out of the Home screen into a long-lived lazy container.
  - Remove or hide the old YouTube player (`#menuMusicPlayer`, `#menuMusicStatus`, `#menuMusicToggle`, `#menuMusicMute`) only through lazy code. `index.html` stays unchanged.
  - Audius is the one new network host allowed. Add it wherever the app lists allowed hosts, if such a list exists. The browser journey's forbidden-host check must still pass, because the journey never taps Play.
- **Loading** uses Team V's wordmark and keeps the Marco Reus photo (`assets/marco-reus-2015-cc-by.webp`, already on the branch) with its CC BY 2.0 credit line and both links. The top bar is hidden here (`data-nav="none"`).
- Register each screen through `js/v10Screens.js`. Copy only files that the CSS or JS reference. Images use job 24's runtime cache rule.

## Tests

`tests/contracts/v10-home-contracts.cjs`: Home tiles keep their ids and handlers; the Daniel/Nik tile text; music makes no request before Play, keeps playing after `navigateTo` away, and the YouTube player is gone; the Loading credit text and links are present.

## Done

Everything in COMMON "Checks before DONE". Then set `State: DONE` in `status/JOB-25.md`, with the PR link and head SHA. The lead merges; you do not.
