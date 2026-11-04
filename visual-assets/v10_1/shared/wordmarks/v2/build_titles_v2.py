#!/usr/bin/env python3
"""HO-057: rebuild every brush-gold page title as a 3840 px master + WebP ladder.

Same words, same letter shapes (traced from the V1 picture), re-rendered at 4K:
  * clean anti-aliased brush edge (super-sampled, smoothed, no halo)
  * gold built from the V1 colours (low frequency) + new brush-grain streaks
  * bevel light from the top left, rim light on lit edges, soft inner shadow
  * thin dark-bronze contour + soft contact shadow (the V1 look), no frame box
Output: TITLE_<NAME>_V2_{3840,1920,960,480}.webp next to the V1 file.

Usage: python3 build_titles_v2.py [--only NAME] [--preview DIR]
Needs: numpy, scipy, opencv-python-headless, Pillow (with WebP).
"""
import argparse, os, sys
import numpy as np, cv2
from PIL import Image
from scipy import ndimage as ndi

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))  # visual-assets/v10_1
TITLES = [  # (name, V1 source relative to v10_1, output folder)
    ("LEAGUE", "shared/wordmarks/TITLE_LEAGUE_V1.webp"),
    ("NEW_SHOWDOWN", "shared/wordmarks/TITLE_NEW_SHOWDOWN_V1.webp"),
    ("CONNECT_PLAYERS", "shared/wordmarks/TITLE_CONNECT_PLAYERS_V1.webp"),
    ("FINAL_WINNER", "shared/wordmarks/TITLE_FINAL_WINNER_V1.webp"),
    ("RULE_BOOK", "shared/wordmarks/TITLE_RULE_BOOK_V1.webp"),
    ("SETTINGS", "shared/wordmarks/TITLE_SETTINGS_V1.webp"),
    ("STANDINGS", "shared/wordmarks/TITLE_STANDINGS_V1.webp"),
    ("TRANSFER", "shared/wordmarks/TITLE_TRANSFER_V1.webp"),
    ("CS", "career-statistics/assets/TITLE_CS_V1.webp"),
    ("LG", "legacy/assets/TITLE_LG_V1.webp"),
    ("RV", "rivalry-statistics/assets/TITLE_RV_V1.webp"),
    ("RV_PHONE", "rivalry-statistics/assets/TITLE_RV_V1_PHONE.webp"),
    ("SR", "season-results/assets/TITLE_SR_V1.webp"),
    ("SR_PHONE", "season-results/assets/TITLE_SR_PHONE_V1.webp"),
    ("TR", "trophy-room/assets/TITLE_TR_V1.webp"),
]
MASTER_W = 3840
LADDER = [3840, 1920, 960, 480]
PAD = 0.035  # side padding (fraction of width) so the contour/shadow never clips


def smoothstep(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0, 1)
    return t * t * (3 - 2 * t)


def gold_coverage(rgba):
    """Alpha of the gold paint only (drops the V1 dark contour/shadow)."""
    a = rgba[..., 3] / 255.0
    rgb = rgba[..., :3] / 255.0
    lum = rgb @ np.array([0.299, 0.587, 0.114])
    warm = np.clip((rgb[..., 0] - rgb[..., 2]) * 2.2, 0, 1)
    paint = smoothstep(0.22, 0.42, lum) * np.maximum(warm, 0.5)
    return np.clip(a * np.clip(paint * 1.25, 0, 1), 0, 1)


def fill_colour(rgb, w, sigma):
    """Normalized convolution: spread gold colour under the old dark edge."""
    num = np.stack([ndi.gaussian_filter(rgb[..., c] * w, sigma) for c in range(3)], -1)
    den = ndi.gaussian_filter(w, sigma)[..., None] + 1e-6
    out = num / den
    return np.where(w[..., None] > 0.6, rgb, out)


def brush_grain(h, w, rng, scale):
    """Streaky grain: noise smeared along the italic brush direction (~-18 deg)."""
    n = rng.standard_normal((h, w)).astype(np.float32)
    k = int(max(9, 34 * scale)) | 1
    kern = np.zeros((k, k), np.float32)
    ang = np.deg2rad(-18)
    c = k // 2
    for t in np.linspace(-c, c, k * 2):
        x, y = int(round(c + t * np.cos(ang))), int(round(c + t * np.sin(ang)))
        kern[y, x] = 1
    kern /= kern.sum()
    fine = cv2.filter2D(n, -1, kern)
    coarse = cv2.GaussianBlur(rng.standard_normal((h, w)).astype(np.float32), (0, 0), 6 * scale)
    fine /= fine.std() + 1e-6
    coarse /= coarse.std() + 1e-6
    return fine * 0.9 + coarse * 0.15


