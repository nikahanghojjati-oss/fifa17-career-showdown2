# Traces the four gripping hands on the Club plate into clip-path polygons (1X plate px).
# No raster is written: the runtime hand overlays are duplicate plate layers clipped by these
# polygons (OWNER-3 "reuse the already-loaded plate"). Deterministic: same plate -> same JSON.
# Usage (from the club folder): python3 tools/make_hand_masks.py [--debug out.png]
import json, sys
import numpy as np, cv2

PLATE = 'assets/ENV_CLUB_PLATE_V1_1X.png'
# Search windows (plate px) around each hand that grips a pack; hand pixels are skin-hue
# components touching the pack box.
HANDS = {
    'hand_daniel_top':  {'pack': 'pack_daniel', 'win': [228, 288, 392, 372]},
    'hand_daniel_side': {'pack': 'pack_daniel', 'win': [518, 452, 580, 568]},
    'hand_nik_top':     {'pack': 'pack_nik',    'win': [1118, 286, 1282, 372]},
    'hand_nik_side':    {'pack': 'pack_nik',    'win': [944, 462, 1010, 582]},
}
GROW = 3  # px of safety margin around the traced skin (covers glow fringe and antialiasing)

img = cv2.imread(PLATE)
hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
H, S, V = hsv[..., 0].astype(int), hsv[..., 1].astype(int), hsv[..., 2].astype(int)
b, g, r = [img[..., i].astype(int) for i in range(3)]
# skin: hue 0-19 (OpenCV half-degrees, ~0-38 deg), moderate saturation, not too dark; gold glow
# sits at hue >= 20 with r ~= g, so r - g > 18 separates skin from the pack's gold rim.
skin = ((H <= 19) | (H >= 175)) & (S >= 45) & (S <= 200) & (V >= 70) & ((r - g) >= 18)
skin = skin.astype(np.uint8) * 255

pm = json.load(open('assets/platemap.json'))
out = {'version': 'HANDMAP_CLUB_V1', 'units': '1X plate px', 'source': PLATE,
       'method': 'skin-hue threshold in window, close 5, largest component, holes filled, dilate %d, approxPolyDP 0.8' % GROW,
       'hands': {}}
dbg = img.copy()
for name, spec in HANDS.items():
    x0, y0, x1, y1 = spec['win']
    m = np.zeros_like(skin)
    m[y0:y1, x0:x1] = skin[y0:y1, x0:x1]
    m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))
    n, lab, stats, _ = cv2.connectedComponentsWithStats(m)
    k = 1 + int(np.argmax(stats[1:, cv2.CC_STAT_AREA]))
    m = (lab == k).astype(np.uint8) * 255
    cs, _ = cv2.findContours(m, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    m = np.zeros_like(m); cv2.drawContours(m, cs, -1, 255, -1)          # fill holes
    m = cv2.dilate(m, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * GROW + 1, 2 * GROW + 1)))
    m2 = cv2.dilate(m, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3)))
    cs, _ = cv2.findContours(m2, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    c = max(cs, key=cv2.contourArea)
    poly = cv2.approxPolyDP(c, 0.8, True)[:, 0, :].tolist()
    # polygon must contain the traced mask: re-rasterise and union-check
    chk = np.zeros_like(m); cv2.fillPoly(chk, [np.array(poly)], 255)
    miss = int(((m > 0) & (chk == 0)).sum())
    bx, by, bw, bh = cv2.boundingRect(np.array(poly))
    pb = pm['protected_boxes'][spec['pack']]
    ix0, iy0, ix1, iy1 = max(bx, pb[0]), max(by, pb[1]), min(bx + bw, pb[2]), min(by + bh, pb[3])
    out['hands'][name] = {
        'pack': spec['pack'], 'search_window': spec['win'], 'polygon': poly,
        'box': [bx, by, bx + bw, by + bh], 'area_px': int((m > 0).sum()),
        'mask_px_outside_polygon': miss,
        'pack_overlap_box': [ix0, iy0, ix1, iy1] if ix1 > ix0 and iy1 > iy0 else None,
    }
    cv2.polylines(dbg, [np.array(poly)], True, (0, 255, 0), 1)
    cv2.rectangle(dbg, (x0, y0), (x1, y1), (255, 0, 255), 1)
for p in pm['protected_boxes'].values():
    cv2.rectangle(dbg, (p[0], p[1]), (p[2], p[3]), (0, 200, 255), 1)
json.dump(out, open('assets/handmap.json', 'w'), indent=1)
if '--debug' in sys.argv:
    cv2.imwrite(sys.argv[sys.argv.index('--debug') + 1], dbg)
for k, v in out['hands'].items():
    print(k, v['box'], 'area', v['area_px'], 'verts', len(v['polygon']), 'miss', v['mask_px_outside_polygon'], 'overlap', v['pack_overlap_box'])
