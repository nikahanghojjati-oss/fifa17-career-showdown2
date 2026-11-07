"use strict";
// r89 Chamber Men in real 3D (Nik 2026-11-03: "Chamber men needs most important"; "fully 3D and immersive without breaking
// the game ... the keeper like a real keeper ... the net good ... mobile, black gold style").
//   C3D1 files: js/chamberMenScene3d.js is shell-cached; it loads the one vendored three.js build by its plain path (served
//        from the shell without ?v, the same copy the roulette page uses); every THREE part it uses is in that build.
//   C3D2 never breaks the game: no WebGL2, the kill switch (CMS_CHAMBER_MEN_3D="off"), a load fault or a slow load all leave
//        the SVG goal playing; a scene that comes late is thrown away, never swapped in on screen.
//   C3D3 the step stays the owner: it still draws the SVG goal (poses, classes, ball, zone words) and tells the scene to
//        reset and kick next to its own drawing, with the same shot, dive, goal and animate it draws.
//   C3D4 Reus Gate: the stage shows only once the goal is drawn (the 3D first frame, or the SVG when the scene cannot come).
//   C3D5 screen rules: no dimming or scrim, the canvas never takes a tap, nothing invented (no Math.random), reduced motion
//        shows the end of a kick without the flight, and the scene frees its WebGL context when the stage goes.
//   C3D6 broadcast (Nik 2026-11-04, FIFA 17 penalty): with the stadium and the rigged players it plays from behind the taker;
//        the taker wears the kicking manager's assigned club kit and the keeper his rival club's keeper kit (js/kits17.js,
//        "remy" layout, never clashing); the step passes both clubs and names who is on the pitch for every kick; the result
//        words wait for the run-up and the flight, and a kick's reveal (KICK_MS) holds the run-up, the flight and the result.
//        Without the stadium or players in time the hall scene plays (still no network address, nothing random).
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const ROOT=path.resolve(__dirname,"../..");
const read=file=>fs.readFileSync(path.join(ROOT,file),"utf8");
const results=[];const ok=(id,label)=>{results.push(id);console.log(`ok ${results.length} ${id} ${label}`);};
const scene=read("js/chamberMenScene3d.js"),step=read("js/chamberMenStep.js"),css=read("css/chamberMen.css"),sw=read("service-worker.js");
const ENGINE="visual-assets/v10_1/roulette/vendor/three-r187.min.js";

