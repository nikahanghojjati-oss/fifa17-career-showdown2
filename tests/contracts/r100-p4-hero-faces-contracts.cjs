"use strict";
// r100 Duet P4 hero faces (Nik 2026-11-26): fixed hero pictures are checked against the pictures they replace.
//   N1 every fixed file in tests/fixtures/team-v/P4_*_NEVER_SLIMMER.json is the file on disk (its sha256), so the
//      never-slimmer result below is about the picture that ships (tools/hero-faces/never_slimmer.py writes the fixture).
//   N2 never slimmer: walking the hero outline, the fixed hero never starts further in than today's (short_pts 0), so no
//      room shows where the man used to be. Today's pictures measured against themselves give 0 too.
//   N3 the room around the man is today's room. Wooden: pixels outside the outline that moved by more than 12 stay WebP
//      noise (at most 0.1% of the picture). Every themed copy (lead A-41, 2026-11-27): its room is exactly what paint.py
//      builds from the approved painting and the current Wooden men, 0 pixels different; the Showdown Gate's L1 step
//      archive_rebuild proves that with the pinned encoder (tools/clubhouse-themes/reproduce_archive.py), and this file
//      checks that the step is there, runs that tool, installs exactly paint.py's ENCODER_PIP, and that the tool covers
//      every themed Archive file below.
//   O1 the game never loads the old picture: each fixed file differs from the one it replaces, and the old file's sha256 is
//      pinned nowhere (PREMIUM_FILES.json, the plate pins, the face fixtures), while the new one is pinned for every
//      premium (themed) copy. Fixed files keep their names; the image cache is keyed by RUNTIME_REVISION, which the release
//      moves, so nobody keeps the old bytes.
//   C1 every clubhouse in the game is covered (lead N-3, 2026-11-27): the clubhouse list is read from the themed plate folders
//      and paint.py's THEME table, never typed here, so a new clubhouse (Ruby, Emerald, Lapis...) fails these checks until
//      each face fix reaches it. Material clubhouses take their men from the current Wooden plates.
//   F3 League Roulette (Nik 2026-11-26): every clubhouse's V4 Box room keeps the men's whole hair (paint.py hair_over_empty).
//      Pixel proof in tests/fixtures/team-v/P4_F3_LEAGUE_HAIR.json (tools/hero-faces/league_hair.py): outside the pulled-in
//      cut, the Wooden hair band matches the Wooden plate (5-9 levels mean) instead of the painted wall (60-93 before the fix).
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
const PLATES = "visual-assets/v10_1/plates-hc";
const folders = fs.readdirSync(path.join(ROOT, PLATES), { withFileTypes: true }).filter(d => d.isDirectory()).map(d => d.name).sort();
const paintThemes = [...read("tools/clubhouse-themes/paint.py").toString("utf8").match(/^THEME = \{([^}]*)\}/m)[1]
  .matchAll(/"[A-Z_]+": "([a-z_]+)"/g)].map(m => m[1]).sort();
const CLUBHOUSES = ["", ...folders.map(f => `${f}/`)];

// N3 for themed copies: the Gate rebuilds them (A-41). Check the wiring here, so a removed step or a drifted pin fails.
const THEMED = /plates-hc\/[a-z]+\//;
const gate = read(".github/workflows/showdown-gate.yml").toString("utf8");
const paintPy = read("tools/clubhouse-themes/paint.py").toString("utf8");
const reproPy = read("tools/clubhouse-themes/reproduce_archive.py").toString("utf8");
const encoderPip = (paintPy.match(/^ENCODER_PIP = "([^"]+)"/m) || [])[1];
const rebuildStep = (() => {
  const l1 = gate.split(/\n  l1-core:\n/)[1]?.split(/\n  [a-z0-9-]+:\n/)[0] || "";
  return /\n        id: archive_rebuild\n        run: '"\$RUNNER_TEMP\/paint-env\/bin\/python" tools\/clubhouse-themes\/reproduce_archive\.py'\n/.test(l1)
    && !/id: archive_rebuild\n        if:/.test(l1) && l1.includes(`/bin/pip" install --disable-pip-version-check ${encoderPip}\n`);
})();
check("N3 themed copies: Gate L1 rebuilds every themed Archive plate with exactly paint.py's encoder (A-41)", () => {
  assert.ok(encoderPip && /^Pillow==\S+ numpy==\S+$/.test(encoderPip), "paint.py records ENCODER_PIP");
  assert.ok(reproPy.includes(`PIP = "${encoderPip}"`), "reproduce_archive.py's PIP is paint.py's ENCODER_PIP");
  assert.ok(/have != paint\.ENCODER:\n    setup_error/.test(reproPy), "a different encoder is a setup error, never a skip");
  assert.ok(/t\[3\] == "ARCHIVE" and t\[0\] != "wooden"/.test(reproPy), "the rebuild covers every themed Archive target");
  assert.ok(/room_diff == 0/.test(reproPy), "the room must match exactly");
  assert.ok(rebuildStep, "L1 installs ENCODER_PIP and runs reproduce_archive.py as step archive_rebuild, with no condition");
});

