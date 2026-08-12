# Career Mode Showdown v1.1.3 — PR Diagnostic Addendum

This addendum continues the public v1.1.3 diagnostic trail after `CAREER_MODE_SHOWDOWN_V1.1.3_DIAGNOSTIC_LOG.md` and exists so the exact interrupted/resumed state is preserved without rewriting prior evidence.

## 2026-08-12 — diagnostic PR integrated matrix startup-budget failure

- PR: `#19` — `v1.1.3: fix League Wheel reroll and expand cinematic football visuals`.
- Diagnostic candidate before correction: `55872b8ec17b7abdfaff69bfa041a975cda6a73f`.
- Failing workflow: `Validate Final Polish`.
- Run: `31554204791`.
- Failing job: `93983121618` (`final-polish-contracts`).
- All earlier checks in that job passed; the failure occurred in `Validate accessibility and lightweight presentation budgets`.
- Exact failure: eager startup payload measured `165,213` raw bytes, exceeding the protected `165,000` raw-byte ceiling by `213` bytes.
- Classification: REAL PERFORMANCE-BUDGET GATE FAILURE.
- The protected budget was **not** raised. The protected gzip ceiling remains `37,500` bytes.
- Root correction strategy: compact redundant explanatory text in the already-correct League Wheel implementation; do not remove the wheel fix, visual features, regression state, accessibility behavior, or any release gate.

## Resume after ChatGPT interruption

- User explicitly requested retry from the interrupted point; the build was resumed from the open PR rather than restarted.
- Verified PR #19 remained open and mergeable with head `55872b8ec17b7abdfaff69bfa041a975cda6a73f` before the correction.
- Re-inspected the failing Final Polish log and confirmed the exact 213-byte raw overage.
- Correction commit: `513536ca52ead07449063b22e8efb6aa552f7fb5`.
- Correction file: `js/leagueWheel.js` only.
- The correction preserves all behavior and shortens comments/header text around the wheel-transition fix so the eager payload can return below the original limit without weakening the limit.
- The critical wheel behavior remains unchanged: transition is armed only for an explicit spin, disarmed on cancel/stale completion, and disarmed before the selected angle is normalized.

## Next validation action

Let PR #19 rerun the integrated permanent gate matrix on the corrected head. Any new failure remains diagnostic evidence and must be corrected/recorded before a frozen official two-pass pre-merge SHA is chosen.