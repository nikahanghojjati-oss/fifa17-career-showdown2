"use strict";
// r88 STORY (Nik's picks 2026-11-02): a Home tile after Trophy Room that opens a local, offline-safe page with one link to
// the full history site published with the game under chronicle/. These checks keep the tile, the page, the one address,
// the worker passthrough and the Pages copy step together.
const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");

const root = path.resolve(__dirname, "../..");
const read = file => fs.readFileSync(path.join(root, file), "utf8");
let passed = 0;
const check = (name, fn) => { fn(); passed += 1; console.log(`ok ${passed} ${name}`); };

const Home = require(path.join(root, "js/homeScreensV10.js"));
const homeSrc = read("js/homeScreensV10.js");
const screens = read("js/screens.js");
const worker = read("service-worker.js");
const pages = read(".github/workflows/deploy-github-pages.yml");
const css = read("css/homeV10.css");

check("ST1 the STORY tile sits right after Trophy Room, with Nik's words", () => {
  assert.equal(Home.STORY_TILE.id, "homeStoryButton");
  assert.equal(Home.STORY_TILE.after, Home.TROPHY_TILE.id, "STORY follows the Trophy Room tile");
  assert.equal(Home.STORY_TILE.label, "STORY");
  assert.equal(Home.STORY_TILE.meta, "How the Showdown was built.");
  assert.match(homeSrc, /hmTrophyTile\(grid\);\n\s*hmStoryTile\(grid\);/, "STORY is inserted after Trophy Room on every Home draw");
  assert.match(homeSrc, /if\(hmDoc\(\)\.getElementById\(t\.id\)\)return;/, "a repeated Home draw never adds a second tile");
});

check("ST2 one address for the full story, same site, same tab", () => {
  assert.equal(Home.STORY_URL, "chronicle/");
  assert.equal((homeSrc.match(/"chronicle\/"/g) || []).length, 1, "the address lives in one place");
  assert.doesNotMatch(homeSrc, /chatgpt\.site/, "no dependence on the GPT host");
  assert.doesNotMatch(homeSrc.slice(homeSrc.indexOf("function hmStoryPage"), homeSrc.indexOf("function openStory")), /target=|_blank|window\.open/,
    "the link stays in the tab, so the signed-in session and the single game tab are kept");
});

check("ST3 the STORY page is local, works offline and sends nothing", () => {
  const page = homeSrc.slice(homeSrc.indexOf("function hmStoryPage"), homeSrc.indexOf("function openStory"));
  for(const words of ["READ THE FULL STORY", "BACK TO HOME", "THE BEGINNING", "HOW IT GREW", "THE COLLABORATORS"])
    assert.ok(homeSrc.includes(words), words);
  assert.ok(homeSrc.includes("Connect to the internet to read the full story."), "offline line");
  assert.match(homeSrc, /addEventListener\?\.\("offline",hmStorySync\)/, "goes offline live");
  assert.match(homeSrc, /addEventListener\?\.\("online",hmStorySync\)/, "comes back online live");
  assert.doesNotMatch(page, /currentShowdown|firebase|firestore|localStorage|sessionStorage|fetch\(/i,
    "the page reads and sends no game data");
  const words = homeSrc.slice(homeSrc.indexOf("const STORY_SECTIONS"), homeSrc.indexOf("const CHEVRON")) + page;
  assert.doesNotMatch(words, /\b(11|110)\b/, "no 11/110 anywhere in STORY");
});

check("ST4 the app routes STORY like Rule Book: Home behind it, no football art, no setup lock", () => {
  assert.match(screens, /"ruleBook",\n\s*"story"\n\];/);
  assert.doesNotMatch(screens, /story: \[/, "BACK from STORY uses the default target, Home");
  assert.match(screens, /"ruleBook", "story"\]\.includes\(screenName\)/);
  assert.match(screens, /name!=="story"\)\);/, "a text page needs no football presentation");
  assert.match(read("js/v10Screens.js"), /story:\["home","hub"\]/, "HOME stays lit in the bar on STORY");
  for(const file of ["js/productionSharedShowdownPresentation.js", "js/startJoinViewModel.js"])
    assert.match(read(file), /"ruleBook","story"\]/, `${file} hides STORY with the other screens`);
});

check("ST5 the worker never answers for chronicle/ and Pages publishes it", () => {
  const match = worker.match(/const CHRONICLE_PATH = (\/.+\/);/);
  assert.ok(match, "CHRONICLE_PATH");
  const re = eval(match[1]);
  for(const p of ["chronicle", "chronicle/", "chronicle/index.html", "chronicle/book.html", "chronicle/assets/home.webp"]) assert.ok(re.test(p), p);
  for(const p of ["index.html", "js/chronicleX.js", "visual-assets/v10_1/chronicle/x.webp", "chronicles/"]) assert.ok(!re.test(p), p);
  const fetchHandler = worker.slice(worker.indexOf('self.addEventListener("fetch"'));
  assert.ok(fetchHandler.indexOf("CHRONICLE_PATH.test") < fetchHandler.indexOf('request.mode==="navigate"'),
    "the passthrough runs before the shell's index.html navigation fallback");
  assert.doesNotMatch(worker.slice(worker.indexOf("const SHELL_PATHS"), worker.indexOf("const SHELL_PATH_SET")), /chronicle\//, "never precached");
  assert.match(pages, /cp -R chronicle \.pages-artifact\//);
});

check("ST6 the mirrored site is whole, self-contained and leads back to the game", () => {
  for(const file of ["index.html", "book.html", "style.css", "showdown-polish.css", "book.js", "book-data.js", "assets/home.webp"])
    assert.ok(fs.existsSync(path.join(root, "chronicle", file)), file);
  for(const file of ["index.html", "book.html"]){
    const html = read(`chronicle/${file}`);
    assert.match(html, /class="game-return" href="\.\.\/"/, `${file} has Back to the game`);
    assert.match(html, /showdown-polish\.css/, `${file} loads the polish`);
    assert.doesNotMatch(html, /<script[^>]+src="https?:/i, `${file} loads no outside script`);
    assert.doesNotMatch(html, /chatgpt\.site/, `${file} has no GPT host link`);
  }
});

check("ST7 phones and upright tablets: STORY is a full-width bar in its own row, and the six tiles keep theirs", () => {
  const block = css.slice(css.indexOf("/* ---------- r88 STORY (Nik"));
  assert.match(block, /#homeStoryButton\.menuTile \{\n\s*grid-column: 1 \/ -1; grid-row: 4;/);
  assert.match(block, /grid-template-rows: var\(--home-continue-h\) var\(--home-tile-h\) var\(--home-tile-h\) var\(--home-story-h\);/);
  assert.match(css, /#ruleBookButton \.tileArt, #mainMenu\.v10Home #homeStoryButton \.tileArt/, "desktop icon placed like Rule Book");
  assert.doesNotMatch(block, /opacity:\s*0?\.[0-9]|filter:\s*brightness/, "no dimming");
});

console.log(`r88 STORY tile contracts: ${passed} checks passed`);
