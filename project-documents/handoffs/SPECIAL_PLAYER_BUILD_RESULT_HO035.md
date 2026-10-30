# Special Player reveal ("Big Jump"): approved build (Team V, HO-035)

Nik approved this screen on 28 Oct 2026. It is the same code as the preview, Big Jump v19 (https://claude.ai/artifact/BenU2ZNEt7mzQz557F4ed5).
Here it is in game view by default: the Daniel / Continue / Nik bar sits at the bottom, with no preview controls. Add `?tools=1` to get the preview tools back for checks.

## What it does

The pack walkout runs in this order:

1. The pack lands.
2. It charges and cracks, then the comet flies.
3. The burst and the crowd.
4. The clues arrive one at a time: position, then the nation flag (roof flags drop), then the club coin.
5. The card flips to its face, with a flash and the light sweep.
6. The card settles. After the face it flips to the **scouting card** (`data/scoutingCards.js`), holds for 3.4 s, then flips back.
7. The second manager's reveal starts.

- **Tiers by rank:**
  - black-blue-gold: ranks 1–3
  - blue-gold: ranks 4–10
  - gold: ranks 11–20
  - silver: ranks 21–50
  - bronze: ranks 51–300
- **Player list:** the inline `MP_LIST` equals Team G's `data/marqueePlayers.js` on gameplay/r86 (b9e4e8f7), the FIFA 17 launch top 300 (305 with ties).
- **Flags and crests:** flags are drawn in code for all 46 nations. Crests are the r85 code crests plus the 15 HO-038 crests.
- **Sound:** synthesized with Web Audio, no files. It is off until the player turns it on.
- **Reduced motion:** with reduced motion, the beats are shortened and the flips are skipped.

## Files

- `index.html` is the whole screen. It uses three.js r128 from cdnjs and Google Fonts (Barlow Condensed, Big Shoulders Display).
- `assets/*.jpg` hold the card art, pack, stadium, stands, grass and board, about 8.4 MB.
  - Load this screen lazily, only when the reveal starts. Nothing here belongs in the main bundle.

## Wiring for Team G (skin only, no rule changes)

- **Picks:** set the pair with `window.__pick(danielIndex, nikIndex)`, using indexes into `MP_LIST`, which is in rank order. Or open the page with `?d=<index>&n=<index>`.
- **Continue button:** `#cta` ("Continue to Career Start") is enabled when both reveals are done. Replace the preview toast handler with the real navigation.
- **Test clock:** `window.__mq.player(i)` / `advance(sec)` is a deterministic clock for tests and captures. Keep it, or strip it in production.
- **Rules kept:** no dimming layers, nothing covers the bar or buttons, no EA logos, no real crests traced, no real faces.
