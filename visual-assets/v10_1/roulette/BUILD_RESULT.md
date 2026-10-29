# CC-010 BUILD_RESULT · Roster Russian Roulette: no people, the revolver spins by itself (HO-040, r87)

Built 29 Oct 2026 by Fable 5.1 High in the project helper thread (Nik's choice), 03:48-04:20 UTC plus a resume 07:52-08:15 UTC after the usage limit reset. Nik asked for helpers to run in parallel: helper 1 did the premium room pass, helper 2 the revolver close-up (it stopped at the usage limit after its third round; that round is what shipped).
Branch: `claude/project-thread-6rq94x`. SHA: 04fa2c9f22c6c76e6a2b1bd194355348d28b8432 (code); the result-file commit follows it.
Files: `visual-assets/v10_1/roulette/index.html` (one file, three.js r128 from cdnjs + Google Fonts), `platemap.json`, `assets/squads.json` (0.04 MB, the only asset now), `evidence/` (21 captures + 2 sheets + report.json).

## What changed (CC-009 -> CC-010)
- **Nobody in the room.** Dealer, arms, hands, Daniel/Nik picture planes and the two anchor webp files are gone, with every RR_DEALER / RR_DANIEL / RR_NIK code path.
- **Boards on easels:** lacquered dark-wood frames with a gold lip and brass corners on brass tripod easels, angled to the centre, Daniel LEFT / Nik RIGHT, engraved brass nameplate DANIEL / NIK on each ledge. Squad drawing, burnt hole and RELEASED stamp kept; on a hit the board rocks on its easel.
- **The revolver lies on the felt** at the table centre, nothing touches it. Rebuilt as a hero model: frame and grip from smoothed traced side silhouettes (ExtrudeGeometry with bevels, a real cylinder window cut through the frame), octagonal chamfered barrel with crowned muzzle and bore, front sight, ejector housing/rod/head, lathe cylinder with chamfered ends, 7 flutes, 7 chambers with depth and ratchet star, hammer with spur, brass trigger guard and trigger, loading gate, screw heads, walnut grip panels with a gold medallion each; MeshPhysicalMaterial blued steel with clearcoat, gold scroll engraving map and a worn roughness map, brass and gold.
- **Sequence per turn** (Daniel first, then Nik; 1 bullet in 7; `?fire=1|0` forces): camera rises to a top-down view; the gun spins flat like a bottle (4 turns, friction curve, felt-rub sound), stops with the barrel on the current manager's board with a small overshoot and settle; telephoto close-up over the hammer side; the cylinder turns one chamber by itself (ratchet click), the hammer cocks by itself (heavy click); 0.85 s tension push-in with heartbeat; then either dry CLICK + dust puff ("Click. Daniel is safe.") or the shot: hard camera cut to the gun-and-board view, muzzle flash (sprite + one-frame point light), the gun kicks, slides back across the felt and turns a little, smoke drifts, 0.12 s tracer to one random bubble of the 15, splinters, board rocks, burnt hole + RELEASED ("Bang! <name> is released."). Reduced motion: shorter beats, no shake.
- **Premium room (helper 1):** lacquered mahogany wainscot with gold bead frames and rosettes, moulded rail with brass lines, coffered pressed-tin ceiling with lacquered beams, rebuilt balcony with turned balusters and brass-capped rail, gold-framed mirror on the back wall (no text), 15 brass wall sconces with tulip glass and halos, 6-arm brass chandelier over the table, marble-top cafe tables on brass pedestals with velvet chairs, carved buffet with marble top and samovar, velvet drapes with a gold pelmet at the window; polished mahogany table rim with a thin gold inlay, gold rims on cups and saucers; warm gold key light, exposure 1.22, no grey overlays.
- **HUD:** gold-plate badge kicker + foil title with shine, idle line "One bullet. Seven chambers.", button never greyed (gold "Spinning…" while busy, taps ignored), phone bottom tabs with real inline SVG icons (house, trophy active gold, lines, bars, page). No dealer words anywhere.

## Asset contract (drop the file in assets/, numbers in platemap.json, no code change)
| file | ticket | now |
| --- | --- | --- |
| `RR_ROOM.jpg` 16:9 | 1851-5 | 3D room; when present it replaces the back wall at z -3.9 |
| `RR_GUN_TOP.png` alpha, barrel up | 1853-1 | 3D model; when present it lies flat on the felt for the top-down spin shots and cross-fades to the model at the close-up cut (`gunTop` length / offsetZ / rotation) |
| `RR_FLASH.png` | 1851-4 | procedural flash sprite |

## Team G hooks (unchanged names)
`window.__rr.setBoards(danielClub, nikClub)`, `__rr.play({fire:true|false})`, `__rr.state` (turn, playing, fire, target, done, bulletAt, chamber, aimDot (horizontal), draw calls, triangles, hasRoom, hasGunTop), `__rr.clock()` + `__rr.advance(sec)`; URL `?d=&n=&fire=1|0&seed=N&tools=1`. Sound Web Audio, off until turned on.

## Evidence (`evidence/`)
`SHEET_DESKTOP.jpg`, `SHEET_PHONE.jpg` (9 frames each: idle, spin top-down, stopped on the board, cylinder/hammer close-up, flash, recoil slide, hit board, safe click, both done), the 18 single frames, `phone360_360x640_1_idle.jpg`, `phone375_375x553_1_idle.jpg`, `report.json`. Old people-era captures deleted.
Assertions (Playwright, software GL): no page scroll at 1536x864 / 393x660 / 360x640 / 375x553; button rect inside the viewport at all four (375x553: 20,443-355,483); barrel points at the target bubble in the horizontal plane (aimDot 0.99997 desktop, 0.9997 phone; the gun lies flat, so the check is horizontal and the tracer rises to the bubble); no console errors except the three 404s for pictures not made yet; 104 draw calls / 54k triangles.
FPS could not be measured here (software renderer); one shadow map, 7 lights, 54k triangles: measure on a real device before relaying.

## Known gaps / next
1. Revolver close-up is at about 7/10: the flutes read as rods and the hammer as a flat paddle at the chosen camera angle; the helper stopped at the usage limit after round 3. Next pass: thinner recessed flutes, hammer with a checkered spur, camera a little lower and more side-on so the cylinder window and engraving dominate.
2. The boards on the phone idle frame are small (readable, but tight); if Nik wants them bigger, lower the phone camera and bring the easels in (platemap `boards.phone`).
3. Live site check and real-device FPS still to do.
4. Sound not reviewed by ear here.

Spend: about 55 minutes of Fable thread time plus two helpers (room pass 19 min, revolver 25 min) against the 60-minute cap; no cloud credit used.

CC-010 DONE 04fa2c9f22c6c76e6a2b1bd194355348d28b8432

## CC-011 · revolver round (29 Oct 2026, Team V thread, Fable 5.1)
Nik: "Build to see inside the cylinder in 4K quality", "cinematic transition ... zoom to it", "work a lot on image quality of the room".
- Cylinder rebuilt: shallower real flutes, seven true bores (dark steel tubes with a floor and a bright chamfered mouth), the one cartridge is a real object (brass case, rim and primer at the back, grey lead nose at the mouth) placed in the loaded chamber (`cyl.userData.placeRound(i)`), hidden after it fires.
- Crane: the cylinder sits in a crane hinged below its left side and swings out (up, as the gun lies on its right side) with the base pin and knurled head.
- New beat `inside` (3.3 s → 4.7 s): camera zooms from the top-down shot into the open cylinder (slow push-in while the cylinder spins five turns and runs down with ratchet clicks), then the crane shuts with a click and the camera moves to the hammer-side view. Beats: spin .35, spinEnd 3.0, close 3.3, inside 4.7, turnC 5.3, cock 5.85, aim 6.05, fire 6.9, end 9.4 (reduced motion skips the inside beat).
- A cool key light rides above the camera for the close-ups; hammer-side view raised so the whole gun reads.
- Sharpness: pixel ratio cap 3 on desktop, 2.5 on phone (4K-class on a retina/4K screen). Table wood 1024, shadow map 2048 with a softer radius, felt deeper and finer, lantern stronger.
- Evidence rebuilt: idle, top, inside, cock, flash, hit, after at 1536x864 and 393x660; no scroll and button inside at both; no page errors.
- Still open: hammer and trigger are simple forms; RR_ROOM / RR_GUN_TOP / RR_FLASH drop-ins; real-device FPS.

## CC-012 · cylinder rebuilt from Nik's revolver photos (29 Oct)

Nik rated the CC-011 revolver 1/10: holes did not match a cylinder, parts mashed together. Reference photos in `project-documents/factory/r87/revolver-ref/`.

What changed in `index.html`:
- Cylinder is now a plain polished drum (no scallops, no torus lips): 7 bores of 9.2 mm on a 27 mm circle, ejector star at the rear, centre pin at the front, one brass cartridge with a grey nose.
- The bore cut had two real bugs. ExtrudeGeometry grows the walls by `bevelSize`, so the holes were drawn 0.6 mm wider and the rim 0.6 mm smaller to land on size. The old holes also overlapped each other, which broke the cap triangulation (one chamber came out capped with a wedge). Drum self-shadowing is off: the table shadow map is far too coarse at this scale.
- Every bore is a dark steel tube with a floor, so you can look down it.
- Close-up lighting: cool key (0xe6eeff, 0.5) plus a cool fill so steel reads silver rather than lantern-beige.
- Frame narrowed from 27 mm to 20 mm so the drum shows beside the top strap, screws and loading gate moved to the new surfaces.

Evidence regenerated in `evidence/` (desktop 1536x864 and phone 393x660, 7 beats each, sheets). Phone: no scroll, button visible.
