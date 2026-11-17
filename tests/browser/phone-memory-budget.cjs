"use strict";
// r92 phone memory budget (Nik's iPhone 17, 2026-11-14: the Safari tab closed while Chamber Men was opening at High; it had
// loaded about 427 MB of textures there). Every 3D screen on a phone must fit PHONE_BUDGET_MB of GPU memory (textures + render
// buffers, as uploaded) at each level a phone's Auto can reach, measured at the level's TOP pixel ratio (the most the governor
// may reach in play). Runs tests/browser/device-lab.cjs (cpu mode, iPhone 17 profile, DEVLAB_TOP=1) and fails over budget.
// Where it runs: on pushes to the release branches (.github/workflows/phone-memory-budget.yml) and by hand:
//   CMS_CHROMIUM_PATH=/opt/pw-browsers/chromium node tests/browser/phone-memory-budget.cjs [--out file.json]
// Limits: Chromium with software GL, not WebKit. iOS also keeps decoded image copies beside the GPU ones, so a real iPhone
// uses more than this counts; the budget leaves room for that. Only a real iPhone proves a level opens.
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const ROOT = path.resolve(__dirname, "../..");
const PHONE_BUDGET_MB = 300;
const LEVELS = [2, 3];                       // High (where an iPhone's Auto starts) and Extra (the next level the check may raise it to)
const SCENES = ["chamber", "rrr", "sp"];
const outArg = process.argv.indexOf("--out");
const out = outArg >= 0 ? process.argv[outArg + 1] : path.join(os.tmpdir(), `phone-memory-budget-${process.pid}.json`);

fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true });

async function chromiumPath(){
    // In CI the Gate's bundled Chromium (tests/support/chromium-runtime.cjs); by hand, CMS_CHROMIUM_PATH.
    if (process.env.CMS_CHROMIUM_PATH) return process.env.CMS_CHROMIUM_PATH;
    const { resolveChromiumRuntime } = require("../support/chromium-runtime.cjs");
    return (await resolveChromiumRuntime()).executablePath;
}

(async () => {
const run = spawnSync(process.execPath, [path.join(ROOT, "tests/browser/device-lab.cjs"), "--profiles", "iphone17", "--scenes", SCENES.join(","), "--levels", LEVELS.join(","), "--out", out], {
    cwd: ROOT, stdio: "inherit",
    env: { ...process.env, CMS_CHROMIUM_PATH: await chromiumPath(), DEVLAB_MODE: "cpu", DEVLAB_TOP: "1", DEVLAB_MEASURE_MS: process.env.DEVLAB_MEASURE_MS || "3000", DEVLAB_LOAD_MAX_MS: process.env.DEVLAB_LOAD_MAX_MS || "420000" }
});
if (run.status !== 0) { console.error(`device-lab exited ${run.status}`); process.exit(1); }
const data = JSON.parse(fs.readFileSync(out, "utf8"));
const rows = (data.results || data).filter(r => r && r.profile === "iphone17" && SCENES.includes(r.scene));
const failures = [];
for (const scene of SCENES) for (const level of LEVELS) {
    const r = rows.find(x => x.scene === scene && x.level === level);
    if (!r || r.allocTexMB == null) { failures.push(`${scene} at level ${level}: no measurement (${r && r.error || "missing"})`); continue; }
    // A screen that never finished loading, threw, drew nothing or ran at another level is not a measurement (0 MB would pass).
    const bad = [!r.ready && "never finished loading", (r.errors || []).length && `page errors: ${r.errors.join(" | ")}`,
        !(r.rafFrames > 0 && r.callsMedian > 0) && "drew nothing", !(r.gfx && r.gfx.level === level) && `ran at level ${r.gfx && r.gfx.level}`,
        !(r.allocTexMB > 0) && "uploaded no textures"].filter(Boolean);
    if (bad.length) { failures.push(`${scene} at level ${level}: not measured (${bad.join("; ")})`); continue; }
    const total = Math.round((r.allocTexMB + r.allocRbMB) * 10) / 10;
    const canvas = r.canvas ? `${r.canvas.w}x${r.canvas.h}` : "?";
    console.log(`${scene.padEnd(8)} ${r.levelName.padEnd(6)} ${String(total).padStart(6)} MB (textures ${r.allocTexMB} + buffers ${r.allocRbMB}) at ${canvas}`);
    if (total > PHONE_BUDGET_MB) failures.push(`${scene} at ${r.levelName}: ${total} MB is over the ${PHONE_BUDGET_MB} MB phone budget`);
}
if (failures.length) { console.error(`FAIL phone memory budget\n  ${failures.join("\n  ")}`); process.exit(1); }
console.log(`PASS phone memory budget: every 3D screen at High and Extra fits ${PHONE_BUDGET_MB} MB on the iPhone 17 profile at its top pixel ratio`);
})().catch(error => { console.error(error); process.exit(1); });
