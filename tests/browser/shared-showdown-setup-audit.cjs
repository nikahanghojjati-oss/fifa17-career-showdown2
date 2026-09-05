const assert = require("node:assert/strict");
const fs = require("node:fs");
const http = require("node:http");
const {chromium} = require("playwright");
const {resolveChromiumRuntime} = require("../support/chromium-runtime.cjs");
const fixture = require("../fixtures/shared-showdown-setup.cjs");

// Two isolated browser contexts exercise the actual candidate module and browser
// WebCrypto. This is not a provider, production UI, or physical-device proof.
(async () => {
  const source = fs.readFileSync("js/sharedShowdownSetup.js", "utf8");
  const server = http.createServer((request,response) => {
    response.setHeader("Content-Type", request.url === "/protocol.js" ? "text/javascript" : "text/html");
    response.end(request.url === "/protocol.js" ? source : '<!doctype html><title>Shared Setup protocol audit</title><script src="/protocol.js"></script>');
  });
  await new Promise(resolve => server.listen(0,"127.0.0.1",resolve));
  let browser;
  try{
    process.env.CMS_CHROMIUM_MULTI_CONTEXT = "1";
    const runtime = await resolveChromiumRuntime();
    browser = await chromium.launch({headless:true,...runtime});
    const errors = [];
    const pages = [];
    for(const role of ["playerOne","playerTwo"]){
      const context = await browser.newContext();
      const page = await context.newPage();
      page.on("pageerror",error => errors.push(error.message));
      await page.goto(`http://127.0.0.1:${server.address().port}/`);
      await page.evaluate(async ({catalog,authority}) => {
        window.protocol = await CareerModeSharedShowdownSetup.createProtocol({catalog});
        window.authority = authority;
        for(const key of ["careerModeShowdown.saveLibrary","careerModeShowdown.legacyShowdowns","careerModeShowdown.preferences"]) localStorage.setItem(key, `synthetic unchanged ${key}`);
        window.before = JSON.stringify({...localStorage});
      },{catalog:fixture.catalog(),authority:fixture.authority(role)});
      pages.push(page);
    }
    const [host,peer] = pages;
    const apply = (page,state,command) => page.evaluate(({state,command}) => protocol.apply({state,command,authority:window.authority}),{state,command});
    let result = await apply(host,null,fixture.command("open",0,1));
    assert.equal(result.ok,true);
    const draw = await host.evaluate(state => protocol.prepareDraw({state,type:"commit-league",operationId:`setup_op_${"2".padStart(32,"0")}`}),result.state);
    const repeatedDraw = await host.evaluate(state => protocol.prepareDraw({state,type:"commit-league",operationId:`setup_op_${"12".padStart(32,"0")}`}),result.state);
    assert.equal(repeatedDraw.leagueId,draw.leagueId,"Browser retries must see the same provider-bound league draw.");
    const alternateLeague = Object.keys(fixture.catalog()).find(id => id !== draw.leagueId);
    assert.equal((await apply(host,result.state,{...draw,leagueId:alternateLeague})).code,"SETUP_DRAW_MISMATCH","Modified browser clients cannot select another valid league.");
    result = await apply(host,result.state,draw);
    assert.equal(result.ok,true);
    assert.equal((await apply(peer,result.state,fixture.command("commit-league",2,20,{leagueId:"laliga"}))).code,"SETUP_COORDINATOR_REQUIRED");
    const clubDraw = await host.evaluate(state => protocol.prepareDraw({state,type:"commit-clubs",operationId:`setup_op_${"3".padStart(32,"0")}`}),result.state);
    const repeatedClubDraw = await host.evaluate(state => protocol.prepareDraw({state,type:"commit-clubs",operationId:`setup_op_${"13".padStart(32,"0")}`}),result.state);
    assert.deepEqual(repeatedClubDraw.clubs,clubDraw.clubs,"Browser retries must see the same provider-bound club draw.");
    const leagueClubs = fixture.catalog()[result.state.leagueId];
    const alternatePlayerOne = leagueClubs.find(club => club !== clubDraw.clubs.playerOne && club !== clubDraw.clubs.playerTwo);
    assert.ok(alternatePlayerOne);
    assert.equal((await apply(host,result.state,{...clubDraw,clubs:{playerOne:alternatePlayerOne,playerTwo:clubDraw.clubs.playerTwo}})).code,"SETUP_DRAW_MISMATCH","Modified browser clients cannot select another valid club pair.");
    result = await apply(host,result.state,clubDraw);
    result = await apply(host,result.state,fixture.command("commit-length",3,4,{totalSeasons:3}));
    assert.equal(result.ok,true);
    const hashes = await Promise.all(pages.map(page => page.evaluate(state => protocol.confirmationHash(state),result.state)));
    assert.equal(hashes[0],hashes[1],"Both browser contexts compute the same setup confirmation.");
    // Peer confirms first: authority must not depend on confirmation order.
    result = await apply(peer,result.state,fixture.command("confirm",4,5,{setupHash:hashes[1]}));
    result = await apply(host,result.state,fixture.command("confirm",5,6,{setupHash:hashes[0]}));
    assert.equal(result.state.phase,"SHOWDOWN_CONFIRMED");
    const views = await Promise.all(pages.map(page => page.evaluate(state => protocol.verifyState(state),result.state)));
    assert.deepEqual(views[0],views[1]);
    for(const page of pages){
      assert.equal(await page.evaluate(() => JSON.stringify({...localStorage}) === window.before),true);
      assert.deepEqual(await page.evaluate(() => Object.keys(localStorage).sort()),["careerModeShowdown.legacyShowdowns","careerModeShowdown.preferences","careerModeShowdown.saveLibrary"]);
    }
    assert.deepEqual(errors,[]);
    console.log("PASS two isolated Chromium contexts: real WebCrypto provider-bound non-redrawable league/clubs, modified-client rejection, peer-first dual confirmation, exact setup convergence and unchanged canonical local bytes. Candidate protocol only; SSJR credit 0.");
  }finally{
    if(browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => {console.error(error);process.exitCode=1;});
