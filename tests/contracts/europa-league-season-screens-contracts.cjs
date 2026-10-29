"use strict";
// r80 Europa League on the season flow screens (R80_EUROPA_PLAN PR 3a; owner rules Nik 2026-10-19). Node only; no emulator.
// A club plays the Champions League (CL) or the Europa League (EL) in a season, never both; EL winner +3, CL winner +5; a season
// still scores at most 11 (an EL season at most 9). Daniel and Nik play DIFFERENT FIFA saves, so both may win the same trophy or
// share a league position: nothing compares or refuses across the two managers. Only ONE manager ticking CL and EL is refused.
//   E1  shared entry form: ticking EL unticks CL and ticking CL unticks EL, for that manager only (the rival's boxes never change).
//   E2  shared entry form: the published result carries europaLeague:true only when ticked (8 keys); unticked it is the 7-key
//       r79 shape; CL and EL both ticked (forced) is refused with SEASON_RESULTS_CONTINENTAL_CONFLICT before any publish.
//   E3  shared draft: an EL tick is kept and restored; an unticked EL box leaves the old draft shape byte for byte; the review card
//       shows the Europa League chip.
//   E4  local form (js/seasonEngine.js): reset clears the EL box, the read sets the key only when ticked, the review fingerprint
//       sees EL, both ticked is a validation message, the change handler keeps the boxes exclusive, the review chip and the
//       breakdown line (only for a season that won it).
//   E5  Standings: the Europa Leagues row after Champions Leagues (8 rows, phone board budget 8 rows), frames need the counter.
//   E6  Final Winner: the Europa League honours row (TRO_EUROPA art) and the trophies line; a record without the counter fails closed;
//       the honours grids have five metric rows and the short-window plaque leaves room for them.
//   E7  Rule Book: EL +3 row, never both CL and EL wins in the same season (both count across seasons), the season 1 setup note, the EL final may be played, best season 11 / EL 9.
//   E8  text lines: canonical breakdown and Shared History trophy line name the Europa League only when it was won; the scoring
//       panel and the entry hint list EL +3 and keep the maximum 11; the entry form has an EL box right after each CL box.
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");

const ROOT=path.resolve(__dirname,"../..");
const read=file=>fs.readFileSync(path.join(ROOT,file),"utf8");
const RIVALRY="pair_"+"a".repeat(64);
const SESSION="session_"+"c".repeat(64);
const DEVICE="device_"+"d".repeat(32);
let checks=0;
const ok=label=>{checks+=1;console.log(`ok ${checks} ${label}`);};
const SEVEN=["leaguePosition","leaguePoints","leagueGoals","domesticCup","championsLeague","topScorer","topAssist"];

function makeDevice(){
  const store=new Map();
  const localStorage=new Proxy({},{
    get:(_t,name)=>name==="getItem"?key=>store.has(key)?store.get(key):null:name==="setItem"?(key,value)=>{store.set(String(key),String(value));}:name==="removeItem"?key=>{store.delete(key);}:name==="length"?store.size:name==="key"?index=>[...store.keys()][index]??null:undefined,
    ownKeys:()=>[...store.keys()],
    getOwnPropertyDescriptor:(_t,name)=>store.has(name)?{enumerable:true,configurable:true,value:store.get(name)}:undefined
  });
  return {store,localStorage};
}
function makeNode(id){
  const classes=new Set();
  const node={id,textContent:"",value:"",checked:false,disabled:false,dataset:{},attributes:{},children:[],className:"",
    classList:{toggle(name,force){const on=force===undefined?!classes.has(name):Boolean(force);if(on)classes.add(name);else classes.delete(name);return on;},contains:name=>classes.has(name),add:name=>classes.add(name),remove:name=>classes.delete(name)},
    setAttribute(name,value){node.attributes[name]=String(value);},removeAttribute(name){delete node.attributes[name];},hasAttribute:name=>name in node.attributes,
    closest(selector){return selector==="button"&&node.tagName==="BUTTON"?node:null;},
    append(...items){node.children.push(...items);},appendChild(item){node.children.push(item);return item;},replaceChildren(...items){node.children=[...items];},focus(){}};
  return node;
}
const textOf=node=>[node.textContent||"",...(node.children||[]).map(textOf)].join(" ");
function makeDocument(){
  const nodes=new Map(),listeners=[];
  const document={visibilityState:"visible",
    getElementById(id){if(!nodes.has(id))nodes.set(id,makeNode(id));return nodes.get(id);},
    createElement:tag=>makeNode(`<${tag}>`),createDocumentFragment:()=>makeNode("#fragment"),querySelector:()=>null,
    addEventListener(type,listener,capture){listeners.push({type,listener,capture});}};
  for(const id of ["completeSeason","confirmSeasonCompletion","editSeasonResults"])document.getElementById(id).tagName="BUTTON";
  const fire=(type,id)=>{const target=document.getElementById(id);for(const entry of listeners)if(entry.type===type&&entry.capture===true)entry.listener({target,preventDefault(){},stopPropagation(){},stopImmediatePropagation(){}});};
  return {document,fire,listeners};
}

