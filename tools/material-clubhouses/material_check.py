#!/usr/bin/env python3
"""P3 (Duet): numeric bar for the material clubhouses (Ruby, Emerald, Lapis, Rose Quartz, Amethyst, Rhodochrosite, Viola).

  python3 tools/material-clubhouses/material_check.py <key> [ROOM ...] [--dir DIR] [--sib DIR]

Built from B7's matte_check.py (claude-gameplay/r100-premium-only b41f5e1). Each master of look <KEY> in DIR
(default tools/clubhouse-themes/paintings/) is compared, outside the dilated hero mask, at 1536x864, with the Wooden
plate and with every existing clubhouse master of the same room in --sib (default: the same paintings folder).

  diff    mean |new - sibling| per pixel for every existing look (Platinum, Metallic Black, Graphite and any
          finished material clubhouse)                                         >= 15   unmistakably a new clubhouse
  mw      mean |new - Wooden|                                                  >= 12   every big surface changed
  hue     share of coloured surface pixels (sat > 0.15) inside the look's hue band   >= LOOK hue_min
  brown   share of coloured pixels in Wooden's 15-45 degree brown band               <= LOOK brown_max
  sat     median saturation of surfaces (luma 6-140)                                 inside LOOK sat range
  pale    share of room pixels that are washed-out (hue band, sat < 0.40, luma > 110) <= 0.03   "rich, not pink"
  gold    share of room pixels that are bright gold (hue 35-60, sat > 0.45, luma > 100) <= LOOK gold_max  "accents small"
  luma    room brightness                                                            inside LOOK luma range  "night"
  glint   new specular hot spots per 10k px (matte_check's definition)  <= max(3, min(8, 0.6 x Metallic Black))
          polished stone may show a few more than Graphite (0.0-3.4) but never Black's 6.7-28
  spread  luma p95 - p5                                       >= max(Wooden, 0.75 x Metallic Black)   rich, not flat
  detail  mean |luma - blur(2)|                               >= 1.1 x Wooden                         readable materials

Every limit is necessary, never sufficient: the eye check against HO-173 and Nik's OK on the board decide.
Limits marked in LOOKS as provisional are re-calibrated on the approved pilot; any change is written in that
clubhouse's COLOUR_STUDY.md with its reason. Exit 1 on any FAIL.
"""
import os, sys
import numpy as np
from PIL import Image, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
THEMES = os.path.join(ROOT, "tools", "clubhouse-themes")
SIZE = (1536, 864)
SIBLINGS = ["SILVER", "BLACK", "MATTE"]  # Platinum (key silver), Metallic Black, Graphite (key matte)

# Hue bands in degrees; a band may wrap through 0 (lo > hi).
LOOKS = {
    "RUBY": dict(name="Ruby Clubhouse", hue=(330, 12), hue_min=0.50, brown_max=0.25, sat=(0.35, 0.80),
                 luma=(14, 60), gold_max=0.04,
                 rooms={"HOME": dict(hue_min=0.35, brown_max=0.45, note="lounge objects keep their brown leather by design")},
                 provisional=True),
}
ORDER = ["RUBY", "EMERALD", "LAPIS", "ROSEQUARTZ", "AMETHYST", "RHODOCHROSITE", "VIOLA"]


def wooden(room):
    if room == "LR":
        return os.path.join(ROOT, "visual-assets/v10_1/plates-hc/ENV_BOX_PLATE_HC_V4_2X.webp")
    if room == "LOADING":
        return os.path.join(ROOT, "assets/loading/ENV_LOADING_PLATE_HC_2X.webp")
    if room == "SLAB":
        return os.path.join(ROOT, "visual-assets/v10_1/plates-hc/ENV_SLAB_HC_V1_2X.webp")
    return os.path.join(ROOT, f"visual-assets/v10_1/plates-hc/ENV_{room}_PLATE_HC_V3_2X.webp")


def master(d, room, look):
    if room == "LR":
        return os.path.join(d, f"ENV_BOX_PLATE_EMPTY_{look}_P1_2X.webp")
    return os.path.join(d, f"ENV_SLAB_{look}_P1_2X.webp" if room == "SLAB" else f"ENV_{room}_PLATE_{look}_P1_2X.webp")


def load(p):
    return np.asarray(Image.open(p).convert("RGB").resize(SIZE, Image.LANCZOS), dtype=np.float32)


def luma(a):
    return a[..., 0] * .2126 + a[..., 1] * .7152 + a[..., 2] * .0722


