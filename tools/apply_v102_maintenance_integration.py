#!/usr/bin/env python3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def replace_exact(path, old, new, expected=1):
    target = ROOT / path
    text = target.read_text(encoding="utf-8")
    count = text.count(old)
    if count != expected:
        raise SystemExit(f"{path}: expected {expected} occurrences, found {count}\nOLD={old[:160]!r}")
    target.write_text(text.replace(old, new), encoding="utf-8")
    print(f"updated {path}: {count} exact replacement(s)")


def replace_runtime_revision():
    candidates = [ROOT / "index.html"] + sorted((ROOT / "js").glob("*.js")) + sorted((ROOT / "data").glob("*.js"))
    changed = []
    for target in candidates:
        text = target.read_text(encoding="utf-8")
        if "1.0.1-r5" not in text:
            continue
        updated = text.replace("1.0.1-r5", "1.0.2-r1")
        target.write_text(updated, encoding="utf-8")
        changed.append(str(target.relative_to(ROOT)))
    if not changed:
        raise SystemExit("No runtime 1.0.1-r5 references were found to advance.")
    print("runtime revision advanced in:")
    for path in changed:
        print(f"  - {path}")


replace_runtime_revision()
replace_exact("index.html", "v1.0.1 · Stable", "v1.0.2 · Stable")
replace_exact("js/app.js", 'data-visual-fidelity="reus-r2"', 'data-visual-fidelity="reus-r3"')
replace_exact("js/app.js", 's.dataset.visualFidelity="reus-r2"', 's.dataset.visualFidelity="reus-r3"')

# Strengthen the browser photo audit so the clean-anchor architecture is structural,
# not merely a screenshot convention.
path = ROOT / "tests/browser/football-visual-audit.cjs"
text = path.read_text(encoding="utf-8")

old = '''const rejectedR3Assets = new Set([\n    "james-rodriguez-real-madrid-2016.webp",\n    "marcus-rashford-man-utd-2016.webp",\n    "anthony-martial-man-utd-2017.webp",\n    "lionel-messi-barcelona-2016.webp"\n]);\n'''
new = old + '''const requiredCleanAnchorAssets = new Set([\n    "james-rodriguez-real-madrid-2019-smart-r5",\n    "marcus-rashford-man-utd-2017-smart-r5",\n    "anthony-martial-man-utd-2016-smart-r5"\n]);\n'''
if text.count(old) != 1:
    raise SystemExit("football-visual-audit: clean-anchor asset insertion point changed")
text = text.replace(old, new)

old = '''                const imageStyle = getComputedStyle(image);\n                const imageRect = image.getBoundingClientRect();\n                const frameRect = frame.getBoundingClientRect();\n                const panelRect = panel.getBoundingClientRect();\n'''
new = '''                const imageStyle = getComputedStyle(image);\n                const frameStyle = getComputedStyle(frame);\n                const beforeStyle = getComputedStyle(panel, "::before");\n                const afterStyle = getComputedStyle(panel, "::after");\n                const copy = panel.querySelector(".footballVisualCopy");\n                const imageRect = image.getBoundingClientRect();\n                const frameRect = frame.getBoundingClientRect();\n                const copyRect = copy.getBoundingClientRect();\n                const panelRect = panel.getBoundingClientRect();\n'''
if text.count(old) != 1:
    raise SystemExit("football-visual-audit: computed-style insertion point changed")
text = text.replace(old, new)

old = '''                    framingMode: panel.dataset.framingMode || "",\n                    maxCropFraction: Number.parseFloat(panel.dataset.maxCropFraction || "0"),\n'''
new = '''                    framingMode: panel.dataset.framingMode || "",\n                    photoTreatment: panel.dataset.photoTreatment || "",\n                    maxCropFraction: Number.parseFloat(panel.dataset.maxCropFraction || "0"),\n'''
if text.count(old) != 1:
    raise SystemExit("football-visual-audit: treatment return insertion point changed")
text = text.replace(old, new)

old = '''                    imageRendering: imageStyle.imageRendering,\n                    mixBlendMode: imageStyle.mixBlendMode,\n                    filter: imageStyle.filter\n'''
new = '''                    imageRendering: imageStyle.imageRendering,\n                    mixBlendMode: imageStyle.mixBlendMode,\n                    filter: imageStyle.filter,\n                    frameZIndex: Number.parseInt(frameStyle.zIndex || "0", 10) || 0,\n                    beforeZIndex: Number.parseInt(beforeStyle.zIndex || "0", 10) || 0,\n                    afterZIndex: Number.parseInt(afterStyle.zIndex || "0", 10) || 0,\n                    copyRight: copyRect.right,\n                    frameLeft: frameRect.left\n'''
if text.count(old) != 1:
    raise SystemExit("football-visual-audit: geometry return insertion point changed")
text = text.replace(old, new)

old = '''        assert.equal(panel.mixBlendMode, "normal", `${screenName}/${panel.asset}: blend mode must remain normal.`);\n        assert.equal(panel.filter, "none", `${screenName}/${panel.asset}: photography must not use CSS colour filters.`);\n\n        const maxCrop = Number.isFinite(panel.maxCropFraction) ? panel.maxCropFraction : 0;\n'''
new = '''        assert.equal(panel.mixBlendMode, "normal", `${screenName}/${panel.asset}: blend mode must remain normal.`);\n        assert.equal(panel.filter, "none", `${screenName}/${panel.asset}: photography must not use CSS colour filters.`);\n\n        if(requiredCleanAnchorAssets.has(panel.asset)){\n            assert.equal(panel.photoTreatment, "clean-anchor", `${screenName}/${panel.asset}: owner-rejected photo must stay on the clean-anchor treatment.`);\n            assert.ok(\n                panel.frameZIndex > panel.beforeZIndex && panel.frameZIndex > panel.afterZIndex,\n                `${screenName}/${panel.asset}: decorative geometry is painted above the photograph; face-safe layering regressed.`\n            );\n            assert.ok(\n                panel.copyRight <= panel.frameLeft + 2,\n                `${screenName}/${panel.asset}: text/caption intrudes into the clean photographic anchor.`\n            );\n        }\n\n        const maxCrop = Number.isFinite(panel.maxCropFraction) ? panel.maxCropFraction : 0;\n'''
if text.count(old) != 1:
    raise SystemExit("football-visual-audit: clean-anchor assertion insertion point changed")
text = text.replace(old, new)

path.write_text(text, encoding="utf-8")
print("updated tests/browser/football-visual-audit.cjs with clean-anchor structural assertions")

# Sanity: no old runtime revision may survive in runtime HTML/JS.
for target in [ROOT / "index.html"] + sorted((ROOT / "js").glob("*.js")) + sorted((ROOT / "data").glob("*.js")):
    text = target.read_text(encoding="utf-8")
    if "1.0.1-r5" in text:
        raise SystemExit(f"stale runtime revision remains in {target.relative_to(ROOT)}")

print("v1.0.2 maintenance integration patch complete")
