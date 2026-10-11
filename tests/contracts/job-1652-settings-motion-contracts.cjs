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
const KEY = "careerModeShowdown.motionPreference";
const LEGACY = "careerModeShowdown.preferences";
let checks = 0;
function check(name, action){
    action();
    console.log("ok " + (++checks) + " " + name);
}

function createApp({ stored = new Map(), deviceReduced = false } = {}){
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
    vm.runInContext(read("js/settings.js"), ctx, { filename:"js/settings.js" });
    return {
        app, ctx, media, stored, notices,
        state:() => app.getApplicationMotionPreferenceState(),
        preferred:() => app.isReducedMotionPreferred(),
        select:choice => vm.runInContext("setSettingsMotionPreference("+JSON.stringify(choice)+")", ctx),
        controls:() => vm.runInContext("createMotionPanel()", ctx).findByClass("settingsMotionChoice"),
        storageEvent:key => app.dispatchEvent({ type:"storage", key })
    };
}

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
check("FOLLOW DEVICE responds to the live device preference", () => {
    const a = createApp();
    assert.equal(a.preferred(), false);
    a.media.matches = true;
    assert.equal(a.preferred(), true);
    assert.equal(a.state().motionPreference, "follow");
    assert.equal(a.state().effectiveReduced, true);
});
check("FULL MOTION overrides device reduction and corrects root dataset", () => {
    const a = createApp({ deviceReduced:true });
    a.select("full");
    assert.equal(a.preferred(), false);
    assert.equal(a.state().effectiveReduced, false);
    assert.equal(a.app.document.documentElement.dataset.motionPreference, "full");
    assert.equal(a.app.document.documentElement.dataset.motionReduced, "false");
    assert.equal(a.stored.get(KEY), "full");
    assert.equal(a.controls()[1].getAttribute("aria-checked"), "true");
});
check("REDUCE MOTION forces reduced behavior with standard device", () => {
    const a = createApp();
    a.select("reduce");
    assert.equal(a.preferred(), true);
    assert.equal(a.state().effectiveReduced, true);
    assert.equal(a.stored.get(KEY), "reduce");
    assert.equal(JSON.parse(a.stored.get(LEGACY)).reducedMotion, true);
    assert.equal(a.controls()[2].getAttribute("aria-checked"), "true");
});
check("switching reduce -> full updates the old boolean and all consumers", () => {
    const a = createApp();
    a.select("reduce");
    a.select("full");
    assert.equal(a.preferred(), false);
    assert.equal(JSON.parse(a.stored.get(LEGACY)).reducedMotion, false);
    a.select("follow");
    a.media.matches = true;
    assert.equal(a.preferred(), true);
    assert.equal(a.stored.get(KEY), "follow");
});
check("stored follow and reduce strings survive reloading", () => {
    for(const [mode, expected] of [["follow", true], ["reduce", true]]){
        const stored = new Map([[KEY, mode]]);
        const a = createApp({ stored, deviceReduced:mode === "follow" });
        assert.equal(a.state().motionPreference, mode);
        assert.equal(a.preferred(), expected);
        assert.equal(a.controls().filter(b => b.getAttribute("aria-checked") === "true").length, 1);
    }
});
check("old boolean-only saves keep follow/reduce behavior", () => {
    for(const reducedMotion of [false, true]){
        const stored = new Map([[LEGACY, JSON.stringify({ schemaVersion:2, reducedMotion, menuFeedback:true })]]);
        const a = createApp({ stored, deviceReduced:false });
        assert.equal(a.state().motionPreference, reducedMotion ? "reduce" : "follow");
        assert.equal(a.preferred(), reducedMotion);
        assert.equal(stored.has(KEY), false, "legacy value stays untouched until the user selects a choice");
    }
});
check("saved full mode reloads with a reducing device", () => {
    const stored = new Map([[KEY, "full"], [LEGACY, JSON.stringify({schemaVersion:2,reducedMotion:false,menuFeedback:true})]]);
    const b = createApp({ stored, deviceReduced:true });
    assert.equal(b.state().motionPreference, "full");
    assert.equal(b.preferred(), false);
    assert.equal(b.app.document.documentElement.dataset.motionReduced, "false");
});
check("system/storage change and follow-full choice dispatch an updated event", () => {
    const a = createApp();
    let observed = 0;
    a.app.addEventListener("career-mode-preferences-change", event => {
        observed++;
        assert.ok(["follow", "full", "reduce"].includes(event.detail.motion.motionPreference));
    });
    a.select("full");
    assert.ok(observed > 0);
    a.stored.set(KEY, "reduce");
    a.storageEvent(KEY);
    assert.equal(a.preferred(), true);
    assert.equal(a.app.document.documentElement.dataset.motionPreference, "reduced");
});
console.log("PASS JOB-1652 motion setting contracts: " + checks + " checks.");
