"use strict";
// Security Rules dependent-lookup analyzer (test-only). Firebase bills every distinct document a rule evaluation reaches with
// get() / exists() / getAfter() / existsAfter() as one extra document read (the console Usage chart does not show them).
// This reads the composed production Rules text (firestore.spark.generated.rules, built by
// scripts/build-production-firestore-rules*.mjs) and returns, for every `allow` statement, the SET of distinct documents
// its expression can reach through any chain of helper functions, on ANY branch (an upper bound: || / ?: alternatives that
// short-circuit in a real evaluation are all counted; billed-reads-table.json removes the ones a normal allowed request never reaches).
// Function arguments are bound textually, so activeAccount(ids[0]) and activeAccount(ids[1]) are two documents; accounts that are
// provably the signed-in user (request.auth.uid, actor, the match's {accountId}) fold into the pair's accounts when the rule
// also looks up the pair's accounts (the rules require request.auth.uid in authorizedAccountIds). A document looked up twice in one
// evaluation is one entry (Firebase bills distinct documents per request).
const fs=require("node:fs");
const crypto=require("node:crypto");

function stripComments(text){return text.replace(/\/\/[^\n]*/g,"");}
function findMatchingBrace(text,open){let depth=0;for(let i=open;i<text.length;i+=1){const c=text[i];if(c==="{")depth+=1;else if(c==="}"){depth-=1;if(depth===0)return i;}}return -1;}
function balanced(text,openIndex){let depth=0;for(let i=openIndex;i<text.length;i+=1){const c=text[i];if(c==="(")depth+=1;else if(c===")"){depth-=1;if(depth===0)return i;}}return -1;}
function splitArgs(argText){const out=[];let depth=0,cur="";for(const c of argText){if("([{".includes(c))depth+=1;else if(")]}".includes(c))depth-=1;if(c===","&&depth===0){out.push(cur.trim());cur="";}else cur+=c;}if(cur.trim())out.push(cur.trim());return out;}

