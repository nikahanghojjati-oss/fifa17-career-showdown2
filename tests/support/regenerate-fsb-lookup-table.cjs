"use strict";
// Regenerates the client Rules lookup table in js/sparkPrivatePairing.js (FSB_RULES_SHA256 + FSB_RULES_LOOKUPS) and the
// rulesSha256 pin in tests/browser/support/billed-reads-table.json from the composed production Rules, with the same derivation
// the CE2PG billed meter uses. Run after any Rules change:  node tests/support/regenerate-fsb-lookup-table.cjs [--check]
// Build the composed Rules first (scripts/build-production-firestore-rules*.mjs). --check exits 1 when the files are stale.
const fs=require("node:fs");
const path=require("node:path");
const ROOT=path.resolve(__dirname,"../..");
const billedMeter=require(path.join(ROOT,"tests/browser/support/billed-meter.cjs"));
const lookups=require(path.join(ROOT,"tests/browser/support/rules-lookups.cjs"));
const CLIENT=path.join(ROOT,"js/sparkPrivatePairing.js"),TABLE=path.join(ROOT,"tests/browser/support/billed-reads-table.json");
const rulesText=fs.readFileSync(path.join(ROOT,"firestore.spark.generated.rules"),"utf8");
const sha=lookups.hashRules(rulesText);
const model=billedMeter.loadModel();
const rows=lookups.templates(model.analysis).filter(t=>!t.includes("=**")).map(t=>{
  const pattern=t.replace(/^\//,"").replace(/\{[^}]+\}/g,"*");
  return `      ${JSON.stringify([pattern,model.readDocs(t,true).length,model.readDocs(t,false).length,model.writeDocs(t)])}`.replace(/","/g,'","').replace(/\[\[/,"[[");
});
let client=fs.readFileSync(CLIENT,"utf8");
const next=client
  .replace(/const FSB_RULES_SHA256="[0-9a-f]{64}";/,`const FSB_RULES_SHA256="${sha}";`)
  .replace(/(const FSB_RULES_LOOKUPS=Object\.freeze\(\[\n)[\s\S]*?(\n  \]\.map\(row=>)/,(_m,a,b)=>a+rows.join(",\n")+b);
const table=JSON.parse(fs.readFileSync(TABLE,"utf8"));
const tableStale=table.rulesSha256!==sha;
if(process.argv.includes("--check")){
  const stale=next!==client||tableStale;
  console.log(stale?"STALE: run node tests/support/regenerate-fsb-lookup-table.cjs":"up to date");process.exit(stale?1:0);
}
fs.writeFileSync(CLIENT,next);
if(tableStale){table.rulesSha256=sha;table.reviewedAt=new Date().toISOString().slice(0,10);fs.writeFileSync(TABLE,JSON.stringify(table,null,2)+"\n");}
console.log(`client table: ${rows.length} rows, Rules ${sha}${next===client?" (unchanged)":" (rewritten)"}; billed-reads-table pin ${tableStale?"updated":"unchanged"}`);
