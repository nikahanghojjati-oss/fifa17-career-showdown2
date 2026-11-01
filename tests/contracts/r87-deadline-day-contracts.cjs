'use strict';
// r87 Deadline Day (Nik 2026-10-29): the last 60 seconds of a live Transfer Challenge window show a Sky Sports-style DEADLINE DAY
// strip with rolling headlines, and from 10 seconds left one commentator line. It reads the window clock production already
// draws (#transferTimerDisplay, from the shared deadline): no Firebase read or write, no timer of its own, nothing decided or
// scored. It takes its own room in Team V's layout (never a layer over the clock or anything else), in the black-marble and
// gold house style, with no dimming.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const ROOT=path.resolve(__dirname,'../..');
const read=file=>fs.readFileSync(path.join(ROOT,file),'utf8');
const Deadline=require('../../js/deadlineDay.js');
const Lines=require('../../data/deadlineDayLines.js');
let checks=0;const ok=(id,label)=>{checks+=1;console.log(`ok ${checks} ${id} ${label}`);};

// D1 the clock text production draws, in whole seconds; anything else (SYNC, REPLAY, blank) is no clock.
{
  assert.equal(Deadline.seconds('05:00'),300);assert.equal(Deadline.seconds('01:00'),60);assert.equal(Deadline.seconds('00:09'),9);
  assert.equal(Deadline.seconds(' 0:45 '),45);assert.equal(Deadline.seconds('10:00'),600);
  for(const bad of ['SYNC','REPLAY','','--:--','00:60','1:5','100:00',null,undefined,45])assert.equal(Deadline.seconds(bad),null,String(bad));
  ok('D1','reads only the MM:SS window clock');
}

// D2 off / ticker (60..11 s left) / countdown (10..1 s left), only for a live window.
{
  const m=Deadline.mode;
  assert.equal(m(true,61),'off');assert.equal(m(true,60),'ticker');assert.equal(m(true,11),'ticker');
  assert.equal(m(true,10),'countdown');assert.equal(m(true,1),'countdown');assert.equal(m(true,0),'off','the window has closed: production takes over');
  assert.equal(m(true,null),'off');assert.equal(m(false,30),'off','a replay or closed window never shows it');assert.equal(m(undefined,5),'off');assert.equal(m('true',5),'off');
  assert.equal(Deadline.TICKER_FROM_S,60);assert.equal(Deadline.LINE_FROM_S,10);
  ok('D2','60 s ticker, 10 s commentator line, live window only');
}

