#!/usr/bin/env python3
"""Rebuild the HO-030 (r78) loading pictures from their sources.

    python3 make_loading.py            # writes LOADING_REUS_DESKTOP.webp + LOADING_REUS_PHONE.webp

Sources (all already in the repo):
  assets/marco-reus-2015-cc-by.webp                       real licensed photo (Tim Reckmann, CC BY 2.0)
  project-documents/factory/r78/HO-030/source/reus_alpha.png   cut-out matte for that photo (make_matte.py)
  visual-assets/v10_1/plates-v2/ENV_LOADING_PHONE_V2.webp  approved empty black-marble tunnel

Edits made to the photo, and nothing else: cut out from the pitch, placed at 1:1 scale (no resize, so his
face is the photo's own pixels), colour graded (deeper blacks, warmer highlights, more contrast and local
clarity, a faint gold edge light), with a dark vignette into the marble at the frame bottom. No face or kit changes, no redraw.
The right half of the desktop picture is a black-and-gold marble slab drawn by this script (seeded, so the
output is the same every run). Needs only Pillow and numpy.
"""
from pathlib import Path
import numpy as np
from PIL import Image, ImageFilter

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[3]
PHOTO = REPO / "assets" / "marco-reus-2015-cc-by.webp"
ALPHA = HERE / "source" / "reus_alpha.png"
TUNNEL = REPO / "visual-assets" / "v10_1" / "plates-v2" / "ENV_LOADING_PHONE_V2.webp"
OUT_DESKTOP = HERE / "LOADING_REUS_DESKTOP.webp"
OUT_PHONE = HERE / "LOADING_REUS_PHONE.webp"
IDENTITY_DESKTOP = HERE / "source" / "identity_desktop.png"
IDENTITY_PHONE = HERE / "source" / "identity_phone.png"

GOLD = np.array([0.80, 0.57, 0.21], np.float32)
GOLD_HI = np.array([1.0, 0.86, 0.52], np.float32)


# ---------- small helpers (numpy only) ----------
def box_blur(a, r):
    """Box blur of a 2-D or 3-D float array along both image axes (radius r px)."""
    if r < 1:
        return a
    out = a.astype(np.float32)
    for axis in (0, 1):
        pad = [(0, 0)] * out.ndim
        pad[axis] = (r + 1, r)
        p = np.pad(out, pad, mode="edge")
        c = np.cumsum(p, axis=axis, dtype=np.float64)
        n = out.shape[axis]
        hi = np.take(c, range(2 * r + 1, 2 * r + 1 + n), axis=axis)
        lo = np.take(c, range(0, n), axis=axis)
        out = ((hi - lo) / (2 * r + 1)).astype(np.float32)
    return out


def blur(a, r):
    """Three box passes ~ Gaussian with sigma ~ r."""
    k = max(1, int(round(r * 0.9)))
    return box_blur(box_blur(box_blur(a, k), k), k)


def smoothstep(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0, 1)
    return t * t * (3 - 2 * t)


def to_img(a):
    return Image.fromarray((np.clip(a, 0, 1) * 255 + 0.5).astype(np.uint8))


# ---------- the photo: clean cut-out + grade ----------
def load_cutout():
    rgb = np.asarray(Image.open(PHOTO).convert("RGB")).astype(np.float32) / 255
    a = np.asarray(Image.open(ALPHA).convert("L")).astype(np.float32) / 255
    # Choke the matte a touch so no pitch-green rim survives.
    a = np.clip((a - 0.12) / 0.86, 0, 1)
    # Unmix the edge colour: estimate the local pitch/stand colour behind each edge pixel and remove it.
    bgw = (a < 0.02).astype(np.float32)
    bg = blur(rgb * bgw[..., None], 10) / (blur(bgw, 10)[..., None] + 1e-4)
    fg = (rgb - (1 - a[..., None]) * bg) / np.maximum(a[..., None], 0.25)
    edge = (a > 0.001) & (a < 0.985)
    rgb = np.where(edge[..., None], np.clip(fg, 0, 1), rgb)
    # Remaining green spill on the rim only (kit is yellow/black, skin is warm, so green should never lead).
    band = smoothstep(0.995, 0.6, a) * (a > 0)
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    g2 = np.where(g > np.maximum(r, b), np.maximum(r, b), g)
    rgb[..., 1] = g * (1 - band) + g2 * band
    return rgb, a


