#!/usr/bin/env python3
"""align.py raw.png IMG1.png out.webp [mask.png]   (P3: numpy-only port of Team V's align.py, no OpenCV)

Resizes the ChatGPT picture to Image 1's size, then finds the scale (0.94-1.06) and shift that lay it onto Image 1,
using phase correlation of edge maps. With a hero mask (masks/ENV_<ROOM>_PLATE_HC_V3_1920.png) the fit uses only the
two men, who must be unchanged, so new wall materials can't pull it. Saves WebP q88 and a side-by-side out.webp.cmp.jpg,
and prints scale, shift and the men's mean difference after alignment. Reject a picture whose scale is outside
0.99-1.01 (Astra lands at ~1.000) or whose men differ: that means the framing changed.
"""
import sys
import numpy as np
from PIL import Image, ImageFilter

WORK = 1024


def gray(im):
    a = np.asarray(im.convert("RGB"), dtype=np.float32)
    return a[..., 0] * .2126 + a[..., 1] * .7152 + a[..., 2] * .0722


def edges(L):
    gx = np.zeros_like(L); gy = np.zeros_like(L)
    gx[:, 1:-1] = L[:, 2:] - L[:, :-2]; gy[1:-1] = L[2:] - L[:-2]
    return np.sqrt(gx * gx + gy * gy)


def warp(im, s, dx, dy, size):
    """Scale by s about the centre, then shift by (dx, dy) in output pixels."""
    W, H = size
    cx, cy = W / 2, H / 2
    # output (x, y) samples input ((x - dx - cx) / s + cx, (y - dy - cy) / s + cy)
    a = 1 / s
    return im.transform(size, Image.AFFINE, (a, 0, cx - (cx + dx) * a, 0, a, cy - (cy + dy) * a), resample=Image.BICUBIC)


def phase(a, b):
    """Shift (dx, dy) that moves b onto a, plus the peak strength."""
    F = np.fft.fft2(a) * np.conj(np.fft.fft2(b))
    r = np.fft.ifft2(F / np.maximum(np.abs(F), 1e-9)).real
    y, x = np.unravel_index(np.argmax(r), r.shape)
    H, W = r.shape
    def sub(c, m, n):
        return ((m - n) / (2 * (m - 2 * c + n))) if (m - 2 * c + n) != 0 else 0.0
    dy = y + sub(r[y, x], r[(y - 1) % H, x], r[(y + 1) % H, x])
    dx = x + sub(r[y, x], r[y, (x - 1) % W], r[y, (x + 1) % W])
    if dy > H / 2: dy -= H
    if dx > W / 2: dx -= W
    return dx, dy, float(r[y, x])


def main():
    raw_p, ref_p, out_p = sys.argv[1:4]
    mask_p = sys.argv[4] if len(sys.argv) > 4 else None
    ref = Image.open(ref_p).convert("RGB")
    W0, H0 = ref.size
    raw = Image.open(raw_p).convert("RGB")
    r0 = raw.resize((W0, H0), Image.LANCZOS)
    k = WORK / W0
    ws = (WORK, int(round(H0 * k)))
    A = edges(gray(ref.resize(ws, Image.LANCZOS)))
    win = np.outer(np.hanning(ws[1]), np.hanning(ws[0])).astype(np.float32)
    if mask_p:
        m = Image.open(mask_p).convert("L").resize(ws).filter(ImageFilter.MaxFilter(9))
        win = win * (0.15 + 0.85 * (np.asarray(m, dtype=np.float32) > 8))
    small = r0.resize(ws, Image.LANCZOS)
    best = None
    for s in np.arange(0.94, 1.0601, 0.005):
        B = edges(gray(warp(small, s, 0, 0, ws)))
        dx, dy, pk = phase(A * win, B * win)
        if best is None or pk > best[3]:
            best = (s, dx, dy, pk)
    s0 = best[0]
    for s in np.arange(s0 - 0.005, s0 + 0.0051, 0.001):
        B = edges(gray(warp(small, s, 0, 0, ws)))
        dx, dy, pk = phase(A * win, B * win)
        if pk > best[3]:
            best = (s, dx, dy, pk)
    s, dx, dy, pk = best
    out = warp(r0, s, dx / k, dy / k, (W0, H0))
    out.save(out_p, "WEBP", quality=88, method=6)
    cmp = Image.new("RGB", (1920, 540))
    cmp.paste(ref.resize((960, 540)), (0, 0)); cmp.paste(out.resize((960, 540)), (960, 0))
    cmp.save(out_p + ".cmp.jpg", quality=85)
    msg = f"scale {s:.4f} shift {dx / k:+.1f},{dy / k:+.1f} px  peak {pk:.3f}"
    if mask_p:
        m = np.asarray(Image.open(mask_p).convert("L").resize((W0, H0))) > 128
        d = np.abs(np.asarray(out, dtype=np.float32) - np.asarray(ref, dtype=np.float32)).mean(-1)[m]
        msg += f"  men mean diff {d.mean():.1f} levels"
    print(msg, "OK" if 0.99 <= s <= 1.01 else "REJECT: framing changed")


if __name__ == "__main__":
    main()
