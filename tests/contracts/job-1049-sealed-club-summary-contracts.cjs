const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const {createFakeDocument}=require("../support/fake-dom.cjs");
const root=path.resolve(__dirname,"../..");
const source=fs.readFileSync(path.join(root,"js/productionSharedShowdownPresentation.js"),"utf8");

// Source anchors: each rule of the sealed club summary is named so a regression points at its own rule.
const fillBody=source.match(/function ssjpFillConfirmation\(setup\)\{([\s\S]*?)\n  \}\n/)?.[1]||"";
assert.ok(fillBody,"ssjpFillConfirmation must be a top-level function.");
assert.doesNotMatch(fillBody,/clubConfirmationClub(One|Two)/,"The summary must not write setup.clubs straight into the confirmation club nodes.");
assert.match(fillBody,/ssjpSealConfirmationClub\(ssjpConfirmationClubNode\(which\)\)/,"An unrevealed club must be sealed on the summary.");
assert.match(source,/function ssjpSealConfirmationClub\(node\)\{[\s\S]*?ssjpText\(node,"\?"\)/,"Sealing must write '?' into the summary club.");
assert.match(source,/revealedSummaryClubs\|=which===1\?1:2;ssjpSetConfirmationClub\(which,name\);\}/,"ssjpRevealCard must fill the summary only for the manager whose pack opened.");
assert.match(source,/function ssjpResetPackCards\(\)\{revealedSummaryClubs=0;/,"ssjpResetPackCards must reset revealedSummaryClubs to 0.");
assert.match(source,/function ssjpResetWitnesses\(\)\{[\s\S]*?revealedSummaryClubs=0;/,"ssjpResetWitnesses must reset revealedSummaryClubs to 0.");

// Behaviour: run the real module in a vm with a fake DOM. A test-only hook exposes its private functions in memory;
// the file on disk is never changed.
const anchor="return Object.freeze({contractVersion:2,";
assert.equal(source.split(anchor).length,2,"The module must expose one API return, the anchor for the test hook.");
const instrumented=source.replace(anchor,`root.__ssjpHooks={ssjpFillConfirmation,ssjpRevealCard,ssjpResetPackCards,ssjpResetWitnesses,ssjpSetConfirmationClub,ssjpSealConfirmationClub};${anchor}`);
const doc=createFakeDocument();
for(const id of ["clubRivalryConfirmation","clubConfirmationShowdown","clubConfirmationMeta","clubConfirmationManagerOne","clubConfirmationManagerTwo","clubConfirmationClubOne","clubConfirmationClubTwo","clubCardOne","clubNameOne","clubCardStateOne","clubCardTwo","clubNameTwo","clubCardStateTwo","clubPackStatus","clubWheelScreen"])doc.register(id);
const sandbox={document:doc,console};
vm.runInNewContext(instrumented,sandbox,{filename:"productionSharedShowdownPresentation.js"});
const h=sandbox.__ssjpHooks;
assert.ok(h&&typeof h.ssjpFillConfirmation==="function","The module must load in a vm with a fake DOM.");

const setup={leagueId:"league_a",totalSeasons:3,clubs:{playerOne:"West Ham United",playerTwo:"Southampton"}};
const one=doc.getElementById("clubConfirmationClubOne"),two=doc.getElementById("clubConfirmationClubTwo");
const shown=()=>[one.textContent,two.textContent];

// Nothing opened yet: both summary clubs stay sealed, even though the authority already holds both clubs.
h.ssjpResetPackCards();
h.ssjpFillConfirmation(setup);
assert.deepEqual(shown(),["?","?"],"Before any pack opens, both summary clubs must be sealed.");
// Manager one opens their pack: only their club appears; manager two's club stays sealed on every refresh.
h.ssjpRevealCard(1,setup.clubs.playerOne);
h.ssjpFillConfirmation(setup);
h.ssjpFillConfirmation(setup);
assert.deepEqual(shown(),["West Ham United","?"],"Opening pack one must reveal only manager one's club on the summary.");
h.ssjpRevealCard(2,setup.clubs.playerTwo);
assert.deepEqual(shown(),["West Ham United","Southampton"],"Opening pack two must reveal manager two's club.");
// A new pack reset and a witness reset each reseal both clubs.
h.ssjpResetPackCards();
h.ssjpFillConfirmation(setup);
assert.deepEqual(shown(),["?","?"],"ssjpResetPackCards must reseal the summary.");
h.ssjpRevealCard(2,setup.clubs.playerTwo);
h.ssjpResetWitnesses();
h.ssjpFillConfirmation(setup);
assert.deepEqual(shown(),["?","?"],"ssjpResetWitnesses must reseal the summary.");

process.stdout.write("PASS JOB-1049 sealed club summary contracts: the summary never writes a club before its manager's pack opens, shows '?' until then, fills only the manager whose pack opened, and reseals on pack or witness reset.\n");
