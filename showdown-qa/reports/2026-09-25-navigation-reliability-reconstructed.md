# Reconstructed QA Record: Navigation Reliability Review

Original review date: 2026-09-25  
Reconstructed: 2026-10-04  
Status: PRIOR_QA_RECORD, not a fresh live defect claim

## Why this file is reconstructed

The earlier QA project recorded a report named:

`showdown-qa/reports/2026-09-25-navigation-reliability-repo-review.md`

and a temporary branch:

`qa/reliability-review-2026-09-25`

with a recorded head beginning `1fe30fc`.

During the 2026-10-04 compilation, that temporary branch and abbreviated commit could no longer be resolved through GitHub. This file preserves the substantive findings from the QA project history and explicitly does not pretend the original branch is still live.

Before implementing anything from this record, re-check the current product source.

## Context

PR #280 had addressed repeated-click failures around Shared Setup Continue and some club actions by adding tap coalescing / busy behavior.

The QA review asked a broader question:

Does navigation reliability use one coherent interaction model across all routes, or did the fix only patch selected buttons?

## Finding N1 · Repeated-click protection was inconsistent across navigation surfaces

Classification: PRODUCT_DEFECT  
Historical severity: Medium-High

Observed pattern in the prior review:
- selected Shared Setup / club actions had coalescing or busy handling;
- other Continue, Back and route transitions did not consistently share the same in-flight navigation contract.

Risk:
two or more navigation/load requests could overlap even when the user intended one transition.

Recommended bounded direction:
- one shared in-flight navigation state;
- duplicate-click coalescing;
- visible busy/disabled state while an unresolved transition owns the action;
- no second logical navigation for the same user intent.

## Finding N2 · Delayed older route could supersede a newer user choice

Classification: PRODUCT_DEFECT  
Historical severity: High

Most important historical risk:

1. user starts route/load A;
2. before A completes, user chooses route/load B;
3. B becomes the user's newer intent;
4. delayed A completes later;
5. without a supersession token/current-intent check, A may overwrite B.

Expected:
latest valid navigation intent owns the visible route.

Observed/hypothesized from the prior source review:
older asynchronous work was not uniformly prevented from committing presentation after a newer route became authoritative.

Smallest design correction:
- assign an operation/navigation generation id;
- before applying async route result, verify it still owns current navigation generation;
- discard stale completion;
- preserve canonical route state rather than relying only on button disabling.

## Finding N3 · Test coverage did not sufficiently exercise delayed overlapping navigation

Classification: TEST_DEFECT  
Historical severity: Medium

The prior QA review found strong product testing overall but a missing focused case:
- intentionally delay route A;
- start route B;
- allow A to finish;
- assert B remains visible/authoritative.

Recommended regression family:
1. duplicate Continue clicks;
2. Continue then Back while load is delayed;
3. route A then route B with A completing last;
4. mobile repeated tap;
5. route request during background/resume if the screen uses async state refresh.

## Finding N4 · NEXT_TASK baseline was stale relative to the live release reviewed

Classification: PROCESS_DEFECT  
Historical severity: Medium-High

The September 25 QA review recorded a live r46-era product state while `NEXT_TASK.md` still referenced an r18-era baseline.

This was not merely a cosmetic documentation issue because fresh agents used `NEXT_TASK.md` as an orientation source.

The same defect class had already appeared around r44 and has now reappeared in the factories as board/status drift.

## Historical recommendation

Do not repair each button independently.

Define a small navigation reliability contract:
- one deliberate click -> one logical transition;
- in-flight ownership is explicit;
- duplicate same-intent clicks coalesce;
- newer intent supersedes older unresolved intent;
- stale completion cannot repaint;
- UI exposes busy/waiting state;
- tests reproduce overlapping real clicks rather than invoking APIs only.

## Relationship to current 2026-10-04 findings

This earlier review is important because Team G's later work independently rediscovered adjacent issues:
- simultaneous mutation races;
- fewer-taps flow;
- auto-refresh/waiting behavior;
- local reconciliation stuck waiting;
- stale/background refresh behavior.

The common failure class is the integration boundary between:
- player intent;
- asynchronous authority;
- presentation refresh;
- stale result suppression.

That class should remain a permanent QA checklist.
