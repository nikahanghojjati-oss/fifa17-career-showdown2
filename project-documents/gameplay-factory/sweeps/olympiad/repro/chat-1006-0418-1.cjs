"use strict";

const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");

const root = process.cwd();
const jsRoot = path.join(root, "js");

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

const presentationPath = "js/productionSharedShowdownPresentation.js";
const presentation = read(presentationPath);
const league = read("js/leagueWheel.js");
const club = read("js/clubAssignment.js");
const entry = read("js/productionSharedJourneyEntry.js");

assert.match(
  presentation,
  /const HANDLED=new Set\(\["spinLeague","openClubPack","continueClubAssignment"\]\)/
);
assert.match(
  league,
  /spinButton\.addEventListener\("click",\s*handleLeagueWheelAction\)/
);
assert.match(
  club,
  /ui\.revealButton\.addEventListener\("click",\s*assignClubs\)/
);
assert.match(
  club,
  /ui\.continueButton\.addEventListener\("click",\s*continueToShowdownHome\)/
);
assert.match(
  entry,
  /locked&&!presentationOwns[^\n]*button\.disabled=true[\s\S]*?else if\(button\.dataset\.sharedJourneyLocked==="true"\)\{button\.disabled=false/
);

const allJs = walk(jsRoot).filter(file => file.endsWith(".js"));
const outsideDispatcherReferences = allJs
  .filter(file => path.relative(root, file).replaceAll("\\", "/") !== presentationPath)
  .filter(file => {
    const source = fs.readFileSync(file, "utf8");
    return /handleControlClick|handlesControl/.test(source);
  })
  .map(file => path.relative(root, file).replaceAll("\\", "/"));

const internalDispatcherBinding =
  /addEventListener\s*\(\s*["']click["'][\s\S]{0,1200}(?:ssjpHandleControlClick|ssjpHandlesControl)/
    .test(presentation)
  || /(?:ssjpHandleControlClick|ssjpHandlesControl)[\s\S]{0,1200}addEventListener\s*\(\s*["']click["']/
    .test(presentation);

console.log(JSON.stringify({
  legacyLeagueClickBound: true,
  legacyClubOpenClickBound: true,
  legacyClubContinueClickBound: true,
  sharedPresentationInternalDispatcherBinding: internalDispatcherBinding,
  dispatcherReferencesOutsidePresentation: outsideDispatcherReferences
}, null, 2));

assert.ok(
  internalDispatcherBinding || outsideDispatcherReferences.length > 0,
  "Shared presentation exports handleControlClick/handlesControl but no repository JS wires real clicks to that dispatcher; legacy local draw handlers remain bound."
);

console.log("PASS: shared setup controls have an explicit authoritative click-dispatch path.");
