const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright");
const { resolveChromiumRuntime } = require("../support/chromium-runtime.cjs");

const baseUrl = new URL(process.env.CMS_BASE_URL || "http://127.0.0.1:4173/");
const runLabel = process.env.CMS_AUDIT_RUN || "loading-visual";
const resultsDirectory = path.resolve(process.env.CMS_TEST_RESULTS || "test-results");
const IOS_UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 19_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/19.0 Mobile/15E148 Safari/604.1";
const productionOrigin = "https://nikahanghojjati-oss.github.io";
const productionPathPrefix = "/fifa17-career-showdown2/";

const cases = [
    { name: "desktop", viewport: { width: 1366, height: 768 }, dpr: 1, mobile: false },
    // HO-072: every landscape window draws the desktop room from its top left corner; upright windows draw the phone room.
    { name: "windowed-desktop", viewport: { width: 940, height: 700 }, dpr: 1, mobile: false },
    { name: "chromebook-windowed", viewport: { width: 1920, height: 866 }, dpr: 1, mobile: false },
    { name: "chromebook-full", viewport: { width: 1920, height: 1035 }, dpr: 1, mobile: false },
    { name: "mobile-browser-height", viewport: { width: 390, height: 720 }, dpr: 3, mobile: true, standalone: false },
    { name: "ios-standalone-height", viewport: { width: 390, height: 844 }, dpr: 3, mobile: true, standalone: true }
];

fs.mkdirSync(resultsDirectory, { recursive: true });

function isExpectedProductionAppCheckConsoleNoise(message){
    if(baseUrl.origin !== productionOrigin || !baseUrl.pathname.startsWith(productionPathPrefix)){
        return false;
    }
    const text = message.text();
    if(/^Framing 'https:\/\/www\.google\.com\/' violates the following report-only Content Security Policy directive: "frame-ancestors 'self'"\./.test(text)){
        return true;
    }
    if(text === "requestStorageAccess: Permission denied."){
        const sourceUrl = message.location()?.url || "";
        return !sourceUrl || !sourceUrl.startsWith(baseUrl.origin);
    }
    return false;
}

function assertNear(actual, expected, tolerance, message){
    assert.ok(Number.isFinite(actual) && Math.abs(actual - expected) <= tolerance,
        `${message}: expected ${expected} ± ${tolerance}, got ${actual}`);
}

