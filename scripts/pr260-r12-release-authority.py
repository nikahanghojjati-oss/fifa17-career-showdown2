from pathlib import Path

OLD = "1.9.1-r20"
NEW = "1.9.1-r21"
PREVIOUS_OLD = "1.9.1-r19"


def replace_once(text, old, new, label):
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected exactly one match, found {count}")
    return text.replace(old, new, 1)

# Whole-shell identity: r21 is the shipped shell, r20 is retained recovery.
index_path = Path("index.html")
index = index_path.read_text()
if OLD not in index:
    raise SystemExit("index.html: expected active r20 asset revision")
index_path.write_text(index.replace(OLD, NEW))

manifest_path = Path("manifest.webmanifest")
manifest = manifest_path.read_text()
if OLD not in manifest:
    raise SystemExit("manifest.webmanifest: expected active r20 asset revision")
manifest_path.write_text(manifest.replace(OLD, NEW))

worker_path = Path("service-worker.js")
worker = worker_path.read_text()
worker = replace_once(worker, f'const RUNTIME_REVISION = "{OLD}";', f'const RUNTIME_REVISION = "{NEW}";', "service worker current revision")
worker = replace_once(worker, f'const PREVIOUS_RUNTIME_REVISION = "{PREVIOUS_OLD}";', f'const PREVIOUS_RUNTIME_REVISION = "{OLD}";', "service worker previous revision")
worker_path.write_text(worker)

# Panel Continue must reactivate Save Library authority after cross-tab invalidation.
pair_path = Path("js/persistentNikDanielPair.js")
pair = pair_path.read_text()
old_continue = 'const context=await pairResolveContext(),role=pairNormalizeManagerRole(state.managerRole||pairSelectedRole());pairRequireCurrentIdentity(role);const binding=await pairExactLocalBindingForProviderSlot(context.pairing,role,state.providerSaveId,state.providerProfileId);'
new_continue = 'const context=await pairResolveContext(),role=pairNormalizeManagerRole(state.managerRole||pairSelectedRole());pairRequireCurrentIdentity(role);await pairEnsureSaveLibraryAuthority();const binding=await pairExactLocalBindingForProviderSlot(context.pairing,role,state.providerSaveId,state.providerProfileId);'
pair = replace_once(pair, old_continue, new_continue, "panel Continue authority reactivation")
pair_path.write_text(pair)

# Permanent contract: panel Continue cannot inspect recovery against invalidated authority.
contract_path = Path("tests/contracts/persistent-nik-daniel-pair-contracts.cjs")
contract = contract_path.read_text()
anchor = "assert.doesNotMatch(exactBindingFunction,/activeSaveId!==saveId[\\s\\S]*switchActiveSave/,'Hydration must not be skipped merely because the provider-linked Save is already the active Save Library selection.');\n"
addition = "const continuePairFunction=pairSource.slice(pairSource.indexOf('async function pairContinueOnlineShowdown'),pairSource.indexOf('async function pairOpenRecoverySurface'));\nassert.match(continuePairFunction,/await pairEnsureSaveLibraryAuthority\\(\\);[\\s\\S]*pairExactLocalBindingForProviderSlot/,'The persistent-pair panel Continue path must reactivate Save Library authority before deciding whether verified local recovery exists.');\n"
if contract.count(anchor) != 1:
    raise SystemExit(f"persistent-pair contract anchor: expected one match, found {contract.count(anchor)}")
contract_path.write_text(contract.replace(anchor, anchor + addition, 1))

# Permanent versioning contract: recovery target must be the immediate prior whole shell.
shell_contract_path = Path("tests/contracts/release-shell-coherence-contracts.cjs")
shell_contract = shell_contract_path.read_text()
shell_anchor = 'assert.ok(previous&&previous!==runtime,"A promoted shell must preserve a distinct previous known-good recovery runtime.");\n'
shell_addition = 'assert.equal(previous,`${version}-r${generation-1}`,"A promoted shell must retain the immediate previous whole-shell revision as its recovery target.");\n'
if shell_contract.count(shell_anchor) != 1:
    raise SystemExit(f"release-shell contract anchor: expected one match, found {shell_contract.count(shell_anchor)}")
shell_contract_path.write_text(shell_contract.replace(shell_anchor, shell_anchor + shell_addition, 1))

