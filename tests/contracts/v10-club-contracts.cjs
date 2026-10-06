#!/usr/bin/env node
"use strict";
// G-34 (job 34) contract: Team V's Club Assignment (visual-assets/v10_1/club, Team V 5e05a1f, frames CL1-CL6) on the
// live #clubWheelScreen. Skin, don't rewire:
// - js/clubScreenV10.js leaves the product elements where they are (Team V's club markup is the product's markup plus
//   decoration). Every product id still exists once, is the same element and still reaches its click handler.
// - The frame is read from what the product rendered (reveal stage + opened packs). A sealed pack's club never reaches
//   the frame or Team V's layout: the animation only shows the club the product already chose; it never picks.
// - Daniel (playerOne) is on the left, Nik (playerTwo) on the right (on the phone: Daniel's row first).
// - Loading stays lazy: index.html, the startup line and RUNTIME_REVISION are unchanged; Team V files are shell cached,
//   images use job 24's runtime image cache. Team V's files are byte-identical to 5e05a1f except the marked club.js
//   lines ("App (JOB-34)").
// - Leaving the screen restores the product's section exactly (markup, attributes, <html> classes and properties).
// The browser checks run the real app page (index.html) in the pinned Chromium; no Firebase or network is used.
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const zlib=require("node:zlib");
const crypto=require("node:crypto");
const net=require("node:net");
const {spawn}=require("node:child_process");
const ROOT=path.resolve(__dirname,"../..");
const read=file=>fs.readFileSync(path.join(ROOT,file),"utf8");
const sha256=buffer=>crypto.createHash("sha256").update(buffer).digest("hex");
const checks=[];
const check=(name,fn)=>checks.push([name,fn]);

const CL=require(path.join(ROOT,"js/clubScreenV10.js"));
const DIR="visual-assets/v10_1/club/";
const SENTINEL="ZQXSEALEDCLUB";