// D3 the words: the same on both phones (season + clock only), one headline per 5 s, one commentator line, {season} filled.
{
  const view=Deadline.view;
  assert.equal(view({windowLive:true,clock:'01:01',season:1,lines:Lines}).mode,'off');
  const a=view({windowLive:true,clock:'00:45',season:2,lines:Lines}),b=view({windowLive:true,clock:'00:45',season:2,lines:Lines});
  assert.deepEqual({...a},{...b},'deterministic');assert.ok(Object.isFrozen(a));
  assert.equal(a.mode,'ticker');assert.ok(Lines.ticker.some(row=>row.id===a.id));
  const clock=s=>`${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
  const ids=[];for(let s=60;s>10;s-=1)ids.push(view({windowLive:true,clock:clock(s),season:1,lines:Lines}).id);
  assert.ok(ids.every(Boolean));
  assert.equal(new Set(ids).size,Math.min(Lines.ticker.length,10),'a new headline every 5 seconds');
  for(let i=0;i<ids.length;i+=5)assert.equal(new Set(ids.slice(i,i+5)).size,1,'each headline holds for 5 seconds');
  for(let season=1;season<=10;season+=1){
    const lines=[10,9,5,1].map(s=>view({windowLive:true,clock:`00:${String(s).padStart(2,'0')}`,season,lines:Lines}));
    assert.ok(lines.every(v=>v.mode==='countdown'&&v.id===lines[0].id),'one commentator line for the last 10 seconds');
    assert.equal(lines[0].id,Lines.countdown[(season-1)%Lines.countdown.length].id);
    for(const v of lines)assert.doesNotMatch(v.text,/\{season\}/);
  }
  const filled=Lines.ticker.findIndex(row=>row.text.includes('{season}'));assert.ok(filled>=0);
  const seasonView=view({windowLive:true,clock:'01:00',season:filled+1,lines:Lines});
  assert.equal(seasonView.id,Lines.ticker[filled].id);assert.match(seasonView.text,new RegExp(`season ${filled+1}`));
  const fallback=view({windowLive:true,clock:'00:30',season:1,lines:null});
  assert.equal(fallback.mode,'ticker');assert.ok(fallback.text.length>0,'before the words load the strip still has a headline');
  assert.equal(view({windowLive:true,clock:'00:05',season:1,lines:null}).mode,'ticker','no line set: the ticker carries on');
  ok('D3','deterministic headline every 5 s and one commentator line, filled per season');
}

// D4 the line set: the commentary row style (id, situation, text), unique ids, {season} the only slot, short enough for a strip.
{
  assert.equal(Lines.contentVersion,1);assert.deepEqual([...Lines.slots],['season']);
  assert.ok(Lines.ticker.length>=6&&Lines.countdown.length>=4);
  const all=[...Lines.ticker,...Lines.countdown],ids=all.map(row=>row.id);
  assert.equal(new Set(ids).size,ids.length);
  for(const row of Lines.ticker){assert.equal(row.situation,'deadline-ticker');assert.match(row.id,/^dd-t-\d{2}$/);}
  for(const row of Lines.countdown){assert.equal(row.situation,'deadline-ten-seconds');assert.match(row.id,/^dd-c-\d{2}$/);}
  for(const row of all){
    assert.deepEqual(Object.keys(row).sort(),['id','situation','text']);assert.ok(Object.isFrozen(row));
    assert.ok(row.text.length>=10&&row.text.length<=96,`${row.id} fits a strip`);
    assert.deepEqual((row.text.match(/\{[^}]*\}/g)||[]).filter(slot=>slot!=='{season}'),[],`${row.id} slots`);
    assert.doesNotMatch(row.text,/tiebreak|tie-break|points?\b|score/i,'words only: no scoring talk');
  }
  ok('D4','line set in the commentary row style, {season} only, short');
}

// D5 zero Firebase: no read, write, listener, network call or timer of its own in either file.
{
  for(const file of ['js/deadlineDay.js','data/deadlineDayLines.js']){
    const src=read(file).replace(/\/\/.*$/gm,'');
    assert.doesNotMatch(src,/firebase|firestore|getDoc|setDoc|updateDoc|onSnapshot|runTransaction|collection\(|fetch\(|XMLHttpRequest|localStorage|setInterval|setTimeout|requestAnimationFrame/i,file);
  }
  assert.match(read('js/deadlineDay.js'),/root\.loadRuntimeScript\("deadline-day-lines","data\/deadlineDayLines\.js",/,'the words are a static shell file');
  ok('D5','0 Firebase reads/writes, no timer of its own');
}

// D6 driven by the existing window clock: the Transfer War skin passes its own clock text on every change, and tears it down.
{
  const src=read('js/transferScreenV10.js');
  assert.match(src,/hand\.style\.transform=`translate\(-50%, -100%\) rotate\(\$\{angle\}deg\)`;\}\n\s*tfDeadline\(text\);\n\s*\}/,'runs from tfSyncClock');
  assert.match(src,/function tfDeadline\(text\)\{[\s\S]{0,200}try\{deadline\.sync\(stage,mountedFrame,text\);\}catch\(error\)\{tfWarn\(/,'a strip failure never breaks the window');
  assert.match(src,/try\{root\.CareerModeDeadlineDay\?\.detach\?\.\(\);\}catch\(_error\)\{\}/,'removed with the skin');
  assert.match(src,/root\.loadRuntimeScript\("deadline-day","js\/deadlineDay\.js",\(\)=>Boolean\(root\.CareerModeDeadlineDay\)\)/);
  assert.match(read('js/deadlineDay.js'),/const live=Boolean\(frame&&frame\.windowLive===true\);/,'only a live window (never replay)');
  const sw=read('service-worker.js');
  for(const file of ['js/deadlineDay.js','data/deadlineDayLines.js']){
    assert.ok(sw.includes(`  "${file}",`),`${file} in SHELL_PATHS`);
    assert.match(sw,new RegExp(`SHELL_PATHS_ADDED_SINCE_PREVIOUS[^;]*"${file.replace(/[.\/]/g,'\\$&')}"`),`${file} offline for existing installs`);
  }
  ok('D6','tfSyncClock drives it; torn down with the skin; offline shell has both files');
}

// D7 layout: its own room in every layout (never over the clock or anything else); marble black and gold; no dimming.
{
  const css=read('css/v10Transfer.css'),dd=css.slice(css.indexOf('.tw-dd-world  a row'));
  assert.ok(dd.length>200);
  assert.match(dd,/\.ddStrip \{[^}]*background: #0d0b08 url\("r78-marble-tile\.webp"\)[^}]*border: 1px solid #e8c267;[^}]*pointer-events: none;/,'marble with a gold edge, never catches a tap');
  assert.match(dd,/\.tw-host\.tw-dd-world \.world > \.scene \{ margin-top: calc\(-1 \* \(var\(--tw-dd-h\) \+ var\(--tw-dd-gap, 0px\)\)\); \}/,'phones: a row of the column; the cards and buttons keep their place');
  assert.match(dd,/\.tw-host\.tw-dd-fixed > \.stage \{ top: var\(--tw-dd-h\) !important; bottom: 0 !important; height: auto !important;/,'desktop: the stage starts below the strip');
  assert.match(dd,/\.tw-host\.tw-dd-fixed > \.stage \{ top: calc\(var\(--sd-nav-top-h, 52px\) \+ var\(--tw-dd-h\)\) !important; \}/);
  assert.doesNotMatch(dd,/backdrop-filter|filter:\s*blur|rgba\(0,\s*0,\s*0,\s*\.[3-9]\)|inset:\s*0[;\s]/,'no dimming, scrim or blur layer');
  assert.match(dd,/prefers-reduced-motion/);
  const js=read('js/deadlineDay.js');
  assert.match(js,/place="world"[\s\S]*scene\.after\(node\)/);assert.match(js,/host\.insertBefore\(node,stage\)/);
  ok('D7','own row / band in every layout, marble and gold, no dimming');
}
console.log(`r87 deadline day contracts: ${checks} groups passed`);
