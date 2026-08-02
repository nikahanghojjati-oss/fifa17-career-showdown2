/*
=====================================================
 FIFA 17 Career Mode Showdown
 Version 0.1.0
=====================================================
*/

const APP = {

    version: "0.1.0",

    title: "FIFA 17 Career Mode Showdown"

};

document.addEventListener("DOMContentLoaded", () => {

    console.log(APP.title + " loaded.");

    initializeMenu();

});

function initializeMenu() {

    document
        .getElementById("newShowdown")
        .addEventListener("click", newShowdown);

    document
        .getElementById("continueShowdown")
        .addEventListener("click", continueShowdown);

    document
        .getElementById("statistics")
        .addEventListener("click", statistics);

    document
        .getElementById("rules")
        .addEventListener("click", rules);

    document
        .getElementById("settings")
        .addEventListener("click", settings);

}

function newShowdown() {

    showMessage("New Showdown will be available in Version 0.2");

}

function continueShowdown() {

    showMessage("Continue Showdown will be available soon.");

}

function statistics() {

    showMessage("Statistics page is under construction.");

}

function rules() {

    showMessage("Rules page is under construction.");

}

function settings() {

    showMessage("Settings page is under construction.");

}

function showMessage(message) {

    alert(message);

}
