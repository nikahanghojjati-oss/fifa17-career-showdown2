"use strict";
// r97 Device check close replay (Nik's iPhone 17 on 2.9.0, 2026-11-18: "Device check on iphone closes my screen on rrr on high
// and doesnt continue the check for rest of screens"). Plays the real device-check.html in a browser with iPhone emulation.
// The four 3D screens are stand-ins that answer the check at once (smooth at every level), except Russian Roulette at High,
// which starts and then never answers: there the whole browser is killed (SIGKILL, so no pagehide and no timers, as when iOS
// kills the tab or the home-screen app for memory). Then the browser is opened again on the same profile and the check is
// opened in a new tab (its sessionStorage gone, saved data kept), as Nik would open it again.
//   (the same tab reloading after a death keeps its sessionStorage: tests/contracts/r92-device-check-iphone-contracts.cjs D22)
// It reports which screens were opened at which level, the status line and what was saved, and fails unless Special Player
// and the Ball Game were opened at High and the result saved Roulette's stop on its own.
// Run: node tests/browser/r97-device-check-close-replay.cjs [--page FILE]
//   --page serves another copy of device-check.html (e.g. the 2.9.0 one) for a before/after.
// Limits: the screens are stand-ins (their memory is not measured here: tests/browser/phone-memory-budget.cjs); Chromium, not
// WebKit (Playwright's WebKit could not be downloaded in the r97 container). Only a real iPhone proves it. Not a Gate lane.
const fs = require("node:fs");
const http = require("node:http");
const os = require("node:os");
const path = require("node:path");
const { execSync } = require("node:child_process");
const pw = require("playwright");

