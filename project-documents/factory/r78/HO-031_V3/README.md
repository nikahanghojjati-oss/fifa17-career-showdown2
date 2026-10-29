# HO-031 v3 · phone plates for League, Standings, Rivalry and Trophy Room

The four r78 phone screens that still fail the face check with the V2 plates get v3 plates. Every v3 plate is a
geometric edit of the approved `visual-assets/v10_1/plates-v2/ENV_<KEY>_PHONE_V2.webp`: whole-content shifts and
uniform scales, a few uniform scales of single objects, and stretches of the plate's own background. There is no
painting and no AI image generation. Both men stay full length, at full brightness and in their own light. Nothing is
dimmed, see-through, blurred, faded or cut. Daniel stays on the left and Nik on the right. No face is enlarged: faces
are kept at 1.00 or shrunk to 0.885, 0.91 or 0.82.

- Plates: `visual-assets/v10_1/plates-v3/ENV_{LEAGUE,STANDINGS,RIVALRY,TROPHY_ROOM}_PHONE_V3.webp`. They are
  1179x2096 WebP, saved with Pillow `quality=88, method=6`, the same as V2.
- Face zones: `PHONE_FACE_ZONES_V3.json`. It uses the same format as `PHONE_FACE_ZONES.json` and lists all 12 keys.
  The other 8 keys are copied unchanged.
- Placement: `transforms.json` records every move.

## Files

| File | Size | V2 size |
| --- | --- | --- |
| `ENV_LEAGUE_PHONE_V3.webp` | 328,508 B | 399,304 B |
| `ENV_STANDINGS_PHONE_V3.webp` | 379,474 B | 413,450 B |
| `ENV_RIVALRY_PHONE_V3.webp` | 357,046 B | 380,632 B |
| `ENV_TROPHY_ROOM_PHONE_V3.webp` | 359,378 B | 396,554 B |

How each v3 zone is made: take the V2 zone, move it by the same transform as the plate, then union it with the YuNet
face box found on the v3 plate. The YuNet box is padded 15% per side, the same rule as `facecheck.py`. The rounding
always goes outward. The two sources are kept in `PHONE_FACE_ZONES_V3_sources.json`, and they agree within 0.5%.

## What moved, per screen

### Standings (smallest change)

- The whole plate content moves down 35 px. Both men and the background move together, unscaled. The bottom 35 rows
  of V2 leave the frame.
- The plate's own top band (V2 rows 0-63: dark sky and the stadium roof, above both heads) is stretched to 99 rows to
  fill the top.
- Nothing is cut out.
- This clears the settings corner at 393x852 by 3.9 px.

### Rivalry (smallest change)

- The same edit as Standings, with a 19 px move down. The top band (rows 0-69) is stretched to 89 rows.
- The face clears the settings corner and gear at 393x852 by 3.9 px.
- The seam-free top was checked at full size: the banner text and the lights stay continuous.

### Trophy Room

One continuous warp of the V2 plate. Every output pixel is a resampled V2 pixel: there are no cut-outs and no
synthesised texture.

1. **Split shift:**
   - Everything left of a central band moves 90 px left, and everything right of it moves 90 px right.
   - The band is the empty corridor between the two men: x 470-708 above the shoulders, narrowing to x 560-620 between
     their arms. In the pedestal rows the band is the pedestal itself.
   - The band is stretched horizontally to close the gap. Neither man is inside the band, so both men are only moved.
   - The pedestal becomes 1.41x wider.
2. **Uniform scale:** the whole content is scaled by 0.885 about (590, 187). Both men shrink by the same factor.
3. **Edges:**
   - The top 75 rows come from the V2 ceiling rows 0-60, stretched.
   - Below both men's shoes (from output row 1714), the reflective floor is stretched vertically from the V2 floor.
     The stretch starts at 1x and rises to a cap of 3x at the bottom edge.

Result: the faces sit between the title and the shelf, clear of the spotlight, plinth, shelf and tabs at all four
sizes.

### League

The faces move to the top corners, outside the wheel disc.

- **Men:** both are cut out with their soft mattes (`mattes.py`: rembg isnet edges limited by u2net human-seg, then
  closed-form matting) and re-placed.
  - Daniel is scaled 0.91, then moved 45 px left and 18 px up. His arm stays cut by the left frame edge.
  - Nik is scaled 0.82 about the right frame edge, then moved 48 px down. His arm stays cut by the right frame edge.
- **Podium:** the round podium and the floor (everything below the tier back edges) are scaled 1.32x uniformly about
  the bottom centre. The men's legs still end behind the podium, as in V2.
