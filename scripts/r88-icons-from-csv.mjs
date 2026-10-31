#!/usr/bin/env node
// R88 Icon Unmasked (Nik 2026-10-31): check GPT's two icon CSVs (job R88-ICON-01) and write data/icons.js.
//
//   node scripts/r88-icons-from-csv.mjs --icons icons.csv --cards icon_cards_considered.csv --last-prime-game "FIFA 23"
//        [--out data/icons.js] [--check] [--generated-on 2026-11-02] [--sample-seed 12345]
//
// --last-prime-game is the last game whose Icons came as Base, Mid and Prime, as GPT's report says (ticket §5.3).
// Up to it only Prime Icon cards are allowed; after it only Base Icon cards. Legend cards are only from before FIFA 18.
// --check runs every check and prints the report but writes nothing.
//
// The checks are the ticket's §6.1 schema check and §6.2 choice check:
//   icons.csv: every column and no other, unique lower-case ids, integers 1 to 99, a position that is not GK, the six
//   outfield stats (a HEA column is refused), a valid nation code, a card version that fits its game, an https source,
//   and no accepted name shared by two players (accents, case, spaces, dots and hyphens ignored, as js/iconNames.js).
//   icon_cards_considered.csv: the same rules per card, one card per player per game, and every icons.csv player's
//   card must be the highest-overall card listed for him, the newer game winning a tie.
// It writes nothing unless every check passes. It also prints the §6.3 value spot-check sample (at least 20 rows or
// 15%, picked at random, plus the 10 highest overalls) with each row's source page, for a second-source check by hand.
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath,pathToFileURL} from 'node:url';

const require=createRequire(import.meta.url);
const Names=require('../js/iconNames.js');
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');

export const STATS=Object.freeze(['PAC','SHO','PAS','DRI','DEF','PHY']);
export const ICON_COLUMNS=Object.freeze(['id','card_name','full_name','accepted_names','nation','nation_code','position','game','card_version','overall',...STATS,'source_url','source_name','notes']);
export const CARD_COLUMNS=Object.freeze(['id','game','card_version','overall','source_url']);
export const POSITIONS=Object.freeze(['ST','CF','CAM','CM','CDM','LM','RM','LW','RW','LB','RB','LWB','RWB','CB','LF','RF']);
export const CARD_VERSIONS=Object.freeze(['Legend','Icon Prime','Icon Base']);
const ID_RE=/^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const HOME_NATIONS=new Set(['GB-ENG','GB-SCT','GB-WLS','GB-NIR']);
const regionNames=new Intl.DisplayNames(['en'],{type:'region'});

// RFC 4180 CSV: quoted fields may hold commas, quotes ("") and line breaks. A UTF-8 BOM and CRLF are fine.
// Returns rows as arrays of strings, each with the 1-based line it starts on.
export function parseCsv(text){
  const src=String(text).replace(/^﻿/,'');
  const rows=[];let row=[],field='',quoted=false,line=1,rowLine=1,i=0,fieldStarted=false;
  const endField=()=>{row.push(field);field='';fieldStarted=false;};
  const endRow=()=>{endField();if(!(row.length===1&&row[0]===''))rows.push({line:rowLine,cells:row});row=[];};
  while(i<src.length){
    const ch=src[i];
    if(quoted){
      if(ch==='"'){if(src[i+1]==='"'){field+='"';i+=2;continue;}quoted=false;i++;continue;}
      if(ch==='\n')line++;
      field+=ch;i++;continue;
    }
    if(ch==='"'&&!fieldStarted&&field===''){quoted=true;fieldStarted=true;i++;continue;}
    if(ch===','){endField();i++;continue;}
    if(ch==='\r'&&src[i+1]==='\n'){i++;continue;}
    if(ch==='\n'||ch==='\r'){endRow();line++;rowLine=line;i++;continue;}
    field+=ch;fieldStarted=true;i++;
  }
  if(quoted)throw new Error(`unclosed quote in the row starting on line ${rowLine}`);
  if(field!==''||row.length)endRow();
  return rows;
}

