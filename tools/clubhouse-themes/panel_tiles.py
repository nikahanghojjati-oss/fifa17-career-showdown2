#!/usr/bin/env python3
"""The panel marble of each premium clubhouse (css/r78-marble-tile-<theme>.webp, 256 px, tiled behind every panel), cut from
that clubhouse's own painted material slab (plates-hc/<theme>/TILE_SLAB_HC_V1_512.webp), so panels show the clubhouse's stone,
never the old shared metal grade (Nik 2026-11-25: only the premium versions, for every material).
Metallic Black keeps its slab as painted (near-black granite). Platinum and Premium Matte Black press the slab's veins into a
dark band so light text on the panels keeps its contrast: Platinum a grey marble with darker veins, Matte a graphite slate.
Run after paint.py; then manifest.py."""
import os
import numpy as np
from PIL import Image
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
SLAB = os.path.join(ROOT, "visual-assets", "v10_1", "plates-hc", "%s", "TILE_SLAB_HC_V1_512.webp")
BAND = {"silver": ((0x17, 0x19, 0x1c), (0x36, 0x39, 0x3e)), "matte": ((0x18, 0x19, 0x1b), (0x34, 0x35, 0x38)), "black": None}

def tile(theme):
    img = Image.open(SLAB % theme).convert("RGB").resize((256, 256), Image.LANCZOS)
    if BAND[theme] is None: return img
    s = np.asarray(img, float); L = s.mean(-1)
    lo, hi = np.percentile(L, 1), np.percentile(L, 99); n = np.clip((L - lo) / (hi - lo), 0, 1)
    base, top = (np.array(c, float) for c in BAND[theme])
    return Image.fromarray((base + (top - base) * n[..., None]).clip(0, 255).astype("uint8"))

if __name__ == "__main__":
    for theme in BAND:
        dest = os.path.join(ROOT, "css", f"r78-marble-tile-{theme}.webp")
        tile(theme).save(dest, "WEBP", quality=90)
        print("built", os.path.relpath(dest, ROOT), os.path.getsize(dest), "bytes")
