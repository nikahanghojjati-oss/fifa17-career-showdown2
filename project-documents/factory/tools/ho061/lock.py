"""HO-061 intake: put GPT pixels back ONLY inside the cyan boxes, everything else stays the original (0 px shift).

python3 project-documents/factory/tools/ho061/lock.py KEY gpt.png
KEY = a DESK key (e.g. HOME), RIVALRY_PHONE, or HOME_PHONE / CONNECT_PLAYERS_PHONE / LEGACY_PHONE.
Writes visual-assets/v10_1/plates-v6/... and a before/after preview in reviews/HO-061/.
"""
import os, sys
import cv2, numpy as np
from PIL import Image
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from boxes import DESK, RIVALRY_PHONE, PHONE_EXTRA, PHONE_SCALE

V = "visual-assets/v10_1"; OUT = f"{V}/plates-v6"; REV = "project-documents/factory/reviews/HO-061"
BASE = "project-documents/factory/tools/ho061/base"
os.makedirs(OUT, exist_ok=True); os.makedirs(REV, exist_ok=True)
key, gpt_path = sys.argv[1], sys.argv[2]


def load(p):
    return np.asarray(Image.open(p).convert("RGB"))


def fit(g, base, boxes):
    """Similarity-fit the GPT picture onto base using matches outside the boxes."""
    H, W = base.shape[:2]
    keep = np.full((H, W), 255, np.uint8)
    for x0, y0, x1, y1 in boxes:
        keep[max(0, y0 - 24):y1 + 24, max(0, x0 - 24):x1 + 24] = 0
    # rough pre-scale so GPT matches base size
    if g.shape[1] / g.shape[0] > W / H * 1.15:   # GPT has black side bars (phone guide)
        sx = 864 / 1024; c0 = 80; g = g[:, c0:c0 + 864]
    elif g.shape[0] / g.shape[1] > H / W * 1.08:  # GPT has black top/bottom bars (desktop guide)
        r0 = round(g.shape[0] * 80 / 1024); g = g[r0:g.shape[0] - r0]
    g = cv2.resize(g, (W, H), interpolation=cv2.INTER_LANCZOS4)
    orb = cv2.ORB_create(8000)
    k1, d1 = orb.detectAndCompute(cv2.cvtColor(g, cv2.COLOR_RGB2GRAY), keep)
    k2, d2 = orb.detectAndCompute(cv2.cvtColor(base, cv2.COLOR_RGB2GRAY), keep)
    ms = sorted(cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True).match(d1, d2), key=lambda x: x.distance)[:800]
    A, inl = cv2.estimateAffinePartial2D(np.float32([k1[m.queryIdx].pt for m in ms]),
                                         np.float32([k2[m.trainIdx].pt for m in ms]), ransacReprojThreshold=3)
    print("fit", np.round(A, 4).tolist(), int(inl.sum()), "/", len(ms))
    return cv2.warpAffine(g, A, (W, H), flags=cv2.INTER_LANCZOS4, borderMode=cv2.BORDER_REPLICATE)


def blend(base, gw, boxes, grow=10, feather=5):
    H, W = base.shape[:2]
    m = np.zeros((H, W), np.float32)
    for x0, y0, x1, y1 in boxes:
        m[max(0, y0 - grow):y1 + grow, max(0, x0 - grow):x1 + grow] = 1
    m = cv2.GaussianBlur(m, (0, 0), feather)[:, :, None]
    return (gw * m + base * (1 - m)).astype(np.uint8), m


def save_webp(arr, out, ref):
    lim = os.path.getsize(ref) * 1.10
    im = Image.fromarray(arr)
    for q in (92, 90, 88, 86, 84, 82, 80, 78, 76, 74):
        im.save(out, quality=q, method=6)
        if os.path.getsize(out) <= lim:
            break
    print(out, os.path.getsize(out), "limit", int(lim), "q", q)


def cyan_left(a):
    a = a.astype(int)
    return int(((a[:, :, 0] < 60) & (a[:, :, 1] > 200) & (a[:, :, 2] > 200)).sum())


def preview(before, after, name):
    b, a = Image.fromarray(before), Image.fromarray(after)
    if b.width > b.height:
        s = Image.new("RGB", (b.width, b.height * 2)); s.paste(b, (0, 0)); s.paste(a, (0, b.height))
    else:
        s = Image.new("RGB", (b.width * 2 + 20, b.height), "white"); s.paste(b, (0, 0)); s.paste(a, (b.width + 20, 0))
    s.thumbnail((1400, 1400)); s.save(f"{REV}/{name}_BEFORE_AFTER.jpg", quality=84)


g = load(gpt_path)
if key in DESK:
    ref1 = f"{V}/plates-v2/ENV_{key}_PLATE_V2_1X.webp"; ref2 = f"{V}/plates-v2/ENV_{key}_PLATE_V2_2X.webp"
    base = load(ref1); boxes = DESK[key]
    out, m = blend(base, fit(g, base, boxes), boxes)
    save_webp(out, f"{OUT}/ENV_{key}_PLATE_V6_1X.webp", ref1)
    b2 = load(ref2); H2, W2 = b2.shape[:2]
    up = cv2.resize(out, (W2, H2), interpolation=cv2.INTER_LANCZOS4)
    m2 = cv2.resize(m[:, :, 0], (W2, H2), interpolation=cv2.INTER_LINEAR)[:, :, None]
    save_webp((up * m2 + b2 * (1 - m2)).astype(np.uint8), f"{OUT}/ENV_{key}_PLATE_V6_2X.webp", ref2)
    preview(base, out, key)
elif key == "RIVALRY_PHONE":
    ref = f"{V}/plates-v3/ENV_RIVALRY_PHONE_V3.webp"; base = load(ref)
    out, _ = blend(base, fit(g, base, RIVALRY_PHONE), RIVALRY_PHONE)
    save_webp(out, f"{OUT}/ENV_RIVALRY_PHONE_V6.webp", ref); preview(base, out, key)
else:
    k = key.replace("_PHONE", "")
    ref = f"{V}/plates-v2/ENV_{k}_PHONE_V2.webp"
    base = load(f"{BASE}/{k}_PHONE_SHRUNK.png"); H, W = base.shape[:2]
    w, h = round(W * PHONE_SCALE), round(H * PHONE_SCALE); x0 = (W - w) // 2
    from boxes import PHONE_UP
    boxes = [(0, 0, x0 - 1, H), (x0 + w, 0, W, H), (0, h - PHONE_UP, W, H)] + PHONE_EXTRA[k]
    out, _ = blend(base, fit(g, base, boxes), boxes)
    save_webp(out, f"{OUT}/ENV_{k}_PHONE_V6.webp", ref); preview(load(ref), out, f"{k}_PHONE")
print("cyan px left", cyan_left(out))
