(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeSpecialPlayerChip=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  // r86 Special Player chip (Nik 2026-10-29): every Showdown confirmed on r86 or later gives each manager one Special Player
  // (js/marqueePlayer.js, the same draw the reveal shows). The career screens show it as a small chip next to that manager's
  // name: "SP", the player's name, then his ranking badge in the tier colour (top 3 black-blue-gold, top 10 blue-gold,
  // top 20 gold, top 50 silver, the rest bronze); on a phone it shortens to "SP · Name" in the tier colour.
  // It is flavour only (no points). It is read from what the screens already hold (a finished Showdown's id and confirm
  // time, or the live Setup's): no Firebase read, no write, nothing stored. A Showdown from before r86 has none, so it shows
  // no chip and never an error. Screen text says "Special Player" or "SP" only (Nik's naming rule).
  // The draw data loads with each screen's own files (ensure() in its prepare step), so the chip is drawn with the screen's
  // first frame and never pops in later.
  const node=typeof module!=="undefined"&&module.exports;
  const STYLE_ID="cmsSpecialPlayerChipStyle";
  const MANAGERS=Object.freeze(["daniel","nik"]);
  const TIERS=Object.freeze({"black-blue-gold":"TOP 3","blue-gold":"TOP 10",gold:"TOP 20",silver:"TOP 50",bronze:"TOP 300"});
  const RULE=Object.freeze({label:"SPECIAL PLAYER",text:"At the start of every Showdown each manager draws one FIFA 17 player, shown on the reveal screen. Flavour only: it scores no points."});

  function spDraw(){
    if(root.CareerModeMarqueePlayer&&root.CareerModeMarqueePlayers)return root.CareerModeMarqueePlayer;
    return node?require("./marqueePlayer.js"):null;
  }
  function spReady(){return Boolean(node||root.CareerModeMarqueePlayer&&root.CareerModeMarqueePlayers);}
  function spChip(player){
    if(!player||typeof player.name!=="string"||!player.name||!Number.isInteger(player.rank)||!Object.hasOwn(TIERS,player.tier))return null;
    return Object.freeze({name:player.name,club:typeof player.club==="string"&&player.club?player.club:null,rank:player.rank,tier:player.tier,badge:`#${player.rank} ${TIERS[player.tier]}`});
  }
  // {daniel, nik} for one Showdown (Daniel is playerOne, Nik playerTwo), or null: not r86, no confirm time, data not loaded.
  function spForShowdown(rivalryId,confirmedAt){
    try{
      const draw=spDraw(),pair=draw&&typeof draw.forShowdown==="function"?draw.forShowdown(rivalryId,confirmedAt):null;
      if(!pair)return null;
      const daniel=spChip(pair.playerOne),nik=spChip(pair.playerTwo);
      return daniel&&nik?Object.freeze({daniel,nik}):null;
    }catch(_error){return null;}
  }
  // A History row (js/sharedCareerAnalytics.js) carries its rivalryId and setupConfirmedAt.
  function spForRow(row){return row&&typeof row==="object"?spForShowdown(row.rivalryId,row.setupConfirmedAt):null;}
  function spState(name){try{return root[name]?.getState?.()??null;}catch(_error){return null;}}
  // The live Showdown: the confirmed shared Setup's rivalry and confirm time (the Setup read the game already made). When
  // the game or the pair names another rivalry (a new Showdown, or another save), there is no live Special Player.
  function spLive(){
    const setup=spState("CareerModeProductionSharedShowdownSetup");
    if(!setup||setup.ready!==true||setup.setup?.phase!=="SHOWDOWN_CONFIRMED"||typeof setup.rivalryId!=="string"||!Number.isFinite(setup.setupUpdatedAtMs))return null;
    let journey=null;
    try{const showdown=typeof currentShowdown!=="undefined"?currentShowdown:null;journey=showdown?.sharedJourney?.mode==="shared"&&typeof showdown.sharedJourney.rivalryId==="string"?showdown.sharedJourney.rivalryId:null;}catch(_error){journey=null;}
    if(journey&&journey!==setup.rivalryId)return null;
    const pair=spState("CareerModePersistentNikDanielPair"),paired=pair?.rivalryId||pair?.closedRivalryId||null;
    if(typeof paired==="string"&&paired&&paired!==setup.rivalryId)return null;
    return spForShowdown(setup.rivalryId,setup.setupUpdatedAtMs);
  }
  // The live Showdown when it is rivalryId (or any live one when rivalryId is not given).
  function spLiveFor(rivalryId){
    if(rivalryId==null)return spLive();
    const setup=spState("CareerModeProductionSharedShowdownSetup");
    return setup?.rivalryId===rivalryId?spLive():null;
  }
  // Career-wide screens (Career Statistics, Trophy Room, the Standings Career view): the live Showdown's Special Players,
  // else those of the most recently confirmed Showdown that has them.
  function spLatest(rows){
    const live=spLive();if(live)return live;
    let best=null,at=-Infinity;
    for(const row of Array.isArray(rows)?rows:[]){
      if(!row||!Number.isFinite(row.setupConfirmedAt)||row.setupConfirmedAt<=at)continue;
      const sp=spForRow(row);if(sp){best=sp;at=row.setupConfirmedAt;}
    }
    return best;
  }
  function spEsc(value){return String(value).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
  function spTitle(chip){return `Special Player: ${chip.name} · ${chip.badge}`;}
  function spValid(chip){return Boolean(chip&&typeof chip.name==="string"&&chip.name&&Object.hasOwn(TIERS,chip.tier)&&typeof chip.badge==="string");}
  // The chip as markup (for renderers that build strings), or "" when there is none.
  function spHtml(chip){
    if(!spValid(chip))return "";
    return `<span class="spChip spChip--${chip.tier}" data-sp-chip="true" data-sp-tier="${chip.tier}" title="${spEsc(spTitle(chip))}"><span class="spChipTag">SP</span><span class="spChipName">${spEsc(chip.name)}</span><span class="spChipRank">${spEsc(chip.badge)}</span></span>`;
  }
  // The chip as an element (for renderers that build nodes), or null.
  function spElement(doc,chip){
    if(!doc||typeof doc.createElement!=="function"||!spValid(chip))return null;
    const el=doc.createElement("span");el.className=`spChip spChip--${chip.tier}`;el.dataset.spChip="true";el.dataset.spTier=chip.tier;el.title=spTitle(chip);
    for(const [cls,text] of [["spChipTag","SP"],["spChipName",chip.name],["spChipRank",chip.badge]]){const part=doc.createElement("span");part.className=cls;part.textContent=text;el.appendChild(part);}
    return el;
  }
  // Career Start: the player's original club (the club in the FIFA 17 launch list), so the manager can sign him in-game.
  function spClubLine(chip){return spValid(chip)?`${chip.name} · ${chip.club||"No club"}`:"";}

  // Marble black-and-gold (the r78 tile and the shared gold tokens, as the r84 Golden Showdown); the tier colour sits on the
  // SP tag and the ranking badge. Inline next to the name: it never covers, dims or moves anything else.
  const CSS=String.raw`
#app .spChip{--sp-tier-bg:linear-gradient(180deg,#d39a5c,#8a5428);--sp-tier-ink:#fff4e6;--sp-tier-edge:#e7b07a;
  display:inline-flex;align-items:center;gap:.4em;max-width:100%;min-width:0;margin:0 0 0 .45em;padding:.14em .5em .14em .16em;
  vertical-align:middle;box-sizing:border-box;border:1px solid var(--sp-tier-edge);border-radius:999px;
  background:linear-gradient(180deg,rgba(73,55,8,.45),rgba(13,12,10,.82)),#0d0c0a url("css/r78-marble-tile.webp") 0 0/256px 256px repeat;
  box-shadow:inset 0 0 0 1px rgba(17,15,12,.9),0 1px 2px rgba(0,0,0,.5);
  color:var(--sd-gold-200,#fff1b8);font-family:var(--sd-font-condensed,"Barlow Condensed",Arial,sans-serif);font-size:11px;font-style:normal;
  font-weight:600;line-height:1.25;letter-spacing:.03em;text-transform:none;text-align:left;text-shadow:none;white-space:nowrap;}
#app .spChip>span{display:inline-block;min-width:0;font-size:inherit;font-family:inherit;line-height:inherit;letter-spacing:inherit;text-transform:none;text-align:left;white-space:nowrap;}
#app .spChip .spChipTag{flex:none;padding:.08em .42em;border-radius:999px;background:var(--sp-tier-bg);color:var(--sp-tier-ink);font-weight:800;letter-spacing:.1em;}
#app .spChip .spChipName{flex:0 1 auto;overflow:hidden;text-overflow:ellipsis;color:#f6eedb;}
#app .spChip .spChipRank{flex:none;padding:.04em .4em;border:1px solid var(--sp-tier-edge);border-radius:2px;background:var(--sp-tier-bg);color:var(--sp-tier-ink);font-weight:700;letter-spacing:.06em;}
#app .spChip--black-blue-gold{--sp-tier-bg:linear-gradient(135deg,#050608 0%,#0c2a66 55%,#050608 100%);--sp-tier-ink:var(--sd-gold-300,#ffd34d);--sp-tier-edge:var(--sd-gold-500,#f5c518);}
#app .spChip--blue-gold{--sp-tier-bg:linear-gradient(180deg,#1d4fa3,#0b2558);--sp-tier-ink:var(--sd-gold-300,#ffd34d);--sp-tier-edge:var(--sd-gold-600,#e0ae3a);}
#app .spChip--gold{--sp-tier-bg:linear-gradient(180deg,#ffe07a,#c99718);--sp-tier-ink:#1a1205;--sp-tier-edge:var(--sd-gold-500,#f5c518);}
#app .spChip--silver{--sp-tier-bg:linear-gradient(180deg,#f1f3f5,#9aa3ad);--sp-tier-ink:#14171a;--sp-tier-edge:#c9d0d6;}
#app .spChip--bronze{--sp-tier-bg:linear-gradient(180deg,#d39a5c,#8a5428);--sp-tier-ink:#fff4e6;--sp-tier-edge:#e7b07a;}
#app .spChipPair{display:flex;flex-wrap:wrap;align-items:center;gap:.3em .9em;}
#app .spChipPair>span{display:inline-flex;align-items:center;min-width:0;max-width:100%;}
/* Each screen's own spot, next to (or just under) the manager's name, inside that name's own cell or box. */
#app #careerStatistics .careerTable td>.spChip{display:flex;width:max-content;max-width:100%;margin:3px 0 0;}
/* Trophy Room: on the rank card's first line, after "#1 DANIEL" (the card keeps its height). */
#app #trophyRoom .careerRank>span{display:inline-flex;align-items:center;max-width:calc(100% - 2.4em);min-width:0;vertical-align:bottom;white-space:nowrap;}
#app #trophyRoom .careerRank .spChip{flex:0 1 auto;min-width:0;margin:0 0 0 .5em;letter-spacing:.03em;}
/* Legacy / History: one line under the two managers of each Showdown card, Daniel's on the left and Nik's on the right. */
#app #legacy .legacyCardSpecial{display:flex;justify-content:space-between;align-items:center;gap:6px;min-width:0;margin:6px 0 0;}
#app #legacy .legacyCardSpecial .spChip{flex:0 1 auto;min-width:0;max-width:calc(50% - 3px);margin:0;}
#app #legacy .legacyHistorySpecialPlayers{margin:.4em 0 .6em;font-size:12px;color:#d8cfb8;}
#app #statistics .rv-manager .spChip{margin:.25em 0 0;}
#app #statistics .rv-manager .rvSpecialPlayer{display:block;min-width:0;}
#app #statistics .rv-manager--right .rvSpecialPlayer{text-align:right;}
/* Standings styles every span in a manager's side (and hides them on phones): the chip's own parts are set back here. */
#app #standings.standingsScreenV10 .sdg-side span.sdgSpecialPlayer{display:block;min-width:0;max-width:100%;font-size:inherit;text-align:center;}
#app #standings.standingsScreenV10 .sdg-side span.spChip{display:inline-flex;margin:.2em 0 0;font-size:11px;}
#app #standings.standingsScreenV10 .sdg-side .spChip>span{display:inline-block;font-size:inherit;text-transform:none;}
#app #seasonEntry .finalWinnerManager .fwSpecialPlayer{display:block;min-width:0;}
#app #seasonEntry .finalWinnerManager .spChip{margin:.2em 0 .1em;}
#app #seasonEntry .seasonManagerHeader .seasonSpecialPlayer{display:block;min-width:0;max-width:100%;margin:.2em 0 0;}
#app #seasonEntry .seasonManagerHeader .spChip{margin:0;}
#app #ruleBook .ruleSpecialPlayer .spChip{margin:0 0 0 .35em;}
#app #ruleBook .ruleSpecialPlayer .ruleSpecialPlayerTag{display:inline-flex;margin:0;padding:.08em .42em;border-radius:999px;background:linear-gradient(135deg,#050608 0%,#0c2a66 55%,#050608 100%);color:var(--sd-gold-300,#ffd34d);font-size:11px;font-weight:800;letter-spacing:.1em;vertical-align:middle;}
/* Tight spots ("SP · Name" in the tier colour: the badge's colour moves onto the whole chip, its full text stays in the
   title): the Career Table's narrow Manager column, the Trophy Room rank cards and the Legacy cards on every size, and
   every chip on phones and narrow windows. */
:is(#app #careerStatistics .careerTable,#app #trophyRoom .careerRank,#app #legacy .legacyCardSpecial) .spChip{gap:.3em;padding:.1em .45em .1em .12em;font-size:10.5px;background:var(--sp-tier-bg);color:var(--sp-tier-ink);}
:is(#app #careerStatistics .careerTable,#app #trophyRoom .careerRank,#app #legacy .legacyCardSpecial) .spChip .spChipRank{display:none;}
:is(#app #careerStatistics .careerTable,#app #trophyRoom .careerRank,#app #legacy .legacyCardSpecial) .spChip .spChipTag{background:rgba(5,6,8,.78);color:var(--sd-gold-300,#ffd34d);}
:is(#app #careerStatistics .careerTable,#app #trophyRoom .careerRank,#app #legacy .legacyCardSpecial) .spChip .spChipTag::after{content:" ·";}
:is(#app #careerStatistics .careerTable,#app #trophyRoom .careerRank,#app #legacy .legacyCardSpecial) .spChip .spChipName{color:inherit;}
@media (max-width:640px){
  #app .spChip{gap:.3em;padding:.1em .45em .1em .12em;font-size:10.5px;background:var(--sp-tier-bg);color:var(--sp-tier-ink);}
  #app .spChip .spChipRank{display:none;}
  #app .spChip .spChipTag{background:rgba(5,6,8,.78);color:var(--sd-gold-300,#ffd34d);}
  #app .spChip .spChipTag::after{content:" ·";}
  #app .spChip .spChipName{color:inherit;max-width:9.5em;}
  /* Phone rank cards are centred columns: the chip takes its own centred line under the name. */
  #app #trophyRoom .careerRank>span{display:inline;max-width:none;}
  #app #trophyRoom .careerRank .spChip{display:flex;width:max-content;max-width:100%;margin:.25em auto 0;}
  #app #standings.standingsScreenV10 .sdg-side .spChip>span.spChipRank{display:none;}
}
/* Rivalry: the manager row is one short grid line at most sizes, so the chip joins the name's line
   ("DANIEL [SP · Name]", "[SP · Name] NIK") and the club stays on its own line below; the box keeps its height. */
#app #statistics[data-rivalry-legacy-v10] .rv-manager>div:has(>.rvSpecialPlayer){display:flex;flex-wrap:wrap;align-items:center;column-gap:5px;min-width:0;}
#app #statistics[data-rivalry-legacy-v10] .rv-manager--right>div:has(>.rvSpecialPlayer){justify-content:flex-end;}
#app #statistics[data-rivalry-legacy-v10] .rv-manager>div:has(>.rvSpecialPlayer)>[id^="rvClub"]{flex:0 0 100%;order:2;}
#app #statistics[data-rivalry-legacy-v10] .rv-manager--right>div>span.rvSpecialPlayer{order:-1;}
#app #statistics[data-rivalry-legacy-v10] .rv-manager span.rvSpecialPlayer{display:flex;flex:0 1 auto;min-width:0;max-width:100%;overflow:visible;font-size:inherit;line-height:inherit;}
#app #statistics[data-rivalry-legacy-v10] .rv-manager span.spChip{display:inline-flex;min-width:0;max-width:100%;margin:0;font-size:10.5px;line-height:1.2;}
#app #statistics[data-rivalry-legacy-v10] .rv-manager .spChip>span{display:inline-block;font-size:inherit;line-height:inherit;}
#app #statistics[data-rivalry-legacy-v10] .rv-manager .spChip>span.spChipName{overflow:hidden;text-overflow:ellipsis;}
@media (max-width:900px){
  #app #statistics[data-rivalry-legacy-v10] .rv-manager span.spChip{font-size:10px;}
  #app #statistics[data-rivalry-legacy-v10] .rv-manager .spChip>span.spChipName{max-width:6.5em;}
  #app #statistics[data-rivalry-legacy-v10] .rv-manager .spChip>span.spChipRank{display:none;}
}
`;
  function spInstall(doc=root.document){
    try{
      if(!doc||typeof doc.createElement!=="function"||doc.getElementById?.(STYLE_ID))return Boolean(doc&&doc.getElementById?.(STYLE_ID));
      const style=doc.createElement("style");style.id=STYLE_ID;style.textContent=CSS;(doc.head||doc.documentElement).appendChild(style);return true;
    }catch(_error){return false;}
  }
  // Loads the list and the draw (the same files and keys the reveal uses, shell-cached) and the chip's style, before a
  // screen's first frame. Never rejects: false means no chip, and the screen opens as before.
  let ensuring=null;
  function spEnsure(){
    if(node)return Promise.resolve(true);
    if(spReady()){spInstall();return Promise.resolve(true);}
    if(ensuring)return ensuring;
    const load=(key,path,ready)=>ready()?Promise.resolve(true):typeof root.loadRuntimeScript==="function"?Promise.resolve(root.loadRuntimeScript(key,path,ready)).then(()=>Boolean(ready())):Promise.resolve(false);
    const run=Promise.resolve()
      .then(()=>load("marquee-player-list","data/marqueePlayers.js",()=>Boolean(root.CareerModeMarqueePlayers)))
      .then(ok=>ok&&load("marquee-player","js/marqueePlayer.js",()=>Boolean(root.CareerModeMarqueePlayer)))
      .then(ok=>{if(ok)spInstall();return Boolean(ok);})
      .catch(()=>false)
      .finally(()=>{if(ensuring===run)ensuring=null;});
    ensuring=run;return run;
  }

  return Object.freeze({contractVersion:1,feature:"cms-special-player-chip",managers:MANAGERS,tiers:TIERS,rule:RULE,css:CSS,styleId:STYLE_ID,
    ready:spReady,ensure:spEnsure,install:spInstall,chip:spChip,forShowdown:spForShowdown,forRow:spForRow,live:spLive,liveFor:spLiveFor,latest:spLatest,
    html:spHtml,element:spElement,title:spTitle,clubLine:spClubLine});
});
