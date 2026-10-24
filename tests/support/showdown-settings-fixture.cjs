"use strict";
const fs=require("node:fs"),vm=require("node:vm"),path=require("node:path");
const MODES_SOURCE=fs.readFileSync(path.resolve(__dirname,"../../js/showdownModes.js"),"utf8");
class El{
  constructor(tag,doc){this.tagName=String(tag).toUpperCase();this.ownerDocument=doc;this.children=[];this.parentNode=null;this.dataset={};this.attributes={};this.className="";this.id="";this.hidden=false;this.ownText="";this.listeners={};this.disabled=false;this.checked=false;
    const self=this;this.classList={contains:c=>self.className.split(/\s+/).includes(c),add:c=>{if(!self.classList.contains(c))self.className=(self.className+" "+c).trim();},remove:c=>{self.className=self.className.split(/\s+/).filter(x=>x&&x!==c).join(" ");}};}
  get textContent(){return this.ownText+this.children.map(c=>c.textContent).join("");}
  set textContent(v){this.ownText=v==null?"":String(v);this.children=[];}
  setAttribute(k,v){this.attributes[k]=String(v);}
  getAttribute(k){return k in this.attributes?this.attributes[k]:null;}
  addEventListener(type,fn){(this.listeners[type]=this.listeners[type]||[]).push(fn);}
  click(){for(const fn of this.listeners.click||[])fn({type:"click",target:this});}
  detach(){if(this.parentNode){this.parentNode.children=this.parentNode.children.filter(c=>c!==this);this.parentNode=null;}}
  append(...nodes){for(const n of nodes){n.detach();n.parentNode=this;this.children.push(n);}}
  prepend(n){n.detach();n.parentNode=this;this.children.unshift(n);}
  before(n){const p=this.parentNode;n.detach();n.parentNode=p;p.children.splice(p.children.indexOf(this),0,n);}
  after(n){const p=this.parentNode;n.detach();n.parentNode=p;p.children.splice(p.children.indexOf(this)+1,0,n);}
  remove(){this.detach();}
  all(){return this.children.flatMap(c=>[c,...c.all()]);}
  matches(sel){if(sel.startsWith("#"))return this.id===sel.slice(1);if(sel.startsWith("."))return this.classList.contains(sel.slice(1));const attr=/^\[data-([a-z-]+)\]$/.exec(sel);if(attr){const key=attr[1].replace(/-([a-z])/g,(_m,c)=>c.toUpperCase());return key in this.dataset;}return this.tagName===sel.toUpperCase();}
  query(sel){const parts=sel.trim().split(/\s+/);let scope=[this];for(const part of parts)scope=scope.flatMap(n=>n.all().filter(x=>x.matches(part)));return scope;}
  querySelector(sel){return this.query(sel)[0]||null;}
  querySelectorAll(sel){return this.query(sel);}
}
function createDocument(){
  const doc={listeners:{}};
  doc.createElement=tag=>new El(tag,doc);
  doc.body=new El("body",doc);
  doc.getElementById=id=>doc.body.all().find(n=>n.id===id)||null;
  doc.querySelector=sel=>doc.body.querySelector(sel);
  doc.querySelectorAll=sel=>doc.body.querySelectorAll(sel);
  doc.addEventListener=(type,fn)=>{(doc.listeners[type]=doc.listeners[type]||[]).push(fn);};
  doc.dispatch=event=>{for(const fn of doc.listeners[event.type]||[])fn(event);};
  const make=(tag,id,className="")=>{const n=doc.createElement(tag);n.id=id||"";n.className=className;return n;};
  // The identity Settings panel (its own grid and action row; js/onlinePlayerIdentity.js renderOnlineSettings).
  const panel=make("section","onlinePlayerIdentitySettingsPanel","settingsPanel settingsConnectedAccount");
  const grid=make("div","","settingsInfoGrid"),actions=make("div","","settingsOfflineActions settingsConnectedAccountActions");
  panel.append(grid,actions);doc.body.append(panel);
  // The seasons screen and the Connect Players layer.
  const create=make("section","createShowdown"),box=make("div","","setupBox"),start=make("button","startShowdown","menuButton");
  box.append(start);create.append(box);doc.body.append(create);
  const layer=make("section","connectPlayersScreen","hidden"),slot=make("div","connectPlayersPairSlot");layer.hidden=true;layer.append(slot);doc.body.append(layer);
  return {doc,panel,grid,actions,box,start,layer,slot};
}

