# JOB-1478 — Hover-only touch affordances (stage 1)

Read-only CSS audit on `qa/mega-audits`; no gameplay or frozen design file was changed. Scope: `css/v10Shell.css`, `css/homeV10.css`, `visual-assets/v10_1/trophy-room/trophy-room.css`, and `visual-assets/v10_1/standings/standings.css`.

## Findings (3; all visual feedback, not hidden functionality)

1. **Legacy Tools — danger buttons.** `css/v10Shell.css:254` applies the darker red fill only with `.compactButton.dangerButton:hover:not(:disabled)`. The border/ring already responds to `:focus-visible` (line 244), but the fill does not visibly respond to a touch press. **Smallest CSS fix:** change the fill selector to `.compactButton.dangerButton:is(:hover, :focus-visible, :active):not(:disabled)` and retain its `!important` background to override the default at line 253.

2. **Trophy Room — category tabs.** `visual-assets/v10_1/trophy-room/trophy-room.css:10` gives `.trophyTab:hover:not(:disabled)` a darker background; `:active` only shifts its position and `:focus-visible` only draws an outline. Thus the hover fill is not reliably reproduced during a touch press. **Smallest CSS fix:** in a permitted, non-frozen override stylesheet, mirror that background for `.trophyTab:is(:hover, :focus-visible, :active):not(:disabled)`, preserving the existing `.is-active` selected-tab appearance.

3. **Trophy Room — Back button.** `visual-assets/v10_1/trophy-room/trophy-room.css:14` changes `.trophyBack:hover` to gold with dark text. Its `:active` state only translates the button and `:focus-visible` only adds an outline (line 10). Touch users do not reliably see the gold/dark hover treatment. **Smallest CSS fix:** in a permitted, non-frozen override stylesheet, use `.trophyBack:is(:hover, :focus-visible, :active)` with the same background and text color as the current hover rule.

## Other checked selectors

- `css/v10Shell.css:61-62, 99, 126-127, 243-244`: other hover affordances already have corresponding `:focus-visible` (or `aria-current`) styling.
- `css/homeV10.css:290-291, 294-295`: the music track-sheet trigger gains a highlight on hover **or when checked**; the sheet actually opens via `:checked`, so touch users can reach it. Focus-visible also has its own outline.
- `visual-assets/v10_1/standings/standings.css`: no `:hover` selectors found.

No control, tooltip, or content reveal gated solely on hover was found in the four CSS files. The three findings concern parity of *visual feedback*, not blocked taps or navigation. Frozen Team V stylesheets should remain untouched; the lead can implement overrides in an editable stylesheet.
