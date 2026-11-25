#!/usr/bin/env python3
"""r100 B7: numeric premium-bar check for Premium Matte Black paintings (HO-173, Nik 2026-11-25 01:05 UTC).

  python3 tools/clubhouse-themes/matte_check.py [ROOM ...]   # default: every room with a Matte master; exit 1 on any FAIL

Compares each Matte master in paintings/ with the Metallic Black master and the Wooden plate of the same room,
outside the hero mask (dilated), at 1536x864. A room that fails goes back to Team V as a REDO; passing is
necessary, not sufficient: the eye check against the 7-point bar in HO-173 and Nik's OK on the board still decide.

  mb      mean |Matte - Black| per pixel (0-255)     >= 15    unmistakably not Metallic Black
  mw      mean |Matte - Wooden|                      >= 12    every big surface changed, not a darkened Wooden room
  luma    room brightness Matte - Black              >= +5    warm charcoal walls, lighter than the suits
  glint   new specular hot spots per 10k px              <= min(5, 0.5 x Black)
          (a hot spot is luma > 200 and > 60 above its 6 px surroundings; spots where the Wooden room already has a
          lamp, shade, floodlight or lit edge, grown 7 px, are the room's own lights and are not counted, so only the
          shine the painting adds counts. Calibrated 2026-11-25 on all 9 desktop rooms: Wooden 0 by definition,
          Matte 0.0-3.4, Metallic Black 6.7-28.0, Platinum 7.2-33.6)
  spread  luma p95 - p5                              >= max(Wooden, 0.75 x Black)          rich, not flat
  detail  mean |luma - blur(2)|                      >= 1.1 x Wooden                       readable materials
  sat     median HSV saturation of surfaces (luma 6-140)   <= 0.22   neutral graphite, not brown espresso
  cast    mean (R - B) / mean luma on the same pixels      <= 0.30   no warm-brown colour cast
          (Nik's reference, MATTE_COLOUR_STUDY on leads/relay 89087f9: whole frame 0.125 / 0.14, car body
          0.03-0.08; the limits leave room for the fixed warm lamps. The espresso pilot measures 0.33-0.34 / 0.40-0.45.)
"""
import os, sys
import numpy as np
from PIL import Image, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
PAINT = os.path.join(HERE, "paintings")
SIZE = (1536, 864)


# Rooms Nik approved on the board despite a numeric miss, with the reason. A listed room prints ACCEPTED, not FAIL.
ACCEPTED = {
    "HOME": "Nik OK 2026-11-25 01:25 UTC (graphite pilot); mw 11.1 because the lounge objects (leather chairs, sofa, "
            "blankets, ball) keep their own colours by design",
}


def wooden(room):
    if room == "LOADING":
        return os.path.join(ROOT, "assets/loading/ENV_LOADING_PLATE_HC_2X.webp")
    if room == "SLAB":
        return os.path.join(ROOT, "visual-assets/v10_1/plates-hc/ENV_SLAB_HC_V1_2X.webp")
    return os.path.join(ROOT, f"visual-assets/v10_1/plates-hc/ENV_{room}_PLATE_HC_V3_2X.webp")


def master(room, look):
    return os.path.join(PAINT, f"ENV_SLAB_{look}_P1_2X.webp" if room == "SLAB" else f"ENV_{room}_PLATE_{look}_P1_2X.webp")


def load(p):
    return np.asarray(Image.open(p).convert("RGB").resize(SIZE, Image.LANCZOS), dtype=np.float32)


def luma(a):
    return a[..., 0] * .2126 + a[..., 1] * .7152 + a[..., 2] * .0722


def free_of(room):
    p = os.path.join(HERE, "masks", f"ENV_{room}_PLATE_HC_V3_1920.png")
    if not os.path.exists(p):
        return np.ones(SIZE[::-1], bool)
    m = Image.open(p).convert("L").filter(ImageFilter.MaxFilter(9)).resize(SIZE)
    return ~(np.asarray(m) > 8)


