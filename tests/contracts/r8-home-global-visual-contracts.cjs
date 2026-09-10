const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const root = path.resolve(__dirname, "../..");
const read = relative => fs.readFileSync(path.join(root, relative), "utf8");
const exists = relative => fs.existsSync(path.join(root, relative));
const sha256 = relative => crypto.createHash("sha256").update(fs.readFileSync(path.join(root, relative))).digest("hex");

const cssPath = "css/r8-black-gold-presentation.css";
const jsPath = "js/r8-final-art-layer.js";
const appPath = "js/app.js";
const homeAuditPath = "tests/browser/home-visual-audit.cjs";
const nikPath = "assets/visual/r8/a01-nik-core-thinking-hero.png";
const danielPath = "assets/visual/r8/a02-daniel-core-pointing-hero.png";

const expected = Object.freeze({
    nik: "17972b8afb73b90483c8f874c4bd964ac1bda196daa76e134a6030676bbd4219",
    daniel: "9b1545b52a5d96a240c92b9901dcd8a4558148dde05a0331882df7bd988177cc"
});

for(const file of [cssPath, jsPath, appPath, homeAuditPath]){
    assert.ok(exists(file), `Missing R8.25 first-slice file: ${file}`);
}

const css = read(cssPath);
const js = read(jsPath);
const app = read(appPath);
const audit = read(homeAuditPath);

assert.match(css, /html\[data-r8-visual="active"\]/, "R8 presentation must remain behind an explicit root gate.");
assert.match(css, /#appRuntimeNotice button:focus-visible/, "R8 first slice must add explicit runtime-notice dismiss focus styling.");
assert.match(css, /#mainMenu \.menuCoverAthlete[\s\S]*display:none !important/, "R8 must suppress Home Reus only while the R8 gate is active.");
assert.match(css, /#mainMenu #menuAthleteCredit[\s\S]*display:none !important/, "R8 must suppress the Home Reus credit together with Home Reus.");
assert.match(css, /\.r8FinalArtLayer[\s\S]*pointer-events:none !important/, "Final art must never hit-test.");
assert.match(css, /\.r8FinalArtLayer[\s\S]*overflow:hidden/, "Final art must remain overflow-contained.");
assert.match(css, /@media\(max-width:1179px\)[\s\S]*\.r8CharacterLayer[\s\S]*display:none !important/, "Large R8 characters must be omitted at Chromebook/mobile widths.");
assert.match(css, /@media\(prefers-reduced-motion:reduce\)/, "R8 presentation must preserve reduced-motion handling.");

assert.match(js, /A01_NIK_CORE_THINKING_HERO/, "A01 frozen asset identity missing.");
assert.match(js, /A02_DANIEL_CORE_POINTING_HERO/, "A02 frozen asset identity missing.");
assert.match(js, new RegExp(expected.nik), "A01 frozen hash authority missing from R8 controller.");
assert.match(js, new RegExp(expected.daniel), "A02 frozen hash authority missing from R8 controller.");
assert.match(js, /assets\/visual\/r8\/a01-nik-core-thinking-hero\.png/, "A01 deploy path changed.");
assert.match(js, /assets\/visual\/r8\/a02-daniel-core-pointing-hero\.png/, "A02 deploy path changed.");
assert.match(js, /setAttribute\("aria-hidden", "true"\)/, "Decorative R8 nodes must be aria-hidden.");
assert.match(js, /querySelector\([\s\S]*button,input,select,textarea,a\[href\]/, "R8 controller must reject focusable descendants.");
assert.match(js, /writesStorage:false/, "R8 diagnostics must declare no storage writes.");
assert.match(js, /writesFirebase:false/, "R8 diagnostics must declare no Firebase writes.");
assert.doesNotMatch(js, /\blocalStorage\s*\.|\bsessionStorage\s*\.|\bindexedDB\s*\.|\bfirebase\s*\.|\bfirestore\s*\./i, "R8 final-art controller must not call persistence/provider APIs.");
assert.doesNotMatch(js, /\bfetch\s*\(|\bXMLHttpRequest\b|\bnavigator\.sendBeacon\b/, "R8 final-art controller must not create a network protocol.");

assert.match(app, /data-r8-visual-entry="r8-25"/, "Application bootstrap must install the bounded R8 entry exactly once.");
assert.match(app, /data-visual-fidelity="reus-r3"[\s\S]*r8v\(\)/, "R8 entry must be installed after protected visual fidelity is requested.");
assert.match(app, /Existing visuals remain available/, "R8 bootstrap failure must fall back to existing visuals.");
assert.doesNotMatch(app, /marco-reus-2015-cc-by\.webp/, "R8 bootstrap must not replace or rewrite the protected loading Reus asset.");

assert.match(audit, /1600, height: 900/, "R8 Home browser acceptance must include 1600x900.");
assert.match(audit, /1024, height: 768/, "R8 Home browser acceptance must include 1024x768.");
assert.match(audit, /390, height: 844/, "R8 Home browser acceptance must include 390x844.");
assert.match(audit, /CareerModeR8FinalArt\.disable/, "R8 Home browser acceptance must prove reversibility.");
assert.match(audit, /getMenuExperienceIntegrity/, "R8 Home browser acceptance must preserve menu/media behavior integrity.");

assert.ok(exists(nikPath), `Frozen A01 binary is required at ${nikPath}`);
assert.ok(exists(danielPath), `Frozen A02 binary is required at ${danielPath}`);
assert.equal(sha256(nikPath), expected.nik, "A01 deployed bytes do not match owner-frozen authority.");
assert.equal(sha256(danielPath), expected.daniel, "A02 deployed bytes do not match owner-frozen authority.");

console.log("PASS R8.25 bounded Home/global visual contracts: reversible presentation, noninterference, responsive omission, frozen-byte integrity, and browser acceptance coverage are sealed.");
