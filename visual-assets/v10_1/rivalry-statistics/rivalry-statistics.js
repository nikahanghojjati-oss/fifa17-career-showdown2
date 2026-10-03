(() => {
"use strict";
const qs = new URLSearchParams(window.RIVALRY_QS || location.search);
const frameName = qs.get("frame") || "RV1";
const fallback = {
 strings:{comparisonRows:["Showdown Points","Season Wins","Total Trophies","Champions Leagues","League Titles","Domestic Cups","Transfer Signings"],stateCopy:{}},
 frames:{RV1:{previewLabel:"Preview data",interimLabel:"Current Showdown only. Career history is not yet available.",status:"loading",clubs:{daniel:"Club",nik:"Club"},season:1,totalSeasons:1,transfers:{status:"loading"}}}
};
const icons=["◆","✦","♛","★","◆","♜","⇄"];
function val(frame,key,side){
 if(key==="Showdown Points") return frame.score?.[side];
 const r=frame.managerRecords?.[side]||{};
 const map={"Season Wins":"seasonWins","Total Trophies":"totalTrophies","Champions Leagues":"championsLeagues","League Titles":"leagueTitles","Domestic Cups":"domesticCups"};
 if(map[key]) return r[map[key]];
 if(key==="Transfer Signings"){
   if(frame.transfers?.status==="unavailable") return "Unavailable";
   if(frame.transfers?.status==="loading") return "—";
   return (frame.transfers?.previewPerSeasonSummary||[]).reduce((n,s)=>n+(s.signings?.[side]||0),0);
 }
 return "—";
}
function render(data){
 const frame=data.frames?.[frameName]||data.frames?.RV1||fallback.frames.RV1;
 document.documentElement.dataset.frame=frameName;
 document.getElementById("rvPreviewChip").textContent=frame.previewLabel||data.strings?.previewLabel||"Preview data";
 document.getElementById("rvInterim").textContent=frame.interimLabel||"";
 document.getElementById("rvClubDaniel").textContent=frame.clubs?.daniel||"Club";
 document.getElementById("rvClubNik").textContent=frame.clubs?.nik||"Club";
 if(window.getClubCrestSvg){
   document.getElementById("rvCrestDaniel").innerHTML=window.getClubCrestSvg(frame.clubs?.daniel||"");
   document.getElementById("rvCrestNik").innerHTML=window.getClubCrestSvg(frame.clubs?.nik||"");
 }
 const rows=data.strings?.comparisonRows||fallback.strings.comparisonRows;
 document.getElementById("rvRows").innerHTML=rows.map((label,i)=>{
   const l=val(frame,label,"daniel"),r=val(frame,label,"nik");
   const ln=typeof l==="number"&&typeof r==="number"&&l>r, rn=typeof l==="number"&&typeof r==="number"&&r>l;
   return `<div class="rv-row"><span class="rv-value left ${ln?"is-leader":""}">${l??"—"}</span><span class="rv-icon" aria-hidden="true">${icons[i]}</span><span class="rv-label">${label}</span><span class="rv-value right ${rn?"is-leader":""}">${r??"—"}</span></div>`;
 }).join("");
 document.getElementById("rvHeadBody").innerHTML=`<div class="rv-mini">Daniel ${frame.managerRecords?.daniel?.seasonWins??"—"} · Nik ${frame.managerRecords?.nik?.seasonWins??"—"} · Draws ${frame.managerRecords?.daniel?.seasonDraws??"—"}</div>`;
 document.getElementById("rvSeasonBody").innerHTML=(frame.seasons?.length?frame.seasons.map(s=>`<div class="rv-mini">SEASON ${s.season} · ${s.score.daniel} — ${s.score.nik} · ${s.winner==="daniel"?"Daniel":s.winner==="nik"?"Nik":"Draw"}</div>`).join(""):`<div class="rv-mini">No season has been completed yet. Statistics will build automatically as seasons are finished.</div>`);
 document.getElementById("rvTrophyBody").innerHTML=`<div class="rv-mini">Daniel ${frame.managerRecords?.daniel?.totalTrophies??"—"} · Nik ${frame.managerRecords?.nik?.totalTrophies??"—"}</div>`;
 const state=document.getElementById("rvState");
 if(frame.status==="loading"||frame.status==="unavailable"||frame.status==="partial"){
   state.style.display="block";
   state.textContent=(data.strings?.stateCopy?.[frame.status]?.text)||"";
 }
}
function boot(data){ window.RivalryFixtures=data; render(data); }
if(window.RIVALRY_BOOT?.fixtures){boot(window.RIVALRY_BOOT.fixtures);}
else fetch("fixtures.json").then(r=>r.json()).then(boot).catch(()=>boot(fallback));
})();