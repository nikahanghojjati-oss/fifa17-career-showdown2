# HO-082 · Team G → Team V · Roulette hand: side-entry upright plate for tall windows

```ticket
{
 "id": "HO-082",
 "from": "G",
 "to": "V",
 "title": "Roulette hand: side-entry upright plate for tall windows",
 "kind": "design",
 "priority": "top",
 "worker": "images",
 "parent": null,
 "job": null,
 "status": "DONE",
 "steps": [],
 "evidence": ["claude/project-thread-6kfnkn 420b8c74b project-documents/hc-art/ho082/"],
 "log": [{"at": "2026-11-15T09:45:07Z", "by": "G", "status": "SENT", "note": ""}, {"at": "2026-11-15T09:48:26Z", "by": "V", "status": "RECEIVED", "note": "Team V lead: Astra prompt posted, Nik runs, lead cuts/measures"}, {"at": "2026-11-15T10:00:01Z", "by": "V", "status": "DONE", "note": "Nik OK 15 Nov 4:59 a.m. Eastern. RR_HAND_POV_S_V1.webp 1600x1200 81 KB, bore 70.0, forearm rises 16.4 from right edge, cut on x=1.0 y 0.02-0.31 (29%, slightly short), glove box centre x0.65/66% down (right+below target: long barrel); muzzle 5.6% from top; nothing touches other edges. Points in HO082_PLATE_NUMBERS.json (y from bottom). Rerun with shorter barrel if placement fails."}],
 "from_session": "session_01GU43Q6ycny5YqAKEeZjFWZ",
 "sessions": {"G": "session_01GU43Q6ycny5YqAKEeZjFWZ", "V": "session_01GU43Q6ygGHrAsJfLkNSMzY"},
 "parts": ["HO-083"]
}
```

Nik chose this 2026-11-15 09:44 UTC (card: "Picture plus bigger phone glove"). Team G does the data PR (platemap + placement) as for HO-081, and separately moves the phone caption so the phone glove grows (no new art needed for phones).

## Why

On tall desktop windows, the RRR screen shows a floating bottom strip: the two name slots, sitting 40 px in from each side with a gap of about 24 px below them. On these windows, the HO-081 upright plate (`RR_HAND_POV_P_V1`) cannot be placed so the glove clears the strip and the caption while the sleeve's cut stays hidden. Its sleeve leaves through the bottom edge of the plate, and the only way to hide that cut is to push it under the strip or off the bottom of the screen. Both push the glove down into the strip. Today these windows keep the usual placement, and the strip covers up to about 25 px of the glove.

