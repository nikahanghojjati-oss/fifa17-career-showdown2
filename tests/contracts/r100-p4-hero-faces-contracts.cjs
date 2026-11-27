"use strict";
// r100 Duet P4 hero faces (Nik 2026-11-26): fixed hero pictures are checked against the pictures they replace.
//   N1 every fixed file in tests/fixtures/team-v/P4_*_NEVER_SLIMMER.json is the file on disk (its sha256), so the
//      never-slimmer result below is about the picture that ships (tools/hero-faces/never_slimmer.py writes the fixture).
//   N2 never slimmer: walking the hero outline, the fixed hero never starts further in than today's (short_pts 0), so no
//      room shows where the man used to be. Today's pictures measured against themselves give 0 too.
//   N3 the room around the man is today's room: pixels outside the outline that moved by more than 12 stay WebP noise
//      (at most 0.1% of the picture; themed copies are re-encoded by paint.py).
//   O1 the game never loads the old picture: each fixed file differs from the one it replaces, and the old file's sha256 is
//      pinned nowhere (PREMIUM_FILES.json, the plate pins, the face fixtures), while the new one is pinned for every
//      premium (themed) copy. Fixed files keep their names; the image cache is keyed by RUNTIME_REVISION, which the release
//      moves, so nobody keeps the old bytes.
// Run: node tests/contracts/r100-p4-hero-faces-contracts.cjs
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const ROOT = path.resolve(__dirname, "../..");
const read = file => fs.readFileSync(path.join(ROOT, file));
const sha = file => crypto.createHash("sha256").update(read(file)).digest("hex");
let passed = 0;
function check(name, f) { f(); passed += 1; console.log(`ok ${passed} ${name}`); }

const FIX_DIR = "tests/fixtures/team-v";
const fixtures = fs.readdirSync(path.join(ROOT, FIX_DIR)).filter(n => /^P4_.*_NEVER_SLIMMER\.json$/.test(n));
const premium = JSON.parse(read("tools/clubhouse-themes/PREMIUM_FILES.json")).files;
const PIN_FILES = ["tools/clubhouse-themes/PREMIUM_FILES.json", "tests/contracts/v10-foundation-contracts.cjs",
  ...fs.readdirSync(path.join(ROOT, FIX_DIR)).filter(n => n.endsWith(".json") && !/NEVER_SLIMMER/.test(n)).map(n => `${FIX_DIR}/${n}`)];
const pins = PIN_FILES.map(f => read(f).toString("utf8")).join("\n");

check("at least one P4 fix is recorded, and F-1 Legacy Nik covers all 25 archive files (Ruby too, N-29)", () => {
  assert.ok(fixtures.includes("P4_F1_LEGACY_NIK_NEVER_SLIMMER.json"));
  const f1 = JSON.parse(read(`${FIX_DIR}/P4_F1_LEGACY_NIK_NEVER_SLIMMER.json`));
  const names = Object.keys(f1.files);
  for (const theme of ["", "black/", "matte/", "silver/", "ruby/"])
    for (const n of ["PLATE_HC_V3_2X", "PLATE_HC_V3_1X", "PLATE_HC_V3_1920", "PHONE_HC_V3", "PHONE_HC_V3_590W"])
      assert.ok(names.includes(`visual-assets/v10_1/plates-hc/${theme}ENV_ARCHIVE_${n}.webp`), `${theme}${n}`);
  assert.equal(f1.side, "right", "Nik stays image-right");
});

for (const name of fixtures) {
  const fx = JSON.parse(read(`${FIX_DIR}/${name}`));
  for (const [rel, r] of Object.entries(fx.files)) {
    const short = rel.replace("visual-assets/v10_1/plates-hc/", "");
    check(`${name} ${short}: N1 the fixture is about the shipped file`, () => {
      assert.equal(sha(rel), r.sha256, "re-run tools/hero-faces/never_slimmer.py after rebuilding the picture");
    });
    check(`${name} ${short}: N2 never slimmer`, () => {
      assert.ok(r.outline_pts > 500, "the whole outline was walked");
      assert.equal(r.short_pts, 0, "the hero starts further in than today's outline");
    });
    check(`${name} ${short}: N3 the room around him is unchanged`, () => {
      assert.ok(r.room_moved_px <= 0.001 * r.size[0] * r.size[1], `${r.room_moved_px} room pixels moved`);
    });
    check(`${name} ${short}: O1 the game never loads the old picture`, () => {
      assert.notEqual(r.sha256, r.before_sha256);
      assert.ok(!pins.includes(r.before_sha256), "the replaced picture is still pinned somewhere");
      if (premium[rel]) assert.equal(premium[rel].sha256, r.sha256, "PREMIUM_FILES.json lists the new picture");
      assert.ok(pins.includes(r.sha256), "the new picture is pinned");
    });
  }
}
console.log(`${passed} r100 P4 hero-face checks passed`);
