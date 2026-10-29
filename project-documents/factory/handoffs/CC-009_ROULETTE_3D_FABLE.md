# CC-009 · Russian Roster Roulette: real 3D screen (HO-040, r87)

MODEL: Fable 5.1 · EFFORT: High · SURFACE: Claude Code cloud session (claude.ai/code)
STOP_BUDGET: $35 / 75 min. At 80% ($28) stop adding scope, commit, write BUILD_RESULT.md. At 100% stop.
REPO: nikahanghojjati-oss/fifa17-career-showdown2
START FROM: branch `claude/project-thread-6rq94x`. Commit and push to the branch your session is given; name it in BUILD_RESULT.md.
WRITE ONLY IN: `visual-assets/v10_1/roulette/` (new). Never touch main, gameplay branches or other screens.

## Goal
Nik (owner) wants a **real 3D screen like the approved Special Player screen** (`visual-assets/v10_1/special-player/index.html` on `origin/factory/v1-wtt5ye`, three.js r128 from cdnjs, one HTML file + assets). Quality bar: 10 out of 10. His words: "a Red Dead Redemption game scene ... cafe or cowboy restaurant (NOT a saloon) ... a guy is sitting ... we spin the gun and it just shoots ... me and Daniel are holding two boards". He rated the shooter and the gun in his hand 3/10 in the flat sketch; **the shooter, the gun and the shot are the heart of this job.**

Read first (in this order, nothing else needed):
1. `project-documents/factory/r87/ROULETTE_PLAN.md` (look, layout numbers, hybrid 3D decision)
2. `project-documents/factory/r87/NIK_REF_*.jpg|png` (4 room references: lamplit carved wood, gold ornaments, rows of glass lamps, balcony, green-felt round table; look only)
3. `visual-assets/v10_1/special-player/index.html` (reuse its HUD CSS, fonts, test clock `window.__mq`, `?tools=1`, Web Audio pattern)
4. Squads: `git show origin/research/r87-squads:gameplay/r87/squads/SQUADS_LAUNCH_170002.json` (FIFA 17 launch XI + 4 subs, 98 clubs: pos, name, number, rating)
5. FIFA 17 squad screen look: `gameplay/r87/reference/fifa17-squad-screen-*.png` on that same branch.

## Hybrid 3D (Nik's decision, do not change)
Real 3D in three.js: room shell, round table with green felt + wooden rim, brass oil lantern (flickering point light), cups/coffee pot/cards, **the revolver with a seven-chamber cylinder**, the two boards, all lights, smoke, flash, bullet, camera moves. People are **picture layers** (camera-facing planes at real depth), because Nik's and Daniel's faces must stay exact. Never model or distort their faces.

Picture layers are being made by Nik in ChatGPT now (tickets 1851-5..8). Build with fallbacks and an asset contract so each picture drops in with no code change:
| file in `roulette/assets/` | ticket | until it exists |
| --- | --- | --- |
| `RR_ROOM.jpg` (16:9, empty room) | 1851-5 | build the room fully in 3D (fallback must look good on its own) |
| `RR_DEALER.png` (alpha; seated, right arm out, revolver in hand aiming image-right) | 1851-6 | see "The shooter" |
| `RR_DANIEL.png`, `RR_NIK.png` (alpha; holding board, green inside) | 1851-7/8 | anchors `visual-assets/v10_1/tr2/slice-01/assets/src/POSE_TRANSFER_{DANIEL_FOCUSED,NIK_TACTICAL}_V1.png` (factory/v1-wtt5ye) behind 3D boards |
| `RR_FLASH.png`, `RR_CYLINDER.png` | 1851-4/3 | procedural flash sprite; 3D cylinder |
Put the muzzle point, hand point and board quads for each layer in `roulette/platemap.json` so swapping is a number edit.

