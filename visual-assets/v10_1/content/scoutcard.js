/* HO-036 scouting card on the back of the Special Player card (Big Jump, three.js r128 canvas texture).
   Reference copy of the code in the Big Jump preview (v19). Needs from the Big Jump file: TIER, CW, CH,
   cardBase, shieldPath, emboss, drawCardBack, SFX, fired, REDUCED. SCOUT = data/scoutingCards.js keyed "rank|name":
     const SCOUT = {}; CareerModeScoutingCards.cards.forEach(c => { SCOUT[c.rank + "|" + c.name] = [c.style, c.report, c.special]; });
   Wiring: settle() calls drawScoutBack(back.ctx, p); the settled card adds scoutFlip(k) to card.rotation.y;
   the next player starts after SCOUT_END + 0.6 s. */
function wrapLines(ctx, txt, maxW){ const out=[]; let line=""; String(txt||"").split(/\s+/).forEach(w=>{ const t=line?line+" "+w:w; if(ctx.measureText(t).width>maxW&&line){ out.push(line); line=w; } else line=t; }); if(line) out.push(line); return out; }
function drawScoutBack(ctx, p){
  const t=TIER[p.tier], sc=SCOUT[p.rank+"|"+p.name]; cardBase(ctx,t);
  if(!sc){ drawCardBack(ctx,p,3); return; }
  ctx.save(); shieldPath(ctx,14); ctx.clip();
  const dark=t.text.charAt(1)<"8"; // gold, silver, bronze cards carry dark ink
  const plate=dark?"rgba(255,250,236,.62)":"rgba(6,8,16,.58)";
  ctx.fillStyle=plate; ctx.beginPath(); ctx.roundRect?ctx.roundRect(52,72,CW-104,326,14):ctx.rect(52,72,CW-104,326); ctx.fill();
  ctx.textAlign="center"; ctx.fillStyle=t.sub; ctx.font='700 17px "Barlow Condensed"'; if(ctx.letterSpacing!==undefined) ctx.letterSpacing="4px";
  ctx.fillText("SCOUTING REPORT",CW/2,104); if(ctx.letterSpacing!==undefined) ctx.letterSpacing="0px";
  ctx.font='700 40px "Barlow Condensed"'; emboss(ctx,p.short+"  ·  "+p.pos,CW/2,146,t.text,!dark);
  ctx.font='italic 600 24px "Barlow Condensed"'; ctx.fillStyle=t.text; ctx.fillText(sc[0],CW/2,178);
  ctx.globalAlpha=.5; ctx.fillRect(CW/2-60,192,120,2); ctx.globalAlpha=1;
  let fs=24, lines; do { ctx.font='600 '+fs+'px "Barlow Condensed"'; lines=wrapLines(ctx,sc[1],CW-140); fs--; } while(lines.length*fs*1.3>180&&fs>14);
  ctx.fillStyle=t.sub; const lh=(fs+1)*1.3; lines.forEach((l,i)=>ctx.fillText(l,CW/2,222+i*lh));
  const bg=ctx.createLinearGradient(0,404,0,470); bg.addColorStop(0,t.band[0]); bg.addColorStop(.5,t.band[1]); bg.addColorStop(1,t.band[2]); ctx.fillStyle=bg; ctx.fillRect(0,410,CW,58);
  ctx.fillStyle="rgba(0,0,0,.25)"; ctx.fillRect(0,468,CW,2);
  ctx.font='800 30px "Big Shoulders Display"'; ctx.fillStyle=t.bandText; if(ctx.letterSpacing!==undefined) ctx.letterSpacing="4px"; ctx.fillText("WHY HE IS SPECIAL",CW/2,449); if(ctx.letterSpacing!==undefined) ctx.letterSpacing="0px";
  ctx.fillStyle=plate; ctx.beginPath(); ctx.moveTo(70,484); ctx.lineTo(CW-70,484); ctx.lineTo(CW-70,590); ctx.lineTo(CW/2,668); ctx.lineTo(70,590); ctx.closePath(); ctx.fill();
  fs=25; do { ctx.font='600 '+fs+'px "Barlow Condensed"'; lines=wrapLines(ctx,sc[2],CW-170); fs--; } while(lines.length*fs*1.25>140&&fs>14);
  ctx.fillStyle=t.text; const lh2=(fs+1)*1.25; lines.forEach((l,i)=>ctx.fillText(l,CW/2,514+i*lh2));
  ctx.restore();
}
/* after the face: flip to the scouting card, hold, flip back to the face */
const SCOUT_IN=1.5, SCOUT_HOLD=3.4, SCOUT_END=SCOUT_IN+.7+SCOUT_HOLD+.7;
function scoutFlip(k){ const e=x=>x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2, a=SCOUT_IN, b=a+.7, c=b+SCOUT_HOLD, d=c+.7;
  if(k>=a&&!fired.sc1){ fired.sc1=1; SFX.play("flip"); } if(k>=c&&!fired.sc2){ fired.sc2=1; SFX.play("flip"); }
  return k<a?0:k<b?Math.PI*e((k-a)/.7):k<c?Math.PI:k<d?Math.PI+Math.PI*e((k-c)/.7):0; }
