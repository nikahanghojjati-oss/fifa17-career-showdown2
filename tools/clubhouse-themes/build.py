#!/usr/bin/env python3
"""R99-01 clubhouse themes (Nik 2026-11-23): Silver and Black Metal copies of the 2D room plates.

The rooms are Team V's handcrafted plates (visual-assets/v10_1/plates-hc). Daniel and Nik are painted into most of them, so
a theme is a recoloured copy of each plate: the room (wood, walls, desk, floor) changes colour, and the two managers stay
pixel for pixel as they are. Each manager is held out by a soft cut-out mask (masks/<master>.png, made once with rembg's
birefnet-portrait model, see make_masks.sh); each plate size uses the mask of its composition, resized. The stadium seen
through a window keeps its night colours (PROTECT rectangles, as fractions of the picture). Lamps and brass glow keep their
warm light. Green (the pitch) and blue keep their colour.

  python3 tools/clubhouse-themes/build.py            # writes plates-hc/silver/*.webp and plates-hc/black/*.webp
  python3 tools/clubhouse-themes/build.py NAME ...   # only those plates (file names without .webp)

Needs Pillow and numpy only. The output names keep each source's _V<n> generation (F9c pins their bytes).
"""
import os, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
SRC = os.path.join(ROOT, "visual-assets", "v10_1", "plates-hc")
MASKS = os.path.join(os.path.dirname(__file__), "masks")
THEMES = ("silver", "black")

# The plates that have a themed copy: every in-use room plate (the V2 generations are no longer drawn anywhere).
def plates():
    names = []
    for f in sorted(os.listdir(SRC)):
        if f.endswith(".webp") and (f.startswith("ENV_") or f.startswith("TILE_")) and "_HC_V2" not in f:
            names.append(f[:-5])
    return names

# Rooms with no manager in them: no mask.
NO_HEROES = ("ENV_CLUB_", "ENV_SLAB_", "TILE_", "ENV_BOX_PHONE_HC_V4", "ENV_BOX_SIDEWAYS_HC_V4")

def mask_master(name):
    """The mask that fits this plate's composition (desktop sizes share the 1920 cut, phone sizes the full phone cut)."""
    if name.startswith(NO_HEROES):
        return None
    base = name
    for suffix in ("_590W", "_1X", "_2X", "_1920"):
        if base.endswith(suffix):
            base = base[: -len(suffix)]
    if "_PLATE_" in base:
        base += "_1920"
    return base

# Night stadium seen through glass: kept as it is (left, top, right, bottom as fractions). Longest matching prefix wins.
PROTECT = {
    "ENV_HOME_PLATE": [(565 / 1920, 140 / 1080, 1545 / 1920, 700 / 1080), (1712 / 1920, 140 / 1080, 1, 700 / 1080)],
    "ENV_HOME_PHONE": [(20 / 590, 180 / 1049, 1, 385 / 1049)],
    "ENV_BOX_PLATE": [(0.16, 0.04, 0.84, 0.62)],
    "ENV_BOX_PHONE_HC_V3": [(0.08, 0.17, 0.92, 0.52)],
    "ENV_BOX_PHONE_HC_V4": [(0.08, 0.17, 0.92, 0.52)],
    "ENV_BOX_PHONE_HC_V3_TALL": [(0.07, 0.13, 0.93, 0.42)],
    "ENV_BOX_PHONE_HC_V4_TALL": [(0.07, 0.13, 0.93, 0.42)],
    "ENV_BOX_SIDEWAYS": [(0.16, 0.0, 0.84, 0.65)],
    "ENV_CLUB_PLATE": [(0.15, 0.08, 0.85, 0.32)],
    "ENV_CLUB_PHONE": [(0.0, 0.10, 1.0, 0.40)],
    "ENV_CLUB_SIDEWAYS": [(0.0, 0.14, 0.62, 0.52)],
    "ENV_COACHES_PLATE": [(0.22, 0.04, 0.78, 0.56)],
    "ENV_COACHES_PHONE_HC_V3": [(0.04, 0.18, 0.15, 0.37), (0.38, 0.18, 0.68, 0.37), (0.87, 0.18, 1.0, 0.37)],
    "ENV_COACHES_PHONE_HC_V3_TALL": [(0.02, 0.135, 0.14, 0.29), (0.22, 0.135, 0.60, 0.29), (0.78, 0.135, 0.98, 0.29)],
    "ENV_OFFICE_PLATE": [(0.235, 0.0, 0.80, 0.47)],  # the glass only (the wood panel left of it and the olive tree follow the theme)
    "ENV_OFFICE_PHONE": [(0.10, 0.09, 0.96, 0.31)],
    "ENV_TUNNEL_PLATE": [(0.42, 0.30, 0.58, 0.56)],
    "ENV_TUNNEL_PHONE": [(0.36, 0.20, 0.66, 0.34)],
}

