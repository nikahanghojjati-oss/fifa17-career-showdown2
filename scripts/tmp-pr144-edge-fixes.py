from pathlib import Path

rivalry = Path('js/sparkConnectedRivalry.js')
text = rivalry.read_text()
old = '''          if(!copied){
            try{
              code.focus();
              code.select();
              code.setSelectionRange(0,code.value.length);
              copied=Boolean(root.document&&typeof root.document.execCommand==="function"&&root.document.execCommand("copy"));
            }catch(_error){}
          }
          if(copied){
            copyRivalryId.textContent="COPIED";
            root.setTimeout(()=>{if(copyRivalryId&&copyRivalryId.isConnected)copyRivalryId.textContent="COPY RIVALRY ID";},1600);
          }else{
            code.focus();
            code.select();
            try{code.setSelectionRange(0,code.value.length);}catch(_error){}
            copyRivalryId.textContent="SELECTED — USE COPY";
          }
'''
new = '''          if(!copied){
            let fallbackCopy=null;
            try{
              if(root.document&&root.document.body){
                fallbackCopy=root.document.createElement("textarea");
                fallbackCopy.value=rivalryId;
                fallbackCopy.readOnly=true;
                fallbackCopy.setAttribute("aria-hidden","true");
                fallbackCopy.style.position="fixed";
                fallbackCopy.style.left="-9999px";
                fallbackCopy.style.top="0";
                fallbackCopy.style.opacity="0";
                root.document.body.appendChild(fallbackCopy);
                fallbackCopy.focus();
                fallbackCopy.select();
                fallbackCopy.setSelectionRange(0,rivalryId.length);
                copied=Boolean(typeof root.document.execCommand==="function"&&root.document.execCommand("copy"));
              }
            }catch(_error){}
            finally{
              if(fallbackCopy&&fallbackCopy.parentNode)fallbackCopy.parentNode.removeChild(fallbackCopy);
            }
          }
          if(copied){
            copyRivalryId.textContent="COPIED";
            root.setTimeout(()=>{if(copyRivalryId&&copyRivalryId.isConnected)copyRivalryId.textContent="COPY RIVALRY ID";},1600);
          }else{
            try{
              const selection=typeof root.getSelection==="function"?root.getSelection():null;
              if(selection&&root.document&&typeof root.document.createRange==="function"){
                const range=root.document.createRange();
                range.selectNodeContents(rivalryIdText);
                selection.removeAllRanges();
                selection.addRange(range);
              }
            }catch(_error){}
            copyRivalryId.textContent="FULL ID SELECTED — USE COPY";
          }
'''
if text.count(old) != 1:
    raise SystemExit('Expected one editable-field copy fallback block')
rivalry.write_text(text.replace(old,new))

sw = Path('service-worker.js')
text = sw.read_text()
marker = 'function cacheNameForRevision(revision){ return revision ? `${CACHE_PREFIX}${revision}` : ""; }\n'
helpers = marker + '''function revisionFromCacheName(cacheName){ return cacheName&&cacheName.startsWith(CACHE_PREFIX)?cacheName.slice(CACHE_PREFIX.length):""; }
function compareRuntimeRevisions(a,b){
    const parse=value=>{const match=/^(\\d+)\\.(\\d+)\\.(\\d+)-r(\\d+)$/.exec(value||"");return match?match.slice(1).map(Number):null;};
    const left=parse(a),right=parse(b); if(!left&&!right)return 0;if(!left)return-1;if(!right)return 1;
    for(let index=0;index<left.length;index+=1){if(left[index]!==right[index])return left[index]-right[index];}return 0;
}
async function verifyRetainedRuntime(revision){
    if(!revision)return {ok:false,available:false,cacheName:"",revision:"",expected:0,missing:[]};
    if(revision===RUNTIME_REVISION||revision===PREVIOUS_RUNTIME_REVISION)return verifyCache(revision);
    const cacheName=cacheNameForRevision(revision); if(!(await cacheExists(cacheName)))return {ok:false,available:false,cacheName,revision,expected:0,missing:["index.html"]};
    const cache=await caches.open(cacheName); const index=await cache.match(versionedShellUrl("index.html",revision));
    return {ok:Boolean(index&&index.ok),available:true,cacheName,revision,expected:null,missing:index&&index.ok?[]:["index.html"]};
}
async function findRecoveryRuntime(){
    const names=(await caches.keys()).filter(name=>name.startsWith(CACHE_PREFIX)&&name!==CACHE_NAME);
    const revisions=names.map(revisionFromCacheName).filter(Boolean).sort((a,b)=>compareRuntimeRevisions(b,a));
    if(PREVIOUS_RUNTIME_REVISION){
        const preferred=await verifyRetainedRuntime(PREVIOUS_RUNTIME_REVISION); if(preferred.ok)return preferred;
    }
    for(const revision of revisions){
        if(revision===PREVIOUS_RUNTIME_REVISION)continue;
        const candidate=await verifyRetainedRuntime(revision); if(candidate.ok)return candidate;
    }
    return {ok:false,available:false,cacheName:"",revision:"",expected:0,missing:[]};
}
'''
if text.count(marker) != 1:
    raise SystemExit('cacheNameForRevision marker mismatch')
