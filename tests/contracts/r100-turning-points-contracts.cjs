#!/usr/bin/env node
"use strict";
// r100 Phoenix (B5): Turning Points truth contracts. Every line js/turningPoints.js prints is checked against the finished
// record by a second, independent reading of that record (commentary rule: every line matches what happened), over seeded
// random Showdowns of 1, 3, 5 and 10 seasons plus fixed cases: a draw, a Sacked ending (decided and level), a Golden
// Showdown, Prime Pack margins and the finished r79 fixture game (the shape of Nik's Arsenal v Burnley game).
// It also pins the safety rules: no read, no write, no tiebreak wording, null (never a throw) on anything that does not add up,
// and the Final Winner frame unchanged when the engine is missing or throws.
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const ROOT=path.resolve(__dirname,"../..");
const TP=require("../../js/turningPoints.js");
const {result,projection}=require("../support/career-fixture-helpers.cjs");
const History=require("../../js/sharedHistoryConvergence.js");

const NAMES={playerOne:"Daniel",playerTwo:"Nik"},OTHER={playerOne:"playerTwo",playerTwo:"playerOne"};
const LABEL={championsLeague:"Champions League",europaLeague:"Europa League",primePack:"Prime Pack",leagueTitle:"league title",domesticCup:"domestic cup",performanceBonus:"performance bonus",individualAwardsBonus:"awards bonus"};
const ITEM_KEYS=Object.keys(LABEL);
const DECIDED_ONLY=new Set(["margin-item","margin-pair","prime-pack","led-throughout","comeback","went-ahead","fewer-seasons","season-wins"]);
const LEVEL_ONLY=new Set(["level","leveller"]);

