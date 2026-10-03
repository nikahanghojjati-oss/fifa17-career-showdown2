#!/usr/bin/env python3
import json, pathlib, sys
root=pathlib.Path(__file__).resolve().parents[1]
out=root/"preview.html"
commit=sys.argv[1] if len(sys.argv)>1 else "working tree"
html=(root/"index.html").read_text()
css=(root/"rivalry-statistics.css").read_text()
js=(root/"rivalry-statistics.js").read_text()
fx=json.loads((root/"fixtures.json").read_text())
html=html.replace('<link rel="stylesheet" href="rivalry-statistics.css">',f"<style>{css}</style>")
html=html.replace('<script src="rivalry-statistics.js"></script>',f"<script>window.RIVALRY_BOOT={{fixtures:{json.dumps(fx)}}};</script><script>{js}</script>")
out.write_text(html)
print(f"wrote {out} · {commit}")