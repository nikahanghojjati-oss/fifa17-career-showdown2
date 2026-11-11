"""HO-071 V3 title family: "Honours Board" (Nik picked option A, 11 Nov 2026).

Gold-leaf sign-writing like a club honours board: Cormorant SC Bold capitals,
matte gold leaf (flat colour + fine leaf grain + slow hand-laid tone drift),
a small solid dark shade down-right (painted, hard edged). Letters only on alpha.
No shine, no bevel, no glow, no crown, no kicker, no box.

Every slot title is drawn on ONE canvas height (300 px master, cap 150, baseline 210)
and cropped on the sides only. So every file of one step has the same height, and two
titles set to the same CSS height always share cap height, stroke weight and baseline.
Seeded and repeatable.

Usage: python3 -I build_titles_v3.py --fonts <dir with CormorantSC-Bold.ttf> --out <repo root> [--only NAME]
"""
import argparse
import os
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

GOLD = (196, 160, 92)        # matte gold leaf
SHADE = (48, 30, 18)         # sign-writer's dark shade
TRACK = 0.06                 # letter spacing, em
SHADE_OFF = 0.045            # shade offset, x cap height
WIDTHS = (3840, 1920, 960, 480)

# slot titles: one canvas, one cap height, one baseline
MASTER_W, MASTER_H, CAP, BASE = 3840, 300, 150, 210

SLOT = {
    # shared/wordmarks
    "CONNECT_PLAYERS": ("Connect Players", "shared/wordmarks"),
    "NEW_SHOWDOWN": ("New Showdown", "shared/wordmarks"),
    "LEAGUE": ("Select League", "shared/wordmarks"),
    "RULE_BOOK": ("Rule Book", "shared/wordmarks"),
    "SETTINGS": ("Settings", "shared/wordmarks"),
    "STANDINGS": ("Standings", "shared/wordmarks"),
    "TRANSFER": ("Transfer War", "shared/wordmarks"),
    "FINAL_WINNER": ("Showdown Champion", "shared/wordmarks"),
    # bundle titles
    "CS": ("Career Statistics", "career-statistics/assets"),
    "LG": ("Legacy", "legacy/assets"),
    "RV": ("Rivalry Statistics", "rivalry-statistics/assets"),
    "RV_PHONE": ("Rivalry Statistics", "rivalry-statistics/assets"),
    "SR": ("Season Results", "season-results/assets"),
    "SR_PHONE": ("Season Results", "season-results/assets"),
    "TR": ("Trophy Room", "trophy-room/assets"),
    # new: replaces live Kaushan text
    "CLUB_ASSIGNMENT": ("Club Assignment", "shared/wordmarks"),
    # screens in flight
    "PRIME_PACK": ("Prime Pack", "shared/wordmarks"),
    "CHAMBER_MEN": ("Chamber Men", "shared/wordmarks"),
    "ROSTER_ROULETTE": ("Russian Roster Roulette", "shared/wordmarks"),
    "SPECIAL_PLAYER": ("Special Player", "shared/wordmarks"),
    "GAZETTE": ("Touchline Gazette", "shared/wordmarks"),
    "SQUAD": ("Squad Management", "shared/wordmarks"),
    "START": ("Start", "shared/wordmarks"),
    "HISTORY": ("History", "shared/wordmarks"),
}


def font_for_cap(path, cap, ss):
    probe = ImageFont.truetype(path, 1000)
    l, t, r, b = probe.getbbox("H")
    return ImageFont.truetype(path, int(round(cap / ((b - t) / 1000.0) * ss)))


def line_width(f, text, track):
    return sum(f.getlength(ch, features=["lnum"]) for ch in text) + track * (len(text) - 1)


def draw_line(d, f, text, cx, base, track):
    x = cx - line_width(f, text, track) / 2.0
    for ch in text:
        d.text((x, base), ch, font=f, fill=255, anchor="ls", features=["lnum"])  # lining figures (17)
        x += f.getlength(ch, features=["lnum"]) + track


def letter_mask(fontpath, lines, W, H, cap, ss=2):
    """lines: [(text, baseline_y, cap_px)] in master pixels; returns L mask WxH."""
    m = Image.new("L", (W * ss, H * ss), 0)
    d = ImageDraw.Draw(m)
    for text, base, c in lines:
        f = font_for_cap(fontpath, c, ss)
        draw_line(d, f, text.upper(), W * ss / 2.0, base * ss, TRACK * f.size)
    return m.resize((W, H), Image.LANCZOS)


