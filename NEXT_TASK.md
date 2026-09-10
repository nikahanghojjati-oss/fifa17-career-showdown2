# NEXT TASK — MDP Terminal Close r18

Authoritative integrated product main is `23bba67ed7bf9cc38cb7dc9106e3f64a17a6b55f` from expected-head squash merge of PR #248. Runtime `1.9.1-r17` is coherently deployed by GitHub Pages #124. Exact publication-head POS20 #430, exact-main POS20 #431 and Release Integration Burn-In #381 are green.

Milestone Delivery Progress is `93.70/100`. SSJR-1.1 remains exactly `0/100`; MDP integration evidence does not grant SSJR credit.

## Immediate capability

Implement `terminal-close` (frozen weight 2), which depends on Final Reconciliation. Close a completed shared journey terminally on both devices and prove CLOSED cannot be resurrected by delayed publishes, retries, session re-entry or later reads. Reuse established private-session terminal semantics rather than inventing a parallel lifecycle, but ensure the completed journey itself remains terminal across fresh session attempts.

Final Reconciliation remains read-only and separate: no extra season, no altered winner scoring and no automatic Candidate C/local Save mutation.

Permanent locks remain: Firebase Spark only, Billing permanently OFF, App Check enforcement OFF, exactly two private managers, no public discovery/community/rankings, popup-only Google Auth, no broad list authority, Candidate C sole destructive local Apply with backup/rollback, and no Cloud Run or Cloud Functions dependency.
