#!/usr/bin/env node
"use strict";
// r91 (2.4.0) Transfer War name autocomplete: the full FIFA 17 launch player list and its search.
// Plan: gameplay/r91/AUTOCOMPLETE_PLAN.md (Nik's answers in its section 10). Data: scripts/build-fifa17-database.py.
// Run: node tests/contracts/r91-player-search-contracts.cjs
// Optional: PLAYERS_17_CSV=<players_17.csv> also rebuilds the file and checks it is byte for byte the committed one.
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm"),zlib=require("node:zlib"),crypto=require("node:crypto"),cp=require("node:child_process");
const ROOT=path.resolve(__dirname,"../..");const read=p=>fs.readFileSync(path.join(ROOT,p),"utf8");
let n=0;const ok=(id,msg)=>{n+=1;console.log(`ok ${n} ${id} ${msg}`);};
const search=require(path.join(ROOT,"js/playerSearch.js"));
const manifest=JSON.parse(read("data/fifa17/players-170002.manifest.json"));
const body=fs.readFileSync(path.join(ROOT,manifest.file));const data=JSON.parse(body.toString("utf8"));
const db=search.load(data);
function windowScript(file){const c={window:{}};vm.createContext(c);vm.runInContext(read(file),c);return c.window;}
const options=windowScript("data/transferOptions.js");

