# Showdown Gate exit report, 10 Oct 2026: READY

**Verdict: READY.** Every exit bar passes, so the Gate replaces Validate POS20 and Validate Gameplay Fast as the single PR check set, as Nik chose on 2026-10-10 at 00:40 UTC.

- Exit-report run [38012571296](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/actions/runs/38012571296) uses `scripts/gate-compare.mjs --summary` from bug-list-1 `1caf4f095`, which includes JOB-1059. It runs from the branch `ci/gate-exit-report`, and the results are published as annotations.
- Canaries are two different heads, each with planted failures: #395 `b381233f` (a contract plus an emulator test) and #451 `101714f0` (a product regression). Both ended FAIL_TEST on their first attempt.
- The infra re-run is Gate run 37398574147, re-run exactly once by Physio run 37400374259.

| Bar | Result |
|---|---|
| Real PR heads (need 10) | 30 |
| Full seals that passed (need 2) | 27 |
| Gate PASS while old FAIL (need 0) | 0 |
| Same route on every head | True |
| Gate ran everything the old checks ran | True |
| Incomplete comparisons | 0 |
| Canaries (need 2) | 2 |
| Infra re-run exactly once | True |
| Superseded heads (left out, all checks cancelled by a newer push) | 9 |

Owner defaults (Nik, 2026-10-10):
1. Canary independence means two different heads.
2. "Full seal" means a full-route PASS.
3. The Gate is the only check the lead requires before merging. Rollback is to re-enable POS20 and Fast the same day. They are archived, never deleted.

## Per-head lines (head, old, POS20, Gate, seal, route, superset, agreement)

```
cd439198a SUPERSEDED by 5a2e97cca PR 444
591992e8d PASS PASS PASS full same super ok
cde75b84a FAIL PASS FAIL_TEST full same super ok
d1d43eb0d PASS PASS PASS full same super ok
07a442ca4 PASS PASS FAIL_TEST full same super ok
30a05b523 PASS PASS PASS full same super ok
a0415bbd2 PASS PASS PASS full same super ok
54a3828b1 PASS PASS PASS full same super ok
931c2f351 PASS PASS PASS full same super ok
7791f65bf PASS PASS PASS full same super ok
6761a586f PASS PASS PASS full same super ok
71f338e73 PASS PASS PASS full same super ok
a16ad8421 PASS PASS PASS full same super ok
6bf38984d PASS PASS PASS full same super ok
952c14b67 PASS PASS PASS full same super ok
202136b6d PASS PASS PASS full same super ok
196254e30 SUPERSEDED by 71f338e73 PR 434
3f26132b6 SUPERSEDED by 952c14b67 PR 433
34cd0fa55 FAIL PASS FAIL_TEST full same super ok
4c48cee9f PASS PASS PASS full same super ok
8df4c553d PASS PASS PASS full same super ok
024a49bc6 SUPERSEDED by 8df4c553d PR 452
b4920f7ba PASS PASS PASS full same super ok
d3ec0d7a2 PASS PASS PASS full same super ok
5a8dfac57 PASS PASS PASS full same super ok
61213a860 PASS PASS PASS full same super ok
f065ef7d2 SUPERSEDED by d3ec0d7a2 PR 449
148a89dcf PASS PASS PASS full same super ok
b3ef6e482 PASS PASS PASS full same super ok
2ab214815 SUPERSEDED by b3ef6e482 PR 442
825c1b28c PASS PASS PASS full same super ok
4a27b2853 PASS PASS PASS full same super ok
5cae09951 PASS PASS PASS full same super ok
a803770b0 PASS PASS PASS full same super ok
556a8035b SUPERSEDED by 5cae09951 PR 445
254139cde PASS PASS PASS full same super ok
5a2e97cca PASS PASS PASS full same super ok
8514f1df7 SUPERSEDED by 825c1b28c PR 446
59864540e SUPERSEDED by 5a2e97cca PR 444
300c29348 FAIL FAIL SUPERSEDED part same super ok
```