function parseRules(rulesText){
  const text=stripComments(rulesText);
  const functions={};
  const fnRe=/\bfunction\s+(\w+)\s*\(([^)]*)\)\s*\{/g;let m;
  let stripped=text;
  while((m=fnRe.exec(text))){
    const open=m.index+m[0].length-1,close=findMatchingBrace(text,open);
    functions[m[1]]={params:m[2].split(",").map(s=>s.trim()).filter(Boolean),body:text.slice(open+1,close)};
    fnRe.lastIndex=close;
  }
  for(const [name,fn] of Object.entries(functions)){
    const idx=stripped.indexOf(fn.body);
    if(idx<0)continue;
    const open=stripped.lastIndexOf("{",idx),headStart=stripped.lastIndexOf("function",open);
    stripped=stripped.slice(0,headStart)+stripped.slice(idx+fn.body.length+1);
    void name;
  }
  const allows=[];
  function walk(segment,prefix){
    const matchRe=/\bmatch\s+(\S+)\s*\{/g;let mm;const nested=[];
    while((mm=matchRe.exec(segment))){
      const open=mm.index+mm[0].length-1,close=findMatchingBrace(segment,open);
      if(close<0)break;
      nested.push({path:mm[1].trim(),body:segment.slice(open+1,close),start:mm.index,end:close+1});
      matchRe.lastIndex=close+1;
    }
    let direct="",cursor=0;
    for(const n of nested){direct+=segment.slice(cursor,n.start);cursor=n.end;}
    direct+=segment.slice(cursor);
    const allowRe=/\ballow\s+([a-z, \n]+?)\s*:\s*if\s+([\s\S]*?);/g;let am;
    while((am=allowRe.exec(direct)))allows.push({path:prefix,ops:am[1].split(",").map(s=>s.trim()).filter(Boolean),expr:am[2]});
    for(const n of nested)walk(n.body,(prefix+n.path).replace(/\/+/g,"/"));
  }
  walk(stripped,"");
  return {functions,allows};
}

function subst(text,env){return text.replace(/[A-Za-z_]\w*/g,(w,off,s)=>(env[w]!==undefined&&s[off-1]!=="."?`(${env[w]})`:w));}
function canonicalSegment(raw){
  let v=raw.replace(/[()\s]/g,"");
  v=v.replace(/request\.auth\.uid/g,"@self").replace(/\bactor\b/g,"@self");
  if(/\[0\]|slot0|Slot0/.test(v))return "@pair0";
  if(/\[1\]|slot1|Slot1/.test(v))return "@pair1";
  return v;
}
function normalizeDocPath(raw,env={}){
  let p=raw.replace(/^\s*\/databases\/\$\(database\)\/documents\//,"");
  p=p.replace(/\$\(((?:[^()]|\([^()]*\))*)\)/g,(_all,inner)=>`{${canonicalSegment(subst(inner,env))}}`);
  return p.replace(/\s+/g,"");
}
function* lookupCalls(expr){
  const re=/\b(get|exists|getAfter|existsAfter)\(/g;let m;
  while((m=re.exec(expr))){
    const close=balanced(expr,re.lastIndex-1);
    yield [m[1],expr.slice(re.lastIndex,close).trim()];
    re.lastIndex=close+1;
  }
}
function resolvePathArg(arg,body){
  if(arg.startsWith("/databases/"))return arg;
  const m=new RegExp(`\\blet\\s+${arg.replace(/\W/g,"")}\\s*=\\s*(/databases/[^;]*);`).exec(body||"");
  return m?m[1].trim():null;
}
// Documents reachable from `expr` (text of a function body or allow expression) with the textual parameter bindings `env`.
function lookupsOf(expr,functions,env={},stack=[]){
  const out=new Set();
  for(const [kind,arg] of lookupCalls(expr)){
    const p=resolvePathArg(arg,expr);
    if(p)out.add(normalizeDocPath(p,env));void kind;
  }
  const callRe=/\b([A-Za-z_]\w*)\s*\(/g;let m;
  while((m=callRe.exec(expr))){
    const name=m[1],fn=functions[name];
    if(!fn||stack.includes(name))continue;
    const close=balanced(expr,callRe.lastIndex-1);
    const args=splitArgs(expr.slice(callRe.lastIndex,close));
    const inner={};fn.params.forEach((param,i)=>{inner[param]=subst(args[i]||"",env);});
    for(const d of lookupsOf(fn.body,functions,inner,[...stack,name]))out.add(d);
  }
  return out;
}
// Fold "the signed-in user's account" into the pair's accounts when both are present, and an account looked up as the match's
// own {accountId} (== request.auth.uid in those rules) likewise.
function foldAccounts(docs){
  const set=new Set(docs);
  const hasPair=[...set].some(d=>d==="accounts/{@pair0}"||d==="accounts/{@pair1}");
  if(hasPair){set.delete("accounts/{@self}");set.delete("accounts/{accountId}");}
  else if(set.has("accounts/{@self}"))set.delete("accounts/{accountId}");
  return [...set].sort();
}
function analyze(rulesText){
  const {functions,allows}=parseRules(rulesText);
  const rules=allows.map(a=>({path:a.path.replace(/^\/databases\/\{database\}\/documents/,""),ops:a.ops,docs:foldAccounts(lookupsOf(a.expr,functions))}));
  return {rules,functions:Object.keys(functions)};
}
// Upper bound for one operation on a path template: union over every allow statement of that path whose ops cover it.
function upperBound(analysis,pathTemplate,op){
  const wanted=op==="get"?["get","read"]:[op,"write"];
  let docs=null;
  for(const r of analysis.rules){
    if(r.path!==pathTemplate||!r.ops.some(o=>wanted.includes(o)))continue;
    docs=new Set([...(docs||[]),...r.docs]);
  }
  return docs?[...docs].sort():null;
}
function templates(analysis){return [...new Set(analysis.rules.map(r=>r.path))];}
// Concrete document path -> rules path template ("rivalries/pair_ab.../seasonResults/season_1" -> "/rivalries/{rivalryId}/seasonResults/{seasonId}").
function matchTemplate(analysis,docPath){
  const segs=String(docPath).replace(/^\/+/,"").split("/");
  let best=null;
  for(const t of templates(analysis)){
    if(t.includes("=**"))continue;
    const ts=t.replace(/^\//,"").split("/");
    if(ts.length!==segs.length)continue;
    let score=0,ok=true;
    for(let i=0;i<ts.length;i+=1){if(/^\{.*\}$/.test(ts[i]))continue;if(ts[i]!==segs[i]){ok=false;break;}score+=1;}
    if(ok&&(!best||score>best.score))best={t,score};
  }
  return best?best.t:null;
}
function hashRules(rulesText){return crypto.createHash("sha256").update(rulesText).digest("hex");}
function loadRules(file){return fs.readFileSync(file,"utf8");}
module.exports={analyze,upperBound,templates,matchTemplate,hashRules,loadRules,normalizeDocPath,parseRules,lookupsOf,foldAccounts};
