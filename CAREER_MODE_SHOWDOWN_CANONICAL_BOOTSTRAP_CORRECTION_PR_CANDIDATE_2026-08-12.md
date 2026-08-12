# Career Mode Showdown — Canonical Bootstrap Correction PR Candidate

Date: 2026-08-12
Scope: documentation-only coherence correction
Branch: `agent/fix-canonical-bootstrap-handoff`
Base `main`: `97d4a0391987ad765c19e019e544f6f95126dfb3`
Application runtime authority: `29760bbf33c974267bd1ad64d0839f73ad8051fa`
Application: `v1.1.3` / `1.1.3-r1`
Next substantive task remains: Candidate C — Atomic Restore + Recovery UX

## Work completed before freeze

The owner-requested historical handoff package was independently audited against the current repository, the official Aug 10 ChatGPT export and the supplied Grok review. The prior master handoff is retained as valid deep context.

A separate canonical-bootstrap defect was found in `00_DEVELOPER_START_HERE.md`: despite its v1.1.3 opening, later current-facing sections still pointed a new developer toward r5/Candidate A, listed obsolete James/Rashford/Martial visual authority, counted eleven rather than thirteen permanent gate families, and claimed the official ChatGPT export had not yet been supplied.

`00_DEVELOPER_START_HERE.md` has therefore been rewritten as a current-facing v1.1.3/Candidate C bootstrap. Historical chronology remains in dedicated release/handoff files instead of being allowed to masquerade as current instructions.

## Scope comparison before this freeze

Before this checkpoint commit, comparing branch head `3b0aaebeb04021081862d8cb090da7a41e8bc0f7` against base `97d4a0391987ad765c19e019e544f6f95126dfb3` showed exactly two changed files:

1. `00_DEVELOPER_START_HERE.md` — documentation rewrite only;
2. `CAREER_MODE_SHOWDOWN_CANONICAL_BOOTSTRAP_CORRECTION_HANDOFF_2026-08-12.md` — rolling audit/handoff only.

No HTML, CSS, JavaScript, image, data, package, test or workflow file changed.

This checkpoint file is the only additional change introduced by the freeze itself.

## Protected contracts explicitly preserved

- immutable v1.1.3 application runtime `29760bbf33c974267bd1ad64d0839f73ad8051fa`;
- max-11 scoring and 0–0-only tiebreak logic;
- exactly-two-manager/single-device/single-active-Showdown mode;
- `js/screens.js` navigation authority;
- `js/storage.js` sole persistence authority;
- Candidate A export semantics;
- Candidate B read-only analysis semantics;
- current twelve-image v1.1.3 route-scoped visual authority plus protected Marco Reus Home/loading presentation;
- 164,965 raw / 37,006 gzip protected eager result under unchanged 165,000 / 37,500 ceilings;
- all thirteen permanent release families;
- roadmap ordering with Candidate C first and v1.2 PWA still blocked until Candidate C closes v1.1.

## PR validation rule

The exact PR head produced by this checkpoint is the documentation candidate to validate. Diagnostic/fix runs must not be counted as proof if the head later changes.

Do not weaken runtime thresholds or change application bytes to satisfy documentation validation. If a gate fails, classify whether the defect is documentation, test harness, application, or infrastructure and correct only the responsible layer.

After the exact head is green, merge with expected-head protection, verify `main`/Pages state, and record final evidence using a non-recursive documentation seal.