const ROOT = path.resolve(__dirname, "../..");
const arg = (name, fallback) => { const i = process.argv.indexOf("--" + name); return i >= 0 ? process.argv[i + 1] : fallback; };
const MODE = "close", PAGE = arg("page", ""), BROWSER = "chromium";
const SCREENS = {"device-check-chamber.html": "chamber-men", "visual-assets/v10_1/roulette/index.html": "rrr", "visual-assets/v10_1/special-player/index.html": "sp", "device-check-ball.html": "club-draw"};
const DIE = ["rrr", 2];
const log = (...a) => { if(process.env.REPLAY_DEBUG) console.error("[replay]", ...a); };
const TYPES = {".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".webmanifest": "application/manifest+json"};

// A stand-in screen: says it started, then (unless it is the one that dies) answers with a clean, smooth beat.
const stub = (scene, level) => `<!doctype html><meta charset="utf-8"><script>
const level=${level},scene=${JSON.stringify(scene)},die=${JSON.stringify(scene === DIE[0] && level === DIE[1])};
const send=d=>parent.postMessage(Object.assign({type:"cms-gfx-bench",scene,asked:level,level},d),location.origin);
setTimeout(()=>{send({phase:"started"});if(die)return;setTimeout(()=>send({phase:"result",name:"x",pixelRatio:1,css:[393,852],size:[393,852],bufferOk:true,beats:1,complete:true,failed:null,
  software:false,gpu:"stand-in",frames:630,avg:59.9,p1low:55.2,ms:16.7,drawMs:3.1,slowest:[18.2,3.1],late:0}),150);},50);
</script>`;

(async () => {
  const opened = [];
  let dieSeen = null; const dieWait = new Promise(r => { dieSeen = r; });
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, "http://x"), rel = decodeURIComponent(url.pathname).replace(/^\/+/, "");
    if(SCREENS[rel] && url.searchParams.get("bench") === "1"){
      const scene = SCREENS[rel], level = Number(url.searchParams.get("gfx"));
      opened.push(`${scene}@${level}`); if(scene === DIE[0] && level === DIE[1]) dieSeen();
      res.writeHead(200, {"content-type": "text/html", "cache-control": "no-store"}); res.end(stub(scene, level)); return;
    }
    // The service worker is not under test here.
    if(rel === "service-worker.js"){ res.writeHead(404); res.end(); return; }
    const file = rel === "device-check.html" && PAGE ? path.resolve(PAGE) : path.join(ROOT, rel || "index.html");
    if(!file.startsWith(ROOT) && file !== path.resolve(PAGE)) { res.writeHead(403); res.end(); return; }
    fs.readFile(file, (error, body) => {
      if(error){ res.writeHead(404); res.end(); return; }
      res.writeHead(200, {"content-type": TYPES[path.extname(file)] || "application/octet-stream", "cache-control": "no-store"}); res.end(body);
    });
  });
  await new Promise(r => server.listen(0, "127.0.0.1", r));
  const base = `http://127.0.0.1:${server.address().port}/`;
  // The browser keeps its saved data on disk (a profile folder), so it can be killed and opened again like an iPhone app.
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), "r97-replay-"));
  const open = () => pw.chromium.launchPersistentContext(profile, {...pw.devices["iPhone 15 Pro"]});
  const read = async page => page.evaluate(() => ({
    status: document.getElementById("status").textContent,
    result: document.getElementById("result").textContent,
    measured: JSON.parse(localStorage.getItem("careerModeShowdown.gfxMeasured.v2") || "null"),
    cap: JSON.parse(localStorage.getItem("careerModeShowdown.gfxCap.v1") || "null"),
    run: localStorage.getItem("careerModeShowdown.deviceCheckRun.v1")
  }));
  let context = await open();
  let page = context.pages()[0] || await context.newPage();
  await page.goto(base + "device-check.html", {waitUntil: "domcontentloaded"});
  await page.click("#start"); log("started");
  await Promise.race([dieWait, new Promise((_, no) => setTimeout(() => no(new Error("Roulette at High was never opened")), 120000))]);
  log("roulette at High opened", opened.join(" "));
  // The saved data reaches the disk within a few seconds; then the whole browser is killed (SIGKILL: no pagehide, no
  // visibilitychange, no timers), as when iOS kills the tab or the app for memory.
  await page.waitForTimeout(6000);
  const before = opened.slice();
  for(const line of execSync("ps -eo pid=,args=", {encoding: "utf8"}).split("\n")){
    const m = /^\s*(\d+)\s+(.*)$/.exec(line);
    if(m && m[2].includes(`--user-data-dir=${profile}`) && Number(m[1]) !== process.pid) try{ process.kill(Number(m[1]), "SIGKILL"); }catch(_error){}
  }
  await context.close().catch(() => {});
  log("killed");
  // Nik opens the check again 20 s later: a new browser, a new tab (no sessionStorage), the same saved data.
  await new Promise(r => setTimeout(r, 20000));
  context = await open();
  page = context.pages()[0] || await context.newPage();
  await page.goto(base + "device-check.html", {waitUntil: "domcontentloaded"});
  // The check goes on by itself (or not): wait until it says it is done, or nothing more happens for 20 s.
  let last = opened.length, quiet = 0, state = null;
  for(let i = 0; i < 240; i += 1){
    await page.waitForTimeout(500).catch(() => {});
    try{ state = await read(page); }catch(_error){ continue; }
    if(/^Check (done|stopped|not finished)/.test(state.status) && state.run === "null") break;
    if(opened.length === last){ quiet += 1; if(quiet > 40) break; } else { quiet = 0; last = opened.length; }
  }
  await context.close(); server.close(); fs.rmSync(profile, {recursive: true, force: true});
  const after = opened.slice(before.length);
  const report = {browser: "chromium, iPhone 15 Pro emulation", page: PAGE || "device-check.html", openedBeforeClose: before, openedAfter: after, ...state, run: state && state.run && state.run.length > 80 ? `${state.run.slice(0, 80)}…` : state && state.run};
  console.log(JSON.stringify(report, null, 2));
  const want = ["sp@2", "club-draw@2"];
  const fails = [];
  for(const w of want) if(!after.includes(w)) fails.push(`${w} was not opened after the tab closed`);
  if(after.some(x => x.startsWith("rrr@") && Number(x.slice(4)) >= 2)) fails.push("Roulette was opened again at High or above");
  if(!(state && state.measured && state.measured.scenes)) fails.push("no per-screen result was saved");
  else if(!(state.measured.detail && state.measured.detail.stops && state.measured.detail.stops.rrr && state.measured.detail.stops.rrr.level === 2)) fails.push("Roulette's stop at High was not saved");
  if(fails.length){ console.error(`FAIL r97 device check close replay (${MODE})\n  ${fails.join("\n  ")}`); process.exit(1); }
  console.log(`PASS r97 device check close replay (${MODE}): the check went on after Roulette closed the tab at High and saved each screen's level`);
})().catch(error => { console.error(error); process.exit(1); });
