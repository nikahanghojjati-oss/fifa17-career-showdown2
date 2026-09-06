const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

const observerPath='acceptance/ssjrProductionStorageObservation.js';
const source=fs.readFileSync(observerPath,'utf8');
const html=fs.readFileSync('production-authorization-acceptance.html','utf8');
const worker=fs.readFileSync('service-worker.js','utf8');
const keys=[
  'careerModeShowdown.saveLibrary',
  'careerModeShowdown.legacyShowdowns',
  'careerModeShowdown.preferences'
];

assert.match(html,/<title>Production Authorization Acceptance · Career Mode Showdown<\/title>/,'Observer must remain on the existing bounded production acceptance surface.');
assert.match(worker,/NETWORK_ONLY_NAVIGATION_PATHS[\s\S]*production-authorization-acceptance\.html/,'Observer host page must remain explicitly network-only under the service worker.');
assert.match(html,/acceptance\/ssjrProductionStorageObservation\.js/,'Network-only acceptance page must load the SSJR storage observer outside the ordinary game runtime directory.');
assert.equal(fs.existsSync('js/ssjrProductionStorageObservation.js'),false,'Raw localStorage observer must not enter the ordinary js runtime boundary.');
for(const key of keys)assert.ok(source.includes(key),`Observer must read canonical key ${key}.`);
assert.match(source,/for\(const key of CANONICAL_STORAGE_KEYS\)\{\s*snapshot\[key\]=storage\.getItem\(key\);/,'Observer must capture each canonical value with exact raw getItem semantics.');
assert.match(source,/output\.textContent=JSON\.stringify\(snapshot\)/,'Raw snapshot may be exposed only as text, never HTML.');
assert.match(source,/output\.textContent="";[\s\S]+output\.hidden=true/,'Operator must be able to remove the transient raw snapshot from the page DOM.');
for(const forbidden of [
  /\.setItem\s*\(/,
  /\.removeItem\s*\(/,
  /sessionStorage/,
  /indexedDB/,
  /document\.cookie/,
  /\bfetch\s*\(/,
  /XMLHttpRequest/,
  /sendBeacon/,
  /WebSocket/
])assert.doesNotMatch(source,forbidden,'SSJR storage observer must remain read-only, local and non-networked.');
for(const forbiddenIdentifier of ['accountId','deviceId','rivalryId','sessionId','pairingCode','pairingCapability']){
  assert.equal(source.includes(forbiddenIdentifier),false,`Storage observer must not capture private identifier field ${forbiddenIdentifier}.`);
}
assert.match(source,/readOnly:true/);
assert.match(source,/persistentCapture:false/);
assert.match(source,/privateIdentifierCapture:false/);

const context={console};
vm.createContext(context);
vm.runInContext(source,context,{filename:observerPath});
const api=context.CareerModeSSJRProductionStorageObservation;
assert.ok(api,'Observer API must be exposed for deterministic contract proof.');
assert.equal(api.readOnly,true);
assert.equal(api.persistentCapture,false);
assert.equal(api.privateIdentifierCapture,false);
assert.equal(JSON.stringify(api.canonicalStorageKeys),JSON.stringify(keys));

const exactValues={
  [keys[0]]:' { "saves" : [ { "name" : "Raw ⚽ bytes" } ] } ',
  [keys[1]]:'[\n  {"legacy":true}\n]',
  [keys[2]]:null
};
const reads=[];
const storage={getItem(key){reads.push(key);return exactValues[key];}};
const snapshot=api.captureExactCanonicalStorageSnapshot(storage);
assert.equal(JSON.stringify(snapshot),JSON.stringify(exactValues),'Observer must preserve exact raw strings and null without parse, normalize or reserialization.');
assert.equal(JSON.stringify(reads),JSON.stringify(keys),'Observer must read exactly the three canonical keys in canonical order.');
assert.equal(Object.isFrozen(snapshot),true,'Returned exact snapshot must be immutable in page memory.');

assert.throws(
  ()=>api.captureExactCanonicalStorageSnapshot({getItem(){throw new Error('blocked');}}),
  /blocked/,
  'A failed canonical read must fail the whole observation instead of fabricating a partial snapshot.'
);

process.stdout.write('PASS SSJR production storage observation: existing network-only acceptance surface exposes an explicit transient exact-raw three-key snapshot outside the ordinary game runtime directory with no writes, network transport, private identifier capture or durable evidence artifact.\n');
