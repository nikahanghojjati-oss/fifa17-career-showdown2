"use strict";
// r87 W3-3 career-screen number oracle: what every career screen must show, computed from the stored Firestore documents only
// (never from what the harness typed, never from the game's own scoring or career modules). Emulator only.
//
// Product rules used (house rules, Nik): a season scores Champions League 5, Europa League 3 (never both), league title 3
// (league position 1), domestic cup 1, performance bonus 1 (100+ league points or 100+ league goals), awards bonus 1 (top
// scorer or top assist), so 0-11. Equal season points is a DRAW; equal Showdown totals is a DRAW; league position never decides
// (no tiebreak anywhere). A Golden Showdown is a 10-season Showdown a manager closes on 110. Only completed Showdowns (closed
// with a Terminal Close witness) count anywhere. An ended-early Showdown (closed without one) is one status-only History card
// and counts nowhere. Never-joined codes, test runs (career start marker) and the live Showdown count nowhere in career totals.
const {doc,getDoc}=require("firebase/firestore");

const MANAGERS=["daniel","nik"];
const NAMES={daniel:"Daniel",nik:"Nik"};

function scoreSeason(r){
  const cl=r.championsLeague?5:0,el=!r.championsLeague&&r.europaLeague===true?3:0,title=r.leaguePosition===1?3:0,cup=r.domesticCup?1:0;
  const perf=(r.leaguePoints>=100||r.leagueGoals>=100)?1:0,awards=(r.topScorer||r.topAssist)?1:0;
  return {cl,el,title,cup,perf,awards,total:cl+el+title+cup+perf+awards};
}
const side=(d,n)=>d>n?"daniel":n>d?"nik":"draw";

function blank(){return {total:0,W:0,D:0,L:0,league:0,cup:0,cl:0,el:0,trophies:0,seasons:0,points:0,goals:0,bestScore:null,perfect:0,highPoints:null,highGoals:null};}
function tally(seasons){
  const t={daniel:blank(),nik:blank()};
  for(const season of seasons){
    const s={daniel:scoreSeason(season.daniel).total,nik:scoreSeason(season.nik).total},w=side(s.daniel,s.nik);
    for(const u of MANAGERS){
      const r=season[u],x=t[u];
      x.seasons+=1;x.total+=s[u];if(w===u)x.W+=1;else if(w==="draw")x.D+=1;else x.L+=1;
      if(r.leaguePosition===1)x.league+=1;if(r.domesticCup)x.cup+=1;if(r.championsLeague)x.cl+=1;else if(r.europaLeague===true)x.el+=1;
      x.points+=r.leaguePoints;x.goals+=r.leagueGoals;if(s[u]===11)x.perfect+=1;
      x.bestScore=Math.max(x.bestScore??0,s[u]);x.highPoints=Math.max(x.highPoints??0,r.leaguePoints);x.highGoals=Math.max(x.highGoals??0,r.leagueGoals);
      x.trophies=x.league+x.cup+x.cl+x.el;
    }
  }
  return t;
}

