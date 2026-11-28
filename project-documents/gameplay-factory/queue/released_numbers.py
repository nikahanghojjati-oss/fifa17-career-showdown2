#!/usr/bin/env python3
"""Rewrites the 'released studies' block of TOMORROW.md from PICTURES.json (approved pictures -> study item numbers)."""
import json, pathlib, re
Q = pathlib.Path(__file__).resolve().parent
o = json.loads((Q / "ORDER.json").read_text())["items"]
p = json.loads((Q / "PICTURES.json").read_text())
lines = []
for stage, kind, label in ((4, "PHONE", "phone"), (5, "NEXT", "desktop")):
    for sid, key in p["keys"].items():
        if key in p["approved"].get(kind, []):
            ns = sorted(int(k) for k, v in o.items() if v["mode"] == "study" and v["stage"] == stage and v["screen"] == sid)
            if ns: lines.append((f"{key.replace('_', ' ').title()} {label} studies", ns))
block = "<!-- released:start -->\n" + "".join(f"{t}:\n\n```text\n{' '.join(map(str, ns))}\n```\n\n" for t, ns in lines) + "<!-- released:end -->"
f = Q / "TOMORROW.md"; t = f.read_text()
if "<!-- released:start -->" in t:
    t = re.sub(r"<!-- released:start -->.*?<!-- released:end -->", block, t, flags=re.S)
else:
    t = re.sub(r"Home phone studies, released.*?(?=\nStudies \(phone)", block + "\n", t, flags=re.S)
f.write_text(t); pathlib.Path("/mnt/project-files/mega-factory/TOMORROW.md").write_text(t) if pathlib.Path("/mnt/project-files/mega-factory").exists() else None
print(block)
