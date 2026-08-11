let footballVisualsInitialized = false;
let footballVisualPreloadPromise = null;
const footballVisualMounts = new Map();
const footballVisualPreloads = new Map();

function getFootballVisualRevision(){
    const meta = document.querySelector('meta[name="app-asset-revision"]');
    return meta && meta.content ? meta.content.trim() : "1.0.1-r5";
}

function getFootballVisualAsset(key){
    return window.FOOTBALL_VISUALS && window.FOOTBALL_VISUALS[key]
        ? window.FOOTBALL_VISUALS[key]
        : null;
}

function getFootballVisualUrl(asset){
    return `${asset.src}?v=${getFootballVisualRevision()}`;
}

function preloadFootballVisualAsset(asset){
    if(footballVisualPreloads.has(asset.id)){
        return footballVisualPreloads.get(asset.id);
    }

    const promise = new Promise((resolve, reject) => {
        const image = new Image();
        image.decoding = "async";
        image.fetchPriority = "auto";
        image.onload = () => resolve({
            id: asset.id,
            width: image.naturalWidth,
            height: image.naturalHeight
        });
        image.onerror = () => reject(new Error(`Required football photograph failed to preload: ${asset.id}`));
        image.src = getFootballVisualUrl(asset);
    });

    footballVisualPreloads.set(asset.id, promise);
    return promise;
}

function preloadFootballVisualAssets(){
    if(footballVisualPreloadPromise){
        return footballVisualPreloadPromise;
    }

    const assets = window.FOOTBALL_VISUALS
        ? Object.values(window.FOOTBALL_VISUALS)
        : [];
    if(!assets.length){
        return Promise.reject(new Error("Required football visual manifest is empty."));
    }

    footballVisualPreloadPromise = Promise.all(assets.map(preloadFootballVisualAsset));
    return footballVisualPreloadPromise;
}

function createFootballVisualCredit(asset){
    const credit = document.createElement("small");
    credit.className = "footballVisualCredit";

    const source = document.createElement("a");
    source.href = asset.source;
    source.target = "_blank";
    source.rel = "noopener noreferrer";
    source.textContent = asset.author;

    const separator = document.createTextNode(" · ");

    const license = document.createElement("a");
    license.href = asset.licenseUrl;
    license.target = "_blank";
    license.rel = "noopener noreferrer";
    license.textContent = asset.license;

    credit.append(source, separator, license);
    return credit;
}

function getFootballVisualFraming(asset){
    const framing = asset && asset.framing ? asset.framing : {};
    return {
        mode: framing.mode || "subject-safe",
        fit: framing.fit || "contain",
        position: framing.position || "50% 50%",
        maxCropFraction: Number.isFinite(framing.maxCropFraction) ? framing.maxCropFraction : 0,
        rejectPortraitCover: framing.rejectPortraitCover !== false
    };
}

function applyFootballVisualFraming(panel, asset, plan){
    const framing = getFootballVisualFraming(asset);
    panel.dataset.visualLayout = plan.layout || "subject-safe";
    panel.dataset.framingMode = framing.mode;
    panel.dataset.maxCropFraction = String(framing.maxCropFraction);
    panel.dataset.rejectPortraitCover = framing.rejectPortraitCover ? "true" : "false";
    panel.style.setProperty("--football-visual-fit", framing.fit);
    panel.style.setProperty("--football-visual-position", framing.position);
}

function createFootballVisualPanel(assetKey, plan, extraClass = ""){
    const asset = getFootballVisualAsset(assetKey);
    if(!asset){
        throw new Error(`Football visual asset is unavailable: ${assetKey}`);
    }

    const panel = document.createElement("figure");
    panel.className = `footballVisualPanel ${extraClass}`.trim();
    panel.dataset.footballVisualAsset = asset.id;
    panel.dataset.tone = plan.tone || "dark";
    applyFootballVisualFraming(panel, asset, plan);

    const mediaFrame = document.createElement("div");
    mediaFrame.className = "footballVisualMediaFrame";
    mediaFrame.setAttribute("aria-hidden", "true");

    const image = document.createElement("img");
    image.className = "footballVisualMedia";
    image.alt = asset.alt;
    image.loading = "eager";
    image.decoding = "async";
    image.fetchPriority = "auto";
    image.src = getFootballVisualUrl(asset);
    image.addEventListener("load", () => {
        panel.classList.add("imageLoaded");
        panel.classList.remove("imageFailed");
    }, { once: true });
    image.addEventListener("error", () => {
        panel.classList.add("imageFailed");
        panel.classList.remove("imageLoaded");
    }, { once: true });

    if(image.complete && image.naturalWidth > 0){
        panel.classList.add("imageLoaded");
    }
    mediaFrame.appendChild(image);

    const caption = document.createElement("figcaption");
    caption.className = "footballVisualCopy";

    const identity = document.createElement("span");
    identity.className = "footballVisualIdentity";

    const kicker = document.createElement("span");
    kicker.className = "footballVisualKicker";
    kicker.textContent = plan.label || "CAREER MODE";

    const name = document.createElement("strong");
    name.className = "footballVisualName";
    name.textContent = asset.subject;

    const context = document.createElement("span");
    context.className = "footballVisualContext";
    context.textContent = asset.context;

    identity.append(kicker, name, context);
    caption.append(identity, createFootballVisualCredit(asset));
    panel.append(mediaFrame, caption);
    return panel;
}

