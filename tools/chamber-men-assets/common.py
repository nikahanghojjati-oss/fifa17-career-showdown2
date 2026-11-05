"""Shared helpers for the Chamber Men asset generators (numpy + Pillow only, deterministic, no downloads).

Every texture here is drawn by code in this folder, so the whole set is ours: no third-party licence, no trademark
(no real ball maker, league or sponsor graphics), and anyone can rebuild it bit for bit with `python3 build_all.py`.
"""
import os
import numpy as np
from PIL import Image

OUT = os.path.join(os.path.dirname(__file__), '..', '..', 'visual-assets', 'v10_1', 'chamber-men', 'assets')


def out_path(name):
    os.makedirs(OUT, exist_ok=True)
    return os.path.join(OUT, name)


def save_webp(arr, name, quality=88, lossless=False):
    """arr: float 0..1 (H,W,C) or (H,W). Writes WebP; returns size in bytes."""
    a = np.clip(arr, 0, 1)
    a = (a * 255 + 0.5).astype(np.uint8)
    mode = {2: 'L', 3: 'RGB', 4: 'RGBA'}[a.ndim if a.ndim == 2 else a.shape[2] + 0] if a.ndim == 3 else 'L'
    if a.ndim == 3:
        mode = {1: 'L', 3: 'RGB', 4: 'RGBA'}[a.shape[2]]
        if a.shape[2] == 1:
            a = a[:, :, 0]
    img = Image.fromarray(a, mode)
    p = out_path(name)
    img.save(p, 'WEBP', quality=quality, method=6, lossless=lossless, exact=(mode == 'RGBA'))
    return os.path.getsize(p)


def resize(arr, w, h):
    """High-quality downscale of a float image (Lanczos per channel in float mode)."""
    if arr.ndim == 2:
        return np.asarray(Image.fromarray(arr.astype(np.float32), 'F').resize((w, h), Image.LANCZOS))
    return np.stack([resize(arr[:, :, c], w, h) for c in range(arr.shape[2])], -1)


def blur(arr, sigma):
    """Gaussian blur with wrap-around (FFT), float in, float out."""
    if sigma <= 0:
        return arr
    h, w = arr.shape[:2]
    fy = np.fft.fftfreq(h)[:, None]
    fx = np.fft.fftfreq(w)[None, :]
    g = np.exp(-2 * (np.pi ** 2) * (sigma ** 2) * (fx ** 2 + fy ** 2))
    if arr.ndim == 2:
        return np.real(np.fft.ifft2(np.fft.fft2(arr) * g))
    return np.stack([np.real(np.fft.ifft2(np.fft.fft2(arr[:, :, c]) * g)) for c in range(arr.shape[2])], -1)


def hash3(ix, iy, iz, seed=0):
    """Integer lattice hash -> 0..1 (vectorised)."""
    h = (ix.astype(np.int64) * 73856093) ^ (iy.astype(np.int64) * 19349663) ^ (iz.astype(np.int64) * 83492791) ^ (seed * 2654435761)
    h = (h ^ (h >> 13)) * 1274126177
    h = h ^ (h >> 16)
    return (h & 0xFFFFFF).astype(np.float32) / float(0xFFFFFF)


def value_noise3(p, scale, seed=0):
    """Smooth 3D value noise at points p (...,3)."""
    q = p * scale
    i = np.floor(q).astype(np.int64)
    f = q - i
    u = f * f * (3 - 2 * f)
    out = 0
    for dx in (0, 1):
        for dy in (0, 1):
            for dz in (0, 1):
                w = (u[..., 0] if dx else 1 - u[..., 0]) * (u[..., 1] if dy else 1 - u[..., 1]) * (u[..., 2] if dz else 1 - u[..., 2])
                out = out + w * hash3(i[..., 0] + dx, i[..., 1] + dy, i[..., 2] + dz, seed)
    return out


def normal_from_height(h, px_u, px_v, strength=1.0):
    """Tangent-space normal map (OpenGL convention, +Y = up the texture) from a height field in metres.
    px_u, px_v: metres per pixel along u (may be a column array) and v. Wraps in u, clamps in v."""
    dhu = (np.roll(h, -1, 1) - np.roll(h, 1, 1)) / (2 * px_u)
    hp = np.vstack([h[1:], h[-1:]])
    hm = np.vstack([h[:1], h[:-1]])
    dhv = -(hp - hm) / (2 * px_v)  # rows go down the image, v goes up
    nx, ny, nz = -dhu * strength, -dhv * strength, np.ones_like(h)
    l = np.sqrt(nx * nx + ny * ny + nz * nz)
    return np.stack([nx / l * .5 + .5, ny / l * .5 + .5, nz / l * .5 + .5], -1)
