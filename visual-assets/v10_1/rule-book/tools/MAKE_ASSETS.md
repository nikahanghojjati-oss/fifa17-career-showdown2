# Rule Book · MAKE_ASSETS

This build needs no new source artwork. Claude uses the committed shared display assets and packages the review preview.

Required inputs:

- `../shared/plates/ENV_SYS_PLATE_V1_1X.webp`
- `../shared/plates/ENV_SYS_PLATE_V1_2X.webp`
- `../shared/plates/ENV_SYS_PHONE_V1.webp`
- `../shared/wordmarks/TITLE_RULE_BOOK_V1.webp`
- `fixtures.json`, `index.html`, `rule-book.css`, `rule-book.js`
- shared Showdown CSS, stage.js and motion.js

Run from `visual-assets/v10_1/rule-book`. The script writes `preview.html`; do not hand-edit that generated file.

```bash
python3 tools/build_preview.py
```
