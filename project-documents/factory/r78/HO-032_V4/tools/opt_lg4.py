# League V4 placement: smallest move of each manager so his face zone clears Team G's 15%-smaller wheel (HO-032: same
# centre, diameter x0.85, tested as a circle) by RIM852 screen px at 393x852 and by RIMO px at the other three sizes,
# clears every other probed UI box by 3 px and stays on screen. Zone = V2 zone U YuNet(V2), moved with the manager.
import sys, json, math, numpy as np
sys.path.insert(0, 'tools'); import fit
RIM852, RIMO = float(sys.argv[1]), float(sys.argv[2])
D = fit.load('probe.json')
for sz, (rects, circles, vis, s) in D['LEAGUE'].items():
    D['LEAGUE'][sz] = (rects, [(cx, cy, r / 1.03 * 0.85, ss, n) for cx, cy, r, ss, n in circles], vis, s)
Z = json.load(open(sys.argv[3]))['zones']['LEAGUE']
yun = [[0.141, 0.2151, 0.3043, 0.3365], [0.711, 0.2015, 0.8885, 0.3314]]
zs = [[min(a[0], b[0]) * 1179, min(a[1], b[1]) * 2096, max(a[2], b[2]) * 1179, max(a[3], b[3]) * 2096] for a, b in zip(Z, yun)]
def margins(z):
    out = {}
    for sz, (rects, circles, vis, s) in D['LEAGUE'].items():
        cx, cy, r, _, _ = circles[0]
        nx = min(max(cx, z[0]), z[2]); ny = min(max(cy, z[1]), z[3])
        out[sz] = (math.hypot(nx - cx, ny - cy) - r) * s
    return out
def ok(z):
    m = margins(z)
    if m['393x852'] < RIM852 or min(v for k, v in m.items() if k != '393x852') < RIMO: return False
    bad, w = fit.check({'LEAGUE': {sz: (r, [], v, s) for sz, (r, c, v, s) in D['LEAGUE'].items()}}, 'LEAGUE', [z], 3)
    return w >= 3
print('V2 margins', {i: {k: round(v, 1) for k, v in margins(zs[i]).items()} for i in (0, 1)})
for who, i in (('Daniel', 0), ('Nik', 1)):
    best = None
    for k in np.arange(1.0, 0.799, -0.01):
        base = 0.0 if i == 0 else 1179 * (1 - k)
        for dx in range(0, 121, 2):
            tx = base - dx if i == 0 else base + dx
            for ty in range(-160, 201, 2):
                up = ty
                z = [zs[i][0] * k + tx, zs[i][1] * k + ty, zs[i][2] * k + tx, zs[i][3] * k + ty]
                if not ok(z): continue
                cost = (1 - k) * 600 + math.hypot(dx, up)
                if best is None or cost < best[0]: best = (cost, round(k, 2), round(tx, 1), ty, [round(v) for v in z], {kk: round(v, 1) for kk, v in margins(z).items()})
    print(who, best, flush=True)
