# NEXT TASK

## Current gate: v0.95.0-r3 visual consistency + Club Reveal acceptance

Stay on **v0.95 Workstream 1** until this browser gate passes.

**Application version:** v0.95.0  
**Deployed asset revision:** `0.95.0-r3`

Do not begin Settings, Main Menu Statistics alignment, or Season pre-commit review until the owner accepts this revision.

---

# Why r3 exists

The owner requested better Rule Book font distinction plus a repository-wide visual inspection before advancing.

The inspection found a shared cascade problem across optional screens:

- the modern `css/app.css` visual system converts several optional module containers to light FIFA-style panels;
- older `rulebook.css`, `analytics.css`, and `legacy.css` still contained child colors designed for dark cards;
- some pale/white child text therefore appeared on light panels;
- the same split visual language made Rule Book, Trophy Room, Statistics and parts of Legacy look less polished than the Home/gameplay shell.

`0.95.0-r3` fixes the component system rather than adding isolated font-color patches.

---

# r3 changes

## Rule Book

- dark, compact hero with yellow/cyan hierarchy;
- light rule cards with dark readable headings/body text;
- six visually differentiated section accents;
- dark scoring labels and blue scoring values;
- high-contrast yellow maximum-11 callout;
- tighter Chromebook low-height spacing;
- retained single-column mobile layout.

## Rivalry Statistics / Trophy Room

- light statistics cards with dark text and blue/cyan accents;
- intentional dark rivalry hero retained;
- comparison and season-progression tables normalized to light/readable presentation;
- career standings made horizontally safe when narrow;
- manager cabinets, trophy counts and record cards corrected for light-panel contrast;
- long names/records constrained and allowed to wrap safely;
- Chromebook/mobile density improved.

## Legacy

- high-contrast light summary cards;
- historical showdown cards remain intentionally dark;
- season-history rows and long names made safer;
- Data Management panel corrected from pale/white-on-light text to dark readable copy;
- compact and destructive controls aligned with the current visual system.

## Validation

CI now checks balanced CSS structure for:

- `css/app.css`
- `css/analytics.css`
- `css/legacy.css`
- `css/rulebook.css`

The optional visual modules remain lazy. They were not added to the initial startup bundle.

---

# Contracts that must remain unchanged

## Club assignment

- exactly one random pair;
- both clubs from selected league;
- clubs different;
- pair persisted before reveal;
- failed save rolls back;
- no reroll after save;
- `Clubs Assigned` remains confirmation-pending state;
- refresh/Continue before confirmation restores the same pair;
- League Wheel cannot reopen after assignment;
- Dashboard/Transfer cannot bypass confirmation;
- confirmation changes status to `Ready` only after successful save.

## Competition rules

- Champions League +5;
- league title +3;
- domestic cup +1;
- 100 points and/or 100 goals +1 maximum;
- Top Scorer and/or Top Assist +1 maximum;
- maximum 11;
- equal non-zero totals draw;
- only 0-0 uses league position then league points.

## Performance

- one initial stylesheet;
- maximum seven initial scripts;
- gameplay package lazy;
- optional history/analytics/Rule Book lazy;
- one YouTube iframe maximum and only after Play;
- no per-keypress storage writes;
- no hidden transfer timer loop;
- Chromebook Home/media layout guards remain intact.

---

# Owner browser acceptance — r3

Hard refresh once before testing so the browser receives `0.95.0-r3` lazy styles.

## A. Startup

Expected:

- no red application-integrity warning;
- Home looks the same or cleaner than accepted responsive build;
- Continue/New Showdown/media controls still work.

## B. Rule Book — primary r3 check

Open Rule Book on Chromebook.

Expected:

- hero is dark and clearly separated from the rule cards;
- hero eyebrow is cyan and title/body are readable white;
- each rule card is light;
- section numbers use visibly different accent colors;
- section headings are dark and strong;
- rule body text is dark grey, not pale blue/white;
- bullet accents clearly identify each section;
- Scoring rows are easy to scan;
- +5 / +3 / +1 values are clearly readable;
- maximum `11` is unmistakable in the yellow callout;
- no text disappears into its background;
- two-column desktop layout stays aligned;
- short Chromebook height scrolls naturally rather than overlapping;
- narrow/mobile view becomes one clean column.

## C. Trophy Room

Open Trophy Room.

Expected:

- summary cards are light with readable dark values;
- manager cabinet names/records are readable on light cards;
- career points are clearly emphasized;
- trophy counts are dark/readable instead of white on light;
- all-time record cards remain legible with long details;
- career standings do not force the whole page wider; the table may scroll horizontally inside its own region when required.

## D. Rivalry Statistics

With an active showdown, open Rivalry Statistics.

Expected:

- rivalry hero remains intentionally dark and readable;
- comparison table below it is light with dark manager values;
- season progression rows are light/readable;
- point tracks remain visible;
- long manager/club names wrap rather than breaking the layout.

## E. Legacy

Open Legacy.

Expected:

- summary cards are light and readable;
- historical showdown cards remain dark and distinct;
- season history remains readable;
- Data Management heading/body are dark on the light panel;
- destructive buttons remain visually distinct;
- no horizontal overflow from long names or history text.

## F. Club Reveal r2 regression

Create a disposable showdown and reach Club Assignment.

Expected:

- both reveal cards remain equal width/height on Chromebook;
- reveal remains the shorter finite sequence;
- no sweeping white bar;
- no jerky resize during reveal;
- M1 then M2 then VS then confirmation;
- same pair survives refresh + Continue before confirmation;
- no reroll or return to League Wheel;
- confirmation opens Showdown Home with the same pair.

## G. Core smoke regression

After confirming a disposable rivalry:

- Transfer Challenge opens/resumes;
- transfer drafts still persist;
- Season Results still open after transfer completion;
- scoring remains max-11;
- Season Summary works;
- Back and Continue remain state-safe;
- Legacy/Trophy/Rule Book still return through legal navigation paths.

---

# If a defect is found

Remain on **v0.95 Workstream 1 / visual acceptance**.

Process:

1. inspect exact current `main`;
2. identify the actual cascade/layout/state root cause;
3. preserve all locked gameplay and persistence behavior;
4. preserve lazy-loading and startup limits;
5. fix the smallest coherent visual/component system;
6. bump the asset revision if deployed CSS/JS/data changes;
7. extend deterministic checks where practical;
8. verify exact-head GitHub Actions and Pages deployment;
9. update continuation documents.

Do not use a visual defect to introduce unrelated features.

---

# After r3 owner acceptance

Mark v0.95 Workstream 1 accepted and continue the original finite roadmap:

## Workstream 2 — Settings blueprint alignment

Implement the small Settings surface from the original screen plan using current architecture. Appropriate scope: application information, animation/reduced-motion preference if useful, and existing safe data-management access. No accounts/cloud/online systems.

## Workstream 3 — Main Menu Statistics alignment

Expose cumulative Statistics appropriately from Main Menu by reusing existing analytics/Trophy Room/Rivalry Statistics engines. Do not create duplicate analytics.

## Workstream 4 — Season pre-commit review

Inspect Complete Season UX and add a lightweight review/confirmation before irreversible season completion if no equivalent safeguard exists. Completed seasons remain read-only.

## Workstream 5 — final v0.95 release polish

Responsive consistency, accessibility/focus, feedback, performance, and full persistence/navigation/gameplay regression.

Then move directly to **v1.0 Complete Release Candidate / Final Release**.
