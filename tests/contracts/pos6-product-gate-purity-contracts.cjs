const assert=require("node:assert/strict");
const fs=require("node:fs");
const manifest=JSON.parse(fs.readFileSync("CURRENT_PRODUCT_TEST_MANIFEST.json","utf8"));
const forbidden=[
  "NEXT_TASK.md",
  "00_CURRENT_HANDOFF.md",
  "WORK_ENVIRONMENT_STATUS.json",
  "WORK_ENVIRONMENT_ARCHIVE",
  "START_NEXT_SESSION",
  "SUCCESSOR_HANDOFF",
  "POS6_CONTINUITY_MODEL.json",
  "PROJECT_OPERATING_SYSTEM_V6.json"
];
function executableSource(source){return String(source).split(/\r?\n/).filter(line=>!/^[ \t]*(?:\/\/|\/\*|\*|\*\/)/.test(line)).join("\n");}
function dependencyPattern(name){const e=name.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");return new RegExp(`(?:readFileSync|readJson|read|require)[ \\t]*\\([\\s\\S]{0,180}?["'](?:[^"']*/)?${e}["']`,"m");}
const offenders=[];
for(const file of manifest.tests){
  const src=executableSource(fs.readFileSync(file,"utf8"));
  for(const name of forbidden)if(dependencyPattern(name).test(src))offenders.push(`${file} -> ${name}`);
}
assert.deepEqual(offenders,[],`POS6 current product gates must not import process/continuity authority:\n${offenders.join("\n")}`);
assert.equal(manifest.operatingSystem,"POS-6");
assert.equal(manifest.automaticOwner,"tests/support/run-current-product-contracts.cjs");
assert.equal(new Set(manifest.tests).size,manifest.tests.length,"POS6 current product tests must have exactly one automatic manifest entry.");
const commentOnly=`// read("NEXT_TASK.md") documents a forbidden dependency\nconst live=read("CURRENT_PRODUCT_GUARDS.json");`;
assert.equal(dependencyPattern("NEXT_TASK.md").test(executableSource(commentOnly)),false,"Purity scan must ignore explanatory comments.");
assert.equal(dependencyPattern("NEXT_TASK.md").test(executableSource(`const next=read("NEXT_TASK.md");`)),true,"Purity scan must detect real process dependencies.");
console.log(`PASS POS6 gate purity (${manifest.tests.length} blocking tests, one automatic owner, process authority excluded).`);