// Team V 5e05a1f bytes (club.js: before the marked "App (JOB-34)" edits).
const TEAM_V={
  "club.js":"01ababd0640a9ab24208f8e7352140fc92735e683015073857ed9e9d22e9dd5e",
  "club.css":"72ed488f433f4a5b7a94b7e03f56824f46cdcc4ce2af75bec3979e7fa9d1f4dd",
  "assets/platemap.json":"2d4833e60431a44796346e71abf006020bbbbd7897f6c8227a33ec44ed36a8f2",
  "assets/handmap.json":"dab8e3441e2dc2d36f3f0ae00de9d42e09d1508d8bcaac6e439a314de1c0da28",
  "assets/OVL_CLUB_DANIEL_SIDE_HAND_V1_1X.webp":"8cf447697e04040380835f6a30ef4d53260e4f7961cab270ca1581862127c5e4",
  "assets/OVL_CLUB_DANIEL_SIDE_HAND_V1_2X.webp":"fbfedd9e8d0ad7e897c15a3be5b705ecc3dacf4999e09129752df4888deff401",
  "assets/OVL_CLUB_DANIEL_TOP_HAND_V1_1X.webp":"37a25414eb5127375b4a935c5cbba2940a0caf6ecb92e1e0317a17708092621f",
  "assets/OVL_CLUB_DANIEL_TOP_HAND_V1_2X.webp":"bcf8d24932a09082f291dd95ebb718c97c104379ab7a1f61c9bfc197f18201f8",
  "assets/OVL_CLUB_HAND_CONTACTS_V1_1X.webp":"6c00713b7e5dec204635375345f696071dd9534f18f578ca99ecfa668475861d",
  "assets/OVL_CLUB_HAND_CONTACTS_V1_2X.webp":"d8a64e75d6333f0696de3777f313ffb40b6be609f9636f242b84429dc7a6ca8b",
  "assets/OVL_CLUB_HAND_CORES_V1_1X.webp":"5bdbf18b8900bb9d6c080a9ac6fc2b42fdb417ab5af36112af68127cba134a9e",
  "assets/OVL_CLUB_HAND_CORES_V1_2X.webp":"6b71c92e3fc17a06f5f0197536e0c4342afa229fdfaef32e12cddb4de59b8bb0",
  "assets/OVL_CLUB_NIK_SIDE_HAND_V1_1X.webp":"fe33377f87fabd6bd268a09c1c4df2e0e17a61fc7f3efbb4750d381b9f1f1b0d",
  "assets/OVL_CLUB_NIK_SIDE_HAND_V1_2X.webp":"bc23936920cca3332ce6e3c2f2651ff4754b4f2813262b52f88a3c41a99dac0a",
  "assets/OVL_CLUB_NIK_TOP_HAND_V1_1X.webp":"cccde87a5cd3f90f63bfb9c760cd3d2d029c71d049019a72dfe9576e711059aa",
  "assets/OVL_CLUB_NIK_TOP_HAND_V1_2X.webp":"8d538cfddfa18b5bd4ed5b5ce906e0dfcbfa563254a892563d98700143a9f480",
  "assets/OVL_CLUB_SEAM_MENDS_V1_1X.webp":"e6e319db851454ffeda0575cf200ab57f01f5e3c0ac899a31ec3d38aa5440de4",
  "assets/OVL_CLUB_SEAM_MENDS_V1_2X.webp":"eeb99a2738616e634bf96795209d810f7ac6474556318b2e1975dcaafea9e9a1",
  // Already shipped by job 26 (pinned in v10-foundation-contracts.cjs too); club.css and the adapter use them.
  "assets/ENV_CLUB_PLATE_V1_1X.webp":"398e74faeb18ab2df655122fa0f78e9737aad4c1eff1ba16d019a305f275c255",
  "assets/ENV_CLUB_PLATE_V1_2X.webp":"fed849bbb2c9f239ae1561f57eb5b145e0e33a518fb7bfd0e424691c00cfd6ca",
  "assets/ENV_CLUB_PHONE_V1.webp":"b31092d3eac35a9851d9c51406dd0cf7972e2dd9a5a8adb83c78d4a27497ba2a",
  "assets/OVL_CLUB_DANIEL_PHONE_V1.webp":"6836d6b85c87fdc0d73e18d106b1a6bf98c102d1f8e0fe5eacdb81c7bf95dc2d",
  "assets/OVL_CLUB_NIK_PHONE_V1.webp":"2f509a89aa6485eac3ae8f7892dfb2c79e7733bed066eb3371dec9a2aa9c28bc",
  // club.css's @font-face (../tr2/slice-02-plate/assets/fonts/), Team V 5e05a1f bytes.
  "../tr2/slice-02-plate/assets/fonts/kaushan-script-latin-400-normal.woff2":"addcc80ddcc170ff8c97140ab37ac380ac4e6d0b8fd14e5d107b4cb87ffd778f"
};
// Team V's club.js with the marked app edits taken back out.
function teamVClubJs(source){
  const begin=source.indexOf("  // App (JOB-34) begin"),end=source.indexOf("  // App (JOB-34) end\n");
  assert.ok(begin>0&&end>begin,"one marked app block");
  const out=(source.slice(0,begin)+source.slice(end+"  // App (JOB-34) end\n".length)).split("\n")
    .filter(line=>!line.startsWith("  const ASSET_BASE = window.CLUB_ASSET_BASE"))
    .map(line=>line
      .replace(/^  let FRAME = (.*); \/\/ App \(JOB-34\).*$/,"  const FRAME = $1;")
      .replace(' || Boolean(window.CLUB_APP); // App (JOB-34): live stage changes play.',";")
      .replace("  if (!window.CLUB_APP) main().catch(showUnavailable); // App (JOB-34): the app mounts the screen itself.","  main().catch(showUnavailable);")
      .replace(/" \+ ASSET_BASE \+ "/g,"").replace(/\$\{ASSET_BASE\}/g,"").replace(/ \/\/ App \(JOB-34\)$/,""));
  return out.join("\n");
}
const live=(stage,revealed,names,context=true)=>({context,stage,revealed,names});

