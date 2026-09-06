const fs = require("node:fs");

function read(path){
  return fs.readFileSync(path, "utf8");
}
function assert(condition, message){
  if(!condition){
    throw new Error(message);
  }
}
function includesAll(text, values, label){
  for(const value of values){
    assert(text.includes(value), `${label} must preserve ${JSON.stringify(value)}.`);
  }
}

const guidePath = "00_FIREBASE_PERMANENT_ZERO_BILLING_CONTROL_PLANE.md";
const addendumPath = "HANDOFF_FIREBASE_CONTROL_PLANE_PERMANENT_ACCESS_ADDENDUM_2026-09-01.md";
const workflowPath = ".github/workflows/deploy-firestore-rules-zero-billing.yml";
const publisherPath = "scripts/publish-firestore-rules-zero-billing.mjs";

for(const path of [guidePath, addendumPath, workflowPath, publisherPath, "00_CURRENT_HANDOFF.md", ".gitignore"]){
  assert(fs.existsSync(path), `Permanent Firebase control-plane file is missing: ${path}`);
}

const guide = read(guidePath);
const addendum = read(addendumPath);
const workflow = read(workflowPath);
const publisher = read(publisherPath);
const currentHandoff = read("00_CURRENT_HANDOFF.md");
const gitignore = read(".gitignore");

const invariants = [
  "fifa17-career-showdown-prod",
  "FIREBASE_RULES_SERVICE_ACCOUNT_JSON",
  "roles/firebaserules.admin",
  ".github/workflows/deploy-firestore-rules-zero-billing.yml",
  "Firebase must remain on Spark",
  "Never commit",
  "provider"
];
includesAll(guide, invariants, "Permanent Firebase control-plane guide");

includesAll(addendum, [
  "FIREBASE_RULES_SERVICE_ACCOUNT_JSON",
  ".github/workflows/deploy-firestore-rules-zero-billing.yml",
  "fifa17-career-showdown-prod",
  "roles/firebaserules.admin",
  "Firebase must remain Spark",
  "Never ask the owner to paste",
  "Recursive handoff requirement",
  "zero RJR"
], "Permanent Firebase handoff addendum");

includesAll(currentHandoff, [
  guidePath,
  addendumPath,
  workflowPath,
  "FIREBASE_RULES_SERVICE_ACCOUNT_JSON",
  "Firebase remains Spark",
  "billing remains permanently forbidden"
], "Current handoff Firebase control-plane inheritance");

includesAll(workflow, [
  "Deploy Firebase Firestore Rules - Zero Billing",
  "workflow_dispatch:",
  "push:",
  "branches:",
  "- main",
  "firestore.spark.rules",
  "firestore.shared-setup-production.fragment.rules",
  "scripts/build-production-firestore-rules.mjs",
  publisherPath,
  "firebase.production.rules.json",
  "ops/firebase-rules-deploy-request.json",
  "contents: read",
  "github.repository == 'nikahanghojjati-oss/fifa17-career-showdown2'",
  "github.ref == 'refs/heads/main'",
  "FIREBASE_PROJECT_ID: fifa17-career-showdown-prod",
  "FIREBASE_RULES_FILE: firestore.spark.generated.rules",
  "actions/checkout@v7",
  "actions/setup-node@v6",
  "node-version: 24",
  "tests/contracts/stage5d-production-session-rules-contracts.cjs",
  "tests/contracts/shared-showdown-production-runtime-contracts.cjs",
  "shared-showdown-setup-production-provider-emulator.cjs",
  "google-github-actions/auth@v3",
  "credentials_json: ${{ secrets.FIREBASE_RULES_SERVICE_ACCOUNT_JSON }}",
  "create_credentials_file: true",
  "export_environment_variables: true",
  "GOOGLE_APPLICATION_CREDENTIALS",
  "node scripts/publish-firestore-rules-zero-billing.mjs"
], "Permanent Firebase deployment workflow");

includesAll(publisher, [
  "fifa17-career-showdown-prod",
  "https://oauth2.googleapis.com/token",
  "urn:ietf:params:oauth:grant-type:jwt-bearer",
  "RSA-SHA256",
  "https://firebaserules.googleapis.com/v1/${path}",
  "`projects/${project}/rulesets`",
  "`projects/${project}/releases/cloud.firestore`",
  "release:{name:releasePath,rulesetName:ruleset.name}",
  "updateMask:'rulesetName'",
  "PROVIDER_FIRESTORE_RULES_RELEASE_UPDATED",
  "Provider source did not exactly match",
  "PROVIDER_FIRESTORE_RULES_EXACT_SOURCE_PASS"
], "Permanent Firebase Rules-only publisher helper");

assert(workflow.indexOf("shared-showdown-setup-production-provider-emulator.cjs") < workflow.indexOf("google-github-actions/auth@v3"), "Generated production Shared Setup Rules must pass the adversarial emulator before production credentials are loaded.");
assert(workflow.indexOf("google-github-actions/auth@v3") < workflow.indexOf("node scripts/publish-firestore-rules-zero-billing.mjs"), "Permanent Firebase authentication must occur before the reviewed publisher helper runs.");
assert(!/(^|\n)\s*pull_request\s*:/m.test(workflow), "Permanent Firebase workflow must never expose production credentials to pull_request code.");
assert(!/(^|\n)\s*pull_request_target\s*:/m.test(workflow), "Permanent Firebase workflow must never expose production credentials to pull_request_target code.");
assert(!workflow.includes("FIREBASE_TOKEN"), "Permanent Firebase workflow must not fall back to legacy FIREBASE_TOKEN authentication.");
assert(!workflow.includes("token_format: access_token"), "Permanent Firebase workflow must not require google-github-actions access-token generation or Token Creator IAM.");
assert(!workflow.includes("roles/iam.serviceAccountTokenCreator"), "Permanent Firebase workflow must not require Service Account Token Creator IAM.");
assert(!workflow.includes("steps.google-auth.outputs.access_token"), "Permanent Firebase workflow must not depend on an auth-action access-token output.");
assert(!workflow.includes("serviceusage.googleapis.com"), "Permanent Firebase workflow must not require Service Usage preflight access merely to publish already-enabled Firestore Rules.");
assert(!workflow.includes("deploy --only firestore:rules"), "Permanent Firebase workflow must not reintroduce the Firebase CLI deployment preflight.");
assert(!/firebase\s+deploy[^\n]*(functions|hosting|storage)/i.test(workflow), "Permanent Firebase workflow must deploy Firestore Rules only.");
assert(!/gcloud\s+(billing|run|functions)/i.test(workflow), "Permanent Firebase workflow must not contain billing, Cloud Run, or Functions activation commands.");
assert(!/billingAccounts|cloudfunctions\.googleapis|run\.googleapis/i.test(publisher), "Permanent Firebase publisher helper must not call billing, Cloud Functions, or Cloud Run control planes.");
assert(!/firebase-functions|firebase-storage|getFunctions|getStorage/i.test(publisher), "Permanent Firebase publisher helper must remain Rules API-only.");
assert(!/-----BEGIN PRIVATE KEY-----/.test(guide + addendum + workflow + publisher), "Repository control-plane files must never contain a service-account private key.");
assert(gitignore.split(/\r?\n/).includes("gha-creds-*.json"), ".gitignore must ignore google-github-actions generated credential files.");

process.stdout.write("PASS permanent zero-billing Firebase control-plane contracts: main-only workflow topology, pre-auth adversarial generated-Rules proof, reviewed OAuth/Rules-only publisher helper, exact provider readback, and no billing/Run/Functions expansion are protected.\n");