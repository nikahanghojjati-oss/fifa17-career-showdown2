# Studio Small Axe

> **Only a small axe can take a big tree.**

Studio Small Axe is the UI and UX studio of Career Mode Showdown, and one of the most consequential studios on the project. Nik named it on 2026-11-02 and renamed it on 2026-11-03.

The big tree is a UI that looks assembled rather than designed: the "basic AI design" look. We do not cut it down with a rewrite. We cut it with many small, exact strokes, each one proven before and after. A stroke that breaks the game, its flow or its smoothness is not a stroke we make.

Every reviewer of a Studio Small Axe pull request can expect the same mentality: small diffs, precise intent, proof at every size, and the house rules below never bent.

## What we change, and what we never touch

**We change:** type sizes and weights, letter spacing, spacing and alignment, the panel grid, button styles and states, icons, empty, loading and error states, focus rings, motion timing, and CSS layout.

**We never touch:**
- the marble look and the gold;
- the Marco Reus photo with its credit, and the Dortmund crest;
- approved Team V art and pictures (new art goes to Team V by ticket through the lead);
- screen order, game rules, data, and any Firebase path.

## House rules

1. **Marble and gold stay.** The game keeps its look. We raise its quality, we do not replace it.
2. **Faces stay clear.** No box, button or label covers Daniel's or Nik's face, and the gaps around the heroes are even.
3. **No dimming, ever.** Nothing darkens a screen to make something else stand out.
4. **Nothing covers anything** at any size, and every button stays reachable. When a screen runs short, the page scrolls (`main` is the only scroller); we do not hide things.
5. **No flash.** Screens change without a flash, the Reus gate keeps the loading screen until the next screen is ready, and the flash test must pass.
6. **Respect Reduce Motion.** Every animation switches off under `prefers-reduced-motion`.
7. **Startup stays light.** The startup gzip budget is never exceeded. Icons are self-hosted (Lucide, ISC) with no CDN.
8. **Never lower than before.** A screen never scores lower after our change than it did before.

## The yardstick (/40)

Each screen gets 1 to 5 on eight lines, 40 points in total. **A screen ships at 36/40 or more** (raised from 34 on 2026-11-03).

| Line | 5 means | 1 means |
| --- | --- | --- |
| Hierarchy | One focal point, primary action found second | Everything shouts at the same volume |
| Type | Only scale sizes, one style per role, nothing under 12px | Many sizes and trackings, tiny labels |
| Spacing and alignment | 8-point rhythm, shared edges, groups read as groups, even gaps around the heroes | Uneven gaps, ragged edges, empty holes |
| Buttons | One family, ranks clear, label fits the button | Mixed styles, primary unclear |
| Panels | One panel family, matching heights in a row | Panels of different weights and depths |
| States | Loading, empty, error and full all designed | Dashes, raw text, dead ends |
| Fit (QA) | Clean at every size: no overlap, clipping, dimming or sideways scroll | Something covered or unreachable |
| Motion | Calm, consistent timing, press feedback, respects Reduce Motion | Jumpy, flashing or none |

## Roles

| Seat | Owns | Who sits there |
| --- | --- | --- |
| Art director | The look stays the look. Signs off every before/after gallery. | Nik (final); Team V for new art |
| UI lead / design-system owner | The token sheet: type scale, spacing scale, radius, buttons, panels, icons | Claude Opus |
| UX designer | Flow and clarity: one primary action, hierarchy, states, wording | Claude Opus |
| Motion designer | Timing and easing, press feedback, entrances; Reduce Motion respected | Claude Opus, with a Fable final eye |
| UI QA | Every screen at every size: overlap, clipping, hidden buttons, sideways scroll, dimming | Claude Sonnet helpers and the browser audits |
| Critic / red team | An independent read, not anchored on ours | Fable on the top screens, Codex on every PR |

## How a stroke lands

1. **Shoot** the screen before, at desktop and phone sizes.
2. **Score** it on the yardstick and name the three biggest gaps.
3. **Fix the token first** when a gap is shared (type scale, buttons, panels, icons), not one screen at a time.
4. **Cut** on a `claude-gameplay/studio-axe-*` branch off the current release branch. The CSS lives at the end of `css/r78-type.css` with the `--sa-*` tokens.
5. **Prove it:** after shots at the same sizes, the short-screens audit (`tests/browser/r80-short-screens-audit.cjs`), contracts, and the Showdown Gate.
6. **Review:** Codex on the PR, Fable on the top screens. Fix the real findings.
7. **Gallery, then merge.** Nik sees a before/after gallery, the lead merges into the release branch, and `main` waits for Nik's "merge rNN".

## The craft rules

- **Type:** one scale (12 / 13 / 15 / 16 / 20 / 28 / 40 px on desktop), brush titles untouched, nothing under 12px.
- **Spacing:** an 8-point grid (4 / 8 / 12 / 16 / 24 / 32 / 48 / 64). The space inside a group is smaller than the space between groups.
- **Buttons:** one family in three ranks (primary gold fill, one per screen; secondary gold outline; quiet text), with tap targets of at least 44px on phones.
- **Panels:** one marble panel family, with one border, one corner, one inner padding and one header pattern.
- **Icons:** Lucide line icons painted in the place's own gold or ivory, never emoji or text glyphs.
- **Motion:** three durations (120 / 200 / 320 ms), one ease-out curve for entrances, press feedback on every button, and everything off under Reduce Motion.

## Study sources

- [BoardUI](https://www.boardui.com/): composite type tokens, semantic colours, one motion scale.
- [Mobbin](https://mobbin.com/): real-app screen patterns.
- [Lucide](https://lucide.dev/): the icon set (ISC).
- *Refactoring UI* (Adam Wathan and Steve Schoger): hierarchy, spacing and depth.
- [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/): motion, hierarchy, touch targets.
- [Material 3 motion](https://m3.material.io/styles/motion/overview): easing and duration specs.
- [Laws of UX](https://lawsofux.com/): Fitts, Hick, proximity, the aesthetic-usability effect.
- [Practical Typography](https://practicaltypography.com/): the type scale and line length.
- [Linear](https://linear.app/) and [Stripe](https://stripe.com/): polish references.
