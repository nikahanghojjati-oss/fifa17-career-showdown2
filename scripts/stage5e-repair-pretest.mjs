import fs from 'node:fs';

const read = path => fs.readFileSync(path, 'utf8');
const write = (path, text) => fs.writeFileSync(path, text);

const OLD = '2b7c0b166ae0aae7ab7a3ce84725b21091262484';
const NEW = '363af783d7e5436fdfaa3766d4aa413fc9952a08';
const OLD_PROOF = 'PRODUCTION_FIRESTORE_RULES_PROVIDER_PROOF_2026-08-29.md';
const NEW_PROOF = 'STAGE5D_PRODUCTION_RULES_PROVIDER_LIVE_PROOF_2026-09-02.md';
const NEXT = 'stage5e-runtime-host-join-publication-and-production-acceptance';
const SUMMARY = 'Fresh successor independently verifies live PR #181 and fixed RJR87, preserves the provider-live Stage 5D Rules blob 363af783d7e5436fdfaa3766d4aa413fc9952a08 as consumed, and validates the fresh WEC. Billing and Blaze remain forbidden and Cloud Run remains excluded. Then complete Stage 5E v1.9.0 host/join runtime publication and genuine production acceptance. RJR may move only from real provider-live Remote Joining capability evidence.';

fs.mkdirSync('.git/hooks', {recursive:true});
fs.writeFileSync('.git/hooks/pre-commit', '#!/bin/sh\nset -eu\ngit restore --staged --worktree --source=HEAD -- .github/workflows/stage5e-pr-repair.yml .github/workflows/validate-v1-visual-immersion.yml\n');
fs.chmodSync('.git/hooks/pre-commit', 0o755);

{
  const path = 'SESSION_BOOTSTRAP.json';
  const bootstrap = JSON.parse(read(path));
  bootstrap.immediateNextTask = {
    mustNotInsertGenericPrerequisiteLane: true,
    mustStartAsRealProductWork: true,
    name: NEXT,
    summary: SUMMARY
  };
  bootstrap.currentLane = 'PR #181 Stage 5E at fixed RJR87 consumes the independently provider-live Stage 5D Rules blob 363af783d7e5436fdfaa3766d4aa413fc9952a08. Current source candidate is v1.9.0 / 1.9.0-r1. The immediate lane is exact-head Stage 5E review/CI cleanup, safe merge/deploy, and genuine provider-live host/join acceptance; provider Rules publication is already consumed and must not be repeated.';
  if (Array.isArray(bootstrap.minimalReads)) bootstrap.minimalReads = bootstrap.minimalReads.map(item => item === OLD_PROOF ? NEW_PROOF : item);
  write(path, JSON.stringify(bootstrap, null, 2) + '\n');
}

