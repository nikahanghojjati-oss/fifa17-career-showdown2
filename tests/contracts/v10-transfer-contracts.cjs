#!/usr/bin/env node
"use strict";
// G-13 part 2d (job 27) contract: Team V's Transfer War skin (visual-assets/v10_1/tr2/slice-02-plate, Team V
// 5e05a1f) on the shared Transfer Challenge screen. Skin, don't rewire:
// - js/transferScreenV10.js moves the production elements themselves into Team V's layout. Every listed id still
//   exists once, is the same element, and still reaches the production module's click handler after mount.
// - The rival's private guesses and signings never reach the frame, Team V's fixtures or the rendered text before
//   the provider reveals them (COMPLETED, not a replay).
// - The clock on the sign is production's own #transferTimerDisplay (its real view), never a Team V copy.
// - Loading stays lazy: index.html, the startup line and RUNTIME_REVISION are unchanged; Team V files are shell
//   cached, images use job 24's runtime image cache. Team V's files are byte-identical to 5e05a1f except the four
//   marked plate.js lines.
// The browser checks run the real app page (index.html) in the pinned Chromium with a stand-in for the shared
// provider view, so no Firebase or network is used.
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

const TV=require(path.join(ROOT,"js/transferScreenV10.js"));
const DIR="visual-assets/v10_1/tr2/slice-02-plate/";
const SENTINEL="ZQXRIVALSECRET";
const CONTROL_IDS=JSON.parse(/const CONTROL_IDS=Object\.freeze\((\[[^\]]+\])\)/.exec(read("js/productionSharedTransferChallenge.js"))[1]);

// Team V 5e05a1f bytes (plate.js: before the four "App (JOB-27)" lines).
const TEAM_V={
  "plate.js":"d294be928cdebcded385fd4e3e895de1e35269c36b6b7dd6f305698b70d7b040",
  "plate.css":"b876161a1d84367d6e8c6744431fbb726995496ff45d2549d773550c8cf61d3a",
  "platemap.json":"5667a6e102cbdedef8616031eda759771d585841113280e09dee1a32dff909b9",
  "assets/DER_TR2_PLATE_G_GLASS_C_V1.png":"b5c16f7491e9c30bf2e44478e552a26b3ef827df9d8d6787f8b47374910bc753",
  "assets/ENV_TR2_PLATE_G_LOCKED_V1_1672.webp":"fc982425ed87ed54ccf4d8da1daa3a8530b026a17beb2d7bc4e4262ac967e494",
  "assets/ENV_TR2_PLATE_G_LOCKED_V1_3344.webp":"bde994738d4ad3dd78c2cfa05621b780772150e1406304e33175d11916bd0443",
  "assets/ENV_TRANSFER_PHONE_V1.webp":"0effe0edb3159888b4417201ffafa806a3435a1f94cf2630408b7b96dd3b6bd1",
  "assets/OVL_NIK_FINGERTIP_V1_1672.png":"09aa42ae27b63157cd89ce61ed75515b48b5c219f5828e27ca2b8b15f6b3cd50",
  "assets/OVL_NIK_FINGERTIP_V1_3344.png":"36ebfa43f2a1717be42f8a3e5dc708d1455de5fda4ea1be6f33ac42cd2fa136d",
  "assets/OVL_TRANSFER_DANIEL_PHONE_V1.webp":"b57581b59b461ef11fa38e19e665103b3fb716e788a0e96ef315d3704ced351a",
  "assets/OVL_TRANSFER_NIK_PHONE_V1.webp":"c15f8a2df3892472895978ae3f8ba029ee5b0a1dafa3afac9bbe10e03906c929",
  "assets/fonts/barlow-condensed-latin-600-normal.woff2":"215a93c696f442034a46fbb382958f753fda60e30490683aeea6b235fcbb2b66",
  "assets/fonts/barlow-condensed-latin-700-normal.woff2":"3787a5a419171630e6890cfa47c4da067474d005cd0ff8dc11ec090fdc3ee2b8",
  "assets/fonts/barlow-latin-400-normal.woff2":"b0a8ad37ac45f5fb22ced461576db72e44e295107aad7a9c8a7a4bad728fd03b",
  "assets/fonts/barlow-latin-600-normal.woff2":"4b52ddd4836b592df0e4832b8286956883cdc651b015126bdd18f184b7f90cc3",
  "../../shared/wordmarks/TITLE_TRANSFER_V1.webp":"692130a00695e41554036cd20061adcb9e1cf51c9384eda1ec108dfa86b8263d"
};

