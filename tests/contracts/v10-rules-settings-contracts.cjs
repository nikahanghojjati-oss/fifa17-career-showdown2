#!/usr/bin/env node
"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const ROOT=path.resolve(__dirname,"../.."),read=p=>fs.readFileSync(path.join(ROOT,p),"utf8");
const {FakeNode}=require("../support/fake-dom.cjs");
// Run the actual app constructors and visual binder, preserving object identity and handlers.
FakeNode.prototype.matches=function(s){if(s.startsWith('.'))return this.classList.contains(s.slice(1));if(s.startsWith('#'))return this.id===s.slice(1);return this.tagName===s.toUpperCase();};
FakeNode.prototype.querySelectorAll=function(s){return this.all().filter(n=>s.split(',').some(t=>n.matches(t.trim())));};
FakeNode.prototype.querySelector=function(s){return this.querySelectorAll(s)[0]||null;};
FakeNode.prototype.prepend=function(n){if(n.parent)n.remove();n.parent=this;this.children.unshift(n);};
FakeNode.prototype.removeAttribute=function(k){delete this.attributes[k];};
FakeNode.prototype.contains=function(n){return this===n||this.all().includes(n);};
Object.defineProperty(FakeNode.prototype,'isConnected',{get(){return !!this.parent;}});
Object.defineProperty(FakeNode.prototype,'innerHTML',{set(html){this.replaceChildren();for(const m of html.matchAll(/<(span|strong|p)>([^<]*)<\/(?:span|strong|p)>/g)){const n=new FakeNode(m[1]);n.textContent=m[2];this.append(n);}}});
const body=new FakeNode('body'),main=new FakeNode('main');body.append(main);
const doc={body,createElement:t=>new FakeNode(t),createDocumentFragment:()=>new FakeNode('fragment',true),getElementById:id=>body.all().find(n=>n.id===id)||null,querySelector:s=>s==='main'?main:body.querySelector(s),querySelectorAll:s=>body.querySelectorAll(s),activeElement:null};
const root={document:doc,APP_VERSION:'1.9.1',window:null,HTMLElement:FakeNode,requestAnimationFrame:()=>{},addEventListener:()=>{},matchMedia:()=>({matches:false}),navigator:{onLine:true},location:{},getActiveScreenName:()=>active,showScreen:id=>{active=id;doc.getElementById(id).classList.remove('hidden');return true;}};root.window=root;let active='mainMenu';
const ctx=vm.createContext(root);vm.runInContext(read('js/ruleBook.js'),ctx);vm.runInContext(read('js/settings.js'),ctx);
let n=0;const check=(name,fn)=>{fn();console.log(`ok ${++n} ${name}`);};
check('RS1 current rule constructors preserve all six sections and scoring',()=>{root.createRuleBookScreen();const h=doc.getElementById('ruleBook');assert.equal(h.querySelectorAll('.ruleSection').length,6);assert.equal(h.querySelector('.ruleScoreMaximum').textContent,'MAXIMUM PER MANAGER / SEASON11');});
// Missing binder makes this contract fail before the implementation is saved.
const api=require(path.join(ROOT,'js/rulesSettingsV10.js')).createBindings(root);
const rules=doc.getElementById('ruleBook'),ruleText=rules.textContent,ruleBack=rules.querySelector('button');
check('RS2 Rule Book skin carries exactly the current app rule text',()=>{api.mountRuleBook(null,rules);assert.equal(rules.textContent,ruleText+'010203040506');assert.equal(rules.querySelector('.backButton'),ruleBack);assert.equal(rules.querySelectorAll('.ruleSection').length,6);});
check('RS3 rule render is idempotent and unmount restores the original DOM',()=>{const stage=rules.querySelector('.v10SystemStage');api.mountRuleBook(null,rules);assert.equal(rules.querySelector('.v10SystemStage'),stage);api.unmountRuleBook(rules);assert.equal(rules.textContent,ruleText);assert.equal(rules.querySelector('.backButton'),ruleBack);api.mountRuleBook(null,rules);});
root.ensureSettingsDialog();root.renderSettings();const overlay=doc.getElementById('settingsOverlay'),content=doc.getElementById('settingsContent');
// Seed hidden/internal recovery controls: visual decoration must leave visibility and listeners intact.
for(const id of ['saveLibraryProductPanel','sparkConnectedAccountPanel','sparkPrivatePairingPanel','sparkConnectedRivalryPanel']){const panel=new FakeNode('section');panel.id=id;panel.hidden=true;panel.dataset.productSurface='internal';const apply=new FakeNode('button');apply.id=id+'Apply';panel.append(apply);content.append(panel);}
const controls=overlay.querySelectorAll('button').map(b=>({b,hidden:b.hidden,attrs:JSON.stringify(b.attributes)}));
check('RS4 every Settings control and internal recovery id survives unchanged',()=>{api.mountSettings(null,overlay);for(const {b,hidden,attrs} of controls){assert.ok(overlay.contains(b));assert.equal(b.hidden,hidden);assert.equal(JSON.stringify(b.attributes),attrs);}for(const id of ['settingsOverlay','settingsDialog','settingsTitle','settingsClose','settingsContent','saveLibraryProductPanel','sparkConnectedAccountPanel','sparkPrivatePairingPanel','sparkConnectedRivalryPanel'])assert.ok(doc.getElementById(id),id);});
check('RS5 Reus credit has exact text and both real licence links; version remains shown',()=>{const credit=doc.getElementById('photoCredit');assert.equal(credit.textContent,'Marco Reus photo: Tim Reckmann · CC BY 2.0 · Cropped for display');const links=credit.querySelectorAll('a');assert.deepEqual(links.map(a=>a.href),['https://www.flickr.com/photos/foto_db/16204330530/','https://creativecommons.org/licenses/by/2.0/']);assert.ok(content.textContent.includes('v1.9.1'));});
check('RS6 no Apply or hidden recovery panel is moved or exposed',()=>{for(const id of ['saveLibraryProductPanel','sparkConnectedAccountPanel','sparkPrivatePairingPanel','sparkConnectedRivalryPanel']){const p=doc.getElementById(id);assert.equal(p.hidden,true);assert.equal(p.dataset.productSurface,'internal');assert.equal(p.parent,content);}assert.equal(overlay.querySelectorAll('button').length,controls.length);});
check('RS7 Settings rerender preserves controls, refreshes credits once and never duplicates art',()=>{api.refreshSettings();api.refreshSettings();assert.equal(overlay.querySelectorAll('#photoCredit').length,1);assert.equal(overlay.querySelectorAll('.settingsWordmark').length,1);root.renderSettings();api.refreshSettings();assert.equal(overlay.querySelectorAll('#photoCredit').length,1);assert.ok(content.textContent.includes('v1.9.1'));});
check('RS8 lazy loader registers Rule Book and native modal separately',()=>{const defs=new Map(),calls=[];root.CareerModeV10Screens={install(){return this;},register(id,def){defs.set(id,def);return this;},show(id){calls.push(id);return Promise.resolve(true);},hide(id){calls.push('hide:'+id);}};api.register();assert.ok(defs.has('ruleBook'));assert.equal(defs.get('settingsOverlay').overlay,true);assert.equal(defs.get('settingsOverlay').auto,false);api.closeSettings();assert.ok(calls.includes('hide:settingsOverlay'));});
check('RS9 app hooks are lazy; startup files and revision remain unchanged',()=>{for(const p of ['js/ruleBook.js','js/settings.js'])assert.match(read(p),/rulesSettingsV10/);const html=read('index.html');assert.ok(!html.includes('rulesSettingsV10'));assert.match(read('service-worker.js'),/const RUNTIME_REVISION = "1\.9\.1-r58"/);});
check('RS10 visual code has no fixture reads, invented gameplay or destructive authority',()=>{const src=read('js/rulesSettingsV10.js');for(const banned of ['fixtures.json','localStorage','fetch(','applyCareerMode','prepareCareerMode','Preview data'])assert.ok(!src.includes(banned),banned);assert.ok(!src.includes('.hidden = false'));});
check('RS11 system CSS is scoped and never overrides hidden recovery containment',()=>{for(const file of ['rule-book/rule-book.css','settings/settings.css']){const css=read('visual-assets/v10_1/'+file);assert.ok(!/^body\s*\{/m.test(css));assert.ok(!/^#stage-root\s*\{/m.test(css));}assert.ok(!/\[hidden\][^{]*\{[^}]*display:\s*(?:block|grid|flex)/.test(read('css/rulesSettingsV10.css')));});
check('RS12 lazy text files are shell cached and referenced art uses runtime cache',()=>{const sw=read('service-worker.js');for(const p of ['js/rulesSettingsV10.js','css/rulesSettingsV10.css','visual-assets/v10_1/rule-book/rule-book.css','visual-assets/v10_1/settings/settings.css'])assert.ok(sw.includes('"'+p+'"'),p);for(const p of ['shared/plates/ENV_SYS_PLATE_V1_1X.webp','shared/plates/ENV_SYS_PLATE_V1_2X.webp','shared/plates/ENV_SYS_PHONE_V1.webp','shared/wordmarks/TITLE_RULE_BOOK_V1.webp','shared/wordmarks/TITLE_SETTINGS_V1.webp']){assert.ok(fs.existsSync(path.join(ROOT,'visual-assets/v10_1',p)),p);assert.ok(!sw.includes('"visual-assets/v10_1/'+p+'"'),p);}});
(async()=>{
  doc.head=new FakeNode('head');doc.addEventListener=()=>{};
  root.setTimeout=fn=>{queueMicrotask(fn);return 0;};root.clearTimeout=()=>{};root.loadRuntimeScript=async()=>true;
  vm.runInContext(read('js/v10Screens.js'),ctx);const loader=root.CareerModeV10Screens;
  active='ruleBook';rules.classList.remove('hidden');overlay.classList.remove('hidden');
  let ruleMounts=0,modalMounts=0,modalCloses=0;
  loader.register('ruleBook',{css:['rule-book/rule-book.css'],frame:()=>true,mount:()=>ruleMounts++});
  loader.register('settingsOverlay',{overlay:true,auto:false,css:['settings/settings.css'],frame:()=>true,mount:()=>modalMounts++,unmount:()=>modalCloses++});
  await loader.show('ruleBook');await loader.show('settingsOverlay');await loader.show('settingsOverlay');
  check('RS13 real loader mounts a modal over an active screen once and scopes both styles',()=>{
    assert.equal(ruleMounts,1);assert.equal(modalMounts,1);
    assert.equal(loader.isMounted('ruleBook'),true);assert.equal(loader.isMounted('settingsOverlay'),true);
    for(const suffix of ['rule-book/rule-book.css','settings/settings.css'])assert.equal(doc.head.children.find(n=>n.href.endsWith(suffix)).disabled,false);
    overlay.classList.add('hidden');loader.hide('settingsOverlay');assert.equal(modalCloses,1);
    assert.equal(doc.head.children.find(n=>n.href.endsWith('settings/settings.css')).disabled,true);
    assert.equal(doc.head.children.find(n=>n.href.endsWith('rule-book/rule-book.css')).disabled,false);
  });
  check('RS14 hidden modal cannot mount after an asynchronous load or close',()=>{assert.equal(loader.isMounted('settingsOverlay'),false);});
  check('RS15 mounting and unmounting the Settings look keeps keyboard focus on the same control',()=>{
    // Live deployed-site smoke (54567ac) lost focus on Settings Close when the look mounted late; a browser blurs a moved focused node.
    const host=doc.getElementById('settingsOverlay'),close=doc.getElementById('settingsClose');assert.ok(host&&close);
    const append=FakeNode.prototype.append;FakeNode.prototype.focus=function(){doc.activeElement=this;};
    FakeNode.prototype.append=function(...nodes){if(nodes.some(node=>node&&doc.activeElement&&(node===doc.activeElement||(typeof node.contains==="function"&&node.contains(doc.activeElement)))))doc.activeElement=body;return append.apply(this,nodes);};
    try{
      api.unmountSettings(host);close.focus();api.mountSettings(null,host);
      assert.equal(doc.activeElement,close,'mount keeps focus on Close');
      api.unmountSettings(host);assert.equal(doc.activeElement,close,'unmount keeps focus on Close');
    }finally{FakeNode.prototype.append=append;delete FakeNode.prototype.focus;doc.activeElement=null;}
  });
  assert.equal(await loader.show('settingsOverlay'),false);
  console.log(`PASS V10 rules/settings contracts: ${n} checks.`);
})().catch(error=>{console.error(error);process.exitCode=1;});
