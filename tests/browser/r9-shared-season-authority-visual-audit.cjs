"use strict";

const assert=require("node:assert/strict");
const {chromium}=require("playwright");
const {resolveChromiumRuntime}=require("../support/chromium-runtime.cjs");

const baseUrl=new URL(process.env.CMS_BASE_URL||"http://127.0.0.1:4173/");

async function installFixture(page){
  await page.addInitScript(()=>{
    // Keep unrelated idle SSJR/offline bootstrap dormant. Focused production
    // audits own provider semantics; this audit owns only R9 visual composition.
    window.getOfflineAppDiagnostics=()=>({r9SeasonAuthorityVisualAudit:true});
  });
  await page.goto(baseUrl.href,{waitUntil:"domcontentloaded"});
  await page.locator("#loadingScreen").waitFor({state:"hidden",timeout:12000});
  await page.waitForFunction(()=>{
    const link=document.querySelector('link[data-visual-fidelity="reus-r3"]');
    return Boolean(link&&link.sheet&&typeof window.ensureGameplayModules==="function");
  },null,{timeout:12000});

  await page.evaluate(async()=>{
    await ensureGameplayModules();
    if(typeof ensureSeasonReviewUI==="function")ensureSeasonReviewUI();

    document.querySelectorAll(".screen").forEach(node=>node.classList.add("hidden"));
    const screen=document.getElementById("seasonEntry");
    screen.classList.remove("hidden");
    screen.setAttribute("aria-hidden","false");

    // Keep manager identity consistent with the production product contract.
    document.getElementById("seasonManagerOne").textContent="DANIEL";
    document.getElementById("seasonManagerTwo").textContent="NIK";
    document.getElementById("seasonClubOne").textContent="ARSENAL";
    document.getElementById("seasonClubTwo").textContent="LIVERPOOL";

    const review=document.getElementById("seasonReviewPanel");
    if(!review)throw new Error("Season Review UI was not created by the gameplay runtime.");
    const actions=review.querySelector(".seasonReviewActions");
    if(!actions)throw new Error("Season Review actions are unavailable.");

    const ensure=(id,tag="div",className="",parent=review)=>{
      let node=document.getElementById(id);
      if(!node){
        node=document.createElement(tag);
        node.id=id;
        if(className)node.className=className;
        parent.appendChild(node);
      }
      return node;
    };
    const ensureBeforeActions=(id,tag="div",className="")=>{
      let node=document.getElementById(id);
      if(!node){
        node=document.createElement(tag);
        node.id=id;
        if(className)node.className=className;
        actions.parentNode.insertBefore(node,actions);
      }
      return node;
    };

    const commitStatus=ensureBeforeActions("sharedSeasonCommitStatus","p","seasonReviewWarning sharedSeasonCommitStatus");
    const commitAction=ensure("sharedSeasonCommitAction","button","menuButton",actions);
    commitAction.type="button";

    const scoring=ensureBeforeActions("sharedCanonicalScoringPanel","section","seasonReviewBreakdown sharedCanonicalScoringPanel");
    scoring.setAttribute("aria-live","polite");
    const scoringHeading=ensure("sharedCanonicalScoringHeading","h3","",scoring);
    const scoringTotals=ensure("sharedCanonicalScoringTotals","p","",scoring);
    const scoringBreakdown=ensure("sharedCanonicalScoringBreakdown","p","",scoring);
    const scoringWinner=ensure("sharedCanonicalScoringWinner","p","",scoring);

    const history=ensure("sharedHistoryConvergencePanel","section","seasonReviewSummary sharedHistoryConvergencePanel",review);
    const historyHeading=ensure("sharedHistoryConvergenceHeading","h3","",history);
    const historySummary=ensure("sharedHistoryConvergenceSummary","p","",history);
    const historyRecords=ensure("sharedHistoryConvergenceRecords","p","",history);
    const historyTrophies=ensure("sharedHistoryConvergenceTrophies","p","",history);

    const progressionStatus=ensureBeforeActions("sharedMultiSeasonProgressionStatus","p","seasonReviewWarning sharedMultiSeasonProgressionStatus");
    const progressionAction=ensure("sharedMultiSeasonContinueAction","button","menuButton",actions);
    progressionAction.type="button";

    const finalPanel=ensure("sharedFinalReconciliationPanel","section","seasonReviewSummary sharedFinalReconciliationPanel",review);
    const finalHeading=ensure("sharedFinalReconciliationHeading","h3","",finalPanel);
    const finalSummary=ensure("sharedFinalReconciliationSummary","p","",finalPanel);
    const finalWinner=ensure("sharedFinalReconciliationWinner","p","",finalPanel);
    const finalClose=ensure("sharedFinalReconciliationClose","p","",finalPanel);

    const terminal=ensure("sharedTerminalClosePanel","section","seasonReviewSummary sharedTerminalClosePanel",review);
    terminal.dataset.sharedTerminalClose="true";
    const terminalHeading=ensure("sharedTerminalCloseHeading","h3","",terminal);
    const terminalSummary=ensure("sharedTerminalCloseSummary","p","",terminal);
    const terminalStatus=ensure("sharedTerminalCloseStatus","p","stateNote",terminal);
    terminalStatus.setAttribute("role","status");
    terminalStatus.setAttribute("aria-live","polite");
    const terminalActions=ensure("sharedTerminalCloseActions","div","seasonReviewActions",terminal);
    const terminalClose=ensure("sharedTerminalCloseAction","button","menuButton",terminalActions);
    terminalClose.type="button";
    const terminalRetry=ensure("sharedTerminalCloseRetry","button","compactButton",terminalActions);
    terminalRetry.type="button";

    const reviewOne=document.getElementById("seasonReviewOne");
    const reviewTwo=document.getElementById("seasonReviewTwo");
    const renderCard=(node,name,club,position,points,goals)=>{
      node.replaceChildren();
      const h=document.createElement("h3");h.textContent=name;
      const c=document.createElement("p");c.className="summaryClub";c.textContent=club;
      node.append(h,c);
      for(const [label,value] of [["League Position",position],["League Points",points],["League Goals",goals]]){
        const row=document.createElement("div");row.className="summaryLine seasonReviewLine";
        const a=document.createElement("span");a.textContent=label;
        const b=document.createElement("strong");b.textContent=String(value);
        row.append(a,b);node.append(row);
      }
      const achievements=document.createElement("div");achievements.className="seasonReviewAchievements";
      for(const [label,earned] of [["Domestic Cup",true],["Champions League",false],["Top Scorer",true],["Top Assist",false]]){
        const item=document.createElement("span");item.className=earned?"isEarned":"isNotEarned";item.textContent=(earned?"✓ ":"— ")+label;achievements.append(item);
      }
      node.append(achievements);
    };
    renderCard(reviewOne,"Daniel","Arsenal",1,96,101);
    renderCard(reviewTwo,"Nik","Liverpool",3,84,79);

    const entryGrid=document.querySelector("#seasonEntry .seasonEntryGrid");
    const entryHint=document.querySelector("#seasonEntry .seasonEntryHint");
    const entryActions=document.getElementById("completeSeason")?.closest(".seasonEntryActions");
    const entryCards=Array.from(entryGrid?.querySelectorAll(".seasonResultCard")||[]);
    const reviewIntro=review.querySelector(".seasonReviewIntro");
    const reviewResult=document.getElementById("seasonReviewResult");
    const reviewWarning=review.querySelector(".seasonReviewWarning:not(#sharedSeasonCommitStatus):not(#sharedMultiSeasonProgressionStatus)");
    const confirm=document.getElementById("confirmSeasonCompletion");
    const edit=document.getElementById("editSeasonResults");

    const allStageNodes=[
      commitStatus,commitAction,scoring,history,progressionStatus,progressionAction,
      finalPanel,terminal
    ];
    const setHidden=(node,hidden)=>{if(node)node.classList.toggle("hidden",Boolean(hidden));};
    const reset=()=>{
      allStageNodes.forEach(node=>setHidden(node,true));
      terminalClose.classList.add("hidden");
      terminalRetry.classList.add("hidden");
      delete review.dataset.sharedSeasonCommitPhase;
      scoring.dataset.sharedCanonicalScoringPhase="hidden";
      history.dataset.sharedHistoryPhase="hidden";
      finalPanel.dataset.sharedFinalReconciliationPhase="hidden";
      terminal.dataset.sharedTerminalClosePhase="hidden";
      terminal.dataset.terminal="false";
      progressionAction.disabled=false;
      commitAction.disabled=false;
      confirm.disabled=false;
      edit.disabled=false;
      window.scrollTo(0,0);
    };

    const showReview=({phase="review-draft",both=false,heading="REVIEW YOUR SEASON RESULT",status="NOT PUBLISHED YET"}={})=>{
      screen.dataset.sharedSeasonResults="review";
      review.dataset.sharedSeasonResultsPhase=phase;
      setHidden(entryGrid,true);setHidden(entryHint,true);setHidden(entryActions,true);
      setHidden(review,false);setHidden(reviewOne,false);setHidden(reviewTwo,!both);
      document.getElementById("seasonReviewHeading").textContent=heading;
      document.getElementById("seasonReviewStatusMeta").textContent=status;
      if(reviewIntro)reviewIntro.textContent="Shared result authority is staged. Only the currently eligible action should be emphasized.";
      if(reviewResult)reviewResult.textContent=both?"Both managers published. Scoring remains a separate authoritative capability.":"Your rival result remains private until both managers publish.";
      if(reviewWarning)reviewWarning.textContent=both?"RESULT PUBLICATION COMPLETE · SHARED SCORING REMAINS A SEPARATE CAPABILITY":"PUBLISHING IS FINAL FOR YOUR MANAGER";
      setHidden(confirm,both);
      setHidden(edit,both);
    };

    window.__r9SeasonVisual={
      states:["entry","review","published","results-ready","commit-coordinator","commit-peer","ack-required","ack-waiting","scored","history","continue","final","terminal-ready","terminal-blocked","terminal-recovery","terminal-closed"],
      render(name){
        reset();
        document.getElementById("seasonEntryTitle").textContent="SEASON 10 SHARED RESULTS";
        if(name==="entry"){
          screen.dataset.sharedSeasonResults="entry";
          review.dataset.sharedSeasonResultsPhase="entry";
          setHidden(review,true);setHidden(entryGrid,false);setHidden(entryHint,false);setHidden(entryActions,false);
          entryCards.forEach((card,index)=>setHidden(card,index!==0));
          document.getElementById("completeSeason").textContent="REVIEW MY SEASON RESULT";
          return;
        }

        const published=name==="published";
        const ready=!["review","published"].includes(name);
        showReview({
          phase:ready?"results-ready":published?"collecting-published":"review-draft",
          both:ready,
          heading:ready?"BOTH MANAGERS PUBLISHED":published?"YOUR RESULT IS PUBLISHED":"REVIEW YOUR SEASON RESULT",
          status:ready?"RESULTS READY · BOTH PRIVATE SIDES REVEALED":published?"PUBLISHED · WAITING FOR YOUR RIVAL":"NOT PUBLISHED YET"
        });
        if(name==="review"){confirm.textContent="PUBLISH MY SEASON RESULT";edit.textContent="EDIT MY RESULT";return;}
        if(name==="published"){setHidden(confirm,false);confirm.textContent="PUBLISHED ✓";confirm.disabled=true;setHidden(edit,true);return;}
        if(name==="results-ready")return;

        setHidden(commitStatus,false);setHidden(commitAction,false);
        if(name==="commit-coordinator"){
          review.dataset.sharedSeasonCommitPhase="RESULTS_READY";
          commitStatus.textContent="BOTH RESULTS ARE READY · AS COORDINATOR, COMMIT THE IMMUTABLE SHARED SEASON SNAPSHOT";
          commitAction.textContent="COMMIT SHARED SEASON";return;
        }
        if(name==="commit-peer"){
          review.dataset.sharedSeasonCommitPhase="RESULTS_READY";
          commitStatus.textContent="BOTH RESULTS ARE READY · WAITING FOR DANIEL TO COMMIT THE SHARED SEASON";
          commitAction.textContent="WAITING FOR COORDINATOR";commitAction.disabled=true;return;
        }
        if(name==="ack-required"){
          review.dataset.sharedSeasonCommitPhase="COMMITTED";
          commitStatus.textContent="THE SHARED RESULT SNAPSHOT IS COMMITTED · BOTH MANAGERS MUST ACKNOWLEDGE BEFORE SCORING CAN BEGIN";
          commitAction.textContent="ACKNOWLEDGE SHARED SEASON";return;
        }
        if(name==="ack-waiting"){
          review.dataset.sharedSeasonCommitPhase="COMMITTED";
          commitStatus.textContent="YOU ACKNOWLEDGED THIS SHARED SEASON · WAITING FOR YOUR RIVAL";
          commitAction.textContent="ACKNOWLEDGED ✓ · WAITING FOR RIVAL";commitAction.disabled=true;return;
        }

        review.dataset.sharedSeasonCommitPhase="ACKNOWLEDGED";
        commitStatus.textContent="SHARED SEASON COMMIT ACKNOWLEDGED BY BOTH MANAGERS · SCORING REMAINS LOCKED FOR THE NEXT CAPABILITY";
        commitAction.textContent="SEASON COMMIT ACKNOWLEDGED ✓";commitAction.disabled=true;
        setHidden(scoring,false);scoring.dataset.sharedCanonicalScoringPhase="SCORING_RECONCILED";
        scoringHeading.textContent="SHARED CANONICAL SCORE";
        scoringTotals.textContent="Daniel: 11 · Nik: 5";
        scoringBreakdown.textContent="Champions League 0–5 · League Title 3–0 · Domestic Cup 1–0 · Performance Bonus 1–0 · Awards Bonus 1–0";
        scoringWinner.textContent="Season winner: Daniel";
        if(name==="scored")return;

        setHidden(history,false);history.dataset.sharedHistoryPhase="HISTORY_CONVERGED";
        historyHeading.textContent="SHARED HISTORY CONVERGED";
        historySummary.textContent="10 of 10 seasons accepted · PREMIER LEAGUE · Overall: Daniel 74 · Nik 68 · Lead: Daniel +6";
        historyRecords.textContent="Daniel · Arsenal · 6W 2D 2L · 74 showdown pts · Nik · Liverpool · 2W 2D 6L · 68 showdown pts";
        historyTrophies.textContent="Daniel 14 trophies (5 league, 4 cup, 5 Champions League) · Nik 11 trophies (3 league, 3 cup, 5 Champions League)";
        if(name==="history")return;

        setHidden(progressionStatus,false);setHidden(progressionAction,false);
        if(name==="continue"){
          progressionStatus.textContent="SEASON 9 HISTORY IS CONVERGED ON THIS DEVICE · CONTINUE ONCE TO SEASON 10";
          progressionAction.textContent="CONTINUE TO SEASON 10";return;
        }

        progressionStatus.textContent="ALL 10 SEASONS ARE AUTHORITATIVELY ACCEPTED · FINAL RECONCILIATION REMAINS A SEPARATE STEP";
        progressionAction.textContent="SEASON PLAN COMPLETE ✓";progressionAction.disabled=true;
        setHidden(finalPanel,false);finalPanel.dataset.sharedFinalReconciliationPhase="FINAL_SEASON_RECONCILED";
        finalHeading.textContent="SHOWDOWN FINAL RECONCILED";
        finalSummary.textContent="10 OF 10 SEASONS ACCEPTED · NO ADDITIONAL SEASON";
        finalWinner.textContent="Daniel 74 · Nik 68 · DANIEL WINS";
        finalClose.textContent="FINAL RESULTS ARE READ-ONLY · TERMINAL CLOSE REMAINS A SEPARATE STEP";
        if(name==="final")return;

        setHidden(terminal,false);terminal.dataset.sharedTerminalClosePhase=name.replace("terminal-","").replace("ready","READY").replace("blocked","BLOCKED").replace("recovery","RECOVERY_PENDING").replace("closed","CLOSED");
        terminalSummary.textContent="Daniel 74 · Nik 68 · DANIEL WINS";
        if(name==="terminal-ready"){
          terminalHeading.textContent="FINAL RESULT READY FOR TERMINAL CLOSE";
          terminalStatus.textContent="This permanently closes the shared rivalry and exact active private session.";
          setHidden(terminalClose,false);terminalClose.textContent="CLOSE SHARED SHOWDOWN";
        }else if(name==="terminal-blocked"){
          terminalHeading.textContent="TERMINAL CLOSE READY WHEN PRIVATE AUTHORITY RETURNS";
          terminalStatus.textContent="Final results are preserved. Open or join one fresh exact private session for this rivalry, then refresh Terminal Close.";
        }else if(name==="terminal-recovery"){
          terminalHeading.textContent="TERMINAL CLOSE OUTCOME PENDING";
          terminalStatus.textContent="Provider acknowledgement was not received. Retry uses the exact same terminal witness and session capability.";
          setHidden(terminalRetry,false);terminalRetry.textContent="RETRY SAME TERMINAL CLOSE";
        }else{
          terminalHeading.textContent="SHARED SHOWDOWN CLOSED";
          terminalStatus.textContent="TERMINAL · NO NEW SESSION · NO NEW SEASON · FINAL RESULTS REMAIN READ-ONLY";
          terminal.dataset.terminal="true";
        }
      },
      metrics(){
        const visible=node=>node&&getComputedStyle(node).display!=="none"&&node.getClientRects().length>0;
        const visibleButtons=Array.from(document.querySelectorAll("#seasonEntry button")).filter(visible);
        const duplicateIds=Array.from(document.querySelectorAll("[id]")).map(node=>node.id).filter((id,index,all)=>all.indexOf(id)!==index);
        return{
          viewport:{width:innerWidth,height:innerHeight},
          scrollWidth:document.documentElement.scrollWidth,
          clientWidth:document.documentElement.clientWidth,
          duplicateIds:[...new Set(duplicateIds)],
          visibleButtons:visibleButtons.map(button=>({id:button.id,height:button.getBoundingClientRect().height,disabled:button.disabled,text:button.textContent.trim()})),
          visible:{
            entryGrid:visible(entryGrid),review:visible(review),reviewOne:visible(reviewOne),reviewTwo:visible(reviewTwo),
            commit:visible(commitAction),scoring:visible(scoring),history:visible(history),progression:visible(progressionAction),
            final:visible(finalPanel),terminal:visible(terminal),terminalClose:visible(terminalClose),terminalRetry:visible(terminalRetry)
          },
          styles:{
            reviewBackground:getComputedStyle(review).backgroundImage,
            scoringBorder:getComputedStyle(scoring).borderLeftColor,
            terminalBorder:getComputedStyle(terminal).borderLeftColor
          }
        };
      }
    };
  });
}

