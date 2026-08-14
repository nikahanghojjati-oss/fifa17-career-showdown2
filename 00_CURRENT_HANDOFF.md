# Career Mode Showdown — Current Complete Handoff

Last updated: 2026-08-13 ET
Repository: `nikahanghojjati-oss/fifa17-career-showdown2`
Public site: `https://nikahanghojjati-oss.github.io/fifa17-career-showdown2/`
Application: v1.3.0 — Recovery & Device Resilience Hardening
Production runtime: `1.3.0-r1`
Previous known-good runtime: `1.2.0-r2`
Technical status: merged, deployed, exact-byte verified and production-proven
Release PR: #42
Runtime merge: `094401b649954656e27e4a92d027e9532e84ccbf`
Production proof: `V1.3.0_PRODUCTION_PROOF.md`
Stability: `31755136265` / deployed-site-smoke `94629478166`
Release Integration Burn-In: `31755136240` — 2/2

This is the active continuation handoff required by `00_HANDOFF_GOLDEN_RULE.md`. Current verified source, later explicit owner decisions, this file, `PROJECT_STATE.md` and `NEXT_TASK.md` outrank stale historical prose.

## What shipped in v1.3

v1.3 hardened the existing Installable Offline App without changing gameplay, scoring, the proven shell or the three-key canonical storage model.

Candidate A blocked reads fail closed. Candidate B remains read-only. Candidate C destructive Apply requires strict exact raw snapshot authority and otherwise performs no mutation. Candidate C retains immutable confirmed intent, freshness barriers, complete planning, last-moment prewrite checks, transaction-owned mutation and rollback, anti-clobber ownership, exact verification and critical recovery.

Service Worker activation now cannot acknowledge success before whole-shell verification and successful `skipWaiting()`. Registration reuse, reconnect-state restoration, Settings focus preservation, whole-shell cache recovery and exact localStorage byte preservation through PWA lifecycle transitions remain protected.

## Production proof

The frozen candidate `b8d92e9a8a9eec2820c439c0dd2699e9d825a91f` passed all 13 normal PR workflow families together twice: once on PR #40 and again on release PR #42.

PR #42 merged at `094401b649954656e27e4a92d027e9532e84ccbf`.

Post-merge evidence:

- Pages `31755135819` succeeded;
- Stability `31755136265` succeeded;
- deployed-site-smoke `94629478166` verified exact public runtime bytes, provenance, Home, football visuals, Candidate A/B/C, install/offline behavior and the complete public journey;
- Burn-In `31755136240` passed 2/2 independent complete stateful journeys.

Automated technical production proof is complete. Do not invent owner visual acceptance; later owner screenshots or complaints are separate evidence.

## Locked product model

Exactly two managers. Showdown lengths 1/3/5/10. Same selected league, different permanent clubs. Existing scoring and 11-point maximum remain locked. Equal non-zero scores are Draw. Only 0–0 uses league position then league points.

## Architecture and data authority

`js/screens.js` is navigation/history/Smart Back authority. `js/storage.js` is canonical persistence/destructive mutation authority. `js/storageTransaction.js` is the raw transaction engine. `js/scoring.js` and `js/analytics.js` retain their authorities.

Exactly three canonical localStorage keys remain legal:

1. `careerModeShowdown.activeShowdown`
2. `careerModeShowdown.legacyShowdowns`
3. `careerModeShowdown.preferences`

The Service Worker and Cache Storage store versioned application bytes only and never canonical user data.

## Installable Offline App and visual locks

Current shell `1.3.0-r1` falls back only to immediate previous known-good whole shell `1.2.0-r2` when that shell is complete and verified. Never assemble a runtime from files across revisions.

Install/update presentation remains Settings-only.

Preserve the r2 iOS installed-app loading correction: bounded mobile top band, independent subject-safe Marco Reus image box, width-owned composition and opacity/filter-only animation. The historical defect was viewport-height behavior, not a bad image asset.

