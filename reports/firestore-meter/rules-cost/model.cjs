'use strict';
const fs=require('node:fs');
const prefix='projects/demo-cms-browser-journey/databases/(default)/documents/';
function plain(v){if(!v||typeof v!=='object')return v;if('mapValue'in v)return Object.fromEntries(Object.entries(v.mapValue.fields||{}).map(([k,x])=>[k,plain(x)]));if('arrayValue'in v)return(v.arrayValue.values||[]).map(plain);for(const k of ['intValue','stringValue','integerValue','doubleValue','booleanValue','boolValue','timestampValue','nullValue'])if(k in v)return v[k];return v;}
function data(doc){return Object.fromEntries(Object.entries(doc?.fields||{}).map(([k,v])=>[k,plain(v)]));}
function pattern(p){return p.replace(/^.*\/documents\//,'').replace(/accounts\/[^/]+/g,'accounts/{uid}').replace(/devices\/[^/]+/g,'devices/{device}').replace(/rivalries\/[^/]+/g,'rivalries/{rivalry}').replace(/sessions\/[^/]+/g,'sessions/{session}').replace(/invites\/[^/]+/g,'invites/{invite}').replace(/season_\d+/g,'season_{n}').replace(/roles\/player(One|Two)/g,'roles/{role}').replace(/careerIndex\/[^/]+/g,'careerIndex/{id}').replace(/idempotency\/[^/]+/g,'idempotency/{id}');}
function body(e){return JSON.parse(e.body||'{}');}
function documents(e){const b=body(e);return b.documents||b.writes?.map(w=>w.update?.name||w.delete||w.verify||w.transform?.document)||[];}
function signature(e){
 const b=body(e);
 if(b.documents){const r=Array.isArray(e.response)?e.response:[];return (e.probeTransport==='listen'?'listen|':'get|')+b.documents.map(p=>pattern(p)).join('+')+'|'+b.documents.map(p=>/\/roles\/player(One|Two)$/.test(p)?((p.endsWith('/playerOne')&&e.manager==='daniel'||p.endsWith('/playerTwo')&&e.manager==='nik')?'own':'opponent'):'').join('+')+'|'+r.map(x=>{const d=data(x.found);return[d.phase,d.data?.connectionState,d.data?.state,x.missing?'missing':null].filter(Boolean).join(':');}).join('+')+'|'+e.status+'|'+(e.ruleAuthority||'live');}
 return 'commit|'+(b.writes||[]).map(w=>{const d=data(w.update);return[(w.verify?'verify':w.delete?'delete':w.update?'update':'transform'),pattern(w.update?.name||w.verify||w.delete||w.transform?.document||'?'),d.operationTypes?.at(-1),d.phase,d.data?.connectionState,d.data?.state,d.seasonNumber,d.throughSeason,d.foldedSeasons,d.revision].filter(x=>x!==undefined).join(':');}).join('+')+'|'+e.status+'|'+(e.ruleAuthority||'live');
}
function annotate(raw){const closed=raw.rpc.filter(e=>e.status===200&&(body(e).writes||[]).some(w=>data(w.update).data?.connectionState==='closed'));const closedAt=closed.length?Math.min(...closed.map(e=>e.end||e.t)):Infinity;for(const e of raw.rpc)e.ruleAuthority=e.t>=closedAt?'closed':'live';raw.closedAt=closedAt;return raw;}
function owner(e){const c=e.caller?.length?e.caller:e.chain||[];return [...c].reverse().find(x=>x.startsWith('js/production'))||c.at(-1)||'unknown';}
function pathValue(v){const p=v?.value?.pathValue;if(typeof p==='string')return p;if(p?.segments)return '/'+p.segments.map(s=>s.simple||s.variable||'?').join('/');return null;}
function coverage(json){const lines=(json.rules?.files?.[0]?.content||'').split('\n');const sites=new Map();
 function walk(n){const p=n.sourcePosition||{},span=(p.endOffset||0)-(p.currentOffset||0),text=(lines[(p.line||0)-1]||'').slice((p.column||1)-1),m=span>=4&&text.match(/^(getAfter|get|exists)\s*\(/);
 if(m){const key=p.line+':'+p.column,old=sites.get(key);if(!old||p.endOffset<old.endOffset){const paths=new Map();function child(c){for(const v of c.values||[]){const path=pathValue(v);if(path?.includes('/documents/'))paths.set(path,(paths.get(path)||0)+(v.count||0));}for(const x of c.children||[])child(x);}for(const c of n.children||[])child(c);sites.set(key,{key,kind:m[1],line:p.line,column:p.column,endOffset:p.endOffset,evaluations:(n.values||[]).reduce((a,v)=>a+(v.count||0),0),definedEvaluations:(n.values||[]).filter(v=>!v.value?.undefined).reduce((a,v)=>a+(v.count||0),0),paths:Object.fromEntries(paths)});}}
 for(const c of n.children||[])walk(c);
 }for(const n of json.report||[])walk(n);return Object.fromEntries(sites);
}
function delta(before,after){const sites=[],paths=new Set();for(const [k,a]of Object.entries(after)){const b=before[k]||{};const count=a.evaluations-(b.evaluations||0);if(count<=0)continue;const ps=Object.entries(a.paths).filter(([p,n])=>n>(b.paths?.[p]||0)).map(([p])=>p);ps.forEach(p=>paths.add(p));sites.push({kind:a.kind,line:a.line,column:a.column,evaluations:count,definedEvaluations:(a.definedEvaluations||0)-(b.definedEvaluations||0),paths:ps});}return {evaluations:sites.reduce((n,s)=>n+s.evaluations,0),paths:[...paths],distinct:paths.size,sites};}
module.exports={prefix,plain,data,pattern,body,documents,signature,annotate,owner,coverage,delta};