// The real js/storage.js and js/productionSharedSeasonResults.js in one page context (as qol-3-6-keep-drafts-contracts.cjs).
function openSeasonPage(device,{role="playerOne",published=[]}={}){
  const {document,fire}=makeDocument();
  const store={revision:0,ownResult:null};
  const projection=()=>({ok:true,authoritative:true,managerRole:role,seasonNumber:2,revision:store.revision,state:store.ownResult?{phase:"COLLECTING",revision:store.revision,publishedRoles:[role]}:null,ownResult:store.ownResult?{...store.ownResult}:null,opponentResult:null,allResults:null});
  const provider={read:async()=>projection(),publishResult:async options=>{published.push(JSON.parse(JSON.stringify(options.result)));store.ownResult={...options.result};store.revision+=1;return {...projection(),status:"accepted",replayed:false};}};
  let random=0;
  const sandbox={console:{log(){},warn(){},error(){}},setTimeout,clearTimeout,localStorage:device.localStorage,
    __showdown:{id:"save_"+"e".repeat(24),currentRound:2,totalRounds:3,managers:{playerOne:"Daniel",playerTwo:"Nik"},clubs:{playerOne:"A",playerTwo:"B"},sharedJourney:{contractVersion:1,mode:"shared",rivalryId:RIVALRY}},
    document,
    crypto:{getRandomValues(bytes){for(let i=0;i<bytes.length;i+=1)bytes[i]=(random+i)&255;random+=1;return bytes;}},
    reportApplicationError(){},ensureGameplayModules:async()=>true,
    loadRuntimeScript:async key=>{throw new Error(`unexpected runtime load ${key}`);},
    CareerModeProductionSharedShowdownSetup:{refresh:async()=>true,getState:()=>({ready:true,setup:{phase:"SHOWDOWN_CONFIRMED",revision:6,leagueId:"premier_league",clubs:{playerOne:"A",playerTwo:"B"}},managerRole:role,rivalryId:RIVALRY,sessionId:SESSION,deviceId:DEVICE})},
    CareerModeProductionSharedTransferChallenge:{refresh:async()=>true,getState:()=>({seasonNumber:2,state:{phase:"COMPLETED"}})},
    CareerModeSharedShowdownCatalog:{catalog:{premier_league:new Array(20).fill("club")}},
    CareerModeSharedShowdownSetup:{},CareerModeSharedSeasonResults:{},CareerModeSparkSharedSeasonResults:provider,
    CareerModeProductionFirebaseRuntime:{ensureAccountServices:async()=>({ok:true,auth:{currentUser:{uid:"uid"}},firestore:{},firestoreSdk:{}})}};
  sandbox.window=sandbox;sandbox.globalThis=sandbox;
  vm.createContext(sandbox);
  vm.runInContext(read("js/storage.js"),sandbox,{filename:"js/storage.js"});
  vm.runInContext(`var currentShowdown=globalThis.__showdown;\n${read("js/productionSharedSeasonResults.js")}`,sandbox,{filename:"js/productionSharedSeasonResults.js"});
  const api=sandbox.CareerModeProductionSharedSeasonResults;
  assert.equal(api.install(),true);
  const prefix=role==="playerOne"?"p1":"p2",rival=role==="playerOne"?"p2":"p1";
  const field=(suffix,p=prefix)=>document.getElementById(`${p}${suffix}`);
  const type=(suffix,value)=>{field(suffix).value=String(value);fire("input",`${prefix}${suffix}`);};
  const tick=(suffix,on,p=prefix)=>{field(suffix,p).checked=Boolean(on);fire("input",`${p}${suffix}`);fire("change",`${p}${suffix}`);};
  return {api,document,field,type,tick,fire,prefix,rival,published,click:id=>fire("click",id)};
}
const draftKey=`cms.draft.v1:${RIVALRY}:2:playerOne:seasonResult`;
async function publishFlow(page){
  page.click("completeSeason");
  assert.equal(page.document.getElementById("seasonEntry").dataset.sharedSeasonResults,"review",page.document.getElementById("seasonEntryError").textContent);
  page.click("confirmSeasonCompletion");
  const started=Date.now();
  while(Date.now()-started<4000&&!page.published.length)await new Promise(resolve=>setTimeout(resolve,10));
  return page.published[page.published.length-1];
}

