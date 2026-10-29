# CC-010 · Russian Roster Roulette: no people, the revolver spins by itself (HO-040, r87)

MODEL: Fable 5.1 · EFFORT: High · SURFACE: Claude Code cloud session (claude.ai/code), Nik's cloud credit
STOP_BUDGET: $30 / 60 min. At 80% ($24) stop adding scope, commit, write the result. At 100% stop.
REPO: nikahanghojjati-oss/fifa17-career-showdown2 · START FROM: branch `claude/project-thread-6rq94x` (60b889e9 or later).
Commit and push to the branch your session is given; name it in the result. WRITE ONLY IN `visual-assets/v10_1/roulette/`.

## Why
Nik scored the CC-009 build 1/10: "the squad covers our faces, our faces look bad, the quality of the gun is terrible". His decision (29 Oct 03:44 UTC): **drop what code can't do: no faces, nothing held in a hand.** The Special Player screen worked because code drew objects and pictures did the hard parts. Same recipe now.

## Read first
1. `visual-assets/v10_1/roulette/index.html`, `platemap.json`, `BUILD_RESULT.md` (CC-009, the base you change)
2. `visual-assets/v10_1/special-player/index.html` on `origin/factory/v1-wtt5ye` (the quality bar: card, coin, lighting, HUD)
3. `project-documents/factory/r87/NIK_REF_*` (room look)
Testing: cdnjs is blocked in cloud containers; fetch `https://raw.githubusercontent.com/mrdoob/three.js/r128/build/three.min.js` and `page.route()` the cdnjs URL to it. Serve the folder over http (fetch of platemap/squads fails on file://).

## The new scene (change)
1. **Remove** the dealer (body, arm, IK hands), the Daniel and Nik picture planes and the anchor webp files, and every code path for RR_DEALER / RR_DANIEL / RR_NIK. Nobody in the room.
2. **Boards on stands**: each board stands on a wooden easel at its side of the table, angled toward the centre, fully visible and readable, Daniel's on the LEFT, Nik's on the RIGHT, each with a small engraved brass nameplate on the easel (DANIEL / NIK). Keep the squad drawing, burnt hole and RELEASED stamp.
3. **The revolver lies on the green felt** in the middle (no hand ever touches it). Sequence per turn (Daniel first, then Nik; 1 bullet in 7 chambers; `?fire=1|0` forces):
   a. SPIN: the gun spins flat on the felt like a bottle (fast, slowing, felt friction sound), the camera looks down from above; it stops with the barrel pointing at the current manager's board (a small natural overshoot and settle).
   b. Close-up: the cylinder turns one chamber by itself with a ratchet click, the hammer cocks by itself with a heavy click. 0.8 s tension push-in, lantern hiss, heartbeat.
   c. Empty: hammer falls, dry CLICK, a puff of dust on the felt. "CLICK. DANIEL IS SAFE."
   d. Shot: hammer falls, muzzle flash lights the whole room for one frame, **the gun kicks and slides backwards across the felt from the recoil** (spins a little), smoke curls out of the barrel and drifts, the tracer hits one random bubble of the 15, splinters, the board shakes on its easel, burnt hole + RELEASED. "BANG! <NAME> IS RELEASED."
4. **The revolver must look like a hero product render, 9/10 or better in close-up.** The CC-009 model reads as blocky boxes. Rebuild it from real profiles: `ExtrudeGeometry` with bevels from a traced 1873 single-action side silhouette for the frame, grip and hammer; `LatheGeometry` for the barrel muzzle, cylinder (with 7 rounded flutes and 7 chamber holes with depth) and ejector rod; octagonal barrel with chamfered edges; small details (front sight, loading gate, screws, trigger guard in brass, walnut grip with a grain texture and a bevel). `MeshPhysicalMaterial` for blued steel (clearcoat, worn silver edges via a canvas roughness/colour map) and brass. Look at your own close-up captures and keep refining until no edge looks like a box.
5. **Picture layers (drop-in, no code change, numbers in platemap.json):** `RR_ROOM.jpg` (ticket 1851-5, replaces the back wall); `RR_GUN_TOP.png` (ticket 1853-1, a top-down revolver photo: when present, use it as an alpha plane flat on the felt for the top-down spin shots, the 3D model for the close-ups, and cross-fade at the camera cut); `RR_FLASH.png` (1851-4).

## Premium (Nik, 03:44 UTC: "I want premium")
Everything must feel luxury, like the approved Special Player screen and the marble/gold Showdown screens: the revolver engraved with fine gold scrollwork on the frame and an ivory-or-walnut grip with a gold medallion; the boards in polished dark lacquered wood with brass corners and brass easels; the table rim in deep polished mahogany with a thin gold inlay; warm cinematic grading with gold highlights; the HUD in the Special Player gold-foil style (foil title with shine, gold-plate badge, polished-gold button). No neon, nothing cheap or toy-like.

## HUD fixes
- Phone bottom tabs show real icons: HOME house, CAREER trophy (active, gold), STANDINGS three lines, STATS bar chart, RULES page (inline SVG). No empty squares.
- The button is **never greyed or dimmed** (Nik's no-dim rule HO-027). While busy it stays gold, shows "SPINNING…" and ignores taps.
- Remove "THE DEALER LOADS ONE ROUND." and every dealer word. Idle line: "ONE BULLET. SEVEN CHAMBERS."
- Keep: top bar, title, result line, bottom panel, phone chips + gear, hooks `window.__rr.*`, `?d=&n=&fire=&seed=&tools=1`, test clock, sound off until turned on, reduced motion.

## Hard rules
No people, no hands, no faces anywhere. No dimming/grey/blur overlays. Not a saloon, no words in the room, no real logos. Phone no scroll at 393x660, 360x640, 375x553 with the button visible and both boards readable. three.js r128 (cdnjs) + Google Fonts only; assets <= 10 MB.

## Prove it
Playwright captures with the test clock, desktop 1536x864 and phone 393x660: idle, spin top-down, stopped pointing at the board, cylinder/hammer close-up, flash, recoil slide, hit board, safe click, both done; plus 360x640 and 375x553 idle. Rebuild `evidence/SHEET_DESKTOP.jpg` and `SHEET_PHONE.jpg`, delete the old people captures. Assert: no scroll, button inside viewport, barrel direction points at the target bubble (dot >= 0.99), no console errors except 404s for missing pictures.

## Write at the end
Update `BUILD_RESULT.md` (what changed, asset contract, hooks, evidence, gaps, spend). Last line: `CC-010 DONE <sha>`.
