from pathlib import Path
p=Path('tests/operations/pos20-control-plane.test.mjs')
s=p.read_text()
anchor="const journeyConflictsProductionContract='tests/contracts/shared-journey-conflicts-production-contracts.cjs';\n"
addition=anchor+"const localReconciliationContract='tests/contracts/shared-local-reconciliation-contracts.cjs';\nconst localReconciliationProductionContract='tests/contracts/shared-local-reconciliation-production-contracts.cjs';\n"
if s.count(anchor)!=1:
    raise SystemExit('r16 POS20 constants anchor mismatch')
s=s.replace(anchor,addition,1)
old="journeyReconnectContract,journeyReconnectProductionContract,journeyConflictsContract,journeyConflictsProductionContract];"
new="journeyReconnectContract,journeyReconnectProductionContract,journeyConflictsContract,journeyConflictsProductionContract,localReconciliationContract,localReconciliationProductionContract];"
if s.count(old)!=1:
    raise SystemExit('r16 POS20 expected list anchor mismatch')
s=s.replace(old,new,1)
p.write_text(s)
