# Handoff Addendum — Permanent Zero-Billing Firebase Control Plane

This addendum extends the sealed v1.4.35 / PR #177 successor package without rewriting its historical evidence. It is current handoff authority for Firebase provider access and must be preserved recursively by every future SLE/WEC handoff while Remote Joining depends on Firebase production provider operations.

## Live transition truth

PR #177 `Seal PR176 Stage5D provider-pending SLE transition` is merged as main `28816ffe8c2b46791b992d3673ebd6aa745d5fd5`.

All 15 normal post-merge/Pages workflow families are now successful after one unchanged Stability retry. The first Stability attempt encountered a transient deployed browser load failure for `js/footballVisuals.js`; exact deployed runtime bytes had already verified. The unchanged retry passed the previously failing Home/loading audit and the entire deployed journey. No runtime source repair was required.

Remote Joining readiness remains fixed at 87/100. The permanent provider-control-plane installation is infrastructure and receives zero RJR credit by itself.

## Permanent provider-access design

Read first when provider access is needed:

`00_FIREBASE_PERMANENT_ZERO_BILLING_CONTROL_PLANE.md`

Permanent repository workflow:

`.github/workflows/deploy-firestore-rules-zero-billing.yml`

Permanent GitHub Actions secret name:

`FIREBASE_RULES_SERVICE_ACCOUNT_JSON`

Fixed Firebase project:

`fifa17-career-showdown-prod`

Intended service-account role:

`roles/firebaserules.admin`

The owner performs the one-time credential installation in Google Cloud and GitHub. Future Work environments do not receive or retrieve the JSON credential. They obtain authenticated Firebase provider capability only by invoking or triggering the repository-owned GitHub Actions workflow after normal review/publication gates.

Never ask the owner to paste the service-account JSON into ChatGPT. Never commit the JSON. Never print or export the GitHub Actions secret. GitHub secret unreadability is expected and is part of the security design.

## Permanent zero-billing lock

Firebase must remain Spark.

Never enable Blaze, Cloud Billing, Cloud Run, paid review credits, a payment method, or any service whose activation requires billing. Never broaden provider access merely to bypass the zero-billing architecture.

The workflow is Firestore Security Rules only. It must not deploy Functions, Cloud Run, Hosting, Storage, Auth configuration, indexes, or unrelated Firebase products.

## One-time installation completion criterion

The permanent access route is not considered installed merely because the workflow file exists.

Installation is complete only after:

1. the owner creates the narrowly permissioned service account and saves its JSON only as GitHub Actions secret `FIREBASE_RULES_SERVICE_ACCOUNT_JSON`;
2. the permanent workflow runs from `main` successfully;
3. the workflow deploys only `firestore.spark.rules` using `firebase.production.rules.json` to project `fifa17-career-showdown-prod`;
4. the workflow independently reads the active `cloud.firestore` Firebase Rules release/ruleset back from the Firebase Rules API;
5. provider source content exactly equals repository `firestore.spark.rules` and the provider Git blob identity equals the reviewed repository blob;
6. evidence records the successful workflow run ID and verified provider source identity without exposing the credential.

Until those conditions are satisfied, preserve provider publication as pending. Do not fabricate provider-live state.

## Future Work environment protocol

Every fresh Work environment must independently verify live main and current provider evidence, validate/archive its predecessor WEC, initialize a fresh unique WEC with reset counters, and obey its own `npm run work:assess` decision.

For Firebase provider mutations, future environments must use the permanent repository workflow rather than asking for an interactive Firebase login or a credential in chat.

For a newly reviewed Rules source, the workflow may be triggered by the protected main transition of `firestore.spark.rules` or `firebase.production.rules.json`.

For a deliberate redeployment of an unchanged Rules source, use a normal reviewed PR that creates or updates `ops/firebase-rules-deploy-request.json`; merging that request to `main` is an explicit provider-publication trigger. The Actions `Run workflow` control is also an allowed owner/operator trigger when the reviewed source is already on `main`.

A successful deploy command alone is not sufficient evidence. Provider source readback and exact identity verification remain mandatory.

## Credential rotation

If the service-account key is rotated, preserve the same service account scope, workflow path, and GitHub secret name. Replace the secret value in GitHub and independently rerun provider verification. No future handoff rewrite is required for ordinary rotation.

If service-account key creation is blocked by IAM or organization policy, record the exact blocker and ask the owner for only the minimum nonbilling action required to resolve that specific policy boundary. Never activate billing as a workaround.

## Recursive handoff requirement

Every future versioned starter and deep SLE handoff must preserve or explicitly point to this addendum and `00_FIREBASE_PERMANENT_ZERO_BILLING_CONTROL_PLANE.md` until the project no longer requires Firebase production provider access.

A future handoff is incomplete if it drops any of these invariants:

- secret name `FIREBASE_RULES_SERVICE_ACCOUNT_JSON`;
- workflow `.github/workflows/deploy-firestore-rules-zero-billing.yml`;
- project `fifa17-career-showdown-prod`;
- least-privilege target `roles/firebaserules.admin`;
- credentials never pasted into ChatGPT or committed;
- Firebase remains Spark and billing remains forbidden;
- provider Rules are independently read back and source-identity verified after deployment;
- installation/automation work earns zero RJR unless genuine fixed-domain capability evidence separately justifies movement.
