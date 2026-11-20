"use strict";
// r97 Roulette on phones lets its painted 2D canvases go once they are on the GPU (Nik's iPhone 17 closed the Device check on
// this screen at High, 2026-11-18). Chromium, iPhone profile: 2D canvases 78 MB at Balanced and 128 MB at High stayed alive beside
// 123 / 214 MB of GPU textures, and the phone memory budget counted only the GPU half.
//   C1 phones only, at warm-up, after every texture is uploaded; a canvas goes only when every texture drawn from it is on the GPU
//   C2 the boards' canvases (painted again in play: canvas, first, spare, anything boardTex marked __tex) are kept
//   C3 a lost context that comes back after canvases went cannot rebuild the scene: the turn goes on as after a context that
//      never comes back (EMBED: cms-rr-error, the game's result card; else a reload), never a black scene
//   C4 window.__rr.freed says what went, and counts any freed texture uploaded again (tests/browser/r97-rrr-phone-canvas-compare.cjs
//      plays the same frames before/after and fails on any changed pixel or re-upload)
//   C5 the phone memory budget counts live 2D canvases beside the GPU memory (tests/browser/device-lab.cjs canvas2dMB)
//   C6 (lead on #1554) the game takes that hand-over mid-turn: the real js/rosterRouletteStep.js, its page ready and armed and the
//      scene on screen, gets cms-rr-error: the stage goes, the result card shows this season's planned outcome, and its button
//      records the spin once (ctx.remember, one call, the engine's outcome); a second cms-rr-error changes nothing. The two-phone
//      proof in play: tests/browser/support/ce2pg-rrr-context-loss.cjs (CE2PG, opt-in)
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ROOT = path.resolve(__dirname, "../..");
const RR = fs.readFileSync(path.join(ROOT, "visual-assets/v10_1/roulette/index.html"), "utf8");
const BUDGET = fs.readFileSync(path.join(ROOT, "tests/browser/phone-memory-budget.cjs"), "utf8");
const LAB = fs.readFileSync(path.join(ROOT, "tests/browser/device-lab.cjs"), "utf8");
let n = 0; const ok = (id, t) => { n += 1; console.log(`ok ${n} ${id} ${t}`); };
for (const m of RR.matchAll(/<script>([\s\S]*?)<\/script>/g)) new vm.Script(m[1]);
const warm = RR.slice(RR.indexOf("async function warmUp(){"), RR.indexOf('toGame2("cms-rr-loading",{stage:"compile"});'));
assert.match(warm, /all\.forEach\(t=>\{ try\{ renderer\.initTexture\(t\); \}catch\(e\)\{\} \}\);\n  if\(GFX\.phone\) freeCanvases\(all\);\n/, "phones only, right after every texture is uploaded");
const free = RR.slice(RR.indexOf("function freeCanvases(all){"), RR.indexOf("async function warmUp(){"));
assert.match(free, /if\(!ts\.every\(t=>\{ const p=renderer\.properties\.get\(t\); return p&&p\.__webglTexture; \}\)\) return;/, "only when every texture drawn from it is on the GPU");
assert.match(free, /c\.width=c\.height=0;/);
ok("C1", "phones let a painted canvas go at warm-up, only once every texture drawn from it is on the GPU");
assert.match(free, /\["D","N"\]\.forEach\(k=>\{ const b=boards\[k\]\.userData; \[b\.canvas,b\.first,b\.spare\]\.forEach\(c=>\{ if\(c\) keep\.add\(c\); \}\); \}\);/);
assert.match(free, /keep\.has\(c\)\|\|c\.__tex\) return;/);
assert.match(RR, /function boardTex\(c\)\{ const t=new T\.CanvasTexture\(c\);[^\n]*c\.__tex=t; return t; \}/, "boardTex marks the boards' canvases");
assert.match(RR, /b\.canvas\.__tex\.needsUpdate=true;/, "the boards are painted again in play");
ok("C2", "the boards' canvases, painted again in play, are kept");
assert.match(RR, /webglcontextrestored",\(\)=>\{ clearTimeout\(lostTimer\); lostTimer=0; lostOn=false; if\(leaving\|\|lostSent\) return;\n[^\n]*\n  if\(FREED&&FREED\.canvases\)\{ lostSent=true; if\(EMBED\) toGame\("cms-rr-error",\{message:"webgl context lost"\}\); else location\.reload\(\); return; \}/);
ok("C3", "a context that comes back after canvases went hands the turn on (result card or reload), never a black scene");
assert.match(RR, /get freed\(\)\{ return FREED\?\{\.\.\.FREED\}:null; \}/); assert.match(free, /t\.onUpdate=\(\)=>\{ out\.reuploads\+=1; \};/);
assert.ok(fs.existsSync(path.join(ROOT, "tests/browser/r97-rrr-phone-canvas-compare.cjs")));
ok("C4", "__rr.freed says what went and counts any re-upload; the before/after pixel replay exists");
assert.match(BUDGET, /const total = Math\.round\(\(r\.allocTexMB \+ r\.allocRbMB \+ r\.canvas2dMB\) \* 10\) \/ 10;/);
assert.match(LAB, /canvas2dMB: data\.canvas2dMB == null \? null : r1\(data\.canvas2dMB\)/);
ok("C5", "the phone memory budget counts live 2D canvases beside the GPU memory");
// C7 (r97 slow font load): labels painted before the font arrived are painted again, kept off freeCanvases until then
//   the label on the pointer ("FIRES HERE"), each board's plate and the boards are redone when document.fonts has the face; the page waits
//   FONT_WAIT_MS for the fonts behind the loading screen and tells the game it is still busy meanwhile. Real run (slow fonts held back,
//   labels measured as painted): tests/browser/r97-rrr-late-fonts.cjs
assert.match(RR, /const FONT_FACES=\[[^\n]*\], FONT_WAIT_MS=15000;/);
assert.ok(RR.indexOf("const FONT_FACES=") < RR.indexOf("function cv(w,h)"), "defined before the gun and its label are built (a const below them is in its dead zone and fontsOk would say yes)");
assert.match(RR, /function lateFont\(c,t,paint\)\{ if\(fontsOk\(\)\) return; c\.__late=\{t,paint\}; LATE\.push\(c\); \}/);
assert.match(RR, /lateFont\(c,t,paint\); return t; \}\)\(\);/, "the pointer label");
assert.match(RR, /paint\(\); const t=new T\.CanvasTexture\(c\); t\.colorSpace=T\.SRGBColorSpace; t\.anisotropy=8; lateFont\(c,t,paint\); return t; \}/, "the board plate");
assert.match(RR, /function repaintLate\(\)\{ if\(!fontsOk\(\)\|\|\(!LATE\.length&&!boardsLate\)\) return;/);
assert.match(RR, /l\.paint\(\); l\.t\.needsUpdate=true;/);
assert.match(RR, /if\(boardsLate&&SQUADS&&!playing&&turn===0&&/, "the boards are drawn again only before a turn has begun");
assert.match(RR, /function drawBoard\(key,club\)\{[^\n]*\n? ?[^\n]*if\(!boardsLate&&!fontsOk\(\)\) boardsLate=true;/);
assert.match(free, /LATE\.forEach\(c=>keep\.add\(c\)\);/, "a canvas still waiting for the font is not freed");
assert.match(RR, /layout\(\); buildEnv\(\); repaintLate\(\);/, "labels are redone before warm-up uploads and frees them");
assert.match(RR, /document\.fonts\.addEventListener\("loadingdone",repaintLate\); document\.fonts\.ready\.then\(repaintLate\)/);
assert.match(RR, /document\.fonts\.load\(f\)\.catch\(\(\)=>\[\]\)\)\), new Promise\(r=>setTimeout\(r,FONT_WAIT_MS\)\)\]\);/, "a font file that fails does not stop the start");
assert.match(RR, /setInterval\(\(\)=>toGame2\("cms-rr-loading",\{stage:"fonts"\}\),2000\)/, "the game's loading screen hears the wait");
assert.ok(fs.existsSync(path.join(ROOT, "tests/browser/r97-rrr-late-fonts.cjs")));
ok("C7", "a label painted before its font is painted again once document.fonts has it; the start waits 15 s behind the loading screen; pending canvases are kept");
// C6
(async () => {
  const STEP = fs.readFileSync(path.join(ROOT, "js/rosterRouletteStep.js"), "utf8");
  class El { constructor(tag) { this.tagName = tag; this.children = []; this.attrs = {}; this.listeners = {}; this.style = {}; this.classList = {add() {}, remove() {}}; this.textContent = ""; this.parent = null;
      if (tag === "iframe") this.contentWindow = {posted: [], postMessage(m) { this.posted.push(m); }, location: {href: "x"}, THREE: {}}; }
    append(...nodes) { for (const x of nodes) { x.parent = this; this.children.push(x); } }
    remove() { if (this.parent) this.parent.children = this.parent.children.filter(x => x !== this); this.parent = null; }
    setAttribute(k, v) { this.attrs[k] = String(v); } getAttribute(k) { return this.attrs[k] ?? null; } removeAttribute(k) { delete this.attrs[k]; }
    addEventListener(t, fn) { (this.listeners[t] ||= []).push(fn); } focus() {}
    all() { return [this, ...this.children.flatMap(c => c.all())]; }
    querySelector(sel) { return sel === "button" ? this.all().slice(1).find(x => x.tagName === "button") || null : null; } }
  const body = new El("body"), doc = {body, createElement: tag => new El(tag), getElementById: id => body.all().find(x => x.id === id) || null};
  const handlers = [], store = new Map(), remembered = [];
  const hit = {name: "Theo Walcott", pos: "RM", positions: ["RM"], rating: 81, number: 14};
  const plan = {boards: {playerOne: [hit], playerTwo: [{name: "Simon Mignolet", pos: "GK", positions: ["GK"], rating: 82, number: 22}]}, formations: {playerOne: "x", playerTwo: "y"},
    turns: [{role: "playerOne", fired: true, player: hit, bulletChamber: 1, stopChamber: 1, hitSlot: 0, aimSlot: 0}, {role: "playerTwo", fired: false, player: null, bulletChamber: 2, stopChamber: 5, hitSlot: null, aimSlot: 0}], skipped: {}};
  const sandbox = {document: doc, setTimeout: (fn, ms) => setTimeout(fn, Math.min(ms, 30)), clearTimeout, location: {origin: "x"}, Date,
    addEventListener: (t, fn) => { if (t === "message") handlers.push(fn); }, removeEventListener() {},
    readStorageValue: k => store.get(k) || null, writeStorageValue: (k, v) => { store.set(k, v); return true; },
    loadRuntimeScript: async () => { sandbox.CareerModeFifa17Players = {clubs: {Arsenal: {}, Liverpool: {}}}; sandbox.CareerModeRosterSquads = {}; sandbox.CareerModeMarqueePlayers = {}; sandbox.CareerModeMarqueePlayer = {forShowdown: () => null};
      sandbox.CareerModeRosterRoulette = {forSeason: () => plan, board: () => [{}], outcome: (p, role, version) => ({role, fired: p.turns.find(x => x.role === role).fired, version})}; return true; }};
  vm.createContext(sandbox); vm.runInContext(STEP, sandbox);
  const step = sandbox.CareerModeRosterRouletteStep;
  const ctx = {rivalryId: "pair_" + "c".repeat(64), managerRole: "playerOne", season: 1, clubs: {playerOne: "Arsenal", playerTwo: "Liverpool"}, confirmedAtMs: Date.parse("2026-11-02T05:00:00Z") + 3600000, phase: "NOT_STARTED",
    verdicts: async () => ({ok: false}), remember: o => { remembered.push(o); }};
  const run = step.runBeforeTransfers(ctx);
  const until = async (f, what) => { for (let i = 0; i < 400; i += 1) { const v = f(); if (v) return v; await new Promise(r => setTimeout(r, 5)); } assert.fail(what); };
  const frame = await until(() => body.all().find(x => x.tagName === "iframe"), "the roulette page is framed");
  const say = data => { for (const h of handlers) h({source: frame.contentWindow, origin: "x", data}); };
  say({type: "cms-rr-ready"});
  await until(() => frame.contentWindow.posted.some(m => m.type === "cms-rr-setup"), "the setup is sent");
  say({type: "cms-rr-armed"});
  const stage = await until(() => { const st = doc.getElementById(step.stageId); return st && st.style.visibility === "visible" ? st : null; }, "the scene is on screen");
  assert.equal(doc.getElementById(step.panelId), null, "no card while the scene plays");
  // Mid-turn: the context came back after the canvases went, and the page hands the turn over.
  say({type: "cms-rr-error", message: "webgl context lost"});
  const panel = await until(() => doc.getElementById(step.panelId), "the result card shows");
  assert.equal(doc.getElementById(step.stageId), null, "the stage is gone");
  const text = panel.all().map(x => x.textContent).join(" | ");
  assert.match(text, /Theo Walcott/, "the card names this season's planned hit");
  assert.equal(remembered.length, 0, "nothing is recorded before the card's button");
  say({type: "cms-rr-error", message: "webgl context lost"});
  const go = panel.all().find(x => x.tagName === "button" && x.attrs["data-id"] !== "back" && !/BACK TO SHOWDOWN HOME/.test(x.textContent));
  assert.ok(go && go.listeners.click, "the card has its go-on button"); go.listeners.click[0]();
  assert.equal(await run, true, "the step goes on to the Transfer War");
  assert.equal(remembered.length, 1, "the spin is recorded exactly once");
  assert.deepEqual({...remembered[0]}, {role: "playerOne", fired: true, version: null}, "the recorded spin is the engine's planned outcome");
  say({type: "cms-rr-error", message: "webgl context lost"}); await new Promise(r => setTimeout(r, 50));
  assert.equal(remembered.length, 1, "a late hand-over records nothing more");
  void stage;
  ok("C6", "mid-turn cms-rr-error: the stage goes, the card shows the planned outcome, its button records the spin once");
  console.log(`PASS r97 Roulette phone canvas contracts (${n} checks)`);
})().catch(e => { console.error(e); process.exit(1); });
