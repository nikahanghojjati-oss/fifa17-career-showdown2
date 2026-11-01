'use strict';
// R88 Prime Pack (Nik 2026-10-31): the typed guess (js/iconNames.js) and the icon list loader
// (scripts/r88-icons-from-csv.mjs). Matching ignores accents, case, spaces, dots and hyphens; text that is not a listed
// name never uses a chip; the loader runs the R88-ICON-01 ticket's schema and card-choice checks before it writes
// data/icons.js. Every player here is made up (tests/fixtures/r88-icons/README.md); no real card number is used.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {spawnSync}=require('node:child_process');
const {pathToFileURL}=require('node:url');
const ROOT=path.resolve(__dirname,'../..');
const Names=require('../../js/iconNames.js');
const FIX=path.join(ROOT,'tests/fixtures/r88-icons');
const ICONS_CSV=fs.readFileSync(path.join(FIX,'sample-icons.csv'),'utf8');
const CARDS_CSV=fs.readFileSync(path.join(FIX,'sample-icon-cards-considered.csv'),'utf8');
const SCRIPT=path.join(ROOT,'scripts/r88-icons-from-csv.mjs');
// Plain full-table edit distance (Levenshtein; with swaps, neighbour swaps count 1), to check the matcher's quick one.
function refDistance(a,b,swaps){
  const d=Array.from({length:a.length+1},(_,i)=>[i,...Array(b.length).fill(0)]);
  for(let j=0;j<=b.length;j++)d[0][j]=j;
  for(let i=1;i<=a.length;i++)for(let j=1;j<=b.length;j++){
    d[i][j]=Math.min(d[i-1][j]+1,d[i][j-1]+1,d[i-1][j-1]+(a[i-1]===b[j-1]?0:1));
    if(swaps&&i>1&&j>1&&a[i-1]===b[j-2]&&a[i-2]===b[j-1])d[i][j]=Math.min(d[i][j],d[i-2][j-2]+1);
  }
  return d[a.length][b.length];
}
// Slip count up to 2 by search, independent of the matcher: a slip is a letter added, dropped or changed or two
// neighbours swapped. Every slip can be undone by one slip, so two texts are within 2 when a 1-slip neighbour of one is
// the other or is also a 1-slip neighbour of the other. Returns 0, 1, 2 or 3 (meaning more than 2).
function slipNeighbours(k){
  const out=new Set(),A='abcdefghijklmnopqrstuvwxyz0123456789';
  for(let i=0;i<k.length;i++){out.add(k.slice(0,i)+k.slice(i+1));for(const c of A)out.add(k.slice(0,i)+c+k.slice(i+1));}
  for(let i=0;i<=k.length;i++)for(const c of A)out.add(k.slice(0,i)+c+k.slice(i));
  for(let i=0;i+1<k.length;i++)out.add(k.slice(0,i)+k[i+1]+k[i]+k.slice(i+2));
  out.delete(k);return out;
}
function refSlips(a,b){
  if(a===b)return 0;
  const na=slipNeighbours(a);if(na.has(b))return 1;
  for(const m of slipNeighbours(b))if(na.has(m))return 2;
  return 3;
}
let checks=0;const ok=(id,label)=>{checks+=1;console.log(`ok ${checks} ${id} ${label}`);};