// "FIFA 19" -> 19, "FC 25" -> 25 (also "EA SPORTS FC 25"); anything else -> null. FIFA ran to 23, FC starts at 24.
export function gameNumber(game){
  const text=String(game??'').trim();
  let m=/^FIFA (\d{2})$/.exec(text);
  if(m){const n=Number(m[1]);return n>=10&&n<=23?n:null;}
  m=/^(?:EA SPORTS |EA )?FC (\d{2})$/i.exec(text);
  if(m){const n=Number(m[1]);return n>=24?n:null;}
  return null;
}
export function gameLabel(n){return n<=23?`FIFA ${n}`:`FC ${n}`;}

export function validNationCode(code){
  if(HOME_NATIONS.has(code))return true;
  if(!/^[A-Z]{2}$/.test(code))return false;
  const name=regionNames.of(code);
  return typeof name==='string'&&name!==code&&name!=='Unknown Region';
}

function intIn(value,lo,hi){return /^\d{1,2}$/.test(value)&&Number(value)>=lo&&Number(value)<=hi?Number(value):null;}

// Does this card version fit this game? Returns null when it does, else the reason.
export function versionRuleProblem(version,n,lastPrime){
  if(version==='Legend')return n<=17?null:`a Legend card must be from before FIFA 18, not ${gameLabel(n)}`;
  if(n<18)return `${version} cards start in FIFA 18, not ${gameLabel(n)}`;
  if(version==='Icon Prime')return n<=lastPrime?null:`${gameLabel(n)} is after ${gameLabel(lastPrime)}, so only its Icon Base card is allowed`;
  if(version==='Icon Base')return n>lastPrime?null:`${gameLabel(n)} had Base, Mid and Prime, so only its Icon Prime card is allowed`;
  return `card_version must be one of ${CARD_VERSIONS.join(', ')}`;
}

function table(name,text,columns,errors){
  let rows;
  try{rows=parseCsv(text);}catch(error){errors.push(`${name}: ${error.message}`);return [];}
  if(!rows.length){errors.push(`${name}: the file is empty`);return [];}
  const header=rows[0].cells.map(h=>h.trim());
  if(header.includes('HEA'))errors.push(`${name}: has a HEA (heading) column; cards showing HEA are not allowed (ticket §2.4)`);
  const missing=columns.filter(c=>!header.includes(c)),extra=header.filter(c=>!columns.includes(c)&&c!=='HEA');
  const repeated=header.filter((c,i)=>header.indexOf(c)!==i);
  if(missing.length)errors.push(`${name}: missing column(s) ${missing.join(', ')}`);
  if(extra.length)errors.push(`${name}: unexpected column(s) ${extra.join(', ')}`);
  if(repeated.length)errors.push(`${name}: repeated column(s) ${[...new Set(repeated)].join(', ')}`);
  if(missing.length||repeated.length)return [];
  return rows.slice(1).map(({line,cells})=>{
    const where=`${name} line ${line}`;
    if(cells.length!==header.length)errors.push(`${where}: has ${cells.length} fields, the header has ${header.length}`);
    const record=Object.fromEntries(header.map((h,i)=>[h,(cells[i]??'').trim()]));
    return {line,where,record};
  });
}

