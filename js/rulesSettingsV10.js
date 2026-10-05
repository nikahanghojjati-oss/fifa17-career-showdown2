(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports={...api,createBindings:factory};
  else root.CareerModeRulesSettingsV10=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";
  // JOB-30: visual decoration only. Original rules, controls and modal lifecycle own all behaviour.
  const BASE="visual-assets/v10_1/",states=new Map();
  let registered=false;
  const doc=()=>root.document;
  function element(tag,cls="",text=""){const n=doc().createElement(tag);n.className=cls;if(text)n.textContent=text;return n;}
  // Mounting moves the original dialog or rule content into the stage, and moving a focused control blurs it
  // (Settings can finish loading its look after Close or a toggle already has focus); put focus back.
  function keepFocus(work){const d=doc(),active=d.activeElement;try{return work();}finally{if(active&&active!==d.body&&active.isConnected&&d.activeElement!==active&&typeof active.focus==="function")active.focus({preventScroll:true});}}
  const focusSafe=fn=>(...args)=>keepFocus(()=>fn(...args));
  function image(cls,path){const n=element("img",cls);n.src=BASE+path;n.alt="";n.setAttribute("aria-hidden","true");n.decoding="async";return n;}
  function stage(id,host,content){
    const s=element("div","sd-stage v10SystemStage");s.id=id;
    const plate=element("div","sd-stage__layer sd-stage__layer--plate");plate.setAttribute("aria-hidden","true");
    const reg=element("div","sd-stage__registered");reg.append(element("div","sd-stage__plate"));plate.append(reg);
    const phone=element("picture",id==="v10RuleBookStage"?"ruleBookPhonePlate":"settingsPhonePlate");
    phone.append(image("","shared/plates/ENV_SYS_PHONE_V1.webp"));plate.append(phone);
    const atmosphere=element("div","sd-stage__layer sd-stage__layer--atmosphere");atmosphere.setAttribute("aria-hidden","true");
    atmosphere.append(element("div",id==="v10RuleBookStage"?"ruleBookScrim":"settingsStageScrim"));
    const ui=element("div","sd-stage__layer sd-stage__layer--ui");ui.append(content);s.append(plate,atmosphere,ui);host.append(s);
    const engine=root.ShowdownStage?.mount(s,{plate:{width:1672,height:941,src1x:BASE+"shared/plates/ENV_SYS_PLATE_V1_1X.webp",src2x:BASE+"shared/plates/ENV_SYS_PLATE_V1_2X.webp"},focal:{x:836,y:470.5}});
    return {stage:s,engine};
  }
  function mountRuleBook(frame,host){
    if(states.has(host))return;
    const original=Array.from(host.children),content=element("div","ruleBookV10Content");
    original.forEach(n=>content.append(n));host.classList.add("v10RuleBook");
    const hero=content.querySelector('.ruleBookHero');hero.dataset.sdEnter="title";
    hero.insertBefore(image("ruleBookWordmark","shared/wordmarks/TITLE_RULE_BOOK_V1.webp"),hero.querySelector("strong"));
    content.querySelector('h2').classList.add('sd-visually-hidden');
    hero.querySelector('span').classList.add('sd-eyebrow');hero.querySelector('strong').classList.add('sd-tagline');hero.querySelector('p').classList.add('ruleBookSummary');
    const grid=content.querySelector('.ruleBookGrid');grid.id='ruleBookSections';grid.setAttribute('aria-label','Competition rules');
    const index=element('div');index.id='ruleBookIndex';index.setAttribute('aria-hidden','true');
    content.querySelectorAll('.ruleSection').forEach(card=>{
      card.classList.add('sd-panel');card.dataset.sdEnter='panel';
      const head=card.querySelector('.ruleSectionHeader');head.querySelector('span').classList.add('ruleSectionNumber');
      const chip=element('span','ruleBookIndexChip',head.querySelector('span').textContent);index.append(chip);
      if(card.classList.contains('scoringRuleSection')){card.classList.add('sd-panel--hero');Array.from(card.querySelector('.ruleScoreTable').children).forEach(row=>row.classList.add('ruleScoreRow'));}
    });
    content.querySelector('.backButton').id='ruleBookBack';
    content.querySelector('.backButton').classList.add('sd-btn','sd-btn--secondary');
    content.querySelector('.backButton').dataset.sdEnter='button';content.append(index);
    states.set(host,{...stage('v10RuleBookStage',host,content),original,content});
    root.sdEnter?.(content);
  }
  function unmountRuleBook(host){
    const state=states.get(host);if(!state)return;
    state.engine?.destroy();state.content.querySelector('.ruleBookWordmark')?.remove();
    host.replaceChildren(...state.original);host.classList.remove('v10RuleBook');states.delete(host);
  }
  function credit(panel){
    if(panel.querySelector('#photoCredit'))return;
    const p=element('p');p.id='photoCredit';p.append(element('span','','Marco Reus photo: '));
    const author=element('a','','Tim Reckmann');author.href='https://www.flickr.com/photos/foto_db/16204330530/';
    const license=element('a','','CC BY 2.0');license.href='https://creativecommons.org/licenses/by/2.0/';
    p.append(author,element('span','',' · '),license,element('span','',' · Cropped for display'));panel.append(p);
  }
  function refreshSettings(){
    const host=doc().getElementById('settingsOverlay');if(!host||!states.has(host))return;
    const content=doc().getElementById('settingsContent');
    for(const panel of content.querySelectorAll('.settingsPanel')){
      const title=panel.querySelector('h3')?.textContent;
      const name=title==='CAREER MODE SHOWDOWN'?'application':title==='MOTION & FEEDBACK'?'motion':title==='SHOWDOWN DATA'?'data':null;
      if(name){panel.classList.add('sd-panel','settingsPanel--'+name);panel.dataset.sdEnter='panel';if(name==='application')credit(panel);}
    }
  }
  function mountSettings(frame,host){
    if(states.has(host)){refreshSettings();return;}
    const dialog=doc().getElementById('settingsDialog');host.classList.add('v10Settings');
    const heading=dialog.querySelector('.settingsHeading');heading.classList.add('settingsTitleBlock');
    const wrap=element('span','settingsWordmarkWrap');wrap.dataset.sdEnter='title';wrap.append(image('settingsWordmark','shared/wordmarks/TITLE_SETTINGS_V1.webp'));heading.append(wrap);
    doc().getElementById('settingsTitle').classList.add('settingsVisuallyHidden');
    states.set(host,{...stage('v10SettingsStage',host,dialog),dialog});refreshSettings();root.sdEnter?.(dialog);
  }
  function unmountSettings(host){
    const state=states.get(host);if(!state)return;
    state.engine?.destroy();host.append(state.dialog);state.stage.remove();
    state.dialog.querySelector('.settingsWordmarkWrap')?.remove();host.classList.remove('v10Settings');states.delete(host);
  }
  function register(){
    if(registered||!root.CareerModeV10Screens)return;
    registered=true;
    const loader=root.CareerModeV10Screens.install();
    loader.register('ruleBook',{css:['rule-book/rule-book.css'],prepare:()=>root.loadRuntimeStyle('rules-settings-v10','css/rulesSettingsV10.css'),frame:()=>true,mount:focusSafe(mountRuleBook),unmount:focusSafe(unmountRuleBook)});
    loader.register('settingsOverlay',{css:['settings/settings.css'],prepare:()=>root.loadRuntimeStyle('rules-settings-v10','css/rulesSettingsV10.css'),overlay:true,auto:false,frame:()=>true,mount:focusSafe(mountSettings),unmount:focusSafe(unmountSettings)});
  }
  async function rsInstall(){
    await root.loadRuntimeScript('v10-screens','js/v10Screens.js',()=>Boolean(root.CareerModeV10Screens));register();
    if(root.getActiveScreenName?.()==='ruleBook')await root.CareerModeV10Screens.show('ruleBook');
    const overlay=doc().getElementById('settingsOverlay');if(overlay&&!overlay.classList.contains('hidden'))await root.CareerModeV10Screens.show('settingsOverlay');
  }
  function rsOpenSettings(){if(registered)void root.CareerModeV10Screens.show('settingsOverlay').catch(()=>{});}
  function rsCloseSettings(){root.CareerModeV10Screens?.hide('settingsOverlay');}
  return Object.freeze({install:rsInstall,register,openSettings:rsOpenSettings,closeSettings:rsCloseSettings,refreshSettings,mountRuleBook:focusSafe(mountRuleBook),unmountRuleBook:focusSafe(unmountRuleBook),mountSettings:focusSafe(mountSettings),unmountSettings:focusSafe(unmountSettings)});
});
