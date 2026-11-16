"use strict";

// R93-08 Rules budget sweep (follow-up of hunt T2-1). Static half: the sweep is wired into the Gate, its baseline holds the
// agreed bar, and what each behaviour-neutral slim relies on is still true in the composed production Rules.
//   S1 the Gate's L5 lane runs the sweep on the composed Rules and the seal requires it
//   S2 the baseline is well formed: every kind at most 850 of 1,000 unless it is listed as knownOver with a reason
//   S3 the sweep plays the real flows (journey over 10 seasons, worst locks, Prime Pack, Sacked, EL, Chamber Men, Squad
//      Management, pairing, Terminal Close, career index) and measures only the shipped composed Rules
//   S4 JOIN (redeem) slim: same checks, the stored open slot compared with the one map validOpenSlot accepts
//   S5 Transfer War START slim: the exact START values are still pinned and nothing else opens a window
//   S6 the honest text replaces "session expired" when a refused write is refused again

const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const {spawnSync}=require("node:child_process");

const ROOT=path.resolve(__dirname,"../..");
const read=file=>fs.readFileSync(path.join(ROOT,file),"utf8");
const checks=[];
const check=(id,label,fn)=>{fn();checks.push(id);process.stdout.write(`ok ${checks.length} ${id} ${label}\n`);};

check("S1","the Gate's L5 lane runs the Rules budget sweep and the seal requires it",()=>{
  const gate=read(".github/workflows/showdown-gate.yml");
  const lane=gate.slice(gate.indexOf("  l5-rules-regression:"),gate.indexOf("  l6-browser-journey:"));
  assert.match(lane,/id: budget_sweep\n\s+if: steps\.route\.outputs\.l5_run == 'true'\n\s+run: npx --yes firebase-tools@15\.28\.1 emulators:exec --only firestore --project demo-cms-rules-budget-sweep "node tests\/firebase\/rules-budget-sweep-emulator\.cjs"/);
  assert.ok(lane.indexOf("id: budget_sweep")>lane.indexOf("id: regression")&&lane.indexOf("id: budget_sweep")<lane.indexOf("name: Record lane result"),"the sweep runs after the regression and before the lane record");
  const minutes=Number((lane.match(/timeout-minutes: (\d+)/)||[])[1]);
  assert.ok(minutes>=60,"L5 has time for the regression and the sweep");
  const script=read("scripts/showdown-gate.mjs");
  assert.match(script,/L5:\{job:'l5-rules-regression',name:'L5 rules regression',groups:\[\],fixed:\['COMPOSED_RULES_REGRESSION','RULES_BUDGET_SWEEP'\],steps:\{regression:\['COMPOSED_RULES_REGRESSION'\],budget_sweep:\['RULES_BUDGET_SWEEP'\]\}\}/);
});

check("S2","the baseline holds the bar: at most 850 of 1,000 per kind unless knownOver with a reason",()=>{
  const baseline=JSON.parse(read("tests/fixtures/rules-budget/baseline.json"));
  assert.equal(baseline.schemaVersion,1);
  const kinds=Object.entries(baseline.kinds);
  assert.ok(kinds.length>=40,`the baseline covers the play writes (${kinds.length} kinds)`);
  for(const [kind,entry] of kinds){
    assert.ok(Number.isInteger(entry.used)&&entry.used>0&&entry.used<=1000,`${kind}: used is a measured count`);
    if(entry.used>850)assert.ok(typeof entry.knownOver==="string"&&entry.knownOver.length>20,`${kind}: ~${entry.used} is over 850 with no knownOver reason`);
  }
  for(const needed of ["[state:redeemed]","{start-window}","{lock-guesses}","{lock-signings}","seasonCommits/season_N [COMMITTED]","seasonResults/season_N [COLLECTING]","primePackRounds/season_N","chamberMenRounds/season_N","squadSheets/*","sessions/* [state:active]"])
    assert.ok(kinds.some(([kind])=>kind.includes(needed)),`the baseline measures ${needed}`);
});

check("S3","the sweep plays the real flows and measures only the shipped composed Rules",()=>{
  const sweep=read("tests/firebase/rules-budget-sweep-emulator.cjs");
  for(const suite of ["two-manager-journey-emulator.cjs\",env:{CMS_SHOWDOWN_LENGTH:\"10\"}","transfer-lock-budget-emulator.cjs","prime-pack-ten-season-emulator.cjs","sacked-rules-emulator.cjs","europa-league-rules-emulator.cjs","chamber-men-rules-emulator.cjs","squad-sheets-rules-emulator.cjs","persistent-nik-daniel-pair-provider-emulator.cjs","shared-terminal-close-production-provider-emulator.cjs","career-index-emulator.cjs","r94-club-draw-rules-emulator.cjs"])
    assert.ok(sweep.includes(suite),`the sweep plays ${suite}`);
  assert.match(sweep,/const HARD_LIMIT=850,CLOSE=700;/);
  for(const rule of ["refused by the 1,000-expression limit","under 15% headroom","worse than its baseline","in the baseline but no flow made it any more","replay(s) refused outside the expression limit"])
    assert.ok(sweep.includes(rule),`the sweep fails on: ${rule}`);
  const recorder=read("tests/support/rules-budget-recorder.cjs");
  assert.match(recorder,/const SHIPPED=fs\.readFileSync\(path\.join\(ROOT,"firestore\.spark\.generated\.rules"\),"utf8"\);/);
  assert.match(recorder,/const composed=rules===SHIPPED;/);
  assert.match(recorder,/identity\.composed&&!identity\.admin/);
});

