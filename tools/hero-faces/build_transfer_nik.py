"""F-2 Transfer Nik: carry the H head (Nik picked 2026-11-27 20:59 UTC, ChatGPT chat mode, one picture in one go) into every Wooden office file.
usage: python3 tools/hero-faces/build_transfer_nik.py H_FULL.png REPO OUTDIR
H_FULL.png is ENV_OFFICE_PLATE_HC_V4_2X_F2H_RAW.png (branch claude-duet/p4-faces-inputs, r100-duet/p4/inputs/F-2/raw) fitted into
today's 2X plate at (1700, 0, 900 px square). Same steps as build_legacy_nik.py (F-1): zone inside the hero mask, about 6 px feather,
never_slimmer cover, desktop 2X/1X/1920, phone mapped on the man's head (same art at 0.478). Then tools/clubhouse-themes/paint.py,
pin.py, manifest.py, and never_slimmer.py for tests/fixtures/team-v/P4_F2_TRANSFER_NIK_NEVER_SLIMMER.json."""
import sys, os, io, cv2, numpy as np
sys.path.insert(0, os.path.join(sys.argv[2], 'tools/hero-faces')); import never_slimmer as NS
from PIL import Image, ImageFilter
E2, REPO, OUT = sys.argv[1:4]   # E2 = the picked head (H for F-2)
P = os.path.join(REPO, 'visual-assets/v10_1/plates-hc/')
MASKS = os.path.join(REPO, 'tools/clubhouse-themes/masks/')
os.makedirs(OUT, exist_ok=True)
old2 = np.asarray(Image.open(P + 'ENV_OFFICE_PLATE_HC_V3_2X.webp').convert('RGB'))
e2 = np.asarray(Image.open(E2).convert('RGB'))
assert e2.shape == old2.shape
# where E2 differs from today's plate, inside the desktop hero mask only
hm = np.asarray(Image.open(MASKS + 'ENV_OFFICE_PLATE_HC_V3_1920.png').convert('L').resize((3072, 1728), Image.LANCZOS), np.float32) / 255
d = (np.abs(old2.astype(int) - e2.astype(int)).max(2) > 2).astype(np.uint8)
d = cv2.dilate(d, np.ones((9, 9), np.uint8))
zone = (d * (hm > 0.5)).astype(np.float32)
zone = cv2.GaussianBlur(zone, (0, 0), 3) * (hm > 0.5)       # about 6 px feather, never outside the hero
# H redraws the whole suit faintly as well; keep today's suit and take only his head, beard, ears and neck from H.
# The head box (2X) holds every face, hair and beard pixel; its soft edge falls on the dark jacket, where both agree.
head = np.zeros(zone.shape, np.float32); cv2.ellipse(head, (2165, 420), (265, 335), 0, 0, 360, 1, -1)
zone = zone * cv2.GaussianBlur(head, (0, 0), 8)
np.save(os.path.join(OUT, 'zone2x.npy'), zone)

def cover(arr, old, mask):
    # never slimmer: where the new head stops short of today's outline, carry his own edge (beard, hair) out to it
    out, n = NS.cover(arr, old, mask, 'right')
    if n: print('  edge carried out px', n)
    return out

def write(name, arr, ref, mask):
    size0 = os.path.getsize(P + ref); lim = int(size0 * 1.20)
    old = np.asarray(Image.open(P + ref).convert('RGB'))
    for rnd in range(4):
        # WebP alone can blur a faint room edge by a pixel (today's file re-encoded at some settings reads short too),
        # so try qualities and methods under the size cap, keep the encodes whose decoded picture has no short outline
        # point, and of those the one nearest today's size.
        ok, best = [], None
        for m in (6, 5, 4):
            for q in range(96, 79, -1):
                b = io.BytesIO(); Image.fromarray(arr).save(b, 'WEBP', quality=q, method=m)
                if b.tell() > lim: continue
                dec = np.asarray(Image.open(io.BytesIO(b.getvalue())).convert('RGB'))
                short = int(NS.measure(dec, old, mask, 'right')[3].sum())
                if not short: ok.append((abs(b.tell() - size0), b.getvalue(), q, m))
                if best is None or short < best[2]: best = (b.getvalue(), q, short)
            if ok: break
        if ok:
            _, data, q, m = min(ok); short = 0; break
        data, q, short = best
        # no clean encode: find the short run on the decoded picture, carry his edge out there, and try again
        dec = np.asarray(Image.open(io.BytesIO(data)).convert('RGB'))
        filled, n = NS.cover(dec, old, mask, 'right')
        ch = (filled != dec).any(2); arr = arr.copy(); arr[ch] = filled[ch]
        print('  short outline pts', short, 'at best q', q, '- carried the edge out px', n)
    assert not short, name + ': hero starts further in than today'
    open(os.path.join(OUT, name), 'wb').write(data); print(name, arr.shape[1], arr.shape[0], 'q', q, 'm', m, len(data), 'old', size0)

# desktop: 2X is E2 itself inside the zone; 1X and 1920 are today's cut with E2 (resized) laid in the same zone
for n, s in (('2X', (3072, 1728)), ('1X', (1536, 864)), ('1920', (1920, 1080))):
    o = np.asarray(Image.open(P + f'ENV_OFFICE_PLATE_HC_V3_{n}.webp').convert('RGB'), np.float32)
    e = np.asarray(Image.fromarray(e2).resize(s, Image.LANCZOS), np.float32) if s != (3072, 1728) else e2.astype(np.float32)
    z = cv2.resize(zone, s, interpolation=cv2.INTER_AREA)[..., None]
    comp = np.clip(o * (1 - z) + e * z + .5, 0, 255).astype(np.uint8)
    write(f'ENV_OFFICE_PLATE_HC_V3_{n}.webp', cover(comp, o.astype(np.uint8), 'ENV_OFFICE_PLATE_HC_V3_1920'), f'ENV_OFFICE_PLATE_HC_V3_{n}.webp', 'ENV_OFFICE_PLATE_HC_V3_1920')

# phone: the same man sits in a different room framing; map desktop -> phone on the man's head, then lay E2's head in
ph = np.asarray(Image.open(P + 'ENV_OFFICE_PHONE_HC_V3.webp').convert('RGB'))
pm = np.asarray(Image.open(MASKS + 'ENV_OFFICE_PHONE_HC_V3.png').convert('L'), np.float32) / 255
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
# F-2: the phone's hair is its own render (other curls), so a change carried as a delta leaves ghost curls on top.
# Lay H's head itself in, in the phone's grade.
new = ph.astype(np.float32) * (1 - wz[..., None]) + we * gain * wz[..., None]
newp = cover(np.clip(new + .5, 0, 255).astype(np.uint8), ph, 'ENV_OFFICE_PHONE_HC_V3')
write('ENV_OFFICE_PHONE_HC_V3.webp', newp, 'ENV_OFFICE_PHONE_HC_V3.webp', 'ENV_OFFICE_PHONE_HC_V3')
p590 = np.asarray(Image.open(P + 'ENV_OFFICE_PHONE_HC_V3_590W.webp').convert('RGB'))
write('ENV_OFFICE_PHONE_HC_V3_590W.webp', cover(np.asarray(Image.fromarray(newp).resize((590, 1049), Image.LANCZOS)), p590, 'ENV_OFFICE_PHONE_HC_V3'), 'ENV_OFFICE_PHONE_HC_V3_590W.webp', 'ENV_OFFICE_PHONE_HC_V3')
np.save(os.path.join(OUT, 'zone_phone.npy'), wz)