async function assertState(page,state,{mobile=false}={}){
  await page.evaluate(name=>window.__r9SeasonVisual.render(name),state);
  const m=await page.evaluate(()=>window.__r9SeasonVisual.metrics());
  assert.ok(m.scrollWidth<=m.clientWidth+1,`${state}: horizontal overflow ${m.scrollWidth} > ${m.clientWidth}`);
  assert.deepEqual(m.duplicateIds,[],`${state}: duplicate action/panel IDs are forbidden`);
  if(mobile){
    for(const button of m.visibleButtons)assert.ok(button.height>=43.5,`${state}: #${button.id} is below the 44px mobile target (${button.height})`);
  }

  if(state==="entry"){
    assert.equal(m.visible.entryGrid,true);assert.equal(m.visible.review,false);assert.equal(m.visible.reviewTwo,false);
  }else{
    assert.equal(m.visible.review,true);
    assert.notEqual(m.styles.reviewBackground,"none",`${state}: R9 review treatment is not active`);
  }

  if(state==="published")assert.equal(m.visible.reviewTwo,false,"first publisher must not visually expose rival result");
  if(state==="results-ready")assert.equal(m.visible.reviewTwo,true,"RESULTS_READY must visually expose both reviewed results");
  if(state==="commit-peer"){
    const button=m.visibleButtons.find(item=>item.id==="sharedSeasonCommitAction");
    assert.ok(button&&button.disabled&&/WAITING FOR COORDINATOR/.test(button.text),"peer commit control must remain visibly disabled");
  }
  if(state==="scored")assert.equal(m.visible.scoring,true);
  if(["history","continue","final","terminal-ready","terminal-blocked","terminal-recovery","terminal-closed"].includes(state))assert.equal(m.visible.history,true);
  if(state==="continue"){
    const button=m.visibleButtons.find(item=>item.id==="sharedMultiSeasonContinueAction");
    assert.ok(button&&!button.disabled&&/CONTINUE TO SEASON 10/.test(button.text));
  }
  if(["final","terminal-ready","terminal-blocked","terminal-recovery","terminal-closed"].includes(state)){
    assert.equal(m.visible.final,true);
    const next=m.visibleButtons.find(item=>item.id==="sharedMultiSeasonContinueAction");
    assert.ok(next&&next.disabled&&/SEASON PLAN COMPLETE/.test(next.text),"terminal season must not expose another season");
  }
  if(state==="terminal-ready"){
    assert.equal(m.visible.terminalClose,true);assert.equal(m.visible.terminalRetry,false);
  }
  if(state==="terminal-blocked"){
    assert.equal(m.visible.terminalClose,false);assert.equal(m.visible.terminalRetry,false);
  }
  if(state==="terminal-recovery"){
    assert.equal(m.visible.terminalClose,false);assert.equal(m.visible.terminalRetry,true);
    const retry=m.visibleButtons.find(item=>item.id==="sharedTerminalCloseRetry");
    assert.ok(retry&&/RETRY SAME TERMINAL CLOSE/.test(retry.text),"ambiguous close must retain the real same-witness retry wording");
  }
  if(state==="terminal-closed"){
    assert.equal(m.visible.terminalClose,false);assert.equal(m.visible.terminalRetry,false);
  }
}

