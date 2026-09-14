from pathlib import Path

p=Path('tests/firebase/persistent-nik-daniel-pair-provider-emulator.cjs')
s=p.read_text()
old="""  assert.equal((await getDoc(doc(dbF,'rivalries',atomicCreate))).exists(),false,'provider Rules must reject creator pairing without the durable current-pair witness');
  assert.equal((await getDoc(doc(dbF,'rivalries',atomicCreate,'invites',atomicCreate))).exists(),false,'witness-less creator failure must not mint a usable invite');"""
new="""  await testEnv.withSecurityRulesDisabled(async context=>{
    const adminDb=context.firestore();
    assert.equal((await getDoc(doc(adminDb,'rivalries',atomicCreate))).exists(),false,'provider Rules must reject creator pairing without the durable current-pair witness');
    assert.equal((await getDoc(doc(adminDb,'rivalries',atomicCreate,'invites',atomicCreate))).exists(),false,'witness-less creator failure must not mint a usable invite');
  });"""
if s.count(old)!=1: raise SystemExit(f'fresh creator rollback observation anchor drifted: {s.count(old)}')
s=s.replace(old,new,1)
old="""  assert.equal((await getDoc(doc(dbA,'rivalries',staleCreate))).exists(),false,'stale creator tab must not create a second rivalry while current pair is active');
  assert.equal((await getDoc(doc(dbA,'rivalries',staleCreate,'invites',staleCreate))).exists(),false,'stale creator rejection must not leave a shareable one-use invite');"""
new="""  await testEnv.withSecurityRulesDisabled(async context=>{
    const adminDb=context.firestore();
    assert.equal((await getDoc(doc(adminDb,'rivalries',staleCreate))).exists(),false,'stale creator tab must not create a second rivalry while current pair is active');
    assert.equal((await getDoc(doc(adminDb,'rivalries',staleCreate,'invites',staleCreate))).exists(),false,'stale creator rejection must not leave a shareable one-use invite');
  });"""
if s.count(old)!=1: raise SystemExit(f'stale creator rollback observation anchor drifted: {s.count(old)}')
s=s.replace(old,new,1)
old="""  assert.equal((await getDoc(doc(dbE,'rivalries',atomicRecovery,'invites',atomicRecovery))).data().data.state,'redeemed');"""
new="""  await testEnv.withSecurityRulesDisabled(async context=>{
    assert.equal((await getDoc(doc(context.firestore(),'rivalries',atomicRecovery,'invites',atomicRecovery))).data().data.state,'redeemed','successful redemption must consume the one-use invite atomically');
  });"""
if s.count(old)!=1: raise SystemExit(f'redeemed invite observation anchor drifted: {s.count(old)}')
p.write_text(s.replace(old,new,1))
print('PR260 emulator rollback/consumption observations use rules-disabled proof reads where product Rules intentionally deny inspection')
