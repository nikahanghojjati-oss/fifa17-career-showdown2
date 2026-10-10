# JOB-1477 — Stage 1 design-token colour audit

**Decision:** 7 high-confidence findings. This is a reading audit only; no game, CSS, or design-source files were changed.

**Compared:** `visual-assets/v10_1/shared/showdown-tokens.css` (token definitions, especially lines 6–15 and 23–34), `css/v10Shell.css`, `css/homeV10.css`, and `css/rulesSettingsV10.css`, all at the `qa/mega-audits` baseline. Locations below are baseline line numbers.

## Findings (smallest suggested changes)

1. **Home/main menu, stage screens, setup, and Tools — identity badge gold.**
   - **File/lines:** `css/v10Shell.css:32,60,146,195`.
   - **Wrong:** `#onlinePlayerIdentityBadge` repeats literal `color: #f2c45b !important`, exactly matching `--sd-gold-400`.
   - **Smallest fix:** in each of these four rules, replace only `color: #f2c45b` with `color: var(--sd-gold-400)`; retain `!important` and every selector.

2. **Team V stage screens — identity badge keyboard/mouse focus border.**
   - **File/line:** `css/v10Shell.css:62`.
   - **Wrong:** identity badge hover/focus rule uses literal `border-color: #f2c45b !important`, exactly matching `--sd-gold-400`.
   - **Smallest fix:** `border-color: var(--sd-gold-400) !important`; leave outline and box-shadow unchanged.

3. **Stage, setup, and Tools top headers — chip panel background.**
   - **File/lines:** `css/v10Shell.css:58,144,193`.
   - **Wrong:** header badge/season-indicator backgrounds are literal `#0d0f13`, exactly `--sd-panel`.
   - **Smallest fix:** change only `background: #0d0f13 !important` to `background: var(--sd-panel) !important` in all three rules.

4. **Home/main menu and Tools — footer background.**
   - **File/lines:** `css/v10Shell.css:35,187`.
   - **Wrong:** both footer selectors use literal `background: #07080a`, exactly `--sd-black`.
   - **Smallest fix:** change only to `background: var(--sd-black)` in both rules; preserve footer text colour and border.

5. **Global runtime notification/toast — panel background.**
   - **File/line:** `css/v10Shell.css:157`.
   - **Wrong:** `#appRuntimeNotice` uses literal `background: #0d0f13`, exactly `--sd-panel`.
   - **Smallest fix:** `background: var(--sd-panel)`; retain the existing text and left gold-edge token.

6. **Tools / Legacy Data — file inputs, selects, and restore selects.**
   - **File/line:** `css/v10Shell.css:235`.
   - **Wrong:** `#legacy :is(input[type=file], select, .careerRestoreSelect)` uses `background: #0d0f13`, exactly `--sd-panel`.
   - **Smallest fix:** `background: var(--sd-panel)` in this rule only.

7. **Tools / Legacy Data — compact, back and disabled buttons.**
   - **File/lines:** `css/v10Shell.css:238,245`.
   - **Wrong:** the ordinary and disabled button backgrounds each use literal `#0d0f13`, exactly `--sd-panel`.
   - **Smallest fix:** replace each `background: #0d0f13` with `background: var(--sd-panel)`; preserve disabled-state styles and all other properties.

## Checked, intentionally excluded

- `css/homeV10.css`: no un-tokenized **exact** colour matches against the named foundation tokens in this stage; its opacity-specific glass and gold effects differ from the available tokens.
- `css/rulesSettingsV10.css`: no un-tokenized **exact** matches; e.g., `#f5f1e8` looks close to `--sd-text-primary: #f4f1ea` but differs, so a swap would change pixels. Similarly, `#d9b15f` is not `--sd-gold-400: #f2c45b`.
- In `css/v10Shell.css`, literals inside existing `var(--sd-*, <fallback>)` usages already use a token and were **not** reported. Alpha-specific `rgba(...)` colours were not treated as equivalent to opaque colour tokens; no opacity changes are proposed.
- These seven findings use only **byte-exact** colour matches from the audited token definitions; visual appearance should remain unchanged **where `showdown-tokens.css` is loaded**. The lead should confirm token availability before applying CSS fixes.

**Verification:** Compared the token values with colour literals in all three audited stylesheet files; checked the selectors and baseline line references. No runtime tests were run because this report edits no runtime code.
