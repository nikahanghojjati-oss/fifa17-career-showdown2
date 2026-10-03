# Rule Book · BUILD_RESULT

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
