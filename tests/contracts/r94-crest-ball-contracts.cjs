"use strict";
// R94 ball slot: R94-02's 3D Club Assignment spin puts six club crests on two balls at about 512 px. Every club with an image
// crest ships a 512 px file next to its 64 and 256 px files; the "ball" slot asks for 512, falls back to 256 when that file
// fails, then to the drawn SVG crest. The 512 files load on demand (runtime image cache), never in the service-worker precache.
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const root=path.join(__dirname,"..","..");
const read=f=>fs.readFileSync(path.join(root,f),"utf8");
const src=read("js/visualIdentity.js");
let checks=0;const ok=(cond,msg)=>{assert.ok(cond,msg);checks++;};

// A fake Image: a file listed in `broken` fails, any other loads.
const broken=new Set();
class FakeImage{set src(v){this._src=v;queueMicrotask(()=>broken.has(v.replace(/^.*\//,""))?this.onerror&&this.onerror():this.onload&&this.onload());}get src(){return this._src;}}
const sandbox={console,URL,queueMicrotask,Image:FakeImage};sandbox.window=sandbox;
vm.createContext(sandbox);vm.runInContext(src,sandbox,{filename:"visualIdentity.js"});
const V=sandbox;

const files=JSON.parse(JSON.stringify(vm.runInContext("CREST_IMAGE_FILES",sandbox)));
const clubs=Object.keys(files);
ok(clubs.length===98,"B1 98 clubs carry an image crest");
const dir="visual-assets/v10_1/crests/";
const missing=[];for(const stem of new Set(Object.values(files)))for(const size of [64,256,512])if(!fs.existsSync(path.join(root,dir,`CREST_IMG_${stem}_V1_${size}.webp`)))missing.push(`${stem}_${size}`);
ok(missing.length===0,"B2 every club has its 64, 256 and 512 px files: "+missing.join(", "));

// WebP VP8X header: canvas width-1 and height-1 as 24-bit little-endian at bytes 24 and 27.
const dims=f=>{const b=fs.readFileSync(path.join(root,dir,f));if(b.toString("ascii",12,16)!=="VP8X")return null;return [1+b.readUIntLE(24,3),1+b.readUIntLE(27,3)];};
const wrong=[...new Set(Object.values(files))].filter(stem=>{const d=dims(`CREST_IMG_${stem}_V1_512.webp`);return !d||d[0]!==427||d[1]!==512;});
ok(wrong.length===0,"B3 every ball crest is a 427x512 WebP with alpha: "+wrong.join(", "));

(async()=>{
  const club="Real Madrid";
  ok(/CREST_IMG_REALMADRID_V1_512\.webp$/.test(V.getClubCrestImageUrl(club,"ball")),"B4 the ball slot asks for the 512 px file");
  ok(/_256\.webp$/.test(V.getClubCrestImageUrl(club,"big"))&&/_64\.webp$/.test(V.getClubCrestImageUrl(club,"list")),"B5 the big and list slots are unchanged");
  ok(/data-crest-slot="ball"/.test(V.getClubCrestMarkup(club,"ball"))&&/_512\.webp/.test(V.getClubCrestMarkup(club,"ball")),"B6 page markup for the ball slot carries its slot, so a failed file falls back to the next size");
  const good=await V.loadClubCrestImage("Barcelona","ball");
  ok(good&&/_512\.webp$/.test(good.src),"B7 a ball crest that loads is the 512 px file");
  broken.add("CREST_IMG_CHELSEA_V1_512.webp");
  const fallback=await V.loadClubCrestImage("Chelsea","ball");
  ok(fallback&&/CREST_IMG_CHELSEA_V1_256\.webp$/.test(fallback.src)&&/_256\.webp$/.test(V.getClubCrestImageUrl("Chelsea","ball")),"B8 a failed 512 falls back to the 256 px file and is not asked for again");
  broken.add("CREST_IMG_TORINO_V1_512.webp");broken.add("CREST_IMG_TORINO_V1_256.webp");
  const none=await V.loadClubCrestImage("Torino","ball");
  ok(none===null&&V.getClubCrestImageUrl("Torino","ball")===""&&(m=>m.startsWith("<svg")&&!/data-crest-image|<image/.test(m))(V.getClubCrestMarkup("Torino","ball")),"B9 when both fail the caller gets null and the page gets the drawn SVG crest");
  ok(V.getClubCrestImageUrl("Ajax","ball")===""&&(await V.loadClubCrestImage("Ajax","ball"))===null,"B10 a club with no image crest keeps its SVG crest");

  const sw=read("service-worker.js");
  ok(!/CREST_IMG_[A-Z]+_V1_512/.test(sw)&&!/crests\/[^"']*512/.test(sw),"B11 no ball crest is in the service-worker precache (they load on demand into the runtime image cache)");
  ok(/V10_IMAGE_PATH/.test(sw),"B11 the runtime image cache that holds them is still there");
  const pinned=read("tests/contracts/v10-foundation-contracts.cjs");
  const unpinned=[...new Set(Object.values(files))].filter(stem=>!new RegExp(`CREST_IMG_${stem}_V1_512\\.webp":"[0-9a-f]{64}"`).test(pinned));
  ok(unpinned.length===0,"B12 every ball crest is pinned with its SHA-256 in V10_IMAGES: "+unpinned.join(", "));
  console.log(`PASS r94 crest ball contracts (${checks} checks, ${clubs.length} clubs)`);
})().catch(e=>{console.error(e);process.exit(1);});
