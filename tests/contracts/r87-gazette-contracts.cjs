'use strict';
// r87 Touchline Gazette (Nik 2026-10-31: a SEASON edition after each Season Results, a FINAL edition after Final Winner, each
// its own page with one CONTINUE). Team V's HO-041 newspaper with the HO-048 copy (approved by Nik 2026-10-31), filled by
// js/touchlineGazette.js from what the screen already holds. Pins: the same paper for the same Showdown and season on both
// phones, rows picked by situation from only the true situations (equal points are a DRAW, no tiebreak), no row repeated
// across one Showdown, every placeholder filled, no "Marquee", zero Firestore reads or writes, and CONTINUE running exactly
// the step the tapped button ran (the flow goes on to the same next screen, and a paper is never shown twice or in the way).
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const crypto=require('node:crypto');
const ROOT=path.resolve(__dirname,'../..');
const read=file=>fs.readFileSync(path.join(ROOT,file),'utf8');
const G=require('../../js/touchlineGazette.js');
const Copy=require('../../data/gazetteCopy.js');
const Pages=require('../../data/frontPages.js');
const Season=require('../../js/seasonFinalV10.js');
const fx=require('../support/active-showdown-fixtures.cjs');
const {projection,result}=require('../support/career-fixture-helpers.cjs');
let checks=0;const ok=(id,label)=>{checks+=1;console.log(`ok ${checks} ${id} ${label}`);};

// Season results, by Showdown points: CL 5, EL 3, league title 3, cup 1, performance 1, awards 1 (11 at most).
const R={
  max:result({leaguePosition:1,leaguePoints:101,championsLeague:true,domesticCup:true,topScorer:true}), // 11
  clLeague:result({leaguePosition:1,championsLeague:true}), // 8
  cl:result({championsLeague:true}), // 5
  league:result({leaguePosition:1}), // 3
  cupAward:result({domesticCup:true,topScorer:true}), // 2
  cup:result({domesticCup:true}), // 1
  none:result({leaguePosition:9}) // 0
};
const proj=(seed,T,seasons)=>projection({seed,totalSeasons:T,seasons});
const sp={daniel:{name:'Lionel Messi'},nik:{name:'Cristiano Ronaldo'}};
const frame=p=>Season.finalFrame(fx.finalReconciliation(p),fx.closed(p),fx.history(p));
const DRAW_SITUATIONS=new Set(['draw','level-overall','final-season-decider']);

// G1 the same Showdown and season always print the same paper; the Showdown id steers the choice.
{
  const p=proj('a',3,[[R.clLeague,R.cupAward],[R.cl,R.cl]]);
  const a=G.seasonEdition({projection:p,seasonNumber:1,specialPlayers:sp}),b=G.seasonEdition({projection:JSON.parse(JSON.stringify(p)),seasonNumber:1,specialPlayers:sp});
  assert.ok(a&&Object.isFrozen(a));assert.equal(a.key,`${p.rivalryId}|season|1`);assert.equal(G.paperText(a),G.paperText(b));assert.deepEqual(a.ids,b.ids);
  assert.notEqual(G.paperText(a),G.paperText(G.seasonEdition({projection:p,seasonNumber:2})),'another season, another paper');
  const heads=new Set();for(const seed of '0123456789abcdef')heads.add(G.seasonEdition({projection:proj(seed,3,[[R.clLeague,R.cupAward]]),seasonNumber:1}).paper.headline);
  assert.ok(heads.size>=8,`the Showdown id steers the paper (${heads.size} headlines over 16 Showdowns with the same season)`);
  const f1=G.finalEdition({projection:proj('b',3,[[R.cl,R.none],[R.league,R.cup],[R.cup,R.none]])}),f2=G.finalEdition({projection:proj('b',3,[[R.cl,R.none],[R.league,R.cup],[R.cup,R.none]])});
  assert.equal(f1.key,`${'pair_'+'b'.repeat(64)}|final|3`);assert.equal(G.paperText(f1),G.paperText(f2));
  ok('G1','one paper per Showdown + season (+ edition), the same on every run, chosen by the Showdown id');
}