// ---- the provider view shapes (js/productionSharedTransferChallenge.js getState()) ----
const STEP={WINDOW_OPEN:"window",GUESS_ENTRY:"guess_entry",SIGNING_ENTRY:"signing_entry",COMPLETED:"completed"};
const rivalInputs=()=>({guesses:[{slot:1,type:"league",valueId:SENTINEL+"LEAGUE"}],signings:[{slot:1,name:SENTINEL+" Signing",leagueId:SENTINEL+"L",nationalityId:SENTINEL+"N"}]});
const ownInputs=()=>({guesses:[{slot:1,type:"nationality",valueId:"OWNGUESS"}],signings:[{slot:1,name:"Own Signing",leagueId:"OWNL",nationalityId:"OWNN"}]});
const revealVerdicts=()=>({playerOne:[{slot:1,name:"Daniel Revealed",leagueId:"PL",nationalityId:"ENG",release:false}],playerTwo:[{slot:1,name:SENTINEL+" Signing",leagueId:"SA",nationalityId:"BRA",release:true}]});
function view(phase,role,extra={}){
  return {ok:true,revision:3,managerRole:role,seasonNumber:1,state:{phase,endRequestedRoles:[],guessLockedRoles:[],signingLockedRoles:[],...(extra.state||{})},
    ownInputs:ownInputs(),opponentInputs:"opponentInputs" in extra?extra.opponentInputs:rivalInputs(),verdicts:"verdicts" in extra?extra.verdicts:revealVerdicts()};
}
const frameInput=(phase,role,extra={})=>({active:true,view:view(phase,role,extra),step:STEP[phase],replay:extra.replay||"",status:"STATUS LINE",
  managers:{playerOne:"Daniel",playerTwo:"Nik"},clubs:{playerOne:"Sampdoria",playerTwo:"Chievo"},label:(kind,id)=>({label:`${kind}:${id}`})});

check("1 Team V files are 5e05a1f bytes; plate.js differs only by the four marked app lines",()=>{
  for(const [file,hash] of Object.entries(TEAM_V)){
    if(file==="plate.js")continue;
    assert.equal(sha256(fs.readFileSync(path.join(ROOT,DIR,file))),hash,file);
  }
  const plate=read(DIR+"plate.js"),marked=plate.split("\n").filter(line=>/App \(JOB-27\)|ASSET_BASE \+/.test(line));
  assert.equal(marked.length,4,"four edited lines");
  const original=plate.split("\n").filter(line=>!line.includes('var ASSET_BASE = window.TRANSFER_WAR_BASE || ""; // App (JOB-27)')).join("\n")
    .replace('ASSET_BASE + "../../shared/wordmarks/TITLE_TRANSFER_V1.webp"','"../../shared/wordmarks/TITLE_TRANSFER_V1.webp"')
    .replace('ASSET_BASE + "assets/ENV_TR2_PLATE_G_LOCKED_V1_"','"assets/ENV_TR2_PLATE_G_LOCKED_V1_"')
    .replace(' || window.TRANSFER_WAR_APP) return; // App (JOB-27): the app passes the frame',') return;');
  assert.equal(sha256(Buffer.from(original)),TEAM_V["plate.js"],"plate.js minus the marked edits is Team V's");
  for(const banned of ["index.html","preview.html","fixtures.json","evidence","review"])assert.ok(!fs.existsSync(path.join(ROOT,DIR,banned)),`${banned} not copied`);
});