(async()=>{
  const Loader=await import(pathToFileURL(SCRIPT).href);
  const passing=Loader.checkIcons({iconsCsv:ICONS_CSV,cardsCsv:CARDS_CSV,lastPrimeGame:'FIFA 23'});
  assert.deepEqual(passing.errors,[]);
  const rows=Loader.shippedRows(passing.players);
  const index=Names.index(rows);

  // N1 folding
  assert.equal(Names.fold('Čech'),'cech');
  assert.equal(Names.fold('Petr Čech'),Names.fold('petr cech'));
  assert.equal(Names.fold('Ødegårdsen'),'odegardsen');
  assert.equal(Names.fold('Müller-Strauß'),'mullerstrauss');
  assert.equal(Names.fold("D'Arcy"),'darcy');
  assert.equal(Names.fold('Ł. Żółć-Æsir'),'lzolcaesir');
  assert.equal(Names.fold('İLKAY  ı'),'ilkayi');
  assert.equal(Names.fold('J.-L. D’Arcy'),'jldarcy');
  assert.equal(Names.fold(null),'');
  assert.deepEqual(Names.words('Jean-Luc D’Arcy'),['jean','luc','darcy']);
  ok('N1','accents, special letters, case, spaces, dots, hyphens and apostrophes fold away');

  // N2 accepted names: card name, full name, then the list, no repeats under folding
  assert.deepEqual([...Names.namesFor({name:'Vřeskový',fullName:'Tomáš Vřeskový',acceptedNames:['Vřeskový','Vreskovy','Tomas Vreskovy','Tomáš Vřeskový','Big Tom']})],
    ['Vřeskový','Tomáš Vřeskový','Big Tom']);
  assert.deepEqual([...index.byId.get('jean-luc-darcy').names],["D'Arcy","Jean-Luc D'Arcy",'Le Phare']);
  ok('N2','accepted names keep the card name, full name and nickname once each');

  // N3 a listed name matches, in any spelling the rule allows
  for(const [text,id] of [['Vřeskový','tomas-vreskovy'],['vreskovy','tomas-vreskovy'],['TOMAS VRESKOVY','tomas-vreskovy'],['tomas-vreskovy','tomas-vreskovy'],
    ['  Tomáš   Vřeskový ','tomas-vreskovy'],['odegardsen','bjorn-odegardsen'],['Bjorn Odegardsen','bjorn-odegardsen'],['darcy','jean-luc-darcy'],
    ['jean luc darcy','jean-luc-darcy'],['J.-L.','__none__'],['le phare','jean-luc-darcy'],['coric','zeljko-coric'],['Muller-Strauss','ansgar-muller-strauss'],
    ['mueller strauss','ansgar-muller-strauss'],['Lima','pelinho'],['pelao','pelao'],['Mac Leod','iain-mcleod'],['mcleod','iain-mcleod']]){
    const m=Names.match(index,text);
    if(id==='__none__'){assert.equal(m.status,'not-in-list',text);continue;}
    assert.equal(m.status,'match',text);assert.equal(m.id,id,text);assert.equal(m.usesChip,true,text);
  }
  ok('N3','card name, full name, surname, plain letters and nicknames all match');

  // N4 text that is not a listed name never uses a chip
  for(const text of ['Zidane','Vresk','Pel','Paulo','Tomas','x',' ','',null,'-.-']){
    const m=Names.match(index,text);
    assert.equal(m.usesChip,false,String(text));
    assert.ok(['not-in-list','empty'].includes(m.status),String(text));
  }
  assert.equal(Names.match(index,'').status,'empty');
  assert.equal(Names.match(index,'Zidane').status,'not-in-list');
  ok('N4','partial names, names not in the list and empty text use no chip');

  // N5 a name two icons share is ambiguous: no chip, both offered
  const twin=Names.index([{id:'a-silva',name:'Silva',fullName:'Anderson Silva',acceptedNames:[]},{id:'b-silva',name:'Silva',fullName:'Bruno Silva',acceptedNames:[]}]);
  const amb=Names.match(twin,'silva');
  assert.equal(amb.status,'ambiguous');assert.equal(amb.usesChip,false);assert.deepEqual([...amb.ids],['a-silva','b-silva']);
  assert.deepEqual(Names.suggest(twin,'silva').map(s=>s.id),['a-silva','b-silva']);
  assert.equal(Names.match(twin,'Bruno Silva').id,'b-silva');
  ok('N5','a shared name uses no chip and both icons are suggested');

  // N6 right or wrong
  assert.deepEqual({...Names.check(index,'Cecha','pelinho')},{status:'not-in-list',usesChip:false,correct:false});
  assert.equal(Names.check(index,'pelinho','pelinho').correct,true);
  assert.equal(Names.check(index,'Paulo Eduardo Lima','pelinho').correct,true);
  const wrong=Names.check(index,'pelao','pelinho');
  assert.equal(wrong.correct,false);assert.equal(wrong.usesChip,true);
  ok('N6','a right guess is correct; a wrong listed name uses a chip and is not');

  // N7 live suggestions
  assert.deepEqual(Names.suggest(index,'p'),[]);
  assert.deepEqual(Names.suggest(index,'ø'),[],'one folded letter is too short');
  assert.deepEqual(Names.suggest(index,'pel').map(s=>s.id),['pelao','pelinho']);
  assert.deepEqual(Names.suggest(index,'Pelinho').map(s=>s.id),['pelinho']);
  assert.deepEqual(Names.suggest(index,'luc').map(s=>s.id),['jean-luc-darcy']);
  assert.deepEqual(Names.suggest(index,'lo').map(s=>s.id),['pelao','pelinho'],'Lourenço starts with it, Paulo has it inside');
  assert.deepEqual(Names.suggest(index,'lou').map(s=>s.id),['pelao']);
  assert.deepEqual(Names.suggest(index,'oric').map(s=>s.id),['zeljko-coric'],'inside a name');
  assert.deepEqual(Names.suggest(index,'kofi mens').map(s=>s.id),['kofi-asante-mensah'],'word starts');
  assert.deepEqual(Names.suggest(index,'mensah')[0],{id:'kofi-asante-mensah',name:'Asante',fullName:'Kofi Asante Mensah'});
  assert.ok(Object.isFrozen(Names.suggest(index,'pel'))&&Object.isFrozen(Names.suggest(index,'pel')[0]));
  // exact name first, then names that start with it, then word starts, then inside a name
  const ranked=Names.index([{id:'w',name:'Zed Ana',acceptedNames:[]},{id:'x',name:'Banana',acceptedNames:[]},{id:'y',name:'Anaconda',acceptedNames:[]},{id:'z',name:'Ana',acceptedNames:[]}]);
  assert.deepEqual(Names.suggest(ranked,'ana').map(s=>s.id),['z','y','w','x']);
  assert.equal(Names.suggest(index,'e',{minChars:1,limit:3}).length,3);
  assert.equal(Names.suggest(index,'an',{limit:0}).length,0);
  // Both phones list the same order whatever order the rows come in.
  const reversed=Names.index([...rows].reverse());
  for(const q of ['pel','an','or','ma','le','ic','sergei'])assert.deepEqual(Names.suggest(reversed,q),Names.suggest(index,q),q);
  assert.equal(Names.minSuggestChars,2);
  ok('N7','suggestions start after 2 letters, rank exact, prefix, word start, inside, and keep one order');

  // N8 bad lists are refused
  assert.throws(()=>Names.index(null),/array/);
  assert.throws(()=>Names.index([{name:'x'}]),/without id/);
  assert.throws(()=>Names.index([{id:'a',name:'A'},{id:'a',name:'B'}]),/repeated icon id a/);
  assert.throws(()=>Names.index([{id:'a',name:' ',acceptedNames:['..']}]),/no name/);
  const shipped=fs.existsSync(path.join(ROOT,'data/icons.js'));
  assert.equal(Names.defaultIndex()===null,!shipped);
  ok('N8','lists without ids, with repeated ids or nameless rows are refused');

  // N9 the matcher is pure: no IO, no Firebase, no clock, no randomness
  const source=fs.readFileSync(path.join(ROOT,'js/iconNames.js'),'utf8');
  for(const banned of [/firebase/i,/firestore/i,/fetch\(/,/Date\.now/,/Math\.random/,/localStorage/,/document\./])assert.doesNotMatch(source,banned);
  ok('N9','js/iconNames.js has no IO, clock or randomness');

  // N10 typos (G Lead 2026-11-01, second rule): exact always wins; with no exact name, a text of 4+ letters counts as icon X
  // when it is within the allowance of one of X's names (Levenshtein: 0 for 3 or fewer letters, 1 for 4-5, 2 for 6+) and no
  // OTHER icon has any name within 2 edits (a swap of neighbours counting 1), nor a whole name word equal to the text.
  // Refused typos are not-in-list: no chip.
  {
    assert.deepEqual({...Names.typoRule},{minTypedLetters:4,oneEditFrom:4,twoEditsFrom:6,maxEdits:2,othersWithin:2},'one table of typo numbers');
    assert.deepEqual([1,2,3,4,5,6,7,12].map(Names.typoAllowance),[0,0,0,1,1,2,2,2]);
    assert.equal(Names.distance('posks','puskas'),2);assert.equal(Names.distance('pilro','pirlo'),2);assert.equal(Names.distance('pilro','pirlo',2,true),1);
    assert.equal(Names.distance('kitten','sitting'),3);assert.equal(Names.distance('kitten','sitting',1),2,'stops at max+1');
    // The banded distance agrees with a plain full-table reference (with and without swaps) on seeded random pairs.
    let seed=88;const rnd=n=>{seed=(seed*1103515245+12345)%2147483648;return seed%n;};
    for(let t=0;t<20000;t++){
      const word=()=>Array.from({length:rnd(10)},()=>'abcde'[rnd(5)]).join(''),x=word(),y=word(),swaps=t%2===0,max=[0,1,2,3,Infinity][t%5];
      const ref=refDistance(x,y,swaps);
      assert.equal(Names.distance(x,y,max,swaps),ref<=max?ref:max+1,`${x}/${y}/${max}/${swaps}`);
    }
    // Full Damerau-Levenshtein agrees with the neighbour search (up to 2 slips) on seeded random pairs.
    assert.equal(Names.damerau('toure','utre'),2);assert.equal(Names.distance('toure','utre',9,true),3);
    for(let t=0;t<3000;t++){
      const word=()=>Array.from({length:1+rnd(6)},()=>'abcd'[rnd(4)]).join(''),x=word(),y=word();
      assert.equal(Math.min(Names.damerau(x,y),3),refSlips(x,y),`${x}/${y}`);
    }
    // The made-up list: a typo of a listed name counts and uses a chip, like the name.
    assert.deepEqual({...Names.match(index,'Vreskovi')},{status:'match',id:'tomas-vreskovy',usesChip:true,typo:true,distance:1,name:'Vřeskový'});
    assert.equal(Names.match(index,'Tomas Vreskovy').typo,undefined,'an exact name is not a typo');
    assert.equal(Names.check(index,'Pelinhoo','pelinho').correct,true);
    const wrongTypo=Names.check(index,'Pelinhoo','pelao');
    assert.equal(wrongTypo.correct,false);assert.equal(wrongTypo.usesChip,true,'a clean typo of another icon is a wrong guess');
    assert.equal(Names.match(twin,'silvaa').status,'not-in-list','a typo as close to two icons is refused, never guessed');
    assert.equal(Names.match(twin,'bruno silvaa').id,'b-silva');
    // 3 letters or fewer: no typo; a 4-5 letter name takes one edit.
    const short=Names.index([{id:'edu',name:'Edu',fullName:'Eduardo Gaspar',acceptedNames:[]},{id:'kaka',name:'Kaká',fullName:'Ricardo Izecson',acceptedNames:[]}]);
    assert.equal(Names.match(short,'Edu').id,'edu');
    for(const t of ['edo','eud','ed','eduu','kak','kka'])assert.equal(Names.match(short,t).status,'not-in-list',t);
    assert.equal(Names.match(short,'kaca').id,'kaka','4 letters: one edit');
    assert.equal(Names.match(short,'kakka').id,'kaka');
    assert.equal(Names.match(short,'kaak').status,'not-in-list','a swap is 2 edits for Levenshtein; 4 letters allow 1');
  }
  ok('N10','typos: exact first; 1 edit for 4-5 letters, 2 for 6+, none for 3 or fewer; refused when another icon is within 2');

  // N11 the shipped list (after Nik's 27 fixes): the lead's named cases.
  const real=Names.defaultIndex();
  assert.ok(real&&real.size===232,'data/icons.js has 232 players');
  {
    const m=t=>Names.match(real,t);
    assert.deepEqual({...m('posks')},{status:'match',id:'ferenc-puskas',usesChip:true,typo:true,distance:2,name:'Puskás'},'posks -> Puskás');
    assert.equal(Names.check(real,'posks','ferenc-puskas').correct,true);
    assert.equal(m('pusks').id,'ferenc-puskas');assert.equal(m('Ferenc Poskas').id,'ferenc-puskas');assert.equal(m('Puskás').typo,undefined);
    // Ronaldo is Ronaldo Nazário and Ronaldinho is Ronaldinho; a slip between the two is refused, never crossed.
    assert.equal(m('Ronaldo').id,'ronaldo-nazario');assert.equal(m('Ronaldo').typo,undefined);
    assert.equal(m('Ronaldinho').id,'ronaldinho');assert.equal(m('Ronaldo de Assis Moreira').id,'ronaldinho');
    assert.equal(m('ronaldoo').id,'ronaldo-nazario');assert.equal(m('ronaldinhoo').id,'ronaldinho');
    for(const t of ['ronaldnho','ronaldiho','ronaldio'])assert.equal(m(t).status,'not-in-list',`${t}: Ronaldo and Ronaldinho are both within 2`);
    assert.equal(m('Ronald').status,'not-in-list','Ronald is Koeman\'s first name: not a typo of Ronaldo');
    assert.equal(m('Ronald Koeman').id,'ronald-koeman');
    // Short text and short names take no typo.
    assert.equal(m('R9').id,'ronaldo-nazario');assert.equal(m('R8').status,'not-in-list');assert.equal(m('pel').status,'not-in-list');
    // Another icon within 2 refuses: the two Laudrups; Pirlo/Piero, Vieri/Verri/Vieira; Rémy/Brehme.
    assert.equal(m('Laudrup').status,'ambiguous');assert.equal(m('laudrupp').status,'not-in-list');
    assert.equal(m('Brian Laudrop').id,'brian-laudrup');assert.equal(m('Michael Laudrop').id,'michael-laudrup');
    for(const t of ['pilro','piers','vieria','vieir','veiri','vreri','reme'])assert.equal(m(t).status,'not-in-list',t);
    // Exact wins over a typo: Pepe and Pelé are one letter apart.
    assert.equal(m('Pepe').id,'pepe');assert.equal(m('Pele').id,'pele');
    assert.equal(m('Zidan').id,'zinedine-zidane');
    // Nik's list fixes (2026-11-01): new full names, the old playing names still guessable, the added names exact.
    for(const [t,id] of [['Bobby Charlton','bobby-charlton'],['Robert Charlton','bobby-charlton'],['Bobby Moore','bobby-moore'],['Robbie Fowler','robbie-fowler'],
      ['Robert Bernard Fowler','robbie-fowler'],['Teddy Sheringham','teddy-sheringham'],['Kenny Dalglish','kenny-dalglish'],['Sol Campbell','sol-campbell'],
      ['Freddie Ljungberg','freddie-ljungberg'],['Alexi Lalas','alexi-lalas'],['Pauleta','pauleta'],['Pedro Miguel Carreiro Resendes','pauleta'],
      ['Marcos Evangelista de Moraes','cafu'],['Marcos Evangelista de Morais','cafu'],['Xavier Hernández Creus','xavi-hernandez'],['Xavi Hernández','xavi-hernandez'],
      ['Pato','alexandre-pato'],['Andrés Iniesta','andres-iniesta'],['Joan Capdevila','capdevila'],['Carles Puyol','carles-puyol'],['Eljero Elia','eljero-elia'],
      ['Emilio Butragueño','emilio-butragueno'],['Fernando Torres','fernando-torres'],['Hugo Sánchez','hugo-sanchez'],['Jay-Jay Okocha','jay-jay-okocha'],
      ['Luís Figo','luis-figo'],['Gomez','mario-gomez'],['Miguel Layún','miguel-layun'],['Park','park-ji-sung'],['Yaya','yaya-toure'],['Zlatan','zlatan-ibrahimovic']]){
      const r=m(t);assert.equal(r.status,'match',t);assert.equal(r.id,id,t);assert.equal(r.typo,undefined,t);
    }
    const fowler=globalThis.CareerModeIcons?globalThis.CareerModeIcons.players.find(p=>p.id==='robbie-fowler'):require('../../data/icons.js').players.find(p=>p.id==='robbie-fowler');
    assert.deepEqual({...fowler.stats},{PAC:83,SHO:83,PAS:73,DRI:81,DEF:48,PHY:76});
  }
  ok('N11','posks -> Puskás; Ronaldo and Ronaldinho never cross; Ronald, Laudrup, Pirlo/Piero and Rémy/Brehme slips are refused; Nik\'s 27 list fixes are in');

  // N12 every name of all 232: its exact text is that icon (or ambiguous); no 1- or 2-edit slip of it is ever accepted as
  // another icon. 1 edit: every deletion, neighbour swap, a-z change and a-z insertion of every name (full).
  // 2 edits: a seeded sample of up to 160 per name, 10 for each ordered pair of edit kinds (delete, insert, change, swap: 16
  // pairs). Why that is enough: rule 3 refuses any typo with another icon's name within 2 slips (any mix of the four kinds),
  // and two slips on X's name are within 2 of X; the check below re-proves that on every 10th accepted 2-edit typo with a
  // search of 1-slip neighbours, independent of the matcher.
  {
    const A='abcdefghijklmnopqrstuvwxyz';
    const kinds=[
      (k,r)=>k.length?k.slice(0,r(k.length))+k.slice(r.last+1):null,                       // delete
      (k,r)=>{const i=r(k.length+1);return k.slice(0,i)+A[r(26)]+k.slice(i);},               // insert
      (k,r)=>{if(!k.length)return null;const i=r(k.length);return k.slice(0,i)+A[r(26)]+k.slice(i+1);}, // change
      (k,r)=>{if(k.length<2)return null;const i=r(k.length-1);return k.slice(0,i)+k[i+1]+k[i]+k.slice(i+2);}, // swap
    ];
    const oneEdit=k=>{
      const out=new Set();
      for(let i=0;i<k.length;i++)out.add(k.slice(0,i)+k.slice(i+1));
      for(let i=0;i+1<k.length;i++)out.add(k.slice(0,i)+k[i+1]+k[i]+k.slice(i+2));
      for(let i=0;i<k.length;i++)for(const c of A)out.add(k.slice(0,i)+c+k.slice(i+1));
      for(let i=0;i<=k.length;i++)for(const c of A)out.add(k.slice(0,i)+c+k.slice(i));
      out.delete(k);return out;
    };
    let seed=232;const r=n=>{seed=(seed*1103515245+12345)%2147483648;r.last=seed%n;return r.last;};
    const tally={1:{tested:0,same:0,refused:0},2:{tested:0,same:0,refused:0}};const exactOther={1:[],2:[]},wrong=[],accepted2=[];
    const take=(edits,typo,e)=>{
      const t=tally[edits];t.tested+=1;
      const m=Names.match(real,typo);
      if(m.status!=='match'){t.refused+=1;return;}
      if(m.id===e.id){t.same+=1;if(edits===2&&m.typo)accepted2.push([typo,e.id]);return;}
      if(!m.typo){exactOther[edits].push(`${typo}:${e.id}->${m.id}`);assert.ok(real.byKey.get(typo).includes(m.id));return;} // spells another icon's own name
      wrong.push(`${typo} (${e.id}) -> ${m.id}`);
    };
    let names=0;const started=process.hrtime.bigint();
    for(const e of real.entries){
      for(const key of new Set(e.keys)){
        names+=1;
        const exact=Names.match(real,key);
        assert.ok(exact.status==='match'?exact.id===e.id&&!exact.typo:exact.status==='ambiguous'&&exact.ids.includes(e.id),`${key} is ${e.id}`);
        for(const typo of oneEdit(key))take(1,typo,e);
        for(let first=0;first<4;first++)for(let second=0;second<4;second++)for(let n=0;n<10;n++){
          const mid=kinds[first](key,r),typo=mid===null?null:kinds[second](mid,r);
          if(typo&&typo!==key&&typo!==mid)take(2,typo,e);
        }
      }
    }
    const perGuessMs=Number(process.hrtime.bigint()-started)/1e6/(tally[1].tested+tally[2].tested);
    assert.deepEqual(wrong,[],'no 1- or 2-edit slip is accepted as another icon');
    assert.deepEqual(exactOther[1],['pepe:pele->pepe','pele:pepe->pele'],'only Pepe/Pelé are one edit apart as exact names');
    assert.deepEqual(exactOther[2],['nesta:andres-iniesta->alessandro-nesta'],'in the seeded 2-edit sample only Iniesta -> Nesta spells another icon exactly');
    for(const t of [1,2])assert.equal(tally[t].same+tally[t].refused+exactOther[t].length,tally[t].tested);
    // The guarantee, re-proved without the matcher: no other icon has a name within 2 plain edits of an accepted typo.
    let proved=0;
    for(let i=0;i<accepted2.length;i+=10){
      const [typo,id]=accepted2[i];
      for(const other of real.entries)if(other.id!==id)for(const key of other.keys)if(Math.abs(key.length-typo.length)<=2)assert.ok(refDistance(typo,key,false)>4||refSlips(typo,key)>2,`${typo} (${id}) is within 2 slips of ${other.id}`);
      proved+=1;
    }
    assert.ok(perGuessMs<2,`a guess takes ${perGuessMs.toFixed(3)} ms`);
    ok('N12',`${names} names of ${real.size} icons. 1 edit (all ${tally[1].tested}): ${tally[1].same} right icon, ${tally[1].refused} refused, 0 another icon, ${exactOther[1].length} spell another icon exactly. `+
      `2 edits (seeded ${tally[2].tested}): ${tally[2].same} right icon, ${tally[2].refused} refused, 0 another icon, ${exactOther[2].length} spell another icon exactly; `+
      `${proved} accepted re-proved by a plain distance; ${perGuessMs.toFixed(3)} ms a guess`);
  }

  // L1 the sample list passes and keeps the ticket's choice rule
  assert.deepEqual(passing.summary,{players:10,legend:3,iconPrime:4,iconBase:3,hero:0,hallOfFut:0,cardsConsidered:16,lastPrimeGame:'FIFA 23'});
  assert.deepEqual(rows.map(r=>r.id),[...rows.map(r=>r.id)].sort());
  const bjorn=rows.find(r=>r.id==='bjorn-odegardsen');
  assert.equal(bjorn.game,'FIFA 19','a tie on overall goes to the newer game');
  assert.equal(rows.find(r=>r.id==='jean-luc-darcy').game,'FC 25','the higher overall wins over an older card');
  for(const r of rows){
    assert.deepEqual(Object.keys(r),['id','name','fullName','acceptedNames','nation','nationCode','position','game','cardVersion','overall','stats']);
    assert.deepEqual(Object.keys(r.stats),['PAC','SHO','PAS','DRI','DEF','PHY']);
    assert.notEqual(r.position,'GK');
  }
  ok('L1','the made-up list passes; one card each, highest overall, newer game on a tie');

  // L2 the written file loads as data/icons.js would and matches what was checked
  const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'r88-icons-'));
  const out=path.join(tmp,'icons.js');
  const args=['--icons',path.join(FIX,'sample-icons.csv'),'--cards',path.join(FIX,'sample-icon-cards-considered.csv'),'--last-prime-game','FIFA 23','--generated-on','2026-10-31','--sample-seed','7'];
  let run=spawnSync(process.execPath,[SCRIPT,...args,'--out',out],{encoding:'utf8'});
  assert.equal(run.status,0,run.stdout+run.stderr);
  assert.match(run.stdout,/PASS: 10 players \(3 Legend, 4 Icon Prime, 3 Icon Base, 0 Hero, 0 Hall of FUT\)/);
  const written=require(out);
  assert.equal(written.listVersion,1);
  assert.deepEqual(JSON.parse(JSON.stringify(written.players)),rows);
  assert.ok(Object.isFrozen(written.players)&&Object.isFrozen(written.players[0])&&Object.isFrozen(written.players[0].stats)&&Object.isFrozen(written.players[0].acceptedNames));
  assert.equal(fs.readFileSync(out,'utf8'),Loader.renderIconsJs(passing.players,{generatedOn:'2026-10-31',summary:passing.summary}),'the same CSVs write the same file');
  assert.doesNotMatch(fs.readFileSync(out,'utf8'),/example\.com/,'source links are not shipped');
  assert.equal(Names.match(Names.index(written.players),'Cech').status,'not-in-list');
  assert.equal(Names.match(Names.index(written.players),'Coric').id,'zeljko-coric');
  ok('L2','the script writes a frozen, repeatable list that js/iconNames.js reads');

  // L3 --check writes nothing; a failing list writes nothing; a usage error says so
  const checkOut=path.join(tmp,'check.js');
  run=spawnSync(process.execPath,[SCRIPT,...args,'--out',checkOut,'--check'],{encoding:'utf8'});
  assert.equal(run.status,0,run.stdout);assert.equal(fs.existsSync(checkOut),false);assert.match(run.stdout,/Check only: nothing written/);
  const badCsv=path.join(tmp,'bad.csv');
  fs.writeFileSync(badCsv,ICONS_CSV.replace('PT,RW,FIFA 16','PT,GK,FIFA 16'));
  run=spawnSync(process.execPath,[SCRIPT,'--icons',badCsv,'--cards',path.join(FIX,'sample-icon-cards-considered.csv'),'--last-prime-game','FIFA 23','--out',checkOut],{encoding:'utf8'});
  assert.equal(run.status,1);assert.match(run.stdout,/goalkeepers are not in the pool/);assert.match(run.stdout,/nothing written/);assert.equal(fs.existsSync(checkOut),false);
  run=spawnSync(process.execPath,[SCRIPT,'--icons',badCsv],{encoding:'utf8'});
  assert.equal(run.status,2);assert.match(run.stdout,/required/);
  ok('L3','check-only and failing runs write nothing');

  // L4 every rule in the ticket's schema and choice checks turns a bad list away
  const fails=(label,{icons=ICONS_CSV,cards=CARDS_CSV,last='FIFA 23'},pattern)=>{
    const r=Loader.checkIcons({iconsCsv:icons,cardsCsv:cards,lastPrimeGame:last});
    assert.ok(r.errors.length>0,`${label}: expected an error`);
    assert.ok(r.errors.some(e=>pattern.test(e)),`${label}: ${r.errors.join(' / ')}`);
    assert.deepEqual(r.players,[],`${label}: no players on failure`);
  };
  const header=ICONS_CSV.split('\n')[0];
  fails('goalkeeper',{icons:ICONS_CSV.replace('PT,RW,FIFA 16','PT,GK,FIFA 16')},/pelao.*goalkeepers/);
  fails('unknown position',{icons:ICONS_CSV.replace('PT,RW,FIFA 16','PT,SW,FIFA 16')},/position "SW"/);
  fails('HEA column',{icons:ICONS_CSV.replace(',PHY,',',HEA,')},/HEA \(heading\)/);
  fails('missing column',{icons:ICONS_CSV.replace(',source_name,',',')},/missing column\(s\) source_name/);
  fails('extra column',{icons:ICONS_CSV.replace(',notes\n',',notes,club\n')},/unexpected column\(s\) club/);
  fails('repeated id',{icons:ICONS_CSV.replace('pelao,Pelão','pelinho,Pelão')},/id repeats/);
  fails('bad id',{icons:ICONS_CSV.replace('pelao,Pelão','Pelão,Pelão')},/lower-case ASCII slug/);
  fails('overall 100',{icons:ICONS_CSV.replace('Legend,87,91','Legend,100,91')},/overall "100"/);
  fails('stat not a number',{icons:ICONS_CSV.replace('Legend,87,91','Legend,87,fast')},/PAC "fast"/);
  fails('stat zero',{icons:ICONS_CSV.replace('Legend,87,91','Legend,87,0')},/PAC "0"/);
  fails('empty stat',{icons:ICONS_CSV.replace('Legend,87,91','Legend,87,')},/fields|PAC ""/);
  fails('nation code',{icons:ICONS_CSV.replace('Portugal,PT','Portugal,XX')},/nation_code "XX"/);
  fails('nation code lower case',{icons:ICONS_CSV.replace('Portugal,PT','Portugal,pt')},/nation_code "pt"/);
  fails('unknown home nation',{icons:ICONS_CSV.replace('GB-SCT','GB-XYZ')},/nation_code "GB-XYZ"/);
  fails('bad game',{icons:ICONS_CSV.replace('PT,RW,FIFA 16','PT,RW,FIFA 2016')},/game "FIFA 2016"/);
  fails('FIFA after 23',{icons:ICONS_CSV.replace('PT,RW,FIFA 16','PT,RW,FIFA 24')},/game "FIFA 24"/);
  fails('Legend after FIFA 17',{icons:ICONS_CSV.replace('PT,RW,FIFA 16,Legend','PT,RW,FIFA 19,Legend'),cards:CARDS_CSV.replace('pelao,FIFA 16','pelao,FIFA 19')},/Legend card must be from before FIFA 18/);
  fails('Icon before FIFA 18',{icons:ICONS_CSV.replace('PT,RW,FIFA 16,Legend','PT,RW,FIFA 16,Icon Prime'),cards:CARDS_CSV.replace('pelao,FIFA 16,Legend','pelao,FIFA 16,Icon Prime')},/start in FIFA 18/);
  fails('Base in a Prime year',{icons:ICONS_CSV.replace('FIFA 21,Icon Prime','FIFA 21,Icon Base'),cards:CARDS_CSV.replace('FIFA 21,Icon Prime','FIFA 21,Icon Base')},/only its Icon Prime card/);
  fails('Prime after the last Prime year',{icons:ICONS_CSV.replace('FC 24,Icon Base','FC 24,Icon Prime'),cards:CARDS_CSV.replace('FC 24,Icon Base','FC 24,Icon Prime')},/only its Icon Base card/);
  fails('special version',{icons:ICONS_CSV.replace('FC 26,Icon Base','FC 26,Icon Moments')},/must be one of Legend, Icon Prime, Icon Base/);
  fails('special card considered',{cards:CARDS_CSV.replace('FC 26,Icon Base,87','FC 26,Prime Icon Moments,95')},/must be one of/);
  fails('shared accepted name',{icons:ICONS_CSV.replace('Pelão|Pedro Lourenço|Pelao','Pelão|Pedro Lourenço|Lima')},/"Lima" belongs to both pelinho and pelao/);
  fails('shared name by spelling only',{icons:ICONS_CSV.replace('Volkov|Sergei Volkov','Volkov|Sergei Volkov|CORIC')},/"CORIC" belongs to both zeljko-coric and sergei-volkov/);
  fails('no https source',{icons:ICONS_CSV.replace('https://example.com/made-up/pelao-16','http://example.com/made-up/pelao-16')},/https link/);
  fails('empty card name',{icons:ICONS_CSV.replace('pelao,Pelão,','pelao,,')},/card_name is empty/);
  fails('empty accepted names',{icons:ICONS_CSV.replace('Volkov|Sergei Volkov',' | ')},/accepted_names is empty/);
  fails('tie kept the older game',{icons:ICONS_CSV.replace('FIFA 19,Icon Prime,92','FIFA 18,Icon Prime,92')},/card to use is FIFA 19 Icon Prime \(overall 92\)/);
  fails('lower overall kept',{icons:ICONS_CSV.replace('FC 25,Icon Base,90','FIFA 22,Icon Prime,89')},/card to use is FC 25 Icon Base \(overall 90\), not FIFA 22 Icon Prime \(overall 89\)/);
  fails('card missing from considered',{cards:CARDS_CSV.replace(/^pelao,.*\n/m,'pelao,FIFA 15,Legend,86,https://example.com/made-up/pelao-15\n')},/pelao.*is not listed in icon_cards_considered/);
  fails('player missing from considered',{cards:CARDS_CSV.replace(/^pelao,.*\n/m,'')},/pelao.*has no rows in icon_cards_considered/);
  fails('overall differs',{cards:CARDS_CSV.replace('pelao,FIFA 16,Legend,87','pelao,FIFA 16,Legend,85')},/overall 87 differs from 85/);
  fails('two cards in one game',{cards:CARDS_CSV+'pelao,FIFA 16,Legend,80,https://example.com/made-up/pelao-16b\n'},/already has a Legend card from FIFA 16; only one per game/);
  fails('legend and icon in one game',{cards:CARDS_CSV+'pelao,FIFA 16,Icon Base,80,https://example.com/made-up/pelao-16b\n'},/already has a Legend or Icon card from FIFA 16|Icon Base cards start in FIFA 18/);
  fails('considered header',{cards:CARDS_CSV.replace('card_version','version')},/missing column\(s\) card_version/);
  fails('ragged row',{icons:ICONS_CSV.replace(',card shows the Soviet Union',',card shows,the Soviet Union')},/has 20 fields, the header has 19/);
  fails('unclosed quote',{icons:ICONS_CSV+'"open'},/unclosed quote in the row starting on line 12/);
  fails('empty file',{icons:''},/icons\.csv: the file is empty/);
  fails('last prime game missing',{last:null},/--last-prime-game/);
  fails('last prime game too early',{last:'FIFA 17'},/--last-prime-game must be FIFA 18 or later/);
  assert.equal(header.split(',').length,Loader.ICON_COLUMNS.length);
  ok('L4','every schema and card-choice rule turns a bad list away');

  // L5 warnings that don't block: an unused considered row, a surname not among the accepted names
  const warned=Loader.checkIcons({iconsCsv:ICONS_CSV.replace('Asante|Kofi Asante Mensah|Mensah','Asante|Kofi Asante Mensah'),cardsCsv:CARDS_CSV+'left-out-player,FIFA 19,Icon Prime,90,https://example.com/made-up/left-out-19\n',lastPrimeGame:'FIFA 23'});
  assert.deepEqual(warned.errors,[]);
  assert.ok(warned.warnings.some(w=>/not in icons\.csv: left-out-player/.test(w)));
  assert.ok(warned.warnings.some(w=>/kofi-asante-mensah.*surname "Mensah"/.test(w)));
  assert.deepEqual(passing.warnings,[]);
  ok('L5','a left-out player and a missing surname are reported but do not block');

  // L6 CSV reading: BOM, CRLF, quoted commas, doubled quotes and line breaks
  assert.deepEqual(Loader.parseCsv('﻿a,b\r\n"x, y","say ""hi"""\r\n"two\nlines",z\r\n\r\n').map(r=>[r.line,r.cells]),
    [[1,['a','b']],[2,['x, y','say "hi"']],[3,['two\nlines','z']]]);
  const crlf=Loader.checkIcons({iconsCsv:'﻿'+ICONS_CSV.replace(/\n/g,'\r\n'),cardsCsv:CARDS_CSV.replace(/\n/g,'\r\n'),lastPrimeGame:'FIFA 23'});
  assert.deepEqual(crlf.errors,[]);assert.deepEqual(Loader.shippedRows(crlf.players),rows);
  assert.equal(rows.find(r=>r.id==='bjorn-odegardsen').game,'FIFA 19');
  assert.deepEqual([Loader.gameNumber('FIFA 18'),Loader.gameNumber('FC 25'),Loader.gameNumber('EA SPORTS FC 26'),Loader.gameNumber('FIFA 24'),Loader.gameNumber('FC 23'),Loader.gameNumber('Fifa 19')],[18,25,26,null,null,null]);
  assert.deepEqual(['FR','GB-ENG','GB-NIR','SU','YU','CS','XK','XX','ZZ','GB','EN','fr'].map(Loader.validNationCode),[true,true,true,true,true,true,true,false,false,true,false,false]);
  ok('L6','CSV quoting, BOM and CRLF read correctly; game names and nation codes parse');

  // L7 the §6.3 spot-check sample: max(20, 15%) at random plus the 10 highest overalls, repeatable by seed
  const many=Array.from({length:180},(_,i)=>({id:`made-up-${String(i).padStart(3,'0')}`,overall:60+(i*37)%40}));
  const a=Loader.spotCheckSample(many,42),b=Loader.spotCheckSample(many,42),c=Loader.spotCheckSample(many,43);
  assert.deepEqual(a,b);assert.notDeepEqual(a.random,c.random);
  assert.equal(a.random.length,27);assert.equal(new Set(a.random).size,27);
  assert.equal(a.top.length,10);
  assert.deepEqual(a.top,[...many].sort((x,y)=>y.overall-x.overall||(x.id<y.id?-1:1)).slice(0,10).map(p=>p.id));
  for(const id of [...a.top,...a.random])assert.ok(a.rows.some(p=>p.id===id));
  assert.equal(Loader.spotCheckSample(many.slice(0,50),1).random.length,20);
  assert.equal(Loader.spotCheckSample(many.slice(0,8),1).rows.length,8);
  assert.match(spawnSync(process.execPath,[SCRIPT,...args,'--check'],{encoding:'utf8'}).stdout,/Spot-check sample \(seed 7; 10 random \+ the 10 highest overalls, 10 rows\)/);
  ok('L7','the spot-check sample is the ticket size, includes the top 10 and repeats by seed');

  // L8 FUT Heroes and Hall of FUT (Nik 2026-11-01, ticket R88-ICON-02): accepted card versions; the Icon card always wins.
  {
    const heroRow="mo-hero,Hero,Mo Hero,Hero|Mo Hero,Ghana,GH,CM,FC 25,Hero,88,80,81,85,84,79,86,https://example.com/made-up/mo-hero-25,Made-up source,\n";
    const heroCards="mo-hero,FIFA 22,Hero,86,https://example.com/made-up/mo-hero-22\nmo-hero,FC 25,Hero,88,https://example.com/made-up/mo-hero-25\n";
    const withHero=Loader.checkIcons({iconsCsv:ICONS_CSV+heroRow,cardsCsv:CARDS_CSV+heroCards,lastPrimeGame:'FIFA 23'});
    assert.deepEqual(withHero.errors,[],withHero.errors.join(' / '));
    assert.equal(withHero.summary.hero,1);assert.equal(withHero.players.find(p=>p.id==='mo-hero').cardVersion,'Hero');
    fails('older hero card picked',{icons:ICONS_CSV+heroRow.replace('FC 25,Hero,88','FIFA 22,Hero,86'),cards:CARDS_CSV+heroCards},/the card to use is FC 25 Hero \(overall 88\)/);
    fails('hero before FIFA 21',{icons:ICONS_CSV+heroRow,cards:CARDS_CSV+heroCards+"mo-hero,FIFA 20,Hero,85,https://example.com/made-up/mo-hero-20\n"},/Hero cards start in FIFA 21/);
    // An Icon player with a higher Hero card keeps his Icon card...
    const darcyHero="jean-luc-darcy,FC 26,Hero,93,https://example.com/made-up/jean-luc-darcy-hero\n";
    const keeps=Loader.checkIcons({iconsCsv:ICONS_CSV,cardsCsv:CARDS_CSV+darcyHero,lastPrimeGame:'FIFA 23'});
    assert.deepEqual(keeps.errors,[],keeps.errors.join(' / '));assert.equal(keeps.players.find(p=>p.id==='jean-luc-darcy').cardVersion,'Icon Base');
    // ...and picking that Hero card instead is refused.
    const darcyHeroRow=ICONS_CSV.split('\n').find(l=>l.startsWith('jean-luc-darcy,')).replace('FC 25,Icon Base,90','FC 26,Hero,93');
    fails('hero over icon',{icons:ICONS_CSV.split('\n').map(l=>l.startsWith('jean-luc-darcy,')?darcyHeroRow:l).join('\n'),cards:CARDS_CSV+darcyHero},/the Icon card always wins/);
    // Hall of FUT is a card version of its own, and delta files join the main ones on the command line.
    const hofRow=heroRow.replaceAll('mo-hero','ana-hall').replace('Hero|Mo Hero','Hall|Ana Hall').replace(',Hero,Mo Hero,',',Hall,Ana Hall,').replace('FC 25,Hero,88','FC 24,Hall of FUT,87');
    const hof=Loader.checkIcons({iconsCsv:ICONS_CSV+hofRow,cardsCsv:CARDS_CSV+"ana-hall,FC 24,Hall of FUT,87,https://example.com/made-up/ana-hall-24\n",lastPrimeGame:'FIFA 23'});
    assert.deepEqual(hof.errors,[],hof.errors.join(' / '));assert.equal(hof.summary.hallOfFut,1);
    // Nik 2026-11-01: Hall of FUT has one version per player, and only the base Hero card of each edition counts.
    fails('two hall of fut cards',{icons:ICONS_CSV+hofRow,cards:CARDS_CSV+"ana-hall,FC 24,Hall of FUT,87,https://example.com/made-up/ana-hall-24\nana-hall,FC 25,Hall of FUT,86,https://example.com/made-up/ana-hall-25\n"},/Hall of FUT has only one version per player/);
    fails('two hero cards in one game',{icons:ICONS_CSV+heroRow,cards:CARDS_CSV+heroCards+"mo-hero,FC 25,Hero,90,https://example.com/made-up/mo-hero-25-promo\n"},/already has a Hero card from FC 25; only one per game is allowed \(the base Hero card/);
    fails('hero after FC 27',{icons:ICONS_CSV+heroRow,cards:CARDS_CSV+heroCards+"mo-hero,FC 28,Hero,85,https://example.com/made-up/mo-hero-28\n"},/Hero cards run to FC 27/);
    const both=Loader.checkIcons({iconsCsv:ICONS_CSV,cardsCsv:CARDS_CSV+"jean-luc-darcy,FC 25,Hero,95,https://example.com/made-up/jean-luc-darcy-hero-25\n",lastPrimeGame:'FIFA 23'});
    assert.deepEqual(both.errors,[],'an Icon card and a base Hero card from the same game are both allowed: '+both.errors.join(' / '));
    const deltaIcons=path.join(tmp,'delta-icons.csv'),deltaCards=path.join(tmp,'delta-cards.csv'),deltaOut=path.join(tmp,'delta-icons.js');
    fs.writeFileSync(deltaIcons,header+'\n'+heroRow);fs.writeFileSync(deltaCards,CARDS_CSV.split('\n')[0]+'\n'+heroCards);
    const run=spawnSync(process.execPath,[SCRIPT,'--icons',`${path.join(FIX,'sample-icons.csv')},${deltaIcons}`,'--cards',`${path.join(FIX,'sample-icon-cards-considered.csv')},${deltaCards}`,'--last-prime-game','FIFA 23','--out',deltaOut,'--generated-on','2026-11-01'],{encoding:'utf8'});
    assert.equal(run.status,0,run.stdout+run.stderr);assert.match(run.stdout,/PASS: 11 players \(3 Legend, 4 Icon Prime, 3 Icon Base, 1 Hero, 0 Hall of FUT\)/);
    delete require.cache[deltaOut];assert.equal(require(deltaOut).players.length,11);
  }
  ok('L8','Hero and Hall of FUT cards are accepted; the Icon card always beats a Hero card; one Hall of FUT card per player, one base Hero card per game, Heroes FIFA 21 to FC 27; delta files join on the command line');

  fs.rmSync(tmp,{recursive:true,force:true});
  console.log(`PASS r88 icon names and loader contracts (${checks} checks).`);
})().catch(error=>{console.error(error);process.exitCode=1;});