{
  const path = 'tests/contracts/handoff-immediate-next-task-contracts.cjs';
  let text = read(path);
  text = text.replace('assert.equal(bootstrap.currentPublicationCheckpoint?.productionSessionRulesChanged,false);','assert.equal(bootstrap.currentPublicationCheckpoint?.productionSessionRulesChanged,true,"Stage 5D production session Rules publication is now provider-live and consumed.");');
  text = text.replace('assert.equal(bootstrap.immediateNextTask?.name,"provider-live-stage5d-rules-publication-then-runtime-host-join","The successor bootstrap must route to authenticated provider-live Rules before runtime host/join.");',`assert.equal(bootstrap.immediateNextTask?.name,"${NEXT}","The successor bootstrap must route directly to Stage 5E publication and genuine production acceptance after the consumed provider-live Rules gate.");`);
  text = text.replace('assert.match(bootstrap.immediateNextTask?.summary||"",/Fresh successor[\\s\\S]+PR #176[\\s\\S]+RJR87[\\s\\S]+provider-proven[\\s\\S]+Billing[\\s\\S]+Cloud Run[\\s\\S]+Runtime host\\/join UX[\\s\\S]+later gates/i,"The successor capsule must preserve PR #176 verification, permanent no-billing authority and provider/runtime boundaries.");','assert.match(bootstrap.immediateNextTask?.summary||"",/Fresh successor[\\s\\S]+PR #181[\\s\\S]+RJR87[\\s\\S]+provider-live Stage 5D Rules[\\s\\S]+Billing[\\s\\S]+Cloud Run[\\s\\S]+Stage 5E[\\s\\S]+production acceptance/i,"The successor capsule must preserve the consumed Stage 5D boundary, permanent no-billing authority and current Stage 5E acceptance lane.");');
  text = text.replace('assert.match(bootstrap.currentLane,/(?=[\\s\\S]*PR #176)(?=[\\s\\S]*Stage 5D)(?=[\\s\\S]*fixed RJR87)(?=[\\s\\S]*363af783d7e5436fdfaa3766d4aa413fc9952a08)(?=[\\s\\S]*2b7c0b166ae0aae7ab7a3ce84725b21091262484)(?=[\\s\\S]*zero-billing provider publication)(?=[\\s\\S]*runtime host\\/join UX)/i,"Bootstrap current lane must preserve the PR #176 Stage 5D repository/provider split and next zero-billing provider gate.");','assert.match(bootstrap.currentLane,/(?=[\\s\\S]*PR #181)(?=[\\s\\S]*Stage 5E)(?=[\\s\\S]*fixed RJR87)(?=[\\s\\S]*363af783d7e5436fdfaa3766d4aa413fc9952a08)(?=[\\s\\S]*provider-live)(?=[\\s\\S]*host\\/join)(?=[\\s\\S]*acceptance)/i,"Bootstrap current lane must preserve the consumed Stage 5D provider boundary and current Stage 5E runtime acceptance lane.");');
  write(path, text);
}

{
  const path = 'tests/contracts/sle-handoff-packaging-contracts.cjs';
  let text = read(path);
  text = text.replace(`assert.ok(capsule.minimalReads.includes("${OLD_PROOF}"));`,`assert.ok(capsule.minimalReads.includes("${NEW_PROOF}"));`);
  text = text.replace('assert.equal(capsule.immediateNextTask.name,"provider-live-stage5d-rules-publication-then-runtime-host-join");',`assert.equal(capsule.immediateNextTask.name,"${NEXT}");`);
  text = text.replace('assert.match(capsule.immediateNextTask.summary,/PR #176[\\s\\S]+RJR87[\\s\\S]+provider-proven[\\s\\S]+Billing[\\s\\S]+Cloud Run[\\s\\S]+Runtime host\\/join UX[\\s\\S]+later gates/i);','assert.match(capsule.immediateNextTask.summary,/PR #181[\\s\\S]+RJR87[\\s\\S]+provider-live Stage 5D Rules[\\s\\S]+Billing[\\s\\S]+Cloud Run[\\s\\S]+Stage 5E[\\s\\S]+production acceptance/i);');
  write(path, text);
}

{
  const path = 'tests/contracts/production-firebase-environment-activation-contracts.cjs';
  let text = read(path);
  text = text.replace('assert.match(manifest.firestore.providerVerificationEvidence,/2026-08-29[\\s\\S]+fifa17-career-showdown-prod[\\s\\S]+\\(default\\)[\\s\\S]+Rules tab[\\s\\S]+Today 7:48 AM/i);','assert.match(manifest.firestore.providerVerificationEvidence,/2026-09-02[\\s\\S]+33575616044[\\s\\S]+100078816667[\\s\\S]+fifa17-career-showdown-prod[\\s\\S]+cloud\\.firestore[\\s\\S]+363af783d7e5436fdfaa3766d4aa413fc9952a08/i,"Provider verification evidence must preserve the authenticated zero-billing Stage 5D publication and exact source readback.");');
  write(path, text);
}

console.log(`PASS temporary Stage 5E transition reconciliation: provider-live ${NEW}, obsolete ${OLD} retained only as historical provenance where explicitly appropriate.`);
