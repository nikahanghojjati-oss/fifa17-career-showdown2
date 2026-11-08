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
  assert.match(step,/return Promise\.race\(\[made,dropped,cmsWait\(SCENE_WAIT_MS\)\.then\(\(\)=>\{if\(!goal\.scene\)giveUp\(\);return null;\}\)\]\);/,"a slow scene does not hold the screen (and is aborted)");
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
  assert.match(step,/mount\(goal\.svg,\{clubs:goal\.clubs,signal:stop\?\.signal\}\)/,"the scene mounts with the clubs (and can be aborted)");
  assert.match(step,/goal\.scene\.lineup\(\{taker:c\[shooter\],keeper:c\[cmsOther\(shooter\)\],round\}\);/,"the shooter's club takes the kick, the rival's keeps");
  assert.match(step,/cmsReset\(ui\.goal\);cmsLineup\(ui\.goal,kick\.shooter,n\);/,"every new kick names its taker and keeper");
  assert.match(step,/cmsReset\(g\);cmsLineup\(g,kick\.shooter,kick\.kick\);/,"and so does every reveal");
  assert.match(step,/const wait=animate&&g\.scene\?\.runUpMs\?320\+g\.scene\.runUpMs\+520:0;/,"the result waits for the run-up and the flight");
  const runup=Number(/const RUNUP=([0-9.]+),/.exec(scene)[1])*1000,kickMs=Number(/KICK_MS=(\d+)/.exec(step)[1]);
  assert.ok(kickMs>=320+runup+520+1200,`a reveal holds the run-up, flight and at least 1.2 s of result (${kickMs} ms)`);
  assert.match(scene,/K\.textures\(club,\{layout:a\.body,role,vsClub:vs,size:kitSize,number\}\)/,"kits17 paints the kit on each body's own layout");
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
  assert.match(scene,/let tex=made\.get\(c\)\|\|kitTex\.get\(c\);/,"one texture per kit canvas (shared atlas uploads once), kept for the Showdown (r90 M2)");
  assert.ok(/let t=kitMemo\.get\(memo\);if\(!t\)/.test(scene)&&scene.includes("for(const t of kitTex.values())t.dispose();"),"r90 M2: each kit painted once per Showdown, its textures freed with the scene");
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
// C3D10 r90 W4 quality (Nik 2026-11-07, "hugely improve on a strong PC ... no extra load on a Chromebook or a phone"): every
// extra is gated on the device level (8K uses Ultra's), the ball and grass come in one size per texture level (a phone below
// High one size down), and the picks are flat and matte with gold only for the live choice (Nik 2026-11-08, "less AI-made").
{
  const ex=/const CM3_LEVEL_EXTRAS=\[([\s\S]*?)\n  \];/.exec(scene);assert.ok(ex,"one extras table");
  assert.strictEqual((ex[1].match(/\{aniso:/g)||[]).length,5,"one row per level");
  assert.ok(/\{aniso:4,softness:1\.5,fullCrowd:false\}/.test(ex[1].split("\n")[1]),"Light adds nothing");
  assert.ok(scene.includes("QX=CM3_LEVEL_EXTRAS[Math.max(0,Math.min(4,L))]"),"8K uses Ultra's extras");
  assert.ok(scene.includes('look={phone:Q.assets==="phone",level:Q.textureLevel??Q.level,meshopt};')&&scene.includes('S.load(T,look)'),"textures follow the texture level");
  const stadium=read("js/chamberMenStadium3d.js");
  assert.ok(stadium.includes('const BALL_MESH="ball_mesh_V3.glb",BALL=["512","1k","1k","2k","2k"];'),"one ball size per level, never 4k");
  assert.ok(!/ball_(color|normal|orm)_4k/.test(stadium),"the old 4k ball is gone");
  const choice=/#cmStage \.cmChoice \{[\s\S]*?\n\}/.exec(css)[0],pressed=/#cmStage \.cmChoice\[aria-pressed="true"\] \{[^}]*\}/.exec(css)[0];
  assert.ok(!/gradient|glow/.test(choice+pressed)&&/box-shadow: none;/.test(choice),"flat and matte: no gradient, no glow");
  assert.ok(pressed.includes("background: #f2c45b;")&&pressed.includes("color: #0b0906;"),"the live choice is solid gold with black text");
  assert.ok(step.includes("b.prepend(cmsAimMark(side));")&&step.includes('const svg=mk("svg",{class:"cmAim",viewBox:"0 0 40 16","aria-hidden":"true",focusable:"false"});'),"a small goal on each pick, hidden from screen readers");
  assert.ok(/min-height: 4[4-8]px/.test(choice)&&/@media \(max-width: 560px\) and \(max-height: 760px\) \{[\s\S]*?#cmStage \.cmChoice \{ min-height: 44px; \}/.test(css),"at least 44 px on phones");
  // BUGS hunt (2026-11-08): BUG-03 the finished kick's clock goes during its reveal; BUG-05 a scene given up is aborted
  // (parsing and building stop), not only flagged. r90 M1: its downloads finish into the cache for the next open (C3D14).
  assert.ok(step.includes('clock=null;ui.clock.textContent="";\n        if(from>=kicks.length){revealing=null;render();return;}'),"BUG-03: no stale clock during the reveal");
  assert.ok(step.includes("const giveUp=()=>{late=true;try{stop?.abort();}catch(_error){}};")&&step.includes("goal.dropScene=()=>{if(!goal.scene)giveUp();cut(null);};"),"BUG-05: dropping the scene aborts it");
  assert.ok(scene.includes("const get=file=>cm3Blob(PLAYER_PATH+file)")&&scene.includes("const T=await loadEngine();if(off())return null;")&&scene.includes("if(off()){api.dispose();return null;}"),"BUG-05: the mount stops building (M1: the files still finish into the cache)");
  ok("C3D10","r90 quality: extras by level, ball and grass by texture level, flat picks with gold only for the live choice");
}
// C3D11 r90 LOOK (hunt L01-L03): a night grade (less sky fill), contact shadows under the taker, keeper and ball at every
//    level (lighter where real shadows are sharper), the clubs' names, crests and second colours handed to the stadium.
{
  assert.ok(/new T\.HemisphereLight\(0x9fb4e8,0x14200f,\.08\)/.test(scene),"night: a faint sky fill, the floodlights carry the picture");
  assert.ok(/const blob=\(\(\)=>\{/.test(scene)&&/one\("cmBlobTaker"/.test(scene)&&/one\("cmBlobKeeper"/.test(scene)&&/one\("cmBlobBall"/.test(scene),"three contact shadows");
  assert.ok(/blobAt\(blob\.taker,taker,1\);blobAt\(blob\.keeper,keeper,1\);blobAt\(blob\.ball,null,BALL_R\)/.test(scene),"they follow the players and the ball every frame");
  assert.ok(/const strength=L<=0\?\.62:\.5/.test(scene),"at every level (the floodlights' own shadows are soft, several at once)");
  assert.ok(/homeAlt:altOf\(clubs\.playerOne\),awayAlt:altOf\(clubs\.playerTwo\),homeName:clubs\.playerOne,awayName:clubs\.playerTwo,crest,boardPx:L>=3\?2048:1024/.test(scene),"club names, crests and second colours go to the stadium");
  // L04: the low camera behind and
  // left of the taker, a squad number on the back, breathing on the idles.
  assert.ok(/const CAMB=\{pos:v3\(-1\.3,3\.05,SPOT_Z\+15\),look:v3\(-1\.3,/.test(scene),"low broadcast camera behind and left of the taker");
  assert.ok(/const number=role==="gk"\?1:SHIRT_NUMBERS\[cm3Hash\(`number\|\$\{club\}`\)%SHIRT_NUMBERS\.length\]/.test(scene)&&/size:kitSize,number\}/.test(scene),"squad number on the shirt");
  assert.ok(/breathe\(taker,live,1\)/.test(scene)&&/breathe\(keeper,live,\.8\)/.test(scene),"both players breathe while they wait");
  ok("C3D11","r90 LOOK: night grade, contact shadows, low camera, numbers, breathing, both clubs on the boards and in the crowd");
}
// C3D12 r90 floodlights (Nik 2026-11-08: "proper lighting ... that makes sense in different qualities", "lighting reflection
//    on the stuff ... actually look better, not just a cheap lighting that you add to the corner"): no screen-space glare;
//    every light is a floodlight bank on the 37 m roof ring, the same banks at every level (a higher level resolves more of
//    them and lets more cast), reflections from an environment of those same banks, never from re-rendering the stadium.
//    The HUD (LOOK L24): the cylinder counts sit in a strip under the controls, named for their owner; flat gold dots.
{
  assert.ok(!/cmGlare|uAspect/.test(scene),"no corner glare");
  const banks=/const FLOOD_BANKS=\[([\s\S]*?)\n  \];/.exec(scene);assert.ok(banks,"one bank table");
  const pos=[...banks[1].matchAll(/\{p:\[(-?\d+),(\d+),(-?\d+)\],w:([\d.]+)\}/g)];
  assert.strictEqual(pos.length,6,"six banks");
  assert.ok(pos.every(m=>m[2]==="37"),"all on the roof ring, 37 m up");
  const rigs=/const FLOOD_RIGS=\[([\s\S]*?)\n  \];/.exec(scene);assert.ok(rigs,"one rig table");
  const rows=rigs[1].trim().split("\n").map(r=>r.trim());assert.strictEqual(rows.length,5,"one rig per level (8K uses Ultra's)");
  const used=r=>[...r.matchAll(/\[\[([\d,]+)\],([01])\]/g)];
  for(const r of rows){const ids=used(r).flatMap(m=>m[1].split(",").map(Number)).sort((a,b)=>a-b);assert.deepStrictEqual(ids,[0,1,2,3,4,5],"every level lights from all six banks");}
  const shadows=rows.map(r=>used(r).filter(m=>m[2]==="1").length),lights=rows.map(r=>used(r).length);
  assert.deepStrictEqual(lights,[3,3,4,6,6],"Light and Balanced keep three lights (the old cost)");
  assert.deepStrictEqual(shadows,[1,1,2,3,4],"more banks cast as the level rises");
  assert.ok(scene.includes("const flood=cm3FloodRig(L,FLOOD_BANKS)")&&scene.includes("l.target.position.copy(FLOOD_AIM)"),"the lights are the banks, aimed at the box");
  assert.ok(scene.includes("const env=cm3FloodEnv(T,renderer,L,FLOOD_BANKS)")&&!/pm\.fromScene\(scene/.test(scene),"reflections from the same banks, not a render of the stadium");
  assert.ok(/for\(const b of banks\)\{const m=new T\.Mesh\(panel/.test(scene),"each bank is a bright panel in the reflections");
  assert.ok(!/root\.__cmDebug/.test(scene),"no debug hook");
  const stadium=read("js/chamberMenStadium3d.js");
  assert.ok(stadium.includes("float cmOut=max(abs(vCmWorld.x)-35.0,0.0)+max(-1.5-vCmWorld.z,0.0);")&&!stadium.includes("mix(1.16,.36"),"an evenly floodlit pitch, darker only past the lines");
  assert.ok(step.includes("const cmsCylText=(role,live)=>`${NAMES[role]}'s cylinder: ${live} live ${live===1?\"round\":\"rounds\"}`;"),"L24: named for its owner");
  assert.ok(step.includes('const cylStrip=cmsEl("p","cmCylStrip")')&&step.includes("controls.append(turn,status,clock,picks,lines,actions,cylStrip)")&&!/Cylinder: \$\{/.test(step),"L24: in the strip under the controls, not under GOALS");
  const live=/#cmStage \.cmChamber\.is-live \{[^}]*\}/.exec(css)[0],empty=/#cmStage \.cmChamber\.is-empty \{[^}]*\}/.exec(css)[0];
  assert.ok(!/gradient|#ff/.test(live+empty)&&/box-shadow: none;/.test(live)&&live.includes("background: #d4a017;"),"L24: flat gold dots, no gloss or glow");
  ok("C3D12","r90 floodlights from six roof banks at every level, more shadows higher up, reflections of the same banks, no glare; HUD cylinder strip");
}
// C3D13 r90 player moves from Nik's Mixamo files (2026-11-08), baked into our own anims_*.glb (no FBX in the repo): the
//    taker's reaction varies per kick (four after a goal, two after a miss or save), picked from the kick's own hash so both
//    phones agree; a keeper who stayed in the middle while the ball went into a corner stays set, then drops his hands to
//    his knees (no catch at thin air). A clip file without the new clips still plays the first reaction of each kind.
{
  assert.ok(scene.includes('const REACTIONS={goal:["victory","victory2","cheer","salute"],miss:["disappointed","defeated"]};'),"reaction pools");
  assert.ok(/react\[k\]=list\.filter\(n=>TK\[n\]\)\.map\(reaction\)/.test(scene),"reactions present in the file only");
  assert.ok(/react:pool\[\(luck>>>8\)%pool\.length\]/.test(scene)&&/const luck=cm3Hash\(`ball\|\$\{lineup\.taker\}\|\$\{round\}/.test(scene),"picked from the kick's hash");
  assert.ok(/const rooted=k\.goal&&k\.shot&&side==="M"&&KC\.defeated\?ROOTED:null;/.test(scene)&&scene.includes('const ROOTED={c:"defeated",m:0,tc:-.15,s:1,rooted:1};'),"rooted keeper on a goal past him");
  const tool=read("tools/chamber-men-players/clips_r90.json");
  for(const n of ["victory2","cheer","salute","defeated"])assert.ok(tool.includes(`"${n}"`),`clips_r90.json bakes ${n}`);
  const fbx=require("node:child_process").execFileSync("git",["ls-files","*.fbx","*.FBX","*.zip"],{cwd:path.join(__dirname,"../.."),encoding:"utf8"}).trim();
  assert.equal(fbx,"","no Mixamo source (FBX or zip) in the repo");
  ok("C3D13","r90 moves: reactions vary per kick, rooted keeper, clips baked from Nik's Mixamo files with no FBX committed");
}
// C3D15 r90 draw calls: each player's opaque pieces cast one shadow draw (a shadow-only copy on the same bones, drawn
//    only inside the shadow-map pass, in the pieces' own bind space), hair keeps its own, eyelashes cast none.
{
  const code=scene.replace(/\/\/[^\n]*/g,"");
  assert.ok(/sm\.render=\(\.\.\.args\)=>\{for\(const p of shadowBodies\)\{p\.visible=true;p\.skeleton\.update\(\);\}/.test(code)&&/finally\{for\(const p of shadowBodies\)p\.visible=false;\}/.test(code),"the shadow copy shows only while the shadow maps draw");
  assert.ok(/!\(o\.material\.alphaTest>0\)&&!o\.material\.alphaMap&&!o\.material\.transparent/.test(code),"alpha-cut pieces (hair) keep their own shadow");
  assert.ok(/Math\.abs\(x-e\[k\]\)>1e-4\)\)return;/.test(code),"a body whose pieces disagree on a bind pose keeps per-piece shadows");
  assert.ok(/const same=o\.bindMatrix\.equals\(bind\)/.test(code)&&/proxy\.bind\(keep\(new T\.Skeleton\(bones,inv\)\),bind\)/.test(code),"positions copied in the pieces' own bind space");
  assert.ok(/for\(const o of parts\)o\.castShadow=false;/.test(code)&&/shadowBody\(model\);/.test(code),"every actor gets one");
  assert.ok(/o\.castShadow=!\/lash\/i\.test\(/.test(code),"eyelashes cast no shadow");
  ok("C3D15","r90 draw calls: one shadow draw per player body, hair its own, no eyelash shadow");
}
let c3d14=Promise.resolve();
// C3D14 r90 M1 (MOTION hunt): a first Chamber Men on a 10 Mbps line never mounted the 3D pitch (about 7 MB at Light against
//    the 4.2 s wait). The GLBs are meshopt-packed (one shared decoder, shell-cached) and the season page warms this
//    device's files ahead, once per season, a few seconds after it shows and at an idle moment; one download per file is
//    shared with the mount and never aborted.
{
  const P="visual-assets/v10_1/chamber-men/";
  const glb=f=>{const b=fs.readFileSync(path.join(ROOT,P+f));return JSON.parse(b.toString("utf8",20,20+b.readUInt32LE(12)));};
  for(const f of ["players/anims_desktop.glb","players/anims_phone.glb",...["remy","ch38","ch42"].flatMap(b=>[`players/body_${b}_desktop.glb`,`players/body_${b}_phone.glb`]),"assets/ball_mesh_V3.glb","assets/stadium_bowl_V1_1k.glb"])
    assert.ok((glb(f).extensionsRequired||[]).includes("EXT_meshopt_compression"),`${f} is meshopt-packed`);
  // Light/Balanced bodies carry the hair cards at 512 px (hair-light.py); High and up keep 2k.
  {const hairPx=f=>{const b=fs.readFileSync(path.join(ROOT,P+f)),n=b.readUInt32LE(12),j=JSON.parse(b.toString("utf8",20,20+n)),bin=20+n+8;
     const m=j.materials.find(x=>x.name==="Hairmat"),t=j.textures[m.pbrMetallicRoughness.baseColorTexture.index],img=j.images[t.extensions.EXT_texture_webp.source],v=j.bufferViews[img.bufferView];
     const d=b.subarray(bin+(v.byteOffset||0),bin+(v.byteOffset||0)+v.byteLength);assert.equal(d.toString("ascii",8,12),"WEBP");
     const vp8x=d.indexOf("VP8X");return 1+d.readUIntLE(vp8x+12,3);};
   for(const b of ["ch38","ch42"]){assert.equal(hairPx(`players/body_${b}_phone.glb`),512,`${b} Light hair 512`);assert.equal(hairPx(`players/body_${b}_desktop.glb`),2048,`${b} High hair 2k`);}}
  const DEC=P+"vendor/meshopt_decoder-0.22.0.js";
  assert.ok(/^\/\*\n \* meshoptimizer 0\.22\.0 decoder[\s\S]*?MIT License[\s\S]*?Permission is hereby granted/.test(read(DEC)),"decoder vendored with its MIT licence");
  assert.ok(scene.includes(`const MESHOPT_JS="${DEC}";`)&&scene.includes("new T.GLTFLoader().setMeshoptDecoder(meshopt).parseAsync("),"players parse with the decoder");
  assert.ok(read("js/chamberMenStadium3d.js").includes("l.setMeshoptDecoder(o.meshopt)"),"ball and bowl load with the decoder");
  // Each body is parsed once; the keeper is a copy bound to its own bones, with its own materials.
  assert.ok(scene.includes("const taker=await parse(buf);bodies[n]={taker,keeper:cm3CloneBody(taker)};")&&!scene.includes("parse(buf),parse(buf)"),"one parse per body");
  assert.ok(/skeleton\.bones=from\.skeleton\.bones\.map\(b=>toCopy\.get\(b\)\);/.test(scene)&&/o\.material=Array\.isArray\(o\.material\)\?o\.material\.map\(m=>m\.clone\(\)\):o\.material\.clone\(\);/.test(scene),"the copy has its own bones and materials");
  const shellList=sw.slice(sw.indexOf("const SHELL_PATHS"),sw.indexOf("];",sw.indexOf("const SHELL_PATHS"))),pack=sw.slice(sw.indexOf("const OFFLINE_PACK_PATHS"),sw.indexOf("]);",sw.indexOf("const OFFLINE_PACK_PATHS")));
  assert.ok(shellList.includes(`"${DEC}"`)&&pack.includes(`"${DEC}"`),"decoder in the shell, filled with the offline pack");
  assert.ok(fs.existsSync(path.join(ROOT,"tools/chamber-men-players/pack-meshopt.mjs")),"packing tool in the repo");
  const pstc=read("js/productionSharedTransferChallenge.js");
  assert.ok(/if\(decorated&&!openPromise&&!pstcShowdownComplete\(\)\)pstcWarmChamberMen\(\);/.test(pstc)&&/confirmedAtMs<CHAMBER_FROM_MS\)return;/.test(pstc)&&/chamberWarmKey===key/.test(pstc)&&/root\.setTimeout\(\(\)=>\{if\(typeof root\.requestIdleCallback==="function"\)root\.requestIdleCallback\(go,\{timeout:2500\}\);else go\(\);\},1500\);/.test(pstc),"the season page warms once per season, late and idle");
  // Behaviour: warm() asks for exactly this level's files, each once, and the mount shares a download still in flight.
  const asked=[];let release;const gate=new Promise(r=>{release=r;});
  const sb={console,setTimeout,clearTimeout,Promise,URL,WebGL2RenderingContext:function(){},navigator:{},
    fetch:(u,o)=>{asked.push([u,o&&o.priority]);return gate.then(()=>({ok:true,blob:()=>Promise.resolve({arrayBuffer:()=>Promise.resolve(new ArrayBuffer(8))})}));},
    CareerModeGfxTier:{profile:()=>({level:0,textureLevel:0,name:"light"})},CareerModeKits17:{layouts:["wrap","remy","ch38","ch42"]},MeshoptDecoder:{ready:Promise.resolve()},
    document:{createElement:()=>({}),head:{append(){}}}};
  sb.globalThis=sb;sb.window=sb;vm.createContext(sb);vm.runInContext(read("js/chamberMenStadium3d.js"),sb);vm.runInContext(scene,sb);
  const warm=sb.CareerModeChamberMen3d.warm({clubs:{playerOne:"Barcelona",playerTwo:"Chelsea"}});
  c3d14=(async()=>{
    for(let i=0;i<20;i+=1)await Promise.resolve();
    release();
    assert.equal(await warm,true,"warm resolves true");
    const urls=asked.map(a=>a[0]);
    assert.equal(new Set(urls).size,urls.length,"each file once");
    assert.ok(asked.every(a=>a[1]==="low"),"low priority");
    assert.ok(scene.includes("while(next<urls.length&&!cm3Mounting){const u=urls[next];next+=1;if(!await cm3Blob(u,true))ok=false;}"),"one file at a time, none new once a mount starts");
    assert.ok(urls.includes(ENGINE)&&urls.includes(P+"players/anims_phone.glb"),"engine and Light clips");
    assert.ok(urls.filter(u=>/players\/body_\w+_phone\.glb$/.test(u)).length>=1&&!urls.some(u=>/_desktop\.glb$/.test(u)),"Light bodies only");
    assert.ok(!urls.some(u=>/stadium_bowl/.test(u))&&urls.some(u=>/grass_color_V2_1k\.webp$/.test(u)),"Light stadium files, no bowl");
    ok("C3D14","r90 M1: meshopt-packed GLBs with a shell-cached decoder; the season page warms this level's files once, shared with the mount");
  })();
}
c3d2().then(()=>c3d14).then(()=>console.log(`PASS r89 Chamber Men 3D contracts (${results.length} checks)`)).catch(error=>{console.error(error);process.exitCode=1;});
