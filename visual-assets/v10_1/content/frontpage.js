/* HO-036 front pages, Touchline Gazette full edition (HO-041). Skin only.
   ShowdownContent.frontPage.paper(p)  -> newspaper element
     p = {headline, subhead, kicker?, variant: "season"|"gold"|"draw", season, edition, dateline,
          left:{name, club, score}, right:{name, club, score}, caption,
          issue?, ears?:[left, right], photo?:{src, caption, credit}, story?:{byline, paragraphs:[]},
          numbers?:[{label, left, right}], quote?:{text, who}, portrait?:{src, caption},
          briefs?:[{head, text, trophy?}], inside?:[text], compact?: true|"short"}
     compact is the phone edition; "short" drops the lead photo for the trophy brief, for plates whose faces sit low (Final Winner).
     Every extra is optional: without them the paper is the round 2 front page.
   ShowdownContent.frontPage.screen(slot, p, onContinue) -> a front page on its own page (season or final), with Continue
   ShowdownContent.frontPage.art(name) -> url of a Gazette photo or trophy (GZ_LEAD_SEASON, TRO_LEAGUE_TITLE ...)
   The paper only lives on its own page: never on Legacy, never over a panel or a button.
   Photos are cut from the approved plates (gazette/), trophies are the shared trophy art; no player photos.
   Crests come from window.getClubCrestSvg (js/visualIdentity.js) when it is loaded. */
