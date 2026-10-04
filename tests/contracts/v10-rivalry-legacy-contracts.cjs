#!/usr/bin/env node
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const ROOT=path.resolve(__dirname,'../..'),read=f=>fs.readFileSync(path.join(ROOT,f),'utf8');
const V=require('../../js/rivalryLegacyV10.js');
const ids=['empty-career','loading','unavailable','partial-career','finished-three-seasons','multi-showdown-career','tiebreak-finish'];
const fixture=id=>JSON.parse(read(`tests/fixtures/data-contract-v1/${id}.json`));
const managers=['daniel','nik'],clone=x=>JSON.parse(JSON.stringify(x));
let n=0;function check(name,fn){fn();console.log(`ok ${++n} ${name}`);}
function numbers(v){return typeof v==='number'?[v]:v&&typeof v==='object'?Object.values(v).flatMap(numbers):[];}
check('RL1 all contract fixtures map History and the current rivalry separately',()=>{
 for(const id of ids){const f=fixture(id),h=V.toV10Frame(f.career,'legacy');assert.equal(h.status,f.career.status==='ready'&&!f.career.history.showdowns.some(x=>x.status==='completed')?'empty':f.career.status,id);
  for(const who of managers){const src=f.viewers[who].rivalry,r=V.toV10Frame(src,'rivalryStatistics');assert.equal(r.status,src.status,id);assert.deepEqual(r.managerOrder,managers);assert.ok(Object.isFrozen(r));}
  assert.deepEqual(h.managerOrder,managers);assert.ok(Object.isFrozen(h));
 }
 assert.equal(V.toV10Frame(null,'legacy').status,'unavailable');assert.equal(V.toV10Frame({},'rivalryStatistics').status,'unavailable');
});
check('RL2 History includes only verified completed rows, without backfill',()=>{
 for(const id of ids){const m=fixture(id).career,f=V.toV10Frame(m,'legacy');
  if(['ready','partial','empty'].includes(f.status))assert.deepEqual(f.showdowns.map(x=>x.number),m.history.showdowns.filter(x=>x.status==='completed').map(x=>x.number));
  for(const row of f.showdowns||[]){const src=m.history.showdowns.find(x=>x.number===row.number);assert.deepEqual(row.totals,src.totals);assert.deepEqual(row.seasons,src.seasons);assert.deepEqual(Object.keys(row.clubs),managers);assert.equal(row.winner,src.winner);}
 }
 const m=clone(fixture('multi-showdown-career').career);m.history.showdowns.push({...m.history.showdowns[0],number:99,status:'abandoned'});assert.ok(!V.toV10Frame(m,'legacy').showdowns.some(x=>x.number===99));
});
check('RL3 current rivalry uses adapter numbers, Daniel first even when Nik leads',()=>{
 for(const id of ids){const src=fixture(id).viewers.daniel.rivalry,f=V.toV10Frame(src,'rivalryStatistics');
  if(f.managerRecords){assert.deepEqual(Object.keys(f.managerRecords),managers);assert.deepEqual(f.managerRecords,src.managers);assert.deepEqual(f.score,src.score);assert.deepEqual(f.seasons,src.seasons);}
 }
 const m=fixture('finished-three-seasons').career,f=V.toV10Frame(m,'rivalryStatistics');assert.deepEqual(f.score,m.history.showdowns[0].totals);assert.equal(f.ui.lifecycle,'completed');
 assert.equal(V.toV10Frame(fixture('multi-showdown-career').career,'rivalryStatistics').status,'unavailable','never use whole-career totals for one rivalry');
});
check('RL4 loading and unavailable contain no numbers or made-up cards',()=>{
 for(const id of ['loading','unavailable'])for(const screen of ['legacy','rivalryStatistics']){const f=fixture(id),frame=V.toV10Frame(screen==='legacy'?f.career:f.viewers.daniel.rivalry,screen);assert.deepEqual(numbers(frame),[]);}
});
check('RL5 partial History keeps coverage; transfer gaps stay unavailable',()=>{
 const m=fixture('partial-career').career,f=V.toV10Frame(m,'legacy');assert.deepEqual(f.coverage,m.coverage);
 const src=clone(fixture('finished-three-seasons').viewers.daniel.rivalry);src.status='partial';src.coverage={readable:1,indexed:3};const r=V.toV10Frame(src,'rivalryStatistics');assert.deepEqual(r.coverage,src.coverage);assert.equal(r.transfers.status,'unavailable');assert.equal(r.transfers.previewPerSeasonSummary,undefined);
});
check('RL6 a missing numeric field is unavailable, never zero',()=>{
 const m=clone(fixture('finished-three-seasons').career);m.history.showdowns[0].totals.nik=null;assert.equal(V.toV10Frame(m,'legacy').status,'unavailable');
 const r=clone(fixture('finished-three-seasons').viewers.daniel.rivalry);delete r.managers.nik.leagueTitles;assert.equal(V.toV10Frame(r,'rivalryStatistics').status,'unavailable');
 const s=clone(fixture('finished-three-seasons').career);delete s.history.showdowns[0].seasons[0].leagueGoals.nik;assert.equal(V.toV10Frame(s,'legacy').status,'unavailable');
});
check('RL7 final draws and season tiebreaks survive mapping unchanged',()=>{
 const m=fixture('tiebreak-finish').career,h=V.toV10Frame(m,'legacy'),r=V.toV10Frame(m,'rivalryStatistics');assert.equal(h.showdowns[0].winner,'draw');assert.deepEqual(h.showdowns[0].seasons,m.history.showdowns[0].seasons);assert.equal(r.ui.lifecycle,'completed');assert.equal(r.score.daniel,r.score.nik);
});
check('RL8 all statistics buttons are outside online containment',()=>{
 const src=read('js/onlinePlayerIdentity.js'),css=/style\.textContent="(.*?)\{display:none!important\}/.exec(src);assert.ok(css);for(const id of ['legacyButton','rivalryStatisticsButton','careerStatisticsButton','trophyRoomButton'])assert.ok(!css[1].includes('#'+id));
});
check('RL9 production entry points are lazy and never read sample fixtures',()=>{
 for(const f of ['js/rivalryLegacyV10.js','visual-assets/v10_1/legacy/legacy.js','visual-assets/v10_1/rivalry-statistics/rivalry-statistics.js'])assert.ok(!read(f).includes('fixtures.json'),f);
 const src=read('js/rivalryLegacyV10.js');assert.match(src,/api\.register/);assert.match(src,/screens\(\)\.invalidate/);assert.match(read('js/statistics.js'),/openRivalryLegacyV10/);assert.match(read('js/legacy.js'),/openRivalryLegacyV10/);
 assert.ok(!read('index.html').includes('rivalryLegacyV10'));
});
check('RL10 referenced assets exist and only text enters the shell precache',()=>{
 const sw=read('service-worker.js'),shell=new Set([...sw.matchAll(/^\s+"([^"]+)",?$/gm)].map(x=>x[1]));
 for(const file of V.RUNTIME_FILES){assert.ok(fs.existsSync(path.join(ROOT,file)),file);if(file.endsWith('.webp'))assert.ok(!shell.has(file));else assert.ok(shell.has(file),file);}
 for(const screen of ['legacy','rivalryStatistics']){const html=V.markup(screen);assert.ok(html.includes('data-src1x=')&&html.includes('data-src2x='),'stage.js reads dataset.src1x/src2x');assert.ok(!html.includes('data-src-1x='));assert.ok(!html.includes('Preview data'));}
});
check('RL11 real Team V renderers show honest states and live values without fixture fetches',()=>{
 const vm=require('node:vm'),{FakeNode}=require('../support/fake-dom.cjs');
 const matches=(el,sel)=>sel.startsWith('.')?el.classList.contains(sel.slice(1)):sel.startsWith('#')?el.id===sel.slice(1):sel.startsWith('[')?(()=>{const m=/\[([\w-]+)(?:="([^"]+)")?\]/.exec(sel);if(!m)return false;const k=m[1].replace(/^data-/,'').replace(/-([a-z])/g,(_,c)=>c.toUpperCase());return m[2]===undefined?el.dataset[k]!==undefined:String(el.dataset[k])===m[2];})():el.tagName===sel.toUpperCase();
 class Element extends FakeNode{
  constructor(tag){super(tag);this.style={setProperty(){},removeProperty(){}};this.events={};this.disabled=false;this.scrollLeft=0;this.clientWidth=400;}
  querySelectorAll(sel){return this.all().filter(x=>matches(x,sel));}querySelector(sel){return this.querySelectorAll(sel)[0]??null;}
  addEventListener(k,fn){(this.events[k]??=[]).push(fn);}focus(){}closest(sel){let e=this;while(e){if(matches(e,sel))return e;e=e.parent;}return null;}
  get innerHTML(){return this.html??'';}set innerHTML(s){this.html=String(s);this.replaceChildren();}
 }
 const run=(screen,frame)=>{
  const map=new Map(),html=V.markup(screen),nodes=[];for(const m of html.matchAll(/<([\w-]+)([^>]*)>/g)){const id=/\bid="([^"]+)"/.exec(m[2]);if(!id)continue;const e=new Element(m[1]);e.id=id[1];e.className=/\bclass="([^"]+)"/.exec(m[2])?.[1]??'';e.hidden=/\bhidden\b/.test(m[2]);map.set(e.id,e);nodes.push(e);}
  const doc={getElementById:id=>map.get(id)??null,createElement:t=>new Element(t),createTextNode:s=>Object.assign(new Element('#text'),{textContent:s}),querySelector:sel=>nodes.find(x=>matches(x,sel))??null,querySelectorAll:sel=>nodes.flatMap(x=>[x,...x.all()]).filter(x=>matches(x,sel)),documentElement:{dataset:{}}};
  let fetches=0;const ctx={document:doc,location:{search:''},URLSearchParams,console,setTimeout:()=>1,clearTimeout(){},matchMedia:()=>({matches:false,addEventListener(){},removeEventListener(){}}),getClubCrestSvg:()=>'',getLeagueMark:()=>null,ShowdownStage:{mount:()=>({destroy(){}})}};ctx.window=ctx;vm.createContext(ctx);
  const dir=screen==='legacy'?'legacy':'rivalry-statistics',data={strings:JSON.parse(read(`visual-assets/v10_1/${dir}/strings.json`)),frames:{LIVE:clone(frame)}};
  ctx.fetch=()=>{fetches++;throw Error('unexpected fetch');};
  ctx[screen==='legacy'?'LEGACY_BOOT':'RIVALRY_BOOT']={fixtures:data,platemap:{}};
  vm.runInContext(read(`visual-assets/v10_1/${dir}/${dir}.js`),ctx);assert.equal(fetches,0);assert.equal(nodes.map(x=>x.textContent).join('').includes('Preview data'),false);
  ctx[screen==='legacy'?'ShowdownLegacyBoot':'ShowdownRivalryStatisticsBoot']();assert.equal(fetches,0);
  if(['loading','unavailable'].includes(frame.status)){
   if(screen==='legacy'){assert.equal(map.get('legacyCardGrid').childElementCount,0);assert.equal(map.get('viewSeasonHistory').disabled,true);assert.equal(map.get('legacyStateBanner').hidden,false);}
   else{assert.equal(map.get('rvRows').childElementCount,0);assert.equal(map.get('rvProgress').textContent,'');assert.equal(map.get('rvReadState').hidden,false);}
  }else if(screen==='legacy')assert.equal(map.get('legacyCardGrid').childElementCount,frame.showdowns.length);
  else{assert.ok(map.get('rvRows').innerHTML.includes('Unavailable'));assert.ok(map.get('rvSeasonBody').innerHTML.includes('<td>10</td>'));}
 };
 for(const screen of ['legacy','rivalryStatistics'])for(const id of ['loading','unavailable','finished-three-seasons']){
  const f=fixture(id);run(screen,V.toV10Frame(screen==='legacy'?f.career:f.viewers.daniel.rivalry,screen));
 }
});

(async()=>{
 const vm=require('node:vm');const registrations=new Map(),drawn=new Map(),prepared=new Set(),calls=[];let active='statistics',draws=0;
 const hosts=Object.fromEntries(['legacy','statistics'].map(id=>[id,{id,innerHTML:'original '+id,dataset:{},querySelector:()=>null,querySelectorAll:()=>[],setAttribute(){}}]));
 const ctx={console,URLSearchParams,document:{getElementById:id=>hosts[id]??null},CareerModeCareerScreenSeam:require('../../js/careerScreenSeam.js'),CareerModeOnlinePlayerIdentity:{getState:()=>({registered:true,managerId:'daniel'})},getClubCrestSvg(){},renderRivalryStatistics(){hosts.statistics.innerHTML='old renderer';return 17;},renderLegacy(){hosts.legacy.innerHTML='old legacy';},addEventListener(){}};ctx.window=ctx;
 ctx.CareerModeV10Screens={install(){return this;},register(id,def){assert.ok(!registrations.has(id));registrations.set(id,def);},isMounted:id=>drawn.has(id),invalidate:id=>drawn.delete(id),hide(id){const old=drawn.get(id);if(old)registrations.get(id).unmount(hosts[id]);drawn.delete(id);},async show(id){const def=registrations.get(id);if(!prepared.has(id)){await def.prepare();prepared.add(id);}if(id!==active)return false;const frame=def.frame();if(!frame)return false;if(drawn.get(id)!==frame){def.mount(frame,hosts[id]);drawn.set(id,frame);}return true;}};
 ctx.ShowdownRivalryStatisticsBoot=()=>{draws++;assert.ok(hosts.statistics.innerHTML.includes('rvRows'));};ctx.ShowdownLegacyBoot=()=>{draws++;assert.ok(hosts.legacy.innerHTML.includes('viewSeasonHistory'));};
 ctx.fetch=async file=>({ok:true,json:async()=>JSON.parse(read(file))});
 vm.createContext(ctx);vm.runInContext(read('js/rivalryLegacyV10Markup.js'),ctx);
 ctx.loadRuntimeScript=async(key,file,ready)=>{calls.push(file);assert.ok(ready(),file+' preloaded in harness');};
 vm.runInContext(read('js/rivalryLegacyV10.js'),ctx);const api=ctx.CareerModeRivalryLegacyV10,m=fixture('finished-three-seasons').career;
 await api.mount('rivalryStatistics',()=>m);assert.deepEqual([...registrations.keys()],['legacy','statistics']);assert.equal(draws,1);assert.equal(ctx.renderRivalryStatistics(),17);
 for(let i=0;i<8;i++)await new Promise(r=>setImmediate(r));assert.equal(draws,2,'same-model legacy rewrite remounts once');
 active='legacy';ctx.CareerModeV10Screens.hide('statistics');assert.equal(hosts.statistics.innerHTML,'original statistics');assert.equal(hosts.statistics.dataset.rivalryLegacyV10,undefined);
 await api.mount('legacy',()=>m);assert.equal(draws,3);assert.equal(ctx.LEGACY_BOOT.fixtures.frames.LIVE.showdowns.length,1);assert.equal(registrations.size,2,'screen registrations stay unique');
 assert.ok(calls.every(file=>!file.includes('fixtures.json')));console.log(`ok ${++n} RL12 loader registration, remount and unmount preserve the existing routes`);
 {const vi=read('js/visualIdentity.js'),loader=read('js/rivalryLegacyV10.js'),m=loader.match(/load\("visual-identity","js\/visualIdentity\.js","([A-Za-z]+)"\)/);
  for(const g of ['getClubCrestSvg','getLeagueMark'])assert.ok(vi.includes(`window.${g} = ${g};`),`js/visualIdentity.js must expose window.${g}, which Team V's screens call`);
  assert.ok(m&&vi.includes(`window.${m[1]} = ${m[1]};`),'the loader waits for a global that js/visualIdentity.js really sets');
  for(const f of ['visual-assets/v10_1/legacy/legacy.js','visual-assets/v10_1/rivalry-statistics/rivalry-statistics.js'])for(const g of read(f).match(/window\.get[A-Za-z]+(?=\()/g)||[])assert.ok(vi.includes(`${g} = `),`${f} calls ${g}, which js/visualIdentity.js must expose`);}
 console.log(`ok ${++n} RL13 the crest and league-mark globals Team V's screens call are provided by js/visualIdentity.js`);
 {const src=read('js/rivalryLegacyV10.js'),css=read('css/rivalryLegacyV10.css');
  assert.ok(/screen==="legacy"[^;]*\.sd-stage__layer--ui[\s\S]{0,400}className="backButton /.test(src),'History keeps a .backButton for smart Back (the stability audit clicks #legacy .backButton)');
  assert.ok(/sd-stage__layer--ui\s*\{\s*pointer-events:none/.test(css),'the empty rivalry UI layer must not intercept the Back click');}
 console.log(`ok ${++n} RL14 History keeps a Back button and Rivalry Back stays clickable`);
 console.log(`v10-rivalry-legacy contracts passed (${n} checks)`);
})().catch(error=>{console.error(error);process.exitCode=1;});

