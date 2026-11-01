const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const source = fs.readFileSync("js/offlineApp.js", "utf8");

const mediaMatch = source.match(/function setMenuMediaOfflineState\(offline\)\{[\s\S]*?\nfunction renderConnectivity/);
assert.ok(mediaMatch, "Production offline-media lifecycle function was not found.");
const mediaFunction = mediaMatch[0].replace(/\nfunction renderConnectivity[\s\S]*$/, "");
// r87 (Nik 2026-11-01): Home has no music strip. Going offline pauses the soundtrack (Audius needs a connection);
// coming back online starts nothing by itself (a song plays only after a tap).
let pauses = 0;
const context = vm.createContext({
    console,
    document: { getElementById(){ throw new Error("The offline media lifecycle must not read Home markup."); } },
    window: { HomeSoundtrack: { pause(){ pauses += 1; }, toggle(){ throw new Error("Reconnect must not start music."); } } }
});
vm.runInContext(`${mediaFunction}\nthis.runOfflineMediaState=setMenuMediaOfflineState;`, context);
context.runOfflineMediaState(true);
assert.equal(pauses, 1, "Going offline pauses the soundtrack.");
context.runOfflineMediaState(true);
assert.equal(pauses, 2, "A repeated offline render pauses again (pause is a no-op when already paused).");
context.runOfflineMediaState(false);
assert.equal(pauses, 2, "Reconnect never touches playback.");
const bare = vm.createContext({ console, window: {} });
vm.runInContext(`${mediaFunction}\nthis.runOfflineMediaState=setMenuMediaOfflineState;`, bare);
bare.runOfflineMediaState(true);
bare.runOfflineMediaState(false);

const activation = (source.match(/async function activateWaitingUpdate\([^)]*\)\{[\s\S]*?\nasync function requestPreviousRuntimeRollback/) || [""])[0];
assert.ok(activation, "Update activation lifecycle function was not found.");
const intentIndex = activation.indexOf("activationRequested=true");
const messageIndex = activation.indexOf('sendWorkerMessage(waiting,"CMS_ACTIVATE_UPDATE"');
assert.ok(intentIndex >= 0 && messageIndex > intentIndex, "Explicit update reload intent must be armed before the waiting worker can activate and emit controllerchange.");
assert.match(activation, /if\(!waiting\)\{[\s\S]*?activationRequested=false;/, "No-waiting update attempts must clear stale activation intent.");
assert.match(activation, /catch\(error\)\{[\s\S]*?activationRequested=false;/, "Rejected update activation must clear armed reload intent.");

const registration = (source.match(/async function registerOfflineApplication\(\)\{[\s\S]*?\nfunction consumeEarlyInstallPrompt/) || [""])[0];
assert.ok(registration, "Service Worker registration lifecycle function was not found.");
assert.equal((registration.match(/navigator\.serviceWorker\.register\(/g) || []).length, 1, "Offline controller must register only when no existing registration exists.");
assert.match(registration, /if\(existing\)\{[\s\S]*?await existing\.update\(\);[\s\S]*?return existing;[\s\S]*?\}\n\s*const workerUrl=/, "Existing Service Worker registration must update in place and return before the new-registration path.");

process.stdout.write("PASS  v1.3 offline lifecycle: live reconnect state, pre-armed update intent, and single registration ownership\n");