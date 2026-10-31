'use strict';
// r87 match-day polish (2.0.0): Transfer War, Season Results, the committed SEASON SCORE and Final Winner, plus the proofread
// plurals and the Showdown Champion trophy load the lead routed here. Look-only changes and words: no Firestore read or
// write is added, nothing is decided differently, and equal stays level (no tiebreak).
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const ROOT=path.resolve(__dirname,'../..');
const read=file=>fs.readFileSync(path.join(ROOT,file),'utf8');
let checks=0;const ok=(id,label)=>{checks+=1;console.log(`ok ${checks} ${id} ${label}`);};

// A small DOM: enough for the scoreboard builder (createElement, classes, text, children, :scope > .class lookup).
function fakeDocument(){
  class Node{
    constructor(tag){this.tagName=tag.toUpperCase();this.children=[];this.attributes={};this.dataset={};this._text='';this.className='';const self=this;this.classList={add(...names){const set=new Set(self.className.split(/\s+/).filter(Boolean));names.forEach(n=>set.add(n));self.className=[...set].join(' ');},contains(n){return self.className.split(/\s+/).includes(n);}};}
    set textContent(v){this._text=String(v);this.children=[];}
    get textContent(){return this.children.length?this.children.map(c=>c.textContent).join(''):this._text;}
    setAttribute(k,v){this.attributes[k]=String(v);}
    append(...nodes){nodes.forEach(n=>{n.parentNode=this;this.children.push(n);});}
    appendChild(n){this.append(n);return n;}
    replaceChildren(...nodes){this.children=[];this.append(...nodes);}
    querySelector(sel){const m=/^:scope > \.([\w-]+)$/.exec(sel);if(!m)throw new Error('selector '+sel);return this.children.find(c=>c.classList.contains(m[1]))||null;}
    all(cls){const out=[];const walk=n=>{if(n.classList.contains(cls))out.push(n);n.children.forEach(walk);};walk(this);return out;}
  }
  return {createElement:tag=>new Node(tag),Node};
}
function loadScoring(managers){
  const document=fakeDocument();
  const context=vm.createContext({globalThis:null,console,document,currentShowdown:{managers}});
  context.globalThis=context;
  vm.runInContext(read('js/productionSharedCanonicalScoring.js')+'\n;globalThis.__pcsc=CareerModeProductionSharedCanonicalScoring;',context,{filename:'js/productionSharedCanonicalScoring.js'});
  return {api:context.__pcsc,document};
}
const score=(o={})=>({championsLeague:0,europaLeague:0,leagueTitle:0,domesticCup:0,performanceBonus:0,individualAwardsBonus:0,total:0,...o});

