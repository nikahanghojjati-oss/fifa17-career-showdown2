(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeConnectPlayersScreenV10=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";
  // JOB-1015: a lazy presentation layer. The startup router and pairing operations stay untouched.
  const MARKUP=[
    "<section id=\"connectPlayersScreen\" role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"connectPlayersTitle\" aria-hidden=\"true\" class=\"connectPlayersLayer hidden\" data-role=\"unknown\" data-connection=\"none\">",
    "<div class=\"connectPlayersArt\" aria-hidden=\"true\">",
    "<img class=\"connectPlayersDaniel\" src=\"visual-assets/v10_1/start-join/assets/OVL_SJ_DANIEL_PHONE_V1.webp\" alt=\"\" loading=\"lazy\">",
    "<img class=\"connectPlayersNik\" src=\"visual-assets/v10_1/start-join/assets/OVL_SJ_NIK_PHONE_V1.webp\" alt=\"\" loading=\"lazy\">",
    "</div>",
    "<header class=\"connectPlayersHeader\">",
    "<p class=\"connectPlayersKicker\">CAREER MODE SHOWDOWN // 17</p>",
    "<h2 id=\"connectPlayersTitle\">CONNECT PLAYERS</h2>",
    "<p class=\"connectPlayersTagline\">Daniel and Nik must both be connected before the career begins.</p>",
    "</header>",
    "<div class=\"connectPlayersWorkspace\">",
    "<div class=\"connectPlayersTabRow\">",
    "<div class=\"connectPlayersTabs\" role=\"group\" aria-label=\"Connection steps\">",
    "<label><input type=\"radio\" name=\"connectPlayersTab\" id=\"connectPlayersDanielTab\" value=\"daniel\" checked><span>DANIEL \u00b7 START</span></label>",
    "<label><input type=\"radio\" name=\"connectPlayersTab\" id=\"connectPlayersNikTab\" value=\"nik\"><span>NIK \u00b7 JOIN</span></label>",
    "<label><input type=\"radio\" name=\"connectPlayersTab\" id=\"connectPlayersConnectionTab\" value=\"connection\"><span>CONNECTION</span></label>",
    "</div>",
    "<button class=\"connectPlayersBack\" type=\"button\">BACK</button>",
    "</div>",
    "<div class=\"connectPlayersRoles\">",
    "<section class=\"connectPlayersRole connectPlayersRoleDaniel\" aria-label=\"Daniel starts\">",
    "<span>PLAYER ONE</span><h3>DANIEL \u00b7 START</h3>",
    "<p>Choose seasons, create your code, and send it to Nik.</p>",
    "<button id=\"connectPlayersSetup\" class=\"menuButton\" type=\"button\">CHOOSE SEASONS</button>",
    "</section>",
    "<section class=\"connectPlayersRole connectPlayersRoleNik\" aria-label=\"Nik joins\">",
    "<span>PLAYER TWO</span><h3>NIK \u00b7 JOIN</h3>",
    "<p>On Nik's device, paste Daniel's code to join the rivalry.</p>",
    "</section>",
    "</div>",
    "<div id=\"connectPlayersPairSlot\" aria-live=\"polite\"></div>",
    "</div>",
    "</section>"
  ].join("\n");
  let layer=null,opening=null,opener=null,observer=null,homeObserver=null;
  const PRIMARY=/^(START A SHOWDOWN|CREATE CODE FOR NIK|JOIN DANIEL'S SHOWDOWN|START CAREER|TRY CONTINUE AGAIN)$/;
  const inertBefore=new Map();
  function byId(id){return root.document?.getElementById(id)||null;}
  function report(error){root.reportApplicationError?.("Unable to open Connect Players",error);}
  async function loadPair(){
    if(!root.CareerModePersistentNikDanielPair){
      await root.loadRuntimeScript("persistent-pair","js/persistentNikDanielPair.js",()=>root.CareerModePersistentNikDanielPair);
    }
    return root.CareerModePersistentNikDanielPair;
  }
  function updatePresentation(){
    if(!layer)return;
    const pair=root.CareerModePersistentNikDanielPair?.getState?.()||{};
    const identity=root.CareerModeOnlinePlayerIdentity?.getState?.()||{};
    const role=pair.managerRole||(identity.managerId==="daniel"?"playerOne":identity.managerId==="nik"?"playerTwo":null);
    layer.dataset.role=role==="playerOne"?"daniel":role==="playerTwo"?"nik":"unknown";
    layer.dataset.connection=pair.connectionState||"none";
    const mode=pair.connectionState?"connection":role==="playerTwo"?"nik":"daniel";
    if(layer.dataset.pairViewMode!==mode){
      layer.dataset.pairViewMode=mode;
      const tab=byId(mode==="connection"?"connectPlayersConnectionTab":mode==="nik"?"connectPlayersNikTab":"connectPlayersDanielTab");
      if(tab)tab.checked=true;
    }
    // pairRender owns every control and listener; its original inline skin is removed here only.
    const panel=byId("persistentNikDanielPairPanel");
    if(panel){
      panel.removeAttribute("style");for(const node of panel.querySelectorAll("[style]"))node.removeAttribute("style");
      // Team V's design: the yellow title above is the only CONNECT PLAYERS heading; main actions are solid yellow.
      for(const heading of panel.querySelectorAll(":scope>strong"))heading.classList.toggle("connectPlayersRepeat",heading.textContent.trim()==="CONNECT PLAYERS");
      for(const button of panel.querySelectorAll("button"))button.classList.toggle("connectPlayersPrimary",PRIMARY.test(button.textContent.trim()));
    }
  }
  function setBackgroundInert(active){
    if(active){
      for(const node of layer.parentElement.children){
        if(node===layer)continue;
        if(!inertBefore.has(node))inertBefore.set(node,node.inert);
        node.inert=true;
      }
    }else{
      for(const [node,value] of inertBefore)node.inert=value;
      inertBefore.clear();
    }
  }
  function close(options={}){
    if(!layer)return false;
    layer.classList.add("hidden");layer.setAttribute("aria-hidden","true");
    setBackgroundInert(false);
    if(options.restoreFocus!==false){
      const target=opener?.isConnected&&opener.getClientRects().length?opener:byId("newShowdown");
      target?.focus?.();
    }
    return true;
  }
  async function chooseSeasons(){
    close({restoreFocus:false});
    if(typeof root.navigateTo==="function")return root.navigateTo("createShowdown");
    return root.showScreen?.("createShowdown");
  }
  function ensureLayer(){
    if(layer?.isConnected)return layer;
    const doc=root.document,app=byId("app");
    if(!doc||!app)throw new Error("The application layer is unavailable.");
    const holder=doc.createElement("div");holder.innerHTML=MARKUP;layer=holder.firstElementChild;
    app.appendChild(layer);
    layer.querySelector(".connectPlayersBack").addEventListener("click",()=>close());
    byId("connectPlayersSetup").addEventListener("click",()=>void chooseSeasons().catch(report));
    layer.addEventListener("click",event=>{
      const button=event.target.closest?.("#persistentNikDanielPairPanel button");
      if(button&&!button.disabled&&/^(START CAREER|TRY CONTINUE AGAIN|RESTORE BACKUP)$/.test(button.textContent.trim()))close({restoreFocus:false});
    },true);
    layer.addEventListener("keydown",event=>{
      if(event.key==="Escape"){event.preventDefault();event.stopPropagation();close();return;}
      if(event.key!=="Tab")return;
      const nodes=[...layer.querySelectorAll("button:not(:disabled),input:not(:disabled)")].filter(node=>node.getClientRects().length);
      const first=nodes[0],last=nodes[nodes.length-1];
      if(event.shiftKey&&doc.activeElement===first){event.preventDefault();last?.focus();}
      else if(!event.shiftKey&&doc.activeElement===last){event.preventDefault();first?.focus();}
    });
    if(typeof root.MutationObserver==="function"){
      observer=new root.MutationObserver(updatePresentation);
      observer.observe(byId("connectPlayersPairSlot"),{childList:true,subtree:true});
      const home=byId("mainMenu");
      if(home){
        homeObserver=new root.MutationObserver(()=>{if(home.classList.contains("hidden")&&!layer.classList.contains("hidden"))close({restoreFocus:false});});
        homeObserver.observe(home,{attributes:true,attributeFilter:["class"]});
      }
    }
    return layer;
  }
  async function open(options={}){
    if(opening)return opening;
    opening=(async()=>{
      const pair=await loadPair();
      ensureLayer();
      if(typeof root.loadRuntimeStyle!=="function")throw new Error("Connect Players styles are unavailable.");
      await root.loadRuntimeStyle("connect-players-v10","css/connectPlayersV10.css");
      opener=root.document.activeElement;
      const home=typeof root.navigateTo==="function"
        ? await root.navigateTo("mainMenu",{addToHistory:false,allowCanonicalFallback:false})
        : root.showScreen?.("mainMenu",false);
      if(home===false)throw new Error("Home could not be opened safely.");
      pair?.render?.();updatePresentation();
      layer.classList.remove("hidden");layer.setAttribute("aria-hidden","false");setBackgroundInert(true);
      const focus=layer.querySelector("#persistentNikDanielPairCode,#persistentNikDanielPairPanel button")||byId("connectPlayersSetup");
      focus?.focus?.();
      if(options.sync!==false){await root.CareerModeOnlinePlayerIdentity?.syncPair?.();pair?.render?.();updatePresentation();}
      return layer;
    })().finally(()=>{opening=null;});
    return opening;
  }
  return Object.freeze({open,close});
});
