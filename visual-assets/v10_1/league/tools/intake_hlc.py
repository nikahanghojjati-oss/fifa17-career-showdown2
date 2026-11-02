#!/usr/bin/env python3
"""HLC plate intake (CLOUD_HLC_INTAKE_V1_R3, R3.2). Deterministic; cloud-only.

Usage (from repo root, with the hlc-goals inputs checked out or extracted to INPUTS):
  python3 visual-assets/v10_1/<screen>/tools/intake_hlc.py --screen home \
      --inputs <dir holding visual-assets/goals/...> --out visual-assets/v10_1/<screen> --base-sha <sha>

Likeness lock (SOL-HLC-5): output = original everywhere; edited pixels enter only the
remove zones (6 px feather inside the zone edge); keep_rects and every protected_boxes
rect are then hard-restored from the original. Gates are assertions, not judgement.

Tone match (owner instruction, Nik 2026-10-01; runs before the gates): every zone whose
mean luminance exceeds LUM_GATE x its 12 px ring is darkened multiplicatively toward its
ring, with weight ramping 0 -> 1 over a 24 px feather inside the zone edge, until the ratio
is <= TONE_TARGET. Weight is 0 outside the zone, in every protected box and in every keep
rect. Repeated until no zone fails the gate (a darkened zone can change a neighbour's ring).
"""
import argparse, hashlib, json, os, shutil, sys
import cv2
import numpy as np
from PIL import Image, ImageFilter

GOALS = {
    'home': 'GOAL_HOME.png',
    'league': 'GOAL_LEAGUE_LOGOS_BLURRED.jpg',
    'club': 'GOAL_CLUB.jpg',
}
FEATHER = 6
RING = 12
GUIDE_BAND = 6
ALIGN_TOL = 4.0
LUM_GATE = 1.15        # gate (unchanged)
TONE_TARGET = 1.10     # tone-match target for zones that fail the gate
TONE_FEATHER = 24      # px, feathered edge inside the zone
TONE_MAX_PASSES = 8


def sha(path):
    h = hashlib.sha256()
    with open(path, 'rb') as f:
        for b in iter(lambda: f.read(1 << 20), b''):
            h.update(b)
    return h.hexdigest()


def rgb(path):
    return np.array(Image.open(path).convert('RGB'))


def lum(a):
    a = a.astype(np.float64)
    return 0.2126 * a[..., 0] + 0.7152 * a[..., 1] + 0.0722 * a[..., 2]


def zone_masks(z, H, W):
    masks = []
    for (x0, y0, x1, y1) in z['remove_rects']:
        m = np.zeros((H, W), np.uint8)
        m[max(0, y0):min(H, y1), max(0, x0):min(W, x1)] = 1
        masks.append(('rect[%d,%d,%d,%d]' % (x0, y0, x1, y1), m))
    for (cx, cy, r) in z['remove_circles_cx_cy_r']:
        m = np.zeros((H, W), np.uint8)
        cv2.circle(m, (cx, cy), r, 1, -1)
        masks.append(('circle[%d,%d,%d]' % (cx, cy, r), m))
    return masks


def box_mask(b, H, W):
    m = np.zeros((H, W), bool)
    x0, y0, x1, y1 = b
    m[max(0, y0):min(H, y1), max(0, x0):min(W, x1)] = True
    return m


def shift_between(a, b, valid):
    """Phase-correlation shift of b relative to a, using only valid pixels."""
    ga = lum(a).astype(np.float32)
    gb = lum(b).astype(np.float32)
    for g in (ga, gb):
        g -= g[valid].mean()
        g[~valid] = 0
    win = cv2.createHanningWindow(ga.shape[::-1], cv2.CV_32F)
    (dx, dy), resp = cv2.phaseCorrelate(ga, gb, win)
    return float(dx), float(dy), float(resp)


def alignment(orig, edit, union, protected):
    H, W = union.shape
    valid = union == 0
    dx, dy, resp = shift_between(orig, edit, valid)
    per_box = {}
    for name, b in protected.items():
        x0, y0, x1, y1 = b
        sl = (slice(max(0, y0), min(H, y1)), slice(max(0, x0), min(W, x1)))
        v = valid[sl]
        if v.sum() < 256:
            continue
        bx, by, br = shift_between(orig[sl], edit[sl], v.copy())
        per_box[name] = [round(bx, 2), round(by, 2), round(br, 3)]
    err = max([np.hypot(dx, dy)] + [np.hypot(v[0], v[1]) for v in per_box.values()])
    return {'global_shift_dx_dy': [round(dx, 2), round(dy, 2)], 'global_response': round(resp, 3),
            'per_protected_box_dx_dy_resp': per_box, 'aligned_crop_error_px': round(float(err), 2)}


