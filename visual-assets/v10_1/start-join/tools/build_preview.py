# Builds preview.html: one self-contained desktop review page for Claude intake.
# Shared/own CSS and JS, fixtures, platemap, fonts, plate and generated hand/rim WebPs are inlined.
# Usage (from visual-assets/v10_1/start-join): python3 tools/build_preview.py [commit]
import base64
import html
import json
import re
import sys
from pathlib import Path

screen = Path(__file__).resolve().parents[1]
shared = screen.parent / "shared"
repo = screen.parents[2]
commit = sys.argv[1] if len(sys.argv) > 1 else "working tree"

def data_uri(path, mime):
    path = Path(path)
    payload = base64.b64encode(path.read_bytes()).decode("ascii")
    return f"data:{mime};base64,{payload}"

def inline_fonts(css, base):
    pattern = re.compile(r"url\((['\"]?)([^)'\"]+\.woff2)\1\)")
    def repl(match):
        rel = match.group(2)
        path = (base / rel).resolve()
        if not path.exists():
            return match.group(0)
        return 'url("' + data_uri(path, "font/woff2") + '")'
    return pattern.sub(repl, css)

css_parts = []
for path in [
    shared / "showdown-tokens.css",
    shared / "showdown-type.css",
    shared / "showdown-ui.css",
    shared / "stage.css",
    shared / "motion.css",
    screen / "start-join.css",
]:
    css_parts.append(inline_fonts(path.read_text(), path.parent))
css = "\n".join(css_parts)

stage_js = (shared / "stage.js").read_text()
motion_js = (shared / "motion.js").read_text()
sj_js = (screen / "start-join.js").read_text()
page = (screen / "index.html").read_text()
fixtures = json.loads((screen / "fixtures.json").read_text())
platemap = json.loads((screen / "assets/platemap.json").read_text())

plate_1x = data_uri(screen / "assets/ENV_SJ_PLATE_V1_1X.webp", "image/webp")
plate_2x = data_uri(screen / "assets/ENV_SJ_PLATE_V1_2X.webp", "image/webp")
hand_1x = data_uri(screen / "assets/OVL_SJ_DANIEL_HAND_V1_1X.webp", "image/webp")
hand_2x = data_uri(screen / "assets/OVL_SJ_DANIEL_HAND_V1_2X.webp", "image/webp")
rim_1x = data_uri(screen / "assets/OVL_SJ_DANIEL_HAND_V1_RIM_1X.webp", "image/webp")
rim_2x = data_uri(screen / "assets/OVL_SJ_DANIEL_HAND_V1_RIM_2X.webp", "image/webp")

# Runtime asset paths become embedded data URIs.
sj_js = sj_js.replace('"assets/ENV_SJ_PLATE_V1_1X.webp"', json.dumps(plate_1x))
sj_js = sj_js.replace('"assets/ENV_SJ_PLATE_V1_2X.webp"', json.dumps(plate_2x))
css = css.replace('url("assets/OVL_SJ_DANIEL_HAND_V1_RIM_1X.webp")', 'url("' + rim_1x + '")')
css = css.replace('url("assets/OVL_SJ_DANIEL_HAND_V1_RIM_2X.webp")', 'url("' + rim_2x + '")')

# Remove stylesheet/script links; real code is injected inline below.
page = re.sub(r'<link rel="stylesheet" href="[^"]+">\s*', "", page)
page = page.replace(
    '<source srcset="assets/OVL_SJ_DANIEL_HAND_V1_1X.webp 1x, assets/OVL_SJ_DANIEL_HAND_V1_2X.webp 2x" type="image/webp">',
    '<source srcset="' + hand_1x + ' 1x, ' + hand_2x + ' 2x" type="image/webp">'
)
page = page.replace('src="assets/OVL_SJ_DANIEL_HAND_V1_1X.webp"', 'src="' + hand_1x + '"')
page = re.sub(r'<script src="\.\./shared/stage\.js" defer></script>\s*', "", page)
page = re.sub(r'<script src="\.\./shared/motion\.js" defer></script>\s*', "", page)
page = re.sub(r'<script src="start-join\.js" defer></script>\s*', "", page)

