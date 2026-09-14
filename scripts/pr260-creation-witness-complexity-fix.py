from pathlib import Path

p=Path('firestore.persistent-pair-production.fragment.rules')
s=p.read_text()
old_creation='''    function cmsPersistentPairCreationWitnessValid(rivalryId) {
      let pair = getAfter(/databases/$(database)/documents/accounts/$(request.auth.uid)/pairLinks/current);
      let pairData = pair.data.data;
      return pair.data.objectType == 'pairLink'
        && pair.data.objectId == 'current'
        && pair.data.lifecycleState == 'live'
        && pair.data.updatedByAccountId == request.auth.uid
        && activeDevice(pair.data.updatedByDeviceId)
        && pairData.rivalryId == rivalryId
        && cmsPersistentPairManagerValid(pairData.managerRole, pairData.managerId)
        && cmsPersistentPairRivalryMembership(request.auth.uid, rivalryId, pairData.managerRole);
    }
'''
new_creation='''    function cmsPersistentPairCreationWitnessValid(rivalryId) {
      let pair = getAfter(/databases/$(database)/documents/accounts/$(request.auth.uid)/pairLinks/current);
      let pairData = pair.data.data;
      return pair.data.objectType == 'pairLink'
        && pair.data.objectId == 'current'
        && pair.data.lifecycleState == 'live'
        && pair.data.updatedByAccountId == request.auth.uid
        && pairData.rivalryId == rivalryId
        && cmsPersistentPairManagerValid(pairData.managerRole, pairData.managerId);
    }
'''
if s.count(old_creation)!=1:
    raise SystemExit(f'creator witness complexity anchor drifted: {s.count(old_creation)}')
s=s.replace(old_creation,new_creation,1)
old_redeem='''    function cmsPersistentPairRedemptionWitnessValid(rivalryId, role) {
      let pair = getAfter(/databases/$(database)/documents/accounts/$(request.auth.uid)/pairLinks/current);
      let pairData = pair.data.data;
      return pair.data.objectType == 'pairLink'
        && pair.data.objectId == 'current'
        && pair.data.lifecycleState == 'live'
        && pair.data.updatedByAccountId == request.auth.uid
        && activeDevice(pair.data.updatedByDeviceId)
        && pairData.rivalryId == rivalryId
        && pairData.managerRole == role
        && cmsPersistentPairManagerValid(role, pairData.managerId);
    }
'''
new_redeem='''    function cmsPersistentPairRedemptionWitnessValid(rivalryId, role) {
      let pairData = getAfter(/databases/$(database)/documents/accounts/$(request.auth.uid)/pairLinks/current).data.data;
      return pairData.rivalryId == rivalryId
        && pairData.managerRole == role
        && cmsPersistentPairManagerValid(role, pairData.managerId);
    }
'''
if s.count(old_redeem)!=1:
    raise SystemExit(f'redemption witness complexity anchor drifted: {s.count(old_redeem)}')
s=s.replace(old_redeem,new_redeem,1)
p.write_text(s)
print('PR260 creator/redemption witnesses use bounded cross-document proof; pairLink rule retains device, envelope, membership, and replacement validation')