// ---- the independent reading of the record (no code shared with js/turningPoints.js) ----
function facts(p){
  const rows=p.seasonHistory.map(s=>{
    const row={n:s.roundNumber,pts:{},items:{},sacked:{}};
    for(const role of ["playerOne","playerTwo"]){
      const r=s[role];row.pts[role]=r.scoring.total;row.sacked[role]=r.sacked===true;
      // items from the RESULT keys (not the stored breakdown): what happened on the pitch
      row.items[role]={championsLeague:r.championsLeague?5:0,europaLeague:r.europaLeague===true?3:0,primePack:Number.isInteger(r.primePack)?r.primePack:0,
        leagueTitle:r.leaguePosition===1?3:0,domesticCup:r.domesticCup?1:0,performanceBonus:(r.leaguePoints>=100||r.leagueGoals>=100)?1:0,individualAwardsBonus:(r.topScorer||r.topAssist)?1:0};
      assert.equal(Object.values(row.items[role]).reduce((a,b)=>a+b,0),r.scoring.total,"result keys add up to the stored total");
    }
    return row;
  });
  const total=role=>rows.reduce((n,r)=>n+r.pts[role],0),a=total("playerOne"),b=total("playerTwo");
  const winner=a>b?"playerOne":b>a?"playerTwo":"draw";
  const leadFor=role=>{let x=0;return rows.map(r=>(x+=r.pts[role]-r.pts[OTHER[role]]));};
  const trophies=role=>rows.reduce((n,r)=>n+(r.items[role].championsLeague?1:0)+(r.items[role].europaLeague?1:0)+(r.items[role].leagueTitle?1:0)+(r.items[role].domesticCup?1:0),0);
  return {rows,a,b,winner,margin:Math.abs(a-b),played:rows.length,totalSeasons:p.totalSeasons,leadFor,trophies};
}
const pl=(n,w)=>`${n} ${w}${n===1?"":"s"}`;
// Recompute each line's facts from the record and the exact text those facts give. Returns the expected text.
function verifyLine(line,F){
  const f=line.facts,w=F.winner,l=w==="draw"?null:OTHER[w],row=n=>F.rows[n-1];
  assert.ok(line.kicker===(line.season===null?"THE SHOWDOWN":`SEASON ${line.season}`),"kicker names the season");
  if(line.season!==null)assert.ok(Number.isInteger(line.season)&&line.season>=1&&line.season<=F.played,"season was played");
  if(F.winner==="draw")assert.ok(!DECIDED_ONLY.has(line.kind),`a level Showdown never gets a ${line.kind} line`);
  else assert.ok(!LEVEL_ONLY.has(line.kind),`a decided Showdown never gets a ${line.kind} line`);
  switch(line.kind){
    case "sacked-end":{
      const last=row(F.played),who=["playerOne","playerTwo"].filter(r=>last.sacked[r]);
      assert.ok(who.length>=1,"someone was sacked in the last season");assert.deepEqual(f.sacked,who);assert.equal(line.season,F.played);
      const names=who.length===2?"Daniel and Nik were both":`${NAMES[who[0]]} was`;
      return `${names} sacked, so the Showdown ended there, ${F.winner==="draw"?`with the points level at ${F.a} each`:`with ${NAMES[w]} ${pl(F.margin,"point")} ahead`}.`;
    }
    case "golden":{
      assert.equal(F.totalSeasons,10);assert.equal(F.played,10);
      const who=["playerOne","playerTwo"].filter(r=>F.rows.every(x=>x.pts[r]===15));assert.deepEqual(f.managers,who);assert.ok(who.length);
      return `${who.length===2?"Daniel and Nik both":NAMES[who[0]]} scored 15 in all 10 seasons: a Golden Showdown.`;
    }
    case "margin-item":{
      const r=row(line.season),v=r.items[w][f.item];
      assert.equal(f.manager,w);assert.equal(v,f.value);assert.ok(v>0&&r.items[l][f.item]===0,"only the winner scored it that season");
      assert.ok(v>=F.margin,"worth at least the margin");assert.equal(f.whole,v===F.margin);
      return f.whole?`${NAMES[w]}'s ${LABEL[f.item]} +${v} was the whole margin.`:`${NAMES[w]}'s ${LABEL[f.item]} +${v} was more than the ${F.margin}-point margin.`;
    }
    case "margin-pair":{
      const r=row(line.season),[k1,k2]=f.items,v1=r.items[w][k1],v2=r.items[w][k2];
      assert.equal(f.manager,w);assert.deepEqual(f.values,[v1,v2]);assert.notEqual(k1,k2);
      assert.ok(v1>0&&v2>0&&r.items[l][k1]===0&&r.items[l][k2]===0,"only the winner scored both that season");
      assert.ok(v1+v2>=F.margin,"together worth at least the margin");assert.equal(f.whole,v1+v2===F.margin);
      // and no single item anywhere covered the margin (else margin-item tells it)
      assert.ok(!F.rows.some(x=>ITEM_KEYS.some(k=>x.items[w][k]>=F.margin&&x.items[w][k]>0&&x.items[l][k]===0)),"pair only when no single item covers it");
      return `${NAMES[w]}'s ${LABEL[k1]} +${v1} and ${LABEL[k2]} +${v2} were ${f.whole?"the whole margin":`more than the ${F.margin}-point margin`}.`;
    }
    case "prime-pack":{
      const own=F.rows.reduce((n,x)=>n+x.items[w].primePack,0),other=F.rows.reduce((n,x)=>n+x.items[l].primePack,0);
      assert.equal(f.own,own);assert.equal(f.other,other);assert.ok(own-other>=F.margin&&own>other,"Prime Pack difference covers the margin");
      return `Prime Pack points made the difference: ${NAMES[w]} ${own}, ${NAMES[l]} ${other}.`;
    }
    case "led-throughout":{
      assert.ok(F.leadFor(w).every(x=>x>0),"ahead after every season");assert.ok(F.played>=2);
      return `${NAMES[w]} led from Season 1 to the end.`;
    }
    case "comeback":case "went-ahead":{
      const lead=F.leadFor(w),k=line.season;assert.ok(k>=2);
      assert.ok(lead.slice(k-1).every(x=>x>0),"ahead from that season on");
      const before=lead[k-2];
      if(line.kind==="comeback"){assert.ok(before<0);assert.equal(f.behind,-before);return `${NAMES[w]} came from ${pl(-before,"point")} down and led from there to the end.`;}
      assert.equal(before,0,"level going in");return `Level going in, ${NAMES[w]} went ahead and stayed there.`;
    }
    case "biggest-swing":case "season-score":{
      const gaps=F.rows.map(x=>Math.abs(x.pts.playerOne-x.pts.playerTwo)),top=Math.max(...gaps),r=row(line.season);
      assert.equal(gaps[line.season-1],top);assert.equal(gaps.filter(g=>g===top).length,1,"the one biggest season");assert.ok(top>0);
      const who=r.pts.playerOne>r.pts.playerTwo?"playerOne":"playerTwo";assert.equal(f.manager,who);assert.equal(f.own,r.pts[who]);assert.equal(f.other,r.pts[OTHER[who]]);
      if(line.kind==="season-score"){assert.equal(F.played,1);return `${NAMES[who]} took it ${f.own}-${f.other}.`;}
      return `${NAMES[who]}'s ${f.own}-${f.other} was the biggest gap of any season.`;
    }
    case "leveller":{
      const lead=F.leadFor("playerOne"),before=lead[F.played-2],r=row(F.played);
      assert.equal(F.winner,"draw");assert.notEqual(before,0);assert.equal(line.season,F.played);
      const behind=before<0?"playerOne":"playerTwo";assert.equal(f.manager,behind);assert.equal(f.behind,Math.abs(before));
      assert.equal(r.pts[behind]-r.pts[OTHER[behind]],Math.abs(before),"the last season closed exactly that gap");
      return `${NAMES[behind]}'s ${r.pts[behind]}-${r.pts[OTHER[behind]]} closed the ${Math.abs(before)}-point gap to level it.`;
    }
    case "level":{
      assert.equal(F.a,F.b);assert.equal(f.points,F.a);assert.equal(f.played,F.played);
      return `Level at ${pl(F.a,"point")} each after ${pl(F.played,"season")}: a draw.`;
    }
    case "lead-changes":{
      let last=0,changes=0;for(const x of F.leadFor("playerOne")){const now=Math.sign(x);if(now!==0){if(last!==0&&now!==last)changes+=1;last=now;}}
      assert.equal(f.changes,changes);assert.ok(changes>=2);return `The lead changed hands ${changes} times.`;
    }
    case "fewer-seasons":case "season-wins":{
      const ww=F.rows.filter(x=>x.pts[w]>x.pts[l]).length,lw=F.rows.filter(x=>x.pts[l]>x.pts[w]).length;
      if(line.kind==="fewer-seasons"){assert.ok(lw>ww);assert.deepEqual([f.own,f.other],[ww,lw]);return `${NAMES[l]} won more seasons, ${lw} to ${ww}, but ${NAMES[w]} scored more points.`;}
      assert.ok(ww>=lw&&ww>=2);assert.equal(f.own,ww);return `${NAMES[w]} won ${ww} of the ${F.played} seasons.`;
    }
    case "trophies":{
      assert.deepEqual([f.playerOne,f.playerTwo],[F.trophies("playerOne"),F.trophies("playerTwo")]);assert.ok(f.playerOne+f.playerTwo>0);
      return `Trophies: Daniel ${f.playerOne}, Nik ${f.playerTwo}.`;
    }
    default:assert.fail(`unknown line kind ${line.kind}`);
  }
}
const FORBIDDEN=/tie-?break|edged|on goal difference|undefined|NaN|null|\{|\}|\b1 points|\ba 8|  /i;
function checkShowdown(p,label){
  const out=TP.turningPoints(p),F=facts(p);
  assert.ok(out,`${label}: a finished Showdown gets Turning Points`);
  assert.equal(JSON.stringify(TP.turningPoints(p)),JSON.stringify(out),`${label}: same record, same lines (both phones)`);
  assert.ok(out.lines.length>=1&&out.lines.length<=3,`${label}: 1 to 3 lines`);
  assert.equal(out.margin,F.margin);assert.equal(out.winner,F.winner==="draw"?"draw":NAMES[F.winner].toLowerCase());
  const texts=new Set();
  for(const line of out.lines){
    const expected=verifyLine(line,F);
    assert.equal(line.text,expected,`${label}: ${line.kind} prints exactly what the record says`);
    assert.doesNotMatch(line.text,FORBIDDEN,`${label}: ${line.text}`);
    if(F.winner==="draw")assert.doesNotMatch(line.text,/\bwins?\b|\bwon\b|\bbeat|\bwinner/i,`${label}: a draw names no winner: ${line.text}`);
    assert.ok(line.text.length<=96,`${label}: short line (${line.text.length}): ${line.text}`);
    assert.ok(!texts.has(line.text),"no repeated line");texts.add(line.text);
  }
  if(F.winner!=="draw"&&F.played>=2&&!out.lines.some(l=>l.kind==="sacked-end"||l.kind==="golden"))
    assert.ok(out.lines.length>=2,`${label}: a decided multi-season Showdown gets at least two lines`);
  return out;
}

