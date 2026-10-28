/* MARQUEE-V1 (HO-035, r86): Team V's Marquee Player plate app. Skin, don't rewire: Team G mounts it into
   #marqueeScreen with the frame data {daniel:{rank,name,club,overall,potential,tier,number}, nik:{...}} and keeps
   every product button and word. The plate is aria-hidden decoration over Team V's club scene (ENV_CLUB_PLATE_V2 /
   ENV_CLUB_PHONE_V2): each manager holds his pack, and the pack face becomes the reveal window.

   Reveal per manager (Nik, 2026-10-27 7:54 and 7:55 p.m. Eastern):
     1 figure  - a faceless gold-edged figure in the club colours rises behind the shirt, like a trophy statue
     2 jersey  - the club's shirt (original design: club colours and pattern, no badge, no sponsor)
     3 number  - the kit number, then a short pause
     4 club    - the team name
     5 name    - the player's name on the back of the shirt
     6 rank    - the ranking badge flashes in its tier colour
   No faces: the figure is seen from behind, so the shirt shows its back (name and number).

   API (window.MarqueePlate):
     app.mount(host, data, {layout})  host = an empty element that fills the screen; layout "desktop"|"phone"|"auto"
     app.frame(n)                     show reveal step n (0..6) at rest, no motion (evidence frames MP1..MP6)
     app.play({onDone})               run the whole reveal (about 10 s); reduced motion jumps to step 6
     app.unmount()
     kit(club) / shirtSvg(player, opts) / chip(player, {size:"desktop"|"phone"}) / TIERS / KITS */
