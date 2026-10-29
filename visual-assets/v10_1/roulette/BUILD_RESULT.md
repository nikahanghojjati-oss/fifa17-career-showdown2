# CC-009 BUILD_RESULT · Roster Russian Roulette, real 3D screen (HO-040, r87)

Built 29 Oct 2026, 02:42-03:50 UTC (10:42-11:50 p.m. Eastern 28 Oct) by Fable 5.1 High in a project thread (Nik asked for the Fable job to run here, not in a cloud session).
Branch: `claude/project-thread-6rq94x`. SHA: c4b0c4d293f67118d49524e9b3b1a367979d9dc7 (code), the result-file commit follows it.
Files: `visual-assets/v10_1/roulette/index.html` (one file, three.js r128 from cdnjs + Google Fonts), `platemap.json`, `assets/` (0.37 MB), `evidence/` (21 captures + 2 sheets).

## What is real 3D (three.js)
- Room shell: plank floor, carved dark-wood panels with gold beads (canvas textures), wainscot, balcony with balusters behind, 11 glass wall lamps with warm halos, a sunset window, two far tables with chairs, a sideboard with a brass urn. Dust in the lamp light. PMREM environment built from the room so the steel reflects the lamps.
- The round table: green felt, wooden rim, pedestal; brass oil lantern with a glass chimney, a living flame (flicker on the point light + sprite), coffee pot, two cups on saucers, cards, coins. One spotlight with soft shadows.
- **The revolver** (hero): 1873 single-action style, octagonal barrel with bore and front sight, ejector rod, blued frame with top strap and recoil shield, loading gate, **fluted seven-chamber cylinder on a crane that swings out**, one brass round that slides into its chamber on the first turn, cylinder snaps shut, spins with ratchet clicks and settles, hammer with a long spur that cocks and falls, trigger and guard, wooden grip with steel backstrap and brass butt cap. PBR steel/blued metals with the room env map.
- The dealer (3D fallback until RR_DEALER.png): seated older cowboy, broad shoulders, cloth-bump coat with lapels, vest with brass buttons, dark neckerchief, grey beard, wide hat tilted so the brim shades the eyes; eyes only glint. Right arm = two-bone IK (shoulder, elbow, gloved hand with curled fingers round the grip). Left hand reaches over and spins the cylinder. The gun rests on the table pointed at the wall between turns.
- The two boards: wooden frame, brass corners, 2x CanvasTexture of the FIFA 17 squad screen (green pitch, XI placed by position with shirt in club colours + rating plate + surname, SUBSTITUTES row of 4, club name). They jolt in the hands when hit; a burnt hole + red RELEASED stamp stays on the bubble.
- Shot: muzzle flash sprite (procedural rays) + one-frame point light, recoil of the gun and arm, lingering drifting smoke, 0.12 s bullet tracer to one random bubble of the 15, splinters + paper bits that bounce on the felt, camera shake. Empty: dry click, small dust puff. Nobody is hurt, nothing gory.
- Camera: idle drift; telephoto close-up (fov 11, from the players' side so the picture layers stay in front) for the load/spin, then aim, tension push-in, hit framing, back to rest. Reduced motion: beats shortened, no shake.
- People: Daniel LEFT and Nik RIGHT as camera-facing picture planes at real depth (approved POSE_TRANSFER anchors as fallbacks), never mirrored, never 3D.

## Asset contract (drop the file in assets/, no code change)
| file | ticket | now |
| --- | --- | --- |
| `RR_ROOM.jpg` 16:9 | 1851-5 | 3D room fallback; when present it replaces the back wall at z -3.9 (platemap `room`) |
| `RR_DEALER.png` alpha | 1851-6 | 3D dealer fallback; when present the 3D body hides, the 3D arm + revolver stay for close-ups (platemap `dealer`, muzzle/hand u,v) |
| `RR_DANIEL.png`, `RR_NIK.png` | 1851-7/8 | `RR_DANIEL_ANCHOR.webp` / `RR_NIK_ANCHOR.webp` (approved anchors) behind the 3D boards |
| `RR_FLASH.png` | 1851-4 | procedural flash sprite |
| `RR_CYLINDER.png` | 1851-3 | not needed (real 3D cylinder) |
Platemap: `platemap.json` holds every layer's x/y/z/height, the board quads and the muzzle/hand points.

## Team G hooks
- `window.__rr.setBoards(danielClub, nikClub)` (any of the 98 clubs in `assets/squads.json`, FIFA 17 launch 170002 XI + 4 subs, kit colours = r85 club palettes).
- `window.__rr.play({fire:true|false})` forces a shot or an empty chamber; `play()` uses the seeded 1-in-7.
- `window.__rr.state` → turn, playing, fire, target, done {D,N}, bulletAt, chamber, aimDot, draw calls, triangles.
- URL: `?d=<club>&n=<club>`, `?fire=1|0`, `?seed=N`, `?tools=1` (preview buttons: sound, force shot/click, reset, club pickers).
- Test clock: `__rr.clock()` then `__rr.advance(sec)` at 30 fps (same idea as the Special Player `__mq`).
- Turn order: Daniel then Nik; button "Spin the cylinder", then "Spin again". Bottom panel states: At the table / Spinning… / Safe / Lost <name>. Sound is Web Audio, off until turned on.

## Evidence (`evidence/`)
`SHEET_DESKTOP.jpg`, `SHEET_PHONE.jpg` (9 frames each: idle, load, spin, aim, flash, hit, after, safe click, both done), the 18 single frames behind them, `phone360_360x640_1_idle.jpg`, `phone375_375x553_1_idle.jpg`, `report.json`.
Assertions (Playwright, software GL): no page scroll at 393x660 / 360x640 / 375x553 / 1536x864; button rect inside the viewport at all four (375x553: 20,443-355,483); muzzle aims at the target bubble (aimDot 0.999 desktop, 0.998 phone); no console errors except 404s for the five pictures not made yet; 201 draw calls / 28k triangles desktop.
FPS could not be measured here (the container renders on SwiftShader at ~0.2 fps); the scene is light (28k triangles, one shadow map, 6 lights) so a desktop GPU should hold 60. Measure on a real machine before relaying.

## Known gaps / next
1. The 3D dealer is a fallback: a good silhouette and a convincing hand + revolver, but the face is still simple forms. RR_DEALER.png (1851-6) is the planned fix and drops in with no code change.
2. Hand fingers are smooth rings, not modelled fingers. Fine at the close-up distance; the picture layer will cover the wide shots.
3. The cylinder swing-out is on the left (crane) like a double-action; a true 1873 loads through the gate. Kept the swing-out because it reads on a phone.
4. Live site check and real-device FPS still to do (cloud containers cannot reach the live site).
5. Sound not reviewed by ear here (synthesized, same pattern as Special Player).

Spend: about 70 minutes of the 75-minute cap, well under the $35 cap on Nik's reading of the thread cost.

CC-009 DONE c4b0c4d293f67118d49524e9b3b1a367979d9dc7
