const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const {spawnSync}=require("node:child_process");

// r84 billed-reads budget (owner decision 2026-10-26): "at least 25 seasons a day inside the Firebase Spark free limit
// (50,000 billed reads/day)" is a tested release gate. One season, including realistic waiting, may cost at most 1,800 BILLED
// reads for both managers together; billed = client document reads + Security Rules get()/exists() lookups. This contract keeps the
// billing model honest without a browser: the Rules-lookup table is derived from the composed production Rules, is pinned to the
// Rules text it was reviewed against, and the journey that enforces the gate keeps its constants.
const root=path.resolve(__dirname,"../..");
for(const script of ["build-production-firestore-rules.mjs","build-production-firestore-rules-with-persistent-pair.mjs"]){
  const built=spawnSync(process.execPath,[path.join(root,"scripts",script)],{cwd:root,encoding:"utf8"});
  assert.equal(built.status,0,`${script} failed: ${built.stderr||built.stdout}`);
}
const L=require("../browser/support/rules-lookups.cjs");
const B=require("../browser/support/billed-meter.cjs");
const rulesText=L.loadRules(path.join(root,"firestore.spark.generated.rules"));
const table=JSON.parse(fs.readFileSync(B.TABLE_FILE,"utf8"));

// 1. The pin: any change to the composed production Rules must be reviewed against the billing table.
assert.equal(L.hashRules(rulesText),table.rulesSha256,
  "the composed production Rules changed: re-derive tests/browser/support/billed-reads-table.json (run `node -e \"console.log(require('./tests/browser/support/billed-meter.cjs').loadModel().rulesSha256)\"`, review readExclusions against the new get()/exists() calls, update rulesSha256 and reviewedAt)");

// 2. The derivation sees the lookups we know are there, and every exclusion still names a real lookup.
const analysis=L.analyze(rulesText);
const model=B.loadModel();
const read=p=>model.readDocs(model.templateOf(p));
assert.deepEqual(read("rivalries/pair_x"),["accounts/{@self}","rivalries/{rivalryId}"],"a paired rivalry read: the rivalry itself and the signed-in account (the pending-invite lookup is on the other || branch)");
for(const sub of ["state/authoritative","sharedSetup/authoritative","careerStart/authoritative","transferChallenges/season_1","seasonResults/season_1","seasonCommits/season_1","sessionOffers/current"]){
  const docs=read(`rivalries/pair_x/${sub}`);
  assert.ok(docs.includes("rivalries/{rivalryId}"),`${sub} read looks up the rivalry`);
}
for(const sub of ["sharedSetup/authoritative","careerStart/authoritative","transferChallenges/season_1","seasonResults/season_1","seasonCommits/season_1"]){
  const docs=read(`rivalries/pair_x/${sub}`);
  assert.deepEqual(docs,["accounts/{@pair0}","accounts/{@pair1}","rivalries/{rivalryId}"],`${sub} read: the rivalry plus both paired accounts`);
}
assert.deepEqual(read("accounts/u/devices/d"),[],"account device reads need no lookups");
assert.equal(model.writeDocs(model.templateOf("rivalries/pair_x/seasonCommits/season_1")).length>=3,true,"season commit writes look up several documents");
for(const [template,entry] of Object.entries(table.readExclusions)){
  const ub=L.upperBound(analysis,template,"get")||[];
  for(const doc of entry.exclude)assert.ok(ub.includes(doc),`readExclusions ${template} names ${doc}, which the Rules no longer look up on get`);
  assert.ok(entry.why&&entry.why.length>40,`readExclusions ${template} needs a reason`);
}
for(const rule of analysis.rules)if(rule.ops.some(o=>["list"].includes(o))&&rule.docs.length)assert.fail(`list rule ${rule.path} has lookups: query pricing is not modelled`);

// 3. Pricing: a request pays its own lookups; a listener pays them once at attach; a commit pays each looked-up document once.
const ev=(o)=>({user:"daniel",st:"x.js:1:1",n:1,...o});
const sample=B.price(model,[
  ev({k:"read",op:"getDoc",path:"rivalries/pair_x"}),
  ev({k:"listener",op:"onSnapshot",path:"rivalries/pair_x/state/authoritative",n:0}),
  ev({k:"read",op:"listen",path:"rivalries/pair_x/state/authoritative"}),
  ev({k:"read",op:"listen",path:"rivalries/pair_x/state/authoritative"}),
  ev({k:"write",op:"batch",path:"rivalries/pair_x/seasonResults/season_1",req:1}),
  ev({k:"write",op:"batch",path:"rivalries/pair_x/seasonResults/season_1/roles/playerOne",req:1})
]);
assert.equal(sample.docReads,3,"1 getDoc + 2 listener deliveries");
assert.equal(sample.rulesReads,2+2,"getDoc rivalry 2 lookups + listener attach 2 lookups");
assert.equal(sample.writes,2);
const union=new Set([...model.writeDocs(model.templateOf("rivalries/pair_x/seasonResults/season_1")),...model.writeDocs(model.templateOf("rivalries/pair_x/seasonResults/season_1/roles/playerOne"))]);
assert.equal(sample.rulesOnWrites,union.size,"two writes in one commit share their lookups");
assert.equal(sample.billed,sample.docReads+sample.rulesReads+sample.rulesOnWrites);

