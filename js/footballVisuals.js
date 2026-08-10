/* =====================================================
   Career Mode Showdown v1.0.1
   Licensed Football Visual Renderer
   Presentation-only. No gameplay, navigation or storage ownership.
===================================================== */

let footballVisualsInitialized = false;
const footballVisualMounts = new Map();

function getFootballVisualRevision(){
    const meta = document.querySelector('meta[name="app-asset-revision"]');
    return meta && meta.content ? meta.content.trim() : "1.0.1-r3";
}

function getFootballVisualAsset(key){
    return window.FOOTBALL_VISUALS && window.FOOTBALL_VISUALS[key]
        ? window.FOOTBALL_VISUALS[key]
        : null;
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

function createFootballVisualPanel(assetKey, plan, extraClass = ""){
    const asset = getFootballVisualAsset(assetKey);
    if(!asset){
        throw new Error(`Football visual asset is unavailable: ${assetKey}`);
    }

    const panel = document.createElement("figure");
    panel.className = `footballVisualPanel ${extraClass}`.trim();
    panel.dataset.footballVisualAsset = asset.id;
    panel.dataset.tone = plan.tone || "dark";
    panel.style.setProperty("--football-visual-position", asset.position || "50% 30%");

    const image = document.createElement("img");
    image.className = "footballVisualMedia";
    image.alt = asset.alt;
    image.loading = "lazy";
    image.decoding = "async";
    image.fetchPriority = "low";
    image.dataset.src = `${asset.src}?v=${getFootballVisualRevision()}`;
    image.addEventListener("load", () => {
        panel.classList.add("imageLoaded");
        panel.classList.remove("imageFailed");
    }, { once: true });
    image.addEventListener("error", () => {
        panel.classList.add("imageFailed");
        panel.classList.remove("imageLoaded");
    }, { once: true });

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
    panel.append(image, caption);
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

function activateFootballVisualScreen(screenName){
    const screen = document.getElementById(screenName);
    if(!screen || screen.classList.contains("hidden")){ return 0; }

    const images = [...screen.querySelectorAll(
        `[data-football-visual-screen="${screenName}"] .footballVisualMedia[data-src]`
    )];
    let activated = 0;
    images.forEach(image => {
        if(image.getAttribute("src")){ return; }
        const source = image.dataset.src;
        if(!source){ return; }
        image.src = source;
        activated += 1;
    });
    return activated;
}

function initializeFootballVisuals(){
    if(footballVisualsInitialized){ return; }
    if(!window.FOOTBALL_VISUALS || !window.FOOTBALL_VISUAL_SCREEN_PLAN){
        throw new Error("Licensed football visual manifest is unavailable.");
    }
    footballVisualsInitialized = true;
}

function getFootballVisualDiagnostics(){
    const mounted = {};
    footballVisualMounts.forEach((element, screenName) => {
        mounted[screenName] = Boolean(element && element.isConnected);
    });
    return {
        initialized: footballVisualsInitialized,
        mounted,
        assetCount: window.FOOTBALL_VISUALS ? Object.keys(window.FOOTBALL_VISUALS).length : 0
    };
}

window.initializeFootballVisuals = initializeFootballVisuals;
window.prepareFootballVisualScreen = prepareFootballVisualScreen;
window.activateFootballVisualScreen = activateFootballVisualScreen;
window.getFootballVisualDiagnostics = getFootballVisualDiagnostics;
