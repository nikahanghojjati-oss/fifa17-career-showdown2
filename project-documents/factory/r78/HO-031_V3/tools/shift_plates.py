# HO-031 v3 Standings and Rivalry plates: the smallest change that clears the settings corner. The whole V2 plate content
# moves down by d px (both managers, background, everything, unscaled); the plate's own top band (stadium roof and
# lights, above both heads) is stretched vertically from `band` rows to band + d rows to fill the top. The bottom d rows
# of the V2 plate leave the frame. Nothing is cut out, painted or generated.
# Usage: python3 shift_plates.py <plates-v2 dir> <out dir>
import sys, os, json, numpy as np, cv2
from PIL import Image
P2, OUT = sys.argv[1], sys.argv[2]
MOVES = {'STANDINGS': (35, 64), 'RIVALRY': (19, 70)}
os.makedirs(OUT, exist_ok=True); log = {}
for key, (d, band) in MOVES.items():
    a = np.asarray(Image.open(f'{P2}/ENV_{key}_PHONE_V2.webp').convert('RGB')).astype(np.float32) / 255.0
    H, W = a.shape[:2]
    out = np.empty_like(a); out[d:] = a[:H - d]
    ys = np.linspace(0, band - 1, band + d).astype(np.float32)
    mx = np.repeat(np.arange(W, dtype=np.float32)[None], band + d, 0); my = np.repeat(ys[:, None], W, 1)
    out[:band + d] = cv2.remap(a, mx, my, cv2.INTER_CUBIC, borderMode=cv2.BORDER_REFLECT)
    u8 = (np.clip(out, 0, 1) * 255 + 0.5).astype(np.uint8)
    Image.fromarray(u8).save(f'{OUT}/ENV_{key}_PHONE_V3.png')
    Image.fromarray(u8).save(f'{OUT}/ENV_{key}_PHONE_V3.webp', quality=88, method=6)
    log[key] = {'whole_shift_down_px': d, 'top_stretch_rows': [band, band + d]}
json.dump(log, open(f'{OUT}/transforms_STANDINGS_RIVALRY.json', 'w'), indent=1)
print(log)