## The shooter (most important)
- The dealer is an original older cowboy (never Arthur Morgan / John Marston) seated across the table, facing camera.
- **The revolver is a detailed real 3D model in his hand** (1873 single-action style: octagonal barrel, ejector rod, frame, fluted 7-chamber cylinder that really rotates on its axis, hammer that cocks, trigger, trigger guard, wooden grip). PBR steel (blued, worn edges) with a PMREM env map from the room so it reflects the lamps.
- Until RR_DEALER.png exists, keep him convincing without a picture: dark-lit, hat brim shading the eyes, built from smooth 3D forms (coat, hat, shoulders, arm + gloved hand wrapped round the grip) and lit like the room; the gun and gloved hand are the sharp hero in the light. No primitive "robot" look; if a form can't look good, hide it in shadow or the frame edge. When the picture arrives, the 3D gun is hidden in wide shots and only used for the close-ups.
- **Sequence per turn** (Daniel first, then Nik; 1 bullet in 7 chambers, seeded random; `?fire=1` forces a shot, `?fire=0` forces empty):
  1. Idle: slow camera drift, lantern flicker, dust in light beams. Button SPIN THE CYLINDER.
  2. Close-up: the cylinder swings out, one brass round slides in (first turn only), the cylinder snaps shut and is spun by the gloved hand: fast spin with real ratchet clicks, slows, settles on a chamber.
  3. The hand raises the gun, thumb cocks the hammer, the gun aims at the current manager's **board** (never a face or body; aim at the target bubble on the board). 0.8 s tension: camera push-in, lantern sound, heartbeat.
  4a. Empty: hammer falls, dry CLICK, small dust puff. Result line "CLICK. DANIEL IS SAFE." (or NIK).
  4b. Shot: hammer falls, muzzle flash (additive sprite + 1-frame point light that lights the whole room), recoil kick of the gun and arm, smoke puff that lingers and drifts, a hot bullet tracer (fast, 0.12 s) to one random player bubble of the 15 on that manager's board, splinters/paper bits fly, the board jolts in his hands, a burnt hole decal stays on that bubble, the bubble turns red with RELEASED. Camera shake. Result line "BANG! <PLAYER NAME> IS RELEASED." Not gory, nobody is hurt.
- Sound in Web Audio, off until the player turns it on (same as Special Player).

## Boards (FIFA 17 squad screen look, from data)
Wooden frame with brass corners. Inside: green pitch with white lines and the starting XI placed by position (GK bottom, attackers top), each a shirt in club colours + rating + short name like the FIFA 17 squad screen; under it one row of 4 subs. Draw on a CanvasTexture at 2x (crisp names). Preview: Daniel = Manchester United, Nik = Real Madrid; `?d=<club>&n=<club>` picks any club from the JSON. Expose `window.__rr.setBoards(danielClub, nikClub)` and `window.__rr.play({fire:true|false})` for Team G.

## HUD (HTML over the canvas, reuse Special Player CSS)
Desktop: top bar CM17 + HOME, CAREER (active), STANDINGS, STATS, RULES + chips DANIEL, SEASON 1 / 1 + gear; title "CAREER MODE SHOWDOWN 17" small + "Russian Roster Roulette" (gold, engraved Western feel); one result line; gold SPIN THE CYLINDER button; bottom panel 01 DANIEL + state / 02 NIK + state. Phone (<=900 px, upright): chips top-left, gear top-right, title, scene, result line, button, bottom tabs HOME CAREER STANDINGS STATS RULES. Camera/FOV re-framed for portrait so both boards are readable.

## Hard rules
- Daniel always LEFT, Nik always RIGHT, never mirrored. The dealer may be mirrored.
- No dimming, grey/dark overlays, blur or see-through filters on any person or the screen (HO-027). Everyone lit naturally.
- Not a saloon: no swinging doors, dancers, bar-fight props. No words in the room, no real logos, no real crests traced.
- Phone no scroll at 393x660, 360x640, 375x553 (button visible). Nothing covers the button or bars.
- Only three.js r128 (cdnjs) and Google Fonts. Lazy-loadable: one `index.html` + `assets/`; assets total <= 10 MB.
- `prefers-reduced-motion`: shorten beats, no shake.

## Prove it (assertions, not claims)
Playwright (preinstalled, `require('playwright')`). Capture with the test clock at: idle, cylinder spin, aim, shot (flash frame), after shot, safe click, for desktop 1536x864 and phone 393x660 (+ 360x640, 375x553 idle). Save to `roulette/evidence/*.jpg`. Assert: no page scroll on phone sizes; button rect inside viewport; no console errors; FPS on desktop >= 50 (log it). Look at every capture yourself and fix what looks cheap before you finish, the shooter first.

## Write at the end
`visual-assets/v10_1/roulette/BUILD_RESULT.md`: branch + SHA, what is 3D, asset contract table, platemap, Team G hooks, evidence gallery list, known gaps, spend. Last line: `CC-009 DONE <sha>`.
