# JOB-1433 · Rule Book upright tablet study
- Chosen layout: an editorial two-column, three-row rule board at 768×1024 and 820×1180, not a scaled phone panel.
- The centered artwork and summary retain the live Rule Book title hierarchy; all six sections remain ordered 01–06.
- Exact live copy comes from `js/ruleBook.js`: 25 bullet rules, five scoring rows, and MAXIMUM PER MANAGER / SEASON 11.
- Taller tablet canvases give each card more reading space; unusually long text can scroll within its own card rather than clip.
- BACK TO MAIN MENU is fixed above the bottom hub navigation, keeping the primary action accessible.
- The hub bar appears only under 900px and marks RULES active; the narrow fallback scrolls the rule collection within a fixed viewport.
- Assets link to the existing v10 shared phone environment and Rule Book wordmark; no frozen art is changed.
- `PHONE_RULE_BOOK.png` was verified by GitHub SHA, but the connector could not render the picture bytes; Team V should compare visual spacing.
- Static study only: no scripting, runtime route wiring, gameplay changes or invented copy.
