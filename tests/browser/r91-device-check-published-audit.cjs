"use strict";
// r91 Device check, published (Sol 6.1 review of 2.3.0): the check must open on the site as GitHub Pages serves it, not only
// from the repository tree. Each tree is staged with its own Pages workflow step (tests/support/stage-pages-artifact.cjs),
// so a file the step forgets is a 404 here exactly as it is online, and every case checks the page's own heading and a
// measured scene row, so Home answering under the Device check's address can never pass.
//   D0  (only with CMS_UPGRADE_FROM_ROOT) 2.3.0 as published: both pages answer 404, and with its worker in control
//       Settings > 3D QUALITY > Device check… shows Home. The defect, reproduced.
//   D1  this build as published: both pages answer 200 with their own documents.
//   D2  a fresh browser (no worker): the check opens, starts and shows a measured row.
//   D3  a session this build's worker controls: Settings > 3D QUALITY > Device check… opens the check; a measured row.
//   D4  (only with CMS_UPGRADE_FROM_ROOT) a browser that ran 2.3.0 takes the update, then opens the check from Settings.
// The release PR's edits are simulated in what the server sends (the new revision, PREVIOUS = 2.3.0-r90), as in
// tests/browser/r87-upgrade-from-r86-audit.cjs. No Firebase: every request that is not this local server is refused.
// Run: node tests/browser/r91-device-check-published-audit.cjs
//      CMS_UPGRADE_FROM_ROOT=../r90-main node tests/browser/r91-device-check-published-audit.cjs   (a 2.3.0 tree: main a85d286)
// Not a Gate lane (it needs WebGL2 and a few minutes); the contract is tests/contracts/r91-device-check-published-contracts.cjs.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const http = require("node:http");
const os = require("node:os");
const path = require("node:path");
const vm = require("node:vm");
const {chromium} = require("playwright");
const {stage} = require("../support/stage-pages-artifact.cjs");

const ROOT = path.resolve(__dirname, "../..");
const OLD_ROOT = process.env.CMS_UPGRADE_FROM_ROOT ? path.resolve(process.env.CMS_UPGRADE_FROM_ROOT) : "";
const FROM = "2.3.0-r90", TO = process.env.CMS_UPGRADE_TO_REVISION || "2.4.0-r91", TO_APP = TO.split("-")[0];
const PORT = Number(process.env.CMS_DEVICE_CHECK_PORT || 4637);
const BASE = `http://127.0.0.1:${PORT}/`;
const OUT = path.join(ROOT, "test-results", "r91-device-check-published");
const SIZES = [[1920, 866], [1920, 1035]];
const pass = message => console.log(`PASS ${message}`);
const DEVICE_CHECK = ["device-check.html", "device-check-chamber.html"];

