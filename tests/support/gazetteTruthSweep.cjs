'use strict';
// r87 Touchline Gazette truth sweep (Fable cloud job 1). Builds valid Shared History projections (the shape the contracts use)
// and renders every paper js/touchlineGazette.js can print for them: every season-score pair 0..11 x 0..11 with every legal
// trophy mix that gives those scores (CL or EL or neither, league title, domestic cup, both bonuses), as season 1, 2 and 9 of
// a 10-season Showdown and as the last season of a 1-, 3- and 5-season Showdown (told by the FINAL edition), plus the FINAL
// cases (Daniel wins, Nik wins, level, a 1-point and a big margin, a comeback, a lead held throughout, Golden, 0 total, Special
// Players present and missing, clubs with an apostrophe and an accent), each over many Showdown ids so the hash walks
// different rows. Every printed row is recorded with the facts it was printed for and sample filled texts, and every paper
// goes through the mechanical checks (braces, undefined/NaN/null, "1 points", "marquee", foreign managers and clubs, invented
// numbers, both phones, throws/null) and a set of truth checks keyed on the facts (a draw told as a win, a 1-point win as a
// rout, Europe without Europe, "five seasons" in a ten-season Showdown, ...). Reports under project-documents/r87/gazette-truth/.
//
//   node tests/support/gazetteTruthSweep.cjs                 full sweep, 50 ids per case, writes the JSON report
//   node tests/support/gazetteTruthSweep.cjs --ids=N --out=name.json   fewer ids, another report name
//   node tests/support/gazetteTruthSweep.cjs --fast          the contract's fixed-seed subset (a few seconds)
const fs=require('node:fs');
const path=require('node:path');
const ROOT=path.resolve(__dirname,'../..');
const G=require(path.join(ROOT,'js/touchlineGazette.js'));
const Copy=require(path.join(ROOT,'data/gazetteCopy.js'));
const Pages=require(path.join(ROOT,'data/frontPages.js'));
const History=require(path.join(ROOT,'js/sharedHistoryConvergence.js'));
const {score,winner:winnerOf,result}=require('./career-fixture-helpers.cjs');

const NAMES={playerOne:'Daniel',playerTwo:'Nik'};
const OTHER={playerOne:'playerTwo',playerTwo:'playerOne'};
const CLUBS={playerOne:"Borussia M'gladbach",playerTwo:'Atlético Madrid'};
const SP={daniel:{name:'Lionel Messi'},nik:{name:'Cristiano Ronaldo'}};

// ---------- the 48 legal item mixes of one manager's season (score 0..11) ----------
const MIXES=[];
for(const euro of ['','CL','EL'])for(const title of [0,1])for(const cup of [0,1])for(const perf of [0,1])for(const awards of [0,1]){
  const r=result({leaguePosition:title?1:5,championsLeague:euro==='CL',...(euro==='EL'?{europaLeague:true}:{}),domesticCup:Boolean(cup),leaguePoints:perf?101:60,topScorer:Boolean(awards)});
  const s=score(r);
  MIXES.push({label:[euro||null,title?'T':null,cup?'C':null,perf?'P':null,awards?'A':null].filter(Boolean).join('+')||'-',result:r,total:s.total,CL:euro==='CL',EL:euro==='EL',T:Boolean(title),C:Boolean(cup),P:Boolean(perf),A:Boolean(awards),trophies:(euro?1:0)+title+cup});
}
const byTotal=Array.from({length:12},(_,t)=>MIXES.filter(m=>m.total===t));
const mixOf=label=>MIXES.find(m=>m.label===label);
const M={none:mixOf('-'),cup:mixOf('C'),award:mixOf('A'),cupAward:mixOf('C+A'),title:mixOf('T'),cl:mixOf('CL'),el:mixOf('EL'),clTitle:mixOf('CL+T'),clTitleCup:mixOf('CL+T+C'),max:mixOf('CL+T+C+P+A'),elTitle:mixOf('EL+T')};

// ---------- projections (same builder and shape as the contracts; clubs with an apostrophe and an accent) ----------
function hex(n){return (n>>>0).toString(16).padStart(8,'0');}
function rivalryId(seed){let s='';let x=((seed+0x9e3779b9)*2654435761)>>>0;for(let i=0;i<8;i+=1){x=(Math.imul(x^(x>>>15),0x2c1b3c6d)>>>0);x=(x^(x>>>12))>>>0;s+=hex(x);}return 'pair_'+s.slice(0,64);}
function buildProjection({seed,totalSeasons,seasons,clubs=CLUBS}){
  const hash=n=>'sha256:'+String(n).padStart(64,'0');
  return History.buildProjection({rivalryId:rivalryId(seed),setup:{phase:'SHOWDOWN_CONFIRMED',revision:6,coordinatorRole:'playerOne',totalSeasons,leagueId:'premier_league',clubs:{...clubs}},
    managerSlots:[{slotId:'playerOne',accountId:'acct_daniel',profileId:'profile_'+'a'.repeat(24),saveId:'save_'+'a'.repeat(24),entitlementState:'active'},{slotId:'playerTwo',accountId:'acct_nik',profileId:'profile_'+'b'.repeat(24),saveId:'save_'+'b'.repeat(24),entitlementState:'active'}],
    seasons:seasons.map(([p1,p2],i)=>{const n=i+1,h=hash(n);return {commit:{ok:true,committed:true,phase:'ACKNOWLEDGED',revision:3,resultsRevision:2,resultsContentHash:h,seasonNumber:n,results:{playerOne:p1.result,playerTwo:p2.result}},scoring:{ok:true,authoritative:true,phase:'SCORING_RECONCILED',revision:1,seasonCommitRevision:3,resultsRevision:2,resultsContentHash:h,seasonNumber:n,scoring:{playerOne:score(p1.result),playerTwo:score(p2.result)},winner:winnerOf(p1.result,p2.result)}};})});
}

