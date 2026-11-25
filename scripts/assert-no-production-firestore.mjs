#!/usr/bin/env node
// Fails unless every browser launch in a live-site job ran under
// tests/support/no-production-firestore-guard.cjs and NO request to a Firestore or
// Realtime Database host was attempted. Usage:
//   node scripts/assert-no-production-firestore.mjs --dir <guard dir> [--expect-step <name>]... [--out <file>]
import fs from "node:fs";
import path from "node:path";

const argv = process.argv.slice(2);
const option = name => { const at = argv.indexOf(name); return at >= 0 ? argv[at + 1] : undefined; };
const expectedSteps = argv.flatMap((value, index) => argv[index - 1] === "--expect-step" ? [value] : []);
const directory = option("--dir") || process.env.CMS_FIRESTORE_GUARD_DIR;
const out = option("--out");
if(!directory){ console.error("assert-no-production-firestore: --dir (or CMS_FIRESTORE_GUARD_DIR) is required."); process.exit(2); }

const files = fs.existsSync(directory) ? fs.readdirSync(directory).filter(name => /^guard-.*\.json$/.test(name)).sort() : [];
const reports = files.map(name => JSON.parse(fs.readFileSync(path.join(directory, name), "utf8")));
const problems = [];
if(!reports.length) problems.push("No guard report: no browser launch ran under the guard (is NODE_OPTIONS set?).");

const totals = { processes: reports.length, launches: 0, guardedLaunches: 0, contexts: 0, guardedContexts: 0, blockedAttempts: 0, infoRequests: {} };
const steps = new Map();
for(const report of reports){
    if(report.schema !== "cms-no-production-firestore-guard/v1") problems.push(`${report.script}: unknown report schema ${report.schema}`);
    if(!report.patched) problems.push(`${report.script}: Playwright was not patched.`);
    if(report.guardedLaunches !== report.launches) problems.push(`${report.script}: ${report.launches - report.guardedLaunches} unguarded browser launch(es).`);
    if(report.guardedContexts !== report.contexts) problems.push(`${report.script}: ${report.contexts - report.guardedContexts} unguarded context(s).`);
    if(report.blockedAttempts.length) problems.push(`${report.script}: ${report.blockedAttempts.length} attempted production Firestore/RTDB request(s): ${JSON.stringify(report.blockedAttempts.slice(0, 5))}`);
    totals.launches += report.launches; totals.guardedLaunches += report.guardedLaunches;
    totals.contexts += report.contexts; totals.guardedContexts += report.guardedContexts;
    totals.blockedAttempts += report.blockedAttempts.length;
    for(const [host, count] of Object.entries(report.infoRequests || {})) totals.infoRequests[host] = (totals.infoRequests[host] || 0) + count;
    const step = report.step || "(no step)";
    steps.set(step, (steps.get(step) || 0) + report.launches);
}
for(const step of expectedSteps){
    if(!steps.get(step)) problems.push(`Step "${step}" left no guarded browser launch: it did not run, crashed before writing, or ran unguarded.`);
}

const summary = { ok: problems.length === 0, totals, launchesByStep: Object.fromEntries(steps), problems };
if(out) fs.writeFileSync(out, JSON.stringify(summary, null, 2));
console.log(JSON.stringify(summary, null, 2));
if(problems.length){
    console.error(`\nProduction Firestore guard FAILED (${problems.length} problem(s)).`);
    process.exit(1);
}
console.log(`\nProduction Firestore guard: ${totals.guardedLaunches} guarded launch(es), ${totals.contexts} context(s), 0 Firestore/RTDB requests attempted.`);
