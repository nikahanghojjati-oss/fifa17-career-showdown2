# Builds preview.html: one self-contained desktop review page for Claude.
# Run from visual-assets/v10_1/final-winner after MAKE_ASSETS has created the overlay WebPs.
# Usage: python3 tools/build_preview.py [commit]
from pathlib import Path
import base64, html, json, re, sys

SCREEN = Path(__file__).resolve().parent.parent
V10 = SCREEN.parent
SHARED = V10 / "shared"
commit = sys.argv[1] if len(sys.argv) > 1 else "working tree"

MIME = {
    ".webp": "image/webp", ".png": "image/png", ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg", ".svg": "image/svg+xml", ".woff2": "font/woff2"
}

def data_uri(path):
    path = Path(path)
    mime = MIME.get(path.suffix.lower(), "application/octet-stream")
    payload = base64.b64encode(path.read_bytes()).decode("ascii")
    return f"data:{mime};base64,{payload}"

def local_uri(raw, base):
    if raw.startswith(("data:", "http:", "https:", "#")):
        return raw
    path = (base / raw).resolve()
    return data_uri(path) if path.is_file() else raw

def inline_css(path):
    css = path.read_text(encoding="utf-8")
    def repl(match):
        raw = match.group(1).strip().strip("'\"")
        return f'url("{local_uri(raw, path.parent)}")'
    return re.sub(r"url\(([^)]+)\)", repl, css)

page = (SCREEN / "index.html").read_text(encoding="utf-8")
fixtures = json.loads((SCREEN / "fixtures.json").read_text(encoding="utf-8"))

css_files = [
    SHARED / "showdown-tokens.css",
    SHARED / "showdown-type.css",
    SHARED / "showdown-ui.css",
    SHARED / "stage.css",
    SHARED / "motion.css",
    SCREEN / "final-winner.css",
]
css = "\n".join(inline_css(path) for path in css_files)
page = re.sub(r'\s*<link rel="stylesheet" href="[^"]+">\s*', "\n", page)
page = page.replace("</head>", f"<style>\n{css}\n</style>\n</head>")

def repl_src(match):
    raw = match.group(1)
    return f'src="{local_uri(raw, SCREEN)}"'

def repl_srcset(match):
    parts = []
    for item in match.group(1).split(","):
        bits = item.strip().split()
        if not bits:
            continue
        bits[0] = local_uri(bits[0], SCREEN)
        parts.append(" ".join(bits))
    return 'srcset="' + ", ".join(parts) + '"'

page = re.sub(r'srcset="([^"]+)"', repl_srcset, page)
page = re.sub(r'src="([^"]+)"', repl_src, page)
page = re.sub(r'\s*<script src="(?:\.\./shared/(?:stage|motion)\.js|final-winner\.js)"></script>\s*', "\n", page)

stage_js = (SHARED / "stage.js").read_text(encoding="utf-8")
motion_js = (SHARED / "motion.js").read_text(encoding="utf-8")
screen_js = (SCREEN / "final-winner.js").read_text(encoding="utf-8")
screen_js = screen_js.replace(
    "new URLSearchParams(location.search)",
    "new URLSearchParams(window.FINAL_WINNER_QS || location.search)"
)

fixture_json = json.dumps(fixtures, ensure_ascii=False).replace("</", "<\\/")
boot = f"""<script>
window.FINAL_WINNER_QS = "__QS__";
window.__FW_FIXTURES__ = {fixture_json};
const __nativeFetch = window.fetch ? window.fetch.bind(window) : null;
window.fetch = (input, init) => {{
  const url = String(input);
  if (url.endsWith("fixtures.json")) {{
    return Promise.resolve({{ok:true,status:200,json:()=>Promise.resolve(window.__FW_FIXTURES__)}});
  }}
  return __nativeFetch(input, init);
}};
</script>"""

scripts = "\n".join(
    "<script>\n" + source.replace("</script>", "<\\/script>") + "\n</script>"
    for source in (stage_js, motion_js, screen_js)
)
page = page.replace("</body>", boot + "\n" + scripts + "\n</body>")
template = json.dumps(page, ensure_ascii=False).replace("</script>", "<\\/script>")

buttons = "".join(
    f'<button type="button" data-frame="{html.escape(frame_id)}">{html.escape(frame_id)}</button>'
    for frame_id in fixtures["frames"].keys()
)

out = f"""<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Final Winner Build Preview</title>
<style>
html,body{{margin:0;background:#0b0d10;color:#e9dfc8;font:15px/1.4 system-ui,sans-serif}}
body{{padding:18px}} .wrap{{max-width:1366px;margin:auto;display:grid;gap:12px}}
h1{{margin:0;color:#f2c45b;font-size:24px;text-transform:uppercase;letter-spacing:.06em}}
.views{{display:flex;flex-wrap:wrap;gap:6px}} button{{min-height:36px;padding:8px 12px;border:1px solid #6f5b2a;
background:#17140f;color:#e9dfc8;cursor:pointer}} button[aria-pressed="true"]{{background:#f2c45b;color:#0b0d10}}
.screen{{position:relative;width:100%;aspect-ratio:1366/768;overflow:hidden;background:#000}}
iframe{{position:absolute;inset:0;width:1366px;height:768px;border:0;transform-origin:0 0}}
.meta{{margin:0;color:#a8987a;font-size:13px}}
</style></head><body><div class="wrap">
<header><h1>Final Winner · desktop</h1><p class="meta">Fixture review only. Generated assets are inlined after MAKE_ASSETS runs.</p></header>
<div class="views" id="frames">{buttons}</div>
<div class="screen" id="screen"><iframe id="view" title="Final Winner preview"></iframe></div>
<p class="meta">Build {html.escape(commit)} · factory/v1-wtt5ye</p>
</div><script>
const TPL = {template};
const buttons = [...document.querySelectorAll("[data-frame]")];
const screen = document.getElementById("screen");
const view = document.getElementById("view");
let frame = buttons[0] ? buttons[0].dataset.frame : "FW1";
function fit() {{ view.style.transform = "scale(" + screen.clientWidth / 1366 + ")"; }}
function render() {{
  view.srcdoc = TPL.replace("__QS__", "?frame=" + frame);
  buttons.forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.frame === frame)));
  fit();
}}
buttons.forEach((button) => button.addEventListener("click", () => {{ frame = button.dataset.frame; render(); }}));
addEventListener("resize", fit);
render();
</script></body></html>"""

(SCREEN / "preview.html").write_text(out, encoding="utf-8")
print("wrote preview.html", len(out))
