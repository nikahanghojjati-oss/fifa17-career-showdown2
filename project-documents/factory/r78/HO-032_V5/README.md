# HO-032 V5: phone League plate from picture ticket 1846

Plate: `visual-assets/v10_1/plates-v5/ENV_LEAGUE_PHONE_V5.webp`
(1179x2096, WebP q88 method 6, 394,802 B, sha256 `b29a53ea…3df983c75`).

## Inputs

- `source/GPT_1846_LEAGUE.png`: ticket 1846 result as delivered (941x1672,
  sha256 `eedbd68b…1801c6a5`).
- `visual-assets/v10_1/plates-v2/ENV_LEAGUE_PHONE_V2.webp` and the V2 man mattes
  (the same mattes as HO-031/HO-032 V4).
- `project-documents/factory/r78/HO-032_V4/tools/placement_V4.json`
  (Daniel k=0.99 tx=-58 ty=-54; Nik k=0.90 tx=129.9 ty=12; plinth 1.28x about (589.5, 2096)).

## What was done (`tools/v5_compose.py`)

1. Lanczos upscale of the GPT picture to 1179x2096 (aspect identical).
2. Likeness lock. YuNet shows the GPT picture kept both faces at the V4
   positions (within about 2 px), but redrew them, along with the hands and
   suits. Following the ticket's "For Claude" section, the whole V4 men were
   put back (approved V2 pixels under the V4 similarity transforms, with
   alpha feathered inward only, 1.5 px) and only the background was taken from
   the new picture. Both men are therefore pixel-identical to V4/V2, including
   the original hands and suits. The alignment is exact because the head
   positions did not move, so no warp was forced.
3. The GPT plinth is composited back in front of the men's legs, using the V4
   plinth silhouette, which the GPT plinth matches. Legs end behind the plinth
   as in V4.
4. A human-seg pass on the GPT picture finds only 75 px of GPT-drawn person
   outside the V4 men (right frame edge near (1157,1170)), so there are no
   ghost limbs or doubled edges.

## Face zones (`PHONE_FACE_ZONES_V5.json`, 12 keys)

LEAGUE refers to V5: the union of the V4 zone and the YuNet face box on V5,
padded 15%.

- Daniel: [0.0903, 0.1881, 0.2539, 0.3095]
- Nik: [0.7461, 0.1860, 0.9089, 0.3070]

The other 11 keys are unchanged from `HO-032_V4/PHONE_FACE_ZONES_V4.json`:
ST/RV/TR are v3, and the rest are V2.

## Swap check

The check uses the wheel at 0.85 in circle mode, which is my emulation of
Team G's HO-032 change: `#leagueWheel{transform:scale(.85)}` plus a circle
test. That change was still unpushed at the time of the check, with gameplay
branch `r78-phone-marble-2` at 6dbd740b.

Wheel-disc margin from each face zone, in screen px:

| size    | Daniel V5 | Nik V5 | Daniel V4 | Nik V4 |
|---------|-----------|--------|-----------|--------|
| 393x852 | 18.3      | 19.6   | 19.6      | 19.6   |
| 393x660 | 33.3      | 34.5   |           |        |
| 375x667 | 37.9      | 39.2   |           |        |
| 360x640 | 39.9      | 41.1   |           |        |

Daniel's margin is 1.3 px lower at 393x852 because his union zone is
slightly wider.

- **Face pixels.** With the UI shown and with the UI hidden, 0 pixels change
  inside either unpadded face box at all 4 sizes.
- **Title, header and buttons.** None of them overlaps a face box. The
  minimum clearance is 3.2 px for Daniel and 2.5 px for Nik (Nik against the
  title box at 360x640). At 375x667 and 360x640 only the title box edge
  enters the 15% zone padding, the same as in V4.
- **Box mode.** In box (non-circle) mode, the wheel's square corners still
  cover 5% / 4% of the zones at 393x852 and 1% at 393x660. The circle test is
  required, as it was for V4.

## Look note

- The stadium background is clean: the stretched-gap seam and residual
  inpaint texture from V4 are gone.
- Hair and shoulder edges show no halo against the new background.
- Faces, hands and suits are exactly V2/V4.
- The plinth reads as one object in front of the legs.
- The new picture adds no readable words or logos. The small glyph-like marks
  on the side ad boards were already present in the approved V2 and are not
  legible.

## Files

- `shots/BEFORE_AFTER_LEAGUE_V4_V5_393x852.png`: V4 vs V5 in the app at 393x852.
- `shots/SHEET_LEAGUE_V5_4SIZES.jpg`: V5 at 393x852, 393x660, 375x667 and 360x640.
- `shots/PLATES_V4_GPT_V5.jpg`: V4, GPT 1846 upscaled, and V5 side by side.
- `logs/swap_V4.log`, `logs/swap_V5.log`, `logs/swapcheck_V5.json`: swap-check output.
- `tools/v5_compose.py`: the composer. It also uses `h31lib.py` from `HO-032_V4/tools/`.