// Check both CSVs. Returns {errors, warnings, players, summary}; players is empty unless errors is.
export function checkIcons({iconsCsv,cardsCsv,lastPrimeGame}){
  const errors=[],warnings=[];
  const lastPrime=gameNumber(lastPrimeGame);
  if(lastPrime===null||lastPrime<18){errors.push(`--last-prime-game must be FIFA 18 or later, like "FIFA 23" (got ${JSON.stringify(lastPrimeGame??null)})`);return {errors,warnings,players:[],summary:null};}
  const icons=table('icons.csv',iconsCsv,ICON_COLUMNS,errors);
  const cards=table('icon_cards_considered.csv',cardsCsv,CARD_COLUMNS,errors);

  const checkCard=(where,r,problems)=>{
    const n=gameNumber(r.game);
    if(n===null)problems.push(`${where}: game ${JSON.stringify(r.game)} is not like "FIFA 19" or "FC 25"`);
    if(!CARD_VERSIONS.includes(r.card_version))problems.push(`${where}: card_version ${JSON.stringify(r.card_version)} must be one of ${CARD_VERSIONS.join(', ')}`);
    else if(n!==null){const p=versionRuleProblem(r.card_version,n,lastPrime);if(p)problems.push(`${where}: ${p}`);}
    const overall=intIn(r.overall,1,99);
    if(overall===null)problems.push(`${where}: overall ${JSON.stringify(r.overall)} must be a whole number 1 to 99`);
    if(!/^https:\/\/[^\s/]+\.[^\s]+$/.test(r.source_url))problems.push(`${where}: source_url must be an https link`);
    return {n,overall};
  };

  const players=[],ids=new Map();
  for(const {where,record:r} of icons){
    const at=`${where} (${r.id||'no id'})`,problems=[];
    if(!ID_RE.test(r.id))problems.push(`${at}: id must be a lower-case ASCII slug like zinedine-zidane`);
    else if(ids.has(r.id))problems.push(`${at}: id repeats ${ids.get(r.id)}`);
    else ids.set(r.id,where);
    if(!r.card_name)problems.push(`${at}: card_name is empty`);
    if(!r.full_name)problems.push(`${at}: full_name is empty`);
    if(!r.nation)problems.push(`${at}: nation is empty`);
    if(!validNationCode(r.nation_code))problems.push(`${at}: nation_code ${JSON.stringify(r.nation_code)} is not an ISO 3166-1 alpha-2 code or GB-ENG/GB-SCT/GB-WLS/GB-NIR`);
    if(r.position==='GK')problems.push(`${at}: goalkeepers are not in the pool`);
    else if(!POSITIONS.includes(r.position))problems.push(`${at}: position ${JSON.stringify(r.position)} must be one of ${POSITIONS.join(' ')}`);
    const {n,overall}=checkCard(at,r,problems);
    const stats={};
    for(const s of STATS){const v=intIn(r[s],1,99);if(v===null)problems.push(`${at}: ${s} ${JSON.stringify(r[s])} must be a whole number 1 to 99`);stats[s]=v;}
    if(!r.source_name)problems.push(`${at}: source_name is empty`);
    const accepted=r.accepted_names.split('|').map(s=>s.trim()).filter(Boolean);
    if(!accepted.length)problems.push(`${at}: accepted_names is empty`);
    errors.push(...problems);
    const row={id:r.id,name:r.card_name,fullName:r.full_name,acceptedNames:accepted,nation:r.nation,nationCode:r.nation_code,position:r.position,
      game:n===null?r.game:gameLabel(n),cardVersion:r.card_version,overall,stats,_n:n,_where:at,_source:r.source_url};
    const surname=r.full_name.trim().split(/\s+/).at(-1)||'';
    if(Names.fold(surname)&&!Names.namesFor(row).some(name=>Names.fold(name)===Names.fold(surname)))warnings.push(`${at}: the surname "${surname}" is not among its accepted names`);
    players.push(row);
  }

  // No accepted name may belong to two players.
  const owner=new Map();
  for(const p of players){
    for(const name of Names.namesFor(p)){
      const key=Names.fold(name);
      if(owner.has(key)&&owner.get(key).id!==p.id)errors.push(`accepted name "${name}" belongs to both ${owner.get(key).id} and ${p.id}`);
      else owner.set(key,p);
    }
  }

  // icon_cards_considered.csv
  const considered=new Map(),seenCard=new Set();
  for(const {where,record:r} of cards){
    const at=`${where} (${r.id||'no id'})`,problems=[];
    if(!ID_RE.test(r.id))problems.push(`${at}: id must be a lower-case ASCII slug`);
    const {n,overall}=checkCard(at,r,problems);
    if(n!==null&&ID_RE.test(r.id)){
      const key=`${r.id}|${n}`;
      if(seenCard.has(key))problems.push(`${at}: ${r.id} already has a card from ${gameLabel(n)}; only one card per game is allowed`);
      seenCard.add(key);
    }
    errors.push(...problems);
    if(!problems.length){
      if(!considered.has(r.id))considered.set(r.id,[]);
      considered.get(r.id).push({n,version:r.card_version,overall,where:at});
    }
  }
  const unused=[...considered.keys()].filter(id=>!ids.has(id));
  if(unused.length)warnings.push(`icon_cards_considered.csv lists players who are not in icons.csv: ${unused.join(', ')}`);

  // The choice check: highest overall, newer game on a tie.
  for(const p of players){
    if(p._n===null||p.overall===null||!CARD_VERSIONS.includes(p.cardVersion))continue;
    const list=considered.get(p.id);
    if(!list){errors.push(`${p._where}: has no rows in icon_cards_considered.csv, so its card choice can't be checked`);continue;}
    const own=list.find(c=>c.n===p._n&&c.version===p.cardVersion);
    if(!own){errors.push(`${p._where}: its card (${p.game} ${p.cardVersion}) is not listed in icon_cards_considered.csv`);continue;}
    if(own.overall!==p.overall)errors.push(`${p._where}: overall ${p.overall} differs from ${own.overall} in icon_cards_considered.csv`);
    const best=[...list].sort((a,b)=>b.overall-a.overall||b.n-a.n)[0];
    if(best!==own)errors.push(`${p._where}: the card to use is ${gameLabel(best.n)} ${best.version} (overall ${best.overall}), not ${p.game} ${p.cardVersion} (overall ${p.overall})`);
  }

  const count=v=>players.filter(p=>p.cardVersion===v).length;
  const summary={players:players.length,legend:count('Legend'),iconPrime:count('Icon Prime'),iconBase:count('Icon Base'),cardsConsidered:cards.length,lastPrimeGame:gameLabel(lastPrime)};
  return {errors,warnings,players:errors.length?[]:players,summary};
}