check("1 Team V files are 5e05a1f bytes; club.js differs only by the marked app lines",()=>{
  for(const [file,hash] of Object.entries(TEAM_V)){
    if(file==="club.js")continue;
    assert.equal(sha256(fs.readFileSync(path.join(ROOT,DIR,file))),hash,file);
  }
  const club=read(DIR+"club.js");
  const marked=club.split("\n").filter(line=>/App \(JOB-34\)/.test(line));
  assert.equal(marked.length,10,"ten marked lines (eight edits and the begin/end of the app block)");
  assert.equal(sha256(Buffer.from(teamVClubJs(club))),TEAM_V["club.js"],"club.js minus the marked edits is Team V's");
  // The app block only drives club.js's own layout: it never runs Team V's demo (fixtures, renderFrame, main).
  const block=club.slice(club.indexOf("// App (JOB-34) begin"),club.indexOf("// App (JOB-34) end")).split("\n").filter(line=>!/^\s*\/\//.test(line)).join("\n");
  for(const banned of ["renderFrame","fetch(","fixtures","main(","showUnavailable(","textContent","innerHTML","disabled"])assert.ok(!block.includes(banned),`app block has no ${banned}`);
  for(const banned of ["index.html","fixtures.json","BUILD_RESULT.md","evidence","review"])assert.ok(!fs.existsSync(path.join(ROOT,DIR,banned)),`${banned} not copied`);
});

check("2 the frame is pure, frozen and comes only from what the product shows",()=>{
  const a=CL.toClubFrame(live("manager-one",[true,false],["Arsenal","?"])),b=CL.toClubFrame(live("manager-one",[true,false],["Arsenal","?"]));
  assert.equal(a.key,b.key);assert.ok(Object.isFrozen(a)&&Object.isFrozen(a.clubs)&&Object.isFrozen(a.revealed));
  assert.deepEqual({...CL.FRAMES},{ready:"CL1",opening:"CL2","manager-one":"CL3","manager-two":"CL4",versus:"CL5",confirmation:"CL6"});
  for(const [stage,frameId] of Object.entries(CL.FRAMES))assert.equal(CL.toClubFrame(live(stage,[false,false],["?","?"])).frameId,frameId,stage);
  assert.equal(CL.toClubFrame(live("spinning",[false,false],["?","?"])).frameId,"CL1","an unknown stage shows the ready frame");
  for(const input of [live("ready",[false,false],["?","?"],false),null,undefined,{}])assert.equal(CL.toClubFrame(input),null,"no showdown context: the app keeps its own screen");
  // Daniel is playerOne (left, index 0), Nik playerTwo (right, index 1).
  const both=CL.toClubFrame(live("confirmation",[true,true],[" Arsenal ","Chelsea"]));
  assert.deepEqual({...both.clubs},{playerOne:"Arsenal",playerTwo:"Chelsea"});assert.deepEqual([...both.revealed],[true,true]);
  const data=CL.toPlateData(both);
  assert.deepEqual(data,{frame:"CL6",fx:{clubs:{playerOne:"Arsenal",playerTwo:"Chelsea"},frames:{CL6:{stage:"confirmation",revealed:[true,true]}}}});
  assert.throws(()=>CL.toPlateData(null),/CLUB_V10_FRAME/);
});

check("3 a sealed pack's club never reaches the frame or Team V's data; the skin never picks a club",()=>{
  for(const stage of CL.STAGES){
    for(const revealed of [[false,false],[true,false],[false,true]]){
      const names=revealed.map((open,index)=>open?["Arsenal","Chelsea"][index]:SENTINEL);
      const frame=CL.toClubFrame(live(stage,revealed,names));
      const text=JSON.stringify([frame,CL.toPlateData(frame)]);
      assert.ok(!text.includes(SENTINEL),`${stage} ${revealed}: no sealed club`);
      revealed.forEach((open,index)=>assert.equal(frame.revealed[index],open,"revealed follows the product's .is-revealed"));
    }
    // A revealed card whose name is still the product's "?" placeholder stays sealed.
    const placeholder=CL.toClubFrame(live(stage,[true,true],["?",""]));
    assert.deepEqual([...placeholder.revealed],[false,false]);assert.deepEqual({...placeholder.clubs},{playerOne:"",playerTwo:""});
  }
  const source=read("js/clubScreenV10.js");
  for(const banned of ["Math.random","getRandomClubPair","CLUBS_BY_LEAGUE","clubs.playerOne=","clubs.playerTwo=","currentShowdown.clubs","assignClubs","saveCurrentShowdown","mutate("])assert.ok(!source.includes(banned),`clubScreenV10.js never picks or writes clubs: ${banned}`);
});

check("4 lazy loading: index.html, the startup line and RUNTIME_REVISION unchanged; files shell-cached; images runtime-cached",()=>{
  const html=read("index.html"),sw=read("service-worker.js"),ssjr=read("js/ssjr.js");
  for(const banned of ["clubScreenV10","v10Club","v10_1/club/"])assert.ok(!html.includes(banned),banned);
  const refs=[...html.matchAll(/(?:src|href)="((?:js|css|data)\/[^"?#]+)(?:\?v=([^"#]+))?/g)].map(m=>m[1]);
  assert.ok(!refs.includes("js/clubScreenV10.js")&&!refs.includes("css/v10Club.css"),"not a startup file");
  const gzip=refs.reduce((total,ref)=>total+zlib.gzipSync(fs.readFileSync(path.join(ROOT,ref)),{level:9}).length,0);
  assert.ok(gzip<=37495,`startup gzip ${gzip} must stay <= 37495`);
  assert.match(ssjr,/load\("v10-club","js\/clubScreenV10\.js",\(\)=>root\.CareerModeClubScreenV10\)\.then\(\(\)=>root\.CareerModeClubScreenV10\.install\(\)\)/);
  assert.match(ssjr,/requestIdleCallback\(v10Club/);
  const shell=new Set([...sw.matchAll(/^\s+"([^"]+)",?$/gm)].map(m=>m[1]));
  const imageRule=new RegExp(/const V10_IMAGE_PATH = \/(.+)\/i;/.exec(sw)[1],"i");
  for(const file of ["js/clubScreenV10.js","css/v10Club.css",DIR+"club.css",DIR+"club.js",DIR+"assets/platemap.json",DIR+"assets/handmap.json"])assert.ok(shell.has(file),`shell lists ${file}`);
  for(const file of Object.keys(TEAM_V)){
    const full=path.posix.normalize(DIR+file);
    if(/\.webp$/.test(full)){assert.ok(imageRule.test(full),full);assert.ok(!shell.has(full),`${full} not precached`);}
    else if(/\.woff2$/.test(full))assert.ok(shell.has(full),`${full} shell cached`);
  }
  assert.match(sw,/const RUNTIME_REVISION = "1\.9\.1-r62";/,"RUNTIME_REVISION is the current release (r62)");
  // The glue loads before club.css, so club.css wins every tie with it while the glue's resets still beat the app.
  assert.deepEqual([...CL.FILES.css],["../../css/v10Club.css","club/club.css"]);
  assert.deepEqual(CL.FILES.script.slice(0,2),["v10-club-plate","club/club.js"]);
  const source=read("js/clubScreenV10.js");
  for(const banned of ["localStorage","sessionStorage","indexedDB","firestore","Firestore","firebase","cloneNode","RUNTIME_REVISION","fixtures.json"])assert.ok(!source.includes(banned),`clubScreenV10.js has no ${banned}`);
  // Screen styles switch on around mount, so club.js must lay the screen out again when its box changes size.
  assert.ok(/new root\.ResizeObserver\(/.test(source)&&/sectionSize\.observe\(section\)/.test(source)&&/clLayout\(\)/.test(source),"the section re-frames the plate when it resizes");
  assert.ok(/sectionSize\.disconnect\(\)/.test(source),"the observer disconnects on teardown");
  // G-F6b: the layout goes out on the next frame, the first report included. Laying out inside the observer callback
  // resized the screen again in the same delivery; Chromium then fired "ResizeObserver loop completed with undelivered
  // notifications" and the app's error boundary showed it as a 10 s toast that covers the phone's buttons.
  assert.ok(/relayout=root\.requestAnimationFrame\(\(\)=>\{relayout=null;clLayout\(\);\}\)/.test(source),"the section layout is deferred to the next frame");
  assert.ok(!/const first=!last/.test(source),"the observer's first report is not skipped");
  assert.ok(/root\.cancelAnimationFrame\(relayout\)/.test(source),"a pending layout is cancelled on teardown");
  // js/v10Setup.js no longer registers the Club screen (a second registration would throw V10_SCREEN_DUPLICATE).
  const Setup=require(path.join(ROOT,"js/v10Setup.js"));
  assert.ok(!Object.hasOwn(Setup.SCREENS,"clubWheelScreen"));
  // Every glue rule is scoped to the Club screen (the file is on only while it shows, but never restyles the rest).
  const rules=read("css/v10Club.css").replace(/\/\*[\s\S]*?\*\//g,"").replace(/@media[^{]+\{/g,"");
  for(const m of rules.matchAll(/([^{}]+)\{[^{}]*\}/g)){
    for(const selector of m[1].split(",").map(s=>s.trim()).filter(Boolean))
      assert.ok(/#clubWheelScreen|html\[data-v10-screen="clubWheelScreen"\]/.test(selector),`scoped to the Club screen: ${selector}`);
  }
});

// ---- browser: the real app page in the pinned Chromium ----
function freePort(){return new Promise((resolve,reject)=>{const server=net.createServer();server.unref();server.on("error",reject);server.listen(0,"127.0.0.1",()=>{const {port}=server.address();server.close(()=>resolve(port));});});}
async function waitForServer(port){for(let i=0;i<100;i+=1){const ok=await new Promise(resolve=>{const socket=net.connect(port,"127.0.0.1",()=>{socket.end();resolve(true);});socket.on("error",()=>resolve(false));});if(ok)return;await new Promise(resolve=>setTimeout(resolve,100));}throw new Error("static server did not start");}

// Runs in the page: let the product render one reveal stage (its own functions), then wait for Team V's look.
const stageLog=[];
const productSetup=()=>{
  currentShowdown={id:"club-contract",name:"Daniel vs Nik",managers:{playerOne:"Daniel",playerTwo:"Nik"},selectedLeague:{id:"premier_league",name:"Premier League"},clubs:{playerOne:null,playerTwo:null},totalRounds:3,status:"League Confirmed",rounds:[]};
  if(typeof initializeClubAssignment==="function")initializeClubAssignment();
  showScreen("clubWheelScreen");populateClubAssignmentBase();renderReadyAssignmentState();
};
async function productStage(page,name,extra={}){
  await page.evaluate(async({name,extra})=>{
    const notice=document.getElementById("appRuntimeNotice");if(notice)notice.remove();
    currentShowdown.clubs=name==="ready"||name==="opening"?{playerOne:null,playerTwo:null}:{playerOne:"Arsenal",playerTwo:"Chelsea"};
    if(name==="ready")renderReadyAssignmentState();
    else if(name==="confirmation")renderClubConfirmationState();
    else renderClubRevealStage(name);
    if(extra.sealedTwo){const name2=document.getElementById("clubNameTwo");name2.textContent=extra.sealedTwo;document.getElementById("clubCardTwo").classList.remove("is-revealed");}
  },{name,extra});
}
async function stage(page,name,extra={}){
  stageLog.push([name,extra]);
  await productStage(page,name,extra);
  await page.waitForFunction(stageName=>window.CareerModeClubScreenV10.isMounted()&&document.querySelector("#clubWheelScreen.cl-on > .cl-stage #world")&&document.documentElement.dataset.v10Screen==="clubWheelScreen"&&document.getElementById("clubWheelScreen").dataset.clubRevealStage===stageName,name,{timeout:20000});
  // G-F6b: right after mount (two frames, no settling wait) the screen's visible actions are inside the viewport.
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  const offscreen=await page.evaluate(ids=>ids.filter(id=>{const n=document.getElementById(id);if(!n||n.classList.contains("hidden")||!n.getClientRects().length)return false;const r=n.getBoundingClientRect();return r.top<0||r.bottom>window.innerHeight+1||r.left<0||r.right>window.innerWidth+1;}).map(id=>`${id}@${Math.round(document.getElementById(id).getBoundingClientRect().top)}`),["openClubPack","continueClubAssignment","clubAssignmentBack"]);
  assert.deepEqual(offscreen,[],`${name}: the screen's actions show inside the viewport right after mount`);
  await page.waitForTimeout(500);
}

async function browserChecks(){
  const {chromium}=require("playwright");
  const {resolveChromiumRuntime}=require("../support/chromium-runtime.cjs");
  const port=await freePort();
  const server=spawn(process.execPath,[path.join(ROOT,"tests/support/static-server.cjs")],{cwd:ROOT,stdio:"ignore",env:{...process.env,CMS_TEST_PORT:String(port)}});
  let browser=null;
  try{
    await waitForServer(port);
    const runtime=await resolveChromiumRuntime();
    browser=await chromium.launch({executablePath:runtime.executablePath,headless:true,args:runtime.args});
    const context=await browser.newContext({viewport:{width:1920,height:1080},serviceWorkers:"block",reducedMotion:"reduce"});
    const page=await context.newPage();
    const pageErrors=[];page.on("pageerror",error=>pageErrors.push(String(error&&error.message||error)));
    // Chromium reports a ResizeObserver loop as a window error event (not a pageerror); the app would toast it.
    await page.addInitScript(()=>{window.__clLoopErrors=[];addEventListener("error",event=>{if(/ResizeObserver loop/.test(String(event&&event.message)))window.__clLoopErrors.push(String(event.message));});});
    await page.goto(`http://127.0.0.1:${port}/index.html`,{waitUntil:"load"});
    await page.waitForFunction(()=>window.CareerModeClubScreenV10&&window.CareerModeV10Screens&&typeof window.showScreen==="function"&&typeof window.ensureGameplayModules==="function",null,{timeout:30000});
    await page.evaluate(()=>window.ensureGameplayModules());
    await page.evaluate(()=>window.CareerModeClubScreenV10.install());
    // The product's own render of the ready state, recorded synchronously before Team V's look can mount.
    const original=await page.evaluate(setup=>{
      (0,eval)(`(${setup})`)();
      const section=document.getElementById("clubWheelScreen");
      window.__clNodes=new Map([...section.querySelectorAll("[id]")].map(node=>[node.id,node]));
      return {html:section.innerHTML,attrs:[...section.attributes].map(a=>[a.name,a.value]).filter(([n])=>n!=="class"),ids:[...window.__clNodes.keys()],mounted:window.CareerModeClubScreenV10.isMounted()};
    },productSetup.toString());
    assert.equal(original.mounted,false,"recorded before mount");
    const BUTTONS=["openClubPack","continueClubAssignment","clubAssignmentBack"];
    // The pack and confirm buttons keep their own listeners (bound to the elements by js/clubAssignment.js); this
    // capture listener records what reaches them and stops it, so the local draw does not run. Back is handled by the
    // app's own smart-back delegation (js/screens.js), whose navigation is recorded instead of run.
    await page.evaluate(ids=>{window.__clClicks=[];document.addEventListener("click",event=>{const button=event.target&&event.target.closest&&event.target.closest("button");if(button&&ids.includes(button.id)){window.__clClicks.push(button.id);event.preventDefault();event.stopImmediatePropagation();}},true);
      window.__clBack=window.navigateBackSmart;window.navigateBackSmart=()=>{window.__clClicks.push("clubAssignmentBack");};},BUTTONS.filter(id=>id!=="clubAssignmentBack"));

    check("5 after mount every product id exists once, is the same element and its buttons are clickable (390, 1920x1080, 1920x910)",async()=>{
      for(const name of ["ready","manager-one","confirmation"]){
        await stage(page,name);
        for(const size of [{width:390,height:844},{width:1920,height:1080},{width:1920,height:910}]){
          await page.setViewportSize(size);await page.waitForTimeout(500);
          const state=await page.evaluate(ids=>ids.map(id=>{const nodes=document.querySelectorAll(`[id="${id}"]`);return {id,count:nodes.length,same:nodes[0]===window.__clNodes.get(id)};}),original.ids);
          for(const entry of state){assert.equal(entry.count,1,`${name} ${size.width}: #${entry.id} exists once`);assert.ok(entry.same,`${name} ${size.width}: #${entry.id} is the product's element`);}
          const dupes=await page.evaluate(()=>{const seen=new Map();for(const node of document.querySelectorAll("[id]"))seen.set(node.id,(seen.get(node.id)||0)+1);return [...seen].filter(([,n])=>n>1).map(([id])=>id);});
          assert.deepEqual(dupes,[],`${name} ${size.width}: no duplicate ids`);
          let shown=0;
          for(const id of BUTTONS){
            if(!await page.locator(`#${id}`).isVisible())continue;
            shown+=1;
            // Nothing of Team V's covers the product's button.
            const top=await page.evaluate(id=>{const b=document.getElementById(id),r=b.getBoundingClientRect();const hit=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);return {hit:Boolean(hit&&b.contains(hit)),inView:r.top>=0&&r.bottom<=innerHeight+1&&r.left>=0&&r.right<=innerWidth+1};},id);
            assert.deepEqual(top,{hit:true,inView:true},`${name} ${size.width}: #${id} is on top and on screen`);
            await page.evaluate(()=>{window.__clClicks=[];});
            await page.locator(`#${id}`).click({timeout:5000});
            assert.deepEqual(await page.evaluate(()=>window.__clClicks),[id],`${name} ${size.width}: #${id} reaches the product's handler`);
          }
          assert.ok(shown>=1,`${name} ${size.width}: the stage's action shows`);
          assert.ok(await page.evaluate(()=>document.scrollingElement.scrollWidth<=innerWidth+1),`${name} ${size.width}: no horizontal page scroll`);
        }
      }
      // Team V's decoration is aria-hidden; the product text (title, VS, button labels) is still the product's.
      const a11y=await page.evaluate(()=>{const s=document.getElementById("clubWheelScreen");return {decor:[...s.querySelectorAll("[data-cl-decor]")].filter(n=>n.dataset.clDecor!=="wrap").every(n=>n.getAttribute("aria-hidden")==="true"),
        title:s.querySelector(":scope > h2 .sd-visually-hidden").textContent,confirm:document.getElementById("continueClubAssignment").textContent.trim()};});
      assert.deepEqual(a11y,{decor:true,title:"CLUB ASSIGNMENT",confirm:"CONFIRM RIVALRY & START SHOWDOWN"});
      await page.setViewportSize({width:1920,height:1080});
      await page.evaluate(()=>{window.navigateBackSmart=window.__clBack;});
    });

    check("6 Daniel is left and Nik right; crests show only the clubs the product revealed",async()=>{
      await stage(page,"confirmation");
      // Crest SVGs get fresh internal ids per drawing; compare them without those.
      const sides=await page.evaluate(()=>{const same=(a,b)=>{const n=h=>{const t=document.createElement("div");t.innerHTML=h;return t.innerHTML.replace(/(id="|url\(#|href="#)[^")]*/g,"$1");};return n(a)===n(b);};const s=document.getElementById("clubWheelScreen"),box=id=>document.querySelector(`#${id} .clubCardFace`).getBoundingClientRect();const rims=[...s.querySelectorAll(".panelCrest .crestRim")];
        return {left:box("clubCardOne").left<box("clubCardTwo").left,crests:rims.map((r,i)=>same(r.innerHTML,getClubCrestSvg(["Arsenal","Chelsea"][i]))),names:[document.getElementById("clubNameOne").textContent,document.getElementById("clubNameTwo").textContent]};});
      assert.deepEqual(sides,{left:true,crests:[true,true],names:["Arsenal","Chelsea"]});
      await page.setViewportSize({width:390,height:844});await page.waitForTimeout(400);
      assert.ok(await page.evaluate(()=>document.getElementById("clubCardOne").getBoundingClientRect().top<document.getElementById("clubCardTwo").getBoundingClientRect().top),"phone: Daniel's row first");
      await page.setViewportSize({width:1920,height:1080});
      // Nik's pack sealed (the product has not opened it) although a club name is already in the product node.
      await stage(page,"manager-one",{sealedTwo:SENTINEL});
      const sealed=await page.evaluate(secret=>{const same=(a,b)=>{const n=h=>{const t=document.createElement("div");t.innerHTML=h;return t.innerHTML.replace(/(id="|url\(#|href="#)[^")]*/g,"$1");};return n(a)===n(b);};const s=document.getElementById("clubWheelScreen");const decor=[...s.querySelectorAll("[data-cl-decor], .shieldSlot, .reveal, .rvCrest, .panelCrest, .cl-stage")];
        return {decor:decor.some(n=>n.innerHTML.includes(secret)||n.textContent.includes(secret)),count:document.documentElement.outerHTML.split(secret).length-1,rimTwo:s.querySelectorAll(".panelCrest .crestRim")[1].innerHTML,rimOne:same(s.querySelectorAll(".panelCrest .crestRim")[0].innerHTML,getClubCrestSvg("Arsenal"))};},SENTINEL);
      assert.deepEqual(sealed,{decor:false,count:1,rimTwo:"",rimOne:true},"the sealed club is only in the product's own node");
    });

    check("7 the shared flow's status line and season panel stay the product's nodes and sit inside the screen",async()=>{
      await stage(page,"confirmation");
      await page.evaluate(()=>{
        // Shaped as js/productionSharedShowdownPresentation.js creates them (ssjpSetSharedStatus / ssjpEnsureSeasonPanel).
        const s=document.getElementById("clubWheelScreen");
        const status=document.createElement("p");status.id="sharedShowdownPresentationStatus";status.className="stateNote";status.setAttribute("role","status");status.textContent="FINAL CONFIRMATION · Each manager confirms on their own device.";s.insertBefore(status,s.firstChild);
        const panel=document.createElement("section");panel.id="sharedShowdownSeasonChoice";panel.className="clubRivalryConfirmation sharedShowdownSeasonPanel";
        panel.innerHTML='<span class="screenEyebrow">SHARED SHOWDOWN · FINAL SETUP</span><h3>5 SEASONS LOCKED</h3><p class="stateNote" data-shared-season-copy="true">Daniel\'s original season choice is authoritative and identical on this device.</p><div class="sharedSeasonChoices"><button type="button" class="compactButton hidden" data-shared-season="1">1 SEASON</button></div>';
        document.getElementById("clubRivalryConfirmation").insertAdjacentElement("afterend",panel);
      });
      for(const size of [{width:390,height:844},{width:1920,height:1080},{width:1920,height:910}]){
        await page.setViewportSize(size);await page.waitForTimeout(400);
        const boxes=await page.evaluate(()=>{const r=id=>document.getElementById(id).getBoundingClientRect(),inside=b=>b.width>0&&b.top>=0&&b.left>=0&&b.right<=innerWidth+1&&b.bottom<=innerHeight+1;
          const overlap=(a,b)=>a.left<b.right&&b.left<a.right&&a.top<b.bottom&&b.top<a.bottom;
          const status=r("sharedShowdownPresentationStatus"),panel=r("sharedShowdownSeasonChoice"),action=r("continueClubAssignment"),confirm=r("clubRivalryConfirmation");
          return {status:inside(status),panel:inside(panel),clearOfAction:!overlap(status,action)&&!overlap(panel,action),clearOfConfirmation:!overlap(panel,confirm)&&!overlap(status,confirm),
            visible:[status,panel].every(b=>{const hit=document.elementFromPoint(b.left+b.width/2,b.top+b.height/2);return Boolean(hit&&(document.getElementById("sharedShowdownPresentationStatus").contains(hit)||document.getElementById("sharedShowdownSeasonChoice").contains(hit)));})};});
        assert.deepEqual(boxes,{status:true,panel:true,clearOfAction:true,clearOfConfirmation:true,visible:true},`${size.width}x${size.height}`);
      }
      await page.setViewportSize({width:1920,height:1080});
      await page.evaluate(()=>{document.getElementById("sharedShowdownPresentationStatus").remove();document.getElementById("sharedShowdownSeasonChoice").remove();});
    });

    check("8 leaving the screen restores the product's section, <html> and stylesheets exactly",async()=>{
      await stage(page,"ready");
      await page.evaluate(()=>showScreen("mainMenu"));
      await page.waitForFunction(()=>!window.CareerModeClubScreenV10.isMounted(),null,{timeout:10000});
      await page.waitForTimeout(300);
      const after=await page.evaluate(()=>{const s=document.getElementById("clubWheelScreen"),html=document.documentElement;
        return {html:s.innerHTML,attrs:[...s.attributes].map(a=>[a.name,a.value]).filter(([n])=>n!=="class"),on:s.classList.contains("cl-on"),rootClasses:["phone","desktop","compact","ready","scrolly"].filter(c=>html.classList.contains(c)),
          rootProps:["--s","--k","--btnTop","--vsFs"].filter(p=>html.style.getPropertyValue(p)),screen:html.dataset.v10Screen||null,
          sheets:[...document.querySelectorAll("link[data-v10-style]")].filter(l=>/club\/club\.css|v10Club\.css/.test(l.getAttribute("data-v10-style"))).map(l=>l.disabled||!l.sheet||l.sheet.disabled)};});
      // The reference: the same product calls on the same page without Team V's look (its adapter never loads).
      const plain=await context.newPage();
      await plain.route(/\/js\/clubScreenV10\.js/,route=>route.abort());
      await plain.goto(`http://127.0.0.1:${port}/index.html`,{waitUntil:"load"});
      await plain.waitForFunction(()=>window.CareerModeV10Screens&&typeof window.showScreen==="function"&&typeof window.ensureGameplayModules==="function",null,{timeout:30000});
      await plain.evaluate(()=>window.ensureGameplayModules());
      await plain.evaluate(setup=>(0,eval)(`(${setup})`)(),productSetup.toString());
      for(const [name,extra] of stageLog)await productStage(plain,name,extra);
      await plain.evaluate(()=>showScreen("mainMenu"));await plain.waitForTimeout(300);
      const reference=await plain.evaluate(()=>{const s=document.getElementById("clubWheelScreen");return {html:s.innerHTML,attrs:[...s.attributes].map(a=>[a.name,a.value]).filter(([n])=>n!=="class")};});
      assert.equal(await plain.evaluate(()=>Boolean(window.CareerModeClubScreenV10)),false,"the reference ran without the adapter");
      await plain.close();
      // The licensed photo finishing its load is timing, not markup.
      const photo=html=>html.replace(/ imageLoaded(?=")/g,"");
      after.html=photo(after.html);reference.html=photo(reference.html);
      if(after.html!==reference.html){let i=0;while(after.html[i]===reference.html[i])i+=1;
        assert.fail(`the section's markup is the product's own; first difference at ${i}:\n  skin:    ${after.html.slice(Math.max(0,i-120),i+200)}\n  product: ${reference.html.slice(Math.max(0,i-120),i+200)}`);}
      // showScreen marks the section hidden again; everything else is the product's own markup.
      const attrs=reference.attrs.filter(([n])=>n!=="aria-hidden"),afterAttrs=after.attrs.filter(([n])=>n!=="aria-hidden");
      assert.deepEqual(afterAttrs,attrs);
      assert.deepEqual({on:after.on,rootClasses:after.rootClasses,rootProps:after.rootProps},{on:false,rootClasses:[],rootProps:[]});
      assert.notEqual(after.screen,"clubWheelScreen","<html> no longer names the Club screen (the menu's own Team V look may)");
      assert.ok(after.sheets.length===2&&after.sheets.every(Boolean),`Team V's club stylesheets are off: ${JSON.stringify(after.sheets)}`);
      const nodes=await page.evaluate(ids=>ids.every(id=>document.getElementById(id)===window.__clNodes.get(id)),original.ids);
      assert.ok(nodes,"every product node is the original element");
      assert.deepEqual(pageErrors.filter(message=>/club|v10|plate|ClubPlate/i.test(message)),[],"no page errors from the skin");
      assert.deepEqual(await page.evaluate(()=>window.__clLoopErrors),[],"mounting and resizing the skin never leaves a ResizeObserver loop error");
      assert.equal(await page.evaluate(()=>Boolean(document.getElementById("appRuntimeNotice"))),false,"no error toast was shown during the browser checks");
    });
    for(const [name,fn] of checks.splice(checks.findIndex(([n])=>n.startsWith("5 ")))){await fn();console.log(`ok ${name}`);}
  }finally{
    if(browser)await browser.close().catch(()=>{});
    server.kill();
  }
}

(async()=>{
  const sync=checks.slice();checks.length=0;
  for(const [name,fn] of sync){await fn();console.log(`ok ${name}`);}
  await browserChecks();
  console.log("PASS v10 club contracts: 8 checks.");
})().catch(error=>{console.error(error);process.exit(1);});
