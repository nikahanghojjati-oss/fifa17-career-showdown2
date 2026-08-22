const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const root=path.resolve(__dirname,"../..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const html=read("index.html"),app=read("js/app.js"),worker=read("service-worker.js"),manifest=read("manifest.webmanifest"),release=read("RELEASE_V1.7.0_R2.md");
assert.match(app,/const APP_VERSION = "1\.7\.0";/);
assert.match(html,/app-asset-revision" content="1\.7\.0-r2"/);
assert.match(worker,/const RUNTIME_REVISION = "1\.7\.0-r2";/);
assert.match(worker,/const PREVIOUS_RUNTIME_REVISION = "1\.6\.0-r1";/);
assert.match(html,/<footer>Career Mode Showdown<br>v1\.7\.0 · Connected Rivalry<\/footer>/);
assert.match(html,/<span class="menuTileCode">LOCAL<\/span><span class="menuTileLabel">SAVE LIBRARY<\/span><span class="menuTileMeta">Local Showdowns, manager profiles and settings<\/span>/);
assert.match(release,/Runtime asset revision: `1\.7\.0-r2`/);
assert.match(release,/Previous known-good runtime: `1\.6\.0-r1`/);
assert.match(manifest,/1\.7\.0-r2/);
const active=["index.html","manifest.webmanifest","service-worker.js"];
for(const dir of ["js","css","data"]){for(const name of fs.readdirSync(path.join(root,dir)).filter(n=>/\.(?:js|css)$/.test(n)))active.push(`${dir}/${name}`);}
const stale=active.filter(file=>read(file).includes("1.7.0-r1"));
assert.deepEqual(stale,[],`Changed r1 public runtime identity leaked into r2 surfaces: ${stale.join(", ")}`);
console.log("PASS v1.7.0-r2 shell coherence: immutable namespace, stable release identity and 1.6.0-r1 recovery target.");
