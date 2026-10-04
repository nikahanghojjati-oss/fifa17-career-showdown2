// JOB-095 · Settings scaffold.
// Step 1: fixture-driven plain DOM only. Styling begins in later steps.
(function () {
  "use strict";

  const qs = new URLSearchParams(window.SETTINGS_QS || location.search);
  const stage = document.getElementById("stage-root");

  function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value == null ? "" : String(value);
  }

  function makeButton(text, className) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = text;
    if (className) button.className = className;
    return button;
  }

  function renderMotionChoices(strings, values) {
    const group = document.getElementById("motionChoices");
    group.replaceChildren();
    group.setAttribute("aria-label", strings.groupAriaLabel);

    [
      [strings.followDevice, strings.followDeviceDescription],
      [strings.reduceMotion, strings.reduceMotionDescription]
    ].forEach(([label, description]) => {
      const choice = makeButton(label, "settingsMotionChoice");
      choice.setAttribute("role", "radio");
      choice.setAttribute("aria-checked", String(values.selected === label));
      const detail = document.createElement("span");
      detail.textContent = description;
      choice.append(document.createElement("br"), detail);
      group.appendChild(choice);
    });
  }

  function renderActions(strings, frame) {
    const accountActions = document.getElementById("accountActions");
    accountActions.replaceChildren();
    frame.values.account.actions.forEach((label) => accountActions.appendChild(makeButton(label, "sd-btn sd-btn--secondary")));

    const dataActions = document.getElementById("dataActions");
    dataActions.replaceChildren();
    if (frame.values.currentShowdownAction.deleteVisible) {
      dataActions.appendChild(makeButton(strings.dataActions.deleteCurrent, "settingsDeleteCurrentShowdown settingsDangerButton"));
    }
    dataActions.appendChild(makeButton(strings.dataActions.openHistory, "settingsDataButton sd-btn sd-btn--secondary"));
  }

  function renderCredit(strings, showCredit) {
    const credit = document.getElementById("photoCredit");
    credit.hidden = !showCredit;
    if (!showCredit) return;
    setText("creditPrefix", "Marco Reus photo: ");
    const author = document.getElementById("creditAuthor");
    author.textContent = strings.creditAuthor;
    author.href = strings.creditAuthorUrl;
    const license = document.getElementById("creditLicense");
    license.textContent = strings.creditLicense;
    license.href = strings.creditLicenseUrl;
    setText("creditSuffix", " · Cropped for display");
  }

  function applyFrame(FX, frameId) {
    const S = FX.strings;
    const frame = FX.frames[frameId];
    const V = frame.values;
    stage.dataset.frame = frameId;
    stage.dataset.status = V.status;
    stage.dataset.viewerRole = V.viewerRole;
    stage.dataset.confirmOpen = String(Boolean(V.confirmDialog.open));

    setText("settingsEyebrow", S.shell.eyebrow);
    setText("settingsTitle", S.shell.heading);
    setText("settingsClose", S.shell.closeGlyph);
    document.getElementById("settingsClose").setAttribute("aria-label", S.shell.closeAriaLabel);
    setText("settingsDone", S.shell.done);
    document.getElementById("settingsDone").className = "sd-btn sd-btn--primary";
    document.getElementById("applicationUpdate").classList.add("sd-btn", "sd-btn--secondary");
    setText("previewTag", frame.previewLabel);
    setText("frameNote", frame.note);
    setText("contractState", V.status);
    setText("interimLabel", V.interimLabel || "");

    setText("accountEyebrow", S.account.eyebrow);
    setText("accountTitle", V.account.title);
    setText("accountDescription", S.account.description);
    setText("playerLabel", S.account.playerLabel);
    setText("playerValue", V.account.player);
    setText("deviceLabel", S.account.deviceLabel);
    setText("deviceValue", V.account.device);

    setText("applicationEyebrow", S.application.eyebrow);
    setText("applicationTitle", S.application.title);
    setText("applicationDescription", S.application.description);
    setText("versionLabel", S.application.versionLabel);
    setText("versionValue", V.application.version);
    setText("applicationUpdate", V.application.updateAction);
    setText("applicationUpdateStatus", V.application.updateStatus);
    renderCredit(S.application, V.application.showCredit);

    setText("motionEyebrow", S.motion.eyebrow);
    setText("motionTitle", S.motion.title);
    setText("motionDescription", S.motion.description);
    setText("motionBadge", V.motion.badge);
    setText("devicePreferenceLabel", S.motion.devicePreferenceLabel);
    setText("devicePreferenceValue", V.motion.devicePreference);
    setText("effectiveMotionLabel", S.motion.effectiveLabel);
    setText("effectiveMotionValue", V.motion.effective);
    renderMotionChoices(S.motion, V.motion);

    setText("feedbackLabel", S.motion.feedbackLabel);
    setText("feedbackDescription", S.motion.feedbackDescription);
    setText("feedbackToggle", V.menuFeedback.label);
    const feedback = document.getElementById("feedbackToggle");
    feedback.setAttribute("aria-checked", String(V.menuFeedback.enabled));
    feedback.setAttribute("aria-label", V.menuFeedback.ariaLabel);

    setText("dataEyebrow", S.dataActions.eyebrow);
    setText("dataTitle", S.dataActions.title);
    setText("dataDescription", S.dataActions.description);
    setText("dataNote", V.currentShowdownAction.active ? S.dataActions.activeNote : S.dataActions.emptyNote);
    renderActions(S, frame);

    const confirm = document.getElementById("confirmDialog");
    const confirmOpen = Boolean(V.confirmDialog.open);
    confirm.hidden = !confirmOpen;
    const settingsContent = document.getElementById("settingsContent");
    const settingsFooter = document.querySelector(".settingsFooter");
    const settingsHeader = document.querySelector(".settingsHeader");
    settingsContent.inert = confirmOpen;
    settingsFooter.inert = confirmOpen;
    settingsHeader.inert = confirmOpen;
    setText("confirmMessage", V.confirmDialog.message || "");
    const deleteConfirm = confirm.querySelector("[data-confirm='delete']");
    if (deleteConfirm) deleteConfirm.textContent = S.dataActions.deleteCurrent;
  }

  fetch("fixtures.json", { cache: "no-store" })
    .then((response) => response.json())
    .then((FX) => {
      const frameIds = Object.keys(FX.frames);
      const requested = qs.get("frame");
      const frameId = requested && FX.frames[requested] ? requested : frameIds[0];
      applyFrame(FX, frameId);
    })
    .catch((error) => {
      setText("contractState", error.message);
      stage.dataset.fixtureError = "true";
    });
}());
