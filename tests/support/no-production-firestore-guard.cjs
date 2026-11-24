"use strict";
// Preload for jobs that open the LIVE site (deployed-site smoke). Standing rule:
// no automation reads production Firestore. Loaded with
//   NODE_OPTIONS="--require <abs path>/tests/support/no-production-firestore-guard.cjs"
// it patches every Playwright browser launch in this Node process so that:
//   1. Chromium cannot resolve any Firestore / Realtime Database host
//      (--host-resolver-rules), so no request can ever reach production data;
//   2. every context aborts and COUNTS any request to those hosts (route + events),
//      so a test that tries is caught, not silently starved.
// Each process that launched a browser writes one JSON report into
// CMS_FIRESTORE_GUARD_DIR; scripts/assert-no-production-firestore.mjs fails the job
// when any report counts an attempt, a launch went unguarded, or a step left no report.
const fs = require("node:fs");
const path = require("node:path");
const { createRequire } = require("node:module");

const BLOCKED_HOST = /(^|\.)firestore\.googleapis\.com$|(^|\.)firebaseio\.com$|(^|\.)firebasedatabase\.app$/i;
const INFO_HOST = /(^|\.)(identitytoolkit|securetoken|firebaseappcheck|firebaseinstallations)\.googleapis\.com$/i;
const RESOLVER_RULES = [
    "MAP firestore.googleapis.com ~NOTFOUND",
    "MAP *.firestore.googleapis.com ~NOTFOUND",
    "MAP *.firebaseio.com ~NOTFOUND",
    "MAP *.firebasedatabase.app ~NOTFOUND"
].join(", ");

const report = {
    schema: "cms-no-production-firestore-guard/v1",
    pid: process.pid,
    script: path.relative(process.cwd(), process.argv[1] || "") || "(none)",
    step: process.env.CMS_FIRESTORE_GUARD_STEP || "",
    patched: false,
    launches: 0,
    guardedLaunches: 0,
    contexts: 0,
    guardedContexts: 0,
    blockedAttempts: [],
    infoRequests: {}
};

function hostOf(rawUrl){
    try{ return new URL(rawUrl).hostname; }catch(_error){ return ""; }
}
function redact(rawUrl){
    try{ const url = new URL(rawUrl); return `${url.origin}${url.pathname}`; }catch(_error){ return "[invalid-url]"; }
}
function noteRequest(request, via){
    const url = request.url();
    const host = hostOf(url);
    if(BLOCKED_HOST.test(host)){
        if(report.blockedAttempts.length < 200) report.blockedAttempts.push({ via, method: request.method(), url: redact(url) });
        else report.blockedAttempts.push({ via, overflow: true });
    }else if(INFO_HOST.test(host)){
        report.infoRequests[host] = (report.infoRequests[host] || 0) + 1;
    }
}
function withResolverRules(options){
    const next = { ...(options || {}) };
    const args = Array.isArray(next.args) ? next.args.slice() : [];
    const index = args.findIndex(argument => String(argument).startsWith("--host-resolver-rules="));
    if(index >= 0){
        const existing = String(args[index]).slice("--host-resolver-rules=".length).replace(/^"|"$/g, "");
        args[index] = `--host-resolver-rules=${RESOLVER_RULES}, ${existing}`;
    }else{
        args.push(`--host-resolver-rules=${RESOLVER_RULES}`);
    }
    next.args = args;
    return next;
}
async function guardContext(context){
    report.contexts += 1;
    context.on("request", request => noteRequest(request, "request"));
    await context.route(url => BLOCKED_HOST.test(url.hostname), route => {
        noteRequest(route.request(), "route");
        return route.abort("blockedbyclient");
    });
    report.guardedContexts += 1;
    return context;
}
function guardBrowser(browser){
    const newContext = browser.newContext.bind(browser);
    browser.newContext = async (...args) => guardContext(await newContext(...args));
    // browser.newPage() creates its own context through this.newContext in current
    // Playwright; route it through the guarded path explicitly so a version change cannot skip it.
    browser.newPage = async (options) => {
        const context = await browser.newContext(options);
        const page = await context.newPage();
        page.once("close", () => context.close().catch(() => {}));
        return page;
    };
    return browser;
}

function writeReport(){
    if(!report.launches) return;
    const directory = process.env.CMS_FIRESTORE_GUARD_DIR;
    if(!directory) return;
    try{
        fs.mkdirSync(directory, { recursive: true });
        fs.writeFileSync(path.join(directory, `guard-${process.pid}-${Date.now()}.json`), JSON.stringify(report, null, 2));
    }catch(error){
        process.stderr.write(`[firestore-guard] could not write report: ${error.message}\n`);
    }
}

function install(){
    let playwright;
    try{
        playwright = createRequire(path.join(process.cwd(), "package.json"))("playwright");
    }catch(_error){
        return; // npm, setup steps and non-browser scripts: nothing to guard.
    }
    const proto = Object.getPrototypeOf(playwright.chromium);
    if(proto.__cmsFirestoreGuard) { report.patched = true; return; }
    const launch = proto.launch;
    const launchPersistentContext = proto.launchPersistentContext;
    proto.launch = async function(options){
        const raw = await launch.call(this, withResolverRules(options));
        report.launches += 1;
        const browser = guardBrowser(raw);
        report.guardedLaunches += 1;
        return browser;
    };
    proto.launchPersistentContext = async function(userDataDir, options){
        const raw = await launchPersistentContext.call(this, userDataDir, withResolverRules(options));
        report.launches += 1;
        const context = await guardContext(raw);
        report.guardedLaunches += 1;
        return context;
    };
    for(const name of ["connect", "connectOverCDP"]){
        const original = proto[name];
        proto[name] = async function(){
            const browser = await original.apply(this, arguments);
            report.launches += 1; // counted, never guarded: the assertion fails on it.
            return browser;
        };
    }
    proto.__cmsFirestoreGuard = true;
    report.patched = true;
    process.on("exit", writeReport);
}

install();
module.exports = { BLOCKED_HOST, RESOLVER_RULES, report };