def blur(L, r):
    return np.asarray(Image.fromarray(np.clip(L, 0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(r)), dtype=np.float32)


def lit_in(w):
    """Where the Wooden room already has a lamp, shade, floodlight or lit edge (luma > 170, grown 7 px)."""
    L = luma(w)
    return np.asarray(Image.fromarray(((L > 170) * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(15))) > 0


def stats(a, free, lit):
    L = luma(a)
    v = L[free]
    return dict(luma=float(v.mean()),
                glint=float((((L > 200) & ((L - blur(L, 6)) > 60)) & free & ~lit).sum() / L.size * 1e4),
                spread=float(np.percentile(v, 95) - np.percentile(v, 5)),
                detail=float(np.abs(L - blur(L, 2))[free].mean()))


def neutral(a, free):
    L = luma(a)
    sel = free & (L >= 6) & (L <= 140)
    mx, mn = a.max(-1), a.min(-1)
    sat = float(np.median(((mx - mn) / np.maximum(mx, 1))[sel]))
    cast = float((a[..., 0] - a[..., 2])[sel].mean() / max(L[sel].mean(), 1))
    return sat, cast


def check(room):
    m, b, w = master(room, "MATTE"), master(room, "BLACK"), wooden(room)
    if not os.path.exists(b):
        return None, f"{room}: no Metallic Black master yet"
    free = free_of(room)
    M, B, W = load(m), load(b), load(w)
    lit = lit_in(W)
    sm, sb, sw = stats(M, free, lit), stats(B, free, lit), stats(W, free, lit)
    mb = float(np.abs(M - B).mean(-1)[free].mean())
    mw = float(np.abs(M - W).mean(-1)[free].mean())
    rows = [
        ("mb", mb, mb >= 15, ">= 15"),
        ("mw", mw, mw >= 12, ">= 12"),
        ("luma", sm["luma"] - sb["luma"], sm["luma"] - sb["luma"] >= 5, f">= +5 (Matte {sm['luma']:.1f}, Black {sb['luma']:.1f})"),
        ("glint", sm["glint"], sm["glint"] <= min(5, .5 * sb["glint"]),
         f"<= {min(5, .5 * sb['glint']):.1f} (Black {sb['glint']:.1f})"),
        ("spread", sm["spread"], sm["spread"] >= max(sw["spread"], .75 * sb["spread"]),
         f">= {max(sw['spread'], .75 * sb['spread']):.0f} (Wooden {sw['spread']:.0f}, Black {sb['spread']:.0f})"),
        ("detail", sm["detail"], sm["detail"] >= 1.1 * sw["detail"], f">= {1.1 * sw['detail']:.2f}"),
    ]
    sat, cast = neutral(M, free)
    rows += [("sat", sat, sat <= 0.22, "<= 0.22 (neutral graphite)"),
             ("cast", cast, cast <= 0.30, "<= 0.30 (no brown cast)")]
    ok = all(r[2] for r in rows)
    verdict = "PASS" if ok else ("ACCEPTED (" + ACCEPTED[room] + ")" if room in ACCEPTED else "FAIL")
    ok = ok or room in ACCEPTED
    lines = [f"{room}: {verdict}"] + [f"  {'ok  ' if r[2] else 'MISS'} {r[0]:6s} {r[1]:7.2f}  {r[3]}" for r in rows]
    return ok, "\n".join(lines)


def main():
    rooms = sys.argv[1:] or sorted({f.split("_")[1] for f in os.listdir(PAINT)
                                    if f.endswith("_P1_2X.webp") and "_MATTE_" in f and "EMPTY" not in f})
    bad = False
    for r in rooms:
        ok, text = check(r)
        print(text)
        bad |= ok is False
    sys.exit(1 if bad else 0)


if __name__ == "__main__":
    main()
