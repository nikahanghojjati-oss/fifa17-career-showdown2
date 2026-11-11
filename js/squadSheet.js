(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeSquadSheet=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  // r91 / 2.4.0 Squad Management (Nik 2026-11-11 00:03 and 00:06 UTC). The squad sheet is one manager's squad for one
  // screen: Starting XI on the pitch in a formation, 4 Substitutes, and the Reserves (everyone else still at the club,
  // plus kept signings outside the 15). The screen appears twice a season: "pre" after Chamber Men (its 15 is that
  // season's RRR board) and "post" after Transfer War (kept signings arrive, the RRR shot leaves).
  //
  // Nik's rules, in his words where possible:
  // - Season 1 is the original squad: the FIFA 17 default XI in the club's default formation plus the original 4 subs.
  //   Nothing is sorted by overall. In season 1 the squad only changes by signings and the RRR.
  // - Four lines: goalkeeper, defenders, midfielders, attackers. From season 2 a player can leave (contract, retired,
  //   swapped, sold) and is replaced within his line only. A line is never skipped: the XI always has the formation's
  //   counts, because every slot belongs to a line and only players of that line (or Nik's flex list) may stand in it.
  // - Managers drag players around, change formation and sort, but "cannot drag out the players with high overall to
  //   the reserve": a reserve only comes in for a player of his line who is not better than him.
  // - Flex: RW/LW to ST, RM to CM, CM to CDM or CAM, RB to CB, CB to RB or LB, LB to CB, plus the ideas-file list
  //   (RM/RW, LM/LW, LB/LWB, RB/RWB, CDM to CM, CAM to CF or CM, CF/ST). A goalkeeper never plays anywhere else, and
  //   nobody else plays in goal, unless the club has run out of players for that line.
  //
  // Pure and deterministic (both phones compute the same sheet from the same inputs). No IO, no clock, no randomness.
  // Identity follows js/rosterRoulette.js exactly (Sol SQ-4-01): a club player is "c|name#shirt", a Transfer War signing
  // "s|name", names folded for accents and case.
  const VERSION=1;
  // Nik 2026-11-11 00:29 UTC: FIFA's bench has 7 substitutes; the first 4 are the ones on the Russian Roulette board (the
  // 15 = XI + subs 1-4), subs 5-7 and the reserves sit outside it.
  const XI_SIZE=11,BENCH_SIZE=7,FEATURED=4,MAX_SEASONS=10,OVERALL_MIN=30,OVERALL_MAX=99;
  const STAGES=Object.freeze(["pre","post"]);
  const LINES=Object.freeze(["GK","DEF","MID","ATT"]);
  const LEAVE_REASONS=Object.freeze(["contract","retired","swapped","sold","loaned","other"]);
  // Nik 2026-11-11 00:26 UTC: a player can be loaned out; he comes back to the club (the reserves) at the next season.
  // Q9 default (plan v2): a player who left may be signed again in a later Transfer War. A shot player never can.
  const BUY_BACK=true;

  function data(){
    const players=root.CareerModeFifa17Players||(typeof module!=="undefined"&&module.exports?require("../data/fifa17Players.js"):null);
    const squads=root.CareerModeRosterSquads||(typeof module!=="undefined"&&module.exports?require("../data/rosterSquads.js"):null);
    return players&&squads&&players.clubs&&squads.squads?{players,squads}:null;
  }

  // ---------- positions, lines and fit ----------
  const FAMILY=Object.freeze({RCB:"CB",LCB:"CB",SW:"CB",RDM:"CDM",LDM:"CDM",RCM:"CM",LCM:"CM",RAM:"CAM",LAM:"CAM",RS:"ST",LS:"ST",RF:"CF",LF:"CF"});
  const family=pos=>FAMILY[pos]||pos;
  const LINE_OF=Object.freeze({GK:"GK",CB:"DEF",RB:"DEF",LB:"DEF",RWB:"DEF",LWB:"DEF",CDM:"MID",CM:"MID",CAM:"MID",RM:"MID",LM:"MID",RW:"ATT",LW:"ATT",CF:"ATT",ST:"ATT"});
  const lineOf=pos=>LINE_OF[family(pos)]||null;
  // Player position -> slot families he can cover out of his natural role (fit 2, gold ring).
  const FLEX=Object.freeze({
    RM:["RW","CM"],LM:["LW","CM"],RW:["RM","ST"],LW:["LM","ST"],
    RB:["RWB","CB"],LB:["LWB","CB"],RWB:["RB"],LWB:["LB"],CB:["RB","LB"],
    CDM:["CM"],CM:["CDM","CAM"],CAM:["CF","CM"],CF:["ST"],ST:["CF"]
  });
  // 3 natural, 2 flex, 1 same line (out of position, amber), 0 not allowed.
  function sqFit(player,slotPos){
    if(!player||!Array.isArray(player.positions))return 0;
    const slot=family(slotPos),line=lineOf(slotPos),own=player.positions.map(family);
    if(!line)return 0;
    if(own.includes(slot))return 3;
    if(slot==="GK"||own.includes("GK"))return 0;
    if(own.some(p=>(FLEX[p]||[]).includes(slot)))return 2;
    return own.some(p=>lineOf(p)===line)?1:0;
  }
  const playerLines=player=>[...new Set((player&&player.positions||[]).map(lineOf).filter(Boolean))];
  const shareLine=(a,b)=>playerLines(a).some(line=>playerLines(b).includes(line));

  // ---------- formations ----------
  // The data holds the 20 formations FIFA 17's squad file uses for club defaults. FIFA 17's Formations screen offers 33
  // (Nik's reference video, 2026-11-11): these 13 complete the list. Slot names follow FIFA 17's own; the line counts
  // come from the slots.
  const EXTRA_FORMATIONS=Object.freeze({
    "3-4-3 Diamond":["GK","RCB","CB","LCB","CDM","RM","LM","CAM","RW","ST","LW"],
    "3-5-1-1":["GK","RCB","CB","LCB","RDM","LDM","RM","LM","CAM","CF","ST"],
    "4-1-3-2":["GK","RB","RCB","LCB","LB","CDM","RM","CM","LM","RS","LS"],
    "4-2-4":["GK","RB","RCB","LCB","LB","RCM","LCM","RW","RS","LS","LW"],
    "4-3-3 (3)":["GK","RB","RCB","LCB","LB","RDM","LDM","CM","RW","ST","LW"],
    "4-3-3 (5)":["GK","RB","RCB","LCB","LB","CDM","RCM","LCM","RW","CF","LW"],
    "4-4-1-1 (2)":["GK","RB","RCB","LCB","LB","RM","RCM","LCM","LM","CAM","ST"],
    "4-5-1":["GK","RB","RCB","LCB","LB","RM","CM","LM","RAM","LAM","ST"],
    "4-5-1 (2)":["GK","RB","RCB","LCB","LB","RM","RCM","CM","LCM","LM","ST"],
    "5-2-1-2":["GK","RWB","RCB","CB","LCB","LWB","RCM","LCM","CAM","RS","LS"],
    "5-2-2-1":["GK","RWB","RCB","CB","LCB","LWB","RCM","LCM","RW","ST","LW"],
    "5-4-1":["GK","RWB","RCB","CB","LCB","LWB","CDM","RM","LM","CAM","ST"],
    "5-4-1 (2)":["GK","RWB","RCB","CB","LCB","LWB","RM","RCM","LCM","LM","ST"]
  });
  // FIFA 17's names: the number and, under it, the variant ("4-3-3" / "ATTACK").
  const FORMATION_TITLES=Object.freeze({
    "3-4-3 Flat":["3-4-3","FLAT"],"3-4-3 Diamond":["3-4-3","DIAMOND"],
    "4-1-2-1-2":["4-1-2-1-2","WIDE"],"4-1-2-1-2 (2)":["4-1-2-1-2","NARROW"],
    "4-2-3-1":["4-2-3-1","NARROW"],"4-2-3-1 (2)":["4-2-3-1","WIDE"],
    "4-3-3":["4-3-3","FLAT"],"4-3-3 (2)":["4-3-3","HOLDING"],"4-3-3 (3)":["4-3-3","DEFEND"],"4-3-3 (4)":["4-3-3","ATTACK"],"4-3-3 (5)":["4-3-3","FALSE 9"],
    "4-4-1-1":["4-4-1-1","MIDFIELD"],"4-4-1-1 (2)":["4-4-1-1","ATTACK"],"4-4-2":["4-4-2","FLAT"],"4-4-2 (2)":["4-4-2","HOLDING"],
    "4-5-1":["4-5-1","ATTACK"],"4-5-1 (2)":["4-5-1","FLAT"],"5-4-1":["5-4-1","DIAMOND"],"5-4-1 (2)":["5-4-1","FLAT"]
  });
  const titleOf=name=>{const t=FORMATION_TITLES[name];return Object.freeze({main:t?t[0]:name,variant:t?t[1]:""});};
  function allFormations(){
    const d=data();
    return d?{...d.players.formations,...EXTRA_FORMATIONS}:{...EXTRA_FORMATIONS};
  }
  function formationSlots(name){
    const f=allFormations();
    return Object.prototype.hasOwnProperty.call(f,name)?f[name].slice():null;
  }
  // Where each slot stands on the pitch, in percent: x 0 = the left touchline (LB side), y 0 = the opponent's goal line.
  function pitchSpots(slots){
    const has=pos=>slots.includes(pos);
    const three=has("CB"),cmRow=has("CM")&&(has("RCM")||has("LCM")),ddm=has("RDM")||has("LDM");
    const spot={
      GK:[50,90],
      RB:[86,70],LB:[14,70],RWB:[88,58],LWB:[12,58],
      RCB:three?[72,75]:[64,75],LCB:three?[28,75]:[36,75],CB:[50,76],SW:[50,80],
      CDM:[50,ddm?62:60],RDM:[63,60],LDM:[37,60],
      RCM:cmRow?[71,47]:[64,ddm||has("CDM")?45:47],LCM:cmRow?[29,47]:[36,ddm||has("CDM")?45:47],CM:[50,has("CDM")||ddm?44:48],
      RM:[86,42],LM:[14,42],
      CAM:[50,has("CF")&&has("ST")?36:has("ST")||has("RS")?34:30],RAM:[72,31],LAM:[28,31],
      RW:[82,19],LW:[18,19],
      CF:[50,has("ST")?23:17],RF:[66,19],LF:[34,19],
      ST:[50,has("CF")?9:9],RS:[63,10],LS:[37,10]
    };
    return slots.map(pos=>spot[pos]||[50,50]);
  }
  function lineCounts(slots){
    const c={GK:0,DEF:0,MID:0,ATT:0};
    for(const pos of slots)c[lineOf(pos)]+=1;
    return c;
  }
  const countsLabel=c=>`${c.DEF}-${c.MID}-${c.ATT}`;
  // The 20 FIFA 17 formations, grouped by their line counts (defence-midfield-attack), in a fixed order.
  // FIFA 17's order: by the number, then the variant.
  function formations(){
    const f=allFormations();
    const list=Object.keys(f).map(name=>{const slots=f[name],t=titleOf(name);return Object.freeze({name,title:t.main,variant:t.variant,slots:Object.freeze(slots.slice()),counts:Object.freeze(lineCounts(slots)),group:countsLabel(lineCounts(slots)),spots:Object.freeze(pitchSpots(slots).map(p=>Object.freeze(p)))});});
    return list.sort((a,b)=>cmp(a.title,b.title)||cmp(a.variant,b.variant));
  }

  // ---------- identity and ordering (same rules as js/rosterRoulette.js) ----------
  const keys=new Map();
  function sqKey(name){
    const text=String(name||"");let k=keys.get(text);
    if(k===undefined){k=text.normalize("NFD").replace(/[̀-ͯ]/g,"").trim().toLowerCase();if(keys.size<20000)keys.set(text,k);}
    return k;
  }
  const isSigning=p=>Boolean(p)&&p.signedSeason!==null&&p.signedSeason!==undefined;
  const idOf=p=>isSigning(p)?`s|${sqKey(p.name)}`:`c|${sqKey(p.name)}#${Number.isInteger(p.number)?p.number:null}`;
  const cmp=(a,b)=>a<b?-1:a>b?1:0;
  const order=(a,b)=>b.rating-a.rating||cmp(sqKey(a.name),sqKey(b.name))||cmp(a.positions[0]||"",b.positions[0]||"")||cmp(a.name,b.name)||cmp(a.id,b.id);
  const validOverall=v=>Number.isInteger(v)&&v>=OVERALL_MIN&&v<=OVERALL_MAX;
  function person(name,number,rating,positions,signedSeason){
    const p={name,number:Number.isInteger(number)?number:null,rating,positions:Object.freeze(positions.slice()),signedSeason:signedSeason??null};
    p.id=idOf(p);
    return p;
  }
  const clone=sheet=>JSON.parse(JSON.stringify(sheet));

  // ---------- the sheet ----------
  // {v, club, season, stage, formation, slots[11], xi[11], bench[7] (seats 0-3 on the RRR board), reserves[], out[], ratings{}, excluded[], launchPos{},
  //  stopgaps[], notes[]}. Players are plain objects {id, name, number, rating, positions, signedSeason}; null = empty seat.
  const excludedSet=sheet=>new Set(sheet.excluded);
  const inSquad=sheet=>[...sheet.xi,...sheet.bench].filter(Boolean);
  const everyone=sheet=>[...inSquad(sheet),...sheet.reserves];
  function findPlayer(sheet,id){
    for(let i=0;i<XI_SIZE;i+=1)if(sheet.xi[i]&&sheet.xi[i].id===id)return {zone:"xi",index:i};
    for(let i=0;i<BENCH_SIZE;i+=1)if(sheet.bench[i]&&sheet.bench[i].id===id)return {zone:"bench",index:i};
    const r=sheet.reserves.findIndex(p=>p.id===id);
    return r>=0?{zone:"res",index:r}:null;
  }
  const at=(sheet,ref)=>ref.zone==="xi"?sheet.xi[ref.index]:ref.zone==="bench"?sheet.bench[ref.index]:sheet.reserves[ref.index];
  function put(sheet,ref,player){
    if(ref.zone==="xi")sheet.xi[ref.index]=player;
    else if(ref.zone==="bench")sheet.bench[ref.index]=player;
    else if(player)sheet.reserves[ref.index]=player;else sheet.reserves.splice(ref.index,1);
  }
  const sortReserves=sheet=>{sheet.reserves.sort(order);};
  const takeReserve=(sheet,id)=>{const i=sheet.reserves.findIndex(p=>p.id===id);return i>=0?sheet.reserves.splice(i,1)[0]:null;};
  const isStopgap=(sheet,i)=>sheet.stopgaps.includes(i);
  const setStopgap=(sheet,i,on)=>{sheet.stopgaps=sheet.stopgaps.filter(s=>s!==i);if(on)sheet.stopgaps.push(i);sheet.stopgaps.sort((a,b)=>a-b);};
  // May this player stand in this XI slot? Fit 1+, or his own FIFA 17 launch slot (the source puts a few starters out of
  // position on purpose, e.g. Rashford at LM).
  const allowed=(sheet,player,slotPos)=>sqFit(player,slotPos)>0||sheet.launchPos[player.id]===slotPos;
  const slotFit=(sheet,player,slotPos)=>Math.max(sqFit(player,slotPos),sheet.launchPos[player.id]===slotPos?1:0);

  function specialsOf(special){
    const out=[];
    for(const role of ["playerOne","playerTwo"]){
      const p=special&&special[role];
      if(!(p&&typeof p.name==="string"&&p.name.trim()&&validOverall(p.overall)))continue;
      const number=Number.isInteger(p.number)?p.number:null,names=[p.name.trim()];
      if(typeof p.sourceName==="string"&&p.sourceName.trim())names.push(p.sourceName.trim());
      for(const name of names)out.push({name,number});
    }
    return out;
  }
  // A Special Player is never anywhere in either squad (#1173, red team R87-C-01): his own club row (every row with his
  // name when the draw has no shirt number) and any signing with his name.
  function excludeSpecial(sheet,sp,pool){
    const k=sqKey(sp.name),ids=new Set(sheet.excluded);
    ids.add(`s|${k}`);
    for(const p of pool)if(!isSigning(p)&&sqKey(p.name)===k&&(sp.number===null||p.number===sp.number))ids.add(p.id);
    sheet.excluded=[...ids].sort();
  }

  // The season 1 "pre" sheet: the club's launch XI in its default formation, the original 4 subs, every other club player
  // in the reserves. Returns null for an unknown club.
  function launch(club,options){
    const d=data();
    if(!d||!Object.prototype.hasOwnProperty.call(d.squads.squads,club)||!Object.prototype.hasOwnProperty.call(d.players.clubs,club))return null;
    const squad=d.squads.squads[club],source=d.players.clubs[club];
    const slots=formationSlots(source.formation);
    if(!slots)return null;
    const pool=source.players.map(row=>person(row[0],row[4],row[1],row[2],null));
    const byIdent=(name,number)=>pool.find(p=>p.name===name&&p.number===number)||null;
    const sheet={v:VERSION,club,season:1,stage:"pre",formation:source.formation,slots,xi:new Array(XI_SIZE).fill(null),bench:new Array(BENCH_SIZE).fill(null),reserves:[],out:[],ratings:{},excluded:[],launchPos:{},stopgaps:[],notes:[]};
    const used=new Set();
    // Seat each launch starter in a slot of the same name (the club's slot list is the formation's, in another order).
    const free=slots.map((pos,i)=>({pos,i}));
    for(const [pos,name,number] of squad.xi){
      const p=byIdent(name,number);if(!p)return null;
      const s=free.findIndex(f=>f.pos===pos);if(s<0)return null;
      sheet.xi[free[s].i]=p;sheet.launchPos[p.id]=pos;used.add(p.id);free.splice(s,1);
    }
    // The original 4 subs, then the club's next 3 (the build script's hidden reserves: next highest overall, lower shirt).
    [...squad.subs,...squad.reserves].slice(0,BENCH_SIZE).forEach(([,name,number],i)=>{const p=byIdent(name,number);if(p){sheet.bench[i]=p;used.add(p.id);}});
    sheet.reserves=pool.filter(p=>!used.has(p.id));
    sortReserves(sheet);
    for(const sp of specialsOf(options&&options.special))excludeSpecial(sheet,sp,pool);
    const ex=excludedSet(sheet);
    sheet.reserves=sheet.reserves.filter(p=>!ex.has(p.id));
    for(let i=0;i<XI_SIZE;i+=1)if(sheet.xi[i]&&ex.has(sheet.xi[i].id)){const gone=sheet.xi[i];sheet.xi[i]=null;refillXi(sheet,i,[],gone);}
    for(let i=0;i<BENCH_SIZE;i+=1)if(sheet.bench[i]&&ex.has(sheet.bench[i].id)){const gone=sheet.bench[i];sheet.bench[i]=null;refillBench(sheet,i,gone);}
    for(let i=0;i<BENCH_SIZE;i+=1)if(!sheet.bench[i])refillBench(sheet,i,null);
    settleBench(sheet);
    return sheet;
  }

  // ---------- refills (within the line) ----------
  // An empty XI slot: a kept signing of this window who can play it first (today's first refusal), else the best bench or
  // reserve player who can play it (best overall; a bench player on equal overall), whose bench seat is then refilled
  // from his line. Only when nobody at the club can play the slot does a stopgap stand in: an outfielder for an
  // outfielder, a keeper for a keeper, and across that line only when the club has no one else.
  function refillXi(sheet,i,kept,gone){
    const slot=sheet.slots[i];
    const fresh=kept.filter(p=>!findPlayer(sheet,p.id)||findPlayer(sheet,p.id).zone==="res").filter(p=>allowed(sheet,p,slot)).sort(order);
    if(fresh.length){const p=fresh[0];takeReserve(sheet,p.id);sheet.xi[i]=p;setStopgap(sheet,i,false);return;}
    const cands=[];
    sheet.bench.forEach((p,b)=>{if(p&&allowed(sheet,p,slot))cands.push({p,b});});
    sheet.reserves.forEach(p=>{if(allowed(sheet,p,slot))cands.push({p,b:-1});});
    cands.sort((x,y)=>y.p.rating-x.p.rating||(x.b>=0?0:1)-(y.b>=0?0:1)||slotFit(sheet,y.p,slot)-slotFit(sheet,x.p,slot)||order(x.p,y.p));
    if(cands.length){
      const {p,b}=cands[0];
      if(b>=0){sheet.bench[b]=null;sheet.xi[i]=p;refillBench(sheet,b,p);}
      else{takeReserve(sheet,p.id);sheet.xi[i]=p;}
      setStopgap(sheet,i,false);return;
    }
    // Stopgap: nobody at the club can play this slot.
    const keeper=lineOf(slot)==="GK";
    const kind=p=>p.positions.length>0&&(p.positions[0]==="GK")===keeper;
    const pick=pred=>{
      const list=[];
      sheet.bench.forEach((p,b)=>{if(p&&pred(p))list.push({p,b});});
      sheet.reserves.forEach(p=>{if(pred(p))list.push({p,b:-1});});
      list.sort((x,y)=>y.p.rating-x.p.rating||(x.b>=0?0:1)-(y.b>=0?0:1)||order(x.p,y.p));
      return list[0]||null;
    };
    const c=pick(kind)||pick(p=>p.positions.length>0);
    if(!c){sheet.xi[i]=null;setStopgap(sheet,i,false);return;}
    if(c.b>=0){sheet.bench[c.b]=null;sheet.xi[i]=c.p;refillBench(sheet,c.b,c.p);}
    else{takeReserve(sheet,c.p.id);sheet.xi[i]=c.p;}
    setStopgap(sheet,i,true);
    void gone;
  }
  // An empty bench seat: the best reserve sharing a line with the player who left it, else the best reserve.
  function refillBench(sheet,b,gone){
    const same=sheet.reserves.filter(p=>gone&&shareLine(p,gone)).sort(order);
    const any=sheet.reserves.slice().sort(order);
    const p=same[0]||any[0]||null;
    if(p)takeReserve(sheet,p.id);
    sheet.bench[b]=p;
    settleBench(sheet);
  }
  // A player who has to leave the XI: an empty bench seat first, else in place of the weakest sub when he is better, else
  // the reserves. Then the bench settles.
  function benchOrReserve(sheet,player){
    const empty=sheet.bench.findIndex(p=>!p);
    if(empty>=0){sheet.bench[empty]=player;settleBench(sheet);return "bench";}
    let w=-1;
    for(let b=0;b<BENCH_SIZE;b+=1){const p=sheet.bench[b];if(p&&(w<0||order(sheet.bench[w],p)<0))w=b;}
    if(w>=0&&player.rating>sheet.bench[w].rating){sheet.reserves.push(sheet.bench[w]);sheet.bench[w]=player;sortReserves(sheet);settleBench(sheet);return "bench";}
    sheet.reserves.push(player);sortReserves(sheet);return "reserves";
  }
  // After any automatic change the 4 subs on the Roulette board are the best 4 of the 7 (as at launch: the original 4 subs
  // are the 4 best non-starters). Each group keeps its own seat order; empty seats go last. Manual moves never run this.
  function settleBench(sheet){
    const seated=sheet.bench.map((p,i)=>({p,i})).filter(x=>x.p);
    const top=new Set(seated.slice().sort((x,y)=>y.p.rating-x.p.rating||x.i-y.i).slice(0,FEATURED).map(x=>x.i));
    const next=[...seated.filter(x=>top.has(x.i)),...seated.filter(x=>!top.has(x.i))].map(x=>x.p);
    while(next.length<BENCH_SIZE)next.push(null);
    sheet.bench=next;
  }
  // Sol SQ-2-01, kept: a stopgap hands his slot back the moment someone of the line is available again.
  function repairStopgaps(sheet,kept){
    for(const i of sheet.stopgaps.slice()){
      const slot=sheet.slots[i],cur=sheet.xi[i];
      const free=[...sheet.bench.filter(Boolean),...sheet.reserves].some(p=>allowed(sheet,p,slot));
      if(!free)continue;
      sheet.xi[i]=null;setStopgap(sheet,i,false);
      refillXi(sheet,i,kept||[],cur);
      if(cur)benchOrReserve(sheet,cur);
    }
  }

  // ---------- Nik's no-hiding rule (2026-11-11 00:38 UTC), from season 2 ----------
  // The squad shows the save as it is: nobody better can be kept out of the XI or the Roulette board to protect him.
  // (1) No bench or reserve player may be rated above a starter standing in a slot of his own line (GK/DEF/MID/ATT, from
  //     his first FIFA 17 position),
  //     so the XI always holds each line's best for the chosen formation; flex decides who covers which slot.
  // (2) Subs 1-4 (on the Roulette board) are the best of the rest: nobody in subs 5-7 or the reserves is rated above them.
  // Ties are the manager's choice. Season 1 keeps the launch squad as it is (only moves are checked there).
  function hidingIssue(sheet){
    if(!sheet||sheet.season<2)return null;
    const outside=[...sheet.bench.map((p,b)=>({p,ref:{zone:"bench",index:b}})),...sheet.reserves.map((p,r)=>({p,ref:{zone:"res",index:r}}))].filter(x=>x.p).sort((x,y)=>order(x.p,y.p));
    for(const {p:q,ref} of outside){
      const line=lineOf(q.positions[0]||"");// his own line: a CDM who can cover CB is still a midfielder
      let best=null;
      sheet.xi.forEach((p,i)=>{
        if(!p||isStopgap(sheet,i)||!(q.rating>p.rating)||line!==lineOf(sheet.slots[i])||!allowed(sheet,q,sheet.slots[i]))return;
        const f=slotFit(sheet,q,sheet.slots[i]);
        if(!best||f>best.fit||(f===best.fit&&p.rating<best.p.rating))best={kind:"xi",q,from:ref,p,index:i,fit:f};
      });
      if(best)return best;
    }
    const featured=sheet.bench.slice(0,FEATURED).map((p,b)=>({p,b})).filter(x=>x.p);
    if(!featured.length)return null;
    const weakest=featured.reduce((w,x)=>order(w.p,x.p)<0?x:w);
    const rest=outside.filter(x=>x.ref.zone==="res"||x.ref.index>=FEATURED);
    const top=rest[0];
    if(top&&top.p.rating>weakest.p.rating)return {kind:"bench",q:top.p,from:top.ref,p:weakest.p,index:weakest.b};
    // An empty board seat while someone waits outside is filled the same way.
    const hole=sheet.bench.slice(0,FEATURED).findIndex(p=>!p);
    if(hole>=0&&top)return {kind:"bench",q:top.p,from:top.ref,p:null,index:hole};
    return null;
  }
  const hidingReason=issue=>!issue?"":!issue.p?`${issue.q.name} (${issue.q.rating}) has to fill the empty sub seat on the Roulette board.`
    :issue.kind==="xi"?`${issue.q.name} (${issue.q.rating}) is better than ${issue.p.name} (${issue.p.rating}) and plays ${lineWord(lineOf(issue.q.positions[0]||""))}. The XI keeps the best of each line.`
    :`${issue.q.name} (${issue.q.rating}) is better than ${issue.p.name} (${issue.p.rating}). Subs 1-4 on the Roulette board are the best of the rest.`;
  const lineWord=line=>({GK:"in goal",DEF:"in defence",MID:"in midfield",ATT:"in attack"})[line]||"in his line";
  // Puts every better player where the rule says. Each step raises the squad's total, so it always ends.
  function enforceBest(sheet){
    const moved=[];
    for(let guard=0;guard<200;guard+=1){
      const issue=hidingIssue(sheet);
      if(!issue){
        // A starter who dropped out may be able to play a slot a stopgap is holding: he takes it, and the check runs again.
        const spare=[...sheet.bench.filter(Boolean),...sheet.reserves];
        if(sheet.stopgaps.some(i=>spare.some(p=>allowed(sheet,p,sheet.slots[i])))){repairStopgaps(sheet,[]);continue;}
        break;
      }
      const {q,from}=issue;
      const target=issue.kind==="xi"?{zone:"xi",index:issue.index}:{zone:"bench",index:issue.index};
      const p=at(sheet,target);
      if(from.zone==="res"){takeReserve(sheet,q.id);if(p){sheet.reserves.push(p);sortReserves(sheet);}}
      else sheet.bench[from.index]=p||null;
      put(sheet,target,q);
      if(target.zone==="xi")setStopgap(sheet,target.index,false);
      moved.push({name:q.name,over:p?p.name:null});
    }
    for(let b=0;b<BENCH_SIZE;b+=1)if(!sheet.bench[b]&&sheet.reserves.length)refillBench(sheet,b,null);
    if(moved.length)sheet.notes=[...(sheet.notes||[]),...moved.map(m=>({name:m.name,reason:"promoted",over:m.over}))];
    return moved;
  }

  // ---------- season events ----------
  // Moves a locked sheet to the next screen's starting proposal.
  // - locked "pre" (season N) -> "post" (season N): events.shot = the player the RRR hit ({name, number, signedSeason}) or
  //   null; events.released = names of this window's signings the rival guessed (never join); events.kept = this window's
  //   kept signings [{name, overall, position}] (Transfer War verdict rows, release false).
  // - locked "post" (season N) -> "pre" (season N+1): nothing happens by itself; the manager reports departures there.
  function advance(locked,events){
    if(!locked||!STAGES.includes(locked.stage))return null;
    const sheet=clone(locked);sheet.notes=[];
    if(sheet.stage==="post"){
      if(sheet.season>=MAX_SEASONS)return null;
      sheet.season+=1;sheet.stage="pre";
      // Loans end: every player loaned out in an earlier season is back at the club, in the reserves.
      const ex=new Set(sheet.excluded);
      for(const o of sheet.out){
        if(o.reason!=="loaned"||o.returned||o.season>=sheet.season||!o.player)continue;
        if(sheet.out.some(x=>x.id===o.id&&x!==o&&x.reason!=="loaned"))continue;
        o.returned=sheet.season;
        if(findPlayer(sheet,o.id))continue;
        ex.delete(o.id);sheet.reserves.push(o.player);sheet.notes.push({name:o.name,reason:"loan-back"});
      }
      sheet.excluded=[...ex].sort();sortReserves(sheet);
      repairStopgaps(sheet,[]);// a keeper back from loan takes his place from an outfielder standing in
      enforceBest(sheet);
      return sheet;
    }
    sheet.stage="post";
    const ev=events||{},ex=new Set(sheet.excluded);
    for(const name of Array.isArray(ev.released)?ev.released:[])if(typeof name==="string"&&name.trim())ex.add(`s|${sqKey(name.trim())}`);
    let vacancy=null;
    if(ev.shot&&typeof ev.shot.name==="string"){
      const shot=person(ev.shot.name.trim(),ev.shot.number,1,[],ev.shot.signedSeason??null);
      ex.add(shot.id);if(!isSigning(shot))ex.add(`s|${sqKey(shot.name)}`);// a shot player never returns, not even bought back
      const ref=findPlayer(sheet,shot.id);
      if(ref){vacancy={...ref,gone:at(sheet,ref)};put(sheet,ref,null);if(ref.zone==="xi")setStopgap(sheet,ref.index,false);}
    }
    sheet.excluded=[...ex].sort();
    const kept=[];
    for(const row of Array.isArray(ev.kept)?ev.kept:[]){
      if(!row||typeof row.name!=="string"||!row.name.trim()||!validOverall(row.overall))continue;
      const positions=LINE_OF[row.position]?[row.position]:[];
      const p=person(row.name.trim(),null,row.overall,positions,sheet.season);
      if(ex.has(p.id)){sheet.notes.push({name:p.name,reason:"excluded"});continue;}
      if(findPlayer(sheet,p.id)||kept.some(k=>k.id===p.id))continue;// signed again: keeps his first window and place (SQ-2-03)
      kept.push(p);
    }
    kept.sort(order);
    // The shot player's seat: a kept signing of his line first, then the normal refill.
    if(vacancy&&vacancy.zone==="xi"){refillXi(sheet,vacancy.index,kept,vacancy.gone);}
    for(const p of kept){
      if(findPlayer(sheet,p.id))continue;
      if(p.positions.length===0){if(vacancy&&vacancy.zone==="bench"&&!sheet.bench[vacancy.index]){sheet.bench[vacancy.index]=p;}else{sheet.reserves.push(p);sortReserves(sheet);}sheet.notes.push({name:p.name,reason:"no-position"});continue;}
      join(sheet,p);
    }
    if(vacancy&&vacancy.zone==="bench"&&!sheet.bench[vacancy.index])refillBench(sheet,vacancy.index,vacancy.gone);
    for(let b=0;b<BENCH_SIZE;b+=1)if(!sheet.bench[b])refillBench(sheet,b,null);
    repairStopgaps(sheet,[]);
    settleBench(sheet);
    enforceBest(sheet);
    for(const p of kept){const r=findPlayer(sheet,p.id);if(r&&r.zone==="res")sheet.notes.push({name:p.name,reason:"reserve"});}
    return sheet;
  }
  // A kept signing starts in place of the weakest starter of a slot he can play when he is strictly better (a stopgap gives
  // way to him first); otherwise the bench rule.
  function join(sheet,p){
    let best=-1;
    for(let i=0;i<XI_SIZE;i+=1){
      const cur=sheet.xi[i],slot=sheet.slots[i];
      if(!allowed(sheet,p,slot))continue;
      if(!cur){best=i;break;}
      const gap=isStopgap(sheet,i);
      if(!gap&&!(p.rating>cur.rating))continue;
      if(best<0)best=i;
      else{
        const b=sheet.xi[best],bGap=isStopgap(sheet,best);
        if(gap&&!bGap)best=i;
        else if(gap===bGap&&(sqFit(p,slot)>sqFit(p,sheet.slots[best])||(sqFit(p,slot)===sqFit(p,sheet.slots[best])&&cur.rating<b.rating)))best=i;
      }
    }
    if(best<0){benchOrReserve(sheet,p);return;}
    const out=sheet.xi[best];sheet.xi[best]=p;setStopgap(sheet,best,false);
    if(out)benchOrReserve(sheet,out);
  }

  // ---------- the manager's moves ----------
  // A move is a swap of two places: {zone:"xi"|"bench"|"res", index}. Returns {ok, reason} without changing anything.
  // Reasons are short plain words for the screen.
  const placeOk=(sheet,r)=>Boolean(r)&&Number.isInteger(r.index)&&r.index>=0&&(r.zone==="xi"?r.index<XI_SIZE:r.zone==="bench"?r.index<BENCH_SIZE:r.zone==="res"?r.index<sheet.reserves.length:false);
  function canSwap(sheet,a,b){
    if(!sheet||!placeOk(sheet,a)||!placeOk(sheet,b))return {ok:false,reason:"Pick two players."};
    if(a.zone===b.zone&&a.index===b.index)return {ok:false,reason:"Same place."};
    if(a.zone==="res"&&b.zone==="res")return {ok:false,reason:"Both are reserves."};
    if(b.zone==="res"&&a.zone!=="res")[a,b]=[b,a];
    const pa=at(sheet,a),pb=at(sheet,b);
    if(!pa&&!pb)return {ok:false,reason:"Both places are empty."};
    if(a.zone==="res"){
      if(sheet.season<2)return {ok:false,reason:"Reserves come into the squad from season 2."};
      if(!pa)return {ok:false,reason:"No player there."};
      if(b.zone==="xi"){
        if(!allowed(sheet,pa,sheet.slots[b.index]))return {ok:false,reason:`${pa.name} can't play ${sheet.slots[b.index]}.`};
        if(pb&&pb.rating>pa.rating&&!isStopgap(sheet,b.index))return {ok:false,reason:`${pb.name} (${pb.rating}) is better than ${pa.name} (${pa.rating}). A better player can't go to the reserves.`};
        return hidingCheck(sheet,a,b);
      }
      if(b.index>=FEATURED)return hidingCheck(sheet,a,b);// subs 5-7 and the reserves are both off the board
      if(pb&&!shareLine(pa,pb))return {ok:false,reason:`${pa.name} doesn't play in ${pb.name}'s line.`};
      if(pb&&pb.rating>pa.rating)return {ok:false,reason:`${pb.name} (${pb.rating}) is better than ${pa.name} (${pa.rating}). A better player can't go to the reserves.`};
      return hidingCheck(sheet,a,b);
    }
    // XI and bench.
    const inside=r=>r.zone==="xi"||r.index<FEATURED;
    if(inside(a)!==inside(b)){
      const [inn,out]=inside(a)?[a,b]:[b,a],pin=at(sheet,inn),pout=at(sheet,out);
      if(pin&&pout&&pin.rating>pout.rating&&!(inn.zone==="xi"&&isStopgap(sheet,inn.index)))return {ok:false,reason:`${pin.name} (${pin.rating}) is better than ${pout.name} (${pout.rating}). A better player can't drop out of the 15 on the Roulette board.`};
    }
    for(const [into,p] of [[a,pb],[b,pa]]){
      if(into.zone!=="xi"||!p)continue;
      if(!allowed(sheet,p,sheet.slots[into.index]))return {ok:false,reason:`${p.name} can't play ${sheet.slots[into.index]}.`};
    }
    // An XI slot never goes empty while the player leaving it has a seat to go to.
    if((a.zone==="xi"&&!pb&&pa)||(b.zone==="xi"&&!pa&&pb)){
      const from=a.zone==="xi"?b:a;
      if(from.zone==="bench")return {ok:false,reason:"Every place in the XI needs a player."};
    }
    return hidingCheck(sheet,a,b);
  }
  // From season 2 a move may not leave a better player hidden (it is refused, never undone by itself).
  function hidingCheck(sheet,a,b){
    if(sheet.season<2)return {ok:true};
    const issue=hidingIssue(doSwap(sheet,a,b));
    return issue?{ok:false,reason:hidingReason(issue)}:{ok:true};
  }
  function swap(sheet,a,b){
    const check=canSwap(sheet,a,b);
    if(!check.ok)return {ok:false,reason:check.reason,sheet};
    return {ok:true,sheet:doSwap(sheet,a,b)};
  }
  function doSwap(sheet,a,b){
    const next=clone(sheet);
    if(b.zone==="res"&&a.zone!=="res")[a,b]=[b,a];
    const pa=at(next,a),pb=at(next,b);
    if(a.zone==="res"){
      next.reserves.splice(a.index,1);
      if(b.zone==="xi"){next.xi[b.index]=pa;setStopgap(next,b.index,false);}else next.bench[b.index]=pa;
      if(pb){next.reserves.push(pb);sortReserves(next);}
    }else{
      put(next,a,pb);put(next,b,pa);
      if(a.zone==="xi")setStopgap(next,a.index,false);
      if(b.zone==="xi")setStopgap(next,b.index,false);
    }
    return next;
  }
  // From season 2 a manager reports a player who left the club in his FIFA save. He leaves for good (a player who left
  // may be signed again later: BUY_BACK) and his place is refilled within his line.
  function leave(sheet,id,reason){
    if(!sheet||sheet.season<2)return {ok:false,reason:"Players leave the club from season 2.",sheet};
    if(!LEAVE_REASONS.includes(reason))return {ok:false,reason:"Pick why he left.",sheet};
    const ref=findPlayer(sheet,id);
    if(!ref)return {ok:false,reason:"He isn't at the club.",sheet};
    const next=clone(sheet),p=at(next,ref);
    put(next,ref,null);
    const ex=new Set(next.excluded);ex.add(p.id);if(!BUY_BACK&&!isSigning(p))ex.add(`s|${sqKey(p.name)}`);next.excluded=[...ex].sort();
    next.out.push({id:p.id,name:p.name,number:p.number,signedSeason:p.signedSeason,reason,season:next.season,stage:next.stage,player:reason==="loaned"?clone(p):null});
    if(ref.zone==="xi"){setStopgap(next,ref.index,false);refillXi(next,ref.index,[],p);}
    else if(ref.zone==="bench")refillBench(next,ref.index,p);
    next.notes=[];enforceBest(next);
    return {ok:true,sheet:next};
  }
  // From season 2 a manager can report a new overall (30-99) for a player still at the club. If that makes him better than
  // a starter of his line (or a sub on the board), he moves up by himself, and a starter who drops below goes down.
  function rate(sheet,id,overall){
    if(!sheet||sheet.season<2)return {ok:false,reason:"Overalls change from season 2.",sheet};
    if(!validOverall(overall))return {ok:false,reason:`Overall must be ${OVERALL_MIN}-${OVERALL_MAX}.`,sheet};
    const ref=findPlayer(sheet,id);
    if(!ref)return {ok:false,reason:"He isn't at the club.",sheet};
    const next=clone(sheet),p=at(next,ref);
    p.rating=overall;next.ratings[p.id]=overall;
    if(ref.zone==="res")sortReserves(next);
    next.notes=[];enforceBest(next);
    return {ok:true,sheet:next};
  }

  // ---------- formation change and AUTO (an assignment per screen, under a millisecond) ----------
  // Hungarian method (rows = 11 slots <= cols = candidates), maximising integer weights; -1 = not allowed. Deterministic:
  // candidates arrive in a fixed order and the arithmetic is exact.
  function assign(weights,cols){
    const n=weights.length,m=Math.max(cols,n),INF=Number.MAX_SAFE_INTEGER/4;
    let top=0;for(const row of weights)for(const w of row)if(w>top)top=w;
    const cost=(i,j)=>{const w=j<cols?weights[i][j]:-1;return w<0?top+1:top-w;};
    const u=new Array(n+1).fill(0),v=new Array(m+1).fill(0),p=new Array(m+1).fill(0),way=new Array(m+1).fill(0);
    for(let i=1;i<=n;i+=1){
      p[0]=i;let j0=0;const minv=new Array(m+1).fill(INF),used=new Array(m+1).fill(false);
      do{
        used[j0]=true;const i0=p[j0];let delta=INF,j1=0;
        for(let j=1;j<=m;j+=1)if(!used[j]){
          const cur=cost(i0-1,j-1)-u[i0]-v[j];
          if(cur<minv[j]){minv[j]=cur;way[j]=j0;}
          if(minv[j]<delta){delta=minv[j];j1=j;}
        }
        for(let j=0;j<=m;j+=1){if(used[j]){u[p[j]]+=delta;v[j]-=delta;}else minv[j]-=delta;}
        j0=j1;
      }while(p[j0]!==0);
      do{const j1=way[j0];p[j0]=p[j1];j0=j1;}while(j0);
    }
    const result=new Array(n).fill(-1);
    for(let j=1;j<=m;j+=1)if(p[j]&&j-1<cols&&weights[p[j]-1][j-1]>=0)result[p[j]-1]=j-1;
    return result;
  }
  // Weights: a slot filled by someone allowed beats any stopgap, which beats an empty slot; then the current XI over the
  // bench over the reserves; then overall; then fit; then staying in the same slot.
  function seat(sheet,slots,cands,source,prevSlot){
    const weights=slots.map((pos,i)=>cands.map((p,j)=>{
      const f=slotFit(sheet,p,pos),src=source[j];
      if(f>0)return 100000000+src*1000000+p.rating*1000+f*10+(prevSlot[j]===pos?5:0)+(prevSlot[j]===i?1:0);
      const outfieldInGoal=pos==="GK"||p.positions.includes("GK");
      return 10000000+(outfieldInGoal?0:500000)+src*100000+p.rating*100;
    }));
    return assign(weights,cands.length);
  }
  function setFormation(sheet,name){
    const slots=formationSlots(name);
    if(!sheet||!slots)return {ok:false,reason:"Unknown formation.",sheet};
    if(name===sheet.formation)return {ok:true,sheet};
    const next=clone(sheet);
    const xi=next.xi.filter(Boolean),bench=next.bench.filter(Boolean);
    const useReserves=next.season>=2;// Q3 default: season 1 only rearranges the original 15
    const cands=[...xi,...bench,...(useReserves?next.reserves:[])];
    const source=cands.map(p=>xi.includes(p)?2:bench.includes(p)?1:0);
    const prev=cands.map(p=>{const i=next.xi.indexOf(p);return i>=0?next.slots[i]:null;});
    const pick=seat(next,slots,cands,source,prev);
    const chosen=pick.map(j=>j>=0?cands[j]:null);
    const gaps=[];
    chosen.forEach((p,i)=>{if(p&&!allowed(next,p,slots[i]))gaps.push(i);});
    if(!useReserves&&(gaps.length||chosen.some(p=>!p)))return {ok:false,reason:"This shape needs a player from the reserves. Reserves come in from season 2.",sheet};
    const chosenIds=new Set(chosen.filter(Boolean).map(p=>p.id));
    const displaced=xi.filter(p=>!chosenIds.has(p.id)).sort(order);
    next.formation=name;next.slots=slots;next.xi=chosen;next.stopgaps=gaps;
    // Bench: subs who stay keep their seats; seats left by promoted subs take displaced starters first.
    next.bench=next.bench.map(p=>p&&chosenIds.has(p.id)?null:p);
    next.reserves=next.reserves.filter(p=>!chosenIds.has(p.id));
    for(const p of displaced){
      const empty=next.bench.findIndex(x=>!x);
      if(empty>=0)next.bench[empty]=p;else benchOrReserve(next,p);
    }
    for(let b=0;b<BENCH_SIZE;b+=1)if(!next.bench[b]&&useReserves)refillBench(next,b,null);
    sortReserves(next);
    next.notes=[];enforceBest(next);
    return {ok:true,sheet:next};
  }
  // AUTO: the same XI, each player in his best slot. Nobody joins or leaves the XI.
  function autoPlace(sheet){
    if(!sheet)return {ok:false,reason:"No squad.",sheet};
    const next=clone(sheet),xi=next.xi.filter(Boolean);
    const prev=xi.map(p=>next.slots[next.xi.indexOf(p)]);
    const pick=seat(next,next.slots,xi,xi.map(()=>2),prev);
    next.xi=pick.map(j=>j>=0?xi[j]:null);
    next.stopgaps=next.xi.map((p,i)=>p&&!allowed(next,p,next.slots[i])?i:-1).filter(i=>i>=0);
    next.notes=[];enforceBest(next);
    return {ok:true,sheet:next};
  }

  // ---------- replayable edits (the phone keeps only these as its draft) ----------
  // ops: {t:"swap",a,b} | {t:"formation",name} | {t:"auto"} | {t:"leave",id,reason} | {t:"rate",id,overall}
  function sqApply(base,ops){
    let sheet=base;const errors=[];
    for(const op of Array.isArray(ops)?ops:[]){
      let r;
      if(op&&op.t==="swap")r=swap(sheet,op.a,op.b);
      else if(op&&op.t==="formation")r=setFormation(sheet,op.name);
      else if(op&&op.t==="auto")r=autoPlace(sheet);
      else if(op&&op.t==="leave")r=leave(sheet,op.id,op.reason);
      else if(op&&op.t==="rate")r=rate(sheet,op.id,op.overall);
      else r={ok:false,reason:"Unknown move.",sheet};
      if(r.ok)sheet=r.sheet;else errors.push({op,reason:r.reason});
    }
    return {sheet,errors};
  }

  // ---------- checks ----------
  // Structural rules every sheet must meet (also run on the rival's stored sheet before RRR uses it).
  function validate(sheet){
    const problems=[];
    if(!sheet||sheet.v!==VERSION)return {ok:false,problems:["Unknown squad version."]};
    const slots=formationSlots(sheet.formation);
    if(!slots||slots.join()!==sheet.slots.join())problems.push("Formation and slots don't match.");
    if(sheet.xi.length!==XI_SIZE||sheet.bench.length!==BENCH_SIZE)problems.push("Wrong squad size.");
    const ids=everyone(sheet).map(p=>p.id),ex=excludedSet(sheet);
    if(new Set(ids).size!==ids.length)problems.push("A player is listed twice.");
    if(ids.some(id=>ex.has(id)))problems.push("A player who is out is back in the squad.");
    const spare=[...sheet.bench.filter(Boolean),...sheet.reserves];
    sheet.xi.forEach((p,i)=>{
      const slot=sheet.slots[i];
      if(!p){if(spare.length)problems.push(`${slot} is empty.`);return;}
      if(allowed(sheet,p,slot))return;
      if(!sheet.stopgaps.includes(i)||spare.some(q=>allowed(sheet,q,slot)))problems.push(`${p.name} can't play ${slot}.`);
    });
    if(sheet.bench.some(p=>!p)&&sheet.reserves.length)problems.push("A bench seat is empty.");
    const hidden=problems.length?null:hidingIssue(sheet);
    if(hidden)problems.push(hidingReason(hidden));
    return {ok:problems.length===0,problems};
  }

  // The RRR board for a locked "pre" sheet: XI in slot order (0-10), then the 4 subs (11-14), as rosterRoulette rows.
  function board(sheet){
    const row=(slot,pos,p)=>Object.freeze({slot,bench:slot>=XI_SIZE,pos,name:p?p.name:null,number:p?p.number:null,rating:p?p.rating:0,positions:p?p.positions:Object.freeze([]),special:false,signedSeason:p?p.signedSeason:null});
    return Object.freeze([...sheet.xi.map((p,i)=>row(i,sheet.slots[i],p)),...sheet.bench.slice(0,FEATURED).map((p,i)=>row(XI_SIZE+i,"SUB",p))]);
  }

  // ---------- the stored document (rivalries/{rid}/squadSheets/season_N_stage_role, create-only) ----------
  // Flat lists only (a map of 15 hit the Rules expression ceiling in r87). Reserves are not stored: they are everyone else.
  function toDoc(sheet){
    const fifteen=[...sheet.xi,...sheet.bench];
    return {
      schemaVersion:VERSION,objectType:"sharedSquadSheet",seasonNumber:sheet.season,stage:sheet.stage,formation:sheet.formation,
      names:fifteen.map(p=>p?p.name:""),numbers:fifteen.map(p=>p&&Number.isInteger(p.number)?p.number:-1),signed:fifteen.map(p=>p&&isSigning(p)?p.signedSeason:0),
      outNames:sheet.out.map(o=>o.name),outNumbers:sheet.out.map(o=>Number.isInteger(o.number)?o.number:-1),outSigned:sheet.out.map(o=>o.signedSeason||0),outReasons:sheet.out.map(o=>o.reason),outSeasons:sheet.out.map(o=>o.season),
      ovNames:Object.keys(sheet.ratings).map(id=>everyoneById(sheet,id).name),ovNumbers:Object.keys(sheet.ratings).map(id=>{const p=everyoneById(sheet,id);return Number.isInteger(p.number)?p.number:-1;}),ovSigned:Object.keys(sheet.ratings).map(id=>everyoneById(sheet,id).signedSeason||0),ovValues:Object.values(sheet.ratings),
      engine:`sq${VERSION}`
    };
  }
  function everyoneById(sheet,id){return everyone(sheet).find(p=>p.id===id)||sheet.out.find(o=>o.id===id)||{name:"",number:null,signedSeason:null};}
  // Rebuilds a locked sheet from its document and the proposal the same screen opened on (same season and stage), which
  // holds every person who could be in it. Returns null when the document names someone the proposal doesn't have.
  function fromDoc(doc,proposal){
    if(!doc||doc.schemaVersion!==VERSION||!proposal||doc.seasonNumber!==proposal.season||doc.stage!==proposal.stage)return null;
    const slots=formationSlots(doc.formation);
    if(!slots||!Array.isArray(doc.names)||doc.names.length!==XI_SIZE+BENCH_SIZE)return null;
    const sheet=clone(proposal);
    const idFor=(name,number,signed)=>idOf({name,number:number>=0?number:null,signedSeason:signed>0?signed:null});
    for(let i=0;i<(doc.ovNames||[]).length;i+=1){
      const id=idFor(doc.ovNames[i],doc.ovNumbers[i],doc.ovSigned[i]),p=everyone(sheet).find(q=>q.id===id);
      if(p&&validOverall(doc.ovValues[i])){p.rating=doc.ovValues[i];sheet.ratings[id]=doc.ovValues[i];}
    }
    const known=new Set(sheet.out.map(o=>o.id)),ex=new Set(sheet.excluded);
    for(let i=0;i<(doc.outNames||[]).length;i+=1){
      const id=idFor(doc.outNames[i],doc.outNumbers[i],doc.outSigned[i]);
      if(known.has(id))continue;
      const p=everyone(sheet).find(q=>q.id===id);if(!p)return null;
      if(!LEAVE_REASONS.includes(doc.outReasons[i]))return null;
      sheet.out.push({id,name:p.name,number:p.number,signedSeason:p.signedSeason,reason:doc.outReasons[i],season:doc.outSeasons[i],stage:doc.stage,player:doc.outReasons[i]==="loaned"?clone(p):null});
      ex.add(id);known.add(id);
    }
    sheet.excluded=[...ex].sort();
    const pool=everyone(sheet).filter(p=>!ex.has(p.id));
    const take=(name,number,signed)=>{if(!name)return null;const id=idFor(name,number,signed);const i=pool.findIndex(p=>p.id===id);return i>=0?pool.splice(i,1)[0]:undefined;};
    const fifteen=doc.names.map((name,i)=>take(name,doc.numbers[i],doc.signed[i]));
    if(fifteen.includes(undefined))return null;
    sheet.formation=doc.formation;sheet.slots=slots;sheet.xi=fifteen.slice(0,XI_SIZE);sheet.bench=fifteen.slice(XI_SIZE);
    sheet.reserves=pool;sortReserves(sheet);
    sheet.stopgaps=sheet.xi.map((p,i)=>p&&!allowed(sheet,p,slots[i])?i:-1).filter(i=>i>=0);
    return validate(sheet).ok?sheet:null;
  }

  return Object.freeze({
    version:VERSION,feature:"cms-squad-sheet",xiSize:XI_SIZE,benchSize:BENCH_SIZE,boardSubs:FEATURED,maxSeasons:MAX_SEASONS,
    lines:LINES,stages:STAGES,leaveReasons:LEAVE_REASONS,buyBack:BUY_BACK,flex:FLEX,
    lineOf,family,fit:sqFit,playerLines,formations,formationSlots,lineCounts,pitchSpots,titleOf,idOf,allowedIn:(sheet,player,slot)=>allowed(sheet,player,slot),slotFit:(sheet,player,slot)=>slotFit(sheet,player,slot),findPlayer,
    launch,advance,canSwap,swap,leave,rate,setFormation,autoPlace,apply:sqApply,validate,board,toDoc,fromDoc,
    hidingIssue:sheet=>{const i=hidingIssue(sheet);return i?Object.freeze({kind:i.kind,better:i.q.name,over:i.p?i.p.name:null,reason:hidingReason(i)}):null;}
  });
});
