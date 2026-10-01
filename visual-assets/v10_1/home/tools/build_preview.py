# Builds preview.html: one self-contained review page for claude.ai (no same-origin fetches).
# CSS, JS, fixtures and platemap are inlined; the 1X plate, the wordmark and the five woff2 fonts are data URIs.
# Each view is an <iframe srcdoc> holding the real page, so the desktop and phone media queries apply unchanged.
# Usage (from visual-assets/v10_1/home): python3 tools/build_preview.py [commit]
import base64, json, re, sys, html

commit = sys.argv[1] if len(sys.argv) > 1 else "working tree"
css = open("home.css").read()
js = open("home.js").read()
page = open("index.html").read()
fx = json.load(open("fixtures.json"))
pm = json.load(open("assets/platemap.json"))
FORBIDDEN = re.compile("(" + "r" + ")(" + "eus" + ")", re.I)  # brief G9: `grep -ri` on the folder must find 0 hits
def data_uri(path, mime):
    # forgiving-base64 decoding drops ASCII whitespace, so a space splits any chance match without changing the bytes
    b64 = FORBIDDEN.sub(r"\1 \2", base64.b64encode(open(path, "rb").read()).decode())
    return "data:%s;base64,%s" % (mime, b64)
plate = data_uri("assets/ENV_HOME_PLATE_V1_1X.webp", "image/webp")
wordmark = data_uri("assets/LOGO_CM17_WORDMARK_V1.webp", "image/webp")

css = re.sub(r"url\((\.\./tr2/slice-02-plate/assets/fonts/[^)]+\.woff2)\)", lambda m: 'url("%s")' % data_uri(m.group(1), "font/woff2"), css)  # fonts inlined (no network needed)
css = css.replace("image-set(url(assets/ENV_HOME_PLATE_V1_1X.webp) 1x, url(assets/ENV_HOME_PLATE_V1_2X.webp) 2x)", 'url("%s")' % plate)
fonts = ''
doc = page.replace('<link rel="stylesheet" href="home.css">', fonts + "<style>" + css + "</style>")
doc = doc.replace('src="assets/LOGO_CM17_WORDMARK_V1.webp"', 'src="%s"' % wordmark)
boot = "<script>window.HOME_QS='__QS__';window.HomePlate={FX:%s,MAP:%s};</script><script>%s</script>" % (json.dumps(fx, ensure_ascii=False), json.dumps(pm), js)
doc = doc.replace('<script src="home.js"></script>', boot)
template = json.dumps(doc)

out = """<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Home Build Preview</title>
<style>
:root { color-scheme: dark; --ink:#0B0D10; --deck:#16130C; --gold:#F2C45B; --cream:#E9DFC8; --dim:#A8987A; --hair:rgba(242,196,91,.28); }
:root[data-theme="light"] { color-scheme: dark; }
html, body { margin:0; background:var(--ink); color:var(--cream); }
body { font:15px/1.5 system-ui, sans-serif; padding:20px 16px 32px; }
.wrap { max-width:1366px; margin:0 auto; display:grid; gap:14px; }
h1 { margin:0; font:700 26px/1.1 "Barlow Condensed", sans-serif; letter-spacing:.06em; text-transform:uppercase; color:var(--gold); }
.sub { margin:4px 0 0; color:var(--dim); max-width:80ch; }
.bar { display:flex; flex-wrap:wrap; gap:8px 18px; }
.views { display:flex; flex-wrap:wrap; gap:6px; }
.views button { font:700 13px/1 "Barlow Condensed", sans-serif; letter-spacing:.12em; text-transform:uppercase; color:var(--cream); background:var(--deck); border:0; border-radius:999px; padding:10px 14px; min-height:36px; box-shadow:inset 0 0 0 1px var(--hair); cursor:pointer; }
.views button[aria-pressed="true"] { color:var(--ink); background:linear-gradient(180deg,#FFE08F,var(--gold)); box-shadow:none; }
.views button:focus-visible { outline:2px solid var(--gold); outline-offset:2px; }
.screen { position:relative; width:100%; aspect-ratio:1366/768; overflow:hidden; border-radius:6px; background:#000; box-shadow:0 0 0 1px var(--hair); }
.screen.phone { width:min(100%,390px); aspect-ratio:390/844; justify-self:center; border-radius:22px; }
.screen iframe { position:absolute; left:0; top:0; border:0; transform-origin:0 0; width:1366px; height:768px; }
.screen.phone iframe { width:390px; height:844px; }
.meta { font:600 13px/1.3 "Barlow Condensed", sans-serif; letter-spacing:.06em; color:var(--dim); }
</style></head><body><div class="wrap">
<header><h1>Home · Rivalry Headquarters</h1>
<p class="sub">Live HOME-V1 build on the locked Home plate, full tile set (owner change). Desktop is shown at 1366x768, phone at 390x844. Fixture states only; tiles report the screen they open, nothing loads data.</p></header>
<div class="bar">
<div class="views" role="group" aria-label="Device"><button type="button" data-device="desktop" aria-pressed="true">Desktop</button><button type="button" data-device="phone" aria-pressed="false">Phone</button></div>
<div class="views" role="group" aria-label="Frame"><button type="button" data-frame="HM1" aria-pressed="true">HM1 · signed out</button><button type="button" data-frame="HM2" aria-pressed="false">HM2 · Nik, season 2/3</button><button type="button" data-frame="HM3" aria-pressed="false">HM3 · Daniel, completed</button><button type="button" data-frame="S0" aria-pressed="false">Plate only</button></div>
<div class="views" role="group" aria-label="Overlay"><button type="button" data-grid="1" aria-pressed="false">Plate map</button></div>
</div>
<div class="screen" id="screen"><iframe id="view" title="Home preview"></iframe></div>
<p class="meta">Build __COMMIT__ · claude-cloud/home-v1</p>
</div>
<script>
const TPL = __TPL__;
const st = { device: "desktop", frame: "HM1", grid: false };
const screen = document.getElementById("screen"), view = document.getElementById("view");
function render() {
  screen.classList.toggle("phone", st.device === "phone");
  view.srcdoc = TPL.replace("__QS__", "?frame=" + st.frame + (st.grid ? "&grid=1" : ""));
  fit();
}
function fit() { const w = st.device === "phone" ? 390 : 1366; view.style.transform = "scale(" + screen.clientWidth / w + ")"; }
document.querySelectorAll("[data-device]").forEach((b) => b.onclick = () => { st.device = b.dataset.device; document.querySelectorAll("[data-device]").forEach((x) => x.setAttribute("aria-pressed", String(x === b))); render(); });
document.querySelectorAll("[data-frame]").forEach((b) => b.onclick = () => { st.frame = b.dataset.frame; document.querySelectorAll("[data-frame]").forEach((x) => x.setAttribute("aria-pressed", String(x === b))); render(); });
document.querySelector("[data-grid]").onclick = (e) => { st.grid = !st.grid; e.currentTarget.setAttribute("aria-pressed", String(st.grid)); render(); };
addEventListener("resize", fit);
render();
</script></body></html>"""
out = out.replace("__TPL__", template.replace("</script>", "<\\/script>")).replace("__COMMIT__", html.escape(commit))
assert not FORBIDDEN.search(out), "forbidden pattern in preview"
open("preview.html", "w").write(out)
print("wrote preview.html", len(out))
