'use strict';
// R88 Icon Unmasked stand-in page (workstream C, look = Team V brief R88_ICON_CARD_TEAM_V_BRIEF.md): the hooks the round logic
// and the live sync will drive, the game <-> page messages, that the page never decides a guess and never shows the other
// manager's wrong guess, the overall switch (Nik, 31 Oct 2026: hidden until the result), the timing limits, reduced motion,
// no network, no photos and no EA assets. tests/browser/r88-icon-page-audit.cjs plays the page in a phone-sized Chromium.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const ROOT=path.resolve(__dirname,'../..');
const DIR='visual-assets/v10_1/icon-guess';
const page=fs.readFileSync(path.join(ROOT,DIR,'index.html'),'utf8');
const script=/<script>([\s\S]*?)<\/script>/.exec(page)[1];
const code=script.replace(/\/\/[^\n]*|\/\*[\s\S]*?\*\//g,'');
let checks=0;const ok=(id,label)=>{checks+=1;console.log(`ok ${checks} ${id} ${label}`);};
const one=(re,label)=>{const m=re.exec(script);assert.ok(m,`${label} in the page`);return m[0];};

// P1 the hooks Team G drives (brief: reveal(index), setChips(role,count), showResult(winner), a guess sent out, a test clock)
{
  assert.match(script,/window\.IconUnmaskedPage = Object\.freeze\(\{ load, setWaiting, reveal, setChips, setSuggestions, guessFeedback, showResult,/,'same-window API');
  assert.match(script,/window\.__ig = \{\s*freeze\(\)/,'test clock');
  const clock=one(/window\.__ig = \{[\s\S]*?\n\};/,'__ig');
  for(const fn of ['freeze','advance','now','preview','state'])assert.match(clock,new RegExp(`[{\\s,]${fn}[(,]`),`__ig.${fn}`);
  assert.match(script,/const now = \(\) => frozen \? manualMs : realNow\(\);/,'one page clock, real or frozen');
  assert.match(page,/html\.still \*, html\.still \*::before, html\.still \*::after \{ transition: none !important; animation: none !important; \}/,'a frozen clock freezes CSS too');
  ok('P1','IconUnmaskedPage load/setWaiting/reveal/setChips/setSuggestions/guessFeedback/showResult and the __ig test clock (freeze, advance, state)');
}

// P2 game <-> page messages: frame- and origin-checked, the same shape as the Special Player page
{
  assert.match(script,/const EMBED = \/\[\?&\]embed=1\(&\|\$\)\/\.test\(location\.search\);/);
  assert.match(script,/if\(e\.source!==parent\|\|e\.origin!==location\.origin\|\|!e\.data\|\|typeof e\.data\.type!=="string"\|\|e\.data\.type\.indexOf\("cms-ig-"\)!==0\) return;/,'only the game frame, same origin');
  const handled=[...script.matchAll(/d\.type==="(cms-ig-[a-z]+)"/g)].map(m=>m[1]);
  assert.deepEqual(handled,['cms-ig-start','cms-ig-waiting','cms-ig-reveal','cms-ig-chips','cms-ig-suggestions','cms-ig-feedback','cms-ig-result'],'game -> page');
  const sent=[...script.matchAll(/toGame\("(cms-ig-[a-z]+)"/g)].map(m=>m[1]);
  assert.deepEqual([...new Set(sent)].sort(),['cms-ig-continue','cms-ig-guess','cms-ig-input','cms-ig-ready'],'page -> game');
  assert.match(script,/if\(EMBED\)\{ try \{ parent\.postMessage\(msg, location\.origin\); \} catch\(e\) \{\} \}/,'messages go to the game at its own origin only');
  assert.match(script,/parent\.postMessage\(\{type:"cms-ig-error"/,'errors go to the game, not a red box');
  assert.match(script,/if\(EMBED\) toGame\("cms-ig-ready", \{ revealMs: REVEAL_MS, reduced: REDUCED \}\);\s*else startPreview\(\);/,'in the game the page waits for cms-ig-start; alone it plays a preview');
  assert.equal((script.match(/toGame\("cms-ig-continue"\)/g)||[]).length,1,'one place sends Continue');
  assert.match(script,/if\(S\.continued\) return; S\.continued=true;/,'and only once');
  ok('P2','messages: start/waiting/reveal/chips/suggestions/feedback/result in, ready/input/guess/continue (and error) out; frame and origin checked; Continue once');
}

// P3 the page never decides a guess, and never shows the other manager's guess
{
  const preview=/if\(!EMBED\)\{\s*window\.addEventListener\("cms-ig"[\s\S]*?\n\}\n/.exec(code);assert.ok(preview,'preview block');
  const game=code.replace(preview[0],'').replace(/const SAMPLE = [\s\S]*?const SAMPLE_NAMES = [^\n]*\n/,'');
  assert.ok(!/SAMPLE/.test(game.replace(/function startPreview\(\)\{[\s\S]*?\n\}\n/,'')),'only the preview uses the made-up sample');
  assert.ok(!/(?<!typeof \w*)(\.name|text)\s*(===|==|!==)|toLowerCase|localeCompare|normalize\(/.test(game),'outside the preview nothing compares a guess with the answer');
  assert.match(script,/toGame\("cms-ig-guess", \{ text, beat:S\.beat, role:S\.me \}\);/,'a guess goes out as typed, with its beat');
  const submit=one(/function submit\(\)\{[\s\S]*?\n\}/,'submit');
  assert.match(submit,/if\(!text \|\| !canGuess\(\)\) return;/,'no guess outside an open window, with no chips, or while one is pending');
  const chips=one(/function setChips\(role, count\)\{[\s\S]*?\n\}/,'setChips');
  assert.ok(!/note\("Not|textContent/.test(chips),'a chip change of the other manager shows only the count');
  const feedback=one(/function guessFeedback\(kind\)\{[\s\S]*?\n\}/,'guessFeedback');
  assert.match(feedback,/kind==="not-in-list"\) note\("Not an icon in the list", true\)/,'text that is not an icon: the brief\'s note, no chip');
  assert.match(script,/S\.suggestions\.forEach\(\(n,i\)=>\{ const li=document\.createElement\("li"\); li\.textContent=n;/,'suggestions are text, never markup');
  assert.ok(!/innerHTML\s*=\s*[^"'`]*(round|names|text|suggest)/i.test(code),'nothing the game or a manager sends is written as HTML');
  ok('P3','the page sends typed text out and shows what the game answers: it never compares a guess, the other manager\'s guesses arrive only as a chip count, and sent text is never HTML');
}

// P4 the round the page takes, and the beats (position, six stats in the round's order, the flag last)
{
  const ctx={};vm.runInNewContext([one(/const STAT_KEYS = [^\n]*/,'stat keys'),one(/const ROLES = [^\n]*/,'roles'),one(/function validRound\(r\)\{[\s\S]*?\n\}/,'validRound'),'this.validRound=validRound;'].join('\n'),ctx);
  const round={position:'CAM',statOrder:['DRI','PAC','PHY','PAS','DEF','SHO'],stats:{PAC:80,SHO:81,PAS:82,DRI:83,DEF:40,PHY:70},nation:'NL',name:'Made Up',overall:90,me:'playerOne'};
  assert.equal(ctx.validRound(round),round);
  const bad=[{position:'Centre'},{statOrder:['PAC','PAC','PAS','DRI','DEF','PHY']},{statOrder:['PAC','SHO','PAS','DRI','DEF']},{statOrder:['PAC','SHO','PAS','DRI','DEF','DIV']},
    {stats:{...round.stats,PHY:100}},{stats:{...round.stats,DEF:undefined}},{nation:''},{name:'  '},{overall:'90'},{me:'referee'}];
  for(const change of bad)assert.throws(()=>ctx.validRound({...round,...change}),/round:/,JSON.stringify(change));
  assert.throws(()=>ctx.validRound(null),/round:/);
  assert.match(script,/const LAST_BEAT = 7;/);
  const showBeat=one(/function showBeat\(b\)\{[\s\S]*?\n\}/,'showBeat');
  assert.match(showBeat,/if\(b===0\) show\(\$\("pos"\),true\);\s*else if\(b<=6\) show\(statEl\(S\.round\.statOrder\[b-1\]\),true\);\s*else show\(\$\("flag"\),true\);/,'0 position, 1-6 the round\'s stat order, 7 the flag');
  assert.match(script,/for\(let b=0;b<=i;b\+\+\) showBeat\(b\);/,'a phone that rejoins shows every beat up to the current one');
  assert.ok(!/Math\.random/.test(code),'the page never picks anything: the order comes with the round');
  assert.match(page,/<div class="tile nameplate nametile" id="name" data-shown="0"><div class="b">\? \? \?<\/div>/,'the name plate reads ? ? ? in play');
  const result=one(/function showResult\(winner\)\{[\s\S]*?\n\}/,'showResult');
  assert.match(result,/show\(\$\("name"\),true\); show\(\$\("ovr"\),true\);/,'the name and overall show only on the result');
  assert.equal((script.match(/show\(\$\("name"\),true\)/g)||[]).length,1,'nothing else shows the name');
  assert.match(result,/S\.result = ROLES\.includes\(winner\) \? winner : "draw";/);
  assert.match(result,/b\.textContent="Nobody got him"/);assert.match(result,/b\.textContent=`\$\{S\.names\[S\.result\]\} \+1 Showdown point`/);
  assert.match(page,/\.banner \{[^}]*text-transform: uppercase;/,'shown as NIK +1 SHOWDOWN POINT / NOBODY GOT HIM');
  ok('P4','a round is checked before it is drawn (six stats once each, 1-99, a name, a nation); beats are the position, the six stats in the round\'s order, then the flag; the name shows only on the result');
}

// P5 the overall switch (Nik, 31 Oct 2026: hidden until the end) and the timing limits
{
  assert.equal((script.match(/const OVERALL_HIDDEN_UNTIL_END = true;/g)||[]).length,1,'one switch, hidden');
  assert.match(script,/const overallHidden = \(\) => S\.round && typeof S\.round\.overallHidden==="boolean" \? S\.round\.overallHidden : OVERALL_HIDDEN_UNTIL_END;/,'a round can carry the switch if the decision ever changes');
  assert.match(script,/if\(S\.round && !S\.result\) show\(\$\("ovr"\), !overallHidden\(\) && S\.beat>=0\);/);
  const t={};vm.runInNewContext([one(/const WINDOW_MS_DEFAULT = [^\n]*/,'window'),one(/const clampWindow = [^\n]*/,'clamp'),'this.d=WINDOW_MS_DEFAULT;this.clamp=clampWindow;'].join('\n'),t);
  assert.equal(t.d,8000,'8 s by default');assert.equal(t.clamp(3000),5000);assert.equal(t.clamp(12000),10000);assert.equal(t.clamp(6500),6500);assert.equal(t.clamp(undefined),8000);
  const reveal=/const REVEAL_MS = REDUCED \? (\d+) : (\d+);/.exec(script);assert.ok(reveal);
  assert.ok(Number(reveal[2])<=2000&&Number(reveal[1])<Number(reveal[2]),'each reveal beat is at most 2 s, and shorter under reduced motion');
  assert.match(script,/const CHIPS_PER_MANAGER = 2;/);
  ok('P5','the overall is hidden until the result by one switch (a round may override it); guess windows 5-10 s, 8 s default; reveal beats under 2 s; two chips each');
}

// P6 reduced motion, no dimming, phone keyboard
{
  assert.match(script,/const REDUCED = QS\.get\("rm"\)==="1" \|\| \(typeof matchMedia==="function" && matchMedia\("\(prefers-reduced-motion: reduce\)"\)\.matches\);/);
  assert.match(page,/html\.rm \.tile \.b, html\.rm \.tile \.f \{ transform: none !important; \}/,'flips become fades');
  assert.match(page,/html\.rm \{ --flip: 220ms; \}/,'and get shorter');
  assert.match(page,/@media \(prefers-reduced-motion: reduce\) \{ \.card \.face::after \{ animation: none; \}/,'no sheen');
  assert.ok(!/brightness\(|backdrop-filter|vignette|scrim/i.test(page),'no dimming layers');
  assert.ok(!/position:\s*fixed;\s*inset:\s*0/.test(page),'nothing laid over the whole screen');
  assert.match(script,/visualViewport\.addEventListener\("resize",fitViewport\)/,'the screen follows the visual viewport, so the keyboard hides nothing');
  assert.match(page,/\.suggest \{ position: absolute; left: 0; right: 0; bottom: calc\(100% \+ 6px\);/,'suggestions open upwards, above the keyboard');
  assert.ok(!/AudioContext|new Audio|\.play\(\)|navigator\.vibrate/.test(code),'no sound or vibration in the stand-in (off until a player turns it on)');
  ok('P6','reduced motion: fades, shorter beats, no sheen; no dimming or full-screen layer; the bar and suggestions stay above the iPhone keyboard; no sound');
}

// P7 light, offline and clean: no network, no photos, no EA assets
{
  const files=fs.readdirSync(path.join(ROOT,DIR));
  assert.deepEqual(files,['index.html'],'one file: no images (the card, the silhouette and the flags are drawn in code)');
  assert.ok(Buffer.byteLength(page)<80*1024,'well under the Special Player page');
  assert.ok(!/\b(fetch|XMLHttpRequest|sendBeacon|WebSocket|EventSource|importScripts|firebase|firestore)\b/i.test(code),'no network or Firebase');
  assert.ok(!/https?:\/\//.test(page.replace(/<!--[\s\S]*?-->/g,'')),'no outside URL (no CDN, no fonts service)');
  assert.ok(!/<script[^>]+src=|<img|<link[^>]+stylesheet|\.(jpe?g|png|webp|gif)\b/i.test(page),'no external scripts, stylesheets or pictures');
  for(const font of page.matchAll(/url\("([^"]+)"\)/g)){assert.match(font[1],/^\.\.\/shared\/fonts\/barlow-condensed-latin-(600|700)-normal\.woff2$/,`${font[1]}: only the two fonts r87 already serves to framed pages offline`);assert.ok(fs.existsSync(path.join(ROOT,DIR,font[1])),font[1]);}
  const visible=page.replace(/<script[\s\S]*?<\/script>/g,'').replace(/<style[\s\S]*?<\/style>/g,'').replace(/<!--[\s\S]*?-->/g,'').replace(/<[^>]+>/g,' ');
  assert.ok(!/\bEA\b|EA SPORTS|Ultimate Team|\bFUT\b/i.test(visible+script),'no EA names or marks');
  assert.match(script,/const SAMPLE = \{[^}]*\}[^}]*name:"Sample Icon"/,'the preview player is made up, so the page carries no real card data');
  ok('P7','one light file with local fonts; no network, CDN, pictures, real faces, EA marks or real card data');
}

console.log(`PASS r88 Icon Unmasked page contracts: ${checks} numbered checks (hooks, messages, never decides, beats, overall switch and timing, reduced motion, offline and clean).`);
