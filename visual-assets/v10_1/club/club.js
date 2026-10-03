/* CLUB-V1 · Club Assignment on the Club plate.
   Paint the stage (plate + aria-hidden covers + pack reveal), place the live product DOM.
   Every plate-registered thing goes through plateToScreen (C4b). */
(function () {
  "use strict";
  const PW = 1536, PH = 864;
  const HEADER_D = 56, HEADER_M = 48, FOOTER_D = 28;
  const qs = new URLSearchParams(location.search);
  const FRAME = (qs.get("frame") || location.hash.replace("#", "") || "CL1").toUpperCase();
  const GRID = qs.get("grid") === "1";
  const T_PARAM = qs.has("t") ? Math.max(0, Math.min(1, parseFloat(qs.get("t")))) : null;
  const PLAY = qs.get("play") === "1";
  const RM = qs.get("rm") === "1" || matchMedia("(prefers-reduced-motion: reduce)").matches;
  const RIP_MS = 1500, RM_MS = 600;

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const SVGNS = "http://www.w3.org/2000/svg";

  /* ---------------- geometry (1X plate px) ---------------- */
  // Pack reveal geometry, measured on ENV_CLUB_PLATE_V1_1X (see BUILD_RESULT "Pack rip geometry").
  const RIP = [
    { // Daniel (left): top hand grips the top-left corner, side hand the right edge
      body: [[284, 352], [548, 352], [550, 596], [284, 596]],
      stripX: [372, 552], stripTop: 343, holeTop: 351, tearY: 378, tearSeed: 3,
      burst: [462, 372], crest: [417, 466], crestSize: 140, flapPivot: [470, 362], flapDir: 1,
    },
    { // Nik (right): top hand grips the top-right corner, side hand the left edge
      body: [[1004, 351], [1250, 351], [1250, 596], [1002, 596]],
      stripX: [993, 1142], stripTop: 341, holeTop: 349, tearY: 376, tearSeed: 11,
      burst: [1070, 370], crest: [1122, 466], crestSize: 140, flapPivot: [1066, 360], flapDir: -1,
    },
  ];
  // Desktop UI anchors (plate px). Centre column between the faces.
  const L = {
    titleCx: 748, kicker: [94, 110], h2: [106, 188], info: [192, 298],
    railY: [310, 384], railX: [604, 688, 772, 856, 940],
    vs: [622, 399, 890, 562],
    faces: [[188, 616, 552, 746], [984, 616, 1348, 746]],
    center: [560, 608, 976, 746],
    buttonsY: [751, 814],
  };

  let FX, MAP, HANDS;
  let T = { k: 1, offX: 0, offY: 0, mode: "desktop", clip: [0, 0, 0, 0] };
  let anims = [];

  function plateToScreen(x, y, t = T) { return [t.offX + x * t.k, t.offY + y * t.k]; }
  function rectToScreen(r, t = T) {
    const [x0, y0] = plateToScreen(r[0], r[1], t), [x1, y1] = plateToScreen(r[2], r[3], t);
    return { left: x0, top: y0, width: x1 - x0, height: y1 - y0, right: x1, bottom: y1 };
  }
  const isPhone = () => matchMedia("(max-width: 760px) and (orientation: portrait)").matches;

  /* ---------------- product truth (port of clubAssignment.js render functions) ---------------- */
  function setClubText(el, v) { if (!el) return; const n = String(v ?? ""); if (el.textContent !== n) el.textContent = n; }
  function setRevealControls(f) {
    const open = $("#openClubPack"), cont = $("#continueClubAssignment"), back = $("#clubAssignmentBack");
    open.classList.toggle("hidden", !f.open.show); open.disabled = Boolean(f.open.disabled);
    cont.classList.toggle("hidden", !f.confirm.show); cont.disabled = Boolean(f.confirm.disabled);
    back.classList.toggle("hidden", !f.back.show); back.disabled = !f.back.show;
    back.setAttribute("aria-disabled", String(!f.back.show));
    // product setClubText(button, ...) targets the label span so the aria-hidden glyphs survive
    const lab = b => $(".btnLabel", b) || b;
    if (f.open.text) setClubText(lab(open), f.open.text);
    setClubText(lab(cont), "CONFIRM RIVALRY & START SHOWDOWN");
  }
  const STAGES = ["ready", "opening", "manager-one", "manager-two", "versus", "confirmation"];
  function setClubRevealStage(stage) {
    const screen = $("#clubWheelScreen"); screen.dataset.clubRevealStage = stage;
    const ai = STAGES.indexOf(stage);
    $$(".clubRevealProgress [data-reveal-step]").forEach(s => {
      const i = STAGES.indexOf(s.dataset.revealStep);
      s.classList.toggle("active", i === ai); s.classList.toggle("done", i >= 0 && i < ai);
    });
  }
  function applyCard(card, clubEl, stateEl, name, revealed) {
    if (revealed) {
      setClubText(clubEl, name); window.applyClubIdentity(clubEl, name);
      const id = window.getClubIdentity(name);
      card.style.setProperty("--club-primary", id.primary); card.style.setProperty("--club-secondary", id.secondary);
      card.style.setProperty("--club-accent", id.accent); card.style.setProperty("--club-angle", id.angle);
      setClubText(stateEl, "REVEALED"); card.classList.add("is-revealed");
    } else {
      setClubText(clubEl, "?"); window.applyClubIdentity(clubEl, null);
      setClubText(stateEl, "SEALED"); card.classList.remove("is-revealed");
      ["--club-primary", "--club-secondary", "--club-accent", "--club-angle"].forEach(p => card.style.removeProperty(p));
    }
  }
  function renderFrame(f) {
    setClubRevealStage(f.stage);
    setClubText($("#clubAssignmentLeague"), FX.league);
    setClubText($("#clubPlayerOne"), FX.managers.playerOne);
    setClubText($("#clubPlayerTwo"), FX.managers.playerTwo);
    applyCard($("#clubCardOne"), $("#clubNameOne"), $("#clubCardStateOne"), FX.clubs.playerOne, f.revealed[0]);
    applyCard($("#clubCardTwo"), $("#clubNameTwo"), $("#clubCardStateTwo"), FX.clubs.playerTwo, f.revealed[1]);
    const conf = $("#clubRivalryConfirmation");
    if (f.confirmation) {
      setClubText($("#clubConfirmationShowdown"), FX.showdown);
      setClubText($("#clubConfirmationMeta"), FX.meta);
      setClubText($("#clubConfirmationManagerOne"), FX.managers.playerOne);
      setClubText($("#clubConfirmationManagerTwo"), FX.managers.playerTwo);
      setClubText($("#clubConfirmationClubOne"), FX.clubs.playerOne);
      setClubText($("#clubConfirmationClubTwo"), FX.clubs.playerTwo);
      window.applyClubIdentity($("#clubConfirmationClubOne"), FX.clubs.playerOne);
      window.applyClubIdentity($("#clubConfirmationClubTwo"), FX.clubs.playerTwo);
    }
    conf.classList.toggle("hidden", !f.confirmation);
    setClubText($("#clubPackStatus"), f.status);
    setRevealControls(f);
    setClubText($("#onlinePlayerIdentityBadge"), FX.header.onlinePlayerIdentityBadge);
    setClubText($("#seasonIndicator"), FX.header.seasonIndicator);
  }

  /* ---------------- decorative glyphs (aria-hidden SVG) ---------------- */
  const svg = (w, h, inner, cls) => `<svg class="${cls || ""}" viewBox="0 0 ${w} ${h}" aria-hidden="true" focusable="false">${inner}</svg>`;
  const CHECK = svg(20, 20, '<circle cx="10" cy="10" r="9" fill="#F2C45B"/><path d="M5.5 10.4l3 3 6-6.4" fill="none" stroke="#0B0D10" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>', "glyph check");
  const PACK = svg(20, 20, '<path d="M4 5.5l6-3 6 3v9l-6 3-6-3z" fill="none" stroke="#F2C45B" stroke-width="1.6" stroke-linejoin="round"/><path d="M4 5.5l6 3 6-3M10 8.5v9" fill="none" stroke="#F2C45B" stroke-width="1.6"/>', "glyph pack");
  const PACK_INK = svg(22, 22, '<rect x="4" y="3" width="14" height="16" rx="2" fill="#0B0D10"/><path d="M8 3l1.5 2.4L11 3l1.5 2.4L14 3" fill="none" stroke="#E0AE3A" stroke-width="1.3"/><path d="M8 10.5l3-2.2 3 2.2-.8 3.4H8.8z" fill="#E0AE3A"/>', "glyph");
  const CHEV = svg(14, 14, '<path d="M4.5 2.5L9.5 7l-5 4.5" fill="none" stroke="#0B0D10" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>', "glyph chev");
  const SHIELD_PATH = "M28 3L51 10V28C51 43 41 52 28 57C15 52 5 43 5 28V10Z";
  const SEALED_SHIELD = svg(56, 60, `<defs><linearGradient id="sg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2A2C31"/><stop offset="1" stop-color="#0E0F12"/></linearGradient></defs><path d="${SHIELD_PATH}" fill="url(#sg)" stroke="#C99B45" stroke-width="1.6"/><path d="M21.5 23.5c0-4 3-6.5 6.6-6.5 3.8 0 6.6 2.4 6.6 5.9 0 3.1-2 4.4-3.9 5.6-1.6 1-2.1 1.7-2.1 3.6v1.1" fill="none" stroke="#E9DFC8" stroke-width="3.2" stroke-linecap="round"/><circle cx="28.6" cy="40.6" r="2.3" fill="#E9DFC8"/>`, "sealedShield");

  /* ---------------- stage construction ---------------- */
  function el(tag, cls, parent, html) { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; if (parent) parent.appendChild(e); return e; }
  function worldSvg(cls, parent) {
    const s = document.createElementNS(SVGNS, "svg");
    s.setAttribute("viewBox", `0 0 ${PW} ${PH}`); s.setAttribute("preserveAspectRatio", "none");
    s.setAttribute("aria-hidden", "true"); s.setAttribute("class", cls); parent.appendChild(s); return s;
  }
  const pts = a => a.map(p => p.join(",")).join(" ");

  function jagged(x0, x1, y, seed) {
    // deterministic torn edge: zig-zag every ~9 px, amplitude 5 (10 plate px peak to peak) with jitter
    const out = []; let s = seed;
    const rnd = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
    const n = Math.max(4, Math.round(Math.abs(x1 - x0) / 9));
    for (let i = 0; i <= n; i++) {
      const x = x0 + (x1 - x0) * i / n;
      const amp = (i % 2 ? 5 : -5) + (rnd() - 0.5) * 3.2;
      out.push([+x.toFixed(1), +(y + amp + Math.sin(i * 0.7 + seed) * 1.6).toFixed(1)]);
    }
    return out;
  }

  function buildDecor() {
    const world = $("#world");
    world.innerHTML = "";
    el("div", "plateBase", world);
    // JOB-043: transparent, tone-matched seam repairs are registered to the same full plate.
    // They never enter protected faces, packs or hand polygons.
    const seamMend = el("div", "seamMend plateDup", world);
    seamMend.style.backgroundImage = "image-set(url(assets/OVL_CLUB_SEAM_MENDS_V1_1X.webp) 1x, url(assets/OVL_CLUB_SEAM_MENDS_V1_2X.webp) 2x)";
    // intake-zone covers (desktop and phone): dark glass shapes that the live UI sits on
    worldSvg("covers", world).id = "covers";
    // pack reveal per side
    RIP.forEach((r, i) => {
      const pb = MAP.protected_boxes[i ? "pack_nik" : "pack_daniel"];
      r.box = pb;
      const wrap = el("div", "reveal", world); wrap.dataset.side = String(i);
      const inner = el("div", "rvInner", wrap);
      const tear = jagged(r.stripX[0], r.stripX[1], r.tearY, r.tearSeed);
      r.tear = tear;
      const strip = [[r.stripX[0], r.stripTop], [r.stripX[1], r.stripTop], ...tear.slice().reverse()];
      const hole = [[r.stripX[0], r.holeTop], [r.stripX[1], r.holeTop], ...tear.slice().reverse()];
      r.strip = strip; r.hole = hole;
      const gid = "g" + i;
      const dark = worldSvg("rvDark", inner);
      dark.innerHTML = `<defs><linearGradient id="${gid}d" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity=".46"/><stop offset=".35" stop-color="#000" stop-opacity=".35"/><stop offset="1" stop-color="#000" stop-opacity=".32"/></linearGradient></defs><polygon points="${pts(r.body)}" fill="url(#${gid}d)"/>`;
      const holeS = worldSvg("rvHole", inner);
      const [bx, by] = r.burst;
      holeS.innerHTML = `<defs><radialGradient id="${gid}h" gradientUnits="userSpaceOnUse" cx="${bx}" cy="${r.tearY + 2}" r="${(r.stripX[1] - r.stripX[0]) * 0.62}"><stop offset="0" stop-color="#FFE7A1"/><stop offset=".25" stop-color="#F2B640"/><stop offset=".6" stop-color="#5A3A0C"/><stop offset="1" stop-color="#120B03"/></radialGradient></defs>
        <polygon points="${pts(hole)}" fill="url(#${gid}h)"/>`;
      const edge = worldSvg("rvEdge", inner);
      edge.innerHTML = `<polyline points="${pts(tear)}" fill="none" stroke="#2A1B06" stroke-width="3.2" stroke-linejoin="miter" opacity=".8"/><polyline points="${pts(tear)}" fill="none" stroke="#FFE3A0" stroke-width="1.4" stroke-linejoin="miter"/><polyline points="${pts(tear.map(p => [p[0], p[1] + 2.4]))}" fill="none" stroke="#C99B45" stroke-width=".9" opacity=".8"/>`;
      const burst = worldSvg("rvBurst", inner);
      let rays = "";
      const N = 14;
      for (let j = 0; j < N; j++) {
        // fan from the opening: upward half plus a wide spill across the pack face
        const a = (-170 + j * (340 / (N - 1))) * Math.PI / 180;
        const len = 120 + ((j * 37) % 5) * 22;
        const w = 0.035 + ((j * 13) % 3) * 0.012;
        const x1 = bx + Math.cos(a - w) * len, y1 = by + Math.sin(a - w) * len;
        const x2 = bx + Math.cos(a + w) * len, y2 = by + Math.sin(a + w) * len;
        rays += `<polygon points="${bx},${by} ${x1.toFixed(1)},${y1.toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)}"/>`;
      }
      burst.innerHTML = `<defs><radialGradient id="${gid}r" gradientUnits="userSpaceOnUse" cx="${bx}" cy="${by}" r="230"><stop offset="0" stop-color="#FFF4C8" stop-opacity="1"/><stop offset=".35" stop-color="#F2C45B" stop-opacity=".75"/><stop offset="1" stop-color="#C99B45" stop-opacity="0"/></radialGradient>
        <radialGradient id="${gid}c" gradientUnits="userSpaceOnUse" cx="${bx}" cy="${by + 4}" r="70"><stop offset="0" stop-color="#FFF6D6"/><stop offset=".5" stop-color="#F7D46A" stop-opacity=".55"/><stop offset="1" stop-color="#F2C45B" stop-opacity="0"/></radialGradient></defs>
        <g fill="url(#${gid}r)">${rays}</g><ellipse cx="${bx}" cy="${by + 4}" rx="86" ry="34" fill="url(#${gid}c)"/>`;
      const crest = el("div", "rvCrest", inner);
      crest.dataset.side = String(i);
      const flap = el("div", "rvFlap plateDup", inner);
      r.els = { wrap, inner, dark, hole: holeS, edge, burst, crest, flap };
    });
    // JOB-043: the derived contact shadow paints on the pack below the fingers.
const contact = el("div", "handContact plateDup", world);
contact.style.backgroundImage = "image-set(url(assets/OVL_CLUB_HAND_CONTACTS_V1_1X.webp) 1x, url(assets/OVL_CLUB_HAND_CONTACTS_V1_2X.webp) 2x)";
const handCore = el("div", "handCore plateDup", world);
handCore.style.backgroundImage = "image-set(url(assets/OVL_CLUB_HAND_CORES_V1_1X.webp) 1x, url(assets/OVL_CLUB_HAND_CORES_V1_2X.webp) 2x)";
const handAsset = {
hand_daniel_top: "OVL_CLUB_DANIEL_TOP_HAND_V1",
hand_daniel_side: "OVL_CLUB_DANIEL_SIDE_HAND_V1",
hand_nik_top: "OVL_CLUB_NIK_TOP_HAND_V1",
hand_nik_side: "OVL_CLUB_NIK_SIDE_HAND_V1",
};
Object.entries(HANDS.hands).forEach(([name]) => {
const d = el("div", "handOv plateDup", world); d.dataset.hand = name; d.dataset.cutout = "1";
const stem = handAsset[name];
d.style.backgroundImage = `image-set(url(assets/${stem}_1X.webp) 1x, url(assets/${stem}_2X.webp) 2x)`;
});
    if (GRID) worldSvg("gridSvg", world).id = "gridSvg";
  }

  /* covers: shapes are re-computed per viewport so they keep >= 8 screen px off faces, hands and packs */
  function coverShapes(k) {
    const m = Math.ceil(8 / k) + 1;
    const P = MAP.protected_boxes, H = HANDS.hands;
    const fd = P.face_daniel, fn = P.face_nik, pd = P.pack_daniel, pn = P.pack_nik;
    const hds = H.hand_daniel_side.box, hns = H.hand_nik_side.box;
    const xl = fd[2] + m, xr = fn[0] - m, py = pd[1] - m, pl = pd[2] + m, pr = pn[0] - m;
    const ch = 10;
    const banner = [[xl + ch, 86], [xr - ch, 86], [xr, 86 + ch], [xr, py], [pr, py], [pr, 394 - ch], [pr - ch, 394], [pl + ch, 394], [pl, 394 - ch], [pl, py], [xl, py], [xl, 86 + ch]];
    const vs = L.vs, c = 12;
    const vsShape = [[vs[0] + c, vs[1]], [vs[2] - c, vs[1]], [vs[2], vs[1] + c], [vs[2], vs[3] - c], [vs[2] - c, vs[3]], [vs[0] + c, vs[3]], [vs[0], vs[3] - c], [vs[0], vs[1] + c]];
    const top = pd[3] + m;                               // panel body top (clears both pack boxes)
    const tl = Math.max(pl, hds[2] + m), tr = Math.min(pr, hns[0] - m);
    const sl = hds[3] + m, sr = hns[3] + m;              // shoulder heights clear the side hands
    const panel = [[140, top], [pl, top], [tl, Math.min(top, sl)], [tl + 14, 566], [tr - 14, 566], [tr, Math.min(top, sr)], [pr, top], [1396, top], [1412, 750], [124, 750]];
    if (T.short) { panel.splice(panel.length - 2, 2, [1412, PH], [124, PH]); }
    const dock = [[432, 744], [1104, 744], [1104, 812], [432, 812]];
    const apron = [[0, 804], [PW, 804], [PW, PH], [0, PH]];
    // header shadow apron, split around the face boxes (desktop only)
    const hdr = [[0, fd[0] - m], [fd[2] + m, fn[0] - m], [fn[2] + m, PW]];
    return { m, banner, vs: vsShape, panel, dock, apron, hdr, tab: [tl, 566, tr, top] };
  }

  function drawCovers(k, phone) {
    const s = coverShapes(k); T.covers = s;
    const svgEl = $("#covers");
    const hdr = phone ? "" : s.hdr.map(([a, b]) => `<rect x="${a}" y="0" width="${b - a}" height="80" fill="url(#cvHdr)"/>`).join("");
    svgEl.innerHTML = `<defs>
      <linearGradient id="cvGlass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0B0C0F" stop-opacity=".93"/><stop offset="1" stop-color="#07080A" stop-opacity=".96"/></linearGradient>
      <linearGradient id="cvBanner" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0A0B0E" stop-opacity=".95"/><stop offset=".7" stop-color="#0D0E11" stop-opacity=".93"/><stop offset="1" stop-color="#090A0C" stop-opacity=".96"/></linearGradient>
      <radialGradient id="cvBannerGlow" cx=".5" cy=".38" r=".6"><stop offset="0" stop-color="#C99B45" stop-opacity=".16"/><stop offset="1" stop-color="#C99B45" stop-opacity="0"/></radialGradient>
      <linearGradient id="cvVs" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#121215" stop-opacity=".97"/><stop offset=".5" stop-color="#08090B" stop-opacity=".97"/><stop offset="1" stop-color="#141108" stop-opacity=".97"/></linearGradient>
      <linearGradient id="cvDock" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#07080A" stop-opacity=".96"/><stop offset="1" stop-color="#050607" stop-opacity=".98"/></linearGradient>
      <linearGradient id="cvApron" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#050607" stop-opacity=".97"/><stop offset="1" stop-color="#030304" stop-opacity="1"/></linearGradient>
      <linearGradient id="cvHdr" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#060709" stop-opacity=".9"/><stop offset=".7" stop-color="#060709" stop-opacity=".75"/><stop offset="1" stop-color="#060709" stop-opacity="0"/></linearGradient>
      <linearGradient id="cvGold" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#C99B45" stop-opacity="0"/><stop offset=".18" stop-color="#F2C45B"/><stop offset=".82" stop-color="#F2C45B"/><stop offset="1" stop-color="#C99B45" stop-opacity="0"/></linearGradient>
      <filter id="cvUnder" x="-10%" y="-40%" width="120%" height="180%"><feGaussianBlur stdDeviation="9"/></filter>
      <filter id="cvPulse" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="5"/></filter>
    </defs>
    ${hdr}
    ${FRAME === "CL2" ? RIP.map(r => `<polygon points="${pts(r.body)}" fill="none" stroke="#FFD97A" stroke-width="7" opacity=".35" filter="url(#cvPulse)"/><polygon points="${pts(r.body)}" fill="none" stroke="#FFE7A1" stroke-width="1.6" opacity=".85"/>`).join("") : ""}
    <polygon points="${pts(s.apron)}" fill="url(#cvApron)"/>
    <polygon points="${pts(s.dock)}" fill="url(#cvDock)"/>
    <polygon points="${pts(s.panel)}" fill="#F2C45B" opacity=".22" filter="url(#cvUnder)" transform="translate(0 6)"/>
    <polygon points="${pts(s.panel)}" fill="url(#cvGlass)"/>
    <polyline points="${pts(s.panel.slice(0, 10))}" fill="none" stroke="url(#cvGold)" stroke-width="1.3"/>
    <polygon points="${pts(s.banner)}" fill="url(#cvBanner)"/>
    <polygon points="${pts(s.banner)}" fill="url(#cvBannerGlow)"/>
    <polygon points="${pts(s.banner)}" fill="none" stroke="#C99B45" stroke-opacity=".55" stroke-width="1.1"/>
    <polygon points="${pts(s.vs)}" fill="url(#cvVs)"/>
    <polygon points="${pts(s.vs)}" fill="none" stroke="#F2C45B" stroke-opacity=".7" stroke-width="1.3"/>
    <g opacity="${phone ? 0 : 0.5}" stroke="#F2C45B" stroke-width="1.2" fill="none">
      <path d="M${L.vs[0] + 16} ${L.vs[3] - 26} L${L.vs[0] + 52} ${L.vs[1] + 30}"/><path d="M${L.vs[0] + 28} ${L.vs[3] - 20} L${L.vs[0] + 62} ${L.vs[1] + 40}"/>
      <path d="M${L.vs[2] - 16} ${L.vs[1] + 26} L${L.vs[2] - 52} ${L.vs[3] - 30}"/><path d="M${L.vs[2] - 28} ${L.vs[1] + 20} L${L.vs[2] - 62} ${L.vs[3] - 40}"/>
    </g>`;
  }

  /* ---------------- layout ---------------- */
  function computeTransform() {
    const W = innerWidth, H = innerHeight;
    if (!isPhone()) {
    // JOB-043: Tier-S / 16:9 desktop is the mockup camera, exactly. Cover-fit the
    // 1536x864 plate, centre it, and do not add a face/header or button/footer bias.
    // Non-16:9 short desktops keep the prior safety composition so a face is never cut.
    const k = Math.max(W / PW, H / PH);
    const offX = (W - PW * k) / 2;
    const centeredY = (H - PH * k) / 2;
    const faceY = HEADER_D + 8 - 65 * k;
    const short = H - FOOTER_D - L.buttonsY[1] * k - 2 < faceY;
    if (!short) return { k, offX, offY: centeredY, mode: "desktop", clip: [0, 0, W, H], short: false };
    const offY = Math.min(HEADER_D, faceY);
    return { k, offX, offY, mode: "desktop", clip: [0, 0, W, H], short: true };
  }
  // Phone band: its own transform (C4b) fitting a plate window into the band slot.
    const slot = $(".bandSlot").getBoundingClientRect();
    const stage = $("#clubWheelScreen").dataset.clubRevealStage;
    // CL5/CL6 (K4), or any band too short to hold both faces whole at the plate's minimum scale: packs only
    const kWhole = Math.max(slot.width / PW, Math.min(slot.width / 1030, slot.height / 554));
    const packsOnly = stage === "versus" || stage === "confirmation" || slot.height / kWhole < 554;
    // CL1-CL4: both managers whole (faces + hands); CL5/CL6: pack bodies only (faces and top hands out of frame)
    const win = packsOnly ? [262, 384, 1278, 604] : [236, 50, 1300, 604];
    const ww = win[2] - win[0], wh = win[3] - win[1];
    let k = packsOnly ? slot.width / ww : Math.min(slot.width / ww, slot.height / wh);
    k = Math.max(k, slot.width / PW, slot.height / PH);
    let offX = slot.left + (slot.width - ww * k) / 2 - win[0] * k;
    let offY = packsOnly ? slot.top - win[1] * k : slot.top + (slot.height - wh * k) / 2 - win[1] * k;
    if (!packsOnly) {
      // CL1-CL4: fill the slot; both faces (x 260-1265) stay whole, extra height shows more stadium/pitch
      k = Math.max(slot.width / PW, slot.height / PH, Math.min(slot.width / 1030, slot.height / wh));
      offX = slot.left + slot.width / 2 - 768 * k;
      offY = slot.top + slot.height / 2 - ((win[1] + win[3]) / 2) * k;
      offY = Math.min(slot.top, Math.max(slot.bottom - PH * k, offY));
      offX = Math.min(slot.left, Math.max(slot.right - PW * k, offX));
      return { k, offX, offY, mode: "phone", clip: [slot.left, slot.top, slot.width, slot.height], packsOnly };
    }
    // CL5/CL6: the visible band is never taller than the packs window, so faces stay fully out of frame
    const ch = Math.min(slot.height, wh * k), ct = slot.top + (slot.height - ch) / 2;
    offY = ct - win[1] * k;
    offX = Math.min(slot.left, Math.max(slot.right - PW * k, offX));
    return { k, offX, offY, mode: "phone", clip: [slot.left, ct, slot.width, ch], packsOnly };
  }

  function place(node, r, extra) {
    if (!node) return;
    node.style.left = r.left + "px"; node.style.top = r.top + "px";
    if (r.width != null) node.style.width = r.width + "px";
    if (r.height != null) node.style.height = r.height + "px";
    if (extra) Object.assign(node.style, extra);
  }

  function layout() {
    const phone = isPhone();
    document.documentElement.classList.toggle("phone", phone);
    document.documentElement.classList.toggle("desktop", !phone);
    T = computeTransform();
    const { k } = T;
    // desktop type scale: 1 at the 1366 Tier S reference; short desktops (height < 700) scale the UI down
    const shortF = !phone && innerHeight < 700 ? Math.max(0.8, Math.min(1, innerHeight / 768)) : 1;
    const s = phone ? 1 : (k / (1366 / PW)) * shortF;
    document.documentElement.classList.toggle("scrolly", Boolean(T.short));
    $("#stage").style.height = "";
    const root = document.documentElement;
    root.style.setProperty("--s", s.toFixed(4));
    root.style.setProperty("--k", k.toFixed(5));

    const clip = $(".plateClip");
    place(clip, { left: T.clip[0], top: T.clip[1], width: T.clip[2], height: T.clip[3] });
    place($("#world"), { left: T.offX - T.clip[0], top: T.offY - T.clip[1], width: PW * k, height: PH * k });

    drawCovers(k, phone);
    layoutReveal();
    if (GRID) drawGrid();

    const packs = ["pack_daniel", "pack_nik"].map(n => rectToScreen(MAP.protected_boxes[n]));
    const stages = $$(".clubPackStage");
    if (!phone) {
      // title block, centred between the faces
      const tx = plateToScreen(L.titleCx, 0)[0];
      let kTop = plateToScreen(0, L.kicker[0])[1];
      const compact = kTop < HEADER_D + 6;
      root.classList.toggle("compact", compact);
      const infoBottom = plateToScreen(0, L.info[1])[1];
      if (!compact) {
        place($(".clubKicker"), { left: tx, top: kTop });
        place($("#clubWheelScreen h2"), { left: tx, top: plateToScreen(0, L.h2[0])[1] });
        place($(".clubAssignmentHeader"), { left: tx, top: plateToScreen(0, L.info[0])[1] });
      } else {
        // short desktop: the title block starts under the header and ends above the rail
        const top = HEADER_D + 6, railTop = plateToScreen(0, L.railY[0])[1];
        place($("#clubWheelScreen h2"), { left: tx, top });
        const h2h = $("#clubWheelScreen h2").getBoundingClientRect().height;
        place($(".clubAssignmentHeader"), { left: tx, top: top + h2h + 2 });
        root.style.setProperty("--compactRoom", (railTop - top) + "px");
      }
      // rail
      const rail = $(".clubRevealProgress");
      const r0 = plateToScreen(L.railX[0], L.railY[0]), r1 = plateToScreen(L.railX[4], L.railY[1]);
      place(rail, { left: r0[0], top: r0[1], width: r1[0] - r0[0], height: r1[1] - r0[1] });
      // packs: transparent positioning shells exactly over the pack boxes
      stages.forEach((st, i) => place(st, packs[i]));
      // VS medallion
      place($(".clubVs"), rectToScreen(L.vs));
      // card faces + managers + index tags in the bottom panel
      [["#clubCardOne", 0], ["#clubCardTwo", 1]].forEach(([sel, i]) => {
        const card = $(sel), fr = rectToScreen(L.faces[i]), pk = packs[i];
        const face = $(".clubCardFace", card);
        // face lives inside .clubPackStage: coordinates relative to the pack shell
        place(face, { left: fr.left - pk.left, top: fr.top - pk.top + 30 * s, width: fr.width, height: fr.height - 30 * s });
        place($(".clubRevealIndex", card), { left: fr.left + 68 * s, top: fr.top + 6 * s });
        place($(".clubManager", card), { left: fr.left + 68 * s + 30 * s, top: fr.top + 2 * s });
      });
      const c = rectToScreen(L.center);
      place($(".panelDivider"), c);
      // confirmation: headline on the tab, matchup + lock note in the centre column
      const tab = T.covers.tab, tr = rectToScreen([tab[0], tab[1], tab[2], tab[3]]);
      // the box stays between the side-hand clearances (tab width); the lock note bleeds wider below the hands
      place($("#clubRivalryConfirmation"), { left: tr.left, top: tr.top, width: tr.width, height: c.bottom - tr.top });
      root.style.setProperty("--noteBleedL", Math.max(0, tr.left - c.left) + "px");
      root.style.setProperty("--noteBleedR", Math.max(0, c.right - tr.right) + "px");
      root.style.setProperty("--tabH", tr.height + "px");
      // buttons row
      let by = plateToScreen(0, L.buttonsY[0])[1];
      const cx = plateToScreen(768, 0)[0];
      if (T.short) {
        // buttons directly under the packs (and the side hands), card faces + confirmation below them
        const hb = ["hand_daniel_side", "hand_nik_side"].map(n => rectToScreen(HANDS.hands[n].box).bottom);
        by = Math.ceil(Math.max(packs[0].bottom, packs[1].bottom, ...hb) + 10);
        const panelTop = by + 56 * s + 16 * s;
        [["#clubCardOne", 0], ["#clubCardTwo", 1]].forEach(([sel, i]) => {
          const card = $(sel), fr = rectToScreen(L.faces[i]), pk = packs[i];
          place($(".clubCardFace", card), { left: fr.left - pk.left, top: panelTop + 30 * s - pk.top, width: fr.width, height: 92 * s });
          place($(".clubRevealIndex", card), { left: fr.left + 68 * s, top: panelTop + 6 * s });
          place($(".clubManager", card), { left: fr.left + 68 * s + 30 * s, top: panelTop + 2 * s });
        });
        place($(".panelDivider"), { left: c.left, top: panelTop, width: c.width, height: 110 * s });
        place($("#clubRivalryConfirmation"), { left: c.left, top: panelTop - 4 * s, width: c.width, height: "auto" });
        $("#clubRivalryConfirmation").style.height = "auto";
        root.style.setProperty("--noteBleedL", "0px"); root.style.setProperty("--noteBleedR", "0px");
        root.style.setProperty("--tabH", (26 * s) + "px");
      }
      root.style.setProperty("--btnTop", by + "px");
      root.style.setProperty("--btnCx", cx + "px");
      if (T.short) {
        // document height = everything placed + footer; the page scrolls, the faces never go under the header
        const bottoms = [".clubCardFace", "#clubRivalryConfirmation:not(.hidden)", "#clubWheelScreen button:not(.hidden)"].flatMap(q => $$(q)).map(n => n.getBoundingClientRect().bottom);
        const Hs = Math.ceil(Math.max(innerHeight, ...bottoms) + 18 + FOOTER_D);
        $("#stage").style.height = Hs + "px";
        T.clip = [0, 0, innerWidth, Hs];
        place($(".plateClip"), { left: 0, top: 0, width: innerWidth, height: Hs });
        drawCovers(k, phone);
      }
    } else {
      root.classList.remove("compact");
      root.style.setProperty("--noteBleedL", "0px"); root.style.setProperty("--noteBleedR", "0px");
      stages.forEach(st => { st.removeAttribute("style"); });
      $$(".clubCardFace, .clubManager, .clubRevealIndex, .clubKicker, #clubWheelScreen h2, .clubAssignmentHeader, .clubRevealProgress, #clubRivalryConfirmation, .panelDivider").forEach(n => n.removeAttribute("style"));
      // doors and the VS medallion stay over the band (positioned relative to the section box)
      const sec = $("#clubWheelScreen").getBoundingClientRect();
      const rel = r => ({ left: r.left - sec.left, top: r.top - sec.top, width: r.width, height: r.height });
      $$(".clubPackDoor").forEach((d, i) => place(d, rel(packs[i])));
      const vr = rectToScreen(L.vs);
      place($(".clubVs"), rel(vr));
      root.style.setProperty("--vsFs", Math.max(20, Math.min(40, (vr.height - 15 - 6) / 1.25)).toFixed(1) + "px");
    }
    // phone doors: reset on desktop
    if (!phone) $$(".clubPackDoor").forEach(d => d.removeAttribute("style"));
    // keep hand overlay + reveal registration in px
    layoutHands();
  }

  function layoutHands() {
// Full-canvas registered raster cutouts: the shared tool owns erosion/feather/fringe.
$$(".handOv").forEach(d => { d.style.clipPath = "none"; });
}

  /* ---------------- K3 / OWNER-3 pack rip ---------------- */
  function layoutReveal() {
    const k = T.k;
    RIP.forEach(r => {
      const b = r.box, E = r.els;
      place(E.wrap, { left: b[0] * k, top: b[1] * k, width: (b[2] - b[0]) * k, height: (b[3] - b[1]) * k });
      place(E.inner, { left: -b[0] * k, top: -b[1] * k, width: PW * k, height: PH * k });
      const cs = r.crestSize;
      place(E.crest, { left: (r.crest[0] - cs / 2) * k, top: (r.crest[1] - cs / 2) * k, width: cs * k, height: cs * k });
      E.flap.style.clipPath = `polygon(${r.strip.map(([x, y]) => `${(x * k).toFixed(2)}px ${(y * k).toFixed(2)}px`).join(",")})`;
      E.flap.style.transformOrigin = `${r.flapPivot[0] * k}px ${r.flapPivot[1] * k}px`;
      E.burst.style.transformOrigin = `${r.burst[0] * k}px ${r.burst[1] * k}px`;
    });
    // animations hold px offsets: rebuild them on every layout
    buildAnimations();
  }

  function crestMarkup(name) { return window.getClubCrestSvg(name); }

  function ripKeyframes(r) {
    const k = T.k, d = r.flapDir;
    const dx = (r.burst[0] - r.crest[0]) * k, startY = (r.burst[1] + 6 - r.crest[1]) * k, peakY = (400 - r.crest[1]) * k;
    if (RM) {
      return {
        flap: [{ opacity: 1 }, { opacity: 0 }], hole: [{ opacity: 0 }, { opacity: 1 }], edge: [{ opacity: 0 }, { opacity: 1 }],
        dark: [{ opacity: 0 }, { opacity: 1 }], burst: [{ opacity: 0, transform: "scale(1)" }, { opacity: 0.42, transform: "scale(1)" }],
        crest: [{ opacity: 0, transform: "translate(0px,0px) scale(1)" }, { opacity: 1, transform: "translate(0px,0px) scale(1)" }],
      };
    }
    return {
      // the strip tugs under the fingers, snaps along the jagged line, flips forward and falls away
      flap: [
        { offset: 0, transform: "translate(0,0) rotate(0deg)", opacity: 1 },
        { offset: 0.08, transform: `translate(0px,${-1.5 * k}px) rotate(${-0.6 * d}deg)`, opacity: 1 },
        { offset: 0.16, transform: `translate(${1 * d * k}px,${-3 * k}px) rotate(${-1.8 * d}deg)`, opacity: 1 },
        { offset: 0.24, transform: `translate(${4 * d * k}px,${-7 * k}px) rotate(${-6 * d}deg)`, opacity: 1 },
        { offset: 0.36, transform: `translate(${14 * d * k}px,${2 * k}px) rotate(${14 * d}deg) scaleY(.82)`, opacity: 1 },
        { offset: 0.52, transform: `translate(${26 * d * k}px,${70 * k}px) rotate(${34 * d}deg) scaleY(.45)`, opacity: 0.85 },
        { offset: 0.68, transform: `translate(${34 * d * k}px,${150 * k}px) rotate(${52 * d}deg) scaleY(-.3)`, opacity: 0 },
        { offset: 1, transform: `translate(${34 * d * k}px,${150 * k}px) rotate(${52 * d}deg) scaleY(-.3)`, opacity: 0 },
      ],
      hole: [{ offset: 0, opacity: 0 }, { offset: 0.14, opacity: 0 }, { offset: 0.26, opacity: 1 }, { offset: 1, opacity: 1 }],
      edge: [{ offset: 0, opacity: 0 }, { offset: 0.22, opacity: 0 }, { offset: 0.32, opacity: 1 }, { offset: 1, opacity: 1 }],
      dark: [{ offset: 0, opacity: 0 }, { offset: 0.24, opacity: 0 }, { offset: 0.5, opacity: 1 }, { offset: 1, opacity: 1 }],
      burst: [
        { offset: 0, opacity: 0, transform: "scale(.2)" }, { offset: 0.2, opacity: 0, transform: "scale(.25)" },
        { offset: 0.34, opacity: 0.7, transform: "scale(.85)" }, { offset: 0.55, opacity: 0.62, transform: "scale(1.04)" },
        { offset: 1, opacity: 0.42, transform: "scale(1)" },
      ],
      crest: [
        { offset: 0, opacity: 0, transform: `translate(${dx}px,${startY}px) scale(.22)` },
        { offset: 0.28, opacity: 0, transform: `translate(${dx}px,${startY}px) scale(.22)`, easing: "ease-out" },
        { offset: 0.38, opacity: 1, transform: `translate(${dx * 0.85}px,${startY - 4 * k}px) scale(.42)`, easing: "cubic-bezier(.2,.7,.35,1)" },
        { offset: 0.62, opacity: 1, transform: `translate(${dx * 0.35}px,${peakY}px) scale(.8)`, easing: "cubic-bezier(.45,0,.3,1)" },
        { offset: 0.84, opacity: 1, transform: `translate(0px,${4 * k}px) scale(1.04)`, easing: "ease-out" },
        { offset: 1, opacity: 1, transform: "translate(0px,0px) scale(1)" },
      ],
    };
  }

  function sideProgress(i) {
    // which packs are revealed in this frame, and where each sits on its own rip timeline
    const f = FX.frames[FRAME] || FX.frames.CL1;
    if (!f.revealed[i]) return null;
    if (T_PARAM == null) return 1;
    if (FRAME === "CL4" && i === 0) return 1;              // Daniel opened in CL3; CL4's strip shows Nik's rip
    return T_PARAM;
  }

  function buildAnimations() {
    anims.forEach(a => a.cancel()); anims = [];
    const f = FX.frames[FRAME] || FX.frames.CL1;
    RIP.forEach((r, i) => {
      const E = r.els, p = sideProgress(i);
      E.wrap.classList.toggle("on", p != null);
      $$(".panelCrest")[i].classList.toggle("on", Boolean(f.revealed[i]));
      if (p == null) return;
      if (!E.crest.dataset.club) { E.crest.innerHTML = `<div class="crestRim">${crestMarkup(i ? FX.clubs.playerTwo : FX.clubs.playerOne)}</div>`; E.crest.dataset.club = "1"; }
      const kf = ripKeyframes(r), dur = RM ? RM_MS : RIP_MS;
      const opts = { duration: dur, fill: "both", easing: "linear" };
      const list = [[E.flap, kf.flap], [E.hole, kf.hole], [E.edge, kf.edge], [E.dark, kf.dark], [E.burst, kf.burst], [E.crest, kf.crest]];
      list.forEach(([node, frames]) => {
        const a = node.animate(frames, opts);
        if (PLAY) { a.currentTime = 0; if (i === 1 && f.revealed[0] && FRAME === "CL4") a.currentTime = 0; }
        else { a.pause(); a.currentTime = p * dur; }
        anims.push(a);
      });
    });
  }

  function drawGrid() {
    const g = $("#gridSvg"); if (!g) return;
    const P = MAP.protected_boxes;
    let h = "";
    MAP.remove_rects.forEach(r => { h += `<rect x="${r[0]}" y="${r[1]}" width="${r[2] - r[0]}" height="${r[3] - r[1]}" fill="none" stroke="#ff00ff" stroke-width="1.5" stroke-dasharray="6 4"/>`; });
    Object.entries(P).forEach(([n, r]) => { h += `<rect x="${r[0]}" y="${r[1]}" width="${r[2] - r[0]}" height="${r[3] - r[1]}" fill="none" stroke="${n.startsWith("face") ? "#00e5ff" : "#ffd400"}" stroke-width="2"/><text x="${r[0] + 4}" y="${r[1] + 16}" fill="#fff" font-size="14">${n}</text>`; });
    Object.entries(HANDS.hands).forEach(([n, hh]) => { h += `<polygon points="${pts(hh.polygon)}" fill="rgba(0,255,90,.18)" stroke="#00ff5a" stroke-width="1.2"/>`; const b = hh.box; h += `<rect x="${b[0]}" y="${b[1]}" width="${b[2] - b[0]}" height="${b[3] - b[1]}" fill="none" stroke="#00ff5a" stroke-dasharray="3 3"/>`; });
    g.innerHTML = h;
  }

  /* ---------------- decorative DOM additions (all aria-hidden) ---------------- */
  function decorateDom() {
    const hdr = $(".clubAssignmentHeader");
    const eb = $(".clubAssignmentEyebrow"); eb.insertAdjacentHTML("beforebegin", `<span class="ebRow" aria-hidden="true"></span>`);
    const row = $(".ebRow"); row.removeAttribute("aria-hidden"); row.innerHTML = CHECK; row.firstChild.setAttribute("aria-hidden", "true"); row.appendChild(eb);
    const st = $("#clubPackStatus"); st.insertAdjacentHTML("beforebegin", `<span class="stRow"></span>`);
    const sr = $(".stRow"); sr.innerHTML = PACK; sr.appendChild(st);
    $$(".clubRevealProgress span").forEach(s => s.insertAdjacentHTML("afterbegin", `<i class="ring" aria-hidden="true">${svg(20, 20, '<path d="M5.5 10.4l3 3 6-6.4" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>', "ringCheck")}</i>`));
    $$(".clubCardFace").forEach((f, i) => f.insertAdjacentHTML("afterbegin", `<span class="shieldSlot" aria-hidden="true">${SEALED_SHIELD}<span class="panelCrest"><span class="crestRim">${crestMarkup(i ? FX.clubs.playerTwo : FX.clubs.playerOne)}</span></span></span>`));
    $(".clubRevealArea").insertAdjacentHTML("beforeend", `<div class="panelDivider" aria-hidden="true"><i></i><b>VS</b><i></i></div>`);
    $(".clubRevealProgress").insertAdjacentHTML("afterend", `<div class="bandSlot" aria-hidden="true"></div>`);
    $("#openClubPack").insertAdjacentHTML("afterbegin", `<span class="btnGlyph" aria-hidden="true">${PACK_INK}</span>`);
    // the button's own text node must stay the product string: wrap the label
    wrapLabel($("#openClubPack"));
    wrapLabel($("#continueClubAssignment"));
    $("#openClubPack").insertAdjacentHTML("beforeend", `<span class="btnGlyph chevron" aria-hidden="true">${CHEV}</span>`);
  }
  function wrapLabel(btn) {
    const tn = Array.from(btn.childNodes).find(n => n.nodeType === 3 && n.textContent.trim());
    if (!tn) return; const sp = document.createElement("span"); sp.className = "btnLabel"; btn.insertBefore(sp, tn); sp.appendChild(tn);
  }

  /* ---------------- boot ---------------- */
  async function loadJSON(p, inline) { if (inline) return inline; const r = await fetch(p); return r.json(); }
  async function main() {
    const I = window.CLUB_INLINE || {};
    [FX, MAP, HANDS] = await Promise.all([loadJSON("fixtures.json", I.FX), loadJSON("assets/platemap.json", I.MAP), loadJSON("assets/handmap.json", I.HANDS)]);
    const f = FX.frames[FRAME] || FX.frames.CL1;
    if (!FX.frames[FRAME] && FRAME !== "S0") console.warn("unknown frame " + FRAME);
    document.documentElement.dataset.frame = FRAME;
    if (FRAME === "S0") document.documentElement.classList.add("plateOnly");   // plate only, for evidence
    decorateDom();
    buildDecor();
    renderFrame(f);
    await document.fonts.ready;
    layout();
    addEventListener("resize", () => layout());
    document.documentElement.classList.add("ready");
    window.ClubQA = {
      frame: FRAME, get T() { return T; }, plateToScreen, rectToScreen, MAP, HANDS, RIP, FX, RM,
      setT(t) { anims.forEach(a => { a.pause(); a.currentTime = t * (RM ? RM_MS : RIP_MS); }); },
      layout,
    };
  }
  window.ClubPlate = { main, plateToScreen };
  main();
})();
