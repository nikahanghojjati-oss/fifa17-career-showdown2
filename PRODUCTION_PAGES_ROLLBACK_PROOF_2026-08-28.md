# Production GitHub Pages Rollback Proof — 2026-08-28

Status: PROVEN / CONSUMED

Repository: `nikahanghojjati-oss/fifa17-career-showdown2`
Proof publication main: `32c32afb1365c9ae6120d810a68e5c72c4b8229a`
Publication PR: #166 — `Prove reversible production Pages rollback`
Known-good rollback target: `2964527c4f7fc80b16d6d5ce73bd4f5823487d2c` — `v1.8.1 / 1.8.1-r4`
Restored production runtime: `v1.8.1 / 1.8.1-r5`
Dedicated proof workflow: `Prove Production Pages Rollback`
Workflow run: `33190961085`
Result: SUCCESS

## What the production drill proved

The one-shot serialized GitHub Pages production drill built both artifacts before production was changed, deployed the exact known-good r4 runtime, independently verified the public production site exposed both the r4 HTML asset revision and r4 production Firebase runtime revision, restored the exact publication artifact carrying r5, independently verified the public production site exposed both r5 identities again, and passed the final seal requiring both boundaries.

Successful jobs and critical steps in run `33190961085`:

1. `build-proof-artifacts` — SUCCESS.
2. `deploy-rollback` — SUCCESS.
3. `Verify r4 is actually live in production` — SUCCESS.
4. `restore-current` — SUCCESS.
5. `Restore exact current r5 artifact` — SUCCESS.
6. `Verify r5 is restored live in production` — SUCCESS.
7. `seal-proof` / `Require both rollback and restoration proof` — SUCCESS.

The workflow shares the existing `pages-production` concurrency group with normal production publication and uses `cancel-in-progress: false`. The restore job is guarded with `always()` after successful artifact construction so the current r5 artifact is restored even if rollback deployment or rollback verification fails.

## Safety boundary

This proof changes GitHub Pages application bytes only. It does not publish or mutate Firebase Security Rules, provider IAM, billing, App Check enforcement, Auth scopes/persistence, canonical production data, canonical local browser data, or historical rivalry `pair_a07108...756fb`.

Firebase remains Spark / zero billing. App Check enforcement remains OFF. Firestore remains memory-only in the client. Google Auth remains popup-only `browserSessionPersistence` with no extra scopes. Trusted-runtime IAM remains unactivated/unbroadened. Exactly two private managers and all Candidate A/B/C and canonical-storage locks remain unchanged.

## RJR consequence

This is a newly proven capability that `REMOTE_JOINING_READINESS.json` explicitly listed as uncredited before the drill: production rollback proof. Under fixed model RJR-1, the `real-device-hardening-release` domain advances by exactly one point, from 7/10 to 8/10, and total Remote Joining readiness advances exactly `84 → 85`.

No duplicate credit is awarded for source edits, workflow construction, PR #166, CI volume, merge, documentation, SLE packaging, or the restoration deployment itself. The single point represents the bounded production rollback-and-exact-restoration capability.

## Strict nonclaims

This proof does not prove strengthened `firestore.spark.rules` are currently provider-live. It does not prove authenticated third-account or revoked registered-device production negatives, two-physical-network behavior, Remote Joining-specific real-device token-lifecycle acceptance, production provider abuse acceptance, actual Stage 5 Remote Joining sessions, or final stable Remote Joining release acceptance.

Stage 5 remains locked until its explicit preconditions genuinely close.

## Do not repeat

The r5 → r4 → r5 production rollback drill is consumed proof. Do not edit the one-shot trigger merely to rerun it for confidence. A future rollback exercise is justified only by a genuinely new recovery requirement or regression, not by desire for duplicate RJR credit.