// 4. The gate itself keeps its formula and constants, and runs under test:budget.
//    seasonMinutes = transfer + results + short waits + harness play/setup; seasonsPerDay = min(25, floor(1440 / seasonMinutes));
//    budget per season = floor(45,000 / seasonsPerDay); gate: billed per season <= budget, at the slow, mid and fast pace.
const journey=fs.readFileSync(path.join(root,"tests/browser/ce2pg-journey.cjs"),"utf8");
const vm=require("node:vm");
const constSrc=/const BILLED_BUDGET=Object\.freeze\(\{[^}]*\}\);/.exec(journey)?.[0];
const fnSrc=/function paceBudget\([^)]*\)\{[\s\S]*?\n\}/.exec(journey)?.[0];
assert.ok(constSrc&&fnSrc,"ce2pg-journey.cjs defines BILLED_BUDGET and paceBudget");
const sandbox={};vm.createContext(sandbox);
vm.runInContext(`${constSrc}\n${fnSrc}\nthis.BILLED_BUDGET=BILLED_BUDGET;this.paceBudget=paceBudget;`,sandbox);
assert.deepEqual({...sandbox.BILLED_BUDGET},{dailyFreeReads:50000,marginPercent:10,maxSeasonsPerDay:25,minutesPerDay:1440});
const pace=(m,b)=>{const r=sandbox.paceBudget(m,b);return {seasonsPerDay:r.seasonsPerDay,budget:r.budget,pass:r.pass,real:r.realSeasonsPerDay};};
assert.deepEqual(pace(135,3000),{seasonsPerDay:10,budget:4500,pass:true,real:10},"slow pace: 135 min -> 10 seasons/day -> 4,500 per season");
assert.deepEqual(pace(58,2000),{seasonsPerDay:24,budget:1875,pass:false,real:24},"fast pace: 58 min -> 24 seasons/day -> 1,875 per season");
assert.deepEqual(pace(30,1800),{seasonsPerDay:25,budget:1800,pass:true,real:25},"a season quicker than 57.6 min is capped at 25 a day -> 1,800");
assert.deepEqual(pace(60,5000),{seasonsPerDay:24,budget:1875,pass:false,real:10},"capacity = floor(50,000 / billed) when the cost is the limit");
assert.match(journey,/"zz\.billed"/,"the zz.billed check");
assert.match(journey,/CE2PG_TRANSFER_MIN",40\).*CE2PG_RESULTS_MIN",90/s,"slow = 40 min transfer + 90 min results");
assert.match(journey,/CE2PG_FAST_TRANSFER_MIN",25\).*CE2PG_FAST_RESULTS_MIN",30/s,"fast = 25 + 30");
assert.match(journey,/CE2PG_MID_TRANSFER_MIN",30\).*CE2PG_MID_RESULTS_MIN",60/s,"mid = 30 + 60");
const pkg=JSON.parse(fs.readFileSync(path.join(root,"package.json"),"utf8"));
assert.match(pkg.scripts["test:budget"]||"",/CE2PG_BUDGET=1.*CE2PG_PLAN=single.*CE2PG_SEASONS=3.*ce2pg-journey\.cjs/,"npm run test:budget");
// 5. CI: its own workflow, never a pull_request workflow (Showdown Gate stays the only one), on pushes to the release branches.
const workflow=fs.readFileSync(path.join(root,".github/workflows/billed-reads-budget.yml"),"utf8");
assert.doesNotMatch(workflow,/^\s*pull_request\s*:/m,"the budget workflow must not be a pull_request workflow");
assert.match(workflow,/branches: \['gameplay\/r\[0-9\]\*'\]/,"runs on pushes to the release branches");
assert.match(workflow,/run: npm run test:budget/,"runs npm run test:budget");
assert.match(workflow,/firebase@12\.17\.0/,"firebase 12.17.0 matches the app");
assert.doesNotMatch(workflow,/:\s*write\b/,"read-only");
process.stdout.write("PASS r84 billed-reads budget: Rules lookup table derived from the pinned production Rules, pricing rules, pace formula (seasonsPerDay = min(25, floor(1440 / seasonMinutes)), budget = floor(45,000 / seasonsPerDay)), test:budget script and its workflow.\n");
