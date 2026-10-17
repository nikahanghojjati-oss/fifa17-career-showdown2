# v3 face zones: for each manager the union of (a) his V2 zone moved by the same geometric transform as the plate and
# (b) the YuNet face box found on the v3 plate, padded 15% per side (the facecheck.py rule). Fractions of the plate.
# Usage: python3 zones_v3.py <v2 PHONE_FACE_ZONES.json> <v3 plate dir> <yunet onnx> <transforms.json> <out json> [probe.json]
import sys, os, json, cv2
V2Z, PD, MODEL, TF, OUTJ = sys.argv[1:6]
PROBE = sys.argv[6] if len(sys.argv) > 6 else None
W, H = 1179, 2096
z2 = json.load(open(V2Z))['zones']; tf = json.load(open(TF))

def yunet(path):
    im = cv2.imread(path); d = cv2.FaceDetectorYN.create(MODEL, '', (W, H), 0.8)
    _, f = d.detect(im); f = [] if f is None else f
    out = []
    for r in f:
        x, y, w, h = [float(v) for v in r[:4]]
        if w <= 0.08 * W: continue
        px, py = 0.15 * w, 0.15 * h
        out.append([max(0, (x - px) / W), max(0, (y - py) / H), min(1, (x + w + px) / W), min(1, (y + h + py) / H)])
    return sorted(out)

def moved(key, i, z):
    t = tf[key]; x0, y0, x1, y1 = z[0] * W, z[1] * H, z[2] * W, z[3] * H
    if 'whole_shift_down_px' in t:
        d = t['whole_shift_down_px']; return [x0, y0 + d, x1, y1 + d]
    if 'split_shift_px_each_side' in t:
        S, K = t['split_shift_px_each_side'], t['uniform_scale']; cx, ya = t['scale_about']
        sx = -S if i == 0 else S
        f = lambda x, y: (cx + K * (x + sx - cx), ya + K * (y - ya))
    else:  # per-manager affine
        m = t['managers'][('daniel', 'nik')[i]]; k, tx, ty = m['scale'], m['tx'], m['ty']
        f = lambda x, y: (k * x + tx, k * y + ty)
    a = f(x0, y0); b = f(x1, y1); return [a[0], a[1], b[0], b[1]]

out = {}; rep = {}
for key in tf:
    det = yunet(f'{PD}/ENV_{key}_PHONE_V3.webp')
    mv = [moved(key, i, z) for i, z in enumerate(z2[key])]
    zs = []
    for i, m in enumerate(mv):
        u = [m[0] / W, m[1] / H, m[2] / W, m[3] / H]
        near = [d for d in det if abs((d[0] + d[2]) / 2 - (u[0] + u[2]) / 2) < 0.1 and abs((d[1] + d[3]) / 2 - (u[1] + u[3]) / 2) < 0.06]
        if near:
            d = near[0]; u = [min(u[0], d[0]), min(u[1], d[1]), max(u[2], d[2]), max(u[3], d[3])]
        zs.append(u)
        rep.setdefault(key, []).append({'moved_v2_zone': [round(m[0] / W, 4), round(m[1] / H, 4), round(m[2] / W, 4), round(m[3] / H, 4)],
                                        'yunet_v3': [round(v, 4) for v in near[0]] if near else None})
    # round outward so the stored zone is never smaller than the union
    import math
    zs = [[math.floor(z[0] * 1e4) / 1e4, math.floor(z[1] * 1e4) / 1e4, math.ceil(z[2] * 1e4) / 1e4, math.ceil(z[3] * 1e4) / 1e4] for z in zs]
    out[key] = zs
    print(key, 'yunet faces', len(det), 'zones', zs)
full = json.load(open(V2Z)); full['zones'].update(out)
full['note'] = ('Face-safe zones per phone background, as fractions of the image (x0,y0,x1,y1), left face first (Daniel). '
                'LEAGUE, STANDINGS, RIVALRY and TROPHY_ROOM refer to ENV_<KEY>_PHONE_V3 (HO-031): union of the V2 zone moved by '
                'the same geometric transform and the YuNet face box on the v3 plate padded 15% per side. Every other key is '
                'unchanged and refers to ENV_<KEY>_PHONE_V2. Drawn with background-size:cover, centre top (as the r78 screens draw the plates): no visible game element '
                'may overlap a zone at 393x852, 393x660, 375x667 or 360x640.')
json.dump(full, open(OUTJ, 'w'), indent=1)
json.dump(rep, open(os.path.splitext(OUTJ)[0] + '_sources.json', 'w'), indent=1)
if PROBE:
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__))); import fit
    D = fit.load(PROBE)
    for key, zs in out.items():
        bad, worst = fit.check(D, key, [[z[0] * W, z[1] * H, z[2] * W, z[3] * H] for z in zs], 3)
        print(key, 'min clearance (screen px, probe boxes)', round(worst, 1), bad[:6])
