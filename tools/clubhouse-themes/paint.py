#!/usr/bin/env python3
"""r100 B7 premium clubhouses: build a clubhouse's room plates from Team V's repainted masters (paintings/).

Each painting is Team V's same-composition repaint of the Wooden 2X plate for one clubhouse
(ENV_<ROOM>_PLATE_<SILVER|BLACK|MATTE>_P1_2X.webp, HO-098 onwards). For every size the game uses, this lays the ORIGINAL
Daniel and Nik pixels of the Wooden plate at that size back on top of the painting, through the existing hero mask pulled
in a few px (so the faces stay pixel-identical to Wooden and the edge is the painting's own relit edge), and writes
plates-hc/<theme>/<name>.webp. Painted plates replace the recoloured copies from build.py, which skips them.

  python3 tools/clubhouse-themes/paint.py      # then: python3 tools/clubhouse-themes/pin.py
"""
import os, re
import numpy as np
from PIL import Image, ImageFilter

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
SRC = os.path.join(ROOT, "visual-assets", "v10_1", "plates-hc")
MASKS = os.path.join(os.path.dirname(__file__), "masks")
PAINTINGS = os.path.join(os.path.dirname(__file__), "paintings")
THEME = {"SILVER": "silver", "BLACK": "black", "MATTE": "matte"}
NAME = re.compile(r"^ENV_([A-Z]+)_PLATE_(SILVER|BLACK|MATTE)_P1_2X\.webp$")
PULL_IN = 3      # px at 1920 wide: the hero mask is pulled in this much, so no old wooden edge survives around the men
FEATHER = 0.8    # px at 1920 wide

def painted():
    """(theme, plate name) for every plate size a painting replaces."""
    out = []
    for f in sorted(os.listdir(PAINTINGS)) if os.path.isdir(PAINTINGS) else []:
        m = NAME.match(f)
        if not m: continue
        room, look = m.groups()
        for g in sorted(os.listdir(SRC)):
            if re.match(rf"^ENV_{room}_PLATE_HC_V3_(1920|1X|2X)\.webp$", g):
                out.append((THEME[look], g[:-5], os.path.join(PAINTINGS, f), room))
    return out

def hero_mask(room, size):
    path = os.path.join(MASKS, f"ENV_{room}_PLATE_HC_V3_1920.png")
    m = Image.open(path).convert("L").resize(size, Image.LANCZOS)
    k = max(3, 2 * round(PULL_IN * size[0] / 1920) + 1)
    m = m.filter(ImageFilter.MinFilter(k)).filter(ImageFilter.GaussianBlur(FEATHER * size[0] / 1920))
    return np.asarray(m, np.float32)[..., None] / 255

def build():
    done = []
    for theme, name, painting, room in painted():
        wood = Image.open(os.path.join(SRC, name + ".webp")).convert("RGB")
        paint = Image.open(painting).convert("RGB")
        if paint.size != wood.size: paint = paint.resize(wood.size, Image.LANCZOS)
        m = hero_mask(room, wood.size)
        out = np.asarray(paint, np.float32) * (1 - m) + np.asarray(wood, np.float32) * m
        dest = os.path.join(SRC, theme, name + ".webp")
        Image.fromarray(np.clip(out + .5, 0, 255).astype(np.uint8)).save(dest, quality=90, method=6)
        done.append(os.path.relpath(dest, ROOT))
    return done

if __name__ == "__main__":
    for d in build(): print("painted", d)
