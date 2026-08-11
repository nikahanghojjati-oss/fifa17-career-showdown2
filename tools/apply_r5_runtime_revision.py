from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OLD_REVISION = "1.0.1-r4"
NEW_REVISION = "1.0.1-r5"

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
    if OLD_REVISION in text:
        path.write_text(text.replace(OLD_REVISION, NEW_REVISION), encoding="utf-8")
        print("advanced", rel)
    elif NEW_REVISION in text:
        print("already-current", rel)
    else:
        raise RuntimeError(f"Neither {OLD_REVISION} nor {NEW_REVISION} found in {rel}")

css_path = ROOT / "css" / "footballVisuals.css"
css = css_path.read_text(encoding="utf-8")
old_id = "marcus-rashford-man-utd-2016-r4"
new_id = "marcus-rashford-man-utd-2016-smart-r5"
if old_id in css:
    css = css.replace(old_id, new_id)
    css = css.replace(
        "/* The selected 2016 Rashford source is a tight portrait crop. A narrower\n   dedicated frame makes him the dominant readable subject while retaining\n   the complete licensed source. */",
        "/* The r5 Rashford asset is already an authored subject crop. Keep a narrow\n   dedicated stage so the complete derivative remains dominant without any\n   second responsive crop or zoom. */",
    )
    css_path.write_text(css, encoding="utf-8")
    print("updated", css_path.relative_to(ROOT))
elif new_id in css:
    print("already-current", css_path.relative_to(ROOT))
else:
    raise RuntimeError("Neither r4 nor r5 Rashford CSS selector found")