def ecc_align(orig, edit, union):
    valid = (union == 0).astype(np.uint8)
    ga = lum(orig).astype(np.float32) / 255.0
    gb = lum(edit).astype(np.float32) / 255.0
    warp = np.eye(2, 3, dtype=np.float32)
    crit = (cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 200, 1e-6)
    _, warp = cv2.findTransformECC(ga, gb, warp, cv2.MOTION_AFFINE, crit, valid, 5)
    H, W = union.shape
    out = cv2.warpAffine(edit, warp, (W, H), flags=cv2.INTER_LANCZOS4 + cv2.WARP_INVERSE_MAP,
                         borderMode=cv2.BORDER_REFLECT)
    return out, warp.tolist()


def ring_of(m):
    return (cv2.dilate(m, np.ones((2 * RING + 1, 2 * RING + 1), np.uint8)) - m).astype(bool)


def zone_ratio(img, m, ring):
    L = lum(img)
    return float(L[m.astype(bool)].mean() / L[ring].mean()) if ring.any() else None


def tone_match(out, masks, frozen):
    """Darken failing zones toward their ring. Returns (image, log)."""
    out = out.copy()
    log = []
    for p in range(TONE_MAX_PASSES):
        changed_any = False
        for name, m in masks:
            ring = ring_of(m)
            r0 = zone_ratio(out, m, ring)
            if r0 is None or r0 <= LUM_GATE:
                continue
            w = np.clip(cv2.distanceTransform(m, cv2.DIST_L2, 5) / TONE_FEATHER, 0, 1)
            w[frozen] = 0
            base = out.astype(np.float64)

            def apply(sc):
                f = (1 - w * (1 - sc))[..., None]
                return np.clip(np.rint(base * f), 0, 255).astype(np.uint8)
            lo, hi = 0.0, 1.0   # largest scale with ratio <= TONE_TARGET
            for _ in range(40):
                mid = (lo + hi) / 2
                if zone_ratio(apply(mid), m, ring) <= TONE_TARGET:
                    lo = mid
                else:
                    hi = mid
            out = apply(lo)
            log.append({'pass': p + 1, 'zone': name, 'ratio_before': round(r0, 4), 'scale': round(lo, 4),
                        'ratio_after': round(zone_ratio(out, m, ring), 4)})
            changed_any = True
        if not changed_any:
            break
    return out, log


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--screen', required=True, choices=sorted(GOALS))
    ap.add_argument('--inputs', required=True, help='root holding visual-assets/goals/')
    ap.add_argument('--out', required=True, help='visual-assets/v10_1/<screen>')
    ap.add_argument('--base-sha', required=True)
    ap.add_argument('--inputs-ref', default='claude-cloud/hlc-goals')
    a = ap.parse_args()
    S = a.screen
    U = S.upper()
    g = os.path.join(a.inputs, 'visual-assets', 'goals')
    zones_path = os.path.join(g, 'handoffs', 'HLC_PLATE_ZONES_V1.json')
    z = json.load(open(zones_path))['screens'][S]
    goal_path = os.path.join(g, GOALS[S])
    edit_path = os.path.join(g, 'plates-in', 'ENV_%s_PLATE_V1.png' % U)
    assets = os.path.join(a.out, 'assets')
    ev = os.path.join(a.out, 'evidence')
    os.makedirs(assets, exist_ok=True)
    os.makedirs(ev, exist_ok=True)

    orig = rgb(goal_path)
    H, W = orig.shape[:2]
    assert [W, H] == z['goal_size'], (W, H, z['goal_size'])
    edit_raw = Image.open(edit_path).convert('RGB')
    edit = np.array(edit_raw.resize((W, H), Image.LANCZOS))

    masks = zone_masks(z, H, W)
    union = np.zeros((H, W), np.uint8)
    for _, m in masks:
        union |= m
    prot = z['protected_boxes']

    # 1. framing check, ECC fallback
    al = alignment(orig, edit, union, prot)
    al['method'] = 'lanczos_resize'
    if al['aligned_crop_error_px'] > ALIGN_TOL:
        try:
            edit2, warp = ecc_align(orig, edit, union)
            al2 = alignment(orig, edit2, union, prot)
            al2.update(method='ecc_affine', ecc_warp=warp, pre_ecc=al)
            if al2['aligned_crop_error_px'] < al['aligned_crop_error_px']:
                edit, al = edit2, al2
        except cv2.error as e:
            al['ecc_error'] = str(e)
    framing_ok = al['aligned_crop_error_px'] <= ALIGN_TOL

    # 2. likeness lock
    dist = cv2.distanceTransform(union, cv2.DIST_L2, 5)  # distance to nearest non-zone px
    alpha = np.clip(dist / FEATHER, 0, 1)[..., None]
    out = orig.astype(np.float64) * (1 - alpha) + edit.astype(np.float64) * alpha
    out = np.clip(np.rint(out), 0, 255).astype(np.uint8)
    restore = np.zeros((H, W), bool)
    for b in z['keep_rects']:
        restore |= box_mask(b, H, W)
    for b in prot.values():
        restore |= box_mask(b, H, W)
    out[restore] = orig[restore]

    # 2b. tone match (before the gates)
    out, tone_log = tone_match(out, masks, restore)
    out[restore] = orig[restore]

    # 3. gates
    changed = np.any(out != orig, axis=2)
    gates = {}
    gates['changed_px_outside_remove_zones'] = int((changed & (union == 0)).sum())
    gates['changed_px_per_protected_box'] = {n: int(changed[box_mask(b, H, W)].sum()) for n, b in prot.items()}
    gates['changed_px_per_keep_rect'] = {str(b): int(changed[box_mask(b, H, W)].sum()) for b in z['keep_rects']}
    R, G, B = (out[..., i].astype(int) for i in range(3))
    guide = ((R > 200) & (G < 80) & (B > 200)) | ((G > 200) & (R < 80) & (B < 80))
    k = np.ones((2 * GUIDE_BAND + 1, 2 * GUIDE_BAND + 1), np.uint8)
    lum_out = lum(out)
    per_zone = []
    for name, m in masks:
        band = (cv2.dilate(m, k) - cv2.erode(m, k)).astype(bool)
        ring = ring_of(m)
        li = float(lum_out[m.astype(bool)].mean())
        lr = float(lum_out[ring].mean()) if ring.any() else None
        per_zone.append({'zone': name, 'guide_px_border_band': int((guide & band).sum()),
                         'mean_lum_inside': round(li, 2), 'mean_lum_ring12': None if lr is None else round(lr, 2),
                         'ratio': None if not lr else round(li / lr, 4),
                         'lum_pass': lr is None or li <= LUM_GATE * lr})
    gates['zones'] = per_zone

    # 6. REF_GOAL
    ref = os.path.join(assets, 'REF_GOAL_%s.jpg' % U)
    if goal_path.lower().endswith(('.jpg', '.jpeg')):
        shutil.copyfile(goal_path, ref)
        ref_method = 'byte copy of JPEG source'
    else:
        Image.open(goal_path).convert('RGB').save(ref, 'JPEG', quality=95, subsampling=0)
        ref_method = 'PNG converted to real JPEG (q95, 4:4:4)'
    with open(ref, 'rb') as f:
        gates['ref_goal_jpeg_magic_ffd8ff'] = f.read(3) == b'\xff\xd8\xff'

    zone_pass = all(p['guide_px_border_band'] == 0 and p['lum_pass'] for p in per_zone)
    passed = (framing_ok and gates['changed_px_outside_remove_zones'] == 0
              and all(v == 0 for v in gates['changed_px_per_protected_box'].values())
              and all(v == 0 for v in gates['changed_px_per_keep_rect'].values())
              and zone_pass and gates['ref_goal_jpeg_magic_ffd8ff'])

    # side-by-side evidence (original | locked), 1X
    sbs = np.concatenate([orig, np.full((H, 8, 3), 255, np.uint8), out], axis=1)
    Image.fromarray(sbs).save(os.path.join(ev, 'intake_%s.jpg' % S), 'JPEG', quality=88)

    files = {}
    if passed:
        # 4. exports
        im1 = Image.fromarray(out)
        p1 = os.path.join(assets, 'ENV_%s_PLATE_V1_1X' % U)
        im1.save(p1 + '.png', optimize=True)
        im1.save(p1 + '.webp', 'WEBP', quality=92, method=6)
        im2 = im1.resize((W * 2, H * 2), Image.LANCZOS).filter(ImageFilter.UnsharpMask(radius=1.0, percent=40, threshold=2))
        p2 = os.path.join(assets, 'ENV_%s_PLATE_V1_2X' % U)
        im2.save(p2 + '.png', optimize=True)
        im2.save(p2 + '.webp', 'WEBP', quality=92, method=6)
        for p in (p1 + '.png', p1 + '.webp', p2 + '.png', p2 + '.webp'):
            files[os.path.basename(p)] = sha(p)
        # 5. platemap
        pm = {'version': 'PLATEMAP_%s_V1' % U, 'units': '1X plate px (= goal px)',
              'plate_1x_size': [W, H], 'plate_2x_size': [W * 2, H * 2],
              'remove_rects': z['remove_rects'], 'remove_circles_cx_cy_r': z['remove_circles_cx_cy_r'],
              'keep_rects': z['keep_rects'], 'protected_boxes': prot, 'sha256': files,
              'source_zones': 'visual-assets/goals/handoffs/HLC_PLATE_ZONES_V1.json@' + a.inputs_ref}
        with open(os.path.join(assets, 'platemap.json'), 'w') as f:
            json.dump(pm, f, indent=1)
            f.write('\n')
    files['REF_GOAL_%s.jpg' % U] = sha(ref)

    # 7. wordmark (Home only)
    wm = None
    wpath = os.path.join(g, 'plates-in', 'LOGO_CM17_WORDMARK_V1.png')
    if S == 'home' and os.path.exists(wpath):
        w = Image.open(wpath).convert('RGBA')
        al_ = np.array(w)[..., 3]
        frac = float((al_ == 0).mean())
        ys, xs = np.nonzero(al_ > 0)
        wm = {'source_size': list(w.size), 'source_sha256': sha(wpath), 'fully_transparent_fraction': round(frac, 4),
              'alpha_gate_pass': frac >= 0.30, 'note': 'spelling confirmed correct by Nik and Claude (2026-10-01)'}
        if wm['alpha_gate_pass'] and len(xs):
            x0, y0 = max(0, xs.min() - 8), max(0, ys.min() - 8)
            x1, y1 = min(w.size[0], xs.max() + 1 + 8), min(w.size[1], ys.max() + 1 + 8)
            t = w.crop((x0, y0, x1, y1))
            pp = os.path.join(assets, 'LOGO_CM17_WORDMARK_V1')
            t.save(pp + '.png', optimize=True)
            t.save(pp + '.webp', 'WEBP', lossless=True, method=6)
            wm.update(trim_box=[int(x0), int(y0), int(x1), int(y1)], trimmed_size=list(t.size),
                      sha256={'LOGO_CM17_WORDMARK_V1.png': sha(pp + '.png'), 'LOGO_CM17_WORDMARK_V1.webp': sha(pp + '.webp')})

    rep = {'task': 'CLOUD-HLC-INTAKE-V1-R3 (R3.2)', 'screen': S, 'result': 'PASS' if passed else 'FAILED',
           'base_sha': a.base_sha, 'inputs_ref': a.inputs_ref,
           'inputs': {'goal': {'path': 'visual-assets/goals/' + GOALS[S], 'size': [W, H], 'sha256': sha(goal_path)},
                      'edit': {'path': 'visual-assets/goals/plates-in/ENV_%s_PLATE_V1.png' % U,
                               'size': list(edit_raw.size), 'sha256': sha(edit_path)},
                      'zones': {'path': 'visual-assets/goals/handoffs/HLC_PLATE_ZONES_V1.json', 'sha256': sha(zones_path)}},
           'framing': al, 'framing_pass': framing_ok, 'tone_match': tone_log, 'gates': gates, 'ref_goal_method': ref_method,
           'outputs_sha256': files, 'wordmark': wm,
           'params': {'feather_px': FEATHER, 'ring_px': RING, 'guide_band_px': GUIDE_BAND, 'align_tol_px': ALIGN_TOL, 'lum_gate': LUM_GATE, 'tone_target': TONE_TARGET, 'tone_feather_px': TONE_FEATHER,
                      'resize': 'Lanczos', 'x2': 'Lanczos x2 + UnsharpMask(r=1, 40 %, t=2)', 'webp_q': 92}}
    with open(os.path.join(ev, 'intake_%s.json' % S), 'w') as f:
        json.dump(rep, f, indent=1)
        f.write('\n')

    L = ['# Intake report · %s · %s' % (U, rep['result']), '',
         'Brief: `visual-assets/goals/CLOUD_HLC_INTAKE_V1_R3.md` (R3.2). Script: `tools/intake_hlc.py`. Evidence: `evidence/intake_%s.json`, `evidence/intake_%s.jpg` (original | locked, 1X).' % (S, S), '',
         '- Base SHA (`claude-cloud/transfer-tr2-plate-g`): `%s`' % a.base_sha,
         '- Inputs ref: `%s`' % a.inputs_ref,
         '- Goal: `%s` %dx%d, sha256 `%s`' % (rep['inputs']['goal']['path'], W, H, rep['inputs']['goal']['sha256']),
         '- Edit: `%s` %dx%d, sha256 `%s` (Lanczos-resized to %dx%d)' % (rep['inputs']['edit']['path'], edit_raw.size[0], edit_raw.size[1], rep['inputs']['edit']['sha256'], W, H),
         '- Framing: method `%s`, aligned-crop error %.2f px (tolerance %.0f px) -> %s' % (al['method'], al['aligned_crop_error_px'], ALIGN_TOL, 'PASS' if framing_ok else 'FAIL'),
         '- Plate sizes: 1X %dx%d, 2X %dx%d' % (W, H, 2 * W, 2 * H), '',
         '## Tone match (owner instruction, Nik 2026-10-01; added to the R3.2 method)', '',
         'Zones failing the unchanged 1.15 gate are darkened toward their 12 px ring (24 px feather inside the zone edge) to ratio <= 1.10. Protected boxes, keep rects and pixels outside zones are never touched.', '']
    if tone_log:
        L += ['| Pass | Zone | Ratio before | Scale | Ratio after |', '|---|---|---|---|---|']
        L += ['| %d | `%s` | %s | %s | %s |' % (t['pass'], t['zone'], t['ratio_before'], t['scale'], t['ratio_after']) for t in tone_log]
    else:
        L += ['No zone needed tone matching.']
    L += ['',
         '## Gate counts', '',
         '| Gate | Value | Pass |', '|---|---|---|',
         '| changed px outside remove zones | %d | %s |' % (gates['changed_px_outside_remove_zones'], gates['changed_px_outside_remove_zones'] == 0)]
    for n, v in gates['changed_px_per_protected_box'].items():
        L.append('| changed px in protected box `%s` | %d | %s |' % (n, v, v == 0))
    for n, v in gates['changed_px_per_keep_rect'].items():
        L.append('| changed px in keep rect `%s` | %d | %s |' % (n, v, v == 0))
    for p in per_zone:
        L.append('| zone `%s`: guide-colour px within ±6 px of border | %d | %s |' % (p['zone'], p['guide_px_border_band'], p['guide_px_border_band'] == 0))
        L.append('| zone `%s`: mean lum inside / 12 px ring | %s / %s = %s | %s |' % (p['zone'], p['mean_lum_inside'], p['mean_lum_ring12'], p['ratio'], p['lum_pass']))
    L.append('| REF_GOAL_%s.jpg starts FF D8 FF | %s | %s |' % (U, gates['ref_goal_jpeg_magic_ffd8ff'], gates['ref_goal_jpeg_magic_ffd8ff']))
    L += ['', '## SHA-256', '']
    for n, v in files.items():
        L.append('- `%s` `%s`' % (n, v))
    L += ['', 'REF_GOAL: %s; evidence/composition only, never shipped as product art.' % ref_method]
    if wm:
        L += ['', '## Wordmark', '', '- source %dx%d sha256 `%s`; fully transparent %.1f %% -> %s' % (wm['source_size'][0], wm['source_size'][1], wm['source_sha256'], 100 * frac, 'PASS' if wm['alpha_gate_pass'] else 'FAIL')]
        if 'sha256' in wm:
            L.append('- trimmed to content + 8 px, clipped to the source canvas: box %s, size %dx%d' % (wm['trim_box'], wm['trimmed_size'][0], wm['trimmed_size'][1]))
            for n, v in wm['sha256'].items():
                L.append('- `%s` `%s`' % (n, v))
        L.append('- Spelling confirmed correct by Nik and Claude (2026-10-01).')
    L += ['', 'Likeness is not judged: faces, hands and packs are original pixels by construction (hard restore).', '']
    with open(os.path.join(assets, 'intake_report.md'), 'w') as f:
        f.write('\n'.join(L))
    print(json.dumps({'screen': S, 'result': rep['result'], 'framing': al['aligned_crop_error_px'],
                      'outside': gates['changed_px_outside_remove_zones'],
                      'prot': gates['changed_px_per_protected_box'], 'keep': gates['changed_px_per_keep_rect'],
                      'zones': [(p['zone'], p['guide_px_border_band'], p['ratio'], p['lum_pass']) for p in per_zone],
                      'ref': gates['ref_goal_jpeg_magic_ffd8ff'], 'wm': wm and wm.get('alpha_gate_pass')}, indent=0))
    return 0 if passed else 1


if __name__ == '__main__':
    sys.exit(main())
