# NEXT TASK — Career Mode Showdown

Last updated: 2026-08-12

Application version: v1.1.4

Runtime asset revision: `1.1.4-r1`

Current production runtime authority: `1a498441a6ccf557aa8b8bc7ced2b3d9cd22cdf7`

GitHub Pages deployment: `5877215224`

## Current baseline: v1.1.4 Stable / Candidate C Complete

Release status: DEPLOYED / TWICE-PROVEN / PROTECTED

Candidate A — Versioned Backup Envelope + Non-Mutating Export — is complete, deployed and protected.

Candidate B — Import Analysis + Migration Preview — is complete, deployed and protected. Candidate B remains strictly read-only.

Candidate C — Atomic Restore + Recovery UX — is complete, merged, deployed, twice-proven in production and protected.

Do not restart Candidate C planning, do not reopen v1.1.4 release-freeze work, and do not treat later documentation-only commits as a new application runtime authority when runtime files remain byte-identical to `1a498441a6ccf557aa8b8bc7ced2b3d9cd22cdf7`.

## v1.1.4 closure evidence

Frozen pre-merge candidate: `814c1935824f19144b0b6c41243da71047a3224b`.

Pre-merge proof:

- 14/14 permanent workflow families passed twice independently on that same SHA;
- Candidate C dedicated browser recovery ran twice per matrix;
- Stability ran two complete Chromium cycles per matrix with Candidate A/B/C included;
- Candidate C Release Burn-In passed 5/5 per matrix;
- final Candidate C responsive/recovery screenshots were manually inspected;
- PR #24 merged only with expected-head protection.

Production proof:

- immutable runtime merge SHA `1a498441a6ccf557aa8b8bc7ced2b3d9cd22cdf7`;
- Pages deployment `5877215224` successful;
- all 14 permanent main workflow families passed on production attempt 1;
- every permanent workflow was rerun without changing bytes and passed again as attempt 2;
- Candidate C run `31640089247` passed both attempts;
- Burn-In run `31640089314` passed 5/5 twice;
- Stability run `31640089289` passed both attempts, including two independent public exact-byte/Candidate A/B/C/full-journey proofs.

See `CAREER_MODE_SHOWDOWN_V1.1.4_POST_MERGE.md` for exact evidence.

## Candidate C contract now locked

Do not weaken or reinterpret these behaviors during later milestones:

1. backup and user choices are freshly revalidated before Apply;
2. exact raw active/Legacy/preferences bytes or absence are snapshotted before mutation;
3. final restore values are fully computed in memory before the first write;
4. writes remain under existing storage authority;
5. affected keys commit in deterministic active → Legacy → preferences order;
6. every write is verified;
7. any failure restores every affected key to exact raw pre-restore state;
8. rollback is verified byte-for-byte;
9. unverified rollback enters locked critical recovery;
10. runtime/in-memory state changes only after complete success;
11. corrupt raw bytes are preserved;
12. repeated import remains deterministic/idempotent.

The permanent failure suite protects first/middle/final write failures, quota/storage exceptions, post-write mismatch, rollback failure, absent raw keys, corrupt bytes, same-ID Legacy conflicts, stale reviewed state, rapid/double Apply, lifecycle interruption, desktop/Chromebook, mobile DPR2, reduced motion, focus, overflow, footer-safe controls and 44 px touch targets.

## Protected systems

The next milestone must preserve:

- exactly two managers;
- Showdown lengths `[1,3,5,10]`;
- same selected league / different permanent clubs;
- max-11 scoring and 0–0-only tiebreak logic;
- explicit League selection Continue checkpoint;
- explicit Club rivalry-confirmation checkpoint;
- Transfer Challenge state machine;
- Season Review persistence boundary;
- Statistics/Legacy/Trophy calculations;
- `js/screens.js` route/history authority;
- `js/storage.js` canonical persistence authority;
- Candidate A export semantics;
- Candidate B read-only analysis semantics;
- Candidate C atomic restore/recovery semantics;
- accepted football-photo provenance/crop-safe presentation;
- accepted Marco Reus Home/loading separation and loading presentation;
- startup ceilings of 165,000 raw eager code bytes, 37,500 gzip eager code bytes, 95,000 portrait bytes and 260,000 combined first-party startup bytes.

## Next substantive roadmap task: v1.2.0 — Installable Offline App

v1.2.0 is now the next legal milestone because v1.1 Data Safety and Recovery is closed.

Follow the exact dependency-ordered scope in `POST_V1_ROADMAP_EXECUTION.md`. Before implementation, inspect current source and the roadmap’s v1.2.0 section rather than inventing a generic PWA design.

The v1.2.0 milestone may add the documented installable/offline-app capabilities while preserving the existing static GitHub Pages architecture and local data model unless the roadmap explicitly authorizes otherwise.

Do not jump ahead to:

- profiles/save registry;
- cloud/accounts;
- QR pairing;
- two-device live play;
- public rankings.

Those remain dependency-blocked behind later milestones and their own security/privacy/reliability decisions.

## Required continuation reading

A fresh developer must begin with:

1. `00_HANDOFF_GOLDEN_RULE.md`;
2. `00_DEVELOPER_START_HERE.md`;
3. this `NEXT_TASK.md`;
4. `PROJECT_STATE.md`;
5. `CAREER_MODE_SHOWDOWN_V1.1.4_POST_MERGE.md`;
6. `RELEASE_V1.1.4.md`;
7. `POST_V1_ROADMAP_EXECUTION.md`;
8. current `main` source;
9. Candidate C rolling/release handoffs only when deeper v1.1 data-safety archaeology is needed.

Start from current `main`. Do not resume old Candidate A/B/C, v1.1.4 freeze or visual branches.
