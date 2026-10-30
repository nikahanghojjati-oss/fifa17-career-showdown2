'use strict';
// r86 Special Player chip (Nik 2026-10-29): "SP", the player's name and his ranking badge next to each manager's name on the
// career screens, from the draw the reveal shows (js/marqueePlayer.js) and only what the screens already hold (no Firebase read
// or write). A Showdown from before r86 has no chip and no error. Career Start names each Special Player's original club.
// Screen text says "Special Player" or "SP" only, never the code name.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const ROOT=path.resolve(__dirname,'../..');
const read=file=>fs.readFileSync(path.join(ROOT,file),'utf8');
const MP=require('../../js/marqueePlayer.js');
const Chip=require('../../js/specialPlayerChip.js');
const Career=require('../../js/sharedCareerAnalytics.js');
const CS=require('../../js/careerScreensV10.js');
const RL=require('../../js/rivalryLegacyV10.js');
const SF=require('../../js/seasonFinalV10.js');
const {projection,result,finalFor}=require('../support/career-fixture-helpers.cjs');
let checks=0;const ok=(id,label)=>{checks+=1;console.log(`ok ${checks} ${id} ${label}`);};
const NOT_SHOWN=/marquee|\bMP\b/i;
const AT=MP.fromMs+60*60*1000,BEFORE=MP.fromMs-24*60*60*1000;
const plain=value=>JSON.parse(JSON.stringify(value));

