#!/usr/bin/env python3
"""WCAG contrast of the r78 text tokens against r78-marble-tile.webp.
Usage: python3 contrast.py r78-marble-tile.webp   (needs Pillow + numpy)
Reports each colour against the tile's mean luminance, its 99th-percentile (bright vein) pixel and its single
brightest pixel, plus the dark button label against the gold-metal button stops."""
import sys
import numpy as np
from PIL import Image

def lin(c):
    c = np.asarray(c, float) / 255.0
    return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)

def lum(rgb):
    l = lin(rgb)
    return 0.2126 * l[..., 0] + 0.7152 * l[..., 1] + 0.0722 * l[..., 2]

def hexrgb(h):
    h = h.lstrip('#')
    return [int(h[i:i + 2], 16) for i in (0, 2, 4)]

def ratio(a, b):
    hi, lo = max(a, b), min(a, b)
    return (hi + 0.05) / (lo + 0.05)

TOKENS = [
    ("--r78-ivory (body)", "#F2EBDD", 7.0),
    ("--r78-ivory-2 (secondary)", "#C9BFA8", 4.5),
    ("--r78-gold (headings, labels)", "#F2C45B", 4.5),
    ("--r78-gold-strong (values, warn)", "#FFD34D", 4.5),
    ("--r78-error (error text)", "#F07C6F", 4.5),
    ("--r78-success (success text)", "#7CC48F", 4.5),
    ("--sd-gold-200 (nav toast text)", "#FFF1B8", 4.5),
]

tile = np.asarray(Image.open(sys.argv[1] if len(sys.argv) > 1 else "r78-marble-tile.webp").convert("RGB"))
L = lum(tile)
mean, p99, mx = float(L.mean()), float(np.percentile(L, 99)), float(L.max())
print(f"tile luminance: mean {mean:.4f}  p99 {p99:.4f}  max {mx:.4f}")
print("| token | colour | vs panel (mean) | vs bright vein (p99) | vs brightest pixel | needs |")
print("|---|---|---|---|---|---|")
for name, col, need in TOKENS:
    l = float(lum(hexrgb(col)))
    worst = ratio(l, p99)
    print(f"| {name} | {col} | {ratio(l, mean):.1f}:1 | {worst:.1f}:1 | {ratio(l, mx):.1f}:1 | {need}:1 {'PASS' if worst >= need else 'FAIL'} |")
ink = float(lum(hexrgb("#07080A")))
for stop in ["#FFF3B0", "#FFD34D", "#D4A017", "#8A6A12"]:
    print(f"| button label #07080A on gold stop {stop} | | {ratio(ink, float(lum(hexrgb(stop)))):.1f}:1 | | | 4.5:1 |")