// ---------- prefixes: the seasons before the one under test, so every overall situation is reached ----------
// Each family is a function of the number of seasons wanted; mixes are chosen so the facts (who leads, by how much, streaks,
// level, decided early) are as named.
const PREFIX={
  'daniel-leads':n=>Array.from({length:n},(_,i)=>i%2?[M.title,M.cup]:[M.cl,M.cupAward]),
  'nik-leads':n=>Array.from({length:n},(_,i)=>i%2?[M.cup,M.title]:[M.cupAward,M.cl]),
  'level':n=>Array.from({length:n},(_,i)=>i%2?[M.none,M.cl]:[M.cl,M.none]),
  'all-draws':n=>Array.from({length:n},()=>[M.cup,M.cup]),
  'daniel-streak':n=>Array.from({length:n},()=>[M.clTitle,M.cup]),
  'nik-streak':n=>Array.from({length:n},()=>[M.cup,M.clTitle]),
  'daniel-wide':n=>Array.from({length:n},()=>[M.max,M.none]),
  'nik-wide':n=>Array.from({length:n},()=>[M.none,M.max]),
  'daniel-narrow':n=>Array.from({length:n},(_,i)=>i%2?[M.cupAward,M.cup]:[M.cup,M.none]),
  'nik-narrow':n=>Array.from({length:n},(_,i)=>i%2?[M.cup,M.cupAward]:[M.none,M.cup]),
  'daniel-euro':n=>Array.from({length:n},(_,i)=>i%2?[M.el,M.none]:[M.cl,M.cup]),
  'nik-euro':n=>Array.from({length:n},(_,i)=>i%2?[M.none,M.el]:[M.cup,M.cl]),
  'zero':n=>Array.from({length:n},()=>[M.none,M.none])
};
const PREFIX_NAMES=Object.keys(PREFIX);

// ---------- the facts of one paper (read from the projection, independently of the engine) ----------
function itemsOf(mix){return {CL:mix.CL,EL:mix.EL,T:mix.T,C:mix.C,P:mix.P,A:mix.A,trophies:mix.trophies,total:mix.total,label:mix.label};}
function seasonFacts(seasons,N,T){
  const s=seasons[N-1],a=s[0].total,b=s[1].total,W=a>b?'playerOne':b>a?'playerTwo':'draw';
  const sum=(k,upTo)=>seasons.slice(0,upTo).reduce((t,x)=>t+x[k==='playerOne'?0:1].total,0);
  const before={playerOne:sum('playerOne',N-1),playerTwo:sum('playerTwo',N-1)},after={playerOne:sum('playerOne',N),playerTwo:sum('playerTwo',N)};
  const L=W==='draw'?null:OTHER[W];
  let streak=0;if(W!=='draw')for(let i=N-1;i>=0;i-=1){const x=seasons[i],w=x[0].total>x[1].total?'playerOne':x[1].total>x[0].total?'playerTwo':'draw';if(w!==W)break;streak+=1;}
  const leader=after.playerOne>after.playerTwo?'playerOne':after.playerTwo>after.playerOne?'playerTwo':null;
  return {kind:'season',T,N,a,b,W,L,margin:Math.abs(a-b),winnerPoints:W==='draw'?null:(W==='playerOne'?a:b),loserPoints:W==='draw'?null:(W==='playerOne'?b:a),
    wItems:W==='draw'?null:itemsOf(s[W==='playerOne'?0:1]),lItems:W==='draw'?null:itemsOf(s[W==='playerOne'?1:0]),items:{playerOne:itemsOf(s[0]),playerTwo:itemsOf(s[1])},
    gapBefore:W==='draw'?null:before[W]-before[L],gapAfter:W==='draw'?null:after[W]-after[L],leader,gap:Math.abs(after.playerOne-after.playerTwo),
    level:after.playerOne===after.playerTwo,streak,decider:T>=3&&N===T-1&&Math.abs(after.playerOne-after.playerTwo)<=11,totals:after,before,points:W==='draw'?a:null};
}
function finalFacts(seasons,T,sp,clubs){
  const totals={playerOne:0,playerTwo:0};const rec={playerOne:{CL:0,EL:0,T:0,C:0,P:0,A:0,wins:0,best:0},playerTwo:{CL:0,EL:0,T:0,C:0,P:0,A:0,wins:0,best:0}};let draws=0;
  for(const s of seasons){totals.playerOne+=s[0].total;totals.playerTwo+=s[1].total;const w=s[0].total>s[1].total?'playerOne':s[1].total>s[0].total?'playerTwo':'draw';if(w==='draw')draws+=1;else rec[w].wins+=1;
    for(const [i,role] of [[0,'playerOne'],[1,'playerTwo']]){for(const k of ['CL','EL','T','C','P','A'])rec[role][k]+=s[i][k]?1:0;rec[role].best=Math.max(rec[role].best,s[i].total);}}
  const W=totals.playerOne>totals.playerTwo?'playerOne':totals.playerTwo>totals.playerOne?'playerTwo':'draw',L=W==='draw'?null:OTHER[W];
  const before={playerOne:totals.playerOne-seasons[T-1][0].total,playerTwo:totals.playerTwo-seasons[T-1][1].total};
  const gapBefore=W==='draw'?null:before[W]-before[L];
  const trail=i=>{const p=seasons.slice(0,i).reduce((t,s)=>({playerOne:t.playerOne+s[0].total,playerTwo:t.playerTwo+s[1].total}),{playerOne:0,playerTwo:0});return p;};
  let ledThroughout=W!=='draw',trailedUntilLast=W!=='draw'&&T>=2;
  for(let i=1;i<T;i+=1){const p=trail(i);if(W!=='draw'){if(p[W]<=p[L])ledThroughout=false;if(p[W]>=p[L])trailedUntilLast=false;}}
  return {kind:'final',T,N:T,W,L,margin:Math.abs(totals.playerOne-totals.playerTwo),winnerPoints:W==='draw'?null:totals[W],loserPoints:W==='draw'?null:totals[L],totals,points:W==='draw'?totals.playerOne:null,
    golden:T===10&&Math.max(totals.playerOne,totals.playerTwo)>=110,gapBefore,decidedEarly:W!=='draw'&&T>=3&&gapBefore>11,wonOnFinalDay:W!=='draw'&&T>=3&&gapBefore<=0,ledThroughout,trailedUntilLast,
    rec,draws,last:{a:seasons[T-1][0].total,b:seasons[T-1][1].total},sp:Boolean(sp),clubs,wItems:W==='draw'?null:rec[W],lItems:W==='draw'?null:rec[L]};
}

