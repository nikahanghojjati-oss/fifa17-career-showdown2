"use strict";
// r91 Chamber Men heavy-parts ladder (Sol 6.1 review of 2.3.0; Nik 2026-11-11 14:33 UTC: "heavy parts like crowd, shadows
// and glow are fixed when the scene loads, so a slow device keeps paying for them"). The scene now offers its heavy parts
// to the shared governor (js/gfxTier.js, detail:{steps,apply}), which walks them only on Auto and only between kicks.
// The scene's own ladder code and the stadium's crowd order run here, cut from the real files, against stand-ins:
//   C1 the ladder holds only parts the level has, smallest loss first, and goes to the governor as its detail ladder
//   C2 step 0 is the scene as built: shadow maps every frame, blades drawn, every fan, the level's own contact patch
//   C3 every step's state; any step from any other lands on the same state as going there directly
//   C4 shadow maps: every second frame at "rate"; once, with no casters, at "cast"; a timed frame always draws them
//   C5 a step in play cross-fades (the governor's before()); never at the start, never twice within one fade
//   C6 no step changes a light or a material (no shader is compiled in play); a kick holds the governor from kick() until
//      4 s after the strike, and the wait for the next kick is between beats
//   C7 the crowd: same fans, the end behind the goal first and always full, the other stands thinned evenly
//   C8 docs/QUALITY_LEVELS.md lists the ladder
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ROOT = path.resolve(__dirname, "../..");
const read = file => fs.readFileSync(path.join(ROOT, file), "utf8");
const results = []; const ok = (id, label) => { results.push(id); console.log(`ok ${results.length} ${id} ${label}`); };
const scene = read("js/chamberMenScene3d.js"), kit = read("js/chamberMenStadium3d.js");
const cut = (src, from, to) => { const a = src.indexOf(from); assert.ok(a >= 0, `found: ${from.slice(0, 50)}`); assert.equal(src.indexOf(from, a + 1), -1, `once: ${from.slice(0, 50)}`);
  const b = src.indexOf(to, a); assert.ok(b > a, `found after it: ${to.slice(0, 50)}`); return src.slice(a, b); };

// The scene's ladder, as written, with the scene around it replaced by counters.
const LADDER_SRC = cut(scene, 'const blades=S.group.getObjectByName("cmBlades")||null;', "// info: what the Device check records beside the frame times");
function mount({level = 0, blades = false, fans = 1000, front = 300} = {}) {
  const env = {now: 10000, fades: 0, paints: 0, shadowDraws: 0, emptyDraws: 0, shares: []};
  const bladesMesh = blades ? {visible: true} : null;
  const S = {group: {getObjectByName: name => name === "cmBlades" ? bladesMesh : null}, crowdCount: fans,
    crowdShare: k => { env.shares.push(k); return front + Math.round((fans - front) * k); }};
  const renderer = {shadowMap: {autoUpdate: true, needsUpdate: false}};
  const make = new Function("S", "L", "renderer", "env", `
    const CONTACT_LIGHT=.62;let contactK=L<=0?CONTACT_LIGHT:.5,castOff=false,plan=null,snapAt=-1e9;
    const clockNow=()=>env.now,dissolveFrom=()=>{env.fades+=1;},fadeFrom=()=>{env.fades+=1;};
    // paint as the scene's: the pace is set, then the renderer draws the maps when three.js would
    const paint=()=>{shadowPace();env.paints+=1;const sm=renderer.shadowMap;if(sm.autoUpdate||sm.needsUpdate){sm.needsUpdate=false;if(castOff)env.emptyDraws+=1;else env.shadowDraws+=1;}};
    ${LADDER_SRC}
    return {heavy,timed,paint,LADDER,state:()=>({at:detailAt,shadowEvery,castOff,contactK,blades:blades?blades.visible:null,crowd:crowdDrawn}),kick:v=>{plan=v?{}:null;}};`);
  return {...make(S, level, renderer, env), env, renderer};
}
const frames = (m, n) => { const a = m.env.shadowDraws, b = m.env.emptyDraws; for (let i = 0; i < n; i += 1) m.paint(); return [m.env.shadowDraws - a, m.env.emptyDraws - b]; };