// M1 the committed SEASON SCORE is a scoreboard: names, big totals with the higher one gold, one row per category with the
// higher number gold, and the verdict. The plain lines stay for screen readers and audits; the board is aria-hidden.
{
  const {api,document}=loadScoring({playerOne:'Daniel',playerTwo:'Nik'});
  assert.equal(typeof api.scoreBoard,'function');
  const panel=document.createElement('section');
  const one=score({championsLeague:5,leagueTitle:3,domesticCup:1,performanceBonus:1,individualAwardsBonus:1,total:11}),two=score();
  api.scoreBoard(panel,one,two,'Daniel','Nik','playerOne');
  const board=panel.querySelector(':scope > .pcscBoard');
  assert.ok(board,'the board is drawn inside the scoring panel');assert.equal(board.attributes['aria-hidden'],'true');
  assert.ok(panel.classList.contains('hasPcscBoard'),'the panel is marked so the plain lines are visually hidden');
  const totals=board.all('pcscBoard__total');
  assert.deepEqual(totals.map(n=>n.textContent),['11','0']);
  assert.deepEqual(totals.map(n=>n.classList.contains('is-lead')),[true,false],'the higher season score is gold');
  assert.deepEqual(board.all('pcscBoard__name').map(n=>n.textContent),['Daniel','Nik']);
  const rows=board.all('pcscBoard__row');
  assert.deepEqual(rows.map(r=>r.all('pcscBoard__label')[0].textContent),['Champions League','League Title','Domestic Cup','Performance Bonus','Awards Bonus'],'no Europa League row when neither won it');
  assert.deepEqual(rows[0].all('pcscBoard__val').map(n=>[n.textContent,n.classList.contains('is-lead')]),[['+5',true],['+0',false]]);
  assert.equal(board.all('pcscBoard__verdict')[0].textContent,'SEASON WINNER · Daniel');
  ok('M1','SEASON SCORE scoreboard: totals, per-category rows, winner plaque');
}
// M2 equal stays level: a level row has no gold side, a drawn season says SEASON DRAWN (never a tiebreak), and the
// Europa League row shows for both when either won it.
{
  const {api,document}=loadScoring({playerOne:'Daniel',playerTwo:'Nik'});
  const panel=document.createElement('section');
  const one=score({europaLeague:3,domesticCup:1,total:4}),two=score({leagueTitle:3,domesticCup:1,total:4});
  api.scoreBoard(panel,one,two,'Daniel','Nik','draw');
  const board=panel.querySelector(':scope > .pcscBoard');
  assert.deepEqual(board.all('pcscBoard__total').map(n=>n.classList.contains('is-lead')),[false,false],'equal totals: neither is gold');
  const rows=board.all('pcscBoard__row'),labels=rows.map(r=>r.all('pcscBoard__label')[0].textContent);
  assert.ok(labels.includes('Europa League'));
  const cup=rows[labels.indexOf('Domestic Cup')].all('pcscBoard__val');
  assert.deepEqual(cup.map(n=>n.classList.contains('is-lead')),[false,false],'a level row has no gold side');
  const verdict=board.all('pcscBoard__verdict')[0];assert.equal(verdict.textContent,'SEASON DRAWN');assert.ok(verdict.classList.contains('is-draw'));
  // The same numbers again do not rebuild the board (the panel re-renders on every poll).
  const first=board.children[0];api.scoreBoard(panel,one,two,'Daniel','Nik','draw');assert.equal(board.children[0],first);
  ok('M2','level rows and a drawn season stay level; same numbers, no rebuild');
}
// M3 proofread plurals and casing (W3-7): one trophy, one season, the waiting name in capitals, one verb (CONFIRMED).
{
  assert.match(read('js/productionSharedHistoryConvergence.js'),/Number\(item\.totalTrophies\)===1\?"trophy":"trophies"/);
  const pmsp=read('js/productionSharedMultiSeasonProgression.js');
  assert.match(pmsp,/Number\(total\)===1\?"Season complete":`All \$\{total\} seasons complete`/);
  assert.match(pmsp,/Number\(state\.totalSeasons\)===1\?"SEASON PLAYED · FINAL RESULT NEXT"/);
  const pfr=read('js/productionSharedFinalReconciliation.js');
  assert.equal((pfr.match(/===1\?"SEASON PLAYED":"SEASONS PLAYED"\}/g)||[]).length,2,'both final summary lines');
  assert.match(read('visual-assets/v10_1/final-winner/final-winner.js'),/season\$\{Number\(frame\.seasonsPlayed\) === 1 \? "" : "s"\} played/);
  const commit=read('js/productionSharedSeasonCommit.js');
  assert.match(commit,/WAITING FOR \$\{String\(psscManagerName\(coordinator\)\)\.toUpperCase\(\)\} TO LOCK THE SEASON/);
  assert.ok(commit.includes('"SEASON CONFIRMED BY BOTH MANAGERS"'));assert.ok(!/SEASON COMMITTED/.test(commit));
  assert.ok(pmsp.includes('commitStatus.textContent==="SEASON CONFIRMED BY BOTH MANAGERS"'),'the progression panel still spots the duplicate line');
  ok('M3','plurals, waiting name casing and one verb on the commit step');
}
// M4 the Showdown Champion trophy is loaded into memory while Season Results / Final Winner prepare, so swapping the
// stages in the last season never cancels its load (CE2PG net::ERR_FAILED); it never blocks longer than 2.5 s.
{
  const src=read('js/seasonFinalV10.js');
  assert.match(src,/const TROPHY_PATH="visual-assets\/v10_1\/shared\/trophies\/TRO_SHOWDOWN_CHAMPION_V1_512\.webp"/);
  for(const shell of ['visual-assets/v10_1/final-winner/app-shell.html','visual-assets/v10_1/season-results/app-shell.html'])assert.ok(read(shell).includes('"visual-assets/v10_1/shared/trophies/TRO_SHOWDOWN_CHAMPION_V1_512.webp"'),`${shell} uses the same URL`);
  assert.match(src,/if\(folder==="season-results"\|\|folder==="final-winner"\)await sfWarmTrophy\(\);/);
  assert.match(src,/root\.setTimeout\(\(\)=>finish\(false\),2500\)/);
  // Under node (no Image) the warm-up resolves false at once and prepare carries on.
  const mod=require('../../js/seasonFinalV10.js');assert.ok(mod);
  ok('M4','trophy warmed before the stages mount');
}
// M5 Transfer War, Season Results and Final Winner looks (CSS only; nothing moves).
{
  const tw=read('css/v10Transfer.css'),sr=read('visual-assets/v10_1/season-results/app.css'),dd=read('js/deadlineDay.js'),html=read('index.html');
  assert.match(tw,/\.stage\[data-phase="WINDOW_OPEN"\] \.sign-screen\.is-live \.sign-main\.timer \{\s*font-size: max\(34px, calc\(var\(--k\) \* 52px\)\)/,'desktop hero clock');
  assert.match(tw,/\.verdict-row\.is-release \.vr-word \{/);assert.match(tw,/\.verdict-row\.is-keep \.vr-word \{/);
  assert.match(tw,/\.btn-continue:not\(\.hidden\) \{\s*background: #0b0906 url\("r78-marble-tile\.webp"\)/,'phone CONTINUE bar is opaque marble');
  assert.match(tw,/\[data-dd="countdown"\] \.sign-main\.timer \{ animation: twClockPulse/);assert.match(tw,/@keyframes twClockPulse \{[^}]*transform: scale\(1\)/);
  assert.match(dd,/stage\.parentElement\.dataset\.dd=view\.mode/);assert.match(dd,/delete host\.dataset\.dd;/);
  assert.match(sr,/#outcomeHeadline\.sd-title-wipe::after\{content:none!important;display:none!important\}/,'no black wipe block on the winner headline');
  assert.match(sr,/\.finalWinnerManager \.fwSpecialPlayer\{order:3;/,'SP chip under the score, off the name label');
  for(const id of ['p1LeaguePosition','p1LeaguePoints','p1LeagueGoals','p2LeaguePosition','p2LeaguePoints','p2LeagueGoals'])assert.match(html,new RegExp(`id="${id}"[^>]*placeholder="–"`),`${id} shows a dash, not a number that reads as data`);
  // No dimming: nothing added sets a page-wide overlay or lowers opacity of a screen.
  for(const css of [tw.slice(tw.indexOf('r87 match-day polish')),sr.slice(sr.indexOf('r87 match-day polish'))])assert.doesNotMatch(css,/backdrop-filter|filter:\s*brightness|rgba\(0,\s*0,\s*0,\s*\.[5-9]\)\s*;?\s*inset/);
  ok('M5','Transfer War, Season Results and Final Winner looks');
}
// M6 (sizes F2) LOCK MY GUESSES never moves under a tap: the open search list sits in the page's flow, so closing it on the
// press would shift the button up and the release would land on the empty panel. A press outside the box keeps the list open
// until that press has finished and its click has landed; the blur close waits for it too.
{
  const docL={},winL={};let timers=[];
  const on=bag=>(type,fn)=>{(bag[type]=bag[type]||[]).push(fn);};
  const fire=(bag,type,ev)=>(bag[type]||[]).forEach(fn=>fn(ev));
  const flush=()=>{while(timers.length){const t=timers;timers=[];t.sort((a,b)=>a.ms-b.ms).forEach(x=>x.fn());}};
  const window={addEventListener:on(winL),removeEventListener(){},setTimeout:(fn,ms)=>{timers.push({fn,ms});return timers.length;}};
  const list={hidden:false,classList:{add(c){if(c==='hidden')list.hidden=true;},remove(c){if(c==='hidden')list.hidden=false;}}};
  const input={attrs:{},setAttribute(k,v){this.attrs[k]=v;},removeAttribute(k){delete this.attrs[k];}};
  const document={addEventListener:on(docL),querySelectorAll:()=>[input]};
  const ctx=vm.createContext({window,document,console});
  vm.runInContext(read('js/transferSelector.js')+'\n;transferSelectorStates.set(globalThis.__in,{input:globalThis.__in,list:globalThis.__list,kind:"league",filteredOptions:[],activeIndex:-1});',Object.assign(ctx,{__in:input,__list:list,globalThis:ctx}),{filename:'js/transferSelector.js'});
  vm.runInContext('bindTransferSelectorDocumentDismiss()',ctx);
  const outside={target:{closest:()=>null}};
  fire(docL,'pointerdown',outside);
  assert.equal(list.hidden,false,'pressing LOCK MY GUESSES does not close the list (and move the button) before the press ends');
  assert.equal(typeof ctx.closeTransferSelectorAfterBlur,'function','blur close goes through the press-aware helper');
  ctx.closeTransferSelectorAfterBlur(input);flush();
  assert.equal(list.hidden,false,'the 120 ms blur close waits for the press too');
  fire(winL,'pointerup',{});
  assert.equal(list.hidden,false,'still open while the click is dispatched');
  flush();
  assert.equal(list.hidden,true,'closed once the press and its click are done');
  // Without a press (Tab away), blur still closes after 120 ms.
  list.hidden=false;ctx.closeTransferSelectorAfterBlur(input);flush();assert.equal(list.hidden,true);
  // A cancelled press (scroll) also releases the list.
  list.hidden=false;fire(docL,'pointerdown',outside);fire(winL,'pointercancel',{});flush();assert.equal(list.hidden,true);
  assert.match(read('js/transferSelector.js'),/input\.addEventListener\("blur", \(\) => closeTransferSelectorAfterBlur\(input\)\)/);
  ok('M6','LOCK MY GUESSES stays put under the tap (sizes F2)');
}
// M7 (sizes F11) at 844x390 the Signing form scrolls, and the HOME / progress / REFRESH rail was fixed over it, so LOCK MY
// SIGNINGS and REFRESH overlapped mid-scroll (a layer swap only changes which one is covered). On a sideways phone the rail
// sits in the page's flow under the cards; the world is one rail short of the screen so a page that fits still ends on it.
{
  const tw=read('css/v10Transfer.css');
  const at=tw.indexOf('/* r87 sizes F11:');assert.ok(at>0,'F11 block');
  const media=tw.lastIndexOf('@media',at);
  assert.equal(tw.slice(media,tw.indexOf('{',media)).trim(),'@media (orientation: landscape) and (max-height: 500px) and (max-width: 1100px)');
  const block=tw.slice(media,tw.indexOf('\n}\n',at));
  assert.match(block,/\.hud-footer \{ position: relative; left: auto; right: auto; bottom: auto; \}/,'rail in flow');
  assert.doesNotMatch(block,/\.hud-footer \{ position: fixed; \}/,'no fixed rail over the scrolling cards');
  assert.match(block,/min-height: calc\(100svh - 52px\)[^}]*padding-bottom: 4px;/,'world one rail short, no reserved fixed-rail gap');
  ok('M7','LOCK MY SIGNINGS and REFRESH never overlap on a sideways phone (sizes F11)');
}
console.log(`PASS r87 match-day polish contracts (${checks} checks)`);