async function sharedForm(){
  // E1
  {
    const page=openSeasonPage(makeDevice());await page.api.refresh();
    page.tick("ChampionsLeague",true);page.tick("EuropaLeague",true);
    assert.deepEqual([page.field("ChampionsLeague").checked,page.field("EuropaLeague").checked],[false,true],"EL tick unticks CL");
    page.tick("ChampionsLeague",true);
    assert.deepEqual([page.field("ChampionsLeague").checked,page.field("EuropaLeague").checked],[true,false],"CL tick unticks EL");
    page.tick("EuropaLeague",false);assert.equal(page.field("ChampionsLeague").checked,true,"unticking EL leaves CL alone");
    page.field("ChampionsLeague",page.rival).checked=true;page.field("EuropaLeague",page.rival).checked=false;
    page.tick("EuropaLeague",true);
    assert.equal(page.field("ChampionsLeague",page.rival).checked,true,"the rival's CL box never changes (different FIFA saves)");
    page.tick("EuropaLeague",true,page.rival);
    assert.equal(page.field("EuropaLeague").checked,true,"the rival's EL tick never touches this manager's EL box");
    ok("E1 shared form: CL and EL are exclusive per manager; ticking one unticks the other; the other manager's boxes never change");
  }
  // E2
  {
    const elPage=openSeasonPage(makeDevice());await elPage.api.refresh();
    elPage.type("LeaguePosition",1);elPage.type("LeaguePoints",90);elPage.type("LeagueGoals",85);elPage.tick("DomesticCup",true);elPage.tick("EuropaLeague",true);
    const el=await publishFlow(elPage);
    assert.deepEqual(Object.keys(el).sort(),[...SEVEN,"europaLeague"].sort(),"an EL winner's result has 8 keys");
    assert.equal(el.europaLeague,true);assert.equal(el.championsLeague,false);
    const plainPage=openSeasonPage(makeDevice());await plainPage.api.refresh();
    plainPage.type("LeaguePosition",2);plainPage.type("LeaguePoints",80);plainPage.type("LeagueGoals",70);plainPage.tick("ChampionsLeague",true);
    const plain=await publishFlow(plainPage);
    assert.deepEqual(Object.keys(plain).sort(),[...SEVEN].sort(),"no EL win: the unchanged 7-key r79 result, never europaLeague:false");
    const both=openSeasonPage(makeDevice());await both.api.refresh();
    both.type("LeaguePosition",3);both.type("LeaguePoints",60);both.type("LeagueGoals",50);
    both.field("ChampionsLeague").checked=true;both.field("EuropaLeague").checked=true; // forced past the change handler
    both.click("completeSeason");
    assert.notEqual(both.document.getElementById("seasonEntry").dataset.sharedSeasonResults,"review","both boxes never reach the review");
    assert.match(both.document.getElementById("seasonEntryError").textContent,/Champions League or Europa League, not both/);
    assert.equal(both.published.length,0,"nothing is published");
    ok("E2 shared form: europaLeague:true only when ticked (8 keys), else the 7-key shape; CL+EL for one manager is refused before publish");
  }
  // E3
  {
    const device=makeDevice();
    const page=openSeasonPage(device);await page.api.refresh();
    page.type("LeaguePosition",4);page.tick("TopScorer",true);
    assert.deepEqual(JSON.parse(device.store.get(draftKey)).checks,{DomesticCup:false,ChampionsLeague:false,TopScorer:true,TopAssist:false},"an unticked EL box leaves the old draft shape");
    page.tick("EuropaLeague",true);
    assert.deepEqual(JSON.parse(device.store.get(draftKey)).checks,{DomesticCup:false,ChampionsLeague:false,EuropaLeague:true,TopScorer:true,TopAssist:false});
    const reload=openSeasonPage(device);await reload.api.refresh();
    assert.equal(reload.field("EuropaLeague").checked,true,"the EL tick is restored after a reload");
    assert.equal(reload.field("ChampionsLeague").checked,false);
    reload.type("LeaguePoints",70);reload.type("LeagueGoals",60);
    reload.click("completeSeason");
    const card=textOf(reload.document.getElementById("seasonReviewOne"));
    assert.match(card,/✓ Europa League/,"the review card shows the Europa League chip");
    assert.match(card,/— Champions League/);
    ok("E3 shared draft keeps and restores an EL tick (old drafts keep their exact shape); the review card shows ✓ Europa League");
  }
}

