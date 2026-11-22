import numpy as np, hashlib, sys
from PIL import Image
from scipy import ndimage as nd

def unpremul(rgb, a):
    af = np.clip(a, 1e-3, 1)[..., None]
    return np.clip(rgb / af, 0, 255)

# ---- trophy: background = near-black region connected to the border; soft edge from brightness in a thin band
raw = np.asarray(Image.open("TRO_EUROPA_RAW_try1.png").convert("RGB")).astype(float)
m = raw.max(2)
low = m <= 14
lab, n = nd.label(low)
border = set(np.unique(np.r_[lab[0], lab[-1], lab[:, 0], lab[:, -1]])) - {0}
bg = np.isin(lab, list(border))
bg = nd.binary_opening(bg, iterations=1, border_value=1)
fg = ~bg
fg = nd.binary_fill_holes(fg)
dist_out = nd.distance_transform_edt(~fg)   # distance from fg for bg pixels
band = (~fg) & (dist_out <= 3)
a = fg.astype(float)
a[band] = np.clip((m[band] - 4) / 40.0, 0, 1)
# the gold glow round the bowl and stem (no black material above the base, y < 1150): dim pixels near the edge become soft
dist_in = nd.distance_transform_edt(fg)
yy = np.arange(m.shape[0])[:, None] * np.ones_like(m)
glow = (band | (fg & (dist_in <= 45) & (m < 110))) & (yy < 1150)
a[glow] = np.clip((m[glow] - 45) / 65.0, 0, 1) ** 1.3
# 1 px erode of the solid edge (same intake as the other four), then soft 0.6px blur
a = nd.grey_erosion(a, size=(2, 2)) * 0.5 + a * 0.5
a = nd.gaussian_filter(a, 0.6)
rgb = unpremul(raw, a)
# warm edge fringe: semi-transparent edge pixels get the trophy's own gold/silver (no red cast)
edge = (a > 0.02) & (a < 0.9)
r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
red = edge & (r > g * 1.25)
rgb[red, 0] = g[red] * 1.12
A = np.round(a * 255)
A[(A >= 248) & (A < 255)] = 255
img = Image.fromarray(np.dstack([rgb, A]).astype(np.uint8), "RGBA")
bb = img.getchannel("A").point(lambda v: 255 if v > 8 else 0).getbbox()
print("trophy bbox", bb)
crop = img.crop(bb)
# match TRO_CONTINENTAL_V1: content y 11..1497 on a 1024x1536 canvas (height 1486), centred
H = 1486; s = H / crop.height
w = round(crop.width * s)
if w > 1000: s = 1000 / crop.width; w = 1000; H = round(crop.height * s)
crop = crop.resize((w, H), Image.LANCZOS)
can = Image.new("RGBA", (1024, 1536), (0, 0, 0, 0))
can.alpha_composite(crop, ((1024 - w) // 2, 1497 - H))
can.save("TRO_EUROPA_V1.png", optimize=True)
can.save("TRO_EUROPA_V1_1536.webp", quality=88, method=6)
can.resize((341, 512), Image.LANCZOS).save("TRO_EUROPA_V1_512.webp", quality=90, method=6)
print("trophy scale", round(s, 3), "size", w, H)

# ---- title: luminance key on black (as the other job-124 brush titles)
raw = np.asarray(Image.open("TITLE_CONNECT_PLAYERS_RAW_try1.png").convert("RGB")).astype(float)
m = raw.max(2)
a = np.clip((m - 10) / 110.0, 0, 1)
rgb = unpremul(raw, a)
A = np.round(a * 255); A[(A >= 248) & (A < 255)] = 255
img = Image.fromarray(np.dstack([rgb, A]).astype(np.uint8), "RGBA")
bb = img.getchannel("A").point(lambda v: 255 if v > 6 else 0).getbbox()
pad = 12
bb = (max(0, bb[0] - pad), max(0, bb[1] - pad), min(img.width, bb[2] + pad), min(img.height, bb[3] + pad))
t = img.crop(bb); print("title master", t.size)
t.save("TITLE_CONNECT_PLAYERS_V1.png", optimize=True)
q = 85
small = t.resize((1400, round(t.height * 1400 / t.width)), Image.LANCZOS)
while True:
    small.save("TITLE_CONNECT_PLAYERS_V1.webp", quality=q, method=6)
    import os
    if os.path.getsize("TITLE_CONNECT_PLAYERS_V1.webp") <= 120000 or q <= 50: break
    q -= 5
print("title webp", small.size, "q", q)
for f in ["TRO_EUROPA_V1.png", "TRO_EUROPA_V1_1536.webp", "TRO_EUROPA_V1_512.webp", "TITLE_CONNECT_PLAYERS_V1.png", "TITLE_CONNECT_PLAYERS_V1.webp", "TRO_EUROPA_RAW_try1.png", "TITLE_CONNECT_PLAYERS_RAW_try1.png"]:
    d = open(f, "rb").read(); print(f, len(d), hashlib.sha256(d).hexdigest())
