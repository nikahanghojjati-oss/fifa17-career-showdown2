# Screen 12 — Legacy / `legacy`

Status: ACTIVE SCREEN CONTRACT — KNOWN CONTRAST DEFECT RESOLVED IN PROPOSAL

This document converts the R8.26 Legacy contrast finding into a concrete proposal-only design contract. Production CSS remains untouched.

## Purpose

Legacy is the long-term rivalry archive and data-management surface. It must feel connected to the black/gold R8 product without sacrificing archive readability, recovery clarity or destructive-action safety.

Legacy uses Level B presentation for history content and Level C presentation for import, backup, restore, corrupt/fail-closed and destructive states.

## Current product structure to preserve

The current Legacy implementation contains:

- summary statistics;
- completed Showdown archive cards;
- manager-vs-manager matchup presentation;
- expandable season history;
- backup/data controls;
- import analysis and migration preview;
- status and error messaging;
- destructive actions;
- recovery-oriented states loaded by existing product authority.

R8 must not change storage, import, recovery or delete semantics.

## Confirmed prototype defect

The isolated R8 black shell exposed `.legacySectionHeading` using the old light-theme `var(--f17-ink)` color on the new near-black background.

Observed prototype pair:

- foreground approximately `#20272d`;
- background approximately `#080b0e`;
- contrast approximately 1.3:1;
- expected normal-text threshold: 4.5:1.

This is rejected.

## Proposal resolution

Any Legacy text rendered directly over the global black shell must use an explicit R8 dark-shell text token rather than inherit a light-theme ink token.

For `.legacySectionHeading` the proposal treatment is:

- text: `#f5f0e4`;
- left rule: `#f3cc4f`;
- optional muted lower rule: `rgba(243,204,79,.18)`;
- no translucent light panel is required merely to make the heading readable.

At the same time, text inside intentionally light Legacy cards may continue using dark text if the card itself stays light. The proposal must not globally flip every `.legacy*` selector to cream because that would create dark-on-light regressions in import analysis and white preview cards.

The senior implementation therefore needs surface-aware R8 scoping, not one universal Legacy text override.

## Surface model

### Archive shell

Use black global background, cream section headings and restrained gold dividers.

### Summary statistics

Preferred final R8 treatment is dark charcoal stat cards with bright values and muted labels. A light-card version is acceptable only if it is visually intentional and passes all contrast checks; mixed accidental light/dark inheritance is not acceptable.

### Completed Showdown cards

Keep the existing strong dark archive-card model. Replace blue-heavy accent dominance with warmer neutral/gold hierarchy where this does not encode product state.

Manager matchup remains symmetric. Manager 1 maps to Daniel and Manager 2 maps to Nik wherever identity labels are shown.

### Season history rows

Use compact dark rows, readable score numerals and a gold season index. Expanded content may scroll naturally. Do not shrink type to force long histories above the fold.

### Backup/data-management controls

Use Level C surfaces. Give each action a clear text label and visible state. Primary backup/export may use gold emphasis. Destructive actions remain visually separated and use the reserved danger treatment.

### Import analysis

Import/drop-zone, preview, conflicts and migration messages retain strong legibility. The proposal may keep light analysis cards inside a dark shell, but every nested foreground/background pair must be checked independently.

### Corrupt / unavailable / fail-closed states

Use explicit high-contrast headings, plain-language status, clear next action and restrained warning/danger color. No cinematic character art. No motion behind critical recovery controls.

## Responsive behavior

Desktop may use multi-column summary cards and detailed archive rows.

At 800px and below, collapse stat grids and card headers to one column while preserving action ordering and readable details.

On mobile, destructive and recovery actions become full-width only when that improves separation and does not imply they are the primary progression path.

No A01/A02 character art is required at any Legacy breakpoint.

## Asset decision

Legacy requires no new raster image generation.

Required visual roles are solved through:

- layout and CSS material system;
- original gold/charcoal archive geometry;
- existing DOM text;
- original rights-safe icons only if later scanability testing proves they add value.

## Accessibility acceptance

Before the proposal can close, verify Legacy normal, empty, corrupt, unavailable, import-analysis, recovery and destructive states independently.

Acceptance requires:

- all normal-size text pairs meet at least 4.5:1 contrast;
- large text meets at least 3:1;
- focus indicators remain visible on light and dark nested surfaces;
- destructive controls are not identified by color alone;
- expandable archive details remain keyboard operable;
- hidden file inputs retain an accessible activation path;
- long filenames, IDs and migration messages wrap safely;
- no character or atmosphere layer obstructs data-management controls.

## Reference implementation boundary

The proposal reference CSS may include selectors demonstrating the surface-aware dark-shell fix. Those selectors remain under `visual-proposal/r8-complete-product/prototypes/` and are not linked into production by this visual track.

## Final-main reconciliation trigger

At the final product checkpoint, re-inventory Legacy and all dynamically loaded import/restore/recovery states. Any new state added by the main developer automatically becomes part of this contrast and accessibility contract before senior handoff.