// S1 the chip: the reveal's draw, Daniel = playerOne and Nik = playerTwo, the badge in the tier's words; none before r86.
{
  const id='pair_'+'0'.repeat(64),pair=MP.forShowdown(id,AT),sp=Chip.forShowdown(id,AT);
  assert.equal(sp.daniel.name,pair.playerOne.name);assert.equal(sp.nik.name,pair.playerTwo.name);
  assert.deepEqual(plain(sp.daniel),{name:'Neymar',club:pair.playerOne.club,rank:1,tier:'black-blue-gold',badge:'#1 TOP 3'});
  assert.equal(sp.nik.badge,'#2 TOP 3');
  assert.deepEqual(Chip.tiers,{'black-blue-gold':'TOP 3','blue-gold':'TOP 10',gold:'TOP 20',silver:'TOP 50',bronze:'TOP 300'});
  for(const seed of '123456789abcdef'){const s=Chip.forShowdown('pair_'+seed.repeat(64),AT);for(const m of ['daniel','nik'])assert.equal(s[m].badge,`#${s[m].rank} ${Chip.tiers[s[m].tier]}`);}
  for(const at of [BEFORE,MP.fromMs-1,null,undefined,'x',NaN])assert.equal(Chip.forShowdown(id,at),null,`confirm time ${at}`);
  for(const rid of [null,'','pair_short',42])assert.equal(Chip.forShowdown(rid,AT),null);
  assert.equal(Chip.forRow({rivalryId:id}),null,'an old History row (no setupConfirmedAt) has none');
  assert.equal(Chip.forRow(null),null);
  const html=Chip.html(sp.daniel);
  assert.match(html,/^<span class="spChip spChip--black-blue-gold" data-sp-chip="true" data-sp-tier="black-blue-gold" title="Special Player: Neymar · #1 TOP 3"><span class="spChipTag">SP<\/span><span class="spChipName">Neymar<\/span><span class="spChipRank">#1 TOP 3<\/span><\/span>$/);
  assert.equal(Chip.html(null),'');assert.equal(Chip.html({name:'<x>',tier:'nope',badge:'#1'}),'');
  assert.equal(Chip.html({...sp.daniel,name:'<b>"x"'}).includes('&lt;b&gt;&quot;x&quot;'),true,'names are escaped');
  ok('S1','the chip is the reveal draw (Daniel playerOne, Nik playerTwo) with "#rank TOP n" in the tier colour; before r86, without a confirm time or rivalry: none');
}

// S2 History rows: an r86 Showdown carries specialPlayers on every career frame; a pre-r86 one carries no field.
const old=projection({seed:'1',totalSeasons:1,seasons:[[result({leaguePosition:1,leaguePoints:90}),result({leaguePosition:2})]]});
const r86=projection({seed:'b',totalSeasons:1,seasons:[[result({leaguePosition:2}),result({leaguePosition:1,leaguePoints:92})]]});
const row=(p,setupConfirmedAt)=>({rivalryId:p.rivalryId,classification:'completed',projection:p,final:finalFor(p),...(setupConfirmedAt==null?{}:{setupConfirmedAt})});
const both=Career.buildCareerModel({indexStatus:'ready',showdowns:[row(old,BEFORE),row(r86,AT)]});
const oldOnly=Career.buildCareerModel({indexStatus:'ready',showdowns:[row(old,BEFORE)]});
const noTime=Career.buildCareerModel({indexStatus:'ready',showdowns:[row(r86)]});
const r86Sp=plain(Chip.forShowdown(r86.rivalryId,AT));
{
  const legacy=RL.toV10Frame(both,'legacy'),byId=Object.fromEntries(both.history.showdowns.map(r=>[r.rivalryId,r.number]));
  const card=n=>legacy.showdowns.find(s=>s.number===n);
  assert.deepEqual(plain(card(byId[r86.rivalryId]).specialPlayers),r86Sp,'the r86 Showdown card carries both chips');
  assert.equal(Object.hasOwn(card(byId[old.rivalryId]),'specialPlayers'),false,'the pre-r86 card has no field');
  assert.equal(r86Sp.daniel.name,'I. Rakitić');assert.equal(r86Sp.nik.badge,'#14 TOP 20');
  for(const screen of ['careerStatistics','trophyRoom'])assert.deepEqual(plain(CS.toV10Frame(both,screen).specialPlayers),r86Sp,`${screen}: the latest confirmed r86 Showdown`);
  assert.deepEqual(plain(SF.standingsFrames({status:'unavailable'},both).CAREER.model.specialPlayers),r86Sp,'Standings CAREER');
  for(const model of [oldOnly,noTime]){
    for(const screen of ['careerStatistics','trophyRoom'])assert.equal(Object.hasOwn(CS.toV10Frame(model,screen),'specialPlayers'),false,`${screen}: no chip without an r86 Showdown`);
    assert.equal(RL.toV10Frame(model,'legacy').showdowns.some(s=>Object.hasOwn(s,'specialPlayers')),false);
    assert.equal(Object.hasOwn(RL.toV10Frame(model,'rivalryStatistics'),'specialPlayers'),false);
    assert.equal(Object.hasOwn(SF.standingsFrames({status:'unavailable'},model).CAREER.model,'specialPlayers'),false);
  }
  const rivalry=RL.toV10Frame(Career.buildCareerModel({indexStatus:'ready',showdowns:[row(r86,AT)]}),'rivalryStatistics');
  assert.deepEqual(plain(rivalry.specialPlayers),r86Sp,'Rivalry Statistics from History: that Showdown');
  ok('S2','History, Career Statistics, Trophy Room, Rivalry and Standings CAREER frames carry the r86 Showdown\'s chips; a pre-r86 or timeless row carries no field');
}

// S3 the live Showdown: the confirmed shared Setup's rivalry and confirm time (no read of its own); another rivalry: none.
{
  const live=projection({seed:'9',totalSeasons:3,seasons:[[result(),result()]]});
  const state={ready:true,rivalryId:live.rivalryId,setupUpdatedAtMs:AT,setup:{phase:'SHOWDOWN_CONFIRMED'}};
  const counts=()=>({seasonWins:1,seasonDraws:0,seasonLosses:0,championsLeagues:0,europaLeagues:0,leagueTitles:1,domesticCups:0,totalTrophies:1});
  const rivalry={status:'ready',score:{daniel:7,nik:9},managers:{daniel:counts(),nik:counts()}};
  try{
    assert.equal(Chip.live(),null,'no Setup: none');
    globalThis.CareerModeProductionSharedShowdownSetup={getState:()=>state};
    const sp=plain(Chip.forShowdown(live.rivalryId,AT));
    assert.deepEqual(plain(Chip.live()),sp);assert.deepEqual(plain(Chip.liveFor(live.rivalryId)),sp);assert.equal(Chip.liveFor(r86.rivalryId),null);
    assert.deepEqual(plain(SF.standingsFrames(rivalry,null).SHOWDOWN.model.specialPlayers),sp,'Standings THIS SHOWDOWN');
    assert.deepEqual(plain(CS.toV10Frame(both,'careerStatistics').specialPlayers),sp,'career-wide screens show the live Showdown first');
    assert.deepEqual(plain(SF.standingsFrames(rivalry,both).CAREER.model.specialPlayers),sp);
    globalThis.CareerModePersistentNikDanielPair={getState:()=>({rivalryId:r86.rivalryId})};
    assert.equal(Chip.live(),null,'the pair names another rivalry: none');
    delete globalThis.CareerModePersistentNikDanielPair;
    for(const bad of [{...state,ready:false},{...state,setup:{phase:'SETUP_DRAFT'}},{...state,setupUpdatedAtMs:null},{...state,setupUpdatedAtMs:BEFORE}]){
      globalThis.CareerModeProductionSharedShowdownSetup={getState:()=>bad};
      assert.equal(Chip.live(),null);assert.equal(Object.hasOwn(SF.standingsFrames(rivalry,null).SHOWDOWN.model,'specialPlayers'),false);
    }
    globalThis.CareerModeProductionSharedShowdownSetup={getState:()=>{throw new Error('boom');}};
    assert.equal(Chip.live(),null,'a failing Setup is "no chip", never an error');
  }finally{delete globalThis.CareerModeProductionSharedShowdownSetup;delete globalThis.CareerModePersistentNikDanielPair;}
  const rl=read('js/rivalryLegacyV10.js'),sf=read('js/seasonFinalV10.js');
  assert.match(rl,/sp=rowSpecial\(row\);\s*\}else\{[^}]*sp=liveSpecial\(\);\}/,'Rivalry: History row, else the live Showdown');
  assert.match(sf,/chip\.liveFor\(rid\)\|\|\(rid&&read&&Number\.isFinite\(read\.setupConfirmedAt\)\?chip\.forShowdown\(rid,read\.setupConfirmedAt\):null\)/,'Final Winner / Season Results: live Setup, else the closed Showdown\'s own read');
  assert.match(sf,/setupConfirmedAt:Number\.isFinite\(result\.setupConfirmedAt\)\?result\.setupConfirmedAt:null/,'the closed read keeps the confirm time it already returns');
  assert.match(sf,/return \{final:final\.winner\?freeze\(\{\.\.\.final,specialPlayers:sp\}\):final,specialPlayers:sp,rematch\};/);// r87 adds the Rematch frame beside the chips
  ok('S3','live Showdown: the confirmed Setup\'s rivalry and setupUpdatedAtMs on Standings, Rivalry, Final Winner and Season Results; another rivalry, an unconfirmed or pre-r86 Setup, or a failing one: none');
}