text = text.replace(marker,helpers)
old_choose = '''async function chooseNavigationRuntime(){
    const forcedRevision=await readForcedRevision();
    if(forcedRevision){ const forcedStatus=await verifyCache(forcedRevision); if(forcedStatus.ok){return forcedStatus;} await clearForcedRevision(); }
    const currentStatus=await verifyCache(RUNTIME_REVISION); if(currentStatus.ok){return currentStatus;}
    if(PREVIOUS_RUNTIME_REVISION){ const previousStatus=await verifyCache(PREVIOUS_RUNTIME_REVISION); if(previousStatus.ok){return previousStatus;} }
    return null;
}
async function getStatusBundle(){ const current=await verifyCache(RUNTIME_REVISION); const previous=PREVIOUS_RUNTIME_REVISION?await verifyCache(PREVIOUS_RUNTIME_REVISION):{ok:false,available:false,cacheName:"",revision:"",expected:SHELL_PATHS.length,missing:SHELL_PATHS.slice()}; return{current,previous,forcedRevision:await readForcedRevision(),cacheNames:await caches.keys()}; }
'''
new_choose = '''async function chooseNavigationRuntime(){
    const forcedRevision=await readForcedRevision();
    if(forcedRevision){ const forcedStatus=await verifyRetainedRuntime(forcedRevision); if(forcedStatus.ok){return forcedStatus;} await clearForcedRevision(); }
    const currentStatus=await verifyCache(RUNTIME_REVISION); if(currentStatus.ok){return currentStatus;}
    const recovery=await findRecoveryRuntime(); if(recovery.ok)return recovery;
    return null;
}
async function getStatusBundle(){ const current=await verifyCache(RUNTIME_REVISION); const previous=PREVIOUS_RUNTIME_REVISION?await verifyCache(PREVIOUS_RUNTIME_REVISION):{ok:false,available:false,cacheName:"",revision:"",expected:SHELL_PATHS.length,missing:SHELL_PATHS.slice()}; const recovery=await findRecoveryRuntime(); return{current,previous,recovery,forcedRevision:await readForcedRevision(),cacheNames:await caches.keys()}; }
'''
if text.count(old_choose) != 1:
    raise SystemExit('chooseNavigationRuntime block mismatch')
text = text.replace(old_choose,new_choose)
old_rollback = '    if(type==="CMS_ROLLBACK_TO_PREVIOUS"){ event.waitUntil((async()=>{ try{ if(!PREVIOUS_RUNTIME_REVISION){throw new Error("No previous application shell is available for rollback.");} const previous=await verifyCache(PREVIOUS_RUNTIME_REVISION); if(!previous.ok){throw new Error(`Previous application shell is incomplete: ${previous.missing.join(", ")}`);} await writeForcedRevision(PREVIOUS_RUNTIME_REVISION); replyToClient(event,{type:"CMS_ROLLBACK_ACCEPTED",ok:true,revision:PREVIOUS_RUNTIME_REVISION}); }catch(error){ replyToClient(event,{type:"CMS_ROLLBACK_REJECTED",ok:false,error:error?.message||String(error)}); } })()); return; }\n'
new_rollback = '    if(type==="CMS_ROLLBACK_TO_PREVIOUS"){ event.waitUntil((async()=>{ try{ const recovery=await findRecoveryRuntime(); if(!recovery.ok){throw new Error("No verified previous application shell is available for rollback.");} await writeForcedRevision(recovery.revision); replyToClient(event,{type:"CMS_ROLLBACK_ACCEPTED",ok:true,revision:recovery.revision}); }catch(error){ replyToClient(event,{type:"CMS_ROLLBACK_REJECTED",ok:false,error:error?.message||String(error)}); } })()); return; }\n'
if text.count(old_rollback) != 1:
    raise SystemExit('rollback handler mismatch')
