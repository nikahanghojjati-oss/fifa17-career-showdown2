from pathlib import Path

p=Path('firestore.persistent-pair-production.fragment.rules')
s=p.read_text()
old='''    function cmsPersistentPairCreationWitnessValid(rivalryId) {
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
new='''    function cmsPersistentPairCreationWitnessValid(rivalryId) {
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
if s.count(old)!=1:
    raise SystemExit(f'creator witness complexity anchor drifted: {s.count(old)}')
p.write_text(s.replace(old,new,1))
print('PR260 creator witness uses bounded cross-document proof; pairLink rule retains membership/device validation')
