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

Implementation, validation and usage are added in the following job steps.
