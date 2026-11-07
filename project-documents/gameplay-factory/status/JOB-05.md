# Status · JOB-05 · Active Showdown adapter (Rivalry, Continue, tiebreak, final state)

State: DONE
Step: 7 of 7
Updated: 2026-10-02 19:43 UTC
Chat: Sol Work mode (job 5, 82817ee4c652)
Code branch: gameplay/job-05-active-adapter
Head commit: 62f06893de994fa1f86ee19f5e39b2ad0136ab30
PR: https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/319
CI run: https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/actions/runs/37055468354 (success, exact head 62f06893de994fa1f86ee19f5e39b2ad0136ab30)

## Notes
- Step 1: Job 3 merged (#316); code branch matches integration at 4491e36. npm ci exit 0; contracts PASS census 97/97; operations pass 73, fail 0. Node v24.19.0. Connector saves; CI will supply emulator proof.

- Step 2: Exact fixture copied; node tests/support/active-showdown-fixtures.cjs prints CLOSED 5 playerOne SHOWDOWN_COMPLETE.

- Step 3: All 18 cases saved with throwing stub; observed Error: 1. Left/right: not implemented. Tests-first commit 2db6265d720437d78caeea2f5f19578a01f552af.

- Step 4: All 18 contract cases PASS. Adapter verifies provider projections and close witnesses, maps fixed manager roles, hides unpublished rival inputs, and freezes owned copies without changing caller data.

- Step 5: All 19 cases PASS; every shared manager field and score agrees with job 3 for both managers across three accepted active seasons. Sentinel check covers aggregate career input; already-frozen provider projections retain full deep-freeze.

- Validation note: exact registry edits saved. Static-release duplicate-name guard found plain/freeze/context collisions; renamed only adapter helpers. Local contracts now 98/98 and operations pass 73, fail 0. Awaiting exact-head Validate Gameplay Fast on 62f06893de994fa1f86ee19f5e39b2ad0136ab30.

- Step 6: Registry edits complete; contracts 98/98, operations pass 73/fail 0 locally and in CI. Validate Gameplay Fast succeeded on 62f06893de994fa1f86ee19f5e39b2ad0136ab30 including every emulator matrix and two-manager journey. PR #319 opened into gameplay/recovery-v1.

- Step 7: Done checklist filled; exact-head CI green; PR #319 verified open and mergeable into gameplay/recovery-v1. Team G lead review remains; nothing merged or deployed.

## Self-check
- PASS Tests first: https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/commit/2db6265d720437d78caeea2f5f19578a01f552af contains all 18 required cases plus the throwing stub; observed Error: 1. Left/right: not implemented before implementation.
- PASS Cases: all 18 cases plus case 19 pass (19/19). Both-manager role mapping, all lifecycle states, stale and tampered authority, pre-reveal sentinel denial, tiebreak reuse, capped scoring, browser/Node equality and career agreement are covered. Three irreconcilable test wordings are documented below; section 4 is followed without changing dependencies.
- PASS Suites: local npm run test:contracts ends PASS POS10 selected deterministic census (98/98 current blocking contracts: frozen POS10 floor + POS20 supplements). npm run test:ops reports tests 73, pass 73, fail 0. Exact-head GitHub Gameplay contracts job 110999101174 confirms 98/98, 19/19, pass 73, fail 0.
- PASS CI: https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/actions/runs/37055468354 completed success on exact head 62f06893de994fa1f86ee19f5e39b2ad0136ab30. Emulator job 110999100849 passed Shared Setup, transfer fresh-session recovery, one- and three-season lifecycle, ten-season Terminal Close, persistent pair, and two-manager journey Sections A-G. All test project ids start demo-.
- PASS Scope: PR #319 lists exactly the five job-authorized files: three new files plus the JSON registry entry and two exact operations registry edits. Static-release name collisions were resolved inside the adapter only. No provider, screen, index.html, service worker, sharedCareerAnalytics.js or Rules edits.
- PASS Purity/privacy: adapter source forbidden-token check passes; screen models select daniel/nik fields and contain no account/profile/save ids or unpublished rival inputs. Own outputs are deeply frozen; caller remains unchanged and unfrozen. careerInput deliberately preserves the verified projection object by identity, and preserves its existing freeze state and internal fields as section 4 requires (see lead question below).
- PASS PR/safety: https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/319 is open, mergeable, and targets gameplay/recovery-v1 at exact head 62f06893de994fa1f86ee19f5e39b2ad0136ab30. Header says Codex review no. No main write, merge, force push, deletion, deployment, production write or Firebase setting change.

## Blocked question
Lead question (continuing under job section 9): Case 8 forbids ids anywhere in aggregate output, but careerInput must retain P identity and P contains account/profile/save ids. Case 18 requires frozen outputs plus an unfrozen caller P with identical identity; freezing P is explicitly forbidden. Case 10 says model partial for unavailable classification, while section 4 requires indexStatus unavailable/showdowns [] and job 3 returns unavailable. Tests enforce no private fields in screen views, no unrevealed sentinel in any output, unchanged/unfrozen borrowed P, frozen owned outputs, and section 4's exact careerInput/model unavailable. Please confirm these interpretations; no dependency edits are made.
