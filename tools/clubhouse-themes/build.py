#!/usr/bin/env python3
"""R99-01 clubhouse themes (Nik 2026-11-23): Silver, Metallic Black and Premium Matte Black copies of the 2D room plates.

The rooms are Team V's handcrafted plates (visual-assets/v10_1/plates-hc). Daniel and Nik are painted into most of them, so
a theme is a recoloured copy of each plate: the room itself (wood, walls, desk, floor) changes colour, the two managers stay
as they are, and every object in the room (balls, scarves, sofa, books, lamps, trophies... masks/objects, objects.py) keeps
its own colours (Nik 2026-11-23: "coloring goes only to background"). Each manager is held out by a soft cut-out mask (masks/<master>.png, made once with rembg's
birefnet-portrait model, see make_masks.sh); each plate size uses the mask of its composition, resized. The stadium seen
through a window keeps its night colours (PROTECT rectangles, as fractions of the picture). Lamps and brass glow keep their
warm light. Green (the pitch) and blue keep their colour.

  python3 tools/clubhouse-themes/build.py            # writes plates-hc/<theme>/*.webp (silver, black, matte)
  python3 tools/clubhouse-themes/build.py NAME ...   # only those plates (file names without .webp)

Needs Pillow, numpy and scipy. The output names keep each source's _V<n> generation (F9c pins their bytes).
"""
import os, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
SRC = os.path.join(ROOT, "visual-assets", "v10_1", "plates-hc")
MASKS = os.path.join(os.path.dirname(__file__), "masks")
THEMES = tuple(os.environ.get("CMS_THEMES", "silver,black,matte").split(","))

# The plates that have a themed copy: every in-use room plate (the V2 generations are no longer drawn anywhere).
def plates():
    names = []
    for f in sorted(os.listdir(SRC)):
        if f.endswith(".webp") and (f.startswith("ENV_") or f.startswith("TILE_")) and "_HC_V2" not in f:
            names.append(f[:-5])
    return names

# Rooms with no manager in them: no mask.
NO_HEROES = ("ENV_LOADING_", "ENV_CLUB_", "ENV_SLAB_", "TILE_", "ENV_BOX_PHONE_HC_V4", "ENV_BOX_SIDEWAYS_HC_V4")

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
    "ENV_CLUB_PLATE": [(0.15, 0.035, 0.85, 0.32)],  # the whole glass, up to its top frame
    "ENV_CLUB_PHONE": [(0.155, 0.08, 0.845, 0.285)],  # the glass only (the wood pillars beside it follow the theme)
    "ENV_CLUB_PHONE_HC_V4": [(0.02, 0.165, 0.98, 0.42)],
    "ENV_CLUB_SIDEWAYS": [(0.0, 0.14, 0.62, 0.52)],
    "ENV_COACHES_PLATE": [(0.236, 0.04, 0.764, 0.56)],  # the glass only (its frame follows the theme)
    "ENV_COACHES_PHONE_HC_V3": [(0.04, 0.18, 0.15, 0.37), (0.38, 0.18, 0.68, 0.37), (0.87, 0.18, 1.0, 0.37)],
    "ENV_COACHES_PHONE_HC_V3_TALL": [(0.02, 0.135, 0.14, 0.29), (0.22, 0.135, 0.60, 0.29), (0.78, 0.135, 0.98, 0.29)],
    "ENV_OFFICE_PLATE": [(0.235, 0.0, 0.80, 0.47)],  # the glass only (the wood panel left of it and the olive tree follow the theme)
    "ENV_OFFICE_PHONE": [(0.10, 0.09, 0.96, 0.31)],
    "ENV_TUNNEL_PLATE": [(0.42, 0.30, 0.58, 0.56)],
    "ENV_LOADING_PLATE": [(0.436, 0.34, 0.576, 0.57)],
    "ENV_LOADING_PHONE": [(0.33, 0.385, 0.705, 0.575)],
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

OBJECTS = os.path.join(MASKS, "objects")

def object_mask(name, size):
    """The room's objects (objects.py: balls, scarves, sofa, books, lamps, trophies...): they keep their own colours (Nik 2026-11-23)."""
    base = name
    for suffix in ("_590W", "_1X", "_2X", "_1920"):
        if base.endswith(suffix):
            base = base[: -len(suffix)]
    path = os.path.join(OBJECTS, base + ".png")
    if not os.path.exists(path):
        return np.zeros(size[::-1], np.float32)
    # a pixel in from the outline, then a soft edge: no ring of the old brown wall round an object, and no hard cut-out line
    m = Image.open(path).convert("L").resize(size, Image.LANCZOS).filter(ImageFilter.MinFilter(3))
    m = m.filter(ImageFilter.GaussianBlur(max(1.2, 1.6 * size[0] / 1920)))
    return np.asarray(m, np.float32) / 255

