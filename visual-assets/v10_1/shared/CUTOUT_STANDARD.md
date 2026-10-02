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

`shared/tools/cutout.py` uses only Pillow and NumPy. It rasterises at 4×, refines a ±2 px band using nearby foreground/background means, erodes 1 px and applies a 1 px Gaussian feather. Colours are compared in linear light. Low-contrast edges keep the polygon geometry; this is an edge refiner, not an automatic segmentation model.

Fringe recovery treats plate pixels as a flattened foreground/background mixture. It estimates the original coverage, recovers straight foreground colour and pulls it toward the local interior colour. It never divides straight RGB by the newly feathered output alpha. Opaque interior pixels stay unchanged; fully transparent RGB is zero. PNG outputs use straight alpha; resizing uses Pillow's premultiplied RGBA resampling to avoid dark seams.

Both outputs are full plate canvases, with transparent space outside the cut-out. At 1X they have the plate's logical width/height; at 2X both dimensions double. Coordinates always remain 1X. Prefer the genuine 2X source with `--source-scale 2`; a 1X source can also produce 2X but adds no image detail. The tool prints JSON with each output's pixel size, exclusive alpha bounding box and SHA-256.

Select a nested JSON key with `--map <platemap.json> --key <dot.path>`. The value may be one polygon, a list of polygons (union), or an object with `polygon`/`polygons`. `--polygon '<JSON>'` or `--polygon @file.json` also works. When both are supplied, the selected map key must be a bounding box constraining the supplied contour. A box alone is rejected because it is not a silhouette.

Validation rejects out-of-bounds/nonfinite/degenerate points, wrong map sizes, non-PNG masters, empty masks and contours too thin to refine. Review skin, hair and dark suit separately; for hair, `--erode 0 --feather 1.5` preserves more of the soft edge. Defaults remain 1 px erosion/feather for firm silhouettes.

`--rim` additionally exports `_RIM_1X.png` and `_RIM_2X.png`, the white outer alpha band (`dilate(alpha, 3 px) − alpha`, scaled to 6 px at 2X). Same full canvas and registration as the cut-out. Opaque interiors have zero rim alpha. This is a neutral lighting mask, not baked gold. CSS selects the light-facing side and tints it; never light the full perimeter uniformly.
