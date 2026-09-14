const A = require("node:assert/strict");
const fs = require("node:fs");
const read = path => fs.readFileSync(path,"utf8");

const account = read("js/sparkConnectedAccount.js");
const rivalry = read("js/sparkConnectedRivalry.js");
const remoteJoining = read("js/sparkRemoteJoining.js");
const onlineIdentity = read("js/onlinePlayerIdentity.js");
const showdown = read("js/showdown.js");
const ruleBook = read("js/ruleBook.js");
const html = read("index.html");

for(const stale of [
  "Remote Joining sessions remain locked.",
  "Locked · Stage 5 sessions not enabled",
  "Stage 5 · still locked"
]){
  A.ok(!account.includes(stale), `Connected Account reintroduced stale Remote Joining copy: ${stale}`);
  A.ok(!rivalry.includes(stale), `Connected Rivalry reintroduced stale Remote Joining copy: ${stale}`);
}

// Provider internals may retain technical Remote Joining terminology, but they are not a separate product mode.
A.ok(account.includes('firestorePersistence:"memory-only"'));
A.ok(account.includes('billingRequired:false'));
A.ok(rivalry.includes('publicDiscovery:false'));
A.ok(rivalry.includes('automaticLocalApply:false'));
A.ok(rivalry.includes('localApplyAuthority:"candidate-c-explicit-confirmed-only"'));
A.ok(rivalry.includes('remoteJoiningSessions:false'));
A.ok(rivalry.includes('billingRequired:false'));
A.ok(remoteJoining.includes('billingRequired:false'));
A.ok(remoteJoining.includes('publicDiscovery:false'));

// Canonical product identity is fixed and fresh: Daniel is Player One, Nik is Player Two.
A.ok(onlineIdentity.includes('mode:"online-only"'));
A.ok(onlineIdentity.includes('id:"daniel",label:"Daniel",role:"playerOne"'));
A.ok(onlineIdentity.includes('id:"nik",label:"Nik",role:"playerTwo"'));
A.ok(onlineIdentity.includes('"WHO ARE YOU?"'));
A.ok(onlineIdentity.includes('"DANIEL · PLAYER ONE"') && onlineIdentity.includes('"NIK · PLAYER TWO"'));
A.ok(onlineIdentity.includes('"FORGET THIS DEVICE"'));
A.ok(onlineIdentity.includes('pairing.revokeDevice'));
A.ok(onlineIdentity.indexOf('pairing.revokeDevice') < onlineIdentity.indexOf('clearPrivateDeviceIdentity()'),"Provider revoke must be attempted before the browser device identity is cleared.");
A.ok(!/max(?:imum)?(?:Active)?Devices|deviceCap|MAX_DEVICES|three devices/i.test(onlineIdentity),"The product must not introduce an arbitrary device-count cap.");
A.ok(onlineIdentity.includes('"sparkConnectedAccountPanel"') && onlineIdentity.includes('"sparkPrivatePairingPanel"') && onlineIdentity.includes('"sparkConnectedRivalryPanel"') && onlineIdentity.includes('"saveLibraryProductPanel"'),"Engineering/recovery panels must remain suppressible behind the normal product shell.");
A.ok(showdown.includes('name:"Daniel vs Nik",managers:{playerOne:"Daniel",playerTwo:"Nik"}'));
A.ok(showdown.includes('showdown.name="Daniel vs Nik"'));
A.ok(showdown.includes('showdown.managers={playerOne:"Daniel",playerTwo:"Nik"}'));
A.ok(showdown.includes('navigator.onLine===false'));
A.ok(showdown.includes('identity.status!=="ready"'));
A.ok(ruleBook.includes('Career Mode Showdown is a two-player rivalry for Daniel and Nik.'));
A.ok(ruleBook.includes('Daniel is Player One. Nik is Player Two.'));
A.ok(!ruleBook.includes('for new Showdowns'));
A.ok(!ruleBook.includes('QR joining and multi-device real-time play are future ideas'));
A.ok(!ruleBook.includes('no account system, cloud save, or online multiplayer'));
A.match(html,/id="remoteJoiningButton"[^>]*hidden[^>]*aria-hidden="true"[^>]*tabindex="-1"/i,"Technical connection hook must remain invisible and non-focusable.");
A.ok(!/LOCAL SAVE SYSTEM|LOCAL SAVE READY|Private Remote Joining|NEW ONLINE SHOWDOWN|ONLINE SHOWDOWN/i.test(html));

process.stdout.write("PASS Stage 5E provider + copy truth: hidden private/zero-billing authority remains intact while the only player-facing product is Daniel as Player One, Nik as Player Two, Start a Showdown, Continue Career and provider-backed Forget Device.\n");
