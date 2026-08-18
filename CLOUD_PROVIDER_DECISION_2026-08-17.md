# Cloud / Sync Provider Decision — 2026-08-17

Status: Cloud/Sync Readiness Phase 1B provider and operational decision
Decision scope: provider selection only; no provider connection, credentials, account creation, remote runtime, authentication runtime or canonical-data mutation is authorized by this document
Owner priority: Private Remote Joining prerequisite path

## Decision

Select Firebase as the primary provider candidate for the first production-capable private Cloud/Sync foundation, specifically:

- Firebase Authentication for future private account identity;
- Cloud Firestore Standard edition for remote revisioned objects;
- Firestore real-time listeners for authorized change notification where appropriate;
- Firebase Local Emulator Suite for development and security-rule testing before production;
- Cloud Functions only if a later bounded security review proves that server-only pairing/session operations require them.

This is a provider decision, not an instruction to connect Firebase to the application yet.

## Why Firebase is the current best fit

Career Mode Showdown is a private two-manager companion, not a public social product. Its connected workload is therefore expected to be very small, but correctness requirements are unusually strict: explicit revision authority, stale-write rejection, private authorization, deterministic conflicts, tombstones, retry/idempotency, and reliable reconnect behavior.

Firebase fits the next prerequisite layer because:

1. Firebase Authentication integrates directly with web clients and Firestore Security Rules can authorize document access from authenticated identity.
2. Firestore supports atomic transactions and retries transaction functions when a concurrently read document changes. The project will still compare the immutable client `baseRevision` against the server-authoritative revision so an automatic retry can never silently reinterpret a stale client write as current.
3. Firestore supports real-time listeners, which are sufficient for the first two-manager synchronization design without adding a second real-time provider.
4. The Spark plan currently includes no-cost Firestore quota of 1 GiB stored data, 50,000 reads/day, 20,000 writes/day, 20,000 deletes/day and 10 GiB/month outbound transfer. Firebase Authentication on Spark supports the tiny private user count by a very wide margin.
5. The Spark plan does not require payment information for the supported no-cost services used in early architecture and emulator-driven development.
6. The existing GitHub Pages application can remain static; Firebase client libraries can be used later without moving the public site to Firebase Hosting.

Official sources reviewed:

- Firebase pricing: https://firebase.google.com/pricing
- Firebase pricing plans: https://firebase.google.com/docs/projects/billing/firebase-pricing-plans
- Cloud Firestore billing: https://firebase.google.com/docs/firestore/pricing
- Firestore transactions: https://firebase.google.com/docs/firestore/manage-data/transactions
- Firestore security overview: https://firebase.google.com/docs/firestore/security/overview
- Firebase Authentication: https://firebase.google.com/docs/auth

## Critical offline rule

Do not enable Firestore persistent offline cache for Career Mode Showdown synchronization.

Firebase documents that when Firestore offline persistence later reconnects, multiple local changes to the same document are synchronized with last-write-wins behavior. That is incompatible with the permanent Career Mode Showdown rule that active gameplay/rivalry state must never silently resolve divergent writes with last-write-wins.

For the web SDK, persistent offline cache is disabled by default. Keep it disabled.

Future offline/reconnect behavior must instead flow through the project-owned revision model:

local mutation intent
→ immutable `baseRevision`
→ reconnect
→ authenticated remote compare-and-swap transaction
→ accepted revision OR explicit conflict
→ Candidate-C-style validated local apply boundary where remote state must alter canonical local state.

Official source:

- Firestore offline behavior: https://firebase.google.com/docs/firestore/manage-data/enable-offline

## Transaction rule

Firestore transaction auto-retry is transport/concurrency behavior, not permission to change client intent.

Every future state-changing transaction must carry the exact `baseRevision` reviewed by the client. On every transaction attempt:

1. read the authoritative object;
2. authorize the authenticated account/object relationship;
3. compare authoritative `revision` to the immutable request `baseRevision`;
4. if they differ, return an explicit stale conflict and perform no gameplay write;
5. if they match, apply exactly one new revision and record the idempotency key;
6. never recompute `baseRevision` from the newly read server revision inside an automatic retry.

This preserves the deterministic Phase 1A model on top of Firestore transaction semantics.

## Authentication and authorization rule

Future Firebase Authentication identity (`uid`, represented by the architecture-level `accountId`) must remain separate from Local Profile `profile_*` identity and display labels.

