# REVIEW-PR-856 · JOB-1818
PR: https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/856
Reviewed head: `306e2e0700ae7bdf977f2056b6c4d1bf0abc01e4`
Unchanged base: `2f3865feca484223ac7d267d83a9c4828bad3078`
Job and card: `JOB-1818.md`, `CARD-HUNT-A06-1.md` on `factory/gameplay-v1`.
Scope: all 4 changed files reviewed.

| Check | Result | Evidence |
| --- | --- | --- |
| A. Reproduced first | PASS | Body names the unchanged base and quotes the pre-fix failure: “new accepted Season with unchanged phase/status must refresh the mounted screen once” (`1 !== 2`). |
| B. Cause named | FAIL | Body names `js/rivalryLegacyV10.js` and the omitted accepted history identity, but supplies neither a line number nor a base-code quote. Verified base line 191: `const signature=value=>JSON.stringify([context(),value?.phase??null,value?.status??null]);`. |
| C. Test fails then passes | PASS | New `tests/contracts/sweep-rivalry-history-revision-refresh-contracts.cjs:38-51` checks refreshed totals and duplicate events; body reports base exit 1 then “rivalry/history revision refresh contracts passed (2 screens)”. |
| D. Only allowed files | PASS | Card permits `js/rivalryLegacyV10.js` and its named new contract; JOB-1818 step 4 expressly permits `POS20_SUPPLEMENTAL_PRODUCT_TESTS.json` and `tests/operations/pos20-control-plane.test.mjs` registration. No other changed files. |
| E. No forbidden change | PASS | Runtime diff only extends the signature at line 191. The existing operations test receives only the step-4-required constant/list append; all prior list entries and assertions remain intact. No forbidden path, online timer/poll, sessionStorage or look changes. |
| F. Logic is right | PASS | Added accepted key and keyed through-Season distinguish accepted history changes; base producer `js/productionSharedHistoryConvergence.js:99` supplies both. Missing-key solo states retain the old signature behavior; mount/reload still reads current state/model (`js/rivalryLegacyV10.js:192,230-267,283-287`), and both managers' earlier/later accepted revisions trigger refresh without assuming progression direction. Existing identity, duplicate, throttling and stale-load guards remain. No wrong-result input found within this card's accepted-history scope. |
| G. Checks pasted | PASS | Body includes syntax: 352 files, 0 failures; contracts: 192/192; operations: 73 pass/0 fail; presentation: 159100 raw / 37484 compressed bytes. |

**Verdict: NEEDS FIX**

Notes:
- Add the verified `js/rivalryLegacyV10.js:191` line and exact base-code quote to the PR body's Cause section.
- Runtime fix is consistent with the card; no gameplay rewrite requested.
- VM regression supplies fixture models through a getter; it proves screen event/frame refresh, not a live two-manager online run.
- Registration edits are expressly authorized by JOB-1818 step 4.
- Review is by source and pasted output; no checks rerun.
