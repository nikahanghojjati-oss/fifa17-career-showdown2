"use strict";
// JOB-1790: An asset with a revision that merely starts with the expected
// revision must not be counted as current in the integrity report.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const source = fs.readFileSync(path.join(__dirname, "../../js/diagnostics.js"), "utf8");

function audit(cssHref, scriptSrc){
    const stylesheet = {
        getAttribute: name => name === "href" ? cssHref : null
    };
    const script = {
        getAttribute: name => name === "src" ? scriptSrc : null
    };
    const context = {
        window: {},
        document: {
            querySelector: selector => selector === 'meta[name="app-asset-revision"]'
                ? {content: "1.9.1-r72"} : null,
            getElementById: id => id === "appStyles" ? stylesheet : null,
            querySelectorAll: selector => selector === "script[src]" ? [script]
                : selector === "link[rel='stylesheet'][href]" ? [stylesheet] : []
        }
    };
    vm.runInNewContext(source, context, {filename: "js/diagnostics.js"});
    return {
        styles: Array.from(context.getVisualSystemProblems()),
        assets: Array.from(context.getBundleProblems())
    };
}

const current = audit("css/app.css?v=1.9.1-r72", "js/menuExperience.js?v=1.9.1-r72");
assert.deepEqual(current.styles, [], "matching stylesheet revision remains current");
assert.deepEqual(current.assets, [], "matching script and stylesheet revisions remain current");

const wrongStylesheet = audit("css/app.css?v=1.9.1-r720", "js/menuExperience.js?v=1.9.1-r72");
assert.deepEqual(wrongStylesheet.styles, ["unified application stylesheet revision is stale"],
    "a longer revision sharing the expected prefix is not the expected stylesheet revision");
assert.deepEqual(wrongStylesheet.assets, ["stale local asset: css/app.css"],
    "the local asset report must also flag a prefix-only stylesheet revision");

const wrongScript = audit("css/app.css?v=1.9.1-r72", "js/menuExperience.js?v=1.9.1-r72-extra");
assert.deepEqual(wrongScript.assets, ["stale local asset: js/menuExperience.js"],
    "the local asset report must flag a prefix-only script revision");

const queryOrder = audit("css/app.css?cache=ok&v=1.9.1-r72", "js/menuExperience.js?cache=ok&v=1.9.1-r72");
assert.deepEqual(queryOrder.styles, [], "exact version remains valid after another query parameter");
assert.deepEqual(queryOrder.assets, [], "exact version remains valid after another query parameter");
console.log("JOB-1790 diagnostic revision matching contracts passed");
