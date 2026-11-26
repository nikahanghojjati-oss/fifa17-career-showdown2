#!/usr/bin/env python3
"""P3 (Duet): numeric bar for the material clubhouses (Ruby, Emerald, Lapis, Rose Quartz, Amethyst, Rhodochrosite, Viola).

  python3 tools/material-clubhouses/material_check.py <key> [ROOM ...] [--dir DIR] [--sib DIR]

Built from B7's matte_check.py (claude-gameplay/r100-premium-only b41f5e1). Each master of look <KEY> in DIR
(default tools/clubhouse-themes/paintings/) is compared, outside the dilated hero mask, at 1536x864, with the Wooden
plate and with every existing clubhouse master of the same room in --sib (default: the same paintings folder).

  (diff and mw leave out pixels that every existing look keeps within 10 levels of Wooden, e.g. the stadium view)
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
  spread  luma p95 - p5 (room)                                   >= max(Wooden, 0.75 x Metallic Black)   rich, not flat
  detail  mean |luma - blur(2)|                               >= 1.05 x Wooden                        readable materials

Phone bands: name the room <ROOM>_PHONE (e.g. HOME_PHONE). The master is ENV_<ROOM>_PHONE_<LOOK>_P1.webp, Wooden is
the live phone plate (CLUB V4, LOADING assets/loading), the mask is masks/ENV_<ROOM>_PHONE_HC_V3.png, at 590x1048.

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
# Seating rule (Nik, 25 Nov 2026): Home armchairs and sofa take the clubhouse colour, so Home needs no looser hue/brown limits.
LOOKS = {
    "RUBY": dict(name="Ruby Clubhouse", hue=(330, 12), hue_min=0.50, brown_max=0.25, sat=(0.35, 0.90),
                 luma=(14, 60), gold_max=0.04,
                 # Sign-in lounge floors: 85% of the medians of the accepted Ruby rooms (desktop spread 70, detail 3.7;
                 # phone 59, 2.9), not the raw V2 plate (176/184, 7.8/11.0). Reason in ruby/COLOUR_STUDY.md.
                 rooms=dict(SIGNIN=dict(spread_min=60, detail_min=3.1, view=(0.43, 0.0, 0.98, 0.42)),
                            SIGNIN_PHONE=dict(spread_min=50, detail_min=2.5, view=(0.76, 0.0, 1.0, 0.46))),
                 provisional=True),
    # Emerald: malachite, bottle-green leather, walnut, satin brass (#0B2E22 / #145A3C / #2E8B57 = 159 / 154 / 146 deg).
    # Green band 115-175 deg: malachite and bottle green, never lime (under 115) or teal (over 175). The walnut frames
    # sit in the brown band, so brown_max is 0.20, not Ruby's 0.25: walnut is near-black, and Wooden's honey wood must go.
    # Reasons in emerald/COLOUR_STUDY.md.
    "EMERALD": dict(name="Emerald Clubhouse", hue=(115, 175), hue_min=0.50, brown_max=0.20, sat=(0.35, 0.90),
                    luma=(14, 60), gold_max=0.04,
                    # Office: the kept ball, cup, paper bundle, blotters, olive tree and brass lamp (with its desk
                    # reflection) are 36% of the coloured pixels and brown by identity; on E-3 try 1 the room surfaces
                    # alone measured brown 0.07 (Ruby 0.02, Wooden 0.85) while the whole picture read 0.26.
                    # Hall: the kept runner rug is 27% of the brown on E-4 try 2, and the big double door's frame and
                    # stiles are walnut at the palette's #241A12 (measured rgb 38,25,14), so they count as brown too.
                    rooms=dict(OFFICE=dict(brown_max=0.30), HALL=dict(brown_max=0.30),
                               # Sign-in lounge (E-25, 26 Nov): the same view boxes and floors as Ruby; the raw V2 plate's
                               # own spread and detail (176/184, 7.8/11.0) come from its glowing gold panels, not a target.
                               # E-25: the windows reach the right edge and their sill at 43%, so the view box does too.
                               SIGNIN=dict(spread_min=60, detail_min=3.1, view=(0.43, 0.0, 1.0, 0.43)),
                               SIGNIN_PHONE=dict(spread_min=50, detail_min=2.5, view=(0.76, 0.0, 1.0, 0.46))),
                    provisional=True),
    # Lapis: lapis lazuli with diamond, glass and gem flakes (Nik 18:40 UTC: no gold flakes), lapis-blue leather, ebony,
    # satin gold trim. Nik's pick "Lapis Vivid" #165CC4, "Vivid Vibrant" #1268E8 in lamp pools (both 216 deg). Blue band 200-255 deg: ultramarine, never teal (under 200) or
    # violet (over 255). Nik, 26 Nov 2026 18:37 UTC: "I want the lapis to really look vibrant and in some type of way even
    # vivid ... like a lively touch." So Lapis drops the "muted and aged" ceiling: sat may run to 0.97 (Ruby/Emerald 0.90)
    # and luma to 70. Plastic flatness is still caught by spread and detail.
    # Reasons in lapis/COLOUR_STUDY.md.
    # Calibrated on the approved pilot (Nik, 26 Nov 2026 19:58 UTC): Board ENV_BOARD_PLATE_LAPIS_P1F_2X_T4 (Persian
    # rug, sat 0.988, glint 40.1) and Home ENV_HOME_PLATE_LAPIS_P1D_2X_T2 (sat 0.977, glint 6.5). Both read vivid, not
    # plastic, so sat runs to 0.99. The Board's glint is the approved gold fan of rays and the raised edges of the
    # hand-tooled Persian pattern, not hot spots on stone, so the Board alone gets its own glint ceiling.
    "LAPIS": dict(name="Lapis Clubhouse", hue=(200, 255), hue_min=0.50, brown_max=0.20, sat=(0.45, 0.99),
                  luma=(14, 70), gold_max=0.04,
                  rooms=dict(BOARD=dict(glint_max=45.0),
                             # Office: the glints sit on the satin gold window lines, the lamp stem and the lamp-lit olive
                             # leaves, not on the honed desk (33 px below the desk line, on the paper bundle). Master F1: 20.2.
                             OFFICE=dict(glint_max=22.0),
                             # Archive: master F2 sits on the lines (sat 0.991, glint 8.09, on the gold shelf edges
                             # and niche trims); the counter stone is clean, so the Archive gets a hair of headroom.
                             ARCHIVE=dict(sat=(0.45, 0.995), glint_max=8.5),
                             # Tunnel: master T1 glint 5.0, on the gold mat edge strips, the step nosings, the white goal
                             # and stands at the far end and the lit bulkhead lamp; no stone hot spots.
                             TUNNEL=dict(glint_max=5.5),
                             SIGNIN=dict(spread_min=60, detail_min=3.1, view=(0.43, 0.0, 1.0, 0.43)),
                             SIGNIN_PHONE=dict(spread_min=50, detail_min=2.5, view=(0.76, 0.0, 1.0, 0.46)))),
}
ORDER = ["RUBY", "EMERALD", "LAPIS", "ROSEQUARTZ", "AMETHYST", "RHODOCHROSITE", "VIOLA"]


PHONE_SIZE = (590, 1048)  # phone bands (ROOM_PHONE): 1179x2096 masters, checked at half size


def is_phone(room):
    return room.endswith("_PHONE")


SIDE_SIZE = (1266, 585)  # CLUBSIDE: the Club room phone sideways (2532x1170), checked at half size


def wooden(room):
    if is_phone(room):
        r = room[:-6]
        if r == "LOADING":
            return os.path.join(ROOT, "assets/loading/ENV_LOADING_PHONE_HC.webp")
        if r == "SIGNIN":  # sign-in / error lounge (B7 kit mk_signin.py): the Settings lounge V2
            return os.path.join(ROOT, "visual-assets/v10_1/plates-v2/ENV_SETTINGS_PHONE_V2.webp")
        if r == "LR":  # League Roulette phone: the men-free Directors' box V4 (HO-097)
            return os.path.join(ROOT, "visual-assets/v10_1/plates-hc/ENV_BOX_PHONE_HC_V4.webp")
        return os.path.join(ROOT, f"visual-assets/v10_1/plates-hc/ENV_{r}_PHONE_HC_{'V4' if r == 'CLUB' else 'V3'}.webp")
    if room == "LR":
        return os.path.join(ROOT, "visual-assets/v10_1/plates-hc/ENV_BOX_PLATE_HC_V4_2X.webp")
    if room == "SIGNIN":
        return os.path.join(ROOT, "visual-assets/v10_1/plates-v2/ENV_SETTINGS_PLATE_V2_2X.webp")
    if room == "CLUBSIDE":
        return os.path.join(ROOT, "visual-assets/v10_1/plates-hc/ENV_CLUB_SIDEWAYS_HC_V4.webp")
    if room == "LOADING":
        return os.path.join(ROOT, "assets/loading/ENV_LOADING_PLATE_HC_2X.webp")
    if room == "SLAB":
        return os.path.join(ROOT, "visual-assets/v10_1/plates-hc/ENV_SLAB_HC_V1_2X.webp")
    return os.path.join(ROOT, f"visual-assets/v10_1/plates-hc/ENV_{room}_PLATE_HC_V3_2X.webp")


def master(d, room, look):
    if room == "LR_PHONE":
        return os.path.join(d, f"ENV_BOX_PHONE_V4_{look}_P1.webp")
    if room == "CLUBSIDE":
        return os.path.join(d, f"ENV_CLUB_SIDEWAYS_{look}_P1.webp")
    if is_phone(room):
        return os.path.join(d, f"ENV_{room}_{look}_P1.webp")
    if room == "LR":
        return os.path.join(d, f"ENV_BOX_PLATE_EMPTY_{look}_P1_2X.webp")
    return os.path.join(d, f"ENV_SLAB_{look}_P1_2X.webp" if room == "SLAB" else f"ENV_{room}_PLATE_{look}_P1_2X.webp")


def load(p):
    return np.asarray(Image.open(p).convert("RGB").resize(CUR[0], Image.LANCZOS), dtype=np.float32)


CUR = [SIZE]


def luma(a):
    return a[..., 0] * .2126 + a[..., 1] * .7152 + a[..., 2] * .0722


def blur(L, r):
    return np.asarray(Image.fromarray(np.clip(L, 0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(r)), dtype=np.float32)


def free_of(room):
    p = os.path.join(THEMES, "masks", "ENV_BOX_PLATE_HC_V4_1920.png" if room == "LR" else
                     f"ENV_{room}_HC_V3.png" if is_phone(room) else f"ENV_{room}_PLATE_HC_V3_1920.png")
    if not os.path.exists(p):
        return np.ones(CUR[0][::-1], bool)
    m = Image.open(p).convert("L").filter(ImageFilter.MaxFilter(9)).resize(CUR[0])
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


def stats(a, free, lit, room_px=None):
    L = luma(a)
    v = L[free]
    vs = L[free if room_px is None else room_px]
    return dict(luma=float(v.mean()),
                glint=float((((L > 200) & ((L - blur(L, 6)) > 60)) & free & ~lit).sum() / L.size * 1e4),
                spread=float(np.percentile(vs, 95) - np.percentile(vs, 5)),
                detail=float(np.abs(L - blur(L, 2))[free].mean()))


def check(key, room, d, sib):
    look = key.upper()
    CUR[0] = PHONE_SIZE if is_phone(room) else SIDE_SIZE if room == "CLUBSIDE" else SIZE
    cfg = dict(LOOKS[look]); cfg.update(cfg.get("rooms", {}).get(room, {}))
    m, w = master(d, room, look), wooden(room)
    if not os.path.exists(m):
        return None, f"{room}: no {look} master in {d}"
    free = free_of(room)
    M, W = load(m), load(w)
    lit = lit_in(W)
    if cfg.get("view"):  # the city view through the windows is not a room surface: no glint is counted there
        x0, y0, x1, y1 = cfg["view"]; H, Wd = lit.shape
        lit = lit.copy(); lit[int(y0 * H):int(y1 * H), int(x0 * Wd):int(x1 * Wd)] = True
    # Room pixels only for diff, mw and spread: leave out what every existing look keeps identical to Wooden (the
    # stadium view through the window, kept by design in every clubhouse), so a shared view can't dilute or set them.
    shared = np.zeros_like(free)
    sl = [load(master(sib, room, s)) for s in SIBLINGS if os.path.exists(master(sib, room, s))]
    if sl:
        shared = np.max([np.abs(S - W).mean(-1) for S in sl], 0) < 10
    room_px = free & ~shared
    sm, sw = stats(M, free, lit, room_px), stats(W, free, lit, room_px)
    rows = []
    sibs = SIBLINGS + [o for o in ORDER[:ORDER.index(look)]]
    sb = None
    for s in sibs:
        p = master(sib, room, s)
        if not os.path.exists(p):
            continue
        S = load(p)
        if s == "BLACK":
            sb = stats(S, free, lit, room_px)
        diff = float(np.abs(M - S).mean(-1)[room_px].mean())
        rows.append((f"vs {s.lower()}", diff, diff >= 15, ">= 15"))
    mw = float(np.abs(M - W).mean(-1)[room_px].mean())
    rows.append(("mw", mw, mw >= 12, ">= 12"))
    L = luma(M)
    h, s, _ = hsv(M)
    surf = free & (L >= 6) & (L <= 140)
    col = free & (s > 0.15) & (L >= 6)
    if cfg.get("view"):  # the city lights are not a room surface: hue and brown leave them out too (E-25, 26 Nov)
        x0, y0, x1, y1 = cfg["view"]; H, Wd = col.shape
        col = col.copy(); col[int(y0 * H):int(y1 * H), int(x0 * Wd):int(x1 * Wd)] = False
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
    gl = cfg.get("glint_max", gl)
    sp = max(sw["spread"], .75 * sb["spread"]) if sb else sw["spread"]
    # Sign-in lounge: its Wooden is B7's raw Settings V2 plate (blazing gold strips, AI over-sharpening; B7 repaints it
    # too), so its spread and detail are no floor for a handcrafted room. Rooms may set their own floors in LOOKS.
    sp = cfg.get("spread_min", sp)
    dmin = cfg.get("detail_min", 1.05 * sw["detail"])
    rows += [
        ("glint", sm["glint"], sm["glint"] <= gl, f"<= {gl:.1f}" + (f" (Black {sb['glint']:.1f})" if sb else "")),
        ("spread", sm["spread"], sm["spread"] >= sp, f">= {sp:.0f} (Wooden {sw['spread']:.0f})"),
        ("detail", sm["detail"], sm["detail"] >= dmin, f">= {dmin:.2f}"),
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
