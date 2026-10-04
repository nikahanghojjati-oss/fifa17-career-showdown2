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
 const src=read('js/rivalryLegacyV10.js');assert.match(src,/screens\.register/);assert.match(src,/screens\.invalidate/);assert.match(read('js/statistics.js'),/openRivalryLegacyV10/);assert.match(read('js/legacy.js'),/openRivalryLegacyV10/);
 assert.ok(!read('index.html').includes('rivalryLegacyV10'));
});
check('RL10 referenced assets exist and only text enters the shell precache',()=>{
 const sw=read('service-worker.js'),shell=new Set([...sw.matchAll(/^\s+"([^"]+)",?$/gm)].map(x=>x[1]));
 for(const file of V.RUNTIME_FILES){assert.ok(fs.existsSync(path.join(ROOT,file)),file);if(file.endsWith('.webp'))assert.ok(!shell.has(file));else assert.ok(shell.has(file),file);}
 for(const screen of ['legacy','rivalryStatistics']){const html=V.markup(screen);assert.ok(html.includes('data-src1x=')&&html.includes('data-src2x='),'stage.js reads dataset.src1x/src2x');assert.ok(!html.includes('data-src-1x='));assert.ok(!html.includes('Preview data'));}
});
console.log(`v10-rivalry-legacy contracts passed (${n} checks)`);
