# Builds preview.html: one self-contained Season Results review page for Claude.
# Shared/own CSS and JS, fixtures, plate, title, trophy and generated 1X depth assets are inlined.
# Usage (from visual-assets/v10_1/season-results): python3 tools/build_preview.py [commit]
import base64, json, re, sys, html
from pathlib import Path

commit = sys.argv[1] if len(sys.argv) > 1 else "working tree"
root = Path(".")
fx = json.load(open("fixtures.json"))
page = open("index.html").read()
own_js = open("season-results.js").read()
stage_js = open("../shared/stage.js").read()
motion_js = open("../shared/motion.js").read()

css_paths = [
    "../shared/showdown-tokens.css",
    "../shared/showdown-type.css",
    "../shared/showdown-ui.css",
    "../shared/stage.css",
    "../shared/motion.css",
    "season-results.css",
]
css = "\n".join(open(path).read() for path in css_paths)

def data_uri(path, mime):
    payload = base64.b64encode(open(path, "rb").read()).decode()
    return "data:%s;base64,%s" % (mime, payload)

def inline_font(match):
    path = match.group(1)
    return 'url("%s")' % data_uri(path, "font/woff2")

css = re.sub(r'url\(["\']?(\.\./tr2/slice-02-plate/assets/fonts/[^)"\']+\.woff2)["\']?\)', inline_font, css)

assets = {
    "assets/ENV_SR_PLATE_V1_1X.webp": data_uri("assets/ENV_SR_PLATE_V1_1X.webp", "image/webp"),
    "assets/ENV_SR_PLATE_V1_2X.webp": data_uri("assets/ENV_SR_PLATE_V1_1X.webp", "image/webp"),
    "assets/TITLE_SR_V1.webp": data_uri("assets/TITLE_SR_V1.webp", "image/webp"),
    "../shared/trophies/TRO_SHOWDOWN_CHAMPION_V1_512.webp": data_uri("../shared/trophies/TRO_SHOWDOWN_CHAMPION_V1_512.webp", "image/webp"),
}
for stem in [
    "OVL_SR_DANIEL_HAND_V1_1X", "OVL_SR_DANIEL_HAND_V1_2X",
    "OVL_SR_DANIEL_HAND_V1_RIM_1X", "OVL_SR_DANIEL_HAND_V1_RIM_2X",
    "OVL_SR_NIK_HAND_V1_1X", "OVL_SR_NIK_HAND_V1_2X",
    "OVL_SR_NIK_HAND_V1_RIM_1X", "OVL_SR_NIK_HAND_V1_RIM_2X",
]:
    runtime = "assets/%s.webp" % stem
    source = runtime if Path(runtime).exists() else runtime.replace("_2X.webp", "_1X.webp")
    assets[runtime] = data_uri(source, "image/webp")

for href in css_paths:
    page = page.replace('<link rel="stylesheet" href="%s">' % href, "")
page = page.replace("</head>", "<style>" + css + "</style></head>")
for src, uri in assets.items():
    page = page.replace(src, uri)
    own_js = own_js.replace(src, uri)

fetch_block = '''    const response = await fetch("fixtures.json", { cache: "no-store" });
    if (!response.ok) throw new Error("fixtures.json could not be loaded");
    const fixtures = await response.json();'''
own_js = own_js.replace(fetch_block, "    const fixtures = window.__SEASON_FIXTURES;")

boot = "<script>window.__SEASON_FIXTURES=%s;</script>" % json.dumps(fx, ensure_ascii=False)
boot += "<script>%s</script>" % stage_js.replace("</script>", "<\\/script>")
boot += "<script>%s</script>" % motion_js.replace("</script>", "<\\/script>")
boot += "<script>%s</script>" % own_js.replace("</script>", "<\\/script>")
page = page.replace('<script src="../shared/stage.js" defer></script>', "")
page = page.replace('<script src="../shared/motion.js" defer></script>', "")
page = page.replace('<script src="season-results.js" defer></script>', boot)
template = json.dumps(page)

frames = "".join(
    '<button type="button" data-frame="SR%d" aria-pressed="%s">SR%d</button>' %
    (i, "true" if i == 1 else "false", i)
    for i in range(1, 11)
)

out = """<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Season Results Build Preview</title>
<style>
html,body{margin:0;background:#08090b;color:#e9dfc8}body{font:15px/1.45 system-ui,sans-serif;padding:18px}.wrap{max-width:1366px;margin:auto;display:grid;gap:12px}
h1{margin:0;color:#f2c45b;font-size:26px;text-transform:uppercase}.sub,.meta{color:#a8987a}.views{display:flex;flex-wrap:wrap;gap:6px}
.views button{min-width:48px;min-height:36px;border:1px solid rgba(242,196,91,.3);border-radius:999px;background:#16130c;color:#e9dfc8;font-weight:700;cursor:pointer}
.views button[aria-pressed="true"]{background:#f2c45b;color:#08090b}.screen{position:relative;width:100%;aspect-ratio:1366/768;overflow:hidden;background:#000;border:1px solid rgba(242,196,91,.25)}
.screen iframe{position:absolute;inset:0;border:0;width:1366px;height:768px;transform-origin:0 0}
</style></head><body><div class="wrap">
<header><h1>Season Results · desktop build</h1><p class="sub">SR1–SR10 committed fixture states on the locked Season Results plate.</p></header>
<div class="views" role="group" aria-label="Frame">__FRAMES__</div>
<div class="screen" id="screen"><iframe id="view" title="Season Results preview"></iframe></div>
<p class="meta">Build __COMMIT__ · Job 77</p>
</div><script>
const TPL=__TPL__;const screen=document.getElementById("screen"),view=document.getElementById("view");let frame="SR1";
function fit(){view.style.transform="scale("+screen.clientWidth/1366+")"}
function render(){view.srcdoc=TPL.replace("</body>","<script>history.replaceState(null,'','?frame="+frame+"')<\\/script></body>");fit()}
document.querySelectorAll("[data-frame]").forEach(b=>b.onclick=()=>{frame=b.dataset.frame;document.querySelectorAll("[data-frame]").forEach(x=>x.setAttribute("aria-pressed",String(x===b)));render()});
addEventListener("resize",fit);render();
</script></body></html>"""
out = out.replace("__FRAMES__", frames).replace("__TPL__", template.replace("</script>", "<\\/script>")).replace("__COMMIT__", html.escape(commit))
open("preview.html", "w").write(out)
print("wrote preview.html", len(out))
