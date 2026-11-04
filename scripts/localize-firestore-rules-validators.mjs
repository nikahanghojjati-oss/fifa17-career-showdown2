import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

// r88 Rules slimming (Fable job 19). Last build step for the composed production Firestore Rules.
//
// Why: the Firebase Rules service rejects a ruleset with HTTP 503 once its compile runs past about 5.1 s, and the 2.1.0
// deploy hit that 24 times. Compile-only probes (scripts/time-firestore-rules-compile.mjs) showed where the time goes:
// a function WITH PARAMETERS is compiled far more expensively than the same body as a parameterless function or an
// allow expression, in proportion to its fully expanded body. The 61 top-level validators (one call site each, called
// from an allow with the match wildcards as arguments) carried about 60% of that cost. Declared inside the match block
// that uses them, with no parameters and the wildcards in scope, the same bodies compile in about half the time
// (probe round 9: 2.2-3.3 s against 5.2 s and over for the unchanged Rules, same window).
//
// What it does, mechanically and reversibly, on the composed artifact only (the reviewed sources keep their shape):
//   for every function whose call sites all lie inside one match block and pass, for at least one parameter, the same
//   argument at every site written as a wildcard of that block or an ancestor, or as a plain member chain on request
//   or resource (`request.resource.data`), it
//     1. removes the function and its leading comment block from where it was declared,
//     2. declares it again at the top of that match block with those parameters gone (a plain wildcard is substituted
//        in the body; a request/resource chain becomes a let binding, evaluated once in the moved function instead of
//        once at the call site); any other parameter stays a parameter,
//     3. rewrites the call sites to pass only the remaining arguments (`name()` for most validators).
//   Let bindings, the return expression, the order of conjuncts and every allow statement stay as they were, so the
//   same requests are allowed and denied (emulator proof: tests/firebase/composed-production-rules-regression.cjs and
//   every production suite run against the localized artifact).
// It repeats until nothing qualifies, so a helper used only by a localized validator is localized too.
// An argument that is the caller's OWN let binding (`let after = request.resource.data; shape(after, ...)`) does not
// qualify, although the chain is known: the moved function would evaluate the chain again, and the Rules engine's
// 1,000-expressions-per-request budget is spent by the season-2 START, Season Results and commit writes with that
// extra cost (emulator: the 3-season lifecycle denied them). Such a parameter stays a parameter, which costs the
// compiler little: probe round 14 compiled this form in 1.7-1.9 s against 2.4-2.8 s with those helpers left at the
// root and 4.5-5.5 s for the unchanged Rules, in the same window. The call site's own evaluations are the ceiling.
// Functions named in KEEP stay where they are.

const ARTIFACT='firestore.spark.generated.rules';
// The Transfer fresh-session emulator proof injects root-level probe matches that call these two with arbitrary values
// (tests/firebase/shared-transfer-challenge-fresh-session-emulator.cjs), so they stay parameterized at the root.
export const KEEP=Object.freeze(['ssjrTransferGuessesValid','ssjrTransferSigningsValid']);

function maskComments(text){
  // Same length as text: comment characters become spaces, so offsets found on the mask apply to the text.
  return text.replace(/\/\/[^\n]*/g,m=>' '.repeat(m.length));
}
function matchingBrace(t,open){let i=open+1,d=1;while(d>0&&i<t.length){const c=t[i];if(c==='{')d+=1;else if(c==='}')d-=1;i+=1;}return i-1;}
function matchingParen(t,open){let i=open+1,d=1;while(d>0&&i<t.length){const c=t[i];if(c==='(')d+=1;else if(c===')')d-=1;i+=1;}return i;}
function splitArgs(s){const a=[];let d=0,cur='';for(const ch of s){if('(['.includes(ch))d+=1;if(')]'.includes(ch))d-=1;if(ch===','&&d===0){a.push(cur.trim());cur='';}else cur+=ch;}if(cur.trim())a.push(cur.trim());return a;}