# Browser regression: keep ACTIVE pair state, invalidate storage authority, then use panel Continue.
browser_path = Path("tests/browser/persistent-pair-user-facing-routing-audit.cjs")
browser = browser_path.read_text()
browser_anchor = '    assert.equal(await page.locator("#persistentNikDanielPairPanel",{hasText:"CAREER RECOVERY NEEDED"}).count(),0,"A valid local paired reload must not show false recovery UI.");\n\n'
browser_addition = '''    // If another tab invalidates Save Library after ACTIVE pair state is already rendered, the panel Continue action must reactivate authority before checking recovery.\n    const panelAuthorityReactivation=await page.evaluate(async({saveId,profileId,playerOneProfileId})=>{\n      window.__pairProviderMode="active-recovery";window.__localRecoveryReady=true;\n      const originalLoader=window.loadRuntimeScript,originalSaveRuntime=window.CareerModeSaveLibraryRuntime,originalEnsure=window.ensureSaveLibraryRuntimeAuthority,originalCurrentShowdown=currentShowdown;\n      let ready=true,activationCount=0,switchCount=0;\n      const prepared=()=>({name:"Daniel vs Nik",managers:{playerOne:"Daniel",playerTwo:"Nik"},totalRounds:5,currentRound:1,status:"Created",selectedLeague:null,clubs:{playerOne:null,playerTwo:null},score:{playerOne:0,playerTwo:0},transferChallenges:[],rounds:[],sharedJourney:{contractVersion:1,mode:"shared",setupPending:false},identity:{saveId,managerProfileIds:{playerOne:playerOneProfileId,playerTwo:profileId}}});\n      window.CareerModeSaveLibraryRuntime={isReady:()=>ready,getLibrarySnapshot:()=>ready?{activeSaveId:saveId,saves:[{saveId,showdown:prepared()}]}:null,switchActiveSave:async requested=>{if(requested!==saveId)throw new Error("Unexpected invalidated-authority hydration target.");switchCount+=1;currentShowdown=prepared();return currentShowdown;}};\n      window.ensureSaveLibraryRuntimeAuthority=async()=>{activationCount+=1;ready=true;return true;};\n      window.loadRuntimeScript=async(key,path,check)=>key==="save-library-cutover"?true:originalLoader(key,path,check);\n      try{\n        const initialized=await window.CareerModePersistentNikDanielPair.initialize({force:true});\n        if(initialized.status!=="paired")throw new Error(`Expected paired state before invalidation, got ${initialized.status}`);\n        ready=false;currentShowdown=null;\n        const before=window.__continueOpened;\n        const continued=await window.CareerModePersistentNikDanielPair.continuePair();\n        return{continuedStatus:continued.status,activationCount,switchCount,continueOpened:window.__continueOpened-before,hydratedSaveId:currentShowdown?.identity?.saveId||null};\n      }finally{\n        currentShowdown=originalCurrentShowdown;window.loadRuntimeScript=originalLoader;window.CareerModeSaveLibraryRuntime=originalSaveRuntime;\n        if(originalEnsure===undefined)delete window.ensureSaveLibraryRuntimeAuthority;else window.ensureSaveLibraryRuntimeAuthority=originalEnsure;\n      }\n    },{saveId,profileId,playerOneProfileId});\n    assert.deepEqual(panelAuthorityReactivation,{continuedStatus:"paired",activationCount:1,switchCount:1,continueOpened:1,hydratedSaveId:saveId},"Panel Continue must reactivate invalidated Save Library authority and hydrate the exact provider-linked Save instead of showing false recovery.");\n    await page.locator("#persistentNikDanielPairPanel",{hasText:"CAREER READY"}).waitFor({state:"visible",timeout:5000});\n    assert.equal(await page.locator("#persistentNikDanielPairPanel",{hasText:"CAREER RECOVERY NEEDED"}).count(),0,"Storage invalidation alone must not replace a still-valid ACTIVE pair with recovery UI.");\n\n'''
if browser.count(browser_anchor) != 1:
    raise SystemExit(f"routing audit anchor: expected one match, found {browser.count(browser_anchor)}")
browser_path.write_text(browser.replace(browser_anchor, browser_anchor + browser_addition, 1))

release = f'''# Career Mode Showdown v1.9.1 — Runtime r21\n\nStatus: RELEASE CANDIDATE\n\nApplication version: `v1.9.1`\n\nRuntime asset revision: `{NEW}`\n\nPrevious known-good runtime: `{OLD}`\n\nRuntime `{NEW}` is the whole-shell release candidate for the canonical Daniel/Nik persistent Showdown product. It advances the installable shell identity because the shipped shell, pairing runtime, player identity routing, recovery behavior and Firestore Rules integration changed after r20; r20 remains the immediate known-good whole-shell recovery target.\n\nr21 keeps Daniel permanently Player One and Nik permanently Player Two, preserves provider-atomic private pair authority, requires explicit 1/3/5/10 season selection before pairing, and keeps exact provider Save/Profile recovery fail-closed. Canonical Continue and the persistent-pair panel both reactivate the established Save Library authority before deciding local recovery, so transient provider reads, cross-tab storage invalidation and cold reloads do not create false recovery or stale-role lockout.\n\nThe installed service worker uses a distinct r21 cache namespace and retains r20 as the preferred recovery runtime. A failed r21 population therefore cannot delete the r20 known-good shell merely because both releases shared one cache identity.\n\nRemote Joining and Shared Journey terminology remain engineering provenance only; the player-facing product remains the single Start a Showdown / Continue Career experience. There is no public discovery or list authority expansion.\n\nFirebase remains Spark-only with Billing permanently OFF. App Check enforcement remains OFF. No Cloud Run, Cloud Functions, Blaze/payment dependency or paid infrastructure is introduced.\n\nr21 does not by itself earn physical-journey acceptance credit. Production Pages and Rules deployment/readback must pass on the merged exact main head before genuine two-device testing is requested.\n'''
release_path = Path("RELEASE_V1.9.1_R21.md")
if release_path.exists():
    raise SystemExit("RELEASE_V1.9.1_R21.md already exists unexpectedly")
release_path.write_text(release)
