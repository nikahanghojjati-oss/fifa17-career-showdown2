# Builds the single-file review page for the claude.ai artifact viewer (no iframes, no
# same-origin scripts/fonts: CSS+JS+JSON inlined, fonts from Google Fonts, plate as files).
# Usage: python3 tools/build_preview.py <wrapper_template.html> <out.html>
import json, re, sys
tpl, out = sys.argv[1], sys.argv[2]
js = open('plate.js').read(); css = open('plate.css').read()
fx = json.load(open('fixtures.json')); pm = json.load(open('platemap.json'))
css = re.sub(r'@font-face[^\n]*\n', '', css)
css = css.replace('html, body { margin: 0; height: 100%; background: #070604; color: var(--cream); }\n', '')
css = css.replace('body { overflow: hidden; font-family: var(--text); -webkit-font-smoothing: antialiased; }\n', '')
css = css.replace('.stage { position: fixed; inset: 0; overflow: hidden; --footer-h: 36px; }',
  '.stage { position: absolute; left: 0; top: 0; width: 1366px; height: 768px; overflow: hidden; --footer-h: 36px; font-family: var(--text); color: var(--cream); background: #070604; -webkit-font-smoothing: antialiased; transform-origin: 0 0; }')
css = css.replace(':root {\n  --gold:', '.stage {\n  --gold:', 1)
start = js.index('  function main() {'); end = js.index('  main();\n})();')
render = '''  var FX = %s, MAP = %s;
  function render(frameId) {
    var fx = FX, map = MAP, S = fx.strings, cfg = fx.frames[frameId];
    var stage = document.getElementById("stage-root");
    stage.innerHTML = ""; stage.dataset.frame = frameId;
    var world = el("div", { class: "world" });
    var pic = el("picture", { class: "plate" });
    var base = "assets/ENV_TR2_PLATE_G_LOCKED_V1_";
    pic.appendChild(el("source", { type: "image/webp", srcset: base + "1672.webp 1672w, " + base + "3344.webp 3344w", sizes: "100vw" }));
    var img = el("img", { src: base + "1672.webp", alt: "Transfer War plate: Daniel and Nik at the war table", decoding: "async" });
    pic.appendChild(img); world.appendChild(pic);
    if (!cfg.plateOnly) {
      var nik = cfg.viewer === "playerTwo";
      world.appendChild(buildSign(map, S));
      if (nik) { world.appendChild(buildSealedPanel(map.panels.B, fx.managers.playerOne, S, "B")); world.appendChild(buildOwnPanel(map.panels.A, true, S)); }
      else { world.appendChild(buildOwnPanel(map.panels.B, false, S)); world.appendChild(buildSealedPanel(map.panels.A, fx.managers.playerTwo, S, "A")); }
      world.appendChild(buildRulesCard(map.panels.C, S));
      world.appendChild(buildYouChip(map, nik, S));
      world.appendChild(buildFingertip(map));
    }
    stage.appendChild(world);
    if (!cfg.plateOnly) stage.appendChild(buildFooter(S, 1));
    layout(stage, world, img, map);
    pic.querySelector("source").sizes = img.sizes;
  }
  window.__renderFrame = render;
''' % (json.dumps(fx), json.dumps(pm))
js = js[:start] + render + js[end:].replace('  main();\n', '')
html = open(tpl).read().replace('/*__PLATE_CSS__*/', css).replace('/*__PLATE_JS__*/', js)
open(out, 'w').write(html)
print('wrote', out, len(html))
