"""HC desktop guide with the two men small at the side edges (Squad Management: the pitch board owns the middle).
Crops each man's box (with his own real room) from an approved room, scales it, puts Daniel at the left edge and
Nik at the right edge of a 1536x1024 (3:2) frame, both standing on the same lip line; cyan everywhere else.
python3 guide_edges.py ROOM.png SCALE 'dx0,dy0,dx1,dy1' 'nx0,ny0,nx1,ny1' LIP_Y OUT.png   (boxes in ROOM px)"""
import sys, json
from PIL import Image
W, H = 1536, 1024
room = Image.open(sys.argv[1]).convert("RGB")
s = float(sys.argv[2]); d = list(map(int, sys.argv[3].split(","))); n = list(map(int, sys.argv[4].split(",")))
lip = int(sys.argv[5]); out = sys.argv[6]
pd = room.crop(d).resize((round((d[2]-d[0])*s), round((d[3]-d[1])*s)), Image.LANCZOS)
pn = room.crop(n).resize((round((n[2]-n[0])*s), round((n[3]-n[1])*s)), Image.LANCZOS)
c = Image.new("RGB", (W, H), (0, 255, 255))
at = [[0, lip-pd.height], [W-pn.width, lip-pn.height]]
c.paste(pd, at[0]); c.paste(pn, at[1]); c.save(out)
json.dump({"room": sys.argv[1], "scale": s, "daniel_box": d, "nik_box": n, "at": at, "lip": lip,
           "daniel_w": pd.width, "nik_w": pn.width}, open(out.replace(".png", ".json"), "w"), indent=1)
print("daniel", at[0], pd.size, "nik", at[1], pn.size)