function seasonEngine(){
  const {document,listeners}=makeDocument();
  const context={console,window:null,document,currentShowdown:null,cloneForStorage:v=>JSON.parse(JSON.stringify(v))};
  context.window=context;vm.createContext(context);
  vm.runInContext(read("js/scoring.js"),context,{filename:"js/scoring.js"});
  vm.runInContext(`${read("js/seasonEngine.js")}\n;globalThis.__se={resetSeasonEntryFields,readSeasonResult,getSeasonEntryValidationMessage,getSeasonReviewFingerprint,buildSeasonRecord,keepContinentalExclusive,getScoringBreakdownLines,renderSeasonReviewAchievements};`,context,{filename:"js/seasonEngine.js"});
  const se=context.__se,field=id=>document.getElementById(id);
  const fill=(p,r)=>{field(`${p}LeaguePosition`).value=String(r.leaguePosition);field(`${p}LeaguePoints`).value=String(r.leaguePoints);field(`${p}LeagueGoals`).value=String(r.leagueGoals);for(const [s,k] of [["DomesticCup","domesticCup"],["ChampionsLeague","championsLeague"],["EuropaLeague","europaLeague"],["TopScorer","topScorer"],["TopAssist","topAssist"]])field(`${p}${s}`).checked=Boolean(r[k]);};
  fill("p1",{leaguePosition:1,leaguePoints:90,leagueGoals:80,domesticCup:true,europaLeague:true});
  fill("p2",{leaguePosition:1,leaguePoints:88,leagueGoals:77,europaLeague:true});
  const one=se.readSeasonResult("p1"),two=se.readSeasonResult("p2");
  assert.deepEqual(Object.keys(one).sort(),[...SEVEN,"europaLeague"].sort());assert.equal(one.europaLeague,true);
  assert.equal(se.getSeasonEntryValidationMessage("p1","Daniel"),"","an EL win is valid");
  assert.equal(se.getSeasonEntryValidationMessage("p2","Nik"),"","both managers may win the EL and share a league position (different saves)");
  const record=se.buildSeasonRecord(1,one,two,null);
  assert.equal(record.playerOne.scoring.total,3+3+1,"EL +3, league +3, cup +1");
  const lines=se.getScoringBreakdownLines(record.playerOne.scoring);
  assert.deepEqual(JSON.parse(JSON.stringify(lines.slice(0,2))),[["Champions League",0],["Europa League",3]],"the EL line follows the CL line for a season that won it");
  const plainRecord=se.buildSeasonRecord(1,{...one,europaLeague:undefined},{...two},null);
  delete plainRecord.playerOne.europaLeague;plainRecord.playerOne.scoring=context.calculatePlayerSeasonScore(plainRecord.playerOne);
  assert.ok(!se.getScoringBreakdownLines(plainRecord.playerOne.scoring).some(([label])=>label==="Europa League"),"no EL line for a season without it");
  assert.notEqual(se.getSeasonReviewFingerprint(record),se.getSeasonReviewFingerprint(se.buildSeasonRecord(1,{...SEVEN.reduce((o,k)=>({...o,[k]:one[k]}),{})},two,null)),"the review fingerprint sees the EL tick");
  const group=makeNode("group");se.renderSeasonReviewAchievements(group,one);
  assert.match(textOf(group),/✓ Europa League/);
  field("p1EuropaLeague").checked=false;
  assert.ok(!("europaLeague" in se.readSeasonResult("p1")),"an unticked EL box leaves the 7-key result");
  field("p1ChampionsLeague").checked=true;field("p1EuropaLeague").checked=true;
  assert.match(se.getSeasonEntryValidationMessage("p1","Daniel"),/Champions League or Europa League, not both/);
  assert.ok(!("europaLeague" in se.readSeasonResult("p1")),"a forced CL+EL read never writes the EL key next to the CL win");
  field("p1ChampionsLeague").checked=true;field("p1EuropaLeague").checked=true;
  se.keepContinentalExclusive({target:field("p1EuropaLeague")});
  assert.deepEqual([field("p1ChampionsLeague").checked,field("p1EuropaLeague").checked],[false,true]);
  field("p1ChampionsLeague").checked=true;se.keepContinentalExclusive({target:field("p1ChampionsLeague")});
  assert.deepEqual([field("p1ChampionsLeague").checked,field("p1EuropaLeague").checked],[true,false]);
  field("p2ChampionsLeague").checked=false;field("p2EuropaLeague").checked=true;
  se.keepContinentalExclusive({target:field("p1ChampionsLeague")});
  assert.equal(field("p2EuropaLeague").checked,true,"the other manager's box never changes");
  field("p1EuropaLeague").checked=true;field("p2EuropaLeague").checked=true;
  se.resetSeasonEntryFields();
  assert.deepEqual([field("p1EuropaLeague").checked,field("p2EuropaLeague").checked],[false,false],"the next season starts with the EL box clear");
  const src=read("js/seasonEngine.js");
  assert.match(src,/document\.addEventListener\("change", keepContinentalExclusive, true\)/,"the local form keeps the boxes exclusive on change");
  ok("E4 local form: reset clears EL, the read sets the key only when ticked, fingerprint and review chip see EL, both is a message, change keeps them exclusive, EL breakdown line only when won");
}

