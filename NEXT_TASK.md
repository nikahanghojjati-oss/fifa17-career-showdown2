# NEXT TASK — Career Mode Showdown

Last updated: 2026-08-11

Application version: v1.1.1

Runtime asset revision: `1.1.1-r1`

## Current baseline: v1.1.1 Maintenance Candidate

Candidate A — **Versioned Backup Envelope + Non-Mutating Export** — remains complete, merged, deployed and protected.

The owner-directed v1.1.1 James Rodríguez source-refresh runtime is now technically complete. It was merged from the exact twice-validated PR head, deployed to GitHub Pages, and the permanent release/workstream matrix was executed twice again against the same immutable production runtime.

Runtime implementation authority:

`29caae874bf00deba89bdb1ffcfc0654ead3928f`

Documentation may advance beyond that SHA without creating a new runtime build when only Markdown authority files change.

## v1.1.1 visual authority

The active James derivative remains exactly:

- asset: `assets/football/james-rodriguez-real-madrid-2016-smart-v111.webp`;
- Commons source: `James Rodríguez in September 2016 - 02.jpg`;
- author/source: Real Madrid;
- license: CC BY 3.0;
- source/output geometry: 863 × 1080;
- source-pixel full-frame policy: `[0, 0, 863, 1080]`;
- runtime framing: `object-fit: contain`, zero secondary crop;
- clean-anchor and face-safe diagonal architecture preserved.

The replaced `james-rodriguez-real-madrid-2019-smart-r5.webp` must not return to active runtime authority.

Protected Reus, Rashford, Martial, Messi and Lahm visual/source decisions remain unchanged unless the owner supplies new evidence for one of those surfaces.

## Completed technical release proof

Pre-merge:

- every permanent feature/workstream/release gate family passed twice on one frozen final PR SHA;
- the second execution was independent evidence, not a different source candidate;
- real Chromium visual evidence was inspected manually in addition to machine gates.

Production:

- GitHub Pages deployed the exact runtime merge;
- every permanent gate family received two successful production executions on the same runtime merge;
- Release Burn-In completed two successful five-way independent comparison sets;
- Licensed Football Visuals completed two successful production browser executions;
- Stability obtained two complete successful production proofs, each including contracts, two Chromium cycles and a public deployed-site smoke;
- the successful public smokes proved exact runtime-byte parity, runtime-error provenance, Home/Reus, licensed football visuals, Candidate A backup/export and the complete gameplay/navigation journey.

One intermediate second-production Stability attempt is intentionally rejected rather than counted: a GitHub runner returned a single `fetch failed` for `assets/football/asset-manifest.json`. No different hash or byte length was observed. The entire Stability family was restarted from its root and passed completely afterward. See `CAREER_MODE_SHOWDOWN_V1.1.1_POST_MERGE.md` for exact evidence.

No release threshold or startup budget was weakened to obtain green status.

## Current owner decision gate

Technical release status:

`COMPLETE, MERGED, DEPLOYED, TWICE-VALIDATED PRE-MERGE AND PRODUCTION`

Owner art-direction acceptance of the refreshed James source:

`PENDING REAL-DEVICE REVIEW`

Do not infer owner visual approval from CI, browser screenshots or developer inspection.

If the owner rejects a reproduced James visual detail:

1. remain inside finite v1.1.x maintenance;
2. reproduce the exact public/device problem;
3. change only evidence-driven source/presentation behavior;
4. preserve gameplay, storage schema, routing, Transfer state, Season scoring, Candidate A semantics and unrelated protected visuals;
5. rerun the strengthened visual/release gates on the corrected candidate.

If the owner accepts the refreshed James visual or explicitly defers further visual review, Candidate B becomes the current substantive roadmap task.

## Next substantive roadmap candidate

Candidate B — **Import Analysis + Migration Preview**.

Candidate B remains read-only/dry-run. It must perform zero canonical `localStorage.setItem()` and zero canonical `localStorage.removeItem()` operations.

Required Candidate B outcomes:

- bounded backup-file/input size before expensive parsing where browser APIs permit;
- JSON parsing in isolation;
- backup `formatId` / `formatVersion` validation;
- checksum verification;
- active Showdown, Legacy and preferences schema validation;
- rejection of unsupported future backup/data formats;
- ordered, deterministic, non-mutating migrations for supported historical fixtures;
- duplicate/conflict classification using existing Showdown IDs as strings for v1.1;
- explicit dry-run summary of active/Legacy/preferences changes;
- clear warnings/errors for corrupt, unsupported or ambiguous records;
- zero storage mutation during analysis/preview;
- Chromebook/mobile/keyboard/touch/accessibility and large-input coverage;
- no profile/save-registry identity redesign in Candidate B.

Candidate C — **Atomic Restore + Recovery UX** — remains blocked behind Candidate B evidence. Candidate C alone may introduce restore writes and must preserve complete rollback/rollback-verification authority through `js/storage.js`.

Do not jump to PWA, profiles/save registry, cloud, accounts, QR pairing or two-device work before their dependency gates are reached.

## Required continuation reading

A fresh developer should begin with:

1. `00_DEVELOPER_START_HERE.md`;
2. this `NEXT_TASK.md`;
3. `CAREER_MODE_SHOWDOWN_V1.1.1_JAMES_SOURCE_REFRESH_HANDOFF.md`;
4. `CAREER_MODE_SHOWDOWN_V1.1.1_POST_MERGE.md`;
5. the Candidate B sections of `POST_V1_ROADMAP_EXECUTION.md`;
6. the live source files named by Candidate B before deciding implementation boundaries.

Do not restart from r4/r5 visual branches or reconstruct the project from old chat chronology before using current repository authority.