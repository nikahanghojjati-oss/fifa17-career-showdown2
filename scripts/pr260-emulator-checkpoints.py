from pathlib import Path

p=Path('tests/firebase/persistent-nik-daniel-pair-provider-emulator.cjs')
s=p.read_text()
anchors=[
("  await assertFails(atomicCreateWithPairLink(dbF", "  console.log('CHECKPOINT creator-witnessless');\n  await assertFails(atomicCreateWithPairLink(dbF"),
("  await assertSucceeds(atomicCreateWithPairLink(dbF", "  console.log('CHECKPOINT creator-success');\n  await assertSucceeds(atomicCreateWithPairLink(dbF"),
("  await assertFails(atomicCreateWithPairLink(dbA", "  console.log('CHECKPOINT creator-stale-active');\n  await assertFails(atomicCreateWithPairLink(dbA"),
("  await assertFails(atomicRedeemWithPairLink(dbE", "  console.log('CHECKPOINT redeem-witnessless');\n  await assertFails(atomicRedeemWithPairLink(dbE"),
("  await assertSucceeds(atomicRedeemWithPairLink(dbE", "  console.log('CHECKPOINT redeem-success');\n  await assertSucceeds(atomicRedeemWithPairLink(dbE"),
("  await assertFails(atomicRedeemWithPairLink(dbC", "  console.log('CHECKPOINT redeem-stale-active');\n  await assertFails(atomicRedeemWithPairLink(dbC"),
]
for old,new in anchors:
    n=s.count(old)
    if n!=1: raise SystemExit(f'checkpoint anchor drifted {old}: {n}')
    s=s.replace(old,new,1)
p.write_text(s)
print('PR260 emulator checkpoints inserted')
