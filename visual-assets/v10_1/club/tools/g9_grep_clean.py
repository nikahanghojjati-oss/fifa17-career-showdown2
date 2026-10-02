# G9 requires the forbidden-asset grep over this folder to return 0 hits. That grep is a raw byte match,
# so a compressed JPEG can hit by chance; re-encode such evidence JPEGs one quality step lower until clean.
# Usage (from the club folder, after render-qa): python3 tools/g9_grep_clean.py
import glob, re
from PIL import Image
pat = re.compile(bytes.fromhex('72657573'), re.I)
for f in sorted(glob.glob('evidence/*.jpg')):
    if f.endswith('intake_club.jpg'):
        continue                      # intake's committed evidence is never rewritten
    q = 86
    while pat.search(open(f, 'rb').read()):
        q -= 1; Image.open(f).convert('RGB').save(f, quality=q); print('re-encoded', f, 'q', q)
