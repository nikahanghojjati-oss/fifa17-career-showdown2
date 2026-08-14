const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const{chromium}=require("playwright");
const{resolveChromiumRuntime}=require("../support/chromium-runtime.cjs");

const baseUrl=new URL(process.env.CMS_BASE_URL||"http://127.0.0.1:4173/");
const runLabel=process.env.CMS_AUDIT_RUN||"save-library-ui";
const resultsDirectory=path.resolve(process.env.CMS_TEST_RESULTS||"test-results");
const singletonKey="careerModeShowdown.activeShowdown";
const libraryKey="careerModeShowdown.saveLibrary";
fs.mkdirSync(resultsDirectory,{recursive:true});

function showdownFixture(id,name="Compatibility Rivalry",one="Same Name",two="Same Name"){
    return {schemaVersion:2,integrityWarnings:[],id,name,managers:{playerOne:one,playerTwo:two},totalRounds:3,currentRound:1,status:"Created",selectedLeague:null,clubs:{playerOne:null,playerTwo:null},score:{playerOne:0,playerTwo:0},transferChallenges:[],rounds:[],createdAt:"2026-08-14T00:00:00.000Z",updatedAt:"2026-08-14T00:00:00.000Z",completedAt:null,archivedAt:null};
}

async function waitForHome(page){
    await page.goto(baseUrl.href,{waitUntil:"domcontentloaded"});
    await page.locator("#loadingScreen").waitFor({state:"hidden",timeout:15000});
    await page.locator("#settingsButton").waitFor({state:"visible",timeout:15000});
}

function collectErrors(page){
    const errors=[];
    page.on("pageerror",error=>errors.push(`page: ${error.message}`));
    page.on("console",message=>{if(message.type()==="error"&&!/^Failed to load resource/.test(message.text()))errors.push(`console: ${message.text()}`);});
    return errors;
}

async function openLibrary(page,expectedMode){
    await page.locator("#settingsButton").click();
    const overlay=page.locator("#settingsOverlay");
    await overlay.waitFor({state:"visible",timeout:15000});
    const panel=page.locator("#saveLibraryProductPanel");
    await panel.waitFor({state:"visible",timeout:15000});
    if(expectedMode)await assert.poll(()=>panel.getAttribute("data-library-mode"),{timeout:15000}).then(mode=>assert.equal(mode,expectedMode));
    return{overlay,panel};
}

async function assertContained(page,label){
    const result=await page.evaluate(()=>{
        const panel=document.getElementById("saveLibraryProductPanel");
        const dialog=document.getElementById("settingsDialog");
        const buttons=Array.from(panel?.querySelectorAll("button")||[]).map(button=>getComputedStyle(button).minHeight);
        return {documentWidth:document.documentElement.scrollWidth,clientWidth:document.documentElement.clientWidth,panelWidth:panel?.scrollWidth||0,panelClient:panel?.clientWidth||0,dialogWidth:dialog?.scrollWidth||0,dialogClient:dialog?.clientWidth||0,buttonMinHeights:buttons};
    });
    assert.ok(result.documentWidth<=result.clientWidth+1,`${label}: document overflowed horizontally.`);
    assert.ok(result.panelWidth<=result.panelClient+1,`${label}: Save Library panel overflowed horizontally.`);
    assert.ok(result.dialogWidth<=result.dialogClient+1,`${label}: Settings dialog overflowed horizontally.`);
    for(const raw of result.buttonMinHeights){
        const height=Number.parseFloat(raw)||0;
        assert.ok(height>=44,`${label}: visible Save Library control dropped below 44px (${raw}).`);
    }
}

async function compatibilityIsNonMutating(runtime){
    const browser=await chromium.launch(runtime);
    const context=await browser.newContext({viewport:{width:1100,height:720}});
    const singleton=JSON.stringify(showdownFixture("compatibility-one"));
    await context.addInitScript(({key,value})=>{try{localStorage.setItem(key,value);}catch(error){}},{key:singletonKey,value:singleton});
    const page=await context.newPage();const errors=collectErrors(page);
    try{
        await waitForHome(page);
        const before=await page.evaluate(({singletonKey,libraryKey})=>({singleton:localStorage.getItem(singletonKey),library:localStorage.getItem(libraryKey)}),{singletonKey,libraryKey});
        const{panel}=await openLibrary(page,"compatibility");
        assert.match(await panel.innerText(),/READY FOR SAFE SAVE LIBRARY ACTIVATION/i);
        const after=await page.evaluate(({singletonKey,libraryKey})=>({singleton:localStorage.getItem(singletonKey),library:localStorage.getItem(libraryKey)}),{singletonKey,libraryKey});
        assert.deepEqual(after,before,"Opening Save Library on an old singleton device must remain non-mutating.");
        await assertContained(page,"compatibility desktop");
        assert.deepEqual(errors,[],`Compatibility Save Library emitted errors: ${errors.join(" | ")}`);
    }finally{await context.close();await browser.close();}
}

