# Status · JOB-28 · G-13 part 2e: Rivalry Statistics and Legacy (History)

State: IN PROGRESS
Step: 4 of 5
Updated: 2026-10-04 22:35 UTC
Chat: Sol Work mode
Code branch: gameplay/job-28-v10-history
Head commit: 022e11e0021ed8829a03229084a0b6d040954fcf
PR: to open in step 5
CI run: pending on 022e11e0021ed8829a03229084a0b6d040954fcf

## Notes
- Step 1: Source audit of current rules, COMMON, pinned truth/build notes, NAV/data contract and job 24 API.
- Step 2: Saved and registered failing tests before implementation.
- Step 3: Pure mappings saved; public values only, Daniel left, no invented numbers, completed History only.
- Step 4a: Pinned text renderers/maps and referenced WebP objects reused; text-only precache, runtime image caching.
- Step 4: Lazy bindings saved for existing statistics and legacy routes. Current adapter uses published snapshots; History uses closed loader with exact gets, no backfill. Removed remaining Statistics containment. Preserved old local fallback and loader remount invalidation.
- DEFAULT: Stage reads dataset.src1x/src2x: preserve actual data-src1x/data-src2x from pinned source. Semantic rivalryStatistics uses existing statistics id.

## Self-check
- New contract: 12/12 checks, including real renderers in node VM and loader remount/unmount.
- Existing Career Screens V10: 10/10; Career Screen Seam: 17/17.
- Operations: 73 tests, 0 failures.
- Release contract: startup 162809/37495, unchanged. Full census rerun follows scoped helper-name fix.

## Model gaps
- Transfer summaries absent from career/active models: visible Unavailable, never zero.
- No completion dates in data contract; no fabricated archive dates.

## Blocked question