## Validation and performance locks

There are 14 permanent workflow families and 27 protected multiline executable blocks. Normal PRs run 13; Burn-In remains main/manual release-only.

Performance ceilings remain eager raw <=165,000 bytes; eager gzip <=37,500; Reus portrait <=95,000; combined startup <=260,000; normal loading minimum 2700 ms; reduced-motion loading 220 ms.

## Branch and tool history

PR #37 / `agent/v13-hardening` remains untrusted and must not be merged or used as a source baseline. Its historical alternate-shell replacement and lockfile remain rejected.

PR #40 is now the detailed v1.3 salvage/audit record. PR #42 is the actual release PR. The isolated `agent/v13-identity-blob-staging` branch remains staging residue only and is not merge authority.

Issue #41 (`TEMP IGNORE`) was an accidental prior-session tool-routing artifact and remains closed `not_planned`; do not reopen it.

In the v1.3 production-seal session an attempted post-merge PR #42 body update was blocked by the connector safety layer before any mutation. No source, branch or production state changed from that blocked operation. Production evidence is recorded in repository release/proof documents instead.

## Quality-first handoff policy publication — 2026-08-13 ET

The owner explicitly required proactive fresh-chat handoff to become permanent repository policy whenever a clean handoff would preserve engineering quality, correctness and continuity better than continuing a context-heavy session.

Session start authority was `main` `0d06a85cffddeaa19790ae1c7cb223bc3116a002`. The pending policy commit `493892525eb36b26ce867118f82d96de78ba6134` on `agent/v13-production-seal` was independently rechecked before publication. Its base-relative change was exactly one file, `00_HANDOFF_GOLDEN_RULE.md`, with +32 / -1 and no runtime, tests, packages, assets, gameplay, persistence, PWA, performance or visual source changes.

PR #44 — `Strengthen quality-first handoff policy` — was opened against `main` and merged with expected head `493892525eb36b26ce867118f82d96de78ba6134`. Policy merge authority is `4fca8015edb250b1ff9da3c766374456188999da`.

All ten workflows applicable to this Markdown-only PR passed:

- Validate Final Polish `31757153617`;
- Validate Statistics Workstream `31757153569`;
- Validate Season Review `31757153529`;
- Validate Settings Workstream `31757153541`;
- Validate Static App `31757153638`;
- Validate Transfer Workstream `31757153562`;
- Validate League Confirmation `31757153558`;
- Validate Home Bootstrap `31757153589`;
- Validate V1 Visual Immersion `31757153560`;
- Validate Licensed Football Visuals `31757153536`.

The other three normal PR workflow families — Candidate C Atomic Restore, Candidate B Import Analysis and Stability Lane — explicitly use `paths-ignore: "**/*.md"`, so their absence on this documentation-only PR is expected and not missing validation.

One read-only connector attempt to fetch the GitHub compare `.diff` URL returned 404. No mutation occurred. The actual PR patch was then verified successfully through the GitHub PR diff action before merge.

After PR #44, production application/runtime authority remains unchanged at `v1.3.0` / `1.3.0-r1`; immediate previous whole shell remains `1.2.0-r2`; owner visual/product acceptance remains separate from technical proof.

This handoff publication seal is being made from branch `agent/handoff-policy-publication-seal`, based on policy merge `4fca8015edb250b1ff9da3c766374456188999da`. It is documentation-only and must not be interpreted as a runtime release.

## Current legal next action

v1.3.0 — Recovery & Device Resilience Hardening is technically production-proven. Preserve and observe the baseline. Do not begin Local Profiles/Save Library, cloud, accounts, QR pairing, synchronization, gameplay/scoring changes or framework migration without current explicit authority.

At the next session start, fetch `main` again because documentation seal commits may have advanced repository head after the immutable runtime merge `094401b649954656e27e4a92d027e9532e84ccbf`.