def grade(rgb, a):
    """Premium black-and-gold grade, natural skin."""
    lum = rgb @ np.array([0.2126, 0.7152, 0.0722], np.float32)
    # Local clarity: lift mid-frequency detail on luminance only (the old version looked flat and washed out).
    base = blur(lum, 22)
    detail = lum - base
    lum2 = np.clip(lum + 0.30 * detail, 0, 1)
    rgb = rgb * ((lum2 + 1e-4) / (lum + 1e-4))[..., None]
    # Levels: drop the grey floor to a rich black, keep highlights.
    rgb = np.clip((rgb - 0.035) / 0.95, 0, 1)
    # Gentle S-curve for contrast, then a soft shoulder so the yellow kit never clips flat.
    rgb = rgb + 0.55 * rgb * (1 - rgb) * (rgb - 0.45)
    rgb = np.where(rgb > 0.78, 0.78 + (rgb - 0.78) * 0.62, rgb)
    lum = rgb @ np.array([0.2126, 0.7152, 0.0722], np.float32)
    # Warm, gold highlights and warm (not blue/green) blacks.
    hi = smoothstep(0.35, 0.95, lum)[..., None]
    lo = (1 - smoothstep(0.0, 0.35, lum))[..., None]
    rgb = rgb * (1 + hi * np.array([0.045, 0.012, -0.07], np.float32)) * (1 + lo * np.array([0.02, 0.0, -0.06], np.float32))
    # Saturation: a small lift, held back on skin-like hues so the face stays natural.
    lum = rgb @ np.array([0.2126, 0.7152, 0.0722], np.float32)
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    skin = smoothstep(0.02, 0.10, r - g) * smoothstep(0.0, 0.06, g - b) * (1 - smoothstep(0.35, 0.55, r - b))
    sat = 1.06 - 0.06 * skin
    rgb = lum[..., None] + (rgb - lum[..., None]) * sat[..., None]
    return np.clip(rgb, 0, 1)


def light_into_scene(rgb, a, face_y):
    """Sit the figure in the dark gold tunnel: soft falloff below the face, faint gold rim from the lit tunnel behind."""
    h = rgb.shape[0]
    y = np.arange(h, dtype=np.float32)[:, None]
    fall = 1 - 0.30 * smoothstep(face_y + 180, face_y + 1000, y)
    rgb = rgb * fall[..., None] * np.array([0.98, 0.94, 0.86], np.float32)
    # Rim: inside edge of the matte, stronger on the upper body.
    inner = np.clip(a - blur(a, 4), 0, 1) * 1.6
    top = 1 - 0.6 * smoothstep(face_y, face_y + 900, y)
    rim = np.clip(inner * top, 0, 1)[..., None]
    rgb = 1 - (1 - rgb) * (1 - rim * GOLD_HI * 0.16)
    return np.clip(rgb, 0, 1)