# How an object takes the new room's light (Nik 2026-11-23 19:57 UTC: "make sure the object you are cutting matches with
# background color so cutting doesnt look obvious"): it keeps its own colours (a brown ball stays a brown ball), but the warm
# lamp-light cast of the brown room is taken off with the room's own white balance, and its brightness moves part of the way
# to where the room's light puts it (Silver lifts it a little, Metallic Black settles it a little).
HARMONY = {
    # Nik 2026-11-23 21:55 UTC: objects are never painted in the room colour, but "coloring of objects in each theme should
    # still follow that theme coloring scheme": each object keeps its own colours and is graded into the clubhouse's palette,
    # the way a colourist grades one scene: shadows take the clubhouse's shadow colour, highlights its light colour.
    # Silver: cool slate shadows, clean daylight highlights, a little less of the old warm saturation.
    "silver": {"shadow": np.array([0.9, 0.97, 1.1], np.float32), "high": np.array([0.97, 0.99, 1.03], np.float32), "toward": 0.45, "sat": 0.76},
    # Metallic Black: deep steel shadows and warm gold highlights (the house black and gold), colour kept rich.
    "black": {"shadow": np.array([0.92, 0.97, 1.08], np.float32), "high": np.array([1.04, 1.0, 0.92], np.float32), "toward": 0.3, "sat": 0.86},
    # Premium Matte Black (Nik 2026-11-23 23:21 UTC): soft warm-neutral shadows and a candle-warm light, colour a little quieter,
    # the way a matte room lets objects glow softly instead of shine.
    "matte": {"shadow": np.array([0.99, 0.98, 0.99], np.float32), "high": np.array([1.03, 1.0, 0.94], np.float32), "toward": 0.3, "sat": 0.8},
}

# The light of each clubhouse (Nik 2026-11-23 20:15 UTC: "professional lighting and attention to details and coloring for
# each theme"). floor/span/gamma: the tone curve from the painted room's brightness to the new room's; detail: how much of the
# fine texture is put back; tint: the colour of the room's own light (cool daylight on silver, cool steel on black); pool: how
# strong the lamps' warm pools are on the new surfaces.
LIGHT = {
    # Silver (Nik 2026-11-23 21:35 UTC: "looks more like grey than silver"): bright, cool and polished, metal read by its
    # contrast and shine (sheen: the broad light drawn out as a polished wall throws it back; shine: the brightest edges
    # towards white)
    "silver": {"floor": 0.48, "span": 0.58, "gamma": 0.85, "detail": 1.9, "tint": np.array([0.93, 0.97, 1.06], np.float32), "pool": 0.08,
               "contrast": 1.9, "mid": 0.7, "clip": 0.12, "sheen": 0.18, "shine": 0.2,
               "knee": 0.82, "knee_slope": 0.35, "denoise": True, "recess": 0.5},  # no white glare beside the lamps
    # Metallic Black (Nik 2026-11-23 21:47 UTC: "more premium and more metallic and more distinction from current wooden design,
    # don't just darken the room"; 23:21 UTC: "too bright ... supposed to be metallic, not grey or silver"): dark brushed
    # black metal (23:27 UTC: "should not shine like a silver ... or lighten up like a gray or like a white"). The wood's own
    # grain is mostly taken out and a straight brushed grain laid along the panels instead; raised panel edges catch the light as bright bevels; the broad light runs across the metal as a reflection (sheen) while the
    # unlit metal stays deep but never a black hole (sheen_floor, lift); the lamps' warm light is a gold sheen.
    "black": {"floor": 0.014, "span": 0.44, "gamma": 1.2, "detail": 0.3, "clip": 0.04, "bevel": 3.0, "contrast": 1.5, "mid": 0.13,
              "sheen": 0.18, "sheen_floor": -0.5, "brush": 0.2, "tint": np.array([0.99, 0.99, 1.0], np.float32), "pool": 0.24,
              "lift": 0.028, "cap": 0.24, "denoise": True},  # cap: reflections stay black metal, never silver, grey or white
    # Premium Matte Black (Nik 2026-11-23 23:21-23:23 UTC: "premium should feel like a premium design"): soft-touch black,
    # like a matte lacquered or suede-lined room, and the opposite of Metallic Black's finish: where metal has deep blacks and
    # sharp reflections, matte has none. The light is spread evenly across every surface (a narrow tone range lifted off true
    # black), the painted texture kept quiet and fine, only the slowest fall-off of light across the walls, a warm-neutral
    # black (never blue or grey) and the lamps' light as soft candle-warm pools.
    "matte": {"floor": 0.05, "span": 0.17, "gamma": 1.0, "detail": 0.3, "clip": 0.03, "contrast": 1.0, "mid": 0.1,
              "sheen": 0.04, "tint": np.array([1.0, 0.98, 0.955], np.float32), "pool": 0.2, "denoise": True},
    # the panel marble tile (css/r78-marble-tile-metal.webp) keeps the first Metallic Black grade: plain neutral black stone
    "tile": {"floor": 0.018, "span": 0.93, "gamma": 1.06, "detail": 0.35, "tint": np.array([0.96, 0.99, 1.05], np.float32), "pool": 0.28},
}
WARM = np.array([1.0, 0.8, 0.52], np.float32)

