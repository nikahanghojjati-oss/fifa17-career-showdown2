# NEXT TASK — Career Mode Showdown

Last updated: 2026-08-13 ET

## Current milestone

v1.3.0 — Recovery & Device Resilience Hardening

Frozen candidate identity: `v1.3.0` / `1.3.0-r1`
Immediate previous known-good whole shell: `1.2.0-r2`
Production remains the v1.2.0 Installable Offline App / `1.2.0-r2` until merge and public production proof are complete.

## Immediate task

Prove the frozen v1.3 candidate at the exact PR #40 head. Do not add feature scope while candidate validation is running.

First inspect the specialist release/static/offline/performance contracts for identity coherence:

- application version `1.3.0`;
- runtime `1.3.0-r1`;
- Service Worker previous known-good whole shell `1.2.0-r2`;
- full proven r2 DOM preserved;
- package, lockfile, manifest, eager asset queries, Reus Home thumbnail and release records coherent;
- `CMS_ACTIVATE_UPDATE` cannot acknowledge success before successful `skipWaiting()` resolution;
- Candidate C Apply requires strict exact raw snapshot authority or performs no mutation;
- startup performance ceilings unchanged.

Then require all 13 normal PR workflow families to pass together at the same exact candidate head. There are 14 permanent workflow families total; Release Integration Burn-In remains main/manual release-only. There are 27 protected multiline executable blocks.

Do not push a documentation-only synchronization commit while heavy Stability, Candidate B, Candidate C or other authoritative proof is already running. If public continuity must be updated without changing candidate source, use the PR body.

## Failure handling

If any workflow fails, classify it before changing source:

1. real product defect;
2. browser/test-runtime defect;
3. flaky infrastructure;
4. CI ownership/configuration defect;
5. stale contract assumption.

Do not weaken product assertions, visual geometry gates, recovery checks or performance ceilings merely to make CI green.

## Protected recovery model

Exactly three canonical localStorage keys remain legal. Candidate A is non-mutating export. Candidate B is strictly read-only analysis. Candidate C is the only import stage allowed to mutate canonical state and retains immutable confirmed intent, strict exact raw snapshot/preconditions, freshness rechecks, complete in-memory planning, transaction-owned mutation and rollback, anti-clobber ownership, exact post-write verification, byte-for-byte rollback verification and critical recovery when ownership is uncertain.

The Service Worker and Cache Storage remain application-byte authorities only and may not mutate user data.

## Protected product and presentation

No gameplay, scoring, navigation, persistence-schema, manager-profile, Save Library, cloud, account, synchronization, QR pairing, framework or broad UI work belongs in this candidate proof stage.

Protect the r2 iOS installed-app loading composition and the Settings-only install/update hierarchy. Preserve subject-safe football imagery and the proven FIFA 17-inspired menu shell.

## Exit sequence

When every normal PR workflow family is green at the exact candidate head and release authority is coherent:

1. review the exact PR #40 diff one final time for mixed identity, stale previous-known-good references or shell replacement;
2. keep PR #37 untrusted and unmerged;
3. merge through the normal protected path only when the candidate is genuinely release-ready;
4. verify GitHub Pages deployment;
5. run exact deployed runtime-byte/provenance verification and deployed Stability/public journey;
6. run the required Release Integration Burn-In;
7. only after public proof promote README/CHANGELOG and call v1.3.0 technically production-proven.

Owner visual acceptance remains separate from automated technical proof.
