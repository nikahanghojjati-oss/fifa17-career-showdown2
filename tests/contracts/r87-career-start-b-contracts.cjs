'use strict';
// HO-049 item 4 · Career Start option B (Nik picked B, 2026-10-31; spec CAREER_START_B_SPEC.md on leads/relay). No browser.
//   B1 Nik's rule: the crest and the club name ALWAYS fit inside the pack frame. The fit is the spec's: inner box = frame inset
//      10% each side, name clamp(11px, innerH x 0.16, 22px), crest square floor(min(innerW, innerH - 1.5 x label)), and it holds
//      for every pack frame of the 7 checked sizes (desktop .clubPackStage rects, phone plate packs) and a sweep of frames.
//   B2 the phone frames are the painted packs on ENV_CLUB_PHONE_V2 (1179x2096): left x 236-556, right 668-996, y 584-924.
//   B3 layout only: the stage reuses the card's nodes, texts, buttons and listeners (I STARTED AT <CLUB>, REFRESH, waiting and
//      error status, reads); the Special Player original-club lines stay (Nik 2026-10-29); any other screen keeps the card.
//   B4 house rules: no dim, no scrim, no blur, no opacity drop (the Club screen's own parts step aside by visibility only),
//      nothing scrolls but main (the panel clips, never scrolls), the audit is exported for the browser check, no code name.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const ROOT=path.resolve(__dirname,'../..');
const read=file=>fs.readFileSync(path.join(ROOT,file),'utf8');
const career=require('../../js/productionSharedCareerStart.js');
const js=read('js/productionSharedCareerStart.js');
const css=read('css/remoteJoining.css');
const stageCss=css.slice(css.indexOf('/* HO-049 item 4'));
let checks=0;
function check(label,fn){fn();checks+=1;console.log(`ok ${checks} ${label}`);}

// The spec's fit, written out independently, and the box test the browser audit uses.
function specFit(f){const ix=f.w*.1,iy=f.h*.1,w=f.w-2*ix,h=f.h-2*iy,label=Math.min(22,Math.max(11,h*.16));return {w,h,label,crest:Math.floor(Math.min(w,h-1.5*label))};}
function assertFits(frame,name){
  const fit=career.fitHold(frame),spec=specFit(frame);
  assert.ok(Math.abs(fit.x-(frame.x+frame.w*.1))<1e-9&&Math.abs(fit.y-(frame.y+frame.h*.1))<1e-9,`${name}: inner box starts 10% in`);
  assert.ok(Math.abs(fit.w-frame.w*.8)<1e-9&&Math.abs(fit.h-frame.h*.8)<1e-9,`${name}: inner box is the frame inset 10% each side`);
  assert.equal(fit.label,spec.label,`${name}: label clamp(11px, innerH x 0.16, 22px)`);
  assert.equal(fit.crest,Math.max(0,spec.crest),`${name}: crest floor(min(innerW, innerH - 1.5 x label))`);
  // crest + gap (0.2 label) + one name line (line-height 1.1) stays inside the inner box, which stays inside the frame
  assert.ok(fit.crest<=fit.w+1e-9,`${name}: crest no wider than the box`);
  assert.ok(fit.crest+fit.gap+fit.label*1.1<=fit.h+1e-9,`${name}: crest and name no taller than the box`);
  assert.ok(fit.x>=frame.x&&fit.y>=frame.y&&fit.x+fit.w<=frame.x+frame.w&&fit.y+fit.h<=frame.y+frame.h,`${name}: box inside the frame`);
}
const PLATE={w:1179,h:2096,packs:[[236,556],[668,996]],top:584,bottom:924};
function phoneFrames(W,H){const width=Math.max(W,H*PLATE.w/PLATE.h),k=width/PLATE.w,x0=(W-width)/2;return PLATE.packs.map(([a,b])=>({x:x0+a*k,y:PLATE.top*k,w:(b-a)*k,h:(PLATE.bottom-PLATE.top)*k}));}

check('B1 Nik\'s rule: crest and name fit inside the pack frame at the 7 sizes and across a sweep of frames',()=>{
  assert.equal(typeof career.fitHold,'function','Career Start exposes its fit');
  // desktop .clubPackStage rects measured on gameplay/r87 (Team V's Club layout) at 1366x768, 1440x900 and 1920x1080
  for(const [size,frames] of Object.entries({'1366x768':[[258,298,231,234],[885,298,227,234]],'1440x900':[[222,349,271,274],[956,349,266,274]],'1920x1080':[[363,419,325,329],[1244,419,319,329]]}))
    frames.forEach(([x,y,w,h],i)=>assertFits({x,y,w,h},`${size} pack ${i+1}`));
  for(const [W,H] of [[393,660],[375,553],[360,640],[412,915]])phoneFrames(W,H).forEach((frame,i)=>{assertFits(frame,`${W}x${H} pack ${i+1}`);assert.ok(career.fitHold(frame).crest>=50,`${W}x${H}: the crest is still a crest`);});
  for(let w=60;w<=480;w+=7)for(let h=60;h<=480;h+=7)assertFits({x:3,y:5,w,h},`${w}x${h}`);
});