// Composed production Rules, built fresh.
for(const script of ["scripts/build-production-firestore-rules.mjs","scripts/build-production-firestore-rules-with-persistent-pair.mjs"]){
  const built=spawnSync(process.execPath,[script],{cwd:ROOT,encoding:"utf8"});
  assert.equal(built.status,0,`${script} failed: ${built.stderr||built.stdout}`);
}
const rules=read("firestore.spark.generated.rules");
const blockOf=(header,next)=>{const start=rules.indexOf(header);assert.ok(start>=0,`missing ${header}`);const end=rules.indexOf(next,start+header.length);return rules.slice(start,end<0?undefined:end);};

check("S4","JOIN slim: the stored open slot is compared with the one map validOpenSlot accepts; every other check stays",()=>{
  const open=id=>`{"slotId": "${id}", "accountId": null, "profileId": null, "saveId": null, "displayLabel": null, "entitlementState": "open", "deletionConsent": false}`;
  const slots=rules.slice(rules.indexOf("function validRedeemedManagerSlots("),rules.indexOf("function validRivalryRedeem("));
  assert.ok(slots.includes("let joinerId = request.auth.uid;"),"the joined slot is checked against the signed-in account");
  assert.ok(slots.includes(`joinSlotId == "playerTwo"
                  && validCreatorSlot(beforeSlots[0], "playerOne", creatorId)
                  && beforeSlots[1] == ${open("playerTwo")}
                  && beforeSlots[0] == afterSlots[0]
                  && validCreatorSlot(afterSlots[1], "playerTwo", joinerId)`),"JOIN as playerTwo keeps every check");
  assert.ok(slots.includes(`joinSlotId == "playerOne"
                  && beforeSlots[0] == ${open("playerOne")}
                  && validCreatorSlot(beforeSlots[1], "playerTwo", creatorId)
                  && validCreatorSlot(afterSlots[0], "playerOne", joinerId)
                  && beforeSlots[1] == afterSlots[1]`),"JOIN as playerOne keeps every check");
  // The literal is exactly what validOpenSlot accepts: it reads all seven keys (a missing key refuses), allows no other
  // key, and allows exactly one value for each.
  const base=rules.slice(rules.indexOf("function validSlotBase(slot, slotId) {"),rules.indexOf("function validCreatorSlot("));
  assert.match(base,/slot is map\s+&& slot\.keys\(\)\.hasOnly\(\[\s+"slotId",\s+"accountId",\s+"profileId",\s+"saveId",\s+"displayLabel",\s+"entitlementState",\s+"deletionConsent"\s+\]\)\s+&& slot\.slotId == slotId\s+&& \(slot\.displayLabel == null \|\| \(slot\.displayLabel is string && slot\.displayLabel\.size\(\) <= 80\)\)\s+&& slot\.deletionConsent == false;/);
  assert.match(rules,/function validOpenSlot\(slot, slotId\) \{\s+return validSlotBase\(slot, slotId\)\s+&& slot\.accountId == null\s+&& slot\.profileId == null\s+&& slot\.saveId == null\s+&& slot\.displayLabel == null\s+&& slot\.entitlementState == "open";\s+\}/);
  // The rest of JOIN is unchanged.
  const redeem=rules.slice(rules.indexOf("function validRivalryRedeem("),rules.indexOf("function validInitialManagerSlots("));
  for(const pin of ["activeDevice(after.updatedByDeviceId)","validCasEnvelope(before, after, \"rivalry\", rivalryId)","validRivalryData(after.data)","cmsPersistentPairRedemptionWitnessValid(inviteBefore.data.slotId)",
    "before.data.connectionState == \"pending-pair\"","after.data.connectionState == \"active\"","inviteBefore.data.state == \"open\"","inviteBefore.data.expiresAt > request.time",
    "validRedeemedManagerSlots(before.data.managerSlots, after.data.managerSlots, before.data.createdByAccountId, inviteBefore.data.slotId)",
    "inviteAfter.data.state == \"redeemed\"","inviteAfter.data.slotId == inviteBefore.data.slotId"])
    assert.ok(redeem.includes(pin),`JOIN keeps ${pin}`);
  // The redeem branch now comes before the Terminal Close branch and starts with the stored state it needs.
  assert.match(rules,/allow update: if \(request\.resource\.data\.data\.connectionState == 'closed'\s+&& !\('terminalClose' in request\.resource\.data\.data\)\s+&& cmsPersistentPairAbandonValid\(\)\)\s+\|\| \(resource\.data\.data\.connectionState == 'pending-pair'\s+&& !\('terminalProgress' in request\.resource\.data\.data\)\s+&& validRivalryRedeem\(\)\)\s+\|\| ssjrTerminalValidRivalryUpdate\(\);/);
});

check("S5","Transfer War START slim: the exact START values are still pinned",()=>{
  const fragment=read("firestore.transfer-challenge-production.fragment.rules");
  for(const pin of ["root.revision == 1","root.startedAt == request.time","root.endedAt == null","root.endRequestedRoles == []","root.guessLockedRoles == []","root.signingLockedRoles == []","after.phase == 'WINDOW_OPEN'"])
    assert.ok(fragment.includes(pin),`START keeps ${pin}`);
  assert.equal(/function ssjrTransferRoleListValid\(/.test(fragment),false,"the role-list helper START no longer needs is gone");
});

check("S6","a write refused again after its retry shows the honest text, not \"session expired\"",()=>{
  const client=read("js/productionSharedTransferChallenge.js");
  assert.ok(client.includes('const PSTC_REFUSED_TEXT="This step was refused twice, so nothing was saved. Tap REFRESH, check what you entered and try again."'));
  assert.match(client,/if\(attempt>0&&\/permission\/i\.test\(String\(error&&error\.code\|\|""\)\)\)throw pstcRepeatedRefusal\(error\);/);
});

process.stdout.write(`PASS R93-08 Rules budget sweep contracts (${checks.length} checks)\n`);
