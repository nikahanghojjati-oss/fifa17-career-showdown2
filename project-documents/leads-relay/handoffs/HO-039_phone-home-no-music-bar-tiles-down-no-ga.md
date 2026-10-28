# HO-039 · Team V → Team G · Phone Home: no music bar, tiles down, no gap above the bottom bar (PR #1033)

```ticket
{
 "id": "HO-039",
 "from": "V",
 "to": "G",
 "title": "Phone Home: no music bar, tiles down, no gap above the bottom bar (PR #1033)",
 "kind": "build",
 "priority": "top",
 "worker": "",
 "parent": null,
 "job": null,
 "status": "SENT",
 "steps": [],
 "evidence": [],
 "log": [{"at": "2026-10-28T22:26:04Z", "by": "V", "status": "SENT", "note": ""}]
}
```

# Phone Home: music bar removed, tiles moved down, gap above the bottom bar closed (PR #1033)

**Nik (28 Oct 2026, 5:52 p.m. Eastern, iPhone Safari screenshot):** "There should not more than enough for not clipping and touching between trophy room, rule book and setting and bottom bar, all relevant tile and other elements should be moved downward we also removing the music player bar from home-screen and on home players can access to music whiten music tab in bottom bar. The gap that i highlighted in red shouldn't exist."
**Nik (6:07 p.m.):** "You can remove music bar from phone sideways and any other screen that still has the old player."
**Nik (6:18 p.m.):** "Once finish give it to team g lead to merge."

## What to do
1. Merge PR #1033 (https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/1033), branch `claude/project-thread-mdbg45` @ dd064cdf, opened against `main` from main 076177e2. All 8 checks green (L1-L6, seal). Retarget to your release branch (gameplay/r86) if that is how r86 ships; the diff is two files and should apply cleanly.
2. Nik asked for the Claude automatic review to be removed. It is still active: `.github/workflows/claude-review.yml` on main (state "active" in Actions). It failed on #1033 with "Credit balance is too low". Please delete or disable that workflow in the same release (Nik's ask, your file).

## The change
- `css/homeV10.css` (two new blocks at the end, CSS only):
  - Phone upright (max-width 760, portrait): the `.menuMusicTile` strip is hidden the way desktop already hides it (r85: stays in the DOM, `visibility:hidden`, out of flow). The music grid row is removed, so Continue and the six tiles move down; the settings row ends 8px above the bar at 360x640, 375x553, 393x660, 393x852, 430x932. Tile sizes unchanged.
  - Phone sideways (max-width 900, max-height 480, landscape): same hide; its room goes to the two tile rows.
  - Both: Home height `100dvh` (with `100svh` fallback) instead of `100svh`. On iPhone Safari's floating toolbar, svh is shorter than the box the fixed bottom bar sits in, which made the empty band Nik marked red.
  - Tablets and desktop already hid the strip; no other screen has the old player (all use the MUSIC tab / top-bar dock).
- `tests/browser/home-visual-audit.cjs`: the landscape check used to require the strip to show; it now requires it hidden (Nik's new rule). New upright check: strip hidden and last tile row ends 4-16px above the bar.

## Done when
PR merged into the r86 release, Claude Review workflow gone, and Nik checks phone Home on his iPhone (no music bar, no gap, upright and sideways).

Pictures: https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/factory/v1-wtt5ye/project-documents/factory/reviews/HOME-PHONE-R86/HOME_PHONE_BEFORE_AFTER_393x660.jpg and https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/factory/v1-wtt5ye/project-documents/factory/reviews/HOME-PHONE-R86/HOME_SIDEWAYS_BEFORE_AFTER_844x390.jpg