check('B2 phone frames are the painted packs of ENV_CLUB_PHONE_V2 mapped through centre top / max(100vw, 100svh x 1179/2096)',()=>{
  assert.match(js,/const PHONE_PLATE=Object\.freeze\(\{w:1179,h:2096,packs:Object\.freeze\(\[Object\.freeze\(\[236,556\]\),Object\.freeze\(\[668,996\]\)\]\),top:584,bottom:924\}\);/);
  assert.match(css,/\.pcstPlateProbe \{[^}]*width: max\(100vw, calc\(100svh \* 1179 \/ 2096\)\)/,'the plate width is measured with the plate\'s own size');
  assert.match(read('css/v10Club.css'),/ENV_CLUB_PHONE_V2\.webp"\) center top \/ max\(100vw, calc\(100svh \* 1179 \/ 2096\)\) auto no-repeat/,'the Club screen still draws the plate that way');
  // the panel starts at max(scene bottom, pack bottom + 6px), so it never covers the packs
  assert.match(js,/pillar\.style\.top=`\$\{Math\.round\(Math\.max\(band\.y\+band\.h,packBottom\+6\)\)\}px`/);
});

check('B3 layout only: same buttons, actions, status and reads; Special Player club lines stay; other screens keep the card',()=>{
  const render=js.slice(js.indexOf('function pcstRender(){'),js.indexOf('// r50: opening Career Start'));
  assert.match(render,/`I STARTED AT \$\{String\(ownClub\)\.toUpperCase\(\)\}`/);
  assert.match(render,/confirm\.addEventListener\("click",\(\)=>void \(ready\?pcstOpenTransferChallenge\(\):pcstAcknowledge\(\)\)\)/);
  assert.match(render,/pcstCreate\("button","compactButton","REFRESH"\)/);
  assert.match(render,/pcstStage\(overlay,body,\{setup,role,ownClub,status:status,idle:!lastError&&!ready&&!mine\}\);/,'the stage arranges the nodes the card already built');
  const stage=js.slice(js.indexOf('function pcstStage(overlay,body,ctx){'),js.indexOf('function pcstStageLayout(){'));
  assert.doesNotMatch(stage,/addEventListener|provider\.|pcstAcknowledge|pcstRefresh|setupApi/,'the stage adds no action, read or write');
  assert.match(stage,/if\(item\.dataset\.careerRow==="special"\)\{item\.classList\.add\("pcstSpecial"\);pillar\.append\(item\);\}/,'Special Player original-club rows move into the pillar');
  assert.match(stage,/getClubCrestSvg|pcstStageHold\("playerOne",ctx\.setup\.clubs\.playerOne\),pcstStageHold\("playerTwo",ctx\.setup\.clubs\.playerTwo\)/,'Daniel left, Nik right');
  assert.match(js,/root\.getClubCrestSvg\(club\)/,'the crest is the product\'s own crest renderer');
  assert.match(js,/if\(!mode\)return pcstStageOff\(overlay\);/,'no Club screen, no stage: the card stays');
  assert.match(js,/if\(overlay\)\{overlay\.classList\.add\("hidden"\);pcstStageOff\(overlay\);\}/,'closing the panel hands the Club screen back');
  assert.equal(career.careerStartStage,'option-b');
});

check('B4 house rules: no dim, scrim, blur or opacity drop; only main scrolls; the fits audit is exported; no code name',()=>{
  assert.match(stageCss,/html\[data-career-start-stage\] #clubWheelScreen\.cl-on > :not\(\.cl-stage\):not\(\.cl-footer\):not\(\.clPhoneScene\):not\(#productionSharedCareerStartOverlay\),[\s\S]*?\{ visibility: hidden !important; \}/);
  assert.doesNotMatch(stageCss,/opacity:\s*(0?\.\d|0\b)|brightness\(|grayscale\(|blur\(\d/,'nothing is dimmed or blurred');
  assert.match(stageCss,/#productionSharedCareerStartOverlay\.pcstStage \{[^}]*background: none; -webkit-backdrop-filter: none; backdrop-filter: none;/,'the stage layer has no scrim');
  assert.match(stageCss,/\.compactButton:disabled \{ cursor: default; opacity: 1; filter: none; \}/,'a waiting button is never dimmed');
  assert.doesNotMatch(stageCss,/overflow(-y)?:\s*(auto|scroll)/,'the stage never scrolls; main stays the only scroller');
  assert.match(stageCss,/\.pcstPillar \{[^}]*overflow: clip;/);
  assert.match(stageCss,/\.pcstHold \{[^}]*overflow: hidden;/,'the pack box clips as a safety net');
  assert.equal(typeof career.layoutAudit,'function');
  assert.doesNotMatch((js.slice(js.indexOf('// HO-049 item 4'),js.indexOf('function pcstRender(){'))+stageCss).replace(/\/\/[^\n]*/g,''),/marquee|\bMP\b/i);
});

console.log(`PASS r87 Career Start option B contracts: ${checks} checks`);
