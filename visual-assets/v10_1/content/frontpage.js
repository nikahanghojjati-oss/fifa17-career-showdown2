/* HO-036 front pages. Skin only.
   ShowdownContent.frontPage.paper(p)  -> newspaper element
     p = {headline, subhead, kicker?, variant: "season"|"gold"|"draw", season, edition, dateline,
          left:{name, club, score}, right:{name, club, score}, caption}
   ShowdownContent.frontPage.screen(slot, p, onContinue) -> a front page on its own page (season or final), with Continue
   The paper only lives on its own page: never on Legacy, never over a panel or a button.
   Crests come from window.getClubCrestSvg (js/visualIdentity.js) when it is loaded. */
(function (root) {
  "use strict";
  var NS = root.ShowdownContent = root.ShowdownContent || {};
  var MAST = "The Touchline Gazette";
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
  var crest = function (club) {
    try { return root.getClubCrestSvg ? root.getClubCrestSvg(club) : ""; } catch (e) { return ""; }
  };
  var reduce = function () { return root.matchMedia && root.matchMedia("(prefers-reduced-motion: reduce)").matches; };

  function side(s, cls) {
    s = s || {};
    return '<div class="cmx-paper__side ' + cls + '"><span class="cmx-paper__crest">' + crest(s.club) + '</span>' +
      '<span class="cmx-paper__who">' + esc(s.name) + '<small>' + esc(s.club) + '</small></span></div>';
  }

  function paper(p) {
    p = p || {};
    var el = document.createElement("article");
    var v = p.variant || "season";
    el.className = "cmx cmx-paper" + (v === "gold" ? " cmx-paper--gold" : v === "draw" ? " cmx-paper--draw" : "");
    var cols = "";
    for (var c = 0; c < 3; c++) { cols += "<div>"; for (var r = 0; r < 6; r++) cols += "<i></i>"; cols += "</div>"; }
    var hasScore = p.left && p.right && p.left.score != null && p.right.score != null;
    el.innerHTML =
      '<div class="cmx-paper__dateline"><span>' + esc(p.dateline || "Showdown edition") + '</span><span>' + esc(p.season || "") + '</span><span>' + esc(p.edition || "Price: one point") + '</span></div>' +
      '<h2 class="cmx-paper__masthead">' + esc(p.masthead || MAST) + '</h2>' +
      '<div class="cmx-paper__rules"></div>' +
      (p.kicker ? '<span class="cmx-paper__kicker">' + esc(p.kicker) + '</span>' : "") +
      '<h3 class="cmx-paper__headline">' + esc(p.headline) + '</h3>' +
      '<p class="cmx-paper__subhead">' + esc(p.subhead) + '</p>' +
      (p.left && p.right ? '<div class="cmx-paper__photo">' + side(p.left, "cmx-paper__side--dan") +
        '<span class="cmx-paper__score">' + (hasScore ? esc(p.left.score) + " – " + esc(p.right.score) : "") + '</span>' +
        side(p.right, "cmx-paper__side--nik") + '</div>' : "") +
      (p.caption ? '<p class="cmx-paper__caption">' + esc(p.caption) + '</p>' : "") +
      '<div class="cmx-paper__cols" aria-hidden="true">' + cols + '</div>';
    el.setAttribute("aria-label", (p.kicker ? p.kicker + ". " : "") + p.headline + ". " + p.subhead);
    return el;
  }

  function screen(slot, p, onContinue, opts) {
    opts = opts || {};
    slot.innerHTML =
      '<section class="cmx cmx-fp-screen"><p class="cmx-fp-screen__eyebrow">' + esc(opts.eyebrow || "Season front page") + '</p>' +
      '<h1 class="cmx-fp-screen__title">' + esc(opts.title || "Read all about it") + '</h1>' +
      '<div class="cmx-fp-screen__desk"></div>' +
      '<button type="button" class="cmx-continue">' + esc(opts.button || "Continue") + '</button></section>';
    var pp = paper(p);
    if (!reduce() && !opts.still) pp.classList.add("is-dropping");
    slot.querySelector(".cmx-fp-screen__desk").appendChild(pp);
    slot.querySelector(".cmx-continue").addEventListener("click", function () { if (onContinue) onContinue(); });
    return slot.firstChild;
  }

  NS.frontPage = { paper: paper, screen: screen };
})(typeof window !== "undefined" ? window : this);