def blur(L, r):
    return np.asarray(Image.fromarray(np.clip(L, 0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(r)), dtype=np.float32)


def free_of(room):
    p = os.path.join(THEMES, "masks", "ENV_BOX_PLATE_HC_V4_1920.png" if room == "LR" else f"ENV_{room}_PLATE_HC_V3_1920.png")
    if not os.path.exists(p):
        return np.ones(SIZE[::-1], bool)
    m = Image.open(p).convert("L").filter(ImageFilter.MaxFilter(9)).resize(SIZE)
    return ~(np.asarray(m) > 8)


def lit_in(w):
    L = luma(w)
    return np.asarray(Image.fromarray(((L > 170) * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(15))) > 0


def hsv(a):
    mx, mn = a.max(-1), a.min(-1)
    d = np.maximum(mx - mn, 1e-6)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    h = np.where(mx == r, ((g - b) / d) % 6, np.where(mx == g, (b - r) / d + 2, (r - g) / d + 4)) * 60
    return h, (mx - mn) / np.maximum(mx, 1), mx


def in_band(h, band):
    lo, hi = band
    return (h >= lo) & (h <= hi) if lo <= hi else (h >= lo) | (h <= hi)


def stats(a, free, lit):
    L = luma(a)
    v = L[free]
    return dict(luma=float(v.mean()),
                glint=float((((L > 200) & ((L - blur(L, 6)) > 60)) & free & ~lit).sum() / L.size * 1e4),
                spread=float(np.percentile(v, 95) - np.percentile(v, 5)),
                detail=float(np.abs(L - blur(L, 2))[free].mean()))


def check(key, room, d, sib):
    look = key.upper()
    cfg = dict(LOOKS[look]); cfg.update(cfg.get("rooms", {}).get(room, {}))
    m, w = master(d, room, look), wooden(room)
    if not os.path.exists(m):
        return None, f"{room}: no {look} master in {d}"
    free = free_of(room)
    M, W = load(m), load(w)
    lit = lit_in(W)
    sm, sw = stats(M, free, lit), stats(W, free, lit)
    rows = []
    sibs = SIBLINGS + [o for o in ORDER[:ORDER.index(look)]]
    sb = None
    for s in sibs:
        p = master(sib, room, s)
        if not os.path.exists(p):
            continue
        S = load(p)
        if s == "BLACK":
            sb = stats(S, free, lit)
        diff = float(np.abs(M - S).mean(-1)[free].mean())
        rows.append((f"vs {s.lower()}", diff, diff >= 15, ">= 15"))
    mw = float(np.abs(M - W).mean(-1)[free].mean())
    rows.append(("mw", mw, mw >= 12, ">= 12"))
    L = luma(M)
    h, s, _ = hsv(M)
    surf = free & (L >= 6) & (L <= 140)
    col = free & (s > 0.15) & (L >= 6)
    hue_share = float(in_band(h, cfg["hue"])[col].mean())
    brown = float(((h >= 15) & (h <= 45))[col].mean())
    sat = float(np.median(s[surf]))
    pale = float((in_band(h, cfg["hue"]) & (s < 0.40) & (L > 110))[free].mean())
    gold = float(((h >= 35) & (h <= 60) & (s > 0.45) & (L > 100))[free].mean())
    rows += [
        ("hue", hue_share, hue_share >= cfg["hue_min"], f">= {cfg['hue_min']:.2f} in {cfg['hue'][0]}-{cfg['hue'][1]} deg"),
        ("brown", brown, brown <= cfg["brown_max"], f"<= {cfg['brown_max']:.2f} (Wooden brown gone)"),
        ("sat", sat, cfg["sat"][0] <= sat <= cfg["sat"][1], f"{cfg['sat'][0]:.2f}-{cfg['sat'][1]:.2f}"),
        ("pale", pale, pale <= 0.03, "<= 0.03 (rich, never pastel)"),
        ("gold", gold, gold <= cfg["gold_max"], f"<= {cfg['gold_max']:.2f} (accents small)"),
        ("luma", sm["luma"], cfg["luma"][0] <= sm["luma"] <= cfg["luma"][1], f"{cfg['luma'][0]}-{cfg['luma'][1]} (night)"),
    ]
    gl = max(3.0, min(8.0, .6 * sb["glint"])) if sb else 3.0
    sp = max(sw["spread"], .75 * sb["spread"]) if sb else sw["spread"]
    rows += [
        ("glint", sm["glint"], sm["glint"] <= gl, f"<= {gl:.1f}" + (f" (Black {sb['glint']:.1f})" if sb else "")),
        ("spread", sm["spread"], sm["spread"] >= sp, f">= {sp:.0f} (Wooden {sw['spread']:.0f})"),
        ("detail", sm["detail"], sm["detail"] >= 1.1 * sw["detail"], f">= {1.1 * sw['detail']:.2f}"),
    ]
    ok = all(r[2] for r in rows)
    head = f"{room} {look}: {'PASS' if ok else 'FAIL'}" + (" (limits provisional until the pilot is approved)" if cfg.get("provisional") else "")
    return ok, "\n".join([head] + [f"  {'ok  ' if r[2] else 'MISS'} {r[0]:10s} {r[1]:7.3f}  {r[3]}" for r in rows])


def main():
    args = sys.argv[1:]
    d = sib = os.path.join(THEMES, "paintings")
    if "--dir" in args:
        i = args.index("--dir"); d = args[i + 1]; del args[i:i + 2]
    if "--sib" in args:
        i = args.index("--sib"); sib = args[i + 1]; del args[i:i + 2]
    key, rooms = args[0], args[1:]
    look = key.upper()
    if not rooms:
        rooms = sorted({f.split("_")[1] for f in os.listdir(d) if f.endswith(f"_{look}_P1_2X.webp") and "EMPTY" not in f})
    bad = False
    for r in rooms:
        ok, text = check(key, r, d, sib)
        print(text)
        bad |= ok is False
    sys.exit(1 if bad else 0)


if __name__ == "__main__":
    main()
