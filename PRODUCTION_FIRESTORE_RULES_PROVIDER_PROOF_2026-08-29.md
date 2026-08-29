# Production Firestore Rules provider proof — 2026-08-29

Status: PROVIDER-VERIFIED DEPLOYED

Production project: `fifa17-career-showdown-prod`
Database: `(default)`
Rules source: `firestore.spark.rules`
Repository source blob SHA: `2b7c0b166ae0aae7ab7a3ce84725b21091262484`
Repository publication boundary: live `main` `cbdc8cbf12f53b1bb60e6e1306f070a11ae6ccbc` after PR #169

## Provider-authoritative evidence

On 2026-08-29 ET the owner supplied a continuous set of Firebase Console screenshots from the production project `fifa17-career-showdown-prod` on Cloud Firestore > Database `(default)` > Rules. The Rules version history shows a newly published provider version labeled `Today · 7:48 AM` selected in the console.

The screenshots visibly traverse the strengthened rules source from the beginning through the final deny-by-default boundary. Visible anchors include:

- `rules_version = '2'`
- `validHash` and `validIdempotencyKeyHash`
- `activeAccount`, `activeActor`, `activeDevice`, `activeOwnedDevice`
- `validDeviceCreate` and `validDeviceRevoke`
- strict profile/save/manager-slot validation
- private pairing create/redeem/revoke validation
- `currentlyEntitled(rivalryId)`
- `activePairedRivalry(rivalryId)` with exactly two distinct authorized account IDs and both active accounts
- bounded shared-state season count of at most 10
- idempotency receipt coupling and authoritative mutation timing controls
- `capabilityCanReadPendingRivalry(rivalryId)`
- rivalry `get` authorization via `currentlyEntitled(rivalryId) || capabilityCanReadPendingRivalry(rivalryId)`
- state/idempotency/invite/session restrictions
- final `match /{document=**}` with `allow read, write: if false`

The visible source anchors and line progression match the reviewed repository `firestore.spark.rules` candidate whose blob SHA is recorded above. This is direct authenticated provider evidence and supersedes the prior nonclaim that strengthened production Rules publication was unverified.

## Scope and nonclaims

This proof establishes provider publication of the strengthened Firestore Rules only. It does not by itself prove a third-account denial, revoked-device provider mutation denial, two-network Remote Joining behavior, actual Stage 5 session behavior or final release acceptance.

No credit is awarded for PR #169, CI, GitHub Pages, documentation, or the existence of a deployment path. Any RJR change must be tied only to the newly closed provider-backed strengthened security publication capability.

## Permanent locks preserved

Firebase remains Spark / zero billing. Firestore remains memory-only. Google Auth remains popup-only with `browserSessionPersistence` and no extra scopes. App Check enforcement remains OFF. Trusted-runtime IAM remains unactivated and unbroadened. Exactly two private managers remain required. Public discovery, community, matchmaking and global rankings remain prohibited. Canonical local storage and Candidate C authority are unchanged. Historical rivalry `pair_a07108...756fb` must not be forced, edited or deleted.
