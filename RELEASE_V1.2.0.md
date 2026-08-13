# Career Mode Showdown v1.2.0 Release Record

Release date: 2026-08-13
Release tag: `v1.2.0`
Runtime asset revision: `1.2.0-r1`
Status: RELEASE CANDIDATE — immutable source SHA and deployed production proof are assigned only after the protected merge and GitHub Pages validation complete.

## Scope

v1.2.0 is the Installable Offline App milestone from the approved post-v1 roadmap. It adds an installable local-first application shell without changing the competition, persistence authority, or Candidate A/B/C data-safety contracts.

The release candidate includes:

- a Web App Manifest and original Showdown 17 install artwork;
- a version-owned first-party application-shell cache;
- atomic service-worker installation that discards an incomplete new cache rather than replacing the active known-good runtime;
- explicit user-controlled Update Ready activation at safe application boundaries;
- whole-runtime cache selection so a corrupted revision never silently borrows individual files from another revision;
- verified offline status and explicit degradation for external YouTube media;
- local install guidance for Chromebook/Android and browser-appropriate fallback guidance elsewhere;
- focused browser proof for online install, offline boot, exact local-data preservation, optional Candidate A/B/C loading, repeat online recovery, failed cache population, explicit update activation, corruption recovery, unrelated-cache preservation, and two complete upgrade/recovery cycles.

## Protected invariants

v1.2.0 does not alter:

- exactly two managers;
- Showdown lengths `[1,3,5,10]`;
- same selected league with different permanent clubs;
- the maximum-11 season scoring system or 0–0-only tiebreak;
- League confirmation or Club rivalry confirmation checkpoints;
- the Transfer Challenge state machine;
- the Season Review persistence boundary;
- Statistics, Legacy, and Trophy calculations;
- centralized Smart Back/navigation ownership in `js/screens.js`;
- the three canonical localStorage keys or `js/storage.js` persistence authority;
- Candidate A non-mutating backup format v1;
- Candidate B read-only import analysis;
- Candidate C immutable confirmed intent, exact raw snapshots, transaction-owned rollback, and anti-clobber semantics;
- the protected Marco Reus and licensed football-photo presentation;
- the protected startup budgets;
- local-first operation.

## Validation policy

The pre-release candidate must pass all existing protected workflow families plus the new single-owner offline lifecycle evidence in Stability. The expensive offline lifecycle is not duplicated into specialist workflows. A final production proof is recorded only after the merged `main` revision is byte-coherent on GitHub Pages and the deployed Stability boundary passes.