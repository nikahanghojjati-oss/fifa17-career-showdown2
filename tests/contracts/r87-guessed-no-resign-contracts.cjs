"use strict";
// r87 house rule (Nik 2026-11-01 14:03 UTC): a player the rival guessed is released and can never be signed again.
// HD-01 (in-project hunt): LOCK used to accept him, and js/rosterRoulette.js then silently kept him off the next board.
// Scope (G lead): only the manager whose signing was guessed, the same scope as the roulette's exclusion; only for a
// Roster Roulette Showdown. r88 (Nik 2026-11-03): also on a fresh browser (tests/contracts/r88-lock-refusals-contracts.cjs).
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const file=path.resolve(__dirname,"../../js/productionSharedTransferChallenge.js");
const source=fs.readFileSync(file,"utf8");
const api=require(file);
let checks=0;
function check(id,label,fn){fn();checks+=1;process.stdout.write(`ok ${checks} ${id} ${label}\n`);}
const guessedBefore=(earlier,role,name)=>{const history=[null,...(Array.isArray(earlier)?earlier:[])];return api.rouletteBlocked(history,{},history.length,role).get(api.nameKey(name))?.reason==="guessed";};
const season1={playerOne:[{slot:1,name:"Renato Sanches",release:true},{slot:2,name:"N. Kanté",release:false}],playerTwo:[{slot:1,name:"Dele Alli",release:true}]};
check("GN1","a manager's own signing guessed in an earlier season is refused, by the roulette's name key",()=>{
  assert.equal(typeof api.rouletteBlocked,"function");
  for(const typed of ["Renato Sanches"," renato sanches ","RENATO SANCHES","Renáto Sanches"])assert.equal(guessedBefore([season1],"playerOne",typed),true,typed);
  assert.equal(guessedBefore([season1],"playerTwo","Dele Alli"),true);
});
check("GN2","only that manager: the rival may sign him, and an unguessed signing stays signable",()=>{
  assert.equal(guessedBefore([season1],"playerTwo","Renato Sanches"),false,"the rival's board engine allows him, so entry agrees");
  assert.equal(guessedBefore([season1],"playerOne","Dele Alli"),false);
  assert.equal(guessedBefore([season1],"playerOne","N. Kanté"),false,"a signing that survived the guesses is not blocked");
  assert.equal(guessedBefore([season1],"playerOne","Renato"),false,"whole names only");
});
check("GN3","no kept verdicts, bad role or empty name refuses nothing",()=>{
  assert.equal(guessedBefore([],"playerOne","Renato Sanches"),false);
  assert.equal(guessedBefore(null,"playerOne","Renato Sanches"),false);
  assert.equal(guessedBefore([season1],"daniel","Renato Sanches"),false);
  assert.equal(guessedBefore([season1],"playerOne",""),false);
  assert.equal(guessedBefore([{playerOne:null,playerTwo:null}],"playerOne","Renato Sanches"),false);
});
check("GN4","LOCK refuses with TRANSFER_SIGNING_GUESSED_BEFORE, gated on Roster Roulette, earlier seasons' guesses only",()=>{
  assert.ok(source.includes('pstcRefuse(out.reason==="shot"?"TRANSFER_SIGNING_SHOT":"TRANSFER_SIGNING_GUESSED_BEFORE"'));
  const fn=source.slice(source.indexOf("function pstcBlockedNow("),source.indexOf("function pstcRefuse("));
  assert.ok(fn.includes("at<from)return Promise.resolve(new Map())"),"a Showdown from before Roster Roulette refuses nothing");
  const pure=source.slice(source.indexOf("function pstcRouletteBlocked("),source.indexOf("const PSTC_BLOCKED_CHECK_TEXT"));
  assert.ok(pure.includes("for(let k=1;k<season;k+=1)"),"guesses of earlier seasons only");
});
console.log(`PASS r87 guessed player never signed again contracts: ${checks} checks.`);
