const assert = require("node:assert/strict");
const fs = require("node:fs");

const offline = fs.readFileSync("js/offlineApp.js", "utf8");

const activation = (offline.match(/async function activateWaitingUpdate\(\)[\s\S]*?async function requestPreviousRuntimeRollback/) || [""])[0];
const intentIndex = activation.indexOf("activationRequested=true");
const messageIndex = activation.indexOf('sendWorkerMessage(waiting,"CMS_ACTIVATE_UPDATE"');
assert.ok(intentIndex >= 0 && messageIndex > intentIndex, "Update intent must be armed before the waiting worker can activate and emit controllerchange.");
assert.ok(activation.includes("catch(error){activationRequested=false;"), "Rejected update activation must clear armed reload intent.");

const registration = (offline.match(/async function registerOfflineApplication\(\)[\s\S]*?function consumeEarlyInstallPrompt/) || [""])[0];
assert.match(registration, /if\(existing\)\{[\s\S]*?await existing\.update\(\)[\s\S]*?return existing;\}const workerUrl=/, "Existing service-worker registration must update in place and return without a second register call.");
assert.equal((registration.match(/navigator\.serviceWorker\.register\(/g) || []).length, 1, "Offline controller must register only when no existing registration exists.");

assert.ok(offline.includes('offlineStatus="OFFLINE · YOUTUBE MEDIA REQUIRES A CONNECTION"'), "Offline media override must have one stable identity.");
assert.ok(offline.includes("if(status.textContent!==offlineStatus)menuMediaStatusBeforeOffline="), "Repeated offline renders must not overwrite the saved pre-offline media status.");
assert.ok(offline.includes("status.textContent===offlineStatus&&menuMediaStatusBeforeOffline"), "Reconnect must restore saved media status only while the offline override is still active.");
assert.ok(offline.includes('menuMediaStatusBeforeOffline="";'), "Reconnect must clear stale saved media status after restoration.");

console.log("PASS  v1.3 offline hardening contracts: pre-armed activation, single registration owner, stable live reconnect media state.");