def smooth(x, a, b):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)

def protect_mask(name, size):
    keys = [k for k in PROTECT if name.startswith(k)]
    m = Image.new("L", size, 0)
    if keys:
        d = ImageDraw.Draw(m)
        for a, b, c, e in PROTECT[max(keys, key=len)]:
            d.rectangle([a * size[0], b * size[1], c * size[0], e * size[1]], fill=255)
    return np.asarray(m.filter(ImageFilter.GaussianBlur(max(2, size[0] / 640))), np.float32) / 255

def hero_mask(name, size):
    master = mask_master(name)
    if not master:
        return np.zeros(size[::-1], np.float32)
    m = Image.open(os.path.join(MASKS, master + ".png")).convert("L").resize(size, Image.LANCZOS)
    m = m.filter(ImageFilter.GaussianBlur(0.8 * size[0] / 1920))
    return np.asarray(m, np.float32) / 255

def recolor(rgb, keep_out, theme):
    a = rgb.astype(np.float32) / 255
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    mx, mn = a.max(-1), a.min(-1)
    L = 0.2126 * r + 0.7152 * g + 0.0722 * b
    sat = np.where(mx > 1e-4, (mx - mn) / np.maximum(mx, 1e-4), 0)
    d = np.maximum(mx - mn, 1e-6)
    h = np.where(mx == r, ((g - b) / d) % 6, np.where(mx == g, (b - r) / d + 2, (r - g) / d + 4)) * 60
    keep_colour = (smooth(h, 70, 90) * (1 - smooth(h, 250, 270))) * smooth(sat, 0.25, 0.4) * smooth(L, 0.04, 0.1)  # pitch green, blue
    glow = smooth(L, 0.55, 0.8) * smooth(sat, 0.25, 0.5)  # lamps, brass highlights
    w = (1 - keep_colour) * (1 - glow) * (1 - keep_out)
    if theme == "silver":
        nl = 0.22 + 0.74 * np.power(np.clip(L, 0, 1), 0.55)
        tint = np.array([0.97, 0.99, 1.03], np.float32)
    else:
        nl = 0.02 + 0.92 * np.power(np.clip(L, 0, 1), 1.08)
        tint = np.array([0.96, 0.99, 1.05], np.float32)
    target = np.clip(nl[..., None] * tint, 0, 1)
    out = a * (1 - w[..., None]) + target * w[..., None]
    return (np.clip(out, 0, 1) * 255 + 0.5).astype(np.uint8)

def build(name):
    src = Image.open(os.path.join(SRC, name + ".webp")).convert("RGB")
    keep_out = np.maximum(hero_mask(name, src.size), protect_mask(name, src.size))
    rgb = np.asarray(src)
    for theme in THEMES:
        out_dir = os.path.join(SRC, theme)
        os.makedirs(out_dir, exist_ok=True)
        Image.fromarray(recolor(rgb, keep_out, theme)).save(os.path.join(out_dir, name + ".webp"), quality=90, method=6)
    print("built", name, src.size)

def build_tile():
    """The panel marble (css/r78-marble-tile.webp, black with gold veins): the warm black turns neutral metal black, the gold
    veins stay. One tile serves both themes (the panels stay dark in Silver too)."""
    src = Image.open(os.path.join(ROOT, "css", "r78-marble-tile.webp")).convert("RGB")
    a = np.asarray(src).astype(np.float32) / 255
    L = 0.2126 * a[..., 0] + 0.7152 * a[..., 1] + 0.0722 * a[..., 2]
    keep = smooth(L, 0.07, 0.14)  # the veins
    out = recolor(np.asarray(src), keep, "black")
    Image.fromarray(out).save(os.path.join(ROOT, "css", "r78-marble-tile-metal.webp"), quality=88, method=6)
    print("built css/r78-marble-tile-metal.webp")

if __name__ == "__main__":
    names = sys.argv[1:]
    if not names or "tile" in names:
        build_tile()
    for n in [x for x in names if x != "tile"] or (plates() if not names else []):
        build(n)
