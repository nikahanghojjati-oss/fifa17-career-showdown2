# Review PR #855 — JOB-1819 · r76 gallery

PR: https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/855
Base: `gameplay/bug-list-1` (`2f3865feca484223ac7d267d83a9c4828bad3078`).
Scope: **250 changed files** versus PR base, so review capped at **six largest text patches by changed lines**: `test-results/r76-gallery/{after,before}/manifest.json`, `test-results/r76-integration/checks.json`, and `test-results/r76-integration/ce2pg-{10-3,5-2,3-1}.json`. Branch-parent comparison `codex/job-1816-r76-integration...codex/job-1819-r76-gallery` shows **one commit / 130 gallery files only**, with **120 inherited non-gallery files** in the PR diff.

| Check | Result | Evidence |
| --- | --- | --- |
| **A. Reproduced first** | **PASS** | PR **Before** identifies unchanged r75 `2f3865f` and screenshots of season-chip, Standings, Rivalry and Champion defects; `test-results/r76-gallery/before/manifest.json` records 62 before shots from that source head. |
| **B. Cause named and present on base** | **FAIL** | PR quotes `project-documents/gameplay-factory/tools/gallery-r75/capture.cjs:2`: `require("./screens.cjs")`, and `lib.cjs:1` with an old scratchpad; verified on **factory/gameplay-v1**, but `capture.cjs` is **absent** from unchanged PR base `gameplay/bug-list-1`. This diagnoses external capture tooling, not a gameplay defect on the base. |
| **C. New test fails before / passes after** | **FAIL** | PR **Evidence** shows a *temporary* completeness validator failing with `FileNotFoundError ... r76-gallery/index.html` and then passing `62 before/after pairs`; PR explicitly says `No product regression test was added`. No new committed test file appears. |
| **D. Only allowed files changed** | **FAIL** | JOB-1819 authorizes gallery artifacts under `test-results/r76-gallery/`; PR against r75 changes **120 other files**, e.g. `js/homeScreensV10.js`, `POS20_SUPPLEMENTAL_PRODUCT_TESTS.json`, `tests/operations/pos20-control-plane.test.mjs` and `test-results/r76-integration/checks.json`. These are inherited from integration, not added by JOB-1819's own commit. |
| **E. No forbidden change** | **FAIL** | The PR-to-r75 diff alters an existing test: `tests/operations/pos20-control-plane.test.mjs:102+` changes `expectedSupplementalContracts`, prohibited by the review's existing-test rule. No forbidden file or visual change was introduced in JOB-1819's isolated gallery commit; the offending edit is inherited. |
| **F. Logic handles solo, reload, partner ahead/behind** | **CAN'T TELL** | JOB-1819's own commit contains **no gameplay source**; `after/manifest.json` has 62 fixture captures, but no paired live journey or solo/reload/ahead/behind logic proof. PR **Evidence**: CE2PG aborts at `node_modules/firebase/firebase-app.js` (`ENOENT`). |
| **G. Required checks pasted and PASS** | **FAIL** | Body pastes all check outputs; `test:contracts` says `failed in 6/197 contract(s)` and startup REUS says `startup gzip 37569 must stay <= 37495`. Syntax, ops (73 pass) and Firestore budget (16 checks) pass; failures are inherited from the integration head. |

**Verdict: NEEDS FIX.** The gallery artifact itself is bounded, but the PR-to-r75 scope fails D/E, there is no committed fail-then-pass test, the cited tooling cause is not on the unchanged gameplay base, and required integration checks fail. Do not treat the gallery as a cleared gameplay merge. Separate/explicitly account for integration-inherited changes, supply a reproducible committed gallery acceptance check or documented gallery-test exception, and remedy failing integration checks before requesting a ready verdict. Confirm the phone free-limit overlays separately.

**Notes (5 lines max)**
1. Gallery manifests: 62 matched before/after pairs, 124 WebP pictures, both `1920×1080` and `393×852`, zero capture failures.
2. Isolated JOB-1819 commit changes 130 files, all under `test-results/r76-gallery/`; inherited 120 extra paths arise from the mandated integration-derived branch versus r75 PR target.
3. `home-free-limit-phone-393x852.webp` overlaps soundtrack controls; `connect-players-free-limit-phone-393x852.webp` leaks an underlying notice strip.
4. Both before/after manifests flag offscreen `span.clubTitleFallback` in the two phone Club captures; this is pre-existing.
5. CE2PG emulator started but the journey never ran (missing local Firebase SDK); screenshots do not certify shared-gameplay progression.
