const A = require("node:assert/strict");
const fs = require("node:fs");
const read = path => fs.readFileSync(path,"utf8");

const account = read("js/sparkConnectedAccount.js");
const rivalry = read("js/sparkConnectedRivalry.js");
const remoteJoining = read("js/sparkRemoteJoining.js");
const onlineIdentity = read("js/onlinePlayerIdentity.js");
const showdown = read("js/showdown.js");
const ruleBook = read("js/ruleBook.js");

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

// The established provider layers remain private and zero-billing while the normal
// product surface becomes the much smaller Nik/Daniel online-only experience.
A.ok(account.includes('firestorePersistence:"memory-only"'));
A.ok(account.includes('billingRequired:false'));
A.ok(rivalry.includes('publicDiscovery:false'));
A.ok(rivalry.includes('automaticLocalApply:false'));
A.ok(rivalry.includes('localApplyAuthority:"candidate-c-explicit-confirmed-only"'));
A.ok(rivalry.includes('remoteJoiningSessions:false'));
A.ok(rivalry.includes('billingRequired:false'));
A.ok(remoteJoining.includes('billingRequired:false'));
A.ok(remoteJoining.includes('publicDiscovery:false'));

// Owner-directed online-only shell: exactly Nik/Daniel, remembered registered
// browsers, no arbitrary device-count cap, and provider revoke backs Forget Device.
A.ok(onlineIdentity.includes('mode:"online-only"'));
A.ok(onlineIdentity.includes('id:"nik",label:"Nik",role:"playerOne"'));
A.ok(onlineIdentity.includes('id:"daniel",label:"Daniel",role:"playerTwo"'));
A.ok(onlineIdentity.includes('"WHO ARE YOU?"'));
A.ok(onlineIdentity.includes('"I\'M NIK"') && onlineIdentity.includes('"I\'M DANIEL"'));
A.ok(onlineIdentity.includes('"FORGET THIS DEVICE"'));
A.ok(onlineIdentity.includes('pairing.revokeDevice'));
A.ok(onlineIdentity.indexOf('pairing.revokeDevice') < onlineIdentity.indexOf('clearPrivateDeviceIdentity()'),"Provider revoke must be attempted before the durable browser device identity is cleared.");
A.ok(!/max(?:imum)?(?:Active)?Devices|deviceCap|MAX_DEVICES|three devices/i.test(onlineIdentity),"The online shell must not reintroduce an arbitrary device-count cap.");
A.ok(onlineIdentity.includes('"sparkConnectedAccountPanel"') && onlineIdentity.includes('"sparkPrivatePairingPanel"') && onlineIdentity.includes('"sparkConnectedRivalryPanel"') && onlineIdentity.includes('"saveLibraryProductPanel"'),"Engineering/recovery panels must remain suppressible behind the normal online shell.");
A.ok(showdown.includes('name:"Nik vs Daniel",managers:{playerOne:"Nik",playerTwo:"Daniel"}'));
A.ok(showdown.includes('navigator.onLine===false'));
A.ok(showdown.includes('identity.status!=="ready"'));
A.ok(ruleBook.includes('two-player online rivalry for Nik and Daniel'));
A.ok(ruleBook.includes('no separate local-only gameplay mode'));
A.ok(!ruleBook.includes('QR joining and multi-device real-time play are future ideas'));
A.ok(!ruleBook.includes('no account system, cloud save, or online multiplayer'));

process.stdout.write("PASS Stage 5E copy + online-only entry truth: provider authority stays private/zero-billing while the normal shell is fixed to remembered Nik/Daniel devices with provider-backed Forget Device.\n");
