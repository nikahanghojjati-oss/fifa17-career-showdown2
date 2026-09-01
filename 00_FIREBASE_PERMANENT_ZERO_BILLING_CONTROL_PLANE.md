# Permanent Zero-Billing Firebase Control Plane

This file is permanent project infrastructure and must be preserved recursively in every future SLE/WEC handoff until the owner explicitly replaces the design.

## Goal

Give every future Work environment a durable authenticated route capable of publishing and independently verifying Firebase Firestore Security Rules for project `fifa17-career-showdown-prod` without giving ChatGPT, a local shell, or repository source code a long-lived credential.

The credential lives only in GitHub Actions encrypted secrets. Future Work environments use the repository-owned workflow. They never read, print, copy, request, or paste the credential.

Firebase must remain on Spark. Billing, Blaze, Cloud Run, payment methods, billing-account linking, paid credits, and any provider capability that requires billing remain permanently forbidden.

## Why this design

Firebase recommends Application Default Credentials for CI systems. A narrowly permissioned Google service account stored as a GitHub Actions encrypted secret supplies ADC to the deployment workflow.

Do not use Workload Identity Federation as the guaranteed zero-billing path for this project while Google documents billing-enabled project setup as a prerequisite for deployment-pipeline WIF configuration.

Do not use `FIREBASE_TOKEN` as the normal path. Firebase documents it as legacy and less secure than ADC.

## One-time owner setup

Perform this once. Future Work environments should not ask again after the workflow has produced one successful authenticated provider proof.

### 1. Select the existing Firebase project

Open Google Cloud Console and select project:

`fifa17-career-showdown-prod`

Do not enable billing. Do not upgrade Firebase from Spark.

### 2. Create a dedicated service account

Go to IAM & Admin -> Service Accounts -> Create service account.

Recommended service account name:

`github-firestore-rules-deployer`

Recommended description:

`Zero-billing GitHub Actions identity for Career Mode Showdown Firestore Security Rules only.`

### 3. Grant only Firebase Rules Admin

Grant exactly this predefined role to the service account:

`Firebase Rules Admin` / `roles/firebaserules.admin`

Do not grant Owner, Editor, Firebase Admin, Firestore data roles, Service Account Admin, Billing roles, Cloud Run roles, Cloud Functions roles, or broad project administration merely to make deployment easier.

If a future real Firebase CLI error proves one additional permission is genuinely required, preserve the failure evidence and add only that exact permission after review. Never broaden access speculatively.

### 4. Create one JSON key

Open the new service account -> Keys -> Add key -> Create new key -> JSON.

Treat the downloaded JSON file like a password. Never commit it, upload it to the repository, paste it into ChatGPT, put it in an issue/PR, or send it through email/chat.

### 5. Store it once in GitHub Actions

Open the GitHub repository:

`nikahanghojjati-oss/fifa17-career-showdown2`

Go to Settings -> Secrets and variables -> Actions -> New repository secret.

Secret name must be exactly:

`FIREBASE_RULES_SERVICE_ACCOUNT_JSON`

Paste the complete JSON key as the secret value and save it.

After confirming the GitHub secret exists, securely delete the downloaded local JSON copy. GitHub should become the only retained copy of that key material.

### 6. Run the permanent workflow once

Open GitHub -> Actions -> `Deploy Firebase Firestore Rules - Zero Billing` -> Run workflow -> run from `main`.

The workflow must authenticate using the GitHub secret, run the Stage 5D Rules contract, deploy only Firestore Rules using `firebase.production.rules.json`, then read the live Firebase Rules release and full ruleset source back through the Firebase Rules API. It fails unless the provider source exactly matches repository `firestore.spark.rules`.

The first successful run proves the permanent control plane is installed. Preserve that run ID and provider blob/source identity as production evidence.

## Future Work environment protocol

Every fresh Work environment must:

1. Read this file during Remote Joining provider/deployment work.
2. Never ask the owner for the JSON credential after the permanent workflow has been proven.
3. Never attempt to retrieve the GitHub Actions secret. Secret unreadability is expected and desirable.
4. Use `.github/workflows/deploy-firestore-rules-zero-billing.yml` as the authenticated provider mutation route.
5. Require all normal source, contract, exact-head, review, merge, and WEC/SLE gates before intentionally triggering production Rules publication.
6. For a new Rules source, merge the reviewed `firestore.spark.rules`/config change to `main`; the permanent workflow is allowed to run on that protected production source transition.
7. To intentionally redeploy an unchanged reviewed Rules source, create or update `ops/firebase-rules-deploy-request.json` through the normal reviewed PR process. A main-branch change to that request path is an explicit deployment trigger.
8. Independently inspect the workflow result and provider verification evidence. Never count a command invocation alone as provider proof.
9. Do not move RJR for credential installation, CI automation, workflow success, source publication mechanics, or documentation alone. RJR moves only on genuine fixed-domain capability evidence under `REMOTE_JOINING_READINESS.json`.

## Permanent security restrictions

The deployment workflow must never:

- deploy Functions, Cloud Run, Hosting, Storage, Auth configuration, indexes, or unrelated Firebase products;
- enable billing or Blaze;
- link a billing account or add a payment method;
- use the service account to read or write application Firestore documents;
- expose credentials in logs or artifacts;
- run with production credentials on `pull_request` or `pull_request_target` code;
- accept a repository/project target other than `nikahanghojjati-oss/fifa17-career-showdown2` and `fifa17-career-showdown-prod`;
- treat a missing secret as permission to fall back to a paid service or a broader credential.

## Rotation and emergency revocation

If the credential is suspected compromised:

1. Disable or delete the affected service-account key in Google Cloud immediately.
2. Delete or replace GitHub secret `FIREBASE_RULES_SERVICE_ACCOUNT_JSON`.
3. Create a replacement JSON key for the same narrowly permissioned service account.
4. Save the replacement under the same GitHub secret name.
5. Run the workflow and independently verify provider Rules identity again.

Because the workflow and secret name remain stable, future Work environments do not need new handoff instructions after a normal key rotation.

## If JSON key creation is unavailable

Stop and record the exact IAM/organization-policy blocker. Do not enable billing to obtain another authentication system. Do not silently broaden roles.

A legacy `FIREBASE_TOKEN` can technically authenticate Firebase CLI, but Firebase documents it as less secure and no longer recommended. It is not the standing project design and requires an explicit owner decision before adoption.

## Handoff inheritance

Every future SLE starter and deep successor handoff must preserve:

- this file path;
- the exact GitHub secret name `FIREBASE_RULES_SERVICE_ACCOUNT_JSON`;
- the permanent workflow path `.github/workflows/deploy-firestore-rules-zero-billing.yml`;
- the fixed Firebase project `fifa17-career-showdown-prod`;
- the service-account least-privilege target `roles/firebaserules.admin`;
- the rule that secrets are never pasted into ChatGPT or committed;
- the permanent zero-billing/Spark lock;
- the requirement to independently read provider Rules back after deployment.

If a future handoff omits this control-plane inheritance while Remote Joining still depends on Firebase provider operations, that handoff is incomplete.