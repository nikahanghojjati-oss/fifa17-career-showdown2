#!/usr/bin/env python3
from pathlib import Path

HERE = Path(__file__).resolve().parents[1]
frames = ["TR1","TR2","TR3","TR4","TR5","TR6","TR7"]
links = "".join(f'<button data-frame="{f}">{f}</button>' for f in frames)
out = f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Trophy Room preview</title><style>html,body{{margin:0;height:100%;background:#0a0b0d;color:#eee;font:14px system-ui}}.bar{{height:44px;display:flex;align-items:center;gap:6px;padding:0 10px;background:#111;border-bottom:1px solid #473a1d}}button{{background:#1a1a18;color:#ddc987;border:1px solid #62512b;padding:6px 10px;cursor:pointer}}button.on{{background:#d7aa4a;color:#111}}iframe{{display:block;width:100%;height:calc(100% - 45px);border:0}}</style></head><body><div class="bar">{links}</div><iframe id="view" title="Trophy Room frame" src="index.html?frame=TR1"></iframe><script>const v=document.getElementById('view');function go(f){{v.src='index.html?frame='+f;document.querySelectorAll('button').forEach(b=>b.classList.toggle('on',b.dataset.frame===f));}}document.querySelectorAll('button').forEach(b=>b.onclick=()=>go(b.dataset.frame));go('TR1');</script></body></html>'''
(HERE / "preview.html").write_text(out, encoding="utf-8")
print("wrote", HERE / "preview.html")