(async()=>{
  const runtime=await resolveChromiumRuntime();
  const browser=await chromium.launch({executablePath:runtime.executablePath,headless:true,args:runtime.args});
  const plans=[
    {name:"chromebook",viewport:{width:1366,height:768},mobile:false},
    {name:"phone",viewport:{width:390,height:844},mobile:true}
  ];
  const errors=[];
  try{
    for(const plan of plans){
      const context=await browser.newContext({viewport:plan.viewport,isMobile:plan.mobile,hasTouch:plan.mobile,locale:"en-US"});
      const page=await context.newPage();
      page.on("pageerror",error=>errors.push(`${plan.name}: ${error.message}`));
      try{
        await installFixture(page);
        const states=await page.evaluate(()=>window.__r9SeasonVisual.states);
        for(const state of states)await assertState(page,state,{mobile:plan.mobile});
      }finally{
        await context.close().catch(()=>{});
      }
    }
    assert.deepEqual(errors,[],"R9 Season authority visual audit emitted page errors.");
    process.stdout.write("PASS R9 Shared Season authority visual audit: the current r44 Season Results DOM composes entry, private publication, commit, canonical score, history, next-season, final reconciliation and all Terminal Close presentation states without duplicate controls or horizontal overflow at 1366x768 Chromebook and 390x844 phone geometry; mobile actions retain 44px targets; rival privacy stays visually absent before RESULTS_READY; and terminal states never expose an extra season.\n");
  }finally{
    await browser.close().catch(()=>{});
  }
})().catch(error=>{console.error(error);process.exitCode=1;});