function mountCreateShowdownVisual(plan){
    const screen = document.getElementById("createShowdown");
    const setup = screen && screen.querySelector(".setupBox");
    if(!screen || !setup){ return null; }

    const existing = screen.querySelector('[data-football-visual-screen="createShowdown"]');
    if(existing){ return existing; }

    const stage = document.createElement("div");
    stage.className = "footballVisualStage";
    stage.dataset.footballVisualScreen = "createShowdown";
    stage.append(createFootballVisualPanel(plan.assets[0], plan, "footballVisualHeroSetup"));
    setup.parentNode.insertBefore(stage, setup);
    stage.appendChild(setup);
    screen.classList.add("hasFootballVisual");
    return stage;
}

function mountTransferVisual(plan){
    const screen = document.getElementById("transferChallenge");
    const anchor = screen && screen.querySelector(".transferHero");
    if(!screen || !anchor){ return null; }

    const existing = screen.querySelector('[data-football-visual-screen="transferChallenge"]');
    if(existing){ return existing; }

    const group = document.createElement("div");
    group.className = "footballVisualHeroTransfer";
    group.dataset.footballVisualScreen = "transferChallenge";
    plan.assets.forEach(assetKey => group.appendChild(createFootballVisualPanel(assetKey, plan)));
    anchor.parentNode.insertBefore(group, anchor);
    return group;
}

function mountAnalyticsVisual(screenName, plan, hostId, className){
    const screen = document.getElementById(screenName);
    const host = document.getElementById(hostId);
    if(!screen || !host){ return null; }

    const existing = screen.querySelector(`[data-football-visual-screen="${screenName}"]`);
    if(existing){ return existing; }

    const panel = createFootballVisualPanel(plan.assets[0], plan, className);
    panel.dataset.footballVisualScreen = screenName;
    host.prepend(panel);
    return panel;
}

function prepareFootballVisualScreen(screenName){
    const plans = window.FOOTBALL_VISUAL_SCREEN_PLAN;
    const plan = plans && plans[screenName];
    if(!plan){ return false; }

    let mount = null;
    if(screenName === "createShowdown"){
        mount = mountCreateShowdownVisual(plan);
    }else if(screenName === "transferChallenge"){
        mount = mountTransferVisual(plan);
    }else if(screenName === "careerStatistics"){
        mount = mountAnalyticsVisual(screenName, plan, "careerStatisticsContent", "footballVisualAnalytics");
    }else if(screenName === "trophyRoom"){
        mount = mountAnalyticsVisual(screenName, plan, "trophyRoomContent", "footballVisualTrophy");
    }

    if(mount){
        footballVisualMounts.set(screenName, mount);
        return true;
    }
    return false;
}

async function initializeFootballVisuals(){
    if(!window.FOOTBALL_VISUALS || !window.FOOTBALL_VISUAL_SCREEN_PLAN){
        throw new Error("Required licensed football visual manifest is unavailable.");
    }
    footballVisualsInitialized = true;
    await preloadFootballVisualAssets();
    return true;
}

function getFootballVisualDiagnostics(){
    const mounted = {};
    footballVisualMounts.forEach((element, screenName) => {
        mounted[screenName] = Boolean(element && element.isConnected);
    });
    return {
        initialized: footballVisualsInitialized,
        mounted,
        preloadCount: footballVisualPreloads.size,
        assetCount: window.FOOTBALL_VISUALS ? Object.keys(window.FOOTBALL_VISUALS).length : 0
    };
}

window.initializeFootballVisuals = initializeFootballVisuals;
window.preloadFootballVisualAssets = preloadFootballVisualAssets;
window.prepareFootballVisualScreen = prepareFootballVisualScreen;
window.getFootballVisualDiagnostics = getFootballVisualDiagnostics;
