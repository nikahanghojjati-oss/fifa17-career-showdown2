# Rule Book · BUILD_RESULT

## Run

From the repository root:

```bash
python3 -m http.server 8765
# Desktop
# http://127.0.0.1:8765/visual-assets/v10_1/rule-book/index.html?frame=RB1
# http://127.0.0.1:8765/visual-assets/v10_1/rule-book/index.html?frame=RB2
# Phone: same URLs at a portrait viewport ≤ 760 px
```

The default frame is RB1 when `?frame=` is missing or invalid.

## Frames

| Frame | Purpose |
| --- | --- |
| RB1 | Opened from Home, standard Rule Book composition |
| RB2 | Long-section stress state using the same product copy and designed internal scrolling |

Both frames are Preview data states. Rule text and scoring values are loaded from `fixtures.json` into DOM text.

## Build

The screen uses the shared system stadium plate with a stronger reading scrim, no managers and no character cut-outs. Desktop uses a left sticky section index and two-column gold-edged rule cards. Section 04 uses the shared hero-panel material for the scoring block. Phone recomposes the index into a chip row and makes the rule-card region the only scrolling surface; the page itself does not scroll.

There is no dedicated Rule Book mockup. System decisions therefore follow the factory brief and shared visual language rather than inventing a new art direction. The title uses `TITLE_RULE_BOOK_V1.webp` with a real visually-hidden H1 for accessibility. The only product action is Back.

## Product-fidelity decisions

- Rule copy, section titles, scoring labels, scoring values, preview labels and Back are fixture-driven DOM text.
- Scoring remains Champions League +5, league +3, domestic cup +1, performance bonus +1 MAX, awards bonus +1 MAX, season maximum 11.
- No real club crests, league logos, trophies, players or EA/FIFA artwork are loaded.
- No live data is baked into images.
- The phone reserves `56px + env(safe-area-inset-bottom)` for the shared bottom bar.
- Background art is WebP only; desktop chooses 1X/2X through the shared stage engine and phone uses `ENV_SYS_PHONE_V1.webp`.

## Scorecard · code-only

| Criterion | Score | Evidence |
| --- | ---: | --- |
| 1 Mockup fidelity | 4/5 | No dedicated mockup; uses approved system plate, title geometry and prescribed Rule Book composition. |
| 2 Characters stand out | 5/5 | Not applicable by design; no managers render on this screen. |
| 3 Hands and contact | 5/5 | Not applicable by design; no people or hands render. |
| 4 Lighting and grade | 4/5 | Layered reading scrims calm the stadium behind gold-edged glass. |
| 5 Typography and title | 5/5 | Shared eyebrow/tagline/type system plus Rule Book brush wordmark and hidden H1. |
| 6 Panel craft | 4/5 | Gold-edged section cards, number badges, index chips and hero scoring treatment. |
| 7 Information clarity and honesty | 4/5 | Six exact product-rule sections, exact scoring maximum, explicit preview state, one real action. |
| 8 Motion and feel | 5/5 | Shared pack-rip entrance gives the brush title a wipe/glint, raises six rule panels at a 60 ms stagger, pays off Back last, stays inside 1.2 s, and reduces to a 150 ms fade. |
| 10 Polish and finish | 4/5 | Shared tokens/UI/stage/motion linked, focus treatment present, no debug or placeholder copy. |

## Fix round

- Fix item 1 DONE: the 01–06 section index is decorative display markup only. The generated chips are non-focusable `span.ruleBookIndexChip` elements with no `href`, `aria-controls`, tab stop, click handler or keyboard handler.
- `#ruleBookBack` remains the only Rule Book product action.
- No fix items are blocked.

## Motion

The Rule Book uses the shared `sdEnter(root)` choreography after fixture-driven sections exist. It animates only transform and opacity; it does not move layout dimensions, grid tracks, margins, padding or font sizes.

