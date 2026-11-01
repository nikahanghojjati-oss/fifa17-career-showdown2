"use strict";
// r87 house rule (Nik 2026-11-01 14:03 UTC): a player the rival guessed is released and can never be signed again.
// HD-01 (in-project hunt): LOCK used to accept him, and js/rosterRoulette.js then silently kept him off the next board.
// Scope (G lead): only the manager whose signing was guessed, the same scope as the roulette's exclusion; only for a
// Roster Roulette Showdown; verdicts not kept on this phone refuse nothing (no new read).
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const file=path.resolve(__dirname,"../../js/productionSharedTransferChallenge.js");
const source=fs.readFileSync(file,"utf8");
const api=require(file);
let checks=0;
function check(id,label,fn){fn();checks+=1;process.stdout.write(`ok ${checks} ${id} ${label}\n`);}
const season1={playerOne:[{slot:1,name:"Renato Sanches",release:true},{slot:2,name:"N. Kanté",release:false}],playerTwo:[{slot:1,name:"Dele Alli",release:true}]};
check("GN1","a manager's own signing guessed in an earlier season is refused, by the roulette's name key",()=>{
  assert.equal(typeof api.guessedBefore,"function");
  for(const typed of ["Renato Sanches"," renato sanches ","RENATO SANCHES","Renáto Sanches"])assert.equal(api.guessedBefore([season1],"playerOne",typed),true,typed);
  assert.equal(api.guessedBefore([season1],"playerTwo","Dele Alli"),true);
});
check("GN2","only that manager: the rival may sign him, and an unguessed signing stays signable",()=>{
  assert.equal(api.guessedBefore([season1],"playerTwo","Renato Sanches"),false,"the rival's board engine allows him, so entry agrees");
  assert.equal(api.guessedBefore([season1],"playerOne","Dele Alli"),false);
  assert.equal(api.guessedBefore([season1],"playerOne","N. Kanté"),false,"a signing that survived the guesses is not blocked");
  assert.equal(api.guessedBefore([season1],"playerOne","Renato"),false,"whole names only");
});
check("GN3","no kept verdicts, bad role or empty name refuses nothing",()=>{
  assert.equal(api.guessedBefore([],"playerOne","Renato Sanches"),false);
  assert.equal(api.guessedBefore(null,"playerOne","Renato Sanches"),false);
  assert.equal(api.guessedBefore([season1],"daniel","Renato Sanches"),false);
  assert.equal(api.guessedBefore([season1],"playerOne",""),false);
  assert.equal(api.guessedBefore([{playerOne:null,playerTwo:null}],"playerOne","Renato Sanches"),false);
});
check("GN4","LOCK refuses with TRANSFER_SIGNING_GUESSED_BEFORE, gated on Roster Roulette and earlier kept seasons only",()=>{
  assert.ok(source.includes('if(pstcIsGuessedBefore(role,player))pstcFail("TRANSFER_SIGNING_GUESSED_BEFORE"'));
  const fn=source.slice(source.indexOf("function pstcIsGuessedBefore("),source.indexOf("function pstcBuildSignings("));
  assert.ok(fn.includes("at<step.fromMs)return false"),"a Showdown from before Roster Roulette refuses nothing");
  assert.ok(fn.includes("season<request.seasonNumber"),"only earlier seasons");
  assert.ok(fn.includes("pstcKeptVerdicts(request.rivalryId,season)"),"kept verdicts only, no read");
  assert.equal(/firestore|getDoc|\.get\(/.test(fn),false,"no read");
});
console.log(`PASS r87 guessed player never signed again contracts: ${checks} checks.`);