check("C1 the clubhouse list is every themed plate folder, and paint.py paints exactly those", () => {
  assert.ok(folders.length >= 3, "silver, black and matte at least");
  assert.deepEqual(folders, paintThemes, "a themed plate folder and paint.py's THEME table disagree");
});

check("at least one P4 fix is recorded, and F-1 Legacy Nik covers the 5 archive files in every clubhouse", () => {
  assert.ok(fixtures.includes("P4_F1_LEGACY_NIK_NEVER_SLIMMER.json"));
  const f1 = JSON.parse(read(`${FIX_DIR}/P4_F1_LEGACY_NIK_NEVER_SLIMMER.json`));
  const names = Object.keys(f1.files);
  for (const theme of CLUBHOUSES)
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
      if (THEMED.test(rel)) {
        assert.ok(/ENV_ARCHIVE_/.test(rel), "a themed fix outside the Archive needs its own rebuild proof");
        assert.ok(rebuildStep, "Showdown Gate L1 has no archive_rebuild step (tools/clubhouse-themes/reproduce_archive.py)");
      } else {
        assert.ok(r.room_moved_px <= 0.001 * r.size[0] * r.size[1], `${r.room_moved_px} room pixels moved`);
      }
    });
    check(`${name} ${short}: O1 the game never loads the old picture`, () => {
      assert.notEqual(r.sha256, r.before_sha256);
      assert.ok(!pins.includes(r.before_sha256), "the replaced picture is still pinned somewhere");
      if (premium[rel]) assert.equal(premium[rel].sha256, r.sha256, "PREMIUM_FILES.json lists the new picture");
      assert.ok(pins.includes(r.sha256), "the new picture is pinned");
    });
  }
}
const hair = JSON.parse(read(`${FIX_DIR}/P4_F3_LEAGUE_HAIR.json`));
check("F3 the League Roulette hair proof covers every clubhouse", () => {
  assert.deepEqual([...hair.clubhouses].sort(), folders, "re-run tools/hero-faces/league_hair.py: a clubhouse is missing");
  assert.ok(hair.max_mean <= 20);
});
for (const theme of folders) check(`F3 ${theme}: the League Roulette room keeps the men's whole hair (paint.py hair_over_empty)`, () => {
  const P = read("tools/clubhouse-themes/paint.py").toString("utf8");
  assert.match(P, /if mask == HAIR_MASK:[^\n]*\n\s+laid, hair = hair_over_empty\(wood, src, wood\.size\)/, "the V4 Box desktop files take the hair matte");
  for (const size of ["1920", "1X", "2X"]) {
    const rel = `${PLATES}/${theme}/ENV_BOX_PLATE_HC_V4_${size}.webp`;
    const r = hair.files[rel];
    assert.ok(r, `${rel} is measured (tools/hero-faces/league_hair.py)`);
    assert.equal(sha(rel), r.sha256, `${rel} changed since it was measured: re-run tools/hero-faces/league_hair.py`);
    assert.ok(r.band_px > 1000 && r.band_mean <= hair.max_mean, `${rel}: hair band ${r.band_mean} levels off the Wooden hair`);
    assert.equal(premium[rel] && premium[rel].sha256, r.sha256, `${rel} is listed as a premium file with its own bytes`);
    assert.ok(pins.includes(r.sha256), `${rel} is pinned`);
  }
});
console.log(`${passed} r100 P4 hero-face checks passed`);
