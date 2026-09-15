from pathlib import Path

identity_path = Path("js/onlinePlayerIdentity.js")
identity = identity_path.read_text()
old = '''async function openCanonicalCareerContinue(){if(canonicalContinuePromise)return canonicalContinuePromise;canonicalContinuePromise=(async()=>{await loadOnlineDependency("persistent-pair","js/persistentNikDanielPair.js",()=>root.CareerModePersistentNikDanielPair);const pair=root.CareerModePersistentNikDanielPair,next=await pair.initialize({force:true});if(next?.connectionState==="active"&&next.rivalryId)return pair.continuePair();pair.render?.();return next;})().catch(error=>{root.reportApplicationError?.("Unable to continue the career",error);return null;}).finally(()=>{canonicalContinuePromise=null;});return canonicalContinuePromise;}'''
new = '''async function openCanonicalCareerContinue(){if(canonicalContinuePromise)return canonicalContinuePromise;canonicalContinuePromise=(async()=>{await loadOnlineDependency("persistent-pair","js/persistentNikDanielPair.js",()=>root.CareerModePersistentNikDanielPair);const pair=root.CareerModePersistentNikDanielPair,first=await syncPersistentPairSidecar(),next=!first||first.status==="unavailable"?await syncPersistentPairSidecar():first;if(next?.connectionState==="active"&&next.rivalryId)return pair.continuePair();pair.render?.();return next;})().catch(error=>{root.reportApplicationError?.("Unable to continue the career",error);return null;}).finally(()=>{canonicalContinuePromise=null;});return canonicalContinuePromise;}'''
if identity.count(old) != 1:
    raise SystemExit(f"continue path: expected one exact match, found {identity.count(old)}")
identity_path.write_text(identity.replace(old, new, 1))

contract_path = Path("tests/contracts/persistent-nik-daniel-pair-contracts.cjs")
contract = contract_path.read_text()
anchor = '''assert.doesNotMatch(sidecarFunction,/pairState\\?\\.managerId!==state\\.managerId/,'Stale-role repair must not wait until after pair initialization has already applied the mismatch guard.');\n'''
addition = '''const canonicalContinueFunction=identitySource.slice(identitySource.indexOf('async function openCanonicalCareerContinue'),identitySource.indexOf('function subscribeOnlineIdentity'));\nassert.match(canonicalContinueFunction,/first=await syncPersistentPairSidecar\\(\\),next=!first\\|\\|first\\.status==="unavailable"\\?await syncPersistentPairSidecar\\(\\):first/,'Continue must await the same stale-role-reconciling sidecar and retry it once after a transient unavailable result.');\nassert.doesNotMatch(canonicalContinueFunction,/pair\\.initialize\\(/,'Canonical Continue must not bypass stale-role reconciliation with a callback-free pair initialization.');\n'''
if contract.count(anchor) != 1:
    raise SystemExit(f"contract anchor: expected one exact match, found {contract.count(anchor)}")
contract_path.write_text(contract.replace(anchor, anchor + addition, 1))
