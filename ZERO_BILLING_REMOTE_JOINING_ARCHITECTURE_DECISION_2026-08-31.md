# Zero-Billing Remote Joining Architecture Decision — 2026-08-31

## Decision

Private Remote Joining must ship without attaching a billing account. The production critical path is therefore existing Firebase Google Authentication plus direct Cloud Firestore client operations protected by exact-path Security Rules on the Spark plan and the existing GitHub Pages frontend.

Stage 5B's non-extractable-key and per-sign-in custom-token candidate remains preserved as valid dormant research. It is removed from the production critical path because its trusted issuer requires a billed backend route. This is a forward architecture selection, not a rollback of its evidence.

## Provider facts

Firebase documents that Spark needs no payment information, includes no-cost social sign-in and includes bounded no-cost Firestore quotas. It also documents that using Cloud Run requires linking a Cloud Billing account and upgrades the Firebase project to Blaze. See [Firebase pricing plans](https://firebase.google.com/docs/projects/billing/firebase-pricing-plans).

Cloud Run's own setup guide requires billing to be enabled even though Cloud Run offers a free usage tier. A free tier is therefore not compatible with the owner's stricter no-billing-account rule. See [Cloud Run setup](https://cloud.google.com/run/docs/setup).

Firestore's current no-cost quota is one free database, 1 GiB stored data, 50,000 document reads per day, 20,000 writes per day, 20,000 deletes per day and 10 GiB monthly outbound transfer. Exceeding quota requires billing, so the app must fail safely instead. See [Firestore usage and limits](https://firebase.google.com/docs/firestore/quotas).

Firestore Security Rules can authorize by `request.auth.uid`, validate incoming state and read exact authority documents with `get()` or `getAfter()`. Those capabilities are sufficient for the bounded two-account private-session protocol without a trusted server. See [Firestore Rules conditions](https://firebase.google.com/docs/firestore/security/rules-conditions).

## Successor production slice

The next bounded product slice is `stage5c-zero-billing-standard-auth-session-adapter`:

1. Preserve existing popup-only Google Authentication and `browserSessionPersistence`.
2. Replace the Stage 5 candidate's mandatory custom device claims with standard Google-token account identity at the session Rules boundary.
3. Keep the exact opaque session ID, no collection listing, exactly two entitled rivalry accounts, host-only open, peer-only join and terminal close, revoke and expiry semantics.
4. Treat registered device IDs only as account-owned mutation metadata. Do not claim that a browser-provided ID is provider-verifiable or cryptographically device-bound.
5. Keep Firestore memory-only and preserve local-only operation when authentication, Firestore or quota is unavailable.
6. Prove the revised client and Rules with deterministic tests plus Auth and Firestore emulators before any production publication.
7. Publish the minimum reviewed session Rules only after exact-head gates pass, then add host/join UX in a separate reviewed runtime slice.
8. Obtain production RJR credit only from provider-live playable evidence, never from this decision, source, emulators, CI or documentation.

## Preserved locks

Production remains `v1.8.1 / 1.8.1-r5` until a reviewed runtime slice changes it. Current `firestore.spark.rules` remains unchanged until the separate Rules publication gate. App Check enforcement remains off. There are exactly two private managers and no public discovery, listing, community, matchmaking or rankings. Canonical storage remains exactly the three existing keys. Candidate C remains the sole destructive remote-to-local Apply authority. The protected historical rivalry remains untouched.
