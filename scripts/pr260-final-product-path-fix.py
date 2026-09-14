from pathlib import Path

pair_path=Path('js/persistentNikDanielPair.js')
pair=pair_path.read_text()
old='''  async function pairEnsurePreparedBinding(context,role){let binding=pairPreparedBindingForRole(context.pairing,role);if(binding)return binding;const entry=await pairLoadSharedJourneyEntry();if(!entry||typeof entry.preparePairingShell!=="function")throw pairErrorWithCode("PERSISTENT_PAIR_SHARED_SHELL_UNAVAILABLE","Showdown preparation is unavailable.");entry.install?.();const prepared=await entry.preparePairingShell();if(prepared!==true)throw pairErrorWithCode("PERSISTENT_PAIR_SHARED_SHELL_REQUIRED","The Showdown could not be prepared.");entry.closePanel?.();root.showScreen?.("mainMenu",false);binding=pairPreparedBindingForRole(context.pairing,role);if(!binding)throw pairErrorWithCode("PERSISTENT_PAIR_SHARED_SHELL_REQUIRED","Prepare the active Showdown on this device before connecting the players.");return binding;}'''
new='''  async function pairEnsurePreparedBinding(context,role){const binding=pairPreparedBindingForRole(context.pairing,role);if(binding)return binding;root.showScreen?.("createShowdown");throw pairErrorWithCode("PERSISTENT_PAIR_SEASON_SELECTION_REQUIRED","Choose 1, 3, 5, or 10 seasons and press START A SHOWDOWN before connecting players.");}'''
if pair.count(old)!=1: raise SystemExit(f'pairEnsurePreparedBinding anchor drifted: {pair.count(old)}')
pair=pair.replace(old,new,1)
old='''}catch(error){return pairSetState({status:error?.code?.includes("SHARED_SHELL")?"save-required":"error",busy:false,message:error?.message||"The Showdown could not be started."});}}'''
new='''}catch(error){return pairSetState({status:error?.code==="PERSISTENT_PAIR_PENDING_CONFLICT"?"waiting":error?.code?.includes("SHARED_SHELL")||error?.code==="PERSISTENT_PAIR_SEASON_SELECTION_REQUIRED"?"save-required":"error",busy:false,message:error?.message||"The Showdown could not be started."});}}'''
if pair.count(old)!=1: raise SystemExit(f'pairStartPairing catch anchor drifted: {pair.count(old)}')
pair=pair.replace(old,new,1)
old='''const code=pairCreateElement("code","",state.capability),copy=pairCreateElement("button","menuButton","COPY CODE"),refresh=pairCreateElement("button","menuButton","CHECK STATUS");code.style.wordBreak="break-all";copy.type=refresh.type="button";copy.addEventListener("click",async()=>{const ok=await pairCopyText(state.capability);pairSetState({message:ok?"Code copied. Send it to the other player.":"Select the full code shown here and copy it manually."});});refresh.addEventListener("click",()=>void pairInitialize({force:true}));actions.append(code,copy,refresh);'''
new='''const code=pairCreateElement("code","",state.capability),copy=pairCreateElement("button","menuButton","COPY CODE"),refresh=pairCreateElement("button","menuButton","CHECK STATUS"),replace=pairCreateElement("button","menuButton","NEW CODE");code.style.wordBreak="break-all";copy.type=refresh.type=replace.type="button";copy.addEventListener("click",async()=>{const ok=await pairCopyText(state.capability);pairSetState({message:ok?"Code copied. Send it to the other player.":"Select the full code shown here and copy it manually."});});refresh.addEventListener("click",()=>void pairInitialize({force:true}));replace.addEventListener("click",()=>void pairStartPairing({managerRole:state.managerRole}));actions.append(code,copy,refresh,replace);'''
if pair.count(old)!=1: raise SystemExit(f'pending render anchor drifted: {pair.count(old)}')
pair_path.write_text(pair.replace(old,new,1))

