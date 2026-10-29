"""HO-031 v3 phone plates: geometric edit toolkit (mattes, PatchMatch fill from the plate's own texture, warps)."""
import os, numpy as np, cv2
from PIL import Image
from numba import njit, prange

IW, IH = 1179, 2096
DEBUG = False

def load(p):
    return np.asarray(Image.open(p).convert('RGB')).astype(np.float32) / 255.0

def save_png(a, p):
    Image.fromarray((np.clip(a, 0, 1) * 255 + 0.5).astype(np.uint8)).save(p)

# ---------------------------------------------------------------- mattes
def seg_masks(img_u8_pil, u2net_home):
    os.environ['U2NET_HOME'] = u2net_home
    from rembg import new_session, remove
    out = {}
    for m in ('isnet-general-use', 'u2net_human_seg'):
        out[m] = np.asarray(remove(img_u8_pil, session=new_session(m), only_mask=True)).astype(np.float32) / 255.0
    return out

def refine_alpha(img, rough, band=12, crop_pad=40):
    """Closed-form matting on a trimap grown around the rough mask edge (pymatting), then ML foreground colours."""
    from pymatting import estimate_alpha_cf, estimate_foreground_ml
    H, W = rough.shape
    ys, xs = np.where(rough > 0.05)
    y0, y1 = max(0, ys.min() - crop_pad), min(H, ys.max() + crop_pad)
    x0, x1 = max(0, xs.min() - crop_pad), min(W, xs.max() + crop_pad)
    r = rough[y0:y1, x0:x1]; im = img[y0:y1, x0:x1].astype(np.float64)
    k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * band + 1, 2 * band + 1))
    fg = cv2.erode((r > 0.85).astype(np.uint8), k)
    bg = cv2.erode((r < 0.15).astype(np.uint8), k)
    tri = np.full(r.shape, 0.5); tri[fg > 0] = 1; tri[bg > 0] = 0
    a = estimate_alpha_cf(im, tri)
    a = np.clip(a, 0, 1)
    F = estimate_foreground_ml(im, a)
    A = np.zeros((H, W), np.float32); A[y0:y1, x0:x1] = a
    Fo = img.copy(); Fo[y0:y1, x0:x1] = F
    return A, Fo.astype(np.float32), tri

# ---------------------------------------------------------------- PatchMatch completion (Wexler-style EM)
@njit(cache=True)
def _dist(A, B, ty, tx, sy, sx, r, best):
    d = 0.0
    for dy in range(-r, r + 1):
        for dx in range(-r, r + 1):
            for c in range(3):
                e = A[ty + dy, tx + dx, c] - B[sy + dy, sx + dx, c]
                d += e * e
        if d > best:
            return d
    return d

@njit(cache=True)
def _pm(img, tys, txs, nny, nnx, nnd, srcok, r, iters, maxr, seed):
    np.random.seed(seed)
    H, W = img.shape[0], img.shape[1]
    n = tys.shape[0]
    idx = -np.ones((H, W), np.int64)
    for i in range(n):
        idx[tys[i], txs[i]] = i
    for i in range(n):
        nnd[i] = _dist(img, img, tys[i], txs[i], nny[i], nnx[i], r, 1e30)
    for it in range(iters):
        if it % 2 == 0:
            order = range(n); step = 1
        else:
            order = range(n - 1, -1, -1); step = -1
        for i in order:
            ty, tx = tys[i], txs[i]
            # propagation
            for k in range(2):
                if k == 0:
                    ny, nx = ty, tx - step
                else:
                    ny, nx = ty - step, tx
                if ny < 0 or nx < 0 or ny >= H or nx >= W:
                    continue
                j = idx[ny, nx]
                if j < 0:
                    continue
                sy = nny[j] + (ty - ny); sx = nnx[j] + (tx - nx)
                if sy < r or sx < r or sy >= H - r or sx >= W - r or not srcok[sy, sx]:
                    continue
                d = _dist(img, img, ty, tx, sy, sx, r, nnd[i])
                if d < nnd[i]:
                    nnd[i] = d; nny[i] = sy; nnx[i] = sx
            # random search
            rad = maxr
            while rad >= 1:
                sy = nny[i] + np.random.randint(-rad, rad + 1)
                sx = nnx[i] + np.random.randint(-rad, rad + 1)
                if sy >= r and sx >= r and sy < H - r and sx < W - r and srcok[sy, sx]:
                    d = _dist(img, img, ty, tx, sy, sx, r, nnd[i])
                    if d < nnd[i]:
                        nnd[i] = d; nny[i] = sy; nnx[i] = sx
                rad //= 2