async function corruptStateFailsClosed(runtime){
    const browser=await chromium.launch(runtime);
    const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});
    const corrupt="{broken-save-library";
    await context.addInitScript(({key,value})=>{try{localStorage.setItem(key,value);localStorage.removeItem("careerModeShowdown.activeShowdown");}catch(error){}},{key:libraryKey,value:corrupt});
    const page=await context.newPage();const errors=[];
    page.on("pageerror",error=>errors.push(error.message));
    try{
        await waitForHome(page);
        const{panel}=await openLibrary(page,"blocked");
        assert.match(await panel.innerText(),/SAVE LIBRARY UNAVAILABLE/i);
        assert.match(await panel.innerText(),/NO LOCAL DATA WAS CHANGED/i);
        assert.equal(await page.evaluate(key=>localStorage.getItem(key),libraryKey),corrupt,"Blocked UI must preserve corrupt bytes exactly.");
        assert.equal(await page.evaluate(key=>localStorage.getItem(key),singletonKey),null,"Blocked UI must not fabricate singleton authority.");
        assert.equal(await panel.locator(".saveLibrarySelectButton,.saveLibraryDeleteButton").count(),0,"Blocked state must expose no mutation controls.");
        await assertContained(page,"blocked mobile");
        assert.deepEqual(errors,[],`Blocked Save Library emitted page errors: ${errors.join(" | ")}`);
    }finally{await context.close();await browser.close();}
}

async function createShowdownThroughUI(page,name){
    if(!(await page.locator("#mainMenu").isVisible()))await page.evaluate(()=>window.showScreen("mainMenu"));
    await page.locator("#newShowdown").click();
    await page.locator("#createShowdown").waitFor({state:"visible"});
    await page.locator("#showdownName").fill(name);
    await page.locator("#managerOne").fill("Same Name");
    await page.locator("#managerTwo").fill("Same Name");
    await page.locator("#roundAmount").selectOption("3");
    await page.locator("#startShowdown").click();
    await page.locator("#leagueWheelScreen").waitFor({state:"visible",timeout:15000});
    await page.evaluate(()=>window.showScreen("mainMenu"));
    await page.locator("#mainMenu").waitFor({state:"visible"});
}

