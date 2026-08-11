#!/usr/bin/env python3
import base64
import json
import os
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REPO = os.environ.get("GITHUB_REPOSITORY", "nikahanghojjati-oss/fifa17-career-showdown2")
TOKEN = os.environ.get("GITHUB_TOKEN", "")
if not TOKEN:
    raise SystemExit("GITHUB_TOKEN is required")


def replace_exact(text, old, new, label, expected=1):
    count = text.count(old)
    if count != expected:
        raise SystemExit(f"{label}: expected {expected} occurrences, found {count}: {old[:120]!r}")
    return text.replace(old, new)


def create_blob(path, content):
    payload = json.dumps({
        "content": base64.b64encode(content.encode("utf-8")).decode("ascii"),
        "encoding": "base64"
    }).encode("utf-8")
    request = urllib.request.Request(
        f"https://api.github.com/repos/{REPO}/git/blobs",
        data=payload,
        method="POST",
        headers={
            "Authorization": f"Bearer {TOKEN}",
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
            "Content-Type": "application/json",
            "User-Agent": "career-mode-showdown-v102-authority-builder"
        }
    )
    with urllib.request.urlopen(request, timeout=30) as response:
        result = json.load(response)
    sha = result["sha"]
    print(f"V102_BLOB {path} {sha}")
    return sha


outputs = {}

# Home bootstrap: promote shell cache identity only; the behavioral contract remains intact.
path = ".github/workflows/validate-menu-bootstrap.yml"
text = (ROOT / path).read_text(encoding="utf-8")
text = text.replace("1.0.1-r5", "1.0.2-r1")
text = replace_exact(text, r"/^1\.0\.1-r\d+$/", r"/^1\.0\.2-r\d+$/", path)
outputs[path] = text

# Visual immersion: promote to r3 and explicitly protect the desktop clean-anchor / mobile legacy split.
path = ".github/workflows/validate-v1-visual-immersion.yml"
text = (ROOT / path).read_text(encoding="utf-8")
text = text.replace("css/visual-fidelity-r2.css", "css/visual-fidelity-r3.css")
text = text.replace("1.0.1-r5", "1.0.2-r1")
text = text.replace("v1.0.1 · Stable", "v1.0.2 · Stable")
text = text.replace('const APP_VERSION = \"1.0.1\"', 'const APP_VERSION = \"1.0.2\"')
text = text.replace("fresh v1.0.1 r4 cache identity", "fresh v1.0.2 maintenance cache identity")
text = text.replace("sealed at v1.0.1", "sealed at v1.0.2")
text = text.replace("aligned with the r4 runtime revision", "aligned with the v1.0.2 runtime revision")
needle = "assert.ok(visualCss.includes('.menuCoverAthlete.imageLoaded img') && visualCss.includes('opacity:1!important'), 'Loaded Home Reus portrait must render at guaranteed full opacity.');"
insert = needle + "\n          assert.ok(visualCss.includes('clip-path:none'), 'Desktop Reus must use a clean rectangular photo anchor without the rejected head/neck clipping edge.');\n          assert.ok(visualCss.includes('.menuCoverNumber') && visualCss.includes('display:none'), 'Desktop Reus clean-anchor mode must suppress the competing jersey-number overlay.');"
text = replace_exact(text, needle, insert, path)
outputs[path] = text

# Final polish: only the cache authority changes; keep the rest of the accessibility/performance gate verbatim.
path = ".github/workflows/validate-final-polish.yml"
text = (ROOT / path).read_text(encoding="utf-8")
text = replace_exact(text, "assert.strictEqual(revision, '1.0.1-r5', 'The r4 owner-recovery patch must use its fresh cache revision.');", "assert.strictEqual(revision, '1.0.2-r1', 'The v1.0.2 maintenance patch must use its fresh cache revision.');", path)
outputs[path] = text

