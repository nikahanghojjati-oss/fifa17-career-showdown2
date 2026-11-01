"use strict";
// Audit R84 F01/F02/F03 (r85): static contract for the shared write authority and its raw-SDK denial matrix.
// F01 (writes only, decided): every shared write requires the ACTING account to be active. Reads stay membership-only.
// F02: Season Commit create and acknowledge require the Session/device/account authority (they checked ID format only).
// F03: a raw-SDK denial matrix on the composed generated Rules runs in the Gate and in Validate Gameplay Fast.
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");

const root=path.resolve(__dirname,"../..");
const read=file=>fs.readFileSync(path.join(root,file),"utf8");
let n=0;
const ok=text=>{n+=1;process.stdout.write(`ok ${n} ${text}\n`);};
function functionBody(source,name){
  const start=source.indexOf(`    function ${name}(`);
  assert.ok(start>=0,`function ${name} must exist`);
  const end=source.indexOf("\n    }\n",start);
  assert.ok(end>start,`function ${name} must close`);
  return source.slice(start,end);
}

const setup=read("firestore.shared-setup-production.fragment.rules");
const career=read("firestore.career-start-production.fragment.rules");
const transfer=read("firestore.transfer-challenge-production.fragment.rules");
const results=read("firestore.season-results-production.fragment.rules");
const commit=read("firestore.season-commit-production.fragment.rules");

