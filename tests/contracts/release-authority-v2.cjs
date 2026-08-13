const assert=require("node:assert/strict");
const fs=require("node:fs");
const read=file=>fs.readFileSync(file,"utf8");
const pkg=JSON.parse(read("package.json"));
const lock=JSON.parse(read("package-lock.json"));
const version=pkg.version;
const revision=`${version}-r1`;
const app=read("js/app.js");
const shell=read("index.html");
const menu=read("js/menuExperience.js");
const releasePath=`RELEASE_V${version}.md`;
const handoffPath=`CAREER_MODE_SHOWDOWN_V${version}_MAINTENANCE_HANDOFF.md`;

assert.match(version,/^\d+\.\d+\.\d+$/);
assert.equal(lock.version,version,"package-lock root version must match package.json.");
assert.equal(lock.packages?.[""]?.version,version,"package-lock root package version must match package.json.");
assert.ok(app.includes(`const APP_VERSION = "${version}";`),"APP_VERSION must match package identity.");
assert.ok(shell.includes(`name="app-asset-revision" content="${revision}"`),"Shell revision meta must match package identity.");
assert.ok(shell.includes(`v${version} · Stable`),"Visible footer must identify the current candidate/release.");
assert.ok(menu.includes(`assets/marco-reus-2015-cc-by.webp?v=${revision}`),"Home Reus asset revision must match the shell.");
const eager=[...shell.matchAll(/(?:src|href)="((?:js|css)\/[^"?#]+)(?:\?v=([^"#]+))?/g)].map(m=>({file:m[1],rev:m[2]||""}));
assert.equal(eager.filter(x=>x.file.startsWith("js/")).length,7,"Protected eager shell must remain seven scripts.");
assert.deepEqual(eager.filter(x=>x.rev!==revision),[],"Every eager JS/CSS reference must use the current revision.");

assert.ok(fs.existsSync(releasePath),`${releasePath} must exist.`);
assert.ok(fs.existsSync(handoffPath),`${handoffPath} must exist.`);
const release=read(releasePath),handoff=read(handoffPath);
const start=read("00_DEVELOPER_START_HERE.md"),next=read("NEXT_TASK.md"),state=read("PROJECT_STATE.md"),readme=read("README.md"),roadmap=read("POST_V1_ROADMAP_EXECUTION.md"),changelog=read("CHANGELOG.md"),cloud=read("CLOUD_STORAGE_FOUNDATION.md");
const candidate=/Status:\s*RELEASE CANDIDATE/i.test(release);
assert.ok(release.includes(`Release tag: \`v${version}\``),"Release tag is stale.");
assert.ok(release.includes(`Runtime asset revision: \`${revision}\``),"Release runtime revision is stale.");
assert.ok(handoff.includes(`v${version}`)&&handoff.includes(revision),"Maintenance handoff must identify the current candidate/release.");
for(const [file,text] of [["NEXT_TASK.md",next],["PROJECT_STATE.md",state]]){
  assert.ok(text.includes(`v${version}`),`${file} must identify the current candidate/release.`);
  assert.ok(text.includes(revision),`${file} must identify the current runtime revision.`);
}

const heading=changelog.match(/^# v(\d+\.\d+\.\d+)\s+—/m);
assert.ok(heading,"CHANGELOG must begin with a versioned production heading.");
const publishedVersion=heading[1];
const publishedRevision=(changelog.slice(0,1200).match(/Runtime asset revision:\s*\*\*`([^`]+)`\*\*/)||[])[1]||`${publishedVersion}-r1`;
if(candidate){
  assert.notEqual(publishedVersion,version,"Candidate CHANGELOG must remain on the last promoted production release.");
  assert.ok(readme.includes(`v${publishedVersion}`)&&/production-proven|production proven/i.test(readme),"README must preserve the last deployed production truth during candidate work.");
  assert.ok(start.includes(`v${publishedVersion}`),"Developer bootstrap must retain the last production baseline during candidate work.");
  assert.ok(start.includes(`v${version}`)||start.includes(version),"Developer bootstrap must also identify the active candidate.");
  assert.ok(changelog.slice(0,1200).includes(publishedRevision),"Candidate CHANGELOG must preserve the last production runtime revision.");
}else{
  assert.equal(publishedVersion,version,"Promoted CHANGELOG must begin with the current release.");
  for(const [file,text] of [["README.md",readme],["PROJECT_STATE.md",state],["NEXT_TASK.md",next],["00_DEVELOPER_START_HERE.md",start],["POST_V1_ROADMAP_EXECUTION.md",roadmap]]){
    assert.ok(text.includes(`v${version}`)||text.includes(version),`${file} must acknowledge promoted release ${version}.`);
    assert.ok(text.includes(revision),`${file} must acknowledge promoted runtime revision ${revision}.`);
  }
}

for(const [file,text] of [["README.md",readme],["PROJECT_STATE.md",state],["NEXT_TASK.md",next],["00_DEVELOPER_START_HERE.md",start],[handoffPath,handoff]]){
  assert.ok(/transaction-owned|mutation-owned/i.test(text),`${file} lost rollback ownership semantics.`);
  assert.ok(/strict exact raw|strict snapshot|exact raw snapshot/i.test(text),`${file} lost exact destructive snapshot authority.`);
  assert.ok(/Installable Offline App/i.test(text),`${file} lost the proven offline milestone.`);
  assert.ok(!/roll(?:s|ed|ing)? every affected key/i.test(text),`${file} reintroduced over-broad rollback semantics.`);
}

for(const term of ["accountId","profileId","saveId","deviceId","installationId","baseRevision","tombstone","compare-and-swap"]){assert.ok(cloud.includes(term),`Cloud foundation lost ${term}.`);}
assert.ok(cloud.includes("v1.2.0 Installable Offline App"),"Cloud foundation must preserve the proven offline baseline.");
assert.match(cloud,/v1\.3\.0[^\n]+Recovery[^\n]+Device Resilience Hardening/i,"Cloud foundation must recognize current v1.3 hardening.");
assert.match(cloud,/No future cloud module may call localStorage directly/i,"Cloud sync must remain behind canonical storage authority.");
assert.ok(/future|no cloud backend|no cloud runtime|does not add/i.test(readme+state+next),"Current authority must keep cloud future-only.");
assert.ok(roadmap.includes("v1.1 Data Safety and Recovery is also functionally complete"),"Roadmap must keep v1.1 recovery historical and complete.");
assert.ok(roadmap.includes("old r5 James/Rashford/Martial acceptance condition is historical"),"Roadmap must keep old r5 visual exit condition historical.");
assert.ok(next.includes("14 permanent workflow families")&&next.includes("27 protected"),"NEXT_TASK lost protected CI topology.");
const topology=read("tests/support/run-workflow-blocks.cjs");
assert.ok(topology.includes('assert.equal(executed, 27'),"Authoritative workflow topology must retain 27 blocks.");

console.log(`PASS  version-resilient release authority for v${version} / ${revision}; published baseline v${publishedVersion} / ${publishedRevision}; candidate=${candidate}`);
