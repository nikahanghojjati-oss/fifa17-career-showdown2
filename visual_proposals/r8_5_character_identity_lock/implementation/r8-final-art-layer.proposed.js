/*
 * Career Mode Showdown — R8.25 proposal-only final-art layer
 * DO NOT LINK DIRECTLY FROM PRODUCTION WITHOUT DEVELOPER RECONCILIATION.
 * Baseline: main 32723b900dee45f689391908dc976f0ce5d06dd5 / 1.9.1-r11
 *
 * Decorative authority only:
 * - no storage
 * - no Firebase
 * - no scoring
 * - no routing
 * - no Save Library identity
 * - no pairing / Remote Joining
 */
(function installR8FinalArtProposal(global){
    "use strict";

    const ROOT_GATE = "r8Visual";
    const ROOT_ACTIVE_VALUE = "active";
    const HOME_LAYER_ID = "r8HomeFinalArt";

    const FROZEN_ASSETS = Object.freeze({
        nik: Object.freeze({
            id: "A01_NIK_CORE_THINKING_HERO",
            path: "assets/visual/r8/a01-nik-core-thinking-hero.png",
            sourceFileId: "file_00000000bbf081f7b29944352f5e76a5",
            sha256: "17972b8afb73b90483c8f874c4bd964ac1bda196daa76e134a6030676bbd4219",
            width: 1086,
            height: 1448
        }),
        daniel: Object.freeze({
            id: "A02_DANIEL_CORE_POINTING_HERO",
            path: "assets/visual/r8/a02-daniel-core-pointing-hero.png",
            sourceFileId: "file_000000007fe081f59bbac0a09a9eeca3",
            sha256: "9b1545b52a5d96a240c92b9901dcd8a4558148dde05a0331882df7bd988177cc",
            width: 1086,
            height: 1448
        })
    });

    function setDecorativeNodeContract(node){
        node.setAttribute("aria-hidden", "true");
        node.dataset.r8Decorative = "true";
        return node;
    }

    function createAtmosphereLayer(){
        const atmosphere = document.createElement("div");
        atmosphere.className = "r8AtmosphereLayer";
        return setDecorativeNodeContract(atmosphere);
    }

    function createCharacterLayer(asset, className){
        const layer = document.createElement("div");
        layer.className = `r8CharacterLayer ${className}`;
        layer.dataset.r8AssetId = asset.id;
        setDecorativeNodeContract(layer);

        const image = document.createElement("img");
        image.className = "r8CharacterImage";
        image.alt = "";
        image.decoding = "async";
        image.loading = "eager";
        image.width = asset.width;
        image.height = asset.height;
        image.dataset.r8AssetId = asset.id;
        image.dataset.r8ExpectedSha256 = asset.sha256;
        image.src = asset.path;

        image.addEventListener("load", () => {
            layer.classList.remove("is-missing");
            layer.dataset.r8AssetLoad = "loaded";
        }, { once: true });

        image.addEventListener("error", () => {
            layer.classList.add("is-missing");
            layer.dataset.r8AssetLoad = "missing";
            image.removeAttribute("src");
        }, { once: true });

        layer.appendChild(image);
        return layer;
    }

    function getHomeScreen(){
        return document.getElementById("mainMenu");
    }

    function validateDecorativeLayer(layer){
        if(!layer){ return false; }
        const forbidden = layer.querySelector(
            "button,input,select,textarea,a[href],[tabindex]:not([tabindex='-1']),[contenteditable='true']"
        );
        if(forbidden){
            throw new Error("R8 final-art contract violation: decorative layer contains an interactive/focusable descendant.");
        }
        if(layer.getAttribute("aria-hidden") !== "true"){
            throw new Error("R8 final-art contract violation: decorative layer is not aria-hidden.");
        }
        return true;
    }

    function mountHomeFinalArt(){
        const home = getHomeScreen();
        if(!home){ return null; }

        const existing = document.getElementById(HOME_LAYER_ID);
        if(existing){
            validateDecorativeLayer(existing);
            return existing;
        }

        const layer = document.createElement("div");
        layer.id = HOME_LAYER_ID;
        layer.className = "r8FinalArtLayer r8HomeFinalArt";
        setDecorativeNodeContract(layer);

        layer.append(
            createAtmosphereLayer(),
            createCharacterLayer(FROZEN_ASSETS.daniel, "r8CharacterLayerDaniel"),
            createCharacterLayer(FROZEN_ASSETS.nik, "r8CharacterLayerNik")
        );

        validateDecorativeLayer(layer);
        home.prepend(layer);
        return layer;
    }

    function unmountHomeFinalArt(){
        const layer = document.getElementById(HOME_LAYER_ID);
        if(layer){ layer.remove(); }
    }

    function enable(){
        const root = document.documentElement;
        root.dataset[ROOT_GATE] = ROOT_ACTIVE_VALUE;
        const layer = mountHomeFinalArt();
        return {
            enabled: true,
            homeLayerMounted: Boolean(layer),
            generationUsed: false,
            assets: FROZEN_ASSETS
        };
    }

    function disable(){
        unmountHomeFinalArt();
        delete document.documentElement.dataset[ROOT_GATE];
        return { enabled: false };
    }

    function getDiagnostics(){
        const layer = document.getElementById(HOME_LAYER_ID);
        const characters = layer
            ? Array.from(layer.querySelectorAll(".r8CharacterLayer")).map(node => ({
                assetId: node.dataset.r8AssetId || null,
                loadState: node.dataset.r8AssetLoad || "pending",
                hiddenByAssetFailure: node.classList.contains("is-missing")
            }))
            : [];

        return {
            rootGate: document.documentElement.dataset[ROOT_GATE] || null,
            homeLayerMounted: Boolean(layer),
            decorativeLayerValid: layer ? validateDecorativeLayer(layer) : true,
            characters,
            frozenAssets: FROZEN_ASSETS,
            writesStorage: false,
            writesFirebase: false,
            changesDomainAuthority: false
        };
    }

    function initializeFromScriptOptIn(){
        const currentScript = document.currentScript;
        if(!currentScript || currentScript.dataset.r8AutoEnable !== "true"){
            return;
        }
        enable();
    }

    global.CareerModeR8FinalArt = Object.freeze({
        enable,
        disable,
        mountHomeFinalArt,
        unmountHomeFinalArt,
        getDiagnostics,
        frozenAssets: FROZEN_ASSETS
    });

    if(document.readyState === "loading"){
        document.addEventListener("DOMContentLoaded", initializeFromScriptOptIn, { once: true });
    }else{
        initializeFromScriptOptIn();
    }
})(window);
