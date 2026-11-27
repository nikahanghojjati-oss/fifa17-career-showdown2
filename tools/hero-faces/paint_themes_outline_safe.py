#!/usr/bin/env python3
"""P4: repaint one room's themed copies (silver, black, matte, ruby) exactly as tools/clubhouse-themes/paint.py does, but pick
the WebP setting per file so the outline check passes against that file before the change.

Why: paint.py steps the WebP quality down until the file fits its size slack. A new Wooden hero can move that choice, and a
different quality re-blocks the whole picture, which never_slimmer.py can read as a hero edge a pixel further in, or as room
pixels that moved. Nothing in the picture changes here: the array paint.py builds is the same (same painting, same Wooden men,
same mask); only the encoder setting is chosen from the ones that keep paint.py's own rules (size within its slack, face drift
within FACE_DRIFT_MAX, method 6 first) and give short_pts 0 (near a real change, never_slimmer --changed-only) and room_moved_px within 0.1% against the file before.
usage: python3 tools/hero-faces/paint_themes_outline_safe.py ROOM BEFORE_REF   (e.g. OFFICE origin/gameplay/r100)"""
import io, os, subprocess, sys
import numpy as np
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
sys.path.insert(0, HERE); sys.path.insert(0, os.path.join(ROOT, "tools", "clubhouse-themes"))
import never_slimmer as NS
import paint

ROOM, BEFORE = sys.argv[1], sys.argv[2]
cur = {}
_encode = paint.encode

def before(rel):
    b = subprocess.run(["git", "-C", ROOT, "show", f"{BEFORE}:{rel}"], capture_output=True, check=True).stdout
    return np.asarray(Image.open(io.BytesIO(b)).convert("RGB"))

def encode(img, limit, floor=76):
    if not cur: return _encode(img, limit, floor)
    old = before(cur["rel"]); mask = cur["mask"]; H, W = old.shape[:2]
    for m in (6, 5, 4, 3, 2):
        for q in range(90, floor - 1, -1):
            buf = io.BytesIO(); img.save(buf, "WEBP", quality=q, method=m)
            if buf.tell() > limit: continue
            dec = np.asarray(Image.open(io.BytesIO(buf.getvalue())).convert("RGB"))
            short = int(NS.measure(dec, old, mask, "right", changed_only=True)[3].sum()); moved = int(NS.room_moved(dec, old, mask).sum())
            if not short and moved <= 0.001 * W * H:
                print(f"  {cur["rel"]}: q{q} m{m} {buf.tell()} bytes, short 0, room moved {moved}")
                return buf.getvalue(), q
    raise SystemExit(f"{cur['rel']}: no WebP setting within paint.py's size slack keeps the outline")

paint.encode = encode
done = []
for theme, name, painting, room, folder, mask, framing, kind in paint._targets():
    if room != ROOM: continue
    rel = os.path.relpath(os.path.join(folder, theme, name + ".webp"), ROOT).replace(os.sep, "/")
    cur.clear(); cur.update(rel=rel, mask=f"ENV_{ROOM}_PHONE_HC_V3" if "PHONE" in name else f"ENV_{ROOM}_PLATE_HC_V3_1920")
    if framing in ("desk", "tile"): done.append(paint.paint_desk(theme, name, painting, room, folder, mask, framing))
    else: done.append(paint.paint_phone(theme, name, painting, room, folder, mask, framing, kind=kind))
print("painted", len(done), "files for", ROOM)
