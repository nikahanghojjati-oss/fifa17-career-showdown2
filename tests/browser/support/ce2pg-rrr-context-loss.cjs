"use strict";
// r97 (lead on #1554): on a phone, Russian Roulette lets its painted canvases go once they are on the GPU, so a lost WebGL
// context that the browser gives back can no longer be rebuilt: the page hands the turn to the game (cms-rr-error) as if the
// context had never come back. This proves that hand-over is safe in a real two-manager Showdown. Loaded with NODE_OPTIONS
// beside the roulette observer (no edit to the harness), opt-in, never in the Gate:
//   CE2PG_RRR_LOSE="1:daniel:spin,1:nik:aim,2:daniel:shot,2:nik:result" CE2PG_PLAN=single CE2PG_SEASONS=3 \
//   NODE_OPTIONS="--require ./tests/browser/support/ce2pg-roulette-observer.cjs --require ./tests/browser/support/ce2pg-rrr-context-loss.cjs" \
//   node tests/browser/ce2pg-journey.cjs
// Each rule is season:who:beat. Beats: spin (Daniel's turn, the drum spinning), aim (Daniel's turn, the gun on the board),
// shot (Nik's turn, the shot), result (Nik's turn, after the impact). On that manager's phone, in that season's roulette, the
// scene's own WebGL context is lost (WEBGL_lose_context) at that beat and given back 1.5 s later.
// It turns WebGL on in CE2PG's Chromium (SwiftShader), so the scene really plays on both phones (CE2PG's windows are phone
// sized, so the game treats both as phones and frees the canvases). At exit, for every rule:
//   X1 the loss happened at that beat, on a page that had let canvases go (__rr.freed.canvases > 0), and was given back
//   X2 that page sent exactly one cms-rr-error after the loss and never a cms-rr-continue
//   X3 the result card showed within 10 s of the context coming back (no reload: the game shows its result card)
//   X4 both phones' result cards for that season read the same lines (the roulette observer's R2 checks the same spins)
//   X5 the server holds one roulette spins record for that season, and each manager's saved spin matches the plan both phones
//      computed (fired, hit player): the turn was recorded once, and not spun again
// In software GL the scene runs in slow motion (a season's roulette takes about 20 minutes): the Transfer War wait gets 45
// minutes (CE2PG_RRR_WAIT_MS), and CE2PG_RRR_STOP=1 checks and stops once the last season with a planned loss reaches it.
// Output: "RRR-LOSE" lines and test-results/<tag>-rrr-context-loss.json. A failed check exits non-zero.
const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");
const isCe2pg = Boolean(process.env.FIRESTORE_EMULATOR_HOST) && /ce2pg-journey\.cjs$/.test(process.argv[1] || "");
const RULES = (process.env.CE2PG_RRR_LOSE || "").split(",").map(v => v.trim()).filter(Boolean).map(v => { const [season, who, beat] = v.split(":"); return {season: Number(season), who, beat}; });
if (isCe2pg && RULES.length) install();