function swFacts(source){
  const sandbox = {self: {addEventListener(){}, location: {href: BASE}, registration: {scope: BASE}}, URL, console, Response: function(){}, caches: {}, fetch(){}, setTimeout, clearTimeout};
  vm.createContext(sandbox);
  vm.runInContext(`${source}\n;globalThis.__facts={revision:RUNTIME_REVISION,shell:[...SHELL_PATHS]};`, sandbox);
  return JSON.parse(JSON.stringify(sandbox.__facts));
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "cms-device-check-"));
const NEW_SITE = path.join(tmp, "new"), OLD_SITE = path.join(tmp, "old");
stage(NEW_SITE);
const haveOld = Boolean(OLD_ROOT && fs.existsSync(path.join(OLD_ROOT, "service-worker.js")));
let oldFacts = null;
if(haveOld){
  stage(OLD_SITE, {root: OLD_ROOT});
  oldFacts = swFacts(fs.readFileSync(path.join(OLD_SITE, "service-worker.js"), "utf8"));
  assert.equal(oldFacts.revision, FROM, `CMS_UPGRADE_FROM_ROOT must hold 2.3.0 (${FROM}), found ${oldFacts.revision}`);
}
const newWorkerSource = fs.readFileSync(path.join(NEW_SITE, "service-worker.js"), "utf8");
const newFacts = swFacts(newWorkerSource);
const HERE = newFacts.revision;
// With a 2.3.0 tree the new build is served as the release that follows it; without one it is served as it is.
const added = oldFacts ? newFacts.shell.filter(p => !oldFacts.shell.includes(p)) : [], removed = oldFacts ? oldFacts.shell.filter(p => !newFacts.shell.includes(p)) : [];
function releaseText(rel, text){
  if(!haveOld || HERE !== FROM) return text;
  let out = text.split(FROM).join(TO);
  if(rel === "service-worker.js"){
    out = out.replace(/const PREVIOUS_RUNTIME_REVISION = "[^"]*";/, `const PREVIOUS_RUNTIME_REVISION = "${FROM}";`);
    out = out.replace(/const SHELL_PATHS_ADDED_SINCE_PREVIOUS = new Set\([^;]*\);/, `const SHELL_PATHS_ADDED_SINCE_PREVIOUS = new Set(${JSON.stringify(added)});`);
    out = out.replace(/const SHELL_PATHS_REMOVED_SINCE_PREVIOUS = new Set\([^;]*\);/, `const SHELL_PATHS_REMOVED_SINCE_PREVIOUS = new Set(${JSON.stringify(removed)});`);
  }
  if(rel === "js/app.js") out = out.replace(/const APP_VERSION = "[^"]+";/, `const APP_VERSION = "${TO_APP}";`);
  return out;
}
const NOW = haveOld && HERE === FROM ? TO : HERE;

const MIME = {".css": "text/css; charset=utf-8", ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".mjs": "text/javascript; charset=utf-8", ".json": "application/json; charset=utf-8", ".webmanifest": "application/manifest+json; charset=utf-8", ".png": "image/png", ".webp": "image/webp", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".wav": "audio/wav", ".ogg": "audio/ogg", ".txt": "text/plain; charset=utf-8", ".md": "text/markdown; charset=utf-8", ".avif": "image/avif", ".gif": "image/gif", ".glb": "model/gltf-binary", ".wasm": "application/wasm", ".exr": "application/octet-stream"};
const TEXT = new Set([".css", ".html", ".js", ".mjs", ".json", ".webmanifest", ".txt", ".md", ".svg"]);
let serving = "new";
const server = http.createServer((request, response) => {
  const url = new URL(request.url, BASE); let rel = decodeURIComponent(url.pathname).replace(/^\/+/, "") || "index.html";
  const root = serving === "old" ? OLD_SITE : NEW_SITE, file = path.resolve(root, rel);
  if(file !== root && !file.startsWith(root + path.sep)){ response.writeHead(403); response.end(); return; }
  let target = file; try{ if(fs.statSync(target).isDirectory()){ target = path.join(target, "index.html"); rel = path.posix.join(rel, "index.html"); } }catch(_error){}
  fs.readFile(target, (error, data) => {
    // GitHub Pages answers a missing file with 404 and an HTML body.
    if(error){ response.writeHead(404, {"content-type": "text/html; charset=utf-8", "cache-control": "no-store"}); response.end("<!doctype html><title>Page not found</title><h1>404</h1>"); return; }
    const ext = path.extname(target).toLowerCase();
    let body = data; if(serving === "new" && TEXT.has(ext)) body = Buffer.from(releaseText(rel, data.toString("utf8")));
    response.writeHead(200, {"content-type": MIME[ext] || "application/octet-stream", "cache-control": "no-store", "x-content-type-options": "nosniff"});
    response.end(request.method === "HEAD" ? undefined : body);
  });
});

