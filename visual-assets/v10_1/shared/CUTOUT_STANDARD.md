# Character cut-out standard

Factory job 14. Cut-outs reuse the approved plate pixels so a hand, sleeve or figure can sit in front of live UI. The plate and overlays must stay registered; never mirror either manager.

## Existing tools inspected

| Tool | Inputs | Edge handling | Outputs and registration |
| --- | --- | --- | --- |
| `league/tools/make_finger_overlay.py` | League RGB PNGs at 1536 × 864 and 3072 × 1728; hard-coded 22-point Daniel sleeve/finger polygon in 1X plate coordinates | Polygon rasterised at 4×, reduced with Lanczos; Gaussian radius 0.75 px at 1X and 1.5 px at 2X (declared feather width 1.5/3 px). No colour refinement, erosion or fringe decontamination. | Cropped straight-alpha RGBA: 120 × 90 at 1X, 240 × 180 at 2X. Origin (440, 410) at 1X; bottom/right exclusive bounds (560, 500). Writes `OVL_DANIEL_FINGER_V1_{1X,2X}.png` and `evidence/finger_overlay.json`. |
| `club/tools/make_hand_masks.py` | Club 1536 × 864 plate and four search windows; pack boxes from `club/assets/platemap.json` | OpenCV HSV/skin threshold, close 5×5, largest connected component, fill holes, dilate 3 px then another 1 px for contour; approximate polygon at 0.8 px. These margins deliberately cover skin/glow. No feather or colour decontamination. | `club/assets/handmap.json`, four polygons in 1X plate pixels. Runtime clips duplicate full plate layers, rather than exporting a raster overlay. Optional debug PNG at full plate size. Tool needs OpenCV; the new shared tool needs only Pillow and NumPy. |

Existing Club hand bounds: Daniel top (224,284)–(396,376), Daniel side (514,448)–(584,572); Nik top (1114,282)–(1286,376), Nik side (940,458)–(1014,586). Daniel remains on the left, Nik on the right.

## Existing map caveat

The League `assets/platemap.json` contains `protected_boxes.hand_daniel` = [330,410,560,500], not a finger polygon. A protected box is a registration/safety boundary, not a silhouette. The existing 22-point finger contour is in `make_finger_overlay.py`. The validation will use that exact contour, bounded by the map's hand box, without changing either reference file or inventing a rectangular finger.

## Shared tool

`shared/tools/cutout.py` uses only Pillow and NumPy. It rasterises at 4×, refines a ±2 px band using nearby foreground/background means, erodes 1 px and applies a 1 px Gaussian feather. Colours are compared in linear light. Colour decisions in the ±2 px band are blended conservatively (80% geometry, 20% local colour), smoothed by 0.35 px and rethresholded to prevent skin/gold/pinstripe noise from making a jagged silhouette. Low-contrast edges keep the polygon geometry; this is an edge refiner, not an automatic segmentation model.

Fringe recovery treats plate pixels as a flattened foreground/background mixture. It estimates the original coverage, recovers straight foreground colour and pulls it toward the local interior colour. It never divides straight RGB by the newly feathered output alpha. Opaque interior pixels stay unchanged; fully transparent RGB is zero. PNG outputs use straight alpha; resizing uses Pillow's premultiplied RGBA resampling to avoid dark seams.

Both outputs are full plate canvases, with transparent space outside the cut-out. At 1X they have the plate's logical width/height; at 2X both dimensions double. Coordinates always remain 1X. Prefer the genuine 2X source with `--source-scale 2`; a 1X source can also produce 2X but adds no image detail. The tool prints JSON with each output's pixel size, exclusive alpha bounding box and SHA-256.

Select a nested JSON key with `--map <platemap.json> --key <dot.path>`. The value may be one polygon, a list of polygons (union), or an object with `polygon`/`polygons`. `--polygon '<JSON>'` or `--polygon @file.json` also works. When both are supplied, the selected map key must be a bounding box constraining the supplied contour. A box alone is rejected because it is not a silhouette.

Validation rejects out-of-bounds/nonfinite/degenerate points, wrong map sizes, non-PNG masters, empty masks and contours too thin to refine. Review skin, hair and dark suit separately; for hair, `--erode 0 --feather 1.5` preserves more of the soft edge. Defaults remain 1 px erosion/feather for firm silhouettes.

