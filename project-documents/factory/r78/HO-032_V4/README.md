# HO-032 V4 · phone League plate for the 15%-smaller wheel

Nik chose a smaller phone wheel. Team G shrank it to 85% of its diameter: 254 px at 393x852, with the same centre and
the buttons unchanged. Their face check now tests the wheel as a circle. With the V2 plate that passes at 393x660,
375x667 and 360x640, but fails at 393x852: the gold rim reaches 12.6 px into Daniel's zone and 8.9 px into Nik's
(numbers from `leads/relay` HO-032 at 1c2ec09).

`visual-assets/v10_1/plates-v4/ENV_LEAGUE_PHONE_V4.webp` is a geometric edit of the approved
`ENV_LEAGUE_PHONE_V2.webp`. It leaves about 20 screen px between each face zone and the rim at 393x852, and the other
three sizes keep passing. The HO-031 League v3 plate is not used.

- Plate: 1179x2096 WebP, saved with Pillow `quality=88, method=6`. Size 329,864 B (V2 is 399,304 B).
- Face zones: `PHONE_FACE_ZONES_V4.json`, the same format with all 12 keys.
  - LEAGUE refers to V4. Standings, Rivalry and Trophy Room keep their HO-031 v3 zones; the other 8 keys keep V2.
  - The new League zones are the union of the V2 zone moved by the same transform and the YuNet face box on V4,
    padded 15% per side. The two sources agree within 0.5% (`PHONE_FACE_ZONES_V4_sources.json`).

## Why the men had to move, not the whole picture

A whole-content shift like the Standings v3 plate cannot get 20 px:

- **Up:** Nik's zone can rise only about 30 plate px before it meets the title box at 360x640, which spans x 149-1030
  above y 382.
- **Outward:** Daniel can go at most 60 plate px left and Nik 27 px right before their zones leave the visible
  picture at 393x852.
- **Result:** pure moves top out at about 7 px of rim margin for Nik.

So both men are nudged as cut-outs (the same soft mattes as HO-031), and Nik is shrunk slightly. The placement is the
smallest one found by `tools/opt_lg4.py`.

| | Change |
| --- | --- |
| Daniel | Scale 0.99, moved 58 px left and 54 px up (plate px). His left arm stays cut by the frame. |
| Nik | Scale 0.90 about the right frame edge, moved 12 px further right and 12 px down. His right arm stays cut by the frame. |
| Podium and floor | Everything below the tier back edges is scaled 1.28x uniformly about the bottom centre, so both men's legs still end behind the podium. Nik's leg ends rise about 130 px when he shrinks, which is what forces 1.28x. |
| Stadium | The strip each man leaves on his inner side is rebuilt row by row by stretching the stadium between the men outward (median 1.65x, at most 2.42x, between their chests, under the wheel). The stretch fades in and out over 90 rows, so no row edge shows. |
| PatchMatch | 12,468 px (0.5%) of leftover old-man pixels at the frame edges are filled from the stadium around them. |

No face is enlarged (0.99 and 0.90). Both men keep their full length, brightness and light. Daniel stays on the left.

## Face check

Team G's branch `r78-phone-marble-2` is still at 6dbd740b on the remote: the smaller wheel and the circle mode are
not pushed yet. Their HO-032 note says the wiring is ready locally. So the check runs on that head with the change
emulated, using `tools/swapcheck.cjs` with `H31_WHEEL_SCALE=0.85`:

- the wheel is scaled to 0.85 about its own centre, which gives 254 px at 393x852, centre (196.5, 348.5);
- the old phone art is hidden, and the plate is drawn cover / centre top behind the UI;
- the audit's own `faceHits` and `fadedManagers` walks run, plus the circle-mode distance from each zone to the disc,
  plus a pixel comparison of the screen with the UI and with the plate alone.

The emulation reproduces Team G's V2 numbers exactly: Daniel −12.6 px and Nik −8.8 px at 393x852, where they
reported 12.6 and 8.9.

Margin from each zone to the wheel disc (screen px; negative means inside the disc):

| Size | V2 Daniel | V2 Nik | **V4 Daniel** | **V4 Nik** |
| --- | --- | --- | --- | --- |
| 393x852 | −12.6 (FAIL) | −8.8 (FAIL) | **+19.6** | **+19.6** |
| 393x660 | +8.0 | +10.5 | +34.3 | +34.5 |
| 375x667 | +14.0 | +16.1 | +38.7 | +39.2 |
| 360x640 | +16.9 | +19.0 | +40.8 | +41.1 |

Other UI boxes (title, "spin to select", header, buttons) are cleared by at least 2.7 px at every size, with no
overlap.

Pixel check, inside the unpadded face boxes, at all four sizes:

- **V4:** 0 changed pixels.
- **V2 with the smaller wheel:** 2,305 changed pixels in Daniel's face box and 1,127 in Nik's at 393x852.

Inside the padded zones, the only changes with V4 are the bottom edge of the title box. It touches the top 1-3 CSS px
of the zones at 375x667 (Nik) and 360x640 (both). That is padding only, and it is not counted by the audit.

In the current box mode (without circle mode), the audit would still count the corners of the shrunk wheel's square
box: 4% at 393x852 and 1% at 393x660. With circle mode, as Team G now uses, there is no overlap.

Logs are in `logs/`.

## Honest look

- **Men:** the cut-outs are clean at 100%, with no halos and no seams around the heads. The light and colour are
  unchanged.
- **Stadium between the men:** it is stretched sideways, so the crowd and flags there are a little smeared, but less
  than in the HO-031 v3 attempt. Almost all of it is under the wheel in the app.
- **Podium:** it is 28% bigger than in V2. At 393x852 its top now shows just above SPIN WHEEL.
- **Screen edges:** at 393x852, Daniel's hair and ear touch the left screen edge and Nik's ear touches the right edge.
  Their zones end exactly at the visible edge; Team G saw the same hair crop with V2. Both faces stay on screen.
- **PatchMatch spots:** they sit at the frame edges in dark, out-of-focus stadium, and do not read as patches.

## Files

- `shots/BEFORE_AFTER_LEAGUE_393x852.png`: V2 against V4 with the smaller wheel, zones in cyan.
- `shots/SHEET_LEAGUE_V4_4SIZES.jpg`: V4 at the four sizes. `SHEET_LEAGUE_V2_4SIZES.jpg` is the same for V2.
- `shots/PLATE_V2_V4.jpg`: the two plates side by side.
- `tools/`:
  - `placement_V4.json`: the placement.
  - `lg_compose.py`: `python3 lg_compose.py <V2 plate> <mattes dir> <out> placement_V4.json`. The mattes come from
    `HO-031_V3/tools/mattes.py`. Re-running it on the same mattes rebuilds the same plate.
  - `opt_lg4.py`: the placement search, which runs from `tools/` with `probe.json`.
  - `zones_v3.py`, run with `PLATE_TAG=V4`.
  - `swapcheck.cjs`: run with `H31_WHEEL_SCALE=0.85` from the gameplay worktree root.
  - `h31lib.py` and `fit.py`.
