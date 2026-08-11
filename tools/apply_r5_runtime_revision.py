from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

REVISION_FILES = [
    ".github/workflows/validate-final-polish.yml",
    ".github/workflows/validate-menu-bootstrap.yml",
    ".github/workflows/validate-static-app.yml",
    ".github/workflows/validate-v1-visual-immersion.yml",
    "CHANGELOG.md",
    "NEXT_TASK.md",
    "PROJECT_STATE.md",
    "README.md",
    "index.html",
    "js/app.js",
    "js/footballVisuals.js",
    "js/menuExperience.js",
    "js/optionalModules.js",
]

for rel in REVISION_FILES:
    path = ROOT / rel
    text = path.read_text(encoding="utf-8")
    if "1.0.1-r4" not in text:
        raise RuntimeError(f"Expected active r4 revision token missing from {rel}")
    path.write_text(text.replace("1.0.1-r4", "1.0.1-r5"), encoding="utf-8")
    print("advanced", rel)

css_path = ROOT / "css" / "footballVisuals.css"
css = css_path.read_text(encoding="utf-8")
old_id = "marcus-rashford-man-utd-2016-r4"
new_id = "marcus-rashford-man-utd-2016-smart-r5"
if old_id not in css:
    raise RuntimeError("Expected r4 Rashford CSS selector missing")
css = css.replace(old_id, new_id)
css = css.replace(
    "/* The selected 2016 Rashford source is a tight portrait crop. A narrower\n   dedicated frame makes him the dominant readable subject while retaining\n   the complete licensed source. */",
    "/* The r5 Rashford asset is already an authored subject crop. Keep a narrow\n   dedicated stage so the complete derivative remains dominant without any\n   second responsive crop or zoom. */",
)
css_path.write_text(css, encoding="utf-8")
print("updated", css_path.relative_to(ROOT))
