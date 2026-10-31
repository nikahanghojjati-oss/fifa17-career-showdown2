"use strict";
// W3-7 proof-words (r87): checks the visible text captured by tools/proof-words/text-capture.cjs (and, with --copy, the
// Gazette, front-page and commentary copy in data/) against the house wording rules. Report only: exits 1 when a rule fails.
// Use: node tools/proof-words/check-words.cjs [--copy] [test-results/proof-words/*.json]
const fs=require("node:fs");
const path=require("node:path");
const ROOT=path.resolve(__dirname,"../..");
const args=process.argv.slice(2);
const withCopy=args.includes("--copy");
let files=args.filter(a=>!a.startsWith("--"));
if(!files.length){const dir=path.join(ROOT,"test-results/proof-words");files=fs.existsSync(dir)?fs.readdirSync(dir).filter(f=>f.endsWith(".json")).map(f=>path.join(dir,f)):[];}

const rows=[];
for(const f of files){for(const r of JSON.parse(fs.readFileSync(f,"utf8")))rows.push({src:"screen",where:`${(r.screens||[])[0]||""} @${(r.viewports||[]).join(",")}`,t:r.t.replace(/^\[aria-hidden\] /,"")});}
if(withCopy){
  const load=p=>require(path.join(ROOT,p));
  const walk=(o,where)=>{if(typeof o==="string"){if(/[a-z] [a-z]/i.test(o))rows.push({src:"copy",where,t:o});}
    else if(Array.isArray(o))o.forEach((x,i)=>walk(x,`${where}[${i}]`));
    else if(o&&typeof o==="object")for(const k of Object.keys(o))if(!["id","situation","edition","mood","who","photo"].includes(k))walk(o[k],`${where}.${k}`);};
  // duets are not read by js/touchlineGazette.js, so they are left out
  const g=load("data/gazetteCopy.js");walk({stories:g.stories,small:g.small},"gazetteCopy");
  for(const [p,n] of [["data/frontPages.js","frontPages"],["data/commentaryLines.js","commentaryLines"],["data/deadlineDayLines.js","deadlineDayLines"]])walk(load(p),n);
}

const RULES=[
  {id:"special-player-name",why:"\"Special Player\"/\"SP\" only, never Marquee/MP (Nik 2026-10-29)",re:/\bmarquee\b|\bMP\b/i},
  {id:"no-tiebreak",why:"no tiebreak anywhere: equal = DRAW/level",re:/tie-?break|goal difference|head-to-head record decides|on league position/i},
  {id:"plural",why:"\"1 seasons\", \"1 points\" and the like",re:/(^|[^\d.])1 (seasons|points|trophies|signings|guesses|players|showdowns|wins|titles|cups)\b|\ball 1 seasons/i},
  {id:"doubled-word",why:"the same word twice",re:/\b([A-Za-z]{2,}) \1\b/i,skip:/\b(hip hip|had had)\b/i},
  {id:"unfilled-slot",why:"a {placeholder} left in the text",re:/\{[A-Za-z]+\}|\$\{|undefined|NaN|\[object Object\]|\bnull\b/,only:"screen"},
  {id:"spacing",why:"double space or space before punctuation",re:/\S {2,}\S| [,.;:!?](?:\s|$)/,only:"screen"},
  {id:"internal-name",why:"internal team/job names in visible text",re:/\bTeam V\b|\bTeam G\b|\bJOB-\d|\bHO-\d|\bfixtures? (unavailable|error)|\bpreview data\b/i},
];
const hits={};
for(const r of rows)for(const rule of RULES){
  if(rule.only&&rule.only!==r.src)continue;
  if(rule.re.test(r.t)&&!(rule.skip&&rule.skip.test(r.t)))(hits[rule.id]=hits[rule.id]||[]).push(r);
}
// the same words written in different cases or punctuation on different screens
const norm=t=>t.toLowerCase().replace(/[^a-z0-9]+/g," ").trim();
const variants=new Map();
for(const r of rows.filter(x=>x.src==="screen"&&x.t.length<=48)){const k=norm(r.t);if(!k)continue;const v=variants.get(k)||new Set();v.add(r.t);variants.set(k,v);}
const caseVariants=[...variants].filter(([,v])=>[...v].filter(t=>t!==t.toUpperCase()).length>1).map(([,v])=>[...v]);

let failed=0;
console.log(`proof-words: ${rows.length} lines (${rows.filter(r=>r.src==="screen").length} from screens${withCopy?`, ${rows.filter(r=>r.src==="copy").length} from copy`:""})`);
for(const rule of RULES){const l=hits[rule.id]||[];console.log(`${l.length?"FAIL":"ok  "} ${rule.id}: ${l.length} (${rule.why})`);if(l.length)failed++;
  for(const r of l.slice(0,25))console.log(`       ${r.where} :: ${r.t.slice(0,180)}`);}
console.log(`info mixed-case variants of the same words: ${caseVariants.length}`);
for(const v of caseVariants.slice(0,60))console.log(`       ${v.map(x=>JSON.stringify(x)).join("  |  ")}`);
process.exitCode=failed?1:0;