// ---- seeded random Showdowns ----
function rng(seed){let x=seed>>>0||1;return ()=>{x^=x<<13;x>>>=0;x^=x>>17;x^=x<<5;x>>>=0;return x/4294967296;};}
function randomResult(r,{sacked=false,primeTaken=null}={}){
  const euro=r()<.25?"CL":r()<.25?"EL":"";
  const o={leaguePosition:r()<.3?1:2+Math.floor(r()*10),leaguePoints:r()<.2?100+Math.floor(r()*14):50+Math.floor(r()*49),leagueGoals:r()<.15?100+Math.floor(r()*20):40+Math.floor(r()*59),
    domesticCup:r()<.3,championsLeague:euro==="CL",topScorer:r()<.2,topAssist:r()<.15};
  if(euro==="EL")o.europaLeague=true;
  if(primeTaken!==null)o.primePack=primeTaken;
  if(sacked)o.sacked=true;
  return result(o);
}
function randomShowdown(seed,totalSeasons,{sackAt=null,forceDraw=false}={}){
  const r=rng(seed),played=sackAt||totalSeasons,seasons=[];
  for(let n=1;n<=played;n+=1){
    // Prime Pack: one manager may earn 4/3/2/1 or neither, never both (Nik 2026-11-01)
    const pp=r()<.5?null:{role:r()<.5?0:1,v:1+Math.floor(r()*4)};
    const pair=[0,1].map(i=>randomResult(r,{sacked:sackAt===n&&(i===0?r()<.7:r()<.5),primeTaken:pp&&pp.role===i?pp.v:null}));
    if(sackAt===n&&!pair[0].sacked&&!pair[1].sacked)pair[1].sacked=true;
    // keep both managers out of first place together (one league)
    if(pair[0].leaguePosition===1&&pair[1].leaguePosition===1)pair[1].leaguePosition=2;
    seasons.push(pair);
  }
  if(forceDraw){
    // mirror the totals: give the trailing manager the leader's last season, then fix up with the awards bonus if needed
    let p=projection({seed:"a",totalSeasons,seasons});let a=p.managerRecords.playerOne.totalPoints,b=p.managerRecords.playerTwo.totalPoints;
    if(a!==b){const swap=seasons.map(([x,y])=>[y,x]);for(let i=0;i<seasons.length;i+=1)seasons[i]=i%2?seasons[i]:swap[i];}
  }
  return projection({seed:"a",totalSeasons,seasons});
}

