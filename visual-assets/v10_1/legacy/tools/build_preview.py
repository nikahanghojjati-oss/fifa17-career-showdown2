# Builds preview.html for Legacy.
# Run from visual-assets/v10_1/legacy after MAKE_ASSETS.md has generated the overlays.
from pathlib import Path
import html
import sys

commit = sys.argv[1] if len(sys.argv) > 1 else "working tree"

sections = []
for number in range(1, 10):
    frame = "LG%d" % number
    sections.append(
        '<section><h2>%s</h2><iframe title="%s preview" src="index.html?frame=%s"></iframe></section>'
        % (frame, frame, frame)
    )

page = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Legacy Build Preview</title>
<style>
html,body{margin:0;background:#0b0d10;color:#e9dfc8;font:15px/1.5 system-ui,sans-serif}
body{padding:20px}
main{max-width:1366px;margin:auto}
h1{color:#f2c45b}
h2{margin:22px 0 8px;color:#f2c45b}
iframe{display:block;width:100%;aspect-ratio:1366/768;border:1px solid rgba(242,196,91,.35);background:#000}
.meta{color:#a8987a}
</style>
</head>
<body>
<main>
<h1>Legacy · History</h1>
<p class="meta">Build __COMMIT__ · factory/v1-wtt5ye · desktop review frames LG1 through LG9</p>
__SECTIONS__
</main>
</body>
</html>
"""

page = page.replace("__COMMIT__", html.escape(commit))
page = page.replace("__SECTIONS__", "\n".join(sections))
Path("preview.html").write_text(page)
print("wrote preview.html", len(page))