check("2 the frame is pure, frozen and comes only from the provider view and production's own text",()=>{
  const a=TV.toTransferFrame(frameInput("GUESS_ENTRY","playerTwo")),b=TV.toTransferFrame(frameInput("GUESS_ENTRY","playerTwo"));
  assert.equal(a.key,b.key);assert.ok(Object.isFrozen(a)&&Object.isFrozen(a.managers));
  assert.equal(a.viewer,"playerTwo");assert.equal(a.status,"STATUS LINE");assert.deepEqual({...a.managers},{playerOne:"Daniel",playerTwo:"Nik"});
  for(const input of [{...frameInput("GUESS_ENTRY","playerTwo"),active:false},{...frameInput("GUESS_ENTRY","playerTwo"),view:null},frameInput("GUESS_ENTRY","spectator"),{...frameInput("GUESS_ENTRY","playerOne"),step:"unknown"}])
    assert.equal(TV.toTransferFrame(input),null,"no frame: the app keeps its own screen");
  const fx=TV.toPlateFixtures(a);
  assert.equal(fx.frames.LIVE.viewer,"playerTwo");assert.equal(fx.rival,"playerOne");
  assert.equal(fx.strings.guessHeadingNikViewer,"Guess Daniel's signings");assert.equal(fx.strings.privacyNoteDanielViewer,"Hidden from Nik until you both lock.");
  assert.equal(fx.strings.guessStatus,"STATUS LINE","status line is production's text");
});

check("3 the rival's guesses and signings never reach the frame or Team V's fixtures before the reveal",()=>{
  for(const role of ["playerOne","playerTwo"]){
    for(const phase of ["WINDOW_OPEN","GUESS_ENTRY","SIGNING_ENTRY"]){
      for(const locked of [false,true]){
        const state=locked?{guessLockedRoles:["playerOne","playerTwo"],signingLockedRoles:["playerOne","playerTwo"]}:{};
        const frame=TV.toTransferFrame(frameInput(phase,role,{state}));
        const text=JSON.stringify([frame,TV.toPlateFixtures(frame)]);
        assert.ok(!text.includes(SENTINEL),`${role} ${phase} locked=${locked}: no rival input`);
      }
    }
    // A replay of a completed challenge and a step that is ahead of the provider stay sealed too.
    for(const [phase,extra] of [["COMPLETED",{replay:"COMPLETED"}],["GUESS_ENTRY",{replay:"GUESS_ENTRY"}]]){
      const frame=TV.toTransferFrame({...frameInput(phase,role,extra),replay:extra.replay});
      assert.ok(!JSON.stringify([frame,TV.toPlateFixtures(frame)]).includes(SENTINEL),`${role} replay ${phase}`);
    }
    const ahead=TV.toTransferFrame({...frameInput("SIGNING_ENTRY",role),step:"completed"});
    assert.ok(!JSON.stringify([ahead,TV.toPlateFixtures(ahead)]).includes(SENTINEL),`${role} completed layout before the provider completes`);
    // Own signings read back only once locked.
    const open=TV.toTransferFrame(frameInput("SIGNING_ENTRY",role));assert.deepEqual([...open.ownSignings],[]);
    const own=TV.toTransferFrame(frameInput("SIGNING_ENTRY",role,{state:{signingLockedRoles:[role]}}));
    assert.equal(own.ownSignings[0].name,"Own Signing");assert.equal(own.ownSignings[0].league,"league:OWNL");
  }
  // Revealed: both sides and the guesses that matched, from the provider's verdicts.
  const done=TV.toTransferFrame(frameInput("COMPLETED","playerOne"));
  assert.equal(done.verdicts.rows.playerTwo[0].name,SENTINEL+" Signing");assert.equal(done.verdicts.rows.playerTwo[0].release,true);
  assert.equal(done.verdicts.guessesAgainst.playerOne[0].value,`league:${SENTINEL}LEAGUE`,"Nik's guesses against Daniel");
  assert.equal(done.verdicts.guessesAgainst.playerTwo[0].value,"nationality:OWNGUESS","Daniel's guesses against Nik");
  const fx=TV.toPlateFixtures(done);assert.deepEqual(fx.results.live.playerTwo,[{slot:1,release:true}]);
});