// G2 both phones print the same paper: nothing about who is looking reaches the choice.
{
  const p=proj('c',3,[[R.cl,R.league],[R.cupAward,R.max]]);
  const daniel={...fx.history(p),managerRole:'playerOne'},nik={...fx.history(p),managerRole:'playerTwo',runtimeRevision:'other'};
  const a=G.seasonEdition(G.seasonInput({history:daniel,specialPlayers:sp})),b=G.seasonEdition(G.seasonInput({history:nik,specialPlayers:sp}));
  assert.ok(a&&b);assert.equal(G.paperText(a),G.paperText(b));assert.equal(a.paper.left.name,'Daniel');assert.equal(a.paper.right.name,'Nik');
  const full=proj('c',3,[[R.cl,R.league],[R.cupAward,R.max],[R.none,R.cup]]),fr=frame(full);
  const fa=G.finalEdition(G.finalInput({final:fr,history:{...fx.history(full),managerRole:'playerOne'}})),fb=G.finalEdition(G.finalInput({final:fr,history:{...fx.history(full),managerRole:'playerTwo'}}));
  assert.ok(fa&&fb);assert.equal(G.paperText(fa),G.paperText(fb));
  const src=read('js/touchlineGazette.js');assert.ok(!/managerRole|managerId|CareerModeIdentity|getIdentity|accountId|deviceId/.test(src),'the Gazette never reads who is looking');
  ok('G2','Daniel\'s and Nik\'s phones print the same season and final papers (Daniel on the left, Nik on the right)');
}

