/* Showdown navigation bar · JOB-125/205. One shared component for every hub screen.
   SDNav.mount({ active, locked, reason, routes, onNavigate, adopt }) — see README.md and NAV_CONTRACT.md. */
(function () {
  "use strict";
  var TABS = [
    { key: "home", label: "HOME", icon: "M12 3 2.5 11h2.7v9.5h5.3v-6h3v6h5.3V11h2.7Z" },
    { key: "career", label: "CAREER", icon: "M6.5 3h11l-1 6.2A4.6 4.6 0 0 1 12 13a4.6 4.6 0 0 1-4.5-3.8ZM4 4.6h2.4l.4 2.6A2.4 2.4 0 0 1 4 4.6Zm16 0a2.4 2.4 0 0 1-2.8 2.6l.4-2.6ZM10.6 13.6h2.8v3.2h3v3.2H7.6v-3.2h3Z" },
    { key: "standings", label: "STANDINGS", icon: "M3 4h18v3.2H3Zm0 6.4h18v3.2H3Zm0 6.4h18V20H3Z" },
    { key: "stats", label: "STATS", icon: "M3 20h18v1.6H3ZM4.6 12h3.6v6.4H4.6Zm5.6-5h3.6v11.4h-3.6Zm5.6 3h3.6v8.4h-3.6Z" },
    { key: "rules", label: "RULES", icon: "M5 3.5h10.5L19 7v13.5H5Zm9.6 1.3V8h3.2ZM7.6 10h8.8v1.5H7.6Zm0 3.2h8.8v1.5H7.6Zm0 3.2h6v1.5h-6Z" }
  ];
  var GEAR = "M12 8.2a3.8 3.8 0 1 0 0 7.6 3.8 3.8 0 0 0 0-7.6Zm9 4.8v-2l-2.2-.7a7.4 7.4 0 0 0-.7-1.7l1-2.1-1.4-1.4-2.1 1a7.4 7.4 0 0 0-1.7-.7L13 3h-2l-.7 2.4a7.4 7.4 0 0 0-1.7.7l-2.1-1-1.4 1.4 1 2.1a7.4 7.4 0 0 0-.7 1.7L3 11v2l2.4.7c.2.6.4 1.2.7 1.7l-1 2.1 1.4 1.4 2.1-1c.5.3 1.1.5 1.7.7L11 21h2l.7-2.4c.6-.2 1.2-.4 1.7-.7l2.1 1 1.4-1.4-1-2.1c.3-.5.5-1.1.7-1.7L21 13Z";
  var LOCK_TEXT = "Finish this step first";
  var state = { active: "home", locked: false, reason: null, routes: {}, onNavigate: null };
  var roots = [], toast, toastTimer;

  function svg(d) { return '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="' + d + '"/></svg>'; }
  function el(tag, cls, html) { var n = document.createElement(tag); if (cls) n.className = cls; if (html) n.innerHTML = html; return n; }
  function tabButton(t, withIcon) {
    var b = el("button", "sd-nav-tab", (withIcon ? svg(t.icon) : "") + "<span>" + t.label + "</span>");
    b.type = "button"; b.dataset.navKey = t.key; return b;
  }
  function gearButton() {
    var b = el("button", "sd-nav-gear", svg(GEAR)); b.type = "button"; b.dataset.navKey = "settings"; b.setAttribute("aria-label", "Settings"); return b;
  }

  function buildTop() {
    var h = el("header", "sd-nav sd-nav-top"); h.setAttribute("aria-label", "Primary");
    h.appendChild(el("span", "sd-nav-badge", "<span>CM<b>17</b></span>")).setAttribute("aria-hidden", "true");
    var nav = el("nav", "sd-nav-tabs"); nav.setAttribute("aria-label", "Primary");
    TABS.forEach(function (t) { nav.appendChild(tabButton(t, false)); });
    h.appendChild(nav);
    h.appendChild(el("div", "sd-nav-capsule")).appendChild(gearButton());
    return h;
  }
  /* Home already ships its approved top bar (#topHeader .topBarTab): adopt it so its pixels stay unchanged. */
  function adoptTop(header) {
    header.classList.add("sd-nav", "sd-nav-adopted");
    var tabs = header.querySelectorAll(".topBarTab");
    for (var i = 0; i < tabs.length && i < TABS.length; i++) tabs[i].dataset.navKey = TABS[i].key;
    var g = header.querySelector(".topBarSettings"); if (g) g.dataset.navKey = "settings";
    return header;
  }
  function buildBottom() {
    var n = el("nav", "sd-nav sd-nav-bottom"); n.setAttribute("aria-label", "Primary");
    TABS.forEach(function (t) { n.appendChild(tabButton(t, true)); });
    return n;
  }
  function buildCorner() { var c = el("div", "sd-nav sd-nav-corner"); c.appendChild(gearButton()); return c; }

  function showToast() {
    if (!toast) { toast = el("div", "sd-nav-toast"); toast.setAttribute("role", "status"); toast.setAttribute("aria-live", "polite"); document.body.appendChild(toast); }
    toast.textContent = LOCK_TEXT; toast.classList.add("is-on");
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { toast.classList.remove("is-on"); }, 2400);
  }
  function go(key) {
    if (key === state.active) return;
    if (state.locked) { showToast(); return; }
    if (typeof state.onNavigate === "function") { state.onNavigate(key, state.routes[key]); return; }
    if (state.routes[key]) window.location.href = state.routes[key];
  }
  function paint() {
    roots.forEach(function (r) {
      r.dataset.locked = state.locked ? "true" : "false";
      if (state.reason) r.dataset.lockReason = state.reason; else delete r.dataset.lockReason;
      var items = r.querySelectorAll("[data-nav-key]");
      for (var i = 0; i < items.length; i++) {
        var b = items[i], on = b.dataset.navKey === state.active;
        if (on) b.setAttribute("aria-current", "page"); else b.removeAttribute("aria-current");
        b.classList.toggle("isActive", on); /* Home's own active class */
        if (state.locked && !on) b.setAttribute("aria-disabled", "true"); else b.removeAttribute("aria-disabled");
      }
    });
  }
  function onClick(e) {
    var b = e.target.closest && e.target.closest("[data-nav-key]");
    if (b && roots.some(function (r) { return r.contains(b); })) { e.preventDefault(); go(b.dataset.navKey); }
  }

  function mount(cfg) {
    cfg = cfg || {}; var nav = cfg.nav || cfg;
    state.active = nav.active || state.active; state.locked = !!nav.locked; state.reason = nav.locked ? (nav.reason || null) : null;
    state.routes = cfg.routes || state.routes; state.onNavigate = cfg.onNavigate || state.onNavigate;
    if (!roots.length) {
      var adopt = cfg.adopt === false ? null : document.querySelector(cfg.adopt || "#topHeader");
      var top = adopt ? adoptTop(adopt) : document.body.insertBefore(buildTop(), document.body.firstChild);
      var bottomHost = document.querySelector(cfg.bottomHost || ".nav-reserve") || document.body;
      var bottom = bottomHost.appendChild(buildBottom());
      var corner = document.body.appendChild(buildCorner());
      roots = [top, bottom, corner];
      document.addEventListener("click", onClick);
    }
    paint();
    return api;
  }
  function set(nav) { return mount({ nav: Object.assign({ active: state.active, locked: state.locked, reason: state.reason }, nav) }); }
  var api = { mount: mount, set: set, state: function () { return Object.assign({}, state); }, LOCK_TEXT: LOCK_TEXT, TABS: TABS.map(function (t) { return t.key; }) };
  window.SDNav = api;
})();
