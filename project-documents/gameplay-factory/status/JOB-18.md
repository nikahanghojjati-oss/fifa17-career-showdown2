# Status · JOB-18 · Nik's pair code survives the pair-panel re-render (no false "invalid")

State: DONE
Step: 5 of 5
Updated: 2026-10-03 15:10 UTC
Chat: Sol Chat
Code branch: gameplay/job-18-pair-code-race
Head commit: f2706e4b0b650be5f6e68b240044ca983359485d
PR: #329
CI run: https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/actions/runs/37131831101

## Notes
- Step 1: Baseline Validate Gameplay Fast on 889810f9e77efc09c79318cebe70d3d7f30676c9 completed successfully (run 37125774495).
- Step 2: Tests-first contract and registry entries saved last after newer supplemental entries. Validate Gameplay Fast failed as required in Gameplay contracts: AssertionError [ERR_ASSERTION]: 2b the code Nik typed survives the pair-panel re-render; actual: ''; expected: the typed CMS17 pair code.
- Step 3: Applied Appendix B exactly in js/persistentNikDanielPair.js: module draft holder, capture before replaceChildren, restore draft plus empty guard, and focus/caret restoration. contractVersion remains 4. Node commands are unavailable in chat lane; exact-head CI provides the required test evidence.
- Step 4: Validate Gameplay Fast is fully green on f2706e4b0b650be5f6e68b240044ca983359485d (run 37131831101). Race contract PASS; dynamic static release reports startup 162809/37493; POS10 selected census 105/105; persistent pair Rules emulator PASS; two-manager journey Sections A-G PASS.
- Step 5: Opened PR #329 from gameplay/job-18-pair-code-race into gameplay/recovery-v1. No Codex review required.

- Lead (2026-10-03 15:25 UTC): reviewed and merged PR #329 into gameplay/recovery-v1 at f7d18a1 (14/14 checks green on f2706e4). Job closed; nothing more to do in this chat.

## Self-check
- PASS — Tests first: old code failed with "AssertionError [ERR_ASSERTION]: 2b the code Nik typed survives the pair-panel re-render" and actual ''. New code prints "PASS pair code entry race contracts: typed code survives re-render, empty never invalid, malformed still rejected."
- PASS — Validate Gameplay Fast is green on exact head f2706e4b0b650be5f6e68b240044ca983359485d; persistent pair Rules emulator PASS and two-manager journey Sections A-G PASS.
- PASS — Diff from recovery head e44b695 contains only POS20_SUPPLEMENTAL_PRODUCT_TESTS.json, js/persistentNikDanielPair.js, tests/contracts/pair-code-entry-race-contracts.cjs, and tests/operations/pos20-control-plane.test.mjs. contractVersion remains 4; index.html, service-worker.js and Rules are unchanged.
- PASS — CI reports dynamic static release startup 162809/37493 and npm run test:ops pass 73 / fail 0; selected blocking contract census is 105/105.
- PASS — Race contract proves case 4 malformed code still reports "Daniel's connection code is invalid." and remains in the field; case 3 proves empty JOIN never reports invalid and asks Nik to paste Daniel's code first.

## Blocked question
