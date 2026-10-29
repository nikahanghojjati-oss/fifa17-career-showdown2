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
  // HO-004: css/rulebook.css (the old light look, loaded by js/optionalModules.js) styles the class names this look
  // uses (.ruleBookHero > span, .ruleBookActions .backButton …) and beats Team V's shared type and panel classes.
  // While the Rule Book look is mounted that sheet is switched off (its <link> stays, so the app's loader still sees it
  // loaded); unmounting switches it back on. A sheet still loading is switched off when it arrives, if still mounted.
  // css/settings.css also lays out the Settings overlay itself, so Settings keeps it and overrides per rule instead.
  const OLD_SHEETS=Object.freeze({ruleBook:"rule-book-ui"}),oldSheetOff=new Set();
  function oldSheet(name,off){
    const key=OLD_SHEETS[name],link=doc().querySelector?.(`link[data-optional-style="${key}"]`);
    if(off)oldSheetOff.add(name);else oldSheetOff.delete(name);
    if(!link)return;
    if(link.sheet){link.sheet.disabled=off;return;}
    if(off)link.addEventListener?.("load",()=>{if(link.sheet)link.sheet.disabled=oldSheetOff.has(name);},{once:true});
  }
  function image(cls,path){const n=element("img",cls);n.src=BASE+path;n.alt="";n.setAttribute("aria-hidden","true");n.decoding="async";return n;}
  function stage(id,host,content){
    const s=element("div","sd-stage v10SystemStage");s.id=id;
    const plate=element("div","sd-stage__layer sd-stage__layer--plate");plate.setAttribute("aria-hidden","true");
    const reg=element("div","sd-stage__registered");reg.append(element("div","sd-stage__plate"));plate.append(reg);
    const phone=element("picture",id==="v10RuleBookStage"?"ruleBookPhonePlate":"settingsPhonePlate");
    /* r78: phone and tablet use Team V's marble phone plates (no people), the same black-and-gold look as desktop. */
    phone.append(image("",id==="v10RuleBookStage"?"plates-v2/ENV_RULE_BOOK_PHONE_V2.webp":"plates-v2/ENV_SETTINGS_PHONE_V2.webp"));plate.append(phone);
    const atmosphere=element("div","sd-stage__layer sd-stage__layer--atmosphere");atmosphere.setAttribute("aria-hidden","true");
    /* HO-033 (owner rule HO-027, no dimming): no ruleBookScrim / settingsStageScrim is drawn over the plate any more. */
    const ui=element("div","sd-stage__layer sd-stage__layer--ui");ui.append(content);s.append(plate,atmosphere,ui);host.append(s);
    const engine=root.ShowdownStage?.mount(s,{plate:{width:1672,height:941,src1x:BASE+"shared/plates/ENV_SYS_PLATE_V1_1X.webp",src2x:BASE+"shared/plates/ENV_SYS_PLATE_V1_2X.webp"},focal:{x:836,y:470.5}});
    return {stage:s,engine};
  }
  // JOB-1707: adopted phone study 1429. Wrap the original nodes only on upright
  // phones; widen/rotate and unmount restore the exact articles and heading nodes.
  // Disclosures are presentation state only; every rule and scoring value stays live.
  function ruleBookDisclosures(content){
    const media=root.matchMedia?.("(max-width: 699px) and (orientation: portrait)");
    if(!media)return ()=>{};
    const rows=Array.from(content.querySelectorAll(".ruleSection")).map(card=>({
      card,children:Array.from(card.childNodes||card.children),head:card.querySelector(".ruleSectionHeader")
    }));
    let mounted=false,selected=0;
    function restore(){
      if(!mounted)return;
      const focused=rows.some(row=>row.summary===doc().activeElement);
      for(const row of rows){
        row.details.removeEventListener("toggle",row.onToggle);
        row.head.append(...Array.from(row.summary.childNodes));
        row.card.replaceChildren(...row.children);
        row.details=null;row.summary=null;
      }
      mounted=false;
      if(focused)content.querySelector("#ruleBookBack")?.focus({preventScroll:true});
    }
    function sync(){
      if(!media.matches){restore();return;}
      if(mounted)return;
      mounted=true;
      rows.forEach((row,index)=>{
        const details=element("details","ruleBookDisclosure");
        const summary=element("summary","ruleSectionHeader ruleBookDisclosureHeader");
        summary.append(...Array.from(row.head.childNodes));
        details.append(summary,...row.children.filter(node=>node!==row.head));
        row.card.replaceChildren(details);
        row.details=details;row.summary=summary;
        // Native exclusive details plus a fallback for engines without details.name.
        details.setAttribute("name","cm17-rule-book");
        details.open=index===selected;
        row.onToggle=()=>{
          if(!mounted||!media.matches||!details.open)return;
          selected=index;
          rows.forEach(other=>{if(other!==row)other.details.open=false;});
        };
        details.addEventListener("toggle",row.onToggle);
      });
    }
    sync();
    if(media.addEventListener)media.addEventListener("change",sync);
    else media.addListener?.(sync);
    return ()=>{
      if(media.removeEventListener)media.removeEventListener("change",sync);
      else media.removeListener?.(sync);
      restore();
    };
  }
  // JOB-1731: adopted sideways study 1731. On short landscape phones the six numbered rule cards are shown one at a
  // time under six section tabs. Presentation state only: every article, rule line and score stays in the DOM in live
  // order (a hidden card is only display:none), and leaving the sideways size restores the exact original page.
  function ruleBookTabs(content){
    const media=root.matchMedia?.("(max-width: 900px) and (max-height: 500px) and (orientation: landscape)");
    if(!media)return ()=>{};
    const cards=Array.from(content.querySelectorAll(".ruleSection")),grid=content.querySelector("#ruleBookSections");
    if(!grid||!cards.length)return ()=>{};
    let bar=null,selected=0;
    function showTab(index){
      selected=index;
      cards.forEach((card,i)=>{card.dataset.ruleTab=i===index?"on":"off";});
    }
    function restoreTabs(){
      if(!bar)return;
      const focused=bar.contains(doc().activeElement);
      bar.remove();bar=null;
      cards.forEach(card=>{delete card.dataset.ruleTab;});
      if(focused)content.querySelector("#ruleBookBack")?.focus({preventScroll:true});
    }
    function syncTabs(){
      if(!media.matches){restoreTabs();return;}
      if(bar)return;
      bar=element("div","ruleBookTabs");
      bar.setAttribute("role","radiogroup");bar.setAttribute("aria-label","Rule book sections");
      cards.forEach((card,index)=>{
        const label=element("label","ruleBookTab"),input=doc().createElement("input");
        input.type="radio";input.name="ruleBookSection";input.value=String(index);input.checked=index===selected;
        input.addEventListener("change",()=>{if(input.checked)showTab(index);});
        label.append(input,element("i","",card.querySelector(".ruleSectionNumber")?.textContent||String(index+1)),
          element("b","",card.querySelector("h3")?.textContent||""));
        bar.append(label);
      });
      grid.before(bar);
      showTab(selected);
    }
    syncTabs();
    if(media.addEventListener)media.addEventListener("change",syncTabs);
    else media.addListener?.(syncTabs);
    return ()=>{
      if(media.removeEventListener)media.removeEventListener("change",syncTabs);
      else media.removeListener?.(syncTabs);
      restoreTabs();
    };
  }
  function mountRuleBook(frame,host){
    try{root.renderRuleBookSpecialPlayers?.();}catch(_){}
    if(states.has(host))return;
    const original=Array.from(host.children),content=element("div","ruleBookV10Content");
    original.forEach(n=>content.append(n));host.classList.add("v10RuleBook");
    const hero=content.querySelector('.ruleBookHero');hero.dataset.sdEnter="title";
    hero.insertBefore(image("ruleBookWordmark","shared/wordmarks/TITLE_RULE_BOOK_V1.webp"),hero.querySelector("strong"));
    content.querySelector('h2').classList.add('sd-visually-hidden');
    hero.querySelector('span').classList.add('sd-eyebrow');hero.querySelector('strong').classList.add('sd-tagline');hero.querySelector('p').classList.add('sd-body','ruleBookSummary');
    const grid=content.querySelector('.ruleBookGrid');grid.id='ruleBookSections';grid.setAttribute('aria-label','Competition rules');
    content.querySelectorAll('.ruleSection').forEach(card=>{
      card.classList.add('sd-panel');card.dataset.sdEnter='panel';
      const head=card.querySelector('.ruleSectionHeader');head.querySelector('span').classList.add('ruleSectionNumber');
      if(card.classList.contains('scoringRuleSection')){card.classList.add('sd-panel--hero');Array.from(card.querySelector('.ruleScoreTable').children).forEach(row=>row.classList.add('ruleScoreRow'));}
    });
    content.querySelector('.backButton').id='ruleBookBack';
    content.querySelector('.backButton').classList.add('sd-btn','sd-btn--secondary');
    content.querySelector('.backButton').dataset.sdEnter='button';
    const disposeDisclosures=ruleBookDisclosures(content),disposeTabs=ruleBookTabs(content);
    states.set(host,{...stage('v10RuleBookStage',host,content),original,content,disposeDisclosures,disposeTabs});
    oldSheet('ruleBook',true);
    root.sdEnter?.(content);
  }
  function unmountRuleBook(host){
    const state=states.get(host);if(!state)return;
    state.disposeTabs?.();
    state.disposeDisclosures?.();
    state.engine?.destroy();state.content.querySelector('.ruleBookWordmark')?.remove();
    host.replaceChildren(...state.original);host.classList.remove('v10RuleBook');states.delete(host);oldSheet('ruleBook',false);
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
    // HO-004: the product's own Settings buttons take Team V's shared button look (renderSettings rebuilds the
    // panel buttons, so this runs on every refresh). Nodes, text and listeners are the product's.
    buttons(host).forEach(([button,kind])=>button.classList.add('sd-btn','sd-btn--'+kind));
  }
  function buttons(host){
    const list=[];
    host.querySelectorAll('.settingsDataButton').forEach(button=>list.push([button,'secondary']));
    const done=host.querySelector('.settingsFooter')?.querySelector('.menuButton');if(done)list.push([done,'primary']);
    return list;
  }
  // JOB-1708: keep the original content element (settings.js and the identity
  // observer retain it) inside a single main scroller on touch widths only.
  // Restoring the original node on wide windows/unmount leaves desktop intact.
  function settingsTouchScroller(dialog){
    const media=root.matchMedia?.("(max-width: 1199px)");
    const content=dialog.querySelector("#settingsContent");
    if(!media||!content)return ()=>{};
    let main=null;
    function restoreSettingsContent(){
      if(!main)return;
      main.replaceWith(content);main=null;
    }
    const sync=focusSafe(()=>{
      if(!media.matches){restoreSettingsContent();return;}
      if(main)return;
      main=element("main","settingsTouchMain");
      content.before(main);main.append(content);
    });
    sync();
    if(media.addEventListener)media.addEventListener("change",sync);
    else media.addListener?.(sync);
    return ()=>{
      if(media.removeEventListener)media.removeEventListener("change",sync);
      else media.removeListener?.(sync);
      restoreSettingsContent();
    };
  }
  function mountSettings(frame,host){
    if(states.has(host)){refreshSettings();return;}
    const dialog=doc().getElementById('settingsDialog');host.classList.add('v10Settings');
    const heading=dialog.querySelector('.settingsHeading');heading.classList.add('settingsTitleBlock');
    const wrap=element('span','settingsWordmarkWrap');wrap.dataset.sdEnter='title';wrap.append(image('settingsWordmark','shared/wordmarks/TITLE_SETTINGS_V1.webp'));heading.append(wrap);
    // Team V's Settings frame: shared eyebrow type and the "TWO MANAGERS. ONE LEGACY." line under the wordmark.
    heading.querySelector('.settingsEyebrow')?.classList.add('sd-eyebrow');heading.append(element('p','sd-kicker settingsTagline','TWO MANAGERS. ONE LEGACY.'));
    doc().getElementById('settingsTitle').classList.add('settingsVisuallyHidden');
    states.set(host,{...stage('v10SettingsStage',host,dialog),dialog,disposeTouch:settingsTouchScroller(dialog)});refreshSettings();root.sdEnter?.(dialog);
  }
  function unmountSettings(host){
    const state=states.get(host);if(!state)return;
    state.disposeTouch?.();
    state.engine?.destroy();host.append(state.dialog);state.stage.remove();
    state.dialog.querySelector('.settingsWordmarkWrap')?.remove();state.dialog.querySelector('.settingsTagline')?.remove();
    state.dialog.querySelector('.settingsEyebrow')?.classList.remove('sd-eyebrow');
    buttons(state.dialog).forEach(([button])=>button.classList.remove('sd-btn','sd-btn--secondary','sd-btn--primary'));
    host.classList.remove('v10Settings');states.delete(host);
  }
  function register(){
    if(registered||!root.CareerModeV10Screens)return;
    registered=true;
    const loader=root.CareerModeV10Screens.install();
    // r86: the Special Player draw loads with the Rule Book's files, so its rule line shows this Showdown's chips in the first frame.
    const chip=()=>Promise.resolve().then(()=>root.loadRuntimeScript('special-player-chip','js/specialPlayerChip.js',()=>Boolean(root.CareerModeSpecialPlayerChip))).then(()=>root.CareerModeSpecialPlayerChip.ensure()).catch(()=>false);
    loader.register('ruleBook',{css:['rule-book/rule-book.css'],prepare:()=>Promise.all([root.loadRuntimeStyle('rules-settings-v10','css/rulesSettingsV10.css'),chip()]),frame:()=>true,mount:focusSafe(mountRuleBook),unmount:focusSafe(unmountRuleBook)});
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