- **Background:** the stadium strip each man leaves on his inner side is rebuilt row by row. In each row, the stadium
  between the two men is stretched outward. The stretch fades in and out over 90 rows, so no row boundary shows.
  The stretch is 1.80x on median and 3.24x at most, between their chests. That area is under the wheel in the app.
- **Leftovers:** 20,289 px of old-man pixels stayed visible, about 0.8% of the plate. They sit at the frame edges
  below the arms and beside Nik's hip, and are filled with PatchMatch from the stadium around them.

## Face check, before and after (393x852 / 393x660 / 375x667 / 360x640)

### How the numbers were made

Team G's `tests/browser/phone-marble-facecheck-audit.cjs` was used on the PR #894 branch (r78-phone-marble-2) at
6dbd740b, with `CMS_FACECHECK_PREDICT=1`.

- "Before" uses the branch's own V2 zones.
- "After" uses the v3 zones, swapped into a local copy of `tests/fixtures/team-v/PHONE_FACE_ZONES.json`. The copy was
  restored afterwards; nothing was committed to that branch.

The predict mode cannot fully stand in for the swap:

- It does not hide the old Rivalry stadium picture: `img.rv-adoptedPhoneStadium` covers both faces 100% before and
  after.
- It flags the Trophy Room `div.heroSpotlight` glow as a "faded manager" because the name contains "hero".

So each run was repeated with `tools/swapcheck.cjs`. It opens each screen with the audit's own `openScreen`, hides
the old phone art (`ENV_RV_PHONE`, `ENV_TR_PHONE`, `*_PHONE_V1`, `OVL_*_PHONE`), clears the old full-screen stage
backdrops, and draws the plate cover / centre top behind the UI. It then runs the audit's own `faceHits` and
`fadedManagers` walks, copied from the audit file at run time. Logs are in `logs/`.

### Results

| Screen | Before (V2 plate, V2 zones) | After (v3 plate, v3 zones) |
| --- | --- | --- |
| Standings | **852 FAIL**: Nik 1% under the settings corner, 0% under the gear (about 6x10 px). 660, 667, 640 OK. | **OK at all 4 sizes** (official predict run and swap run) |
| Rivalry | **852 FAIL**: Nik 0% under the settings corner (about 10x2 px). 660, 667, 640 OK. The official predict run fails all 4 sizes at 100% under the old `rv-adoptedPhoneStadium` picture. | **Swap run OK at all 4 sizes.** The official predict run still shows only the 100% old-stadium artefact, the same as before. |
| Trophy Room | 852: Nik 8% shelf, Daniel 4% shelf, Nik 3% tabs. 660: Nik 13% shelf, Daniel 11% spotlight, Daniel 10% shelf, Nik 9% spotlight, Daniel 8% plinth, Nik 7% tabs, Nik 5% plinth, Nik 4% tab, Daniel 3% tabs. 667: Daniel 14% spotlight, Nik 11% spotlight, Daniel 8% plinth, Nik 5% plinth. 640: Daniel 13% spotlight, Nik 10% spotlight, Daniel 8% plinth, Nik 6% plinth, Nik 3% shelf. | **No face overlap at any size.** Only the audit's heroSpotlight name match remains, which it also reports for the V2 and old look. |
| League | Wheel (`#leagueWheel` and `.wheelTrack`): Daniel 63 / 36 / 33 / 24%, Nik 44 / 25 / 24 / 17% | **Still FAIL in the audit:** Daniel 19 / 6 / 4 / 1%, Nik 20 / 7 / 4 / 0%. These are the corners of the wheel's square bounding box only. See below. |

The 8 other screens are unchanged and still draw V2. The plain audit run (no args) gives
`phone marble face check: PASS (HOME, LEGACY, STATISTICS, SEASON_RESULTS, FINAL_WINNER, CLUB, TRANSFER,
CONNECT_PLAYERS)`, 32 of 32 OK.

### League: what still fails, and why the plate cannot fix it

The wheel is a circle (`border-radius: 50%`), but the audit treats it as its square box. At the centre of the zone /
wheel-box overlap, `elementFromPoint` returns `.wheelContainer`. The audit's `onTop()` also accepts any ancestor
(`t.contains(el)`), so the empty square corners of the wheel count as cover.

The wheel's box spans plate x 201-978 at the four sizes. Between the title's bottom edge (382 at 360x640) and the
wheel's top edge (490 at 393x852) there are only 108 plate px. Beside the wheel there are only 95 px at 393x852. So no
face zone of a sensible size can avoid the box. Passing the audit as written would need the men at about half size.

