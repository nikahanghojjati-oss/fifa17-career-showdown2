# HO-031 v3 Trophy Room plate: one continuous geometric warp of the approved ENV_TROPHY_ROOM_PHONE_V2 plate.
# No cut-outs, no painting, no generated or synthesised pixels: every output pixel is a resampled V2 pixel.
#   1. Split shift: everything left of a per-row central band moves S px left, everything right of it moves S px right.
#      The band itself (empty corridor between the two managers, and the pedestal in its rows) is stretched
#      horizontally to close the gap. Neither manager is inside the band, so both men are only translated.
#   2. Whole content uniformly scaled by K about (590, YA): both men shrink by the same factor, nothing is enlarged.
#   3. Edge rows uncovered by step 2: the ceiling band (top) and the reflective floor (bottom, below both men's feet)
#      are stretched vertically from the plate's own rows.
import sys, os, json, numpy as np, cv2
from PIL import Image

V2, MAT, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
S, K, YA = 90.0, 0.885, 187.0
TOP_SRC = 60.0           # V2 ceiling rows 0..TOP_SRC fill the top of the frame
PAD = 12                 # band keeps this many px away from each man's matte
CX = 590.0

a = np.asarray(Image.open(V2).convert('RGB')).astype(np.float32) / 255.0
H, W = a.shape[:2]
AD = np.load(f'{MAT}/TROPHY_ROOM_DANIEL_A.npy'); AN = np.load(f'{MAT}/TROPHY_ROOM_NIK_A.npy')

# ---- per-row central band [ba(y), bb(y)] in V2 coordinates -------------------------------------------------------
dR = np.full(H, -1e9); nL = np.full(H, 1e9)
for y in range(H):
    r = np.where(AD[y] > 0.03)[0]
    if len(r): dR[y] = r.max() + PAD
    r = np.where(AN[y] > 0.03)[0]
    if len(r): nL[y] = r.min() - PAD
PED_TOP = 983
def ped_extent(y):
    # pedestal silhouette (same polygon as the matte script) incl. top bevel and widening base steps
    pts = [(983, 402, 775), (1014, 372, 808), (1780, 372, 808), (1795, 351, 830), (1850, 350, 836), (1865, 326, 860), (H, 326, 860)]
    for (y0, l0, r0), (y1, l1, r1) in zip(pts[:-1], pts[1:]):
        if y0 <= y <= y1:
            t = (y - y0) / max(1, y1 - y0); return l0 + t * (l1 - l0), r0 + t * (r1 - r0)
    return 372, 808
ba = np.zeros(H); bb = np.zeros(H)
win = 30
for y in range(PED_TOP):
    lo = 0; hi = min(PED_TOP, y + win + 1)
    ba[y] = max(470.0, dR[lo:hi].max())     # cumulative from the top: constant band above the shoulders
    bb[y] = min(708.0, nL[lo:hi].min())
# relax back towards the pedestal span just above the pedestal top so the switch is continuous
for y in range(PED_TOP, H):
    ba[y], bb[y] = ped_extent(y)
t0 = 935
for y in range(t0, PED_TOP):
    t = (y - t0) / (PED_TOP - t0); t = t * t * (3 - 2 * t)
    l, r = ped_extent(PED_TOP)
    ba[y] = max((1 - t) * ba[y] + t * l, dR[max(0, y - 6):y + 7].max())
    bb[y] = min((1 - t) * bb[y] + t * r, nL[max(0, y - 6):y + 7].min())
# light vertical smoothing of the upper band (never into a man)
for arr, req, fn in ((ba, dR, np.maximum), (bb, nL, np.minimum)):
    sm = cv2.GaussianBlur(arr[:PED_TOP].reshape(-1, 1).astype(np.float32), (1, 0), 6).ravel()
    env = np.array([req[max(0, y - 8):y + 9].max() if fn is np.maximum else req[max(0, y - 8):y + 9].min() for y in range(PED_TOP)])
    arr[:t0] = fn(sm[:t0], env[:t0])
assert (bb - ba > 30).all()

# ---- output row -> V2 row --------------------------------------------------------------------------------------
Yo = np.arange(H, dtype=np.float64)
T1 = YA + K * (TOP_SRC - YA)                  # output row where the plain scaled content starts
feet = max(np.where((AD > 0.3).any(1))[0].max(), np.where((AN > 0.3).any(1))[0].max())
Y0 = YA + K * (feet + 6 - YA)                 # first output row below both men's shoes
Yend = YA + K * (H - YA)
L = H - Y0; need = Yend - Y0
MCAP = 3.0                                      # floor magnification ramps up from 1 below the shoes, capped
def floor_cum(k):
    g = np.minimum(1 + k * np.arange(int(np.ceil(L)) + 2), MCAP)
    return np.concatenate([[0], np.cumsum(1 / g)])
