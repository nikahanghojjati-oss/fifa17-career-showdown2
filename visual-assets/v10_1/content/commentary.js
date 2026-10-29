/* HO-036 commentary bar. Skin only: Team G passes the finished line (placeholders already filled).
   ShowdownContent.commentary.mount(slot, text, {typeMs, label}) fills a reserved slot under the scores.
   The full line reserves its height first, so the typing never moves anything else on the screen. */
(function (root) {
  "use strict";
  var NS = root.ShowdownContent = root.ShowdownContent || {};
  var MIC = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-3.08A7 7 0 0 0 19 11h-2z"/></svg>';
  var reduce = function () { return root.matchMedia && root.matchMedia("(prefers-reduced-motion: reduce)").matches; };

  function mount(slot, text, opts) {
    opts = opts || {};
    if (!slot) return null;
    if (slot._cmxTimer) clearInterval(slot._cmxTimer);
    if (!text) { slot.innerHTML = ""; return null; }
    slot.innerHTML =
      '<div class="cmx cmx-bar" role="status" aria-live="polite">' +
        '<span class="cmx-bar__tab">' + (opts.label || "Commentary") + '</span>' +
        '<span class="cmx-bar__accent">' + MIC + '</span>' +
        '<div class="cmx-bar__slab"><p class="cmx-bar__text cmx-bar__ghost"></p>' +
          '<p class="cmx-bar__text cmx-bar__typed" aria-hidden="true"></p></div>' +
        '<span class="cmx-bar__end"></span>' +
      '</div>';
    var bar = slot.firstChild;
    var ghost = bar.querySelector(".cmx-bar__ghost");
    var typed = bar.querySelector(".cmx-bar__typed");
    ghost.textContent = text;
    bar.setAttribute("aria-label", text);
    var ms = opts.typeMs == null ? 28 : opts.typeMs;
    if (reduce() || ms <= 0 || opts.instant) { typed.textContent = text; return bar; }
    bar.classList.add("is-in");
    var i = 0, caret = '<span class="cmx-bar__caret"></span>';
    var step = function () {
      i += 1;
      typed.innerHTML = "";
      typed.appendChild(document.createTextNode(text.slice(0, i)));
      if (i < text.length) typed.insertAdjacentHTML("beforeend", caret);
      else clearInterval(slot._cmxTimer);
    };
    setTimeout(function () { slot._cmxTimer = setInterval(step, ms); }, 380);
    return bar;
  }

  /* fill {winner} style placeholders; Team G owns real values, this is for previews */
  function fill(line, vals) {
    return String(line).replace(/\{(\w+)\}/g, function (m, k) { return vals && vals[k] != null ? vals[k] : m; });
  }

  NS.commentary = { mount: mount, fill: fill };
})(typeof window !== "undefined" ? window : this);
