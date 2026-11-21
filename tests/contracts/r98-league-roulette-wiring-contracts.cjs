"use strict";

// R98-01 PR 2 (League Roulette on the live Select League screen, Nik 2026-11-20 option A).
//   1. the board's plan: deterministic from the shared seed and league, the league it keeps is always the shared draw,
//      the balls alternate Daniel, Nik, Daniel, Nik and each removes one other league;
//   2. the board and its step never touch Firestore (the ledger is the presentation's, through the shared setup wrapper);
//   3. the presentation: open asks for the roulette, ball 1 is commit-league, balls 2-4 are drop(ball) by the manager whose
//      ball it is, the clubs wait for the fourth ball, the board is seeded from the shared Showdown, and a Setup opened
//      before the roulette keeps its plain league;
//   4. the wrapper: drop() sends the ledger this phone holds (no read first) and keeps the higher count;
//   5. Reus Gate (js/v10Setup.js holds Select League while the armed board is not drawn), the quality key, the shell.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.join(__dirname, "..", "..");
const read = file => fs.readFileSync(path.join(ROOT, file), "utf8");
const Scene = require("../../js/leagueRouletteScene3d.js");
const Setup = require("../../js/sharedShowdownSetup.js");
let checks = 0;
function ok(label) { checks += 1; process.stdout.write(`ok ${checks} ${label}\n`); }

// ---- 1. The plan ---------------------------------------------------------------------------------------------------
{
  assert.deepEqual([...Scene.wheel].sort(), ["bundesliga", "laliga", "ligue_1", "premier_league", "serie_a"]);
  assert.equal(Scene.drops, 4);
  const byRole = {daniel: "playerOne", nik: "playerTwo"};
  for (let i = 0; i < 200; i += 1) {
    const seed = `sha256:${i.toString(16).padStart(64, "0")}|op_${i}`;
    for (const winner of Scene.wheel) {
      const plan = Scene.plan(seed, winner);
      assert.deepEqual(plan, Scene.plan(seed, winner), "both phones build the same board from the same seed");
      assert.equal(plan.winner, winner);
      assert.deepEqual(plan.drops.map(d => d.by), ["daniel", "nik", "daniel", "nik"]);
      // the board's order is the protocol's turn order with Daniel as the coordinator
      assert.deepEqual(plan.drops.map((d, k) => byRole[d.by]), [1, 2, 3, 4].map(ball => Setup.rouletteDropRole("playerOne", ball)));
      assert.deepEqual([...new Set(plan.drops.map(d => d.league))].sort(), Scene.wheel.filter(id => id !== winner).sort(), "each ball removes one other league");
      assert.ok(plan.after.every(id => id === winner), "the board ends one league: the shared draw");
      for (const d of plan.drops) assert.equal(d.before[d.pocket], d.league, "a ball rests in a pocket of the league it removes");
    }
  }
  assert.throws(() => Scene.plan("x", "eredivisie"), /LEAGUE_ROULETTE_WINNER_INVALID/);
  ok("plan: 1,000 seeds x 5 leagues, deterministic, Daniel/Nik/Daniel/Nik (the protocol's turn order), ends on the shared league");
}

// ---- 2. No Firestore in the board or its step ------------------------------------------------------------------------
{
  for (const file of ["js/leagueRouletteScene3d.js", "js/leagueRouletteStep.js"]) {
    const src = read(file).replace(/\/\/.*$/gm, "");
    assert.doesNotMatch(src, /firestore|firebase|getDoc|updateDoc|onSnapshot|runTransaction|setDoc/i, `${file} never touches Firestore`);
    assert.doesNotMatch(src, /localStorage|sessionStorage|indexedDB/, `${file} keeps nothing on the device`);
  }
  ok("board and step: no Firestore read, write or listener, no device storage");
}

