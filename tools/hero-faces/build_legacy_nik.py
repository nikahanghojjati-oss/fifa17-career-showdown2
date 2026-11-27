"""F-1 Legacy Nik: carry the E2 head (Nik picked 2026-11-26 18:19 UTC, kept 19:55 over E3) into every Wooden archive file.
usage: python3 tools/hero-faces/build_legacy_nik.py E2_FULL.png REPO OUTDIR
E2_FULL.png is ENV_ARCHIVE_PLATE_HC_V4_2X_F1E2_RAW.png (branch claude-duet/p4-faces-inputs, r100-duet/p4/inputs/F-1/raw) fitted into
today's 2X plate at (1930, 0, 900 px square) by tools/hero-faces/fit_e2.py. Then: tools/clubhouse-themes/paint.py, pin.py,
manifest.py, and never_slimmer.py for tests/fixtures/team-v/P4_F1_LEGACY_NIK_NEVER_SLIMMER.json.
tools/hero-faces/reproduce_wooden_archive.py runs fit_e2.py and this from tools/hero-faces/inputs/F-1 and needs the five
Wooden Archive files that ship to be exactly what they build (lead A-43, 2026-11-27)."""
import sys, os, io, cv2, numpy as np
sys.path.insert(0, os.path.join(sys.argv[2], 'tools/hero-faces')); import never_slimmer as NS
from PIL import Image, ImageFilter
E2, REPO, OUT = sys.argv[1:4]
before_encode = globals().get('before_encode')  # (name, arr) -> arr; set only by reproduce_wooden_archive.py --prove-plants
P = os.path.join(REPO, 'visual-assets/v10_1/plates-hc/')
MASKS = os.path.join(REPO, 'tools/clubhouse-themes/masks/')
os.makedirs(OUT, exist_ok=True)
old2 = np.asarray(Image.open(P + 'ENV_ARCHIVE_PLATE_HC_V3_2X.webp').convert('RGB'))
e2 = np.asarray(Image.open(E2).convert('RGB'))
assert e2.shape == old2.shape
# where E2 differs from today's plate, inside the desktop hero mask only
hm = np.asarray(Image.open(MASKS + 'ENV_ARCHIVE_PLATE_HC_V3_1920.png').convert('L').resize((3072, 1728), Image.LANCZOS), np.float32) / 255
d = (np.abs(old2.astype(int) - e2.astype(int)).max(2) > 2).astype(np.uint8)
d = cv2.dilate(d, np.ones((9, 9), np.uint8))
zone = (d * (hm > 0.5)).astype(np.float32)
zone = cv2.GaussianBlur(zone, (0, 0), 3) * (hm > 0.5)       # about 6 px feather, never outside the hero
np.save(os.path.join(OUT, 'zone2x.npy'), zone)

def encode(img, limit, floor=76):
    for q in range(90, floor - 2, -2):
        b = io.BytesIO(); img.save(b, 'WEBP', quality=q, method=6)
        if b.tell() <= limit or q == floor: return b.getvalue(), q

def cover(arr, old, mask):
    # never slimmer: where the new head stops short of today's outline, carry his own edge (beard, hair) out to it
    out, n = NS.cover(arr, old, mask, 'right')
    if n: print('  edge carried out px', n)
    return out

def write(name, arr, ref, mask):
    if before_encode: arr = before_encode(name, arr)   # proof seam only, never set by a build
    lim = int(os.path.getsize(P + ref) * 1.06)
    old = np.asarray(Image.open(P + ref).convert('RGB'))
    for rnd in range(4):   # WebP can nudge a rim pixel: put today's pixels back there and encode again
        data, q = encode(Image.fromarray(arr), lim)
        dec = np.asarray(Image.open(io.BytesIO(data)).convert('RGB'))
        short = int(NS.measure(dec.astype(np.uint8), old, mask, 'right')[3].sum())
        if not short: break
        arr = cover(arr, old, mask); print('  re-encode, short outline pts', short)
    open(os.path.join(OUT, name), 'wb').write(data); print(name, arr.shape[1], arr.shape[0], 'q', q, len(data), 'old', os.path.getsize(P + ref))