const checks=[],check=(name,fn)=>checks.push([name,fn]);
const counts={};
const tally=out=>{for(const l of out.lines)counts[l.kind]=(counts[l.kind]||0)+1;};

check("TP1 every line of 2,000 random finished Showdowns (1/3/5/10 seasons, Sacked endings) matches the record",()=>{
  let n=0,draws=0;
  for(const total of [1,3,5,10])for(let i=0;i<500;i+=1){
    const sackAt=i%7===0?1+(i%total):null;
    const p=randomShowdown(1000*total+i+1,total,{sackAt,forceDraw:i%5===0});
    History.verifyProjection(p);
    const out=checkShowdown(p,`${total}s#${i}${sackAt?` sacked@${sackAt}`:""}`);tally(out);n+=1;if(out.winner==="draw")draws+=1;
  }
  assert.ok(draws>=50,`enough level Showdowns in the sweep (${draws})`);
  return `${n} Showdowns, ${draws} level`;
});
check("TP2 a level Showdown says level and names no winner; no seasons-won line on a draw",()=>{
  const p=projection({totalSeasons:3,seasons:[[result({leaguePosition:1}),result()],[result(),result({europaLeague:true})],[result({domesticCup:true}),result({topScorer:true})]]});
  const out=checkShowdown(p,"draw");
  assert.equal(out.winner,"draw");assert.equal(out.lines[0].kind,"level");assert.equal(out.lines[0].text,"Level at 4 points each after 3 seasons: a draw.");
  // the last season levelled it
  const q=projection({totalSeasons:3,seasons:[[result({leaguePosition:1}),result()],[result({domesticCup:true}),result()],[result(),result({leaguePosition:1,domesticCup:true})]]});
  const o2=checkShowdown(q,"levelled late");assert.ok(o2.lines.some(l=>l.kind==="leveller"&&l.season===3&&l.text==="Nik's 4-0 closed the 4-point gap to level it."));
});
check("TP3 a Sacked ending names who was sacked, that it ended there and the margin (decided and level)",()=>{
  const p=projection({totalSeasons:5,seasons:[[result({leaguePosition:1}),result()],[result({sacked:true}),result({domesticCup:true})]]});
  const out=checkShowdown(p,"sacked");assert.equal(out.lines[0].kind,"sacked-end");assert.equal(out.lines[0].kicker,"SEASON 2");
  assert.equal(out.lines[0].text,"Daniel was sacked, so the Showdown ended there, with Daniel 2 points ahead.");
  const q=projection({totalSeasons:3,seasons:[[result({leaguePosition:1}),result({europaLeague:true,sacked:true})]]});
  const o2=checkShowdown(q,"sacked level");assert.equal(o2.lines[1].text,"Nik was sacked, so the Showdown ended there, with the points level at 3 each.");
  const both=projection({totalSeasons:3,seasons:[[result({leaguePosition:1,sacked:true}),result({sacked:true})]]});
  assert.equal(checkShowdown(both,"both sacked").lines[0].text,"Daniel and Nik were both sacked, so the Showdown ended there, with Daniel 3 points ahead.");
});
check("TP4 a Golden Showdown (150) is named, and only when every one of the 10 seasons is 15",()=>{
  const max=result({leaguePosition:1,championsLeague:true,domesticCup:true,topScorer:true,leaguePoints:101,primePack:4});
  const p=projection({totalSeasons:10,seasons:Array.from({length:10},(_,i)=>[max,i===4?result({leaguePosition:1,europaLeague:true}):result()])});
  const out=checkShowdown(p,"golden");assert.equal(out.lines[0].text,"Daniel scored 15 in all 10 seasons: a Golden Showdown.");
  const both=projection({totalSeasons:10,seasons:Array.from({length:10},()=>[max,max])});
  const o2=checkShowdown(both,"golden draw");assert.ok(o2.lines.some(l=>l.text==="Daniel and Nik both scored 15 in all 10 seasons: a Golden Showdown."));assert.equal(o2.winner,"draw");
  const near=projection({totalSeasons:10,seasons:Array.from({length:10},(_,i)=>[i===9?result({leaguePosition:1,championsLeague:true}):max,result()])});
  assert.ok(!checkShowdown(near,"not golden").lines.some(l=>l.kind==="golden"));
});
check("TP5 the margin moments: one item, two items, Prime Pack",()=>{
  const el=projection({totalSeasons:3,seasons:[[result({leaguePosition:1}),result({domesticCup:true,topScorer:true,leaguePoints:101})],[result({europaLeague:true}),result()],[result(),result({primePack:1})]]});
  const o1=checkShowdown(el,"EL");assert.ok(o1.lines.some(l=>l.kind==="margin-item"&&l.text==="Daniel's Europa League +3 was more than the 2-point margin."));
  const whole=projection({totalSeasons:1,seasons:[[result({europaLeague:true}),result()]]});
  assert.equal(checkShowdown(whole,"EL whole").lines[0].text,"Daniel's Europa League +3 was the whole margin.");
  const pp=projection({totalSeasons:3,seasons:[[result({primePack:4}),result({primePack:1})],[result({primePack:3}),result({leaguePosition:1})],[result(),result()]]});
  assert.ok(checkShowdown(pp,"Prime Pack").lines.some(l=>l.text==="Prime Pack points made the difference: Daniel 7, Nik 1."));
});
check("TP6 the finished r79 fixture game (the shape of Nik's Arsenal v Burnley game) prints true lines",()=>{
  // tests/fixtures/r79-finished-game/golden.json: one season, Daniel 9 (#1, 87 pts, 93 goals, CL) v Nik 3 (#2, 84 pts, 101 goals, cup)
  const golden=JSON.parse(fs.readFileSync(path.join(ROOT,"tests/fixtures/r79-finished-game/golden.json"),"utf8"));
  assert.deepEqual(golden.daniel.fig.legacyRows[0].score,["9","3"]);
  const p=projection({totalSeasons:1,seasons:[[result({leaguePosition:1,leaguePoints:87,leagueGoals:93,championsLeague:true,topScorer:true}),result({leaguePosition:2,leaguePoints:84,leagueGoals:101,domesticCup:true,topAssist:true})]]});
  assert.equal(p.managerRecords.playerOne.totalPoints,9);assert.equal(p.managerRecords.playerTwo.totalPoints,3);
  assert.equal(p.managerRecords.playerOne.totalTrophies,2);assert.equal(p.managerRecords.playerTwo.totalTrophies,1);
  const out=checkShowdown(p,"r79");
  assert.deepEqual(out.lines.map(l=>l.text),["Daniel's Champions League +5 and league title +3 were more than the 6-point margin.","Trophies: Daniel 2, Nik 1.","Daniel took it 9-3."]);
});
check("TP7 nothing that does not add up is told: wrong totals, unfinished, tampered or junk input give null, never a throw",()=>{
  const p=projection({totalSeasons:3,seasons:[[result({leaguePosition:1}),result()],[result(),result()],[result(),result({domesticCup:true})]]});
  assert.ok(TP.turningPoints(p,{totals:{daniel:3,nik:1}}));
  assert.equal(TP.turningPoints(p,{totals:{daniel:4,nik:1}}),null,"Final Winner totals must match the record");
  const unfinished=projection({totalSeasons:5,seasons:[[result({leaguePosition:1}),result()]]});
  assert.equal(TP.turningPoints(unfinished),null,"an unfinished Showdown has no turning points");
  const bad=JSON.parse(JSON.stringify(p));bad.seasonHistory[1].playerOne.scoring.total=7;assert.equal(TP.turningPoints(bad),null,"items must add up to the total");
  const wrongWinner=JSON.parse(JSON.stringify(p));wrongWinner.seasonHistory[0].winner="playerTwo";assert.equal(TP.turningPoints(wrongWinner),null);
  const order=JSON.parse(JSON.stringify(p));order.seasonHistory.reverse();assert.equal(TP.turningPoints(order),null);
  for(const junk of [null,undefined,0,"x",[],{},{seasonHistory:[]},{seasonHistory:[{}],totalSeasons:1},{seasonHistory:[null],totalSeasons:1}])assert.equal(TP.turningPoints(junk),null);
});
check("TP8 pure: no clock, no randomness, no storage, no network, no provider in the engine",()=>{
  const src=fs.readFileSync(path.join(ROOT,"js/turningPoints.js"),"utf8");
  assert.doesNotMatch(src,/Date\.|Math\.random|localStorage|sessionStorage|indexedDB|fetch\(|firestore|getDoc|setDoc|onSnapshot|runTransaction|XMLHttpRequest|setTimeout/);
  assert.equal(TP.providerReadRequired,false);assert.equal(TP.providerWriteRequired,false);
});
check("TP9 Final Winner frame: Turning Points ride the verified history; a missing or throwing engine leaves the frame as before",()=>{
  const Final=require("../../js/sharedFinalReconciliation.js");void Final;
  const fixtures=require("../support/active-showdown-fixtures.cjs");
  const api=require("../../js/seasonFinalV10.js");
  const fx=fixtures.completedShowdownStorage({totalSeasons:3,seasons:[[result(),result({leaguePosition:1,championsLeague:true})],[result({europaLeague:true,domesticCup:true}),result()],[result({leaguePosition:1,championsLeague:true,domesticCup:true}),result({primePack:2})]]});
  const s=fx.finished,frame=api.finalFrame(s.finalReconciliation,s.terminalClose,s.history);
  assert.equal(frame.status,"ready");assert.ok(frame.turningPoints&&frame.turningPoints.lines.length===3);
  assert.deepEqual(frame.turningPoints.lines.map(l=>l.text),TP.turningPoints(s.history.projection).lines.map(l=>l.text));
  const saved=globalThis.CareerModeTurningPoints;
  try{
    globalThis.CareerModeTurningPoints={turningPoints(){throw new Error("boom");}};
    const broken=api.finalFrame(s.finalReconciliation,s.terminalClose,s.history);
    assert.equal(broken.status,"ready");assert.equal(broken.turningPoints,undefined);
    const {turningPoints,...rest}=frame;assert.deepEqual(JSON.parse(JSON.stringify(broken)),JSON.parse(JSON.stringify(rest)),"the rest of the frame is unchanged");
  }finally{if(saved===undefined)delete globalThis.CareerModeTurningPoints;else globalThis.CareerModeTurningPoints=saved;}
  // no verified history: no lines (the frame never reads anything for them)
  const noHistory=api.finalFrame(s.finalReconciliation,s.terminalClose,null);assert.equal(noHistory.turningPoints,undefined);
});
check("TP10 the screen wiring: loaded with Final Winner's files, cached offline, never between two steps",()=>{
  const src=fs.readFileSync(path.join(ROOT,"js/seasonFinalV10.js"),"utf8"),sw=fs.readFileSync(path.join(ROOT,"service-worker.js"),"utf8");
  assert.match(src,/sfEnsureTurning\(\)\]\)/,"loaded in the Season Results / Final Winner prepare, behind the loading screen");
  assert.match(src,/\.then\(\(\)=>true,\(\)=>false\)/,"a failed load is swallowed");
  assert.match(src,/catch\(error\)\{for\(const node of added\)node\.remove\(\)/,"a failed mount takes back what it added");
  assert.match(sw,/"js\/turningPoints\.js",/,"in the offline shell");
});

let failed=0;
for(const [name,fn] of checks){try{const note=fn();console.log(`ok ${name}${note?` (${note})`:""}`);}catch(error){failed+=1;console.error(`not ok ${name}\n${error.stack}`);}}
if(failed){console.error(`FAIL r100 Turning Points contracts: ${failed} of ${checks.length}`);process.exit(1);}
console.log(`PASS r100 Turning Points truth contracts: ${checks.length} groups; line kinds seen ${JSON.stringify(counts)}`);