function parseBlocks(mask){
  const blocks=[];const re=/match\s+(\/\S+?)\s*\{[ \t]*\n/g;let m;
  while((m=re.exec(mask))){
    const open=m.index+m[0].lastIndexOf('{');const close=matchingBrace(mask,open);
    const wildcards=[...m[1].matchAll(/\{(\w+)(?:=\*\*)?\}/g)].map(w=>w[1]);
    blocks.push({path:m[1],start:m.index,open,close,wildcards});
  }
  for(const b of blocks)b.parent=blocks.filter(o=>o!==b&&o.start<b.start&&o.close>b.close).sort((x,y)=>y.start-x.start)[0]||null;
  return blocks;
}
function scopeWildcards(block){const names=new Set();for(let b=block;b;b=b.parent)for(const w of b.wildcards)names.add(w);return names;}
function innermostBlock(blocks,index){return blocks.filter(b=>b.start<index&&b.close>index).sort((x,y)=>y.start-x.start)[0]||null;}

function parseFunctions(mask){
  const fns=new Map();const re=/function\s+(\w+)\s*\(([^)]*)\)\s*\{/g;let m;
  while((m=re.exec(mask))){
    const open=re.lastIndex-1;const close=matchingBrace(mask,open);
    fns.set(m[1],{name:m[1],params:m[2].split(',').map(s=>s.trim()).filter(Boolean),headerStart:m.index,open,close});
  }
  return fns;
}
function callSites(mask,name,fn){
  const re=new RegExp(`\\b${name}\\s*\\(`,'g');const sites=[];let m;
  while((m=re.exec(mask))){
    if(m.index===fn.headerStart+mask.slice(fn.headerStart).indexOf(name))continue; // the declaration itself
    const argsStart=m.index+m[0].length;const end=matchingParen(mask,argsStart-1);
    sites.push({index:m.index,end,args:splitArgs(mask.slice(argsStart,end-1))});
  }
  return sites;
}
function substituteIdentifiers(body,map){
  // Replace whole identifiers outside string literals and never a member name after '.'.
  return body.replace(/'[^']*'|"[^"]*"|\b(\w+)\b/g,(tok,w,off)=>{if(w===undefined||!map.has(w))return tok;if(off>0&&body[off-1]==='.')return tok;return map.get(w);});
}
function leadingCommentStart(text,headerStart){
  // The contiguous `//` comment lines directly above the declaration travel with it.
  let lineStart=text.lastIndexOf('\n',headerStart-1)+1;let start=lineStart;
  for(;;){
    const prevEnd=start-1;if(prevEnd<0)break;
    const prevStart=text.lastIndexOf('\n',prevEnd-1)+1;const line=text.slice(prevStart,prevEnd);
    if(!/^\s*\/\//.test(line))break;start=prevStart;
  }
  return start;
}
const simpleArg=a=>/^\w+$/.test(a);
// A pure chain of member and literal-index accesses on request, resource or a wildcard: no call, no operator, so
// evaluating it inside the moved function instead of once in the caller changes nothing a request can observe.
const pureChain=(a,inScope)=>{const m=a.match(/^(\w+)((?:\.\w+|\[(?:\d+|'[^']*'|"[^"]*")\])*)$/);return !!m&&(m[1]==='request'||m[1]==='resource'||inScope.has(m[1]));};
// An argument qualifies as written: a wildcard in scope or a pure request/resource chain. Anything else (a call, an
// operator, a let of the calling function) keeps the helper where it is.
const resolveArg=(arg,inScope)=>pureChain(arg,inScope)?arg:null;

export function localizeValidators(source,keep=KEEP){
  let text=source;const moved=[];
  for(;;){
    const mask=maskComments(text);const blocks=parseBlocks(mask);const fns=parseFunctions(mask);
    let candidate=null;
    for(const fn of fns.values()){
      if(keep.includes(fn.name)||fn.params.length===0)continue;
      const sites=callSites(mask,fn.name,fn);
      if(sites.length===0)continue;
      if(sites.some(s=>s.index>fn.open&&s.index<fn.close))continue; // recursive
      const siteBlocks=sites.map(s=>innermostBlock(blocks,s.index));
      if(siteBlocks.some(b=>!b))continue;
      // one declaration block: the innermost block containing every site
      let block=siteBlocks[0];while(block&&!siteBlocks.every(b=>b.start>=block.start&&b.close<=block.close))block=block.parent;
      if(!block||block.parent===null)continue; // never the root document block: those helpers are shared
      if(sites.some(s=>s.args.length!==fn.params.length))continue;
      const inScope=scopeWildcards(block);
      const resolved=sites.map(s=>s.args.map(a=>resolveArg(a,inScope)));
      // A parameter whose argument does not qualify at some site stays a parameter (passed exactly as before); the
      // others are substituted. Nothing is gained when every parameter stays.
      const kept=fn.params.map((_,i)=>resolved.some(r=>r[i]===null));
      if(kept.every(Boolean))continue;
      const key=r=>r.map((a,i)=>kept[i]?'':a).join(',');
      const first=key(resolved[0]);
      if(resolved.some(r=>key(r)!==first))continue;
      // a function declared in this block must not be called from inside a function declared OUTSIDE it
      if(sites.some(s=>{const owner=[...fns.values()].find(g=>s.index>g.open&&s.index<g.close);return owner&&!(owner.headerStart>block.open&&owner.headerStart<block.close);}))continue;
      // no capture: a wildcard that replaces a parameter must not share its name with one of the body's own
      // let bindings or another parameter, and a wildcard the body never named before must not be bound by a let.
      const bodyLets=[...mask.slice(fn.open+1,fn.close).matchAll(/let\s+(\w+)\s*=/g)].map(l=>l[1]);
      const localNames=new Set([...bodyLets,...fn.params]);
      if(resolved[0].some((a,i)=>!kept[i]&&simpleArg(a)&&a!==fn.params[i]&&localNames.has(a)))continue;
      if(bodyLets.some(l=>inScope.has(l)))continue;
      candidate={fn,sites,block,args:resolved[0],kept};break;
    }
    if(!candidate)break;
    const {fn,sites,block,args,kept}=candidate;
    const declStart=leadingCommentStart(text,fn.headerStart);
    let declEnd=fn.close+1;if(text[declEnd]==='\n')declEnd+=1;
    const bodyText=text.slice(fn.open+1,fn.close);
    const comment=text.slice(declStart,fn.headerStart).replace(/^\s*\n/,'').replace(/[ \t]*$/,'');
    const map=new Map();const lets=[];
    fn.params.forEach((p,i)=>{if(kept[i])return;const a=args[i];if(simpleArg(a)){if(a!==p)map.set(p,a);}else{lets.push(`let ${p} = ${a};`);}});
    const keptParams=fn.params.filter((_,i)=>kept[i]).join(', ');
    let body=substituteIdentifiers(bodyText,map);
    if(lets.length){const indentMatch=body.match(/\n(\s*)\S/);const indent=indentMatch?indentMatch[1]:'      ';body='\n'+lets.map(l=>indent+l).join('\n')+body;}
    const blockIndent=(text.slice(text.lastIndexOf('\n',block.start)+1,block.start).match(/^\s*/)||[''])[0]+'  ';
    const oldIndent=(text.slice(text.lastIndexOf('\n',fn.headerStart)+1,fn.headerStart).match(/^\s*/)||[''])[0];
    const shift=' '.repeat(Math.max(0,blockIndent.length-oldIndent.length));
    const reindent=t=>t.split('\n').map(l=>l.trim()?shift+l:l).join('\n');
    const declaration=`${reindent(comment)}${blockIndent}function ${fn.name}(${keptParams}) {${reindent(body).replace(/\n[ \t]*$/,'\n'+blockIndent)}}\n`;
    // Apply edits from the end of the text backwards so earlier offsets stay valid.
    const edits=[{start:declStart,end:declEnd,replacement:''},{start:block.open+1,end:block.open+1,replacement:'\n'+declaration.replace(/\n$/,'')}];
    for(const s of sites)edits.push({start:s.index,end:s.end,replacement:`${fn.name}(${s.args.filter((_,i)=>kept[i]).join(', ')})`});
    edits.sort((a,b)=>b.start-a.start);
    for(const e of edits)text=text.slice(0,e.start)+e.replacement+text.slice(e.end);
    moved.push({name:fn.name,block:block.path,params:fn.params,args:sites[0].args,sites:sites.length});
  }
  return {text,moved};
}

export function localizeArtifact(root=process.cwd()){
  const file=path.join(root,ARTIFACT);
  const before=fs.readFileSync(file,'utf8');
  const {text,moved}=localizeValidators(before);
  // Invariants: same number of functions, the same allow operations in the same order, nothing else lost.
  const count=t=>(maskComments(t).match(/\bfunction\s+\w+\s*\(/g)||[]).length;
  if(count(text)!==count(before))throw new Error(`localize: function count changed ${count(before)} -> ${count(text)}`);
  const ops=t=>(maskComments(t).match(/\ballow\s+[\w, ]+:/g)||[]).join('|');
  if(ops(text)!==ops(before))throw new Error('localize: allow statements changed');
  fs.writeFileSync(file,text);
  return {text,moved};
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const {text,moved}=localizeArtifact();
  process.stdout.write(`LOCALIZED ${moved.length} single-use Rules validators into their match blocks (${Buffer.byteLength(text,'utf8')} bytes)\n`);
  for(const m of moved)process.stdout.write(`  ${m.name}(${m.params.join(', ')}) -> ${m.block} as ${m.name}()\n`);
}
