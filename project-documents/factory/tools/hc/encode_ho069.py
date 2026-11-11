"""HO-069 rooms (hall = Start, coaches = Squad Management) to Team G caps, same rules as encode_rooms.py.
Desktop: 16:9 rows of the 1536x1024 pick -> 1X 1536x864 (<=200 KB), 2X Lanczos 3072x1728 (<=450 KB). Adds to rooms_v2_set.json."""
import io, json, os, sys
from PIL import Image
R = 'project-documents/factory/reviews/HC/'; OUT = 'project-documents/hc-art/'
ROOMS = {'hall': ('HC21_START_D_V2_TRY2', 906, 130), 'coaches': ('HC23_SQUAD_D_TRY1', 640, 100)}  # file, lip y in 1024, top row
def save(img, path, cap):
    for q in range(90, 40, -5):
        b = io.BytesIO(); img.save(b, 'WEBP', quality=q, method=6)
        if b.tell() <= cap * 1024: break
    open(path, 'wb').write(b.getvalue()); return [q, round(b.tell() / 1024)]
meta = json.load(open(OUT + 'rooms_v2_set.json'))
for room, (f, lip, top) in ROOMS.items():
    d = OUT + room; os.makedirs(d, exist_ok=True); N = room.upper(); m = meta.get(room, {})
    one = Image.open(R + f + '.png').convert('RGB').crop((0, top, 1536, top + 864))
    m['1X'] = save(one, f'{d}/ENV_{N}_PLATE_HC_V2_1X.webp', 200)
    m['2X'] = save(one.resize((3072, 1728), Image.LANCZOS), f'{d}/ENV_{N}_PLATE_HC_V2_2X.webp', 450)
    m['desktop_lipY_1X'] = lip - top; meta[room] = m; print(room, m)
json.dump(meta, open(OUT + 'rooms_v2_set.json', 'w'), indent=1)