def blurred(x, radius):
    """Gaussian blur of a 0-1 float map, done on a smaller copy (the light is soft, so this is exact enough)."""
    from scipy import ndimage
    h, w = x.shape
    f = max(1, int(radius // 6))
    small = np.asarray(Image.fromarray(x.astype(np.float32), "F").resize((max(1, w // f), max(1, h // f)), Image.BILINEAR))
    small = ndimage.gaussian_filter(small, radius / f, mode="nearest")
    return np.asarray(Image.fromarray(small.astype(np.float32), "F").resize((w, h), Image.BILINEAR), np.float32)

def brushed(shape):
    """Brushed-metal grain: fine vertical streaks (along the panels, so the painted grain under them reads as the brushing),
    with a slow change of strength, the same for every build (fixed seed)."""
    from scipy import ndimage
    h, w = shape
    rng = np.random.default_rng(1799)
    n = ndimage.gaussian_filter(rng.standard_normal((h, w)).astype(np.float32), (h / 40, max(0.6, w / 2600)), mode="wrap")
    n /= max(float(n.std()), 1e-6)
    slow = ndimage.gaussian_filter(rng.standard_normal((max(4, h // 16), max(4, w // 16))).astype(np.float32), (6, 2), mode="wrap")
    slow = np.asarray(Image.fromarray(slow / max(float(slow.std()), 1e-6), "F").resize((w, h), Image.BILINEAR), np.float32)
    return n * (0.75 + 0.25 * np.tanh(slow))

def recolor(rgb, keep_out, theme, objects=None):
    a = rgb.astype(np.float32) / 255
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    mx, mn = a.max(-1), a.min(-1)
    L = 0.2126 * r + 0.7152 * g + 0.0722 * b
    sat = np.where(mx > 1e-4, (mx - mn) / np.maximum(mx, 1e-4), 0)
    d = np.maximum(mx - mn, 1e-6)
    h = np.where(mx == r, ((g - b) / d) % 6, np.where(mx == g, (b - r) / d + 2, (r - g) / d + 4)) * 60
    keep_colour = (smooth(h, 70, 90) * (1 - smooth(h, 250, 270))) * smooth(sat, 0.25, 0.4) * smooth(L, 0.04, 0.1)  # pitch green, blue
    glow = smooth(L, 0.55, 0.8) * smooth(sat, 0.25, 0.5)  # lamps, brass highlights
    lt = LIGHT[theme]
    shine_spot = None
    if objects is not None:
        shine_spot = glow * (1 - np.clip(blurred(objects, a.shape[1] / 120) * 3, 0, 1))
        # on the room itself a lamp's warm reflection (the hot spot under Transfer War's desk lamp) is not kept as an orange
        # patch: it takes the new surface and the lamp's warm pool lights it; only glow on or right beside an object stays
        glow = glow * np.clip(blurred(objects, a.shape[1] / 120) * 3, 0, 1)
    w = (1 - keep_colour) * (1 - glow) * (1 - keep_out)
    if lt.get("denoise"):
        # the darkest painted corners carry the picture's compression blocks; lifting them (Silver) would show the blocks,
        # so there the tone follows a softened copy of the painting
        d = smooth(L, 0.03, 0.14)
        L = L * d + blurred(L, a.shape[1] / 300) * (1 - d)
    nl = lt["floor"] + lt["span"] * np.power(np.clip(L, 0, 1), lt["gamma"])
    # texture: the wood grain, marble veins and panel edges the tone curve would flatten are put back
    # (measured on the room alone, so no light ring forms round a manager's hair or an object's outline, and kept fine)
    room = np.clip(1 - keep_out, 0, 1) * (1 - glow)
    rad = a.shape[1] / 220
    local = blurred(L * room, rad) / np.maximum(blurred(room, rad), 1e-3)
    clip = lt.get("clip", 0.06)
    fine = np.clip(L - local, -clip, clip)
    # bevel: on metal the raised edges of a panel catch the light as a bright line and the grooves stay deep
    if lt.get("bevel", 0):
        fine = np.where(fine > 0, fine * (1 + lt["bevel"]), fine)
    if lt.get("denoise"):
        fine = fine * d
    nl = nl + lt["detail"] * fine * room
    # polish: metal reads as metal by its contrast (bright edges, deeper shade), not by its colour alone
    hi = 4.0 if lt.get("knee") else 1.0  # with a knee the light above white is kept, so the knee can roll it off in steps
    if lt.get("contrast", 1.0) != 1.0:
        m = lt.get("mid", 0.5)
        nl = np.clip(m + (nl - m) * lt["contrast"], 0, hi)
    # sheen: the room's broad light (the falloff from lamps and windows across a wall) is drawn out further, the way a
    # polished metal wall throws light back, and the brightest edges go towards white
    if lt.get("sheen", 0):
        broad = blurred(L * room + local * (1 - room), a.shape[1] / 24)
        broad = (broad - float(np.median(broad))) / max(float(np.percentile(np.abs(broad - np.median(broad)), 95)), 1e-3)
        nl = np.clip(nl + lt["sheen"] * np.clip(broad, lt.get("sheen_floor", -1.5), 1.5) * room, 0, hi)
    if lt.get("shine", 0):
        nl = np.clip(nl + lt["shine"] * smooth(nl, 0.72, 0.98) * room, 0, hi)
    # brushed finish: the fine straight grain of brushed metal, laid over the room so it reads as metal and never as the
    # painted wood (Nik 2026-11-23 21:47 UTC: "more metallic and more distinction from current wooden design")
    if lt.get("brush", 0):
        # only on the painted wood panels: warm, and grained up and down (their texture runs one way; marble veins, a rug's
        # weave and a desk's flat top do not), so the brushing never scratches the marble or the floor
        from scipy import ndimage
        gx, gy = ndimage.sobel(L, 1), ndimage.sobel(L, 0)
        ex, ey = blurred(gx * gx, a.shape[1] / 160), blurred(gy * gy, a.shape[1] / 160)
        wood = smooth(sat, 0.2, 0.4) * smooth(h, 8, 18) * (1 - smooth(h, 45, 60)) * smooth(ex / np.maximum(ex + ey, 1e-6), 0.58, 0.72)
        nl = np.clip(nl * (1 + lt["brush"] * brushed(nl.shape) * room * wood), 0, hi)
    # lift: the deepest shadows keep a little light, so a dark corner reads as dim metal, never a black hole
    if lt.get("lift", 0):
        nl = lt["lift"] + (1 - lt["lift"]) * nl
    # knee: the brightest light on a polished wall rolls off softly instead of burning to white beside a lamp
    if lt.get("knee"):
        k = lt["knee"]
        nl = np.where(nl > k, k + (0.97 - k) * np.tanh((nl - k) / (0.97 - k) * lt.get("knee_slope", 0.4) * 2.5), nl)
    # cap: on black metal even the brightest reflection stays dark metal (Nik 2026-11-23 23:27 UTC: "should not shine like a
    # silver ... or lighten up like a gray or like a white"): the light rolls off smoothly under a low ceiling
    if lt.get("cap"):
        nl = lt["cap"] * np.tanh(np.maximum(nl, 0) / lt["cap"])
    # recess: a deep, unlit space (the lounge behind the Ball Game's glass) stays dim on a bright clubhouse, so the room
    # keeps its depth instead of turning to fog
    if lt.get("recess"):
        r40 = a.shape[1] / 40  # measured on the room alone, so the managers' white shirts never light a halo round them
        deep = smooth(blurred(L * room, r40) / np.maximum(blurred(room, r40), 1e-3), 0.025, 0.12)
        nl = nl * (lt["recess"] + (1 - lt["recess"]) * deep)
    if shine_spot is not None and (lt.get("knee") or 0) >= 0.6:  # Silver only: on dark metal the reflection is just the room
        # a lamp's reflection on polished stone stays a soft highlight below white (its warmth comes from the lamp pool)
        nl = nl * (1 - shine_spot) + np.minimum(nl, lt["knee"] - 0.04) * shine_spot
    nl = np.clip(nl, 0, 1)
    target = np.clip(nl[..., None] * lt["tint"], 0, 1)
    # lamp light: every lamp throws a warm pool on the new wall and floor, fading with distance, as it did on the wood
    pool = blurred(glow * L, a.shape[1] / 16)
    pool = np.clip(pool / max(float(np.percentile(pool, 99.7)), 1e-3), 0, 1) ** 1.3
    target = np.clip(target + (pool * lt["pool"])[..., None] * WARM, 0, 1)
    base = a
    if objects is not None:
        hm = HARMONY[theme]
        aL = 0.2126 * a[..., 0] + 0.7152 * a[..., 1] + 0.0722 * a[..., 2]
        t = smooth(aL, 0.08, 0.6)[..., None]
        o = a * (hm["shadow"] * (1 - t) + hm["high"] * t)
        oL = 0.2126 * o[..., 0] + 0.7152 * o[..., 1] + 0.0722 * o[..., 2]
        o = oL[..., None] + (o - oL[..., None]) * hm["sat"]  # a touch less of the old warm saturation
        newL = oL + (nl - oL) * hm["toward"]
        o = o * (newL / np.maximum(oL, 1e-4))[..., None]
        o = np.clip(o, 0, 1)
        # a lamp's own glowing shade or bulb stays as it is; every other part of an object (the lit top of a ball too, Nik
        # 2026-11-23 21:45 UTC: "the top of ball and rest of it seems to have different color") takes the room's light alike
        lamp = smooth(L, 0.74, 0.9) * smooth(sat, 0.15, 0.4)
        k = (objects * (1 - lamp))[..., None]
        base = a * (1 - k) + o * k
    out = base * (1 - w[..., None]) + target * w[..., None]
    return (np.clip(out, 0, 1) * 255 + 0.5).astype(np.uint8)

def build(name, folder=SRC):
    src = Image.open(os.path.join(folder, name + ".webp")).convert("RGB")
    hero = np.maximum(hero_mask(name, src.size), protect_mask(name, src.size))
    objects = object_mask(name, src.size) * (1 - hero)  # Daniel and Nik and the stadium are never touched
    keep_out = np.maximum(hero, objects)
    rgb = np.asarray(src)
    for theme in THEMES:
        out_dir = os.path.join(folder, theme)
        os.makedirs(out_dir, exist_ok=True)
        Image.fromarray(recolor(rgb, keep_out, theme, objects)).save(os.path.join(out_dir, name + ".webp"), quality=90, method=6)
    print("built", name, src.size)

def build_tile():
    """The panel marble (css/r78-marble-tile.webp, black with gold veins): the warm black turns neutral metal black, the gold
    veins stay. One tile serves both themes (the panels stay dark in Silver too)."""
    src = Image.open(os.path.join(ROOT, "css", "r78-marble-tile.webp")).convert("RGB")
    a = np.asarray(src).astype(np.float32) / 255
    L = 0.2126 * a[..., 0] + 0.7152 * a[..., 1] + 0.0722 * a[..., 2]
    keep = smooth(L, 0.07, 0.14)  # the veins
    out = recolor(np.asarray(src), keep, "tile")
    Image.fromarray(out).save(os.path.join(ROOT, "css", "r78-marble-tile-metal.webp"), quality=88, method=6)
    print("built css/r78-marble-tile-metal.webp")

# The loading screen's tunnel (Nik 2026-11-23 21:32 UTC: "any screen that has clubhouse art or clubhouse background should
# match"). Reus is his own picture in front of it, so the room has no one in it. Copies go to assets/loading/<theme>/.
LOADING = os.path.join(ROOT, "assets", "loading")
def build_loading():
    for f in sorted(os.listdir(LOADING)):
        if f.startswith("ENV_LOADING_") and f.endswith(".webp"):
            build(f[:-5], LOADING)

if __name__ == "__main__":
    names = sys.argv[1:]
    if not names or "tile" in names:
        build_tile()
    if not names or "loading" in names:
        build_loading()
    for n in [x for x in names if x not in ("tile", "loading")] or (plates() if not names else []):
        build(n)