def render(src_path, rng):
    v1 = np.array(Image.open(src_path).convert("RGBA")).astype(np.float32)
    h0, w0 = v1.shape[:2]
    # pad source so effects never clip
    p = int(round(w0 * PAD))
    v1 = np.pad(v1, ((p, p), (p, p), (0, 0)))
    h0, w0 = v1.shape[:2]
    s = MASTER_W / w0
    W, H = MASTER_W, int(round(h0 * s))

    cov = gold_coverage(v1)
    base = fill_colour(v1[..., :3] / 255.0, cov, 2.0)

    # --- shape: super-sample, smooth, re-threshold -> crisp brush edge
    ss = 2
    big = cv2.resize(cov, (W * ss, H * ss), interpolation=cv2.INTER_CUBIC)
    big = cv2.GaussianBlur(big, (0, 0), 0.55 * s * ss)
    edge = 0.9 * ss  # transition width in super-sampled px
    m_ss = smoothstep(0.42 - 0.04, 0.42 + 0.04, big)
    m_ss = cv2.GaussianBlur(m_ss.astype(np.float32), (0, 0), edge * 0.5)
    M = cv2.resize(m_ss, (W, H), interpolation=cv2.INTER_AREA)
    M = np.clip(M, 0, 1)
    Mb = M > 0.5

    # --- colour base (low frequency from V1)
    col = cv2.resize(base.astype(np.float32), (W, H), interpolation=cv2.INTER_CUBIC)
    col = cv2.GaussianBlur(col, (0, 0), 0.6 * s)
    lum = col @ np.array([0.299, 0.587, 0.114], np.float32)
    # re-grade into a rich gold ramp keyed on V1 luminance
    t = np.clip((lum - 0.35) / 0.6, 0, 1)[..., None]
    deep = np.array([0.72, 0.38, 0.03], np.float32)
    mid = np.array([0.99, 0.71, 0.10], np.float32)
    hi = np.array([1.00, 0.91, 0.46], np.float32)
    ramp = np.where(t < 0.55, deep + (mid - deep) * (t / 0.55), mid + (hi - mid) * ((t - 0.55) / 0.45))
    # vertical sheen (brighter upper third, warmer bottom) like V1
    yy = np.linspace(0, 1, H, dtype=np.float32)[:, None, None]
    sheen = 1.0 + 0.10 * np.exp(-((yy - 0.32) / 0.16) ** 2) - 0.10 * smoothstep(0.6, 1.0, yy)
    keep = smoothstep(0.30, 0.50, lum)[..., None]  # drop V1 brown stains
    col = col * keep + ramp * (1 - keep)
    gold = ramp * 0.5 + col * 0.5
    gl = (gold @ np.array([0.299, 0.587, 0.114], np.float32))[..., None]
    gold = np.clip(gl + (gold - gl) * 1.18, 0, 1)
    gold = gold * sheen

    # --- height field + bevel lighting
    dist = ndi.distance_transform_edt(Mb).astype(np.float32)
    bevel_w = 9.0 * s / 2.74  # ~9 px at 3840 for a 1400 source
    hgt = np.clip(dist / bevel_w, 0, 1)
    hgt = 1 - (1 - hgt) ** 2
    hgt = cv2.GaussianBlur(hgt, (0, 0), 1.2)
    gy, gx = np.gradient(hgt)
    nz = np.ones_like(hgt) * 0.35
    nrm = np.sqrt(gx ** 2 + gy ** 2 + nz ** 2)
    nx, ny, nz = -gx / nrm, -gy / nrm, nz / nrm
    L = np.array([-0.55, -0.65, 0.52]); L /= np.linalg.norm(L)
    diff = np.clip(nx * L[0] + ny * L[1] + nz * L[2], 0, 1)
    Hv = L + np.array([0, 0, 1.0]); Hv /= np.linalg.norm(Hv)
    spec = np.clip(nx * Hv[0] + ny * Hv[1] + nz * Hv[2], 0, 1) ** 28

    # --- grain (metal flake + bristle streaks)
    g = brush_grain(H, W, rng, s / 2.74)
    flake = (rng.random((H, W)).astype(np.float32) > 0.9975).astype(np.float32)
    flake = cv2.GaussianBlur(flake, (0, 0), 0.8) * 6

    shade = 0.70 + 0.45 * diff
    out = gold * shade[..., None]
    out *= (1 + 0.085 * g)[..., None]
    out += (spec * 0.55)[..., None] * np.array([1.0, 0.95, 0.78], np.float32)

    # --- rim light on top-left-facing edges, inner shadow on bottom-right
    sh = int(round(3 * s / 2.74)) + 1
    up = np.roll(np.roll(M, sh, 0), sh, 1)        # shape shifted down-right
    rim = np.clip(M - up, 0, 1) * (1 - hgt * 0.6)
    rim = cv2.GaussianBlur(rim, (0, 0), 1.0)
    dn = np.roll(np.roll(M, -sh * 2, 0), -sh, 1)
    inner = cv2.GaussianBlur(np.clip(M - dn, 0, 1), (0, 0), 3.0 * s / 2.74)
    out += (rim * 0.30)[..., None] * np.array([1.0, 0.97, 0.80], np.float32)
    out *= (1 - inner * 0.38)[..., None]
    out = np.clip(out, 0, 1)

    # --- contour + contact shadow (dark bronze, tight, no light halo)
    cw = max(2.0, 3.2 * s / 2.74)
    outside = ndi.distance_transform_edt(~Mb).astype(np.float32)
    contour = np.clip(1 - (outside - cw) / 1.2, 0, 1) * (outside > 0)
    contour = np.maximum(contour, M)
    contour = cv2.GaussianBlur(contour, (0, 0), 0.7)
    off = int(round(5 * s / 2.74))
    shadow = np.roll(cv2.GaussianBlur(M, (0, 0), 7 * s / 2.74), off, 0) * 0.55

    # composite: shadow -> contour -> gold (premultiplied)
    dark = np.array([0.16, 0.08, 0.02], np.float32)
    a_sh = shadow
    rgb = np.zeros((H, W, 3), np.float32) + np.array([0.05, 0.03, 0.01], np.float32) * a_sh[..., None]
    a = a_sh
    a_c = contour * 0.92
    rgb = dark * a_c[..., None] + rgb * (1 - a_c[..., None]); a = a_c + a * (1 - a_c)
    rgb = out * M[..., None] + rgb * (1 - M[..., None]); a = M + a * (1 - M)

    # crop to content + small margin
    ys, xs = np.where(a > 0.01)
    mg = int(0.012 * W)
    y0, y1 = max(0, ys.min() - mg), min(H, ys.max() + mg + 1)
    x0, x1 = max(0, xs.min() - mg), min(W, xs.max() + mg + 1)
    rgb, a = rgb[y0:y1, x0:x1], a[y0:y1, x0:x1]
    un = np.where(a[..., None] > 1e-4, rgb / np.maximum(a[..., None], 1e-4), 0)
    img = np.dstack([np.clip(un, 0, 1), a])
    im = Image.fromarray((img * 255 + 0.5).astype(np.uint8), "RGBA")
    if im.width != MASTER_W:  # final width is exactly 3840
        im = im.resize((MASTER_W, round(im.height * MASTER_W / im.width)), Image.LANCZOS)
    return im


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--only")
    ap.add_argument("--no-write", action="store_true")
    args = ap.parse_args()
    for name, rel in TITLES:
        if args.only and name != args.only:
            continue
        rng = np.random.default_rng(57)
        src = os.path.join(ROOT, rel)
        im = render(src, rng)
        outdir = os.path.dirname(src)
        for w in LADDER:
            j = im if w == MASTER_W else im.resize((w, round(im.height * w / MASTER_W)), Image.LANCZOS)
            path = os.path.join(outdir, f"TITLE_{name}_V2_{w}.webp")
            if not args.no_write:
                j.save(path, "WEBP", quality=90 if w >= 1920 else 92, method=6, exact=False)
            print(f"{name:16s} {w:5d} {j.width}x{j.height} {os.path.getsize(path)//1024 if not args.no_write else 0} KB")
    return 0


if __name__ == "__main__":
    sys.exit(main())
