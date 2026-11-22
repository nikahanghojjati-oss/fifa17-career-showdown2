#!/usr/bin/env python3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
frames = "".join(f'<button data-f="SD{i}">SD{i}</button>' for i in range(1, 10))
html = f'''<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Standings Preview</title><style>html,body{{margin:0;background:#07080a;color:#eee;font:14px system-ui}}header{{padding:10px 14px;display:flex;gap:8px;align-items:center;flex-wrap:wrap}}button{{padding:8px 12px;background:#17130c;color:#f2c45b;border:1px solid #8a6a12;cursor:pointer}}button:focus-visible{{outline:2px solid #ffd34d;outline-offset:2px}}iframe{{display:block;width:100vw;height:calc(100vh - 58px);border:0;background:#000}}</style></head><body><header><b>JOB-127 · Standings</b>{frames}</header><iframe id="v" src="index.html?frame=SD1" title="Standings build"></iframe><script>const v=document.getElementById('v');document.querySelectorAll('button').forEach(b=>b.onclick=()=>v.src='index.html?frame='+b.dataset.f)</script></body></html>'''
(ROOT / "preview.html").write_text(html)
print("wrote preview.html")
