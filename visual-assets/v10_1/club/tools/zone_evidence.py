# Intake-zone cover evidence: left = plate only with the intake remove zones (magenta) and protected
# boxes (cyan faces, yellow packs); right = the built frame with every zone-edge segment that is still
# visible after the covers/chrome drawn in red (from evidence/qa_report.json "zones").
# Usage (from the club folder, after render-qa): python3 tools/zone_evidence.py
import json
from PIL import Image, ImageDraw
rep = json.load(open('evidence/qa_report.json'))
pm = json.load(open('assets/platemap.json'))
for frame in ['CL1', 'CL6']:
    shot = next(s for s in rep['shots'] if s['shot'] == f'{frame}_1366x768.jpg')
    T = shot['T']; k, ox, oy = T['k'], T['offX'], T['offY']
    P = lambda x, y: (ox + x * k, oy + y * k)
    a = Image.open('evidence/S0_1366x768_plate_only.jpg').convert('RGB'); da = ImageDraw.Draw(a)
    b = Image.open(f'evidence/{frame}_1366x768.jpg').convert('RGB'); db = ImageDraw.Draw(b)
    for z in pm['remove_rects']:
        da.rectangle([P(z[0], z[1]), P(z[2], z[3])], outline=(255, 0, 255), width=2)
    for n, r in pm['protected_boxes'].items():
        da.rectangle([P(r[0], r[1]), P(r[2], r[3])], outline=(0, 229, 255) if n.startswith('face') else (255, 212, 0), width=2)
    for zr in shot['zones']:
        for e in zr['edges'].values():
            for sg in e['segments']:
                db.line([P(sg[0], sg[1]), P(sg[2], sg[3])], fill=(255, 40, 40), width=3)
    out = Image.new('RGB', (a.width * 2 + 12, a.height), (20, 20, 20))
    out.paste(a, (0, 0)); out.paste(b, (a.width + 12, 0))
    out.save(f'evidence/ZONES_{frame}_1366x768_side_by_side.jpg', quality=88)
    print('wrote', f'evidence/ZONES_{frame}_1366x768_side_by_side.jpg')