// ---------- reading the paper back: every printed row, with its id ----------
const fillText=(text,vals)=>G.fill(text,vals);
function valsFor(f,clubs){
  const v={seasonNo:f.N,seasonsTotal:f.T,managerA:'Daniel',managerB:'Nik',clubA:clubs.playerOne,clubB:clubs.playerTwo};
  if(f.W!=='draw')Object.assign(v,{winner:NAMES[f.W],loser:NAMES[f.L],winnerClub:clubs[f.W],loserClub:clubs[f.L],winnerPoints:f.winnerPoints,loserPoints:f.loserPoints,margin:f.margin});
  if(f.kind==='season'){if(f.leader)Object.assign(v,{leader:NAMES[f.leader],trailer:NAMES[OTHER[f.leader]]});}
  else if(f.W!=='draw')Object.assign(v,{leader:NAMES[f.W],trailer:NAMES[f.L]});
  return v;
}
function printedRows(edition,f,clubs){
  const p=edition.paper,rows=[];
  const head=(edition.kind==='season'?Pages.season:Pages.final).find(r=>r.id===edition.ids.headline);
  rows.push({id:edition.ids.headline,kind:'headline',situation:head?.situation,template:head?[head.headline,head.subhead,head.kicker].join(' / '):null,text:[p.kicker,p.headline,p.subhead].join(' / ')});
  const story=Copy.stories.find(s=>s.id===edition.ids.story);
  rows.push({id:edition.ids.story,kind:'story',situation:story?.situation,template:story?[story.standfirst,...story.paragraphs].filter(Boolean).join(' // '):null,text:[p.story.byline,...p.story.paragraphs].join(' // ')});
  const base=valsFor(f,clubs);
  const vals=edition.situation==='level-overall'?{...base,points:f.totals.playerOne}:edition.situation==='draw'||(edition.kind==='final'&&f.W==='draw')?{...base,points:f.points}:base;
  const qvals=f.W==='draw'?{...base,points:f.points}:base;
  if(p.quote){const i=Copy.small.quotes.findIndex(q=>fillText(q.text,qvals)===p.quote.text&&fillText(q.who,qvals)===p.quote.who);rows.push({id:i>=0?`quote#${i}`:'quote#?',kind:'quote',situation:i>=0?Copy.small.quotes[i].situation+'/'+Copy.small.quotes[i].who:null,template:i>=0?Copy.small.quotes[i].text:null,text:`${p.quote.text} — ${p.quote.who}`});}
  if(p.photo.caption){const i=Copy.small.captions.findIndex(c=>fillText(c.text,qvals)===p.photo.caption);rows.push({id:i>=0?`caption#${i}`:'caption#?',kind:'caption',situation:i>=0?Copy.small.captions[i].photo:null,template:i>=0?Copy.small.captions[i].text:null,text:p.photo.caption});}
  for(const ear of p.ears){if(!ear)continue;const i=Copy.small.ears.findIndex(e=>e.text===ear);rows.push({id:i>=0?`ear#${i}`:'ear#?',kind:'ear',situation:null,template:ear,text:ear});}
  p.briefs.forEach((b,i)=>rows.push({id:b.id,kind:'brief',situation:b.id.split(':')[1]||b.id,template:/^brief:[a-z-]+:\d+$/.test(b.id)?null:'(engine line)',text:`${b.head} / ${b.text}`,role:i===0?'playerOne':'playerTwo'}));
  if(p.portrait)rows.push({id:`engine:portrait:${p.portrait.name.replace(/_(DANIEL|NIK)$/,'')}`,kind:'engine',situation:null,template:'(engine line)',text:p.portrait.caption});
  rows.push({id:'engine:kicker',kind:'engine',situation:null,template:'(engine line)',text:p.kicker});
  rows.push({id:'engine:masthead',kind:'engine',situation:null,template:'(engine line)',text:[p.season,p.dateline,p.edition,p.issue,p.numbersTitle].join(' / ')});
  if(p.specialPlayers)rows.push({id:'engine:special-players',kind:'engine',situation:null,template:'(engine line)',text:`Special Players Daniel: ${p.specialPlayers.daniel} Nik: ${p.specialPlayers.nik}`});
  return {rows,vals};
}