What the v3 League plate does guarantee is measured on pixels. `swapcheck.cjs` compares the screen as shown with the
plate alone (all UI hidden), inside each zone and inside the unpadded face box:

| Size | V2: changed px in Daniel's / Nik's face box | v3: changed px in the face boxes | v3: changed px in the padded zones |
| --- | --- | --- | --- |
| 393x852 | 5,778 / 3,645 | 0 / 0 | 146 (max diff 74 of 255) / 44 (max diff 22): faint wheel drop-shadow at the zone's inner bottom corner |
| 393x660 | 510 / 67 | 0 / 0 | 0 / 0 |
| 375x667 | 37 / 0 | 0 / 0 | 0 / 0 |
| 360x640 | 1 / 0 | 0 / 0 | 455 / 558: the title box edge in the top 2.5 px of each zone |

These are device pixels at 2x. No UI pixel lands on either face at any size. The padding catches a faint shadow or
edge at two sizes. Clearing that too is not possible: Nik cannot shrink below 0.806, or his zone leaves the visible
picture at 393x852, given that his arm must stay cut by the frame. Making the League screen pass the audit needs one
of two Team G changes: hit-test the round wheel as a circle, or make the wheel smaller.

## Visual judgement (honest)

The full plates are in `shots/PLATES_V2_V3.jpg`.

- **Standings, Rivalry:** no visible change apart from the move. The top band stretch is in plain dark sky and roof.
- **Trophy Room:** the men are untouched, apart from the uniform 0.885 shrink, and the corridor reads naturally.
  - The far doorway and plants between the heads are wider, and the stair lights are stretched into wider glows.
    That area is under the spotlight in the app.
  - The bottom ~380 rows are a vertical stretch of the floor, up to 3x. The marble veins and reflections there are
    elongated and softer than in V2. In the app this is under the buttons and tab bar, apart from the 393x852 gap
    between the shelf and BACK, which shows the shoes and the pedestal base, mostly unstretched.
- **League:** this is the weakest of the four.
  - The stadium crowd between the men is stretched horizontally, up to 3.2x between their chests, so the crowd and
    flags look smeared there. The truss above Nik's head bends into the stretched part. All of this is under the
    wheel in the app.
  - The PatchMatch spots at the frame edges are dark, out-of-focus stadium and read as bokeh.
  - The podium is 32% larger than in V2.
  - No halos are visible around the mattes at 100%.
  - At 393x852 the screen edge crops Daniel's hair slightly. His face zone touches the visible edge.

## Rebuild

```
python3 tools/shift_plates.py visual-assets/v10_1/plates-v2 OUT                 # Standings, Rivalry
python3 tools/mattes.py tools TROPHY_ROOM <V2 plate> <u2net home> OUT/mat/TROPHY_ROOM   # needs rembg + pymatting
python3 tools/mattes.py tools LEAGUE <V2 plate> <u2net home> OUT/mat/LEAGUE
python3 tools/tr_warp.py <V2 TR plate> OUT/mat OUT
python3 tools/lg_compose.py <V2 League plate> OUT/mat OUT
python3 tools/zones_v3.py <V2 zones> OUT <yunet onnx> transforms.json PHONE_FACE_ZONES_V3.json tools/probe.json
```

- Re-running these scripts on the same mattes rebuilds byte-identical plates. The mattes are not committed; they are
  float arrays of about 10 MB each.
- `fit.py` and `tools/probe.json` hold the clearance model used to place the faces. `probe.cjs` measured the UI boxes
  at the four sizes on 6dbd740b.
- The League clearance in `fit.py` models the wheel as its painted disc, not as the audit's square box.
- `swapcheck.cjs` runs from the gameplay worktree root:
  `node swapcheck.cjs <plate dir> V3 PHONE_FACE_ZONES_V3.json <shot dir>`, with `CMS_BASE_URL` and
  `CMS_CHROMIUM_PATH` set.

## Shots

- `shots/BEFORE_AFTER_<KEY>_393x852.png`: V2 on the left, v3 on the right, with the zones drawn in cyan. The single
  shots are `V2_*` and `V3_*`.
- `shots/CONTACT_V3_4SIZES.jpg`: the four screens at 393x852, 393x660, 375x667 and 360x640, with the zones.
- In all the shots, the old phone art is hidden and the plate is drawn cover / centre top behind the screen's UI.