// The row as it ships: no source link, no working fields. Sorted by id, because the draw shuffles by position.
export function shippedRows(players){
  return [...players].sort((a,b)=>a.id<b.id?-1:a.id>b.id?1:0).map(p=>({id:p.id,name:p.name,fullName:p.fullName,acceptedNames:[...Names.namesFor(p)],
    nation:p.nation,nationCode:p.nationCode,position:p.position,game:p.game,cardVersion:p.cardVersion,overall:p.overall,stats:{...p.stats}}));
}

export function renderIconsJs(players,{generatedOn,summary,listVersion=1}){
  const rows=shippedRows(players);
  return `(function(root,factory){
  const api=factory();
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeIcons=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";

  // R88 Icon Unmasked (Nik 2026-10-31): male outfield Legends and Icons, one card each (the allowed card with the
  // highest overall, the newer game winning a tie). Written by scripts/r88-icons-from-csv.mjs on ${generatedOn} from the
  // checked R88-ICON-01 CSVs: ${summary.players} players (${summary.legend} Legend, ${summary.iconPrime} Icon Prime, ${summary.iconBase} Icon Base),
  // Prime cards up to ${summary.lastPrimeGame}. Do not edit by hand: fix the CSVs and run the script again.
  // The order is part of the draw: never reorder rows or change who is in them once released; a new list is a new LIST_VERSION.
  const LIST_VERSION=${listVersion};
  const PLAYERS=Object.freeze([
${rows.map(r=>`    ${JSON.stringify(r)}`).join(',\n')}
  ].map(row=>Object.freeze({...row,acceptedNames:Object.freeze(row.acceptedNames),stats:Object.freeze(row.stats)})));
  return Object.freeze({listVersion:LIST_VERSION,players:PLAYERS});
});
`;
}

