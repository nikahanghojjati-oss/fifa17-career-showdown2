#!/usr/bin/env node
"use strict";
// r90 MOTION hunt, 2D rows: the Final Winner ceremony never dims or flashes (M7), and at Light (html[data-gfx="0"], set by
// js/gfxTier.js) the heavy 2D effects step down while Balanced and up keep today's look (M18-M26). Layout shift rows: CLS.
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const ROOT=path.resolve(__dirname,"../..");const read=p=>fs.readFileSync(path.join(ROOT,p),"utf8");
let n=0;const ok=(id,msg)=>{n++;console.log(`ok ${n} ${id} ${msg}`);};
// M7: no dim, no flash
{const js=read("visual-assets/v10_1/final-winner/final-winner.js"),css=read("visual-assets/v10_1/final-winner/final-winner.css");
  assert.doesNotMatch(js,/finalWinnerFlash|flashAtMs|flashMs/,"the ceremony creates no flash layer");
  assert.doesNotMatch(css,/finalWinnerFlash|fwFlash|fwDim|fwAnticipate::after/,"no flash or dim rules remain");
  assert.doesNotMatch(css,/rgb\(0 0 0 \/ \.5\)/,"no 50% black layer");
  assert.match(js,/root\.classList\.add\("fwAnticipate"\)/,"the drum pulse on the trophy glow stays");
  assert.match(css,/#stage-root\.fwAnticipate \.winnerTrophyGlow \{ animation: fwDrum/,"the drum pulse is the trophy glow only");
  ok("M7","the Final Winner ceremony keeps its drum pulse, confetti and name wipe with no dimming and no flash");}
// M18-M26: Light only
{const light=(file,re,why)=>{assert.match(read(file),re,why);};
  light("visual-assets/v10_1/shared/showdown-ui.css",/html\[data-gfx="0"\] \{ --sd-panel-blur: none; \}/,"panels drop the live blur at Light");
  light("visual-assets/v10_1/shared/showdown-ui.css",/html\[data-gfx="0"\] \.sd-panel \{ background: linear-gradient\(180deg, rgba\(18,18,20,\.95\), rgba\(8,9,12,\.93\)\); \}/,"and take a deeper marble tint");
  assert.match(read("visual-assets/v10_1/shared/showdown-ui.css"),/:root \{\n  --sd-panel-blur: blur\(6px\);/,"Balanced and up keep the 6 px blur");
  light("visual-assets/v10_1/shared/stage.css",/html\[data-gfx="0"\] \.sd-stage__dust \{ display: none; \}\nhtml\[data-gfx="0"\] \.sd-stage__flare \{ filter: none; \}/,"no dust and an unblurred flare at Light");
  light("css/homeV10.css",/html\[data-gfx="0"\] #app #mainMenu\.v10Home \.fifaMenuGrid > \.menuTile \{ -webkit-backdrop-filter: none; backdrop-filter: none; \}/,"Home tiles without blur at Light");
  light("css/rulesSettingsV10.css",/html\[data-gfx="0"\] #app #ruleBook\.v10RuleBook #ruleBookSections \.ruleSection \{ filter:none; \}/,"Rule Book cards without the drop-shadow pass at Light");
  light("visual-assets/v10_1/final-winner/final-winner.css",/html\[data-gfx="0"\] \.finalWinnerManagerSpotlight \{ filter: none; \}/,"Final Winner spotlights without blur at Light");
  light("css/v10Club.css",/html\[data-gfx="0"\] #clubWheelScreen #covers polygon\[filter="url\(#cvUnder\)"\] \{ display: none; \}/,"Club Assignment leaves out the blurred under-glow at Light");
  assert.match(read("visual-assets/v10_1/club/club.js"),/<polygon points="\$\{pts\(s\.panel\)\}" fill="#F2C45B" opacity="\.18" filter="url\(#cvUnder\)"/,"Team V's under-glow polygon is the one Light hides (club.js untouched)");
  assert.match(read("js/gfxTier.js"),/function gfxMarkRoot\(level,assets,ownOnly\)\{/,"js/gfxTier.js writes html[data-gfx]");
  light("visual-assets/v10_1/shared/stage.css",/html\[data-gfx="0"\] \.sd-stage \{ will-change: opacity; \}/,"M33: at Light the stage keeps its own layer once the dust is gone");
  assert.match(read("visual-assets/v10_1/shared/stage.css"),/\.sd-stage \{\n[^}]*isolation: isolate;/,"the stage is already isolated, so the hint changes no stacking");
  ok("M18-M26","at Light the panels, stage dust and flare, Home tiles, Rule Book cards, Final Winner spotlights and Club glow step down; other levels are untouched");}
// M27 (r91 HO-071, was "the five stage wordmarks ask for their drawn width"): the V3 title family. Every V3 picture of one
// step has one height (38/76/150/300 px) and its own width, so each title's srcset must carry the files' REAL widths and its
// "sizes" must ask for the one shared title height (--hc-title-h in css/r78-type.css) times that title's width/height ratio.
// A wrong width here would draw one screen's title bigger or blurrier than the others.
{const dims=file=>{const b=fs.readFileSync(path.join(ROOT,file));assert.equal(b.subarray(8,12).toString(),"WEBP",file);const kind=b.subarray(12,16).toString();
    if(kind==="VP8X")return [1+b.readUIntLE(24,3),1+b.readUIntLE(27,3)];
    if(kind==="VP8L"){const n=b.readUInt32LE(21);return [1+(n&0x3fff),1+((n>>>14)&0x3fff)];}
    return [b.readUInt16LE(26)&0x3fff,b.readUInt16LE(28)&0x3fff];};
  const W="visual-assets/v10_1/",STEPS=[480,960,1920,3840],HEIGHTS=[38,76,150,300];
  const h=/--hc-title-h: clamp\((\d+)px, ([\d.]+)vw, (\d+)px\);/.exec(read("css/r78-type.css"));assert.ok(h,"the shared title height is one variable");
  const [hMin,hVw,hMax]=h.slice(1).map(Number);
  const titles=[["js/careerScreensV10.js","career-statistics/assets/TITLE_CS"],["visual-assets/v10_1/trophy-room/trophy-room.js","trophy-room/assets/TITLE_TR"],
    ["visual-assets/v10_1/season-results/app-shell.html","season-results/assets/TITLE_SR"],["visual-assets/v10_1/season-results/app-shell.html","season-results/assets/TITLE_SR_PHONE"],
    ["visual-assets/v10_1/final-winner/app-shell.html","shared/wordmarks/TITLE_FINAL_WINNER"],["visual-assets/v10_1/standings/app-shell.html","shared/wordmarks/TITLE_STANDINGS"],
    ["js/rivalryLegacyV10Markup.js","legacy/assets/TITLE_LG"],["js/rivalryLegacyV10Markup.js","rivalry-statistics/assets/TITLE_RV"],["js/rivalryLegacyV10Markup.js","rivalry-statistics/assets/TITLE_RV_PHONE"],
    ["js/connectPlayersScreenV10.js","shared/wordmarks/TITLE_CONNECT_PLAYERS"],["js/rulesSettingsV10.js","shared/wordmarks/TITLE_RULE_BOOK"],["js/rulesSettingsV10.js","shared/wordmarks/TITLE_SETTINGS"],
    ["visual-assets/v10_1/tr2/slice-02-plate/plate.js","shared/wordmarks/TITLE_TRANSFER"]];
  for(const [file,asset] of titles){
    const name=asset.split("/").pop(),src=read(file),real=STEPS.map((step,i)=>{const [w,hh]=dims(`${W}${asset}_V3_${step}.webp`);assert.equal(hh,HEIGHTS[i],`${name} ${step} height`);return w;});
    assert.ok(!src.includes(name+"_V2_"),`${file} no longer draws ${name}_V2`);
    // The four widths as the file writes them: a plain srcset, the Rule Book/Settings table, or Transfer War's [step, width] pairs.
    const esc=name.replace(/_/g,"_"),at=src.indexOf(name+"_V3_");assert.ok(at>=0,`${file} draws ${name}_V3`);
    let widths=STEPS.map(step=>{const m=new RegExp(esc+"_V3_"+step+"\\.webp (\\d+)w").exec(src);return m?Number(m[1]):null;});
    if(widths.includes(null)){const m=new RegExp(esc+'_V3_960\\.webp":\\{key:"[A-Z_]+",widths:\\[(\\d+),(\\d+),(\\d+),(\\d+)\\]').exec(src)||/\[\[480, (\d+)\], \[960, (\d+)\], \[1920, (\d+)\], \[3840, (\d+)\]\]/.exec(src.slice(Math.max(0,at-200),at+600));
      assert.ok(m,`${name} widths found in ${file}`);widths=m.slice(1).map(Number);}
    assert.deepEqual(widths,real,`${name} srcset widths are the files' real widths`);
    const ratio=real[2]/150,want=`clamp(${Math.round(hMin*ratio)}px, ${(hVw*ratio).toFixed(2)}vw, ${Math.floor(hMax*ratio)}px)`;
    assert.ok(src.slice(at-200,at+1400).includes(want)||src.includes(`sizes:"${want}"`),`${name} asks for the shared title height: ${want}`);}
  const type=read("css/r78-type.css");
  assert.match(type,/img\.hc-title-img \{ object-fit: scale-down !important; object-position: 50% 50% !important; \}/,"a title is never stretched or enlarged inside its box");
  for(const key of ["CS","LG","RV","SR","SR_PHONE","CONNECT","FINAL_WINNER","STANDINGS","TRANSFER","TR","RULE_BOOK","SETTINGS"])
    assert.match(type,new RegExp('img\\.hc-title-img\\[data-hc-title="'+key+'"\\] \\{ aspect-ratio: 1920 / \\d+; \\}'),`${key} keeps the box its old picture had, so nothing moves`);
  // Home logo: three real widths, and every V3 file a screen can fetch is lighter than the V1/V2 file of the same step.
  const home=read("js/homeScreensV10.js");
  for(const w of [640,1040,2080]){assert.equal(dims(`${W}home/assets/LOGO_CM17_WORDMARK_V3_${w}.webp`)[0],w,`logo ${w}`);assert.ok(home.includes(`LOGO_CM17_WORDMARK_V3_${w}.webp ${w}w`),`Home lists the ${w} logo`);}
  const size=file=>fs.statSync(path.join(ROOT,W+file)).size;
  assert.ok(size("home/assets/LOGO_CM17_WORDMARK_V3_640.webp")<size("home/assets/LOGO_CM17_WORDMARK_V1_640W.webp")&&size("home/assets/LOGO_CM17_WORDMARK_V3_1040.webp")<size("home/assets/LOGO_CM17_WORDMARK_V1.webp"),"the Home logo got lighter");
  for(const [,asset] of titles)for(const step of STEPS)assert.ok(size(`${asset}_V3_${step}.webp`)<size(`${asset}_V2_${step}.webp`),`${asset} ${step} is lighter than V2`);
  // In-game headers (Chamber Men, Squad Management, Prime Pack): the heading keeps its words and its box; the V3 lettering is laid
  // over it at the capital height the text had (1.4em), with the picture's own width/height ratio, so it is never stretched.
  for(const [file,sel,asset,prefix] of [["css/chamberMen.css","#cmStage .cmHeader > .cmTitle","TITLE_CHAMBER_MEN","../visual-assets/v10_1/shared/wordmarks/"],
    ["css/squadScreen.css","#sqStage .sqHeader>.sqTitle","TITLE_SQUAD","../visual-assets/v10_1/shared/wordmarks/"],["visual-assets/v10_1/icon-guess/index.html",".packtitle","TITLE_PRIME_PACK","../shared/wordmarks/"]]){
    const src=read(file),at=src.indexOf(sel+"::after"),rule=src.slice(at,src.indexOf("}",at));assert.ok(at>=0,`${file} draws ${asset} over its heading`);
    const [w,hh]=dims(`${W}shared/wordmarks/${asset}_V3_1920.webp`),m=/height: ?1\.4em;.*width: ?min\(calc\(1\.4em \* ([\d.]+)\)/.exec(rule);
    assert.ok(m&&Math.abs(Number(m[1])-w/hh)<0.01,`${asset} keeps its own ratio (${(w/hh).toFixed(3)})`);
    for(const step of [960,1920])assert.ok(rule.includes(`${prefix}${asset}_V3_${step}.webp`),`${asset} ${step} is drawn`);
    assert.match(src.slice(src.lastIndexOf(sel,at-1)-2,at),/color: ?transparent/,`${asset}: the words stay in the heading, unpainted`);}
  ok("M27","the V3 title family: real srcset widths, one shared title height, old boxes kept, lighter files; in-game headers keep their box");}
// M28 (Nik 2026-11-12: every phone and tablet screen matches its desktop screen). Two things were still desktop-only:
// the flat dark slab behind the numbers (the phone and tablet rules of Career Statistics and of the Final Winner results
// panel still painted the vein tile), and the title family (tablets and sideways phones lettered the set-up header bar
// "CAREER MODE / SHOWDOWN // 17" in the old block type). The bar keeps its words; they are drawn with the V3 Home logo.
{const career=read("js/careerScreensV10.js"),final=read("js/seasonFinalV10.js"),type=read("css/r78-type.css");
  const csPhone=career.match(/@media \$\{CS_PHONE_ART_MEDIA\} \{\n  #app #careerStatistics\.careerScreenV10 :is\(\.glassPanel,\.headlineTile,\.phoneTabs\) \{\n([^}]*)\}/);
  assert.ok(csPhone,"the Career Statistics phone and tablet panel rule is found");
  assert.doesNotMatch(csPhone[1],/marble-tile/,"Career Statistics panels on phone and tablet: no vein tile behind the numbers");
  assert.match(csPhone[1],/var\(--r78-panel,#110f0c\);/,"Career Statistics panels on phone and tablet: the flat dark slab");
  const fwPhone=final.match(/#app #seasonEntry\.v10FinalMode #stage-root \.finalWinnerResultsPanel \{\n  z-index:11;([^}]*)\}/);
  assert.ok(fwPhone,"the Final Winner phone and tablet results panel rule is found");
  assert.doesNotMatch(fwPhone[1],/marble-tile/,"Final Winner results panel on phone and tablet: no vein tile behind the numbers");
  assert.match(fwPhone[1],/#110f0c;/,"Final Winner results panel on phone and tablet: the flat dark slab");
  const C='html[data-v10-setup]:not(#sa-f1):not(#sa-f2):not(#sa-f3):not(#sa-f4) header#topHeader > div.brand';
  const at=type.indexOf(C+'::after {');assert.ok(at>0,"the set-up header draws its brand in ::after");
  const rule=type.slice(at,type.indexOf("}",at));
  for(const step of [640,1040])assert.ok(rule.includes(`../visual-assets/v10_1/home/assets/LOGO_CM17_WORDMARK_V3_${step}.webp`),`the header draws the V3 Home logo (${step})`);
  const [lw,lh]=(b=>[1+b.readUIntLE(24,3),1+b.readUIntLE(27,3)])(fs.readFileSync(path.join(ROOT,"visual-assets/v10_1/home/assets/LOGO_CM17_WORDMARK_V3_640.webp")));
  assert.ok(rule.includes(`aspect-ratio: ${lw} / ${lh}`),"the header logo keeps the picture's own shape");
  assert.match(rule,/width: min\(100%, 204px\)/,"the header logo never leaves the brand's own box, so it cannot reach SIGN IN");
  assert.ok(type.includes(C+' > :is(h1, p) {\n  color: transparent !important;'),"the old block lettering is unpainted, the words stay for screen readers");
  assert.doesNotMatch(type,/:root[^{]*header#topHeader > div\.brand::after/,"only set-up screens (data-v10-setup) draw the header logo, so Home loads nothing new");
  ok("M28","phones and tablets: flat slab behind the stats numbers, and the set-up header wears the V3 logo");}
// M29 (face check row A1): the Final Winner spotlight ovals were lights for the old cut-outs. On the one-piece board room
// they hazed both faces, so no size draws them; the audit's KNOWN list carries no art row for them.
{const js=read("js/seasonFinalV10.js"),audit=read("tests/browser/phone-marble-facecheck-audit.cjs");
  assert.match(js,/\n#app #seasonEntry \.finalWinnerManagerSpotlight \{ display:none; \}\n/,"the spotlight ovals are left out at every size");
  assert.doesNotMatch(audit.slice(audit.indexOf("const KNOWN = ["),audit.indexOf("// WAITING:")),/FINAL_WINNER/,"Final Winner has no known face row");
  ok("M29","Final Winner draws no spotlight oval over the managers' faces");}
// M30 (art ledger S10-D1, S15-D2; Nik 2026-11-13 "Remove the crown"): no crown above SHOWDOWN CHAMPION, no gold outline
// round the champion's cup, and no gold disc, beam or reflection behind the Trophy Room cups at any size. The Final Winner
// disc (.winnerTrophyGlow) is a light of the reveal only: Team V's drum beat and settle shine play on it with their own
// timing (M7), it holds between them, then eases out to nothing and stays out; without the ceremony it never shows.
{const fw=read("js/seasonFinalV10.js"),career=read("js/careerScreensV10.js");
  assert.match(fw,/\n#app #seasonEntry \.finalWinnerCrown \{ display:none; \}\n/,"no crown above the Final Winner title at any size");
  assert.match(fw,/\n#app #seasonEntry \.winnerTrophyPicture img \{ filter:drop-shadow\(0 18px 24px rgb\(0 0 0 \/ \.66\)\); \}\n/,"the champion's cup keeps its contact shadow only");
  assert.match(fw,/\n#app #seasonEntry \.winnerTrophyGlow \{ opacity:0; \}\n/,"no gold disc behind the cup at rest");
  assert.match(fw,/\n#app #seasonEntry #stage-root:has\(#outcomeHeadline\.sd-title-wipe\):not\(\.fwSettled\) \.winnerTrophyGlow \{ opacity:1; \}\n/,"the disc holds between the drum beat and the settle shine");
  assert.match(fw,/\n#app #seasonEntry \.fwSettled \.winnerTrophyGlow \{ animation:fwShine 120ms ease-in-out 1,cmsWinnerDiscOut 700ms ease-out 120ms 1 forwards; \}\n@keyframes cmsWinnerDiscOut \{ from \{ opacity:\.75; \} to \{ opacity:0; \} \}\n/,"Team V's shine keeps its 120 ms, then the disc eases from the shine's .75 to nothing and stays out");
  {const vcss=read("visual-assets/v10_1/final-winner/final-winner.css"),vjs=read("visual-assets/v10_1/final-winner/final-winner.js");
    assert.match(vcss,/#stage-root\.fwSettled \.winnerTrophyGlow \{ animation: fwShine 120ms ease-in-out 1; \}\n@keyframes fwShine \{ 0%, 70%, 100% \{ opacity: \.75; transform: scale\(1\); \}/,"the ease-out starts where Team V's shine ends (120 ms, .75)");
    assert.match(vjs,/name\.classList\.add\("sd-title-wipe"\);/,"the wipe class the hold reads is set by the ceremony");
    assert.equal((vjs.match(/sd-title-wipe/g)||[]).length,1,"and by nothing else in Team V's Final Winner script");}
  assert.doesNotMatch(fw,/winnerTrophyGlow\s*\{[^}]*(display\s*:|transition\s*:|transform\s*:)/,"the game hides nothing with display and adds no transition or movement to the disc");
  assert.match(fw,/\n@media \(prefers-reduced-motion: reduce\) \{ #app #seasonEntry \.winnerTrophyGlow \{ opacity:0 !important; \} \}\nhtml:is\(\[data-motion-reduced="true"\],\[data-reduced-motion="true"\]\) #app #seasonEntry \.winnerTrophyGlow \{ opacity:0 !important; \}\n/,"reduced motion: no disc at all");
  assert.match(career,/TROPHY_ARCHIVE_CSS=String\.raw`\n\/\*[^`]*?\*\/\n#app #trophyRoom \.trophyCardGlow,#app #trophyRoom \.heroSpotlight,#app #trophyRoom \.heroReflection \{display:none\}\n#app #trophyRoom \.heroTrophyPicture img \{filter:drop-shadow\(0 7px 8px rgba\(0,0,0,\.78\)\)\}\n@media/,"Trophy Room: the glow pieces are off before any size block, so phones and tablets match the desktop");
  ok("M30","no crown on Final Winner, no gold halo on the cups, and the reveal's disc eases out to nothing");}
// M31 (bug hunt F1, r91): the Special Player chip row is counted in the room kept for the Final Winner result, so the totals
// stay clear of the summary panel on upright phones and tablets and the chips stay on the screen on sideways phones. The
// browser check that proves it (F4 in the face audit) runs on Final Winner at every size of the Gate's three face groups.
{const fw=read("js/seasonFinalV10.js"),audit=read("tests/browser/phone-marble-facecheck-audit.cjs"),vjs=read("visual-assets/v10_1/final-winner/final-winner.js");
  const both=String.raw` #app #seasonEntry\.v10FinalMode #stage-root:has\(\.fwSpecialPlayer\),\n #app #seasonEntry\.seasonScreenV10\.v10FinalMode:has\(\.fwSpecialPlayer\) `;
  // r91 chips at 12px: the chip row on upright phones is two lines tall for both managers (a long name takes two lines), so 116px.
  assert.match(fw,new RegExp(String.raw`\n@media \(max-width:760px\) and \(orientation:portrait\) \{\n /\*[^\n]*\*/\n${both}\{ --fw-copy:116px; \}\n /\*[^\n]*\*/\n #app #seasonEntry\.v10FinalMode #stage-root \.finalWinnerManager \.fwSpecialPlayer \{ display:flex; align-items:center; justify-content:center; min-height:37px; \}\n\}\n`),"upright phones: 80px of result plus the 36px chip row, on the stage and on the screen that grows with it; both names stay level");
  assert.match(fw,new RegExp(String.raw`\n@media \(min-width:700px\) and \(max-width:760px\) and \(min-height:960px\) and \(orientation:portrait\) \{\n${both}\{ --fw-copy:159px; \}\n /\*[^\n]*\*/\n #app #seasonEntry\.v10FinalMode #stage-root \.finalWinnerManager \.fwSpecialPlayer \{ min-height:0; \}\n\}\n`),"upright tablets: 134px of result plus the 25px chip row (the full chip, one line)");
  const sideAt=fw.indexOf("\n@media (min-width:640px) and (min-height:340px) and (max-height:500px) and (orientation:landscape) {\n /* r91: from 901 px the desktop sheet centres");
  const side=fw.slice(sideAt,fw.indexOf("\n}\n",sideAt)+3);
  assert.ok(sideAt>0&&side.length>1000&&side.length<3200&&fw.slice(sideAt+side.length).startsWith("/* r91, the chip at 12px on Final Winner"),"sideways phones have their own block, which also covers a desktop window dragged short (r92-04: any width, so 1200px and wider too)");
  // r92-04: the sideways layout serves every width of a 340-500px tall landscape window; no query still stops at 1199px wide, the desktop
  // plate is not drawn behind it (it showed Nik's hair over the summary panel), and a window wider than 1300px keeps a 1280px screen.
  assert.ok(!/max-width:1199px\) and \(min-height:340px\) and \(max-height:500px\)/.test(fw),"r92-04: no short-window rule stops at 1199px wide");
  assert.ok(fw.includes(" html[data-v10-screen=\"seasonEntry\"] #app main:has(#seasonEntry.seasonScreenV10.v10FinalMode:not(.hidden)) { top:var(--sd-nav-top-h,52px); height:auto; background-image:none; }"),"r92-04: a short wide desktop window draws no desktop plate behind the sideways layout");
  assert.ok(fw.includes("@media (min-width:1300px) and (min-height:340px) and (max-height:500px) and (orientation:landscape) {\n #app #seasonEntry.v10FinalMode #stage-root.v10FinalStage { left:calc(50% - min(50%,640px)); right:auto; width:min(100%,1280px); }\n}"),"r92-04: a very wide short window keeps the screen 1280px wide and centred");
  assert.ok(/desk-short/.test(audit)&&audit.includes("\"1200x499\", \"1366x480\", \"1600x480\""),"r92-04: the face audit has the desk-short group (1200x499, 1366x480, 1600x480 as a desktop window)");
  assert.match(side,/\n #app #seasonEntry\.v10FinalMode #stage-root \.finalWinnerResultsPanel \{ translate:none; \}\n/,"a short desktop window: the summary panel is not slid half its width over Nik's face");
  assert.match(side,/\n #app #seasonEntry\.v10FinalMode #stage-root:has\(\.fwSpecialPlayer\) \{ --fw-copy:110px; \}\n #app #seasonEntry\.v10FinalMode #stage-root:has\(\.fwSpecialPlayer\) \.finalWinnerHeroCopySlot \{ width:min\(40%,320px\); \}\n/,"sideways: the lip rises by the chip row and the result takes a wider column");
  assert.match(side,/\.fwSpecialPlayer \{ order:0; justify-self:center; max-width:calc\(100% - 8px\); margin:2px 0 0; \}/,"sideways: the chip stands between the name and the total");
  assert.match(side,/\.fwSpecialPlayer \.spChipRank \{ display:none; \}/,"sideways: the short chip, as on upright phones");
  assert.doesNotMatch(side,/ellipsis|font-size:1[01](\.\d)?px/,"sideways: the chip is 12px and its name is not cut");
  {const tail=fw.slice(sideAt+side.length,fw.indexOf("`;\n",sideAt));
    assert.match(tail,/\n#app #seasonEntry\.v10FinalMode #stage-root \.finalWinnerManager \.fwSpecialPlayer \.spChip \{ font-size:12px; line-height:1\.2; border-radius:10px; \}\n#app #seasonEntry\.v10FinalMode #stage-root \.finalWinnerManager \.fwSpecialPlayer \.spChipFirst \{ display:none; \}\n#app #seasonEntry\.v10FinalMode #stage-root \.finalWinnerManager \.fwSpecialPlayer \.spChipName \{ max-width:none; overflow:visible; text-overflow:clip; white-space:normal; \}\n$/,"every size: the Final Winner chip is 12px with the surname, never cut, and these three rules end the sheet");}
  assert.equal((fw.match(/--fw-copy:\d+px/g)||[]).filter(x=>!/:(80|134|116|159|110)px/.test(x)).length,0,"no other room is kept for the result than the five measured ones");
  assert.match(vjs,/slot\.className = "fwSpecialPlayer";\n\s+slot\.appendChild\(chip\);\n\s+name\.after\(slot\);/,"Team V still builds the chip row the rules read");
  assert.match(audit,/if\(key === "FINAL_WINNER"\) for\(const what of await finalWinnerResultClear\(page\)\) res\.findings\.push\(\{ face: "", what \}\);/,"the face audit runs F4 on Final Winner at every size");
  assert.match(audit,/slot\.className = "fwSpecialPlayer"; slot\.appendChild\(api\.element\(document, sp\)\); name\.after\(slot\);/,"F4 builds the chip row the way Team V does");
  assert.doesNotMatch(audit.slice(audit.indexOf("const KNOWN = ["),audit.indexOf("// WAITING:")),/Special Player chip|total/,"F4 has no known row");
  ok("M31","Final Winner: the Special Player chip row has its room, so totals and chips stand clear at every phone and tablet size");}
// M32 (Nik 2026-11-13): the league marks are back on the wheel, and every name and mark is fixed to its slice, so it
// stays inside the slice at rest and at every angle of the spin; phones show both too (a smaller mark and a smaller hub).
// The browser check that measures it (F5 in the face audit) runs on the League wheel at every size of the Gate's three face groups.
{const css=read("css/v10Setup.css"),audit=read("tests/browser/phone-marble-facecheck-audit.cjs"),setup=read("js/v10Setup.js");
  assert.doesNotMatch(css,/wheelItem\[data-league-mark\]::before\s*\{[^}]*display:\s*none/,"no rule hides the league marks");
  const at=css.indexOf("\nhtml:root #app #leagueWheelScreen.v26Skin .wheelItem {\n"),block=css.slice(at,css.indexOf("\n/* r90 W9 (LOOK hunt L19)",at));
  assert.ok(at>0&&block.length>900&&block.length<2400,"the wheel's last word on its names and marks is one block");
  assert.ok(!css.slice(at+60).includes("#leagueWheelScreen.v26Skin .wheelItem {")&&!/wheelItem[^{]*\{[^}]*transform:/.test(css.slice(at+block.length)),"nothing after that block lays the names out again");
  assert.match(block,/\n  transform-origin: 50% 0;\n  transform: rotate\(var\(--v26-a\)\) translateY\(calc\(var\(--R\) \* -\.65\)\);\n\}/,"a name turns with its slice and nothing turns it back upright; its top edge is .65 of the radius from the hub");
  assert.doesNotMatch(block,/rotate\(calc\(0deg - var\(--v26-a\)\)\)/,"no counter-turn");
  assert.match(block,/\[data-league-mark\]::before \{\n  display: block; order: 1; flex: none;\n  width: clamp\(calc\(var\(--R\) \* \.14\), calc\(\(var\(--R\) - 150px\) \* 1000\), calc\(var\(--R\) \* \.18\)\);\n  height: clamp\(calc\(var\(--R\) \* \.14\), calc\(\(var\(--R\) - 150px\) \* 1000\), calc\(var\(--R\) \* \.18\)\);\n  background: #e2b84a; filter: none;\n  -webkit-mask: var\(--league-mark-image\) center \/ contain no-repeat;\n  mask: var\(--league-mark-image\) center \/ contain no-repeat;\n\}/,"the mark sits under the name, toward the hub, in one flat gold; it is drawn on wheels 300px across and more");
  assert.match(block,/line-height: clamp\(1em, calc\(\(var\(--R\) - 150px\) \* 1000\), 1\.1em\); letter-spacing: clamp\(0em, calc\(\(var\(--R\) - 150px\) \* 1000\), \.04em\);/,"small wheels set the name tighter so it fits its slice at 12px");
  assert.match(block,/:is\(\.v26-top, \.v26-selected\)::before \{ background-color: #0b0d10; filter: none; \}/,"the mark on the lit slice is ink, like its name");
  assert.match(block,/#leagueWheel::after \{\n  background-size: clamp\(66%, calc\(\(var\(--R\) - 150px\) \* 1000\), 100%\) clamp\(66%, calc\(\(var\(--R\) - 150px\) \* 1000\), 100%\), 100% 100%;\n\}/,"a wheel under 300px across draws its hub at 66% (the rim keeps its size), which leaves the mark its room");
  assert.match(block,/gap: clamp\(\.5px, calc\(\(var\(--R\) - 150px\) \* 1000\), calc\(var\(--R\) \* \.03\)\);/,"on a small wheel the mark sits right under its name");
  assert.match(block,/\.wheelItem:not\(\.v26-top, \.v26-selected\) \{ filter: drop-shadow\(0 1px 1px rgba\(11, 13, 16, \.7\)\); \}/,"names and marks keep a thin dark edge while they pass over the lit slice");
  assert.match(setup,/if\(id&&item\.dataset\.leagueMark!=="original"\)root\.applyLeagueMark\(item,id\);/,"js/v10Setup.js still gives every slice its mark");
  assert.match(audit,/if\(key === "LEAGUE"\) for\(const what of await leagueWheelSlicesClear\(page\)\) res\.findings\.push\(\{ face: "", what \}\);/,"the face audit runs F5 on the League wheel at every size");
  assert.match(audit,/const HUB = \.235, HUB_SMALL = \.66, SMALL = 300, RIM = \.72, CLEAR = 3, MARK_LEAST = 10;/,"F5's measures: hub (at 66% under 300px, as in the sheet), rim, 3px clear, a mark of 10px or more on every slice");
  assert.doesNotMatch(audit.slice(audit.indexOf("const KNOWN = ["),audit.indexOf("// WAITING:")),/league mark|slice/i,"F5 has no known row");
  ok("M32","League wheel: the marks are back, and every name and mark is fixed to its slice and measured inside it");}
// CLS (W9 row): the top bar's 52 px is reserved from the first paint in every nav state, so a screen laid out under the
// loading screen or the Reus Gate (data-nav "none") does not jump when the bar comes back; Club stays unseen until its look is on.
{const shell=read("css/v10Shell.css"),club=read("css/v10Club.css");
  assert.match(shell,/@media \(min-width: 901px\) \{\n  html\[data-nav="hub"\] #app, html\[data-nav="hidden"\] #app, html\[data-nav="none"\] #app \{ padding-top: var\(--sd-nav-top-h, 52px\); \}/,"the bar's height stays reserved under the gate");
  assert.match(read("js/v10Screens.js"),/mode:loading\?"none":entry\?entry\[1\]:"hidden"/,"nav is \"none\" only while a loading screen covers the app");
  assert.match(club,/#clubWheelScreen\[data-v10-pending\]:not\(\.cl-on\) \{ visibility: hidden; \}/,"Club stays unseen between its styles and its mount");
  assert.match(club,/html:not\(\[data-v10-screen="clubWheelScreen"\]\) #app > main:has\(> #clubWheelScreen:not\(\.hidden\)\) \{ position: static; inset: auto; z-index: auto; pointer-events: auto; \}/,"club.css's bare main rule cannot move the app's main before Club is named");
  assert.match(read("js/clubScreenV10.js"),/section\.classList\.add\("cl-on"\);\n      clDecorate\(section\);[\s\S]{0,240}root\.ClubPlate\.app\.mount\(/,"cl-on and Team V's first layout land in the same task");
  assert.match(read("js/v10Screens.js"),/liveIds\.some\(id=>\{const def=registry\.get\(id\);return Boolean\(def&&def\.css\.some\(css=>BASE\+css===file\)&&\(mounted\.has\(id\)\|\|def\.css\.every\(css=>styles\.get\(BASE\+css\)\?\.settled===true\)\)\);\}\)/,"a screen's sheets switch on together, once all have settled or it has mounted");
  ok("CLS","the top bar's room is kept under the gate, and Club shows only once laid out");}
console.log(`PASS r90 MOTION 2D contracts: ${n} numbered checks.`);