# ---------- marble ----------
def marble(H, W, seed=5):
    """Black marble with a gold crackle network, drawn to match the tunnel walls of ENV_LOADING_PHONE_V2."""
    rng = np.random.default_rng(seed)

    def noise(cy, cx):
        gh, gw = H // cy + 3, W // cx + 3
        g = rng.random((gh, gw)).astype(np.float32)
        return np.asarray(Image.fromarray(g, "F").resize((gw * cx, gh * cy), Image.BICUBIC))[cy:cy + H, cx:cx + W]

    def fbm(cell, octaves, gain=0.5):
        t, amp, tot = 0.0, 1.0, 0.0
        for k in range(octaves):
            c = max(2, int(cell / 2 ** k))
            t = t + amp * noise(c, c)
            tot += amp
            amp *= gain
        return t / tot

    def crackle(cell, warp, width):
        """Edges of a warped Voronoi pattern: thin, branching veins."""
        y, x = np.mgrid[0:H, 0:W].astype(np.float32)
        x = x + (fbm(cell * 1.5, 4) - 0.5) * warp
        y = y + (fbm(cell * 1.5, 4) - 0.5) * warp
        pad = int(warp / cell) + 3
        gy, gx = H // cell + 2 * pad + 2, W // cell + 2 * pad + 2
        pts = rng.random((gy, gx, 2)).astype(np.float32)
        cx = np.floor(x / cell).astype(int) + pad
        cy = np.floor(y / cell).astype(int) + pad
        f1 = np.full((H, W), 1e9, np.float32)
        f2 = f1.copy()
        for dy in (-1, 0, 1):
            for dx in (-1, 0, 1):
                iy = np.clip(cy + dy, 0, gy - 1)
                ix = np.clip(cx + dx, 0, gx - 1)
                d = np.hypot(x - (ix - pad + pts[iy, ix, 0]) * cell, y - (iy - pad + pts[iy, ix, 1]) * cell)
                f2 = np.where(d < f1, f1, np.minimum(f2, d))
                f1 = np.minimum(f1, d)
        return np.exp(-((f2 - f1) / width) ** 2)

    m1 = np.clip((fbm(260, 3) - 0.38) * 3.0, 0, 1)
    m2 = np.clip((fbm(180, 3) - 0.45) * 3.0, 0, 1)
    v = np.clip(crackle(170, 220, 2.2) * (0.15 + 0.85 * m1) * 0.9
                + crackle(70, 100, 1.4) * 0.55 * m2
                + crackle(34, 50, 1.0) * 0.25 * m1 * m2, 0, 1)
    cl = np.clip((fbm(420, 6, 0.6) - 0.38) * 1.7, 0, 1)
    grain = blur(rng.random((H, W)).astype(np.float32), 1)
    col = np.stack([9 + cl * 22 + grain * 6, 8 + cl * 19 + grain * 5, 7 + cl * 15 + grain * 4], -1) / 255
    glow = blur(v, 3)
    col = col + v[..., None] * GOLD * 0.62 + (v ** 3)[..., None] * GOLD_HI * 0.25 + glow[..., None] * GOLD * 0.22
    return np.clip(col, 0, 1).astype(np.float32)


def place(canvas, alpha_canvas, rgb, a, ox, oy):
    """Paste rgb/a into canvas at (ox, oy) at 1:1 scale, clipped to the canvas."""
    H, W = canvas.shape[:2]
    h, w = a.shape
    x0, y0 = max(0, ox), max(0, oy)
    x1, y1 = min(W, ox + w), min(H, oy + h)
    sx, sy = x0 - ox, y0 - oy
    alpha_canvas[y0:y1, x0:x1] = a[sy:sy + (y1 - y0), sx:sx + (x1 - x0)]
    canvas[y0:y1, x0:x1] = rgb[sy:sy + (y1 - y0), sx:sx + (x1 - x0)]


def over(bg, fg, a):
    """Composite with a little light wrap: the lit background bleeds softly over the figure's edge."""
    edge = np.clip(blur(1 - a, 6) * a, 0, 1)[..., None] * 1.4
    wrap = blur(bg, 8)
    fg = 1 - (1 - fg) * (1 - np.clip(edge, 0, 1) * wrap * 0.55)
    return fg * a[..., None] + bg * (1 - a[..., None])


def contact_glow(shape, cx, cy, rx, ry, strength):
    H, W = shape
    y, x = np.mgrid[0:H, 0:W].astype(np.float32)
    d = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2
    return np.exp(-d) * strength