// S4 each screen draws the chip next to the manager's name, inside that name's own box, from its frame only.
{
  const hooks={
    'visual-assets/v10_1/career-statistics/career-statistics.js':[/\$\{NAMES\[rr\.role\]\}<\/span>\$\{spChip\(frame, ?rr\.role\)\}<\/td>|<\/span>\$\{spChip\(frame, [^)]+\)\}<\/td>/],
    'visual-assets/v10_1/trophy-room/trophy-room.js':[/<span>\$\{esc\(m\.displayName\)\}\$\{spChip\(frame, manager\)\}<\/span>/],
    'visual-assets/v10_1/legacy/legacy.js':[/legacyCardSpecial/,/legacyHistorySpecialPlayers spChipPair/,/showdown\.specialPlayers/],
    'visual-assets/v10_1/rivalry-statistics/rivalry-statistics.js':[/function special\(f\)/,/rvSpecialPlayer/,/f\.specialPlayers/],
    'visual-assets/v10_1/standings/standings.js':[/sdgSpecialPlayer/,/m\.specialPlayers/],
    'visual-assets/v10_1/final-winner/final-winner.js':[/fwSpecialPlayer/,/frame\.specialPlayers/],
    'js/seasonFinalV10.js':[/function sfSeasonChips\(stage,sp\)/,/sfSeasonChips\(stage,frame\.specialPlayers\);/,/seasonSpecialPlayer/],
    'js/ruleBook.js':[/function renderRuleBookSpecialPlayers\(\)/,/api\.live\(\)/],
    'js/rulesSettingsV10.js':[/renderRuleBookSpecialPlayers/]
  };
  for(const [file,patterns] of Object.entries(hooks)){const src=read(file);for(const re of patterns)assert.match(src,re,`${file} ${re}`);assert.match(src,/CareerModeSpecialPlayerChip/,`${file} uses the shared chip`);}
  // The string renderers really render it for an r86 frame and render nothing for an old one.
  const sp=Chip.forShowdown(r86.rivalryId,AT);
  globalThis.window={CareerModeSpecialPlayerChip:Chip};
  try{
    for(const file of ['visual-assets/v10_1/career-statistics/career-statistics.js','visual-assets/v10_1/trophy-room/trophy-room.js']){
      const line=read(file).split('\n').find(l=>/const spChip = /.test(l)),spChip=new Function(`${line.trim()}\nreturn spChip;`)();
      for(const m of ['daniel','nik'])assert.equal(spChip({specialPlayers:sp},m),Chip.html(sp[m]),`${file} ${m}`);
      assert.equal(spChip({},'daniel'),'');assert.equal(spChip(null,'nik'),'');
    }
  }finally{delete globalThis.window;}
  // A tiny DOM: the node renderers' chip is the same chip.
  const doc={createElement:tag=>({tag,className:'',dataset:{},title:'',textContent:'',children:[],appendChild(c){this.children.push(c);return c;}})};
  const el=Chip.element(doc,sp.nik);
  assert.equal(el.className,'spChip spChip--gold');assert.equal(el.dataset.spChip,'true');assert.equal(el.title,'Special Player: R. Varane · #14 TOP 20');
  assert.deepEqual(el.children.map(c=>[c.className,c.textContent]),[['spChipTag','SP'],['spChipName','R. Varane'],['spChipRank','#14 TOP 20']]);
  assert.equal(Chip.element(doc,null),null);
  ok('S4','Career Statistics, Trophy Room, Legacy cards and History drawer, Rivalry, Standings, Final Winner, Season Results and the Rule Book each place the shared chip beside the name from their frame; an old frame renders nothing');
}

