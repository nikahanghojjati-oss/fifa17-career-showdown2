# Builds preview.html for Claude review. Run from visual-assets/v10_1/rule-book.
# It inlines Rule Book/shared CSS + JS, fixtures, fonts and the committed WebP display assets.
# Usage: python3 tools/build_preview.py [commit]
from pathlib import Path
import base64, html, json, mimetypes, re, sys

ROOT = Path(__file__).resolve().parents[1]
COMMIT = sys.argv[1] if len(sys.argv) > 1 else "working tree"

def data_uri(path):
    path = Path(path)
    mime = mimetypes.guess_type(path.name)[0] or "application/octet-stream"
    return "data:%s;base64,%s" % (
        mime,
        base64.b64encode(path.read_bytes()).decode("ascii"),
    )

def inline_css(rel):
    path = (ROOT / rel).resolve()
    css = path.read_text()
    def repl(match):
        raw = match.group(1).strip().strip("'\"")
        if raw.startswith(("data:", "http:", "https:", "#")):
            return match.group(0)
        asset = (path.parent / raw).resolve()
        if asset.exists() and asset.is_file():
            return 'url("%s")' % data_uri(asset)
        return match.group(0)
    return re.sub(r"url\\(([^)]+)\\)", repl, css)

page = (ROOT / "index.html").read_text()
fixtures = json.loads((ROOT / "fixtures.json").read_text())

def css_link(match):
    href = match.group(1)
    return "<style>\n%s\n</style>" % inline_css(href)

page = re.sub(
    r'<link rel="stylesheet" href="([^"]+)">',
    css_link,
    page,
)

shared_scripts = {
    "../shared/stage.js": (ROOT / "../shared/stage.js").resolve().read_text(),
    "../shared/motion.js": (ROOT / "../shared/motion.js").resolve().read_text(),
}
for src, source in shared_scripts.items():
    page = page.replace(
        '<script src="%s" defer></script>' % src,
        "<script>\n%s\n</script>" % source,
    )

screen_js = (ROOT / "rule-book.js").read_text()
screen_js = screen_js.replace(
    "const qs = new URLSearchParams(location.search);",
    "const qs = new URLSearchParams(window.RULE_BOOK_QS || location.search);",
)
screen_js = re.sub(
    r'async function loadFixtures\\(\\) \\{.*?\\n  \\}',
    "async function loadFixtures() { return window.RULE_BOOK_FIXTURES; }",
    screen_js,
    count=1,
    flags=re.S,
)
boot = (
    "<script>window.RULE_BOOK_QS='?frame=__FRAME__';"
    "window.RULE_BOOK_FIXTURES=%s;</script>" %
    json.dumps(fixtures, ensure_ascii=False)
)
page = page.replace(
    '<script src="rule-book.js" defer></script>',
    boot + "<script>\n" + screen_js + "\n</script>",
)

asset_refs = [
    "../shared/plates/ENV_SYS_PLATE_V1_1X.webp",
    "../shared/plates/ENV_SYS_PLATE_V1_2X.webp",
    "../shared/plates/ENV_SYS_PHONE_V1.webp",
    "../shared/wordmarks/TITLE_RULE_BOOK_V1.webp",
]
for rel in asset_refs:
    path = (ROOT / rel).resolve()
    if path.exists():
        page = page.replace(rel, data_uri(path))

template = json.dumps(page).replace("</script>", "<\\/script>")
out = """<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Rule Book Build Preview</title>
<style>
html,body{margin:0;background:#090a0c;color:#e9dfc8;font:15px/1.45 system-ui,sans-serif}
body{padding:18px}.wrap{max-width:1366px;margin:auto;display:grid;gap:12px}
h1{margin:0;color:#f2c45b;font-size:25px}.meta{color:#a8987a}
.controls{display:flex;gap:8px;flex-wrap:wrap}
button{min-height:40px;padding:9px 13px;border:1px solid rgba(242,196,91,.35);
background:#17140d;color:#e9dfc8;border-radius:999px;font-weight:700;cursor:pointer}
button[aria-pressed="true"]{background:#f2c45b;color:#090a0c}
.screen{position:relative;width:100%;aspect-ratio:1366/768;overflow:hidden;background:#000}
.screen.phone{width:min(100%,393px);height:660px;aspect-ratio:auto;justify-self:center}
iframe{position:absolute;inset:0;border:0;transform-origin:0 0;width:1366px;height:768px}
.phone iframe{width:393px;height:660px}
</style></head><body><div class="wrap">
<header><h1>Rule Book · Build Preview</h1>
<div class="meta">Build __COMMIT__ · RB1/RB2 · desktop 1366×768 · phone 393×660</div></header>
<div class="controls">
<button data-frame="RB1" aria-pressed="true">RB1</button>
<button data-frame="RB2" aria-pressed="false">RB2 long section</button>
<button data-device="desktop" aria-pressed="true">Desktop</button>
<button data-device="phone" aria-pressed="false">Phone</button>
</div>
<div class="screen" id="screen"><iframe id="view" title="Rule Book preview"></iframe></div>
</div><script>
const TPL=__TPL__;
const st={frame:"RB1",device:"desktop"};
const screen=document.getElementById("screen"),view=document.getElementById("view");
function fit(){const w=st.device==="phone"?393:1366;view.style.transform="scale("+screen.clientWidth/w+")"}
function render(){screen.classList.toggle("phone",st.device==="phone");view.srcdoc=TPL.replace("__FRAME__",st.frame);fit()}
document.querySelectorAll("[data-frame]").forEach(b=>b.onclick=()=>{st.frame=b.dataset.frame;document.querySelectorAll("[data-frame]").forEach(x=>x.setAttribute("aria-pressed",String(x===b)));render()});
document.querySelectorAll("[data-device]").forEach(b=>b.onclick=()=>{st.device=b.dataset.device;document.querySelectorAll("[data-device]").forEach(x=>x.setAttribute("aria-pressed",String(x===b)));render()});
addEventListener("resize",fit);render();
</script></body></html>"""
out = out.replace("__TPL__", template).replace("__COMMIT__", html.escape(COMMIT))
(ROOT / "preview.html").write_text(out)
print("wrote preview.html", len(out))