lo_k, hi_k = 1e-6, 1.0
for _ in range(100):
    k = (lo_k + hi_k) / 2
    if np.interp(L, np.arange(len(floor_cum(k))), floor_cum(k)) > need: lo_k = k
    else: hi_k = k
FC = floor_cum(k)
ysrc = np.empty(H)
for i, Y in enumerate(Yo):
    if Y < T1:   ysrc[i] = Y * TOP_SRC / T1
    elif Y <= Y0: ysrc[i] = YA + (Y - YA) / K
    else:
        Yc = Y0 + np.interp(Y - Y0, np.arange(len(FC)), FC)
        ysrc[i] = YA + (Yc - YA) / K
ysrc = np.clip(ysrc, 0, H - 1)

# ---- output column -> V2 column, per output row ------------------------------------------------------------------
xs_out = np.arange(W, dtype=np.float64)
xp = CX + (xs_out - CX) / K                    # undo the uniform scale -> split-shifted coordinates
mapx = np.empty((H, W), np.float32); mapy = np.empty((H, W), np.float32)
for i in range(H):
    y = ysrc[i]; y0 = int(np.floor(y)); y1 = min(H - 1, y0 + 1); f = y - y0
    A_ = (1 - f) * ba[y0] + f * ba[y1]; B_ = (1 - f) * bb[y0] + f * bb[y1]
    x = np.where(xp < A_ - S, xp + S, np.where(xp > B_ + S, xp - S, A_ + (xp - (A_ - S)) * (B_ - A_) / (B_ - A_ + 2 * S)))
    mapx[i] = x; mapy[i] = y
out = cv2.remap(a, mapx, mapy, cv2.INTER_LANCZOS4, borderMode=cv2.BORDER_REFLECT)
out = np.clip(out, 0, 1)
os.makedirs(OUT, exist_ok=True)
u8 = (out * 255 + 0.5).astype(np.uint8)
Image.fromarray(u8).save(f'{OUT}/ENV_TROPHY_ROOM_PHONE_V3.png')
Image.fromarray(u8).save(f'{OUT}/ENV_TROPHY_ROOM_PHONE_V3.webp', quality=88, method=6)
np.save(f'{OUT}/TROPHY_ROOM_map.npy', np.stack([mapx, mapy]).astype(np.float32))

def fwd(x, y, side):
    """V2 point of a manager (outside the band) -> v3 point."""
    xs = x - S if side == 'DANIEL' else x + S
    return CX + K * (xs - CX), YA + K * (y - YA)
json.dump({'TROPHY_ROOM': {'split_shift_px_each_side': S, 'uniform_scale': K, 'scale_about': [CX, YA],
           'band_px_v2': {'y<560': [round(float(ba[300]), 1), round(float(bb[300]), 1)], 'y=800': [round(float(ba[800]), 1), round(float(bb[800]), 1)],
                          'pedestal_rows': 'pedestal silhouette'},
           'max_band_stretch': round(float(((bb - ba + 2 * S) / (bb - ba)).max()), 3),
           'top_rows_from_v2_rows': [0, TOP_SRC], 'floor_stretch_from_output_row': round(float(Y0), 1),
           'floor_max_magnification': MCAP}}, open(f'{OUT}/transforms_TROPHY_ROOM.json', 'w'), indent=1)
print('band 300', ba[300], bb[300], ' 800', ba[800], bb[800], ' 960', ba[960], bb[960], 'maxstretch', ((bb - ba + 2 * S) / (bb - ba)).max())
print('T1', T1, 'Y0', Y0, 'Yend', Yend, 'k', k, 'cap reached at row', Y0 + (MCAP - 1) / k)
for side, z in (('DANIEL', [0.2094, 0.1646, 0.3627, 0.2764]), ('NIK', [0.6416, 0.1535, 0.8147, 0.282])):
    x0, y0_ = fwd(z[0] * W, z[1] * H, side); x1, y1_ = fwd(z[2] * W, z[3] * H, side)
    print(side, 'zone px', round(x0, 1), round(y0_, 1), round(x1, 1), round(y1_, 1))
