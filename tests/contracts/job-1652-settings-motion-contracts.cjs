#!/usr/bin/env node
"use strict";
// JOB-1652: three-way Settings motion contract, legacy preference migration,
// persistence, and the runtime motion decision used by every game screen.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { FakeNode } = require("../support/fake-dom.cjs");
FakeNode.prototype.prepend = function(node){
    if(node.parent){ node.remove(); }
    node.parent = this;
    this.children.unshift(node);
};

const ROOT = path.resolve(__dirname, "../..");
const read = name => fs.readFileSync(path.join(ROOT, name), "utf8");
const PREFS = "careerModeShowdown.preferences";
let checks = 0;
function check(name, action){
    action();
    console.log("ok " + (++checks) + " " + name);
}

function createApp({ stored = new Map(), deviceReduced = false, withSettings = true } = {}){
    const media = { matches:deviceReduced, addEventListener(){} };
    const events = new Map();
    const notices = [];
    const localStorage = {
        getItem:key => stored.has(key) ? stored.get(key) : null,
        setItem:(key,value) => stored.set(key, String(value)),
        removeItem:key => stored.delete(key)
    };
    const document = {
        documentElement:{ dataset:{} },
        addEventListener(){},
        createElement:tag => new FakeNode(tag)
    };
    const app = {
        console, document, localStorage,
        matchMedia:() => media,
        showAppNotice:(...args) => notices.push(args),
        CustomEvent:class { constructor(type, options){ this.type=type; this.detail=options.detail; } },
        addEventListener:(type, fn) => {
            if(!events.has(type))events.set(type, []);
            events.get(type).push(fn);
        },
        dispatchEvent:event => {
            for(const fn of events.get(event.type) || []) fn(event);
            return true;
        }
    };
    app.window = app;
    const ctx = vm.createContext(app);
    vm.runInContext(read("js/storage.js"), ctx, { filename:"js/storage.js" });
    // Settings.js is lazily loaded in the real app; storage.js alone must already honour the stored choice.
    // app.js start-up (sa -> im) then runs initializeStorageLifecycle, which applies it to the root dataset.
    const atLoad = { preferred:app.isReducedMotionPreferred() };
    vm.runInContext("initializeStorageLifecycle()", ctx);
    atLoad.dataset = { ...document.documentElement.dataset };
    if(withSettings){ vm.runInContext(read("js/settings.js"), ctx, { filename:"js/settings.js" }); }
    return {
        app, ctx, media, stored, notices, atLoad,
        state:() => app.getApplicationMotionPreferenceState(),
        preferred:() => app.isReducedMotionPreferred(),
        dataset:() => document.documentElement.dataset,
        select:choice => vm.runInContext("setSettingsMotionPreference("+JSON.stringify(choice)+")", ctx),
        controls:() => vm.runInContext("createMotionPanel()", ctx).findByClass("settingsMotionChoice"),
        saved:() => JSON.parse(stored.get(PREFS)),
        storageEvent:key => app.dispatchEvent({ type:"storage", key })
    };
}
const prefs = (motionPreference, reducedMotion) => JSON.stringify({ schemaVersion:2, reducedMotion, ...(motionPreference ? { motionPreference } : {}), menuFeedback:true });

