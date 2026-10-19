# HO-031 v3 League plate: geometric edits of the approved ENV_LEAGUE_PHONE_V2 plate only.
#   * both managers cut out with their soft mattes and re-placed, uniformly scaled down (Daniel 0.91, Nik 0.82) and moved
#     into the top corners outside the league wheel; their frame-edge arms stay cut by the frame;
#   * the round plinth + floor (everything below the tier back edges) uniformly scaled 1.32x about the bottom centre,
#     so the managers' legs still end behind the plinth (it is in front of them);
#   * the stadium strip each manager vacates on his inner side is rebuilt per row by stretching the stadium between the
#     two men (the plate's own neighbouring pixels) outward; nothing is painted or generated.
#   * any old-manager pixel still uncovered after that is filled by PatchMatch from the stadium around it.
import sys, os, json, time, numpy as np, cv2
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from h31lib import load, warp_layer, over, affine_scale_about, complete2
from PIL import Image

V2, MAT, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
a = load(V2); H, W = a.shape[:2]
Kel = lambda r: cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * r + 1, 2 * r + 1))
FDo, ADo = np.load(f'{MAT}/LEAGUE_DANIEL_F.npy').astype(np.float32), np.load(f'{MAT}/LEAGUE_DANIEL_A.npy').astype(np.float32)
FNo, ANo = np.load(f'{MAT}/LEAGUE_NIK_F.npy').astype(np.float32), np.load(f'{MAT}/LEAGUE_NIK_A.npy').astype(np.float32)
E = np.load(f'{MAT}/LEAGUE_envelope.npy')

DAN = dict(scale=0.91, tx=-45.0, ty=-18.0)
NIK = dict(scale=0.82, tx=1179 * 0.18 + 0.2, ty=48.0)
FL = 1.32
MD = affine_scale_about(DAN['scale'], 0, 0, DAN['tx'], DAN['ty'])
MN = affine_scale_about(NIK['scale'], 0, 0, NIK['tx'], NIK['ty'])
ML = affine_scale_about(FL, 589.5, 2096.0)

# ---- layers in final position
FD, AD = warp_layer(FDo, ADo, MD, (H, W)); FN, AN = warp_layer(FNo, ANo, MN, (H, W))
yy = np.arange(H)[:, None]
lm = cv2.GaussianBlur((yy >= (E[None, :] - 3)).astype(np.float32), (0, 0), 0.8)
FB, AB = warp_layer(a, lm, ML, (H, W))

# ---- background: per-row outward stretch of the stadium between the men
old_d = cv2.dilate((ADo > 0.02).astype(np.uint8), Kel(5)) > 0
old_n = cv2.dilate((ANo > 0.02).astype(np.uint8), Kel(5)) > 0
new_d = cv2.erode((AD > 0.98).astype(np.uint8), Kel(3)) > 0
new_n = cv2.erode((AN > 0.98).astype(np.uint8), Kel(3)) > 0
NEG, POS = -1e9, 1e9
def edge(m, side):
    v = np.full(H, NEG if side == 'r' else POS)
    for y in range(H):
        r = np.where(m[y])[0]
        if len(r): v[y] = r.max() if side == 'r' else r.min()
    return v
oR, oL = edge(old_d, 'r'), edge(old_n, 'l')
nR, nL = edge(new_d, 'r'), edge(new_n, 'l')
def run(v, r, fn):
    out = v.copy()
    for y in range(H): out[y] = fn(v[max(0, y - r):y + r + 1])
    return out
def smooth_env(v, r, fn, sig=8):
    valid = np.abs(v) < 1e8
    e = run(np.where(valid, v, np.nan), r, lambda s: (np.nanmax(s) if fn is max else np.nanmin(s)) if np.isfinite(s).any() else np.nan)
    f = np.where(np.isfinite(e), e, 0).astype(np.float32); w = np.isfinite(e).astype(np.float32)
    g = cv2.GaussianBlur(f.reshape(-1, 1), (1, 0), sig).ravel() / np.maximum(cv2.GaussianBlur(w.reshape(-1, 1), (1, 0), sig).ravel(), 1e-6)
    tight = run(np.where(valid, v, np.nan), 3, lambda s: (np.nanmax(s) if fn is max else np.nanmin(s)) if np.isfinite(s).any() else np.nan)
    res = np.where(np.isfinite(tight), (np.maximum if fn is max else np.minimum)(g, tight), np.nan)
    return res