// ---------- checks ----------
const FOREIGN_MANAGERS=/\b(Pep|Guardiola|Mourinho|Klopp|Ferguson|Wenger|Ancelotti|Conte|Simeone|Zidane|Allegri|Tuchel|Arteta|Pochettino|Emery|Ranieri|Ben[ií]tez|Rodgers|Nagelsmann|Flick|Xavi|Enrique|Sarri|Spalletti|Inzaghi|Koeman|Valverde|Lopetegui|Heynckes|Hiddink|Capello|Lippi|Trapattoni|Cruyff|Clough|Shankly|Busby|Paisley|Dalglish|Moyes|Solskj[aæ]r|Van Gaal|Hodgson|Pulis|Dyche|Bielsa|Potter|Lampard|Gerrard|Rooney|Terry|Scholes|Keane|Vieira|Henry|Bergkamp|Pirlo|Gattuso|Mancini|Deschamps|Blanc|Favre|Streich|Rose|Terzic|Kov[aá][cč]|Tedesco|Marsch|Galtier|Fonseca|Pioli|Mihajlovi[cć]|Gasperini|De Zerbi|Iraola|Glasner|Hürzeler|Amorim|Maresca|Postecoglou|Hasenh[uü]ttl|Allardyce|Redknapp|Pardew|Warnock|Neville|Fabregas|Messi|Ronaldo|Neymar|Mbapp[eé]|Haaland|Salah|Kane|Lewandowski|Bale|Su[aá]rez|Hazard|Pogba|Griezmann|Ag[uü]ero|Iniesta|Modri[cć]|Kroos|Ramos|Piqu[eé]|Neuer|Buffon|Ibrahimovi[cć]|Reus|Müller|Muller|Robben|Ribery|Ribéry|Lahm|Schweinsteiger|Özil|Ozil|Sanchez|Sánchez|Alexis|Benzema|Marcelo|Isco|Asensio|Casemiro|Vinicius|Rodrygo|Bellingham|Pedri|Gavi|Yamal|Dembélé|Dembele|Coutinho|Firmino|Mané|Van Dijk|Alisson|Ederson|De Bruyne|Sterling|Foden|Grealish|Rashford|Fernandes|Sancho|Martial|Lukaku|Vardy|Mahrez|Kanté|Eriksen|Lloris|Vertonghen|Alderweireld|Maguire|Pickford)\b/;
const FOREIGN_CLUBS=['Barcelona','Barça','Real Madrid','Bayern','Juventus','Chelsea','Arsenal','Liverpool','Manchester','Man United','Man City','Tottenham','Spurs','Dortmund','Milan','Inter','Paris','PSG','Atletico','Atlético','Sevilla','Leicester','Everton','Ajax','Porto','Benfica','Roma','Napoli','Lyon','Marseille','Monaco','Celtic','Rangers','Leverkusen','Schalke','Valencia','Villarreal','Lazio','Fiorentina','PSV','Feyenoord','Galatasaray','Wolfsburg','Leipzig','Gladbach','Newcastle','West Ham','Aston Villa','Southampton','Sunderland','Stoke','Swansea','Watford','Burnley','Bournemouth','Crystal Palace','Middlesbrough','Real Sociedad','Betis','Celta','Espanyol','Torino','Sampdoria','Genoa','Bologna','Udinese','Atalanta','Sassuolo','Lille','Saint-Étienne','Bordeaux','Nantes','Rennes','Toulouse','Hoffenheim','Mainz','Freiburg','Augsburg','Köln','Cologne','Frankfurt','Bremen','Hamburg','Hertha','Stuttgart','Hannover','Nürnberg'];
const NUMBER_WORDS={one:1,two:2,three:3,four:4,five:5,six:6,seven:7,eight:8,nine:9,ten:10,eleven:11,twelve:12,twenty:20,thirty:30,forty:40,fifty:50,hundred:100};
function numbersAllowed(f){
  const set=new Set([f.N,f.T,f.N+1,f.N-1,100,110,11,0]);
  if(f.kind==='season'){set.add(f.a);set.add(f.b);set.add(f.margin);set.add(f.totals.playerOne);set.add(f.totals.playerTwo);set.add(f.gap);set.add(f.T-f.N);}
  else{set.add(f.totals.playerOne);set.add(f.totals.playerTwo);set.add(f.margin);set.add(f.last.a);set.add(f.last.b);set.add(f.rec.playerOne.wins);set.add(f.rec.playerTwo.wins);}
  return set;
}
// Truth checks: each is [name, regex, predicate(facts, row) -> true when the words are false for these facts]. They run on the
// filled text of every row, so a false row is reported with the input that makes it false. They are deliberately broad
// (a sub-editor reads every hit); the mechanical failures are the braces/undefined/foreign/number/phones/null ones.
const W=f=>f.wItems,L=f=>f.lItems;
const TRUTH=[
  ['draw-told-as-win',/\b(wins?|won|winner|beat|beats|beaten|victory|victor|triumph|conquer|defeat|loser|losers|runner-up)\b/i,f=>f.W==='draw'],
  ['europe-without-europe',/champions league|european champion|kings? of europe|continent|continental|europe\b|european/i,f=>f.W!=='draw'&&!(W(f).CL||W(f).EL)],
  ['cl-words-without-cl',/champions league|biggest prize|top prize|grandest|most famous prize|european champion|kings? of europe|continent's crown|continental crown/i,f=>f.W!=='draw'&&!W(f).CL],
  ['el-words-without-el',/europa/i,f=>f.W!=='draw'&&!W(f).EL],
  ['title-without-title',/league title|league crown|league shield|league champion|champions of the league|won the league|took the league|the title\b|title race|title-winning|league winner/i,f=>f.W!=='draw'&&!W(f).T],
  ['cup-without-cup',/domestic cup|the cup final|cup winner|cup-winning|cup run/i,f=>f.W!=='draw'&&!W(f).C],
  ['silver-without-trophy',/silver|troph|cabinet|medal|engrav|plaque|crown|\bcups?\b|display case|glass case|shelf|shelves/i,f=>f.W!=='draw'&&W(f).trophies===0&&f.kind==='season'],
  ['one-point-not-one',/\b(a single point|one point|a point|1 point|one-point|single-point|by a point|by one)\b/i,f=>f.W!=='draw'&&f.margin!==1],
  ['two-points-not-two',/\b(two points|2 points|two-point|by two)\b/i,f=>f.W!=='draw'&&f.margin!==2],
  ['rout-on-small-margin',/\b(rout|routed|thrash|thrashed|hammer|hammered|crush|crushed|demolish|annihilat|humiliat|massacre|slaughter|walkover|procession|landslide|runaway|different postcode|daylight|streets ahead|miles ahead|by a mile|a mile\b|chasm|gulf|canyon|different league)/i,f=>f.W!=='draw'&&f.margin<6],
  ['perfect-not-perfect',/\b(every trophy|every prize|all the trophies|clean sweep|full house|everything on offer|all eleven|maximum|perfect season|perfect campaign|flawless|unbeatable|nothing left to win|the lot\b)/i,f=>f.W!=='draw'&&f.kind==='season'&&f.winnerPoints<11],
  ['double-treble',/\b(the double|a double|the treble|a treble|quadruple)\b/i,f=>f.W!=='draw'&&f.kind==='season'&&W(f).trophies<2],
  ['narrow-told-as-comfortable',/\b(comfortabl|at a canter|in a canter|cruis|coast|strolled|stroll|easy|easily|ease\b|breeze|untroubled|unchallenged)/i,f=>f.W!=='draw'&&f.kind==='season'&&f.margin<3],
  ['loser-scored-nothing',/\b(nothing to show|empty-handed|empty handed|without a point|no points|zero points|scoreless|nil\b|pointless|blank)\b/i,f=>f.W!=='draw'&&f.loserPoints>0],
  ['winner-scored-nothing-claims',/\b(no points|zero points|nil\b|pointless)\b/i,f=>f.W!=='draw'&&f.winnerPoints>0&&f.loserPoints>0],
  ['three-seasons-not-three',/\b(three seasons|three-season|3 seasons|three campaigns|three years|trilogy)\b/i,f=>f.T!==3],
  ['five-seasons-not-five',/\b(five seasons|five-season|5 seasons|five campaigns|five years|half a decade|half-decade)\b/i,f=>f.T!==5],
  ['ten-seasons-not-ten',/\b(ten seasons|ten-season|10 seasons|ten campaigns|ten years|a decade|the decade|decade-long)\b/i,f=>f.T!==10],
  ['one-season-not-one',/\b(one season|one-season|single season|single-season|a season-long|one-off season|sprint)\b/i,f=>f.T!==1&&f.kind==='final'],
  ['next-season-in-final',/next season|new season|season ahead|next year|next campaign|next time|rematch|the return|round two|again next/i,f=>f.kind==='final'],
  ['streak-three-not-three',/\b(three in a row|third straight|third in a row|three straight|three on the spin|three consecutive|hat-trick|hat trick|treble of seasons|three wins running)\b/i,f=>f.kind==='season'&&f.streak!==3],
  ['streak-four-not-four',/\b(four in a row|fourth straight|fourth in a row|four straight|four on the spin|four consecutive)\b/i,f=>f.kind==='season'&&f.streak!==4],
  ['streak-five-not-five',/\b(five in a row|fifth straight|fifth in a row|five straight|five consecutive)\b/i,f=>f.kind==='season'&&f.streak!==5],
  ['comeback-claims-level-or-lead',/\b(level|all square|back on terms|draws? level|in front|ahead\b|takes the lead|took the lead|leads|leader|overtak|overhaul|top of the table|on top)\b/i,(f,row)=>f.kind==='season'&&row.situation==='comeback'&&f.gapAfter<0],
  ['level-claims-leader',/\b(in front|ahead\b|takes the lead|took the lead|leads by|lead of|holds the lead|top of the table|edges? (ahead|in front)|noses? (ahead|in front))\b/i,(f,row)=>f.kind==='season'&&row.situation==='level-overall'&&f.level],
  ['decider-claims-level',/\b(level|all square|dead heat|nothing between|tied|neck and neck|dead level|deadlock|inseparable|could not be separated)\b/i,(f,row)=>f.kind==='season'&&row.situation==='final-season-decider'&&f.gap!==0],
  ['decider-claims-lead',/\b(in front|ahead\b|leads|lead of|holds the lead|the leader|on top|edges? (ahead|in front)|behind|trail|chasing|catch up|deficit|close the gap|pegged back)\b/i,(f,row)=>f.kind==='season'&&row.situation==='final-season-decider'&&f.gap===0],
  ['decider-not-decider',/\b(one season left|one more season|last season|final season|decider|deciding season|one to play|one game left|everything on the last|all on the last|winner takes all|whoever wins)\b/i,(f,row)=>f.kind==='season'&&row.situation!=='final-season-decider'&&f.T-f.N!==1],
  ['final-day-claims-trailing',/\b(trail|behind|deficit|from behind|came back|comeback|overturn|chase|chasing|caught|catch|reel|pegged|clawed|fought back|turned it around|turnaround|recover)/i,(f,row)=>f.kind==='final'&&row.situation==='won-on-the-final-day'&&f.gapBefore===0],
  ['final-day-claims-level',/\b(level|all square|tied|dead heat|nothing between|neck and neck|inseparable|deadlock|dead level)\b/i,(f,row)=>f.kind==='final'&&row.situation==='won-on-the-final-day'&&f.gapBefore<0],
  ['final-day-not-final-day',/\b(final day|last day|last season|final season|decider|settled it|settled on|the very end|at the death|the last word|final act|final word|came down to|went to the wire|down to the wire|last gasp|late show)\b/i,(f,row)=>f.kind==='final'&&row.situation!=='won-on-the-final-day'&&row.situation!=='showdown-won-1-season'&&f.decidedEarly],
  ['dominant-claims-every-season',/\b(every season|all (three|five|ten) seasons|each season|unbeaten|never lost|without defeat|without losing|never trailed|never behind|led from start to finish|start to finish|wire to wire|every single season|whitewash|clean sweep|never headed|all the way)\b/i,(f,row)=>f.kind==='final'&&f.W!=='draw'&&(f.rec[f.W].wins<f.T||!f.ledThroughout)],
  ['dominant-not-dominant',/\b(out of reach|out of sight|sewn up|wrapped up|done and dusted|decided early|settled early|long before|with a season to spare|seasons? to spare|before the end|never in doubt|never a contest|no contest|one-sided|foregone)\b/i,(f,row)=>f.kind==='final'&&row.situation!=='dominant-win'&&!f.decidedEarly],
  ['golden-words-not-golden',/\bgolden\b|110\b|flawless|perfect showdown|every point available|maximum/i,f=>f.kind==='final'&&!f.golden],
  ['level-showdown-winner',/\b(winner|wins|won|champion|took the showdown|takes the showdown|lifts|lifted|claims|claimed|seals|sealed)\b/i,f=>f.kind==='final'&&f.W==='draw'],
  ['big-final-margin-on-small',/\b(rout|routed|thrash|hammer|crush|demolish|annihilat|humiliat|procession|landslide|runaway|daylight|streets ahead|miles ahead|by a mile|chasm|gulf|canyon|different league|different postcode|one-sided)/i,f=>f.kind==='final'&&f.W!=='draw'&&f.margin<6],
  ['final-one-point-not-one',/\b(a single point|one point|a point|1 point|one-point|single-point|by a point|by one)\b/i,f=>f.kind==='final'&&f.W!=='draw'&&f.margin!==1],
  ['showdown-cl-without-cl',/champions league|european champion|kings? of europe|continent's crown|continental crown/i,f=>f.kind==='final'&&f.W!=='draw'&&f.rec[f.W].CL===0],
  ['showdown-europe-without-europe',/continent|continental|europe\b|european|europa/i,f=>f.kind==='final'&&f.W!=='draw'&&f.rec[f.W].CL===0&&f.rec[f.W].EL===0],
  ['showdown-title-without-title',/league title|league crown|league shield|league champion|champions of the league|won the league|title race/i,f=>f.kind==='final'&&f.W!=='draw'&&f.rec[f.W].T===0]
];
function checkText(text,f,row,sp,skipNumbers=false){
  const out=[];
  if(/[{}]/.test(text))out.push('braces');
  if(/\b(undefined|NaN|null)\b/.test(text))out.push('undefined/NaN/null');
  if(/\b1 points\b/.test(text))out.push('"1 points"');
  if(/marquee/i.test(text))out.push('marquee');
  const names=text.match(FOREIGN_MANAGERS);
  if(names&&!(sp&&(sp.daniel.name.includes(names[0])||sp.nik.name.includes(names[0]))))out.push('foreign name: '+names[0]);
  const own=[CLUBS.playerOne,CLUBS.playerTwo,f.clubs?.playerOne||'',f.clubs?.playerTwo||''].join(' ').toLowerCase();
  for(const club of FOREIGN_CLUBS){if(own.includes(club.toLowerCase()))continue;if(new RegExp('\\b'+club.replace(/[-\/\\^$*+?.()|[\]{}]/g,'\\$&')+'\\b','i').test(text))out.push('foreign club: '+club);}
  const allowed=numbersAllowed(f);
  if(!skipNumbers)for(const m of text.matchAll(/\b(\d+)\b/g)){const n=Number(m[1]);if(!allowed.has(n))out.push('number '+n);}
  return out;
}
function truthHits(text,f,row){
  const hits=[];
  for(const [name,re,bad] of TRUTH){const m=text.match(re);if(m&&bad(f,row))hits.push(name+' ("'+m[0]+'")');}
  return hits;
}

// ---------- the sweep ----------
function makeReport(){
  return {rows:{},failures:[],truth:{},papers:0,editions:{season:0,final:0},cases:{},contexts:{},situations:{},started:new Date().toISOString()};
}
const CAP_INPUTS=160,CAP_TEXTS=4;
function addSet(obj,key,value){(obj[key]=obj[key]||{});obj[key][String(value)]=(obj[key][String(value)]||0)+1;}
function recordRow(report,row,f,paperSituation,caseName,text){
  const r=report.rows[row.id]=report.rows[row.id]||{id:row.id,kind:row.kind,situation:row.situation,template:row.template,count:0,editions:{},paperSituations:{},cases:{},facts:{},texts:[],inputs:{}};
  r.count+=1;r.editions[f.kind]=(r.editions[f.kind]||0)+1;r.paperSituations[paperSituation]=(r.paperSituations[paperSituation]||0)+1;r.cases[caseName]=(r.cases[caseName]||0)+1;
  const F=r.facts;
  addSet(F,'T',f.T);addSet(F,'N',f.N);addSet(F,'winner',f.W);addSet(F,'margin',f.margin);
  if(f.kind==='season'){addSet(F,'score',`${f.a}-${f.b}`);if(f.W!=='draw'){addSet(F,'winnerItems',f.wItems.label);addSet(F,'loserItems',f.lItems.label);addSet(F,'winnerTrophies',f.wItems.trophies);addSet(F,'gapBefore',f.gapBefore);addSet(F,'gapAfter',f.gapAfter);}addSet(F,'streak',f.streak);addSet(F,'level',f.level);addSet(F,'gap',f.gap);addSet(F,'decider',f.decider);addSet(F,'leader',f.leader);}
  else{addSet(F,'totals',`${f.totals.playerOne}-${f.totals.playerTwo}`);addSet(F,'golden',f.golden);addSet(F,'gapBefore',f.gapBefore);addSet(F,'decidedEarly',f.decidedEarly);addSet(F,'wonOnFinalDay',f.wonOnFinalDay);addSet(F,'ledThroughout',f.ledThroughout);addSet(F,'trailedUntilLast',f.trailedUntilLast);addSet(F,'sp',f.sp);if(f.W!=='draw'){addSet(F,'winnerCL',f.rec[f.W].CL);addSet(F,'winnerEL',f.rec[f.W].EL);addSet(F,'winnerTitles',f.rec[f.W].T);addSet(F,'winnerWins',f.rec[f.W].wins);addSet(F,'loserWins',f.rec[f.L].wins);}addSet(F,'draws',f.draws);}
  const sig=f.kind==='season'?`S T${f.T} N${f.N} ${f.a}-${f.b} ${f.W==='draw'?'draw':NAMES[f.W]+' '+f.wItems.label+' v '+f.lItems.label} gapB=${f.gapBefore} gapA=${f.gapAfter} streak=${f.streak}${f.level?' level':''}${f.decider?' decider':''}`
    :`F T${f.T} ${f.totals.playerOne}-${f.totals.playerTwo} ${f.W==='draw'?'draw':NAMES[f.W]} gapB=${f.gapBefore}${f.golden?' golden':''}${f.decidedEarly?' early':''}${f.wonOnFinalDay?' lastday':''}${f.ledThroughout?' led':''}${f.trailedUntilLast?' trailed':''}${f.sp?' sp':''}`;
  if(Object.keys(r.inputs).length<CAP_INPUTS||r.inputs[sig])r.inputs[sig]=(r.inputs[sig]||0)+1;else r.inputsOverflow=(r.inputsOverflow||0)+1;
  if(r.texts.length<CAP_TEXTS&&!r.texts.includes(text))r.texts.push(text);
}
function recordPaper(report,edition,f,clubs,caseName,sp,both){
  report.papers+=1;report.editions[f.kind]+=1;report.cases[caseName]=(report.cases[caseName]||0)+1;report.situations[edition.kind+':'+edition.situation]=(report.situations[edition.kind+':'+edition.situation]||0)+1;
  const {rows}=printedRows(edition,f,clubs);
  const fail=(what,row)=>report.failures.push({case:caseName,rivalryId:edition.rivalryId,kind:f.kind,T:f.T,N:f.N,situation:edition.situation,row:row?row.id:null,what,text:row?row.text:null,facts:summary(f)});
  if(both!==null&&both!==G.paperText(edition))fail('both phones differ');
  for(const row of rows){
    if(row.id.endsWith('#?'))fail('printed row not found in the copy',row);
    for(const what of checkText(row.text,f,row,sp))fail(what,row);
    for(const hit of truthHits(row.text,f,row)){const key=row.id+' | '+hit.split(' (')[0];const t=report.truth[key]=report.truth[key]||{row:row.id,check:hit,count:0,examples:[]};t.count+=1;if(t.examples.length<3)t.examples.push({case:caseName,text:row.text,facts:summary(f)});}
    recordRow(report,row,f,edition.situation,caseName,row.text);
  }
  const whole=G.paperText(edition);
  for(const what of checkText(whole,f,{id:'paper'},sp,true))if(!rows.some(r=>checkText(r.text,f,r,sp).includes(what)))fail(what+' (outside the rows)');
}
function summary(f){
  return f.kind==='season'?`season ${f.N} of ${f.T}: ${f.a}-${f.b}${f.W==='draw'?' draw':` ${NAMES[f.W]} (${f.wItems.label}) beat ${NAMES[f.L]} (${f.lItems.label}) by ${f.margin}`}, totals ${f.totals.playerOne}-${f.totals.playerTwo}, gap before ${f.gapBefore}, streak ${f.streak}${f.level?', level':''}${f.decider?', decider':''}`
    :`final of ${f.T}: totals ${f.totals.playerOne}-${f.totals.playerTwo}${f.W==='draw'?' level':` ${NAMES[f.W]} by ${f.margin}`}, gap before last ${f.gapBefore}, wins ${f.rec.playerOne.wins}-${f.rec.playerTwo.wins}, draws ${f.draws}${f.golden?', golden':''}${f.decidedEarly?', decided early':''}${f.wonOnFinalDay?', won on the final day':''}${f.ledThroughout?', led throughout':''}${f.trailedUntilLast?', trailed until last':''}`;
}
function renderSeason(report,caseName,seed,T,seasons,N,sp,clubs,both){
  if(seasons.length!==N||N>=T)throw new Error(`sweep bug: ${caseName} has ${seasons.length} seasons for N=${N} of ${T}`);
  const p=buildProjection({seed,totalSeasons:T,seasons,clubs});
  let edition=null;
  try{edition=G.seasonEdition({projection:p,seasonNumber:N,specialPlayers:sp});}catch(error){report.failures.push({case:caseName,rivalryId:p.rivalryId,kind:'season',T,N,what:'throws: '+(error&&error.message)});return null;}
  if(!edition){report.failures.push({case:caseName,rivalryId:p.rivalryId,kind:'season',T,N,what:'null for a valid input'});return null;}
  const f=seasonFacts(seasons,N,T);f.clubs=clubs;
  const other=both?G.paperText(G.seasonEdition({projection:JSON.parse(JSON.stringify(p)),seasonNumber:N,specialPlayers:sp?JSON.parse(JSON.stringify(sp)):null})):null;
  recordPaper(report,edition,f,clubs,caseName,sp,other);
  return edition;
}
function renderFinal(report,caseName,seed,T,seasons,sp,clubs,both){
  if(seasons.length!==T)throw new Error(`sweep bug: ${caseName} has ${seasons.length} seasons for T=${T}`);
  const p=buildProjection({seed,totalSeasons:T,seasons,clubs});
  const a=p.managerRecords.playerOne.totalPoints,b=p.managerRecords.playerTwo.totalPoints;
  const final={winner:a>b?'daniel':b>a?'nik':'draw',totals:{daniel:a,nik:b},seasonsPlayed:T};
  let edition=null;
  try{edition=G.finalEdition({projection:p,final,specialPlayers:sp});}catch(error){report.failures.push({case:caseName,rivalryId:p.rivalryId,kind:'final',T,N:T,what:'throws: '+(error&&error.message)});return null;}
  if(!edition){report.failures.push({case:caseName,rivalryId:p.rivalryId,kind:'final',T,N:T,what:'null for a valid input'});return null;}
  const f=finalFacts(seasons,T,sp,clubs);
  const other=both?G.paperText(G.finalEdition({projection:JSON.parse(JSON.stringify(p)),final:JSON.parse(JSON.stringify(final)),specialPlayers:sp?JSON.parse(JSON.stringify(sp)):null})):null;
  recordPaper(report,edition,f,clubs,caseName,sp,other);
  return edition;
}

// The score-pair x trophy-mix grid. contexts: [kind, T, N]. `pairs` picks which mix pairs per score pair ('all' = every one;
// a number = that many, spread over the list by the seed); ids: how many Showdown ids per case.
const GRID_CONTEXTS=[['season',10,1],['season',10,2],['season',10,9],['final',1,1],['final',3,3],['final',5,5]];
function sweepGrid(report,{ids=50,pairs='all',both=true,contexts=GRID_CONTEXTS,log=()=>{}}={}){
  for(const [kind,T,N] of contexts){
    const caseName=`${kind} ${N} of ${T}`;let n=0;const t0=Date.now();
    for(let a=0;a<=11;a+=1)for(let b=0;b<=11;b+=1){
      let combos=[];for(const ma of byTotal[a])for(const mb of byTotal[b])combos.push([ma,mb]);
      if(pairs!=='all'){const step=Math.max(1,Math.floor(combos.length/pairs));combos=combos.filter((c,i)=>i%step===0).slice(0,pairs);}
      for(const [ma,mb] of combos)for(let id=0;id<ids;id+=1){
        const seed=(a*12+b)*1000+id,family=PREFIX_NAMES[(id+a+b)%PREFIX_NAMES.length];
        const prefix=PREFIX[family](N-1),seasons=[...prefix,[ma,mb]];
        const sp=id%4===3?null:SP;
        if(kind==='season')renderSeason(report,caseName,seed,T,seasons,N,sp,CLUBS,both&&id%5===0);
        else renderFinal(report,caseName,seed,T,seasons,sp,CLUBS,both&&id%5===0);
        n+=1;
      }
    }
    report.contexts[caseName]=n;log(`${caseName}: ${n} papers in ${((Date.now()-t0)/1000).toFixed(1)}s`);
  }
}
// The named FINAL cases for every length.
function finalCases(T){
  const rep=(a,b,n=T)=>Array.from({length:n},()=>[a,b]);
  const cases={
    'daniel-wins':[...rep(M.cup,M.none,T-1),[M.clTitle,M.cup]],
    'nik-wins':[...rep(M.none,M.cup,T-1),[M.cup,M.clTitle]],
    'level':T===1?[[M.cl,M.cl]]:[...rep(M.cl,M.none,Math.floor(T/2)),...rep(M.none,M.cl,Math.floor(T/2)),...(T%2?[[M.cup,M.cup]]:[])],
    'one-point':[...rep(M.cup,M.cup,T-1),[M.cupAward,M.cup]],
    'big-margin':rep(M.max,M.none),
    'nik-big-margin':rep(M.none,M.clTitleCup),
    'lead-held':[...rep(M.clTitle,M.cup,T-1),[M.cl,M.cup]],
    'nik-lead-held':[...rep(M.cup,M.clTitle,T-1),[M.cup,M.cl]],
    'zero-total':rep(M.none,M.none),
    'all-draws':rep(M.title,M.title),
    'bonus-only':[...rep(M.award,M.none,T-1),[M.cupAward,M.none]],
    'el-only-winner':[...rep(M.el,M.none,T-1),[M.elTitle,M.cup]]
  };
  if(T>=3){cases['comeback']=[...rep(M.none,M.cup,T-1),[M.max,M.none]];cases['nik-comeback']=[...rep(M.cup,M.none,T-1),[M.none,M.max]];const k=Math.floor((T-1)/2);cases['level-before-last']=[...rep(M.cl,M.none,k),...rep(M.none,M.cl,k),...(T-1-2*k?[[M.cup,M.cup]]:[]),[M.title,M.cup]];cases['decided-early']=[...rep(M.max,M.none,T-1),[M.none,M.max]];cases['draw-season-inside']=[...rep(M.cl,M.cup,T-2),[M.cup,M.cup],[M.none,M.cl]];}
  if(T===10){cases['golden']=rep(M.max,M.clTitle);cases['golden-draw']=rep(M.max,M.max);}
  return cases;
}
function sweepFinals(report,{ids=50,both=true,log=()=>{}}={}){
  const ALT_CLUBS={playerOne:'Coventry City',playerTwo:"Nott'm Forest"};
  for(const T of [1,3,5,10]){const cases=finalCases(T);let n=0;const t0=Date.now();
    for(const [name,seasons] of Object.entries(cases))for(let id=0;id<ids;id+=1){
      const sp=id%3===2?null:SP,clubs=id%2?ALT_CLUBS:CLUBS;
      renderFinal(report,`final ${T}: ${name}`,900000+T*10000+id*31+name.length,T,seasons,sp,clubs,both);n+=1;
      // the season papers of the same Showdowns (every season before the last), so comeback / lead / streak / level pages print too
      if(T>1)for(let N=1;N<T;N+=1){renderSeason(report,`season ${N} of ${T}: ${name}`,900000+T*10000+id*31+name.length,T,seasons.slice(0,N),N,sp,clubs,both&&N===T-1);n+=1;}
    }
    report.contexts[`finals ${T}`]=n;log(`finals ${T}: ${n} papers in ${((Date.now()-t0)/1000).toFixed(1)}s`);
  }
}
function finish(report){
  report.finished=new Date().toISOString();
  const rows=Object.values(report.rows);
  report.summary={papers:report.papers,editions:report.editions,rowsPrinted:rows.length,rowsByKind:rows.reduce((o,r)=>(o[r.kind]=(o[r.kind]||0)+1,o),{}),failures:report.failures.length,truthHits:Object.keys(report.truth).length,
    neverPrinted:{
      seasonHeadlines:Pages.season.filter(r=>!report.rows[r.id]).map(r=>r.id),finalHeadlines:Pages.final.filter(r=>!report.rows[r.id]).map(r=>r.id),stories:Copy.stories.filter(r=>!report.rows[r.id]).map(r=>r.id),
      quotes:Copy.small.quotes.map((q,i)=>`quote#${i}`).filter(id=>!report.rows[id]),captions:Copy.small.captions.map((q,i)=>`caption#${i}`).filter(id=>!report.rows[id]),ears:Copy.small.ears.map((q,i)=>`ear#${i}`).filter(id=>!report.rows[id]),
      briefs:Copy.small.briefs.map((b,i)=>`brief:${b.situation}:${i}`).filter(id=>!report.rows[id])}};
  return report;
}
function run({ids=50,pairs='all',both=true,log=()=>{},grid=true,finals=true}={}){
  const report=makeReport();
  if(grid)sweepGrid(report,{ids,pairs,both,log});
  if(finals)sweepFinals(report,{ids,both,log});
  return finish(report);
}
// The contract's subset: fixed, small, a few seconds. Every score pair with a handful of trophy-mix pairs, 3 ids, plus the named
// final cases with 4 ids.
function runFast(){
  const report=makeReport();
  sweepGrid(report,{ids:1,pairs:1,both:true});
  sweepFinals(report,{ids:1,both:true});
  return finish(report);
}

module.exports={run,runFast,MIXES,M,PREFIX,buildProjection,seasonFacts,finalFacts,printedRows,checkText,truthHits,TRUTH,CLUBS,SP,GRID_CONTEXTS,finalCases};

if(require.main===module){
  const fast=process.argv.includes('--fast');
  const ids=Number((process.argv.find(a=>a.startsWith('--ids='))||'').split('=')[1])||50;
  const outDir=path.join(ROOT,'project-documents/r87/gazette-truth');
  const t0=Date.now();
  const report=fast?runFast():run({ids,log:m=>console.log(m)});
  fs.mkdirSync(outDir,{recursive:true});
  const out=(process.argv.find(a=>a.startsWith('--out='))||'').split('=')[1];
  const file=path.join(outDir,out||(fast?'sweep-fast.json':'sweep-report.json'));
  fs.writeFileSync(file,JSON.stringify(report,null,1));
  console.log(`${fast?'fast ':''}sweep: ${report.papers} papers, ${report.summary.rowsPrinted} rows printed, ${report.failures.length} mechanical failures, ${report.summary.truthHits} truth hits, ${((Date.now()-t0)/1000).toFixed(1)}s -> ${path.relative(ROOT,file)}`);
  if(report.failures.length){console.log('first failures:');for(const f of report.failures.slice(0,20))console.log(' ',JSON.stringify(f));}
}
