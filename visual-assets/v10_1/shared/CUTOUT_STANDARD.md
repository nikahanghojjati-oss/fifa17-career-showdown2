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


## Drawing contours

1. Work on the approved 1X plate, at 200–400% zoom. Draw clockwise around the inside edge of the part crossing the UI, generally 10–40 points. Add points at bends, fingertips and wrist/sleeve transitions; avoid one point for every image pixel.
2. Keep Daniel left, Nik right. Never mirror, rotate, repaint a face or use unrelated imagery. Separate disconnected pieces into multiple polygons in the same key; the tool unions them.
3. Stay just inside the bright background fringe, without cutting away fingertips. The default erosion removes another 1 logical pixel. Hair needs a soft contour: retain the wisps within the polygon, use `--erode 0 --feather 1.5`, then review it independently. A hand-tuned polygon tool cannot reconstruct missing hair or details.
4. Close a partial cut-out inside the figure, where the underlying plate remains visible. Those artificial closing edges must never sit over an opaque UI object: expand the contour/part if they would. A crop-boundary cut across a sleeve is acceptable only when it is concealed by the same registered plate.
5. Store the points as `cutouts.<part>.polygon` or `cutouts.<part>.polygons` in that screen's map when the screen job owns it. Use 1X pixel units and preserve the map's `plate_1x_size`. Avoid protected face boxes; they are safety bounds, not cut-out silhouettes.
6. Test on black, warm panel glass and a neutral light diagnostic background at 100%, 200% and 400%. Reject bright/dark matte rings, colour speckles, jagged tips or registration seams. Reduce rim strength if it reads as an outline.

Example map entry:

```json
{
  "plate_1x_size": [1536, 864],
  "cutouts": {
    "daniel_arm": {"polygon": [[440,410],[505,410],[516,442],[535,455],[516,466],[505,500],[440,500]]},
    "two_parts": {"polygons": [[[20,20],[70,20],[70,80],[20,80]], [[90,20],[120,20],[120,80],[90,80]]]}
  }
}
```

These schematic points illustrate the schema; trace the actual figure instead of using them as approved art.

## Naming and running

Use `OVL_<SCREEN>_<PART>_V1_{1X,2X}.png`, with matching `OVL_<SCREEN>_<PART>_V1_RIM_{1X,2X}.png` when requested. Example part: `DANIEL_FINGER`. Version the asset when the approved contour changes. Give `--output` the stem without the density suffix; a final `.png` is optional. PNGs are lossless masters; convert runtime layers to transparent WebP in the consuming screen job and measure its page budget.

```sh
python3 visual-assets/v10_1/shared/tools/cutout.py \
  --plate visual-assets/v10_1/league/assets/ENV_LEAGUE_PLATE_V1_2X.png \
  --source-scale 2 \
  --map /path/to/screen/platemap.json --key cutouts.daniel_arm \
  --output /tmp/OVL_LEAGUE_DANIEL_ARM_V1 --rim
```

Exact League test reproduction, run from repository root (only temporary files are created):

```python
import ast, json, subprocess, sys, tempfile
from pathlib import Path

league = Path("visual-assets/v10_1/league")
source = ast.parse((league / "tools/make_finger_overlay.py").read_text())
polygon = next(ast.literal_eval(node.value) for node in source.body
               if isinstance(node, ast.Assign)
               and isinstance(node.targets[0], ast.Name)
               and node.targets[0].id == "POLY")
with tempfile.TemporaryDirectory() as temp:
    temp = Path(temp)
    contour = temp / "finger.json"
    contour.write_text(json.dumps(polygon))
    subprocess.run([
        sys.executable, "visual-assets/v10_1/shared/tools/cutout.py",
        "--plate", str(league / "assets/ENV_LEAGUE_PLATE_V1_2X.png"),
        "--source-scale", "2", "--map", str(league / "assets/platemap.json"),
        "--key", "protected_boxes.hand_daniel", "--polygon", "@" + str(contour),
        "--output", str(temp / "OVL_LEAGUE_DANIEL_FINGER_V1"), "--rim"
    ], check=True)
    # Inspect/use files here before this temporary directory is removed.
```

The JSON output reports actual alpha bbox, not a CSS placement offset. Full-canvas overlays must be placed at (0,0) within the scene. The old cropped League overlay needed a (440,410) offset; applying that offset to the new full canvas would misalign it.

## CSS placement and lighting

Use one scene container for plate, UI and cut-outs. The container applies the cover scale/crop/translation once; every raster then fills it exactly. Do not give the overlay a different `object-fit`, focal point or transform. This example is a 1536 × 864 (16:9) plate; use the actual aspect ratio for other plates.

```html
<div class="screen">
  <div class="scene">
    <img class="plate" src="ENV_LEAGUE_PLATE_V1_2X.webp" alt="">
    <div class="ui"><!-- Real semantic controls at mapped scene positions --></div>
    <span class="contact" aria-hidden="true"></span>
    <img class="cutout" src="OVL_LEAGUE_DANIEL_FINGER_V1_2X.webp" alt="" aria-hidden="true">
    <span class="rim" aria-hidden="true"></span>
  </div>
</div>
```

```css
/* .screen gets its size from the screen layout, above any phone bottom bar. */
.screen { position: relative; width: 100%; height: 100%; overflow: hidden; container-type: size; }
.scene {
  position: absolute; left: 50%; top: 50%;
  width: max(100cqw, calc(100cqh * 16 / 9)); aspect-ratio: 16 / 9;
  transform: translate(-50%, -50%); isolation: isolate;
}
.plate, .cutout, .rim { position: absolute; inset: 0; width: 100%; height: 100%; }
.plate { z-index: 0; }
.ui { position: absolute; inset: 0; z-index: 2; }
.cutout { z-index: 3; pointer-events: none; }
.rim {
  z-index: 4; pointer-events: none; opacity: .4;
  background: linear-gradient(110deg, transparent 30%, #ffd34d 70%, transparent 95%);
  -webkit-mask: url("OVL_LEAGUE_DANIEL_FINGER_V1_RIM_2X.webp") center / 100% 100% no-repeat;
  mask: url("OVL_LEAGUE_DANIEL_FINGER_V1_RIM_2X.webp") center / 100% 100% no-repeat;
}
/* Example fingertip contact on the live wheel, mapped to the plate. */
.contact {
  position: absolute; z-index: 2; pointer-events: none;
  left: 34.1%; top: 53.1%; width: 1.0%; height: .65%;
  border-radius: 50%; background: rgb(0 0 0 / .4);
  transform: translate(1px, 2px); filter: blur(3px);
}
```

The contact example is a starting position; confirm it against the live wheel edge and finger, and place it above the wheel but below the cut-out. A sleeve/panel contact uses 6–14 logical px blur at 35–50% black, offset away from the key light. A fingertip contact uses 2–4 px. Scale these values with the scene scale so contact stays consistent across desktop sizes. The rim's mask occupies a 3 px outer band; make its visible glow only 1–3 px and fade the side facing away from the stadium lights. Never let lighting conceal a bad cut-out. Light gradients are authored for each scene, not chosen by the tool.

On phone, retain Daniel first/left and Nik second/right and use the phone plate's own contour/map. Do not place a desktop overlay over a separately recropped phone plate; if character staging changes, make new phone overlays and keep each character's art unmirrored. Screen QA still checks no scrolling, readable controls and weight independently.
