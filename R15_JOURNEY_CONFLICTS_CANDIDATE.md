# r15 Journey Conflicts final publication boundary

Candidate capability: `journey-conflicts` (frozen MDP milestone weight 5).

Base authority: accounting main `80d08148092bbb0a5221272fd0a88cc8dc6f7c80`, MDP-1 `82.00/100`, SSJR-1.1 `0/100`.

Validated implementation boundary:

- `js/sharedJourneyConflicts.js` provides exact operation/authority/intent hashing, non-authorizing in-memory conflict receipts, exact replay handling, one bounded stale-base retry, altered-replay pre-provider denial, receipt expiry and provider-code-preserving classification.
- `js/productionSharedJourneyConflicts.js` exposes the guard without acquiring provider, list or local Save authority.
- Existing Shared Setup and Season Commit provider transactions remain the only mutation/authorization authorities. The r15 guard wraps their existing production mutation calls but never replaces Firebase transaction checks.
- The inherited Shared Setup production runtime contract was restored from authoritative accounting main and changed only at its legacy direct-call assertion. It proves a fresh operation ID is derived from the current CAS revision, the r15 conflict guard wraps rather than replaces the provider adapter, and the unchanged provider request receives the same operation ID and base revision.
- `tests/browser/shared-journey-conflicts-audit.cjs` proves stale contention, one bounded retry, altered replay denial, quota/revocation classification, receipt expiry, identity-isolated receipts and byte-identical canonical local storage across two isolated browser contexts.
- The inherited production Shared Setup overlay audit now supplies the required r15 conflict guard and asserts the mutation traverses that guard once while preserving its original host-session behavior.

Pre-publication exact-head authority:

- Exact head `b38935bd0cb2d29079deb5fd81dd5b92547ff67e` passed normal PR POS20 #382 completely: selector, deterministic census, operations, cognitive benchmark, INLINE, STATIC, VISUAL, REMOTE, STORAGE, FULL and the exact-head cognitive seal.
- Evidence from earlier failed/superseded r15 heads is historical failure evidence only and is not combined with #382.

Publication boundary:

- One-shot publication run `34522244601` succeeded after its release-coherence guard required the release record to retain explicit Private Remote Joining continuity.
- Actions-authored publication commit `c10c841888eee157afc234ce8ff44e33ad473a7f` coherently publishes runtime `1.9.1-r15` with previous known-good `1.9.1-r14`, updates index/manifest/app/menu asset revision references, preserves both r15 conflict runtime assets in the service-worker shell and creates `RELEASE_V1.9.1_R15.md`.
- That publisher passed Journey Conflicts deterministic/production contracts, dynamic static release contracts, release-shell coherence, offline-hotfix contracts, all POS20 operations tests and `git diff --check` before committing, then self-deleted.
- Earlier publication staging head `719043cc4b56192c099e2d6325c60fe8c3690e8a` was invalid YAML and created no job. Publication staging head `bc2eef6af21a63b270bb1724d2520d88562e7d1c` transformed the shell successfully but failed release-shell coherence because the draft release record omitted the retained “Remote Joining” phrase; it pushed no release commit. Both are failure evidence only.

Permanent locks remain unchanged: Firebase Spark only, billing OFF, App Check enforcement OFF, no Cloud Run/Functions requirement, memory-only Firestore persistence, popup-only Google Auth, exactly two private managers, no public discovery/community/rankings, no broad list permission, canonical local Save authority unchanged, Candidate C only destructive local Apply.

This connector-authored provenance commit changes no executable product behavior. The exact head containing this document is the final r15 publication candidate boundary and must pass a fresh complete normal PR POS20 on that same head before PR #244 can be marked ready or merged. Publication alone earns no MDP integration credit. MDP remains `82.00/100` and SSJR remains `0/100` until post-merge production integration gates are satisfied.