boot = """
<script>
window.__SJ_PREVIEW = true;
const __SJ_FIXTURES = %s;
const __SJ_PLATEMAP = %s;
const __sjNativeFetch = window.fetch.bind(window);
window.fetch = (input, init) => {
  const path = String(input);
  if (path.endsWith("fixtures.json")) {
    return Promise.resolve({ok:true, status:200, json:async()=>structuredClone(__SJ_FIXTURES)});
  }
  if (path.endsWith("assets/platemap.json")) {
    return Promise.resolve({ok:true, status:200, json:async()=>structuredClone(__SJ_PLATEMAP)});
  }
  return __sjNativeFetch(input, init);
};
</script>
<style>%s</style>
<script>%s</script>
<script>%s</script>
<script>%s</script>
""" % (
    json.dumps(fixtures, ensure_ascii=False),
    json.dumps(platemap, ensure_ascii=False),
    css,
    stage_js,
    motion_js,
    sj_js,
)
page = page.replace("</body>", boot + "</body>")
template = json.dumps(page)

out = """<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Start / Join Build Preview</title>
<style>
:root{color-scheme:dark;--ink:#08090b;--deck:#15120b;--gold:#f2c45b;--cream:#eee6d4;--dim:#ab9f86;--hair:rgba(242,196,91,.28)}
html,body{margin:0;background:var(--ink);color:var(--cream)}
body{font:15px/1.45 system-ui,sans-serif;padding:20px 16px 32px}
.wrap{max-width:1366px;margin:0 auto;display:grid;gap:14px}
h1{margin:0;color:var(--gold);font:700 26px/1.1 system-ui,sans-serif;letter-spacing:.05em;text-transform:uppercase}
.sub,.meta{margin:0;color:var(--dim)}
.views{display:flex;flex-wrap:wrap;gap:7px}
.views button{min-height:38px;padding:9px 13px;border:0;border-radius:999px;background:var(--deck);color:var(--cream);box-shadow:inset 0 0 0 1px var(--hair);font:700 12px/1 system-ui,sans-serif;letter-spacing:.08em;cursor:pointer}
.views button[aria-pressed="true"]{background:linear-gradient(180deg,#ffe08f,var(--gold));color:#0b0d10;box-shadow:none}
.views button:focus-visible{outline:2px solid var(--gold);outline-offset:2px}
.screen{position:relative;width:100%;aspect-ratio:1366/768;overflow:hidden;background:#000;border-radius:6px;box-shadow:0 0 0 1px var(--hair)}
.screen iframe{position:absolute;left:0;top:0;width:1366px;height:768px;border:0;transform-origin:0 0}
.meta{font-size:13px}
</style></head><body><div class="wrap">
<header><h1>Start / Join · Desktop</h1><p class="sub">Factory JOB-087 review preview. All eight fixture states use the real registered plate and generated Daniel hand depth layers.</p></header>
<div class="views" role="group" aria-label="Fixture frame">
<button type="button" data-frame="SJ1" aria-pressed="true">SJ1 · empty</button>
<button type="button" data-frame="SJ2" aria-pressed="false">SJ2 · Daniel hosts</button>
<button type="button" data-frame="SJ3" aria-pressed="false">SJ3 · Nik joins</button>
<button type="button" data-frame="SJ4" aria-pressed="false">SJ4 · bad code</button>
<button type="button" data-frame="SJ5" aria-pressed="false">SJ5 · paired</button>
<button type="button" data-frame="SJ6" aria-pressed="false">SJ6 · loading</button>
<button type="button" data-frame="SJ7" aria-pressed="false">SJ7 · partial</button>
<button type="button" data-frame="SJ8" aria-pressed="false">SJ8 · unavailable</button>
</div>
<div class="screen" id="screen"><iframe id="view" title="Start / Join preview"></iframe></div>
<p class="meta">Build __COMMIT__ · factory/v1-wtt5ye</p>
</div>
<script>
const TPL=__TPL__;
let frame="SJ1";
const screen=document.getElementById("screen"),view=document.getElementById("view");
function render(){view.srcdoc=TPL.replace("</head>","<base href='?frame="+frame+"'></head>");fit()}
function fit(){view.style.transform="scale("+(screen.clientWidth/1366)+")"}
document.querySelectorAll("[data-frame]").forEach((b)=>b.onclick=()=>{frame=b.dataset.frame;document.querySelectorAll("[data-frame]").forEach((x)=>x.setAttribute("aria-pressed",String(x===b)));render()});
addEventListener("resize",fit);
render();
</script></body></html>"""
out = out.replace("__TPL__", template.replace("</script>", "<\\/script>"))
out = out.replace("__COMMIT__", html.escape(commit))
(screen / "preview.html").write_text(out)
print("wrote preview.html", len(out))
