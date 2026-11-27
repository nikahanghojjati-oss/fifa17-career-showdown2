#!/usr/bin/env node
"use strict";
// P3 Lapis (the Ruby pattern of lead A-24, 2026-11-26; Q-29): the Lapis Clubhouse loads only its own art. With Lapis picked on this device, at every quality
// tier and on desktop, upright phone and sideways phone, the game asks for its rooms only from plates-hc/lapis/, its loading
// tunnel only from assets/loading/lapis/ and its panel marble only as css/r78-marble-tile-lapis.webp. It never downloads a
// Wooden room, another clubhouse's room, tunnel or marble, or an old plate where a Lapis copy exists.
// League Roulette (Nik 2026-11-26): with 3D on (WebGL through SwiftShader), at every tier and device, the League screen shows
// the 3D roulette board and never the old flat wheel: the board is on screen, the flat wheel and its pointer are hidden, and
// the board's marble is Lapis's tile. The old wheel is only the backup for a device with no 3D at all.
// After Home each run also opens the sign-in gate (signed out, through the module's own render path as r91 does): it must draw
// Lapis's own sign-in lounge (plates-hc/lapis/ENV_SIGNIN_*, lead A-24 point 3), never the Wooden or another clubhouse's lounge.
// The static half checks the files; the browser half boots the real game (no service worker) and logs every picture request.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const net = require("node:net");
const path = require("node:path");
const { spawn } = require("node:child_process");
const ROOT = path.resolve(__dirname, "../..");
let passed = 0;
const LEAGUE_ONLY = process.env.P3_LAPIS_PHASE === "league";
const ok = name => { passed++; console.log(`ok ${passed} ${name}`); };

const PLATES = path.join(ROOT, "visual-assets/v10_1/plates-hc");
const LAPIS = path.join(PLATES, "lapis"), LAPIS_LOADING = path.join(ROOT, "assets/loading/lapis");
const plain = fs.readdirSync(PLATES).filter(f => /^(ENV|TILE)_.*\.webp$/.test(f) && !/_HC_V2/.test(f));
const lapisRooms = new Set(fs.readdirSync(LAPIS));
const lapisLoading = new Set(fs.readdirSync(LAPIS_LOADING));

// ---------- static ----------
for(const f of plain) assert.ok(lapisRooms.has(f), `plates-hc/lapis/${f}: every room in use has a Lapis copy`);
for(const f of fs.readdirSync(path.join(ROOT, "assets/loading")).filter(f => /^ENV_LOADING_.*\.webp$/.test(f))) assert.ok(lapisLoading.has(f), `assets/loading/lapis/${f}: every tunnel size has a Lapis copy`);
assert.ok(fs.existsSync(path.join(ROOT, "css/r78-marble-tile-lapis.webp")), "the Lapis panel marble is there");
const man = JSON.parse(fs.readFileSync(path.join(ROOT, "tools/clubhouse-themes/PREMIUM_FILES.json"), "utf8"));
const listed = Object.keys(man.files).filter(f => /(?:\/lapis\/|tile-lapis\.webp$)/.test(f));
assert.equal(listed.length, lapisRooms.size + lapisLoading.size + 1, "every Lapis file is in the premium list");
for(const f of listed) assert.match(man.files[f].painting, /_LAPIS_/, `${f} comes from a Lapis painting`);
ok(`static: ${plain.length} rooms, ${lapisLoading.size} tunnel sizes and the marble each have their Lapis copy, all from Lapis paintings`);

