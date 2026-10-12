#!/usr/bin/env node
"use strict";
// Settings > FULL MOTION must beat a device that reports prefers-reduced-motion: reduce, for the CSS media rules
// and for direct matchMedia("(prefers-reduced-motion: reduce)") reads. FOLLOW DEVICE and REDUCE are unchanged.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");
const read = name => fs.readFileSync(path.join(ROOT, name), "utf8");
const PREFS = "careerModeShowdown.preferences";
const REDUCE_QUERY = "(prefers-reduced-motion: reduce)";
let checks = 0;
function check(name, action){ action(); console.log("ok " + (++checks) + " " + name); }

class FakeMediaRule {
    constructor(text, rules = []){ this.media = { mediaText:text }; this.cssRules = rules; }
}
class FakeStyleRule { constructor(){ this.style = {}; } }

function createApp({ stored = new Map(), deviceReduced = true, sheets = [] } = {}){
    const listeners = new Map();
    const media = new Map();
    const nativeCalls = [];
    const localStorage = {
        getItem:key => stored.has(key) ? stored.get(key) : null,
        setItem:(key, value) => stored.set(key, String(value)),
        removeItem:key => stored.delete(key)
    };
    const document = {
        documentElement:{ dataset:{} },
        styleSheets:sheets,
        addEventListener(){}, removeEventListener(){}
    };
    const app = {
        console, document, localStorage, Proxy, Reflect,
        matchMedia(query){
            nativeCalls.push(query);
            const key = String(query);
            if(!media.has(key)){
                const reduce = /prefers-reduced-motion:\s*reduce/.test(key);
                media.set(key, { media:key, matches:reduce ? deviceReduced : true, addEventListener(){}, removeEventListener(){} });
            }
            return media.get(key);
        },
        showAppNotice(){},
        CustomEvent:class { constructor(type, options){ this.type = type; this.detail = options.detail; } },
        addEventListener(type, fn){ if(!listeners.has(type))listeners.set(type, []); listeners.get(type).push(fn); },
        dispatchEvent(event){ for(const fn of listeners.get(event.type) || [])fn(event); return true; }
    };
    app.window = app;
    const ctx = vm.createContext(app);
    vm.runInContext(read("js/storage.js"), ctx, { filename:"js/storage.js" });
    vm.runInContext("initializeStorageLifecycle()", ctx);
    // Mirror the real order: the shim loads after start-up; a screen script then reads matchMedia.
    vm.runInContext(read("js/fullMotionHonor.js"), ctx, { filename:"js/fullMotionHonor.js" });
    app.CareerModeFullMotionHonor.install();
    return { app, stored, sheets, nativeCalls };
}

function reduceMatches(app){ return app.matchMedia(REDUCE_QUERY).matches; }