async function prepareStartup(page, config){
    if(config.standalone){
        await page.addInitScript(() => {
            try{
                Object.defineProperty(navigator, "standalone", { configurable: true, get: () => true });
            }catch(error){ /* standalone-height geometry is still exercised */ }
        });
    }

    await page.goto(baseUrl.href, { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => {
        const images = [...document.querySelectorAll("#loadingScreen img")];
        return images.length === 5 && images.every(image => image.complete && image.naturalWidth > 0 && image.naturalHeight > 0);
    }, null, { timeout: 12000 });
    await page.waitForFunction(mobile => {
        const fidelityStyle = document.querySelector('link[data-visual-fidelity="reus-r3"]');
        const offlineStyle = document.querySelector('link[data-offline-app-style]');
        return fidelityStyle && fidelityStyle.sheet && (!mobile || Boolean(offlineStyle && offlineStyle.sheet));
    }, Boolean(config.mobile), { timeout: 12000 });
    await page.evaluate(() => {
        const loading = document.getElementById("loadingScreen");
        const app = document.getElementById("app");
        if(loading){
            loading.hidden = false;
            loading.classList.remove("hidden", "is-exiting");
            loading.style.opacity = "1";
            loading.style.transform = "none";
            for(const animation of document.getAnimations()){
                const target = animation.effect && animation.effect.target;
                if(target && (target === loading || loading.contains(target))){
                    try{ animation.finish(); }catch(error){ /* finite splash animations settle normally */ }
                }
            }
        }
        if(app){ app.style.visibility = "hidden"; }
        window.scrollTo(0, 0);
    });
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}

// Reus's face box as a share of his layer (the same on the desktop and phone cut-outs).
const FACE = [.44, .025, .68, .23];
async function inspectStartup(page){
    return page.evaluate(face => {
        const loading = document.getElementById("loadingScreen");
        const frame = document.querySelector(".startupAthleteFrame");
        const room = document.querySelector(".startupRoom");
        const image = document.getElementById("startupAthlete");
        const title = document.querySelector(".startupIdentity");
        const status = document.querySelector(".startupStatus");
        const saveNote = document.querySelector(".startupSaveNote");
        const credit = document.querySelector(".startupPhotoCredit");
        if(!loading || !frame || !room || !image || !title || !status || !saveNote || !credit){
            throw new Error("Startup composition is incomplete.");
        }
        const rect = element => {
            const value = element.getBoundingClientRect();
            return { left:value.left,right:value.right,top:value.top,bottom:value.bottom,width:value.width,height:value.height };
        };
        const loadingRect=rect(loading),frameRect=rect(frame),roomRect=rect(room),imageRect=rect(image),imageStyle=getComputedStyle(image);
        const cut=parseFloat((/inset\(0(?:px|%)? 0(?:px|%)? ([\d.]+)%/.exec(imageStyle.clipPath)||[])[1]);
        return {
            viewport:{width:innerWidth,height:innerHeight},dpr:devicePixelRatio,
            standalone:navigator.standalone===true||matchMedia("(display-mode: standalone)").matches,
            loading:loadingRect,frame:frameRect,
            room:{...roomRect,naturalWidth:room.naturalWidth,naturalHeight:room.naturalHeight,source:(room.currentSrc||"").split("/").pop().split("?")[0]},
            image:{...imageRect,naturalWidth:image.naturalWidth,naturalHeight:image.naturalHeight,position:imageStyle.position,cut,source:(image.currentSrc||"").split("/").pop().split("?")[0]},
            face:{left:imageRect.left+face[0]*imageRect.width,top:imageRect.top+face[1]*imageRect.height,right:imageRect.left+face[2]*imageRect.width,bottom:imageRect.top+face[3]*imageRect.height},
            title:rect(title),status:rect(status),saveNote:rect(saveNote),credit:rect(credit),
            documentWidth:document.documentElement.scrollWidth,clientWidth:document.documentElement.clientWidth
        };
    }, FACE);
}

const apart=(a,b)=>a.right<=b.left||a.left>=b.right||a.bottom<=b.top||a.top>=b.bottom;
function assertCommon(result, config){
    assert.ok(result.image.naturalWidth>0&&result.image.naturalHeight>0,`${config.name}: Reus source did not decode.`);
    assert.equal(result.documentWidth,result.clientWidth,`${config.name}: startup composition has horizontal overflow.`);
    assertNear(result.loading.left,0,1,`${config.name}: loading stage left edge`);
    assertNear(result.loading.top,0,1,`${config.name}: loading stage top edge`);
    assertNear(result.loading.width,result.viewport.width,1,`${config.name}: loading stage width`);
    assertNear(result.loading.height,result.viewport.height,1,`${config.name}: loading stage height`);
    // HO-072: the room fills the window (no bars), and neither layer is stretched.
    assert.ok(result.frame.left<=.5&&result.frame.top<=.5&&result.frame.right>=result.viewport.width-.5&&result.frame.bottom>=result.viewport.height-.5,`${config.name}: the room leaves a bar: ${JSON.stringify(result.frame)}`);
    assertNear(result.room.width/result.room.height,result.room.naturalWidth/result.room.naturalHeight,.004,`${config.name}: the room keeps its own ratio`);
    assertNear(result.image.width/result.image.height,result.image.naturalWidth/result.image.naturalHeight,.004,`${config.name}: Reus keeps his own ratio`);
    assert.equal(result.image.position,"absolute",`${config.name}: Reus is placed in the room's own frame.`);
    const phoneRoom=result.viewport.height>=result.viewport.width;
    assert.match(result.room.source,phoneRoom?/^ENV_LOADING_PHONE_HC_590W\.webp$/:/^ENV_LOADING_PLATE_HC_1X\.webp$/,`${config.name}: first paint draws the light room for the window's shape`);
    assert.match(result.image.source,phoneRoom?/^REUS_P_590W\.webp$/:/^REUS_D_1X\.webp$/,`${config.name}: first paint draws the light Reus layer for the window's shape`);
    // Team V's placement (placement.json): his layer's corner and size in the room, and the ledge that cuts him.
    const place=phoneRoom?[68/1179,317/2096,1042/1179,13.33]:[20/1920,8/1080,793/1920,25.91];
    assertNear((result.image.left-result.frame.left)/result.frame.width,place[0],.001,`${config.name}: Reus left edge in the room`);
    assertNear((result.image.top-result.frame.top)/result.frame.height,place[1],.001,`${config.name}: Reus top edge in the room`);
    assertNear(result.image.width/result.frame.width,place[2],.001,`${config.name}: Reus size in the room`);
    assertNear(result.image.cut,place[3],.01,`${config.name}: the ledge cuts Reus where Team V drew it`);
    for(const [name,rect] of [["title",result.title],["status",result.status],["save note",result.saveNote],["credit",result.credit],["Reus face",result.face]]){
        assert.ok(rect.left>=-1&&rect.right<=result.viewport.width+1,`${config.name}: ${name} escapes the horizontal viewport.`);
        assert.ok(rect.top>=-1&&rect.bottom<=result.viewport.height+1,`${config.name}: ${name} escapes the vertical viewport.`);
    }
    const parts=[["title",result.title],["status",result.status],["save note",result.saveNote],["credit",result.credit]];
    for(const [name,rect] of parts){
        assert.ok(apart(rect,result.face),`${config.name}: ${name} touches Reus's face.`);
        for(const [other,otherRect] of parts)if(other!==name)assert.ok(apart(rect,otherRect),`${config.name}: ${name} covers ${other}.`);
    }
    assert.ok(result.saveNote.top>=result.title.bottom,`${config.name}: the tagline sits under the title.`);
}

function assertDesktop(result, config){
    assertNear(result.frame.left,0,.5,`${config.name}: the desktop room is drawn from the window's left edge (Reus's hand stays in)`);
    assertNear(result.frame.top,0,.5,`${config.name}: the desktop room is drawn from the window's top edge (his head stays in)`);
    assert.ok(result.title.left>=result.image.left+result.image.width*.9,`${config.name}: the title stands to the right of Reus.`);
}

function assertMobile(result, config){
    assertNear((result.frame.left+result.frame.right)/2,result.viewport.width/2,1,`${config.name}: the phone room is centred.`);
    assert.ok(result.frame.top<=.5&&result.frame.top>=-result.frame.height*70/2096-1,`${config.name}: the phone room is raised at most 70 picture pixels (${result.frame.top.toFixed(1)}px).`);
    assert.ok(result.title.top<=result.viewport.height*0.36,`${config.name}: startup title drifted too far down the installed/mobile stage.`);
    assert.ok(result.saveNote.bottom<=result.face.top,`${config.name}: title and tagline stay above Reus's head.`);
    assert.ok(result.status.bottom<result.credit.top-4,`${config.name}: loading status overlaps the attribution line.`);
}

async function runCase(browser, config){
    const context=await browser.newContext({viewport:config.viewport,deviceScaleFactor:config.dpr,isMobile:Boolean(config.mobile),hasTouch:Boolean(config.mobile),userAgent:config.mobile?IOS_UA:undefined,locale:"en-US"});
    const page=await context.newPage(),pageErrors=[],consoleErrors=[],externalConsoleNoise=[],localFailures=[];
    page.on("pageerror",error=>pageErrors.push(error.stack||error.message));
    page.on("console",message=>{
        if(message.type()==="error"&&!/^Failed to load resource/.test(message.text())){
            if(isExpectedProductionAppCheckConsoleNoise(message))externalConsoleNoise.push(message.text());
            else consoleErrors.push(message.text());
        }
    });
    page.on("requestfailed",request=>{if(request.url().startsWith(baseUrl.href))localFailures.push(`${request.method()} ${request.url()} :: ${request.failure()?.errorText||"failed"}`);});
    try{
        await prepareStartup(page,config);const result=await inspectStartup(page);assertCommon(result,config);
        if(config.mobile)assertMobile(result,config);else assertDesktop(result,config);
        const screenshotPath=path.join(resultsDirectory,`loading-${config.name}-${runLabel}.png`);await page.screenshot({path:screenshotPath,fullPage:true});
        assert.deepEqual(pageErrors,[],`${config.name}: page errors detected.`);assert.deepEqual(consoleErrors,[],`${config.name}: unexpected console errors detected.`);assert.deepEqual(localFailures,[],`${config.name}: failed first-party requests detected.`);
        if(externalConsoleNoise.length)process.stdout.write(`INFO ${config.name} :: ignored ${externalConsoleNoise.length} expected external production App Check browser console message(s).\n`);
        process.stdout.write(`PASS ${config.name} :: ${result.viewport.width}x${result.viewport.height} @${result.dpr}x :: room ${result.room.source} ${Math.round(result.frame.width)}x${Math.round(result.frame.height)} at ${result.frame.left.toFixed(1)},${result.frame.top.toFixed(1)} :: title ${Math.round(result.title.width)}px wide\n`);return result;
    }finally{await context.close();}
}

(async()=>{
    const runtime=await resolveChromiumRuntime(),browser=await chromium.launch({executablePath:runtime.executablePath,headless:true,args:runtime.args});
    try{
        process.stdout.write(`Chromium ${await browser.version()} · ${runLabel}\n`);const results=new Map();for(const config of cases)results.set(config.name,await runCase(browser,config));
        const mobile=results.get("mobile-browser-height"),standalone=results.get("ios-standalone-height");
        assert.ok(Math.abs(standalone.title.top-mobile.title.top)<=62,`startup title moved ${Math.abs(standalone.title.top-mobile.title.top).toFixed(1)}px between browser-height and standalone-height mobile layouts.`);
        assert.equal(standalone.image.source,mobile.image.source,"same-width browser and installed-app phones draw the same Reus layer.");
        process.stdout.write("Standalone/mobile startup composition regression audit passed.\n");
    }finally{await browser.close();}
})().catch(error=>{console.error("LOADING VISUAL AUDIT FAILED");console.error(error.stack||error);process.exit(1);});