function install() {
  const ROOT = path.resolve(__dirname, "../../..");
  const BEATS = {spin: {turn: 0, tt: 1.5}, aim: {turn: 0, tt: 14.2}, shot: {turn: 1, tt: 15.6}, result: {turn: 1, tt: 19.5}};
  for (const r of RULES) if (!BEATS[r.beat] || !["daniel", "nik"].includes(r.who) || !(r.season >= 1)) { console.error(`RRR-LOSE bad rule ${JSON.stringify(r)}`); process.exit(2); }
  // In every page: the parent keeps a log (messages from the roulette frame, the result card); the roulette frame loses its
  // context at the planned beat.
  const INIT = (arg) => {
    const {rules, beats} = arg;
    if (/\/roulette\//.test(location.pathname) && window.parent !== window) {
      let log = () => {}; try { const p = window.parent; log = e => { try { (p.__rrLose = p.__rrLose || {log: []}).log.push({t: Date.now(), ...e}); } catch (_e) {} }; } catch (_e) {}
      let n = 0; try { const k = "ce2pg.rrScenes"; n = Number(window.parent.sessionStorage.getItem(k) || "0") + 1; window.parent.sessionStorage.setItem(k, String(n)); } catch (_e) {}
      const plan = rules.filter(r => r.n === n);
      log({kind: "scene", n, planned: plan.map(r => r.beat)});
      // Every WebGL context the page makes (js/gfxTier.js reads the GPU name from a small one of its own first): the one lost is
      // the scene's, the context of the canvas on the page.
      const gls = []; const get = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (type, ...rest) { const c = get.call(this, type, ...rest); if (c && /webgl/.test(String(type)) && !gls.includes(c)) gls.push(c); return c; };
      const sceneGl = () => gls.find(c => c.canvas && c.canvas.isConnected && !c.isContextLost()) || null;
      if (!plan.length) return;
      const tick = () => {
        try {
          const rr = window.__rr, s = rr && rr.state;
          for (const r of plan) {
            if (r.fired || !s || !s.playing) continue;
            const b = beats[r.beat]; if (s.turn !== b.turn || !(s.tt >= b.tt)) continue;
            const gl = sceneGl(), ext = gl && gl.getExtension("WEBGL_lose_context"); if (!ext) { r.fired = true; log({kind: "lose-failed", n, beat: r.beat, why: "no WEBGL_lose_context"}); continue; }
            r.fired = true; const freed = rr.freed;
            gl.canvas.addEventListener("webglcontextrestored", () => log({kind: "restored-event", n, beat: r.beat}), {once: true});
            log({kind: "lost", n, beat: r.beat, turn: s.turn, tt: s.tt, freed, canvas: [gl.canvas.width, gl.canvas.height], contexts: gls.length});
            ext.loseContext();
            setTimeout(() => { try { ext.restoreContext(); log({kind: "restored", n, beat: r.beat}); } catch (e) { log({kind: "restore-failed", n, beat: r.beat, why: String(e)}); } }, 1500);
          }
        } catch (_e) {}
        if (plan.some(r => !r.fired)) setTimeout(tick, 40);
      };
      tick();
      return;
    }
    if (window.parent !== window) return;
    const L = window.__rrLose = window.__rrLose || {log: []};
    addEventListener("message", e => { const d = e.data; if (d && typeof d.type === "string" && /^cms-rr-(error|continue|armed|end)$/.test(d.type)) { let from = ""; try { from = e.source && e.source.location && e.source.location.pathname || ""; } catch (_e) {} if (/roulette/.test(from)) L.log.push({t: Date.now(), kind: "msg", type: d.type, message: d.message || ""}); } });
    let last = "";
    setInterval(() => { try { const el = document.getElementById("rrStepPanel"), vis = Boolean(el && el.getClientRects().length && getComputedStyle(el).visibility !== "hidden"), text = vis ? (el.innerText || "").trim() : ""; const key = vis ? text : ""; if (key !== last) { last = key; L.log.push({t: Date.now(), kind: "panel", visible: vis, text}); } } catch (_e) {} }, 100);
  };
  const pw = require("playwright");
  const launch = pw.chromium.launch.bind(pw.chromium);
  const order = [];
  pw.chromium.launch = async (opts = {}, ...rest) => {
    // WebGL on (CE2PG's bundle turns it off): SwANGLE, as @sparticuz/chromium gives it when its graphics mode is on.
    const args = (opts.args || []).filter(a => a !== "--disable-webgl").concat(["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"]);
    const browser = await launch({...opts, args}, ...rest);
    const newContext = browser.newContext.bind(browser);
    browser.newContext = async (...cargs) => {
      const ctx = await newContext(...cargs);
      const who = order.length === 0 ? "daniel" : order.length === 1 ? "nik" : "";
      order.push(ctx); ctx.__rrLoseWho = who;
      await ctx.addInitScript(INIT, {rules: RULES.filter(r => r.who === who).map(r => ({n: r.season, beat: r.beat})), beats: BEATS});
      return ctx;
    };
    return browser;
  };
  // Where each phone is, every 30 s (software GL is slow; a stall shows here): the screen on top and the roulette turn clock.
  const where = () => { const v = document.querySelector("main section:not(.hidden), section.screen:not(.hidden), [id$=Screen]:not(.hidden)"); let rrs = null;
    try { const f = document.querySelector("iframe[src*='roulette']"), s = f && f.contentWindow.__rr && f.contentWindow.__rr.state; rrs = s ? {turn: s.turn, tt: Math.round(s.tt * 10) / 10, playing: s.playing} : (f ? "frame" : null); } catch (_e) { rrs = "?"; }
    const panel = document.getElementById("rrStepPanel"); return {screen: v ? v.id : "", rr: rrs, panel: Boolean(panel && panel.getClientRects().length)}; };
  setInterval(async () => { for (const ctx of order) { const page = ctx.pages()[0]; if (!page) continue; try { console.log(`RRR-WHERE ${ctx.__rrLoseWho} ${JSON.stringify(await page.evaluate(where))}`); } catch (_e) {} } }, 30000).unref();
  // Pull each page's log after every roulette (the same hook the roulette observer uses).
  const rr = require("./roster-roulette.cjs");
  const logs = {daniel: [], nik: []};
  const pull = async page => { try { const who = page.context().__rrLoseWho; if (!who) return; const got = await page.evaluate(() => { const L = window.__rrLose || {log: []}; return L.log.splice(0); }); logs[who].push(...got); } catch (_e) {} };
  const orig = rr.waitForTransfer;
  // In software GL a phone's roulette scene runs in slow motion (about 25 s a scene second with two phones on 4 cores, so a
  // whole season's roulette takes about 20 minutes): the wait for the Transfer War gets 45 minutes (CE2PG_RRR_WAIT_MS).
  const WAIT = Number(process.env.CE2PG_RRR_WAIT_MS) || 2700000;
  // CE2PG_RRR_STOP=1: once the last season with a planned loss has reached its Transfer War, check and stop (a full game in
  // software GL takes hours; the seasons after it prove nothing more here).
  const LAST = Math.max(...RULES.map(r => r.season)); let seasons = 0;
  rr.waitForTransfer = async (page, timeout, ...rest) => { let done = false; try { const out = await orig(page, Math.max(Number(timeout) || 0, WAIT), ...rest); done = true; return out; } finally { for (const p of [].concat(page).filter(Boolean)) await pull(p); await readSpins();
    if (done) { seasons += 1; if (process.env.CE2PG_RRR_STOP === "1" && seasons === LAST) stopSoon(); } } };
  // The spins record is written when Daniel starts that season's Transfer War, just after this wait: the game goes on while
  // the record is read every 2 s (at most 3 minutes), then the run stops.
  const stopSoon = () => { const until = Date.now() + 180000; const seasonOf = f => Number(val(f && f.seasonNumber));
    const poll = async () => { await readSpins(); const have = new Set([...spins.values()].map(seasonOf)); if (RULES.every(r => have.has(r.season)) || Date.now() > until) { console.log(`RRR-LOSE stopping after season ${seasons} (CE2PG_RRR_STOP=1)`); process.exit(0); } setTimeout(poll, 2000); };
    setTimeout(poll, 2000); };
  // X5: the server's roulette spins records, read from the Firestore emulator as its owner (test database only).
  const spins = new Map();// docPath -> fields
  const readSpins = () => new Promise(resolve => {
    const host = process.env.FIRESTORE_EMULATOR_HOST, project = process.env.GCLOUD_PROJECT || process.env.CE2PG_PROJECT || "";
    if (!host || !project) { resolve(); return; }
    const body = JSON.stringify({structuredQuery: {from: [{collectionId: "roulette", allDescendants: true}]}});
    const req = http.request({host: host.split(":")[0], port: Number(host.split(":")[1]), method: "POST", path: `/v1/projects/${project}/databases/(default)/documents:runQuery`, headers: {"content-type": "application/json", authorization: "Bearer owner"}}, res => {
      let buf = ""; res.on("data", c => { buf += c; }); res.on("end", () => { try { for (const row of JSON.parse(buf)) if (row.document) spins.set(row.document.name, row.document.fields); } catch (_e) {} resolve(); });
    });
    req.on("error", () => resolve()); req.end(body);
  });
  const val = v => v == null ? v : "stringValue" in v ? v.stringValue : "integerValue" in v ? Number(v.integerValue) : "booleanValue" in v ? v.booleanValue : "nullValue" in v ? null : "mapValue" in v ? Object.fromEntries(Object.entries(v.mapValue.fields || {}).map(([k, x]) => [k, val(x)])) : "arrayValue" in v ? (v.arrayValue.values || []).map(val) : v;
  process.on("exit", code => {
    const checks = [], problems = [];
    const check = (id, okay, text, detail) => { checks.push({id, ok: Boolean(okay), text, detail}); if (!okay) problems.push(`${id} ${text}${detail ? `: ${JSON.stringify(detail)}` : ""}`); console.log(`RRR-LOSE ${okay ? "ok  " : "FAIL"} ${id} ${text}${detail && !okay ? ` ${JSON.stringify(detail)}` : ""}`); };
    const records = [...spins.entries()].map(([name, f]) => ({name, ...Object.fromEntries(Object.entries(f || {}).map(([k, v]) => [k, val(v)]))}));
    const panelsOf = (who, season) => { const L = logs[who], start = L.findIndex(e => e.kind === "scene" && e.n === season); if (start < 0) return []; const end = L.findIndex((e, i) => i > start && e.kind === "scene"); return L.slice(start, end < 0 ? L.length : end); };
    const resultText = list => { const p = list.filter(e => e.kind === "panel" && e.visible && /lost|empty chamber/i.test(e.text)).pop(); return p ? p.text.split("\n").map(s => s.trim()).filter(s => /lost |empty chamber/i.test(s)).join(" | ") : ""; };
    for (const r of RULES) {
      const tag = `s${r.season}.${r.who}.${r.beat}`, L = panelsOf(r.who, r.season);
      const lost = L.find(e => e.kind === "lost" && e.beat === r.beat), back = L.find(e => e.kind === "restored-event" && e.beat === r.beat);
      check(`X1.${tag}`, lost && back && lost.freed && lost.freed.canvases > 0, `the context was lost at ${r.beat} on a page that let canvases go, and given back`, lost ? {freed: lost.freed, turn: lost.turn, tt: lost.tt, restored: Boolean(back)} : {log: L.slice(0, 6)});
      const after = lost ? L.filter(e => e.kind === "msg" && e.t >= lost.t) : [];
      check(`X2.${tag}`, lost && after.filter(e => e.type === "cms-rr-error").length === 1 && !after.some(e => e.type === "cms-rr-continue"), "exactly one cms-rr-error after the loss, no cms-rr-continue", {after: after.map(e => e.type)});
      const card = back ? L.find(e => e.kind === "panel" && e.visible && e.t >= back.t) : null;
      check(`X3.${tag}`, card && card.t - back.t <= 10000, "the result card showed within 10 s of the context coming back", card ? {ms: card.t - back.t} : {none: true});
      const other = r.who === "daniel" ? "nik" : "daniel", mine = resultText(L), theirs = resultText(panelsOf(other, r.season));
      check(`X4.${tag}`, mine && mine === theirs, "both phones' result cards read the same", {[r.who]: mine, [other]: theirs});
      const forSeason = records.filter(x => Number(x.seasonNumber) === r.season);
      check(`X5.${tag}`, forSeason.length === 1 && forSeason[0].spins && forSeason[0].spins.playerOne && forSeason[0].spins.playerTwo, "the server holds one roulette spins record for that season, with both managers' spins", {records: forSeason.length, spins: forSeason[0] && forSeason[0].spins});
    }
    const out = path.join(ROOT, "test-results", `${process.env.CE2PG_TAG || "ce2pg"}-rrr-context-loss.json`);
    try { fs.mkdirSync(path.dirname(out), {recursive: true}); fs.writeFileSync(out, JSON.stringify({rules: RULES, checks, records, logs}, null, 1)); } catch (_e) {}
    console.log(`RRR-LOSE ${problems.length ? "FAIL" : "PASS"} ${checks.length - problems.length}/${checks.length} checks (${out})`);
    if (problems.length && !code) process.exitCode = 1;
  });
}
