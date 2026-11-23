#!/usr/bin/env python3
"""Re-pin the clubhouse theme plates in tests/contracts/v10-foundation-contracts.cjs (F9c) after build.py: the block between the
R99-01 markers is rewritten with each file's sha256."""
import hashlib, os, re
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
T = os.path.join(ROOT, "tests", "contracts", "v10-foundation-contracts.cjs")
lines = []
for theme in ("silver", "black"):
    d = os.path.join(ROOT, "visual-assets", "v10_1", "plates-hc", theme)
    for f in sorted(os.listdir(d)):
        rel = f"visual-assets/v10_1/plates-hc/{theme}/{f}"
        h = hashlib.sha256(open(os.path.join(ROOT, rel), "rb").read()).hexdigest()
        lines.append(f'    "{rel}":"{h}",')
START = "    // R99-01 clubhouse themes (Nik 2026-11-23): the Silver and Black Metal copies of the rooms (tools/clubhouse-themes/build.py).\n"
END = "    // R99-01 end\n"
s = open(T).read()
block = START + "\n".join(lines) + "\n" + END
if START in s:
    s = re.sub(re.escape(START) + r".*?" + re.escape(END), lambda m: block, s, flags=re.S)
else:
    anchor = re.search(r'    "visual-assets/v10_1/plates-hc/TILE_SLAB_HC_V1_512\.webp":"[0-9a-f]+",\n', s)
    s = s[: anchor.end()] + block + s[anchor.end():]
open(T, "w").write(s)
print("pinned", len(lines))