def noise(h, w, blur, seed):
    rng = np.random.default_rng(seed)
    n = rng.random((h, w)).astype(np.float32)
    if blur > 1:
        img = Image.fromarray((n * 255).astype(np.uint8))
        img = img.resize((max(1, w // blur), max(1, h // blur)), Image.BILINEAR).resize((w, h), Image.BICUBIC)
        n = np.asarray(img, np.float32) / 255.0
    return (n - n.mean()) / (n.std() + 1e-6)


def material(mask, cap, seed=7):
    W, H = mask.size
    a = np.asarray(mask, np.float32) / 255.0
    tone = 1.0 + noise(H, W, max(2, cap // 2), seed) * 0.06 \
        + noise(H, W, 0, seed + 1) * 0.025 + noise(H, W, 3, seed + 2) * 0.03
    rgb = np.clip(np.array(GOLD, np.float32)[None, None, :] * tone[..., None], 0, 255)
    off = int(round(cap * SHADE_OFF))
    s = np.zeros_like(a)
    s[off:, off:] = a[:H - off, :W - off]
    sa = s * 0.95
    na = a + sa * (1 - a)
    col = (rgb * a[..., None] + np.array(SHADE, np.float32) * (sa * (1 - a))[..., None]) / np.maximum(na, 1e-6)[..., None]
    out = np.dstack([col, na * 255.0])
    return Image.fromarray(np.clip(out, 0, 255).astype(np.uint8), "RGBA")


def save_widths(img, folder, stem, widths, q=86):
    os.makedirs(folder, exist_ok=True)
    res = []
    for w in widths:
        h = max(1, round(img.height * w / img.width))
        im = img if w == img.width else img.resize((w, h), Image.LANCZOS)
        p = os.path.join(folder, f"{stem}_{w}.webp")
        im.save(p, "WEBP", quality=q, method=4, alpha_quality=100)
        res.append((p, os.path.getsize(p)))
    return res


STEPS = {3840: 300, 1920: 150, 960: 76, 480: 38}   # scale step -> file height (px)


def save_steps(img, folder, stem, q=86):
    """Names keep the old 480/960/1920/3840 steps; every file of one step has the same HEIGHT."""
    os.makedirs(folder, exist_ok=True)
    res = []
    for step, h in STEPS.items():
        w = max(1, round(img.width * h / img.height))
        im = img if h == img.height else img.resize((w, h), Image.LANCZOS)
        p = os.path.join(folder, f"{stem}_{step}.webp")
        im.save(p, "WEBP", quality=q, method=4, alpha_quality=100)
        res.append((p, os.path.getsize(p)))
    return res


def build(fontpath, out_root, only=None):
    base = os.path.join(out_root, "visual-assets/v10_1")
    log = []
    for name, (text, folder) in SLOT.items():
        if only and name != only:
            continue
        m = letter_mask(fontpath, [(text, BASE, CAP)], MASTER_W, MASTER_H, CAP)
        img = material(m, CAP)
        # crop sides only: height, cap height and baseline stay identical for every title
        l, t, r, b = img.getbbox()
        pad = CAP // 3
        img = img.crop((max(0, l - pad), 0, min(MASTER_W, r + pad), MASTER_H))
        log += save_steps(img, os.path.join(base, folder), f"TITLE_{name}_V3")
    if not only or only == "VS":
        # VS mark: square-ish, cap 2x the slot cap
        c = 2 * CAP
        m = letter_mask(fontpath, [("VS", 440, c)], 1040, 600, c)
        log += save_widths(material(m, c), os.path.join(base, "shared/wordmarks"), "MARK_VS_V3", (1040, 520, 260))
    if not only or only == "CM17":
        # Home wordmark, two lines, no crown
        c1, c2 = 170, 170
        W, H = 2080, 640
        m = letter_mask(fontpath, [("Career Mode", 250, c1), ("Showdown 17", 520, c2)], W, H, c1)
        log += save_widths(material(m, c1), os.path.join(base, "home/assets"), "LOGO_CM17_WORDMARK_V3", (2080, 1040, 640))
    return log


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--fonts", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--only")
    a = ap.parse_args()
    for p, s in build(os.path.join(a.fonts, "CormorantSC-Bold.ttf"), a.out, a.only):
        print(f"{s // 1024:5d} KB  {p}")
