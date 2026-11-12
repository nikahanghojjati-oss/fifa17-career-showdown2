"use strict";
// r91 layout hunt (art state captures of 8004a4d): a drawn Showdown has no champion (Nik: no tiebreak anywhere, equal = DRAW),
// yet the Final Winner screen still wore the SHOWDOWN CHAMPION title. The words are a picture, so this pins both halves:
//   D1 a drawn frame swaps the title picture to TITLE_SHOWDOWN_DRAW_V2 (the SHOWDOWN half of the brush wordmark) and the
//      words for screen readers to SHOWDOWN DRAW; every other frame keeps SHOWDOWN CHAMPION
//   D2 the draw wordmark ships in all four sizes of the champion one, on the same canvas, so every layout box fits it
//   D3 no printed line of the draw stories (Gazette front pages, stories, dailies) names a champion
//   D4 the screen text for a draw says DRAW, never WINS or a winner's name
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ROOT = path.resolve(__dirname, "../..");
const read = file => fs.readFileSync(path.join(ROOT, file), "utf8");

// ---- D1: setTitleFor from the real final-winner.js, against a stand-in title element ----
const source = read("visual-assets/v10_1/final-winner/final-winner.js");
assert.match(source, /setTitleFor\(frame\.winner\)/, "D1 applyFrame sets the title from the frame's winner");
const start = source.indexOf("var WORDMARK_DIR");
const end = source.indexOf("function applyFrame");
assert.ok(start > 0 && end > start, "D1 the title swap sits before applyFrame");
function stand() {
  const img = { attrs: { src: "visual-assets/v10_1/shared/wordmarks/TITLE_FINAL_WINNER_V2_1920.webp" }, getAttribute(k) { return this.attrs[k]; }, setAttribute(k, v) { this.attrs[k] = v; } };
  const hidden = { textContent: "SHOWDOWN CHAMPION" };
  const title = { dataset: {}, querySelector: s => (s === "img" ? img : s === ".sd-visually-hidden" ? hidden : null) };
  const sandbox = { document: { getElementById: id => (id === "finalWinnerTitle" ? title : null) } };
  vm.createContext(sandbox);
  vm.runInContext(source.slice(start, end) + "\nthis.setTitleFor=setTitleFor;", sandbox);
  return { img, hidden, title, set: sandbox.setTitleFor };
}
{
  const s = stand();
  s.set("draw");
  assert.equal(s.hidden.textContent, "SHOWDOWN DRAW", "D1 a draw has no champion words for screen readers");
  assert.equal(s.title.dataset.titleKind, "draw");
  assert.match(s.img.attrs.src, /TITLE_SHOWDOWN_DRAW_V2_1920\.webp$/, "D1 a draw shows the SHOWDOWN picture");
  for (const w of [480, 960, 1920, 3840]) assert.ok(s.img.attrs.srcset.includes(`TITLE_SHOWDOWN_DRAW_V2_${w}.webp ${w}w`), `D1 srcset has ${w}w`);
  assert.doesNotMatch(s.img.attrs.srcset + s.img.attrs.src, /FINAL_WINNER/, "D1 no champion picture is left in a draw");
  for (const winner of ["daniel", "nik", "unconfirmed", undefined]) {
    s.set(winner);
    assert.equal(s.hidden.textContent, "SHOWDOWN CHAMPION", `D1 ${winner} keeps the champion title`);
    assert.match(s.img.attrs.src, /TITLE_FINAL_WINNER_V2_1920\.webp$/);
    assert.equal(s.title.dataset.titleKind, "champion");
  }
  s.set("draw"); s.set("draw");
}

// ---- D2: the files ----
function webpSize(file) {
  const b = fs.readFileSync(path.join(ROOT, file));
  assert.equal(b.toString("ascii", 0, 4), "RIFF", `${file} is a WebP`);
  const kind = b.toString("ascii", 12, 16);
  if (kind === "VP8X") return [1 + b.readUIntLE(24, 3), 1 + b.readUIntLE(27, 3)];
  if (kind === "VP8L") { const v = b.readUInt32LE(21); return [1 + (v & 0x3fff), 1 + ((v >> 14) & 0x3fff)]; }
  return [b.readUInt16LE(26) & 0x3fff, b.readUInt16LE(28) & 0x3fff];
}
for (const w of [480, 960, 1920, 3840]) {
  const champion = webpSize(`visual-assets/v10_1/shared/wordmarks/TITLE_FINAL_WINNER_V2_${w}.webp`);
  const draw = webpSize(`visual-assets/v10_1/shared/wordmarks/TITLE_SHOWDOWN_DRAW_V2_${w}.webp`);
  assert.deepEqual(draw, champion, `D2 the ${w}w draw wordmark has the champion wordmark's canvas`);
}

// ---- D3: draw stories never name a champion ----
const NAMES_ONE = /\b(?:is|as|named|crowned|declared|new|reigning|undisputed)\s+(?:the\s+)?(?:(?:showdown|series|overall)\s+)?champion\b|\bchampion\s+of\s+the\s+showdown|\bwins?\s+the\s+showdown/i;
const DRAW_SITUATIONS = /"(?:situation|fits)":\[?"(?:showdown-drawn|sacked-both-draw|sacked-one-draw|level-overall|draw)"|sacked-(?:both|one)-draw/;
let rows = 0;
for (const file of ["data/frontPages.js", "data/gazetteCopy.js"]) {
  for (const line of read(file).split("\n")) {
    if (!DRAW_SITUATIONS.test(line)) continue;
    rows += 1;
    const id = (/"id":"([^"]+)"/.exec(line) || [, "?"])[1];
    assert.doesNotMatch(line, NAMES_ONE, `D3 ${file} ${id}: a draw row names a champion`);
  }
}
assert.ok(rows > 100, `D3 the draw rows were found (${rows})`);

// ---- D4: the screen's own strings ----
const strings = JSON.parse(read("visual-assets/v10_1/final-winner/app-strings.json")).strings;
assert.equal(strings.outcome.drawHeadline, "DRAW", "D4 headline");
assert.doesNotMatch(strings.outcome.drawResult, /champion|wins/i, "D4 result line");
assert.doesNotMatch(strings.completedHub.draw, /champion|wins/i, "D4 completed hub line");
console.log(`r91 draw final contracts passed (${rows} draw rows)`);
