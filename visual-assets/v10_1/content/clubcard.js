/* HO-036 club card for Club Assignment. Skin only: slides up in the slot under the crest.
   ShowdownContent.clubCard.mount(slot, card, {showCrest}) with card = data/clubCards.js row
   {club, league, city, nickname, stadium, story, challenge}. Empty facts are left out. */
(function (root) {
  "use strict";
  var NS = root.ShowdownContent = root.ShowdownContent || {};
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
  var TARGET = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8zm0-14a6 6 0 1 0 6 6 6 6 0 0 0-6-6zm0 10a4 4 0 1 1 4-4 4 4 0 0 1-4 4zm0-6a2 2 0 1 0 2 2 2 2 0 0 0-2-2z"/></svg>';
  var reduce = function () { return root.matchMedia && root.matchMedia("(prefers-reduced-motion: reduce)").matches; };

  function mount(slot, card, opts) {
    opts = opts || {};
    if (!slot) return null;
    if (!card) { slot.innerHTML = ""; return null; }
    var facts = [["City", card.city], ["Ground", card.stadium], ["League", card.league]]
      .filter(function (f) { return f[1]; })
      .map(function (f) { return "<li><span>" + f[0] + "</span>" + esc(f[1]) + "</li>"; }).join("");
    var crest = "";
    if (opts.showCrest !== false && root.getClubCrestSvg) { try { crest = root.getClubCrestSvg(card.club); } catch (e) { crest = ""; } }
    slot.innerHTML =
      '<article class="cmx cmx-club"' + (crest ? "" : ' style="grid-template-columns:1fr"') + '>' +
        (crest ? '<span class="cmx-club__crest">' + crest + '</span>' : "") +
        '<h3 class="cmx-club__name">' + esc(card.club) + '</h3>' +
        (card.nickname ? '<p class="cmx-club__nick">' + esc(card.nickname) + '</p>' : '<p class="cmx-club__nick"></p>') +
        (facts ? '<ul class="cmx-club__facts">' + facts + '</ul>' : "") +
        (card.story ? '<p class="cmx-club__story">' + esc(card.story) + '</p>' : "") +
        (card.challenge ? '<p class="cmx-club__target">' + TARGET + '<span>Board target</span>' + esc(card.challenge) + '</p>' : "") +
      '</article>';
    if (!reduce() && !opts.still) slot.firstChild.classList.add("is-in");
    return slot.firstChild;
  }

  NS.clubCard = { mount: mount };
})(typeof window !== "undefined" ? window : this);