// D1 the file: one roster, every player, its name is its content hash, the page asks for that name, within the size budget.
{
  assert.equal(search.PLAYERS_FILE,manifest.file,"js/playerSearch.js asks for the file the build wrote");
  assert.match(manifest.file,/^data\/fifa17\/players-170002\.[0-9a-f]{8}\.json$/);
  assert.equal(manifest.file.slice(-13,-5),crypto.createHash("sha256").update(body).digest("hex").slice(0,8),"the file name carries its own content hash, so a cached copy is never stale");
  assert.deepEqual(fs.readdirSync(path.join(ROOT,"data/fifa17")).sort(),[path.basename(manifest.file),"players-170002.manifest.json"].sort(),"one list file only (an old list is removed when the build writes a new one)");
  assert.equal(data.roster,170002);assert.equal(data.source.sha256,"f2d35920e5cddb28d750924281c4e4095fdc485a5d8358497cd579b1b7b5e03a");
  assert.equal(db.count,17597);assert.equal(new Set(data.cols.id).size,17597,"SoFIFA ids are unique");
  assert.ok(data.cols.id.every((id,i)=>Number.isInteger(id)&&id>0&&id<=300000&&(i===0||id>data.cols.id[i-1])),"ids ascending, 1..300000");
  assert.equal(data.cols.c.filter(c=>c===-1).length,224,"the 224 launch free agents are in the list (Nik 2026-11-10)");
  const gz=zlib.gzipSync(body,{level:9}).length;assert.ok(gz<=320*1024,`gzip ${gz} bytes is over the 320 KB budget`);
  ok("D1",`${db.count} players (224 free agents), ${data.clubs.length} clubs, ${body.length} bytes raw / ${gz} gzipped, hash-named ${path.basename(manifest.file)}`);
}
// D2 our 98 clubs: every player of data/fifa17Players.js is in the full list with the same name, overall and positions.
{
  const c={};vm.createContext(c);vm.runInContext(`${read("data/fifa17Players.js")};this.api=CareerModeFifa17Players;`,c);
  const full=new Map();for(let i=0;i<db.count;i+=1){const key=`${data.cols.n[i]}|${data.cols.o[i]}|${data.cols.pos[i]}`;full.set(key,(full.get(key)||0)+1);}
  let rows=0;const need=new Map();
  for(const club of Object.values(c.api.clubs))for(const p of club.players){rows+=1;const key=`${p[0]}|${p[1]}|${[...p[2]].join(",")}`;need.set(key,(need.get(key)||0)+1);}
  for(const [key,count] of need)assert.ok((full.get(key)||0)>=count,`${key} from data/fifa17Players.js is missing from the full list`);
  assert.equal(rows,2975);
  ok("D2","all 2,975 players of the 98 game clubs are in the full list with the same name, overall and FIFA positions");
}
// D3 mapping: every club's league is one of our 36 league ids; every nationality maps except the two the Rules deploy adds.
{
  const leagueIds=new Set(options.FIFA17_TRANSFER_LEAGUES.map(l=>l.id)),nationIds=new Set(options.FIFA17_TRANSFER_NATIONALITIES.map(o=>o.id));
  assert.ok(data.leagues.every(id=>leagueIds.has(id)),"a club league is not a data/transferOptions.js league id");
  assert.ok(data.clubs.every(([name,li])=>typeof name==="string"&&name&&Number.isInteger(li)&&data.leagues[li]),"every club has a league");
  for(const name of ["Shakhtar Donetsk","Olympiacos CFP","HJK Helsinki","Kaizer Chiefs","Vasco da Gama"]){const club=data.clubs.find(c=>c[0]===name);assert.ok(club,`${name} is in the list`);assert.equal(data.leagues[club[1]],"rest-of-world",`${name} sits under Rest of World, as in FIFA 17 (Nik 2026-11-11 00:20 UTC)`);}
  const unmapped=data.nations.filter((label,i)=>!data.nationIds[i]);
  for(const id of data.nationIds)if(id)assert.ok(nationIds.has(id),`${id} is not a nationality id`);
  data.nations.forEach((label,i)=>{if(data.nationIds[i])assert.equal(options.resolveFifa17TransferOption("nationality",label)?.id,data.nationIds[i]);});
  const pending=unmapped.filter(label=>!options.resolveFifa17TransferOption("nationality",label));
  assert.ok(pending.every(label=>["Kyrgyzstan","Sudan"].includes(label)),`unmapped nationalities: ${pending}`);
  ok("D3",`${data.clubs.length} clubs in ${data.leagues.length} of our leagues (Ukraine, Greece, Brazil Série B, South Africa and Finland under Rest of World); ${data.nations.length - unmapped.length}/${data.nations.length} nationalities mapped, ${pending.length ? pending.join(" and ") + " wait for the r91 Rules deploy" : "all mapped"}`);
}
// S1 search: folding, ranking, duplicates, limits, ids.
{
  const top=(q,k=1)=>db.suggest(q).slice(0,k).map(p=>`${p.name}|${p.club||"Free agent"}`);
  assert.deepEqual(top("cech"),["P. Čech|Arsenal"]);assert.deepEqual(top("ČECH"),top("cech"));
  assert.deepEqual(top("messi"),["L. Messi|FC Barcelona"],"a whole surname beats a name that only starts with the letters (M. Essien)");
  assert.deepEqual(top("lionel"),["L. Messi|FC Barcelona"],"long names of players rated 75+ are searchable");
  assert.deepEqual(top("payet"),["D. Payet|West Ham United"]);assert.deepEqual(top("reus"),["M. Reus|Borussia Dortmund"]);
  assert.deepEqual(db.suggest("Paulinho").map(p=>`${p.position} ${p.overall} ${p.club||"Free agent"}`),["CM 81 Free agent","LW 72 BK Häcken","RB 70 GD Chaves"],"same names are told apart by club, position and overall; the higher overall first");
  assert.equal(db.suggest("j").length,0,"no list under two letters");assert.equal(db.suggest("  ").length,0);
  assert.equal(db.suggest("ma").length,search.LIMIT);assert.equal(search.LIMIT,20);
  assert.deepEqual(db.suggest("rodri").map(p=>p.id),db.suggest("rodri").map(p=>p.id),"the order never changes");
  assert.equal(db.suggest("Totally Custom Name").length,0,"a custom name finds nothing and stays as typed");
  const kante=db.suggest("kante")[0];assert.equal(kante.name,"N. Kanté");
  const ronaldo=db.byId(20801);assert.equal(ronaldo.name,"Cristiano Ronaldo");assert.equal(ronaldo.overall,94);assert.equal(ronaldo.leagueId,"spain-primera-division");assert.equal(ronaldo.nationalityId,"portugal");assert.equal(ronaldo.position,"LW");
  const fa=db.suggest("rosicky")[0];assert.equal(fa.freeAgent,true);assert.equal(fa.leagueId,"");assert.equal(fa.club,"");
  assert.equal(db.byId(999999999),null);
  ok("S1","Čech/cech fold, whole surname first, long names for 75+, duplicates by club/position/overall, 2-letter minimum, 20 rows, stable order, byId");
}
// S2 the folding is Prime Pack's (js/iconNames.js), so the two screens never disagree on a name.
{
  const icon=require(path.join(ROOT,"js/iconNames.js"));
  for(const text of ["Petr Čech","Ødegaard","Łukasz Piszczek","N'Golo Kanté","Müller","Đorđević","Þór","O'Shea","J. Rodríguez"]){
    assert.equal(search.fold(text),icon.fold(text),text);assert.deepEqual(search.words(text),[...icon.words(text)],text);
  }
  ok("S2","fold and words match js/iconNames.js on accented, Nordic, Slavic and apostrophe names");
}
// W1 loading: never on Home, never precached, never in the idle offline pack; the first Transfer War keeps it.
{
  const sw=read("service-worker.js");const c={self:{addEventListener(){},registration:{scope:"https://cms.test/"}},URL,console,Response:function(){},caches:{},fetch(){},setTimeout,clearTimeout};
  vm.createContext(c);vm.runInContext(`${sw};globalThis.__w={shell:[...SHELL_PATHS],install:[...INSTALL_PATHS],pack:[...OFFLINE_PACK_PATHS],added:[...SHELL_PATHS_ADDED_SINCE_PREVIOUS],cached:isV10ImagePath};`,c);
  const w=c.__w;
  for(const list of ["shell","install","pack"])assert.ok(!w[list].some(p=>p.startsWith("data/fifa17/")),`the player list is not in ${list}`);
  assert.equal(w.cached(manifest.file),true,"the worker keeps the list cache-first once fetched (ON_DEMAND_DATA_PATH)");
  assert.equal(w.cached("data/fifa17/players-170002.json"),false,"only a hash-named list is cache-first");
  assert.ok(w.shell.includes("js/playerSearch.js")&&w.pack.includes("js/playerSearch.js")&&!w.install.includes("js/playerSearch.js")&&w.added.includes("js/playerSearch.js"),"the search code is a shell file in the offline pack, not the install");
  const html=read("index.html");assert.ok(!/fifa17\/players|playerSearch/.test(html),"Home's page names neither the list nor the search code");
  const pstc=read("js/productionSharedTransferChallenge.js"),sel=read("js/transferSelector.js");
  assert.match(pstc,/function pstcWarmPlayerList\(\)\{\s*if\(playerListAsked\|\|!pstcTransferScreenVisible\(\)/,"the page asks for the list only once the Transfer War screen shows");
  assert.ok(!/playerSearch/.test(read("js/optionalModules.js")),"the search code is not a startup load: js/transferSelector.js loads it on first use");
  assert.equal([...sel.matchAll(/search\.ensure\(\)/g)].length,1,"one fetch path: ensureTransferPlayerList (Transfer War shows, a name box becomes a search, a focus retries)");
  assert.equal([...pstc.matchAll(/ensureTransferPlayerList\(/g)].length,1,"the Transfer War page asks through ensureTransferPlayerList only");
  const step=read("js/squadSheetStep.js");
  assert.equal([...step.matchAll(/root\.ensureTransferPlayerList\(null\)/g)].length,1,"Squad Management asks through ensureTransferPlayerList only");
  assert.match(step,/if\(ctx\.stage==="pre"\)sqsWarmPlayerList\(\);answer=await sqsScreen/,"Squad Management warms the list on the screen before the roulette, so it is ready for the Transfer War");
  assert.match(read("js/playerSearch.js"),/requestIdleCallback/,"the fetch and the parse wait for idle");
  ok("W1","the list is never in the install, the idle pack or Home; the Transfer War screen asks at idle, a name-box focus retries, the worker keeps it");
}
// P1 the Transfer War page: the typed text is the truth, season-1-only prefill, LOCK unchanged, no Firestore key yet.
{
  const sel=read("js/transferSelector.js"),pstc=read("js/productionSharedTransferChallenge.js");
  assert.match(sel,/state\.activeIndex = options\.length && !isPlayer \? 0 : -1;/,"nothing is highlighted in the player list, so Enter keeps a custom name");
  assert.match(sel,/if\(state && state\.kind === "player"\)\{\s*\/\/[^\n]*\n\s*delete input\.dataset\.playerId;/,"an edit drops the picked id");
  const pick=/function pstcPlayerPick\(event\)\{([\s\S]*?)\n  \}/.exec(pstc)[1];
  assert.match(pick,/if\(season===1\)\{if\(ovr&&[^}]*ovr\.value=[^}]*;if\(league&&player\.leagueId\)pstcSetSelector\(league,"league",player\.leagueId\);\}/,"OVR and previous league are filled in season 1 only (Nik 2026-11-11 00:07 UTC)");
  assert.ok(!/season===1[^;]*pos\.value/.test(pick)&&/pos\.value=player\.position/.test(pick),"position (natural FIFA position) is filled in every season");
  const build=/function pstcBuildSignings\(role,blocked=null\)\{([\s\S]*?)\n  \}/.exec(pstc)[1];
  assert.match(build,/const playerId=String\(name\?\.dataset\?\.playerId\|\|""\);if\(\/\^\[1-9\]\[0-9\]\{0,5\}\$\/\.test\(playerId\)\)row\.playerId=Number\(playerId\);rows\.push\(row\);/,"a picked player's SoFIFA id goes on the locked signing row as playerId (r91 Rules deploy); a typed name has none");
  const populate=/function pstcPopulateSignings\(role,signings\)\{([\s\S]*?)\n/.exec(pstc)[1];
  assert.match(populate,/if\(Number\.isInteger\(row\?\.playerId\)&&row\.playerId>0\)name\.dataset\.playerId=String\(row\.playerId\);else delete name\.dataset\.playerId;/,"a locked row read back keeps its id on the box");
  assert.match(build,/const out=player&&blocked&&blocked\.get\(pstcNameKey\(player\)\)/,"LOCK still refuses guessed and shot players itself");
  assert.match(pstc,/pstcBlockedText\(role,name\)\{\s*const key=pstcNameKey\(name\)/,"the list marks players with the same name key LOCK uses");
  // Both readers accept the optional key (an exact-key reader that refused it would break the screen on the rival's phone),
  // and the Rules allow it as an int 1..999999.
  for(const file of ["js/sharedTransferChallenge.js","js/sparkSharedTransferChallenge.js"]){
    const text=read(file);assert.match(text,/hasPlayerId\?\["playerId"\]:\[\]/,`${file} accepts the optional playerId key`);
    assert.match(text,/hasPlayerId&&!\(Number\.isInteger\(item\.playerId\)&&item\.playerId>=1&&item\.playerId<=999999\)\)/,`${file} checks playerId is 1..999999`);
    assert.match(text,/if\(hasPlayerId\)row\.playerId=item\.playerId;/,`${file} keeps playerId on the row it returns`);
  }
  const rules=read("firestore.transfer-challenge-production.fragment.rules");
  assert.match(rules,/value\.keys\(\)\.hasOnly\(\['slot','name','leagueId','nationalityId','overall','position','playerId'\]\)/);
  assert.match(rules,/\(!\('playerId' in value\) \|\| \(value\.playerId is int && value\.playerId >= 1 && value\.playerId <= 999999\)\)/);
  ok("P1","Enter keeps typed text, an edit drops the id, OVR/league only in season 1, POS/nationality always, LOCK unchanged; a picked player's id is stored as playerId (1..999999), both readers and the Rules accept it");
}
// B1 optional rebuild proof.
if(process.env.PLAYERS_17_CSV){
  const tmp=fs.mkdtempSync(path.join(require("node:os").tmpdir(),"r91-db-"));
  for(const p of ["scripts/build-fifa17-database.py","data/transferOptions.js","js/playerSearch.js"]){fs.mkdirSync(path.join(tmp,path.dirname(p)),{recursive:true});fs.copyFileSync(path.join(ROOT,p),path.join(tmp,p));}
  cp.execFileSync("python3",[path.join(tmp,"scripts/build-fifa17-database.py"),process.env.PLAYERS_17_CSV],{cwd:tmp,stdio:"ignore"});
  assert.ok(fs.readFileSync(path.join(tmp,manifest.file)).equals(body),"the build script rebuilds the committed list byte for byte");
  ok("B1","scripts/build-fifa17-database.py rebuilds the committed list byte for byte from the pinned CSV");
}
console.log(`r91 player search contracts: ${n} passed`);
