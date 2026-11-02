# W2 · Cuts Daniel's pointing finger (and the sleeve edge beside it) out of the League plate so it
# can sit ABOVE the live wheel rim. Pixels are the plate's own; only alpha is added.
# The polygon is hand-drawn inside keep_rects[0] = [440,425,560,480] (1X plate px) and deliberately
# stops at Daniel's outline: the goal's old wheel rim / blurred-logo strip that the intake hard-restore
# kept inside hand_daniel (x >= ~508) is NOT part of the overlay, so the new wheel hides it.
# Feather: 1.5 px (Gaussian alpha edge) at 1X, 3 px at 2X.
# Usage (from visual-assets/v10_1/league): python3 tools/make_finger_overlay.py
import json
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

KEEP = (440, 410, 560, 500)  # overlay rect: keep_rects[0] widened to the hand box rows (R2)
# Daniel outline, clockwise, 1X plate px. Top edge = hand box top; right edge follows the sleeve,
# the finger's upper edge, the fingertip and the finger's lower edge; then back down the sleeve.
POLY = [
    (440, 410), (505, 410), (507, 417), (509, 425), (509.5, 432), (510.5, 440.5), (516, 442), (523, 443.5), (529, 446),
    (533, 448.5), (535, 451.5), (535.5, 455), (535, 459), (532, 462.5), (527, 464.5), (516, 465.5),
    (506, 466), (502.5, 468), (503, 480), (504, 487), (505, 500), (440, 500),
]
FEATHER_1X = 1.5


def mask(scale):
    x0, y0, x1, y1 = (v * scale for v in KEEP)
    w, h = x1 - x0, y1 - y0
    # supersample 4x for a clean polygon edge, then feather
    ss = 4
    m = Image.new("L", (w * ss, h * ss), 0)
    ImageDraw.Draw(m).polygon([((x * scale - x0) * ss, (y * scale - y0) * ss) for x, y in POLY], fill=255)
    m = m.resize((w, h), Image.LANCZOS)
    m = m.filter(ImageFilter.GaussianBlur(FEATHER_1X * scale / 2))
    return np.asarray(m).copy()


def main():
    stats = {}
    for scale, tag, src in ((1, "1X", "assets/ENV_LEAGUE_PLATE_V1_1X.png"), (2, "2X", "assets/ENV_LEAGUE_PLATE_V1_2X.png")):
        im = Image.open(src).convert("RGB")
        x0, y0, x1, y1 = (v * scale for v in KEEP)
        rgb = np.asarray(im.crop((x0, y0, x1, y1)))
        a = mask(scale)
        Image.fromarray(np.dstack([rgb, a]), "RGBA").save(f"assets/OVL_DANIEL_FINGER_V1_{tag}.png", optimize=True)
        stats[tag] = {"rect_plate_px": [x0, y0, x1, y1], "alpha_gt_0": int((a > 0).sum()), "alpha_gt_127": int((a > 127).sum())}
    stats["overlay_rect_1x"] = list(KEEP)
    stats["keep_rect_1x_brief"] = [440, 425, 560, 480]
    stats["hand_box_1x"] = [330, 410, 560, 500]
    stats["polygon_1x"] = POLY
    stats["feather_px_1x"] = FEATHER_1X
    json.dump(stats, open("evidence/finger_overlay.json", "w"), indent=1)
    print(json.dumps(stats))


if __name__ == "__main__":
    main()
