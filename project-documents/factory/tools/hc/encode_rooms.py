"""Encode accepted HC V2 rooms to Team G caps. Desktop: rows 100-964 of 1536x1024 -> 1X 1536x864 (<=200 KB), 2X Lanczos 3072x1728 (<=450 KB).
Phone: x 80-944 of 1024x1536 -> 1179x2096 (<=250 KB) + 590W (<=90 KB). Writes set.json with the men cut line (lipY) in each file's pixels."""
import io, json, os
from PIL import Image
R = 'project-documents/factory/reviews/HC/'
OUT = 'project-documents/hc-art/'
ROOMS = {  # room: (desktop file, desktop lip y in 1536x1024, phone file, phone lip y in 1024x1536)
 'board':   ('HC04_BOARD_D_V2_TRY2', 741, 'HC05_BOARD_P_V2_TRY1', 805),
 'tunnel':  ('HC07_TUNNEL_D_V2_TRY1', 898, 'HC08_TUNNEL_P_V2_TRY1', 767),
 'box':     ('HC09_BOX_D_V2_TRY2B_PICK', 752, 'HC10_BOX_P_V2_TRY1', 893),
 'office':  ('HC11_OFFICE_D_V2_TRY2B_PICK', 625, 'HC12_OFFICE_P_V2_TRY1', 562),
 'archive': ('HC13_ARCHIVE_D_V2_TRY1B_PICK', 579, 'HC14_ARCHIVE_P_V2_TRY1B_PICK', 775),
}
def save(img, path, cap):
    for q in range(90, 40, -5):
        b = io.BytesIO(); img.save(b, 'WEBP', quality=q, method=6)
        if b.tell() <= cap * 1024: break
    open(path, 'wb').write(b.getvalue()); return q, round(b.tell() / 1024)
meta = {}
for room, (df, dl, pf, pl) in ROOMS.items():
    d = os.path.join(OUT, room); os.makedirs(d, exist_ok=True); N = room.upper(); m = {}
    one = Image.open(R + df + '.png').convert('RGB').crop((0, 100, 1536, 964))
    m['1X'] = save(one, f'{d}/ENV_{N}_PLATE_HC_V2_1X.webp', 200)
    m['2X'] = save(one.resize((3072, 1728), Image.LANCZOS), f'{d}/ENV_{N}_PLATE_HC_V2_2X.webp', 450)
    m['desktop_lipY_1X'] = dl - 100
    ph = Image.open(R + pf + '.png').convert('RGB').crop((80, 0, 944, 1536)).resize((1179, 2096), Image.LANCZOS)
    m['phone'] = save(ph, f'{d}/ENV_{N}_PHONE_HC_V2.webp', 250)
    m['590W'] = save(ph.resize((590, 1049), Image.LANCZOS), f'{d}/ENV_{N}_PHONE_HC_V2_590W.webp', 90)
    py = round(pl * 2096 / 1536); m['phone_lipY'] = py
    if room == 'box':  # 9:20 tall copy: stretch the calm plinth front below the lip
        top = ph.crop((0, 0, 1179, py + 6)); bot = ph.crop((0, py + 6, 1179, 2096)).resize((1179, 2620 - py - 6), Image.LANCZOS)
        t = Image.new('RGB', (1179, 2620)); t.paste(top, (0, 0)); t.paste(bot, (0, py + 6))
        m['tall'] = save(t, f'{d}/ENV_{N}_PHONE_HC_V2_TALL.webp', 250)
    meta[room] = m; print(room, m)
json.dump(meta, open(OUT + 'rooms_v2_set.json', 'w'), indent=1)
