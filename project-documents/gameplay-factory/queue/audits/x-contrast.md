# JOB-1473 — Team V text contrast on plates and badges (stage 1)

**Result: no findings** — no confirmed below-threshold *applicable text/background pair* within the three CSS files this ticket permits reading. This is a static CSS audit, not a claim that every rendered screen has been visually validated.

## Scope and method

Read from `qa/mega-audits`:
1. `visual-assets/v10_1/shared/showdown-tokens.css` — text, surface, gold and accent tokens.
2. `visual-assets/v10_1/shared/showdown-ui.css` — panel, tile, table, chip, badge-like preview tag, button, tabs, inputs, sheets and overlays.
3. `css/v10Shell.css` — header identity/season badges, runtime notice, sign-in overlay, and legacy tool panels/buttons.

Used WCAG relative-luminance contrast: **4.5:1 for ordinary text**, **3:1 for large text (24px and above, per ticket)**. For translucent dark CSS plates, also calculated contrast against a pure-white underlying surface as a conservative bright-backdrop case; actual screen artwork was not read or modified.

## Representative checks

| Surface / selector | Location | Foreground versus surface | Contrast | Outcome |
| --- | --- | --- | ---: | --- |
| Primary gold action, `.sd-btn--primary` | `showdown-ui.css:66` | `#07080a` on `#f5c518` | **12.29:1** | Pass |
| Dark secondary action, `.sd-btn--secondary` | `showdown-ui.css:67` | gold `#ffd34d` on dark alpha plate; white-backdrop worst case | **11.13:1** | Pass |
| Small tile captions, `.sd-tile__label` | `showdown-ui.css:96,107` | `#b9b3a4` on tile's 80%-opaque dark lower stop; white-backdrop case | **5.36:1** | Pass |
| Chip/preview tag, `.sd-chip, .sd-preview-tag` | `showdown-ui.css:148,151-153` | `#b9b3a4` on 92%-opaque dark chip; white-backdrop case | **7.89:1** | Pass |
| Modal body text, `.sd-sheet__body` | `showdown-ui.css:178,181` | `#b9b3a4` on 94%-opaque dark plate; white-backdrop case | **8.33:1** | Pass |
| Standard dark badge, `#seasonIndicator` | `v10Shell.css:56-60` | `#ece6d6` on `#0d0f13` | **15.40:1** | Pass |
| Runtime notice | `v10Shell.css:156-162` | `#ece6d6` on `#0d0f13` | **15.40:1** | Pass |
| Legacy controls (enabled), `.compactButton` | `v10Shell.css:237-241` | `#f2c45b` on `#0d0f13` | **11.71:1** | Pass |

## Exclusions, limitations, and follow-up verification

- `v10Shell.css:245` uses `#6f6a5e` on `#0d0f13` (**3.56:1**) **only for `:disabled`** legacy buttons. Disabled controls are exempt from the WCAG 1.4.3 text-contrast minimum, so this is **not** a confirmed failure.
- `showdown-tokens.css` defines the blue `--sd-daniel` and dark `--sd-gold-800`; the authorized UI stylesheet uses the blue accent for a split bar/panel trim, not text. Do not flag decorative accents as failing text.
- `.sd-tabs` is transparent and `.sd-tile` permits inherited ink. Their *actual* contrast depends on each screen's placement and inherited style. Screen-specific CSS/markup and screenshots were excluded by the ticket's three-file reading whitelist, so no unsupported failure is asserted.
- The base token notes that dim text is decorative-only; no confirmed dim body-text use was found in the two authorized consuming stylesheets.
- No game CSS, artwork, markup, rules or tests were modified. This stage 1 report is the only deliverable. Any live-screen image or rendered-state verification requires a separate authorized audit.

**Decision:** no findings; no player-visible color edit proposed.
