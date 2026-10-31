'use strict';
// R88 Icon Unmasked (Nik 2026-10-31): the typed guess (js/iconNames.js) and the icon list loader
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
  ok('N4','typos, partial names and empty text use no chip');

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

  // L1 the sample list passes and keeps the ticket's choice rule
  assert.deepEqual(passing.summary,{players:10,legend:3,iconPrime:4,iconBase:3,cardsConsidered:16,lastPrimeGame:'FIFA 23'});
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
  assert.match(run.stdout,/PASS: 10 players \(3 Legend, 4 Icon Prime, 3 Icon Base\)/);
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
  fails('two cards in one game',{cards:CARDS_CSV+'pelao,FIFA 16,Legend,80,https://example.com/made-up/pelao-16b\n'},/already has a card from FIFA 16/);
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

  fs.rmSync(tmp,{recursive:true,force:true});
  console.log(`PASS r88 icon names and loader contracts (${checks} checks).`);
})().catch(error=>{console.error(error);process.exitCode=1;});
