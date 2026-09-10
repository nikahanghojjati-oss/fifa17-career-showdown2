# R8 Screen Contract 12 — Legacy / legacy

Status: ACTIVE PROPOSAL CONTRACT — proposal-only, not production authority

Study anchor: production main `cef2e101f23fd8cb777f71950bac8f0f8d9f2c7b`, app `v1.9.1`, runtime `1.9.1-r12`.

## Purpose

Legacy is an archive and data-management surface. It belongs to R8 Level B/C presentation: charcoal archival cards, restrained warm-gold accents, strong information hierarchy and maximum clarity for backup/import/recovery controls. Decorative character art is not required.

## Known prototype defect carried into this contract

The isolated dark-shell prototype exposed a real contrast failure because the existing `.legacySectionHeading` inherits `var(--f17-ink)` (`#20272d`) while the R8 global shell is approximately `#080b0e`.

Measured contrast is approximately 1.3:1. The normal-text accessibility target is at least 4.5:1.

This is a proposal defect that must be resolved before senior implementation. It is not permission for the visual track to patch `main`.

## R8 Legacy palette

Reference colors for the proposal:

- shell: `#080b0e`
- primary archive/data panel: `#11171d`
- raised panel: `#151d24`
- primary text: `#f4f0e6`
- secondary text: `#b5bdc4`
- tertiary readable text: `#99a3ab`
- warm gold: `#d4af37`
- light gold: `#e3c565`
- cyan informational accent: `#91dcf4`
- success: `#7fd1ae`
- destructive/error: `#ff6b73`

Reference contrast against `#080b0e`:

- `#f4f0e6`: ~17.33:1
- `#b5bdc4`: ~10.37:1
- `#99a3ab`: ~7.69:1
- `#d4af37`: ~9.38:1
- `#ff6b73`: ~7.14:1

Reference contrast against `#11171d`:

- `#f4f0e6`: ~15.85:1
- `#b5bdc4`: ~9.48:1
- `#99a3ab`: ~7.03:1
- `#d4af37`: ~8.58:1
- `#ff6b73`: ~6.53:1

These pairings provide comfortable margin above 4.5:1 and avoid relying on browser opacity for essential copy.

## Existing real surface families to preserve

The proposal must cover, without changing data authority:

- top Legacy statistics;
- archive section headings;
- empty archive state;
- completed Showdown cards;
- expandable season-history rows;
- manager/score/honours rows;
- ordinary card actions;
- destructive delete actions;
- data-management controls;
- backup/export summary and status;
- import-analysis/drop-zone flow;
- import readiness/blocked verdicts;
- migration/conflict/messages summaries;
- corrupt/unavailable/fail-closed states;
- restore/recovery transitions exposed by the current product.

## Visual treatment

### Archive content

Use near-black shell plus charcoal panels. Completed Showdown cards may keep a slightly more cinematic gradient, but archive scanning must remain more important than atmosphere. Warm gold is used for archive anchors, active disclosure/focus and important competition values, not for every border.

### Section headings

Every heading that sits directly on the dark shell must use high-contrast light text. The proposal reference uses `#f4f0e6` with the existing left gold rail. This directly resolves the discovered `.legacySectionHeading` failure.

### Statistics

Replace light-paper statistics cards with charcoal Level B panels in the proposal. Labels use readable secondary text. Values use cream/white or gold only where semantic emphasis is intended.

### Empty state

Empty Legacy is not an error. Use a calm charcoal panel, cyan/neutral accent rail and readable secondary text. Do not use low opacity as the only empty-state distinction.

### Data management, import and recovery

These are Level C surfaces. Reduce cinematic decoration. Keep copy at normal readable proportions, separate primary safe actions from destructive actions, and use explicit status text plus color rather than color alone.

Drop zones must preserve visible keyboard focus. Import blocked/error states use red only when the product state is actually blocked/destructive. Readiness/success uses green only when confirmed by product authority.

## Proposal-only reference CSS

See:

`prototypes/legacy/r8-legacy-dark-shell-reference.css`

The reference CSS is deliberately scoped under `[data-r8-proposal-theme="dark"] #legacy` so it cannot be mistaken for an unbounded production patch. It demonstrates the intended contrast/panel migration while preserving existing DOM and semantics.

## Responsive contract

Wide desktop:

- preserve three-column summary statistics when content remains readable;
- completed Showdown card title, matchup and actions may share one row;
- expanded season history retains clear left/right manager reading.

Chromebook/tablet:

- prioritize archive readability over compactness;
- allow summary statistics and card internals to collapse before type shrinks;
- data-management actions may wrap into clear rows.

Mobile:

- stack summary statistics;
- stack card title/matchup/actions;
- stack season-history cells or preserve a safe horizontal representation only if existing architecture does so cleanly;
- make destructive and primary data actions full-width when needed;
- long imported file names/capability IDs must wrap or scroll safely rather than overflow.

## Focus and state QA

The final proposal QA for Legacy must separately verify:

1. ordinary archive with completed Showdowns;
2. empty archive;
3. corrupt/fail-closed archive fixture;
4. backup/export ready and status states;
5. import analysis idle;
6. import file selected;
7. import ready;
8. import blocked/conflict;
9. recovery review/apply state where surfaced;
10. destructive confirmation/error;
11. keyboard focus on disclosure, import drop zone and action buttons;
12. mobile overflow;
13. reduced motion.

Passing the ordinary archive is not sufficient evidence for the corrupt/recovery paths.

## Asset decision

No new raster or character generation is required.

Legacy is intentionally solved through real DOM, type hierarchy, CSS geometry, original state icons only if later proven useful, and the proposal reference styling. This is an explicit asset-matrix resolution, not a missing asset.

## Senior implementation constraints

Senior implementation must reconcile this reference against final `main` and current lazy-loaded `legacy.css`/restore/import surfaces. It should use an R8-scoped presentation layer rather than rewriting persistence, backup, import or recovery behavior.

The visual track does not apply this CSS to `main`, does not change Legacy data semantics and does not deploy it.