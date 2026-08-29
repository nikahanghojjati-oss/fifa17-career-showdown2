# Production Firestore Rules deployment path

## Purpose

This file defines the narrow provider-authoritative path for publishing the strengthened `firestore.spark.rules` source to the existing production Firebase project without changing the historical Phase 1F emulator configuration.

This path exists to remove deployment ambiguity. It is not evidence that the strengthened Rules are already deployed.

## Protected historical lane

Do not modify these existing locks for this deployment:

- Root `firebase.json` continues to reference `firestore.rules`.
- Root `.firebaserc` continues to default to `demo-career-mode-showdown-phase1f`; its existing named `production` alias remains `fifa17-career-showdown-prod` but is not made the default.
- Existing Phase 1F emulator contracts remain unchanged.
- `firebase.production.environment.json` continues to record the older provider-verified `firestore.rules` deployment until new direct provider-authoritative evidence exists.

## Production-only config

`firebase.production.rules.json` is deliberately separate from root `firebase.json` and contains exactly one deployable Firebase service: Cloud Firestore Rules sourced from `firestore.spark.rules`.

It contains no Hosting, Functions, Storage, Auth, App Check, IAM, billing or index deployment configuration.

## Required project

The only authorized target for this production Rules path is:

`fifa17-career-showdown-prod`

Never rely on the root `.firebaserc` default for this operation. The production project must be supplied explicitly on the command line.

## Preflight

Before any provider mutation:

1. Confirm current repository source and live main.
2. Confirm `firebase.production.rules.json` still references exactly `firestore.spark.rules`.
3. Confirm the production environment manifest still identifies project `fifa17-career-showdown-prod` and database `(default)`.
4. Confirm the intended `firestore.spark.rules` source is the exact reviewed candidate to publish.
5. Run the complete repository contract gate and the Firestore Rules emulator/security contracts appropriate to the current head.
6. Confirm the Firebase CLI session is authenticated to an account authorized to deploy Rules to the production project.
7. Do not create provider credentials, service-account secrets, billing, IAM grants or new Firebase resources merely to execute this path.

## Exact bounded deploy command

From the repository root, with an already-authorized Firebase CLI session:

`firebase deploy --config firebase.production.rules.json --project fifa17-career-showdown-prod --only firestore`

The alternate config contains no Firestore indexes entry and no other deployable service. The explicit `--project` prevents the root Phase 1F demo default from becoming the target.

The service-level `--only firestore` form is intentional. Current Firebase CLI documentation supports service-scoped deployment, while current firebase-tools issue reports document a silent no-op class for `firestore:rules` with multi-database array configurations. This production-only config remains a single default-database object and intentionally avoids expanding into a multi-database array without a separate reviewed change.

## Provider-authoritative verification required after deploy

A successful CLI exit is necessary but not sufficient for RJR credit. Capture direct provider-authoritative evidence that the production `(default)` database accepted the strengthened source. Suitable evidence includes an authenticated Firebase Console Rules view/version, Firebase CLI provider output that identifies the released Rules source/database, or another direct authenticated provider API result.

Then verify the intended production authorization negatives against legitimate existing state. Do not infer publication from repository source, emulator tests, GitHub CI, GitHub Pages or this document.

Until direct provider-authoritative evidence exists:

- `firestore.spark.rules` production publication remains `UNVERIFIED`.
- Fixed RJR-1 remains unchanged.
- Do not rewrite `firebase.production.environment.json` to claim the strengthened source is deployed.

## Permanent safety locks

Publishing Rules must not change these independent locks:

- Firebase remains Spark / zero billing.
- Firestore client persistence remains memory-only.
- Google Auth remains popup-only with `browserSessionPersistence` and no extra scopes.
- App Check enforcement remains OFF.
- Trusted-runtime IAM remains unactivated and unbroadened.
- Exactly two private managers remain the product boundary.
- Public discovery, community, matchmaking and global rankings remain prohibited.
- Historical rivalry `pair_a07108...756fb` must not be forced, edited or deleted.
- Consumed owner/device, Candidate C destructive reconciliation, exact replay, adverse-provider, token-lifecycle, structural-abuse, sustained-rate-limit and rollback/restoration proof must not be repeated merely for confidence.