(function (root) {
  "use strict";
  var NS = root.ShowdownContent = root.ShowdownContent || {};
  var MAST = "The Touchline Gazette";
  var me = root.document && root.document.currentScript;
  var BASE = me && me.src ? me.src.replace(/[^/]*$/, "") : "";
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
  var crest = function (club) {
    try { return root.getClubCrestSvg ? root.getClubCrestSvg(club) : ""; } catch (e) { return ""; }
  };
  var reduce = function () { return root.matchMedia && root.matchMedia("(prefers-reduced-motion: reduce)").matches; };

  function art(name) {
    return /^TRO_/.test(name) ? BASE + "../shared/trophies/" + name + "_V1_512.webp" : BASE + "gazette/" + name + ".webp";
  }

  function side(s, cls) {
    s = s || {};
    return '<div class="cmx-paper__side ' + cls + '"><span class="cmx-paper__crest">' + crest(s.club) + '</span>' +
      '<span class="cmx-paper__who">' + esc(s.name) + '<small>' + esc(s.club) + '</small></span></div>';
  }
  function img(src, cls, alt) { return src ? '<img class="' + cls + '" src="' + esc(src) + '" alt="' + esc(alt || "") + '" decoding="async">' : ""; }

  function scoreStrip(p) {
    var hasScore = p.left && p.right && p.left.score != null && p.right.score != null;
    return p.left && p.right ? '<div class="cmx-paper__photo">' + side(p.left, "cmx-paper__side--dan") +
      '<span class="cmx-paper__score">' + (hasScore ? esc(p.left.score) + " – " + esc(p.right.score) : "") + '</span>' +
      side(p.right, "cmx-paper__side--nik") + '</div>' : "";
  }

  function leadPhoto(p) {
    var ph = p.photo;
    if (!ph || !ph.src) return "";
    return '<figure class="cmx-gz__lead">' + img(ph.src, "cmx-gz__leadimg", ph.caption) + scoreStrip(p) +
      '<figcaption class="cmx-gz__cap">' + esc(ph.caption || p.caption || "") + '<span>' + esc(ph.credit || "Gazette photo") + '</span></figcaption></figure>';
  }

  function story(p) {
    var s = p.story;
    if (!s || !s.paragraphs || !s.paragraphs.length) return "";
    return '<div class="cmx-gz__story">' + (s.byline ? '<p class="cmx-gz__byline">' + esc(s.byline) + '</p>' : "") +
      '<div class="cmx-gz__text">' + s.paragraphs.map(function (t, i) { return '<p' + (i === 0 ? ' class="cmx-gz__first"' : "") + '>' + esc(t) + '</p>'; }).join("") + '</div></div>';
  }

  function side2(p) { // beside the lead photo: the numbers table, then the pull quote
    var out = "";
    if (p.numbers && p.numbers.length && p.left && p.right) {
      out += '<section class="cmx-gz__box"><h4>' + esc(p.numbersTitle || "Season in numbers") + '</h4><table class="cmx-gz__nums"><thead><tr><th></th><th>' + esc(p.left.name) + '</th><th>' + esc(p.right.name) + '</th></tr></thead><tbody>' +
        p.numbers.map(function (r) { return '<tr' + (r.total ? ' class="is-total"' : "") + '><td>' + esc(r.label) + '</td><td>' + esc(r.left) + '</td><td>' + esc(r.right) + '</td></tr>'; }).join("") + '</tbody></table></section>';
    }
    if (p.quote && p.quote.text) out += '<blockquote class="cmx-gz__quote"><p>“' + esc(p.quote.text) + '”</p><cite>' + esc(p.quote.who || "") + '</cite></blockquote>';
    return out ? '<aside class="cmx-gz__side">' + out + '</aside>' : "";
  }
  function portrait(p) {
    return p.portrait && p.portrait.src ? '<figure class="cmx-gz__portrait">' + img(p.portrait.src, "", p.portrait.caption) + '<figcaption>' + esc(p.portrait.caption || "") + '</figcaption></figure>' : "";
  }

  function briefs(p) {
    if (!p.briefs || !p.briefs.length) return "";
    return '<section class="cmx-gz__desk"><h4>' + esc(p.deskTitle || "Trophy desk") + '</h4><div class="cmx-gz__briefs">' +
      p.briefs.map(function (b) {
        return '<article class="cmx-gz__brief">' + (b.trophy ? img(b.trophy, "cmx-gz__tro", "") : '<span class="cmx-gz__tro cmx-gz__tro--crest">' + crest(b.club) + '</span>') +
          '<div><h5>' + esc(b.head) + '</h5><p>' + esc(b.text) + '</p></div></article>';
      }).join("") + '</div></section>';
  }

  function inside(p) {
    if (!p.inside || !p.inside.length) return "";
    return '<div class="cmx-gz__inside"><b>Inside today</b>' + p.inside.map(function (t) { return '<span>' + esc(t) + '</span>'; }).join("") + '</div>';
  }

  function paper(p) {
    p = p || {};
    var el = document.createElement("article");
    var v = p.variant || "season";
    var full = !!(p.photo || p.story);
    el.className = "cmx cmx-paper" + (v === "gold" ? " cmx-paper--gold" : v === "draw" ? " cmx-paper--draw" : "") + (full ? " cmx-gz" : "") + (p.compact ? " cmx-gz--compact" : "") + (p.compact === "short" ? " cmx-gz--short" : "");
    var ears = p.ears && p.ears.length ? p.ears : null;
    var mast = '<h2 class="cmx-paper__masthead">' + esc(p.masthead || MAST) + '</h2>';
    var head =
      '<div class="cmx-paper__dateline"><span>' + esc(full ? (p.issue || p.dateline || "Showdown edition") : (p.dateline || "Showdown edition")) + '</span><span>' + esc(p.season || "") + '</span><span>' + esc(p.edition || "Price: one point") + '</span></div>' +
      (full && ears ? '<div class="cmx-gz__mastrow"><p class="cmx-gz__ear">' + esc(ears[0]) + '</p>' + mast + '<p class="cmx-gz__ear">' + esc(ears[1] || "") + '</p></div>' : mast) +
      '<div class="cmx-paper__rules"></div>' +
      (full ? '<p class="cmx-gz__edline">' + esc(p.dateline || "Showdown edition") + '</p>' : "");
    if (!full) {
      var cols = "";
      for (var c = 0; c < 3; c++) { cols += "<div>"; for (var r = 0; r < 6; r++) cols += "<i></i>"; cols += "</div>"; }
      el.innerHTML = head +
        (p.kicker ? '<span class="cmx-paper__kicker">' + esc(p.kicker) + '</span>' : "") +
        '<h3 class="cmx-paper__headline' + (p.headline.length > 24 ? ' cmx-paper__headline--long' : '') + '">' + esc(p.headline) + '</h3>' +
        '<p class="cmx-paper__subhead">' + esc(p.subhead) + '</p>' + scoreStrip(p) +
        (p.caption ? '<p class="cmx-paper__caption">' + esc(p.caption) + '</p>' : "") +
        '<div class="cmx-paper__cols" aria-hidden="true">' + cols + '</div>';
    } else {
      el.innerHTML = head +
        '<div class="cmx-gz__top">' + (p.kicker ? '<span class="cmx-paper__kicker">' + esc(p.kicker) + '</span>' : "") +
        '<h3 class="cmx-paper__headline' + (p.headline.length > 24 ? ' cmx-paper__headline--long' : '') + '">' + esc(p.headline) + '</h3>' +
        '<p class="cmx-paper__subhead">' + esc(p.subhead) + '</p></div>' +
        '<div class="cmx-gz__front">' + (p.photo && p.photo.src ? leadPhoto(p) : scoreStrip(p)) + side2(p) + '</div>' +
        '<div class="cmx-gz__body">' + story(p) + portrait(p) + '</div>' + briefs(p) + inside(p);
    }
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

  NS.frontPage = { paper: paper, screen: screen, art: art };
})(typeof window !== "undefined" ? window : this);
