"use strict";
// G-2d: a pair code Nik types must survive pair-panel re-renders, and an empty field never says "invalid".
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");

const root=path.resolve(__dirname,"../..");
const pairSource=fs.readFileSync(path.join(root,"js/persistentNikDanielPair.js"),"utf8");
const INVALID="Daniel's connection code is invalid.";
const CODE=`CMS17-pair_3${"ab".repeat(31)}c`;

// Tiny DOM: enough for pairRender (createElement, replaceChildren, ids, focus, clicks).
function createDom(){
  let active=null;
  class El{
    constructor(tag){this.tagName=String(tag).toUpperCase();this.children=[];this.parent=null;this.style={};this.listeners={};this.id="";this.className="";this.ownText="";this.value="";this.disabled=false;this.selectionStart=0;this.selectionEnd=0;}
    get textContent(){return this.ownText+this.children.map(c=>c.textContent).join("");}
    set textContent(v){this.ownText=v==null?"":String(v);this.children=[];}
    get isConnected(){let n=this;while(n){if(n===body)return true;n=n.parent;}return false;}
    append(...nodes){for(const n of nodes){if(n.parent)n.parent.children=n.parent.children.filter(c=>c!==n);n.parent=this;this.children.push(n);}}
    insertBefore(n){this.append(n);return n;}
    replaceChildren(...nodes){for(const c of this.children)c.parent=null;this.children=[];this.append(...nodes);}
    addEventListener(type,fn){(this.listeners[type]||(this.listeners[type]=[])).push(fn);}
    click(){if(!this.disabled)for(const fn of this.listeners.click||[])fn({preventDefault(){}});}
    focus(){if(this.isConnected)active=this;}
    setSelectionRange(a,b){this.selectionStart=a;this.selectionEnd=b;}
    all(){return this.children.flatMap(c=>[c,...c.all()]);}
    querySelector(sel){return sel===".fifaMenuGrid"?null:null;}
    scrollIntoView(){}
  }
  const body=new El("body"),menu=new El("div"),shell=new El("div");
  menu.id="mainMenu";shell.className="fifaMenuShell";body.append(menu);menu.append(shell);
  const connect=new El("section"),slot=new El("div");connect.id="connectPlayersScreen";slot.id="connectPlayersPairSlot";body.append(connect);connect.append(slot);
  const document={
    createElement:tag=>new El(tag),
    getElementById:id=>body.all().find(n=>n.id===id)||null,
    querySelector:sel=>sel==="#connectPlayersScreen #connectPlayersPairSlot"?slot:sel==="#mainMenu .fifaMenuShell"?shell:null,
    get activeElement(){return active&&active.isConnected?active:body;}
  };
  return{document,body};
}

async function settle(){for(let i=0;i<20;i+=1)await new Promise(r=>setImmediate(r));}

async function bootNik(){
  const {document}=createDom();
  const statuses=[];
  const firestoreSdk={
    doc:(_db,...parts)=>({path:parts.join("/")}),
    runTransaction:async(_db,fn)=>fn({get:async()=>({exists:()=>false,data:()=>null})}),
    getDoc:async()=>({exists:()=>false,data:()=>null})
  };
  const sandbox={
    console,setTimeout,clearTimeout,TextEncoder,
    document,
    CareerModeOnlinePlayerIdentity:{getState:()=>({managerId:"nik"})},
    CareerModeSparkConnectedAccount:{initialize:async()=>({}),getState:()=>({connected:true,accountId:"uid_nik"})},
    CareerModeSparkPrivatePairing:{initialize:async()=>({}),getState:()=>({registered:true,deviceId:"device_nik"}),localBindingOptions:()=>[]},
    CareerModeProductionFirebaseRuntime:{ensureAccountServices:async()=>({ok:true,auth:{currentUser:{uid:"uid_nik"}},firestore:{},firestoreSdk})}
  };
  vm.createContext(sandbox);
  vm.runInContext(pairSource,sandbox,{filename:"js/persistentNikDanielPair.js"});
  const pair=sandbox.CareerModePersistentNikDanielPair;
  assert.ok(pair&&typeof pair.initialize==="function","pair module loads in the sandbox");
  pair.subscribe(s=>statuses.push(s.status));
  const first=await pair.initialize({force:true});
  assert.equal(first.status,"unpaired","1a Nik reaches the unpaired code-entry state");
  const panel=()=>document.getElementById("persistentNikDanielPairPanel");
  const input=()=>document.getElementById("persistentNikDanielPairCode");
  const joinButton=()=>panel().all().find(n=>n.tagName==="BUTTON"&&n.textContent==="JOIN DANIEL'S SHOWDOWN");
  assert.ok(input(),"1b the code input is rendered for Nik");
  assert.ok(joinButton(),"1c the join button is rendered for Nik");
  return{pair,document,statuses,panel,input,joinButton};
}

(async()=>{
  // 2. Typed code survives a sync re-render (the JOB-16 trap) and reaches the join flow.
  {
    const t=await bootNik();
    const typedInto=t.input();
    typedInto.focus();
    typedInto.value=CODE;
    typedInto.setSelectionRange(CODE.length,CODE.length);
    // The sidecar sync (onlinePlayerIdentity syncPersistentPairSidecar) re-initializes and re-renders.
    await t.pair.initialize({force:true});
    t.pair.render();
    const after=t.input();
    assert.ok(after,"2a the code input is still rendered after the sync re-render");
    assert.equal(after.value,CODE,"2b the code Nik typed survives the pair-panel re-render");
    assert.equal(t.document.activeElement,after,"2c focus stays in the code input across the re-render");
    assert.equal(after.selectionStart,CODE.length,"2d the caret position is kept");
    t.statuses.length=0;
    t.joinButton().click();
    await settle();
    assert.ok(t.statuses.includes("joining"),"2e JOIN starts the join flow with the preserved code");
    assert.notEqual(t.pair.getState().message,INVALID,"2f a correct code typed before the re-render is never reported as invalid");
  }
  // 3. An empty field never says "invalid" and never starts a join.
  {
    const t=await bootNik();
    t.statuses.length=0;
    t.joinButton().click();
    await settle();
    assert.equal(t.statuses.includes("joining"),false,"3a JOIN with an empty field does not start a join");
    assert.notEqual(t.pair.getState().message,INVALID,"3b an empty field is not reported as an invalid code");
    assert.match(t.pair.getState().message,/paste daniel's code/i,"3c an empty field asks Nik to paste Daniel's code");
    assert.equal(t.pair.getState().busy,false,"3d the panel stays usable");
  }
  // 4. A really wrong code is still rejected with the existing message.
  {
    const t=await bootNik();
    t.input().value="CMS17-not-a-code";
    t.joinButton().click();
    await settle();
    assert.equal(t.pair.getState().message,INVALID,"4a a malformed code is still rejected as invalid");
    assert.equal(t.input().value,"CMS17-not-a-code","4b the rejected code stays in the field so Nik can correct it");
  }
  console.log("PASS pair code entry race contracts: typed code survives re-render, empty never invalid, malformed still rejected.");
})().catch(error=>{console.error(error);process.exit(1);});