// Seeded so a spot-check sample can be repeated (mulberry32).
function rng(seed){let a=seed>>>0;return()=>{a=a+0x6D2B79F5>>>0;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
// The §6.3 sample: max(20, 15%) at random (all rows if fewer) plus the 10 highest overalls.
export function spotCheckSample(players,seed){
  const byId=[...players].sort((a,b)=>a.id<b.id?-1:1);
  const top=[...players].sort((a,b)=>b.overall-a.overall||(a.id<b.id?-1:1)).slice(0,10);
  const want=Math.min(byId.length,Math.max(20,Math.ceil(byId.length*0.15)));
  const random=rng(seed),pool=[...byId],picked=[];
  while(picked.length<want){picked.push(pool.splice(Math.floor(random()*pool.length),1)[0]);}
  const chosen=new Map([...top,...picked].map(p=>[p.id,p]));
  return {seed,top:top.map(p=>p.id),random:picked.map(p=>p.id),rows:[...chosen.values()].sort((a,b)=>a.id<b.id?-1:1)};
}

function parseArgs(argv){
  const opts={out:path.join(ROOT,'data/icons.js'),check:false};
  const flags={'--icons':'icons','--cards':'cards','--last-prime-game':'lastPrimeGame','--out':'out','--generated-on':'generatedOn','--sample-seed':'sampleSeed'};
  for(let i=0;i<argv.length;i++){
    const arg=argv[i];
    if(arg==='--check'){opts.check=true;continue;}
    if(!flags[arg]||argv[i+1]===undefined)throw new Error(`unknown or incomplete option ${arg}`);
    opts[flags[arg]]=argv[++i];
  }
  if(!opts.icons||!opts.cards||!opts.lastPrimeGame)throw new Error('--icons, --cards and --last-prime-game are required');
  return opts;
}

export function main(argv=process.argv.slice(2),log=console.log){
  let opts;
  try{opts=parseArgs(argv);}catch(error){log(`usage error: ${error.message}`);return 2;}
  const result=checkIcons({iconsCsv:fs.readFileSync(opts.icons,'utf8'),cardsCsv:fs.readFileSync(opts.cards,'utf8'),lastPrimeGame:opts.lastPrimeGame});
  for(const w of result.warnings)log(`warning: ${w}`);
  if(result.errors.length){
    for(const e of result.errors)log(`error: ${e}`);
    log(`FAIL: ${result.errors.length} problem(s); nothing written.`);
    return 1;
  }
  const s=result.summary;
  log(`PASS: ${s.players} players (${s.legend} Legend, ${s.iconPrime} Icon Prime, ${s.iconBase} Icon Base) from ${s.cardsConsidered} cards considered; Prime cards up to ${s.lastPrimeGame}.`);
  const seed=opts.sampleSeed!==undefined?Number(opts.sampleSeed)>>>0:Math.floor(Math.random()*2**31);
  const sample=spotCheckSample(result.players,seed);
  log(`Spot-check sample (seed ${seed}; ${sample.random.length} random + the 10 highest overalls, ${sample.rows.length} rows):`);
  for(const p of sample.rows)log(`  ${p.id} | ${p.name} | ${p.game} ${p.cardVersion} | ${p.position} ${p.overall} | ${STATS.map(k=>`${k} ${p.stats[k]}`).join(' ')} | ${p.nationCode} | ${p._source}`);
  if(opts.check){log('Check only: nothing written.');return 0;}
  const generatedOn=opts.generatedOn||new Date().toISOString().slice(0,10);
  fs.writeFileSync(opts.out,renderIconsJs(result.players,{generatedOn,summary:s}));
  log(`Wrote ${path.relative(process.cwd(),opts.out)||opts.out}.`);
  return 0;
}

if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href)process.exitCode=main();
