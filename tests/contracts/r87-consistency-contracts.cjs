"use strict";
// r87 one-game-logic consistency (Nik 2026-11-01: "this difference in overall doesn't break the logic of the game ... one
// unified game logic"). Report: gameplay/r87/consistency/REPORT.md in the project files (finding ids GC-NN).
//  C1 (GC-03) A Transfer War signing's overall is the one his manager typed (his in-game overall), which may differ from the
//     FIFA 17 database. The roulette board uses exactly that typed value for him, never the database row, never NaN, and
//     every board stays 15 rows whatever the typed overalls are.
//  C2 (GC-01) Commentary v3 uses the Showdown's own season maximum: 15 with Prime Pack, 11 before. A Prime Pack season over
//     11 never silences the booth, and no "decided", "draw-only" or Golden line is said that the 15-point maximum makes false.
const assert=require("node:assert/strict");
const RRR=require("../../js/rosterRoulette.js"),V=require("../../js/commentaryV3.js"),P=require("../../data/fifa17Players.js");
let checks=0;const ok=(value,message)=>{assert.ok(value,message);checks+=1;};
const dbOverall=name=>{for(const c of Object.values(P.clubs))for(const p of c.players)if(p[0]===name)return p[1];return null;};

// ---------- C1: typed overall vs database overall ----------
{
  const ars={playerOne:"Arsenal",playerTwo:"Liverpool"},id="pair_f81777fb406d8197eb25b80daa12475edd09db988cdf046088ec0e21f498ee72";
  const sp={playerOne:{name:"K. Volland",overall:81,number:31},playerTwo:{name:"J. Vargas",overall:70,number:16}};
  assert.equal(dbOverall("Sergio Ramos"),89,"fixture: Sergio Ramos is 89 in the FIFA 17 database");
  for(const typed of [30,60,89,95,99]){
    const h=[null,{playerOne:[{name:"Sergio Ramos",overall:typed,position:"CB",release:false}],playerTwo:[]}];
    const plan=RRR.forSeason(id,ars,2,{special:sp,history:h}),board=plan.boards.playerOne;
    ok(board.length===15&&board.every(p=>p.name&&Number.isInteger(p.rating)&&p.rating>=30&&p.rating<=99),`typed ${typed}: 15 named rows, integer overalls`);
    const ramos=board.find(p=>p.name==="Sergio Ramos");
    if(ramos)ok(ramos.rating===typed&&ramos.signedSeason===1,`typed ${typed}: the board carries the typed overall, not the database 89`);
    if(typed>=95)ok(ramos&&!ramos.bench,`typed ${typed}: a signing better than every CB starts`);
  }
  // Many careers with typed overalls far from the database: boards always whole, every signing's rating is what was typed.
  const r=(()=>{let s=20261101;return ()=>{s^=s<<13;s>>>=0;s^=s>>17;s^=s<<5;s>>>=0;return s/4294967296;};})();
  const pool=Object.entries(P.clubs).filter(([c])=>c!=="Arsenal"&&c!=="Liverpool").flatMap(([,c])=>c.players).filter(p=>p[1]>=75);
  const POS=["GK","RB","CB","LB","CDM","CM","CAM","RM","LM","RW","LW","ST"];
  for(let career=0;career<40;career+=1){
    const h=[null],typedOf=new Map();
    for(let k=1;k<=9;k+=1){
      const season={playerOne:[],playerTwo:[]};
      for(const role of ["playerOne","playerTwo"])for(let i=0;i<1+Math.floor(r()*3);i+=1){
        const p=pool[Math.floor(r()*pool.length)],typed=30+Math.floor(r()*70);
        if(season[role].some(x=>x.name===p[0]))continue;
        season[role].push({name:p[0],overall:typed,position:POS[Math.floor(r()*POS.length)],release:r()<0.2});
        if(!typedOf.has(`${role}|${p[0]}`))typedOf.set(`${role}|${p[0]}`,typed);
      }
      h.push(season);
    }
    for(const s of [2,5,10]){
      const plan=RRR.forSeason(id,ars,s,{special:sp,history:h});
      ok(plan,`career ${career} season ${s}: a plan`);
      for(const role of ["playerOne","playerTwo"])for(const p of plan.boards[role]){
        ok(p.name===null?p.rating===0:Number.isInteger(p.rating)&&p.rating>=30&&p.rating<=99,`career ${career} s${s}: no NaN or out-of-range overall`);
        // A signing keeps the overall of the window he first joined in (Sol SQ-2-03); never the database value.
        if(p.signedSeason!==null){
          const first=h.slice(1,p.signedSeason+1).map(x=>x[role].find(y=>y.name===p.name&&y.release===false)).filter(Boolean)[0]||h[p.signedSeason][role].find(y=>y.name===p.name);
          ok(first&&p.rating===h[p.signedSeason][role].find(y=>y.name===p.name).overall,`career ${career} s${s}: ${p.name} shows his typed overall`);
        }
      }
      for(const t of plan.turns)if(t.fired)ok(t.player&&t.player.name,`career ${career} s${s}: a fired shot always names a real player`);
    }
  }
}

