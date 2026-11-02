#!/usr/bin/env python3
"""Claude intake helper (2026-10-04): paint the baked name labels ("Daniel" / "Nik" script and the three
words under it) out of a 2X plate before phone cut-outs, so the text never rides on a shoulder.

  python3 project-documents/factory/tools/plate_detext.py <screen dir> <CODE> <out png>

Reads assets/phonemap.json > label_text_boxes (1X plate px [x0, y0, x1, y1]); inside each box, bright
text pixels (white words, yellow script) are inpainted from their surroundings. Writes a cleaned 2X plate
for phone_art.py (scratch only, never committed). Run from the repo root.
"""
import json, sys
import cv2, numpy as np
from PIL import Image

d, code, out = sys.argv[1:4]
A = f"{d}/assets"
boxes = json.load(open(f"{A}/phonemap.json"))["label_text_boxes"]
p = np.array(Image.open(f"{A}/ENV_{code}_PLATE_V1_2X.png").convert("RGB"))
mask = np.zeros(p.shape[:2], np.uint8)
for x0, y0, x1, y1 in (b for v in boxes.values() for b in v):
    x0, y0, x1, y1 = (2 * v for v in (x0, y0, x1, y1))
    s = p[y0:y1, x0:x1].astype(np.int16)
    lum, sat = s.mean(2), s.max(2) - s.min(2)
    white = (lum > 105) & (sat < 80)
    yellow = (s[..., 0] > 150) & (s[..., 1] > 120) & (s[..., 2] < 140) & (sat > 70)
    mask[y0:y1, x0:x1] = ((white | yellow) * 255).astype(np.uint8)
mask = cv2.dilate(mask, np.ones((7, 7), np.uint8))
Image.fromarray(cv2.inpaint(p, mask, 7, cv2.INPAINT_TELEA)).save(out)
print(out, int((mask > 0).sum()), "px painted")
