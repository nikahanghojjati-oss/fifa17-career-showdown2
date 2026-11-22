# Builds the single-file review page for the claude.ai artifact viewer (no iframes, no
# same-origin fetches: CSS+JS+JSON inlined, fonts from Google Fonts, images as published files).
# The portrait @media block is re-scoped to `.stage.pv-mobile` so the phone layout can be shown
# inside a 390x844 box on any screen.
# Usage: python3 tools/build_preview.py tools/preview_template.html <out.html> [commit]
import json, re, sys

tpl, out = sys.argv[1], sys.argv[2]
commit = sys.argv[3] if len(sys.argv) > 3 else "working tree"
js = open('plate.js').read(); css = open('plate.css').read()
fx = json.load(open('fixtures.json')); pm = json.load(open('platemap.json'))

css = re.sub(r'@font-face[^\n]*\n', '', css)
css = css.replace('html, body { margin: 0; height: 100%; background: #070604; color: var(--cream); }\n', '')
css = css.replace('body { overflow: hidden; font-family: var(--text); -webkit-font-smoothing: antialiased; }\n', '')
css = css.replace('.stage { position: fixed; inset: 0; overflow: hidden; --footer-h: 36px; }',
  '.stage { position: absolute; left: 0; top: 0; width: 1366px; height: 768px; overflow: hidden; --footer-h: 36px; font-family: var(--text); color: var(--cream); background: #070604; -webkit-font-smoothing: antialiased; }\n'
  '.stage.pv-mobile { width: 390px; height: 664px; }')
css = css.replace(':root {\n  --gold:', '.stage {\n  --gold:', 1)

# re-scope the portrait media block
MQ = '@media (max-width: 760px) and (orientation: portrait) {'
i = css.index(MQ); depth = 0; j = i + len(MQ) - 1
while True:
    ch = css[j]
    if ch == '{': depth += 1
    elif ch == '}':
        depth -= 1
        if depth == 0: break
    j += 1
inner = css[i + len(MQ): j]
# nested short-phone query (viewport height) does not apply to the fixed 390x664 review box
k = inner.find('@media (max-height: 600px)')
if k >= 0:
    d = 0; e = inner.index('{', k)
    while True:
        if inner[e] == '{': d += 1
        elif inner[e] == '}':
            d -= 1
            if d == 0: break
        e += 1
    inner = inner[:k] + inner[e + 1:]
def scope(m):
    sels = [s.strip() for s in m.group(1).split(',')]
    fixed = []
    for s in sels:
        if s.startswith('.stage'): fixed.append('.stage.pv-mobile' + s[len('.stage'):])
        else: fixed.append('.stage.pv-mobile ' + s)
    return ', '.join(fixed) + ' {'
inner = re.sub(r'(?m)^\s*([^{}\n/][^{}\n]*?)\s*\{', lambda m: '  ' + scope(m), inner)
css = css[:i] + '/* portrait block, scoped for the review page */\n' + inner + css[j + 1:]

js = js.replace('  main();\n})();', '  window.TWPlate.FX = %s; window.TWPlate.MAP = %s;\n})();' % (json.dumps(fx, ensure_ascii=False), json.dumps(pm)))
html = open(tpl).read().replace('/*__PLATE_CSS__*/', css).replace('/*__PLATE_JS__*/', js).replace('__COMMIT__', commit)
open(out, 'w').write(html)
print('wrote', out, len(html))
