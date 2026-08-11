# NEXT TASK — Career Mode Showdown

Last updated: 2026-08-11

Application version: v1.1.2

Runtime asset revision: `1.1.2-r1`

## Current baseline: v1.1.2 Candidate B — Import Analysis + Migration Preview

Candidate A — Versioned Backup Envelope + Non-Mutating Export — remains complete, deployed and protected.

Candidate B is the current substantive Data Safety and Recovery build. It reads a selected local backup in isolation, validates it, previews supported migrations and classifies conflicts without changing canonical browser data.

Candidate C — Atomic Restore + Recovery UX — remains blocked and is explicitly out of scope for this build.

## Golden handoff rule

Read `00_HANDOFF_GOLDEN_RULE.md` before implementation. Every meaningful action, decision, failure, correction, gate result, merge, deployment and owner-acceptance state must be recorded continuously in the active public handoff.

Current handoff:

`CAREER_MODE_SHOWDOWN_V1.1.2_CANDIDATE_B_HANDOFF.md`

## Candidate B release contract

Candidate B must prove all of the following before merge:

- maximum import size is enforced before `File.text()` for oversized File objects;
- strict JSON parse;
- exact backup format ID/version validation;
- SHA-256 checksum verification;
- dangerous object-key / excessive-depth rejection before checksum canonicalization;
- current schema validation;
- supported historical schema migrations through one ordered registry;
- migration determinism, input non-mutation and idempotence;
- future backup/data schemas fail closed;
- duplicate/conflict classification uses current Showdown IDs as strings;
- exact duplicate, same-ID/same-effective-revision, same-ID/different-revision, new and malformed/unresolvable categories are visible;
- duplicate IDs inside one backup are surfaced rather than silently deduplicated;
- active Showdown impact is explicit;
- Legacy merge impact is previewed only;
- preference impact is explicit;
- corrupt current local bytes are preserved and surfaced as warnings;
- Candidate A export can round-trip directly into Candidate B analysis;
- analysis performs zero canonical `localStorage.setItem()` and zero canonical `localStorage.removeItem()` operations;
- no restore/apply control exists;
- no network request occurs;
- keyboard, drag/drop, touch, reduced-motion, Chromebook/windowed/mobile and accessibility paths pass;
- startup budgets remain protected because Candidate B stays inside the lazy Data Management module;
- existing gameplay, visual, storage and route gates remain green.

## Release process

1. implement and test on a focused branch from current `main`;
2. keep the public handoff current throughout the build;
3. run Candidate B changed-surface contracts/browser evidence;
4. run every permanent workstream/release family on one frozen candidate SHA;
5. do not weaken a threshold to obtain green status;
6. merge with exact expected-head protection only after the frozen candidate is green;
7. verify GitHub Pages serves exact merge bytes;
8. repeat Candidate B analysis and the full deployed Stability journey on the public site;
9. record all production evidence in the public handoff.

## Protected systems

Do not change:

- max-11 scoring or 0–0-only tiebreak logic;
- exactly-two-manager model;
- League/Club assignment semantics;
- Transfer Challenge state machine;
- Season Review persistence boundary;
- Statistics/Legacy/Trophy calculations;
- current storage keys/schema as a restore target;
- `js/screens.js` route authority;
- `js/storage.js` persistence authority;
- Candidate A export semantics;
- owner-protected Reus and accepted football-player source authority;
- the dependency reservation of v1.2.0 for Installable Offline App.

## Next legal task after Candidate B

Only after Candidate B is merged, deployed and proven may Candidate C — Atomic Restore + Recovery UX — begin.

Candidate C alone may write imported canonical state, and all writes must remain behind `js/storage.js` with exact raw snapshots, rollback and rollback verification.

Do not jump to PWA, profiles/save registry, cloud, accounts, QR pairing or two-device work before their dependency gates are reached.
