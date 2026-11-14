# Career Mode Showdown 2.5.0 (r92): a clean working 3D quality system for phones (v2.5.0 runtime r92)

Application version: `v2.5.0`  
Runtime asset revision: `2.5.0-r92`  
Previous known-good runtime: `2.4.0-r91`

r92 is 2.5.0. It fixes the 3D quality system after Nik's iPhone 17 test on 14 November 2026: the Device check sent his
iPhone from High down to Light, and opening High could close the Safari tab. Nik asked for "a clean working quality
system", kept simple: the check only raises Auto, a phone memory limit that runs on every release, and lighter edge
smoothing on a phone. The rules of a Showdown did not change. This file is the release record. The list below is every
pull request merged into gameplay/r92 since 2.4.0 went live (main ac0a1338): #1458 to #1462, up to gameplay/r92 169aa69a.

## What changed

- **The Device check can only raise Auto** (#1458). Auto starts at the level the graphics chip starts at (High on an
  iPhone 17). The check moves Auto up when all three 3D screens stay smooth at a higher level. If the check does worse
  than the chip's level, Auto stays on the chip's level, and the page says so: "The check only ever raises Auto." One bad
  run can no longer push a phone down to Light. A device that saved a 2.4.0 result below its chip's level starts at the
  chip's level again.
- **The check is fair** (#1458). A screen counts as smooth when it averages 57 frames a second or more, no more than 2% of
  its frames are late (over 25 ms), and no single frame takes over 100 ms. A slow screen is played once more before it
  counts. If Light itself is not smooth, nothing is saved. The results table shows each screen's slowest frame, the second
  it came, and how many frames were late.
- **High no longer closes the tab on a phone** (#1458). A phone loads the phone 3D pictures at High and above (before, it
  loaded the computer pictures: about 427 MB for Chamber Men at High). The check frees each screen's memory before it
  opens the next.
- **Extra on a phone is a little less sharp** (#1458). At Extra a phone draws at most 2.25 times the screen instead of 3
  (the Special Player screen needed about 370 MB at 3 times and needs 263 MB now). A phone uses 4 edge smoothing samples
  at most, and the Special Player card is drawn at most twice its size on screen.
- **The level pictures are gone** (#1459, #1461). The level guide on the Device check page keeps its six rows in words,
  with the device's row marked. The 36 pictures were removed, as Nik chose. The Extra row reads "up to 3x sharpness on a
  sharp computer screen (2.25x on a phone)".
- **Phone memory limit, new, on every release** (#1458, `.github/workflows/phone-memory-budget.yml`). On every push to a
  release branch, a check opens Chamber Men, Russian Roulette and the Special Player on the iPhone 17 profile at High and
  Extra, at the sharpest picture each level may reach, and fails if any screen needs more than 300 MB of textures and
  buffers. A screen that does not load counts as a failure, not as 0 MB.
- **Story** (#1462): Volume 20, "The phone in the pocket" (chapters 188 and 189).
- **Rules baseline** (#1460): the reviewed Rules pin in the tests names production main ac0a1338 (test fixture only).

## Release time

r92 adds no time-gated feature. Every change applies the moment the update reaches a phone.

## Update safety

- The shell and service worker advance to 2.5.0-r92 in a fresh `career-mode-showdown-shell-2.5.0-r92` cache, and 2.4.0-r91
  is retained for rollback. r92 adds and removes no shell path: `js/gfxTier.js` was already precached, and the Device
  check pages were never in the shell. `SHELL_PATHS_ADDED_SINCE_PREVIOUS` and `SHELL_PATHS_REMOVED_SINCE_PREVIOUS` are
  empty, so the retained r91 shell is verified against its own 293 paths (`tests/fixtures/shell-paths/2.4.0-r91.json`,
  from main ac0a1338). 2.5.0's `SHELL_PATHS` holds 293 paths.
- No start-up file changed except the version strings. Startup budget: 33,998 bytes gzip against the 34,000 cap (the
  version strings are the same length as 2.4.0's).
- An installed phone takes the update on Home, never in the middle of a game screen.
- 2.4.0 and 2.5.0 phones can play each other: nothing that is sent between phones or saved in Firebase changed.

## Deploy order

- No Rules change in this release. The Pages workflow deploys the site after the last Rules deploy on main succeeded.

## What did not change

- No tiebreak anywhere. The Remote Joining protocol and pairing stay as they were.
- The no-flash rules and the Reus Gate are unchanged.
- Firebase remains Spark-only, billing remains OFF and App Check enforcement remains OFF.
- No saved Showdown is rewritten. Nothing in Firebase is deleted or edited.
- The Rule Book (js/ruleBook.js) is unchanged: no rule a player plays by changed, and it never names the Device check or
  the quality levels.

## Firestore Rules

- No change. The composed production Rules are identical to 2.4.0 (SHA-256
  `237f867bade1ad244c92d1b8ab041a588fabd9e68485f7ee47dded4de939f7ab`, 191,531 bytes). The reviewed main delta
  (`tests/fixtures/composed-production-rules/main-delta.json`) names main ac0a1338 with no lines of difference (#1460,
  with Nik's OK on 2026-11-14).

## Reads and writes

No game code that reads or writes Firebase changed, so a season costs the same billed reads and writes as 2.4.0 (see
RELEASE_V2.4.0_R91.md).

## Phone memory (Chromium, iPhone 17 profile, software drawing)

First release run on gameplay/r92 47c7cf9b
([43590758614](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/actions/runs/43590758614)): PASS.

| Screen | High | Extra |
|---|---|---|
| Chamber Men | 166 MB | 190 MB |
| Russian Roulette | 214 MB | 226 MB |
| Special Player | 241 MB | 263 MB |

A real iPhone keeps extra copies of pictures, so it uses more; the 300 MB limit leaves room for that. Only Nik's iPhone
can prove that High now opens and stays open. No frame-rate figure here comes from the build room, which draws in
software.

## Checks

- Showdown Gate on every PR above; Codex review handled on each.
- New contract `r92-device-check-iphone` (15 checks) fails on 2.4.0 and passes here.
- Look check of the Device check page at 1920x866, 1920x1035 and 393x852: no sideways scroll, nothing off screen.
- The version bump re-pins only release facts: the 2.5.0-r92 pins and v2.5.0 footer in index.html, the rollback target
  and its fixture, and the release record.

## SSJR status

SSJR-1.1 remains frozen at `0/100`. SSJR-2.1 is `100/100`, earned on r85 (`1.9.9-r85`) by the 2026-10-29 two-device production
run. No SSJR credit comes from this source, CI or deployment, and no new physical acceptance is claimed for 2.5.0.
