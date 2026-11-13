"use strict";
// r91 old art (Sol's r90 review, Nik 2026-11-11: "old art comes back at some window shapes ... so that would never happen
// again"). Static half of the guard; tests/browser/r91-old-art-audit.cjs opens every screen at every window shape and is the
// proof that only current rooms are drawn. This contract keeps the code from drifting back:
//   C1 no Team G stylesheet or script gates art (a block with a url() or image-set()) on the retired desktop query (min-width 1024/1200 + min-height 600 +
//      min-aspect-ratio 3/2): outside it, Team V's base V1 plate showed. The art bands are now
//      desktop (min-width:901px), upright (max-width:900px) and (orientation:portrait), and sideways phones;
//   C2 references to retired pictures (Team V's V1 plates and cut-outs, the plates-v2/v3/v5 plates, the locked TR2 plate)
//      in Team G files may only go down: each file's count is pinned in tests/fixtures/r91-old-art-references.json
//      (rollback rules and Team V markup copies that are overridden today). A new reference fails; a removed one asks for
//      the pin to be lowered (node tests/contracts/r91-old-art-contracts.cjs --write);
//   C3 the browser audit stays in the Gate: its three groups are in package.json test:browser and the full grid has its
//      own npm script;
//   C4 the shared upright-window rule exists: windows wider than 900 held upright draw the room by width, so neither man
//      is cut off the side.
//   C5 sharp rooms (art ledger R4): windows wider than 1536 or taller than 864 draw the 1920px cut of each room at 1.25x
//      (its drawn size is the 1X plate's), on every screen that stands in one.
const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");

const root = path.resolve(__dirname, "../..");
const read = file => fs.readFileSync(path.join(root, file), "utf8");
const pinFile = "tests/fixtures/r91-old-art-references.json";
const files = [
    ...fs.readdirSync(path.join(root, "css")).filter(f => f.endsWith(".css")).map(f => "css/" + f),
    ...fs.readdirSync(path.join(root, "js")).filter(f => f.endsWith(".js")).map(f => "js/" + f),
    "index.html"
].sort();

// C1
const OLD_GATE = /\(\s*min-width\s*:\s*(1200|1024)px\s*\)\s*and\s*\(\s*min-height\s*:\s*600px\s*\)(\s*and\s*\(\s*(max|min)-height\s*:\s*\d+px\s*\))*\s*and\s*\(\s*min-aspect-ratio\s*:\s*3\s*\/\s*2\s*\)/;
// Only a block that draws a picture counts: a layout-only rule on that query (the Rule Book's card frames, #1413) draws no
// art, so no window shape can bring old art back through it. A block draws art when it holds a url() or image-set().
const blockAfter = (text, at) => { const open = text.indexOf("{", at); let depth = 0;
    for(let i = open; i < text.length; i++){ if(text[i] === "{") depth++; else if(text[i] === "}" && --depth === 0) return text.slice(open, i + 1); }
    return text.slice(open); };