// Reads one account's career straight from the stored documents (Rules off: this is the test's own view of the truth).
async function readCareer(env,uid){
  let career=null;
  await env.withSecurityRulesDisabled(async context=>{
    const db=context.firestore();
    const get=async(...parts)=>{const s=await getDoc(doc(db,...parts));return s.exists()?s.data():null;};
    const head=await get("accounts",uid,"careerIndex","current");
    const ids=[];
    if(head){for(let n=1;n<=head.data.sealedPageCount;n+=1)ids.push(...(await get("accounts",uid,"careerIndex",`page_${n}`)).data.rivalryIds);ids.push(...head.data.rivalryIds);}
    const marker=await get("accounts",uid,"careerStart","current");
    const hidden=new Set(marker?.data?.hiddenRivalryIds||[]);
    const pairLink=await get("accounts",uid,"pairLinks","current");
    const rows=[];
    for(const rivalryId of ids){
      const root=await get("rivalries",rivalryId);const data=root?.data||{};
      const row={rivalryId,hidden:hidden.has(rivalryId)||data.mode==="test",state:"unknown",seasons:[],totalSeasons:null,endedAt:null,seasonsPlayed:null};
      const slots=Array.isArray(data.managerSlots)?data.managerSlots:[];
      const roleOf={};for(const slot of slots){const who=slot.accountId===uid?(pairLink?.data?.managerId):null;if(who)roleOf[slot.slotId]=who;}
      // The other slot is the other manager.
      for(const slot of slots)if(!roleOf[slot.slotId]){const mine=Object.values(roleOf)[0];if(mine)roleOf[slot.slotId]=mine==="daniel"?"nik":"daniel";}
      row.roleOf=roleOf;
      const authorized=Array.isArray(data.authorizedAccountIds)?data.authorizedAccountIds.length:0;
      if(authorized<2)row.state="never-started";
      else if(data.connectionState==="closed"&&data.terminalClose)row.state="completed";
      else if(data.connectionState==="closed"){row.state="ended";row.seasonsPlayed=Number.isInteger(data.endedEarly?.seasonsPlayed)?data.endedEarly.seasonsPlayed:null;row.endedAt=root.updatedAt?.toMillis?.()??null;}
      else row.state="live";
      const setup=await get("rivalries",rivalryId,"sharedSetup","authoritative");
      row.totalSeasons=setup?.totalSeasons??null;row.leagueId=setup?.leagueId??null;
      if(row.state==="completed"||row.state==="live"){
        for(let n=1;n<=(row.totalSeasons||0);n+=1){
          const commit=await get("rivalries",rivalryId,"seasonCommits",`season_${n}`);
          if(!commit||commit.phase!=="ACKNOWLEDGED")break;
          const season={};for(const role of Object.keys(commit.results))season[roleOf[role]]=commit.results[role];
          row.seasons.push(season);
        }
      }
      if(row.state==="completed"){
        const t=tally(row.seasons);row.totals={daniel:t.daniel.total,nik:t.nik.total};row.winner=side(t.daniel.total,t.nik.total);
        // The stored Terminal Close witness must agree with the stored seasons (a mismatch is itself a finding).
        const w=data.terminalClose?.managerTotals;
        const witness=w?{[roleOf.playerOne]:w.playerOne,[roleOf.playerTwo]:w.playerTwo}:null;
        row.witnessAgrees=Boolean(witness&&witness.daniel===row.totals.daniel&&witness.nik===row.totals.nik&&row.seasons.length===row.totalSeasons);
        row.golden={daniel:row.totalSeasons===10&&row.totals.daniel===110,nik:row.totalSeasons===10&&row.totals.nik===110};
      }
      rows.push(row);
    }
    career={uid,ids,rows,managerId:pairLink?.data?.managerId||null};
  });
  return career;
}

// Everything the career screens must show for that career.
function expectCareer(career){
  const visible=career.rows.filter(r=>!r.hidden&&r.state!=="never-started");
  const completed=visible.filter(r=>r.state==="completed");
  const all=completed.flatMap(r=>r.seasons);
  const t=tally(all),x={};
  for(const u of MANAGERS)x[u]={...t[u],completed:completed.length,avgPoints:t[u].seasons?t[u].points/t[u].seasons:0,avgGoals:t[u].seasons?t[u].goals/t[u].seasons:0,sdWins:0,sdDraws:0,sdLosses:0,golden:0};
  const margins=[];
  for(const r of completed){
    for(const u of MANAGERS){if(r.winner==="draw")x[u].sdDraws+=1;else if(r.winner===u)x[u].sdWins+=1;else x[u].sdLosses+=1;if(r.golden[u])x[u].golden+=1;}
    if(r.winner!=="draw")margins.push({manager:r.winner,value:Math.abs(r.totals.daniel-r.totals.nik)});
  }
  // r87 (B5): a best of 0 is a record nobody holds.
  const record=vals=>{if(!vals.length)return null;const max=Math.max(...vals.map(v=>v.value));if(!(max>0))return null;const who=new Set(vals.filter(v=>v.value===max).map(v=>v.manager));return {value:max,holder:who.size===1?[...who][0]:"shared"};};
  const per=fn=>all.flatMap(s=>MANAGERS.map(u=>({manager:u,value:fn(s[u])})));
  const records={season:record(per(r=>scoreSeason(r).total)),points:record(per(r=>r.leaguePoints)),goals:record(per(r=>r.leagueGoals)),
    biggestWin:record(margins),perfect:all.length?record(MANAGERS.map(u=>({manager:u,value:x[u].perfect}))):null};
  // History numbers every listed Showdown in career order (#1 oldest); it lists completed and ended-early ones and opens on
  // the newest (Nik 2026-10-31).
  let n=0;const numbered=visible.map(r=>({...r,number:++n}));
  const history=numbered.filter(r=>r.state==="completed"||r.state==="ended");
  const live=numbered.find(r=>r.state==="live")||null;
  const champions={daniel:completed.filter(r=>r.winner==="daniel").length,nik:completed.filter(r=>r.winner==="nik").length};
  const newestCompleted=[...completed].reverse()[0]||null;
  return {x,records,history,live,champions,completedCount:completed.length,newestCompleted,witnessProblems:completed.filter(r=>!r.witnessAgrees).map(r=>r.rivalryId)};
}

module.exports={scoreSeason,tally,side,readCareer,expectCareer,NAMES,MANAGERS};
