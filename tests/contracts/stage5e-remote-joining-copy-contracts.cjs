const A = require("node:assert/strict");
const fs = require("node:fs");
const read = path => fs.readFileSync(path,"utf8");

const account = read("js/sparkConnectedAccount.js");
const rivalry = read("js/sparkConnectedRivalry.js");
const remoteJoining = read("js/sparkRemoteJoining.js");

for(const stale of [
  "Remote Joining sessions remain locked.",
  "Locked · Stage 5 sessions not enabled",
  "Stage 5 · still locked"
]){
  A.ok(!account.includes(stale), `Connected Account reintroduced stale Remote Joining copy: ${stale}`);
  A.ok(!rivalry.includes(stale), `Connected Rivalry reintroduced stale Remote Joining copy: ${stale}`);
}

A.match(account,/Private Remote Joining is available from Showdown Home after its account, registered-device, and Connected Rivalry requirements are satisfied\./);
A.ok(account.includes('["REMOTE JOINING","Available from Showdown Home · private requirements apply"]'));
A.match(rivalry,/Private Remote Joining is available from Showdown Home after this rivalry and registered-device requirements are satisfied\./);
A.ok(rivalry.includes('["REMOTE JOINING","Available from Showdown Home · exact private session"]'));

// Copy repair must not broaden authority. Connected Rivalry still does not own session
// mutations; Stage 5E retains that separate, exact-capability runtime boundary.
A.ok(account.includes('firestorePersistence:"memory-only"'));
A.ok(account.includes('billingRequired:false'));
A.ok(rivalry.includes('publicDiscovery:false'));
A.ok(rivalry.includes('automaticLocalApply:false'));
A.ok(rivalry.includes('localApplyAuthority:"candidate-c-explicit-confirmed-only"'));
A.ok(rivalry.includes('remoteJoiningSessions:false'));
A.ok(rivalry.includes('billingRequired:false'));
A.ok(remoteJoining.includes('billingRequired:false'));
A.ok(remoteJoining.includes('publicDiscovery:false'));

process.stdout.write("PASS Stage 5E Remote Joining copy truth: live Home availability is visible without broadening Connected Rivalry, billing, discovery or Candidate C authority\n");
