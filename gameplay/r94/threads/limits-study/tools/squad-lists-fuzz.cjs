"use strict";
// R94-05 scratch: worst legal squad-sheet list sizes over 10 seasons (outNames cap 100, ovNames cap 150), on the real engine.
// Same driver as tests/contracts/r93-loan-records-contracts.cjs L3, but: 3 NEW signings every window (so buy-backs and new men
// both happen), every man at the club gets a reported overall on every screen, and departures are pushed as hard as the engine allows.
const path=require("node:path"),root=path.resolve(__dirname,"../../../../.."),get=p=>require(path.join(root,p));
const S=get("js/squadSheet.js"),Step=get("js/squadSheetStep.js"),P=get("data/fifa17Players.js");
const sizes=Object.values(P.clubs).map(c=>c.players.length);
console.log(`CLUBS ${sizes.length} pool sizes min ${Math.min(...sizes)} max ${Math.max(...sizes)}`);
const people=s=>[...s.xi,...s.bench,...s.reserves].filter(Boolean);
const docOf=(sheet,season,stage)=>({...S.toDoc(sheet),schemaVersion:1,objectType:"sharedSquadSheet",rivalryId:`pair_${"a".repeat(64)}`,seasonNumber:season,stage,role:"playerOne"});
const mul=seed=>{let a=seed>>>0;return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};};
const POS=["GK","CB","RB","LB","CDM","CM","CAM","RM","LM","RW","LW","ST"];
const big=Object.keys(P.clubs).filter(c=>P.clubs[c].players.length===Math.max(...sizes));
const stats={careers:0,screens:0,out:0,ov:0,bytes:0,refused:0,errors:0};
function career(seed,mode){
  const r=mul(seed),pick=a=>a[Math.floor(r()*a.length)],club=pick(big);
  const events=[null];let lastDoc=null,lastKey=null,n=0;
  for(let k=1;k<=10;k+=1)for(const stage of ["pre","post"]){
    if(stage==="post"&&k===10)continue;
    if(stage==="post"){
      const rows=[];
      for(let s=1;s<=3;s+=1){
        // mode "new": three brand-new men each window; mode "mix": half the time a man who left before (a buy-back)
        const back=mode==="mix"&&lastDoc&&lastDoc.outNames.length&&r()<0.5?pick(lastDoc.outNames):null;
        n+=1;rows.push({slot:s,name:back||`Signing ${seed} ${n} ${"x".repeat(60)}`.slice(0,80),overall:60+Math.floor(r()*30),position:pick(POS),release:false,...(back?{}:{playerId:100000+seed*100+n})});
      }
      events[k]=Step.events({verdicts:{playerOne:rows,playerTwo:[]},hits:{playerOne:{fired:false}}},"playerOne");
    }
    const out=S.replay({club,special:null,season:k,stage,events,docs:lastKey?{[lastKey]:lastDoc}:{}});
    if(out.error){stats.errors+=1;return;}
    let sheet=out.proposal;
    if(k>=2){
      for(const p of people(sheet)){const res=S.apply(sheet,[{t:"rate",id:p.id,overall:40+Math.floor(r()*55)}]);if(!res.errors.length)sheet=res.sheet;}
      for(const p of people(sheet).sort(()=>r()-0.5)){
        if(people(sheet).length<=14)break;
        const res=S.apply(sheet,[{t:"leave",id:p.id,reason:r()<(mode==="mix"?0.5:0.2)?"loaned":pick(["sold","contract","retired","swapped","other"])}]);
        if(!res.errors.length)sheet=res.sheet;
      }
    }
    if(!S.validate(sheet).ok){stats.errors+=1;return;}
    const key=`${k}_${stage}`,data=docOf(sheet,k,stage);
    if(!Step.parse(data,k,stage,"playerOne"))stats.refused+=1;
    stats.out=Math.max(stats.out,data.outNames.length);stats.ov=Math.max(stats.ov,data.ovNames.length);stats.bytes=Math.max(stats.bytes,Buffer.byteLength(JSON.stringify(data)));
    lastDoc=data;lastKey=key;stats.screens+=1;
  }
  stats.careers+=1;
}
for(const mode of ["new","mix"])for(let seed=1;seed<=200;seed+=1)career(seed,mode);
console.log(`SQUAD_LISTS careers=${stats.careers} screens=${stats.screens} engineErrors=${stats.errors} clientRefused=${stats.refused} maxOut=${stats.out}/100 maxOv=${stats.ov}/150 maxDocJsonBytes=${stats.bytes}`);