async function workerMessage(page, type, which = "active"){
  return page.evaluate(({type, which}) => new Promise(async (resolve, reject) => {
    const reg = await navigator.serviceWorker.getRegistration("./"), worker = which === "waiting" ? reg?.waiting : (reg?.active || navigator.serviceWorker.controller);
    if(!worker) return reject(new Error(`no ${which} worker`));
    const channel = new MessageChannel(), timer = setTimeout(() => reject(new Error(`${type} timed out`)), 15000);
    channel.port1.onmessage = event => { clearTimeout(timer); resolve(event.data); }; worker.postMessage({type}, [channel.port2]);
  }), {type, which});
}
async function poll(page, predicate, timeout, message){ const until = Date.now() + timeout; while(Date.now() < until){ if(await page.evaluate(predicate).catch(() => false)) return; await page.waitForTimeout(250); } throw new Error(message); }
async function waitHome(page, timeout = 90000){ await page.waitForFunction(() => typeof window.getActiveScreenName === "function" && window.getActiveScreenName() === "mainMenu" && !document.querySelector("#loadingScreen:not(.hidden)"), null, {timeout}); }
async function controlled(page, revision){
  await page.goto(BASE, {waitUntil: "domcontentloaded"}); await waitHome(page);
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller), null, {timeout: 90000}).catch(async () => { await page.reload({waitUntil: "domcontentloaded"}); await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller), null, {timeout: 90000}); });
  await poll(page, () => navigator.serviceWorker.getRegistration("./").then(r => Boolean(r && r.active && r.active.state === "activated" && !r.installing && !r.waiting)), 180000, `the ${revision} worker never activated`);
  const status = await workerMessage(page, "CMS_GET_CACHE_STATUS");
  assert.equal(status.revision, revision); assert.equal(status.current.ok, true, `${revision} shell not verified: ${JSON.stringify(status.current.missing || []).slice(0, 300)}`);
  await waitHome(page);
}
// The player's own path: Settings > MOTION & FEEDBACK > 3D QUALITY > Device check…
async function openFromSettings(page){
  await page.locator("#settingsButton").evaluate(button => button.click());
  await page.waitForFunction(() => { const s = document.querySelector(".settingsGfxSelect"); return s && !s.disabled && [...s.options].some(o => o.value === "device-check"); }, null, {timeout: 60000});
  await Promise.all([page.waitForNavigation({waitUntil: "domcontentloaded", timeout: 60000}), page.selectOption(".settingsGfxSelect", "device-check")]);
}
// The Device check itself: its heading, its Start button, then a scene row with a measured frame rate.
async function measuredRow(page, label){
  assert.match(new URL(page.url()).pathname, /\/device-check\.html$/, `${label}: the address is the Device check`);
  const heading = await page.locator("h1").first().textContent({timeout: 15000}).catch(() => "");
  assert.equal(String(heading).trim(), "DEVICE CHECK", `${label}: the page under the Device check's address is the Device check (found heading "${String(heading).trim()}")`);
  assert.equal(await page.evaluate(() => typeof window.getActiveScreenName), "undefined", `${label}: the game shell is not what loaded`);
  await page.locator("#start").click();
  await page.waitForFunction(() => /\d+(?:\.\d+)? fps/.test(document.getElementById("rows")?.textContent || ""), null, {timeout: 240000});
  const row = await page.evaluate(() => [...document.querySelectorAll("#rows tr")].map(tr => tr.textContent.replace(/\s+/g, " ").trim()).find(text => /\d fps/.test(text)) || "");
  assert.match(row, /^Light.*\d+(?:\.\d+)? fps/, `${label}: a measured row (${row})`);
  return row.slice(0, 160);
}

