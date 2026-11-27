"use strict";
// Phoenix B2 (r100, Ironman L7 twotabs at terminal-close, seed 1837607164): Daniel's second tab opened through CONTINUE while
// Nik's last acknowledgement was landing. Terminal Close and Final Reconciliation drew the Showdown Champion screen on their own
// reads, but Multi Season Progression still held the season it read just before (2 of 3 accepted, not terminal), so the top
// chip stayed "Season 3 / 3"; no event or timed check was left to read it again (the 15 s timer stands down while the Season
// Commit listener is healthy). The closed Showdown now wakes one Multi Season read, only while the season held for this
// Showdown is not yet terminal.
//   T1 the timing: the tab holds the pre-acknowledgement season (not terminal) and Terminal Close says CLOSED: one read
//   T2 a read already in flight when the close lands (the one that read 2 of 3): it is read again as soon as it ends
//   T3 the season held is already terminal for this Showdown: no read (at most once per tab)
//   T4 another Showdown's close, an ended (DELETED) or still-open state, or no detail: no read
//   T5 a hidden tab reads nothing now (the visibility wake reads when it is shown, as before)
//   T6 the real registration: the close listener is added next to the event and visibility wakes, which stay unchanged
//   T7 the read that answers redraws the chip: pmspRefreshNow decorates after taking the view, and a terminal view writes
//      "Showdown Complete"
//   T8 Terminal Close sends the event with the phase, the rivalry and terminal (CLOSED) that the wake reads
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const code=fs.readFileSync(path.resolve(__dirname,"../../js/productionSharedMultiSeasonProgression.js"),"utf8");
let n=0;const ok=(id,label)=>{n+=1;console.log(`ok ${id} ${label}`);};
const pick=re=>{const m=code.match(re);assert.ok(m,`missing ${re}`);return m[0];};
const src=[pick(/function pmspWake\(\)\{[^\n]*\}\n/),pick(/function pmspTerminalWake\(event\)\{[^\n]*\}\n/)].join("");

function tab({accepted=2,terminal=false,heldRivalry="r1",heldKey="k1",busy=false,hidden=false,marker=true}={}){
  const t={reads:0,ctx:null};
  t.ctx={busy,wakePending:false,view:{rivalryId:heldRivalry,state:{acceptedSeasons:accepted,totalSeasons:3,terminal}},contextKey:heldKey,
    pmspRequest:()=>({rivalryId:"r1",key:"k1"}),pmspSharedMarker:()=>marker,
    root:{document:{visibilityState:hidden?"hidden":"visible"}},
    pmspRefresh:()=>{t.reads+=1;return Promise.resolve(null);}};
  vm.runInNewContext(src+";globalThis.closeEvent=pmspTerminalWake;globalThis.wake=pmspWake;",t.ctx);
  t.close=detail=>t.ctx.closeEvent(detail===undefined?{}:{detail});
  return t;
}
const CLOSED={phase:"CLOSED",rivalryId:"r1",terminal:true};