oRs, oLs = smooth_env(oR, 12, max), smooth_env(oL, 12, min)
nRs, nLs = smooth_env(nR, 12, min), smooth_env(nL, 12, max)
ymax_bg = int(np.ceil((2096 - FL * (2096 - E.min())))) + 40       # rows below this are under the scaled plinth
mapx = np.repeat(np.arange(W, dtype=np.float32)[None], H, 0); mapy = np.repeat(np.arange(H, dtype=np.float32)[:, None], W, 1)
xs = np.arange(W, dtype=np.float64)
stretch = []
TAPER = 110
for y in range(min(H, ymax_bg)):
    left = np.isfinite(oRs[y]) and np.isfinite(nRs[y]) and nRs[y] < oRs[y]
    right = np.isfinite(oLs[y]) and np.isfinite(nLs[y]) and nLs[y] > oLs[y]
    if not (left or right): continue
    lo = oRs[y] if np.isfinite(oRs[y]) else 0.0
    hi = oLs[y] if np.isfinite(oLs[y]) else W - 1.0
    c = (lo + hi) / 2 if (np.isfinite(oRs[y]) and np.isfinite(oLs[y])) else (lo + 260 if left else hi - 260)
    m = xs.copy()
    if left:
        a0, a1 = nRs[y], oRs[y]; sel = (xs >= a0) & (xs <= c)
        m[sel] = a1 + (xs[sel] - a0) * (c - a1) / (c - a0); stretch.append((c - a0) / (c - a1))
        o = (xs < a0) & (xs > a0 - TAPER); m[o] = xs[o] + (a1 - a0) * (1 - (a0 - xs[o]) / TAPER)   # continuous, under the new man
    if right:
        b0, b1 = nLs[y], oLs[y]; sel = (xs >= c) & (xs <= b0)
        m[sel] = c + (xs[sel] - c) * (b1 - c) / (b0 - c); stretch.append((b0 - c) / (b1 - c))
        o = (xs > b0) & (xs < b0 + TAPER); m[o] = xs[o] + (b1 - b0) * (1 - (xs[o] - b0) / TAPER)
    mapx[y] = m
# ramp the stretch in and out vertically (cone dilation of the displacement, RAMP rows to full strength), so no row
# boundary shows where a manager's old silhouette starts or ends; the map stays monotone in every row.
RAMP = 90
D = mapx - np.arange(W, dtype=np.float32)[None]
P = np.maximum(D, 0); N = np.maximum(-D, 0); Ps = P.copy(); Ns = N.copy()
for k in range(1, RAMP):
    w = 1 - k / RAMP
    Ps[k:] = np.maximum(Ps[k:], P[:-k] * w); Ps[:-k] = np.maximum(Ps[:-k], P[k:] * w)
    Ns[k:] = np.maximum(Ns[k:], N[:-k] * w); Ns[:-k] = np.maximum(Ns[:-k], N[k:] * w)
mapx = np.arange(W, dtype=np.float32)[None] + Ps - Ns
mapx = np.maximum.accumulate(np.clip(mapx, 0, W - 1), axis=1)
bg = cv2.remap(a, mapx, mapy, cv2.INTER_LANCZOS4, borderMode=cv2.BORDER_REFLECT)
oldm = (old_d | old_n).astype(np.float32)
contam = cv2.remap(oldm, mapx, mapy, cv2.INTER_LINEAR) > 0.01

# ---- residual: old-manager pixels still visible -> PatchMatch from the stadium around them
cover = (AD > 0.985) | (AN > 0.985) | (AB > 0.985)
hole = contam & ~cover
known = ~contam & ~(lm > 0.01)
t = time.time()
if hole.any():
    bg = complete2(np.clip(bg, 0, 1), hole, known, r=4, band=120, seed=7)
print('residual fill', int(hole.sum()), 'px in', round(time.time() - t, 1), 's')
out = over(over(bg, FD, AD), FN, AN)
out = np.clip(over(out, FB, AB), 0, 1)
os.makedirs(OUT, exist_ok=True)
u8 = (out * 255 + 0.5).astype(np.uint8)
Image.fromarray(u8).save(f'{OUT}/ENV_LEAGUE_PHONE_V3.png')
Image.fromarray(u8).save(f'{OUT}/ENV_LEAGUE_PHONE_V3.webp', quality=88, method=6)
np.save(f'{OUT}/LEAGUE_hole.npy', hole)
st = np.array(stretch) if stretch else np.array([1.0])
json.dump({'LEAGUE': {'managers': {'daniel': DAN, 'nik': NIK}, 'plinth_floor_scale': FL, 'plinth_scale_about': [589.5, 2096],
           'stadium_row_stretch_max': round(float(st.max()), 2), 'stadium_row_stretch_median': round(float(np.median(st)), 2),
           'patchmatch_filled_px': int(hole.sum())}}, open(f'{OUT}/transforms_LEAGUE.json', 'w'), indent=1)
print('stretch max', st.max(), 'median', np.median(st), 'ymax_bg', ymax_bg)
