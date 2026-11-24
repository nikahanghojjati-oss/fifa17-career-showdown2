#!/usr/bin/env node
"use strict";
// Phoenix 3.0 W2 (B3, swap fault): a phone swapped mid-season (fresh device, empty storage, the same manager signs in) must land
// on the step the shared record says, never replay a step he already finished on the old phone. Rule: the shared record decides
// the step; device notes only skip an animation already seen.
//   R1 F1: his own spin mark for this season (the roulette's last tap writes it, after Chamber Men and the result card) means
//      Chamber Men, the pre-roulette squad step and the roulette are finished for him: all three pass, nothing shown again
//   R2 F1: without his own mark (only the rival's, or none) the steps run as before; once the window started view.state rules
//   R3 F2: his own locked guesses mean he saw the window and the guesses; his own locked signings mean he saw the signings
//      too, so the Transfer War replay never shows them again; the verdicts (COMPLETED) still show once on that device
//   R4 F2: the rival's locks, another season's view, or no lock add nothing; the device note still counts as before
//   R5 nothing new is read or written: the answers come from the Transfer Challenge read already made
// Real function bodies from js/productionSharedTransferChallenge.js, evaluated in a sandbox.
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const ROOT=path.resolve(__dirname,"../..");
const src=fs.readFileSync(path.join(ROOT,"js/productionSharedTransferChallenge.js"),"utf8");
let checks=0;const checksAsync=[];const ok=(id,label)=>{checks+=1;console.log(`ok ${checks} ${id} ${label}`);};
const fn=name=>{const m=new RegExp(`(?:async )?function ${name}\\([^)]*\\)\\{`).exec(src);assert.ok(m,`${name} exists`);let i=m.index+m[0].length,d=1;while(d&&i<src.length){const c=src[i++];if(c==="{")d++;else if(c==="}")d--;}return src.slice(m.index,i);};
const MARK={fired:false,version:"rr4.3.abc",bullets:0};

// ---- R1/R2: pstcOwnSpinSaved and its three uses
{
  const sb={view:null,viewContextKey:"k1"};const REQ={key:"k1"};vm.runInNewContext(`${fn("pstcOwnSpinSaved")}\nglobalThis.own=pstcOwnSpinSaved;`,sb);
  sb.view={managerRole:"playerTwo",state:null,spinMarks:{playerOne:null,playerTwo:MARK}};assert.equal(sb.own(REQ),true,"his own mark: finished for him");
  ok("R1","his own spin mark for this season says Chamber Men, the squad step and the roulette are finished for him");
  sb.view={managerRole:"playerTwo",state:null,spinMarks:{playerOne:MARK,playerTwo:null}};assert.equal(sb.own(REQ),false,"only the rival spun: his steps still run");
  sb.view={managerRole:"playerTwo",state:null,spinMarks:null};assert.equal(sb.own(REQ),false);
  sb.view={managerRole:"playerTwo",state:{phase:"WINDOW_OPEN"},spinMarks:{playerTwo:MARK}};assert.equal(sb.own(REQ),false,"once the window started, view.state already rules");
  sb.view={managerRole:"",state:null,spinMarks:{playerTwo:MARK}};assert.equal(sb.own(REQ),false,"no role, no answer");
  sb.view=null;assert.equal(sb.own(REQ),false);
  sb.view={managerRole:"playerTwo",state:null,spinMarks:{playerTwo:MARK}};assert.equal(sb.own({key:"k2"}),false,"a view of another request (season, Showdown) never counts");assert.equal(sb.own(),false);
  // The three steps use it before showing anything.
  assert.match(fn("pstcChamberMenFirst"),/if\(view\.state\|\|pstcOwnSpinSaved\(request\)\)\{step\.markDone\(ctx\);return true;\}/,"Chamber Men: marked done, not shown");
  assert.match(fn("pstcSquadFirst"),/if\(pstcOwnSpinSaved\(request\)\)return true;/,"squad step passed");
  assert.match(fn("pstcRouletteFirst"),/if\(pstcOwnSpinSaved\(request\)\|\|!step\.decide\(ctx\)\)\{rouletteClearedKey=request\.key;await pstcAfterSpin\(request\);return true;\}/,"roulette passed, the rival's spin still waited for");
  ok("R2","without his own mark the steps run as before; Chamber Men, the squad step and the roulette each pass on it before drawing");
}

// ---- R3/R4: pstcWitnessSet from the shared record
{
  const store=new Map();
  const sb={REPLAY_PHASES:["WINDOW_OPEN","GUESS_ENTRY","SIGNING_ENTRY","COMPLETED"],witnessedByContext:new Map(),viewContextKey:"ctx-s2",view:null,
    root:{readStorageValue:k=>store.get(k)??null,writeStorageValue:(k,v)=>{store.set(k,v);return true;}}};
  vm.runInNewContext(`${fn("pstcWitnessSet")}
    function pstcViewingStorageKey(){return "cms.transferViews.v1:pair_x:2:"+view.managerRole;}
    globalThis.set=k=>JSON.stringify([...pstcWitnessSet(k)].sort());globalThis.reset=()=>witnessedByContext.clear();`,sb);
  const W=k=>JSON.parse(sb.set(k));
  const st=(phase,guess=[],sign=[])=>({phase,guessLockedRoles:guess,signingLockedRoles:sign});
  sb.view={managerRole:"playerTwo",state:st("SIGNING_ENTRY",["playerOne","playerTwo"],[])};
  assert.deepEqual(W("ctx-s2"),["GUESS_ENTRY","WINDOW_OPEN"],"his locked guesses: the window and the guesses were on his screen");
  sb.reset();sb.view={managerRole:"playerTwo",state:st("COMPLETED",["playerOne","playerTwo"],["playerOne","playerTwo"])};
  assert.deepEqual(W("ctx-s2"),["GUESS_ENTRY","SIGNING_ENTRY","WINDOW_OPEN"],"his locked signings: the signings too; COMPLETED (the verdicts) still shows once");
  ok("R3","a fresh device never replays a Transfer War phase this manager acted in; the verdicts still show once");
  sb.reset();sb.view={managerRole:"playerTwo",state:st("SIGNING_ENTRY",["playerOne"],["playerOne"])};
  assert.deepEqual(W("ctx-s2"),[],"the rival's locks add nothing for him");
  sb.reset();assert.deepEqual(W("ctx-s1"),[],"another season's (stale) view adds nothing");
  sb.reset();sb.view={managerRole:"playerTwo",state:null};assert.deepEqual(W("ctx-s2"),[]);
  sb.reset();store.set("cms.transferViews.v1:pair_x:2:playerTwo",JSON.stringify(["WINDOW_OPEN"]));sb.view={managerRole:"playerTwo",state:st("GUESS_ENTRY",[],[])};
  assert.deepEqual(W("ctx-s2"),["WINDOW_OPEN"],"the device note still counts as before");
  ok("R4","only his own locks for this view count; the device note is unchanged");
}

// ---- R5: no new read or write
{
  for(const name of ["pstcOwnSpinSaved","pstcWitnessSet"])assert.doesNotMatch(fn(name),/getDoc|onSnapshot|setDoc|runTransaction|pstcRefresh|pstcProviderOptions|writeStorageValue|setTimeout|setInterval/,`${name}: no read, write, poll or timer`);
  ok("R5","the answers come from the Transfer Challenge read already made: no new read, write or timer");
}
Promise.all(checksAsync).then(()=>console.log(`PASS r100 fresh-device resume contracts (${checks} checks)`),e=>{console.error(e);process.exit(1);});
