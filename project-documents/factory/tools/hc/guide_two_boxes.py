"""HC phone guide when the two men stand far apart on desktop: one box per man, with his own real room,
placed side by side on a 1024x1536 guide, lip at 50%, cyan elsewhere.
python3 guide_two_boxes.py ROOM.png SCALE 'dx0,dy0,dx1,dy1' 'nx0,ny0,nx1,ny1' OUT.png [cyan boxes in room px 'x0,y0,x1,y1;...']
Both boxes must share the same bottom (the counter lip)."""
import sys, json
from PIL import Image, ImageDraw
import os
W, H, GAP = 1024, 1536, 36
LIP = int(os.environ.get("LIP", 768))
room = Image.open(sys.argv[1]).convert("RGB")
s = float(sys.argv[2]); d = list(map(int, sys.argv[3].split(","))); n = list(map(int, sys.argv[4].split(",")))
if len(sys.argv) > 6:
    dr = ImageDraw.Draw(room)
    for b in sys.argv[6].split(";"):
        dr.rectangle(list(map(int, b.split(","))), fill=(0, 255, 255))
parts = [room.crop(b).resize((round((b[2] - b[0]) * s), round((b[3] - b[1]) * s)), Image.LANCZOS) for b in (d, n)]
total = parts[0].width + GAP + parts[1].width
x = (W - total) // 2
c = Image.new("RGB", (W, H), (0, 255, 255))
pos = []
for p in parts:
    c.paste(p, (x, LIP - p.height)); pos.append([x, LIP - p.height]); x += p.width + GAP
c.save(sys.argv[5])
json.dump({"scale": s, "daniel_box": d, "nik_box": n, "at": pos, "lip": LIP}, open(sys.argv[5].replace(".png", ".json"), "w"), indent=1)
print("placed", pos, "right edge", x - GAP)