# desktop: 2X is E2 itself inside the zone; 1X and 1920 are today's cut with E2 (resized) laid in the same zone
for n, s in (('2X', (3072, 1728)), ('1X', (1536, 864)), ('1920', (1920, 1080))):
    o = np.asarray(Image.open(P + f'ENV_ARCHIVE_PLATE_HC_V3_{n}.webp').convert('RGB'), np.float32)
    e = np.asarray(Image.fromarray(e2).resize(s, Image.LANCZOS), np.float32) if s != (3072, 1728) else e2.astype(np.float32)
    z = cv2.resize(zone, s, interpolation=cv2.INTER_AREA)[..., None]
    comp = np.clip(o * (1 - z) + e * z + .5, 0, 255).astype(np.uint8)
    write(f'ENV_ARCHIVE_PLATE_HC_V3_{n}.webp', cover(comp, o.astype(np.uint8), 'ENV_ARCHIVE_PLATE_HC_V3_1920'), f'ENV_ARCHIVE_PLATE_HC_V3_{n}.webp', 'ENV_ARCHIVE_PLATE_HC_V3_1920')

# phone: the same man sits in a different room framing; map desktop -> phone on the man's head, then lay E2's head in
ph = np.asarray(Image.open(P + 'ENV_ARCHIVE_PHONE_HC_V3.webp').convert('RGB'))
pm = np.asarray(Image.open(MASKS + 'ENV_ARCHIVE_PHONE_HC_V3.png').convert('L'), np.float32) / 255
sift = cv2.SIFT_create(10000)
g1 = cv2.cvtColor(old2, cv2.COLOR_RGB2GRAY); g2 = cv2.cvtColor(ph, cv2.COLOR_RGB2GRAY)
m1 = ((cv2.dilate(d, np.ones((41, 41), np.uint8)) * (hm > .5)) * 255).astype(np.uint8)
m2 = ((pm > .5) * 255).astype(np.uint8)
k1, d1 = sift.detectAndCompute(g1, m1); k2, d2 = sift.detectAndCompute(g2, m2)
good = [a for a, b in cv2.BFMatcher().knnMatch(d1, d2, k=2) if a.distance < 0.75 * b.distance]
src = np.float32([k1[a.queryIdx].pt for a in good]); dst = np.float32([k2[a.trainIdx].pt for a in good])
A, inl = cv2.estimateAffinePartial2D(src, dst, ransacReprojThreshold=2)
res = np.linalg.norm((src[inl[:, 0] == 1] @ A[:, :2].T + A[:, 2]) - dst[inl[:, 0] == 1], axis=1).mean()
print('phone affine', A.round(4).tolist(), 'matches', len(good), 'inliers', int(inl.sum()), 'residual px', round(float(res), 2))
W, H = ph.shape[1], ph.shape[0]
wo = cv2.warpAffine(old2, A, (W, H), flags=cv2.INTER_AREA).astype(np.float32)
we = cv2.warpAffine(e2, A, (W, H), flags=cv2.INTER_AREA).astype(np.float32)
wz = cv2.warpAffine(zone, A, (W, H), flags=cv2.INTER_LINEAR) * (pm > .5)
# colour: the phone file's grade of the same man; carry E2 by its change from today's desktop, not its absolute colour
core = wz > .9
gain = (ph[core].astype(np.float32).mean(0) + 1) / (wo[core].mean(0) + 1)
print('phone colour gain', gain.round(3).tolist())
new = ph.astype(np.float32) + (we - wo) * gain * wz[..., None]
newp = cover(np.clip(new + .5, 0, 255).astype(np.uint8), ph, 'ENV_ARCHIVE_PHONE_HC_V3')
write('ENV_ARCHIVE_PHONE_HC_V3.webp', newp, 'ENV_ARCHIVE_PHONE_HC_V3.webp', 'ENV_ARCHIVE_PHONE_HC_V3')
p590 = np.asarray(Image.open(P + 'ENV_ARCHIVE_PHONE_HC_V3_590W.webp').convert('RGB'))
write('ENV_ARCHIVE_PHONE_HC_V3_590W.webp', cover(np.asarray(Image.fromarray(newp).resize((590, 1049), Image.LANCZOS)), p590, 'ENV_ARCHIVE_PHONE_HC_V3'), 'ENV_ARCHIVE_PHONE_HC_V3_590W.webp', 'ENV_ARCHIVE_PHONE_HC_V3')
np.save(os.path.join(OUT, 'zone_phone.npy'), wz)