// ---------- browser ----------
const ALL_TIERS = ["light", "medium", "high", "extra"];
// The League half runs as two files of two tiers each (P3_LAPIS_TIERS), so each stays well inside the census limit.
const TIERS = process.env.P3_LAPIS_TIERS ? process.env.P3_LAPIS_TIERS.split(",").filter(t => ALL_TIERS.includes(t)) : ALL_TIERS;
const DEVICES = [
  { tag: "desktop 1920x866", viewport: { width: 1920, height: 866 } },
  { tag: "desktop 2x 1440x900", viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 },
  { tag: "phone 390x844", viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true },
  { tag: "phone sideways 844x390", viewport: { width: 844, height: 390 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true }
];
const OTHER_THEME = /(?:plates-hc|assets\/loading)\/(?:silver|black|matte|ruby|emerald)\//;
const ROOM = /visual-assets\/v10_1\/plates-hc\//, TUNNEL = /assets\/loading\/(?:[a-z]+\/)?ENV_LOADING_/, TILE = /css\/r78-marble-tile(?:-[a-z]+)?\.webp$/;
const OLD_PLATE = /(?:^|\/)(ENV_[A-Z0-9_]+\.webp)$/;

function judge([urls, loaded], where){
  const bad = [];
  for(const u of urls){
    if(OTHER_THEME.test(u)) bad.push(`another clubhouse's art ${u}`);
    else if(ROOM.test(u) && !/plates-hc\/lapis\//.test(u) && !/plates-hc\/PACK_/.test(u)) bad.push(`a Wooden room ${u}`);
    else if(TUNNEL.test(u) && !/assets\/loading\/lapis\//.test(u)) bad.push(`a Wooden tunnel ${u}`);
    else if(TILE.test(u) && !/r78-marble-tile-lapis\.webp$/.test(u)) bad.push(`another marble ${u}`);
    else if(!ROOM.test(u) && !TUNNEL.test(u)){ const m = u.match(OLD_PLATE); if(m && (lapisRooms.has(m[1]) || lapisLoading.has(m[1]))) bad.push(`an old copy ${u} of a room Lapis has`); }
  }
  assert.deepEqual(bad, [], `${where}: Lapis downloads only Lapis art`);
  assert.ok(loaded.some(u => /plates-hc\/lapis\/ENV_HOME_/.test(u)), `${where}: the Lapis Home room is downloaded and served (not vacuous)`);
  assert.ok(loaded.some(u => /assets\/loading\/lapis\/ENV_LOADING_/.test(u)), `${where}: the Lapis tunnel is downloaded and served`);
  assert.ok(loaded.some(u => /plates-hc\/lapis\/ENV_SIGNIN_/.test(u)), `${where}: the Lapis sign-in lounge is downloaded and served`);
}

function freePort(){ return new Promise((resolve, reject) => { const s = net.createServer(); s.unref(); s.on("error", reject); s.listen(0, "127.0.0.1", () => { const { port } = s.address(); s.close(() => resolve(port)); }); }); }
async function waitForServer(port){ for(let i = 0; i < 100; i++){ const up = await new Promise(r => { const c = net.connect(port, "127.0.0.1", () => { c.end(); r(true); }); c.on("error", () => r(false)); }); if(up) return; await new Promise(r => setTimeout(r, 100)); } throw new Error("static server did not start"); }

async function boot(browser, base, device, tier){
  const { tag, ...opts } = device;
  const context = await browser.newContext({ ...opts, serviceWorkers: "block" });
  try{
    await context.route("**/*", route => new URL(route.request().url()).origin === new URL(base).origin ? route.continue() : route.abort());
    await context.addInitScript(t => { try{ localStorage.setItem("cmsClubhouseTheme", "lapis"); localStorage.setItem("careerModeShowdown.gfxQuality.v1", t); }catch(_error){} }, tier);
    const page = await context.newPage(), seen = new Set();
    await page.route("**/js/onlinePlayerIdentity.js*", async route => { const res = await route.fetch(); const body = (await res.text()).replace('"use strict";', '"use strict";root.__p3SetGate=s=>{gateOpen=true;setOnlineIdentityState(s);renderOnlineIdentityOverlay();};'); await route.fulfill({ response: res, body }); });
    page.on("request", r => { const u = r.url(); if(u.startsWith(base) && /\.(webp|png|jpe?g|avif)(\?|$)/.test(u)) seen.add(u.slice(base.length).replace(/\?.*$/, "")); });
    const served = new Set();
    page.on("response", r => { const u = r.url(); if(r.ok() && u.startsWith(base) && /\.(webp|png|jpe?g|avif)(\?|$)/.test(u)) served.add(u.slice(base.length).replace(/\?.*$/, "")); });
    await page.goto(base, { waitUntil: "domcontentloaded" });
    await page.locator("#loadingScreen").waitFor({ state: "hidden", timeout: 40000 });
    await page.evaluate(() => window.CareerModeSharedJourneyReady?.());
    await page.waitForFunction(() => window.getActiveScreenName && window.getActiveScreenName() === "mainMenu", null, { timeout: 40000 });
    await page.waitForTimeout(1200);
    assert.equal(await page.evaluate(() => document.documentElement.getAttribute("data-clubhouse")), "lapis", `${tag} ${tier}: Lapis is applied`);
    const drawn = await page.evaluate(() => [...document.querySelectorAll("body, body *")].flatMap(el => ["", "::before", "::after"].map(p => getComputedStyle(el, p || null).backgroundImage)).join(" "));
    for(const m of drawn.matchAll(/plates-hc\/(?:([a-z]+)\/)?ENV_[A-Z0-9_]+\.webp/g)) assert.equal(m[1], "lapis", `${tag} ${tier}: every room drawn is Lapis's (${m[0]})`);
    assert.equal(await page.evaluate(() => typeof window.__p3SetGate), "function", `${tag} ${tier}: the sign-in gate hook is in place`);
    await page.evaluate(() => window.__p3SetGate({ status: "signed-out", online: true, busy: false, message: "" }));
    await page.locator("#onlinePlayerIdentityOverlay").waitFor({ state: "visible", timeout: 15000 });
    await page.waitForTimeout(1200);
    const lounge = await page.evaluate(() => getComputedStyle(document.getElementById("onlinePlayerIdentityOverlay")).backgroundImage);
    const rooms = [...lounge.matchAll(/plates-hc\/(?:([a-z]+)\/)?(ENV_[A-Z0-9_]+)\.webp/g)];
    assert.ok(rooms.length > 0 && rooms.every(m => m[1] === "lapis" && /^ENV_SIGNIN_/.test(m[2])), `${tag} ${tier}: the sign-in gate draws Lapis's own lounge (${lounge.slice(0, 300)})`);
    return [[...seen], [...served]];
  }finally{ await context.close(); }
}

// League Roulette: open the screen as the shared flow does, arm and mount the 3D board, then prove it is what shows.
async function league(browser, base, device, tier){
  const { tag, ...opts } = device;
  const context = await browser.newContext({ ...opts, serviceWorkers: "block" });
  try{
    await context.route("**/*", route => new URL(route.request().url()).origin === new URL(base).origin ? route.continue() : route.abort());
    await context.addInitScript(t => { try{ localStorage.setItem("cmsClubhouseTheme", "lapis"); localStorage.setItem("careerModeShowdown.gfxQuality.v1", t); }catch(_error){} }, tier);
    const page = await context.newPage(), seen = new Set();
    page.on("request", r => { const u = r.url(); if(u.startsWith(base) && /\.(webp|png|jpe?g|avif)(\?|$)/.test(u)) seen.add(u.slice(base.length).replace(/\?.*$/, "")); });
    await page.goto(base, { waitUntil: "domcontentloaded" });
    await page.locator("#loadingScreen").waitFor({ state: "hidden", timeout: 40000 });
    await page.waitForFunction(() => window.getActiveScreenName && window.getActiveScreenName() === "mainMenu", null, { timeout: 40000 });
    const mounted = await page.evaluate(async () => {
      await window.ensureGameplayModules();
      const now = new Date().toISOString();
      currentShowdown = normalizeShowdown({ schemaVersion: 2, id: "p3-lapis-league", name: "Daniel vs Nik", managers: { playerOne: "Daniel", playerTwo: "Nik" }, totalRounds: 3, currentRound: 1, status: "Created", selectedLeague: null, clubs: { playerOne: null, playerTwo: null }, score: { playerOne: 0, playerTwo: 0 }, transferChallenges: [], rounds: [], integrityWarnings: [], createdAt: now, updatedAt: now, completedAt: null, archivedAt: null });
      showScreen("leagueWheelScreen");
      if(!window.CareerModeLeagueRouletteStep) await new Promise((ok, no) => { const s = document.createElement("script"); s.src = "js/leagueRouletteStep.js"; s.onload = ok; s.onerror = no; document.head.append(s); });
      const step = window.CareerModeLeagueRouletteStep;
      step.arm(true); step.sync({ seed: "sha256:" + "1".repeat(64) + "|op_p3", winner: "premier_league", drops: 0 });
      return Boolean(await step.ensure()) && !step.failed();
    });
    assert.ok(mounted, `${tag} ${tier}: the 3D roulette board mounts`);
    await page.waitForTimeout(1500);
    const shown = await page.evaluate(() => {
      const wheel = document.getElementById("leagueWheel"), host = wheel && wheel.querySelector(".lr3dHost"), canvas = host && host.querySelector("canvas");
      const r = canvas ? canvas.getBoundingClientRect() : null, vis = el => getComputedStyle(el).visibility !== "hidden" && getComputedStyle(el).display !== "none";
      return { on: Boolean(wheel && wheel.classList.contains("lr3d-on") && document.documentElement.classList.contains("lr3d-room") && canvas && (canvas.getContext("webgl2") || canvas.getContext("webgl"))), board: Boolean(r && r.width > 100 && r.height > 100 && r.bottom > 0 && r.top < innerHeight && vis(host)),
        flat: wheel ? [...wheel.children].filter(el => el !== host && vis(el)).map(el => el.id || el.className) : ["no #leagueWheel"],
        pointer: [...document.querySelectorAll("#leagueWheelScreen .wheelPointer")].filter(vis).length };
    });
    assert.ok(shown.on && shown.board, `${tag} ${tier}: the 3D roulette board is on screen (${JSON.stringify(shown)})`);
    assert.deepEqual([shown.flat, shown.pointer], [[], 0], `${tag} ${tier}: the old flat wheel and its pointer are hidden`);
    const urls = [...seen];
    assert.ok(urls.includes("css/r78-marble-tile-lapis.webp"), `${tag} ${tier}: the board's marble is Lapis's tile`);
    const wrong = urls.filter(u => (/(?:plates-hc|assets\/loading)\/(?:silver|black|matte|ruby|emerald)\//.test(u)) || (/plates-hc\/ENV_/.test(u)) || (/r78-marble-tile(?:-[a-z]+)?\.webp$/.test(u) && !/tile-lapis\.webp$/.test(u)));
    assert.deepEqual(wrong, [], `${tag} ${tier}: League Roulette downloads only Lapis rooms and marble`);
    assert.ok(urls.some(u => /plates-hc\/lapis\/ENV_BOX_/.test(u)), `${tag} ${tier}: the room behind the board is Lapis's box`);
  }finally{ await context.close(); }
}

(async () => {
  const { chromium } = require("playwright");
  const { resolveChromiumRuntime } = require("../support/chromium-runtime.cjs");
  const port = await freePort();
  const server = spawn(process.execPath, [path.join(ROOT, "tests/support/static-server.cjs")], { cwd: ROOT, stdio: "ignore", env: { ...process.env, CMS_TEST_PORT: String(port) } });
  let browser = null;
  try{
    await waitForServer(port);
    const runtime = await resolveChromiumRuntime();
    browser = await chromium.launch({ executablePath: runtime.executablePath, headless: true, args: runtime.args.filter(arg => arg !== "--single-process") });
    const base = `http://127.0.0.1:${port}/`;
    // The two browser halves run as two contract files so each stays inside the census's 120 s limit per file (CI, 26 Nov:
    // the combined run timed out); p3-lapis-league-3d-contracts.cjs sets P3_LAPIS_PHASE=league and requires this file.
    if(LEAGUE_ONLY && !TIERS.length) throw new Error("P3_LAPIS_TIERS names no quality tier");
    if(!LEAGUE_ONLY) for(const tier of TIERS){
      const runs = await Promise.all(DEVICES.map(d => boot(browser, base, d, tier).then(urls => [d.tag, urls])));
      for(const [tag, urls] of runs) judge(urls, `${tag} at ${tier}`);
      ok(`${tier}: desktop, 2x desktop, upright and sideways phone boot to Home and open the sign-in gate in Lapis, downloading only Lapis rooms, sign-in lounge, tunnel and marble`);
    }
    if(LEAGUE_ONLY){
    await browser.close(); browser = null;
    // 3D on, as on Nik's Chromebook and phones (CI's browser starts with WebGL off).
    browser = await chromium.launch({ executablePath: runtime.executablePath, headless: true, args: [...runtime.args.filter(arg => !["--single-process", "--disable-webgl", "--in-process-gpu"].includes(arg)), "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
    for(const tier of TIERS){
      await Promise.all(DEVICES.map(d => league(browser, base, d, tier)));  // the four devices at once, as the boot half does (one by one took 198 s, past the census limit)
      ok(`${tier}: League Roulette shows the 3D roulette board on Lapis's marble, never the old flat wheel, on desktop, 2x desktop, upright and sideways phone`);
    }
    }
    console.log(`PASS P3 Lapis own art${LEAGUE_ONLY ? ` (League Roulette 3D board, ${TIERS.join(" and ")})` : " (rooms, tunnel, marble and sign-in lounge)"}: ${passed} checks.`);
  }catch(error){ console.error(error); process.exitCode = 1; }
  finally{ if(browser) await browser.close(); server.kill(); }
})();
