"use strict";
// GC-04 (Nik 2026-11-01): from 2.0.0 a manager's Special Player never plays for that manager's own club. Showdowns confirmed
// before the boundary keep the r86 draw exactly. One boundary with Roster Roulette; one club-name table with commentary.
const assert=require("node:assert/strict");
const D=require("../../js/marqueePlayer.js"),M=require("../../data/marqueePlayers.js"),C=require("../../js/sharedShowdownCatalog.js");
const Step=require("../../js/rosterRouletteStep.js"),E=require("../../js/commentaryEngine.js");
let checks=0;const ok=(v,m)=>{assert.ok(v,m);checks+=1;};
assert.ok(D.ownClubFromMs>=Step.fromMs,"the own-club boundary is never before the Roster Roulette boundary (the release PR pins both to the release time)");checks+=1;
assert.deepEqual({...D.clubAliases},{...E.clubAliases},"one club-name table: js/commentaryEngine.js CLUB_ALIASES");checks+=1;
const cc=n=>D.clubAliases[n]||n,leagues=Object.entries(C.catalog);
const r=(()=>{let s=4041;return ()=>{s^=s<<13;s>>>=0;s^=s>>17;s^=s<<5;s>>>=0;return s/4294967296;};})();
const hex=()=>Array.from({length:64},()=>"0123456789abcdef"[Math.floor(r()*16)]).join("");
const AFTER=Math.max(D.ownClubFromMs,D.fromMs)+60000,BEFORE=D.ownClubFromMs-60000;
let moved=0;
for(let i=0;i<4000;i+=1){
  const id=`pair_${hex()}`,[,clubsOf]=leagues[Math.floor(r()*leagues.length)];
  const one=clubsOf[Math.floor(r()*clubsOf.length)];let two=clubsOf[Math.floor(r()*clubsOf.length)];if(two===one)two=clubsOf[(clubsOf.indexOf(one)+1)%clubsOf.length];
  const clubs={playerOne:one,playerTwo:two};
  // Before the boundary: exactly the r86 draw, clubs or not.
  if(BEFORE>=D.fromMs){const old=D.forShowdown(id,BEFORE),withClubs=D.forShowdown(id,BEFORE,{clubs});ok(old&&withClubs&&old.playerOne.name===withClubs.playerOne.name&&old.playerTwo.name===withClubs.playerTwo.name,"before 2.0.0 the draw never changes");}
  // After: never his own club, never the same player, the same on both phones, and nothing without clubs.
  const pair=D.forShowdown(id,AFTER,{clubs});
  ok(pair,`${id}: a pair`);
  ok(cc(pair.playerOne.club)!==one&&cc(pair.playerTwo.club)!==two,`${id}: Daniel's SP is not at ${one}, Nik's not at ${two}`);
  ok(pair.playerOne.name!==pair.playerTwo.name,"never the same player");
  ok(JSON.stringify(D.forShowdown(id,AFTER,{clubs:{daniel:one,nik:two}}))===JSON.stringify(pair),"{daniel,nik} and {playerOne,playerTwo} agree");
  ok(D.forShowdown(id,AFTER)===null,"no clubs after the boundary: no Special Player rather than a wrong one");
  const picks=D.picksForShowdown(id,AFTER,clubs);
  ok(picks&&M.players[picks.playerOne].name===pair.playerOne.name&&M.players[picks.playerTwo].name===pair.playerTwo.name,"the reveal animates the same pair");
  ok(D.isOwnSpecial(id,AFTER,"playerTwo",pair.playerTwo.name,clubs)&&!D.isOwnSpecial(id,AFTER,"playerTwo",pair.playerOne.name,clubs),"the signing check names the same player");
  const plain=D.picks(id,M.players.length);if(plain.playerOne!==picks.playerOne||plain.playerTwo!==picks.playerTwo)moved+=1;
}
ok(moved>0,"some draws really move off an own-club player");
console.log(`r87 SP own-club contracts passed (${checks} checks, ${moved} of 4000 draws moved)`);
