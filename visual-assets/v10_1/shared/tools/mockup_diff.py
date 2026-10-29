#!/usr/bin/env python3
"""Mockup-diff gate for Career Mode Showdown screens.

Compares a build screenshot with Nik's mockup (and, optionally, the clean
plate cut from it) and writes scores + a side-by-side + an SSIM heatmap.

  python3 -m pip install pillow numpy scikit-image
  python3 mockup_diff.py --mockup REF_GOAL.jpg --build shot_1920x1080.png \
      [--plate ENV_PLATE_1X.webp] [--platemap platemap.json] --out outdir/

Both images are centre-cropped to 16:9 and compared at 960x540.
Scores: ssim (grey, structure), ssim_coarse (1/8 scale: composition and
light), dE_mean (CIEDE2000 colour), protected-box SSIM (faces/hands/packs,
from platemap.json, which is in mockup 1X pixels).
Gate (see MOCKUP_FIDELITY_REPORT.md): face boxes >= 0.90, other protected
boxes >= 0.75; ssim >= plate_ssim - 0.15; dE_mean <= plate_dE + 6.
Without a plate: ssim >= 0.55, dE_mean <= 14.
"""
import argparse, json, os, numpy as np
from PIL import Image, ImageOps
from skimage.metrics import structural_similarity as ssim
from skimage.color import rgb2lab, deltaE_ciede2000

W, H = 960, 540
GREY = np.array([.299, .587, .114], np.float32)

def load(p):
    im = Image.open(p).convert('RGB'); w, h = im.size; t = 16 / 9
    if w / h > t + .01: nw = int(h * t); im = im.crop(((w - nw) // 2, 0, (w - nw) // 2 + nw, h))
    elif w / h < t - .01: nh = int(w / t); im = im.crop((0, (h - nh) // 2, w, (h - nh) // 2 + nh))
    return np.asarray(im.resize((W, H), Image.LANCZOS)).astype(np.float32) / 255

def coarse(x):
    return np.asarray(Image.fromarray((x * 255).astype('uint8')).resize((120, 68), Image.BOX)).astype(np.float32) / 255

def score(ref, a, boxes, sx):
    g = lambda x: x @ GREY
    v, m = ssim(g(ref), g(a), data_range=1, full=True, gaussian_weights=True, sigma=1.5)
    de = deltaE_ciede2000(rgb2lab(ref), rgb2lab(a))
    r = dict(ssim=round(float(v), 3),
             ssim_coarse=round(float(ssim(g(coarse(ref)), g(coarse(a)), data_range=1, gaussian_weights=True, sigma=1.5)), 3),
             dE_mean=round(float(de.mean()), 1), boxes={})
    for k, (x0, y0, x1, y1) in boxes.items():
        x0, y0, x1, y1 = (int(c * sx) for c in (x0, y0, x1, y1))
        r['boxes'][k] = round(float(m[y0:y1, x0:x1].mean()), 3)
    return r, m

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--mockup', required=True); ap.add_argument('--build', required=True)
    ap.add_argument('--plate'); ap.add_argument('--platemap'); ap.add_argument('--out', default='.')
    a = ap.parse_args(); os.makedirs(a.out, exist_ok=True)
    ref = load(a.mockup); boxes, sx = {}, 1
    if a.platemap:
        pm = json.load(open(a.platemap)); boxes = pm.get('protected_boxes', {}); sx = W / pm['plate_1x_size'][0]
    res = {}
    b, m = score(ref, load(a.build), boxes, sx); res['build'] = b
    if a.plate: res['plate'], _ = score(ref, load(a.plate), boxes, sx)
    p = res.get('plate')
    checks = {'faces_ge_0.90': all(v >= .90 for k, v in b['boxes'].items() if k.startswith('face')),
              'other_boxes_ge_0.75': all(v >= .75 for k, v in b['boxes'].items() if not k.startswith('face')),
              'ssim': b['ssim'] >= (p['ssim'] - .15 if p else .55),
              'dE': b['dE_mean'] <= (p['dE_mean'] + 6 if p else 14)}
    res['gate'] = dict(checks, PASS=all(checks.values()))
    heat = Image.fromarray(np.clip((1 - m) * 255, 0, 255).astype('uint8'))
    base = Image.fromarray((ref * 255).astype('uint8')).convert('L').convert('RGB')
    Image.blend(base, ImageOps.colorize(heat, 'black', 'red'), .6).save(os.path.join(a.out, 'heatmap.jpg'), quality=82)
    Image.fromarray(np.hstack([(ref * 255).astype('uint8'), (load(a.build) * 255).astype('uint8')])).save(os.path.join(a.out, 'side_by_side.jpg'), quality=80)
    json.dump(res, open(os.path.join(a.out, 'scores.json'), 'w'), indent=1)
    print(json.dumps(res, indent=1))

if __name__ == '__main__':
    main()
