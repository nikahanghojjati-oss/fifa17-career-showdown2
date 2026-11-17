(async()=>{
const OPT=window.__OPT, phone=innerWidth<=900;
const h=document.getElementById("clubWheelScreen");
const crest=n=>getClubCrestSvg(n);
const st=document.createElement("style");
st.textContent=`
#clubWheelScreen > :not(.stage):not(.csx):not(.cl-footer):not(.phoneHeroStage):not(.clPhoneScene){visibility:hidden!important}
#clubWheelScreen .clubAnticipationDim{display:none!important}
#clubWheelScreen .phoneHeroStage .clubPackStage{visibility:hidden!important}
.csx{position:absolute;inset:0;z-index:30;font-family:"Barlow Condensed","Oswald",sans-serif;color:#f6eedb;pointer-events:none}
.csx *{box-sizing:border-box}
.csx .mar{background:#0b0a08 url("css/r78-marble-tile.webp") 0 0/256px 256px repeat;border:1px solid rgba(242,196,91,.8);border-radius:3px;box-shadow:inset 0 0 0 3px rgba(17,15,12,.9),inset 0 0 0 4px rgba(242,196,91,.3),0 0 0 1px #000,0 10px 24px rgba(0,0,0,.55)}
.csx .kick{font:600 12px/1 "Barlow Condensed",sans-serif;letter-spacing:.34em;color:#f2c45b;text-transform:uppercase}
.csx .ttl{font:800 30px/1.05 "Barlow Condensed",sans-serif;letter-spacing:.04em;text-transform:uppercase;background:linear-gradient(#fff1b8,#f2c45b 55%,#b98a2f);-webkit-background-clip:text;color:transparent;filter:drop-shadow(0 2px 1px #000)}
.csx .who{font:700 12px/1 "Barlow Condensed";letter-spacing:.26em;color:#c9bc9c;text-transform:uppercase}
.csx .club{font:800 26px/1.05 "Barlow Condensed";letter-spacing:.02em;color:#fff3c4;text-transform:uppercase}
.csx .num{display:inline-grid;place-items:center;width:22px;height:22px;margin-right:8px;background:#f2c45b;color:#140e04;font:800 13px/1 "Barlow Condensed";vertical-align:2px}
.csx .meta{display:flex;gap:10px;justify-content:center;flex-wrap:wrap}
.csx .meta span{padding:6px 12px;border:1px solid rgba(242,196,91,.45);font:600 13px/1 "Barlow Condensed";letter-spacing:.16em;text-transform:uppercase;color:#f6e3a8;background:rgba(0,0,0,.35)}
.csx .note{font:500 15px/1.35 "Barlow",sans-serif;color:#efe6cf;text-align:center}
.csx .btn{display:flex;align-items:center;justify-content:center;min-height:48px;padding:0 22px;font:800 17px/1 "Barlow Condensed";letter-spacing:.1em;text-transform:uppercase;border-radius:3px}
.csx .gold{color:#140e04;background:linear-gradient(180deg,#fff1b8 0%,#f2c45b 40%,#c08f33 78%,#8f6420 100%);box-shadow:inset 0 1px 0 rgba(255,255,255,.7),0 0 0 1px #000}
.csx .line{color:#f2c45b;border:1px solid #f2c45b;background:#0b0a08}
.csx .cr svg{width:100%;height:100%;display:block;filter:drop-shadow(0 4px 6px rgba(0,0,0,.7))}
`;
document.head.appendChild(st);
const L={club:"Fiorentina",who:"Daniel"},R={club:"Bologna",who:"Nik"};
const card=(m,n,side,size)=>`<div class="mar" style="display:flex;align-items:center;gap:14px;padding:12px 16px;${side==="r"?"flex-direction:row-reverse;text-align:right":""}"><div class="cr" style="width:${size}px;height:${size}px;flex:none">${crest(m.club)}</div><div><div class="who"><span class="num">0${n}</span>${m.who}</div><div class="club" style="margin-top:6px">${m.club}</div></div></div>`;
const fitIn=(f,m)=>{const ix=f.w*.1,iy=f.h*.1,iw=f.w-2*ix,ih=f.h-2*iy,lab=Math.max(11,Math.min(22,ih*.16)),cs=Math.floor(Math.min(iw,ih-lab*1.5));
 return `<div class="fit" data-f="${[f.x,f.y,f.w,f.h].map(Math.round)}" style="position:absolute;left:${f.x+ix}px;top:${f.y+iy}px;width:${iw}px;height:${ih}px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:${lab*.2}px;overflow:hidden"><div class="cr" style="width:${cs}px;height:${cs}px;flex:none">${crest(m.club)}</div><div class="club" style="font-size:${lab}px;line-height:1.1;text-shadow:0 1px 2px #000,0 0 6px #000;white-space:nowrap">${m.club}</div></div>`;};
const x=document.createElement("div"); x.className="csx";
const W=innerWidth,H=innerHeight;
if(OPT==="A"&&!phone){
 // A: one wide marble stage across the bottom, the faces and the wordmark area stay clear above it
 x.innerHTML=`<div style="position:absolute;left:50%;top:9%;transform:translateX(-50%);text-align:center"><div class="kick">Career Mode Showdown 17</div><div class="ttl" style="font-size:${Math.round(H*.058)}px;margin-top:8px">Career Start</div></div>
 <div class="mar" style="position:absolute;left:5.5%;right:5.5%;bottom:5.2%;padding:16px 20px 18px;display:grid;grid-template-columns:1fr 1.25fr 1fr;gap:18px;align-items:center">
  ${card(L,1,"l",Math.round(H*.105))}
  <div style="text-align:center"><div class="kick">Start your FIFA 17 career</div><div class="note" style="margin:8px 0 10px">Start or load a FIFA 17 Career Mode save with <b style="color:#fff3c4">Fiorentina</b>, then confirm.</div><div class="meta"><span>Serie A</span><span>3 Seasons</span></div></div>
  ${card(R,2,"r",Math.round(H*.105))}
  <div style="grid-column:1/-1;display:flex;gap:14px;justify-content:center"><div class="btn gold" style="min-width:330px">I started at Fiorentina</div><div class="btn line" style="min-width:170px">Refresh</div></div>
 </div>`;
}
if(OPT==="B"&&!phone){
 // B: each manager holds his club crest where the pack was; a narrow marble pillar between them holds the words and buttons
 const pk=[...h.querySelectorAll(".clubPackStage")].map(e=>e.getBoundingClientRect());
 const hold=(r,m)=>fitIn({x:r.x,y:r.y,w:r.width,h:r.height},m);
 x.innerHTML=`<div style="position:absolute;left:50%;top:9%;transform:translateX(-50%);text-align:center;white-space:nowrap"><div class="kick">Career Mode Showdown 17</div><div class="ttl" style="font-size:${Math.round(H*.058)}px;margin-top:8px">Career Start</div></div>
 ${hold(pk[0],L)}${hold(pk[1],R)}
 <div class="mar" style="position:absolute;left:50%;transform:translateX(-50%);top:25%;width:${Math.min(380,W*.27)}px;padding:18px 18px 18px;text-align:center">
  <div class="kick">Start your FIFA 17 career</div>
  <div class="meta" style="margin:12px 0"><span>Serie A</span><span>3 Seasons</span></div>
  <div class="note">Your club is <b style="color:#fff3c4">Fiorentina</b>. Start or load a FIFA 17 Career Mode save with that club, then confirm.</div>
  <div class="kick" style="margin-top:14px;color:#c9bc9c;letter-spacing:.2em">Rival: Nik · Bologna</div>
 </div>
 <div style="position:absolute;left:0;right:0;top:${Math.round(H*.755)}px;display:flex;gap:14px;justify-content:center"><div class="btn gold" style="min-width:360px;min-height:54px">I started at Fiorentina</div><div class="btn line" style="min-width:180px;min-height:54px">Refresh</div></div>`;
}
if(phone){
 const sc=h.querySelector(".clPhoneScene").getBoundingClientRect(), packBottom=h.getBoundingClientRect().top+924*Math.max(W,H*1179/2096)/1179, top=Math.round(OPT==="B"?Math.max(sc.bottom+4,packBottom+6):sc.bottom+4), short=H-top<290;
 st.textContent+=`#clubWheelScreen > .clPhoneScene{visibility:visible!important}`+(OPT==="B"?`#clubWheelScreen .clPhoneScene::before,#clubWheelScreen .clPhoneScene *{display:none!important}`:``);
 const btns=`<div style="margin-top:auto;display:grid;gap:8px"><div class="btn gold">I started at Fiorentina</div><div class="btn line" style="min-height:44px">Refresh</div></div>`;
 if(OPT==="A"){
  x.innerHTML=`<div style="position:absolute;left:0;right:0;top:${sc.top+12}px;text-align:center"><div class="ttl" style="font-size:28px">Career Start</div></div><div class="mar" style="position:absolute;left:8px;right:8px;top:${top}px;bottom:8px;padding:10px;display:flex;flex-direction:column;gap:8px">
   <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
    ${[L,R].map((m,i)=>`<div class="mar" style="padding:8px 6px;display:flex;align-items:center;gap:8px"><div class="cr" style="width:40px;height:40px;flex:none">${crest(m.club)}</div><div><div class="who" style="font-size:10px"><span class="num" style="width:16px;height:16px;margin-right:4px;font-size:11px">0${i+1}</span>${m.who}</div><div class="club" style="font-size:17px;margin-top:3px">${m.club}</div></div></div>`).join("")}
   </div>
   <div style="text-align:center"><div class="kick" style="font-size:11px">Start your FIFA 17 career</div></div>
   <div class="meta"><span>Serie A</span><span>3 Seasons</span></div>
   <div class="note" style="font-size:14px">Start or load a FIFA 17 Career Mode save with <b style="color:#fff3c4">Fiorentina</b>, then confirm.</div>
   ${btns}</div>`;
 } else {
  const bgW=Math.max(W,H*1179/2096),k=bgW/1179,ox=(W-bgW)/2,hr=h.getBoundingClientRect();const fr=(x0,x1)=>({x:ox+x0*k,y:hr.top+584*k,w:(x1-x0)*k,h:340*k});const hold=(f,m)=>fitIn(f,m);
  x.innerHTML=`<div style="position:absolute;left:0;right:0;top:${sc.top+12}px;text-align:center"><div class="ttl" style="font-size:28px">Career Start</div></div>${hold(fr(236,556),L)}${hold(fr(668,996),R)}
   <div class="mar" style="position:absolute;left:8px;right:8px;top:${top}px;bottom:8px;padding:12px;display:flex;flex-direction:column;gap:9px;text-align:center">
   <div class="kick" style="font-size:11px">Start your FIFA 17 career</div>
   <div class="meta"><span>Serie A</span><span>3 Seasons</span></div>
   <div class="note" style="font-size:14px">Your club is <b style="color:#fff3c4">Fiorentina</b>. Start or load a FIFA 17 Career Mode save with that club, then confirm.</div>
   ${short?"":`<div class="kick" style="color:#c9bc9c;letter-spacing:.2em;font-size:11px">Rival: Nik · Bologna</div>`}
   ${btns}</div>`;
 }
}
if(OPT==="B"&&!phone)h.querySelectorAll(".world svg polygon,.world svg polyline").forEach(e=>e.style.display="none");
h.appendChild(x);
await new Promise(r=>setTimeout(r,300));
return [OPT,phone,W,H,Math.round(document.querySelector(".csx .mar:last-of-type")?.getBoundingClientRect().bottom||0),[...x.querySelectorAll(".fit")].map(e=>{const f=e.dataset.f.split(",").map(Number),c=e.querySelector(".cr").getBoundingClientRect(),t=e.querySelector(".club").getBoundingClientRect();const inside=r=>r.left>=f[0]-.5&&r.right<=f[0]+f[2]+.5&&r.top>=f[1]-.5&&r.bottom<=f[1]+f[3]+.5;return inside(c)&&inside(t)?"fits":"OVERFLOW"})];
})()
