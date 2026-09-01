# Standing Owner Authorization — Zero-Billing Remote Joining

Effective 2026-08-31, the owner authorizes current and future developers to make every engineering, provider, IAM, authentication-policy, Security Rules, runtime, deployment, testing, evidence and publication decision necessary to complete Private Remote Joining, subject to one controlling prohibition: billing must never be activated.

The project must remain on Firebase Spark with no linked Cloud Billing account, no Blaze upgrade, no paid service, no payment-method requirement and no service whose activation requires billing, even when that service advertises a free usage tier. Cloud Run is therefore excluded from the production critical path. A later explicit owner instruction is required to change this prohibition.

Within that boundary, developers may simplify, replace or bypass a stronger candidate architecture when necessary to produce a genuinely usable free Remote Joining path. Proven work must remain preserved unless removing it is required for correctness. Stage 5B's dormant custom-token proof remains valid research, but it is not mandatory production architecture.

The selected critical path is Firebase's no-cost Spark surface: existing Google Authentication, direct Cloud Firestore client operations protected by exact-path deny-by-default Security Rules, memory-only Firestore persistence and GitHub Pages. Device identifiers may remain owned audit and revocation metadata, but may not be represented as cryptographically provider-bound when standard Google tokens do not prove them.

All mandatory automated tests, emulator evidence, exact-head workflows, review/thread gates, expected-head merge protection, post-merge validation, deployment proof, WEC and SLE requirements remain in force. Quota exhaustion must fail safely and preserve the local-first app; it must never trigger an automatic billing upgrade.

This authority supplements `00_OWNER_STANDING_MERGE_DEPLOY_AUTHORIZATION.md` and supersedes earlier owner-decision blockers for IAM, provider choice, auth-policy expansion and production activation. It does not authorize public discovery, public matchmaking, public community features, more than two managers, destructive authority outside Candidate C or weakening canonical recovery guarantees.

Canonical provenance: `authority-history/OWNER_ZERO_BILLING_REMOTE_JOINING_AUTHORIZATION_2026-08-31.md`.