@njit(cache=True, parallel=True)
def _vote(img, hole, tys, txs, nny, nnx, nnd, wdist, r, out):
    H, W = img.shape[0], img.shape[1]
    acc = np.zeros((H, W, 3)); wacc = np.zeros((H, W))
    n = tys.shape[0]
    for i in range(n):
        ty, tx, sy, sx = tys[i], txs[i], nny[i], nnx[i]
        w = wdist[ty, tx] * np.exp(-nnd[i] / (2.0 * (2 * r + 1) ** 2 * 0.004))
        for dy in range(-r, r + 1):
            for dx in range(-r, r + 1):
                y = ty + dy; x = tx + dx
                if hole[y, x]:
                    for c in range(3):
                        acc[y, x, c] += w * img[sy + dy, sx + dx, c]
                    wacc[y, x] += w
    for y in prange(H):
        for x in range(W):
            if hole[y, x] and wacc[y, x] > 0:
                for c in range(3):
                    out[y, x, c] = acc[y, x, c] / wacc[y, x]

def complete(img, hole, src=None, r=3, levels=None, em=(6, 4), pm_iters=5, seed=1, band=None):
    """Fill `hole` (bool) in img (float RGB) from the image's own known texture (PatchMatch + EM voting, multi-scale).
    src: bool mask of allowed source patch centres (default: everything outside the hole grown by r+1).
    band: if given, sources are limited to pixels within `band` px of the hole (nearby texture only)."""
    H, W = hole.shape
    if src is None:
        src = np.ones_like(hole)
    k = np.ones((2 * r + 3, 2 * r + 3), np.uint8)
    srcm = src & ~cv2.dilate(hole.astype(np.uint8), k).astype(bool)
    if band is not None:
        dist = cv2.distanceTransform((~hole).astype(np.uint8), cv2.DIST_L2, 5)
        srcm &= dist < band
    # pyramid
    if levels is None:
        dt = cv2.distanceTransform(hole.astype(np.uint8), cv2.DIST_L2, 5).max()
        levels = min(5, max(1, int(np.ceil(np.log2(max(dt, 2) / 3.0))) + 1))
    imgs, holes, srcs = [img.astype(np.float32)], [hole.copy()], [srcm.copy()]
    for _ in range(levels - 1):
        im = cv2.resize(imgs[-1], (imgs[-1].shape[1] // 2, imgs[-1].shape[0] // 2), interpolation=cv2.INTER_AREA)
        h = cv2.resize(holes[-1].astype(np.float32), (im.shape[1], im.shape[0]), interpolation=cv2.INTER_AREA) > 0.01
        s = cv2.resize(srcs[-1].astype(np.float32), (im.shape[1], im.shape[0]), interpolation=cv2.INTER_AREA) > 0.99
        s &= ~cv2.dilate(h.astype(np.uint8), k).astype(bool)
        if s[r:-r, r:-r].sum() < 50:
            break
        imgs.append(im); holes.append(h); srcs.append(s)
    levels = len(imgs)
    rng = np.random.default_rng(seed)
    cur = None; prev_nn = None
    for L in range(levels - 1, -1, -1):
        im = imgs[L].copy(); h = holes[L]; s = srcs[L].copy()
        s[:r, :] = False; s[-r:, :] = False; s[:, :r] = False; s[:, -r:] = False
        Hh, Ww = h.shape
        if cur is None:
            # init: smooth fill
            m8 = h.astype(np.uint8)
            im8 = (np.clip(im, 0, 1) * 255).astype(np.uint8)
            im = cv2.inpaint(im8, m8, 5, cv2.INPAINT_TELEA).astype(np.float32) / 255.0
        else:
            up = cv2.resize(cur, (Ww, Hh), interpolation=cv2.INTER_LINEAR)
            im[h] = up[h]
        tmask = cv2.dilate(h.astype(np.uint8), np.ones((2 * r + 1, 2 * r + 1), np.uint8)).astype(bool)
        tmask[:r, :] = False; tmask[-r:, :] = False; tmask[:, :r] = False; tmask[:, -r:] = False
        tys, txs = np.where(tmask)
        tys = tys.astype(np.int64); txs = txs.astype(np.int64)
        sy_all, sx_all = np.where(s)
        if prev_nn is not None:
            py, px, pmap = prev_nn
            j = pmap[np.clip(tys // 2, 0, pmap.shape[0] - 1), np.clip(txs // 2, 0, pmap.shape[1] - 1)]
            ok = j >= 0
            nny = np.empty_like(tys); nnx = np.empty_like(txs)
            pick = rng.integers(0, len(sy_all), len(tys))
            nny[:] = sy_all[pick]; nnx[:] = sx_all[pick]
            cy = py[j[ok]] * 2 + (tys[ok] % 2); cx = px[j[ok]] * 2 + (txs[ok] % 2)
            cy = np.clip(cy, r, Hh - r - 1); cx = np.clip(cx, r, Ww - r - 1)
            good = s[cy, cx]
            tmp_y = nny[ok]; tmp_x = nnx[ok]
            tmp_y[good] = cy[good]; tmp_x[good] = cx[good]
            nny[ok] = tmp_y; nnx[ok] = tmp_x
        else:
            pick = rng.integers(0, len(sy_all), len(tys))
            nny = sy_all[pick].astype(np.int64); nnx = sx_all[pick].astype(np.int64)
        # known target pixels keep themselves (identity) when their own patch is a valid source
        nnd = np.zeros(len(tys))
        dh = cv2.distanceTransform((h).astype(np.uint8), cv2.DIST_L2, 3)
        wdist = (1.3 ** (-dh)).astype(np.float64)
        n_em = em[0] if L == levels - 1 else em[1]
        maxr = max(Hh, Ww)
        for e in range(n_em):
            _pm(im, tys, txs, nny, nnx, nnd, s, r, pm_iters, maxr, seed + e + 17 * L)
            out = im.copy()
            _vote(im, h, tys, txs, nny, nnx, nnd, wdist, r, out)
            im = out
        cur = im
        pmap = -np.ones((Hh, Ww), np.int64); pmap[tys, txs] = np.arange(len(tys))
        prev_nn = (nny, nnx, pmap)
    res = img.copy(); res[hole] = cur[hole]
    return res

# ---------------------------------------------------------------- layers
def warp_layer(F, A, M, shape, flags=cv2.INTER_LANCZOS4):
    """Warp a foreground layer (colours F, alpha A) with 2x3 affine M, premultiplied."""
    H, W = shape
    pm = (F * A[..., None]).astype(np.float32)
    pw = cv2.warpAffine(pm, M, (W, H), flags=flags, borderMode=cv2.BORDER_CONSTANT, borderValue=0)
    aw = cv2.warpAffine(A.astype(np.float32), M, (W, H), flags=flags, borderMode=cv2.BORDER_CONSTANT, borderValue=0)
    aw = np.clip(aw, 0, 1)
    Fw = np.where(aw[..., None] > 1e-4, pw / np.maximum(aw[..., None], 1e-4), 0)
    return np.clip(Fw, 0, 1), aw

def over(B, F, A):
    return F * A[..., None] + B * (1 - A[..., None])

def affine_scale_about(k, ax, ay, tx=0.0, ty=0.0):
    """x' = ax + k (x - ax) + tx"""
    return np.array([[k, 0, ax - k * ax + tx], [0, k, ay - k * ay + ty]], np.float32)

# ---------------------------------------------------------------- exemplar fill (Criminisi-style, copies real patches)
@njit(cache=True)
def _priorities(fy, fx, have, C, gy, gx, ny, nx, r):
    n = fy.shape[0]; P = np.empty(n); Cp = np.empty(n)
    for i in range(n):
        y = fy[i]; x = fx[i]; s = 0.0; cnt = 0
        for dy in range(-r, r + 1):
            for dx in range(-r, r + 1):
                if have[y + dy, x + dx]:
                    s += C[y + dy, x + dx]
                cnt += 1
        c = s / cnt
        # data term: strongest known isophote in the patch, projected on the front normal
        best = 0.0
        for dy in range(-r, r + 1):
            for dx in range(-r, r + 1):
                yy = y + dy; xx = x + dx
                if have[yy, xx]:
                    v = abs(-gy[yy, xx] * nx[y, x] + gx[yy, xx] * ny[y, x])
                    if v > best: best = v
        Cp[i] = c; P[i] = c * (best + 0.02)
    return P, Cp

def exemplar_fill(img, hole, known, r=4, win=170, lam=0.0, seed=0, verbose=False):
    """Fill `hole` by copying whole patches from `known` pixels (only patches fully inside `known` are sources).
    Pixels that are neither hole nor known are ignored (never copied, never compared)."""
    H, W = hole.shape
    img = img.astype(np.float32).copy()
    pad = r + 1
    img = cv2.copyMakeBorder(img, pad, pad, pad, pad, cv2.BORDER_REFLECT)
    hole = np.pad(hole, pad); known = np.pad(known, pad)
    hole[:pad] = hole[-pad:] = False; hole[:, :pad] = hole[:, -pad:] = False
    have = known.copy()
    C = known.astype(np.float64)
    validS = cv2.erode(known.astype(np.uint8), np.ones((2 * r + 1, 2 * r + 1), np.uint8)).astype(bool)
    gray = cv2.cvtColor(img, cv2.COLOR_RGB2GRAY)
    gx = cv2.Sobel(gray, cv2.CV_64F, 1, 0, ksize=3) / 8.0; gy = cv2.Sobel(gray, cv2.CV_64F, 0, 1, ksize=3) / 8.0
    todo = hole & ~have
    k3 = np.ones((3, 3), np.uint8)
    steps = 0
    while todo.any():
        hv = have.astype(np.float32)
        front = todo & cv2.dilate(hv, k3).astype(bool)
        if not front.any():
            break
        sm = cv2.GaussianBlur(hv, (0, 0), 2.0)
        ny = cv2.Sobel(sm, cv2.CV_64F, 0, 1, ksize=3); nx = cv2.Sobel(sm, cv2.CV_64F, 1, 0, ksize=3)
        nn = np.sqrt(nx ** 2 + ny ** 2) + 1e-9; ny /= nn; nx /= nn
        g_known_y = np.where(have, gy, 0); g_known_x = np.where(have, gx, 0)
        fy, fx = np.where(front)
        P, Cp = _priorities(fy.astype(np.int64), fx.astype(np.int64), have, C, g_known_y, g_known_x, ny, nx, r)
        # fill several far-apart front points per round (each gets its own best patch)
        order = np.argsort(-P)
        taken = np.zeros_like(front)
        nfill = max(1, min(40, len(order) // 60))
        done_here = 0
        for oi in order:
            y, x = fy[oi], fx[oi]
            if taken[y, x]:
                continue
            y0, y1, x0, x1 = y - r, y + r + 1, x - r, x + r + 1
            T = img[y0:y1, x0:x1]; M = have[y0:y1, x0:x1].astype(np.float32)
            sy0, sy1 = max(r, y - win), min(H + 2 * pad - r - 1, y + win); sx0, sx1 = max(r, x - win), min(W + 2 * pad - r - 1, x + win)
            region = img[sy0 - r:sy1 + r + 1, sx0 - r:sx1 + r + 1]
            ssd = cv2.matchTemplate(region, T, cv2.TM_SQDIFF, mask=np.repeat(M[..., None], 3, 2))
            vs = validS[sy0:sy1 + 1, sx0:sx1 + 1]
            ssd = np.where(vs[:ssd.shape[0], :ssd.shape[1]], ssd, np.inf)
            if lam > 0:
                yy, xx = np.mgrid[sy0:sy0 + ssd.shape[0], sx0:sx0 + ssd.shape[1]]
                ssd = ssd + lam * ((yy - y) ** 2 + (xx - x) ** 2)
            j = np.argmin(ssd)
            if not np.isfinite(ssd.flat[j]):
                continue
            qy, qx = np.unravel_index(j, ssd.shape); qy += sy0; qx += sx0
            S_ = img[qy - r:qy + r + 1, qx - r:qx + r + 1]
            newm = todo[y0:y1, x0:x1] & ~have[y0:y1, x0:x1]
            img[y0:y1, x0:x1][newm] = S_[newm]
            gx[y0:y1, x0:x1][newm] = gx[qy - r:qy + r + 1, qx - r:qx + r + 1][newm]
            gy[y0:y1, x0:x1][newm] = gy[qy - r:qy + r + 1, qx - r:qx + r + 1][newm]
            have[y0:y1, x0:x1] |= newm; C[y0:y1, x0:x1][newm] = Cp[oi]
            todo[y0:y1, x0:x1] &= ~newm
            taken[max(0, y - 3 * r):y + 3 * r + 1, max(0, x - 3 * r):x + 3 * r + 1] = True
            done_here += 1; steps += 1
            if done_here >= nfill:
                break
        if verbose and steps % 500 < nfill:
            print('  exemplar steps', steps, 'left', int(todo.sum()))
    return img[pad:-pad, pad:-pad]

# ---------------------------------------------------------------- PatchMatch completion v2: masked distance, ignore
@njit(cache=True)
def _dist_m(A, V, ty, tx, sy, sx, r, best):
    d = 0.0; n = 0
    for dy in range(-r, r + 1):
        for dx in range(-r, r + 1):
            if V[ty + dy, tx + dx]:
                for c in range(3):
                    e = A[ty + dy, tx + dx, c] - A[sy + dy, sx + dx, c]
                    d += e * e
                n += 1
    if n == 0:
        return 1e30
    return d / n

@njit(cache=True)
def _pm_m(img, V, tys, txs, nny, nnx, nnd, srcok, r, iters, maxr, seed):
    np.random.seed(seed)
    H, W = img.shape[0], img.shape[1]
    n = tys.shape[0]
    idx = -np.ones((H, W), np.int64)
    for i in range(n):
        idx[tys[i], txs[i]] = i
    for i in range(n):
        nnd[i] = _dist_m(img, V, tys[i], txs[i], nny[i], nnx[i], r, 1e30)
    for it in range(iters):
        if it % 2 == 0:
            a0, a1, step = 0, n, 1
        else:
            a0, a1, step = n - 1, -1, -1
        i = a0
        while i != a1:
            ty, tx = tys[i], txs[i]
            for k in range(2):
                if k == 0:
                    ny, nx = ty, tx - step
                else:
                    ny, nx = ty - step, tx
                if ny >= 0 and nx >= 0 and ny < H and nx < W:
                    j = idx[ny, nx]
                    if j >= 0:
                        sy = nny[j] + (ty - ny); sx = nnx[j] + (tx - nx)
                        if sy >= r and sx >= r and sy < H - r and sx < W - r and srcok[sy, sx]:
                            d = _dist_m(img, V, ty, tx, sy, sx, r, nnd[i])
                            if d < nnd[i]:
                                nnd[i] = d; nny[i] = sy; nnx[i] = sx
            rad = maxr
            while rad >= 1:
                sy = nny[i] + np.random.randint(-rad, rad + 1)
                sx = nnx[i] + np.random.randint(-rad, rad + 1)
                if sy >= r and sx >= r and sy < H - r and sx < W - r and srcok[sy, sx]:
                    d = _dist_m(img, V, ty, tx, sy, sx, r, nnd[i])
                    if d < nnd[i]:
                        nnd[i] = d; nny[i] = sy; nnx[i] = sx
                rad = rad // 2
            i += step

@njit(cache=True)
def _vote_m(img, tgt, tys, txs, nny, nnx, nnd, r, sig, out):
    H, W = img.shape[0], img.shape[1]
    acc = np.zeros((H, W, 3)); wacc = np.zeros((H, W))
    for i in range(tys.shape[0]):
        ty, tx, sy, sx = tys[i], txs[i], nny[i], nnx[i]
        w = np.exp(-nnd[i] / sig) + 1e-12
        for dy in range(-r, r + 1):
            for dx in range(-r, r + 1):
                y = ty + dy; x = tx + dx
                if tgt[y, x]:
                    for c in range(3):
                        acc[y, x, c] += w * img[sy + dy, sx + dx, c]
                    wacc[y, x] += w
    for y in range(H):
        for x in range(W):
            if tgt[y, x] and wacc[y, x] > 0:
                for c in range(3):
                    out[y, x, c] = acc[y, x, c] / wacc[y, x]

def complete2(img, hole, known, r=4, band=260, levels=None, em_coarse=12, em_fine=6, pm_iters=6, seed=1, sig=0.004, pct=25, wta=True):
    """PatchMatch/EM completion. hole: pixels to synthesise; known: valid context & sources; others ignored."""
    H, W = hole.shape
    k = np.ones((2 * r + 1, 2 * r + 1), np.uint8)
    src0 = cv2.erode(known.astype(np.uint8), k).astype(bool)
    if band:
        dist = cv2.distanceTransform((~hole).astype(np.uint8), cv2.DIST_L2, 5)
        src0 &= dist < band
    if levels is None:
        dt = cv2.distanceTransform(hole.astype(np.uint8), cv2.DIST_L2, 5).max()
        levels = min(5, max(1, int(np.ceil(np.log2(max(dt, 2) / 4.0))) + 1))
    I = [img.astype(np.float32)]; Hs = [hole]; Ks = [known]; Ss = [src0]
    for _ in range(levels - 1):
        im = cv2.resize(I[-1], (I[-1].shape[1] // 2, I[-1].shape[0] // 2), interpolation=cv2.INTER_AREA)
        h = cv2.resize(Hs[-1].astype(np.float32), (im.shape[1], im.shape[0]), interpolation=cv2.INTER_AREA) > 0.01
        kn = (cv2.resize(Ks[-1].astype(np.float32), (im.shape[1], im.shape[0]), interpolation=cv2.INTER_AREA) > 0.99) & ~h
        s = (cv2.resize(Ss[-1].astype(np.float32), (im.shape[1], im.shape[0]), interpolation=cv2.INTER_AREA) > 0.99) & cv2.erode(kn.astype(np.uint8), k).astype(bool)
        if s[r:-r, r:-r].sum() < 100:
            break
        I.append(im); Hs.append(h); Ks.append(kn); Ss.append(s)
    levels = len(I)
    if DEBUG: print('  levels', levels, [(int(h.sum()), int(s.sum())) for h, s in zip(Hs, Ss)])
    rng = np.random.default_rng(seed)
    cur = None; prev = None
    for L in range(levels - 1, -1, -1):
        im = I[L].copy(); h = Hs[L]; kn = Ks[L]; s = Ss[L].copy()
        s[:r] = False; s[-r:] = False; s[:, :r] = False; s[:, -r:] = False
        Hh, Ww = h.shape
        tmask = cv2.dilate(h.astype(np.uint8), k).astype(bool) & (h | kn)
        tmask[:r] = False; tmask[-r:] = False; tmask[:, :r] = False; tmask[:, -r:] = False
        tys, txs = np.where(tmask); tys = tys.astype(np.int64); txs = txs.astype(np.int64)
        sy_all, sx_all = np.where(s)
        pick = rng.integers(0, len(sy_all), len(tys))
        nny = sy_all[pick].astype(np.int64); nnx = sx_all[pick].astype(np.int64)
        nnd = np.zeros(len(tys))
        maxr = max(Hh, Ww)
        if cur is None:
            # onion-peel initialisation: grow from the hole border inward, distances only over pixels already known
            have = kn.copy()
            todo = h.copy()
            rounds = 0
            while todo.any() and rounds < 400:
                front = todo & cv2.dilate(have.astype(np.uint8), np.ones((3, 3), np.uint8)).astype(bool)
                if not front.any():
                    break
                band_m = front
                for _ in range(max(1, r // 2)):
                    band_m = (cv2.dilate(band_m.astype(np.uint8), np.ones((3, 3), np.uint8)).astype(bool) & todo)
                sel = band_m[tys, txs]
                ty2, tx2 = tys[sel], txs[sel]
                ny2, nx2, nd2 = nny[sel].copy(), nnx[sel].copy(), np.zeros(sel.sum())
                _pm_m(im, have, ty2, tx2, ny2, nx2, nd2, s, r, 4, maxr, seed + rounds)
                out = im.copy()
                _vote_m(im, band_m, ty2, tx2, ny2, nx2, nd2, r, max(np.percentile(nd2[nd2 < 1e29], 60), 1e-5) if (nd2 < 1e29).any() else 1.0, out)
                im = out; nny[sel] = ny2; nnx[sel] = nx2
                have |= band_m; todo &= ~band_m; rounds += 1
            V = kn | h
            n_em = em_coarse
            if DEBUG: print('  onion rounds', rounds, 'left', int(todo.sum()), 'hole mean', im[h].mean(0))
        else:
            up = cv2.resize(cur, (Ww, Hh), interpolation=cv2.INTER_LINEAR)
            im[h] = up[h]
            py, px, pmap = prev
            j = pmap[np.clip(tys // 2, 0, pmap.shape[0] - 1), np.clip(txs // 2, 0, pmap.shape[1] - 1)]
            ok = j >= 0
            cy = np.clip(py[j[ok]] * 2 + (tys[ok] % 2), r, Hh - r - 1); cx = np.clip(px[j[ok]] * 2 + (txs[ok] % 2), r, Ww - r - 1)
            good = s[cy, cx]
            a_y = nny[ok]; a_x = nnx[ok]; a_y[good] = cy[good]; a_x[good] = cx[good]; nny[ok] = a_y; nnx[ok] = a_x
            V = kn | h
            n_em = em_fine
        for e in range(n_em):
            _pm_m(im, V, tys, txs, nny, nnx, nnd, s, r, pm_iters, maxr, seed + 31 * L + e)
            out = im.copy()
            _vote_m(im, h, tys, txs, nny, nnx, nnd, r, max(np.percentile(nnd[nnd < 1e29], pct), 1e-5), out)
            im = out
        if L == 0 and wta:
            # final pass: every hole pixel takes the centre pixel of its own best patch (no averaging, no haze)
            _pm_m(im, V, tys, txs, nny, nnx, nnd, s, r, pm_iters, maxr, seed + 999)
            hy = h[tys, txs]
            im2 = im.copy(); im2[tys[hy], txs[hy]] = im[nny[hy], nnx[hy]]
            # light 3x3 blend with the voted result to hide 1-px seams
            im = 0.75 * im2 + 0.25 * im
        cur = im
        pmap = -np.ones((Hh, Ww), np.int64); pmap[tys, txs] = np.arange(len(tys))
        prev = (nny, nnx, pmap)
    res = img.copy(); res[hole] = cur[hole]
    return res

def vstretch_fill(img, hole, known, y_min, sigma=10, bottom=None):
    """Fill hole pixels below y_min column by column by stretching the known floor below each hole run upward
    (a geometric stretch of the plate's own floor; vertical light streaks stay continuous)."""
    H, W = hole.shape
    bottom = H - 1 if bottom is None else bottom
    out = img.copy(); done = np.zeros_like(hole)
    y0s = np.full(W, -1.0); y1s = np.full(W, -1.0)
    for x in range(W):
        ys = np.where(hole[y_min:, x])[0]
        if len(ys) == 0: continue
        y0s[x] = y_min + ys.min(); y1s[x] = y_min + ys.max()
    cols = np.where(y0s >= 0)[0]
    if len(cols) == 0: return out, done
    # smooth the run ends across columns (keep coverage: top never lower, bottom never higher than the true run)
    from scipy.ndimage import gaussian_filter1d, minimum_filter1d, maximum_filter1d
    big = 1e9
    t0 = np.where(y0s >= 0, y0s, big); t1 = np.where(y1s >= 0, y1s, -big)
    t0 = minimum_filter1d(t0, 2 * sigma + 1); t1 = maximum_filter1d(t1, 2 * sigma + 1)
    v0 = gaussian_filter1d(np.where(t0 < big, t0, np.nan_to_num(t0, nan=0)), sigma)
    v1 = gaussian_filter1d(np.where(t1 > -big, t1, 0), sigma)
    for x in cols:
        a0 = min(y0s[x], v0[x]); a1 = max(y1s[x], v1[x]) + 3
        if a1 >= bottom - 5: continue
        ys = np.arange(int(a0), bottom + 1)
        src = (a1 + 1) + (ys - a0) * (bottom - (a1 + 1)) / max(bottom - a0, 1)
        col = np.stack([np.interp(src, np.arange(H), img[:, x, c]) for c in range(3)], 1)
        # only write where the plate pixel is unknown, or blend smoothly into the stretched floor elsewhere
        m = hole[ys, x] | ~known[ys, x]
        w = np.where(m, 1.0, 0.0)
        out[ys, x] = col * w[:, None] + out[ys, x] * (1 - w[:, None])
        done[ys[m & hole[ys, x]], x] = True
    return out, done
