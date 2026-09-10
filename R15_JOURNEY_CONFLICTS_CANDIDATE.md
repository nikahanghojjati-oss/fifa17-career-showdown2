# r15 Journey Conflicts candidate boundary

Candidate capability: `journey-conflicts` (frozen MDP milestone weight 5).

Base authority: accounting main `80d08148092bbb0a5221272fd0a88cc8dc6f7c80`, MDP-1 `82.00/100`, SSJR-1.1 `0/100`.

Validated implementation boundary before this seal:

- `js/sharedJourneyConflicts.js` provides exact operation/authority/intent hashing, non-authorizing in-memory conflict receipts, exact replay handling, one bounded stale-base retry, altered-replay pre-provider denial, receipt expiry and provider-code-preserving classification.
- `js/productionSharedJourneyConflicts.js` exposes the guard without acquiring provider, list or local Save authority.
- Existing Shared Setup and Season Commit provider transactions remain the only mutation/authorization authorities. The r15 guard wraps their existing production mutation calls but never replaces Firebase transaction checks.
- r15 is bootstrapped after r14 Journey Reconnect and retained in the candidate service-worker shell. The production shell remains `1.9.1-r14` until a separate release publication gate.
- Deterministic and production contracts passed together with all 73 POS20 operations tests in guarded build run `34498093774` final successful attempt.
- `tests/browser/shared-journey-conflicts-audit.cjs` passed in the same final successful attempt using two isolated browser contexts, proving stale contention, one bounded retry, altered replay denial, quota/revocation classification, receipt expiry, identity-isolated receipts and byte-identical canonical local storage.

Historical failed attempts in run `34498093774` are failure evidence only: one POS20 registration patch-anchor defect, one overly broad no-write regex, and one browser launcher configuration mismatch. None is acceptance evidence and none may be combined with later heads.

Permanent locks remain unchanged: Firebase Spark only, billing OFF, App Check enforcement OFF, no Cloud Run/Functions requirement, memory-only Firestore persistence, popup-only Google Auth, exactly two private managers, no public discovery/community/rankings, no broad list permission, canonical local Save authority unchanged, Candidate C only destructive local Apply.

This document is provenance only. The connector-authored head containing it is the candidate validation boundary. A full normal PR POS20 on that exact head is required before publication or merge. Candidate work does not yet earn product-integration MDP credit, and SSJR remains 0/100.