// ---------- C2: one season maximum in commentary v3 ----------
{
  const season=(a,b)=>{const side=t=>({leaguePosition:3,leaguePoints:80,leagueGoals:70,championsLeague:false,domesticCup:false,topScorer:false,topAssist:false,scoring:{total:t}});return {playerOne:side(a),playerTwo:side(b),winner:a>b?"playerOne":b>a?"playerTwo":"draw"};};
  const facts=(pairs,primePack,N=pairs.length)=>({showdownId:"pair_"+"a".repeat(64),seasons:N,league:"premier_league",clubs:{playerOne:"Arsenal",playerTwo:"Liverpool"},teamCount:20,history:pairs.map(([a,b])=>season(a,b)),...(primePack===undefined?{}:{primePack})});
  const ids=list=>(list||[]).map(x=>x.id);
  // A Prime Pack season of 15 never silences the booth.
  ok(V.seasonNumbers(facts([[15,0]],true,3),1),"Prime Pack: a 15-point season still gets its numbers line");
  ok(V.seasonNumbers(facts([[13,2]],undefined,3),1),"no flag: a season over 11 can only be Prime Pack, the booth still speaks");
  ok(V.seasonNumbers(facts([[13,2]],false,3),1)===null,"a 13 in a Showdown without Prime Pack is invalid data: no line rather than a wrong one");
  // 12 clear with one season left: decided at 11 a season, still open at 15.
  const pre=[[11,0],[1,0]];
  ok(ids(V.seasonNumbers(facts(pre,false,3),2)).includes("decided"),"before Prime Pack: 12 clear with 11 left to win is decided");
  const open=V.seasonNumbers(facts(pre,true,3),2);
  ok(!ids(open).includes("decided")&&!ids(open).includes("draw-only")&&ids(open).includes("decider"),"Prime Pack: 12 clear with 15 left to win is still a decider");
  ok(open.every(x=>!/\b11 to 0\b|up to 11 points/.test(x.text)),"Prime Pack: no line names 11 as the season maximum");
  ok(ids(V.seasonNumbers(facts([[15,0],[0,0]],true,3),2)).includes("draw-only"),"Prime Pack: exactly 15 clear with one left is draw-only");
  ok(V.seasonNumbers(facts([[15,0],[0,0]],true,3),2).find(x=>x.id==="draw-only").text.includes("15 to 0"),"draw-only names 15 to 0");
  ok(V.seasonNumbers(facts([[4,0]],true,3),1).find(x=>x.id==="clock").text.includes("up to 30 points"),"Prime Pack clock: 2 seasons left is up to 30 points each");
  // Golden: 150 with Prime Pack, 110 before; a 110 in a Prime Pack Showdown is not Golden.
  const ten=t=>Array.from({length:10},()=>[t,0]);
  ok(ids(V.finalNumbers(facts(ten(15),true))).includes("final-golden")&&V.finalNumbers(facts(ten(15),true)).find(x=>x.id==="final-golden").text.startsWith("150 out of 150"),"Prime Pack Golden is 150");
  ok(!ids(V.finalNumbers(facts(ten(11),true))).includes("final-golden"),"Prime Pack: 110 is not a Golden Showdown");
  ok(V.finalNumbers(facts(ten(11),false)).find(x=>x.id==="final-golden").text.startsWith("110 out of 110"),"before Prime Pack Golden stays 110");
  ok(V.finalNumbers(facts(ten(15).map(()=>[15,15]),true)).find(x=>x.id==="final-golden-both").text.startsWith("150 each"),"Prime Pack Golden draw is 150 each");
}
console.log(`r87 consistency contracts passed (${checks} checks)`);
