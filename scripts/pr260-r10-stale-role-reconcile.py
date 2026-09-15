from pathlib import Path


def replace_once(text, old, new, label):
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected exactly one match, found {count}")
    return text.replace(old, new, 1)

pair_path = Path("js/persistentNikDanielPair.js")
pair = pair_path.read_text()
old_init = 'const localManagerId=pairCurrentIdentityManagerId();if(localManagerId&&localManagerId!==link.managerId)throw pairErrorWithCode("PERSISTENT_PAIR_IDENTITY_MISMATCH","This browser has conflicting player data. Forget this device and start again.");'
new_init = 'let localManagerId=pairCurrentIdentityManagerId();if(localManagerId!==link.managerId&&typeof options.reconcileIdentity==="function"){await options.reconcileIdentity(link.managerId,link.managerRole);localManagerId=pairCurrentIdentityManagerId();}if(localManagerId&&localManagerId!==link.managerId)throw pairErrorWithCode("PERSISTENT_PAIR_IDENTITY_MISMATCH","This browser has conflicting player data. Forget this device and start again.");'
pair = replace_once(pair, old_init, new_init, "pair initialize reconciliation gate")
pair_path.write_text(pair)

identity_path = Path("js/onlinePlayerIdentity.js")
identity = identity_path.read_text()
start = identity.index("async function syncPersistentPairSidecar(){")
end = identity.index("async function resolveOnlineDependencies(){", start)
new_sidecar = '''async function syncPersistentPairSidecar(){if(persistentPairSyncPromise)return persistentPairSyncPromise;if(!state.registered||!state.accountId||typeof root.loadRuntimeScript!=="function")return null;const accountId=state.accountId;persistentPairSyncPromise=(async()=>{await loadOnlineDependency("persistent-pair","js/persistentNikDanielPair.js",()=>root.CareerModePersistentNikDanielPair);const pair=root.CareerModePersistentNikDanielPair,pairState=await pair.initialize({force:true,reconcileIdentity:async id=>{if(id===state.managerId||state.accountId!==accountId)return;const selected=resolveOnlineManager(id);if(!selected)return;await writeOnlineRole(accountId,selected.id);gateOpen=false;setOnlineIdentityState({status:"ready",busy:false,managerId:selected.id,managerLabel:selected.label,message:`Welcome back, ${selected.label}.`});}});pair.render?.();return pairState;})().catch(error=>{root.console?.warn?.("[Career Mode Showdown] Remembered pair is temporarily unavailable; player identity remains available.",error);return null;}).finally(()=>{persistentPairSyncPromise=null;});return persistentPairSyncPromise;}\n'''
identity = identity[:start] + new_sidecar + identity[end:]
identity_path.write_text(identity)

contract_path = Path("tests/contracts/persistent-nik-daniel-pair-contracts.cjs")
contract = contract_path.read_text()
anchor = "assert.match(initializeFunction,/if\\(active\\)await pairEnsureSaveLibraryAuthority\\(\\);[\\s\\S]*pairHasExactLocalRecoveryCopy/,'Active-pair reload classification must activate local authority before checking the provider-linked Save/Profile copy.');\n"
addition = anchor + "assert.match(initializeFunction,/localManagerId!==link\\.managerId&&typeof options\\.reconcileIdentity===\"function\"[\\s\\S]*await options\\.reconcileIdentity\\(link\\.managerId,link\\.managerRole\\)[\\s\\S]*localManagerId=pairCurrentIdentityManagerId\\(\\)[\\s\\S]*if\\(localManagerId&&localManagerId!==link\\.managerId\\)/,'Validated durable pair identity must get one bounded chance to reconcile stale browser role state before the existing mismatch guard rejects it.');\n"
contract = replace_once(contract, anchor, addition, "pair contract reconciliation assertion")
anchor2 = "assert.match(identitySource,/pair\\.initialize\\(\\{force:true\\}\\)/);\nassert.match(identitySource,/pairState\\.managerId!==state\\.managerId/);\nassert.match(identitySource,/writeOnlineRole\\(accountId,selected\\.id\\)/,'A valid canonical account pair may seed the same named player on another registered browser.');\n"
replacement2 = "const sidecarFunction=identitySource.slice(identitySource.indexOf('async function syncPersistentPairSidecar'),identitySource.indexOf('async function resolveOnlineDependencies'));\nassert.match(sidecarFunction,/pair\\.initialize\\(\\{force:true,reconcileIdentity:async id=>/,'The sidecar must ask pair authority to reconcile stale local role state during initialization, not after a mismatch rejection.');\nassert.match(sidecarFunction,/writeOnlineRole\\(accountId,selected\\.id\\)[\\s\\S]*setOnlineIdentityState\\(\\{status:\"ready\"/,'Provider-authoritative reconciliation must update both IndexedDB and live identity state before normal pair validation resumes.');\nassert.doesNotMatch(sidecarFunction,/pairState\\?\\.managerId!==state\\.managerId/,'Stale-role repair must not wait until after pair initialization has already applied the mismatch guard.');\n"
contract = replace_once(contract, anchor2, replacement2, "identity sidecar ordering assertions")
contract_path.write_text(contract)

routing_path = Path("tests/browser/persistent-pair-user-facing-routing-audit.cjs")
routing = routing_path.read_text()
marker = "    // A remembered ACTIVE pair on a normal browser reload must activate lazy Save Library authority before classifying local recovery.\n"
behavior = '''    // A stale opposite role on another registered browser must be repaired from validated durable pair authority before mismatch rejection.\n    const staleRoleRepair=await page.evaluate(async()=>{\n      window.__pairProviderMode="active-recovery";window.__localRecoveryReady=true;\n      const originalIdentity=window.CareerModeOnlinePlayerIdentity;let managerId="daniel";\n      window.CareerModeOnlinePlayerIdentity={getState:()=>({status:"ready",accountId:"account_user_route_fixture",managerId,managerLabel:managerId==="nik"?"Nik":"Daniel",deviceId:"device_user_route_fixture",registered:true})};\n      try{\n        const next=await window.CareerModePersistentNikDanielPair.initialize({force:true,reconcileIdentity:async authoritativeManagerId=>{managerId=authoritativeManagerId;}});\n        return{status:next.status,localManagerId:managerId,pairManagerId:next.managerId,role:next.managerRole};\n      }finally{window.CareerModeOnlinePlayerIdentity=originalIdentity;}\n    });\n    assert.deepEqual(staleRoleRepair,{status:"paired",localManagerId:"nik",pairManagerId:"nik",role:"playerTwo"},"A stale Daniel role on Nik's registered browser must reconcile from durable pair authority before the mismatch guard runs.");\n\n'''
routing = replace_once(routing, marker, behavior + marker, "routing stale-role regression")
routing_path.write_text(routing)

print("Applied PR260 R10 stale-role reconciliation patch.")
