# Soft mattes for the two managers on a V2 phone plate: rembg isnet edges limited to the human-seg region, minus the
# occluder (pedestal / plinth), refined with closed-form matting; saves alpha + ML foreground colours per man.
import sys, numpy as np, cv2, time
sys.path.insert(0, sys.argv[1]); from h31lib import *
key, plate, u2, out = sys.argv[2], sys.argv[3], sys.argv[4], sys.argv[5]
img = load(plate); H, W = img.shape[:2]
from PIL import Image
m = seg_masks(Image.open(plate).convert('RGB'), u2)
isn, hs = m['isnet-general-use'], m['u2net_human_seg']
hsd = cv2.dilate((hs > 0.35).astype(np.uint8), cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (31, 31))).astype(np.float32)
hsd = cv2.GaussianBlur(hsd, (0, 0), 4)
rough = np.minimum(isn, hsd)
occ = np.zeros((H, W), np.float32)
if key == 'TROPHY_ROOM':
    poly = np.array([(402,983),(775,983),(808,1014),(808,1780),(830,1795),(835,1850),(860,1865),(860,2096),(326,2096),(326,1865),(350,1850),(352,1795),(372,1780),(372,1014)], np.int32)
    cv2.fillPoly(occ, [poly], 1.0)
    occ = cv2.dilate(occ, np.ones((9, 9), np.uint8))   # drop the pedestal's rim glow from the men
elif key == 'LEAGUE':
    # plinth / floor-ring envelope: everything below the tier back edges (measured on the plate)
    xs = np.arange(W, dtype=np.float64)
    def edge(cx, cy, a, b):
        t = 1 - ((xs - cx) / a) ** 2
        e = np.full(W, np.inf); ok = t > 0; e[ok] = cy - b * np.sqrt(t[ok]); return e
    E = np.minimum.reduce([edge(589, 1439.6, 410, 52.6), edge(589, 1498.4, 454, 44.7), edge(587.5, 1614.6, 516, 70), np.full(W, 1598.0)])
    yy = np.arange(H)[:, None]
    occ = (yy >= (E[None, :] - 3)).astype(np.float32)
    np.save(out + '_envelope.npy', E)
rough = rough * (1 - occ)
cv2.imwrite(out + '_rough.png', (rough * 255).astype(np.uint8))
# split men by x (Daniel left, Nik right)
lab_n, lab = cv2.connectedComponents((rough > 0.3).astype(np.uint8))
sizes = [(lab == i).sum() for i in range(lab_n)]
big = sorted(range(1, lab_n), key=lambda i: -sizes[i])[:2]
cx = {i: np.where(lab == i)[1].mean() for i in big}
order = sorted(big, key=lambda i: cx[i])
for name, i in zip(('DANIEL', 'NIK'), order):
    region = cv2.dilate((lab == i).astype(np.uint8), cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (61, 61))).astype(bool)
    r_i = rough * region
    t = time.time()
    A, F, tri = refine_alpha(img, r_i, band=10)
    A = A * (1 - occ) * region
    # alpha cleanup: kill tiny specks far from the body
    A[A < 0.02] = 0
    np.save(f'{out}_{name}_A.npy', A.astype(np.float32)); np.save(f'{out}_{name}_F.npy', F.astype(np.float16))
    print(name, 'matte', round(time.time() - t, 1), 's', 'area', int((A > 0.5).sum()))
np.save(out + '_occ.npy', occ)