{const t=tab();t.close(CLOSED);assert.equal(t.reads,1);ok("T1","a tab holding season 3 of 3 before the last acknowledgement reads once when Terminal Close says CLOSED");}
{
  const t=tab({busy:true});t.close(CLOSED);assert.equal(t.reads,0);assert.equal(t.ctx.wakePending,true,"the close is kept for the end of the read in flight");
  const fin=pick(/\.finally\(\(\)=>\{busy=false;[^}]*pmspRender\(\);if\(wakePending\)\{wakePending=false;root\.setTimeout\?\.\(pmspWake,0\);\}\}\)/);assert.ok(fin);
  t.ctx.busy=false;t.ctx.wakePending=false;t.ctx.wake();assert.equal(t.reads,1);
  ok("T2","a read in flight when the close lands is followed by another read as soon as it ends");
}
{const t=tab({accepted:3,terminal:true});t.close(CLOSED);t.close(CLOSED);assert.equal(t.reads,0);ok("T3","a season already terminal for this Showdown reads nothing, however often Terminal Close redraws");}
{
  for(const [label,detail] of [["another Showdown",{phase:"CLOSED",rivalryId:"r2",terminal:true}],["ended early",{phase:"DELETED",rivalryId:"r1",terminal:false}],["still open",{phase:"OPEN",rivalryId:"r1",terminal:false}],["no detail",undefined]]){const t=tab();t.close(detail);assert.equal(t.reads,0,label);}
  {const t=tab();t.ctx.closeEvent(null);assert.equal(t.reads,0,"no event");}
  {const t=tab({accepted:3,terminal:true,heldRivalry:"r0"});t.close(CLOSED);assert.equal(t.reads,1,"a terminal season of an older Showdown does not count for this one");}
  {const t=tab({accepted:3,terminal:true,heldKey:"k0"});t.close(CLOSED);assert.equal(t.reads,1,"a terminal season held for another context does not count");}
  ok("T4","another Showdown, an ended or open state, or no detail reads nothing; a terminal season held for another Showdown or context does not stop the read");
}
{const t=tab({hidden:true});t.close(CLOSED);assert.equal(t.reads,0);const u=tab({marker:false});u.close(CLOSED);assert.equal(u.reads,0);ok("T5","a hidden tab (or one with no shared Showdown) reads nothing now; the visibility wake stays the way back");}
{
  const install=pick(/function pmspInstall\(\)\{[^\n]*\n/);
  for(const event of ["career-mode-shared-wait-context-change","career-mode-shared-history-convergence-state-change","career-mode-shared-setup-state-change","career-mode-connected-account-state-change","career-mode-app-check-state-change"])assert.ok(install.includes(`"${event}"`),event);
  assert.ok(/addEventListener\?\.\(event,pmspWake\)/.test(install)&&/addEventListener\?\.\("visibilitychange",pmspWake\)/.test(install));
  assert.ok(/root\.addEventListener\?\.\("career-mode-shared-terminal-close-state-change",pmspTerminalWake\);/.test(install),"the close listener is registered once, in install");
  assert.equal((code.match(/career-mode-shared-terminal-close-state-change/g)||[]).length,1,"one listener only");
  assert.ok(/root\.setInterval\(\(\)=>\{if\(!root\.CareerModeProductionSharedSeasonCommit\?\.waitingListenerHealthy\?\.\(\)&&pmspPollDue\(\)\)pmspWake\(\);\},POLL_MS\)/.test(install),"the timed check is unchanged");
  ok("T6","install adds the close listener beside the unchanged event, visibility and timed wakes");
}
{
  const now=pick(/async function pmspRefreshNow\(request=pmspRequest\(\)\)\{[\s\S]*?\n  \}\n/);
  assert.ok(/view=result;contextKey=request\.key;[\s\S]*pmspRender\(\);pmspDecorateDashboard\(\);/.test(now),"the read takes the view, then redraws and decorates");
  assert.ok(/pmspText\(pmspField\("seasonIndicator"\),state\.terminal\?"Showdown Complete":`Season \$\{cursor\} \/ \$\{total\}`\);/.test(code),"a terminal view writes Showdown Complete on the chip");
  ok("T7","the read that answers redraws the chip as Showdown Complete");
}
{
  const term=fs.readFileSync(path.resolve(__dirname,"../../js/productionSharedTerminalClose.js"),"utf8");
  assert.ok(/new root\.CustomEvent\("career-mode-shared-terminal-close-state-change",\{detail:\{phase:state\.phase,rivalryId:state\.rivalryId\|\|request\.rivalryId,terminal:state\.phase==="CLOSED"\}\}\)/.test(term));
  ok("T8","Terminal Close sends phase, rivalry and terminal (CLOSED), the fields the wake reads");
}
console.log(`PASS r100 terminal wake contracts (${n} checks)`);