Firestore Security Rules must deny by default and prove account/session membership for every client-readable or client-writable object. Security Rules are not a substitute for server-only logic when a later threat model requires an operation that a client must not be able to authorize for itself.

No service-account credential, admin SDK credential or other privileged secret may ever be committed to or exposed by the GitHub Pages client.

## Cloud Functions / Blaze boundary

Do not enable Blaze or deploy Cloud Functions merely because they are available.

Firebase documents that Cloud Functions requires the Blaze plan, although it includes a no-cost usage tier. A billing account is therefore a separate future operational decision. If secure invite issuance, device registration, revocation, session creation or another server-only operation requires Cloud Functions, that requirement must be proven first and the owner must receive a documented cost/rollback boundary before billing is enabled.

Official sources:

- Firebase pricing plans: https://firebase.google.com/docs/projects/billing/firebase-pricing-plans
- Cloud Functions billing FAQ: https://firebase.google.com/docs/functions/faq-and-troubleshooting

## Why Supabase is not the primary choice now

Supabase remains a technically credible fallback. It offers managed Postgres, Auth, Row Level Security, database functions, private Realtime authorization and Broadcast/Postgres change delivery.

However, its current Free plan pauses projects after one week of inactivity, while the non-pausing Pro plan starts at $25/month. For a private two-manager companion that may naturally sit unused for more than a week, automatic pausing is a reliability drawback and the standing monthly cost is disproportionate before Remote Joining proves it needs Supabase-specific Postgres capabilities.

Official sources:

- Supabase pricing: https://supabase.com/pricing
- Supabase billing: https://supabase.com/docs/guides/platform/billing-on-supabase
- Supabase Row Level Security: https://supabase.com/docs/guides/database/postgres/row-level-security
- Supabase Auth: https://supabase.com/docs/guides/auth
- Supabase Realtime authorization: https://supabase.com/docs/guides/realtime/authorization
- Supabase database functions: https://supabase.com/docs/guides/database/functions

## Why Cloudflare Durable Objects is not the primary choice now

Cloudflare Durable Objects is a strong future fallback for a dedicated session coordinator because each object can provide transactional strongly consistent storage and WebSocket coordination. D1 also has an attractive free usage envelope.

The drawback for the current stage is architectural scope: Durable Objects does not by itself supply the end-user account/authentication layer required by this roadmap, so choosing it as the primary foundation would introduce an additional identity provider or a custom authentication system earlier than necessary.

Do not combine providers unless later two-device evidence proves a concrete limitation in the single-provider Firebase design.

Official sources:

- Durable Objects overview: https://developers.cloudflare.com/durable-objects/concepts/what-are-durable-objects/
- Durable Objects WebSockets: https://developers.cloudflare.com/durable-objects/best-practices/websockets/
- Durable Objects pricing: https://developers.cloudflare.com/durable-objects/platform/pricing/
- D1 pricing: https://developers.cloudflare.com/d1/platform/pricing/

## Cost and operational guardrails

1. Phase 1B creates no provider account and incurs no project cost.
2. Initial implementation should use local deterministic tests and Firebase Local Emulator Suite wherever possible.
3. A later provider-connection candidate may create a Firebase project only after its exact data inventory, security rules, rollback/disable path and secret/public-config boundary are documented.
4. Do not enable paid services by default.
5. If Blaze becomes necessary, document why, expected two-manager usage, budget alerts, maximum-instance or equivalent cost controls, and rollback before enabling it.
6. Firebase budget alerts are alerts rather than hard spending caps; never describe them as guaranteed charge prevention.
7. Production remote state must always retain local export/recovery escape hatches.

## Data-location and retention boundary

No region is selected by this decision. Region selection belongs to the later remote schema/data-inventory candidate because it must account for the managers' actual locations, latency, retention and provider restrictions at implementation time.

No remote retention period is selected here. Tombstone retention, audit/security-log retention and account deletion are separate Phase 1C decisions.

## Rollback / disable boundary

Provider integration must be feature-gated so the local-only application remains usable if Firebase is disabled, unavailable, misconfigured or rejected in later validation.

At no point may cloud enablement remove Candidate A export, Candidate B analysis, Candidate C recovery, multi-Save portability or local-only operation without a later explicit owner decision.

## Next prerequisite

After this provider decision is merged and proven, the next bounded Cloud/Sync Readiness prerequisite is Phase 1C: private remote data inventory, privacy and retention policy.

Do not begin account/auth runtime, pairing, Connected Rivalry or Remote Joining before the intervening Cloud/Sync readiness gates are complete.
