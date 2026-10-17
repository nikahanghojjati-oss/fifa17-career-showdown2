# Builds preview.html: one self-contained file for the claude.ai review page (C9.3).
# Inlines club.css, club.js, js/visualIdentity.js, fixtures/platemap/handmap JSON, the fonts, and the
# 1X plate as a data URI. A small frame bar switches CL1..CL6 (and the rip strip times) via the URL hash.
# Usage (from the club folder): python3 tools/build_preview.py [commit]
import base64, json, re, sys
commit = sys.argv[1] if len(sys.argv) > 1 else 'working tree'
b64 = lambda p: base64.b64encode(open(p, 'rb').read()).decode()
css = open('club.css').read()
css = re.sub(r'url\((\.\./tr2/slice-02-plate/assets/fonts/[^)]+\.woff2)\)', lambda m: 'url(data:font/woff2;base64,%s)' % b64(m.group(1)), css)
css = css.replace('image-set(url(assets/ENV_CLUB_PLATE_V1_1X.webp) 1x, url(assets/ENV_CLUB_PLATE_V1_2X.webp) 2x)',
                  'url(data:image/webp;base64,%s)' % b64('assets/ENV_CLUB_PLATE_V1_1X.webp'))
assert 'data:image/webp' in css
js = open('club.js').read()
vi = open('../../../js/visualIdentity.js').read()
inline = 'window.CLUB_INLINE = { FX: %s, MAP: %s, HANDS: %s };' % (open('fixtures.json').read(), open('assets/platemap.json').read(), open('assets/handmap.json').read())
html = open('index.html').read()
html = html.replace('<link rel="stylesheet" href="club.css">', '<style>\n%s\n</style>' % css)
bar = ('<nav id="pvBar" style="position:fixed;right:8px;bottom:34px;z-index:50;display:flex;gap:4px;font:600 12px/1 sans-serif">'
       + ''.join('<a href="#%s" onclick="setTimeout(()=>location.reload())" style="padding:6px 8px;background:#111;color:#F2C45B;border:1px solid #6b5628;text-decoration:none">%s</a>' % (f, f) for f in ['CL1','CL2','CL3','CL4','CL5','CL6'])
       + '<span style="padding:6px 8px;background:#111;color:#9A8F7A">%s</span></nav>' % commit)
html = html.replace('<script src="../../../js/visualIdentity.js"></script>\n<script src="club.js"></script>',
                    '<script>\n%s\n</script>\n<script>\n%s\n</script>\n<script>\n%s\n</script>\n%s' % (vi, inline, js, bar))
assert '../../../js' not in html and 'club.js"' not in html
open('preview.html', 'w').write(html)
print('wrote preview.html', len(html))
