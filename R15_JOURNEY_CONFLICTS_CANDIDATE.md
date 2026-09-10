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
- The inherited Shared Setup production runtime contract is restored from authoritative accounting main and changed only at its legacy direct-call assertion. It now proves a fresh operation ID is derived from the current CAS revision, the r15 conflict guard wraps rather than replaces the provider adapter, and the unchanged provider request receives the same operation ID and base revision. The exact repaired contract, r15 contracts and all operations tests passed together before this reseal.

Historical failure evidence only:

- Guarded build `34498093774` had earlier failed attempts for one POS20 registration patch-anchor defect, one overly broad no-write regex and one Chromium launcher mismatch. Those attempts are not acceptance evidence.
- Normal POS20 #375 on `8e726cd82dca947e400192bcf40a8795d43bfdcf` found the inherited direct-call regex stale after r15 wrapped the provider call.
- POS20 #376 on `cbfb67a3c002998402aa340d660e3333d76a2bba` exposed accidental reconstruction drift in that inherited test. The file was subsequently restored byte-for-byte from authoritative main before the single intended assertion delta was reapplied.
- Staging and bot-generated repair heads are not acceptance authority. Evidence from any earlier head must not be combined with this one.

Permanent locks remain unchanged: Firebase Spark only, billing OFF, App Check enforcement OFF, no Cloud Run/Functions requirement, memory-only Firestore persistence, popup-only Google Auth, exactly two private managers, no public discovery/community/rankings, no broad list permission, canonical local Save authority unchanged, Candidate C only destructive local Apply.

This document is provenance only. The connector-authored head containing this reseal is the candidate validation boundary. A full normal PR POS20 on that exact head is required before publication or merge. Candidate work does not yet earn product-integration MDP credit, and SSJR remains 0/100.