// ---- 3. The presentation -----------------------------------------------------------------------------------------------
{
  const P = read("js/productionSharedShowdownPresentation.js");
  assert.ok(P.includes(`ssjpMutate("open",roulette?{draw:3,roulette:true}:{draw:3})`), "Daniel's phone opens a roulette Setup when the board is armed");
  assert.ok(P.includes(`if(setup.phase==="LEAGUE_WHEEL_COMMITTED"){if(ssjpRouletteLedger()&&state.setupDrops<4)return false;`), "the clubs are drawn only after the fourth ball");
  assert.ok(P.includes(`const ball=state.setupDrops+1;if(ssjpBallRole(ball)!==state.managerRole)return "stale";`), "only the manager whose ball it is drops it");
  assert.ok(P.includes(`if(!rouletteStep.caughtUp())return "done";`), "a ball drops only once the one before it has rested on this phone");
  assert.ok(P.includes("function ssjpBallRole(ball){const coordinator=state?.setup?.coordinatorRole;return ball%2===1?coordinator:(coordinator===\"playerOne\"?\"playerTwo\":\"playerOne\");}"));
  for (const coordinator of ["playerOne", "playerTwo"]) for (const ball of [1, 2, 3, 4]) {
    const mine = ball % 2 === 1 ? coordinator : (coordinator === "playerOne" ? "playerTwo" : "playerOne");
    assert.equal(mine, Setup.rouletteDropRole(coordinator, ball), "the screen's turn is the protocol's");
  }
  assert.ok(P.includes("receipt=setup&&Array.isArray(setup.receipts)?setup.receipts[0]:null;return `${setup&&setup.bindingHash||\"\"}|${receipt&&receipt.operationHash||\"\"}`"), "the board's seed is the shared Showdown's (binding + open receipt)");
  assert.ok(P.includes("instant:!ssjpRouletteLedger()"), "a Setup opened before the roulette shows its league at once");
  assert.ok(/\|\$\{Number\.isInteger\(state\.setupDrops\)\?state\.setupDrops:""\}`/.test(P), "a ball changes the tap-failure signature");
  assert.ok(P.includes("try{const step=await ssjpEnsureRouletteStep();if(step)step.arm(true);}catch(_error){}ssjpForceScreen(\"leagueWheelScreen\");"), "the board is armed before Select League shows");
  assert.ok(P.includes("if(rouletteStep)rouletteStep.arm(false);"), "leaving the shared journey frees the board");
  // the league is named, and the screen moves on, only once all four balls have joined the board on this phone
  const render = P.slice(P.indexOf("function ssjpRenderRoulette("), P.indexOf("async function ssjpDrop("));
  assert.ok(render.indexOf("if(!step.caughtUp())") < render.indexOf("if(drops<4)") && render.indexOf("if(drops<4)") < render.indexOf("ssjpLater(ssjpAutoForwardToClubs,LEAGUE_REVEAL_HOLD_MS)"));
  assert.doesNotMatch(render, /ssjpMutate\(/, "rendering never writes");
  ok("presentation: roulette open, ball 1 = commit-league, balls 2-4 by their owner after the last rested, clubs after ball 4, shared seed");
}

// ---- 4. The wrapper -----------------------------------------------------------------------------------------------------
{
  const W = read("js/productionSharedShowdownSetup.js");
  const drop = W.slice(W.indexOf("function drop(ball){"), W.indexOf("function assertShellSave("));
  assert.ok(drop.length > 0);
  assert.doesNotMatch(drop, /adapter\.read\(/, "a ball sends the ledger this phone holds; it never reads first");
  assert.ok(drop.includes("known=state.setup&&Number.isInteger(state.setupDrops)?{drops:state.setupDrops,revision:state.revision,coordinatorRole:state.setup.coordinatorRole}:null"));
  assert.ok(drop.includes("const drops=Math.max(Number.isInteger(state.setupDrops)?state.setupDrops:0,result.drops);"), "the count never goes back");
  assert.ok(drop.includes("if(dropInFlight)return dropInFlight;"), "a double tap drops once");
  assert.ok(W.includes("setupDrops:heldDrops(result),"), "every read and step carries the count");
  assert.ok(W.includes("return Math.max(next,state.setupDrops);"), "a read that started before this phone's ball never takes the count back down");
  assert.ok(drop.includes("setupGeneration+=1;"), "a read already on its way when a ball drops is not adopted");
  assert.ok(read("js/productionSharedShowdownPresentation.js").includes(`return dropped==="replayed"?"stale":dropped?"done":"failed";`), "a ball already dropped makes the tap re-read and drop the real next ball");
  assert.match(W, /refresh,mutate,drop,openPanel,/);
  ok("wrapper: drop() is one write on the held ledger (no read), double tap safe, the count only grows");
}

// ---- 5. Reus Gate, quality key, shell -----------------------------------------------------------------------------------
{
  const V = read("js/v10Setup.js");
  assert.ok(V.includes(`if(id==="leagueWheelScreen"&&screens.HOLD){const step=root.CareerModeLeagueRouletteStep;if(step&&step.holding()){void step.ensure();return screens.HOLD;}}`), "Select League waits behind the loading screen for the board");
  const Step = read("js/leagueRouletteStep.js");
  assert.ok(Step.includes("function lrsHolding(){return armed&&!failed&&!lrsAlive();}"), "it holds only while armed, not failed and not drawn");
  assert.ok(Step.includes("if(!made){failed=true;"), "where 3D cannot run the screen opens on the plain wheel");
  assert.ok(Step.includes("await synced;"), "the board mounts on the ledger, so a ball dropped earlier never rolls again");
  assert.ok(read("js/leagueRouletteScene3d.js").includes(`const GFX_KEY="league";`));
  assert.match(read("js/gfxTier.js"), /\[\/\^league\(-roulette\)\?\$\/,"league"\]/, "the board has its own quality key, first in the list");
  const sw = read("service-worker.js");
  for (const file of ["js/leagueRouletteStep.js", "js/leagueRouletteScene3d.js"]) {
    assert.ok(sw.includes(`  "${file}",\n`), `${file} is in the shell`);
    assert.ok(sw.includes(`"${file}"`) && /SHELL_PATHS_ADDED_SINCE_PREVIOUS = new Set\(\[[^\]]*"js\/leagueRouletteStep\.js"/.test(sw));
  }
  const B = read("js/leagueRouletteScene3d.js");
  assert.ok(B.includes("const W_WHEEL=reduced?0:1.25;"), "Reduce Motion: the wheel stands still");
  assert.ok(B.includes("const HOLD=reduced?.6:.7,MERGE=reduced?0:1.5,LIFT=reduced?0:.45;"), "Reduce Motion: sections join and the ball goes at once");
  ok("Reus Gate hold, own quality key, both files in the shell and named as added, Reduce Motion still");
}

// ---- 6. The step under a screen that syncs on every event (Codex P1 on #1563) -------------------------------------------
// The presentation answers every board event by rendering, and rendering syncs the board again. A sync with nothing new
// must not start a run or tell "settled", or the two feed each other forever and the screen never gets a turn.
async function stepLoopCheck() {
  const saved = {document: globalThis.document, R: globalThis.CareerModeLeagueRoulette3d, S: globalThis.CareerModeLeagueRouletteStep};
  const el = () => ({classList: {toggle() {}, add() {}, contains: () => false}, appendChild(child) { child.parentNode = this; }, setAttribute() {}, remove() {}});
  const wheel = el(), screen = el();
  globalThis.document = {getElementById: id => id === "leagueWheel" ? wheel : id === "leagueWheelScreen" ? screen : null,
    createElement: () => el(), head: el()};
  const scene = {alive: true, stage: 0, busy: false, plan: null, setPlan() { return true; }, showStage(k) { this.stage = k; },
    async drop(i) { this.busy = true; await new Promise(r => setImmediate(r)); this.busy = false; this.stage = i + 1; }, on() {}, dispose() { this.alive = false; }};
  globalThis.CareerModeLeagueRoulette3d = {mount: async () => scene};
  const file = require.resolve("../../js/leagueRouletteStep.js");
  delete require.cache[file];
  const step = require(file);
  try {
    let events = 0, settled = 0, rolled = 0;
    let ledger = {seed: "a|b", winner: null, drops: 0};
    step.on(type => { events += 1; if (type === "settled") settled += 1; if (type === "rolling") rolled += 1; if (events < 500) step.sync(ledger); });
    step.arm(true);
    step.sync(ledger);
    assert.ok(await step.ensure(), "the board mounts");
    for (let i = 0; i < 20; i += 1) await new Promise(r => setImmediate(r));
    assert.ok(events <= 2, `no ball and no league: the board stays quiet (${events} events)`);
    ledger = {seed: "a|b", winner: "laliga", drops: 0};
    step.sync(ledger);
    for (let i = 0; i < 20; i += 1) await new Promise(r => setImmediate(r));
    assert.ok(events <= 2 && settled === 0, `the league is known but no ball dropped: nothing to show (${events} events)`);
    ledger = {seed: "a|b", winner: "laliga", drops: 2};
    step.sync(ledger);
    for (let i = 0; i < 60 && !step.caughtUp(); i += 1) await new Promise(r => setImmediate(r));
    for (let i = 0; i < 20; i += 1) await new Promise(r => setImmediate(r));
    assert.equal(step.stage(), 2);
    assert.equal(rolled, 2, "each ball rolls once, however often the screen syncs");
    assert.equal(settled, 1, "one run, one settled");
    assert.ok(events < 10, `bounded (${events} events)`);
  } finally {
    step.arm(false);
    delete require.cache[file];
    globalThis.document = saved.document; globalThis.CareerModeLeagueRoulette3d = saved.R; globalThis.CareerModeLeagueRouletteStep = saved.S;
    if (saved.document === undefined) delete globalThis.document;
  }
  ok("step: a screen that syncs on every event gets no loop; each ball rolls once and settles once");
}

stepLoopCheck().then(() => {
  process.stdout.write(`R98-01 League Roulette wiring contracts passed: ${checks} checks.\n`);
}).catch(error => { console.error(error); process.exit(1); });
