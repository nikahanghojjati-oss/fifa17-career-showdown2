# Status · JOB-30 · G-13 part 2g: Rule Book and Settings

State: MERGED
Step: 5 of 6
Updated: 2026-10-05 UTC
Chat: Sol Work mode
Code branch: gameplay/job-30-v10-rules-settings
Head commit: 180a4b4c04b5ee1218e793ee782a8a16c01ca5c7
PR: https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/355
CI run: https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/actions/runs/37242125810

## Notes
- Step 1: Read current RULES boot, WORKER_HANDBOOK, JOB-30, COMMON, pinned package/handoff/nav/truth/build sources, data contract and job 24 PR loader API.
- DEFAULT: JOB-30 explicitly allowed starting from job 24 while PR #349 was open. Fast-forwarded the existing job branch from cf7a46e to foundation 7c1e284 without force.
- Step 2: Saved failing test before implementation (MODULE_NOT_FOUND rulesSettingsV10.js), registered in POS20 supplemental registry and expectedSupplementalContracts.
- Step 3a: Original app rule nodes/Back control are decorated. Native Settings retains original ids, control nodes/handlers, focus trap and hidden internal recovery controls; Reus credit has both exact links and the app version remains live.
- Step 3b: Modal registration overlay:true works independently of active app route; real loader checks cover concurrent CSS and asynchronous close without duplicate mounts.
- Step 4a: Scoped pinned Team V CSS to equivalent app hosts and added a separate original-markup compatibility stylesheet. No standalone fixture JS is referenced or copied.
- Step 4b: Reused original Git blob objects for all three system stadium WebP plates, without binary upload.
- Step 4c: Reused both original brush wordmark Git objects. New lazy text files are shell-cached; images stay revision runtime-cached.
- Step 4d: Extended existing foundation immutable-image census with the five original asset hashes. All previous pins/assertions stay intact.
- Step 5: Opened PR #355 into gameplay/recovery-v1; local suites pass. Exact-head Actions GET finds Gameplay Fast run 37242125810. One read showed Gameplay contracts success and the other three jobs still in progress; no exact-head Validate POS20 run was available. Did not poll.
- Live-state reconciliation: recovery moved from fb0dd02 to bbd7e9a104c2bb1e870a11f3e07eb70e89a1d32a during this run; PR #355 mergeable:false. Foundation PR #349 also moved from 7c1e284 to 26b18e069c90faa6b832961872b6f26a5d50b533 and remains open/mergeable:false. Its new stylesheet-settling fix is not in this starting base. Lead must reconcile the dependency and conflicting branch before merge-ready evidence can exist.
- No Codex review requested: COMMON gates the request on green CI. No merge, force-push, main mutation, browser QA or deployment.
- Rule wording differences: none; pinned Team V fixtures match all six current app sections, score labels, values and maximum.
- CSS source edits: rule-book/rule-book.css selector lines 4 through end scope to #ruleBook.v10RuleBook, stage id becomes #v10RuleBookStage, inner screen becomes .ruleBookV10Content, h2 section selectors become retained h3. settings/settings.css selector lines 4 through end scope to #settingsOverlay.v10Settings, stage id becomes #v10SettingsStage, :root variables move to modal host. Declaration values/media conditions preserved; compatibility adjustments live separately.
- OBSERVE/MODEL: initial main 8abc561 and recovery fb0dd02 supersede old recorded POS20 heads. This branch is only the authorized visual job; zero SSJR/MDP credit.

## Self-check
- npm run test:contracts: exit 0. Last line: PASS POS10 selected deterministic census (119/119 current blocking contracts: frozen POS10 floor + POS20 supplements).
- Startup: PASS Dynamic static release contracts v1.9.1/1.9.1-r53; startup 162809/37495. gzip unchanged at 37495.
- npm run test:ops: exit 0; 73 tests, 73 pass, 0 fail, 0 skipped.
- New contracts: PASS V10 rules/settings contracts: 14 checks.
- Foundation contracts: PASS v10 foundation contracts: 16 checks.
- Exact head 180a4b4c04b5ee1218e793ee782a8a16c01ca5c7: Gameplay contracts success; Composed Rules emulator, Two-manager browser journey and Composed production Rules regression in progress at the one evidence read.
- Required green all-four-job Gameplay Fast, exact-head Validate POS20 and gated Codex review are not yet proven. Not DONE.

## Model gaps
- None. Rule Book is static original copy; Settings uses original live controls and version.

## Blocked question
- Team G lead: reconcile updated foundation PR #349 (26b18e0) and moving recovery (bbd7e9a), including the stylesheet-settling fix, with conflicting PR #355 without a worker force-push or merge. Then verify all four Gameplay Fast jobs and Validate POS20 on the reconciled exact head, request @codex review after green checks, and handle findings before DONE. Current CI is incomplete, not falsely reported as green.

## Lead merge

Merged into gameplay/recovery-v1 at 41660939 (PR #355, exact head 1568e544, 16/16 checks), Sun 4 Oct 2026, 8:21 p.m. Boston time. The lead checked the Rule Book and Settings screenshots and the js/v10Screens.js overlay change.
