# R9 Slice 5 — Season Results Acceptance Evidence Plan

Base main: `47cbfbaba083e1eb35c06d687cceceb799e34920`
Runtime: `1.9.1-r44`

## Existing browser evidence already in r44

The current repository already contains strong independent proofs. R9 should extend them rather than duplicate their protocol logic.

| Stage | Existing browser evidence | Current viewport evidence | What it already proves |
| --- | --- | --- | --- |
| private result entry / review / publish | `tests/browser/shared-season-results-audit.cjs` | 1280×800 + 390×844 | own form only; rival hidden; review fingerprint; immutable publish; first publisher cannot see rival; RESULTS_READY reveals both |
| coordinator commit + both acknowledgements | `shared-season-commit-audit.cjs` | 1280×800 + 390×844 | coordinator-only commit; peer waiting; acknowledge flow; stale CAS retry; both acknowledged |
| canonical score | `shared-canonical-scoring-audit.cjs` | 1280×800 + 390×844 | authoritative score panel; exact totals/breakdown/winner; both roles |
| history convergence | `shared-history-convergence-audit.cjs` | 1280×800 + 390×844 | authoritative identical accepted history; records/trophies; fail-closed stale/denied cases |
| next-season progression + Dashboard | `shared-multi-season-progression-audit.cjs` | 1280×800 + 390×844 | visible-history witness; exact-once next-season cursor; authoritative Dashboard totals/season |
| final reconciliation | `shared-final-reconciliation-audit.cjs` | no real viewport contract | identical terminal projection, no additional season, no canonical local writes, stale-context discard |
| terminal close | `shared-terminal-close-audit.cjs` | no real viewport contract | exact terminal witness, provider close, CLOSED replay, no second close |

## R9 evidence gaps

### Gap A — one integrated visible authority stack

No single browser visual audit currently proves that the complete Season Results route remains legible and correctly prioritized as modules progressively mount into the same `#seasonReviewPanel`.

R9 should add one visual audit that walks or fixtures these states in the same DOM:

1. entry
2. own review
3. own published / waiting
4. both published
5. commit required
6. acknowledgement required
7. canonical score
8. history converged
9. continue next season
10. final reconciliation
11. terminal READY
12. terminal BLOCKED
13. terminal RECOVERY_PENDING
14. terminal CLOSED

The test should not reimplement provider protocols. It should reuse or stub the same production adapter state boundaries already used by the existing focused audits.

### Gap B — Chromebook composition

Current focused Season Results browser audits use 1280×800 desktop. R9 acceptance additionally needs:

- 1366×768 Chromebook-sized viewport
- no horizontal overflow
- current primary action visible without an unnecessary full-page hunt
- long status text wraps without covering controls
- two-manager content can collapse safely when vertical space is constrained

### Gap C — Final Reconciliation and Terminal Close visual browser evidence

The current final/terminal tests strongly prove state semantics but do not carry real viewport/layout assertions.

R9 needs visible DOM proof for:

- final reconciliation panel placement after history/multi-season material
- no “next season” CTA on terminal season
- READY close CTA hierarchy
- BLOCKED state with no fake close success
- RECOVERY_PENDING with exactly the real same-witness retry control
- CLOSED state with close/retry hidden

### Gap D — software keyboard / iPhone physical acceptance

Automated 390×844 geometry is not enough for:

- numeric field keyboard
- scrolling from a focused result field into Review
- sticky/fixed elements, if any, not covering input
- returning from background while waiting for rival publication

This remains a physical gate on iPhone Safari.

## Proposed R9 browser audit

New file, after visual implementation:

`tests/browser/r9-shared-season-authority-visual-audit.cjs`

Required viewport matrix:

- 1366×768 — Chromebook target
- 390×844 — phone target
- optionally 320×700 — narrow stress target

Required assertions:

- `document.documentElement.scrollWidth <= document.documentElement.clientWidth`
- only eligible primary action has visual/action prominence
- hidden private rival result remains absent before `RESULTS_READY`
- runtime-created panels preserve DOM order
- no duplicate IDs for any action/panel
- no duplicate Publish / Commit / Acknowledge / Continue / Close controls
- terminal states cannot expose a next-season action
- recovery pending exposes `#sharedTerminalCloseRetry`, not a new retry control
- CLOSED hides both terminal mutation controls
- reduced-motion still preserves all information

## Merge rule

Do not merge a Season Results visual implementation until:

1. all existing focused audits remain green,
2. the R9 integrated visible-stack audit is green,
3. 1366×768 and 390×844 screenshots/geometry are reviewed,
4. iPhone + Chromebook physical acceptance is complete.
