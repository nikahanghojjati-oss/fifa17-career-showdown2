#!/usr/bin/env python3
"""Tighten a polygon cut-out to the real person edge (Claude intake tool, 2026-10-03).

cutout.py follows a hand-written polygon, so loose polygons carry bits of banner and
stadium. This keeps the polygon as the "which person" limit, finds the person's real
edge with a human-segmentation model (rembg u2net_human_seg + alpha matting), and
rewrites the cut-out's alpha (and its rim) in place. RGB comes from the plate.

  python3 refine_cutout.py --plate PLATE_2X.png --cutout OVL_X_V1_2X.png [--grow 24]
The matching _1X / _RIM_ files next to it are rebuilt from the refined 2X alpha.
"""
import argparse, os
import numpy as np
from PIL import Image, ImageFilter
from rembg import new_session, remove

ap = argparse.ArgumentParser()
ap.add_argument("--plate", required=True)
ap.add_argument("--cutout", required=True, help="the 2X PNG made by cutout.py")
ap.add_argument("--grow", type=int, default=24, help="px the polygon may grow at 2X")
ap.add_argument("--model", default="u2net_human_seg")
a = ap.parse_args()

plate = Image.open(a.plate).convert("RGB")
cut = Image.open(a.cutout).convert("RGBA")
assert cut.size == plate.size, (cut.size, plate.size)
poly = cut.getchannel("A").point(lambda v: 255 if v > 8 else 0)
limit = poly.filter(ImageFilter.MaxFilter(2 * (a.grow // 2) + 1)).filter(ImageFilter.GaussianBlur(a.grow / 3))
x0, y0, x1, y1 = limit.getbbox()
pad = 40
box = (max(0, x0 - pad), max(0, y0 - pad), min(plate.width, x1 + pad), min(plate.height, y1 + pad))
crop = plate.crop(box)
sess = new_session(a.model)
m = remove(crop, session=sess, only_mask=True, alpha_matting=True,
           alpha_matting_foreground_threshold=235, alpha_matting_background_threshold=20,
           alpha_matting_erode_size=8)
mask = Image.new("L", plate.size, 0); mask.paste(m.convert("L"), box[:2])
alpha = (np.asarray(mask, np.float32) * np.asarray(limit, np.float32) / 255.0).clip(0, 255).astype(np.uint8)
out = plate.convert("RGBA"); out.putalpha(Image.fromarray(alpha))
out.save(a.cutout)
# rim: thin outer band of the new alpha
A = Image.fromarray(alpha)
inner = A.filter(ImageFilter.MinFilter(7))
rim = np.clip(np.asarray(A, np.int16) - np.asarray(inner, np.int16), 0, 255).astype(np.uint8)
rimimg = Image.new("RGBA", plate.size, (255, 255, 255, 0)); rimimg.putalpha(Image.fromarray(rim))
stem = a.cutout[:-len("_2X.png")]
if os.path.exists(stem + "_RIM_2X.png"):
    rimimg.save(stem + "_RIM_2X.png")
    rimimg.resize((plate.width // 2, plate.height // 2), Image.LANCZOS).save(stem + "_RIM_1X.png")
if os.path.exists(stem + "_1X.png"):
    out.resize((plate.width // 2, plate.height // 2), Image.LANCZOS).save(stem + "_1X.png")
print("refined", a.cutout, "bbox", Image.fromarray(alpha).getbbox())
