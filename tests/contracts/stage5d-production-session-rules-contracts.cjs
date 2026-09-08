const assert=require("node:assert/strict");
const fs=require("node:fs");
const read=path=>fs.readFileSync(path,"utf8");
const readJson=path=>JSON.parse(read(path));

const rules=read("firestore.spark.rules");
const productionFirebase=readJson("firebase.production.rules.json");
const productionEnvironment=readJson("firebase.production.environment.json");
const guards=readJson("CURRENT_PRODUCT_GUARDS.json");
const adapter=read("js/sparkStandardAuthPrivateSession.js");
const worker=read("service-worker.js");

assert.equal(productionFirebase.firestore.rules,guards.provider.productionRulesSource,"Production deployment config must target the current reviewed Spark Rules source.");
assert.equal(productionEnvironment.projectId,"fifa17-career-showdown-prod");
assert.equal(productionEnvironment.firestore.databaseId,"(default)");
assert.equal(productionEnvironment.activation.productionSecurityRulesSource,guards.provider.productionRulesSource);
assert.equal(guards.provider.billingEnabled,false);
assert.equal(guards.provider.firebasePlan,"Spark");
assert.equal(guards.provider.cloudRunAllowed,false);
assert.equal(guards.provider.cloudFunctionsAllowed,false);

for(const invariant of [
  /registeredSessionDeviceMetadata/,
  /validOpenSessionCreate/,
  /validSessionJoin/,
  /validSessionUpdate/,
  /sessionWriteUsesRegisteredDeviceMetadata\(root\)[\s\S]+root\.updatedByAccountId == request\.auth\.uid/,
  /match \/sessions\/\{sessionId\}[\s\S]+allow get: if sessionCanRead\(rivalryId, sessionId\);[\s\S]+allow create: if validOpenSessionCreate\(rivalryId, sessionId\);[\s\S]+allow update: if validSessionUpdate\(rivalryId, sessionId\);[\s\S]+allow list, delete: if false;/,
  /match \/\{document=\*\*\} \{[\s\S]+allow read, write: if false;/
]) assert.match(rules,invariant);
assert.doesNotMatch(rules,/request\.auth\.token\.device_|deviceCredentials/,"Current production session Rules must use standard Firebase uid authority, not the superseded custom-device-claim design.");
assert.doesNotMatch(rules,/allow list: if true|allow read, write: if true/,"Current production Rules must not introduce discovery or an allow-all escape hatch.");
assert.doesNotMatch(adapter,/\blocalStorage\b|\bindexedDB\b|\bcollection\s*\(|\bgetDocs\b/,"Standard-auth session adapter must remain exact-path and memory-only.");
for(const runtimeOwner of ["index.html","js/app.js","js/productionFirebaseRuntime.js"]){
  assert.doesNotMatch(read(runtimeOwner),/sparkStandardAuthPrivateSession\.js/,`${runtimeOwner} must not eagerly bootstrap host/join runtime.`);
}
assert.match(worker,/"js\/sparkStandardAuthPrivateSession\.js"/,"The session adapter may remain a lazy precached runtime asset without executing at startup.");
process.stdout.write("PASS current Stage 5D session Rules: standard uid authority, registered-device mutation metadata, exact no-list two-account lifecycle, deny-by-default, lazy runtime separation and Spark zero-billing locks remain protected without dated provider-proof or candidate-lineage coupling.\n");
