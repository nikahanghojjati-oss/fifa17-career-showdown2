# Builds preview.html: one self-contained review page (C9.3) for the claude.ai viewer.
# CSS, JS (league.js + the merged js/visualIdentity.js), fixtures and platemap are inlined; the 1X plate
# and the 1X finger overlay are data URIs; the project woff2 fonts are embedded as data URIs too. Frame + desktop/phone switches.
# Usage (from visual-assets/v10_1/league): python3 tools/build_preview.py [commit]
import base64, json, re, sys

commit = sys.argv[1] if len(sys.argv) > 1 else "working tree"
uri = lambda p, t: f"data:{t};base64," + base64.b64encode(open(p, "rb").read()).decode()
plate = uri("assets/ENV_LEAGUE_PLATE_V1_1X.webp", "image/webp")
finger = uri("assets/OVL_DANIEL_FINGER_V1_1X.png", "image/png")
css = open("league.css").read()
css = re.sub(r'url\("(\.\./tr2/slice-02-plate/assets/fonts/[^"]+\.woff2)"\)', lambda m: f'url("{uri(m.group(1), "font/woff2")}")', css)
css = re.sub(r"image-set\([^;]*\)", f'url("{plate}")', css)
css = css.replace(".stage { position: fixed; inset: 0;", ".stage { position: absolute; left: 0; top: 0;")
js = open("league.js").read()
vi = open("../../../js/visualIdentity.js").read()
body = open("index.html").read()
body = body[body.index("<svg class=\"vh\""):body.index("<script")]
body = re.sub(r'<img class="finger-ovl"[^>]*>', f'<img class="finger-ovl" alt="" src="{finger}">', body)
fx = json.load(open("fixtures.json")); pm = json.load(open("assets/platemap.json"))

html = f"""<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>League V1 Preview</title>
<style>
{css}
html, body {{ overflow: auto; background: #0b0c0e; }}
.pv-bar {{ position: sticky; top: 0; z-index: 99; display: flex; flex-wrap: wrap; gap: 8px; align-items: center; padding: 10px 16px; background: #111317; border-bottom: 1px solid #2a2d33; font: 600 14px/1 system-ui, sans-serif; color: #ddd; }}
.pv-bar button {{ min-height: 36px; padding: 0 12px; background: #1c1f24; color: #eee; border: 1px solid #3a3e46; border-radius: 6px; cursor: pointer; font: inherit; }}
.pv-bar button[aria-pressed="true"] {{ background: #F2C45B; color: #0B0D10; border-color: #F2C45B; }}
.pv-bar .meta {{ margin-left: auto; color: #9aa; font-weight: 400; font-size: 12px; }}
.pv-wrap {{ position: relative; margin: 16px auto; overflow: hidden; }}
.pv-scale {{ position: absolute; left: 0; top: 0; transform-origin: 0 0; }}
</style></head><body>
<div class="pv-bar" role="toolbar" aria-label="Preview controls">
  <span>Frame</span><button data-f="L1" aria-pressed="true">L1 ready</button><button data-f="L2">L2 spinning</button><button data-f="L3">L3 selected</button><button data-f="L4">L4 locked</button>
  <span style="margin-left:12px">View</span><button data-v="d" aria-pressed="true">Desktop 1366x768</button><button data-v="p">Phone 390x844</button>
  <span class="meta">LEAGUE-V1 · {commit}</span>
</div>
<div class="pv-wrap"><div class="pv-scale">{body}</div></div>
<script>window.LEAGUE_PREVIEW = true; window.LEAGUE_DEFER_MAIN = true; window.LEAGUE_FX = {json.dumps(fx, ensure_ascii=False)}; window.LEAGUE_MAP = {json.dumps(pm)};</script>
<script>{vi}</script>
<script>{js}</script>
<script>
(async () => {{
  const stage = document.getElementById("stage-root"), sc = document.querySelector(".pv-scale"), wrap = document.querySelector(".pv-wrap");
  let view = "d";
  function fit() {{
    const W = view === "d" ? 1366 : 390, H = view === "d" ? 768 : 844;
    sc.style.transform = "none"; stage.style.width = W + "px"; stage.style.height = H + "px";
    window.LeagueV1.layout();
    const s = Math.min(1, (document.documentElement.clientWidth - 32) / W);
    sc.style.transform = `scale(${{s}})`; wrap.style.width = W * s + "px"; wrap.style.height = H * s + "px";
  }}
  await window.LeagueV1.main();
  fit();
  document.querySelectorAll("[data-f]").forEach((b) => b.onclick = () => {{ document.querySelectorAll("[data-f]").forEach((x) => x.setAttribute("aria-pressed", String(x === b))); sc.style.transform = "none"; window.LeagueV1.setFrame(b.dataset.f); fit(); }});
  document.querySelectorAll("[data-v]").forEach((b) => b.onclick = () => {{ document.querySelectorAll("[data-v]").forEach((x) => x.setAttribute("aria-pressed", String(x === b))); view = b.dataset.v; fit(); }});
  addEventListener("resize", fit);
}})();
</script></body></html>
"""
open("preview.html", "w").write(html)
print("wrote preview.html", len(html))
