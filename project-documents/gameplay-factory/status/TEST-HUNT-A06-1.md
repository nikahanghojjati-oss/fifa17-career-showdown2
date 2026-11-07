# TEST-HUNT-A06-1 · JOB-1818

- Card: `CARD-HUNT-A06-1.md` — Rivalry totals stay on the previous Season.
- PR: https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/856 (draft).
- Commit SHA: `306e2e0700ae7bdf977f2056b6c4d1bf0abc01e4` (confirmed on GitHub).
- Branch: `gameplay/work-1818-rivalry-history-revision-refresh`.
- Base: `gameplay/bug-list-1` at `2f3865feca484223ac7d267d83a9c4828bad3078`.
- Fixed: **yes**.
- Regression: `tests/contracts/sweep-rivalry-history-revision-refresh-contracts.cjs`.

## Before

On the unmodified base, the new plain-Node VM contract exited 1:

```text
AssertionError [ERR_ASSERTION]: rivalryStatistics: new accepted Season with unchanged phase/status must refresh the mounted screen once
1 !== 2
```

The test uses valid in-memory fixture models through the real screen registration/listener/mount/frame path. The previous 15–5 frame remains instead of changing to the new 7–7 fixture frame. This is deterministic regression evidence, not a live browser/two-account observation.

## After

One production signature line now includes acceptedRevisionKey and, when that key is present, throughSeason. Both Rivalry Statistics and History update for changed accepted history. Identical events remain coalesced, unkeyed metadata stays quiet, and identity/unmounted guards remain intact. No existing assertions were changed, skipped or loosened. Registered last in the POS20 supplemental registry and operations contract list.

```text
rivalry/history revision refresh contracts passed (2 screens)
PASS Legacy refresh contracts (8/8).
POS10 syntax: 352 active source files, 0 failures
PASS POS10 selected deterministic census (192/192 current blocking contracts: frozen POS10 floor + POS20 supplements).
operations: tests 73, pass 73, fail 0, skipped 0
Accessibility and presentation budgets passed for 1.9.1-r75: 159100 raw / 37484 compressed initial bytes; 4845 lazy feedback bytes.
```

The initial full-suite attempt found missing local browser dependencies and the existing metadata-only guard; after npm ci and refining the signature, the full rerun passed. Startup gzip is unchanged at 37,484 <= 37,495 bytes. Draft only; not merged/deployed; no SSJR/MDP credit claimed.
