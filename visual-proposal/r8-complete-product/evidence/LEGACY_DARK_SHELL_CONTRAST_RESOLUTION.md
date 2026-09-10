# Legacy Dark-Shell Contrast Resolution Evidence

Status: PROPOSAL TOKEN CHECK PASSED — FULL BROWSER STATE SWEEP STILL REQUIRED

Verification date: 2026-09-10

## Original isolated-prototype failure

Foreground: `#20272d`

Background: `#080b0e`

Computed WCAG contrast ratio: `1.305:1`

Result: FAIL for normal text and FAIL for large text.

This reproduces the approximately 1.3:1 defect carried forward by R8.26.

## Proposed direct-on-dark-shell tokens

### Primary cream text

Foreground: `#f5f0e4`

Background: `#080b0e`

Computed contrast ratio: `17.347:1`

Result: PASS AA and AAA for normal text.

### Gold accent text / rails when text is genuinely used

Foreground: `#f3cc4f`

Background: `#080b0e`

Computed contrast ratio: `12.739:1`

Result: PASS AA and AAA for normal text.

### Muted supporting text

Foreground: `#bdb49a`

Background: `#080b0e`

Computed contrast ratio: `9.543:1`

Result: PASS AA and AAA for normal text.

### Dark text on cream nested cards

Foreground: `#10151a`

Background: `#f5f0e4`

Computed contrast ratio: `16.139:1`

Result: PASS AA and AAA for normal text.

### Reserved danger text on dark shell

Foreground: `#dc6f6f`

Background: `#080b0e`

Computed contrast ratio: `6.150:1`

Result: PASS AA for normal text. Danger meaning must still be explicit in text and not color-only.

## Proposal implementation consequence

The fix is surface-aware:

- `.legacySectionHeading` and other text directly on the R8 dark shell use cream/high-contrast tokens;
- intentionally light nested cards continue using dark foreground tokens;
- the proposal does not apply one global cream color to every `.legacy*` selector;
- import-analysis, preview, backup and restore cards must each be tested using their actual foreground/background pair.

Reference selectors are recorded in `prototypes/r8-proposal-reference.css`.

## What this evidence does not prove yet

This token calculation does not replace full browser QA.

Still required before final senior handoff:

- ordinary Legacy populated state;
- Legacy empty state;
- corrupt/fail-closed state;
- backup/export state;
- import analysis and preview states;
- restore plan incomplete/ready/applying states;
- critical recovery;
- focus indicators on light and dark nested surfaces;
- disabled/destructive controls;
- Chromebook/mobile responsive states.

The current environment's local headless Chromium did not successfully produce a screenshot during this session, so no browser screenshot is claimed here. The proposal contrast defect itself is resolved at the token/reference-design level, while full visual acceptance remains OPEN.