const assert=require("node:assert/strict");
const fs=require("node:fs");
const manifest=JSON.parse(fs.readFileSync("CURRENT_PRODUCT_TEST_MANIFEST.json","utf8"));
const forbidden=["NEXT_TASK.md","00_CURRENT_HANDOFF.md","WORK_ENVIRONMENT_STATUS.json","WORK_ENVIRONMENT_ARCHIVE","START_NEXT_SESSION","SUCCESSOR_HANDOFF","REMOTE_JOINING_READINESS.json"];
function executableSource(source){return String(source).split(/\r?\n/).filter(line=>!/^[ \t]*(?:\/\/|\/\*|\*|\*\/)/.test(line)).join("\n");}
function dependencyPattern(name){const e=name.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");return new RegExp(`(?:readFileSync|readJson|read|require)[ \\t]*\\([\\s\\S]{0,180}?["'](?:[^"']*/)?${e}["']`,"m");}
const offenders=[];
for(const file of manifest.tests){
  const src=executableSource(fs.readFileSync(file,"utf8"));
  for(const name of forbidden)if(dependencyPattern(name).test(src))offenders.push(`${file} -> ${name}`);
}
assert.deepEqual(offenders,[],`GP-2 current product gates must not import process/completed-readiness authority:\n${offenders.join("\n")}`);
const commentOnly=`// read("NEXT_TASK.md") documents a forbidden dependency\nconst live=read("CURRENT_PRODUCT_GUARDS.json");`;
assert.equal(dependencyPattern("NEXT_TASK.md").test(executableSource(commentOnly)),false,"GP-2 must ignore explanatory comments.");
assert.equal(dependencyPattern("NEXT_TASK.md").test(executableSource(`const next=read("NEXT_TASK.md");`)),true,"GP-2 must detect real dependencies.");
console.log(`PASS GP-2 gate relevance/purity (${manifest.tests.length} blocking tests scanned for executable process-authority imports).`);
