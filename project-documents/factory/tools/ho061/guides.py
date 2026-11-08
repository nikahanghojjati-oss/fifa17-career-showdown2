"""HO-061: build cyan-box guides for GPT clean-up pictures, plus the lock bases.

Run from the repo root: python3 project-documents/factory/tools/ho061/guides.py
Desktop guide = 1X plate pasted at y=80 on a 1536x1024 black canvas, cyan boxes on top.
Phone guide = 1179x2096 picture scaled to 864x1536, centred on a 1024x1536 black canvas.
"""
import os, sys
import numpy as np
from PIL import Image, ImageDraw
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from boxes import DESK, RIVALRY_PHONE, PHONE_SCALE, PHONE_UP, PHONE_EXTRA

V = "visual-assets/v10_1"
ATT = "project-documents/factory/tickets/attach/HO061"
BASE = "project-documents/factory/tools/ho061/base"
CYAN = (0, 255, 255)
os.makedirs(ATT, exist_ok=True); os.makedirs(BASE, exist_ok=True)


def desk_guide(key):
    im = Image.open(f"{V}/plates-v2/ENV_{key}_PLATE_V2_1X.webp").convert("RGB")
    d = ImageDraw.Draw(im)
    for b in DESK[key]:
        d.rectangle(b, fill=CYAN)
    can = Image.new("RGB", (1536, 1024), (0, 0, 0)); can.paste(im, (0, 80))
    can.save(f"{ATT}/GUIDE_{key}_CLEAN.png")


def phone_guide(name, im, boxes):
    im = im.copy(); d = ImageDraw.Draw(im)
    for b in boxes:
        d.rectangle(b, fill=CYAN)
    can = Image.new("RGB", (1024, 1536), (0, 0, 0)); can.paste(im.resize((864, 1536), Image.LANCZOS), (80, 0))
    can.save(f"{ATT}/GUIDE_{name}.png")


def shrunk(key):
    im = Image.open(f"{V}/plates-v2/ENV_{key}_PHONE_V2.webp").convert("RGB"); W, H = im.size
    w, h = round(W * PHONE_SCALE), round(H * PHONE_SCALE)
    sm = im.resize((w, h), Image.LANCZOS)
    x0, y0 = (W - w) // 2, -PHONE_UP
    can = Image.new("RGB", (W, H), CYAN); can.paste(sm, (x0, y0))
    can.save(f"{BASE}/{key}_PHONE_SHRUNK.png")
    boxes = [(0, 0, x0 - 1, H), (x0 + w, 0, W, H), (0, h + y0, W, H)] + PHONE_EXTRA[key]
    return can, boxes


if __name__ == "__main__":
    for k in DESK:
        desk_guide(k)
    rv = Image.open(f"{V}/plates-v3/ENV_RIVALRY_PHONE_V3.webp").convert("RGB")
    phone_guide("RIVALRY_PHONE_CLEAN", rv, RIVALRY_PHONE)
    for k in PHONE_EXTRA:
        can, boxes = shrunk(k)
        phone_guide(f"{k}_PHONE_SMALLER", can, boxes)
    print("guides in", ATT)