Windows affected (sweep of PR #1475, head e5af182):

| Window | Where it occurs | Glove covered today |
|---|---|---|
| 960x1035 | Chromebook half screen, full-screen mode | yes (strip, and a few px of caption) |
| 960x866 | Chromebook half screen, windowed | yes (strip) |
| 900x1200 | tall desktop / tablet-like window | yes (strip and caption) |
| 1024x1366 | iPad Pro upright in a desktop browser | yes (strip and caption) |

Phones (360x640 to 430x932) and the 768x1024 and 820x1180 tablets are already clear with the P plate. They keep it.

**Why phones don't get S (lead check, 2026-11-15).** A side-entry plate would not make the glove bigger on phones. The limit there is the screen, not the plate:
- The muzzle must sit below the board, and the glove sits below the muzzle.
- At 390x844, the board's foot is at 566 px, the caption starts at 695 px and the bottom bar at 768 px. That leaves 129 px of height for the barrel and the glove together. Beside the caption there are only 83 px of width on each side.
- At 393x660 the room is about 71 px tall and 76 px wide.

Any plate tops out at about 100 px of glove, which is what P already gives. A 140 px+ glove on phones would need a layout change: the caption moved, or the muzzle allowed over the board's lower edge. Both are Nik's call.

## Where the glove can go on these windows

All values are fractions of the window height H (the same at all four sizes, ±0.01):

- The foot of the board is at about 0.64 H. The muzzle must stay below it.
- The caption line runs from 0.80 H to 0.83 H, across the middle third of the width only (about 0.35 W to 0.65 W).
- The bottom strip runs from 0.905 H to 0.977 H, from x = 40 px to W − 40 px.
- The Spin button is hidden during the turn, so it is not a keep-out.

That leaves two clear areas for the glove:

1. A band across the full width, from 0.66 H to 0.79 H (about 140 to 165 px tall at these sizes).
2. The space beside the caption on either side, down to 0.89 H.

The sleeve can only leave the screen through the side edge. That means the right edge, anywhere from 0.66 H down to the bottom of the window. Beyond x = W it is off screen at any height.

## The plate

- **Name:** `RR_HAND_POV_S_V1.webp`
- **Canvas:** 1600 x 1200 (4:3). Transparent background, clean alpha (no halo on dark felt), 150 KB or less.
- **Same hand as HO-081:** the same right glove, the same revolver (steel, hammer, cylinder), and the same lamp light and warmth as `RR_HAND_POV_P_V1` and `_W_V1`. It must look like the same person in the same room, seen from the shooter's eye. No table, no second revolver, no cuff jewellery, no lettering.
- **Forearm from the side:** the sleeve enters from the **right edge** of the canvas, not the bottom edge.
  - The visible forearm runs up and to the left at about 15° to 30° above horizontal (from the right edge toward the wrist).
  - It should read as the shooter's right arm, extended and slightly foreshortened.
  - The visible forearm is 20% to 30% of the canvas width. Keep it short, because screen space is tight.
- **The cut:** a clean, straight cut lying exactly on the right edge of the canvas (x = 1600). It should span roughly 35% to 55% of the canvas height and sit in the lower half. Nothing else may touch any canvas edge.
- **Barrel:** rising to the upper left. The bore angle is 70° from horizontal (±3°), measured on the canvas.
  - The code rotates the card ±15° per window, so the barrel can cover 55° to 85°. The forearm then still leaves through the right edge, at 0° to 45°.
  - The muzzle sits near the top of the canvas, at least 4% in from the edge, with the bore line clearly readable (no fingers across the muzzle).
- **Glove:** compact and fully visible.
  - The grip and the glove fit inside a box about 30% of the canvas width and 35% of its height, centred around 45% to 55% across and 50% to 60% down.
  - The trigger finger rests on the trigger guard or the trigger, and the thumb is visible near the hammer.
  - The wrist pose must look natural for an arm coming from the side. Team V chooses it. A slight upward wrist break is fine. A canted (tilted) revolver is not.
- **Points to give with the delivery** (as in HO-081, fractions of the canvas, y measured from the bottom):
  - the muzzle centre and a rear point on the bore line;
  - the wrist and the elbow direction;
  - the two cut end points, which lie on x = 1.0;
  - the glove box.

  R93-04 checks each one against the pixels before using it.

## How the code will use it

- The S plate is used only on upright windows where the P plate has no clear spot. That covers all four windows above, and any other tall window with the floating strip. The choice is made on load and on resize, like P and W.
- Each window still loads only one plate. Light and Balanced decode it at 1024 px on its long side, as they do today. There are no new draws, programs or lights.
- It is placed by the same one-off search as on phones:
  - the glove stays clear of the strip and the caption at the aim pose and the kicked pose;
  - the cut stays off the right edge;
  - the barrel line runs through the centre of the board;
  - the muzzle stays below the board.
- Nik's turn uses the same right hand. Whether the card is mirrored for him follows what the game does now. Nothing changes there.

## Acceptance (R93-04 data PR)

At 960x1035, 960x866, 900x1200 and 1024x1366, plus all 33 sizes in the sweep for regressions, at Light, High and Ultra:

- The glove is not covered by the strip or the caption at any beat (take, cock, aim, kick, bang, fade). This is a contract check, as on phones.
- The sleeve cut is never on screen, including during the overshoot and the recoil.
- The barrel line runs within 4 px of the board's centre, and the muzzle is never on the board.
- Two revolvers are never on screen.
- Light draws, programs and MB are unchanged from 2.6.0.
- Gate 8/8 and Codex clean. Before and after frames are added to the gallery: (Team G gallery)

## Why existing art can't just be turned

I checked whether the W or P plate could simply be rotated to fit, and neither can. In both, the barrel continues roughly in line with the forearm: 2D angles of 197° and 201° from the barrel's direction to the wrist-to-elbow direction. A barrel at 55° to 85° therefore always puts their sleeve leaving downward, into the strip.

The S plate needs about 130° between the two, a bend of about 50° on the canvas. That is the main thing for Team V to make look natural. The forearm should come toward the viewer from the right shoulder, foreshortened, so the bend reads as perspective rather than a broken wrist.


Reference art: attachments/HO-081/ (today's glove), plus Team V's own RR_HAND_POV_P_V1 / _W_V1 from HO-081.
