# Clearance of candidate face zones (plate px) against the live UI boxes measured by probe.cjs, at the four sizes.
import json, math
IW, IH = 1179, 2096
OLD = ('OVL_', 'PHONE_V1', 'ENV_RV_PHONE', 'ENV_TR_PHONE')
def load(probe):
    d = json.load(open(probe)); out = {}
    for k, sizes in d.items():
        out[k] = {}
        for sz, els in sizes.items():
            w, h = map(int, sz.split('x')); s = max(w / IW, h / IH); ox = (w - IW * s) / 2
            rects, circles = [], []
            for e in els:
                if not e['top'] or any(o in (e['src'] or '') for o in OLD): continue
                x0, y0, x1, y1 = e['r']
                R = ((x0 - ox) / s, y0 / s, (x1 - ox) / s, y1 / s)
                if e['id'] == 'leagueWheel' or 'wheelTrack' in e['cls']:
                    r = (x1 - x0) / 2; circles.append(((R[0] + R[2]) / 2, (R[1] + R[3]) / 2, (r * 1.03) / s, s, e['cls'] or e['id']))
                elif 'wheelItem' in e['cls']:
                    continue  # inside the wheel circle
                else:
                    rects.append((R, s, (e['tag'] + '#' + e['id'] + '.' + e['cls'])[:40]))
            vis = ((0 - ox) / s, 0, (w - ox) / s, h / s)
            out[k][sz] = (rects, circles, vis, s)
    return out
def check(D, key, zones, margin_screen=3):
    """returns list of (size, face, what, clearance_in_screen_px) for every violation or near miss (<margin)."""
    bad = []; worst = 1e9
    for sz, (rects, circles, vis, s) in D[key].items():
        m = margin_screen / s
        for fi, z in enumerate(zones):
            who = 'Daniel' if fi == 0 else 'Nik'
            # inside the visible picture
            cl = min(z[0] - vis[0], vis[2] - z[2]) * s
            worst = min(worst, cl + 3)  # zone must stay on screen (0 px allowed)
            if cl < 0: bad.append((sz, who, 'off-screen', round(cl, 1)))
            for R, _, name in rects:
                ix = min(R[2], z[2]) - max(R[0], z[0]); iy = min(R[3], z[3]) - max(R[1], z[1])
                # clearance = how far apart (negative = overlap depth)
                c = -min(ix, iy) if (ix > 0 and iy > 0) else max(-ix if ix <= 0 else -1e9, -iy if iy <= 0 else -1e9)
                c *= s
                worst = min(worst, c)
                if c < margin_screen: bad.append((sz, who, name, round(c, 1)))
            for cx, cy, r, _, name in circles:
                nx = min(max(cx, z[0]), z[2]); ny = min(max(cy, z[1]), z[3])
                c = (math.hypot(nx - cx, ny - cy) - r) * s
                worst = min(worst, c)
                if c < margin_screen: bad.append((sz, who, 'wheel ' + name, round(c, 1)))
    return bad, worst
