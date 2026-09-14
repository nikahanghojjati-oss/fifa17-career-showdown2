from pathlib import Path


def replace_once(path, old, new):
    p=Path(path)
    text=p.read_text()
    count=text.count(old)
    if count != 1:
        raise SystemExit(f"{path}: expected exactly one match, got {count}: {old[:100]!r}")
    p.write_text(text.replace(old,new,1))

replace_once(
    'tests/contracts/persistent-nik-daniel-pair-contracts.cjs',
    "assert.match(rulesFragment,/cmsPersistentPairRivalryMembership/);",
    "assert.match(rulesFragment,/cmsPersistentPairRivalryMembership/);\nassert.match(rulesFragment,/cmsPersistentPairRedemptionWitnessValid/,'Provider Rules must bind every rivalry redemption to the account current-pair witness.');\nassert.match(injector,/cmsPersistentPairRedemptionWitnessValid\\(rivalryId, inviteBefore\\.data\\.slotId\\)/,'Production Rules injection must make the pair witness mandatory for validRivalryRedeem.');"
)
replace_once(
    'tests/contracts/persistent-nik-daniel-pair-contracts.cjs',
    "assert.match(generated,/allow get: if signedIn\\(\\) && request\\.auth\\.uid == accountId && pairId == 'current'/);",
    "assert.match(generated,/allow get: if signedIn\\(\\) && request\\.auth\\.uid == accountId && pairId == 'current'/);\nassert.match(generated,/cmsPersistentPairRedemptionWitnessValid\\(rivalryId, inviteBefore\\.data\\.slotId\\)/,'Generated production Rules must reject redemption without the exact account current-pair witness.');"
)
replace_once(
    'tests/firebase/persistent-nik-daniel-pair-provider-emulator.cjs',
    "async function atomicRedeemWithPairLink(db,{uid,device,target,managerId,char,nowMs}){",
    "async function atomicRedeemWithPairLink(db,{uid,device,target,managerId,char,nowMs,writePairLink=true}){"
)
replace_once(
    'tests/firebase/persistent-nik-daniel-pair-provider-emulator.cjs',
    "transaction.set(pairRef,pairNext);transaction.set(rivalryRef,rivalryNext);transaction.set(inviteRef,inviteNext);return target;",
    "if(writePairLink)transaction.set(pairRef,pairNext);transaction.set(rivalryRef,rivalryNext);transaction.set(inviteRef,inviteNext);return target;"
)
replace_once(
    'tests/firebase/persistent-nik-daniel-pair-provider-emulator.cjs',
    "  await assertSucceeds(atomicRedeemWithPairLink(dbE,{uid:'acct_e',device:ids.e,target:atomicRecovery,managerId:'nik',char:'e',nowMs}));",
    "  await assertFails(atomicRedeemWithPairLink(dbE,{uid:'acct_e',device:ids.e,target:atomicRecovery,managerId:'nik',char:'e',nowMs,writePairLink:false}));\n  assert.equal((await getDoc(doc(dbE,'rivalries',atomicRecovery))).data().data.connectionState,'pending-pair','provider Rules must reject redemption that omits the durable pair witness');\n  assert.equal((await getDoc(doc(dbE,'rivalries',atomicRecovery,'invites',atomicRecovery))).data().data.state,'open','witness-less redemption must leave the one-use invite unconsumed');\n  await assertSucceeds(atomicRedeemWithPairLink(dbE,{uid:'acct_e',device:ids.e,target:atomicRecovery,managerId:'nik',char:'e',nowMs}));"
)
replace_once(
    'tests/firebase/persistent-nik-daniel-pair-provider-emulator.cjs',
    'expired-pending replacement safety, atomic post-redeem recovery witness, and stale-tab double-active rollback are enforced.\\n',
    'expired-pending replacement safety, mandatory atomic post-redeem recovery witness, witness-less redemption denial, and stale-tab double-active rollback are enforced.\\n'
)

print('PR260 provider witness proof patch applied.')