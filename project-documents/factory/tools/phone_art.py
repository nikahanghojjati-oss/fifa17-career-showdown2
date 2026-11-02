#!/usr/bin/env python3
"""Claude intake for phone-art jobs (2026-10-04): cut-outs, edge refine, runtime WebP, proof.

  python3 project-documents/factory/tools/phone_art.py <screen dir> <CODE> <plate 2X png> [daniel|nik ...]

<screen dir> holds assets/phonemap.json (cutouts.daniel_phone / nik_phone + phone_frame) and
assets/ENV_<CODE>_PHONE_V1.webp. Writes assets/OVL_<CODE>_<WHO>_PHONE_V1_2X.png (master),
assets/OVL_<CODE>_<WHO>_PHONE_V1.webp (trimmed, <= 60 KB) and assets/PHONE_PROOF.png (393x660 @3x),
plus a 1x proof jpg in /tmp/claude-0/qc/proof_<CODE>.jpg. Run from the repo root.
"""
import json, os, subprocess, sys
import numpy as np
from PIL import Image

V = "visual-assets/v10_1"
d, code, plate = sys.argv[1], sys.argv[2], sys.argv[3]
who = [w for w in (sys.argv[4:] or ["daniel", "nik"]) if w != "none"]  # "none" = proof only
A = f"{d}/assets"
for w in who:
    out = f"{A}/OVL_{code}_{w.upper()}_PHONE_V1"
    subprocess.run(["python3", f"{V}/shared/tools/cutout.py", "--plate", plate, "--source-scale", "2", "--erode", "1",
                    "--feather", "1.5", "--map", f"{A}/phonemap.json", "--key", f"cutouts.{w}_phone", "--output", out],
                   check=True, stdout=subprocess.DEVNULL)
    subprocess.run(["python3", f"{V}/shared/tools/refine_cutout.py", "--grow", "80", "--plate", plate, "--cutout", out + "_2X.png"],
                   check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    a = np.array(Image.open(out + "_2X.png").convert("RGBA")); a[a[:, :, 3] < 10] = 0
    im = Image.fromarray(a); im.save(out + "_2X.png"); im = im.crop(im.getchannel("A").getbbox())
    for h, q in ((1000, 80), (920, 78), (860, 75), (800, 72), (740, 66), (700, 62), (660, 60)):
        r = im.resize((round(im.width * h / im.height), h), Image.LANCZOS) if im.height > h else im
        r.save(out + ".webp", "WEBP", quality=q, method=6)
        if os.path.getsize(out + ".webp") <= 60000:
            break
    for f in (out + "_1X.png", out + "_RIM_1X.png", out + "_RIM_2X.png"):
        if os.path.exists(f):
            os.remove(f)
    print(out + ".webp", r.size, q, os.path.getsize(out + ".webp"))

S = 3; W, H = 393 * S, 660 * S
pf = json.load(open(f"{A}/phonemap.json"))["phone_frame"]
bgp = pf["background"]; px = bgp.get("position_pct", [bgp.get("position_x_pct", 50), bgp.get("position_y_pct", 50)])
bg = Image.open(f"{A}/ENV_{code}_PHONE_V1.webp").convert("RGBA")
sc = max(W / bg.width, H / bg.height); bg = bg.resize((round(bg.width * sc), round(bg.height * sc)), Image.LANCZOS)
ox = round((bg.width - W) * px[0] / 100); oy = round((bg.height - H) * px[1] / 100); canvas = bg.crop((ox, oy, ox + W, oy + H))
heroes = pf.get("heroes") or pf.get("figures") or {k: pf[k] for k in ("daniel", "nik")}
for k in ("daniel", "nik"):
    h = heroes[k]
    im = Image.open(f"{A}/OVL_{code}_{k.upper()}_PHONE_V1.webp").convert("RGBA"); im = im.crop(im.getchannel("A").getbbox())
    hp = h.get("height_pct", h.get("visible_figure_height_pct")); hh = round(H * hp / 100); ww = round(im.width * hh / im.height)
    im = im.resize((ww, hh), Image.LANCZOS)
    cx = h.get("center_x_pct", h.get("x_center_pct", h.get("alpha_bbox_center_x_pct")))
    x = round(W * h["left_pct"] / 100) if cx is None else round(W * cx / 100 - ww / 2)
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0)); layer.paste(im, (x, round(H * h["top_pct"] / 100)), im)
    canvas.alpha_composite(layer)
g = pf.get("dark_bottom_gradient") or pf.get("bottom_gradient") or {"start_y_pct": 50}
y0 = int(H * g.get("start_y_pct", g.get("start_pct", 50)) / 100); y1 = int(H * g.get("end_y_pct", g.get("end_pct", 100)) / 100)
col = np.zeros((H, 1), np.float32); col[y0:, 0] = np.clip((np.arange(y0, H) - y0) / max(1, y1 - y0), 0, 1) * 235
ov = Image.new("RGBA", (W, H), (6, 7, 9, 0)); ov.putalpha(Image.fromarray(col.astype(np.uint8)).resize((W, H))); canvas.alpha_composite(ov)
canvas.convert("RGB").save(f"{A}/PHONE_PROOF.png")
os.makedirs("/tmp/claude-0/qc", exist_ok=True)
canvas.convert("RGB").resize((393, 660)).save(f"/tmp/claude-0/qc/proof_{code}.jpg", quality=80)
print("proof", f"{A}/PHONE_PROOF.png")
