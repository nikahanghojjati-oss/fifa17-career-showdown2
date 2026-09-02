# Stage 5D Production Rules Provider-Live Proof — 2026-09-02

Status: VERIFIED PROVIDER-LIVE

This proof records the first permanent zero-billing provider publication of the reviewed Stage 5D Firestore Rules source after the repository-owned GitHub Actions control plane was installed.

## Immutable source and provider identity

- Repository: `nikahanghojjati-oss/fifa17-career-showdown2`
- Main commit containing the successful corrected provider workflow: `0915ac0bbe78dfd541b4a66379959b5643ffa0b5`
- Reviewed repository Rules source: `firestore.spark.rules`
- Exact repository/provider Git blob identity: `363af783d7e5436fdfaa3766d4aa413fc9952a08`
- Firebase project: `fifa17-career-showdown-prod`
- Live release: `projects/fifa17-career-showdown-prod/releases/cloud.firestore`
- Provider ruleset: `projects/fifa17-career-showdown-prod/rulesets/30b5b1be-0f61-4983-bdb2-c79f93f99be4`

## Permanent authenticated control plane

- Workflow: `.github/workflows/deploy-firestore-rules-zero-billing.yml`
- GitHub Actions repository secret name: `FIREBASE_RULES_SERVICE_ACCOUNT_JSON`
- Credential value is intentionally absent from repository source and must never be copied into a handoff, issue, PR, log or chat.
- Google IAM role: `roles/firebaserules.admin` only for the dedicated Rules deployment service account.
- Firebase remains Spark.
- Billing, Blaze, payment methods, Cloud Run, Cloud Functions and broad Firebase/Google IAM roles remain forbidden.

## Successful provider execution

- GitHub Actions run: `33575616044`
- Job: `100078816667`
- Result: SUCCESS
- Authentication step: SUCCESS
- `Publish only Firestore Security Rules through Firebase Rules API`: SUCCESS
- `Independently read provider Rules back and prove exact source identity`: SUCCESS

Provider log evidence:

`PROVIDER_FIRESTORE_RULES_RELEASE_UPDATED projects/fifa17-career-showdown-prod/rulesets/30b5b1be-0f61-4983-bdb2-c79f93f99be4`

`PROVIDER_FIRESTORE_RULES_EXACT_SOURCE_PASS 363af783d7e5436fdfaa3766d4aa413fc9952a08`

The readback step queried the live `cloud.firestore` release, fetched the referenced provider Ruleset, compared the complete provider source to `firestore.spark.rules`, and independently calculated the Git blob identity. The provider and repository source matched exactly.

## RJR accounting

Remote Joining readiness remains 87/100 after this proof. This milestone closes the production Rules provider boundary and the permanent authenticated deployment path, but it does not itself make Remote Joining playable. Under RJR-1, no readiness points are awarded for deployment plumbing, provider publication, CI or handoff work alone.

The next genuine capability milestone is the separate Stage 5E production host/join runtime UX, followed by real two-account and two-device/network session evidence.

## Permanent safety locks

1. Never enable billing or Blaze to operate this control plane.
2. Never add Service Usage, Owner, Editor, Firebase Admin, Cloud Run or Cloud Functions privileges merely to deploy Rules.
3. Never expose `FIREBASE_RULES_SERVICE_ACCOUNT_JSON` to pull-request code or user-visible output.
4. Never treat a successful deploy command alone as provider proof; exact live Rules source readback remains mandatory.
5. Never manually edit production Rules in Firebase Console as the normal source of truth. Repository-reviewed `firestore.spark.rules` is authoritative.
6. App Check enforcement remains OFF unless a later independently authorized milestone changes it.
7. Firestore browser persistence remains memory-only.
8. Canonical local Career Mode saves remain local-first and unchanged by Rules publication.
