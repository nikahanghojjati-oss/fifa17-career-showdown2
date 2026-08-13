const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const source = fs.readFileSync("js/offlineApp.js", "utf8");

const mediaMatch = source.match(/function setMenuMediaOfflineState\(offline\)\{[\s\S]*?\nfunction renderConnectivity/);
assert.ok(mediaMatch, "Production offline-media lifecycle function was not found.");
const mediaFunction = mediaMatch[0].replace(/\nfunction renderConnectivity[\s\S]*$/, "");
const status = { textContent: "YOUTUBE · PAUSED" };
const toggle = {
    disabled: false,
    attrs: new Map(),
    setAttribute(key, value){ this.attrs.set(key, String(value)); },
    removeAttribute(key){ this.attrs.delete(key); },
    click(){ throw new Error("Unexpected media click while test media is already paused."); }
};
const context = vm.createContext({
    console,
    document: {
        getElementById(id){
            if(id === "menuMusicToggle"){ return toggle; }
            if(id === "menuMusicStatus"){ return status; }
            return null;
        }
    },
    window: { isMenuMediaPlaying(){ return false; } },
    menuMediaStatusBeforeOffline: ""
});
vm.runInContext(`${mediaFunction}\nthis.runOfflineMediaState=setMenuMediaOfflineState;`, context);
context.runOfflineMediaState(true);
assert.equal(status.textContent, "OFFLINE · YOUTUBE MEDIA REQUIRES A CONNECTION");
assert.equal(toggle.disabled, true);
context.runOfflineMediaState(true);
context.runOfflineMediaState(false);
assert.equal(status.textContent, "YOUTUBE · PAUSED", "Repeated offline renders must preserve the true pre-offline media status through reconnect.");
assert.equal(toggle.disabled, false, "Reconnect must re-enable external media controls.");
assert.equal(toggle.attrs.has("aria-disabled"), false, "Reconnect must remove aria-disabled from external media controls.");
status.textContent = "YOUTUBE · PLAYING";
context.runOfflineMediaState(false);
assert.equal(status.textContent, "YOUTUBE · PLAYING", "A later online render must not overwrite live media state with a stale pre-offline snapshot.");

const activation = (source.match(/async function activateWaitingUpdate\(\)\{[\s\S]*?\nasync function requestPreviousRuntimeRollback/) || [""])[0];
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