async function run(){
  fs.mkdirSync(OUT, {recursive: true});
  await new Promise(resolve => server.listen(PORT, "127.0.0.1", resolve));
  const browser = await chromium.launch({headless: true, args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"]});
  const fresh = async size => { const context = await browser.newContext({viewport: {width: size[0], height: size[1]}});
    await context.route("**/*", route => { const u = new URL(route.request().url()); return u.hostname === "127.0.0.1" && Number(u.port) === PORT ? route.continue() : route.abort(); });
    return context; };
  try{
    // D0 -------------------------------------------------------------------------------------------------------------
    if(haveOld){
      serving = "old";
      for(const page of DEVICE_CHECK){ const r = await fetch(BASE + page); assert.equal(r.status, 404, `2.3.0 as published answers ${page} with 404`); }
      const context = await fresh(SIZES[0]), page = await context.newPage();
      await controlled(page, FROM);
      await openFromSettings(page);
      await waitHome(page);
      const seen = await page.evaluate(() => ({path: location.pathname, heading: document.querySelector("h1")?.textContent?.trim() || "", screen: window.getActiveScreenName()}));
      assert.match(seen.path, /device-check\.html$/); assert.equal(seen.screen, "mainMenu"); assert.notEqual(seen.heading, "DEVICE CHECK");
      await page.screenshot({path: path.join(OUT, "D0-2.3.0-device-check-shows-home-1920x866.png")});
      await context.close();
      pass(`D0 2.3.0 reproduced: both pages 404 as published; with its worker in control, Device check… lands on ${seen.path} showing Home`);
    }
    // D1 -------------------------------------------------------------------------------------------------------------
    serving = "new";
    for(const page of DEVICE_CHECK){
      const r = await fetch(BASE + page), body = await r.text();
      assert.equal(r.status, 200, `${page} answers 200 as published`);
      assert.match(body, page === "device-check.html" ? /<h1>DEVICE CHECK<\/h1>/ : /<title>Chamber Men bench<\/title>/, `${page} is its own document`);
    }
    pass("D1 this build as published: device-check.html and device-check-chamber.html answer 200 with their own documents");
    // D2 -------------------------------------------------------------------------------------------------------------
    for(const size of SIZES){
      const context = await fresh(size), page = await context.newPage();
      await page.goto(BASE + "device-check.html", {waitUntil: "domcontentloaded"});
      assert.equal(await page.evaluate(() => Boolean(navigator.serviceWorker.controller)), false, "a fresh browser has no worker");
      const row = await measuredRow(page, `fresh ${size.join("x")}`);
      await page.screenshot({path: path.join(OUT, `D2-fresh-${size.join("x")}.png`)});
      await context.close();
      pass(`D2 fresh browser ${size.join("x")}: heading DEVICE CHECK, measured row "${row}"`);
    }
    // D3 -------------------------------------------------------------------------------------------------------------
    {
      const context = await fresh(SIZES[1]), page = await context.newPage();
      await controlled(page, NOW);
      await openFromSettings(page);
      assert.equal(await page.evaluate(() => Boolean(navigator.serviceWorker.controller)), true, "the worker controls the Device check page");
      const row = await measuredRow(page, "worker-controlled");
      await page.screenshot({path: path.join(OUT, "D3-worker-controlled-1920x1035.png")});
      await context.close();
      pass(`D3 worker-controlled session (${NOW}): Settings > 3D QUALITY > Device check… opens the check; measured row "${row}"`);
    }
    // D4 -------------------------------------------------------------------------------------------------------------
    if(haveOld){
      serving = "old";
      const context = await fresh(SIZES[0]), page = await context.newPage();
      await controlled(page, FROM);
      serving = "new";
      let navigations = 0; page.on("framenavigated", frame => { if(frame === page.mainFrame()) navigations += 1; });
      await page.evaluate(() => navigator.serviceWorker.getRegistration("./").then(r => r.update()));
      // On Home the update applies by itself and the page reloads into the new build.
      const until = Date.now() + 240000; while(navigations === 0 && Date.now() < until) await page.waitForTimeout(250);
      assert.ok(navigations > 0, "the update did not apply on Home within 240 s");
      await page.waitForLoadState("domcontentloaded"); await waitHome(page);
      const status = await workerMessage(page, "CMS_GET_CACHE_STATUS");
      assert.equal(status.revision, NOW, "the new worker is in control after the update");
      await openFromSettings(page);
      const row = await measuredRow(page, "upgraded from 2.3.0");
      await page.screenshot({path: path.join(OUT, "D4-upgraded-from-2.3.0-1920x866.png")});
      await context.close();
      pass(`D4 a browser that ran ${FROM} took ${NOW}, then Settings > 3D QUALITY > Device check… opened the check; measured row "${row}"`);
    }else{
      console.log("SKIP D0 and D4: set CMS_UPGRADE_FROM_ROOT to a 2.3.0 tree (main a85d286)");
    }
    console.log(`PASS r91 device check published audit (screenshots in ${path.relative(ROOT, OUT)})`);
  }finally{
    await browser.close().catch(() => {}); server.close(); fs.rmSync(tmp, {recursive: true, force: true});
  }
}
run().catch(error => { console.error(error); process.exitCode = 1; });
