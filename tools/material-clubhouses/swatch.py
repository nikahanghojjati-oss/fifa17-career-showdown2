#!/usr/bin/env python3
"""P3 (Duet): cut the people-free phone swatches from a clubhouse's finished desktop paintings, and stage the phone Image 1 PNGs.

  python3 tools/material-clubhouses/swatch.py <key>      (run from the repo root)

Method (job file, V worker step 7; B7's cut_swatch): full height at the widest mask-free column run of
masks/ENV_<ROOM>_PLATE_HC_V3_1920.png, 12 px in from each side, x1.6, WebP q90. CLUB and LOADING have no men and no
mask, so they use the strips Team G cut for Matte (matched on the Matte swatches): CLUB x 0..1104 of the 3072 painting,
LOADING the right wall x 2624..3840 of the 3840 painting scaled to 1728 high, and CLUB_MAT the materials-only strip
x 560..1050 and LOADING_MAT, a 620x730 close-up of the left wall with no lamp (Team V lessons HO-140 and HO-160:
the Club and Loading phones take a strip with no objects or lamps, or Astra copies its layout).
Writes <key>/REF_<ROOM>_<LOOK>_SWATCH.webp (the record) and src/IMG2_REF_<ROOM>_<LOOK>_SWATCH.png (what Nik attaches),
and src/IMG1_ENV_<ROOM>_PHONE_*.png from the Wooden phone plates.
"""
import os, sys
import numpy as np
from PIL import Image

ROOMS = ["HOME", "BOARD", "OFFICE", "HALL", "ARCHIVE", "BOX", "COACHES", "TUNNEL", "CLUB", "LOADING"]
MASKS = "tools/clubhouse-themes/masks/"
HC = "project-documents/hc-art/material-clubhouses/"
PHONE = {r: f"visual-assets/v10_1/plates-hc/ENV_{r}_PHONE_HC_V3.webp" for r in ROOMS}
PHONE["CLUB"] = "visual-assets/v10_1/plates-hc/ENV_CLUB_PHONE_HC_V4.webp"
PHONE["LOADING"] = "assets/loading/ENV_LOADING_PHONE_HC.webp"


def run(room):
    m = np.asarray(Image.open(f"{MASKS}ENV_{room}_PLATE_HC_V3_1920.png").convert("L")) > 128
    col = m.any(0); best = (0, 0, 0); s = None
    for x, c in enumerate(list(col) + [True]):
        if not c and s is None: s = x
        if c and s is not None:
            if x - s > best[0]: best = (x - s, s, x)
            s = None
    _, a, b = best
    return round((a + 12) * 1.6), round((b - 12) * 1.6)


def main():
    key = sys.argv[1].lower(); LOOK = key.upper()
    out, src = f"{HC}{key}/", f"{HC}src/"
    cuts = {}
    for room in ROOMS:
        p = Image.open(f"{out}ENV_{room}_PLATE_{LOOK}_P1_2X.webp").convert("RGB")
        if room == "CLUB":
            cuts["CLUB"] = p.crop((0, 0, 1104, 1728)); cuts["CLUB_MAT"] = p.crop((560, 0, 1050, 1728))
        elif room == "LOADING":
            cuts["LOADING"] = p.crop((2624, 0, 3840, 2160)).resize((973, 1728), Image.LANCZOS)
            cuts["LOADING_MAT"] = p.crop((60, 700, 680, 1430))
        else:
            a, b = run(room); cuts[room] = p.crop((a, 0, b, 1728))
    for name, im in cuts.items():
        im.save(f"{out}REF_{name}_{LOOK}_SWATCH.webp", quality=90)
        im.save(f"{src}IMG2_REF_{name}_{LOOK}_SWATCH.png")
        print("swatch", name, im.size)
    for room in ROOMS:
        f = PHONE[room]; n = "IMG1_" + os.path.basename(f).replace(".webp", ".png")
        if not os.path.exists(src + n):
            im = Image.open(f).convert("RGB"); im.save(src + n); print("image 1", n, im.size)


if __name__ == "__main__":
    main()
