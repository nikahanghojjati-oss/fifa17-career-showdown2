"""HC phone guide from an approved desktop room: the men keep their real room around them (no cut-out edges).
python3 project-documents/factory/tools/hc/guide_from_room.py ROOM.png x0 y0 x1 y1 OUT.png
(x0,y0,x1,y1) = box in the room picture from just above the hair to the counter lip, wide enough for both men.
The box is scaled so its top sits at 16% and its bottom (the lip) at 50% of a 1024x1536 phone guide, centred; cyan elsewhere."""
import sys, json
from PIL import Image
W, H = 1024, 1536
TOP, LIP = round(H * 0.16), round(H * 0.50)
room = Image.open(sys.argv[1]).convert("RGB")
x0, y0, x1, y1 = map(int, sys.argv[2:6])
s = (LIP - TOP) / (y1 - y0)
part = room.crop((x0, y0, x1, y1)).resize((round((x1 - x0) * s), LIP - TOP), Image.LANCZOS)
c = Image.new("RGB", (W, H), (0, 255, 255))
px = (W - part.width) // 2
c.paste(part, (px, TOP))
c.save(sys.argv[6])
json.dump({"src_box": [x0, y0, x1, y1], "scale": s, "at": [px, TOP], "top": TOP, "lip": LIP}, open(sys.argv[6].replace(".png", ".json"), "w"), indent=1)
print("scale", round(s, 3), "width", part.width, "x", px, "inside phone crop:", px >= 80 and px + part.width <= 944)
