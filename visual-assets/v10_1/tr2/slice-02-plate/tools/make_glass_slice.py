"""Derive the mobile glass 9-slice from the locked Plate G (no generation, crop only).

Source: rules card C, the cleanest camera-facing painted panel on the plate.
Output: assets/DER_TR2_PLATE_G_GLASS_C_V1.png (from the 3344 plate, 2x plate px).
Slice insets are recorded in platemap.json -> mobile.glass.
Deterministic: re-running reproduces the committed file byte-for-byte.
"""
import hashlib
import os
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
SRC = os.path.join(ROOT, "assets", "ENV_TR2_PLATE_G_LOCKED_V1_3344.png")
OUT = os.path.join(ROOT, "assets", "DER_TR2_PLATE_G_GLASS_C_V1.png")
RECT = (1299, 552, 1519, 714)  # plate px (1672 space)

im = Image.open(SRC).convert("RGB")
crop = im.crop(tuple(v * 2 for v in RECT))
crop.save(OUT, optimize=False, compress_level=9)
print(OUT, crop.size, hashlib.sha256(open(OUT, "rb").read()).hexdigest())