# ---------- phone: 1179 x 2096 ----------
PHONE_FACE = (600, 775)      # where the top of his hair lands (x = head centre)


def build_phone(rgb, a):
    tunnel = np.asarray(Image.open(TUNNEL).convert("RGB")).astype(np.float32) / 255
    tunnel = box_blur(tunnel, 2)  # soft background (depth of field) so the picture fits the 95,000 B cap with a sharp face
    H, W = tunnel.shape[:2]
    y = np.arange(H, dtype=np.float32)[:, None, None]
    # Title zone at the top and loader zone at the bottom sink a little deeper into black marble (baked vignette).
    bg = tunnel * (1 - 0.22 * (1 - smoothstep(0, 640, y)))
    xx = np.arange(W, dtype=np.float32)[None, :, None]
    side = np.abs(xx - W / 2) / (W / 2)
    bg = bg * (1 - 0.25 * smoothstep(0.55, 1.0, side))

    ox, oy = PHONE_FACE[0] - 470, PHONE_FACE[1] - 15
    fg_rgb, fg_a = light_into_scene(rgb, a, face_y=15), a
    canvas = np.zeros_like(bg)
    ca = np.zeros((H, W), np.float32)
    place(canvas, ca, fg_rgb, fg_a, ox, oy)
    # Soft shadow behind him on the tunnel (keeps the edge from looking pasted).
    sh = blur(ca, 18) * 0.45
    bg = bg * (1 - sh[..., None])
    out = over(bg, canvas, ca)
    # Bottom vignette over everything (floor and legs sink into black marble; the loader sits here).
    return out * (1 - 0.74 * smoothstep(1600, 2096, y))


# ---------- desktop: 1920 x 1080 ----------
DESK_W, DESK_H = 1920, 1080
DIV_TOP, DIV_BOT = 1105, 880     # diagonal split between tunnel (left) and marble slab (right)
DESK_FACE = (500, 55)


def build_desktop(rgb, a):
    W, H = DESK_W, DESK_H
    tunnel = Image.open(TUNNEL).convert("RGB")
    s = (DIV_TOP + 40) / tunnel.width
    tw, th = round(tunnel.width * s), round(tunnel.height * s)
    t = np.asarray(tunnel.resize((tw, th), Image.LANCZOS)).astype(np.float32) / 255
    t = box_blur(t, 1)  # soft background (depth of field): room for the baked title under the 95,000 B cap
    oy = 300
    left = np.zeros((H, W, 3), np.float32)
    left[:, :tw] = t[oy:oy + H, :tw]
    yy = np.arange(H, dtype=np.float32)[:, None, None]

    slab = marble(H, W)
    xx = np.arange(W, dtype=np.float32)[None, :]
    ycol = np.arange(H, dtype=np.float32)[:, None]
    div = DIV_TOP + (DIV_BOT - DIV_TOP) * ycol / H
    # Soft light falling across the slab from the top right, and two faint gold bars (like the approved look).
    u = (xx - div) / (W - div)
    light = 0.75 + 0.35 * smoothstep(0.0, 1.0, u) * (1 - smoothstep(0, H, ycol))
    slab = slab * light[..., None]
    for x0, wbar, k in ((1580, 70, 0.10), (1720, 26, 0.07)):
        d = (xx - (x0 + 0.42 * (H - ycol))) / wbar
        bar = np.exp(-d ** 2) * (1 - smoothstep(0, H * 0.75, ycol))
        slab = slab + bar[..., None] * GOLD * k
    m = smoothstep(-1.2, 1.2, xx - div)[..., None]
    bg = left * (1 - m) + slab * m
    # Shadow cast by the slab edge onto the tunnel side, and the gold seam.
    shadow = smoothstep(-90, 0, xx - div) * (1 - m[..., 0])
    bg = bg * (1 - 0.45 * shadow[..., None])
    seam = np.exp(-((xx - div) / 1.6) ** 2)
    seam_glow = np.exp(-((xx - div) / 9.0) ** 2)
    fall = 0.55 + 0.45 * (1 - ycol / H)
    bg = bg + (seam[..., None] * GOLD_HI * 0.95 + seam_glow[..., None] * GOLD * 0.35) * fall[..., None]
    # Edge vignette on the tunnel side only.
    vx = smoothstep(0, 1, 1 - xx / 220)[..., None] * 0.35
    bg = bg * (1 - vx)

    ox, oy = DESK_FACE[0] - 470, DESK_FACE[1] - 15
    fg_rgb, fg_a = light_into_scene(rgb, a, face_y=15), a
    canvas = np.zeros_like(bg)
    ca = np.zeros((H, W), np.float32)
    place(canvas, ca, fg_rgb, fg_a, ox, oy)
    sh = blur(ca, 22) * 0.4
    bg = bg * (1 - sh[..., None])
    out = over(np.clip(bg, 0, 1), canvas, ca)
    # Bottom vignette on the tunnel side (the slab keeps its own light).
    vb = smoothstep(800, 1080, yy) * (1 - m) * 0.55
    return out * (1 - vb)