// C3D1
{
  const list=name=>{const at=sw.indexOf(name);return sw.slice(at,sw.indexOf("]);",at));};
  assert.ok(list("const SHELL_PATHS = Object.freeze([").includes('"js/chamberMenScene3d.js"'),"the scene is precached");
  assert.ok(list("const SHELL_PATHS_ADDED_SINCE_PREVIOUS").includes('"js/chamberMenScene3d.js"'),"the scene is new since the last release");
  assert.ok(list("const UNVERSIONED_SHELL_ASSET_PATHS").includes(`"${ENGINE}"`),"the engine is served from the shell without ?v");
  assert.ok(scene.includes(`const ENGINE_PATH="${ENGINE}";`),"the scene loads the one vendored build");
  assert.ok(!/ENGINE_PATH\s*\+|\?v=/.test(scene),"by its plain path (no ?v, so the shell copy answers offline)");
  // r90 (Nik 2026-11-07, cut the waste): one look only; the gold hall and the roulette's lounge light it loaded are gone.
  assert.ok(!/ENV_LOUNGE|EXRLoader|r78-marble-tile|CMS_CHAMBER_MEN_BROADCAST/.test(scene),"no lounge light, no marble hall, no second look");
  assert.ok(!/https?:\/\//.test(scene.replace(/\/\/[^\n]*/g,"")),"no CDN, no network address in code");
  const sandbox={window:{},self:{}};sandbox.globalThis=sandbox;vm.createContext(sandbox);
  vm.runInContext(read(ENGINE),sandbox);
  const T=sandbox.THREE||sandbox.window.THREE;
  const used=[...new Set([...scene.matchAll(/\bT\.([A-Za-z0-9_]+)/g)].map(m=>m[1]))];
  const missing=used.filter(name=>!(name in T));
  assert.deepEqual(missing,[],"every THREE part the scene uses is in the vendored build (add it to tools/three-vendor/entry.mjs)");
  ok("C3D1","shell-cached scene on the one vendored engine, every part it uses is in the build");
}
// C3D2
async function c3d2(){
  // No WebGL2 (and the kill switch): mount gives null, the step keeps the SVG goal.
  const make=extra=>{const root={console:{warn(){}},document:{createElement:()=>({getContext:()=>null})},...extra};root.globalThis=root;vm.createContext(root);vm.runInContext(scene,root);return root;};
  const svg={parentNode:{},isConnected:true};
  assert.equal(await make({}).CareerModeChamberMen3d.mount(svg),null,"no WebGL2: null");
  assert.equal(await make({WebGL2RenderingContext:function(){},CMS_CHAMBER_MEN_3D:"off"}).CareerModeChamberMen3d.mount(svg),null,"kill switch: null");
  assert.equal(await make({WebGL2RenderingContext:function(){}}).CareerModeChamberMen3d.mount(svg),null,"no WebGL2 context: null");
  assert.match(step,/function cmsScene\(goal\)\{\s*if\(root\.CMS_CHAMBER_MEN_3D==="off"\)return Promise\.resolve\(null\);/,"the step honours the kill switch too");
  assert.match(step,/return Promise\.race\(\[made,dropped,cmsWait\(SCENE_WAIT_MS\)\.then\(\(\)=>\{late=true;return null;\}\)\]\);/,"a slow scene does not hold the screen");
  assert.match(step,/if\(late\)\{try\{scene\.dispose\(\);\}catch\(_error\)\{\}return null;\}/,"a late scene is thrown away, never swapped in");
  assert.match(step,/\.then\(scene=>\{[\s\S]*?\},\(\)=>null\);/,"a load fault leaves the SVG goal");
  assert.match(scene,/catch\(error\)\{[\s\S]*?return null;\s*\}/,"a fault while building the scene leaves the SVG goal");
  ok("C3D2","no WebGL2, kill switch, fault or slow load: the SVG goal plays; a late scene is never swapped in");
}
// C3D3
{
  assert.match(step,/goal\.keeper\.dataset\.pose="ready";goal\.scene\?\.reset\(\);/,"reset with the step's own reset");
  assert.match(step,/g\.keeper\.dataset\.pose=dive;[\s\S]*?const k3=\{shot:shot===engine\.timeout\?null:shot,dive,goal:Boolean\(kick\.goal\),round:kick\.kick\};g\.state=\{\.\.\.g\.state,kick:k3\};\s*g\.scene\?\.kick\(\{\.\.\.k3,animate:animate&&sceneAtStart\}\);/,"kick with what the step draws (a scene mounted since shows the end pose)");
  for(const hook of ['class:"cmGoal"','cmsSvg("g",{class:"cmKeeper","data-pose":"ready"})','cmsSvg("g",{class:"cmBall"})'])assert.ok(step.includes(hook),`the SVG goal keeps ${hook}`);
  // r90 (Nik 2026-11-07): no yellow LEFT / MIDDLE / RIGHT words over the goal; the choice buttons still name the sides.
  assert.ok(!/cmZone/.test(step)&&!/cmZone/.test(scene),"no zone words drawn over the goal");
  assert.match(step,/const b=cmsEl\("button","cmChoice",SIDE_WORD\[side\]\);/,"the choice buttons keep LEFT / MIDDLE / RIGHT");
  assert.match(step,/pitch\.append\(board,goal\.box\);/,"same place in the screen (the pitch column, Fable F17-07)");
  ok("C3D3","the step stays the owner: SVG hooks unchanged, the scene follows reset and kick");
}
// C3D4
{
  assert.match(step,/const ui=cmsBuild\(ctx\),sceneReady=cmsScene\(ui\.goal\);let sceneShown=false;/,"the scene starts with the screen, under the loading screen");
  assert.match(step,/if\(!stageShown&&!sceneShown\)\{sceneShown=true;sceneReady\.then\(showStage\);\}/,"the stage shows once the goal is drawn");
  assert.match(step,/const showStage=\(\)=>\{if\(stageShown\|\|finished\)return;stageShown=true;ui\.stage\.style\.visibility="visible";cmsLoadingOff\(\);/,"one way to show the stage");
  assert.match(step,/if\(clock&&!stageShown\)\{ui\.goal\.dropScene\?\.\(\);showStage\(\);\}/,"Codex C2: a running pick clock never waits on the scene");
  assert.match(scene,/svg\.classList\.add\("cm3d-on"\);\s*fit\(\);cameraAt\(0,0\);renderer\.compile\(scene,camera\);paint\(\);/,"mount resolves after the first frame is drawn");
  ok("C3D4","Reus Gate: the stage shows with the goal already drawn");
}
// C3D5
{
  const block=css.slice(css.indexOf("r89 the 3D goal"));
  assert.ok(block.length>40,"the 3D goal rules are in css/chamberMen.css");
  assert.ok(!/opacity|rgba|hsla|brightness|backdrop/.test(block),"no dimming, no scrim");
  assert.match(block,/\.cmGoal3d \{[^}]*pointer-events: none;/,"the canvas never takes a tap");
  assert.ok(!/Math\.random/.test(scene),"nothing invented");
  assert.match(scene,/const still=!k\.animate\|\|reducedMotion\(\);/,"reduced motion: the end of the kick, no flight");
  assert.match(scene,/if\(!canvas\.isConnected\|\|!svg\.isConnected\)\{free\(\);return;\}/,"stops drawing when the stage goes");
  assert.match(scene,/renderer\.dispose\(\);try\{renderer\.forceContextLoss\(\);\}catch\(_error\)\{\}/,"frees its WebGL context for the roulette");
  ok("C3D5","no dimming, no taps on the canvas, nothing invented, reduced motion, context freed");
}
// C3D6
{
  const pstc=read("js/productionSharedTransferChallenge.js");
  assert.ok(pstc.includes('confirmedAtMs,clubs:{playerOne:pstcClubName("playerOne"),playerTwo:pstcClubName("playerTwo")}};'),"Chamber Men gets both assigned clubs");
  assert.match(step,/goal\.clubs=ctx\.clubs\|\|null;/,"the goal keeps the clubs");
  assert.match(step,/mount\(goal\.svg,\{clubs:goal\.clubs\}\)/,"the scene mounts with the clubs");
  assert.match(step,/goal\.scene\.lineup\(\{taker:c\[shooter\],keeper:c\[cmsOther\(shooter\)\],round\}\);/,"the shooter's club takes the kick, the rival's keeps");
  assert.match(step,/cmsReset\(ui\.goal\);cmsLineup\(ui\.goal,kick\.shooter,n\);/,"every new kick names its taker and keeper");
  assert.match(step,/cmsReset\(g\);cmsLineup\(g,kick\.shooter,kick\.kick\);/,"and so does every reveal");
  assert.match(step,/const wait=animate&&g\.scene\?\.runUpMs\?320\+g\.scene\.runUpMs\+520:0;/,"the result waits for the run-up and the flight");
  const runup=Number(/const RUNUP=([0-9.]+),/.exec(scene)[1])*1000,kickMs=Number(/KICK_MS=(\d+)/.exec(step)[1]);
  assert.ok(kickMs>=320+runup+520+1200,`a reveal holds the run-up, flight and at least 1.2 s of result (${kickMs} ms)`);
  assert.match(scene,/K\.textures\(club,\{layout:a\.body,role,vsClub:vs,size:kitSize\}\)/,"kits17 paints the kit on each body's own layout");
  assert.match(scene,/dress\(taker,next\.taker,"outfield",next\.keeper\);dress\(keeper,next\.keeper,"gk",next\.taker\);/,"taker in his club kit, keeper in his club's keeper kit against it");
  assert.match(scene,/if\(!extras\)return null;/,"no stadium or players in time: the SVG goal");
  assert.ok(scene.includes('const PLAYER_PATH="visual-assets/v10_1/chamber-men/players/";'),"players from the repo");
  ok("C3D6","broadcast penalty: taker in his manager's club kit, keeper never clashing, words after the ball, SVG fallback");
}
// C3D7
{
  const fs=require("fs"),path=require("path");
  const bodies=JSON.parse(/const BODIES=(\[[^\]]*\])/.exec(scene)[1]);
  assert.deepStrictEqual(bodies,["remy","ch38","ch42"],"three bodies");
  for(const b of bodies)for(const t of ["desktop","phone"])assert.ok(fs.existsSync(path.join(__dirname,"../../visual-assets/v10_1/chamber-men/players",`body_${b}_${t}.glb`)),`body_${b}_${t}.glb is in the repo`);
  for(const t of ["desktop","phone"])assert.ok(fs.existsSync(path.join(__dirname,"../../visual-assets/v10_1/chamber-men/players",`anims_${t}.glb`)),`anims_${t}.glb is in the repo`);
  assert.match(scene,/const ok=K&&Array\.isArray\(K\.layouts\)\?K\.layouts:\["remy"\];const list=BODIES\.filter\(b=>ok\.includes\(b\)\)/,"a body plays only when kits17 can dress it");
  assert.match(scene,/function cm3BodyOf\(club,list\)\{return list\[cm3Hash\(`body\|\$\{club\|\|""\}`\)%list\.length\];\}/,"one body per club, from its name");
  assert.ok(!/Math\.random/.test(scene),"nothing random in the scene");
  // Only the approved natural skin and hair pairs (players thread, Nik 2026-11-04): Remy's darkest skin is out.
  assert.ok(!scene.includes("[.38,.27,.21]"),"no unapproved skin tone");
  assert.match(scene,/const pairs=BODY_LOOKS\[a\.body\]\|\|BODY_LOOKS\.remy,\[sk,hr\]=pairs\[cm3Hash\(`\$\{club\}\|\$\{role\}`\)%pairs\.length\];/,"skin and hair as a pair, per body");
  assert.match(scene,/const k=c\.clone\(\);for\(const t of k\.tracks\)if\(t\.name\.endsWith\("\.position"\)\)/,"clips retargeted by the body's hips scale");
  assert.match(scene,/if\(t\.shirt===t\.shorts\)\{Promise\.resolve\(t\.ready\)\.then\(\(\)=>\{if\(!disposed&&a\.kitToken===token\)put\(\);\}/,"a body-mapped kit goes on only once painted, never blank");
  assert.match(scene,/let tex=made\.get\(c\);/,"one texture per kit canvas (shared atlas uploads once)");
  ok("C3D7","several bodies: shared clips, one body per club, only natural skin and hair pairs, only bodies kits17 can dress");
}
// C3D8 Reduce Motion (Codex on #1254 at 9bd35452): the broadcast scene's clocks stand still, the kick shows its settled
// end, the net never bulges and lineup changes cut instead of dissolving. (Browser proof on the PR: probe() identical
// 900 ms apart, idle and after a kick, with reducedMotion "reduce"; moving with "no-preference".)
{
  assert.ok(scene.includes("const still=frozenClock===null&&reducedMotion();"),"one Reduce Motion switch in paint");
  assert.ok(scene.includes("live=still?0:(now-t0)/1000;"),"idle poses hold");
  assert.ok(scene.includes("plan?(still?SETTLE:(now-plan.startAt)/1000):0;"),"a kick shows its settled end");
  assert.ok(scene.includes("const stadiumT=still?0:")&&scene.includes("S.update(stadiumT,still?.2:excitement(t));"),"the crowd stands still");
  assert.ok(scene.includes("if(!still&&plan&&plan.after.kind===\"net\""),"no net bulge");
  assert.ok(scene.includes("const fade=still?0:")&&scene.includes("if(!cssW||(frozenClock===null&&reducedMotion()))return;"),"no dissolve");
  assert.ok(read("js/chamberMenStadium3d.js").includes("if(net.t0<0||e<0||e>2.5){"),"a clock before the hit keeps the net flat");
  ok("C3D8","Reduce Motion: players, crowd, net, camera and dissolve stand still; lineup and result still change");
}
// C3D9 r90 W4 (Nik 2026-11-07, "FC quality, light on every device"): the scene takes its quality from js/gfxTier.js
// (pixel ratio, shadows, crowd density, grass size), the governor never changes level during a kick, run-ups vary per
// taker and round (six styles, one stutter), shots curl, and some goals go in off the post or the bar. Nothing invented:
// every choice comes from the hash of the lineup and the kick; the woodwork only ever appears on a goal.
{
  assert.ok(scene.includes('const GFX_JS="js/gfxTier.js";'),"the quality module is loaded by its plain path");
  assert.ok(scene.includes("setPixelRatio(Q.pixelRatio)"),"the pixel ratio comes from the device profile");
  assert.ok(scene.includes('gov=GFX?GFX.governor(renderer,{key:"chamber-men",draw:paint,'),"one governor per scene");
  assert.ok(scene.includes("RUNUP*1000);frozenAt=null;gov?.hold(true);")&&scene.includes("ballFree.on=false;gov?.hold(false);},"),"no level change during a kick");
  assert.ok(/const GFX_FALLBACK=\{level:1,name:"medium",pixelRatio:1,/.test(scene),"a light fallback when the module cannot load");
  const runups=/const RUNUPS=(\[.*?\]);\n/.exec(scene);assert.ok(runups,"run-up table");
  assert.strictEqual((runups[1].match(/\{jog:/g)||[]).length,6,"six run-up styles");
  assert.ok(runups[1].includes("stutter:"),"one stutter run-up");
  assert.ok(scene.includes("const styleOf=(takerClub,round)=>cm3Hash(`run|${takerClub||\"\"}|${round||1}`)%RUNUPS.length;"),"the run-up comes from the taker and the round");
  assert.ok(/luck=cm3Hash\(`ball\|\$\{lineup\.taker\}\|\$\{round\}\|\$\{k\.shot\}\|\$\{k\.dive\}\|\$\{k\.goal\}`\)/.test(scene)||scene.includes("luck=cm3Hash(`ball|"),"ball luck from the kick, never random");
  const wood=scene.indexOf("luck%4===0"),save=scene.indexOf("}else{",wood),goalAt=scene.lastIndexOf("if(k.goal",wood);
  assert.ok(wood>0&&goalAt>0&&save>wood&&scene.slice(goalAt,wood).indexOf("}else{")<0,"woodwork only inside the goal branch");
  assert.ok(scene.includes("luck%3===0){target=v3(s[0],BAR_Y-"),"high middle goals can come down off the bar");
  assert.ok(scene.includes("const netAt=FLIGHT+(plan&&plan.after.wood?.16:.07);"),"the net bulges after the wood");
  // Codex on #1263: the hash is unsigned, so its bits are read with >>> (a signed shift went negative: a post shot under the
  // pitch, a curl the wrong way). Every post height and curl from the hash stays in range for any lineup and kick.
  assert.ok(!/luck>>[0-9]/.test(scene)&&scene.includes("(luck>>>3)%9")&&scene.includes("(luck>>>4)%7"),"unsigned shifts on the kick hash");
  {const h=s=>{let v=2166136261;for(const ch of s)v=Math.imul(v^ch.charCodeAt(0),16777619)>>>0;return v;};
   for(const club of ["Arsenal","Barcelona","Chelsea","Real Madrid","Juventus"])for(let round=1;round<=7;round+=1)for(const shot of "LMR")for(const dive of "LMR")for(const goal of [1,0]){
     const luck=h(`ball|${club}|${round}|${shot}|${dive}|${goal}`),y=.55+(luck>>>3)%9*.12,c=1.4+(luck>>>4)%7*.35;
     assert.ok(y>=.55&&y<=1.52&&c>=1.4&&c<=3.5,`${club} r${round} ${shot}/${dive}: post height ${y}, curl ${c}`);}}
  ok("C3D9","r90: device quality, steady level during a kick, six run-ups, curl, in off the post or the bar on goals only");
}
c3d2().then(()=>console.log(`PASS r89 Chamber Men 3D contracts (${results.length} checks)`)).catch(error=>{console.error(error);process.exitCode=1;});
