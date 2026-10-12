"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const root=path.resolve(__dirname,"../..");
const read=file=>fs.readFileSync(path.join(root,file),"utf8");
const career=JSON.parse(read("tests/fixtures/import/showdown-schema2.json"));
const payload={activeShowdown:career,legacyShowdowns:[{...career,id:"backup-history"}],preferences:null};
const choices={active:"use-backup",legacy:"merge",preferences:"use-backup"};

function runtime(records){
  const values=new Map([
    ["careerModeShowdown.activeShowdown",JSON.stringify({...career,id:"local-active"})],
    ["careerModeShowdown.legacyShowdowns",JSON.stringify(records)],
    ["careerModeShowdown.preferences",'{"schemaVersion":2,"reducedMotion":true,"menuFeedback":false}']
  ]);
  let writes=0;
  const c=vm.createContext({console:{...console,error(){}},currentShowdown:null,structuredClone,
    document:{documentElement:{dataset:{}},querySelector:()=>null},
    localStorage:{getItem:key=>values.get(key)??null,
      setItem(key,value){writes++;values.set(key,String(value));},
      removeItem(key){writes++;values.delete(key);}},
    analyzeCareerModeBackupFile:async()=>({ok:true,checksum:{verified:true},migratedPayload:structuredClone(payload)})});
  vm.runInContext("window=globalThis",c);
  for(const name of ["storage","storageTransaction","restore"])
    vm.runInContext(read("js/"+name+".js"),c,{filename:"js/"+name+".js"});
  return {c,values,get writes(){return writes;}};
}

(async()=>{
  for(const bad of [null,[],false,7,"broken"]){
    const r=runtime([{...career,id:"local-history"},bad]);
    const before=[...r.values];
    const result=await r.c.applyCareerModeRestore({name:"valid-backup.json"},choices);
    assert.equal(result.ok,false,"Merge must reject a local history record the history reader cannot load");
    assert.equal(result.status,"choice-blocked");
    assert.match(result.errors.join(" "),/Current Legacy bytes are unreadable/);
    assert.equal(r.writes,0,"Blocked merge must not write active career, history or preferences");
    assert.deepEqual([...r.values],before);
    assert.equal(r.c.isCareerModeRestoreInFlight(),false);

    const replaced=await r.c.applyCareerModeRestore({name:"valid-backup.json"},{...choices,legacy:"replace-with-backup"});
    assert.equal(replaced.ok,true,"Explicit replacement remains available for broken local history");
    assert.match(replaced.warnings.join(" "),/Unreadable current Legacy bytes/);
    assert.deepEqual(JSON.parse(JSON.stringify(r.c.loadLegacyShowdowns())),payload.legacyShowdowns);
  }
  const valid=runtime([{...career,id:"local-history"}]);
  assert.equal((await valid.c.applyCareerModeRestore({},choices)).ok,true);
  assert.deepEqual(Array.from(valid.c.loadLegacyShowdowns(),record=>record.id),["local-history","backup-history"]);
  const writes=valid.writes;
  assert.equal((await valid.c.applyCareerModeRestore({},choices)).ok,true);
  assert.equal(valid.writes,writes,"Repeating the same restore must not double count history");
  const kept=runtime([null]);
  const before=[...kept.values];
  assert.equal((await kept.c.applyCareerModeRestore({},{active:"keep-current",legacy:"keep-current",preferences:"keep-current"})).ok,true);
  assert.equal(kept.writes,0);
  assert.deepEqual([...kept.values],before,"Keeping broken history preserves exact original bytes");
  console.log("PASS restore rejects unreadable local history records without writes; replacement, keep and repeated merge remain safe");
})().catch(error=>{console.error(error);process.exitCode=1;});