text = text.replace(old_rollback,new_rollback)
old_activate = 'self.addEventListener("activate",event=>{ event.waitUntil((async()=>{ const status=await verifyCache(RUNTIME_REVISION); if(!status.ok){throw new Error(`Refusing activation with incomplete application shell: ${status.missing.join(", ")}`);} await clearForcedRevision(); const keepShellCaches=new Set([CACHE_NAME,PREVIOUS_CACHE_NAME].filter(Boolean)); const cacheNames=await caches.keys(); await Promise.all(cacheNames.map(name=>{if(name.startsWith(CACHE_PREFIX)&&!keepShellCaches.has(name)){return caches.delete(name);}if(name.startsWith(MODE_CACHE_PREFIX)&&name!==MODE_CACHE_NAME){return caches.delete(name);}return Promise.resolve(false);})); await self.clients.claim(); })()); });\n'
new_activate = 'self.addEventListener("activate",event=>{ event.waitUntil((async()=>{ const status=await verifyCache(RUNTIME_REVISION); if(!status.ok){throw new Error(`Refusing activation with incomplete application shell: ${status.missing.join(", ")}`);} await clearForcedRevision(); const recovery=await findRecoveryRuntime(); const keepShellCaches=new Set([CACHE_NAME,recovery.ok?recovery.cacheName:""] .filter(Boolean)); const cacheNames=await caches.keys(); await Promise.all(cacheNames.map(name=>{if(name.startsWith(CACHE_PREFIX)&&!keepShellCaches.has(name)){return caches.delete(name);}if(name.startsWith(MODE_CACHE_PREFIX)&&name!==MODE_CACHE_NAME){return caches.delete(name);}return Promise.resolve(false);})); await self.clients.claim(); })()); });\n'
if text.count(old_activate) != 1:
    raise SystemExit('activate handler mismatch')
text = text.replace(old_activate,new_activate)
old_fetch = '''    const path=relativeScopePath(url); if(!path||!SHELL_PATH_SET.has(path)){return;} const requestedRevision=url.searchParams.get("v")||""; if(requestedRevision!==RUNTIME_REVISION&&requestedRevision!==PREVIOUS_RUNTIME_REVISION){return;}
    event.respondWith((async()=>{const cached=await cachedShellResponse(path,requestedRevision);return cached||Response.error();})());
'''
new_fetch = '''    const path=relativeScopePath(url); if(!path){return;} const requestedRevision=url.searchParams.get("v")||""; if(!requestedRevision){return;}
    event.respondWith((async()=>{const cached=await cachedShellResponse(path,requestedRevision);return cached||Response.error();})());
'''
if text.count(old_fetch) != 1:
    raise SystemExit('fetch handler mismatch')
sw.write_text(text.replace(old_fetch,new_fetch))

stage4 = Path('tests/contracts/stage4-connected-rivalry-contracts.cjs')
text = stage4.read_text()
old_assert = '  assert.match(source,/code\\.setSelectionRange\\(0,code\\.value\\.length\\)/,"Copy must retain a selectable fallback when clipboard APIs are unavailable.");\n'
new_assert = '''  assert.match(source,/fallbackCopy\\.value=rivalryId/,"Clipboard fallback must copy the immutable saved rivalry ID, never editable reattach text.");
  assert.match(source,/fallbackCopy\\.setSelectionRange\\(0,rivalryId\\.length\\)/,"Clipboard fallback must select the complete durable rivalry ID.");
  assert.match(source,/range\\.selectNodeContents\\(rivalryIdText\\)/,"Manual fallback must select the complete visible full-ID surface.");
  assert.doesNotMatch(source,/code\\.setSelectionRange\\(0,code\\.value\\.length\\)/,"Copy fallback must not depend on the editable attachment input.");
'''
if text.count(old_assert) != 1:
    raise SystemExit('stage4 fallback assertion mismatch')
stage4.write_text(text.replace(old_assert,new_assert))

offline = Path('tests/contracts/offline-hotfix-contracts.cjs')
text = offline.read_text()
old_terms = "for(const term of ['chooseNavigationRuntime','CMS_PROBE_NETWORK','CMS_GET_CACHE_STATUS','CMS_ROLLBACK_TO_PREVIOUS','!keepShellCaches.has(name)'])A.ok(worker.includes(term),`worker contract missing ${term}`);"
new_terms = "for(const term of ['chooseNavigationRuntime','verifyRetainedRuntime','findRecoveryRuntime','compareRuntimeRevisions','CMS_PROBE_NETWORK','CMS_GET_CACHE_STATUS','CMS_ROLLBACK_TO_PREVIOUS','recovery.ok?recovery.cacheName','writeForcedRevision(recovery.revision)','!keepShellCaches.has(name)'])A.ok(worker.includes(term),`worker contract missing ${term}`);A.ok(worker.includes('const recovery=await findRecoveryRuntime(); if(recovery.ok)return recovery;'),'navigation must fall back to a verified installed shell when the declared previous runtime was skipped');A.ok(worker.includes('const requestedRevision=url.searchParams.get(\"v\")||\"\"; if(!requestedRevision){return;}'),'retained recovery assets must be served by their exact cached revision rather than current-network bytes');"
if text.count(old_terms) != 1:
    raise SystemExit('offline contract marker mismatch')
offline.write_text(text.replace(old_terms,new_terms))