| Element | Delay | Duration | Easing |
| --- | ---: | ---: | --- |
| Brush title wipe | 250 ms | 450 ms | `cubic-bezier(.22,1,.36,1)` |
| Title metallic glint | 640 ms | 420 ms | `cubic-bezier(.22,1,.36,1)` |
| Rule panel 1 | 400 ms | 500 ms | `cubic-bezier(.22,1,.36,1)` |
| Rule panel 2 | 460 ms | 500 ms | `cubic-bezier(.22,1,.36,1)` |
| Rule panel 3 | 520 ms | 500 ms | `cubic-bezier(.22,1,.36,1)` |
| Rule panel 4 | 580 ms | 500 ms | `cubic-bezier(.22,1,.36,1)` |
| Rule panel 5 | 640 ms | 500 ms | `cubic-bezier(.22,1,.36,1)` |
| Rule panel 6 | 700 ms | 500 ms | `cubic-bezier(.22,1,.36,1)` |
| Back payoff pulse | 760 ms | 320 ms | `cubic-bezier(.22,1,.36,1)` |
| Reduced-motion entrance | 0 ms | 150 ms | `linear` |

The sixth panel ends at 1.2 s, exactly at the shared cleanup budget; Back finishes at 1.08 s. Both native `prefers-reduced-motion: reduce` and the app dataset preference paths suppress wipe, glint and pulse movement and use the short fade instead.

Criterion 8 self-score: 5/5. The applicable Rule Book elements follow the shared choreography, the 60 ms stagger sits inside the 40–80 ms target, the total entrance is capped at 1.2 s, the screen remains usable while motion runs, and reduced motion is fade-only.

## Estimated first-paint weight

Code-only estimate from the committed display assets and screen files:

- Desktop DPR1: approximately 524 KiB raw source.
- Desktop DPR2: approximately 886 KiB raw source.
- Both remain inside the 900 KiB desktop first-paint gate before normal transfer compression.

Claude owns the final browser measurement and H5–H11 intake checks.

## Phone

### Height budget

The phone layout is a recomposition, not a scaled desktop view. The page itself is fixed to `100svh` and hidden-overflow; only `.ruleBookGrid` scrolls internally.

The CSS allocates 160 px above the internal content panel:

- 30 px top breathing room
- 76 px title block
- 4 px gap
- 44 px section-chip row
- 6 px gap

It allocates 116 px below the content panel:

- 8 px gap
- 44 px pinned Back button
- 8 px gap
- 56 px shared bottom-bar reserve

| Viewport | Top/title/index/gaps | Internal content panel | Lower gap/button/bar | Total | Remaining |
| --- | ---: | ---: | ---: | ---: | ---: |
| 393 × 660 | 160 px | 384 px | 116 px | 660 px | 0 px |
| 360 × 640 | 160 px | 364 px | 116 px | 640 px | 0 px |
| 375 × 553 | 160 px | 277 px | 116 px | 553 px | 0 px |

With a nonzero `env(safe-area-inset-bottom)`, that inset is added to the bottom reserve and subtracted from the internal content panel by the matching `bottom: calc(116px + env(...))` rule, so the page still stays within the viewport.

At 375 × 553 the Back action is explicitly visible: its 44 px target sits from y = 445 px to y = 489 px, followed by an 8 px gap before the 56 px nav reserve begins at y = 497 px. The content panel ends at y = 437 px and scrolls internally when its rule cards exceed the available 277 px.

## Known gaps

- No browser render, screenshot, contrast sampling or factory QA was run in this worker chat, by factory policy.
- Claude must run the preview recipe, render both frames at desktop and phone targets, and verify H5–H11 plus the final visual score.
- If the shared bottom bar from job 125 replaces the temporary nav reserve later, its reserved height must remain 56 px plus the safe-area inset.

## Claude preview recipe

See `tools/MAKE_ASSETS.md`. The recipe makes no new visual source art; it packages the already committed Rule Book display assets into `preview.html` for review.
