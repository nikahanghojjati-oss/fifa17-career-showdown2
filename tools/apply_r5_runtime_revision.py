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

visual_validator_path = ROOT / ".github" / "workflows" / "validate-football-visuals.yml"
visual = visual_validator_path.read_text(encoding="utf-8")

replacements = [
    ("james-rodriguez-real-madrid-2016-r4.webp", "james-rodriguez-real-madrid-2019-smart-r5.webp"),
    ("marcus-rashford-man-utd-2016-r4.webp", "marcus-rashford-man-utd-2016-smart-r5.webp"),
    ("anthony-martial-man-utd-2015-r4.webp", "anthony-martial-man-utd-2016-smart-r5.webp"),
    ("james-rodriguez-real-madrid-2016-r4", "james-rodriguez-real-madrid-2019-smart-r5"),
    ("marcus-rashford-man-utd-2016-r4", "marcus-rashford-man-utd-2016-smart-r5"),
    ("anthony-martial-man-utd-2015-r4", "anthony-martial-man-utd-2016-smart-r5"),
    ("James_Rodr%C3%ADguez_in_September_2016_-_01.jpg", "James_Rodr%C3%ADguez_in_2019.jpg"),
    ("Marcus_Rashford_September_2016_(cropped).jpg", "Man_Utd_v_Everton,_August_2016_(08).JPG"),
    ("File:Anthony_Martial_2015.jpg", "File:Manchester_United_v_Zorya_Luhansk,_September_2016_(26).JPG"),
    ("[594,661]", "[900,1100]"),
    ("[688,560]", "[825,1100]"),
    ("Dmitry Golubovich", "Ardfern"),
    ("CC BY-SA 2.5", "CC BY-SA 4.0"),
    ("r4 James Rodríguez visual", "r5 James Rodríguez visual"),
    ("James r4 source", "James r5 source"),
    ("r4 Manchester United Rashford visual", "r5 Manchester United Rashford visual"),
    ("Rashford r4 derivative", "Rashford r5 derivative"),
    ("Rashford r4 subject source", "Rashford r5 source"),
    ("r4 Manchester United Martial visual", "r5 Manchester United Martial visual"),
    ("Martial r4 derivative", "Martial r5 derivative"),
    ("Martial r4 source", "Martial r5 source"),
    ("r4 asset data", "r5 asset data"),
    ("r4 recovery build", "r5 smart-crop rebuild"),
    ("The r4 corrective stylesheet", "The r5 corrective stylesheet"),
    ("r4 crop-safe licensed visual contracts passed", "r5 smart-crop licensed visual contracts passed"),
    ("licensed-football-visual-r4-${{ github.sha }}", "licensed-football-visual-r5-${{ github.sha }}"),
]

for old, new in replacements:
    if old in visual:
        visual = visual.replace(old, new)

james_source_assert = "assert.ok(james.source_page.includes('James_Rodr%C3%ADguez_in_2019.jpg'), 'James r5 source changed unexpectedly.');"
if james_source_assert in visual and "crop_box_on_source, [20,0,540,705]" not in visual:
    visual = visual.replace(
        james_source_assert,
        james_source_assert + "\n          assert.deepStrictEqual(james.crop_box_on_source, [20,0,540,705], 'James r5 authored crop box changed unexpectedly.');"
    )

rashford_source_assert = "assert.ok(rashford.source_page.includes('Man_Utd_v_Everton,_August_2016_(08).JPG'), 'Rashford r5 source changed unexpectedly.');"
if rashford_source_assert in visual and "crop_box_on_source, [0,400,1800,2600]" not in visual:
    visual = visual.replace(
        rashford_source_assert,
        rashford_source_assert + "\n          assert.deepStrictEqual(rashford.crop_box_on_source, [0,400,1800,2600], 'Rashford r5 authored crop box changed unexpectedly.');"
    )

martial_source_assert = "assert.ok(martial.source_page.endsWith('File:Manchester_United_v_Zorya_Luhansk,_September_2016_(26).JPG'), 'Martial r5 source changed unexpectedly.');"
if martial_source_assert in visual and "crop_box_on_source, [0,0,1800,2400]" not in visual:
    visual = visual.replace(
        martial_source_assert,
        martial_source_assert + "\n          assert.deepStrictEqual(martial.crop_box_on_source, [0,0,1800,2400], 'Martial r5 authored crop box changed unexpectedly.');"
    )

old_notice_crop_assert = "assert.ok(notices.includes('blind portrait-to-wide'), 'Notices must explain the r4 crop-safety transformation policy.');"
new_notice_crop_assert = "assert.ok(notices.includes('explicit, hand-reviewed crop') && notices.includes('responsive CSS is not allowed to crop the derivative again'), 'Notices must explain the r5 authored-crop and no-secondary-crop policy.');"
visual = visual.replace(old_notice_crop_assert, new_notice_crop_assert)

old_notice_full_source_assert = "assert.ok(notices.includes('complete source remains visible') || notices.includes('complete source is protected'), 'Notices must document full-source preservation for the uncropped runtime photographs.');"
new_notice_full_source_assert = "assert.ok(notices.includes('authored derivative') && notices.includes('object-fit: contain'), 'Notices must document complete authored-derivative preservation and contain-only runtime framing.');"
visual = visual.replace(old_notice_full_source_assert, new_notice_full_source_assert)

required_tokens = [
    "james-rodriguez-real-madrid-2019-smart-r5.webp",
    "marcus-rashford-man-utd-2016-smart-r5.webp",
    "anthony-martial-man-utd-2016-smart-r5.webp",
    "crop_box_on_source, [20,0,540,705]",
    "crop_box_on_source, [0,400,1800,2600]",
    "crop_box_on_source, [0,0,1800,2400]",
    "licensed-football-visual-r5-${{ github.sha }}",
]
for token in required_tokens:
    if token not in visual:
        raise RuntimeError(f"Expected r5 visual-validator token missing after integration: {token}")

for stale in [
    "james-rodriguez-real-madrid-2016-r4.webp",
    "marcus-rashford-man-utd-2016-r4.webp",
    "anthony-martial-man-utd-2015-r4.webp",
]:
    if stale in visual:
        raise RuntimeError(f"Stale replaced r4 player visual remains in permanent validator: {stale}")

visual_validator_path.write_text(visual, encoding="utf-8")
print("updated", visual_validator_path.relative_to(ROOT))
