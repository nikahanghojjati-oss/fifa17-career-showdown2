'use strict';
// R88 Prime Pack page (workstream C, look = Team V brief R88_ICON_CARD_TEAM_V_BRIEF.md; redesign G Lead 2026-11-01
// 10:30 UTC; art scope 10:44 UTC, HO-051: Duet builds how the screen works, Team V's skin (#1163) dresses it with Nik's
// art): the PRIME PACK opens, then the card rises (no flip, no rays, glow, pieces or shake) and reveals in
// the game's four stages (round.stages; Nik's rule, G Lead 11:08 UTC: the position + 1 stat, then +1 stat each, at most 4;
// the flag and overall stay ?? in play); the result (stage 5, no guessing) shows the last stats, flag, overall and name;
// the existing #name plate empty (no placeholder) until the result fills it; no 5-10 s clamp: each timer is its stage's
// guessMs; the ids Team V's #1163 builds on;
// one guess box each with two tokens, both always on screen; the game <-> page messages; that the page never decides a
// guess and never shows the other manager's wrong guess; reduced motion; no flash or dimming; no network, photos or EA assets.
// tests/browser/r88-icon-page-audit.cjs plays the page in a phone-sized Chromium.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const ROOT=path.resolve(__dirname,'../..');
const DIR='visual-assets/v10_1/icon-guess';
const page=fs.readFileSync(path.join(ROOT,DIR,'index.html'),'utf8');
const script=/<script>([\s\S]*?)<\/script>/.exec(page)[1];
const code=script.replace(/\/\/[^\n]*|\/\*[\s\S]*?\*\//g,'');
const css=/<style>([\s\S]*?)<\/style>/.exec(page)[1].replace(/\/\*[\s\S]*?\*\//g,'');
const body=page.slice(page.indexOf('<body>'),page.indexOf('<script>'));
let checks=0;const ok=(id,label)=>{checks+=1;console.log(`ok ${checks} ${id} ${label}`);};
const one=(re,label)=>{const m=re.exec(script);assert.ok(m,`${label} in the page`);return m[0];};
const Guess=require(path.join(ROOT,'js/iconGuess.js'));

// P1 the hooks Team G drives and the test clock
{
  assert.match(script,/window\.PrimePackPage = Object\.freeze\(\{ load, setWaiting, reveal, setChips, setSuggestions, guessFeedback, showResult,/,'same-window API');
  const api=one(/window\.PrimePackPage = Object\.freeze\(\{[\s\S]*?\}\);/,'PrimePackPage');
  assert.match(api,/stages: SAMPLE_STAGES/,'the API shows the stages table it previews with');
  assert.ok(!/windowMs|revealMs:|overallHiddenUntilEnd/.test(api),'no old window / reveal / overall-switch fields');
  assert.match(script,/window\.__ig = \{\s*freeze\(\)/,'test clock');
  const clock=one(/window\.__ig = \{[\s\S]*?\n\};/,'__ig');
  for(const fn of ['freeze','advance','now','preview','state'])assert.match(clock,new RegExp(`[{\\s,]${fn}[(,]`),`__ig.${fn}`);
  for(const field of ['stage:','label:','boxes:','packShown:','cardUp:','revealing:','secondsLeft:','namePlate:'])assert.ok(clock.includes(field),`state() reports ${field}`);
  assert.match(script,/const now = \(\) => frozen \? manualMs : realNow\(\);/,'one page clock, real or frozen');
  assert.match(page,/html\.still \*, html\.still \*::before, html\.still \*::after \{ transition: none !important; animation: none !important; \}/,'a frozen clock freezes CSS too');
  ok('P1','PrimePackPage load/setWaiting/reveal/setChips/setSuggestions/guessFeedback/showResult (with the stages table) and the __ig test clock');
}

// P2 game <-> page messages: frame- and origin-checked, the same shape as the Special Player page
{
  assert.match(script,/const EMBED = \/\[\?&\]embed=1\(&\|\$\)\/\.test\(location\.search\);/);
  assert.match(script,/if\(e\.source!==parent\|\|e\.origin!==location\.origin\|\|!e\.data\|\|typeof e\.data\.type!=="string"\|\|e\.data\.type\.indexOf\("cms-ig-"\)!==0\) return;/,'only the game frame, same origin');
  const handled=[...script.matchAll(/d\.type==="(cms-ig-[a-z]+)"/g)].map(m=>m[1]);
  assert.deepEqual(handled,['cms-ig-start','cms-ig-waiting','cms-ig-reveal','cms-ig-chips','cms-ig-suggestions','cms-ig-feedback','cms-ig-result'],'game -> page');
  assert.match(script,/d\.type==="cms-ig-reveal"\) reveal\(d\.index, \{ phase:d\.phase, remainingMs:d\.remainingMs, revealMsLeft:d\.revealMsLeft \}\);/,'reveal takes the step\'s phase, remainingMs and revealMsLeft');
  const sent=[...script.matchAll(/toGame\("(cms-ig-[a-z]+)"/g)].map(m=>m[1]);
  assert.deepEqual([...new Set(sent)].sort(),['cms-ig-continue','cms-ig-guess','cms-ig-input','cms-ig-ready'],'page -> game');
  assert.match(script,/if\(EMBED\)\{ try \{ parent\.postMessage\(msg, location\.origin\); \} catch\(e\) \{\} \}/,'messages go to the game at its own origin only');
  assert.match(script,/parent\.postMessage\(\{type:"cms-ig-error"/,'errors go to the game, not a red box');
  assert.match(script,/if\(EMBED\) toGame\("cms-ig-ready", \{ reduced: REDUCED \}\);\s*else startPreview\(\);/,'in the game the page waits for cms-ig-start; alone it plays a preview');
  assert.equal((script.match(/toGame\("cms-ig-continue"\)/g)||[]).length,1,'one place sends Continue');
  assert.match(script,/if\(S\.continued\) return; S\.continued=true;/,'and only once');
  // the step's own sender (read only): every field the page reads is one it sends
  const step=fs.readFileSync(path.join(ROOT,'js/iconGuessStep.js'),'utf8');
  assert.match(step,/igsPost\(frame,"cms-ig-reveal",\{index:at\.beat,phase:at\.phase,remainingMs:at\.stageMsLeft,revealMsLeft:/,'the step sends index, phase, remainingMs and revealMsLeft');
  assert.match(step,/round:\{me:ctx\.managerRole,names:\{\.\.\.NAMES\},stages:guess\.stages,/,'the step sends the stages with the round');
  ok('P2','messages: start/waiting/reveal(phase, remainingMs, revealMsLeft)/chips/suggestions/feedback/result in, ready/input/guess/continue (and error) out; frame and origin checked; Continue once');
}

// P3 the page never decides a guess, and never shows the other manager's guess
{
  const preview=/if\(!EMBED\)\{\s*window\.addEventListener\("cms-ig"[\s\S]*?\n\}\n/.exec(code);assert.ok(preview,'preview block');
  const game=code.replace(preview[0],'').replace(/const SAMPLE = [\s\S]*?const SAMPLE_NAMES = [^\n]*\n/,'');
  assert.ok(!/SAMPLE\b/.test(game.replace(/function startPreview\(\)\{[\s\S]*?\n\}\n/,'')),'only the preview uses the made-up sample');
  assert.ok(!/(?<!typeof \w*)(\.name|text)\s*(===|==|!==)|toLowerCase|localeCompare|normalize\(/.test(game),'outside the preview nothing compares a guess with the answer');
  assert.match(script,/toGame\("cms-ig-guess", \{ text, beat:S\.beat, role:S\.me \}\);/,'a guess goes out as typed, with its stage');
  const submit=one(/function submit\(\)\{[\s\S]*?\n\}/,'submit');
  assert.match(submit,/if\(!text \|\| !canGuess\(\)\) return;/,'no guess outside a stage, with no tokens, or while one is pending');
  const chips=one(/function setChips\(role, count\)\{[\s\S]*?\n\}/,'setChips');
  assert.ok(!/note\("Not|textContent/.test(chips),'a token change of the other manager shows only the count');
  const feedback=one(/function guessFeedback\(kind\)\{[\s\S]*?\n\}/,'guessFeedback');
  assert.match(feedback,/kind==="not-in-list"\) note\("Not an icon in the list", true\)/,'text that is not an icon: the brief\'s note, no token');
  assert.match(script,/S\.suggestions\.forEach\(\(n,i\)=>\{ const li=document\.createElement\("li"\); li\.textContent=n;/,'suggestions are text, never markup');
  assert.ok(!/innerHTML\s*=\s*[^"'`]*(round|names|text|suggest)/i.test(code),'nothing the game or a manager sends is written as HTML');
  const render=one(/function render\(\)\{[\s\S]*?\n\}/,'render');
  assert.ok(!/\$\("other"\)[^;]*(value|guess)/.test(render)&&!/o\.textContent[^;]*\$\("guess"\)/.test(render),'the other box never shows typed text');
  ok('P3','the page sends typed text out and shows what the game answers: it never compares a guess, the other manager\'s guesses arrive only as a token count, and sent text is never HTML');
}

// P4 the stages come from the game (round.stages), never from the page; the name only on the result
{
  const ctx={};vm.runInNewContext([one(/const STAT_KEYS = [^\n]*/,'stat keys'),one(/const ROLES = [^\n]*/,'roles'),one(/const LAST_BEAT = [^\n]*/,'last beat'),
    one(/function validStages\(st\)\{[\s\S]*?\n\}/,'validStages'),one(/function validRound\(r\)\{[\s\S]*?\n\}/,'validRound'),'this.validRound=validRound;'].join('\n'),ctx);
  const stages=Guess.stages.map(s=>({...s}));
  const round={position:'CAM',statOrder:['DRI','PAC','PHY','PAS','DEF','SHO'],stats:{PAC:80,SHO:81,PAS:82,DRI:83,DEF:40,PHY:70},nation:'NL',name:'Made Up',overall:90,me:'playerOne',stages};
  assert.equal(ctx.validRound(round),round,'the game\'s own STAGES table is a valid round.stages');
  const bad=[{position:'Centre'},{statOrder:['PAC','PAC','PAS','DRI','DEF','PHY']},{statOrder:['PAC','SHO','PAS','DRI','DEF']},{statOrder:['PAC','SHO','PAS','DRI','DEF','DIV']},
    {stats:{...round.stats,PHY:100}},{stats:{...round.stats,DEF:undefined}},{nation:''},{name:'  '},{overall:'90'},{me:'referee'},
    {stages:undefined},{stages:stages.slice(0,3)},{stages:[{...stages[0],points:5},...stages.slice(1)]},{stages:[stages[0],{...stages[1],stats:0},...stages.slice(2)]},
    {stages:[{...stages[0],guessMs:0},...stages.slice(1)]},{stages:[...stages.slice(0,3),{...stages[3],flag:'yes'}]}];
  for(const change of bad)assert.throws(()=>ctx.validRound({...round,...change}),/round:/,JSON.stringify(change).slice(0,120));
  assert.throws(()=>ctx.validRound(null),/round:/);
  // the preview's copy is the game's table, row for row
  const sample=one(/const SAMPLE_STAGES = Object\.freeze\(\[[\s\S]*?\]\);/,'SAMPLE_STAGES');
  const t={};vm.runInNewContext(sample+'\nthis.s=SAMPLE_STAGES;',t);
  assert.deepEqual(JSON.parse(JSON.stringify(t.s)),JSON.parse(JSON.stringify(Guess.stages)),'the preview stages are identical to js/iconGuess.js STAGES');
  assert.equal((code.match(/SAMPLE_STAGES/g)||[]).length,3,'used only by the preview and the API');
  // no timing constants of the old design, and no stage timing outside the preview copy
  assert.ok(!/WINDOW_MS|clampWindow|REVEAL_MS|OVERALL_HIDDEN|overallHidden|windowMs|STAGE_POINTS|STAGGER_MS/.test(code),'no old window, reveal or overall-switch logic');
  assert.ok(!/\b(25000|20000|2500)\b/.test(code.replace(sample,'')),'no stage timing outside the preview copy');
  // what a stage shows comes from its row: position, stats count in statOrder, flag, overall
  const items=one(/function itemsFor\(b\)\{[\s\S]*?\n\}/,'itemsFor');
  assert.match(items,/const st=S\.stages\[b\]/);
  assert.match(items,/if\(st\.position && !prev\.position\) out\.push\(\$\("pos"\)\);/);
  assert.match(items,/for\(let k=prev\.stats;k<st\.stats;k\+\+\) out\.push\(statEl\(S\.round\.statOrder\[k\]\)\);/,'stats is the cumulative count of the round\'s statOrder');
  assert.match(items,/if\(st\.flag && !prev\.flag\) out\.push\(\$\("flag"\)\);/);
  assert.match(items,/if\(st\.overall && !prev\.overall\) out\.push\(\$\("ovr"\)\);/);
  assert.ok(!/name/.test(items),'the name is never a stage');
  assert.deepEqual(Guess.stages.map(s=>[s.flag,s.overall]),[[false,false],[false,false],[false,false],[false,false]],'the game\'s table (G Lead 11:08): flag and overall stay ?? in all four stages');
  assert.deepEqual(Guess.stages.map(s=>s.stats),[1,2,3,4],'the game\'s table: one stat, then one more each stage, at most 4 in play');
  // the result (stage 5, no guessing) turns up everything left, whatever stage the round ended in
  const paintAll=one(/function paintCard\(t\)\{[\s\S]*?\n\}/,'paintCard');
  assert.match(paintAll,/const all=\[\$\("pos"\),\$\("flag"\),\$\("ovr"\),\.\.\.STAT_KEYS\.map\(statEl\)\];\s*all\.forEach\(el=>show\(el, Boolean\(S\.result\) \|\| up\.has\(el\)\)\);/,'on the result: the position, all six stats, the flag and the overall');
  assert.match(paintAll,/for\(let b=0;b<=Math\.min\(S\.beat,LAST_BEAT\);b\+\+\)/,'in play only the stages up to the current one');
  const paint=one(/function paintCard\(t\)\{[\s\S]*?\n\}/,'paintCard');
  assert.match(paint,/show\(\$\("name"\), Boolean\(S\.result\) && S\.nameAt!==null && t>=S\.nameAt\);/,'the name shows only on the result, after the winner');
  assert.equal((script.match(/show\(\$\("name"\),\s*(true|Boolean)/g)||[]).length,1,'nothing else shows the name');
  assert.match(page,/<div class="tile nameplate nametile" id="name" data-shown="0"><div class="b"><\/div><div class="f" id="nameValue"><\/div><\/div>/,'the existing #name plate (G Lead 11:12: Team V\'s #1163 uses it), empty as served: no placeholder');
  assert.ok(!/prime-card-name/.test(page),'no separate #prime-card-name element (G Lead 11:12)');
  // the name is written in exactly two places: emptied by a new round (cms-ig-start, so a reload too), filled by the result
  const writes=[...code.matchAll(/\$\("nameValue"\)\.textContent\s*=\s*([^;]+);/g)].map(m=>m[1].trim());
  assert.deepEqual(writes,['""','S.round.name'],'the name plate is only ever emptied (on load) or filled with the name (on the result)');
  assert.match(one(/function load\(round\)\{[\s\S]*?\n\}/,'load'),/\$\("nameValue"\)\.textContent="";/,'a new round (a reload included) empties it');
  assert.match(one(/function showResult\(winner, points\)\{[\s\S]*?\n\}/,'showResult'),/\$\("nameValue"\)\.textContent=S\.round\.name;/,'the result fills it, for a win at any stage and for nobody');
  assert.ok(!/nameValue|S\.round\.name/.test(one(/function reveal\(index, opts\)\{[\s\S]*?\n\}/,'reveal')+paint),'no stage, and no reload into a stage, touches the name');
  assert.equal((code.match(/S\.round\.name/g)||[]).length,1,'the round\'s name is read in one place only');
  const pts=one(/const stagePoints = [^\n]*/,'stagePoints');assert.match(pts,/S\.stages\[b\]\.points/,'the points label comes from the stage row');
  const render=one(/function render\(\)\{[\s\S]*?\n\}/,'render');
  assert.match(render,/beat\.textContent = `Stage \$\{S\.beat\+1\} · \$\{pts\} pt\$\{pts===1\?"":"s"\}`;/,'a clear Stage N · 4 pts label');
  assert.match(render,/RING\*\(1-clamp\(left\/st\.guessMs,0,1\)\)/,'the timer ring counts that stage\'s guessMs');
  const reveal=one(/function reveal\(index, opts\)\{[\s\S]*?\n\}/,'reveal');
  // G Lead 11:13: no 5-10 s window clamp anywhere; each stage's timer is exactly its guessMs (25, 20, 20, 20 s)
  assert.ok(!/clampWindow|WINDOW_MS|MIN_WINDOW|MAX_WINDOW|windowMs/i.test(code),'no window clamp');
  assert.ok(!/(5000|10000|8000)/.test(code.replace('ring.classList.toggle("low", left<5000)','')),'no 5, 8 or 10 s limit (the only 5 s is when the ring turns orange)');
  assert.match(reveal,/const remaining = Number\.isFinite\(o\.remainingMs\) \? clamp\(o\.remainingMs, 0, full\) : full;/,'a stage runs its full revealMs + guessMs');
  assert.match(reveal,/const guessLeft = clamp\(remaining - revealLeft, 0, st\.guessMs\)/,'on a reload the timer shows remainingMs - revealMsLeft of guessing time');
  assert.match(reveal,/still\(\(\)=>render\(\)\);/,'what is already past shows at once, with no replay');
  const result=one(/function showResult\(winner, points\)\{[\s\S]*?\n\}/,'showResult');
  assert.match(result,/const result = ROLES\.includes\(winner\) \? winner : "draw";/);
  assert.match(result,/if\(S\.result && \(S\.result!=="draw" \|\| result==="draw"\)\) return;\n\s*S\.result = result;/,"only a late winner replaces a shown draw (Fable F12-03)");
  assert.match(result,/b\.textContent="Nobody got him · 0 points"/);assert.match(result,/b\.textContent=`\$\{S\.names\[S\.result\]\} \+\$\{S\.points\} Showdown point\$\{S\.points===1\?"":"s"\}`/);
  assert.match(result,/S\.points = S\.result==="draw" \? 0 : clamp\(/,'the points come from the game (1 to 4), 0 for nobody');
  assert.match(page,/\.banner \{[^}]*text-transform: uppercase;/,'shown as NIK +3 SHOWDOWN POINTS / NOBODY GOT HIM · 0 POINTS');
  ok('P4','a round must carry four stages; the preview copy equals js/iconGuess.js STAGES; what each stage shows, its points and its timer come from its row; at most 4 stats and the flag and overall ?? in play; the result shows every stat left, the flag, the overall and the name (the #name tile, emptied on load and filled only by the result)');
}

// P5 how it looks: Team V's skin (HO-051, #1163) on Team G's page: Nik's sealed pack shows its opening art and fades out on the
// stage clock, the card rises onto the pedestal; no rays, glow, pieces, shake, flip, flash or dimming; clear ids on every
// part; two boxes, two tokens each
{
  assert.match(body,/<div class="pack" id="pack" aria-label="Prime Pack">\s*<i class="sealed"><\/i><i class="opened"><\/i>\s*<div class="pk-frame"><\/div>\s*<div class="pk-crown"><\/div>\s*<div class="pk-top">FIFA 17 SHOWDOWN<\/div>\s*<p class="pk-word" id="packWord">PRIME<span>PACK<\/span><\/p>\s*<div class="pk-rule"><\/div>\s*<div class="pk-17">17<\/div>\s*<div class="crack" id="crack"><\/div>\s*<\/div>/,'Nik\'s pack (sealed and opening art) that says PRIME PACK, with the earlier hooks kept');
  assert.match(css,/\.pack \.sealed \{ background-image: url\("assets\/pack_sealed\.webp"\); \}/);
  assert.match(css,/#app\[data-pack="open"\] \.pack \.opened \{ opacity: 1; \}/,'the opening art shows while the pack opens');
  // the art hooks stay in the markup, empty; nothing draws in them and the code never touches them
  assert.match(body,/<div class="rays" id="rays" aria-hidden="true"><\/div>\s*<div class="glow" id="glow" aria-hidden="true"><\/div>/);
  assert.match(body,/<div class="shards" id="shards" aria-hidden="true">(<i><\/i>){10}<\/div>/);
  assert.ok(!/<svg viewBox="-110|conic-gradient/.test(page),'no drawn crown and no ray fan');
  assert.ok(!/\b(rays|glow|shards?|crack|shake|charge|burst)\b/i.test(code),'the code never animates rays, glow, pieces, a crack or a shake');
  const hookRule='.rays, .glow, .shards { position: absolute; left: 50%; top: 50%; width: 0; height: 0; pointer-events: none; }';
  assert.ok(css.includes(hookRule),'the empty hooks are kept out of the layout');
  assert.ok(!/\b(shake|charge|burst)\b/i.test(css)&&!/\.(rays|glow|shards)\b(?![^{]*\{ position: absolute; left: 50%; top: 50%; width: 0)/.test(css),'no other style for them, and no shake or burst');
  const frames=[...css.matchAll(/@keyframes (\w+)/g)].map(m=>m[1]);
  assert.deepEqual(frames,['pop','fade','sheen'],'the only keyframes are the result line\'s pop and fade and the card frame\'s slow sheen (off with reduced motion)');
  assert.ok(!/rotateY|rotateX|backface|perspective|--flip|\bflip/i.test(code+css),'no card flip anywhere');
  assert.ok(!/rotate\(/.test(code+css.replace('.ring svg { width: 100%; height: 100%; transform: rotate(-90deg); }','')),'nothing spins (the timer ring only starts at 12 o\'clock)');
  assert.ok(!/flash/i.test(code+css),'no flash');
  assert.ok(!/brightness\(|backdrop-filter|vignette|scrim|invert\(|conic-gradient/i.test(page),'no dimming layers, no ray fans');
  assert.ok(!/position:\s*fixed;\s*inset:\s*0/.test(page),'nothing laid over the whole screen');
  const paint=one(/function paintCard\(t\)\{[\s\S]*?\n\}/,'paintCard');
  assert.match(paint,/pack\.hidden = pp>=PACK_OUT;/,'the pack opens (fades out) first');
  assert.match(paint,/const packState = pp>=PACK_OUT \? "gone" : pp>0 \? "open" : "sealed";/,'the art follows the same clock');
  assert.match(paint,/card\.style\.transform = REDUCED \? "none" : `translateY\(\$\{\(\(1-rise\)\*16\)\.toFixed\(2\)\}%\)`;/,'then the card slides up: translate only');
  assert.match(paint,/const pp = S\.result \? 1 : S\.beat<0 \? 0 : progressOf\(0,t\);/,'driven by the stage clock');
  assert.match(css,/\.card \.face \{ position: absolute; inset: 0; background: url\("assets\/card_frame\.webp"\)/,'Nik\'s black marble Prime frame');
  // every functional part has an id that can be restyled without touching logic
  const ids=['rays','glow','pack','packWord','crack','shards','card','pos','flag','ovr','name','nameValue','beat','ring','boxOne','boxTwo','chipsOne','chipsTwo','guess','go','other','suggest','note','banner','cta','source'];
  for(const id of ids)assert.equal((page.match(new RegExp(`id="${id}"`,'g'))||[]).length,1,`#${id} once`);
  assert.match(script,/t\.className="tile stat"; t\.id="stat-"\+key; t\.dataset\.stat=key;/,'each stat slot is #stat-PAC .. #stat-PHY');
  const header=page.slice(0,page.indexOf('-->'));
  for(const id of ids.filter(x=>!['name','nameValue','rays','glow','crack','shards','packWord'].includes(x)).concat(['stat-PAC','name (#nameValue)','packWord']))assert.ok(header.includes(`#${id}`),'the header lists the hooks: #'+id);
  // the two boxes
  assert.match(body,/<div class="gbox" id="boxOne" data-role="playerOne"[\s\S]*?<span class="chips" id="chipsOne" data-role="playerOne" data-count="2"[^>]*><i class="chip"><\/i><i class="chip"><\/i><\/span>/,'Daniel\'s box with 2 tokens');
  assert.match(body,/<div class="gbox" id="boxTwo" data-role="playerTwo"[\s\S]*?<span class="chips" id="chipsTwo" data-role="playerTwo" data-count="2"[^>]*><i class="chip"><\/i><i class="chip"><\/i><\/span>/,'Nik\'s box with 2 tokens');
  assert.match(css,/\.chip \{ width: 30px; height: 30px; display: block;[^}]*url\("assets\/token_full\.webp"\)/,'Nik\'s token art');
  assert.match(script,/const CHIPS_PER_MANAGER = 2;/);
  const load=one(/function load\(round\)\{[\s\S]*?\n\}/,'load');
  assert.match(load,/mineBox\.querySelector\("\.slot"\)\.appendChild\(\$\("mine"\)\); otherBox\.querySelector\("\.slot"\)\.appendChild\(\$\("other"\)\);/,'the input goes in round.me\'s box, the read-only field in the other');
  assert.match(body,/<div class="mine" id="mine">\s*<ul class="suggest" id="suggest"[\s\S]*?<div class="note" id="note" aria-live="polite"><\/div>\s*<\/div>/,'suggestions and notes travel with this phone\'s own box');
  assert.ok(!/\$\("guessbar"\)\.hidden\s*=\s*true/.test(code),'the boxes are never hidden, the result included');
  assert.match(body,/<div class="ro" id="other" aria-live="polite"><\/div>/,'the other box is read only');
  ok('P5','Team V\'s skin: Nik\'s pack opens and fades out and the card rises onto the pedestal on the stage clock; no rays, glow, pieces, shake, flip, flash or dimming; an id on every part; one box each with two token pictures, the input only in round.me\'s');
}

// P6 reduced motion, phone keyboard
{
  assert.match(script,/const REDUCED = QS\.get\("rm"\)==="1" \|\| \(typeof matchMedia==="function" && matchMedia\("\(prefers-reduced-motion: reduce\)"\)\.matches\);/);
  assert.match(page,/html\.rm \.tile \.b, html\.rm \.tile \.f \{ transform: none !important; \}/,'reveals become fades');
  assert.match(page,/html\.rm \{ --reveal: 220ms; \}/,'and get shorter');
  assert.match(page,/@media \(prefers-reduced-motion: reduce\) \{ \.card \.face::after \{ animation: none; \} \.chip \{ transition: none; \} \}/,'no sheen, and tokens change without motion');
  const paint=one(/function paintCard\(t\)\{[\s\S]*?\n\}/,'paintCard');
  assert.match(paint,/pack\.style\.transform = REDUCED \? "translateX\(-50%\)" :/,'the pack only fades');assert.match(paint,/card\.style\.transform = REDUCED \? "none" :/,'the card only fades');
  assert.match(script,/visualViewport\.addEventListener\("resize",fitViewport\)/,'the screen follows the visual viewport, so the keyboard hides nothing');
  assert.match(page,/\.suggest \{ position: absolute; left: 0; right: 0; bottom: calc\(100% \+ 6px\);/,'suggestions open upwards, above both boxes and the keyboard');
  assert.ok(!/AudioContext|new Audio|\.play\(\)|navigator\.vibrate/.test(code),'no sound or vibration in the stand-in (off until a player turns it on)');
  ok('P6','reduced motion: the pack, the card and the values only fade; the boxes and suggestions stay above the iPhone keyboard; no sound');
}

// P7 light, offline and clean: no network, no photos, no EA assets
{
  const files=fs.readdirSync(path.join(ROOT,DIR));
  assert.deepEqual(files,['assets','index.html'],'the page and its art folder only');
  // HO-051 (Team V, 1 Nov 2026): Nik's Prime Pack art ships as seven local webp files; the flags stay drawn in code
  const ART=['card_frame.webp','pack_opening.webp','pack_sealed.webp','stage_desktop.webp','stage_phone.webp','token_full.webp','token_spent.webp'];
  assert.deepEqual(fs.readdirSync(path.join(ROOT,DIR,'assets')).sort(),ART,'exactly Nik\'s seven Prime Pack pictures');
  const artBytes=ART.reduce((n,f)=>n+fs.statSync(path.join(ROOT,DIR,'assets',f)).size,0);
  assert.ok(artBytes<1200*1024,`art stays light (${Math.round(artBytes/1024)} KB, well under the Special Player's 8.4 MB)`);
  for(const f of ART)assert.ok(page.includes(`url("assets/${f}")`),`${f} is used by the page`);
  assert.ok(Buffer.byteLength(page)<80*1024,'well under the Special Player page');
  assert.ok(!/\b(fetch|XMLHttpRequest|sendBeacon|WebSocket|EventSource|importScripts|firebase|firestore)\b/i.test(code),'no network or Firebase');
  assert.ok(!/https?:\/\//.test(page.replace(/<!--[\s\S]*?-->/g,'')),'no outside URL (no CDN, no fonts service)');
  assert.ok(!/<script[^>]+src=|<img|<link[^>]+stylesheet|\.(jpe?g|png|gif)\b/i.test(page),'no external scripts, stylesheets or other pictures');
  for(const m of page.matchAll(/[\w./-]+\.webp\b/g))assert.match(m[0],/^assets\/[a-z_]+\.webp$/,`${m[0]}: pictures come only from ./assets`);
  for(const font of page.matchAll(/url\("([^"]+\.woff2)"\)/g)){assert.match(font[1],/^\.\.\/shared\/fonts\/barlow-condensed-latin-(600|700)-normal\.woff2$/,`${font[1]}: only the two fonts r87 already serves to framed pages offline`);assert.ok(fs.existsSync(path.join(ROOT,DIR,font[1])),font[1]);}
  const visible=page.replace(/<script[\s\S]*?<\/script>/g,'').replace(/<style[\s\S]*?<\/style>/g,'').replace(/<!--[\s\S]*?-->/g,'').replace(/<[^>]+>/g,' ');
  assert.ok(!/\bEA\b|EA SPORTS|Ultimate Team|\bFUT\b/i.test(visible+script),'no EA names or marks');
  assert.match(script,/const SAMPLE = \{[^}]*\}[^}]*name:"Sample Icon"/,'the preview player is made up, so the page carries no real card data');
  ok('P7','the page plus Nik\'s seven local webp pictures (under 1.2 MB) and local fonts; no network, CDN, outside pictures, real faces, EA marks or real card data');
}

console.log(`PASS r88 Prime Pack page contracts: ${checks} numbered checks (hooks, messages, never decides, stages from the game, the name, Team V's skin with ids, reduced motion, offline and clean).`);
