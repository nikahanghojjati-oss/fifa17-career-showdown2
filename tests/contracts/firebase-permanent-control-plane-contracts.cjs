const fs = require("node:fs");

function read(path){ return fs.readFileSync(path, "utf8"); }
function assert(condition, message){ if(!condition) throw new Error(message); }
function includesAll(text, values, label){
  for(const value of values) assert(text.includes(value), `${label} must preserve ${JSON.stringify(value)}.`);
}

const workflowPath = ".github/workflows/deploy-firestore-rules-zero-billing.yml";
const publisherPath = "scripts/publish-firestore-rules-zero-billing.mjs";
const guardsPath = "CURRENT_PRODUCT_GUARDS.json";
for(const path of [workflowPath,publisherPath,guardsPath,".gitignore"]){
  assert(fs.existsSync(path), `Permanent Firebase control-plane file is missing: ${path}`);
}
const workflow=read(workflowPath);
const publisher=read(publisherPath);
const guards=JSON.parse(read(guardsPath));
const gitignore=read(".gitignore");

// Product/cost authority comes from current machine guards, not handoff inheritance prose.
assert(guards.provider.billingEnabled===false,"Billing must remain disabled.");
assert(guards.provider.firebasePlan==="Spark","Firebase must remain Spark.");
assert(guards.provider.cloudBillingAccountAllowed===false,"Cloud Billing linkage must remain forbidden.");
assert(guards.provider.blazeAllowed===false,"Blaze must remain forbidden.");
assert(guards.provider.cloudRunAllowed===false,"Cloud Run must remain forbidden.");
assert(guards.provider.cloudFunctionsAllowed===false,"Cloud Functions must remain forbidden.");

includesAll(workflow,[
  "Deploy Firebase Firestore Rules - Zero Billing","workflow_dispatch:","push:","branches:","- main",
  "firestore.spark.rules","firestore.shared-setup-production.fragment.rules","scripts/build-production-firestore-rules.mjs",
  publisherPath,"firebase.production.rules.json","ops/firebase-rules-deploy-request.json","contents: read",
  "github.repository == 'nikahanghojjati-oss/fifa17-career-showdown2'","github.ref == 'refs/heads/main'",
  "FIREBASE_PROJECT_ID: fifa17-career-showdown-prod","FIREBASE_RULES_FILE: firestore.spark.generated.rules",
  "shared-showdown-setup-production-provider-emulator.cjs","google-github-actions/auth@v3",
  "credentials_json: ${{ secrets.FIREBASE_RULES_SERVICE_ACCOUNT_JSON }}","GOOGLE_APPLICATION_CREDENTIALS",
  "node scripts/publish-firestore-rules-zero-billing.mjs"
],"Permanent Firebase deployment workflow");

includesAll(publisher,[
  "fifa17-career-showdown-prod","https://oauth2.googleapis.com/token","urn:ietf:params:oauth:grant-type:jwt-bearer",
  "RSA-SHA256","https://firebaserules.googleapis.com/v1/${path}","`projects/${project}/rulesets`",
  "`projects/${project}/releases/cloud.firestore`","release:{name:releasePath,rulesetName:ruleset.name}",
  "updateMask:'rulesetName'","PROVIDER_FIRESTORE_RULES_RELEASE_UPDATED","Provider source did not exactly match",
  "PROVIDER_FIRESTORE_RULES_EXACT_SOURCE_PASS"
],"Permanent Firebase Rules-only publisher helper");

assert(workflow.indexOf("shared-showdown-setup-production-provider-emulator.cjs") < workflow.indexOf("google-github-actions/auth@v3"),"Adversarial generated-Rules proof must run before production credentials are loaded.");
assert(workflow.indexOf("google-github-actions/auth@v3") < workflow.indexOf("node scripts/publish-firestore-rules-zero-billing.mjs"),"Firebase authentication must occur before the reviewed publisher helper runs.");
assert(!/(^|\n)\s*pull_request\s*:/m.test(workflow),"Production credentials must never be exposed to pull_request code.");
assert(!/(^|\n)\s*pull_request_target\s*:/m.test(workflow),"Production credentials must never be exposed to pull_request_target code.");
assert(!workflow.includes("FIREBASE_TOKEN"),"Do not fall back to legacy FIREBASE_TOKEN authentication.");
assert(!workflow.includes("token_format: access_token"),"Do not require auth-action access-token generation or Token Creator IAM.");
assert(!workflow.includes("roles/iam.serviceAccountTokenCreator"),"Do not require Service Account Token Creator IAM.");
assert(!workflow.includes("steps.google-auth.outputs.access_token"),"Do not depend on an auth-action access-token output.");
assert(!workflow.includes("serviceusage.googleapis.com"),"Rules publication must not require Service Usage preflight access.");
assert(!workflow.includes("deploy --only firestore:rules"),"Do not reintroduce the Firebase CLI deployment preflight.");
assert(!/firebase\s+deploy[^\n]*(functions|hosting|storage)/i.test(workflow),"Permanent Firebase workflow must deploy Firestore Rules only.");
const executableWorkflow=workflow.split("\n").filter(line=>!/^\s*#/.test(line)).join("\n");
assert(!/gcloud\s+(billing|run|functions)/i.test(executableWorkflow),"Executable workflow must not activate billing, Cloud Run or Functions.");
assert(!/billingAccounts|cloudfunctions\.googleapis|run\.googleapis/i.test(publisher),"Publisher must not call billing, Functions or Run control planes.");
assert(!/firebase-functions|firebase-storage|getFunctions|getStorage/i.test(publisher),"Publisher must remain Rules API-only.");
assert(!/-----BEGIN PRIVATE KEY-----/.test(workflow+publisher),"Repository control-plane files must never contain a service-account private key.");
assert(gitignore.split(/\r?\n/).includes("gha-creds-*.json"),".gitignore must ignore generated credential files.");

process.stdout.write("PASS current zero-billing Firebase control plane: main-only credential boundary, pre-auth adversarial Rules proof, Rules-only publisher and no billing/Run/Functions expansion are protected without handoff inheritance.\n");
