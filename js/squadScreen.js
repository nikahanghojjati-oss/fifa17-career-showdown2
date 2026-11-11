(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeSquadScreen=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  // r91 / 2.4.0 Squad Management screen (prototype on claude-gameplay/r91-squad-screen). Laid out like FIFA 17's Squad
  // screen from Nik's reference videos (2026-11-11): a SQUAD / FORMATIONS tab bar, the focused player's card on top, the
  // tilted pitch with the XI, and the SUBSTITUTES shelf that slides up over the pitch to show the RESERVES when the
  // cursor moves down to it ("scrolling between players"). FORMATIONS shows a large preview and a three-card carousel of
  // every formation, the current one marked, as in FIFA.
  // Every rule lives in js/squadSheet.js; this file only draws the sheet and turns taps, drags and keys into its moves.
  // House rules: no dimming, nothing covers a button, 12 px type floor, no boxed page title, plain JS.
  const doc=root.document;
  const LINE_CLASS={GK:"gk",DEF:"def",MID:"mid",ATT:"att"};
  const FIT_WORD={3:"Natural position",2:"Can play here",1:"Out of position",0:"Stand-in"};
  const STAGE_WORD={pre:"Before Russian Roulette",post:"After Transfer War"};
  const REASON_WORD={contract:"Contract ended",retired:"Retired",swapped:"Swapped",sold:"Sold",loaned:"Loaned out",other:"Other"};
  const el=(tag,cls,text)=>{const n=doc.createElement(tag);if(cls)n.className=cls;if(text!==undefined&&text!==null)n.textContent=String(text);return n;};
  const many=(n,word)=>`${n} ${word}${n===1?"":"s"}`;
  const shortName=name=>{const s=String(name||"");const dot=s.indexOf(". ");return dot>0&&dot<4?s.slice(dot+2):s;};

  // ---------- shirts (js/kits17.js drawFlat, cached as images) ----------
  const shirtCache=new Map();
  // The same js/kits17.js shirts as the Russian Roulette board (all 98 approved clubs): the keeper's shade is picked
  // against the rival's kit too (vsClub), exactly as the board does, so a keeper wears the same colour on both screens.
  // (the shirts carry no number, so one image per club, role and rival: never one per shirt number)
  function shirtUrl(club,role,vsClub){
    const key=`${club}|${role}|${vsClub||""}`;
    if(shirtCache.has(key))return shirtCache.get(key);
    let url="";
    try{
      const kits=root.CareerModeKits17;
      if(kits&&typeof kits.drawFlat==="function"){
        const c=doc.createElement("canvas");c.width=112;c.height=120;
        const g=c.getContext("2d");kits.drawFlat(g,club,56,60,108,{role,vsClub:vsClub||undefined});// no number: the board's shirts carry none either
        url=c.toDataURL("image/png");
      }
    }catch(e){url="";}
    shirtCache.set(key,url);
    return url;
  }
  function shirt(club,player,slotPos,vsClub){
    const role=(slotPos==="GK"||(!slotPos&&player&&player.positions[0]==="GK"))?"gk":"outfield";
    const url=shirtUrl(club,role,vsClub);
    const box=el("span","sqmShirt"+(role==="gk"?" is-gk":""));
    if(url){const im=el("img");im.alt="";im.src=url;im.draggable=false;box.appendChild(im);}
    else box.classList.add("is-plain");
    return box;
  }

  // Nationality from the FIFA 17 data (club row first, then any club for a signing).
  let nations=null;
  function nationOf(club,p){
    const d=root.CareerModeFifa17Players;if(!d||!p)return "";
    if(!nations){nations=new Map();for(const [c,data] of Object.entries(d.clubs))for(const row of data.players){nations.set(`${c}|${row[0]}|${row[4]}`,row[5]);if(!nations.has(`*|${row[0]}`))nations.set(`*|${row[0]}`,row[5]);}}
    return (p.signedSeason?null:nations.get(`${club}|${p.name}|${p.number}`))||nations.get(`*|${p.name}`)||"";
  }

  // ---------- pitch geometry: a fixed trapezoid (FIFA's tilted pitch) ----------
  const TOP=.74;// top edge width as a share of the bottom edge
  function project(x,y){
    const v=y/100,t=v<0?v:v>1?1+(v-1)*1.12:Math.pow(v,1.12),w=TOP+(1-TOP)*t;
    return {left:50+(x-50)*w,top:4+t*90,scale:.86+.14*t};
  }
  function pitchSvg(){
    const P=(x,y)=>{const p=project(x,y);return `${p.left},${p.top}`;};
    const line=(pts)=>`<polyline points="${pts.map(([x,y])=>P(x,y)).join(" ")}" />`;
    const arc=(cx,cy,r,from,to,n=24)=>{const pts=[];for(let i=0;i<=n;i+=1){const a=from+(to-from)*i/n;pts.push([cx+Math.cos(a)*r,cy+Math.sin(a)*r*1.35]);}return line(pts);};
    let stripes="";
    for(let i=0;i<10;i+=1){const y0=i*10,y1=y0+10;stripes+=`<polygon class="${i%2?"b":"a"}" points="${P(0,y0)} ${P(100,y0)} ${P(100,y1)} ${P(0,y1)}" />`;}
    return `<svg class="sqmPitchSvg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      <polygon class="side" points="${P(-3,102)} ${P(103,102)} ${P(103,102).split(",")[0]},${project(103,102).top+3.2} ${P(-3,102).split(",")[0]},${project(-3,102).top+3.2}" />
      <polygon class="edge" points="${P(-3,-2)} ${P(103,-2)} ${P(103,102)} ${P(-3,102)}" />
      ${stripes}
      <g class="lines">${line([[0,0],[100,0],[100,100],[0,100],[0,0]])}${line([[0,50],[100,50]])}${arc(50,50,9,0,Math.PI*2,40)}
      ${line([[22,0],[22,15],[78,15],[78,0]])}${line([[37,0],[37,5],[63,5],[63,0]])}${arc(50,15,7,0,Math.PI)}
      ${line([[22,100],[22,85],[78,85],[78,100]])}${line([[37,100],[37,95],[63,95],[63,100]])}${arc(50,85,7,Math.PI,Math.PI*2)}</g>
    </svg>`;
  }

  // ---------- the screen ----------
  // options: {sheet, club, onLock(sheet, ops), draft:{read,write}, locked}
  function sqmMount(host,options){
    const S=root.CareerModeSquadSheet;
    if(!host||!S||!options||!options.sheet)return null;
    const base=options.sheet,club=options.club||base.club,rival=options.rival||null;
    // Crests on the shirts come from js/visualIdentity.js; once they are loaded the shirts are painted again with them.
    try{const kits=root.CareerModeKits17;if(kits&&typeof kits.prepare==="function")Promise.resolve(kits.prepare([club].concat(rival?[rival]:[]))).then(()=>{if(!host.isConnected||!host.classList.contains("sqm"))return;shirtCache.clear();sqmRender();}).catch(()=>{});}catch(e){}
    const formations=S.formations(),byName=new Map(formations.map(f=>[f.name,f]));
    let ops=readDraft(),sheet=S.apply(base,ops).sheet;
    let tab="squad",cursor={zone:"xi",index:0},picked=null,drag=null,locked=Boolean(options.locked),saving=false;
    // Where the last tap landed: the status repeats right there on a phone, so the reason a move was refused is in view
    // without scrolling to the club panel (nothing floats over the squad).
    let noteAt=null,lastRef=null;
    const note=zone=>{if(!message||noteAt!==zone)return null;const n=el("p","sqmNote",message);n.dataset.kind=messageKind;n.setAttribute("aria-hidden","true");return n;};
    let carousel=Math.max(0,formations.findIndex(f=>f.name===sheet.formation)),message="",messageKind="";
    // The Formations search (Nik 2026-11-11: "they can search and find the full list"): the carousel walks the matches.
    let formQuery="",shown=formations;
    function searchFor(query){
      const focus=shown[carousel]&&shown[carousel].name;
      formQuery=query;const names=new Set(S.searchFormations(query));shown=formQuery.trim()?formations.filter(f=>names.has(f.name)):formations;
      const at=shown.findIndex(f=>f.name===focus);carousel=at>=0?at:Math.max(0,shown.findIndex(f=>f.name===sheet.formation));
    }
    let pendingLeave=null;

    // The draft (this phone only, until LOCK) goes through options.draft = {read() -> ops[], write(ops)}; the game wires it
    // to its storage module, the prototype to the browser's.
    function readDraft(){try{const list=options.draft&&options.draft.read();return Array.isArray(list)?list:[];}catch(e){return [];}}
    function saveDraft(){try{if(options.draft)options.draft.write(ops.slice());}catch(e){}}
    function commit(op){
      const r=S.apply(sheet,[op]);
      if(r.errors.length){say(r.errors[0].reason,"no");return false;}
      ops=ops.concat([op]);sheet=r.sheet;saveDraft();return true;
    }
    function say(text,kind){
      message=text||"";messageKind=kind||"";
      const live=host.querySelector(".sqmLive");if(live){live.textContent=message;live.dataset.kind=messageKind;}
      if(!text)noteAt=null;
    }
    const playerAt=ref=>!ref?null:ref.zone==="xi"?sheet.xi[ref.index]:ref.zone==="bench"?sheet.bench[ref.index]:sheet.reserves[ref.index]||null;
    const same=(a,b)=>a&&b&&a.zone===b.zone&&a.index===b.index;
    const slotOf=ref=>ref&&ref.zone==="xi"?sheet.slots[ref.index]:null;

    host.classList.add("sqm");
    host.innerHTML="";
    const backdrop=el("div","sqmBackdrop");backdrop.setAttribute("aria-hidden","true");
    backdrop.innerHTML='<i class="sky"></i><i class="roof"></i><i class="stand"></i><i class="ads"></i><i class="grass"></i>';
    const layout=el("div","sqmLayout");
    const panel=el("section","sqmPanel");panel.setAttribute("aria-label","Squad");
    const side=el("aside","sqmSide");
    layout.append(panel,side);
    const live=el("p","sqmLive");live.setAttribute("role","status");live.setAttribute("aria-live","polite");
    host.append(backdrop,layout);

    // ----- render -----
    function sqmRender(){
      panel.innerHTML="";
      const tabs=el("div","sqmTabs");tabs.setAttribute("role","tablist");
      for(const [id,label] of [["squad","Squad"],["formations","Formations"]]){
        const b=el("button","sqmTab"+(tab===id?" is-on":""),label);b.type="button";b.setAttribute("role","tab");b.setAttribute("aria-selected",String(tab===id));
        b.addEventListener("click",()=>{tab=id;picked=null;sqmRender();});tabs.appendChild(b);
      }
      panel.appendChild(tabs);
      if(tab==="squad")renderSquad();else renderFormations();
      renderSide();
    }

    function card(player,ref){
      const c=el("div","sqmCard");
      if(!player){c.appendChild(el("p","sqmCardEmpty","Empty place"));return c;}
      const slot=slotOf(ref),line=S.lineOf(slot||player.positions[0]||"")||"MID";
      const f=slot?S.slotFit(sheet,player,slot):3;
      c.appendChild(shirt(club,player,slot,rival));
      const pos=el("span","sqmCardPos "+LINE_CLASS[line]);pos.appendChild(el("i","sqmDot fit"+(slot?f:3)));pos.appendChild(doc.createTextNode(slot||player.positions[0]||"SUB"));
      const ovr=el("span","sqmCardOvr",player.rating);
      const name=el("span","sqmCardName",shortName(player.name));
      const main=el("div","sqmCardMain");main.append(pos,ovr);
      const id=el("div","sqmCardId");id.append(main,name,el("span","sqmCardBar "+LINE_CLASS[line]));
      const info=el("dl","sqmCardInfo");
      const row=(k,v,cls)=>{const w=el("div",cls||"");w.append(el("dt",null,k),el("dd",null,v));info.appendChild(w);};
      row("Plays",player.positions.join("  ")||"Unknown");
      const nation=nationOf(club,player);if(nation)row("Nation",nation);
      row(ref.zone==="xi"?"Here":"Squad",ref.zone==="xi"?FIT_WORD[sheet.stopgaps.includes(ref.index)?0:f]:ref.zone==="bench"?"Substitute":"Reserve","fit"+(ref.zone==="xi"?(sheet.stopgaps.includes(ref.index)?0:f):3));
      if(player.number)row("Shirt",`#${player.number}`);
      if(player.signedSeason)row("Signed",`Season ${player.signedSeason}`);
      c.append(id,info);
      return c;
    }

    function chip(ref){
      const p=playerAt(ref),slot=slotOf(ref);
      const b=el("button","sqmChip");b.type="button";
      b.dataset.zone=ref.zone;b.dataset.index=ref.index;
      if(same(ref,picked))b.classList.add("is-picked");
      if(same(ref,cursor))b.classList.add("is-cursor");
      if(picked&&!same(ref,picked)&&S.canSwap(sheet,picked,ref).ok)b.classList.add("is-target");
      if(!p){b.classList.add("is-empty");b.appendChild(el("span","sqmChipName","Empty"));b.setAttribute("aria-label",`${slot||"Seat"}: empty`);return b;}
      const f=slot?S.slotFit(sheet,p,slot):3,gap=slot&&sheet.stopgaps.includes(ref.index);
      b.appendChild(shirt(club,p,slot,rival));
      b.appendChild(el("span","sqmChipOvr",p.rating));
      const name=el("span","sqmChipName");
      name.appendChild(el("i","sqmDot fit"+(gap?0:f)));name.appendChild(doc.createTextNode(shortName(p.name)));
      b.appendChild(name);
      if(p.signedSeason&&p.signedSeason===sheet.season)b.appendChild(el("span","sqmBadge","New"));
      b.setAttribute("aria-label",`${slot||(ref.zone==="bench"?"Substitute":"Reserve")}: ${p.name}, ${p.rating}${slot?`, ${FIT_WORD[gap?0:f]}`:""}`);
      return b;
    }

    function shelfCard(ref){
      const p=playerAt(ref);
      const b=el("button","sqmShelfCard"+(ref.zone==="bench"&&ref.index<4?" is-board":""));b.type="button";b.dataset.zone=ref.zone;b.dataset.index=ref.index;
      if(same(ref,picked))b.classList.add("is-picked");
      if(same(ref,cursor))b.classList.add("is-cursor");
      if(picked&&!same(ref,picked)&&S.canSwap(sheet,picked,ref).ok)b.classList.add("is-target");
      if(!p){b.classList.add("is-empty");b.appendChild(el("span","sqmShelfName","Empty seat"));return b;}
      const line=S.lineOf(p.positions[0]||"")||"MID";
      const pos=el("span","sqmShelfPos "+LINE_CLASS[line]);pos.appendChild(el("i","sqmDot fit3"));pos.appendChild(doc.createTextNode(p.positions[0]||"?"));
      b.append(pos,shirt(club,p,null,rival),el("span","sqmShelfOvr",p.rating),el("span","sqmShelfName",shortName(p.name)),el("span","sqmShelfBar "+LINE_CLASS[line]));
      if(p.signedSeason&&p.signedSeason===sheet.season)b.appendChild(el("span","sqmBadge","New"));
      b.setAttribute("aria-label",`${ref.zone==="bench"?`Substitute ${ref.index+1}${ref.index<4?", on the Roulette board":""}`:"Reserve"}: ${p.name}, ${p.positions[0]||""} ${p.rating}`);
      return b;
    }

    function renderSquad(){
      const focus=playerAt(picked)||playerAt(cursor);
      panel.appendChild(card(focus,playerAt(picked)?picked:cursor));
      const stage=el("div","sqmStage");
      const pitch=el("div","sqmPitch");pitch.innerHTML=pitchSvg();
      const spots=S.pitchSpots(sheet.slots);
      sheet.xi.forEach((p,i)=>{
        const ref={zone:"xi",index:i},c=chip(ref),pr=project(spots[i][0],spots[i][1]);
        c.style.left=pr.left+"%";c.style.top=pr.top+"%";c.style.setProperty("--k",pr.scale.toFixed(3));
        pitch.appendChild(c);
      });
      stage.appendChild(pitch);
      panel.appendChild(stage);
      const t1=playerTools("xi");if(t1)panel.appendChild(t1);
      const n1=note("xi");if(n1)panel.appendChild(n1);
      // Nik 2026-11-11 00:29 UTC: the 7 substitutes and then the reserves sit under the pitch, always visible; the page scrolls.
      const shelf=el("div","sqmShelf");
      const head=el("div","sqmShelfHead");
      head.appendChild(el("h3","sqmShelfTitle","Substitutes"));
      const tag=el("span","sqmShelfTag");tag.append(el("i"),doc.createTextNode("1-4 on the Russian Roulette board"));
      head.appendChild(tag);
      shelf.appendChild(head);
      // Subs 1-4 are on the Roulette board; 5-7 sit in their own row, marked as off the board (Nik 00:29 and the lead, 00:52).
      const subs=el("div","sqmShelfGrid is-board");
      sheet.bench.slice(0,4).forEach((p,i)=>subs.appendChild(shelfCard({zone:"bench",index:i})));
      shelf.appendChild(subs);
      inRow(subs,"board",0);
      const more=el("div","sqmShelfHead is-more");
      more.appendChild(el("h4","sqmShelfSub","Subs 5-7"));
      more.appendChild(el("span","sqmShelfTag is-plain","Not on the Russian Roulette board"));
      shelf.appendChild(more);
      const rest=el("div","sqmShelfGrid is-more");
      sheet.bench.slice(4).forEach((p,i)=>rest.appendChild(shelfCard({zone:"bench",index:i+4})));
      shelf.appendChild(rest);
      inRow(rest,"more",4);
      const rhead=el("div","sqmShelfHead is-res");
      rhead.appendChild(el("h3","sqmShelfTitle",`Reserves  ${sheet.reserves.length}`));
      if(sheet.season<2)rhead.appendChild(el("span","sqmShelfTag is-plain","Reserves can come in from season 2"));
      shelf.appendChild(rhead);
      const res=el("div","sqmShelfGrid");
      sheet.reserves.forEach((p,i)=>res.appendChild(shelfCard({zone:"res",index:i})));
      if(!sheet.reserves.length)res.appendChild(el("p","sqmShelfNote","Nobody else is at the club."));
      shelf.appendChild(res);
      inRow(res,"res",0);
      panel.appendChild(shelf);
      const hint=el("div","sqmHint");
      hint.appendChild(el("p",null,locked?"Your squad is locked for this screen.":picked?"Now tap where he should go. Green rings show where he can play. Tap him again to cancel.":"Tap a player, then another, to swap them. On a computer you can also drag."));
      const legend=el("ul","sqmLegend");legend.setAttribute("aria-label","What the dots mean");
      for(const [f,word] of [[3,"Natural"],[2,"Can play"],[1,"Out of position"],[0,"Stand-in"]]){const li=el("li");li.append(el("i","sqmDot fit"+f),doc.createTextNode(word));legend.appendChild(li);}
      hint.appendChild(legend);
      panel.appendChild(hint);
    }

    function renderFormations(){
      if(carousel>=shown.length)carousel=0;
      const f=shown[carousel]||byName.get(sheet.formation);
      const preview=f.name===sheet.formation?{ok:true,sheet}:S.setFormation(sheet,f.name);
      const box=el("div","sqmFormPreview");
      const label=el("span","sqmFormLabel",f.name===sheet.formation?"Current":f.name===(base.launchFormation||defaultFormation())?"Default":"");
      const title=el("span","sqmFormTitle");title.append(el("b",null,f.title),el("small",null,f.variant));
      const pitch=el("div","sqmPitch is-preview");pitch.innerHTML=pitchSvg();
      const spots=S.pitchSpots(f.slots),view=preview.ok?preview.sheet:null;
      f.slots.forEach((pos,i)=>{
        const p=view?view.xi[i]:null,pr=project(spots[i][0],spots[i][1]);
        const m=el("span","sqmChip is-static");m.style.left=pr.left+"%";m.style.top=pr.top+"%";m.style.setProperty("--k",pr.scale.toFixed(3));
        m.appendChild(shirt(club,p,pos,rival));
        const name=el("span","sqmChipName");name.textContent=p?shortName(p.name):pos;m.appendChild(name);
        pitch.appendChild(m);
      });
      box.append(label,title,pitch);
      panel.appendChild(box);
      if(!preview.ok)panel.appendChild(el("p","sqmFormNote",preview.reason));
      const rail=el("div","sqmFormRail");
      const head=el("div","sqmFormHead");
      head.appendChild(el("h3","sqmShelfTitle",`${club} formations`));
      const find=el("label","sqmFormSearch");
      const input=el("input");input.type="search";input.value=formQuery;input.placeholder="Search: 433, 4-2-3-1, diamond";input.setAttribute("aria-label","Search the formations");
      input.autocomplete="off";input.spellcheck=false;input.setAttribute("enterkeyhint","search");
      input.addEventListener("input",()=>{const at=input.selectionStart;searchFor(input.value);sqmRender();const again=panel.querySelector(".sqmFormSearch input");if(again){again.focus({preventScroll:true});try{again.setSelectionRange(at,at);}catch(_e){}}});
      input.addEventListener("keydown",e=>{if(e.key==="Escape"&&formQuery){e.stopPropagation();searchFor("");sqmRender();panel.querySelector(".sqmFormSearch input")?.focus({preventScroll:true});}});
      find.appendChild(input);head.appendChild(find);
      rail.appendChild(head);
      if(!shown.length){
        rail.appendChild(el("p","sqmFormNone",`No formation matches "${formQuery.trim()}". Try 433, 4-4-2 or 3-5-2.`));
      }else{
        const row=el("div","sqmFormRow");
        const prev=el("button","sqmFormArrow","‹");prev.type="button";prev.setAttribute("aria-label","Previous formation");prev.disabled=carousel<=0;
        const next=el("button","sqmFormArrow","›");next.type="button";next.setAttribute("aria-label","Next formation");next.disabled=carousel>=shown.length-1;
        prev.addEventListener("click",()=>{carousel=Math.max(0,carousel-1);sqmRender();});
        next.addEventListener("click",()=>{carousel=Math.min(shown.length-1,carousel+1);sqmRender();});
        const cards=el("div","sqmFormCards");
        const start=Math.min(Math.max(0,carousel-1),Math.max(0,shown.length-3));
        for(let i=start;i<Math.min(shown.length,start+3);i+=1){
          const g=shown[i];
          const b=el("button","sqmFormCard"+(i===carousel?" is-on":"")+(g.name===sheet.formation?" is-current":""));b.type="button";
          b.append(el("b",null,g.title),el("small",null,g.variant||" "));
          const mini=el("span","sqmMini");
          S.pitchSpots(g.slots).forEach(([x,y],k)=>{const d=el("i",g.slots[k]==="GK"?"gk":"");d.style.left=x+"%";d.style.top=y+"%";mini.appendChild(d);});
          b.appendChild(mini);
          b.setAttribute("aria-label",`${g.title} ${g.variant}${g.name===sheet.formation?", current":""}`);
          b.addEventListener("click",()=>{if(carousel===i)useFormation();else{carousel=i;sqmRender();}});
          cards.appendChild(b);
        }
        row.append(prev,cards,next);
        rail.appendChild(row);
      }
      panel.appendChild(rail);
      const act=el("div","sqmFormActions");
      const has=shown.length>0&&shown[carousel]===f;
      const use=el("button","sqmBtn is-primary",f.name===sheet.formation?"In use":"Use this formation");use.type="button";use.disabled=!has||locked||saving||f.name===sheet.formation||!preview.ok;
      use.addEventListener("click",useFormation);
      act.appendChild(use);
      const of=formQuery.trim()&&shown.length?`${carousel+1} of ${shown.length} matching (${formations.length} formations)`:`${(has?carousel:formations.indexOf(f))+1} of ${formations.length}`;
      act.appendChild(el("span","sqmFormCount",`${of}  ·  ${many(f.counts.DEF,"defender")}, ${many(f.counts.MID,"midfielder")}, ${many(f.counts.ATT,"attacker")}`));
      panel.appendChild(act);
    }
    function defaultFormation(){const d=root.CareerModeFifa17Players;return d&&d.clubs[club]?d.clubs[club].formation:"";}
    function useFormation(){
      const f=shown[carousel];if(!f||locked||saving)return;
      if(commit({t:"formation",name:f.name})){say(`${[f.title,f.variant].filter(Boolean).join(" ")} is in. Starters who still fit kept their places.`,"ok");tab="squad";}
      sqmRender();
    }

    // The picked player's tools (season 2+): his overall in your save and "Left the club". They sit right under the group
    // he is in (pitch, board subs, subs 5-7, reserves), so a phone never has to scroll to find them (Nik, 01:12 UTC).
    function playerTools(zone){
      const sel=playerAt(picked);
      if(!(sheet.season>=2&&sel&&!locked&&!saving&&picked&&noteZone(picked)===zone))return null;
      {
        const box=el("div","sqmReport");
        box.appendChild(el("h3","sqmSideTitle",shortName(sel.name)));
        if(pendingLeave){
          box.appendChild(el("p","sqmSideNote","Why did he leave the club?"));
          const chips=el("div","sqmReasons");
          for(const r of S.leaveReasons){const b=el("button","sqmBtn",REASON_WORD[r]);b.type="button";b.addEventListener("click",()=>{const name=sel.name;noteAt=noteZone(picked);lastRef=picked;if(commit({t:"leave",id:sel.id,reason:r})){say(r==="loaned"?`${name} is out on loan and comes back next season. His place went to the best player of his line.`:`${name} has left (${REASON_WORD[r].toLowerCase()}). His place went to the best player of his line.`,"ok");}picked=null;pendingLeave=null;sqmRender();});chips.appendChild(b);}
          const back=el("button","sqmBtn is-quiet","Cancel");back.type="button";back.addEventListener("click",()=>{pendingLeave=null;sqmRender();});chips.appendChild(back);
          box.appendChild(chips);
        }else{
          const leave=el("button","sqmBtn","Left the club");leave.type="button";leave.addEventListener("click",()=>{pendingLeave=true;sqmRender();});
          const ov=el("div","sqmOverall");
          const minus=el("button","sqmBtn is-step","−");minus.type="button";minus.setAttribute("aria-label","Lower overall");
          const plus=el("button","sqmBtn is-step","+");plus.type="button";plus.setAttribute("aria-label","Raise overall");
          const val=el("input","sqmOverallVal");val.type="number";val.min="30";val.max="99";val.inputMode="numeric";val.value=String(sel.rating);val.setAttribute("aria-label",`${sel.name}'s overall`);
          val.addEventListener("change",()=>{const n=Number(val.value);if(n!==sel.rating)step(n-sel.rating);});
          const step=d=>{const id=sel.id,next=sel.rating+d;if(commit({t:"rate",id,overall:next})){const r=S.findPlayer(sheet,id);picked=r;if(r){noteAt=noteZone(r);lastRef=r;}say(`New overall saved: ${next}.`,"ok");}sqmRender();};
          minus.addEventListener("click",()=>step(-1));plus.addEventListener("click",()=>step(1));
          ov.append(el("span","sqmSideNote","Overall in your save"),minus,val,plus);
          box.append(leave,ov);
        }
        return box;
      }
    }
    // Tools and the status go in the grid right after the row of the player they are about (full width), so they sit
    // next to him even deep in the reserves.
    function inRow(grid,zone,first){
      const tools=playerTools(zone),n=note(zone);
      if(!tools&&!n)return;
      const narrow=typeof root.matchMedia==="function"&&root.matchMedia("(max-width:520px)").matches;
      const cols=narrow?(zone==="board"?2:3):4;
      const about=zone===(picked&&noteZone(picked))&&tools?picked:noteAt===zone?lastRef:null;
      const i=about?about.index-first:grid.children.length-1;
      const after=Math.min(grid.children.length,(Math.floor(i/cols)+1)*cols);
      const ref=grid.children[after]||null;
      for(const node of [tools,n])if(node){node.classList.add("is-row");grid.insertBefore(node,ref);}
    }
    const noteZone=ref=>ref.zone==="bench"?(ref.index<4?"board":"more"):ref.zone;
    function renderSide(){
      side.innerHTML="";
      const crest=el("div","sqmCrest");
      try{if(typeof root.getClubCrestSvg==="function")crest.innerHTML=root.getClubCrestSvg(club);}catch(e){}
      side.appendChild(crest);
      side.appendChild(el("h2","sqmClub",club));
      side.appendChild(el("p","sqmWhen",`Season ${sheet.season}  ·  ${STAGE_WORD[sheet.stage]||""}`));
      const f=byName.get(sheet.formation),c=S.lineCounts(sheet.slots);
      const lines=el("p","sqmLines");
      lines.append(el("b",null,`${f?f.title:sheet.formation} ${f&&f.variant?f.variant:""}`),el("span",null,`1 goalkeeper · ${many(c.DEF,"defender")} · ${many(c.MID,"midfielder")} · ${many(c.ATT,"attacker")}`));
      side.appendChild(lines);
      side.appendChild(live);live.textContent=message;live.dataset.kind=messageKind;
      if(sheet.out.length){
        const gone=el("div","sqmGone");gone.appendChild(el("h3","sqmSideTitle","Left the club"));
        const list=el("ul");for(const o of sheet.out.slice().reverse().slice(0,8))list.appendChild(el("li",null,`${shortName(o.name)}  ·  ${REASON_WORD[o.reason]||o.reason}${o.returned?", back":""}  ·  S${o.season}`));
        gone.appendChild(list);side.appendChild(gone);
      }
      const actions=el("div","sqmActions");
      const auto=el("button","sqmBtn","Auto");auto.type="button";auto.title="Put every starter in his best spot";auto.disabled=locked||saving;
      auto.addEventListener("click",()=>{if(commit({t:"auto"}))say("Every starter is in his best spot.","ok");picked=null;sqmRender();});
      const undo=el("button","sqmBtn","Undo");undo.type="button";undo.disabled=locked||saving||!ops.length;
      undo.addEventListener("click",()=>{ops=ops.slice(0,-1);sheet=S.apply(base,ops).sheet;saveDraft();picked=null;say("Last change undone.","");sqmRender();});
      const lock=el("button","sqmBtn is-primary",saving?"Saving…":locked?"Squad locked":"Lock my squad");lock.type="button";lock.disabled=locked||saving;
      if(saving)lock.setAttribute("aria-busy","true");
      // options.onLock(sheet, ops) may answer a promise (the game saves the sheet to Firestore): false or a throw keeps the
      // screen open with the draft as it was and says so; the button is off while the save runs, so a second tap can't send it twice.
      lock.addEventListener("click",async()=>{
        if(locked||saving)return;
        const v=S.validate(sheet);
        if(!v.ok){say(v.problems[0],"no");return;}
        picked=null;
        if(typeof options.onLock!=="function"){locked=true;say("Squad locked.","ok");sqmRender();return;}
        saving=true;say("Saving your squad…","");sqmRender();
        let answer;
        try{answer=await options.onLock(sheet,ops.slice());}catch(e){answer=false;}
        saving=false;
        if(answer===false||(answer&&answer.ok===false)){say(answer&&answer.reason||"Couldn't save. Try again.","no");sqmRender();return;}
        locked=true;say(answer&&answer.reason||"Squad locked.","ok");sqmRender();
      });
      actions.append(auto,undo,lock);
      side.appendChild(actions);
    }

    // ----- input: tap to pick and swap, drag, keys -----
    function scrollerOf(node){
      for(let n=node&&node.parentElement;n&&n!==doc.body;n=n.parentElement){const o=root.getComputedStyle(n).overflowY;if((o==="auto"||o==="scroll")&&n.scrollHeight>n.clientHeight)return n;}
      return root;
    }
    function refFrom(node){const b=node&&node.closest&&node.closest("[data-zone]");if(!b||!panel.contains(b))return null;return {zone:b.dataset.zone,index:Number(b.dataset.index)};}
    function tapOn(ref){
      if(locked||saving){cursor=ref;sqmRender();return;}
      cursor=ref;
      if(!picked){if(playerAt(ref)||ref.zone!=="res"){picked=ref;pendingLeave=null;}sqmRender();return;}
      if(same(picked,ref)){picked=null;pendingLeave=null;sqmRender();return;}
      trySwap(picked,ref);
    }
    function trySwap(a,b){
      const pa=playerAt(a),pb=playerAt(b);
      noteAt=noteZone(b);lastRef=b;
      if(commit({t:"swap",a,b})){
        say(pa&&pb?`${shortName(pa.name)} and ${shortName(pb.name)} swapped.`:`${shortName((pa||pb).name)} moved.`,"ok");
        picked=null;pendingLeave=null;cursor=b;
      }else picked=null;
      sqmRender();
    }
    panel.addEventListener("click",e=>{
      if(drag&&drag.moved)return;
      const ref=refFrom(e.target);if(!ref||tab!=="squad")return;
      if(e.target.closest(".sqmChip.is-static"))return;
      tapOn(ref);
    });
    // Keyboard focus moves FIFA's cursor too (the card on top follows it).
    // Nothing may re-draw between a finger going down and its click: a taller or shorter card would move the pitch under
    // the finger and the tap would land on the grass (Nik's first try on his phone, 2026-11-11).
    let pressing=false,touchy=false;
    panel.addEventListener("pointerdown",e=>{pressing=true;touchy=e.pointerType!=="mouse";},true);
    const release=()=>{setTimeout(()=>{pressing=false;},0);};
    panel.addEventListener("click",release,true);panel.addEventListener("pointercancel",release,true);
    panel.addEventListener("pointerup",()=>{setTimeout(()=>{pressing=false;},350);},true);
    panel.addEventListener("focusin",e=>{
      if(pressing)return;
      const ref=refFrom(e.target);if(!ref||same(ref,cursor))return;
      const prev=panel.querySelector(".is-cursor");if(prev)prev.classList.remove("is-cursor");
      cursor=ref;e.target.closest("[data-zone]").classList.add("is-cursor");
      const c=panel.querySelector(".sqmCard");if(c&&!picked)c.replaceWith(card(playerAt(cursor),cursor));
    });
    panel.addEventListener("mouseover",e=>{
      if(drag||picked||pressing||touchy)return;const ref=refFrom(e.target);if(!ref||same(ref,cursor))return;
      cursor=ref;const c=panel.querySelector(".sqmCard");if(c)c.replaceWith(card(playerAt(cursor),cursor));
    });
    // Drag: a mouse drags at once; a finger holds 300 ms first, so a swipe always scrolls and never moves a player.
    panel.addEventListener("pointerdown",e=>{
      if(locked||saving||tab!=="squad"||e.button>0)return;
      const ref=refFrom(e.target);if(!ref||!playerAt(ref))return;
      drag={ref,x:e.clientX,y:e.clientY,id:e.pointerId,moved:false,ready:e.pointerType==="mouse",ghost:null,timer:null,travel:0,before:picked};
      if(!drag.ready)drag.timer=setTimeout(()=>{if(drag){drag.ready=true;start(e);}},300);
    });
    function start(e){
      if(!drag||drag.ghost)return;
      const node=panel.querySelector(`[data-zone="${drag.ref.zone}"][data-index="${drag.ref.index}"]`);
      if(!node)return;
      drag.moved=true;picked=drag.ref;
      sqmRender();
      const g=node.cloneNode(true);g.classList.add("sqmGhost");g.style.left=e.clientX+"px";g.style.top=e.clientY+"px";g.style.width=node.offsetWidth+"px";
      doc.body.appendChild(g);drag.ghost=g;
      try{panel.setPointerCapture(drag.id);}catch(x){}
    }
    panel.addEventListener("pointermove",e=>{
      if(!drag||e.pointerId!==drag.id)return;
      const dist=Math.hypot(e.clientX-drag.x,e.clientY-drag.y);drag.travel=Math.max(drag.travel,dist);
      if(!drag.ready){if(dist>8){clearTimeout(drag.timer);drag=null;}return;}
      if(!drag.ghost&&dist>6)start(e);
      if(drag.ghost){
        e.preventDefault();drag.ghost.style.left=e.clientX+"px";drag.ghost.style.top=e.clientY+"px";
        // Near the top or bottom edge the page scrolls, so a reserve can be carried up to the pitch.
        const edge=56,h=root.innerHeight||800,dy=e.clientY<edge?-14:e.clientY>h-edge?14:0;
        if(dy){const sc=scrollerOf(host);sc.scrollBy(0,dy);}
      }
    });
    function endDrag(e){
      if(!drag)return;clearTimeout(drag.timer);
      const d=drag;
      if(d.ghost&&d.travel<=8){
        // A slow tap (a finger held still) is still a tap: pick him, or swap with the player picked before.
        d.ghost.remove();picked=d.before;
        if(picked&&!same(picked,d.ref))trySwap(picked,d.ref);else{picked=same(picked,d.ref)?null:d.ref;cursor=d.ref;sqmRender();}
        setTimeout(()=>{drag=null;},0);
      }else if(d.ghost){
        d.ghost.remove();
        const under=doc.elementFromPoint(e.clientX,e.clientY),to=refFrom(under);
        if(to&&!same(to,d.ref))trySwap(d.ref,to);else{picked=null;sqmRender();}
        setTimeout(()=>{drag=null;},0);
      }else drag=null;
    }
    panel.addEventListener("pointerup",endDrag);
    // The browser cancels the pointer when a finger starts scrolling: forget the drag, keep the picked player, so a
    // manager can pick on the pitch, scroll down to the reserves and tap the second player.
    panel.addEventListener("pointercancel",()=>{if(!drag)return;clearTimeout(drag.timer);if(drag.ghost){drag.ghost.remove();picked=drag.before;sqmRender();}drag=null;});
    // While a player is being carried, the finger moves him instead of scrolling the page.
    panel.addEventListener("touchmove",e=>{if(drag&&drag.ghost&&e.cancelable)e.preventDefault();},{passive:false});
    panel.addEventListener("contextmenu",e=>{if(drag)e.preventDefault();});
    // Keys: arrows move the cursor like FIFA's (down from the back line goes to the substitutes, then the reserves),
    // Enter or Space picks and swaps, Escape cancels.
    host.addEventListener("keydown",e=>{
      if(tab==="formations"){
        if(e.target&&e.target.closest&&e.target.closest(".sqmFormSearch"))return;// arrows move the caret while typing
        if(e.key==="ArrowLeft"){carousel=Math.max(0,carousel-1);sqmRender();e.preventDefault();}
        else if(e.key==="ArrowRight"){carousel=Math.min(shown.length-1,carousel+1);sqmRender();e.preventDefault();}
        return;
      }
      if(!["ArrowUp","ArrowDown","ArrowLeft","ArrowRight","Enter"," ","Escape"].includes(e.key))return;
      if(e.key==="Escape"){picked=null;sqmRender();return;}
      if(e.key==="Enter"||e.key===" "){if(e.target.closest&&e.target.closest(".sqmSide"))return;e.preventDefault();tapOn(cursor);focusCursor();return;}
      e.preventDefault();
      cursor=moveCursor(cursor,e.key);
      sqmRender();focusCursor();
    });
    function focusCursor(){const n=panel.querySelector(`[data-zone="${cursor.zone}"][data-index="${cursor.index}"]`);if(n){n.focus({preventScroll:true});n.scrollIntoView({block:"nearest",behavior:root.matchMedia&&root.matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth"});}}
    function moveCursor(c,key){
      const spots=S.pitchSpots(sheet.slots);
      if(c.zone==="xi"){
        const [x,y]=spots[c.index];
        const dir={ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0]}[key];
        let best=-1,score=Infinity;
        spots.forEach(([sx,sy],i)=>{if(i===c.index)return;const dx=sx-x,dy=sy-y,along=dx*dir[0]+dy*dir[1];if(along<=2)return;const off=Math.abs(dx*dir[1])+Math.abs(dy*dir[0]);const s=along+off*2.2;if(s<score){score=s;best=i;}});
        if(best>=0)return {zone:"xi",index:best};
        if(key==="ArrowDown")return {zone:"bench",index:Math.min(BENCH_LAST(),Math.round(x/100*3))};
        return c;
      }
      const cols=4,list=c.zone==="bench"?sheet.bench:sheet.reserves;
      if(key==="ArrowLeft")return {zone:c.zone,index:Math.max(0,c.index-1)};
      if(key==="ArrowRight")return {zone:c.zone,index:Math.min(list.length-1,c.index+1)};
      if(key==="ArrowUp"){
        if(c.index-cols>=0)return {zone:c.zone,index:c.index-cols};
        if(c.zone==="res")return {zone:"bench",index:Math.min(BENCH_LAST(),c.index)};
        // up from the substitutes: the nearest defender
        let best=0,dist=Infinity;spots.forEach(([sx,sy],i)=>{const d=Math.abs(sx-(c.index+.5)*25)+(100-sy);if(d<dist&&sheet.slots[i]!=="GK"){dist=d;best=i;}});
        return {zone:"xi",index:best};
      }
      if(key==="ArrowDown"){
        if(c.index+cols<list.length)return {zone:c.zone,index:c.index+cols};
        if(c.zone==="bench"&&sheet.reserves.length)return {zone:"res",index:Math.min(sheet.reserves.length-1,c.index%cols)};
      }
      return c;
    }
    const BENCH_LAST=()=>sheet.bench.length-1;

    sqmRender();
    return {
      get sheet(){return sheet;},get ops(){return ops.slice();},
      lock(){locked=true;sqmRender();},
      // A line for the club panel's status (the game's own: "Waiting for Daniel to lock his squad").
      say(text,kind){say(text,kind);},
      destroy(){host.innerHTML="";host.classList.remove("sqm");}
    };
  }

  return Object.freeze({version:1,mount:sqmMount});
});