// A1: the actor authority looks up the acting account and the acting device and checks the Session binding.
{
  const actor=functionBody(setup,"ssjrActorWriteAuthorityValid");
  for(const needle of [
    "let actorAccount = get(/databases/$(database)/documents/accounts/$(actor));",
    "let device = get(/databases/$(database)/documents/accounts/$(actor)/devices/$(deviceId));",
    "let session = get(/databases/$(database)/documents/rivalries/$(rivalryId)/sessions/$(sessionId));",
    "&& actor in rivalry.authorizedAccountIds",
    "&& actorAccount.data.data.status == 'active'",
    "&& device.data.objectId == deviceId",
    "&& device.data.data.state == 'active'",
    "&& sessionData.rivalryId == rivalryId",
    "&& sessionData.state == 'active'",
    "&& rivalry.authorizedAccountIds[0] in sessionData.memberAccountIds",
    "&& rivalry.authorizedAccountIds[1] in sessionData.memberAccountIds",
    "&& sessionData.expiresAt is timestamp;"
  ])assert.ok(actor.includes(needle),`ssjrActorWriteAuthorityValid must keep: ${needle}`);
  assert.doesNotMatch(actor,/sessionData\.expiresAt\s*>/,"an ACTIVE Session past its old expiresAt must stay usable (ten-season continuity)");
  assert.equal((actor.match(/get\(/g)||[]).length,4,"the actor authority looks up exactly four documents: rivalry, acting account, acting device, Session");
  const write=functionBody(setup,"ssjrWriteAuthorityValid");
  assert.match(write,/return ssjrActorWriteAuthorityValid\(rivalryId, deviceId, sessionId\)\n/,"ssjrWriteAuthorityValid must include the actor authority");
  ok("A1 the shared actor write authority looks up the acting account, the acting device and the Session (four documents) and keeps ACTIVE-past-expiry continuity");
}
// A2: every shared write validator reaches the authority.
{
  const writers=[
    [setup,"ssjrValidLedgerBase","ssjrWriteAuthorityValid(rivalryId, root.updatedByDeviceId, root.activeSessionId)"],
    [career,"ssjrCareerWriteValid","ssjrWriteAuthorityValid(rivalryId, root.updatedByDeviceId, root.activeSessionId)"],
    [career,"ssjrCareerValidUpdate","ssjrWriteAuthorityValid(rivalryId, after.updatedByDeviceId, after.activeSessionId)"],
    [transfer,"ssjrTransferPublicShape","ssjrWriteAuthorityValid(rivalryId, root.updatedByDeviceId, root.activeSessionId)"],
    [transfer,"ssjrTransferValidLedgerUpdate","ssjrWriteAuthorityValid(rivalryId, after.updatedByDeviceId, after.activeSessionId)"],
    [transfer,"ssjrTransferPrivateBase","ssjrWriteAuthorityValid(rivalryId, root.updatedByDeviceId, root.activeSessionId)"],
    [transfer,"ssjrTransferPrivateUpdateValid","ssjrWriteAuthorityValid(rivalryId, after.updatedByDeviceId, after.activeSessionId)"],
    [results,"ssjrResultsPublicShape","ssjrWriteAuthorityValid(rivalryId, root.updatedByDeviceId, root.activeSessionId)"],
    [results,"ssjrResultsValidUpdate","ssjrWriteAuthorityValid(rivalryId, after.updatedByDeviceId, after.activeSessionId)"],
    [commit,"ssjrCommitValidCreate","ssjrActorWriteAuthorityValid(rivalryId, after.updatedByDeviceId, after.activeSessionId)"],
    [commit,"ssjrCommitValidUpdate","ssjrActorWriteAuthorityValid(rivalryId, after.updatedByDeviceId, after.activeSessionId)"]
  ];
  for(const [source,name,call] of writers)assert.ok(functionBody(source,name).includes(call),`${name} must call ${call}`);
  // R87 roulette marks (RT5-FLOW-02): every ledger update still goes through the ledger function above;
  // the only other transfer write is a member's own pre-window spun mark, which is membership-only by decision
  // (one lookup, the rivalry; it carries no game state and START from it runs the full ledger create).
  assert.match(functionBody(transfer,"ssjrTransferValidUpdate"),/return resource\.data\.phase != 'NOT_STARTED' && ssjrTransferValidLedgerUpdate\(rivalryId, transferId\);/,"every non-mark transfer update must run the ledger update with its authority");
  assert.match(functionBody(transfer,"ssjrTransferStartAfterSpins"),/ssjrTransferValidCreate\(rivalryId, transferId\)/,"START from the mark document must run the full ledger create (with its authority)");
  for(const name of ["ssjrTransferSpinCreate","ssjrTransferSpinUpdate"]){
    const body=functionBody(transfer,name);
    assert.equal(/get\(/.test(body),false,`${name} must not add a lookup beyond the rivalry`);
    assert.ok(body.includes("ssjrEntitled(rivalryId)")&&body.includes("ssjrActorRole(rivalryId)"),`${name} must be a member writing his own role`);
  }
  assert.match(functionBody(setup,"ssjrLeagueProjectionCreateValid"),/return activeActor\(\)\n/,"the league projection create must require the acting account to be active");
  // The role-private Season Results create is valid only together with its public document in the same batch
  // (getAfter + publishedAt == request.time), and that public write carries the authority above.
  const privateCreate=functionBody(results,"ssjrResultsPrivateCreateValid");
  assert.match(privateCreate,/getAfter\(\/databases\/\$\(database\)\/documents\/rivalries\/\$\(rivalryId\)\/seasonResults\/\$\(seasonId\)\)/);
  assert.ok(privateCreate.includes("&& public.updatedAt == request.time"),"role-private result must be written with its public document");
  assert.equal(/function ssjrCommitShape\(/.test(commit),false,"no never-called Season Commit helper may remain");
  ok(`A2 all ${writers.length} shared write validators reach the actor authority; the league projection checks the acting account; no dead Season Commit helper`);
}
// A3: reads stay membership-only by decision (audit R84 F01 triage: a lookup per listener read would cost hundreds of reads a season).
{
  const entitled=functionBody(setup,"ssjrEntitled");
  assert.equal(/accounts\//.test(entitled),false,"ssjrEntitled must not look up an account");
  for(const [source,label] of [[setup,"Shared Setup"],[career,"Career Start"],[transfer,"Transfer Challenge"],[results,"Season Results"],[commit,"Season Commit"]]){
    assert.ok(source.includes("allow get: if ssjrEntitled(rivalryId);"),`${label} reads stay on ssjrEntitled`);
  }
  ok("A3 reads stay membership-only (ssjrEntitled, one rivalry lookup) by decision");
}
// A4: the raw-SDK denial matrix exists, asserts unchanged bytes, and runs in both CI lanes.
{
  const file="tests/firebase/season-commit-raw-authority-denial-emulator.cjs";
  const matrix=read(file);
  for(const id of ["P1","P2","D1","D2","D3","D4","D5","D6","D7","D8","D9","D10","D11","R1","C1","C2","C3","C4"])assert.ok(matrix.includes(`"${id}"`),`matrix case ${id}`);
  for(const kind of ["revoked-device","unregistered-device","deletion-pending-actor","nonexistent-session","revoked-session","foreign-rivalry-session","wrong-member-session","stranger"])assert.ok(matrix.includes(`kind:"${kind}"`),`matrix kind ${kind}`);
  assert.match(matrix,/permission-denied/);
  assert.match(matrix,/canonical\(after\),canonical\(before\)/,"each denial must compare stored bytes before and after");
  assert.match(matrix,/shared-season-commit-concurrent-acknowledge-emulator\.cjs/,"the matrix reuses the concurrent-acknowledge fixture");
  assert.match(read("tests/firebase/shared-season-commit-concurrent-acknowledge-emulator.cjs"),/readFileSync\("firestore\.spark\.generated\.rules","utf8"\)/,"the fixture loads the composed generated Rules");
  for(const workflow of [".github/workflows/showdown-gate.yml",".github/workflows/validate-gameplay-fast.yml"]){
    const line=read(workflow).split("\n").find(text=>text.includes(file)&&text.includes("emulators:exec"));
    assert.ok(line,`${workflow} must run ${file}`);
  }
  assert.ok(read("tests/firebase/composed-production-rules-regression.cjs").includes(`"${file}"`),"the composed regression labels the matrix");
  ok("A4 the raw-SDK denial matrix (18 cases, unchanged-bytes assertions) runs in the Gate L3A lane, Validate Gameplay Fast and the composed regression");
}
process.stdout.write(`PASS shared write authority contracts: ${n} numbered checks (audit R84 F01 writes, F02 Season Commit authority, F03 raw denial matrix wiring)\n`);
