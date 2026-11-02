#!/usr/bin/env python3
"""One-time cut-out of the real Marco Reus photo (HO-030, r78).

Makes source/reus_alpha.png: an 8-bit alpha matte, same size as the photo
(900x1520). make_loading.py uses this matte, so rebuilding the two loading
images needs only Pillow + numpy. Re-run this only if the matte must change.

Needs: pip install rembg pymatting scipy  (rembg downloads its isnet model once)
The photo pixels are never changed here; only the matte is written.
"""
import sys
from pathlib import Path
import numpy as np
from PIL import Image
from scipy import ndimage

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[3]
PHOTO = REPO / "assets" / "marco-reus-2015-cc-by.webp"   # from main
OUT = HERE / "source" / "reus_alpha.png"


def main(photo=PHOTO):
    from rembg import remove, new_session
    from pymatting import estimate_alpha_cf

    im = Image.open(photo).convert("RGB")
    rgb = np.asarray(im).astype(np.float64) / 255.0
    # Two segmentations; keep what both agree on as sure foreground.
    a = np.asarray(remove(im, session=new_session("isnet-general-use"), only_mask=True)).astype(np.float64) / 255
    b = np.asarray(remove(im, session=new_session("u2net_human_seg"), only_mask=True)).astype(np.float64) / 255
    seg = np.maximum(a, b * 0.98)
    fg = ndimage.binary_erosion(np.minimum(a, b) > 0.9, iterations=5)
    bg = ndimage.binary_erosion(seg < 0.1, iterations=5)
    trimap = np.full(seg.shape, 0.5)
    trimap[fg] = 1.0
    trimap[bg] = 0.0
    alpha = estimate_alpha_cf(rgb, trimap)
    alpha = np.clip(alpha, 0, 1)
    # Drop specks away from the body.
    lab, n = ndimage.label(alpha > 0.5)
    if n > 1:
        sizes = ndimage.sum(np.ones_like(alpha), lab, range(1, n + 1))
        keep = 1 + int(np.argmax(sizes))
        body = ndimage.binary_dilation(lab == keep, iterations=12)
        alpha = alpha * body
    OUT.parent.mkdir(parents=True, exist_ok=True)
    Image.fromarray((alpha * 255 + 0.5).astype(np.uint8), "L").save(OUT, optimize=True)
    print("wrote", OUT)


if __name__ == "__main__":
    main(Path(sys.argv[1]) if len(sys.argv) > 1 else PHOTO)