async function multiSaveJourney(runtime,config){
    const browser=await chromium.launch(runtime);
    const context=await browser.newContext({viewport:config.viewport,deviceScaleFactor:config.deviceScaleFactor||1,isMobile:Boolean(config.isMobile),hasTouch:Boolean(config.hasTouch)});
    if(config.reducedMotion)await context.addInitScript(()=>{Object.defineProperty(window,"matchMedia",{value:query=>({matches:query.includes("prefers-reduced-motion"),media:query,addEventListener(){},removeEventListener(){},addListener(){},removeListener(){}}),configurable:true});});
    const page=await context.newPage();const errors=collectErrors(page);
    try{
        await waitForHome(page);
        const empty=await openLibrary(page,"empty");
        assert.match(await empty.panel.innerText(),/YOUR SAVE LIBRARY IS EMPTY/i);
        await page.keyboard.press("Escape");
        await empty.overlay.waitFor({state:"hidden"});
        assert.equal(await page.locator("#settingsButton").evaluate(el=>el===document.activeElement),true,`${config.name}: Escape must restore Home opener focus.`);

        await createShowdownThroughUI(page,"First Rivalry");
        await createShowdownThroughUI(page,"Second Rivalry");
        await createShowdownThroughUI(page,"Third Rivalry");

        let opened=await openLibrary(page,"ready");
        assert.equal(await opened.panel.locator(".saveLibraryCard").count(),3,`${config.name}: three user-created Showdowns must render as three Saves.`);
        assert.equal(await opened.panel.locator(".saveLibraryProfileCard").count(),6,`${config.name}: three same-name rivalries must retain six distinct Local Profiles.`);
        const profileIds=await opened.panel.locator(".saveLibraryProfileCard").evaluateAll(cards=>cards.map(card=>card.dataset.profileId));
        assert.equal(new Set(profileIds).size,6,`${config.name}: equal visible manager names must not collapse stable profile identity.`);
        assert.equal(await opened.panel.locator(".saveLibraryCard.isActive").count(),1,`${config.name}: exactly one active Save must be visible.`);
        await assertContained(page,`${config.name} multi-save`);

        const target=opened.panel.locator(".saveLibraryCard:not(.isActive)").first();
        const targetId=await target.getAttribute("data-save-id");
        await target.locator(".saveLibrarySelectButton").click();
        await assert.poll(()=>opened.panel.locator(`.saveLibraryCard[data-save-id="${targetId}"]`).evaluate(card=>card.classList.contains("isActive")),{timeout:10000}).then(active=>assert.equal(active,true));
        assert.equal(await page.evaluate(key=>localStorage.getItem(key),singletonKey),null,`${config.name}: switching must never recreate singleton authority.`);
        const activeBeforeReload=targetId;

        await page.keyboard.press("Escape");
        await opened.overlay.waitFor({state:"hidden"});
        await page.reload({waitUntil:"domcontentloaded"});
        await page.locator("#loadingScreen").waitFor({state:"hidden",timeout:15000});
        opened=await openLibrary(page,"ready");
        assert.equal(await opened.panel.locator(".saveLibraryCard.isActive").getAttribute("data-save-id"),activeBeforeReload,`${config.name}: active Save selection must survive reload.`);

        const nonActive=opened.panel.locator(".saveLibraryCard:not(.isActive)").first();
        const deletedNonActiveId=await nonActive.getAttribute("data-save-id");
        page.once("dialog",dialog=>dialog.accept());
        await nonActive.locator(".saveLibraryDeleteButton").click();
        await assert.poll(()=>opened.panel.locator(".saveLibraryCard").count(),{timeout:10000}).then(count=>assert.equal(count,2));
        assert.equal(await opened.panel.locator(".saveLibraryCard.isActive").getAttribute("data-save-id"),activeBeforeReload,`${config.name}: deleting a non-active Save must not change active ownership.`);
        assert.equal(await opened.panel.locator(`.saveLibraryCard[data-save-id="${deletedNonActiveId}"]`).count(),0);
        assert.equal(await opened.panel.locator(".saveLibraryProfileCard").count(),6,`${config.name}: single-Save deletion must retain stable Local Profiles.`);

        const activeCard=opened.panel.locator(".saveLibraryCard.isActive");
        page.once("dialog",dialog=>dialog.accept());
        await activeCard.locator(".saveLibraryDeleteButton").click();
        await assert.poll(()=>opened.panel.locator(".saveLibraryCard").count(),{timeout:10000}).then(count=>assert.equal(count,1));
        assert.equal(await opened.panel.locator(".saveLibraryCard.isActive").count(),0,`${config.name}: deleting active Save must not silently activate another Save.`);
        assert.match(await opened.panel.innerText(),/NO ACTIVE SAVE/i);
        assert.equal(await page.evaluate(key=>localStorage.getItem(key),singletonKey),null);
        assert.equal(await opened.panel.locator(".saveLibraryProfileCard").count(),6);

        const remaining=opened.panel.locator(".saveLibraryCard");
        const remainingId=await remaining.getAttribute("data-save-id");
        const select=remaining.locator(".saveLibrarySelectButton");
        await select.focus();
        assert.equal(await select.evaluate(el=>el===document.activeElement),true,`${config.name}: Save switching must be keyboard focusable.`);
        await page.keyboard.press("Enter");
        await assert.poll(()=>remaining.evaluate(card=>card.classList.contains("isActive")),{timeout:10000}).then(active=>assert.equal(active,true));
        assert.equal(await remaining.getAttribute("data-save-id"),remainingId);

        const screenshotPath=path.join(resultsDirectory,`save-library-${config.name}-${runLabel}.png`);
        await page.screenshot({path:screenshotPath,fullPage:true});
        await assertContained(page,`${config.name} final`);
        assert.deepEqual(errors,[],`${config.name}: Save Library emitted page/console errors: ${errors.join(" | ")}`);
        return{case:config.name,saves:1,profiles:6,activeSaveId:remainingId,screenshot:screenshotPath};
    }finally{await context.close();await browser.close();}
}

(async()=>{
    const runtime=await resolveChromiumRuntime();
    await compatibilityIsNonMutating(runtime);
    await corruptStateFailsClosed(runtime);
    const evidence=[];
    evidence.push(await multiSaveJourney(runtime,{name:"chromebook",viewport:{width:1366,height:768},deviceScaleFactor:1}));
    evidence.push(await multiSaveJourney(runtime,{name:"mobile-reduced",viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true,reducedMotion:true}));
    const resultPath=path.join(resultsDirectory,`save-library-ui-${runLabel}.json`);
    fs.writeFileSync(resultPath,JSON.stringify({runLabel,baseUrl:baseUrl.href,evidence},null,2));
    console.log("Save Library browser audit passed: compatibility stays non-mutating, corrupt authority fails closed, additive saves switch/reload/delete safely, equal manager names remain separate profiles, and Chromebook/mobile containment is protected.");
})().catch(error=>{console.error(error);process.exitCode=1;});