const drawsArt = text => { const re = new RegExp(OLD_GATE.source, "g"); let m;
    while((m = re.exec(text))) if(/url\(|image-set\(/.test(blockAfter(text, m.index))) return true;
    return false; };
const gateHits = files.filter(f => drawsArt(read(f)));
assert.deepEqual(gateHits, [], `C1 the retired 3:2 desktop art gate is back in: ${gateHits.join(", ")}`);

// C2
const RETIRED = /(?:legacy|career-statistics|trophy-room|rivalry-statistics|season-results|final-winner|standings|start-join|home|settings|rule-book|league|club)\/assets\/(?:ENV|OVL)_[A-Za-z0-9_]+\.(?:webp|png)|plates-v[235]\/[A-Za-z0-9_]+\.(?:webp|png)|tr2\/slice-02-plate\/assets\/(?:ENV|OVL)_[A-Za-z0-9_]+\.(?:webp|png)/g;
const counts = {};
for(const f of files){ const n = (read(f).match(RETIRED) || []).length; if(n) counts[f] = n; }
if(process.argv.includes("--write")){
    fs.writeFileSync(path.join(root, pinFile), JSON.stringify({ note: "r91 old art: retired-picture references per Team G file; may only go down (tests/contracts/r91-old-art-contracts.cjs)", counts }, null, 1) + "\n");
    console.log(`wrote ${pinFile}`);
    process.exit(0);
}
const pinned = JSON.parse(read(pinFile)).counts;
const grew = Object.entries(counts).filter(([f, n]) => n > (pinned[f] || 0)).map(([f, n]) => `${f} ${pinned[f] || 0} -> ${n}`);
assert.deepEqual(grew, [], `C2 new references to retired pictures: ${grew.join("; ")}. Use the current room (visual-assets/v10_1/plates-hc/) instead.`);
const shrank = Object.entries(pinned).filter(([f, n]) => (counts[f] || 0) < n).map(([f, n]) => `${f} ${n} -> ${counts[f] || 0}`);
assert.deepEqual(shrank, [], `C2 retired references went down (good): lower the pin with --write: ${shrank.join("; ")}`);

// C3
const pkg = JSON.parse(read("package.json"));
for(const group of ["desk", "touch-up", "touch-side"]) assert.ok(pkg.scripts["test:browser"].includes(`CMS_OLD_ART_GROUP=${group} node tests/browser/r91-old-art-audit.cjs`), `C3 test:browser runs the ${group} old-art group`);
assert.match(pkg.scripts["test:old-art"] || "", /CMS_OLD_ART_GROUP=full node tests\/browser\/r91-old-art-audit\.cjs/, "C3 npm run test:old-art runs the full grid");
const audit = read("tests/browser/r91-old-art-audit.cjs");
for(const size of ["1920x866", "1920x1035", "1363x936", "820x1180", "1180x820", "1024x1366", "844x390", "390x844", "360x640", "3440x1440"]) assert.ok(audit.includes(`"${size}"`), `C3 the audit grid keeps ${size}`);
assert.match(audit, /sweep\(900, 0\.4, 2\.6, 0\.05\)/, "C3 the full grid keeps the 0.40-2.60 aspect sweep");

// C4
const shell = read("css/v10Shell.css"), rl = read("css/rivalryLegacyV10.css"), cs = read("js/careerScreensV10.js"), sf = read("js/seasonFinalV10.js");
assert.match(shell, /@media \(min-width:901px\) and \(orientation:portrait\) \{\s*#app :is\(#careerStatistics,#standings,#seasonEntry\) \.sd-stage \.sd-stage__registered \{ left:0; top:0; width:100%;/, "C4 tall windows: career screens draw the room by width");
assert.match(rl, /@media \(min-width:901px\) and \(orientation:portrait\) \{\s*#app #legacy\[data-rivalry-legacy-v10\] \{ --lg-rh:56\.25vw; \}/, "C4 tall windows: Legacy and Rivalry draw the room by width");
assert.match(cs, /@media \(min-width:901px\) and \(orientation:portrait\) \{\s*#app #trophyRoom \{--tr-k:calc\(100vw \/ 1536\)\}/, "C4 tall windows: Trophy Room draws the room by width");
assert.match(sf, /@media \(min-width:901px\) and \(orientation:portrait\) \{\s*#app main:has\(> #seasonEntry\.seasonScreenV10\.v10FinalMode:not\(\.hidden\)\) \{\s*--fw-k:calc\(100vw \/ 1536\);/, "C4 tall windows: Final Winner draws the room by width");

// C5
const BIG = "(min-width:1537px), (min-width:901px) and (min-height:865px)";
for(const room of ["ARCHIVE", "BOARD", "BOX", "HOME", "OFFICE", "TUNNEL", "HALL", "COACHES"]){
    const file = `visual-assets/v10_1/plates-hc/ENV_${room}_PLATE_HC_V3_1920.webp`;
    assert.ok(fs.existsSync(path.join(root, file)), `C5 ${file} exists`);
}
const sharp = { "css/homeV10.css": ["HOME"], "css/v10Shell.css": ["BOARD", "BOARD"], "css/v10Setup.css": ["BOX"], "css/v10Club.css": ["BOX"],
    "css/connectPlayersV10.css": ["TUNNEL"], "css/v10Transfer.css": ["OFFICE", "OFFICE"], "css/rivalryLegacyV10.css": ["ARCHIVE", "TUNNEL"],
    "js/seasonFinalV10.js": ["TUNNEL", "BOARD", "BOARD"], "js/careerScreensV10.js": ["ARCHIVE"] };
for(const [file, rooms] of Object.entries(sharp)){
    const text = read(file);
    assert.ok(text.split(BIG).length - 1 >= rooms.length, `C5 ${file} keeps its ${rooms.length} big-window room rule(s)`);
    for(const room of new Set(rooms)) assert.match(text, new RegExp(`ENV_${room}_PLATE_HC_V3_1920\\.webp[^ ]{0,6} 1\\.25x`), `C5 ${file} draws the ${room} 1920 cut at 1.25x`);
}
// HO-077: the Rule Book / Settings reading slab takes its 1920 cut on big windows too (2X master since 2026-11-13).
assert.ok(fs.existsSync(path.join(root, "visual-assets/v10_1/plates-hc/ENV_SLAB_HC_V1_1920.webp")), "C5 the slab's 1920 cut exists");
{ const rs = read("css/rulesSettingsV10.css");
  assert.ok(rs.includes(`@media ${BIG}`), "C5 Rule Book keeps its big-window slab rule");
  assert.match(rs, /ENV_SLAB_HC_V1_1920\.webp'\) 1\.25x/, "C5 Rule Book and Settings draw the slab's 1920 cut at 1.25x"); }
{ const cm = read("css/chamberMen.css");
  assert.ok(cm.includes(`@media ${BIG}`), "C5 Chamber Men keeps its big-window slab rule");
  assert.match(cm, /ENV_SLAB_HC_V1_1920\.webp"\) 1\.25x/, "C5 Chamber Men draws the slab's 1920 cut at 1.25x");
  assert.match(cm, /@media \(min-width: 761px\), \(orientation: landscape\) \{\s*html:is\(\[data-assets="2"\]/, "C5 Chamber Men's 2X slab stays off upright phones (they keep the phone slab)"); }
// HO-069 rooms: Start / Showdown Home (front hall) and Squad Management (coaches room) take their 1920 cut too.
assert.match(read("css/v10Setup.css"), /ENV_HALL_PLATE_HC_V3_1920\.webp[^ ]{0,6} 1\.25x/, "C5 Start draws the hall's 1920 cut at 1.25x");
assert.match(read("css/squadScreen.css"), /ENV_COACHES_PLATE_HC_V3_1920\.webp[^ ]{0,6} 1\.25x/, "C5 Squad Management draws the coaches room's 1920 cut at 1.25x");
assert.match(read("js/touchlineGazette.js"), /PLATE_HC_V3_1920\.webp":"PLATE_HC_V3_1X\.webp"/, "C5 the Gazette takes the board room's 1920 cut on big windows");

console.log(`PASS r91 old-art contracts (C1 no 3:2 art gate in ${files.length} files; C2 ${Object.keys(counts).length} files at or under their retired-reference pin; C3 audit in the Gate; C4 tall-window rooms; C5 sharp 1920 rooms).`);