check("4 the adoption plan moves the viewer's own production fields and every production control, never the rival's",()=>{
  const plan=(phase,role,state={})=>TV.adoptionPlan(TV.toTransferFrame(frameInput(phase,role,{state})));
  for(const role of ["playerOne","playerTwo"]){
    const own=role==="playerOne"?"p1":"p2",rival=own==="p1"?"p2":"p1";
    const guess=plan("GUESS_ENTRY",role).ids,signing=plan("SIGNING_ENTRY",role).ids,windowPlan=plan("WINDOW_OPEN",role),done=plan("COMPLETED",role).ids;
    for(let i=1;i<=3;i+=1){
      assert.ok(guess.includes(`${rival}Guess${i}Type`)&&guess.includes(`${rival}Guess${i}Value`),"guesses are named after the manager they target");
      assert.ok(!guess.some(id=>id.startsWith(`${own}Guess`)),"never the rival's guesses");
      assert.ok(signing.includes(`${own}Signing${i}Name`)&&signing.includes(`${own}Signing${i}League`)&&signing.includes(`${own}Signing${i}Nationality`));
      assert.ok(!signing.some(id=>id.startsWith(`${rival}Signing`)),"never the rival's signings");
    }
    assert.ok(windowPlan.ids.includes("transferTimerDisplay"),"the clock is production's element");
    for(const ids of [guess,signing,windowPlan.ids,done])for(const id of ["transferChallengeError","refreshSharedTransferChallenge"])assert.ok(ids.includes(id),id);
    const controls=new Set([...windowPlan.ids,...windowPlan.extras,...guess,...signing,...done,...plan("GUESS_ENTRY",role).extras,...plan("SIGNING_ENTRY",role).extras]);
    for(const id of CONTROL_IDS.filter(id=>id!=="seasonPrimaryAction"))assert.ok(controls.has(id),`${id} is placed in Team V's layout`);
    assert.ok(!plan("SIGNING_ENTRY",role,{signingLockedRoles:[role]}).ids.some(id=>/Signing\d/.test(id)),"locked signings read back as text");
  }
  const fx=TV.toPlateFixtures(TV.toTransferFrame(frameInput("WINDOW_OPEN","playerOne")));
  assert.equal(fx.frames.LIVE.timerSeconds,0,"Team V's demo clock is never used");
  assert.ok(!/\d{1,2}:\d{2}/.test(JSON.stringify(fx)),"no clock text in the fixtures");
});