// G3 equal points are a DRAW: drawn pages only, kicker DRAWN, never a winner, no tiebreak (seasons won do not count).
{
  const p=proj('d',3,[[R.cl,R.cl]]);const e=G.seasonEdition({projection:p,seasonNumber:1});
  assert.equal(e.winner,'draw');assert.equal(e.paper.kicker,'DRAWN');assert.equal(e.situation,'draw');assert.equal(e.paper.variant,'draw');assert.equal(e.paper.photo.name,'GZ_LEAD_DRAW');
  assert.deepEqual(G.seasonSituations(p,1),['draw']);
  assert.ok(!/\bwins\b|\bwinner\b|\bbeat\b/i.test([e.paper.kicker,e.paper.headline].join(' ')));
  for(const seed of '0123456789abcdef'){
    const d=G.seasonEdition({projection:proj(seed,3,[[R.league,R.cup],[R.cup,R.cup]]),seasonNumber:2});
    assert.equal(d.paper.kicker,'DRAWN');assert.ok(DRAW_SITUATIONS.has(d.situation),d.situation);
    assert.ok(Pages.season.find(r=>r.id===d.ids.headline).situation===d.situation);
    const row=Pages.season.find(r=>r.id===d.ids.headline),story=Copy.stories.find(s=>s.id===d.ids.story);
    assert.ok(!/\{(winner|loser)/.test(JSON.stringify([row,story])),'a drawn season never takes a winner row');
  }
  // Final: Daniel wins two of three seasons, Nik's one big season levels the totals: a drawn Showdown, no tiebreak.
  const level=proj('e',3,[[R.cup,R.none],[R.cup,R.none],[R.none,R.cupAward]]);
  assert.equal(level.managerRecords.playerOne.totalPoints,level.managerRecords.playerTwo.totalPoints);
  const f=G.finalEdition({projection:level,final:frame(level)});
  assert.equal(f.winner,'draw');assert.equal(f.situation,'showdown-drawn');assert.equal(f.paper.kicker,'DRAWN');assert.equal(f.paper.photo.name,'GZ_LEAD_DRAW');assert.equal(f.paper.portrait,null);
  assert.ok(!f.paper.briefs.some(b=>b.trophy==='TRO_SHOWDOWN_CHAMPION'),'nobody gets the Showdown trophy on a draw');
  assert.ok(!/tie-?break|goal difference|head[- ]to[- ]head|on goals|seasons won/i.test(G.paperText(f)));
  ok('G3','equal points print a DRAW (season and final), from the drawn pages only, with no winner, trophy or tiebreak');
}

// G4 only true situations are offered, and a paper never contradicts the screen.
{
  const sit=(seasons,N,T=3)=>G.seasonSituations(proj('f',T,seasons),N);
  assert.ok(sit([[R.cupAward,R.cup]],1).includes('narrow-win'));assert.ok(!sit([[R.cupAward,R.cup]],1).includes('big-win'),'a 1-point win is never a big win');
  assert.ok(sit([[R.clLeague,R.cupAward]],1).includes('big-win'));assert.ok(sit([[R.cl,R.cupAward]],1).includes('comfortable-win'));
  assert.ok(sit([[R.cl,R.league]],1).includes('champions-league'));assert.ok(!sit([[R.cl,R.cl]],1).includes('champions-league'));
  assert.ok(sit([[R.none,R.cl],[R.cl,R.none]],2).includes('level-overall'));
  assert.ok(sit([[R.none,R.max],[R.cl,R.none]],2).includes('comeback'));assert.ok(sit([[R.cl,R.none],[R.cl,R.none]],2).includes('lead-extended'));
  assert.ok(sit([[R.cl,R.none],[R.cl,R.none],[R.cl,R.none]],3,5).includes('winning-streak'));assert.ok(!sit([[R.cl,R.none],[R.cl,R.none]],2,5).includes('winning-streak'));
  assert.ok(sit([[R.cl,R.none],[R.cup,R.none]],2).includes('final-season-decider'),'shown before the last season');
  assert.ok(!sit([[R.max,R.none],[R.max,R.none]],2).includes('final-season-decider'),'not when the last season can no longer settle it');
  assert.ok(!sit([[R.cl,R.none]],1).includes('final-season-decider'));
  assert.equal(G.seasonEdition({projection:proj('f',3,[[R.cl,R.none],[R.cl,R.none],[R.cl,R.none]]),seasonNumber:3}),null,'the last season is told by the final edition');
  // a bonus-only win never prints silverware talk
  for(const seed of '0123456789abcdef'){const e=G.seasonEdition({projection:proj(seed,3,[[result({topScorer:true}),R.none]]),seasonNumber:1});assert.ok(!/silver|troph|cabinet|shelf|title|crown|medal|cup\b/i.test([e.paper.headline,e.paper.subhead,...e.paper.story.paragraphs,e.paper.quote?.text||''].join(' ')),e.paper.headline);}
  // final situations
  const fin=(seed,T,seasons)=>G.finalEdition({projection:proj(seed,T,seasons)});
  assert.equal(fin('1',1,[[R.cl,R.none]]).situation,'showdown-won-1-season');
  const ten=Array.from({length:10},()=>[R.max,R.clLeague]);const golden=fin('2',10,ten);
  assert.equal(golden.situation,'golden-showdown-won');assert.equal(golden.golden,true);assert.equal(golden.paper.variant,'gold');assert.equal(golden.paper.photo.name,'GZ_LEAD_GOLD');
  const tenPlain=fin('3',10,Array.from({length:10},(x,i)=>i%2?[R.cl,R.league]:[R.league,R.cup]));
  assert.ok(['showdown-won-5-seasons','dominant-win','won-on-the-final-day'].includes(tenPlain.situation),tenPlain.situation);assert.equal(tenPlain.golden,false);
  const lastDay=G.finalEdition({projection:proj('4',3,[[R.none,R.cl],[R.cup,R.none],[R.clLeague,R.none]])});
  const lastSits=new Set();for(const seed of '0123456789abcdef')lastSits.add(G.finalEdition({projection:proj(seed,3,[[R.none,R.cl],[R.cup,R.none],[R.clLeague,R.none]])}).situation);
  assert.ok([...lastSits].every(s=>['showdown-won-3-seasons','won-on-the-final-day'].includes(s))&&lastSits.has('won-on-the-final-day'),[...lastSits].join());
  assert.equal(lastDay.winner,'Daniel');
  const domSits=new Set();for(const seed of '0123456789abcdef')domSits.add(G.finalEdition({projection:proj(seed,3,[[R.max,R.none],[R.max,R.none],[R.none,R.cl]])}).situation);
  assert.ok([...domSits].every(s=>['showdown-won-3-seasons','dominant-win'].includes(s))&&domSits.has('dominant-win'),[...domSits].join());
  // the Final Winner frame and the paper never disagree
  const p=proj('5',3,[[R.cl,R.none],[R.cup,R.none],[R.none,R.cup]]),fr=frame(p);
  assert.ok(G.finalEdition({projection:p,final:fr}));assert.equal(G.finalEdition({projection:p,final:{...fr,winner:'nik'}}),null);assert.equal(G.finalEdition({projection:p,final:{...fr,totals:{daniel:1,nik:0}}}),null);
  ok('G4','situations are true to the scores (margins, trophies, overall table, streaks, last-season decider, golden, last-day, dominant) and agree with Final Winner');
}

// G5 every paper of hundreds of Showdowns: printed, placeholders filled, no "Marquee", no repeats inside one Showdown.
{
  let seed=11;const rnd=()=>(seed=(Math.imul(seed,1103515245)+12345)>>>0)/4294967296;
  const one=()=>rnd()<0.15?R.none:result({leaguePosition:rnd()<0.35?1:2+Math.floor(rnd()*8),...(rnd()<0.25?{championsLeague:true}:rnd()<0.2?{europaLeague:true}:{}),domesticCup:rnd()<0.3,topScorer:rnd()<0.2,topAssist:rnd()<0.15,leaguePoints:60+Math.floor(rnd()*45)});
  let papers=0;const seen=new Set();
  for(let n=0;n<400;n+=1){
    const T=[1,3,5,10][n%4],seasons=[];for(let i=0;i<T;i+=1)seasons.push(rnd()<0.12?(r=>[r,r])(one()):[one(),one()]);
    const p={...proj((n%16).toString(16),T,seasons),rivalryId:'pair_'+(n.toString(16)+'0'.repeat(64)).slice(0,64)};
    const heads=[],stories=[];
    for(let N=1;N<T;N+=1){
      const e=G.seasonEdition({projection:p,seasonNumber:N,specialPlayers:sp});assert.ok(e,`season ${N} of Showdown ${n}`);papers+=1;seen.add(e.situation);
      const t=G.paperText(e);assert.ok(!/[{}]/.test(t),`braces: ${n}/${N}`);assert.ok(!/marquee/i.test(t),`Marquee: ${n}/${N}`);
      assert.equal(e.paper.left.score===e.paper.right.score,e.winner==='draw');heads.push(e.ids.headline);stories.push(e.ids.story);
    }
    assert.equal(new Set(heads).size,heads.length,`a headline repeated in Showdown ${n}`);assert.equal(new Set(stories).size,stories.length,`a story repeated in Showdown ${n}`);
    const f=G.finalEdition({projection:p,specialPlayers:sp});assert.ok(f,`final of Showdown ${n}`);papers+=1;seen.add('F:'+f.situation);
    const t=G.paperText(f);assert.ok(!/[{}]/.test(t)&&!/marquee/i.test(t),`final ${n}`);assert.ok(!/next season|next year/i.test(t),`final ${n} looks ahead`);
  }
  for(const s of ['big-win','comfortable-win','narrow-win','draw','champions-league','europa-league','league-title','comeback','lead-extended','level-overall','winning-streak','final-season-decider','F:showdown-won-1-season','F:showdown-won-3-seasons','F:showdown-won-5-seasons','F:showdown-drawn','F:won-on-the-final-day','F:dominant-win'])assert.ok(seen.has(s),`never printed: ${s}`);
  assert.ok(!/marquee/i.test(read('js/touchlineGazette.js').replace(/\/\/.*$/gm,'').replace(/BANNED=\/marquee\/i/,'')),'screen words say Special Player or SP');
  ok('G5',`${papers} papers over 400 Showdowns: all printed, every placeholder filled, no "Marquee", no headline or story repeated within a Showdown, finals never look ahead`);
}

// G6 zero Firestore: the Gazette reads only what the screen already holds and writes nothing but one small local list.
{
  assert.equal(G.firestoreReads,0);assert.equal(G.firestoreWrites,0);
  for(const file of ['js/touchlineGazette.js','data/gazetteCopy.js','data/frontPages.js','visual-assets/v10_1/content/frontpage.js']){
    const src=read(file).replace(/^\s*\/\/.*$/gm,"").replace(/firestore(Reads|Writes):0/g,"");assert.ok(!/firebase|firestore|getDocs?\(|setDoc|updateDoc|onSnapshot|runTransaction|collection\(|fetch\(|XMLHttpRequest|sendBeacon|WebSocket/i.test(src),file);
  }
  assert.ok(/root\.writeStorageValue\(SEEN_KEY/.test(read('js/touchlineGazette.js'))&&!/\blocalStorage\b/.test(read('js/touchlineGazette.js')),'the seen list goes through js/storage.js');assert.equal(G.SEEN_KEY,'careerModeShowdown.gazetteSeen.v1');
  ok('G6','zero Firestore reads or writes: no Firebase, network or storage call besides the local seen list');
}

// ---------- a small page for the flow (just what js/touchlineGazette.js touches) ----------
function world({loadFails=false,proceedResult=true,final=null,history,managerRole='playerOne'}={}){
  const capture=[],docListeners={},store=new Map(),calls={continue:0,ownSeason:0,ownBack:0,shown:[]};
  let screen='seasonEntry';
  class El{
    constructor(tag){this.tagName=tag.toUpperCase();this.children=[];this.parent=null;this.dataset={};this.attrs={};this.listeners={};this.classes=new Set();this.id='';this.disabled=false;this.textContent='';this.scrollTop=0;this.scrollHeight=0;this.offsetHeight=100;const self=this;this.style={setProperty(k,v){self.style[k]=v;}};this.classList={add:(...c)=>c.forEach(x=>this.classes.add(x)),remove:(...c)=>c.forEach(x=>this.classes.delete(x)),contains:c=>this.classes.has(c)};}
    set className(v){this.classes=new Set(String(v).split(/\s+/).filter(Boolean));}get className(){return [...this.classes].join(' ');}
    get firstElementChild(){return this.children[0]||null;}
    appendChild(c){c.remove();c.parent=this;this.children.push(c);return c;}append(...cs){cs.forEach(c=>this.appendChild(c));}
    after(c){const p=this.parent;c.remove();c.parent=p;p.children.splice(p.children.indexOf(this)+1,0,c);}
    remove(){if(this.parent){this.parent.children.splice(this.parent.children.indexOf(this),1);this.parent=null;}}
    get isConnected(){let n=this;while(n.parent)n=n.parent;return n===doc.documentElement;}
    contains(n){while(n){if(n===this)return true;n=n.parent;}return false;}
    matches(sel){return sel.split(',').some(one=>{one=one.trim();if(/\s/.test(one))return false;const m=one.match(/^([a-z]+)?(#[\w-]+)?((?:\.[\w-]+)*)$/i);if(!m)return false;if(m[1]&&m[1].toUpperCase()!==this.tagName)return false;if(m[2]&&m[2].slice(1)!==this.id)return false;return (m[3]||'').split('.').filter(Boolean).every(c=>this.classes.has(c));});}
    closest(sel){let n=this;while(n){if(n.matches(sel))return n;n=n.parent;}return null;}
    querySelector(sel){for(const c of this.children){if(c.matches(sel))return c;const d=c.querySelector(sel);if(d)return d;}return null;}
    setAttribute(k,v){this.attrs[k]=String(v);}addEventListener(t,f){(this.listeners[t]=this.listeners[t]||[]).push(f);}
    getBoundingClientRect(){return {top:0,left:0,width:0,height:0};}focus(){}
    click(){dispatch(this);}
  }
  const doc={documentElement:new El('html'),createElement:t=>new El(t),baseURI:'http://localhost/',
    getElementById(id){const walk=n=>{if(n.id===id)return n;for(const c of n.children){const d=walk(c);if(d)return d;}return null;};return walk(doc.documentElement);},
    addEventListener(t,f){(docListeners[t]=docListeners[t]||[]).push(f);}};
  doc.head=doc.documentElement.appendChild(new El('head'));const body=doc.documentElement.appendChild(new El('body'));
  const main=body.appendChild(new El('main'));const host=main.appendChild(new El('section'));host.id='seasonEntry';
  function dispatch(target){
    const ev={target,stopped:false,defaultPrevented:false,preventDefault(){this.defaultPrevented=true;},stopPropagation(){this.stopped=true;},stopImmediatePropagation(){this.stopped=true;}};
    for(const f of capture)f(ev);
    if(!ev.stopped)for(let n=target;n;n=n.parent)for(const f of n.listeners.click||[])f(ev);
    return ev;
  }
  const go=to=>{screen=to;for(const f of docListeners['career-mode-screen-shown']||[])f({detail:{screen:to}});};
  // the Season Results continue button (production: js/productionSharedMultiSeasonProgression.js) and Final Winner's exit
  const seasonButton=host.appendChild(new El('button'));seasonButton.id='sharedMultiSeasonContinueAction';
  seasonButton.addEventListener('click',()=>{calls.ownSeason+=1;sandbox.CareerModeProductionSharedMultiSeasonProgression.continueToNextSeason();});
  let back=null;
  if(final){
    host.classList.add('v10FinalMode');seasonButton.remove();
    const stage=host.appendChild(new El('div'));stage.className='v10FinalStage';const actions=stage.appendChild(new El('div'));actions.className='seasonEntryActions';
    back=actions.appendChild(new El('button'));back.className='backButton';back.addEventListener('click',()=>{calls.ownBack+=1;go('mainMenu');});
  }
  const sandbox={
    document:doc,console,Promise,URL,setTimeout,clearTimeout,innerHeight:900,
    addEventListener(t,f,cap){if(t==='click'&&cap)capture.push(f);},removeEventListener(){},scrollTo(){},
    matchMedia:()=>({matches:false}),
    readStorageValue:k=>store.has(k)?store.get(k):null,writeStorageValue:(k,v)=>{store.set(k,String(v));return true;},
    getActiveScreenName:()=>screen,optionalAssetUrl:p=>p+'?v=test',
    loadRuntimeScript:()=>loadFails?Promise.reject(new Error('offline')):Promise.resolve(true),loadRuntimeStyle:()=>loadFails?Promise.reject(new Error('offline')):Promise.resolve(true),
    Image:class{set src(v){setTimeout(()=>this.onload&&this.onload(),0);}decode(){return Promise.resolve();}},
    ShowdownContent:{frontPage:{art:n=>`visual-assets/v10_1/content/gazette/${n}.webp`,screen(slot,p,onContinue){
      calls.shown.push(p);const s=slot.appendChild(new El('section'));s.className='cmx-fp-screen';const t=s.appendChild(new El('h2'));t.className='cmx-fp-screen__title';
      const desk=s.appendChild(new El('div'));desk.className='cmx-fp-screen__desk';const paper=desk.appendChild(new El('article'));paper.className='cmx-paper';const photo=paper.appendChild(new El('figure'));photo.className='cmx-paper__photo';
      const b=s.appendChild(new El('button'));b.className='cmx-continue';b.addEventListener('click',()=>{if(onContinue)onContinue();});}}},
    CareerModeGazetteCopy:Copy,CareerModeFrontPages:Pages,
    CareerModeProductionSharedHistoryConvergence:{getState:()=>({...history,managerRole})},
    CareerModeProductionSharedMultiSeasonProgression:{canContinue:()=>true,continueToNextSeason:()=>{calls.continue+=1;if(proceedResult)go('dashboard');return proceedResult;}},
    CareerModeSpecialPlayerChip:{liveFor:()=>sp},
    FINAL_WINNER_FIXTURES:final?{frames:{LIVE:final}}:undefined,CareerModeSeasonFinalV10:{gazetteHistory:()=>final?history:null}
  };
  vm.createContext(sandbox);vm.runInContext(read('js/touchlineGazette.js'),sandbox,{filename:'touchlineGazette.js'});
  const api=sandbox.CareerModeTouchlineGazette;api.install();
  return {api,calls,host,doc,seasonButton,back,dispatch,go,store,screen:()=>screen,page:()=>doc.getElementById('touchlineGazette'),continueButton:()=>doc.getElementById('touchlineGazetteContinue')};
}
const settle=()=>new Promise(resolve=>setTimeout(resolve,30));

(async()=>{
  // G7 SEASON: CONTINUE TO SEASON N+1 opens the paper (its own page), and the paper's CONTINUE runs exactly that step, once.
  {
    const p=proj('6',3,[[R.clLeague,R.cupAward]]),history=fx.history(p);
    const w=world({history});
    const ev=w.dispatch(w.seasonButton);assert.equal(ev.defaultPrevented,true);assert.equal(w.calls.ownSeason,0,'the tap is held while the paper shows');
    await settle();
    assert.ok(w.page(),'the paper is up');assert.equal(w.page().parent,w.host,'inside Season Results, replacing its stage (css hides the rest)');
    assert.equal(w.host.dataset.gazette,'season');assert.equal(w.doc.documentElement.dataset.gazette,'season');assert.equal(w.calls.continue,0);
    const expected=G.seasonEdition({projection:p,seasonNumber:1,specialPlayers:sp});assert.equal(w.calls.shown[0].headline,expected.paper.headline,'the paper on screen is the pure edition');
    assert.ok(w.page().querySelector('.tgz-sp'),'the Special Players line');
    // Nik's phone prints the same paper
    const n=world({history,managerRole:'playerTwo'});n.dispatch(n.seasonButton);await settle();assert.deepEqual(JSON.parse(JSON.stringify(n.calls.shown[0])),JSON.parse(JSON.stringify(w.calls.shown[0])));
    w.dispatch(w.continueButton());await settle();
    assert.equal(w.calls.continue,1,'continueToNextSeason ran once');assert.equal(w.screen(),'dashboard','the flow went on to the same next screen');
    assert.equal(w.page(),null,'the paper closed with the screen');assert.equal(w.host.dataset.gazette,undefined);assert.equal(w.doc.documentElement.dataset.gazette,undefined);
    // replay / reload: the same season's tap goes straight on (the paper is shown once per phone)
    w.go('seasonEntry');const again=w.dispatch(w.seasonButton);await settle();
    assert.equal(again.defaultPrevented,false);assert.equal(w.page(),null);assert.equal(w.calls.ownSeason,1);assert.equal(w.calls.continue,2);
    assert.deepEqual(JSON.parse(w.store.get(G.SEEN_KEY)),[`${p.rivalryId}|season|1`]);
    ok('G7','SEASON edition: shown on CONTINUE TO SEASON N+1, its CONTINUE runs continueToNextSeason once and lands on the same next screen; shown once per phone; both phones print the same paper');
  }
  // G8 FINAL: leaving Final Winner shows the final paper; its CONTINUE lets the same button through, untouched, once.
  {
    const p=proj('7',3,[[R.cl,R.none],[R.cup,R.league],[R.none,R.cup]]),history=fx.history(p),fr=frame(p);
    const w=world({history,final:fr});
    const ev=w.dispatch(w.back);assert.equal(ev.defaultPrevented,true);assert.equal(w.calls.ownBack,0);
    await settle();assert.ok(w.page());assert.equal(w.host.dataset.gazette,'final');
    assert.equal(w.calls.shown[0].headline,G.finalEdition({projection:p,final:fr}).paper.headline);
    w.dispatch(w.continueButton());await settle();
    assert.equal(w.calls.ownBack,1,'BACK TO SHOWDOWN HOME ran once, by its own listener');assert.equal(w.screen(),'mainMenu');assert.equal(w.page(),null);
    w.go('seasonEntry');w.dispatch(w.back);await settle();assert.equal(w.calls.ownBack,2,'second time: straight through');assert.equal(w.page(),null);
    ok('G8','FINAL edition: shown when leaving Final Winner, its CONTINUE lets that same button through once, to the same screen; never twice');
  }
  // G9 never in the way: files that do not load let the tap go on at once; a step that cannot go on closes the paper.
  {
    const p=proj('8',3,[[R.cl,R.none]]),history=fx.history(p);
    const off=world({history,loadFails:true});const ev=off.dispatch(off.seasonButton);assert.equal(ev.defaultPrevented,true);await settle();
    assert.equal(off.page(),null);assert.equal(off.calls.continue,1,'offline: the tap simply went on');assert.equal(off.screen(),'dashboard');
    const stuck=world({history,proceedResult:false});stuck.dispatch(stuck.seasonButton);await settle();assert.ok(stuck.page());
    stuck.dispatch(stuck.continueButton());await settle();assert.equal(stuck.calls.continue,1);assert.equal(stuck.page(),null,'Season Results is back with its own button');assert.equal(stuck.host.dataset.gazette,undefined);
    const src=read('js/touchlineGazette.js');assert.match(src,/ASSET_CAP_MS=4000,FINAL_SAFETY_MS=2500,SEASON_SAFETY_MS=9000/);
    ok('G9','the Gazette never holds anyone up: no files means the tap goes on, a step that cannot go on closes the paper, safety timers close it regardless');
  }
  // G10 the files: HO-048 copy byte for byte, shell-cached, fonts licensed, images on the V10 runtime cache, wired in once.
  {
    const sha=file=>crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT,file))).digest('hex');
    // Team V HO-048, origin/claude/project-thread-fyjnky 8fa67110 visual-assets/v10_1/content/{fixtures/gazetteCopy.js,fixtures/frontPages.js,frontpage.js,content.css}
    assert.equal(sha('data/gazetteCopy.js'),'3bc761e89b5e47c79e43df5b6da6d0585a021684c1b43870d492029cae52eb76');
    assert.equal(sha('data/frontPages.js'),'054c60cbfd2ecde8f506014cb8b8b4f99416fb5736200cca53fc5133dfaf0bfd');
    assert.equal(sha('visual-assets/v10_1/content/frontpage.js'),'a4b8ced9ac63123795bfe1d9ee2741027df7426466b5f5b5314c3bf55a58baf6');
    assert.equal(sha('visual-assets/v10_1/content/content.css'),'cfa7f1a4227673127ad34f59f5c0c4272248846cf3a456d2c814923ad0f6f7dc');
    assert.equal(Copy.stories.length,114);assert.equal(Copy.duets.length,288);for(const k of ['briefs','captions','ears','quotes'])assert.equal(Copy.small[k].length,30,k);
    assert.equal(Pages.contentVersion,2);assert.equal(Pages.season.length,477);assert.equal(Pages.final.length,258);
    const sw=read('service-worker.js'),added=new Set(JSON.parse(sw.match(/SHELL_PATHS_ADDED_SINCE_PREVIOUS = new Set\((\[[^\]]*\])\)/)[1]));
    const files=['js/touchlineGazette.js','data/gazetteCopy.js','data/frontPages.js','css/v10Gazette.css','visual-assets/v10_1/content/content.css','visual-assets/v10_1/content/frontpage.js',...G.FONT_FILES,...['unifrakturmaguntia','playfair-display','old-standard-tt'].map(f=>`visual-assets/v10_1/content/gazette/fonts/LICENSE-${f}.txt`)];
    for(const f of files){assert.ok(fs.existsSync(path.join(ROOT,f)),f);assert.ok(sw.includes(`  "${f}",`)&&added.has(f),`shell lists ${f} (and as added since r86)`);}
    assert.ok(!/content\/gazette\/GZ_[A-Z_]+\.webp/.test(sw),'press photos ride the V10 image runtime cache, not the shell');
    for(const f of G.FONT_FILES)assert.ok(/LICENSE|SIL Open Font License/i.test(read(`visual-assets/v10_1/content/gazette/fonts/LICENSE-${path.basename(f).split('-latin')[0]}.txt`)),f);
    assert.ok(!fs.readdirSync(path.join(ROOT,'visual-assets/v10_1/content')).some(f=>/\.(md|html|json)$/.test(f)),'reference files live in project-documents/r87/touchline-gazette');
    const sf=read('js/seasonFinalV10.js');
    assert.match(sf,/loadRuntimeScript\("touchline-gazette","js\/touchlineGazette\.js"/);assert.match(sf,/CareerModeTouchlineGazette\?\.install\?\.\(\)/);
    assert.match(sf,/sfGazetteHistory=final\.status==="ready"\?history:null;/);assert.match(sf,/gazetteHistory:\(\)=>sfGazetteHistory/);
    // Commentary v2 keeps its own 5,100 lines: HO-048's commentaryLines.js (24 different situations) is not swapped in.
    assert.equal(require('../../data/commentaryLines.js').results.length,5100);
    const css=read('css/v10Gazette.css');assert.ok(!/rgba\(0,\s*0,\s*0,\s*0?\.\d+\)\s*;?\s*\}?\s*$/m.test(css.replace(/box-shadow[^;]*;/g,'')),'no scrim');assert.ok(!/backdrop-filter|opacity:\s*0?\.\d/.test(css),'no dimming');
    ok('G10','HO-048 headlines, copy, paper and sheet byte for byte; every runtime file shell-cached with its font licence; photos on the image cache; wired from Season Results; Commentary v2 lines untouched; no scrim');
  }
  console.log(`PASS r87 Touchline Gazette contracts: ${checks} checks.`);
})().catch(error=>{console.error(error);process.exit(1);});
