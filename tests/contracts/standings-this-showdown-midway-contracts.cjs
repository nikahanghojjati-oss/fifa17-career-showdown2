"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),vm=require("node:vm");
const F=require("../support/active-showdown-fixtures.cjs");
const {FakeNode}=require("../support/fake-dom.cjs");
const A=require("../../js/sharedActiveShowdownAdapter.js"),S=require("../../js/seasonFinalV10.js");
const Provider=require("../../js/sparkSharedMultiSeasonProgression.js");
const Career=require("../../js/sharedCareerAnalytics.js");
const read=p=>fs.readFileSync(p,"utf8"),clone=x=>JSON.parse(JSON.stringify(x));
class Node extends FakeNode{
  constructor(tag){super(tag);this.listeners={};this.disabled=false;}
  addEventListener(event,fn){(this.listeners[event]||=[]).push(fn);}
  click(){if(!this.disabled)for(const fn of this.listeners.click||[])fn({target:this});}
  setAttribute(k,v){super.setAttribute(k,v);if(k==="id")this.id=v;if(k==="class")this.className=v;if(k.startsWith("data-"))this.dataset[k.slice(5)]=v;}
}
function render(snapshot){
  // Parse Team V's frozen real shell and execute its real renderer: no preview fetches.
  const document={createElement:tag=>new Node(tag)},body=new Node("body"),stack=[body];
  for(const m of read("visual-assets/v10_1/standings/app-shell.html").matchAll(/<\/?[^>]+>|[^<]+/g)){
    const token=m[0];if(token.startsWith("</")){stack.pop();continue;}
    if(token.startsWith("<")){
      const tag=token.match(/^<([\w-]+)/)?.[1];if(!tag)continue;const node=document.createElement(tag);
      for(const attr of token.matchAll(/([\w:-]+)="([^"]*)"/g))node.setAttribute(attr[1],attr[2]);
      node.hidden=/\shidden(?:\s|>)/.test(token);node.disabled=/\sdisabled(?:\s|>)/.test(token);
      stack.at(-1).appendChild(node);if(!["source","img","input","br","hr"].includes(tag))stack.push(node);
    }else{const node=new Node("#text");node.textContent=token;stack.at(-1).appendChild(node);}
  }
  document.documentElement=new Node("html");document.getElementById=id=>body.all().find(node=>node.id===id)||null;
  const frames=S.standingsFrames(A.rivalryView(snapshot),null);
  const env={document,console,URLSearchParams,location:{search:""},STANDINGS_APP:true,STANDINGS_ROOT:document.getElementById("stage-root"),STANDINGS_FIXTURES:{strings:JSON.parse(read("visual-assets/v10_1/standings/app-strings.json")).strings,frames},fetch(){throw Error("Standings must not fetch provider/preview data");}};
  env.window=env;vm.runInNewContext(read("visual-assets/v10_1/standings/standings.js"),env);env.ShowdownStandingsBoot();
  return {document,frames};
}
(async()=>{
  const seasons=[[F.result({championsLeague:true,domesticCup:true}),F.result({leaguePosition:1})],[F.result(),F.result({leaguePosition:1,leaguePoints:101,topScorer:true})]];
  const p=F.projection({totalSeasons:5,seasons}),lagging=F.projection({totalSeasons:5,seasons:seasons.slice(0,1)});
  let authorityReads=0,historyReads=0;
  const setup={phase:"SHOWDOWN_CONFIRMED",revision:6,leagueId:p.leagueId,totalSeasons:5,clubs:{playerOne:"club_a",playerTwo:"club_b"}};
  const provider=Provider.createProvider({authorityReader:async()=>{authorityReads++;return {setup,managerRole:"playerOne",acceptedSeasons:2};},historyProvider:{read:async options=>{historyReads++;assert.equal(options.throughSeason,2);return F.history(p);}}});
  const multi=await provider.read({user:{uid:"acct_daniel"},rivalryId:p.rivalryId,sessionId:F.SESSION,deviceId:"device_"+"d".repeat(32),firestore:{},firebaseSdk:{doc(){},runTransaction(){}},nowEpochMs:1000});
  assert.equal(multi.ok,true);
  const snapshot={identity:F.identity(),pair:F.pair(p.rivalryId),multiSeason:multi,history:F.history(lagging)};
  const before=JSON.stringify(snapshot);
  // Progression fixes live standings, but must preserve r75's empty career input.
  const allNull=value=>{for(const item of Object.values(value)){if(item&&typeof item==="object")allNull(item);else assert.equal(item,null,"in-progress seasons must not supply career counters or trophies");}};
  for(const acceptedSeasons of [1,2]){
    const midway=F.projection({totalSeasons:3,seasons:seasons.slice(0,acceptedSeasons)});
    const older=acceptedSeasons===1?null:F.history(F.projection({totalSeasons:3,seasons:seasons.slice(0,acceptedSeasons-1)}));
    for(const managerId of ["daniel","nik"]){
      for(const history of [older,null]){
        const state={identity:F.identity(managerId),pair:F.pair(midway.rivalryId,{managerId}),multiSeason:{...F.multiFor(midway),projection:midway},history};
        const input=A.careerInput(state),model=Career.buildCareerModel(input);
        console.log(`CAREER S${acceptedSeasons} ${managerId}, History ${history?"lagging":"missing"}: indexStatus=${input.indexStatus}, showdowns=${input.showdowns.length}, model=${model.status}`);
        assert.deepEqual(input,{indexStatus:"loading",showdowns:[],currentShowdownOnly:true,currentRivalryId:midway.rivalryId},"progression fallback must preserve r75 career input");
        assert.equal(model.status,"loading");allNull(model.managers);allNull(model.trophyRoom.cabinet);
        assert.deepEqual(model.history.showdowns,[]);assert.deepEqual(model.trophyRoom.standings,[]);assert.deepEqual(model.trophyRoom.records,[]);
        assert.equal(A.rivalryView(state).status,"ready");
        assert.deepEqual(A.homeView(state).continue.score,{daniel:midway.managerRecords.playerOne.totalPoints,nik:midway.managerRecords.playerTwo.totalPoints});
      }
    }
  }
  // Lifecycle states keep their own career input when a cached progression projection survives.
  {
    const midway=F.projection({totalSeasons:3,seasons:seasons.slice(0,2)}),multiSeason={...F.multiFor(midway),projection:midway};
    for(const [pair,expected] of [[F.pair(midway.rivalryId,{connectionState:"closed"}),"abandoned"],[F.pair(midway.rivalryId,{connectionState:"pending-pair"}),"pending"],[F.pair(midway.rivalryId,{status:"signed-out"}),"unavailable"]]){
      const state={identity:F.identity(),pair,multiSeason,history:null},bare={...state,multiSeason:{...multiSeason,projection:null}};
      assert.deepEqual(A.careerInput(state),A.careerInput(bare),`${expected}: progression fallback must not change the r75 career input`);
      assert.notEqual(A.careerInput(state).indexStatus,"loading",`${expected} must not become an endless loading state`);
    }
    // A History already ahead of a stale progression snapshot is not replaced by the older projection.
    const newer=F.projection({totalSeasons:3,seasons:seasons.slice(0,2)}),stale=F.projection({totalSeasons:3,seasons:seasons.slice(0,1)});
    const view=A.rivalryView({identity:F.identity(),pair:F.pair(newer.rivalryId),multiSeason:{...F.multiFor(stale),projection:stale},history:F.history(newer)});
    assert.equal(view.status,"loading","History ahead of progression: wait for progression, never show the previous season as ready");
  }
  console.log("PASS midway career isolation: both managers retain r75 loading input with no career trophies, counters or history after seasons 1 and 2; live standings and Home scores remain ready.");
  for(const managerId of ["daniel","nik"]){
    for(const history of [F.history(lagging),null]){
      const {document:doc,frames}=render({...snapshot,history,identity:F.identity(managerId),pair:F.pair(p.rivalryId,{managerId})});
      const rows=doc.getElementById("sdgRows");
      console.log(`THIS SHOWDOWN ${managerId}, History ${history?"lagging":"missing"}: status=${frames.SHOWDOWN.model.status}, rows=${rows.children.length}, state=${doc.getElementById("sdgState").textContent||"(none)"}`);
      // r80: the Europa Leagues row joins the board (8 rows, after Champions Leagues).
      assert.equal(rows.children.length,8,"2 committed seasons of a 5-season Showdown must render standings rows instead of Loading standings.");
      assert.deepEqual([...rows.children].map(row=>row.dataset.field),["seasonWins","seasonDraws","seasonLosses","championsLeagues","europaLeagues","leagueTitles","domesticCups","totalTrophies"]);
      assert.equal(doc.getElementById("sdgState").hidden,true);assert.equal(rows.hidden,false);
      assert.equal(doc.getElementById("sdgScoreDaniel").textContent,"6");assert.equal(doc.getElementById("sdgScoreNik").textContent,"8");
      assert.equal(doc.getElementById("sdgProgress").textContent,"Season 3 of 5");
      for(const row of rows.children){assert.equal(row.children[0].textContent,String(p.managerRecords.playerOne[row.dataset.field]));assert.equal(row.children[2].textContent,String(p.managerRecords.playerTwo[row.dataset.field]));}
      // The existing UI names its section HEAD-TO-HEAD; THIS SHOWDOWN is its tab.
      const section=doc.getElementById("sdgSection"),tab=doc.getElementById("sdgViewShowdown");
      assert.equal(section.textContent,"HEAD-TO-HEAD");assert.equal(section.hidden,false);
      assert.equal(tab.getAttribute("role"),"tab");assert.equal(tab.disabled,false);assert.equal(tab.hidden,false);
      doc.getElementById("sdgViewCareer").click();assert.equal(doc.getElementById("stage-root").dataset.view,"career");
      tab.click();assert.equal(doc.getElementById("stage-root").dataset.view,"this-showdown");assert.equal(rows.children.length,8,"enabled tab returns to HEAD-TO-HEAD rows");
    }
  }
  assert.equal(multi.projection,p,"retain the history already verified by progression, without a second provider read");
  assert.equal(authorityReads,1);assert.equal(historyReads,1);assert.equal(JSON.stringify(snapshot),before,"rendering leaves source snapshots untouched");
  const missing={...snapshot,history:null,multiSeason:{...multi,projection:null}};
  assert.equal(A.rivalryView(missing).status,"loading","no committed proof cannot invent numbers");
  for(const change of [m=>{m.projection.managerRecords.playerOne.totalPoints++;},m=>{m.state.acceptedRevisionKey="different";},m=>{m.state.fixedClubs.playerOne="other";},m=>{m.state.totalSeasons=3;},m=>{m.state.leagueId="laliga";},m=>{m.projection=clone(F.projection({seed:"2",totalSeasons:5,seasons}));}]){
    const changed=clone(multi);change(changed);assert.equal(A.rivalryView({...snapshot,history:null,multiSeason:changed}).status,"unavailable","invalid committed proof must fail closed");
  }
  assert.equal(A.rivalryView({...snapshot,pair:F.pair(p.rivalryId,{status:"signed-out"})}).status,"unavailable");
  assert.equal(A.rivalryView({...snapshot,multiSeason:{...multi,authoritative:false}}).status,"ready","independent verified cached history remains usable without progression authority");
  const final=F.projection({totalSeasons:5,seasons:[...seasons,[F.result(),F.result()],[F.result(),F.result()],[F.result(),F.result()]]});
  const closed={...snapshot,multiSeason:{...F.multiFor(final),projection:final},history:F.history(final),terminalClose:F.closed(final)};
  const {frames}=render(closed);assert.equal(frames.SHOWDOWN.model.status,"ready");assert.equal(frames.SHOWDOWN.model.score.daniel,final.managerRecords.playerOne.totalPoints);assert.equal(frames.SHOWDOWN.model.score.nik,final.managerRecords.playerTwo.totalPoints);
  // Sol r86 #03: career totals count completed Showdowns only, so the empty Career tab after season 1 says exactly that.
  assert.equal(JSON.parse(read("visual-assets/v10_1/standings/app-strings.json")).strings.emptyCareer,"Career standings appear after your first finished Showdown.");
  console.log("PASS midway THIS SHOWDOWN: both managers render correct 2/5 committed standings and enabled HEAD-TO-HEAD scope with lagging/missing History; one existing progression read, invalid proof fails closed, terminal totals preserved.");
})().catch(error=>{console.error(error);process.exitCode=1;});
