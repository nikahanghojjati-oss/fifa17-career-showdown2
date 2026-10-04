#!/usr/bin/env node
"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const {spawnSync}=require("node:child_process");
const ROOT=path.resolve(__dirname,"../.."),read=p=>fs.readFileSync(path.join(ROOT,p),"utf8");
const api=require("../../js/seasonFinalV10.js");
const {FakeNode}=require("../support/fake-dom.cjs");
// Parse the actual app/visual markup. The contract exercises adoption of the real nodes,
// not a second implementation of the binder. Browser fit/interaction belongs to CI.
class Node extends FakeNode{
  constructor(tag,doc){super(tag);this.ownerDocument=doc;this.listeners={};this.style={setProperty(){}};}
  get parentNode(){return this.parent;} get firstElementChild(){return this.children[0]||null;}
  get isConnected(){return !!this.parent;} get nextSibling(){return this.parent?.children[this.parent.children.indexOf(this)+1]||null;}
  setAttribute(k,v){super.setAttribute(k,v);if(k==="id")this.id=String(v);if(k==="class")this.className=String(v);if(k.startsWith("data-"))this.dataset[k.slice(5).replace(/-([a-z])/g,(_,x)=>x.toUpperCase())]=String(v);}
  removeAttribute(k){delete this.attributes[k];}
  matches(s){const id=s.match(/#([\w-]+)/),classes=[...s.matchAll(/\.([\w-]+)/g)],tag=s.match(/^[\w-]+/);return (!id||this.id===id[1])&&classes.every(x=>this.classList.contains(x[1]))&&(!tag||this.tagName===tag[0].toUpperCase());}
  querySelectorAll(s){const parts=s.split(/\s+/);return this.all().filter(n=>{if(!n.matches(parts.at(-1)))return false;let p=n.parent;for(let i=parts.length-2;i>=0;i--){while(p&&!p.matches(parts[i]))p=p.parent;if(!p)return false;p=p.parent;}return true;});}
  querySelector(s){return this.querySelectorAll(s)[0]||null;}
  closest(s){for(let n=this;n;n=n.parent)if(n.matches(s))return n;return null;}
  replaceWith(n){const p=this.parent,i=p.children.indexOf(this);n.remove();p.children[i]=n;n.parent=p;this.parent=null;}
  addEventListener(t,f){(this.listeners[t]||=[]).push(f);} click(){for(const f of this.listeners.click||[])f({target:this});}
  focus(){} prepend(n){n.remove();n.parent=this;this.children.unshift(n);}
  set innerHTML(html){this.replaceChildren();parse(html,this,this.ownerDocument);} get innerHTML(){return "";}
}
function parse(html,parent,doc){
  const stack=[parent],voids=new Set(["IMG","INPUT","SOURCE","BR","HR","META","LINK"]);
  for(const m of html.matchAll(/<!--[\s\S]*?-->|<\/?[^>]+>|[^<]+/g)){
    const t=m[0];if(t.startsWith("<!--"))continue;
    if(t.startsWith("</")){stack.pop();continue;}
    if(t.startsWith("<")){const tag=t.match(/^<([\w-]+)/)?.[1];if(!tag)continue;const n=doc.createElement(tag);
      for(const a of t.matchAll(/([\w:-]+)\s*=\s*"([^"]*)"/g))n.setAttribute(a[1],a[2]);
      if(/\shidden(?:\s|>)/.test(t))n.hidden=true;stack.at(-1).appendChild(n);if(!voids.has(n.tagName))stack.push(n);
    }else{const n=doc.createElement("#text");n.textContent=t;stack.at(-1).appendChild(n);}
  }
}
function documentOf(html){const doc={createElement:t=>new Node(t,doc),createDocumentFragment:()=>new Node("fragment",doc),addEventListener(){}};doc.body=doc.createElement("body");doc.documentElement=doc.createElement("html");doc.documentElement.append(doc.body);doc.body.innerHTML=html;doc.getElementById=id=>doc.body.all().find(n=>n.id===id)||null;doc.querySelector=s=>doc.body.querySelector(s);doc.querySelectorAll=s=>doc.body.querySelectorAll(s);return doc;}
const checks=[],check=(name,fn)=>checks.push([name,fn]);
const roles={playerOne:"daniel",playerTwo:"nik",draw:"draw"};
check("V29.1 Final Winner copies reconciliation winner, including equal-total draw",()=>{
  for(const [winner,totals] of [["playerOne",[11,3]],["playerTwo",[3,11]],["draw",[7,7]]]){
    const f=api.finalFrame({phase:"FINAL_SEASON_RECONCILED",finalSeasonReconciled:true,winner,managerTotals:{playerOne:totals[0],playerTwo:totals[1]},acceptedSeasons:3,rivalryId:"r"},null,null);
    assert.equal(f.winner,roles[winner]);assert.deepEqual(f.totals,{daniel:totals[0],nik:totals[1]});assert.equal(f.state,"completion-pending");
  }
});
check("V29.2 missing/invalid final authority never supplies zeroes or a winner",()=>{
  for(const x of [null,{}, {phase:"BLOCKED"},{phase:"FINAL_SEASON_RECONCILED",finalSeasonReconciled:true,winner:"draw",managerTotals:{}}]){const f=api.finalFrame(x);assert.equal(f.winner,undefined);assert.equal(f.totals,undefined);}
});
check("V29.3 Standings copies acknowledged rivalry rows and career standings in Daniel/Nik order",()=>{
  const fx=JSON.parse(read("tests/fixtures/data-contract-v1/active-mid-season.json")),r=fx.views.daniel.rivalry;
  const frames=api.standingsFrames(r,fx.career);
  assert.deepEqual(frames.SHOWDOWN.model.score,r.score);assert.deepEqual(frames.SHOWDOWN.model.managerRecords,r.managers);
  for(const m of ["daniel","nik"]){assert.equal(frames.CAREER.model.standings[m].careerPoints,fx.career.trophyRoom.standings.find(x=>x.manager===m).careerPoints);}
  assert.deepEqual(Object.keys(frames.CAREER.model.standings),["daniel","nik"]);
});
check("V29.4 failed and partial reads stay honest; interim history never masquerades as career",()=>{
  assert.equal(api.standingsFrames(null,null).CAREER.model.status,"unavailable");
  const fx=JSON.parse(read("tests/fixtures/data-contract-v1/active-mid-season.json"));
  assert.equal(api.standingsFrames(null,{...fx.career,interimLabel:"Current Showdown only. Career history is not yet available."}).CAREER.model.status,"unavailable");
});
check("V29.5 mount preserves every live field, action, status, draft and listener by identity",()=>{
  const html=read("index.html"),entry=html.slice(html.indexOf('<section id="seasonEntry"'),html.indexOf('<section id="seasonSummary"'));
  const doc=documentOf(entry),host=doc.getElementById("seasonEntry");
  // Exercise the real review-shell constructor before adoption.
  const env={document:doc,console};vm.runInNewContext(read("js/seasonEngine.js")+"\nensureSeasonReviewUI();",env);
  const review=doc.getElementById("seasonReviewPanel"),status=doc.createElement("p"),commit=doc.createElement("button");status.id="sharedSeasonCommitStatus";status.className="seasonReviewWarning";status.textContent="CHECK RESULTS: Both managers ticked Domestic Cup.";commit.id="sharedSeasonCommitAction";commit.textContent="ACKNOWLEDGE SHARED SEASON";review.append(status);review.querySelector(".seasonReviewActions").append(commit);
  const nodes=Object.fromEntries(host.all().filter(n=>n.id).map(n=>[n.id,n]));nodes.p1LeagueGoals.value="131";nodes.p1LeagueGoals.dataset.draft="retained";nodes.p2LeaguePosition.closest(".seasonResultCard").classList.add("hidden");
  let taps=0;nodes.completeSeason.addEventListener("click",()=>taps++);
  const stage=doc.createElement("div");stage.innerHTML=read("visual-assets/v10_1/season-results/app-shell.html");
  api.skinSeason(host,stage.firstElementChild);
  for(const [id,node] of Object.entries(nodes))assert.equal(doc.getElementById(id),node,id);
  assert.equal(nodes.p1LeagueGoals.value,"131");assert.equal(nodes.p1LeagueGoals.dataset.draft,"retained");nodes.completeSeason.click();assert.equal(taps,1);
  assert.ok(nodes.p2LeaguePosition.closest(".seasonResultCard").classList.contains("hidden"));assert.match(doc.getElementById("sharedSeasonCommitStatus").textContent,/CHECK RESULTS/);
  assert.equal(doc.getElementById("sharedSeasonCommitAction").textContent,"ACKNOWLEDGE SHARED SEASON");
  assert.ok(review.querySelector(".seasonReviewActions"));assert.ok(nodes.completeSeason.closest(".seasonEntryActions"));
});
check("V29.6 the lazy registry and shell cache include every binder resource",()=>{
  for(const p of ["js/seasonFinalV10.js","season-results/season-results.css","final-winner/final-winner.css","standings/standings.css","season-results/app-shell.html","final-winner/app-shell.html","standings/app-shell.html"])assert.ok(read("service-worker.js").includes(p),p);
  assert.ok(read("js/ssjr.js").includes("seasonFinalV10.js"));assert.ok(read("js/seasonFinalV10.js").includes('register("seasonEntry"'));assert.ok(read("js/seasonFinalV10.js").includes('register("standings"'));
});
check("V29.7 live Team V scripts bypass preview fetches and never rebuild product actions",()=>{
  assert.ok(read("visual-assets/v10_1/season-results/season-results.js").includes("SEASON_RESULTS_APP"));
  assert.ok(read("visual-assets/v10_1/final-winner/final-winner.js").includes("if (!window.FINAL_WINNER_APP) renderActions"));
  assert.ok(read("visual-assets/v10_1/standings/standings.js").includes("STANDINGS_APP"));
});
check("V29.8 the real clash contract keeps CHECK RESULTS and enabled commit/acknowledge",()=>{const r=spawnSync(process.execPath,["tests/contracts/season-result-clash-contracts.cjs"],{cwd:ROOT,encoding:"utf8"});assert.equal(r.status,0,r.stdout+r.stderr);});
(async()=>{for(let i=0;i<checks.length;i++){await checks[i][1]();process.stdout.write(`ok ${i+1} ${checks[i][0]}\n`);}process.stdout.write(`PASS ${checks.length} V10 season/final/standings contracts\n`);})().catch(e=>{console.error(e);process.exitCode=1;});
