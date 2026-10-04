(() => {
  "use strict";
  const qs = new URLSearchParams(window.CAREER_STATISTICS_QS || location.search);
  const stage = document.getElementById("stage-root");
  const scene = document.getElementById("careerScene");
  if (qs.get("grid") === "1") stage.dataset.grid = "1";
  const NAMES = { daniel: "Daniel", nik: "Nik" };

  const iconSvgs = [
    '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="m32 3 8 18 20 2-15 13 5 20-18-11-18 11 5-20L4 23l20-2z"/></svg>',
    '<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="25" fill="none" stroke="currentColor" stroke-width="6"/><path d="m32 17 10 7-4 12H26l-4-12zm-17 11 11 8-4 13-10-8zm34 0-11 8 4 13 10-8z"/></svg>',
    '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M8 52h10V34H8zm18 0h10V22H26zm18 0h10V10H44z"/></svg>',
    '<img src="../shared/trophies/TRO_SHOWDOWN_CHAMPION_V1_512.webp" alt="" aria-hidden="true">'
  ];

  async function loadFixtures() {
    if (window.CAREER_STATISTICS_FIXTURES) return window.CAREER_STATISTICS_FIXTURES;
    const res = await fetch("fixtures.json", { cache: "no-store" });
    if (!res.ok) throw new Error(`fixtures.json ${res.status}`);
    return res.json();
  }
  async function loadPlatemap() {
    if (window.CAREER_STATISTICS_PLATEMAP) return window.CAREER_STATISTICS_PLATEMAP;
    const res = await fetch("assets/platemap.json", { cache: "no-store" });
    if (!res.ok) throw new Error(`platemap.json ${res.status}`);
    return res.json();
  }
  function mountStage(map) {
    if (!window.ShowdownStage || !scene) throw new Error("Showdown stage engine unavailable");
    const a=window.CAREER_STATISTICS_ASSETS || {};
    const arm=scene.querySelector(".armCutout"), rim=scene.querySelector(".armRim");
    if (arm && a.arm1x) { arm.dataset.src1x=a.arm1x; arm.dataset.src2x=a.arm2x || a.arm1x; }
    if (rim && a.rim1x) { rim.dataset.src1x=a.rim1x; rim.dataset.src2x=a.rim2x || a.rim1x; }
    const focal=Array.isArray(map.focal)?{x:Number(map.focal[0]),y:Number(map.focal[1])}:{x:836,y:340};
    window.__careerStageEngine=ShowdownStage.mount(scene,{
      plate:{width:1672,height:941,src1x:a.plate1x || "assets/ENV_CS_PLATE_V1_1X.webp",src2x:a.plate2x || "assets/ENV_CS_PLATE_V1_2X.webp"},
      focal, platemap:map, dustCount:18, phoneBandRatio:.46
    });
  }
  const fmt = (n) => Number.isInteger(n) ? String(n) : Number(n).toFixed(2).replace(/\.00$/,"");
  const showdownsCount = (frame, role) => frame.showdowns?.[role]?.completed ?? null;
  const rankRows = (frame) => {
    if (frame.expectedCareerTableRows) return frame.expectedCareerTableRows;
    const roles = ["daniel","nik"];
    const sorted = roles.slice().sort((a,b) => {
      const sa=frame.showdowns[a], sb=frame.showdowns[b], ma=frame.managers[a], mb=frame.managers[b];
      return (sb.wins-sa.wins) || (mb.totalTrophies-ma.totalTrophies) || (mb.careerPoints-ma.careerPoints);
    });
    return roles.map(role => ({ manager: role, rank: sorted.indexOf(role)+1 }));
  };
  function applyStrings(fx) {
    const title = document.querySelector("#careerStatisticsScreenTitle .sd-visually-hidden");
    if (title) title.textContent = fx.strings.heading;
    const map = [
      ["careerStatisticsRivalryButton", fx.strings.buttons.rivalry],
      ["careerStatisticsTrophyButton", fx.strings.buttons.trophyRoom]
    ];
    map.forEach(([id,label]) => { const el=document.getElementById(id); const span=el?.querySelector(".actionLabel"); if(span) span.textContent=label; });
    const backLabel=document.querySelector(".backButton .actionLabel"); if(backLabel && fx.strings.buttons.back) backLabel.textContent=fx.strings.buttons.back;
    const back=document.querySelector(".backButton .actionLabel"); if(back) back.textContent=fx.strings.buttons.back;
  }
  function setPreview(frame, fx) {
    const chip = document.getElementById("previewChip");
    const label = frame.previewLabel || fx.strings.previewLabel;
    chip.textContent = label;
    chip.hidden = !label;
  }
  function renderHeadline(frame, fx) {
    const host = document.getElementById("headlineTiles");
    host.replaceChildren();
    const labels=fx.strings.headlineLabels;
    const D=frame.managers?.daniel, N=frame.managers?.nik;
    const vals = D && N ? [
      { combined: Math.max(showdownsCount(frame,"daniel"),showdownsCount(frame,"nik")), together:true },
      { pair:[D.seasons,N.seasons] },
      { pair:[D.careerPoints,N.careerPoints] },
      { pair:[D.totalTrophies,N.totalTrophies] }
    ] : [];
    labels.forEach((label,i) => {
      const card=document.createElement("article"); card.className="headlineTile";
      const val=vals[i];
      const valueHtml = val ? (val.pair
        ? `<div class="headlinePair"><small>D</small><b>${fmt(val.pair[0])}</b><span class="slash">/</span><small>N</small><b>${fmt(val.pair[1])}</b></div>`
        : `<div class="headlineNumber">${fmt(val.combined)}</div><div class="headlineTogether">Together</div>`)
        : '<div class="headlinePair"><b aria-hidden="true">—</b></div>';
      card.innerHTML=`<div class="headlineIcon">${iconSvgs[i]}</div><div class="headlineCopy"><div class="headlineLabel">${label}</div>${valueHtml}</div>`;
      host.appendChild(card);
    });
  }
  function renderTable(frame, fx) {
    const panel=document.getElementById("careerTablePanel"); panel.replaceChildren();
    const h=document.createElement("h2"); h.id="careerTableHeading"; h.className="panelTitle"; h.textContent=fx.strings.sections.careerTable; panel.appendChild(h);
    const t=document.createElement("table"); t.className="careerTable";
    const head=document.createElement("thead"); head.innerHTML=`<tr>${fx.strings.careerTableHeaders.map(x=>`<th scope="col">${x}</th>`).join("")}</tr>`; t.appendChild(head);
    const body=document.createElement("tbody"); const ranks=rankRows(frame);
    ["daniel","nik"].forEach(role=>{
      const m=frame.managers[role], s=frame.showdowns[role], rr=ranks.find(x=>x.manager===role); const tr=document.createElement("tr");
      if (rr.rank===1) tr.className="leaderRow";
      tr.innerHTML=`<td>${rr.rank}</td><td><span class="managerName">${rr.rank===1?'<span class="rankCrown" aria-label="Career leader">♛</span>':''}${NAMES[role]}</span></td><td>${s.completed}</td><td>${m.seasonWins}-${m.seasonDraws}-${m.seasonLosses}</td><td>${m.careerPoints}</td><td>${m.totalTrophies}</td>`;
      body.appendChild(tr);
    }); t.appendChild(body); panel.appendChild(t);
  }
  function renderComparison(frame, fx) {
    const panel=document.getElementById("comparisonPanel"); panel.replaceChildren();
    const h=document.createElement("h2"); h.id="comparisonHeading"; h.className="panelTitle"; h.textContent=fx.strings.sections.managerComparison; panel.appendChild(h);
    const body=document.createElement("div"); body.className="comparisonBody";
    const rows=[
      [fx.strings.comparisonRows[0],"leagueTitles"],[fx.strings.comparisonRows[1],"domesticCups"],[fx.strings.comparisonRows[2],"championsLeagues"],
      [fx.strings.comparisonRows[3],"seasonWins"],[fx.strings.comparisonRows[4],"averageLeaguePoints"],[fx.strings.comparisonRows[5],"averageLeagueGoals"]
    ];
    rows.forEach(([label,key])=>{
      const d=frame.managers.daniel[key], n=frame.managers.nik[key], max=Math.max(Number(d),Number(n),1);
      const row=document.createElement("div"); row.className="compareRow";
      row.innerHTML=`<span class="dValue">${fmt(d)}</span><span class="compareLabel">${label}</span><span class="nValue">${fmt(n)}</span><span class="compareTrack"><i class="danielBar" style="width:${(Number(d)/max*50).toFixed(2)}%"></i><i class="nikBar" style="width:${(Number(n)/max*50).toFixed(2)}%"></i></span>`;
      body.appendChild(row);
    }); panel.appendChild(body);
  }
  const leader = (d,n,key) => d[key]===n[key] ? {role:"shared",name:"Daniel + Nik",value:d[key]} : (d[key]>n[key]?{role:"daniel",name:"Daniel",value:d[key]}:{role:"nik",name:"Nik",value:n[key]});
  function renderLeaders(frame, fx) {
    const panel=document.getElementById("leadersPanel"); panel.replaceChildren();
    const h=document.createElement("h2"); h.id="leadersHeading"; h.className="panelTitle"; h.textContent=fx.strings.sections.careerLeaders; panel.appendChild(h);
    const D=frame.managers.daniel,N=frame.managers.nik;
    const specs=[[fx.strings.leaderLabels[0],"seasonWins","wins"],[fx.strings.leaderLabels[1],"totalTrophies","trophies"],[fx.strings.leaderLabels[2],"careerPoints","pts"],[fx.strings.leaderLabels[3],"bestSeasonScore","pts"]];
    const grid=document.createElement("div"); grid.className="leaderGrid";
    specs.forEach(([label,key,suffix])=>{
      const x=leader(D,N,key), portraitRole=x.role==="shared"?"daniel":x.role;
      const card=document.createElement("article"); card.className="leaderCard";
      card.innerHTML=`<span class="managerPortrait ${portraitRole}" role="img" aria-label="${x.name} portrait crop"></span><div><div class="leaderLabel">${label}</div><div class="leaderName">${x.name}</div><div class="leaderValue">${fmt(x.value)} ${suffix}</div></div>`;
      grid.appendChild(card);
    }); panel.appendChild(grid);
  }
  function renderState(frame, fx) {
    const state=document.getElementById("statePanel");
    const panels=[document.getElementById("careerTablePanel"),document.getElementById("comparisonPanel"),document.getElementById("leadersPanel")];
    document.querySelector(".partialBanner")?.remove();
    if (frame.status==="ready" || frame.status==="partial") {
      state.hidden=true; panels.forEach(x=>x.hidden=false);
      renderTable(frame,fx); renderComparison(frame,fx); renderLeaders(frame,fx);
      if(frame.status==="partial") {
        const b=document.createElement("div"); b.className="partialBanner";
        const copy=fx.strings.stateCopy.partial;
        const coverage=fx.strings.coverageTemplate.replace("{READABLE}",frame.coverage.readable).replace("{INDEXED}",frame.coverage.indexed);
        b.innerHTML=`<div><strong>${copy.heading}</strong><span class="partialCoverage">${coverage}</span></div><span class="partialBody">${copy.body}</span>`;
        document.getElementById("careerStatistics").appendChild(b);
      }
      return;
    }
    panels.forEach(x=>x.hidden=true); state.hidden=false; state.replaceChildren();
    let heading="", body="", icon="◇";
    if(frame.status==="empty") { heading=fx.strings.noCompletedRecord || "No completed record yet"; body="Career Statistics will build automatically after the first completed showdown. Current-showdown statistics remain available from Showdown Home."; icon="0"; }
    else { const c=fx.strings.stateCopy[frame.status]; heading=c.heading; body=c.body; icon=frame.status==="loading"?"…":"!"; }
    state.innerHTML=`<div class="stateIcon" aria-hidden="true">${icon}</div><h2>${heading}</h2><p>${body}</p>`;
  }
  function renderFrame(fx, key) {
    const frame=fx.frames[key] || fx.frames.CS1;
    stage.dataset.frame=key in fx.frames?key:"CS1"; stage.dataset.state=frame.status;
    setPreview(frame,fx); renderHeadline(frame,fx); renderState(frame,fx);
    document.querySelectorAll(".actionButton").forEach(b=>b.addEventListener("click",()=>{stage.dataset.lastIntent=b.id||"backButton";}));
  }
  Promise.all([loadFixtures(),loadPlatemap()]).then(async ([fx,map])=>{ window.__careerFixtures=fx; window.__careerPlatemap=map; mountStage(map); applyStrings(fx); renderFrame(fx,qs.get("frame")||"CS1"); if(document.fonts?.ready) await document.fonts.ready; window.__careerStatisticsReady=true; }).catch(err=>{ console.error(err); document.getElementById("statePanel").hidden=false; document.getElementById("statePanel").textContent="Career Statistics preview failed to load."; });
})();