check("5 lazy loading: index.html, the startup line and RUNTIME_REVISION unchanged; files shell-cached; images runtime-cached",()=>{
  const html=read("index.html"),sw=read("service-worker.js"),ssjr=read("js/ssjr.js");
  for(const banned of ["transferScreenV10","v10Transfer","tr2/"])assert.ok(!html.includes(banned),banned);
  const refs=[...html.matchAll(/(?:src|href)="((?:js|css|data)\/[^"?#]+)(?:\?v=([^"#]+))?/g)].map(m=>m[1]);
  assert.ok(!refs.includes("js/ssjr.js")&&!refs.includes("js/transferScreenV10.js"),"not a startup script");
  const gzip=refs.reduce((total,ref)=>total+zlib.gzipSync(fs.readFileSync(path.join(ROOT,ref)),{level:9}).length,0);
  assert.ok(gzip<=37495,`startup gzip ${gzip} must stay <= 37495`);
  assert.match(ssjr,/load\("v10-transfer","js\/transferScreenV10\.js",\(\)=>root\.CareerModeTransferScreenV10\)\.then\(\(\)=>root\.CareerModeTransferScreenV10\.install\(\)\)/);
  assert.match(ssjr,/requestIdleCallback\(v10Transfer/);
  const shell=new Set([...sw.matchAll(/^\s+"([^"]+)",?$/gm)].map(m=>m[1]));
  const imageRule=new RegExp(/const V10_IMAGE_PATH = \/(.+)\/i;/.exec(sw)[1],"i");
  for(const file of ["js/transferScreenV10.js","css/v10Transfer.css",DIR+"plate.css",DIR+"plate.js",DIR+"platemap.json"])assert.ok(shell.has(file),`shell lists ${file}`);
  for(const file of Object.keys(TEAM_V)){
    const full=path.posix.normalize(DIR+file);
    if(/\.(webp|png)$/.test(full)){assert.ok(imageRule.test(full),full);assert.ok(!shell.has(full),`${full} not precached`);}
    else if(/\.woff2$/.test(full))assert.ok(shell.has(full),`${full} shell cached`);
  }
  assert.deepEqual([...TV.FILES.css],[ "tr2/slice-02-plate/plate.css","../../css/v10Transfer.css"]);
  const source=read("js/transferScreenV10.js");
  for(const banned of ["localStorage","sessionStorage","indexedDB","firestore","Firestore","cloneNode","RUNTIME_REVISION"])assert.ok(!source.includes(banned),`transferScreenV10.js has no ${banned}`);
  assert.ok(!source.includes("opponentInputs")||/actual==="COMPLETED"&&!replay/.test(source),"opponentInputs are read only behind the COMPLETED, non-replay gate");
});

// ---- browser: the real app page in the pinned Chromium ----
function freePort(){return new Promise((resolve,reject)=>{const server=net.createServer();server.unref();server.on("error",reject);server.listen(0,"127.0.0.1",()=>{const {port}=server.address();server.close(()=>resolve(port));});});}
async function waitForServer(port){for(let i=0;i<100;i+=1){const ok=await new Promise(resolve=>{const socket=net.connect(port,"127.0.0.1",()=>{socket.end();resolve(true);});socket.on("error",()=>resolve(false));});if(ok)return;await new Promise(resolve=>setTimeout(resolve,100));}throw new Error("static server did not start");}

// Runs in the page: emulate what the production module renders for one phase, then let the skin draw it.
async function stage(page,phase,role,extra={}){
  await page.evaluate(async({phase,role,extra,SENTINEL,STEP})=>{
    const $=id=>document.getElementById(id),section=$("transferChallenge");
    // The harness blocks the service worker; the app's toast about it is not part of this screen.
    const notice=$("appRuntimeNotice");if(notice)notice.remove();
    const view={ok:true,revision:3,managerRole:role,seasonNumber:1,state:{phase,endRequestedRoles:[],guessLockedRoles:[],signingLockedRoles:[]},
      ownInputs:{guesses:[],signings:[]},opponentInputs:{guesses:[{slot:1,type:"league",valueId:SENTINEL}],signings:[{slot:1,name:SENTINEL,leagueId:SENTINEL,nationalityId:SENTINEL}]},
      verdicts:extra.verdicts||{playerOne:[{slot:1,name:SENTINEL,leagueId:"x",nationalityId:"y",release:false}],playerTwo:[]}};
    window.__tvView=view;
    window.CareerModeProductionSharedTransferChallenge={isActive:()=>window.__tvActive!==false,getState:()=>window.__tvView};
    window.__tvActive=true;
    const own=role==="playerOne"?"p1":"p2",rival=own==="p1"?"p2":"p1";
    $("transferManagerOne").textContent="Daniel";$("transferManagerTwo").textContent="Nik";$("transferClubOne").textContent="Sampdoria";$("transferClubTwo").textContent="Chievo";
    $("transferPhaseStatus").textContent=extra.status||"TRANSFER WINDOW LIVE · BUILD YOUR FIFA 17 SQUAD";
    for(const id of ["startTransferTimer","endTransferTimer","completeTransferChallenge","continueFromTransfers"])$(id).classList.add("hidden");
    if(!$("refreshSharedTransferChallenge")){const b=document.createElement("button");b.id="refreshSharedTransferChallenge";b.className="menuButton";b.type="button";b.textContent="REFRESH SHARED CHALLENGE";section.querySelector(".transferTimerActions").appendChild(b);}
    if(phase==="WINDOW_OPEN"){$("endTransferTimer").classList.remove("hidden");$("endTransferTimer").textContent="REQUEST EARLY END";$("transferTimerDisplay").textContent="14:59";}
    if(phase==="GUESS_ENTRY"||phase==="SIGNING_ENTRY"){$("completeTransferChallenge").classList.remove("hidden");$("completeTransferChallenge").textContent=phase==="GUESS_ENTRY"?"LOCK MY GUESSES":"LOCK MY SIGNINGS";}
    if(phase==="COMPLETED"){$("continueFromTransfers").classList.remove("hidden");$("continueFromTransfers").textContent="CONTINUE TO SHARED SEASON RESULTS";}
    if(phase==="SIGNING_ENTRY"&&!$("transferPhaseLockSummary")){const s=document.createElement("div");s.id="transferPhaseLockSummary";s.className="transferPhaseLockSummary";s.textContent="Both managers locked their private guesses.";section.insertBefore(s,section.querySelector(".transferManagersGrid"));}
    // The rival's private fields keep values on this device only in the hidden production cards.
    for(let i=1;i<=3;i+=1){$(`${own}Guess${i}Value`).value=SENTINEL;$(`${rival}Signing${i}Name`).value=SENTINEL;}
    for(let i=1;i<=3;i+=1){$(`${rival}Guess${i}Value`).value="";$(`${own}Signing${i}Name`).value="";}
    section.dataset.transferPhase=STEP[phase];delete section.dataset.sharedTransferReplay;
    // The app shows the screen (production routes there with navigateTo once the shared view is ready).
    if(window.getActiveScreenName()!=="transferChallenge"){for(const screen of document.querySelectorAll(".screen"))screen.classList.add("hidden");section.classList.remove("hidden");window.getActiveScreenName=()=>"transferChallenge";}
    await window.CareerModeV10Screens.show("transferChallenge");
  },{phase,role,extra,SENTINEL,STEP});
  await page.waitForFunction(()=>window.CareerModeTransferScreenV10.isMounted()&&document.querySelector("#transferChallenge > .tw-host .stage .world"),null,{timeout:20000});
  await page.waitForTimeout(400);
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
    const context=await browser.newContext({viewport:{width:1440,height:900},serviceWorkers:"block"});
    const page=await context.newPage();
    const pageErrors=[];page.on("pageerror",error=>pageErrors.push(String(error&&error.message||error)));
    await page.goto(`http://127.0.0.1:${port}/index.html`,{waitUntil:"load"});
    await page.waitForFunction(()=>window.CareerModeTransferScreenV10&&window.CareerModeV10Screens&&typeof window.showScreen==="function",null,{timeout:30000});
    await page.evaluate(()=>window.CareerModeTransferScreenV10.install());
    // Production's handler: one capture listener on document that acts on CONTROL_IDS buttons. The test listener
    // sits at the same place and records what reaches it (and stops it, so the local app does nothing).
    await page.evaluate(ids=>{window.__tvClicks=[];document.addEventListener("click",event=>{const button=event.target&&event.target.closest&&event.target.closest("button");if(button&&ids.includes(button.id)){window.__tvClicks.push(button.id);event.preventDefault();event.stopImmediatePropagation();}},true);},CONTROL_IDS);

    const results={};
    check("6 after mount every listed production id exists once, is the same element and reaches the click handler (390 and 1440)",async()=>{
      for(const [phase,role] of [["WINDOW_OPEN","playerOne"],["GUESS_ENTRY","playerTwo"],["SIGNING_ENTRY","playerOne"],["COMPLETED","playerTwo"]]){
        const plan=TV.adoptionPlan(TV.toTransferFrame(frameInput(phase,role)));
        await page.evaluate(ids=>{window.__tvOriginal=new Map(ids.map(id=>[id,document.getElementById(id)]));},[...plan.ids,...plan.extras]);
        await stage(page,phase,role);
        // Production's refresh button has its own listener (added when production created it).
        await page.evaluate(()=>{window.__tvOwnClicks=[];const r=document.getElementById("refreshSharedTransferChallenge");if(!r.__tvProbe){r.__tvProbe=true;r.addEventListener("click",event=>{event.preventDefault();event.stopImmediatePropagation();window.__tvOwnClicks.push("refresh");});}});
        const state=await page.evaluate(ids=>ids.map(id=>{const nodes=document.querySelectorAll(`[id="${id}"]`),node=nodes[0];return {id,count:nodes.length,same:window.__tvOriginal.get(id)===node||!window.__tvOriginal.get(id),inHost:Boolean(node&&node.closest(".tw-host")),tag:node&&node.tagName};}),plan.ids);
        for(const entry of state){
          if(entry.count===0&&!["transferPhaseLockSummary"].includes(entry.id))assert.fail(`${phase}: ${entry.id} missing`);
          if(!entry.count)continue;
          assert.equal(entry.count,1,`${phase}: ${entry.id} exists once`);assert.ok(entry.same,`${phase}: ${entry.id} is production's element`);
          assert.ok(entry.inHost,`${phase}: ${entry.id} is in Team V's layout`);
        }
        const dupes=await page.evaluate(()=>{const seen=new Map();for(const node of document.querySelectorAll("[id]"))seen.set(node.id,(seen.get(node.id)||0)+1);return [...seen].filter(([,n])=>n>1).map(([id])=>id);});
        assert.deepEqual(dupes,[],`${phase}: no duplicate ids`);
        for(const size of [{width:390,height:844},{width:1440,height:900}]){
          await page.setViewportSize(size);await page.waitForTimeout(500);
          const buttons=plan.ids.filter(id=>CONTROL_IDS.includes(id));
          for(const id of buttons){
            if(!await page.locator(`#${id}`).isVisible())continue;
            await page.evaluate(()=>{window.__tvClicks=[];});
            await page.locator(`#${id}`).click({timeout:5000});
            assert.deepEqual(await page.evaluate(()=>window.__tvClicks),[id],`${phase} ${size.width}: ${id} reaches the module's handler`);
          }
          const visible=await page.evaluate(ids=>ids.filter(id=>{const n=document.getElementById(id);return n&&!n.classList.contains("hidden")&&n.getClientRects().length>0;}),buttons);
          assert.ok(visible.length>=1,`${phase} ${size.width}: the phase action shows`);
          await page.evaluate(()=>{window.__tvOwnClicks=[];});
          await page.locator("#refreshSharedTransferChallenge").click({timeout:5000});
          assert.deepEqual(await page.evaluate(()=>window.__tvOwnClicks),["refresh"],`${phase} ${size.width}: refresh keeps its own listener`);
          const scroll=await page.evaluate(()=>({doc:document.scrollingElement.scrollWidth<=window.innerWidth+1}));
          assert.ok(scroll.doc,`${phase} ${size.width}: no horizontal page scroll`);
        }
        await page.setViewportSize({width:1440,height:900});
        if(phase==="GUESS_ENTRY"||phase==="SIGNING_ENTRY"){
          const field=phase==="GUESS_ENTRY"?(role==="playerOne"?"p2Guess1Type":"p1Guess1Type"):(role==="playerOne"?"p1Signing1Name":"p2Signing1Name");
          const card=await page.evaluate(id=>Boolean(document.getElementById(id).closest(".tw-host .transferGuessCard, .tw-host .transferManagerCard")),field);
          assert.ok(card,`${phase}: production still finds the viewer's card from ${field}`);
        }
      }
      results.mounted=true;
    });

    check("7 the rival's private inputs never appear in rendered text before the reveal",async()=>{
      for(const [phase,role] of [["WINDOW_OPEN","playerTwo"],["GUESS_ENTRY","playerOne"],["GUESS_ENTRY","playerTwo"],["SIGNING_ENTRY","playerOne"],["SIGNING_ENTRY","playerTwo"]]){
        await stage(page,phase,role);
        const leak=await page.evaluate(secret=>{const host=document.querySelector("#transferChallenge > .tw-host");const values=[...host.querySelectorAll("input,select,textarea")].map(n=>n.value);return {text:document.body.innerText.includes(secret),host:host.innerText.includes(secret)||host.innerHTML.includes(secret),values:values.some(v=>String(v).includes(secret))};},SENTINEL);
        assert.deepEqual(leak,{text:false,host:false,values:false},`${role} ${phase}`);
      }
      // A replay of a completed challenge stays sealed; the live reveal shows both sides.
      await stage(page,"COMPLETED","playerTwo");
      assert.ok(await page.evaluate(secret=>document.querySelector("#transferChallenge > .tw-host").innerText.includes(secret),SENTINEL),"revealed after both locked");
      await page.evaluate(async()=>{const s=document.getElementById("transferChallenge");s.dataset.sharedTransferReplay="GUESS_ENTRY";s.dataset.transferPhase="guess_entry";await window.CareerModeV10Screens.show("transferChallenge");});
      await page.waitForTimeout(300);
      assert.ok(!await page.evaluate(secret=>document.body.innerText.includes(secret),SENTINEL),"a replay step is sealed");
    });

    check("8 the clock on the sign is production's #transferTimerDisplay and follows it without a redraw",async()=>{
      await stage(page,"WINDOW_OPEN","playerOne");
      const first=await page.evaluate(()=>{const host=document.querySelector("#transferChallenge > .tw-host"),timer=document.getElementById("transferTimerDisplay");host.querySelector(".stage").dataset.tvProbe="1";return {inHost:host.contains(timer),text:timer.textContent.trim(),shows:host.innerText.includes("14:59"),teamVClock:host.querySelectorAll("[id='tw-transferTimerDisplay']").length};});
      assert.deepEqual(first,{inHost:true,text:"14:59",shows:true,teamVClock:0});
      await page.evaluate(()=>{document.getElementById("transferTimerDisplay").firstChild.nodeValue="12:34";});
      await page.waitForTimeout(150);
      const next=await page.evaluate(()=>{const host=document.querySelector("#transferChallenge > .tw-host");return {shows:host.innerText.includes("12:34"),old:host.innerText.includes("14:59"),same:host.querySelector(".stage").dataset.tvProbe==="1"};});
      assert.deepEqual(next,{shows:true,old:false,same:true});
      for(const size of [{width:390,height:844}]){await page.setViewportSize(size);await page.waitForTimeout(300);
        assert.equal(await page.evaluate(()=>document.querySelector("#transferChallenge > .tw-host .sign-status").dataset.clock),"12:34","the phone band repeats production's clock");}
      await page.setViewportSize({width:1440,height:900});
    });

    check("9 leaving the shared view puts every production element back where it was, with its own classes",async()=>{
      await page.evaluate(()=>{window.__tvActive=false;});
      await page.evaluate(()=>window.CareerModeV10Screens.show("transferChallenge"));
      await page.waitForTimeout(200);
      const after=await page.evaluate(()=>({host:Boolean(document.querySelector("#transferChallenge > .tw-host")),on:document.getElementById("transferChallenge").classList.contains("tw-on"),
        timer:document.getElementById("transferTimerDisplay").parentElement.className,end:document.getElementById("endTransferTimer").parentElement.className,endClass:document.getElementById("endTransferTimer").className,
        status:document.getElementById("transferPhaseStatus").parentElement.className,back:document.querySelector("#transferChallenge > .seasonEntryActions .backButton")!==null,
        guess:document.getElementById("p1Guess1Type").closest(".guessRow")!==null,signing:document.getElementById("p1Signing1Name").closest(".signingRow")!==null,markers:[...document.getElementById("transferChallenge").querySelectorAll("*")].length>0}));
      assert.deepEqual(after,{host:false,on:false,timer:"transferHero",end:"transferTimerActions",endClass:"menuButton",status:"transferHero",back:true,guess:true,signing:true,markers:true});
      assert.deepEqual(pageErrors.filter(message=>/transfer|v10|plate|TWPlate/i.test(message)),[],"no page errors from the skin");
    });
    for(const [name,fn] of checks.splice(checks.findIndex(([n])=>n.startsWith("6 ")))){await fn();console.log(`ok ${name}`);}
  }finally{
    if(browser)await browser.close().catch(()=>{});
    server.kill();
  }
}

(async()=>{
  const sync=checks.slice();checks.length=0;
  for(const [name,fn] of sync){await fn();console.log(`ok ${name}`);}
  await browserChecks();
  console.log("PASS v10 transfer contracts: 9 checks.");
})().catch(error=>{console.error(error);process.exit(1);});