check("only storage.js and diagnostics.js touch localStorage; settings.js does not", () => {
    assert.equal(/\blocalStorage\b/.test(read("js/settings.js")), false);
    assert.equal(/careerModeShowdown\.motionPreference/.test(read("js/settings.js")), false);
});
check("three real accessible radio choices render in requested order", () => {
    const a = createApp();
    const buttons = a.controls();
    assert.deepEqual(buttons.map(b => b.dataset.motionChoice), ["follow", "full", "reduce"]);
    assert.deepEqual(buttons.map(b => b.children[1].children[0].textContent),
        ["FOLLOW DEVICE", "FULL MOTION", "REDUCE MOTION"]);
    assert.deepEqual(buttons.map(b => b.getAttribute("role")), ["radio", "radio", "radio"]);
    assert.deepEqual(buttons.map(b => b.getAttribute("aria-checked")), ["true", "false", "false"]);
    assert.deepEqual(buttons.map(b => b.tabIndex), [0, -1, -1]);
});
check("default preferences keep the legacy shape and read as follow", () => {
    const a = createApp();
    assert.equal(a.state().motionPreference, "follow");
    assert.deepEqual({ ...a.app.loadApplicationPreferences() }, { schemaVersion:2, reducedMotion:false, menuFeedback:true });
});
check("FOLLOW DEVICE responds to the live device preference", () => {
    const a = createApp();
    assert.equal(a.preferred(), false);
    a.media.matches = true;
    assert.equal(a.preferred(), true);
    assert.equal(a.state().effectiveReduced, true);
});
check("FULL MOTION overrides device reduction and corrects the root dataset", () => {
    const a = createApp({ deviceReduced:true });
    a.select("full");
    assert.equal(a.preferred(), false);
    assert.equal(a.state().effectiveReduced, false);
    assert.equal(a.dataset().motionPreference, "full");
    assert.equal(a.dataset().motionReduced, "false");
    assert.equal(a.saved().motionPreference, "full");
    assert.equal(a.saved().reducedMotion, false);
    assert.equal(a.app.loadApplicationPreferences().motionPreference, "full");
    assert.equal(a.controls()[1].getAttribute("aria-checked"), "true");
});
check("REDUCE MOTION forces reduced behaviour on a standard device", () => {
    const a = createApp();
    a.select("reduce");
    assert.equal(a.preferred(), true);
    assert.equal(a.saved().reducedMotion, true, "reduce keeps the legacy boolean");
    assert.equal("motionPreference" in a.saved(), false, "only FULL adds the new field, so old builds read the same record");
    assert.equal(a.dataset().motionPreference, "reduced");
    assert.equal(a.controls()[2].getAttribute("aria-checked"), "true");
});
check("switching reduce -> full -> follow keeps boolean and consumers in step", () => {
    const a = createApp();
    a.select("reduce");
    a.select("full");
    assert.equal(a.preferred(), false);
    assert.equal(a.saved().reducedMotion, false);
    assert.equal(a.saved().motionPreference, "full");
    a.select("follow");
    a.media.matches = true;
    assert.equal(a.preferred(), true);
    assert.deepEqual(a.saved(), { schemaVersion:2, reducedMotion:false, menuFeedback:true });
});
check("old boolean-only saves map to follow or reduce and stay untouched", () => {
    for(const reducedMotion of [false, true]){
        const stored = new Map([[PREFS, prefs(null, reducedMotion)]]);
        const a = createApp({ stored, deviceReduced:false });
        assert.equal(a.state().motionPreference, reducedMotion ? "reduce" : "follow");
        assert.equal(a.preferred(), reducedMotion);
        assert.equal(stored.get(PREFS), prefs(null, reducedMotion), "legacy record stays untouched until the user selects");
    }
});
check("every stored choice survives a reload (fresh app over the same storage)", () => {
    for(const choice of ["follow", "full", "reduce"]){
        const first = createApp({ deviceReduced:true });
        first.select(choice);
        const second = createApp({ stored:first.stored, deviceReduced:true });
        assert.equal(second.state().motionPreference, choice);
        assert.equal(second.preferred(), choice !== "full");
        assert.deepEqual(second.controls().map(b => b.getAttribute("aria-checked")),
            ["follow", "full", "reduce"].map(c => c === choice ? "true" : "false"));
    }
});
check("invalid stored choice falls back to the boolean", () => {
    for(const [bad, reducedMotion, expected] of [["loud", false, "follow"], ["loud", true, "reduce"], [7, false, "follow"]]){
        const a = createApp({ stored:new Map([[PREFS, prefs(bad, reducedMotion)]]) });
        assert.equal(a.state().motionPreference, expected);
    }
});
check("legacy setApplicationReducedMotionPreference still maps onto the choice", () => {
    const a = createApp({ deviceReduced:true });
    assert.equal(a.app.setApplicationReducedMotionPreference(true), true);
    assert.equal(a.state().motionPreference, "reduce");
    assert.equal(a.app.setApplicationReducedMotionPreference(false), true);
    assert.equal(a.state().motionPreference, "follow");
    assert.equal(a.app.setApplicationMotionPreference("bogus"), false);
});
check("STARTUP: stored FULL is applied by storage.js alone, with Settings never loaded", () => {
    const stored = new Map([[PREFS, prefs("full", false)]]);
    const a = createApp({ stored, deviceReduced:true, withSettings:false });
    assert.equal(a.app.openSettings, undefined, "settings.js is not loaded in this scenario");
    assert.equal(a.atLoad.preferred, false, "isReducedMotionPreferred is false on first call");
    assert.equal(a.atLoad.dataset.motionPreference, "full", "root dataset set by storage start-up");
    assert.equal(a.atLoad.dataset.motionReduced, "false");
    assert.equal(a.preferred(), false);
});
check("STARTUP: stored REDUCE and FOLLOW are applied by storage.js alone", () => {
    const reduce = createApp({ stored:new Map([[PREFS, prefs("reduce", true)]]), withSettings:false });
    assert.equal(reduce.atLoad.preferred, true);
    assert.equal(reduce.atLoad.dataset.motionPreference, "reduced");
    assert.equal(reduce.atLoad.dataset.motionReduced, "true");
    const follow = createApp({ stored:new Map([[PREFS, prefs("follow", false)]]), deviceReduced:true, withSettings:false });
    assert.equal(follow.atLoad.preferred, true);
    assert.equal(follow.atLoad.dataset.motionPreference, "system");
    assert.equal(follow.atLoad.dataset.motionReduced, "true");
});
check("STARTUP: storage.js stays an eagerly loaded script and settings.js stays lazy", () => {
    const html = read("index.html");
    assert.match(html, /<script defer src="js\/storage\.js\?v=/);
    assert.equal(/js\/settings\.js/.test(html), false);
});
check("a storage event from another tab re-applies the choice and notifies", () => {
    const a = createApp({ deviceReduced:true });
    vm.runInContext("initializeStorageLifecycle()", a.ctx);
    let observed = 0;
    a.app.addEventListener("career-mode-preferences-change", event => {
        observed++;
        assert.ok(["follow", "full", "reduce"].includes(event.detail.motion.motionPreference));
    });
    a.stored.set(PREFS, prefs("full", false));
    a.storageEvent(PREFS);
    assert.equal(a.preferred(), false);
    assert.equal(a.dataset().motionPreference, "full");
    assert.ok(observed > 0);
});
check("selecting a choice dispatches an updated preferences event", () => {
    const a = createApp();
    let observed = 0;
    a.app.addEventListener("career-mode-preferences-change", () => { observed++; });
    a.select("full");
    assert.equal(observed, 1);
});
console.log("PASS JOB-1652 motion setting contracts: " + checks + " checks.");
