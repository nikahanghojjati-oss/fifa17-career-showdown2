const assert=require("node:assert/strict");
const Terminal=require("../../js/sharedTerminalClose.js");

const rivalryId="pair_"+("a".repeat(64));
const finalProjection={
  schemaVersion:1,runtimeRevision:"1.9.1-r17",phase:"FINAL_SEASON_RECONCILED",rivalryId,leagueId:"premier-league",totalSeasons:3,acceptedSeasons:3,completedSeason:3,acceptedRevisionKey:"season:3:revision:19",fixedClubs:{playerOne:"Arsenal",playerTwo:"Chelsea"},managerTotals:{playerOne:11,playerTwo:9},winner:"playerOne",terminal:true,finalSeasonReconciled:true,nextSeason:null,extraSeasonAllowed:false,terminalCloseRequired:true,canonicalStorageMutation:false,providerWriteRequired:false,listPermissionRequired:false,billingRequired:false
};

function clone(value){return JSON.parse(JSON.stringify(value));}
function rejects(code,fn){assert.throws(fn,error=>error&&error.code===code);}

assert.equal(Terminal.feature,"ssjr-shared-terminal-close");
assert.equal(Terminal.runtimeRevision,"1.9.1-r18");
assert.equal(Terminal.providerWriteRequired,true);
assert.equal(Terminal.canonicalStorageMutation,false);
assert.equal(Terminal.listPermissionRequired,false);
assert.equal(Terminal.billingRequired,false);
assert.equal(Terminal.createsAdditionalSeason,false);
assert.equal(Terminal.terminalReadAllowed,true);

const intent=Terminal.prepare(finalProjection);
assert.equal(intent.phase,"TERMINAL_CLOSE_READY");
assert.equal(intent.rivalryId,rivalryId);
assert.equal(intent.rivalryConnectionState,"closed");
assert.equal(intent.sessionTargetState,"closed");
assert.equal(intent.terminal,true);
assert.equal(intent.finalSeasonReconciled,true);
assert.equal(intent.nextSeason,null);
assert.equal(intent.extraSeasonAllowed,false);
assert.deepEqual(intent.managerTotals,{playerOne:11,playerTwo:9});
assert.equal(Object.isFrozen(intent),true);
assert.equal(Terminal.sameWitness(intent,clone(intent)),true);
assert.equal(Terminal.witnessKey(intent),Terminal.witnessKey(clone(intent)));

const altered=clone(intent);altered.managerTotals.playerOne=12;
assert.equal(Terminal.sameWitness(intent,altered),false);
rejects("TERMINAL_CLOSE_WINNER_MISMATCH",()=>Terminal.verifyIntent(altered));
const extra=clone(intent);extra.extraSeasonAllowed=true;
rejects("TERMINAL_CLOSE_FINAL_AUTHORITY_INVALID",()=>Terminal.verifyIntent(extra));
const write=clone(intent);write.canonicalStorageMutation=true;
rejects("TERMINAL_CLOSE_SAFETY_INVALID",()=>Terminal.verifyIntent(write));
const wrongState=clone(intent);wrongState.rivalryConnectionState="active";
rejects("TERMINAL_CLOSE_STATE_INVALID",()=>Terminal.verifyIntent(wrongState));
const incomplete=clone(finalProjection);incomplete.acceptedSeasons=2;
rejects("TERMINAL_CLOSE_FINAL_RECONCILIATION_REQUIRED",()=>Terminal.prepare(incomplete));

const accepted=Terminal.closeResult(intent,{ok:true,rivalryId,rivalryState:"closed",sessionState:"closed",rivalryRevision:4,sessionRevision:7,replayed:false});
assert.equal(accepted.phase,"TERMINAL_CLOSED");
assert.equal(accepted.rivalryRevision,4);
assert.equal(accepted.sessionRevision,7);
assert.equal(accepted.replayed,false);
assert.equal(accepted.nextSeason,null);
assert.equal(accepted.extraSeasonAllowed,false);
const replayed=Terminal.closeResult(intent,{ok:true,rivalryId,rivalryState:"closed",sessionState:"closed",rivalryRevision:4,sessionRevision:7,replayed:true});
assert.equal(replayed.replayed,true);
rejects("TERMINAL_CLOSE_PROVIDER_RESULT_INVALID",()=>Terminal.closeResult(intent,{ok:true,rivalryId,rivalryState:"active",sessionState:"closed",rivalryRevision:4,sessionRevision:7}));

console.log("PASS Terminal Close protocol: exact r17 Final Reconciliation authority produces one deterministic r18 close witness, preserves scoring/final-season authority, forbids extra seasons and canonical local mutation, and validates accepted/replayed terminal outcomes.");