# Licensed football visuals: replace old frame-percentage authority with clean-anchor structural safety.
path = ".github/workflows/validate-football-visuals.yml"
text = (ROOT / path).read_text(encoding="utf-8")
needle = "assert.ok(data.includes('framing: Object.freeze') && data.includes('mode: \"subject-safe\"'), 'r5 asset data must explicitly own subject-safe framing metadata.');"
insert = needle + "\n          assert.ok(data.includes('treatment: \"clean-anchor\"'), 'James/Rashford/Martial must explicitly own the v1.0.2 clean-anchor treatment.');\n          assert.ok(renderer.includes('panel.dataset.photoTreatment = framing.treatment'), 'Renderer must expose photo-treatment authority to CSS and browser tests.');"
text = replace_exact(text, needle, insert, path)
old_geometry = '''          assert.ok(/\\.footballVisualHeroSetup \\.footballVisualMediaFrame\\{[\\s\\S]*?width:78%;/.test(visualCss), 'James desktop portrait frame must retain the reviewed 78% crop-safe stage.');
          assert.ok(/@media\\(min-width:701px\\) and \\(max-width:1020px\\)\\{[\\s\\S]*?\\.footballVisualHeroSetup \\.footballVisualMediaFrame\\{width:88%;\\}/.test(visualCss), 'James near-breakpoint frame must retain the reviewed 88% crop-safe stage.');
          assert.ok(/data-football-visual-asset="marcus-rashford-man-utd-2017-smart-r5"\\] \\.footballVisualMediaFrame\\{\\s*width:43%;/.test(visualCss), 'Rashford desktop Transfer frame must retain the browser-proven 43% subject-safe stage.');
          assert.ok(/data-football-visual-asset="anthony-martial-man-utd-2016-smart-r5"\\] \\.footballVisualMediaFrame\\{\\s*width:48%;/.test(visualCss), 'Martial desktop Transfer frame must retain the browser-proven 48% subject-safe stage.');
          assert.ok(/@media\\(max-width:700px\\)\\{[\\s\\S]*?marcus-rashford-man-utd-2017-smart-r5[\\s\\S]*?width:52%;[\\s\\S]*?anthony-martial-man-utd-2016-smart-r5[\\s\\S]*?width:56%;/.test(visualCss), 'Mobile Transfer portrait stages must retain the browser-proven 52% Rashford / 56% Martial geometry.');'''
new_geometry = '''          assert.ok(visualCss.includes('[data-photo-treatment="clean-anchor"]'), 'The v1.0.2 clean-anchor CSS layer is missing.');
          assert.ok(/data-photo-treatment="clean-anchor"\\]::before\\{[\\s\\S]*?z-index:0;/.test(visualCss), 'Clean-anchor ambience must remain behind the photograph.');
          assert.ok(/data-photo-treatment="clean-anchor"\\]::after\\{[\\s\\S]*?z-index:1;/.test(visualCss), 'Clean-anchor accent rail must remain behind the photograph.');
          assert.ok(/data-photo-treatment="clean-anchor"\\] \\.footballVisualMediaFrame\\{[\\s\\S]*?z-index:2;/.test(visualCss), 'Clean-anchor photograph must remain above all decorative geometry.');
          assert.ok(/footballVisualHeroSetup\\[data-photo-treatment="clean-anchor"\\] \\.footballVisualMediaFrame\\{\\s*width:66%;/.test(visualCss), 'James desktop clean-anchor photo stage changed unexpectedly.');
          assert.ok(/data-football-visual-asset="marcus-rashford-man-utd-2017-smart-r5"\\] \\.footballVisualMediaFrame\\{\\s*width:34%;/.test(visualCss), 'Rashford desktop clean-anchor photo stage changed unexpectedly.');
          assert.ok(/data-football-visual-asset="anthony-martial-man-utd-2016-smart-r5"\\] \\.footballVisualMediaFrame\\{\\s*width:36%;/.test(visualCss), 'Martial desktop clean-anchor photo stage changed unexpectedly.');
          assert.ok(/@media\\(max-width:560px\\)\\{[\\s\\S]*?\\.footballVisualHeroTransfer\\{[\\s\\S]*?grid-template-columns:1fr;/.test(visualCss), 'Small-phone Transfer visuals must stack clean-anchor players vertically.');'''
text = replace_exact(text, old_geometry, new_geometry, path)
text = text.replace("console.log(`r5 smart-crop licensed visual contracts passed:", "console.log(`v1.0.2 clean-anchor licensed visual contracts passed:")
outputs[path] = text

# Stability contract: visual fidelity stylesheet authority advances; all storage/release contracts remain unchanged.
path = "tests/contracts/stability-contracts.cjs"
text = (ROOT / path).read_text(encoding="utf-8")
text = replace_exact(text, "css/visual-fidelity-r2.css?v=${revision}", "css/visual-fidelity-r3.css?v=${revision}", path)
outputs[path] = text

for path, content in outputs.items():
    create_blob(path, content)

print(f"V102_AUTHORITY_BLOB_COUNT={len(outputs)}")
