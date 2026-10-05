(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeClubScreenV10=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  // JOB-34 (G-34): Team V's Club Assignment (visual-assets/v10_1/club, pinned 5e05a1f, frames CL1-CL6) on the live
  // #clubWheelScreen. Skin, don't rewire:
  // - Team V's club markup is the product's own #clubWheelScreen markup plus decoration, so the product elements stay
  //   where they are (same ids, classes, text, data-* hooks and listeners) and Team V's club.js lays them out on the
  //   Club plate. Only aria-hidden decoration is added; every change is undone when the screen closes.
  // - The frame is read from what the product already rendered: the reveal stage (data-club-reveal-stage) and which
  //   packs the product has opened (.is-revealed with a club name). A sealed pack's club never reaches the frame, so
  //   the animation only shows the club the product (local draw or the shared Setup provider) already chose.
  // - Daniel (playerOne, #clubCardOne) is always on the left and Nik (playerTwo, #clubCardTwo) on the right; the
  //   buttons, their text and enabled state stay the product's, so each device keeps exactly its own pack actions.
  const SCREEN="clubWheelScreen";
  const DIR="club/";
  const FILES=Object.freeze({
    css:Object.freeze(["../../css/v10Club.css",DIR+"club.css"]),
    script:Object.freeze(["v10-club-plate",DIR+"club.js",()=>Boolean(root.ClubPlate&&root.ClubPlate.app)]),
    platemap:DIR+"assets/platemap.json",
    handmap:DIR+"assets/handmap.json"
  });
  const ROLES=Object.freeze(["playerOne","playerTwo"]);
  const STAGES=Object.freeze(["ready","opening","manager-one","manager-two","versus","confirmation"]);
  // Team V's evidence frames per product reveal stage (BUILD_RESULT.md "Frames").
  const FRAMES=Object.freeze({ready:"CL1",opening:"CL2","manager-one":"CL3","manager-two":"CL4",versus:"CL5",confirmation:"CL6"});
  const clNode=typeof module!=="undefined"&&module.exports;

  function clFreeze(value){if(value&&typeof value==="object"&&!Object.isFrozen(value)){Object.values(value).forEach(clFreeze);Object.freeze(value);}return value;}
  const clText=value=>String(value??"").replace(/\s+/g," ").trim();

  // Pure: what the product shows -> the frame Team V's layout is drawn from.
  // input: {context (a showdown with a league, or the shared presentation, owns the screen), stage
  //         (#clubWheelScreen data-club-reveal-stage), revealed [Daniel, Nik] (.is-revealed), names [Daniel, Nik]
  //         (#clubNameOne / #clubNameTwo text)}
  // Returns null (keep the app's own screen) when nothing owns the Club step yet.
  function toClubFrame(input){
    const source=input||{};
    if(source.context!==true)return null;
    const stage=STAGES.includes(source.stage)?source.stage:"ready";
    const clubs={},revealed=[];
    ROLES.forEach((role,index)=>{
      const name=clText(source.names&&source.names[index]);
      const open=Boolean(source.revealed&&source.revealed[index]===true&&name&&name!=="?");
      revealed.push(open);clubs[role]=open?name:"";
    });
    const frame={screen:SCREEN,stage,frameId:FRAMES[stage],revealed,clubs};
    frame.key=JSON.stringify([stage,revealed,clubs]);
    return clFreeze(frame);
  }

  // Pure: frame -> the data Team V's club.js reads (the FX shape of Team V's demo data, live values only).
  function toPlateData(frame){
    if(!frame)throw new TypeError("CLUB_V10_FRAME");
    const frames={};frames[frame.frameId]={stage:frame.stage,revealed:frame.revealed.slice()};
    return {frame:frame.frameId,fx:{clubs:{...frame.clubs},frames}};
  }

  // ---- Browser binding (lazy; never runs in Node) ----
  const BASE="visual-assets/v10_1/";
  const ASSET_BASE=BASE+DIR;
  // Product elements Team V's club.js places with inline left/top/width/height; their own style comes back on close.
  const PLACED=Object.freeze(["#clubWheelScreen > h2",".clubAssignmentHeader",".clubRevealProgress",".clubPackStage",".clubVs",".clubCardFace",".clubRevealIndex",".clubManager","#clubRivalryConfirmation",".clubPackDoor"]);
  // Team V's index.html attributes on the product elements (entrance motion and phone roles), set while mounted.
  // Its entrance order (style="--i:N") is in css/v10Club.css, so the product's own inline styles are never touched.
  const ATTRS=Object.freeze([
    ["#clubWheelScreen > h2",{"data-sd-enter":"title"}],
    [".clubAssignmentHeader",{"data-sd-enter":"panel"}],
    [".clubRevealProgress",{"data-sd-enter":"panel"}],
    ["#clubCardOne",{"data-sd-enter":"panel"}],
    [".clubVs",{"data-sd-enter":"panel"}],
    ["#clubCardTwo",{"data-sd-enter":"panel"}],
    ["#clubRivalryConfirmation",{"data-sd-enter":"panel"}],
    ["#openClubPack",{"data-sd-enter":"button","data-phone-role":"primary"}],
    ["#continueClubAssignment",{"data-sd-enter":"button","data-phone-role":"primary"}],
    ["#clubAssignmentBack",{"data-sd-enter":"panel","data-phone-role":"secondary"}]
  ]);
  const PHONE_LABELS=Object.freeze({opening:"DRAW","manager-one":"PACK 1","manager-two":"PACK 2",versus:"VS",confirmation:"LOCK"});
  // What club.js writes on <html> while it lays the screen out.
  const ROOT_CLASSES=Object.freeze(["phone","desktop","compact","ready","scrolly"]);
  const ROOT_PROPS=Object.freeze(["--s","--k","--compactRoom","--noteBleedL","--noteBleedR","--tabH","--btnTop","--btnCx","--vsFs","--club-walkout-ms","--club-walkout-ease","--club-anticipation-ms","--club-anticipation-ease","--club-vs-ms","--club-vs-ease","--club-lock-ms","--club-lock-ease"]);
  const MOTION_CLASSES=Object.freeze(["sd-entered","sd-is-animating","sd-is-pulsing","sd-is-popping","sd-is-flipping","sd-is-slamming","sd-is-glinting","sd-motion-ready","clubNameWalkout","is-vs-slamming","is-lock-stamping","is-anticipating"]);
  let installed=false,registered=null,platemap=null,handmap=null,cached=null,mountedFrame=null,mountedSection=null,fx=null;
  let records=[],classStates=new Map(),observers=[],sectionSize=null,crestFor=["",""],glyphs=null,fontsWait=false;
  const v10Screens=()=>root.CareerModeV10Screens;
  const clDoc=()=>root.document||null;
  function clWarn(context,error){if(root.console&&typeof root.console.warn==="function")root.console.warn(`[Career Mode Showdown] ${context}`,error);}
  function clAbsolute(path){try{return new root.URL(path,root.document.baseURI).href;}catch(_error){return path;}}
  function clSection(){const doc=clDoc();return doc?doc.getElementById(SCREEN):null;}
  function clContext(section){
    if(section&&section.dataset&&section.dataset.sharedPresentationRole)return true;
    try{return typeof currentShowdown!=="undefined"&&Boolean(currentShowdown&&currentShowdown.selectedLeague);}catch(_error){return false;}
  }
  function clLive(){
    const section=clSection(),doc=clDoc();
    if(!section)return null;
    const card=id=>doc.getElementById(id),text=id=>{const node=doc.getElementById(id);return node?node.textContent:"";};
    return toClubFrame({context:clContext(section),stage:section.dataset.clubRevealStage,
      revealed:["clubCardOne","clubCardTwo"].map(id=>Boolean(card(id)&&card(id).classList.contains("is-revealed"))),
      names:[text("clubNameOne"),text("clubNameTwo")]});
  }
  // The loader compares frames by identity, so an unchanged screen returns the same frame object.
  function clFrame(){const next=clLive();if(!next){cached=null;return null;}if(cached&&cached.key===next.key)return cached;cached=next;return cached;}

  // ---- decoration (all aria-hidden, all removed on close) ----
  function clMake(tag,className,html){
    const node=clDoc().createElement(tag);
    if(className)node.className=className;
    node.setAttribute("aria-hidden","true");node.dataset.clDecor="1";
    if(html)node.innerHTML=html;
    return node;
  }
  // Inline style properties club.js place() writes on product elements; on close exactly these go back to what they
  // were, so anything the product writes meanwhile (its --club-* identity colours) stays.
  const PLACED_PROPS=Object.freeze(["left","top","width","height"]);
  function clRecord(node){
    if(!node||records.some(record=>record.node===node))return;
    const attrs={};for(const name of ["data-sd-enter","data-phone-role","data-phone-label"])attrs[name]=node.getAttribute(name);
    const style={};for(const name of PLACED_PROPS)style[name]=node.style.getPropertyValue(name);
    records.push({node,attrs,style,hadStyle:node.hasAttribute("style")});
  }
  function clHostMarkup(){
    const a=ASSET_BASE+"assets/";
    const pic=(cls,file,enter)=>`<picture class="${cls}"${enter?` data-sd-enter="${enter}"`:""}><source srcset="${a}${file}" type="image/webp" media="(max-width: 760px) and (orientation: portrait)"><img alt="" decoding="async"></picture>`;
    return {
      stage:'<div class="plateClip" aria-hidden="true" data-sd-enter="scene"><div class="world" id="world"></div></div>',
      kicker:"CAREER MODE SHOWDOWN 17",
      phone:`${pic("phoneSceneBackground","ENV_CLUB_PHONE_V1.webp","")}${pic("phoneHero phoneHeroDaniel","OVL_CLUB_DANIEL_PHONE_V1.webp","character-left")}${pic("phoneHero phoneHeroNik","OVL_CLUB_NIK_PHONE_V1.webp","character-right")}<div class="phoneHeroScrim"></div>`,
      footer:'<span class="footText">CM17<br>CAREER MODE SHOWDOWN 17</span><span class="footSlogan"><span>FOOTBALL BRINGS US TOGETHER</span><i class="crown"></i></span>'
    };
  }
  function clDecorate(section){
    const doc=clDoc(),markup=clHostMarkup(),h2=section.querySelector(":scope > h2");
    // Team V's motion classes land on product elements (the title, the club names, the confirmation); remember each
    // product element's own classes so only Team V's come off again.
    classStates=new Map([section,...section.querySelectorAll("*")].map(node=>[node,{had:node.hasAttribute("class"),motion:MOTION_CLASSES.filter(name=>node.classList.contains(name))}]));
    for(const selector of PLACED)for(const node of section.querySelectorAll(selector))clRecord(node);
    for(const [selector,attrs] of ATTRS){
      const node=section.querySelector(selector);if(!node)continue;clRecord(node);
      for(const [name,value] of Object.entries(attrs))node.setAttribute(name,value);
    }
    for(const step of section.querySelectorAll(".clubRevealProgress [data-reveal-step]")){clRecord(step);const label=PHONE_LABELS[step.dataset.revealStep];if(label)step.setAttribute("data-phone-label",label);}
    // Team V's stage: the plate world sits under everything (index.html #stage > .plateClip > #world).
    const stage=clMake("div","stage cl-stage",markup.stage);stage.id="stage";section.insertBefore(stage,section.firstChild);
    const before=h2&&h2.parentNode===section?h2:stage.nextSibling;
    const kicker=clMake("span","clubKicker");kicker.textContent=markup.kicker;
    const hero=clMake("div","phoneHeroStage",markup.phone),deck=clMake("div","phoneControlDeck");
    for(const node of [kicker,hero,deck])section.insertBefore(node,before);
    // The title keeps its own text node (screen readers); the brush-style copy is decoration.
    if(h2&&h2.firstChild&&h2.childNodes.length===1&&h2.firstChild.nodeType===3){
      const label=doc.createElement("span");label.className="sd-visually-hidden";label.dataset.clDecor="wrap";
      const title=h2.firstChild.nodeValue;h2.insertBefore(label,h2.firstChild);label.appendChild(label.nextSibling);
      const fallback=clMake("span","clubTitleFallback");fallback.textContent=title.trim();h2.appendChild(fallback);
    }
    // VS: the product's mark stays for assistive tech; Team V's brush VS is decoration.
    const vs=section.querySelector(".clubVs strong");
    if(vs&&vs.childNodes.length===1&&vs.firstChild.nodeType===3){
      const label=doc.createElement("span");label.className="sd-visually-hidden";label.dataset.clDecor="wrap";
      vs.insertBefore(label,vs.firstChild);label.appendChild(label.nextSibling);
      const fallback=clMake("span","clubVsFallback");fallback.textContent="VS";vs.appendChild(fallback);
    }
    // Phone: the duplicate matchup row lives in Team V's sheet wrapper (hidden on the phone surface, kept in the DOM).
    const matchup=section.querySelector(".clubRivalryMatchup");
    if(matchup&&matchup.parentNode){const sheet=doc.createElement("div");sheet.className="sd-sheet";sheet.dataset.phoneSheet="matchup";sheet.dataset.clDecor="wrap";matchup.parentNode.insertBefore(sheet,matchup);sheet.appendChild(matchup);}
    section.appendChild(clMake("footer","cl-footer",markup.footer));
  }
  function clUnwrap(node){
    const parent=node.parentNode;if(!parent)return;
    while(node.firstChild)parent.insertBefore(node.firstChild,node);
    node.remove();
  }
  // Team V's decorateDom() wraps two status lines and the button labels and adds aria-hidden glyphs; undo exactly that.
  function clUndecorate(section){
    for(const row of section.querySelectorAll(".ebRow, .stRow")){
      for(const glyph of row.querySelectorAll(":scope > svg"))glyph.remove();
      clUnwrap(row);
    }
    for(const node of section.querySelectorAll(".ring, .shieldSlot, .clubPackAnticipation, .clubAnticipationDim, .panelDivider, .bandSlot, .btnGlyph"))node.remove();
    for(const label of section.querySelectorAll(".btnLabel"))clUnwrap(label);
    for(const node of section.querySelectorAll("[data-cl-decor]"))if(node.dataset.clDecor==="wrap")clUnwrap(node);else node.remove();
    for(const button of section.querySelectorAll("button"))button.normalize();
  }
  function clRestore(){
    for(const {node,attrs,style,hadStyle} of records.splice(0)){
      for(const [name,value] of Object.entries(attrs)){if(value===null)node.removeAttribute(name);else node.setAttribute(name,value);}
      let placed=false;
      for(const [name,value] of Object.entries(style)){if(node.style.getPropertyValue(name)!==value)placed=true;if(value)node.style.setProperty(name,value);else node.style.removeProperty(name);}
      if(placed&&!hadStyle&&node.getAttribute("style")==="")node.removeAttribute("style");
    }
    for(const [node,{had,motion}] of classStates){
      const extra=MOTION_CLASSES.filter(name=>node.classList.contains(name)&&!motion.includes(name));
      for(const name of extra)node.classList.remove(name);
      if(extra.length&&!had&&node.getAttribute("class")==="")node.removeAttribute("class");
    }
    classStates=new Map();
  }
  // The product rewrites a button's text (setClubText / the shared presentation), which drops Team V's label wrapper and
  // glyphs; put them back around the product's new text so the look follows every state.
  function clGlyphs(section){
    const open=section.querySelector("#openClubPack");
    if(!open)return null;
    const lead=open.querySelector(":scope > .btnGlyph:not(.chevron)"),tail=open.querySelector(":scope > .btnGlyph.chevron");
    return {lead:lead?lead.outerHTML:"",tail:tail?tail.outerHTML:""};
  }
  function clRelabel(button){
    if(!button||button.querySelector(":scope > .btnLabel"))return;
    const text=Array.from(button.childNodes).find(node=>node.nodeType===3&&node.nodeValue.trim());
    if(!text)return;
    const label=clDoc().createElement("span");label.className="btnLabel";button.insertBefore(label,text);label.appendChild(text);
    if(button.id==="openClubPack"&&glyphs){label.insertAdjacentHTML("beforebegin",glyphs.lead);label.insertAdjacentHTML("afterend",glyphs.tail);}
  }
  function clWatchButtons(section){
    for(const id of ["openClubPack","continueClubAssignment"]){
      const button=section.querySelector(`#${id}`);if(!button||typeof root.MutationObserver!=="function")continue;
      const observer=new root.MutationObserver(()=>clRelabel(button));observer.observe(button,{childList:true});observers.push(observer);
    }
  }
  // A sealed side gets a crest only once the product has opened that pack; a changed club redraws its crest.
  function clSyncCrests(frame,section){
    ROLES.forEach((role,index)=>{
      const club=frame.clubs[role];
      if(crestFor[index]===club)return;
      crestFor[index]=club;
      const rim=section.querySelectorAll(".panelCrest .crestRim")[index];
      if(rim)rim.innerHTML=club&&typeof root.getClubCrestSvg==="function"?root.getClubCrestSvg(club):"";
      const crest=section.querySelector(`.reveal[data-side="${index}"] .rvCrest`);
      if(crest){crest.innerHTML="";delete crest.dataset.club;}
    });
  }
  // Team V's sealed shield carries one gradient id ("sg") and club.js draws it once per side; the second side's copy
  // gets its own id so the page keeps every id once.
  function clUniqueShieldIds(section){
    section.querySelectorAll(".shieldSlot .sealedShield").forEach((shield,index)=>{
      const gradient=index?shield.querySelector("linearGradient[id]"):null;
      if(!gradient||/-cl\d+$/.test(gradient.id))return;
      const id=`${gradient.id}-cl${index}`;
      for(const node of shield.querySelectorAll("[fill]"))if(node.getAttribute("fill")===`url(#${gradient.id})`)node.setAttribute("fill",`url(#${id})`);
      gradient.id=id;
    });
  }
  function clClearRoot(){
    const html=clDoc().documentElement;
    for(const name of ROOT_CLASSES)html.classList.remove(name);
    for(const name of ROOT_PROPS)html.style.removeProperty(name);
    if(html.getAttribute("style")==="")html.removeAttribute("style");
  }
  function clTeardown(section){
    for(const observer of observers.splice(0))observer.disconnect();
    if(sectionSize){sectionSize.disconnect();sectionSize=null;}
    if(mountedFrame&&root.ClubPlate&&root.ClubPlate.app){try{root.ClubPlate.app.unmount();}catch(_error){}}
    const host=section||mountedSection;
    if(host){
      clUndecorate(host);
      host.classList.remove("cl-on","sd-motion-ready");
      if(host.dataset)delete host.dataset.sdMotionReduced;
    }
    clRestore();
    if(mountedFrame)clClearRoot();
    mountedFrame=null;mountedSection=null;fx=null;crestFor=["",""];glyphs=null;
  }
  function clLayout(){if(mountedFrame&&root.ClubPlate&&root.ClubPlate.app)root.ClubPlate.app.layout();}
  function clUpdate(frame,section){
    fx.clubs={...frame.clubs};fx.frames=toPlateData(frame).fx.frames;
    clSyncCrests(frame,section);
    mountedFrame=frame;
    root.ClubPlate.app.frame(frame.frameId);
  }
  function clMount(frame,section){
    if(mountedFrame&&mountedSection===section&&section.classList.contains("cl-on")&&section.querySelector(":scope > .cl-stage")){
      try{clUpdate(frame,section);return;}catch(error){clWarn("Club Assignment visuals could not update.",error);}
    }
    clTeardown(section);
    try{
      section.classList.add("cl-on");
      clDecorate(section);
      const data=toPlateData(frame);fx=data.fx;
      mountedFrame=frame;mountedSection=section;crestFor=[frame.clubs.playerOne,frame.clubs.playerTwo];
      root.ClubPlate.app.mount({fx,map:platemap,hands:handmap,frame:data.frame});
      clUniqueShieldIds(section);
      glyphs=clGlyphs(section);
      clWatchButtons(section);
      // club.js measures the screen when it lays it out, and the screen's own styles switch on around mount
      // (js/v10Screens.js): lay it out again whenever the screen box changes size, and once the fonts are in.
      if(typeof root.ResizeObserver==="function"){
        let last="";
        sectionSize=new root.ResizeObserver(entries=>{const box=entries[0]&&entries[0].contentRect;const size=box?`${Math.round(box.width)}x${Math.round(box.height)}`:"";if(!size||size===last)return;const first=!last;last=size;if(!first)clLayout();});
        sectionSize.observe(section);
      }
      const fonts=root.document.fonts;
      if(fonts&&fonts.ready&&!fontsWait){fontsWait=true;fonts.ready.then(()=>{fontsWait=false;clLayout();},()=>{fontsWait=false;});}
      if(typeof root.sdEnter==="function"){try{root.sdEnter(section);}catch(_error){}}
    }catch(error){
      // Any failure leaves the app's own screen exactly as the product rendered it.
      clTeardown(section);
      clWarn("Club Assignment visuals unavailable; showing the standard screen.",error);
    }
  }
  let pending=false;
  function clSchedule(){
    if(pending)return;pending=true;
    Promise.resolve().then(()=>{
      pending=false;
      const screens=v10Screens();
      if(!screens||!registered)return;
      screens.show(SCREEN).catch(error=>clWarn("Club Assignment visuals could not update.",error));
    });
  }
  function clObserve(){
    const section=clSection(),doc=clDoc();
    if(!section||typeof root.MutationObserver!=="function")return;
    // The product's reveal stage and the shared presentation's role mark live on the section.
    new root.MutationObserver(clSchedule).observe(section,{attributes:true,attributeFilter:["data-club-reveal-stage","data-shared-presentation-role"]});
    for(const id of ["clubCardOne","clubCardTwo"]){const node=doc.getElementById(id);if(node)new root.MutationObserver(clSchedule).observe(node,{attributes:true,attributeFilter:["class"]});}
    for(const id of ["clubNameOne","clubNameTwo"]){const node=doc.getElementById(id);if(node)new root.MutationObserver(clSchedule).observe(node,{childList:true,characterData:true,subtree:true});}
  }
  async function clJson(file){
    const response=await root.fetch(typeof root.optionalAssetUrl==="function"?root.optionalAssetUrl(BASE+file):BASE+file);
    if(!response.ok)throw new Error("CLUB_V10_MAP");
    return response.json();
  }
  async function clMaps(){
    if(platemap&&handmap)return true;
    const [plate,hands]=await Promise.all([clJson(FILES.platemap),clJson(FILES.handmap)]);
    platemap=plate;handmap=hands;
    return true;
  }
  function clInstall(){
    if(installed||clNode||!root.document)return registered||Promise.resolve(null);
    installed=true;
    // Read by club.js when it loads: no self-start, and asset paths from the app page.
    root.CLUB_APP=true;root.CLUB_ASSET_BASE=clAbsolute(ASSET_BASE);
    registered=root.loadRuntimeScript("v10-screens","js/v10Screens.js",()=>Boolean(root.CareerModeV10Screens)).then(()=>{
      const screens=v10Screens().install();
      screens.register(SCREEN,{
        css:FILES.css.slice(),
        js:[FILES.script.slice()],
        prepare:()=>clMaps(),
        frame:()=>clFrame(),
        mount:(frame,host)=>clMount(frame,host),
        unmount:host=>clTeardown(host)
      });
      clObserve();
      if(typeof root.getActiveScreenName==="function"&&root.getActiveScreenName()===SCREEN)clSchedule();
      return screens;
    }).catch(error=>{registered=null;installed=false;clWarn("Club Assignment visuals unavailable.",error);return null;});
    return registered;
  }

  return Object.freeze({contractVersion:1,SCREEN,DIR,FILES,STAGES,FRAMES,toClubFrame,toPlateData,install:clInstall,
    isMounted:()=>Boolean(mountedFrame)});
});