def bake(arr, overlay_path):
    """Alpha-composite a same-size RGBA overlay (the rendered title block) onto the picture."""
    o = np.asarray(Image.open(overlay_path).convert("RGBA")).astype(np.float32) / 255
    assert o.shape[:2] == arr.shape[:2], (o.shape, arr.shape)
    al = o[..., 3:4]
    return arr * (1 - al) + o[..., :3] * al


def save(arr, path, budget_kb):
    """Highest WebP quality (30..85) that fits the release cap (95,000 B)."""
    import io
    img = to_img(arr)
    best = None
    for q in range(85, 29, -1):
        buf = io.BytesIO()
        img.save(buf, "WEBP", quality=q, method=6)
        if buf.tell() <= budget_kb * 1024:
            best = (q, buf.getvalue())
            break
    q, data = best if best else (50, buf.getvalue())
    path.write_bytes(data)
    print(f"{path.name}: {arr.shape[1]}x{arr.shape[0]}  q{q}  {len(data) / 1024:.1f} KB")


def write_min():
    """loading-r78.min.css: the same rules without comments or spaces, for css/app.css on main (startup gzip budget)."""
    import re
    css = (HERE / "loading-r78.css").read_text()
    out = re.sub(r"/\*.*?\*/", "", css, flags=re.S)
    out = re.sub(r"\s+", " ", out)
    out = re.sub(r"\s*([{};,>])\s*", r"\1", out)
    out = out.replace(";}", "}").strip() + "\n"
    (HERE / "loading-r78.min.css").write_text(out)
    print(f"loading-r78.min.css: {len(out)} bytes")


def main():
    rgb, a = load_cutout()
    rgb = grade(rgb, a)
    desk = build_desktop(rgb, a)
    phone = build_phone(rgb, a)
    # The title block (CM17 roundel, kicker, wordmark, edition box) is baked in, so the screen is one picture and
    # one paint (Team G r78: the wordmark may not be preloaded). Overlays are the v1 HTML block rendered at
    # picture size with a transparent background by bake_identity.cjs: desktop at x1170 y196 (660 wide),
    # phone at x170 y70 (839 wide, inside the crop of the tallest phones).
    desk = bake(desk, IDENTITY_DESKTOP)
    phone = bake(phone, IDENTITY_PHONE)
    save(desk, OUT_DESKTOP, 92)
    # Release cap 95,000 B: the phone picture is stored at 1080x1920 (same 9:16 crop as 1179x2096, so every
    # CSS anchor, which works in 1179x2096 picture px through object-fit, is unchanged) at a higher quality.
    phone = np.asarray(to_img(phone).resize((1080, 1920), Image.LANCZOS), np.float32) / 255.0
    save(phone, OUT_PHONE, 92)
    write_min()


if __name__ == "__main__":
    main()