// S5 no flash: every screen loads the chip with its own files, before its first frame; no new Firebase read or write.
{
  assert.match(read('js/careerScreensV10.js'),/prepare:\(\)=>Promise\.all\(\[v10Platemap\(screen\),v10EnsureChip\(\)\]\)/);
  assert.match(read('js/rivalryLegacyV10.js'),/prepare:async\(\)=>\{const chip=load\("special-player-chip","js\/specialPlayerChip\.js","CareerModeSpecialPlayerChip"\)[\s\S]{0,400}await chip;/);
  const sf=read('js/seasonFinalV10.js');
  assert.match(sf,/prepare:\(\)=>Promise\.all\(\[prepare\("season-results"\),prepare\("final-winner"\),sfEnsureChip\(\)\]\)/);
  assert.match(sf,/prepare:\(\)=>Promise\.all\(\[prepare\("standings"\),standingsModules\(\),sfEnsureChip\(\)\]\)/);
  assert.match(read('js/rulesSettingsV10.js'),/specialPlayerChip\.js/);
  assert.match(read('js/productionSharedCareerStart.js'),/await pcstLoadScript\("special-player-chip","js\/specialPlayerChip\.js"/);
  const chip=read('js/specialPlayerChip.js');
  assert.match(chip,/function spEnsure\(/);
  assert.doesNotMatch(chip,/firestore|getDoc|setDoc|updateDoc|runTransaction|onSnapshot|localStorage|sessionStorage|fetch\(/i,'the chip reads only what the screens hold');
  const sw=read('service-worker.js');
  assert.match(sw,/"data\/marqueePlayers\.js",\s*"js\/specialPlayerChip\.js"/,'shell path');
  assert.match(sw,/SHELL_PATHS_ADDED_SINCE_PREVIOUS[\s\S]*"js\/specialPlayerChip\.js"/);
  ok('S5','each screen\'s prepare step loads the chip before its first frame (no flash); the chip module has no Firebase or storage access; offline shell lists it');
}

// S6 Career Start: one line per manager with the Special Player's original club ("No club" when the list has none).
{
  const sp=Chip.forShowdown('pair_'+'5'.repeat(64),AT);
  assert.equal(Chip.clubLine(sp.daniel),'A. Vidal · FC Bayern München');assert.equal(Chip.clubLine(sp.nik),'C. Musonda · Real Betis');
  assert.equal(Chip.clubLine({...sp.daniel,club:null}),'A. Vidal · No club');assert.equal(Chip.clubLine(null),'');
  const pc=read('js/productionSharedCareerStart.js');
  assert.match(pc,/chip\.forShowdown\(state\.rivalryId,state\.setupUpdatedAtMs\)/);
  assert.match(pc,/\[\["YOUR SPECIAL PLAYER",role\],\["RIVAL'S SPECIAL PLAYER",otherRole\]\]/);
  assert.match(pc,/const line=chip\.clubLine\(special\[manager\(who\)\]\);if\(line\)/);
  assert.match(pc,/r==="playerOne"\?"daniel":"nik"/);
  ok('S6','Career Start adds YOUR / RIVAL\'S SPECIAL PLAYER with the launch club, "No club" when it is null, only for an r86 Setup');
}

// S7 naming: screens say "Special Player" or "SP" only.
{
  const sp=Chip.forShowdown('pair_'+'e'.repeat(64),AT);
  const shown=[Chip.rule.label,Chip.rule.text,Chip.html(sp.daniel),Chip.html(sp.nik),Chip.title(sp.daniel),Chip.clubLine(sp.nik),...[...Chip.css.matchAll(/content:\s*("[^"]*"|'[^']*')/g)].map(m=>m[1])];
  for(const text of shown)assert.doesNotMatch(text,NOT_SHOWN,text);
  assert.match(Chip.rule.text,/Your Special Player scores no points\. Full rules in card 06\./);
  const rb=read('js/ruleBook.js'),pc=read('js/productionSharedCareerStart.js');
  for(const src of [rb,pc,read('js/specialPlayerChip.js'),...['career-statistics','trophy-room','legacy','rivalry-statistics','standings','final-winner'].map(d=>read(`visual-assets/v10_1/${d}/${d}.js`))]){
    for(const [,text] of src.matchAll(/(?:textContent\s*=\s*|pcstRow\(|pcstCreate\("[a-z0-9]+","[^"]*",)\s*"([^"]*)"/g))assert.doesNotMatch(text,NOT_SHOWN,text);
  }
  assert.match(rb,/specialName\.textContent = " SPECIAL PLAYER";/);assert.match(rb,/specialTag\.textContent = "SP";/);
  assert.match(rb,/Each manager draws one FIFA 17 player at the start of every Showdown\. Your Special Player scores no points\. Full rules in card 06\./);
  assert.match(rb,/article\.append\(header, scoring, maximum, golden, special, notes\);/,'the rule sits right after GOLDEN SHOWDOWN');
  assert.doesNotMatch(pc.replace(/\/\/[^\n]*/g,''),/marquee/i,'Career Start stays free of the code name');
  ok('S7','every shown string (chip, badge, title, rule line, Career Start labels, CSS content) says Special Player or SP, never the code name');
}

// S8 Team V's pinned files are unchanged by the chip (it lives in its own style sheet).
{
  for(const file of ['js/visualIdentity.js','visual-assets/v10_1/career-statistics/career-statistics.css'])assert.doesNotMatch(read(file),/spChip|SpecialPlayerChip/,file);
  assert.match(Chip.css,/^\s*#app \.spChip\{/m);
  for(const rule of Chip.css.split('}').map(r=>r.trim()).filter(r=>r&&!r.startsWith('@media')&&!r.startsWith('/*')))assert.match(rule.replace(/^\/\*[\s\S]*?\*\/\s*/,'').replace(/^@media[^{]*\{\s*/,''),/^(:is\()?#app /,`scoped: ${rule.slice(0,60)}`);
  assert.doesNotMatch(Chip.css,/opacity|filter:|backdrop|position:\s*(absolute|fixed)/,'no dimming, nothing laid over another element');
  ok('S8','the chip\'s style is its own #app-scoped sheet: no Team V pinned file touched, no dimming, no overlay');
}

// S9 (Nik 2026-10-30): closing a Showdown clears the Setup, so the screens opened right after the close keep the pair the
// page last saw for that Showdown, only while the pair still names it. Rivalry lines name, chip and club up the same on both
// sides; the published Season Results cards carry the chip; long names wrap in the phone Career Table.
{
  const live=projection({seed:'9',totalSeasons:3,seasons:[[result(),result()]]});
  const state={ready:true,rivalryId:live.rivalryId,setupUpdatedAtMs:AT,setup:{phase:'SHOWDOWN_CONFIRMED'}};
  try{
    globalThis.CareerModeProductionSharedShowdownSetup={getState:()=>state};
    const sp=plain(Chip.live());assert.ok(sp&&sp.daniel&&sp.nik);
    globalThis.CareerModeProductionSharedShowdownSetup={getState:()=>({ready:false,rivalryId:null})};
    globalThis.CareerModePersistentNikDanielPair={getState:()=>({rivalryId:null,closedRivalryId:live.rivalryId})};
    assert.deepEqual(plain(Chip.live()),sp,'just closed: the same Showdown keeps its pair');
    globalThis.CareerModePersistentNikDanielPair={getState:()=>({rivalryId:r86.rivalryId})};
    assert.equal(Chip.live(),null,'the pair names another rivalry: none');
    globalThis.CareerModePersistentNikDanielPair={getState:()=>({rivalryId:null,closedRivalryId:null})};
    assert.equal(Chip.live(),null,'no pair names it: none');
    globalThis.CareerModePersistentNikDanielPair={getState:()=>({closedRivalryId:live.rivalryId})};
    globalThis.currentShowdown={sharedJourney:{mode:'shared',rivalryId:r86.rivalryId}};
    assert.equal(Chip.live(),null,'the game is on another Showdown: none');
  }finally{delete globalThis.CareerModeProductionSharedShowdownSetup;delete globalThis.CareerModePersistentNikDanielPair;delete globalThis.currentShowdown;}
  assert.match(Chip.css,/\.rv-manager span\.rvSpecialPlayer\{display:flex;flex:0 0 100%;order:1;/,'Rivalry: the chip has its own line under the name');
  assert.match(Chip.css,/\.rv-manager--right span\.rvSpecialPlayer\{justify-content:flex-end;\}/,'Rivalry: Nik\'s chip sits on the right edge');
  assert.doesNotMatch(Chip.css,/rvSpecialPlayer\{order:-1;\}/,'no chip before Nik\'s name');
  assert.match(Chip.css,/#careerStatistics \.careerTable \.spChip \.spChipName\{max-width:none;overflow:visible;text-overflow:clip;white-space:normal;/,'phone Career Table: a long name wraps');
  const sr=read('js/productionSharedSeasonResults.js');
  assert.match(sr,/function pssrSpecialPlayerSlot\(role\)/);assert.match(sr,/fragment\.append\(heading\);if\(special\)fragment\.append\(special\);fragment\.append\(club\);/,'published Season Results cards: chip under the name');
  ok('S9','just after the close the same Showdown keeps its chips; Rivalry chips and clubs line up; published Season Results cards and long phone names');
}

console.log(`r86 Special Player chip contracts: ${checks} groups passed`);
