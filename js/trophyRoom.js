/* =====================================================
   FIFA 17 Career Mode Showdown
   v1.0.1
   Lightweight Trophy Room and All-Time Records
===================================================== */

function createTrophyRoomScreen(){
    if(document.getElementById("trophyRoom")){ return; }
    const main = document.querySelector("main");
    if(!main){ return; }

    const section = document.createElement("section");
    section.id = "trophyRoom";
    section.className = "screen hidden analyticsScreen";
    const heading = document.createElement("h2");
    heading.textContent = "TROPHY ROOM";
    const content = document.createElement("div");
    content.id = "trophyRoomContent";
    content.className = "analyticsContent";
    const actions = document.createElement("div");
    actions.className = "analyticsActions";
    const back = document.createElement("button");
    back.type = "button";
    back.className = "backButton";
    back.textContent = "BACK";
    actions.appendChild(back);
    section.append(heading, content, actions);
    main.appendChild(section);
}

let trophyRoomModel = null;

// r90: the Trophy Room is always the online model view (or its unavailable state); the old local cabinets and
// all-time records were unreachable since r61 and are gone with js/analytics.js.
function renderTrophyRoom(request = false){
    const content = document.getElementById("trophyRoomContent");
    if(!content){ return; }
    const seam = readCareerScreenSeam(() => renderTrophyRoom(request));
    if(!seam){ return; }
    const normalized = seam.normalizeRenderRequest(request);
    if(normalized.hasModel){ trophyRoomModel = normalized.model; }
    const source = seam.selectCareerScreenSource({ identityState: readCareerIdentityState(), model: trophyRoomModel });
    content.replaceChildren(seam.paintCareerScreenView(document, seam.careerScreenView("trophyRoom", source === "model" ? trophyRoomModel : null)));
}

function openTrophyRoom(request = false){
    createTrophyRoomScreen();
    renderTrophyRoom(request);
    showScreen("trophyRoom");
    if(typeof openCareerScreensV10 === "function"){ openCareerScreensV10("trophyRoom"); }
}

window.renderTrophyRoom = renderTrophyRoom;
window.openTrophyRoom = openTrophyRoom;