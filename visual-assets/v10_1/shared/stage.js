/* Showdown cinematic stage engine · JOB-015 */
(function (global) {
  "use strict";

  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const pct = (v) => `${v * 100}%`;
  const urlVar = (value) => `url("${String(value).replace(/"/g, "\\\"")}")`;

  function phoneBandValue(map) {
    if (!map || !map.phone_band) return null;
    const b = map.phone_band;
    if (Array.isArray(b) && b.length === 4) return b.map(Number);
    if (typeof b === "object") {
      if (["x0","y0","x1","y1"].every((k) => Number.isFinite(Number(b[k])))) return [b.x0,b.y0,b.x1,b.y1].map(Number);
      if (Array.isArray(b.rect) && b.rect.length === 4) return b.rect.map(Number);
    }
    return null;
  }

  function ensureLayer(stage, kind) {
    let layer = stage.querySelector(`:scope > .sd-stage__layer--${kind}`);
    if (!layer) {
      layer = document.createElement("div");
      layer.className = `sd-stage__layer sd-stage__layer--${kind}`;
      layer.setAttribute("aria-hidden", kind === "ui" ? "false" : "true");
      stage.appendChild(layer);
    }
    return layer;
  }

  function ensureRegistered(layer) {
    let el = layer.querySelector(":scope > .sd-stage__registered");
    if (!el) {
      el = document.createElement("div");
      el.className = "sd-stage__registered";
      layer.appendChild(el);
    }
    return el;
  }

  function applyBox(el, box, pw, ph) {
    if (!box) {
      el.style.setProperty("--sd-box-x", "0%");
      el.style.setProperty("--sd-box-y", "0%");
      el.style.setProperty("--sd-box-w", "100%");
      el.style.setProperty("--sd-box-h", "100%");
      return;
    }
    const [x0,y0,x1,y1] = box;
    el.style.setProperty("--sd-box-x", pct(x0 / pw));
    el.style.setProperty("--sd-box-y", pct(y0 / ph));
    el.style.setProperty("--sd-box-w", pct((x1 - x0) / pw));
    el.style.setProperty("--sd-box-h", pct((y1 - y0) / ph));
  }

  function buildAtmosphere(layer, count) {
    if (layer.dataset.sdBuilt === "1") return;
    layer.dataset.sdBuilt = "1";
    const dust = document.createElement("div");
    dust.className = "sd-stage__dust";
    const n = clamp(Number.isFinite(count) ? count : 24, 0, 30);
    for (let i = 0; i < n; i += 1) {
      const p = document.createElement("i");
      const a = (i * 47 + 11) % 101;
      const b = (i * 73 + 19) % 97;
      const size = 1 + ((i * 13) % 5) * .45;
      p.style.setProperty("--dust-x", `${a}%`);
      p.style.setProperty("--dust-y", `${b}%`);
      p.style.setProperty("--dust-size", `${size}px`);
      p.style.setProperty("--dust-alpha", `${.12 + ((i * 17) % 19) / 100}`);
      p.style.setProperty("--dust-dur", `${16 + (i % 8) * 1.7}s`);
      p.style.setProperty("--dust-delay", `${-((i * 1.31) % 19)}s`);
      p.style.setProperty("--dust-dx", `${-26 + ((i * 31) % 53)}px`);
      dust.appendChild(p);
    }
    const flare = document.createElement("div"); flare.className = "sd-stage__flare";
    const vignette = document.createElement("div"); vignette.className = "sd-stage__vignette";
    layer.append(dust, flare, vignette);
  }

  class Stage {
    constructor(stage, options) {
      this.stage = stage;
      this.options = options || {};
      this.plate = this.options.plate || {};
      this.pw = Number(this.plate.width || stage.dataset.plateWidth);
      this.ph = Number(this.plate.height || stage.dataset.plateHeight);
      if (!(this.pw > 0 && this.ph > 0)) throw new Error("ShowdownStage: plate width and height are required");
      this.focal = this.options.focal || { x: this.pw / 2, y: this.ph / 2 };
      this.map = this.options.platemap || null;
      this.phoneBand = phoneBandValue(this.map);
      this.camera = { k: 1, x: 0, y: 0, w: this.pw, h: this.ph, mode: "desktop" };
      this.ro = null;
      this.setup();
    }

    setup() {
      const stage = this.stage;
      stage.classList.add("sd-stage");
      this.layers = {};
      ["plate","atmosphere","ui","cutout","light"].forEach((k) => { this.layers[k] = ensureLayer(stage, k); });
      this.registered = {
        plate: ensureRegistered(this.layers.plate),
        cutout: ensureRegistered(this.layers.cutout),
        light: ensureRegistered(this.layers.light)
      };
      let plateEl = this.registered.plate.querySelector(".sd-stage__plate");
      if (!plateEl) { plateEl = document.createElement("div"); plateEl.className = "sd-stage__plate"; this.registered.plate.appendChild(plateEl); }
      this.plateEl = plateEl;
      if (this.plate.src1x) plateEl.style.setProperty("--sd-plate-1x", urlVar(this.plate.src1x));
      if (this.plate.src2x || this.plate.src1x) plateEl.style.setProperty("--sd-plate-2x", urlVar(this.plate.src2x || this.plate.src1x));
      buildAtmosphere(this.layers.atmosphere, this.options.dustCount);
      if (!this.layers.light.querySelector(".sd-stage__grain")) { const g=document.createElement("div"); g.className="sd-stage__grain"; this.layers.light.appendChild(g); }
      this.prepareCutouts();
      this.prepareRims();
      this.layout = this.layout.bind(this);
      this.ro = new ResizeObserver(this.layout);
      this.ro.observe(stage);
      addEventListener("orientationchange", this.layout, { passive: true });
      this.layout();
      stage.dataset.sdReady = "1";
    }

    prepareCutouts() {
      this.registered.cutout.querySelectorAll(".sd-stage__cutout").forEach((el) => {
        const src1 = el.dataset.src1x, src2 = el.dataset.src2x || src1;
        if (src1) el.style.setProperty("--sd-cutout-1x", urlVar(src1));
        if (src2) el.style.setProperty("--sd-cutout-2x", urlVar(src2));
        const box = el.dataset.box ? el.dataset.box.trim().split(/\s+/).map(Number) : null;
        applyBox(el, box, this.pw, this.ph);
      });
    }

    prepareRims() {
      this.registered.light.querySelectorAll(".sd-stage__rim").forEach((el) => {
        const src1 = el.dataset.src1x, src2 = el.dataset.src2x || src1;
        if (src1) el.style.setProperty("--sd-rim-1x", urlVar(src1));
        if (src2) el.style.setProperty("--sd-rim-2x", urlVar(src2));
        const box = el.dataset.box ? el.dataset.box.trim().split(/\s+/).map(Number) : null;
        applyBox(el, box, this.pw, this.ph);
      });
    }

    layout() {
      const W = this.stage.clientWidth, H = this.stage.clientHeight;
      if (!(W > 0 && H > 0)) return;
      const phone = W <= 760 && H > W && this.phoneBand;
      let k, x, y, bandH = H;
      if (phone) {
        bandH = Math.round(H * (Number(this.options.phoneBandRatio) || .46));
        const [x0,y0,x1,y1] = this.phoneBand;
        const bw = x1 - x0, bh = y1 - y0;
        const keepK = Math.min(W / bw, bandH / bh);
        const coverK = Math.max(W / this.pw, bandH / this.ph);
        k = Math.max(keepK, coverK);
        const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
        x = W / 2 - cx * k;
        y = bandH / 2 - cy * k;
        x = clamp(x, Math.min(0, W - this.pw * k), 0);
        y = clamp(y, Math.min(0, bandH - this.ph * k), 0);
        this.stage.style.setProperty("--sd-stage-band-h", `${bandH}px`);
      } else {
        k = Math.max(W / this.pw, H / this.ph);
        const sw = this.pw * k, sh = this.ph * k;
        x = clamp(W / 2 - Number(this.focal.x) * k, W - sw, 0);
        y = clamp(H / 2 - Number(this.focal.y) * k, H - sh, 0);
      }
      const sw = this.pw * k, sh = this.ph * k;
      this.camera = { k, x, y, w: sw, h: sh, mode: phone ? "phone" : "desktop", bandH };
      this.stage.dataset.sdMode = this.camera.mode;
      this.stage.dataset.sdK = k.toFixed(6);
      this.stage.dataset.sdX = x.toFixed(3);
      this.stage.dataset.sdY = y.toFixed(3);
      this.stage.style.setProperty("--sd-stage-scene-x", `${x}px`);
      this.stage.style.setProperty("--sd-stage-scene-y", `${y}px`);
      this.stage.style.setProperty("--sd-stage-scene-w", `${sw}px`);
      this.stage.style.setProperty("--sd-stage-scene-h", `${sh}px`);
      this.stage.dispatchEvent(new CustomEvent("sdstage:layout", { detail: { ...this.camera } }));
    }

    plateToStage(x, y) { return { x: this.camera.x + x * this.camera.k, y: this.camera.y + y * this.camera.k }; }
    rectToStage(box) { const a=this.plateToStage(box[0],box[1]); return { left:a.x, top:a.y, width:(box[2]-box[0])*this.camera.k, height:(box[3]-box[1])*this.camera.k }; }
    destroy() { if (this.ro) this.ro.disconnect(); removeEventListener("orientationchange", this.layout); }
  }

  global.ShowdownStage = { mount(stage, options) { return new Stage(stage, options); }, Stage };
})(window);
