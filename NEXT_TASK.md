# NEXT TASK — Career Mode Showdown

Last updated: 2026-08-13 ET

## Current milestone

v1.3.0 — Recovery & Device Resilience Hardening

Production identity: `v1.3.0` / `1.3.0-r1`
Immediate previous known-good whole shell: `1.2.0-r2`
Production proof: `V1.3.0_PRODUCTION_PROOF.md`

## Immediate task

The v1.3 implementation, merge, deployment and technical production proof are complete. Do not begin a new feature milestone automatically.

At the start of the next development session:

1. fetch current `main` and verify its exact SHA;
2. verify the public runtime remains `1.3.0-r1` and the immediate previous whole shell remains `1.2.0-r2`;
3. read `00_HANDOFF_GOLDEN_RULE.md`, `00_DEVELOPER_START_HERE.md`, `00_CURRENT_HANDOFF.md`, `PROJECT_STATE.md`, this file and `V1.3.0_PRODUCTION_PROOF.md`;
4. treat new owner reports, screenshots or reproducible failures as evidence and diagnose root cause before source changes;
5. preserve current production if no new evidence or explicitly authorized next milestone exists.

Owner visual acceptance remains separate from automated technical proof.

The shipped Installable Offline App baseline remains protected; the production seal changes publication authority only, not runtime behavior.

## Protected recovery model

Exactly three canonical localStorage keys remain legal. Candidate A is non-mutating export. Candidate B is strictly read-only analysis. Candidate C is the only import stage allowed to mutate canonical state and retains immutable confirmed intent, strict exact raw snapshot/preconditions, freshness rechecks, complete in-memory planning, transaction-owned mutation and rollback, anti-clobber ownership, exact post-write verification, byte-for-byte rollback verification and critical recovery when ownership is uncertain.

The Service Worker and Cache Storage remain application-byte authorities only and may not mutate canonical user data.

## Protected product and presentation

No gameplay, scoring, navigation, persistence-schema, manager-profile, Save Library, cloud, account, synchronization, QR pairing, framework or broad UI work is authorized merely by closing v1.3.

Protect the r2 iOS installed-app loading composition and the Settings-only install/update hierarchy. Preserve subject-safe football imagery and the proven FIFA 17-inspired menu shell.

## Validation authority

There are 14 permanent workflow families and 27 protected multiline executable blocks. Normal PRs run 13 families; Release Integration Burn-In remains main/manual release-only.

Do not weaken product assertions, visual geometry gates, recovery checks or performance ceilings to obtain green CI. Classify failures as product, browser/test-runtime, infrastructure, CI ownership/configuration or stale-contract defects before editing source.

## Production evidence

Release PR #42 merged candidate `b8d92e9a8a9eec2820c439c0dd2699e9d825a91f` at `094401b649954656e27e4a92d027e9532e84ccbf`.

Pages `31755135819`, Stability `31755136265`, deployed-site-smoke `94629478166` and Release Integration Burn-In `31755136240` all passed. Burn-In completed 2/2 independent stateful journeys.

## Future boundary

Local Profiles and Save Library remain approved future direction in the roadmap but have no automatically assigned current version and are not part of v1.3. Cloud, accounts, QR pairing and multi-device synchronization remain later dependency-gated work.

PR #37 remains untrusted historical work. Do not merge or revive its alternate shell.