// ---------- one page: the modes module with stubbed neighbours ----------
function page({managerId="daniel",partner=null,side=null,marker=null,pairState={rivalryId:null,connectionState:"none"},confirm=true,unpairError=null,screen="mainMenu",startResult=true,startReaches="createShowdown"}={}){
  const dom=createDocument(),accountId="acct_"+managerId,calls=[];
  const partnerState={accountId,status:partner?"ready":"none",record:partner};
  let sideState=side?{accountId,status:side,partnerAccountId:"acct_other"}:{accountId,status:"unknown",partnerAccountId:null};
  let markerDoc=marker,currentScreen=screen;
  const pair={getPartnerState:()=>partnerState,getPartnerSideState:()=>sideState,getState:()=>pairState,
    readPartnerRecord:async()=>{calls.push("readPartnerRecord");return partnerState;},
    readPartnerSide:async()=>{calls.push("readPartnerSide");return sideState;},
    unpair:async()=>{calls.push("unpair");if(unpairError)throw unpairError;partnerState.record={...partnerState.record,active:false};sideState={accountId,status:"not-paired",partnerAccountId:null};return {ok:true};},
    subscribe:()=>()=>{}};
  const markerApi={readCurrentMarker:async()=>{calls.push("readMarker");return markerDoc?{status:"ready",...markerDoc}:{status:"none"};},
    startRealCareer:async()=>{calls.push("startRealCareer");markerDoc={hiddenRivalryIds:[],active:true};return {status:"ready",hiddenRivalryIds:[],active:true};}};
  const identity={getState:()=>({status:"ready",registered:true,accountId,managerId}),
    openStart:async()=>{calls.push("openStart");if(startResult instanceof Error)throw startResult;if(startResult)currentScreen=startReaches;return startResult;},openJoin:async()=>{calls.push("openJoin");return true;},
    forgetThisDevice:async()=>{calls.push("forgetThisDevice");return true;},refreshBadge:()=>null,renderSettings:()=>null};
  const sandbox={console,document:dom.doc,CareerModePersistentNikDanielPair:pair,CareerModeCareerStartMarker:markerApi,CareerModeOnlinePlayerIdentity:identity,
    getActiveScreenName:()=>currentScreen,closeSettings:()=>calls.push("closeSettings"),
    askShowdownConfirm:async(message,options)=>{calls.push(["confirm",message,options&&options.tone]);return confirm;},
    loadRuntimeScript:async()=>{throw new Error("everything is preloaded");},addEventListener:()=>{}};
  sandbox.globalThis=sandbox;vm.createContext(sandbox);
  vm.runInContext(MODES_SOURCE,sandbox,{filename:"js/showdownModes.js"});
  const modes=sandbox.CareerModeShowdownModes;
  const settings=()=>{modes.decorateSettingsPanel(dom.panel);const rows={};for(const r of dom.grid.querySelectorAll("[data-mode-row]"))rows[r.dataset.modeRow]=r.querySelector("strong").textContent;
    return {rows,buttons:dom.actions.children.map(b=>b.textContent),button:text=>dom.actions.children.find(b=>b.textContent===text)||null,note:dom.doc.getElementById("cmsModeSettings")?.textContent||""};};
  return {dom,modes,calls,settings,pair,identity,marker:markerApi,setScreen:s=>{currentScreen=s;dom.doc.dispatch({type:"career-mode-screen-shown",detail:{screen:s}});},setPairState:s=>{pairState=s;}};
}
// Replaces a page's openJoin with one that opens the Connect Players layer the way js/connectPlayersScreenV10.js does.
function sandboxOpenJoin(p,openLayer){const id=p.identity;id.openJoin=async()=>{p.calls.push("openJoin");return openLayer();};}
const ACTIVE_NIK={partnerAccountId:"acct_nik",myRole:"playerOne",active:true};
const ACTIVE_DANIEL={partnerAccountId:"acct_daniel",myRole:"playerTwo",active:true};
const OFF=record=>({...record,active:false});
const settle=async()=>{for(let i=0;i<10;i+=1)await new Promise(resolve=>setImmediate(resolve));};


module.exports={page,sandboxOpenJoin,ACTIVE_NIK,ACTIVE_DANIEL,OFF,settle};