(function(root){
  "use strict";

  const TIERS=Object.freeze({
    "black-blue-gold":{label:"TOP 3"},
    "blue-gold":{label:"TOP 10"},
    "gold":{label:"TOP 20"},
    "silver":{label:"TOP 50"},
    "bronze":{label:"TOP 200"}
  });

  // Original shirts in each club's colours: base, second colour, trim, number colour, pattern.
  // Patterns: plain | stripes | hoops | halves | band | sleeves | sash. No crests, no sponsors, no maker marks.
  const K=(base,alt,trim,num,pattern)=>Object.freeze({base,alt,trim,num,pattern});
  const KITS=Object.freeze({
    "Real Madrid":K("#f4f2ec","#f4f2ec","#c9a24a","#1c2b4f","plain"),
    "FC Bayern München":K("#d4162c","#d4162c","#f4f2ec","#f4f2ec","plain"),
    "FC Barcelona":K("#a3123f","#173f8a","#e8b730","#f2d25a","stripes"),
    "Juventus":K("#f4f2ec","#111214","#c9a24a","#111214","stripes"),
    "Atlético Madrid":K("#d01f2e","#f4f2ec","#1d2d5c","#1d2d5c","stripes"),
    "Manchester City":K("#7fb7e3","#7fb7e3","#f4f2ec","#13274a","plain"),
    "Paris Saint-Germain":K("#13284b","#d2232f","#f4f2ec","#f4f2ec","band"),
    "Manchester United":K("#d0201d","#d0201d","#111214","#f4f2ec","plain"),
    "Chelsea":K("#0b4aa0","#0b4aa0","#f4f2ec","#f4f2ec","plain"),
    "Borussia Dortmund":K("#f7d417","#f7d417","#111214","#111214","plain"),
    "Arsenal":K("#d81e2b","#f4f2ec","#f4f2ec","#f4f2ec","sleeves"),
    "Tottenham Hotspur":K("#f4f2ec","#f4f2ec","#13224a","#13224a","plain"),
    "Bayer 04 Leverkusen":K("#d9202a","#111214","#111214","#f4f2ec","sleeves"),
    "Napoli":K("#1a9ad6","#1a9ad6","#f4f2ec","#f4f2ec","plain"),
    "Milan":K("#c8102e","#111214","#f4f2ec","#f4f2ec","stripes"),
    "AS Monaco":K("#d6202f","#f4f2ec","#c9a24a","#111214","sash"),
    "Liverpool":K("#c4122f","#c4122f","#f4f2ec","#f4f2ec","plain"),
    "Inter":K("#0d63ad","#111214","#c9a24a","#f2d25a","stripes"),
    "Lazio":K("#8fd0ef","#8fd0ef","#f4f2ec","#13274a","plain"),
    "Olympique Lyonnais":K("#f4f2ec","#1d3f8f","#d01f2e","#1d3f8f","plain"),
    "SL Benfica":K("#d8141f","#d8141f","#f4f2ec","#f4f2ec","plain"),
    "Athletic Club de Bilbao":K("#d0202c","#f4f2ec","#111214","#111214","stripes"),
    "Ajax":K("#f4f2ec","#cf1f2e","#cf1f2e","#111214","band"),
    "FC Schalke 04":K("#0b52a3","#0b52a3","#f4f2ec","#f4f2ec","plain"),
    "Everton":K("#11389a","#11389a","#f4f2ec","#f4f2ec","plain"),
    "Torino":K("#7c1c22","#7c1c22","#f4f2ec","#f4f2ec","plain"),
    "Toulouse Football Club":K("#5a2d84","#5a2d84","#f4f2ec","#f4f2ec","plain"),
    "Villarreal CF":K("#f6dc3a","#f6dc3a","#13366e","#13366e","plain"),
    "Sporting CP":K("#0a7a43","#f4f2ec","#0a7a43","#111214","hoops"),
    "Borussia Mönchengladbach":K("#f4f2ec","#0d7a3c","#111214","#111214","plain"),
    "OGC Nice":K("#c8102e","#111214","#f4f2ec","#f4f2ec","stripes"),
    "Roma":K("#86192c","#86192c","#f0b23e","#f0b23e","plain"),
    "Sevilla FC":K("#f4f2ec","#d01f2e","#d01f2e","#d01f2e","plain"),
    "RSC Anderlecht":K("#4a2a7c","#4a2a7c","#f4f2ec","#f4f2ec","plain"),
    "Real Sociedad":K("#1556a4","#f4f2ec","#f4f2ec","#111214","stripes"),
    "1. FC Köln":K("#f4f2ec","#d3202b","#d3202b","#d3202b","plain"),
    "Stoke City":K("#d0202c","#f4f2ec","#111214","#111214","stripes"),
    "Genoa":K("#a3192f","#132a52","#f4f2ec","#f4f2ec","halves"),
    "TSG 1899 Hoffenheim":K("#1866ba","#1866ba","#f4f2ec","#f4f2ec","plain"),
    "Real Betis":K("#0b8a43","#f4f2ec","#f4f2ec","#111214","stripes"),
    "UD Las Palmas":K("#f7d417","#f7d417","#1556a4","#1556a4","plain"),
    "Deportivo Alavés":K("#1b4fa2","#f4f2ec","#f4f2ec","#111214","stripes"),
    "Racing Club":K("#7cc0ea","#f4f2ec","#13274a","#13274a","stripes"),
    "Independiente":K("#d0101e","#d0101e","#f4f2ec","#f4f2ec","plain"),
    "Fiorentina":K("#4f2685","#4f2685","#f4f2ec","#f4f2ec","plain"),
    "Olympique de Marseille":K("#f4f2ec","#2aa2dd","#2aa2dd","#13274a","plain"),
    "Udinese":K("#f4f2ec","#111214","#c9a24a","#111214","stripes"),
    "Sporting Club de Bastia":K("#0b4ea2","#0b4ea2","#f4f2ec","#f4f2ec","plain"),
    "KAS Eupen":K("#f4f2ec","#111214","#111214","#111214","halves"),
    "Shakhtar Donetsk":K("#f2801f","#111214","#111214","#111214","sleeves"),
    "FC Porto":K("#1556a4","#f4f2ec","#f4f2ec","#111214","stripes"),
    "Southampton":K("#d71920","#f4f2ec","#111214","#111214","stripes"),
    "Galatasaray SK":K("#a90f32","#f6b51c","#f6b51c","#f6b51c","halves"),
    "West Ham United":K("#7a2639","#86c9ec","#86c9ec","#86c9ec","sleeves"),
    "Valencia CF":K("#f4f2ec","#f4f2ec","#111214","#111214","plain"),
    "Burnley":K("#6c1d45","#93c7ea","#93c7ea","#93c7ea","sleeves"),
    // Oscar has no club in the list: a black-and-gold Showdown shirt.
    "":K("#14120f","#2a241a","#d6ab4f","#f2c45b","stripes")
  });
  const kit=(club)=>KITS[club||""]||KITS[""];

  const esc=(s)=>String(s==null?"":s).replace(/[&<>"]/g,(c)=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[c]));
  // Shirt-back lettering: the surname, as kits print it ("L. Messi" -> MESSI, "Neymar" -> NEYMAR).
  const PARTICLES=new Set(["de","van","der","den","di","da","dos","das","del","la","le","el","von"]);
  function backName(name){
    let parts=String(name||"").trim().split(/\s+/).filter(Boolean);
    if(parts.length>1&&/\.$/.test(parts[0]))parts=parts.slice(1);
    else if(parts.length>1){let i=parts.length-1;while(i>0&&PARTICLES.has(parts[i-1].toLowerCase()))i--;parts=parts.slice(i);}
    return parts.join(" ").toUpperCase();
  }
  const shade=(hex,f)=>{const n=parseInt(hex.slice(1),16);const c=[n>>16,(n>>8)&255,n&255].map((v)=>Math.max(0,Math.min(255,Math.round(f<1?v*f:v+(255-v)*(f-1)))));return "#"+c.map((v)=>v.toString(16).padStart(2,"0")).join("");};

  let uid=0;
  // viewBox 200x284. Figure seen from behind: head, neck and shoulders; the shirt covers the torso.
  const SHIRT="M52 92 L80 80 Q100 90 120 80 L148 92 L190 120 L174 160 L152 148 L154 272 Q100 280 46 272 L48 148 L26 160 L10 120 Z";
  // Statue figure from behind: a smaller head with a hair line, a neck, sloping shoulders (no face is ever drawn).
  const BODY="M100 12 C86 12 78 24 78 40 C78 54 85 63 92 67 L91 78 C84 82 70 86 58 90 C40 95 30 104 26 120 L20 200 L22 284 L178 284 L180 200 L174 120 C170 104 160 95 142 90 C130 86 116 82 109 78 L108 67 C115 63 122 54 122 40 C122 24 114 12 100 12 Z";
  function patternSvg(k,id){
    const a=k.alt;
    switch(k.pattern){
      case "stripes":{let r="";for(let x=10;x<200;x+=36)r+=`<rect x="${x}" y="70" width="18" height="214" fill="${a}"/>`;return r;}
      case "hoops":{let r="";for(let y=98;y<284;y+=40)r+=`<rect x="0" y="${y}" width="200" height="20" fill="${a}"/>`;return r;}
      case "halves":return `<rect x="100" y="70" width="100" height="214" fill="${a}"/>`;
      case "band":return `<rect x="80" y="70" width="40" height="214" fill="${a}"/>`;
      case "sash":return `<path d="M0 230 L200 70 L200 120 L0 284 Z" fill="${a}"/>`;
      case "sleeves":return `<path d="M52 92 L10 120 L26 160 L48 148 Z M148 92 L190 120 L174 160 L152 148 Z" fill="${a}"/>`;
      default:return "";
    }
  }
  function shirtSvg(player,{name=true}={}){
    const p=player||{};const k=kit(p.club);const id="mq"+(++uid);
    const nm=backName(p.name);const fs=nm.length>11?Math.max(12,Math.round(196/nm.length)):18;
    const num=p.number==null||p.number===""?"":String(p.number);
    // Trophy-statue finish: the club colour warmed toward gold, lit from the top left, dark at the edges.
    const lum0=(h)=>{const n=parseInt(h.slice(1),16);return .2126*(n>>16)+.7152*((n>>8)&255)+.0722*(n&255);};
    const mix=(h1,h2,t)=>{const a=parseInt(h1.slice(1),16),b=parseInt(h2.slice(1),16);return "#"+[16,8,0].map((sh)=>Math.round(((a>>sh)&255)*(1-t)+((b>>sh)&255)*t).toString(16).padStart(2,"0")).join("");};
    const warm=mix(k.base,"#c99b45",lum0(k.base)>200?.42:.28),figTop=shade(warm,1.2),figLow=shade(warm,.22);
    const lum=(h)=>{const n=parseInt(h.slice(1),16);return .2126*(n>>16)+.7152*((n>>8)&255)+.0722*(n&255);};
    const edge=lum(k.num)>140?"#0b0d10":"#f4f2ec";
    return `<svg class="mqShirt" viewBox="0 0 200 284" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">
<defs>
 <radialGradient id="${id}f" cx=".36" cy=".14" r=".9"><stop offset="0" stop-color="${figTop}"/><stop offset=".3" stop-color="${warm}"/><stop offset=".68" stop-color="${shade(warm,.55)}"/><stop offset="1" stop-color="${figLow}"/></radialGradient>
 <linearGradient id="${id}e" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000" stop-opacity=".7"/><stop offset=".26" stop-color="#000" stop-opacity="0"/><stop offset=".42" stop-color="#fff" stop-opacity=".16"/><stop offset=".6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".75"/></linearGradient>
 <radialGradient id="${id}h" cx=".4" cy=".3" r=".75"><stop offset="0" stop-color="#fff" stop-opacity=".18"/><stop offset=".5" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".6"/></radialGradient>
 <filter id="${id}r" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3" result="b"/><feFlood flood-color="#f2c45b" flood-opacity=".75"/><feComposite in2="b" operator="in"/><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter>
 <linearGradient id="${id}g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff1b8"/><stop offset=".45" stop-color="#f2c45b"/><stop offset="1" stop-color="#a87a2c"/></linearGradient>
 <linearGradient id="${id}s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".22"/><stop offset=".4" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".28"/></linearGradient>
 <clipPath id="${id}c"><path d="${SHIRT}"/></clipPath>
</defs>
<g class="mqFig"><path d="${BODY}" fill="url(#${id}f)" stroke="url(#${id}g)" stroke-width="3.4" stroke-linejoin="round" filter="url(#${id}r)"/>
 <path d="${BODY}" fill="url(#${id}e)"/>
 <path d="M60 92 C46 98 36 106 32 122 M140 92 C154 98 164 106 168 122" fill="none" stroke="#000" stroke-opacity=".18" stroke-width="2.4"/>
 <ellipse cx="100" cy="40" rx="22.5" ry="28.5" fill="url(#${id}h)"/>
 <path d="M80 30 C84 16 96 12 104 12 C114 12 121 20 122 30" fill="none" stroke="#fff1b8" stroke-opacity=".6" stroke-width="2.2" stroke-linecap="round"/>
 <path d="M78 46 C82 58 90 64 100 66 C110 64 118 58 122 46" fill="none" stroke="#000" stroke-opacity=".25" stroke-width="3"/></g>
<g class="mqJersey"><g clip-path="url(#${id}c)"><rect x="0" y="60" width="200" height="224" fill="${k.base}"/>${patternSvg(k,id)}<rect x="0" y="60" width="200" height="224" fill="url(#${id}s)"/></g>
 <path d="${SHIRT}" fill="none" stroke="url(#${id}g)" stroke-width="2.4" stroke-linejoin="round"/>
 <path d="M80 80 Q100 92 120 80" fill="none" stroke="${k.trim}" stroke-width="5" stroke-linecap="round"/>
 <path d="M10 120 L26 160 M190 120 L174 160" stroke="${k.trim}" stroke-width="4"/></g>
${name?`<text class="mqBackName" x="100" y="130" text-anchor="middle" font-size="${fs}" fill="${k.num}" stroke="${edge}" stroke-width="3.4" stroke-linejoin="round" paint-order="stroke">${esc(nm)}</text>`:""}
<text class="mqNum" x="100" y="232" text-anchor="middle" font-size="${num.length>1?84:92}" fill="${k.num}" stroke="url(#${id}g)" stroke-width="7" stroke-linejoin="round" paint-order="stroke">${esc(num)}</text>
<text class="mqNum mqNumEdge" x="100" y="232" text-anchor="middle" font-size="${num.length>1?84:92}" fill="none" stroke="${edge}" stroke-width="2" stroke-linejoin="round">${esc(num)}</text>
</svg>`;
  }

  function rankHtml(p,cls){
    const t=p&&p.tier&&TIERS[p.tier]?p.tier:"bronze";
    return `<span class="mqRank ${cls||""}" data-tier="${t}"><b>#${esc(p&&p.rank)}</b><i>${TIERS[t].label}</i></span>`;
  }
  function chip(player,{size="desktop"}={}){
    const p=player||{};const t=p.tier&&TIERS[p.tier]?p.tier:"bronze";
    return `<span class="mpChip mpChip--${size==="phone"?"phone":"desktop"}" data-tier="${t}" title="Marquee Player: ${esc(p.name)}"><b>MP</b><span>${esc(p.name)}</span></span>`;
  }

  const STEPS=Object.freeze(["figure","jersey","number","club","name","rank"]);
  // Seconds from play() start for each step; Nik's pack follows Daniel's by STAGGER. Pause after the number.
  const TIMES=Object.freeze([0.5,2.4,4.0,6.2,7.4,8.8]);
  const STAGGER=0.35;
  const PHONE_MQ="(max-width: 760px) and (orientation: portrait), (min-width: 761px) and (max-width: 1024px) and (orientation: portrait)";

  function side(role,who,p){
    const k=kit(p&&p.club);
    return `<div class="mqSide mqSide--${role}" data-role="${role}">
  <div class="mqWindow">${shirtSvg(p)}<i class="mqFlash"></i></div>
  <div class="mqPlaque">
    <div class="mqWho"><em>${role==="daniel"?"01":"02"}</em><span>${esc(who)}</span></div>
    <div class="mqClub" style="--mq-club:${k.base};--mq-club2:${k.alt}"><i></i><span>${esc(p&&p.club?p.club:"No club")}</span></div>
    <div class="mqName"${String(p&&p.name||"").length>13?' data-long=""':""}>${esc(p&&p.name)}</div>
    ${rankHtml(p)}
  </div>
</div>`;
  }

  const app={
    host:null,data:null,timers:[],
    mount(host,data,{layout="auto"}={}){
      this.unmount();this.host=host;this.data=data||{};
      const d=this.data.daniel||{},n=this.data.nik||{};
      host.classList.add("mqRoot");
      // Same split as Club (css/v10Club.css): upright phones and tablets get the phone plate.
      this.mq=layout==="auto"&&root.matchMedia?root.matchMedia(PHONE_MQ):null;
      const pick=()=>{host.dataset.mqLayout=layout!=="auto"?layout:(this.mq&&this.mq.matches?"phone":"desktop");};
      pick();if(this.mq){this.onMq=pick;this.mq.addEventListener("change",pick);}
      host.dataset.step="0";
      host.innerHTML=`<div class="mqWorld" aria-hidden="true">
  <div class="mqPlate"></div>
  <div class="mqTitle"><small>Career Mode Showdown 17</small><strong>Marquee Player</strong></div>
  <ol class="mqTrack">${STEPS.map((s,i)=>`<li data-n="${i+1}"><i></i><span>${["Walkout","Jersey","Number","Club","Name","Rank"][i]}</span></li>`).join("")}</ol>
  ${side("daniel","Daniel",d)}
  ${side("nik","Nik",n)}
</div>`;
      return this;
    },
    frame(n){
      if(!this.host)return;this.clear();
      this.host.classList.remove("mqPlaying");
      const s=String(Math.max(0,Math.min(6,n|0)));
      this.host.dataset.step=s;for(const el of this.host.querySelectorAll(".mqSide"))el.dataset.step=s;
    },
    play({onDone}={}){
      if(!this.host)return;this.clear();
      const reduced=(root.matchMedia&&root.matchMedia("(prefers-reduced-motion: reduce)").matches)||document.documentElement.dataset.motionReduced==="true";
      if(reduced){this.frame(6);if(onDone)onDone();return;}
      this.frame(0);this.host.classList.add("mqPlaying");
      const sides=[...this.host.querySelectorAll(".mqSide")];
      TIMES.forEach((t,i)=>{
        sides.forEach((el,j)=>this.timers.push(setTimeout(()=>{el.dataset.step=String(i+1);},(t+j*STAGGER)*1000)));
        this.timers.push(setTimeout(()=>{this.host.dataset.step=String(i+1);},t*1000));
      });
      this.timers.push(setTimeout(()=>{this.host.classList.remove("mqPlaying");if(onDone)onDone();},(TIMES[5]+STAGGER+1.2)*1000));
    },
    clear(){for(const t of this.timers)clearTimeout(t);this.timers=[];},
    unmount(){this.clear();if(this.mq&&this.onMq)this.mq.removeEventListener("change",this.onMq);this.mq=this.onMq=null;if(this.host){this.host.innerHTML="";this.host.classList.remove("mqRoot","mqPlaying");delete this.host.dataset.step;delete this.host.dataset.mqLayout;}this.host=null;}
  };

  root.MarqueePlate=Object.freeze({version:1,TIERS,KITS,STEPS,TIMES,kit,backName,shirtSvg,chip,rankHtml,app});
})(typeof window!=="undefined"?window:globalThis);