function standingsAndFinal(){
  const SF=require(path.join(ROOT,"js/seasonFinalV10.js"));
  const counts=(cl,el,lt,dc)=>({seasonWins:1,seasonDraws:0,seasonLosses:0,championsLeagues:cl,europaLeagues:el,leagueTitles:lt,domesticCups:dc,totalTrophies:cl+el+lt+dc});
  const frames=SF.standingsFrames({status:"ready",score:{daniel:7,nik:9},managers:{daniel:counts(0,1,1,1),nik:counts(1,0,1,0)}},null);
  assert.equal(frames.SHOWDOWN.model.status,"ready");
  assert.equal(frames.SHOWDOWN.model.managerRecords.daniel.europaLeagues,1,"Standings carries the Europa Leagues counter");
  const {europaLeagues:_drop,...old}=counts(0,1,1,1);
  assert.equal(SF.standingsFrames({status:"ready",score:{daniel:7,nik:9},managers:{daniel:old,nik:counts(1,0,1,0)}},null).SHOWDOWN.model.status,"unavailable","a record without the counter fails closed");
  const st=read("visual-assets/v10_1/standings/standings.js"),strings=JSON.parse(read("visual-assets/v10_1/standings/app-strings.json")).strings;
  const rows=JSON.parse(/const SCOPE_ROWS = (\[[^\]]+\]);/.exec(st)[1]);
  assert.deepEqual(rows,["seasonWins","seasonDraws","seasonLosses","championsLeagues","europaLeagues","leagueTitles","domesticCups","totalTrophies"]);
  assert.equal(strings.fields.europaLeagues,"Europa Leagues");
  const css=read("visual-assets/v10_1/standings/standings.css"),sf=read("js/seasonFinalV10.js");
  assert.ok(css.includes("grid-template-rows:repeat(8,1fr)")&&css.includes("grid-template-rows:repeat(8,18px)")&&!/repeat\(7,/.test(css),"the board has room for 8 rows");
  assert.ok(sf.includes("--sg-board:calc(205px + 8 * var(--sg-row))")&&sf.includes("--sg-board:calc(296px + 8 * var(--sg-row))")&&!sf.includes("+ 7 * var(--sg-row)"),"the phone and tablet board budget counts 8 rows");
  ok("E5 Standings: Europa Leagues row after Champions Leagues (8 rows, board budget 8 on phone and tablet); a record without the counter fails closed");

  const rec=(cl,el,lt,dc,total)=>({totalPoints:total,championsLeagues:cl,europaLeagues:el,leagueTitles:lt,domesticCups:dc,totalTrophies:cl+el+lt+dc});
  const recon={phase:"FINAL_SEASON_RECONCILED",finalSeasonReconciled:true,winner:"playerOne",managerTotals:{playerOne:7,playerTwo:5},acceptedSeasons:1,totalSeasons:1,rivalryId:RIVALRY,acceptedRevisionKey:"k1"};
  const hist=records=>({authoritative:true,phase:"HISTORY_CONVERGED",rivalryId:RIVALRY,projection:{acceptedRevisionKey:"k1",acceptedSeasons:1,managerRecords:records,seasonHistory:[{roundNumber:1,playerOne:{scoring:{total:7}},playerTwo:{scoring:{total:5}},winner:"playerOne"}]}});
  const frame=SF.finalFrame(recon,null,hist({playerOne:rec(0,1,1,1,7),playerTwo:rec(1,1,0,0,5)}));
  assert.equal(frame.status,"ready");
  assert.deepEqual(JSON.parse(JSON.stringify(frame.trophies)),{daniel:{championsLeague:0,europaLeague:1,leagueTitles:1,domesticCups:1,total:3},nik:{championsLeague:1,europaLeague:1,leagueTitles:0,domesticCups:0,total:2}},"both managers may win the EL; the total includes it");
  const {europaLeagues:_x,...oldRec}=rec(0,1,1,1,7);
  assert.notEqual(SF.finalFrame(recon,null,hist({playerOne:oldRec,playerTwo:rec(1,0,0,0,5)})).status,"ready","a record without the counter never shows trophies");
  const shell=read("visual-assets/v10_1/final-winner/app-shell.html"),fw=read("visual-assets/v10_1/final-winner/final-winner.js"),fws=JSON.parse(read("visual-assets/v10_1/final-winner/app-strings.json")).strings;
  for(const id of ["panelDanielEuropa","panelNikEuropa"])assert.equal((shell.match(new RegExp(`id="${id}"`,"g"))||[]).length,1,id);
  assert.ok(shell.indexOf("panelNikContinental")<shell.indexOf("panelDanielEuropa")&&shell.indexOf("panelDanielEuropa")<shell.indexOf("panelDanielLeague"),"the EL row follows the CL row");
  assert.equal((shell.match(/TRO_EUROPA_V1_512\.webp/g)||[]).length,2);
  // Team V HO-034 (ticket 1848) art, byte for byte as handed off (TRO_EUROPA_V1.md on factory/v1-wtt5ye @ b6928ba4).
  for(const [file,sha] of [["TRO_EUROPA_V1_512.webp","8dd3147c1100ece7289ab7569a1cbbd20d823193c8ee255eb63cf91fb73d2030"],["TRO_EUROPA_V1_1536.webp","9bdfbee3a11c2d725ec477601e58050da5e955d4805eadeff14a1cdf408069c7"]])
    assert.equal(require("node:crypto").createHash("sha256").update(fs.readFileSync(path.join(ROOT,"visual-assets/v10_1/shared/trophies",file))).digest("hex"),sha,file);
  assert.match(fw,/setMetricValue\("panelDanielEuropa", d && d\.europaLeague\);/);assert.match(fw,/setMetricValue\("panelNikEuropa", n && n\.europaLeague\);/);
  assert.deepEqual(fws.trophySummary.order,["championsLeague","europaLeague","leagueTitles","domesticCups","total"]);assert.equal(fws.trophySummary.labels.europaLeague,"Europa League");
  // Codex P2 on #948: the honours grids count five metric rows, and the short-window plaque minimums leave room for them.
  const fwcss=read("visual-assets/v10_1/final-winner/final-winner.css");
  assert.ok(fwcss.includes("grid-template-rows: 20% repeat(5, 1fr);")&&fwcss.includes("grid-template-rows: 26px repeat(5, 1fr);")&&fwcss.includes("height: max(12.5%, 132px);")&&!/repeat\(4, 1fr\)/.test(fwcss),"final-winner.css: five honours rows, a 132px short-desktop panel");
  assert.ok(sf.includes("grid-template-rows:auto repeat(5,1fr);")&&sf.includes("grid-template-rows:auto repeat(5,minmax(0,1fr));")&&!/grid-template-rows:auto repeat\(4,/.test(sf),"seasonFinalV10: five honours rows on every layout");
  // r80 short screens: the plaque is 148 picture px (138 let TOTAL TROPHIES run into its bottom border at 1920x1080, 1536x864, 1366x768).
  assert.ok(sf.includes("height:max(calc(148 * var(--fw-k)),124px);")&&sf.includes("--fw-rh:max(calc(148 * var(--fw-k)),124px);")&&sf.includes("height:max(16.8%,124px);")&&!sf.includes("138 * var(--fw-k)),112px)")&&!sf.includes("148 * var(--fw-k)),112px)"),"seasonFinalV10: the plaque and the button placement both use the 124px minimum");
  ok("E6 Final Winner: Europa League honours row with the TRO_EUROPA art after Champions League, trophies line order, both may win it, a record without the counter fails closed, five-row honours grids with room at 1366x640");
}

function ruleBook(){
  class Node{constructor(tag){this.tagName=tag;this.children=[];this.className="";this._text="";this.attributes={};this.id="";}
    append(...n){this.children.push(...n);}appendChild(n){this.children.push(n);return n;}setAttribute(k,v){this.attributes[k]=v;}
    set textContent(v){this._text=String(v);this.children=[];}get textContent(){return this._text+this.children.map(c=>c.textContent).join("");}
    set innerHTML(v){this._text=String(v).replace(/<[^>]+>/g,"");}
    all(){return [this,...this.children.flatMap(c=>c.all?c.all():[])];}}
  const main=new Node("main");
  const ctx={document:{createElement:t=>new Node(t),createDocumentFragment:()=>new Node("fragment"),getElementById:id=>main.all().find(n=>n.id===id)||null,querySelector:s=>s==="main"?main:null},window:{}};
  vm.createContext(ctx);vm.runInContext(read("js/ruleBook.js"),ctx);ctx.createRuleBookScreen();
  const book=main.all().find(n=>n.id==="ruleBook");
  const items=book.all().filter(n=>n.tagName==="li").map(n=>n.textContent);
  const flat=n=>n.children.flatMap(c=>c.tagName==="fragment"?flat(c):[c]);
  const score=flat(book.all().find(n=>n.className==="ruleScoreTable")).map(r=>r.children.map(c=>c.textContent));
  assert.deepEqual(score.slice(0,2),[["Champions League winner","+5"],["Europa League winner","+3"]]);
  assert.equal(book.all().find(n=>n.className==="ruleScoreMaximum").textContent,"MAXIMUM PER MANAGER / SEASON11","the season maximum stays 11");
  assert.ok(items.includes("You may play or simulate a Champions League or Europa League final."),"the EL final may be played, like the CL final");
  assert.ok(items.includes("You may play or simulate the main domestic cup final."),"the cup final line is unchanged");
  const notes=flat(book.all().find(n=>n.className==="ruleScoreNotes")).map(n=>n.textContent).join(" ");
  for(const pattern of [/Season 1: both clubs play in the Champions League/,/redrawing the Champions League groups twice/])assert.match(notes,pattern);
  // r86 (Nik 2026-10-29): rules FIFA 17 enforces by itself are no longer printed; the scoring engine still applies them.
  for(const gone of [/same season/,/3rd in its Champions League group/,/by its league position/,/Only winning scores/,/Best possible season/])assert.doesNotMatch(notes,gone);
  assert.ok(items.includes("Skip pre-season in FIFA 17."),"r86 (Nik 2026-10-29): pre-season is skipped in FIFA 17");
  assert.equal(book.all().filter(n=>/^ruleSection( scoringRuleSection| specialPlayerRuleSection)?$/.test(n.className)).length,7,"seven rule cards (r86 adds Special Player)");
  ok("E7 Rule Book: EL +3 row, CL or EL never both, the season 1 Champions League setup note, the EL final may be played, best season 11 / EL 9, seven cards");
}

function textLines(){
  const pcsc=read("js/productionSharedCanonicalScoring.js");
  const line=/pcscText\(ui\.breakdown,(`[^\n]*?`)\);/.exec(pcsc)[1];
  const breakdown=new Function("p1","p2",`return ${line};`);
  const b=(cl,el)=>({championsLeague:cl,...(el?{europaLeague:el}:{}),leagueTitle:3,domesticCup:1,performanceBonus:0,individualAwardsBonus:1});
  assert.equal(breakdown(b(5,0),b(0,0)),"Champions League 5–0 · League Title 3–3 · Domestic Cup 1–1 · Performance Bonus 0–0 · Awards Bonus 1–1","no EL win: the line reads as before");
  assert.equal(breakdown(b(0,3),b(5,0)),"Champions League 0–5 · Europa League 3–0 · League Title 3–3 · Domestic Cup 1–1 · Performance Bonus 0–0 · Awards Bonus 1–1");
  const phc=read("js/productionSharedHistoryConvergence.js");
  const trophy=new Function("phcManagerName",`${/function phcTrophyLine\(role,item\)\{[^\n]*?\}(?=\n)/.exec(phc)[0]}\nreturn phcTrophyLine;`)(role=>role==="playerOne"?"Daniel":"Nik");
  assert.equal(trophy("playerOne",{totalTrophies:3,leagueTitles:1,domesticCups:1,championsLeagues:1,europaLeagues:0}),"Daniel 3 trophies (1 league, 1 cup, 1 Champions League)");
  assert.equal(trophy("playerTwo",{totalTrophies:2,leagueTitles:0,domesticCups:1,championsLeagues:0,europaLeagues:1}),"Nik 2 trophies (0 league, 1 cup, 0 Champions League, 1 Europa League)");
  const shell=read("visual-assets/v10_1/season-results/app-shell.html");
  assert.match(shell,/<span>Europa League Winner<\/span><strong>\+3<\/strong>/);
  assert.match(shell,/<span>Maximum Season Score<\/span><strong>11<\/strong>/);
  assert.match(shell,/Champions League \+5[^<]*Europa League \+3[^<]*Season maximum 11/);
  const index=read("index.html");
  for(const p of ["p1","p2"])assert.match(index,new RegExp(`<label><input id="${p}ChampionsLeague" type="checkbox"> Champions League Winner</label>\\n<label><input id="${p}EuropaLeague" type="checkbox"> Europa League Winner</label>`));
  assert.match(index,/Champions League \+5 or Europa League \+3 \(never both in the same season\)[^<]*Maximum season score: 11\./);
  ok("E8 canonical breakdown and History trophy line name the EL only when won; scoring panel and hint list EL +3 with max 11; EL box after each CL box");
}

(async()=>{
  await sharedForm();
  seasonEngine();
  standingsAndFinal();
  ruleBook();
  textLines();
  console.log(`PASS europa-league-season-screens contracts: ${checks} checks.`);
})().catch(error=>{console.error(error);process.exitCode=1;});
