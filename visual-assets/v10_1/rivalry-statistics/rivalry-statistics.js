(()=>{"use strict";
const q=new URLSearchParams(window.RIVALRY_QS||location.search),F=q.get("frame")||"RV1";
const fallback={strings:{comparisonRows:["Showdown Points","Season Wins","Total Trophies","Champions Leagues","League Titles","Domestic Cups","Transfer Signings"],stateCopy:{}},frames:{RV1:{status:"loading",previewLabel:"Preview data",interimLabel:"Current Showdown only. Career history is not yet available.",clubs:{daniel:"Club",nik:"Club"},totalSeasons:1,transfers:{status:"loading"}}}};
const arts=["../shared/trophies/TRO_SHOWDOWN_CHAMPION_V1_512.webp","../shared/trophies/TRO_LEAGUE_TITLE_V1_512.webp","../shared/trophies/TRO_DOMESTIC_CUP_V1_512.webp","../shared/trophies/TRO_CONTINENTAL_V1_512.webp"],icons=["◇","▦","♛","✦","⬡","♜","⇄"];
const crest=c=>window.getClubCrestSvg?window.getClubCrestSvg(c||""):"";
/* JOB-161 signature motion constants: durations/easing stay screen-local; effects come from the shared kit. */
const RV_MOTION=Object.freeze({
  rows:Object.freeze({duration:260,easing:"cubic-bezier(.22,1,.36,1)",stagger:40}),
  count:Object.freeze({duration:500,easing:"easeOutCubic (shared sdCountUp)"}),
  head:Object.freeze({delay:390,duration:180,easing:"cubic-bezier(.22,1,.36,1)"}),
  reveal:Object.freeze({duration:810,easing:"shared sdReveal keyframes"}),
  burst:Object.freeze({delay:600,duration:360,easing:"shared sdBurst physics",count:24})
});
function mount(map){if(window.ShowdownStage&&!window.rvStage)window.rvStage=window.ShowdownStage.mount(document.getElementById("stage-root"),{plate:{width:1672,height:941,src1x:"assets/ENV_RV_PLATE_V1_1X.webp",src2x:"assets/ENV_RV_PLATE_V1_2X.webp"},platemap:map,focal:{x:836,y:470.5},dustCount:24,phoneBandRatio:.46});}
function value(f,l,s){if(l==="Showdown Points")return f.score?.[s];const r=f.managerRecords?.[s]||{},m={"Season Wins":"seasonWins","Total Trophies":"totalTrophies","Champions Leagues":"championsLeagues","League Titles":"leagueTitles","Domestic Cups":"domesticCups"};if(m[l])return r[m[l]];if(l==="Transfer Signings"){if(["unavailable","partial"].includes(f.transfers?.status))return"Unavailable";if(f.transfers?.status==="loading")return"—";return(f.transfers?.previewPerSeasonSummary||[]).reduce((n,x)=>n+(+x.signings?.[s]||0),0)}return"—"}
function rows(d,f){document.getElementById("rvRows").innerHTML=(d.strings?.comparisonRows||fallback.strings.comparisonRows).map((l,i)=>{const a=value(f,l,"daniel"),b=value(f,l,"nik"),an=typeof a==="number"&&typeof b==="number"&&a>b,bn=typeof a==="number"&&typeof b==="number"&&b>a;return '<div class="rv-row"><span class="rv-value left '+(an?"is-leader":"")+'">'+(a??"—")+'</span><span class="rv-icon" aria-hidden="true">'+icons[i]+'</span><span class="rv-label">'+l+'</span><span class="rv-value right '+(bn?"is-leader":"")+'">'+(b??"—")+"</span></div>"}).join("")}
function head(f){const d=f.managerRecords?.daniel,n=f.managerRecords?.nik;document.getElementById("rvHeadBody").innerHTML='<div class="rv-headGrid"><div class="rv-headStat"><span>DANIEL WINS</span><strong>'+(d?.seasonWins??"—")+'</strong></div><div class="rv-headStat"><span>NIK WINS</span><strong>'+(n?.seasonWins??"—")+'</strong></div><div class="rv-headStat"><span>DRAWS</span><strong>'+(d?.seasonDraws??"—")+"</strong></div></div>"}
function win(f,s){if(s.winner==="draw")return'<span class="rv-seasonWinner"><b class="rv-drawMark">—</b> Draw</span>';const side=s.winner==="nik"?"nik":"daniel",name=side==="daniel"?"Daniel":"Nik";return'<span class="rv-seasonWinner"><span class="rv-seasonCrest" aria-hidden="true">'+crest(f.clubs?.[side])+"</span>"+name+"</span>"}
function seasons(d,f){const e=document.getElementById("rvSeasonBody");if(!f.seasons?.length){e.innerHTML='<div class="rv-emptyInline">'+(d.strings?.emptySeasonHistory||"No season has been completed yet. Statistics will build automatically as seasons are finished.")+"</div>";return}e.innerHTML='<table class="rv-seasonTable"><thead><tr><th>SEASON</th><th>DANIEL</th><th>NIK</th><th>WINNER</th></tr></thead><tbody>'+f.seasons.map(s=>"<tr><td>"+s.season+"</td><td>"+s.score.daniel+"</td><td>"+s.score.nik+"</td><td>"+win(f,s)+"</td></tr>").join("")+"</tbody></table>"}
function champion(f){if(f.ui?.lifecycle!=="completed"||!f.score)return[0,0];if(f.score.daniel===f.score.nik)return[0,0];return f.score.daniel>f.score.nik?[1,0]:[0,1]}
function trophies(d,f){const a=f.managerRecords?.daniel||{},b=f.managerRecords?.nik||{},c=champion(f),L=d.strings?.trophyLabels||{},items=[[L.showdownChampion?.text||"Showdown Champion",c[0],c[1]],[L.leagueTitle?.text||"League Title",a.leagueTitles??"—",b.leagueTitles??"—"],[L.domesticCup?.text||"Domestic Cup",a.domesticCups??"—",b.domesticCups??"—"],[L.championsLeague?.text||"Champions League",a.championsLeagues??"—",b.championsLeagues??"—"]];document.getElementById("rvTrophyBody").innerHTML='<div class="rv-trophyGrid">'+items.map((x,i)=>'<div class="rv-trophy"><img src="'+arts[i]+'" alt="" aria-hidden="true"><span class="rv-trophyLabel">'+x[0]+'</span><span class="rv-trophyCount"><b>D '+x[1]+"</b> · N "+x[2]+"</span></div>").join("")+"</div>"}
function render(d){const f=d.frames?.[F]||d.frames?.RV1||fallback.frames.RV1,s=d.strings||{},state=s.stateCopy||{};document.documentElement.dataset.frame=F;document.documentElement.dataset.readState=f.status||"ready";document.getElementById("rvPreviewChip").textContent=f.previewLabel||s.previewLabel||"Preview data";document.getElementById("rvInterim").textContent=f.interimLabel||"";document.getElementById("rvClubDaniel").textContent=f.clubs?.daniel||s.clubFallback||"Club";document.getElementById("rvClubNik").textContent=f.clubs?.nik||s.clubFallback||"Club";document.getElementById("rvCrestDaniel").innerHTML=crest(f.clubs?.daniel);document.getElementById("rvCrestNik").innerHTML=crest(f.clubs?.nik);document.getElementById("rvProgress").textContent=(f.seasons?.length||0)+" / "+(f.totalSeasons??"—")+" SEASONS COMPLETED";const comp=document.querySelector(".rv-comparison"),cov=document.getElementById("rvCoverage"),read=document.getElementById("rvReadState");comp.classList.remove("hasCoverage");cov.hidden=true;read.hidden=true;read.className="rv-readState";document.querySelectorAll(".rv-bottom").forEach(x=>x.classList.remove("isState"));if(f.status==="loading"||f.status==="unavailable"){read.hidden=false;read.classList.add(f.status);read.textContent=f.status==="loading"?(state.loading?.text||"Loading rivalry statistics…"):(state.unavailable?.text||"Rivalry statistics are unavailable right now.");document.getElementById("rvRows").replaceChildren();document.querySelectorAll(".rv-bottom").forEach(x=>x.classList.add("isState"));document.getElementById("rvHeadBody").innerHTML='<div class="rv-emptyInline">'+read.textContent+"</div>";document.getElementById("rvSeasonBody").innerHTML='<div class="rv-emptyInline">'+read.textContent+"</div>";document.getElementById("rvTrophyBody").innerHTML='<div class="rv-emptyInline">'+read.textContent+"</div>";return}if(f.status==="partial"&&f.coverage){cov.hidden=false;comp.classList.add("hasCoverage");cov.textContent=(state.partial?.text||"Partial rivalry history. Totals reflect available seasons only.")+" "+(state.coverage?.text||"{readable} of {indexed} recorded seasons available.").replace("{readable}",f.coverage.readable).replace("{indexed}",f.coverage.indexed)}rows(d,f);head(f);seasons(d,f);trophies(d,f);if(f.status==="empty"){const msg=s.emptySeasonHistory||"No season has been completed yet. Statistics will build automatically as seasons are finished.";document.getElementById("rvCoverage").hidden=false;document.getElementById("rvCoverage").textContent=msg;comp.classList.add("hasCoverage")}}
function rvNumeric(el){const raw=String(el?.textContent||"").trim().replace(/[^0-9+\\-.]/g,"");if(!raw)return null;const n=Number(raw);return Number.isFinite(n)?n:null}
function signatureMotion(){
  const readState=document.documentElement.dataset.readState;
  if(readState==="loading"||readState==="unavailable")return;
  const reduced=Boolean(window.ShowdownMotion?.isReducedMotion?.());
  document.querySelectorAll("#rvRows .rv-row").forEach((row,i)=>{
    const delay=i*RV_MOTION.rows.stagger;
    row.style.setProperty("--rv-row-delay",delay+"ms");
    row.style.setProperty("--rv-row-duration",RV_MOTION.rows.duration+"ms");
    row.style.setProperty("--rv-row-ease",RV_MOTION.rows.easing);
    if(!reduced)row.classList.add("rv-motion-deal");
    row.querySelectorAll(".rv-value").forEach(el=>{
      const target=rvNumeric(el);if(target===null)return;
      el.setAttribute("data-sd-count","");
      if(el.classList.contains("is-leader"))el.classList.add("sd-count-leader");
      el.textContent="0";
      window.setTimeout(()=>{if(typeof window.sdCountUp==="function")window.sdCountUp(el,target,RV_MOTION.count.duration);else el.textContent=String(target)},reduced?0:delay);
    });
  });
  const head=document.querySelector(".rv-headGrid");
  if(head&&typeof window.sdReveal==="function")window.sdReveal(head);
  document.querySelectorAll(".rv-headStat strong").forEach(el=>{
    el.style.setProperty("--rv-head-delay",RV_MOTION.head.delay+"ms");
    el.style.setProperty("--rv-head-duration",RV_MOTION.head.duration+"ms");
    el.style.setProperty("--rv-head-ease",RV_MOTION.head.easing);
    if(!reduced)el.classList.add("rv-motion-head-slam");
  });
  if(!reduced&&head&&typeof window.sdBurst==="function"){
    const panel=head.closest(".rv-bottom--head");
    if(panel){let canvas=panel.querySelector(".rv-motion-burst");if(!canvas){canvas=document.createElement("canvas");canvas.className="rv-motion-burst";canvas.setAttribute("aria-hidden","true");panel.appendChild(canvas)}
      window.setTimeout(()=>{const r=canvas.getBoundingClientRect();if(r.width>1&&r.height>1)window.sdBurst(canvas,r.width/2,r.height*.48,{count:RV_MOTION.burst.count,duration:RV_MOTION.burst.duration})},RV_MOTION.burst.delay);
    }
  }
}
function boot(d,m){window.RivalryFixtures=d;mount(m);render(d);if(typeof window.sdEnter==="function")window.sdEnter(document.getElementById("statistics"));signatureMotion()}
if(window.RIVALRY_BOOT?.fixtures)boot(window.RIVALRY_BOOT.fixtures,window.RIVALRY_BOOT.platemap||null);else Promise.all([fetch("fixtures.json").then(r=>r.json()),fetch("assets/platemap.json").then(r=>r.json())]).then(x=>boot(x[0],x[1])).catch(()=>boot(fallback,null));
})();