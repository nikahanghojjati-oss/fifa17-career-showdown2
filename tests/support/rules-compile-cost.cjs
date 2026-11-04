'use strict';
// Fable job 19 (r88 Rules slimming): compile-cost model for the composed production Firestore Rules.
//
// Measured on the Firebase Rules service (compile-only `projects:test` probe, 2026-11-04, workflow
// .github/workflows/measure-firestore-rules-compile.yml): the service rejects a ruleset with HTTP 503 once its compile
// passes about 5.1 s. Ablations of the 2.1.0 Rules showed what that compile spends its time on:
//   - every allow replaced by `false`           -> still ~5 s   (the allow rules are not the cost)
//   - catalog regexes, key lists, get() removed  -> still ~5 s   (regexes, hasOnly lists and lookups are not the cost)
//   - nested helper CALLS inside function bodies replaced by `true`, bodies otherwise intact -> 1.3 to 2.7 s
// So the compiler expands every helper chain into every function (and every allow) that reaches it, and the cost
// follows the size of those expansions. This module computes that model from the Rules text:
//   expansion(f)        = tokens of f's body with every helper call recursively replaced by the helper's expansion
//   sumFunctionExpansions = sum of expansion(f) over all functions (each function is expanded once by the compiler)
//   sumAllowExpansions  = sum over allow statements of the expanded condition
//   sumParameterizedExpansions = the same sum over functions that take parameters (the costly kind; see below)
//   maxExpansion        = the largest single expansion (function or allow condition)
// The per-allow token proxy that the first analysis used (inline.py) is sumAllowExpansions; on its own it did not
// predict the deadline (r84's 60k-token Rules time out today as surely as 2.1.0's 74k), so the budget contract pins
// all three numbers.
const fs=require('node:fs');

function stripComments(text){return text.replace(/\/\/[^\n]*/g,'');}
function tokens(text){return (text.match(/\w+|'[^']*'|"[^"]*"|\S/g)||[]).length;}

const parameters=new Map();
function parseFunctions(text){
  const functions=new Map();parameters.clear();
  const re=/function\s+(\w+)\s*\(([^)]*)\)\s*\{/g;
  let m;
  while((m=re.exec(text))){
    let i=re.lastIndex,depth=1;
    while(depth>0&&i<text.length){const c=text[i];if(c==='{')depth+=1;else if(c==='}')depth-=1;i+=1;}
    functions.set(m[1],text.slice(re.lastIndex,i-1));
    parameters.set(m[1],m[2].split(',').map(s=>s.trim()).filter(Boolean).length);
  }
  return functions;
}
function parseAllows(text){
  const allows=[];
  const re=/allow\s+[\w, ]+:\s*if\s+([^;]+);/g;
  let m;
  while((m=re.exec(text)))allows.push(m[1]);
  return allows;
}
function calls(body){return (body.match(/\b(\w+)\s*\(/g)||[]).map(c=>c.replace(/\s*\($/,''));}

function measure(rulesText){
  const text=stripComments(rulesText);
  const functions=parseFunctions(text);
  const allows=parseAllows(text);
  const memo=new Map();
  const expansion=(name,stack)=>{
    if(memo.has(name))return memo.get(name);
    if(stack.includes(name))return 0;
    const body=functions.get(name);
    let total=tokens(body);
    for(const callee of calls(body))if(functions.has(callee))total+=expansion(callee,[...stack,name]);
    memo.set(name,total);
    return total;
  };
  const perFunction=[];
  for(const name of functions.keys())perFunction.push({name,expansion:expansion(name,[]),own:tokens(functions.get(name)),params:parameters.get(name)||0});
  const perAllow=allows.map(condition=>{
    let total=tokens(condition);
    for(const callee of calls(condition))if(functions.has(callee))total+=expansion(callee,[]);
    return {condition:condition.replace(/\s+/g,' ').slice(0,80),expansion:total};
  });
  const sumFunctionExpansions=perFunction.reduce((a,f)=>a+f.expansion,0);
  // Probe rounds 8-9 (2026-11-04): a parameterless function declared inside a match block compiles like an allow
  // expression; the expensive part is a function WITH parameters, in proportion to its expansion.
  const sumParameterizedExpansions=perFunction.reduce((a,f)=>a+(f.params>0?f.expansion:0),0);
  const parameterizedFunctions=perFunction.filter(f=>f.params>0).length;
  const sumAllowExpansions=perAllow.reduce((a,r)=>a+r.expansion,0);
  const maxFunction=perFunction.reduce((a,f)=>f.expansion>a.expansion?f:a,{name:'',expansion:0});
  const maxAllow=perAllow.reduce((a,r)=>r.expansion>a.expansion?r:a,{condition:'',expansion:0});
  return {
    functions:functions.size,
    allows:allows.length,
    sumFunctionExpansions,
    sumParameterizedExpansions,
    parameterizedFunctions,
    sumAllowExpansions,
    total:sumFunctionExpansions+sumAllowExpansions,
    maxExpansion:Math.max(maxFunction.expansion,maxAllow.expansion),
    maxFunction,
    maxAllow,
    perFunction:perFunction.sort((a,b)=>b.expansion-a.expansion),
    perAllow:perAllow.sort((a,b)=>b.expansion-a.expansion)
  };
}

function report(m,top=10){
  const lines=[
    `functions=${m.functions} (${m.parameterizedFunctions} with parameters) allows=${m.allows} sumFunctionExpansions=${m.sumFunctionExpansions} sumParameterizedExpansions=${m.sumParameterizedExpansions} sumAllowExpansions=${m.sumAllowExpansions} total=${m.total} maxExpansion=${m.maxExpansion}`,
    `largest function: ${m.maxFunction.name} (${m.maxFunction.expansion}); largest allow: ${m.maxAllow.expansion} ${m.maxAllow.condition}`,
    'largest function expansions:'
  ];
  for(const f of m.perFunction.slice(0,top))lines.push(`  ${String(f.expansion).padStart(6)}  ${f.name}`);
  lines.push('largest allow expansions:');
  for(const r of m.perAllow.slice(0,top))lines.push(`  ${String(r.expansion).padStart(6)}  ${r.condition}`);
  return lines.join('\n');
}

module.exports=Object.freeze({measure,report,tokens,parseFunctions,parseAllows});

if(require.main===module){
  const files=process.argv.slice(2);
  if(files.length===0){console.error('usage: node tests/support/rules-compile-cost.cjs <rules file> [...]');process.exit(2);}
  for(const file of files){
    process.stdout.write(`${file}\n${report(measure(fs.readFileSync(file,'utf8')))}\n\n`);
  }
}