// C1
{
  assert.deepEqual(mount({level: 0}).LADDER, ["rate", "crowd", "cast"], "Light to High: no grass blades to give up");
  assert.deepEqual(mount({level: 3, blades: true}).LADDER, ["rate", "blades", "crowd", "cast"], "Extra and Ultra: the blades go before the crowd");
  assert.ok(scene.includes('const gov=GFX?GFX.governor(renderer,{key:"chamber-men",draw:timed,beats:true,detail:{steps:LADDER.length,apply:heavy},before:fadeFrom,onChange:'), "the governor gets the ladder, the scene plays in beats");
  assert.ok(scene.includes("await GFX.calibrate(renderer,timed,{frames:6});"), "the warm-up frames are whole frames too");
  // The Device check's record keeps its shape (the check never walks the ladder: js/gfxTier.js, adapts()).
  assert.ok(scene.includes("info:()=>({assets:Q.assets,lite:Boolean(Q.full),crowd:S.crowdCount})}):null;"));
  ok("C1", "the ladder holds only parts the level has and goes to the shared governor");
}
// C2
{
  for (const [level, blades, k] of [[0, false, .62], [1, false, .5], [3, true, .5], [4, true, .5]]) {
    const m = mount({level, blades});
    assert.deepEqual(m.state(), {at: 0, shadowEvery: 1, castOff: false, contactK: k, blades: blades ? true : null, crowd: 1000}, `level ${level} as built`);
    assert.deepEqual(frames(m, 10), [10, 0], "shadow maps every frame");
    assert.equal(m.renderer.shadowMap.autoUpdate, true);
    assert.deepEqual(m.env.shares, [], "the crowd is not touched");
    m.heavy(0, "start"); m.heavy(0, "smooth");
    assert.deepEqual(m.state().at, 0); assert.deepEqual(m.env.shares, [], "asking for the step it is on does nothing");
  }
  ok("C2", "step 0 is the scene as built at every level");
}
// C3
{
  const want = (level, blades) => {
    const base = {shadowEvery: 1, castOff: false, contactK: level <= 0 ? .62 : .5, blades: blades ? true : null, crowd: 1000};
    const rows = [{...base, at: 0}, {...base, at: 1, shadowEvery: 2}];
    if (blades) rows.push({...rows[rows.length - 1], at: rows.length, blades: false});
    rows.push({...rows[rows.length - 1], at: rows.length, crowd: 300 + Math.round(700 * .6)});
    rows.push({...rows[rows.length - 1], at: rows.length, castOff: true, contactK: .62});
    return rows;
  };
  for (const [level, blades] of [[0, false], [2, false], [3, true]]) {
    const rows = want(level, blades), n = rows.length - 1;
    assert.equal(n, mount({level, blades}).LADDER.length);
    for (let from = 0; from <= n; from += 1) for (let to = 0; to <= n; to += 1) {
      const m = mount({level, blades}); m.heavy(from, "start"); m.heavy(to, to < from ? "restore" : "slow");
      assert.deepEqual(m.state(), rows[to], `level ${level}: step ${from} to ${to}`);
    }
    const m = mount({level, blades}); m.heavy(99, "slow"); assert.equal(m.state().at, n, "a step past the end is the last one"); m.heavy(-3, "restore"); assert.equal(m.state().at, 0);
  }
  ok("C3", "every step's state is the same from any other step (the governor may put several back at once)");
}
// C4
{
  const m = mount({level: 2});
  m.heavy(1, "start");
  assert.deepEqual(frames(m, 1), [1, 0], "the first frame after a step draws the maps");
  assert.deepEqual(frames(m, 20), [10, 0], "then every second frame");
  assert.equal(m.renderer.shadowMap.autoUpdate, false);
  { const a = m.env.shadowDraws; for (let i = 0; i < 6; i += 1) m.timed(); assert.equal(m.env.shadowDraws - a, 6, "a timed frame is a whole frame"); }
  m.heavy(3, "slow");
  assert.deepEqual(frames(m, 1), [0, 1], "cast: the maps are drawn once with nothing in them");
  assert.deepEqual(frames(m, 30), [0, 0], "and then not at all");
  { const a = m.env.emptyDraws, b = m.env.shadowDraws; for (let i = 0; i < 4; i += 1) m.timed(); assert.deepEqual([m.env.emptyDraws - a, m.env.shadowDraws - b], [0, 0], "a timed frame at cast pays for no shadow either"); }
  m.heavy(1, "restore");
  assert.deepEqual(frames(m, 1), [1, 0], "back from cast: real shadows in the very next frame");
  m.heavy(0, "smooth");
  assert.deepEqual(frames(m, 8), [8, 0]); assert.equal(m.renderer.shadowMap.autoUpdate, true, "as built again");
  // The shadow pass itself: at cast it is handed an empty scene; nothing else about the lights changes.
  assert.ok(scene.includes("sm.render=(...args)=>{if(castOff){args[1]=NO_CASTERS;return draw(...args);}"));
  assert.ok(scene.includes("const NO_CASTERS=new T.Scene();let castOff=false;"));
  assert.ok(scene.includes("      cameraAt(t,live);\n      shadowPace();\n      renderer.render(scene,camera);"), "the pace is set before every draw of the scene");
  assert.ok(scene.includes("const restored=()=>{if(disposed)return;wrapShadow();shadowNow=true;"), "a restored context draws the maps again");
  ok("C4", "shadow maps: every frame, every second frame, or once and empty; a timed frame always carries its shadows");
}
// C5
{
  // The governor is given the scene's fade as its before(): one call ahead of every change in play, none for the start
  // (tests/contracts/r91-governor-beats-contracts.cjs B10). The ladder itself draws nothing.
  assert.ok(scene.includes("detail:{steps:LADDER.length,apply:heavy},before:fadeFrom,onChange:"));
  const FADE_SRC = cut(scene, "const fadeFrom=()=>{", "\n    };");
  assert.ok(!/carry|plan\b|heavy|detailAt/.test(FADE_SRC), "the fade leaves the camera and the ladder alone");
  const env = {now: 5000, cssW: 800, reduced: false, frozenClock: null, snaps: 0, snapAt: -1e9};
  const fade = new Function("env", `let snapAt=env.snapAt,snap={};const clockNow=()=>env.now,reducedMotion=()=>env.reduced,snapTexture=()=>{},
    renderer={setRenderTarget(){},render(){},copyFramebufferToTexture(){env.snaps+=1;}},scene={},camera={};
    return ()=>{const cssW=env.cssW,frozenClock=env.frozenClock;${FADE_SRC}\n};fadeFrom();return snapAt;};`)(env);
  // each call builds a fresh fadeFrom over the same snapAt
  let last = fade(); assert.deepEqual([env.snaps, last], [1, 5000], "the picture on screen is kept and fades out");
  env.now += 50; last = fade(); assert.equal(env.snaps, 1, "not twice within one fade");
  env.now += 1000; fade(); assert.equal(env.snaps, 2);
  env.now += 1000; env.cssW = 0; fade(); assert.equal(env.snaps, 2, "no size yet: nothing to keep");
  env.cssW = 800; env.reduced = true; env.now += 1000; fade(); assert.equal(env.snaps, 2, "Reduce Motion: no fade");
  const m = mount({level: 3, blades: true}); m.heavy(2, "start"); m.heavy(4, "slow"); m.heavy(0, "restore");
  assert.equal(m.env.fades, 0, "the ladder never snaps the picture itself");
  ok("C5", "a step in play cross-fades like a reset (the governor's before()); the start does not");
}
// C6
{
  const code = LADDER_SRC.replace(/\/\/[^\n]*/g, "");
  for (const word of ["castShadow", ".material", "mapSize", "lights", "scene.add", "scene.remove", "setPixelRatio", "requestAnimationFrame", "performance", "devicePixelRatio"]) {
    assert.ok(!code.includes(word), `the ladder does not touch ${word}`);
  }
  assert.ok(scene.includes("plan.startAt=clockNow()+(still?-SETTLE*1000:RUNUP*1000);frozenAt=null;gov?.hold(true);"), "a kick holds the governor");
  assert.ok(scene.includes("reset(){if(plan&&clockNow()-snapAt>120)dissolveFrom();plan=null;frozenAt=null;ballFree.on=false;gov?.hold(false);},"), "the reset lets go, under its fade");
  // A kick is over for the governor CALM seconds after the strike (2.3.0 held on until the next reset, which left it 0.3 s
  // between kicks: no heavy part could ever come back). The wait for the next kick is between beats.
  assert.ok(/const FLIGHT=\.46,SETTLE=2\.0,GRAVITY=-9\.8;/.test(scene) && /\n  const CALM=4;/.test(scene), "CALM is after the ball has settled (2 s)");
  assert.ok(scene.includes("if(plan&&!plan.calm&&frozenAt===null&&!still&&t>=CALM){plan.calm=true;gov?.hold(false);}"), "the hold ends once, CALM seconds after the strike; never under Reduce Motion or in a frozen proof frame");
  assert.equal((scene.replace(/\/\/[^\n]*/g, "").match(/heavy\(/g) || []).length, 0, "nothing in the scene calls heavy() itself");
  assert.equal((scene.match(/apply:heavy/g) || []).length, 1, "only the governor does");
  ok("C6", "no light or material changes in play; a kick holds the governor until 4 s after the strike");
}
// C7
{
  const seeded = new Function(`${cut(kit, "function stadiumSeeded(seed){", "\n")}\nreturn stadiumSeeded;`)();
  const ORDER_SRC = cut(kit, "const order=[],rest=[];for(let i=0;i<N;i+=1)", "// The vendor build has no InstancedBufferAttribute");
  const SHARE_SRC = cut(kit, "const crowdShare=share=>{", "\n");
  // 9,000 fans in seat order, as the kit lists them: stand 0 (behind the goal), then 1, 2, 3.
  const fans = []; for (const [si, n] of [[0, 2500], [1, 2200], [2, 2300], [3, 2000]]) for (let i = 0; i < n; i += 1) fans.push({si, seat: i});
  const N = fans.length, inst = {count: N};
  const {order, frontN, crowdShare} = new Function("fans", "N", "inst", "stadiumSeeded", `${ORDER_SRC}\n${SHARE_SRC}\nreturn {order,frontN,crowdShare};`)(fans, N, inst, seeded);
  assert.equal(order.length, N); assert.equal(new Set(order).size, N, "every fan once: the same fans as before");
  assert.equal(frontN, 2500); assert.ok(order.slice(0, frontN).every((i, k) => i === k), "the end behind the goal first, in its own order");
  assert.equal(crowdShare(1), N); assert.equal(inst.count, N);
  const n60 = crowdShare(.6); assert.equal(n60, 2500 + Math.round(6500 * .6)); assert.equal(inst.count, n60);
  const kept = order.slice(0, n60).map(i => fans[i]);
  assert.equal(kept.filter(f => f.si === 0).length, 2500, "the end behind the goal stays full");
  for (const [si, n] of [[1, 2200], [2, 2300], [3, 2000]]) {
    const share = kept.filter(f => f.si === si).length / n; assert.ok(share > .56 && share < .64, `stand ${si} keeps about 60% (${share.toFixed(3)})`);
    // even along the stand too: each tenth of its seats keeps about the same share
    for (let d = 0; d < 10; d += 1) { const part = kept.filter(f => f.si === si && Math.floor(f.seat * 10 / n) === d).length / (n / 10); assert.ok(part > .45 && part < .75, `stand ${si} tenth ${d} (${part.toFixed(2)})`); }
  }
  assert.equal(crowdShare(0), 2500); assert.equal(crowdShare(7), N); assert.equal(crowdShare(NaN), N);
  // Same order on every device and every load.
  const again = new Function("fans", "N", "inst", "stadiumSeeded", `${ORDER_SRC}\nreturn order;`)(fans, N, {count: N}, seeded);
  assert.deepEqual(again, order);
  assert.ok(kit.includes("for(let at=0;at<N;at+=1){const i=order[at],f=fans[i];"), "the cards are written in that order");
  assert.ok(kit.includes("crowd:inst,crowdCount:N,crowdShare,flares,"), "the kit hands the share control to the scene");
  assert.ok(!/Math\.random/.test(kit.replace(/\/\/[^\n]*/g, "")));
  ok("C7", "the crowd thins evenly in the side and far stands; the end behind the goal stays full");
}
// C8
{
  const docs = read("docs/QUALITY_LEVELS.md");
  assert.match(docs, /Chamber Men[\s\S]{0,80}shadow maps every second frame[\s\S]{0,120}grass blades[\s\S]{0,120}side\s+and far stands at 60%[\s\S]{0,120}no real shadows/);
  ok("C8", "docs/QUALITY_LEVELS.md lists Chamber Men's ladder");
}
console.log(`PASS r91 chamber ladder contracts (${results.length} checks)`);