show_path=Path('js/showdown.js')
show=show_path.read_text()
old='''function normalizeShowdown(showdown){if(!showdown)return null;const m=showdown.managers;if(m&&String(m.playerOne).trim().toLowerCase()==="nik"&&String(m.playerTwo).trim().toLowerCase()==="daniel"){const e=Error("Retired manager mapping.");e.code="SHOWDOWN_REVERSED_MANAGER_ROLES_UNSUPPORTED";throw e;}'''
new='''function normalizeShowdown(showdown){if(!showdown)return null;const m=showdown.managers;if(m&&(m.playerOne!=="Daniel"||m.playerTwo!=="Nik")){const e=Error("Retired manager mapping.");e.code="SHOWDOWN_MANAGER_MAPPING_UNSUPPORTED";throw e;}'''
if show.count(old)!=1: raise SystemExit(f'normalize mapping anchor drifted: {show.count(old)}')
show_path.write_text(show.replace(old,new,1))

contract_path=Path('tests/contracts/persistent-nik-daniel-pair-contracts.cjs')
t=contract_path.read_text()
anchor='''assert.match(pairSource,/pairCopyText\\(state\\.capability\\)/);'''
replacement='''assert.match(pairSource,/pairCopyText\\(state\\.capability\\)/);\nassert.match(pairSource,/state\\.connectionState==="pending-pair"&&state\\.capability[\\s\\S]*"NEW CODE"[\\s\\S]*pairStartPairing\\(\\{managerRole:state\\.managerRole\\}\\)/,'A pending creator must always have a provider-guarded replacement action so an expired invite cannot strand the account.');'''
if t.count(anchor)!=1: raise SystemExit(f'pending contract anchor drifted: {t.count(anchor)}')
t=t.replace(anchor,replacement,1)
anchor='''assert.match(entrySource,/preparePairingShell:startShared/,'Single Start a Showdown action must continue to use the established paired-first shell authority.');'''
replacement='''assert.match(entrySource,/preparePairingShell:startShared/,'Single Start a Showdown action must continue to use the established paired-first shell authority.');\nconst ensurePrepared=pairSource.slice(pairSource.indexOf('async function pairEnsurePreparedBinding'),pairSource.indexOf('async function pairAttachRecoveryPointer'));\nassert.match(ensurePrepared,/showScreen\\?\\.\\("createShowdown"\\)/,'Home pairing controls must route an unprepared player to explicit season selection.');\nassert.match(ensurePrepared,/PERSISTENT_PAIR_SEASON_SELECTION_REQUIRED/);\nassert.doesNotMatch(ensurePrepared,/preparePairingShell\\(/,'Pair controls must never auto-create a default one-season shell.');'''
if t.count(anchor)!=1: raise SystemExit(f'season contract anchor drifted: {t.count(anchor)}')
t=t.replace(anchor,replacement,1)
old='''assert.throws(()=>showdownSandbox.normalizeShowdown({managers:{playerOne:'Nik',playerTwo:'Daniel'}}),error=>error&&error.code==='SHOWDOWN_REVERSED_MANAGER_ROLES_UNSUPPORTED','Reversed historical manager roles must fail closed instead of being silently relabelled.');'''
new='''assert.throws(()=>showdownSandbox.normalizeShowdown({managers:{playerOne:'Nik',playerTwo:'Daniel'}}),error=>error&&error.code==='SHOWDOWN_MANAGER_MAPPING_UNSUPPORTED','Reversed historical manager roles must fail closed instead of being silently relabelled.');\nassert.throws(()=>showdownSandbox.normalizeShowdown({managers:{playerOne:'Alex',playerTwo:'Sam'}}),error=>error&&error.code==='SHOWDOWN_MANAGER_MAPPING_UNSUPPORTED','Every noncanonical historical manager mapping must fail closed instead of being attributed to Daniel and Nik.');\nassert.doesNotThrow(()=>showdownSandbox.normalizeShowdown({managers:{playerOne:'Daniel',playerTwo:'Nik'}}));'''
if t.count(old)!=1: raise SystemExit(f'historical mapping contract anchor drifted: {t.count(old)}')
contract_path.write_text(t.replace(old,new,1))

print('PR260 final product-path fixes applied')
