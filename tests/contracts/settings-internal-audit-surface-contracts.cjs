#!/usr/bin/env node
'use strict';
// r87 L2 flake (2026-11-01): Settings re-hides its internal panels on a late render (the 0/80/250/800 ms Settings timers and
// every identity, pair, online/offline and screen-shown event). On a slow runner that late render landed after the browser
// audits had opened the Save Library on its internal audit surface, so EDIT DISPLAY LABEL / DELETE THIS SAVE were never
// visible. The containment stylesheet already lets #saveLibraryProductPanel[data-test-surface="internal-audit"] show; the
// re-hide now honours the same single exemption, so a late render never hides the audit surface. Players never see it:
// no product code sets the marker, and every other internal panel (and an unmarked Save Library) is still hidden.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const source=fs.readFileSync(path.resolve(__dirname,'../../js/onlinePlayerIdentity.js'),'utf8');
const extract=name=>{const at=source.indexOf(`function ${name}(`);assert.ok(at>=0,name);let depth=0;for(let i=source.indexOf('{',at);i<source.length;i++){if(source[i]==='{')depth++;else if(source[i]==='}'&&--depth===0)return source.slice(at,i+1);}throw new Error(name);};
const panels=['sparkConnectedAccountPanel','sparkPrivatePairingPanel','sparkConnectedRivalryPanel','saveLibraryProductPanel'];
function run(marks){
  const els=Object.fromEntries(panels.map(id=>[id,{id,hidden:false,dataset:marks[id]?{testSurface:'internal-audit'}:{}}]));
  const offline={hidden:false,dataset:{testSurface:'internal-audit'}};
  const c=vm.createContext({root:{document:{getElementById:id=>els[id]??null,querySelectorAll:()=>[offline]}},ensureOnlineInternalSurfaceStyle(){},onlineSurfaceText(){},INTERNAL_PANELS:panels});
  vm.runInContext(extract('hideOnlineInternalPanels')+';hideOnlineInternalPanels();',c);
  return {els,offline};
}
const checks=[];const check=(n,f)=>checks.push([n,f]);
check('a late Settings render keeps the Save Library audit surface open (EDIT DISPLAY LABEL / DELETE THIS SAVE reachable)',()=>{
  const {els}=run({saveLibraryProductPanel:true});
  assert.equal(els.saveLibraryProductPanel.hidden,false);
  assert.equal(els.saveLibraryProductPanel.dataset.productSurface,'internal','still tagged internal for the containment check');
});
check('players: an unmarked Save Library and every other internal panel are still hidden, marked or not',()=>{
  const plain=run({});for(const id of panels)assert.equal(plain.els[id].hidden,true,id);
  const marked=run(Object.fromEntries(panels.map(id=>[id,true])));
  for(const id of panels.filter(id=>id!=='saveLibraryProductPanel'))assert.equal(marked.els[id].hidden,true,id);
  assert.equal(marked.offline.hidden,true,'offline panels');
});
check('the re-hide and the containment stylesheet exempt the same one surface',()=>{
  const css=extract('ensureOnlineInternalSurfaceStyle');
  assert.match(css,/#saveLibraryProductPanel:not\(\[data-test-surface=\\"internal-audit\\"\]\)/);
  assert.equal((css.match(/internal-audit/g)||[]).length,1);
  assert.equal((extract('hideOnlineInternalPanels').match(/internal-audit/g)||[]).length,1);
  assert.equal((source.match(/testSurface/g)||[]).length,1,'no product code sets the audit marker');
});
let failed=0;
for(const [n,f] of checks){try{f();console.log('ok -',n);}catch(e){failed++;console.log('not ok -',n);console.error(e);}}
if(failed){process.exitCode=1;console.error(`${failed} failing`);}else console.log(`PASS settings internal audit surface contracts: ${checks.length} checks`);
