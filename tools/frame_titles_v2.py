#!/usr/bin/env python3
"""HO-057 wiring (Studio Small Axe): reframe each V2 title wordmark to its V1 canvas ratio.

Team V's V2 masters carry a wider clear margin (contour and contact shadow), so their ratio differs from V1 and every
screen that sizes a title by both width and height (fill or contain) would draw the letters at a different size. This
trims only fully clear rows above and below the lettering (centred on it) so each file has its V1 ratio; when a title's
lettering is taller than the V1 frame allows (Season Results), it pads clear columns instead and keeps the file width.
Run from the repo root: python3 tools/frame_titles_v2.py   (Pillow). Idempotent: a file already at its V1 ratio is skipped.
"""
from PIL import Image
import os
B = "visual-assets/v10_1/"
V1 = {"CS": "career-statistics/assets/TITLE_CS_V1.webp", "LG": "legacy/assets/TITLE_LG_V1.webp",
      "RV": "rivalry-statistics/assets/TITLE_RV_V1.webp", "RV_PHONE": "rivalry-statistics/assets/TITLE_RV_V1_PHONE.webp",
      "SR": "season-results/assets/TITLE_SR_V1.webp", "SR_PHONE": "season-results/assets/TITLE_SR_PHONE_V1.webp",
      "TR": "trophy-room/assets/TITLE_TR_V1.webp"}
for n in ["CONNECT_PLAYERS", "FINAL_WINNER", "LEAGUE", "NEW_SHOWDOWN", "RULE_BOOK", "SETTINGS", "STANDINGS", "TRANSFER"]:
    V1[n] = f"shared/wordmarks/TITLE_{n}_V1.webp"
for name, v1 in V1.items():
    w1, h1 = Image.open(B + v1).size
    ar = w1 / h1
    folder = os.path.dirname(B + v1)
    for width in (480, 960, 1920, 3840):
        path = f"{folder}/TITLE_{name}_V2_{width}.webp"
        im = Image.open(path).convert("RGBA")
        W, H = im.size
        if abs(W / H - ar) < 0.01:
            continue
        box = im.split()[3].point(lambda v: 255 if v > 8 else 0).getbbox()
        target_h = round(W / ar)
        if target_h <= H and box[3] - box[1] <= target_h:
            mid = (box[1] + box[3]) / 2
            top = int(round(min(max(mid - target_h / 2, 0), H - target_h)))
            out = im.crop((0, top, W, top + target_h))
        else:
            # lettering taller than the V1 frame: pad clear columns, then scale back to the file's width
            pad_w = round(H * ar)
            canvas = Image.new("RGBA", (pad_w, H), (0, 0, 0, 0))
            canvas.paste(im, ((pad_w - W) // 2, 0))
            out = canvas.resize((W, round(W / ar)), Image.LANCZOS)
        out.save(path, "WEBP", quality=90, method=6, alpha_quality=100)
        print(path, (W, H), "->", out.size)