check("the shim is a plain, dependency-free script with no storage or network access of its own", () => {
    const source = read("js/fullMotionHonor.js");
    assert.doesNotMatch(source, /localStorage|sessionStorage|indexedDB|fetch\(|XMLHttpRequest|firebase/i);
    assert.match(source, /CareerModeFullMotionHonor/);
});

check("FOLLOW DEVICE with a reducing device: matchMedia and the CSS rules stay exactly as the browser reports", () => {
    const reduceRule = new FakeMediaRule("(prefers-reduced-motion: reduce)", [new FakeStyleRule()]);
    const { app } = createApp({ sheets:[{ cssRules:[reduceRule] }] });
    assert.equal(app.getApplicationMotionPreferenceState().motionPreference, "follow");
    assert.equal(reduceMatches(app), true);
    assert.equal(reduceRule.media.mediaText, "(prefers-reduced-motion: reduce)");
    assert.equal(app.getApplicationMotionPreferenceState().effectiveReduced, true);
});

check("REDUCE with a reducing device (and with a calm device): still reported as reduced by the app, CSS untouched", () => {
    for(const deviceReduced of [true, false]){
        const reduceRule = new FakeMediaRule("(prefers-reduced-motion: reduce)");
        const stored = new Map([[PREFS, JSON.stringify({ schemaVersion:2, reducedMotion:true, motionPreference:"reduce", menuFeedback:true })]]);
        const { app } = createApp({ stored, deviceReduced, sheets:[{ cssRules:[reduceRule] }] });
        assert.equal(app.getApplicationMotionPreferenceState().effectiveReduced, true);
        assert.equal(reduceMatches(app), deviceReduced);
        assert.equal(reduceRule.media.mediaText, "(prefers-reduced-motion: reduce)");
    }
});

check("FULL MOTION on a reducing device: the exact reduce query reports no match, other queries are untouched", () => {
    const stored = new Map([[PREFS, JSON.stringify({ schemaVersion:2, reducedMotion:false, motionPreference:"full", menuFeedback:true })]]);
    const { app } = createApp({ stored });
    const state = app.getApplicationMotionPreferenceState();
    assert.equal(state.motionPreference, "full");
    assert.equal(state.effectiveReduced, false);
    assert.equal(reduceMatches(app), false, "screen scripts that ask the browser directly now see no reduced-motion request");
    assert.equal(app.matchMedia("(prefers-reduced-motion:reduce)").matches, false, "spacing variant");
    assert.equal(app.matchMedia("(min-width: 600px)").matches, true, "unrelated query untouched");
    assert.equal(app.matchMedia("(prefers-reduced-motion: no-preference)").matches, true, "other motion query untouched");
    assert.equal(app.isSystemReducedMotionPreferred(), true, "storage.js still knows the device asked (its query was created before the shim)");
});

check("FULL MOTION: every reduced-motion media rule is switched off, other rules are kept, nested rules are reached", () => {
    const nested = new FakeMediaRule("(prefers-reduced-motion: reduce)");
    const combined = new FakeMediaRule("(prefers-reduced-motion: reduce) and (max-width: 760px) and (orientation: portrait)");
    const plain = new FakeMediaRule("(max-width: 760px)");
    const wrapper = { cssRules:[nested] };
    const imported = { styleSheet:{ cssRules:[new FakeMediaRule("(prefers-reduced-motion: reduce)")] }, cssRules:undefined };
    const crossOrigin = { get cssRules(){ throw new Error("SecurityError"); } };
    const top = new FakeMediaRule("(prefers-reduced-motion: reduce)", [nested]);
    const stored = new Map([[PREFS, JSON.stringify({ schemaVersion:2, reducedMotion:false, motionPreference:"full", menuFeedback:true })]]);
    const { app } = createApp({ stored, sheets:[{ cssRules:[top, combined, plain, new FakeStyleRule(), wrapper, imported] }, crossOrigin] });
    for(const rule of [top, nested, combined, imported.styleSheet.cssRules[0]])assert.equal(rule.media.mediaText, "not all");
    assert.equal(plain.media.mediaText, "(max-width: 760px)");
    assert.ok(app.CareerModeFullMotionHonor.isFullMotionChosen());
});

check("switching Settings choices at runtime flips the CSS and matchMedia both ways, with the original query text restored", () => {
    const rule = new FakeMediaRule("(prefers-reduced-motion: reduce)");
    const combined = new FakeMediaRule("(prefers-reduced-motion: reduce) and (max-width: 760px)");
    const { app } = createApp({ sheets:[{ cssRules:[rule, combined] }] });
    assert.equal(rule.media.mediaText, "(prefers-reduced-motion: reduce)");
    assert.equal(reduceMatches(app), true);
    app.setApplicationMotionPreference("full");
    assert.equal(rule.media.mediaText, "not all");
    assert.equal(combined.media.mediaText, "not all");
    assert.equal(reduceMatches(app), false);
    app.setApplicationMotionPreference("follow");
    assert.equal(rule.media.mediaText, "(prefers-reduced-motion: reduce)");
    assert.equal(combined.media.mediaText, "(prefers-reduced-motion: reduce) and (max-width: 760px)");
    assert.equal(reduceMatches(app), true);
    assert.equal(app.getApplicationMotionPreferenceState().effectiveReduced, true);
    app.setApplicationMotionPreference("reduce");
    assert.equal(rule.media.mediaText, "(prefers-reduced-motion: reduce)");
    assert.equal(reduceMatches(app), true);
});

check("a stylesheet added later (lazy screen CSS) is handled while FULL MOTION is chosen", () => {
    const stored = new Map([[PREFS, JSON.stringify({ schemaVersion:2, reducedMotion:false, motionPreference:"full", menuFeedback:true })]]);
    const sheets = [];
    const { app } = createApp({ stored, sheets });
    const late = new FakeMediaRule("(prefers-reduced-motion: reduce)");
    sheets.push({ cssRules:[late] });
    app.CareerModeFullMotionHonor.sync();
    assert.equal(late.media.mediaText, "not all");
});

check("the shim is requested by js/ssjr.js before any screen module, is precached, and is not a start-up file", () => {
    const ssjr = read("js/ssjr.js");
    const at = ssjr.indexOf('load("full-motion-honor","js/fullMotionHonor.js",()=>root.CareerModeFullMotionHonor)');
    assert.ok(at > 0, "ssjr.js loads the shim");
    assert.ok(ssjr.includes("CareerModeFullMotionHonor.install()"));
    assert.ok(at < ssjr.indexOf('load("v10-screens"'), "requested before the Team V loader");
    assert.ok(at < ssjr.indexOf("requestIdleCallback"), "requested before the first screen module is scheduled");
    assert.match(read("service-worker.js"), /"js\/fullMotionHonor\.js",/);
    const html = read("index.html");
    assert.ok(!html.includes("fullMotionHonor"), "index.html (sha-pinned) is untouched");
    for(const startup of ["js/storage.js", "css/app.css", "js/app.js", "js/optionalModules.js"])assert.ok(!read(startup).includes("fullMotionHonor"), startup);
});

console.log("full-motion-honors-device-contracts: " + checks + " checks passed");