`--rim` additionally exports `_RIM_1X.png` and `_RIM_2X.png`, the white outer alpha band (`dilate(alpha, 3 px) − alpha`, scaled to 6 px at 2X). Same full canvas and registration as the cut-out. Opaque interiors have zero rim alpha. This is a neutral lighting mask, not baked gold. CSS selects the light-facing side and tints it; never light the full perimeter uniformly.


## League regression test (factory step 4)

Source: `league/assets/ENV_LEAGUE_PLATE_V1_2X.png`, SHA-256 `25a71a8ad91ba27a3a6127e23f0eda4c628fccf75f7e906817f0f3710e66581f`. Polygon: original `POLY` in `league/tools/make_finger_overlay.py`, selected map bounds `protected_boxes.hand_daniel`. Existing cropped 2X overlay was pasted at (880,820) onto a transparent 3072 × 1728 canvas before comparing. Neither plate, map nor League overlay changed.

`evidence/cutout_test.png` compares a (856,800)–(1096,1024) crop of both 2X layers. Every 2X pixel displays as 2 × 2 pixels with nearest sampling: exactly 400% of logical 1X. Black, light neutral and warm glass backgrounds expose matte rings; alpha masks show the silhouette separately. The warm highlights along the sleeve/skin already exist in the approved plate and remain present.

| Measurement | Before | After |
| --- | --- | --- |
| Alpha MAE over nonzero union, 0–255 | reference | 14.3915 |
| 50% alpha intersection / union | reference | 0.942709 |
| Signed alpha mean difference over union, 0–255 | reference | −13.1959 |
| Mean alpha gradient in 10–90% edge band, per 2X pixel | 0.190149 | 0.148286 |
| Estimated 10–90% transition width, logical px | 2.0471 | 2.6820 |

Edge measurements use the sleeve/finger boundary ROI (994,840)–(1090,982) at 2X, excluding artificial left/top/bottom crop seams. Width is partial-alpha pixel count / sum of gradient magnitude / 2: a comparative estimate, not a universal edge-width specification. The new 1 px Gaussian radius is deliberately softer than the old tool's 0.75 px radius. Erosion reduces coverage; this is not pixel-identical alpha and does not claim sharper edges. Visual review at 400% finds no additional light/dark matte ring or coloured speckle around the finger. Straight crop-boundary edges must sit over the same plate, not cross a UI panel.

Synthetic flattened-colour test: an antialiased warm disk on a pale background reduced fringe RGB error against known foreground from 74.40 to 16.25 (Euclidean sRGB distance), with opaque interior RGB unchanged and fully transparent RGB zero. This verifies colour recovery independently of the League visual comparison. Disjoint polygons and invalid/nonfinite/degenerate inputs also checked.

| Test output | Size | Alpha bbox (exclusive) | SHA-256 |
| --- | --- | --- | --- |
| `OVL_LEAGUE_DANIEL_FINGER_V1_1X.png` | 1536 × 864 | [438,408,537,502] | `7a2b3e3519e5d0a5979e07c39e064894a9e5f88e01cb6c691fe519d133b54347` |
| `OVL_LEAGUE_DANIEL_FINGER_V1_2X.png` | 3072 × 1728 | [877,817,1074,1003] | `b72ab5640d7d237cdfb9daf015454c080c0975a1fb77c14127e389f867b64ee4` |
| `OVL_LEAGUE_DANIEL_FINGER_V1_RIM_1X.png` | 1536 × 864 | [435,405,540,505] | `95d89c2a1ae6e4ba501a863215771655e7b03b15a620e4e481c4e7a19fd10e1d` |
| `OVL_LEAGUE_DANIEL_FINGER_V1_RIM_2X.png` | 3072 × 1728 | [871,811,1080,1009] | `5d44d4ef53ad824bf7eb3fddde7ab8d238a04d218465a1a0cc61046b5c6e4c94` |

Generated test layers are temporary; only the job-named compare PNG is committed. Evidence PNG SHA-256: `b7a496105a9800bae5e1a48a06f2c332e7f1b433b416c35146c7201d1fa98c18`.
