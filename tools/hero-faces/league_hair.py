"""F-3 League Roulette hair proof (Duet P4, Nik 2026-11-26; lead N-3 2026-11-27: every clubhouse).

The V4 Box room is painted empty, so the men's outer hair must come from the Wooden plate (paint.py hair_over_empty), not
from the painted wall. The hair band is every pixel outside the pulled-in hero cut, within (HAIR_GROW - HAIR_RAMP) px of it,
that differs from Team V's Wooden empty room by at least HAIR_T1 levels (all hair on the Wooden plate). In a fixed file those
pixels match the Wooden plate (WebP noise only); in a file laid through the cut alone they are the painted wall.
Measured 2026-11-27: fixed files 5 to 9 levels mean, cut-off files 60 to 93. Pass: mean <= MAX_MEAN.

usage: python3 tools/hero-faces/league_hair.py            writes tests/fixtures/team-v/P4_F3_LEAGUE_HAIR.json
       python3 tools/hero-faces/league_hair.py FILE...    prints the band score of each file (any clubhouse)"""
import sys, os, json, hashlib
import numpy as np, cv2
from PIL import Image
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
sys.path.insert(0, os.path.join(ROOT, "tools/clubhouse-themes"))
import paint as P
PLATES = "visual-assets/v10_1/plates-hc"
FIXTURE = "tests/fixtures/team-v/P4_F3_LEAGUE_HAIR.json"
SIZES = ("1920", "1X", "2X")
MAX_MEAN = 20.0

def band(size):
    wood = Image.open(os.path.join(ROOT, PLATES, f"ENV_BOX_PLATE_HC_V4_{size}.webp")).convert("RGB")
    S = wood.size; s = S[0] / 1920
    bw = Image.open(P.WOOD_EMPTY_V4).convert("RGB")
    if bw.size != S: bw = bw.resize(S, Image.LANCZOS)
    w = np.asarray(wood, np.float32); b = np.asarray(bw, np.float32)
    raw = np.asarray(Image.open(os.path.join(P.MASKS, P.HAIR_MASK + ".png")).convert("L").resize(S, Image.LANCZOS), np.float32) / 255
    dist = cv2.distanceTransform((raw < 0.5).astype(np.uint8), cv2.DIST_L2, 5)
    core = P.hero_mask("BOX", S, P.HAIR_MASK)[..., 0]
    m = (core < 0.5) & (dist < (P.HAIR_GROW - P.HAIR_RAMP) * s) & (np.abs(w - b).max(-1) >= P.HAIR_T1)
    return w, m

def score(path, size, cache={}):
    if size not in cache: cache[size] = band(size)
    w, m = cache[size]
    a = np.asarray(Image.open(path).convert("RGB"), np.float32)
    assert a.shape == w.shape, f"{path}: {a.shape[1]}x{a.shape[0]}, the Wooden {size} plate is {w.shape[1]}x{w.shape[0]}"
    d = np.abs(a - w).max(-1)[m]
    return {"sha256": hashlib.sha256(open(path, "rb").read()).hexdigest(), "band_px": int(m.sum()),
            "band_mean": round(float(d.mean()), 2), "band_p90": round(float(np.percentile(d, 90)), 1)}

def main():
    if len(sys.argv) > 1:
        for f in sys.argv[1:]:
            size = next(z for z in SIZES if f.endswith(f"_{z}.webp"))
            print(f, json.dumps(score(f, size)))
        return
    themes = sorted(d for d in os.listdir(os.path.join(ROOT, PLATES)) if os.path.isdir(os.path.join(ROOT, PLATES, d)))
    files = {}
    for t in themes:
        for z in SIZES:
            rel = f"{PLATES}/{t}/ENV_BOX_PLATE_HC_V4_{z}.webp"
            r = score(os.path.join(ROOT, rel), z)
            assert r["band_mean"] <= MAX_MEAN, f"{rel}: hair band {r['band_mean']} levels off the Wooden hair (max {MAX_MEAN})"
            files[rel] = r; print(rel, r["band_mean"])
    out = {"note": __doc__.split("\n\n")[0], "max_mean": MAX_MEAN, "clubhouses": themes, "files": files}
    with open(os.path.join(ROOT, FIXTURE), "w") as fh: json.dump(out, fh, indent=1); fh.write("\n")

if __name__ == "__main__":
    main()
