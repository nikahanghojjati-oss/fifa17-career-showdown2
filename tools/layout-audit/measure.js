// Runs INSIDE the page (serialised by layout-audit.cjs via page.evaluate). Pure DOM geometry, no app knowledge.
// Returns an array of findings {rule, selector, rect, detail}. `rootSel` limits the audit to the active screen/overlay.
(async function(rootSel, opts){
    const vw = window.innerWidth, vh = window.innerHeight;
    const root = document.querySelector(rootSel) || document.body;
    const round = n => Math.round(n * 10) / 10;
    const rectOf = r => ({ x: round(r.left), y: round(r.top), w: round(r.width), h: round(r.height) });
    const findings = [];
    const add = (rule, el, detail, rect, over) => findings.push({ rule, severity: over !== undefined && over <= 4 ? "minor" : undefined, selector: sel(el), rect: rectOf(rect || el.getBoundingClientRect()), detail: detail || "", text: (el.innerText || el.alt || el.value || "").trim().replace(/\s+/g, " ").slice(0, 60) });

    function sel(el){
        if(el.id) return "#" + el.id;
        const parts = [];
        let node = el;
        for(let depth = 0; node && node.nodeType === 1 && depth < 4; depth += 1){
            if(node.id){ parts.unshift("#" + node.id); break; }
            let part = node.tagName.toLowerCase();
            const cls = [...node.classList].slice(0, 2).join(".");
            if(cls) part += "." + cls;
            parts.unshift(part);
            node = node.parentElement;
        }
        return parts.join(" > ");
    }
    const styleCache = new Map();
    const cs = el => { let s = styleCache.get(el); if(!s){ s = getComputedStyle(el); styleCache.set(el, s); } return s; };

    function isVisible(el){
        const r = el.getBoundingClientRect();
        if(r.width <= 0 || r.height <= 0) return false;
        { const o = cs(el); if((r.width <= 2 || r.height <= 2) && /hidden|clip/.test(o.overflow) ) return false; if(/rect\(0(px)?,? 0(px)?,? 0(px)?,? 0(px)?\)/.test(o.clip) || /inset\(50%\)/.test(o.clipPath)) return false; } // visually-hidden (screen-reader-only) helpers
        for(let n = el; n && n.nodeType === 1; n = n.parentElement){
            const s = cs(n);
            if(s.display === "none" || s.visibility === "hidden" || s.visibility === "collapse") return false;
            if(parseFloat(s.opacity) === 0) return false;
            if(n.hidden || n.getAttribute("aria-hidden") === "true" && n !== root && n.classList.contains("hidden")) return false;
        }
        return true;
    }
    const clips = s => /hidden|clip/.test(s.overflowX) || /hidden|clip/.test(s.overflowY);
    // The part of an element that can actually be seen: its box intersected with every clipping ancestor and the viewport-independent box.
    function clippedRect(el){
        let r = el.getBoundingClientRect();
        let left = r.left, top = r.top, right = r.right, bottom = r.bottom;
        for(let n = el.parentElement, fixedSeen = cs(el).position === "fixed"; n && n !== document.documentElement && !fixedSeen; n = n.parentElement){
            const s = cs(n);
            if(s.position === "fixed") fixedSeen = true;
            // Only hard clippers count. Scroll containers (auto/scroll) are skipped: content below their fold is reachable and must still be measured.
            const cx = /hidden|clip/.test(s.overflowX), cy = /hidden|clip/.test(s.overflowY);
            if(cx || cy){
                const p = n.getBoundingClientRect();
                if(cx){ left = Math.max(left, p.left); right = Math.min(right, p.right); }
                if(cy){ top = Math.max(top, p.top); bottom = Math.min(bottom, p.bottom); }
            }
        }
        return { left, top, right, bottom, width: Math.max(0, right - left), height: Math.max(0, bottom - top) };
    }
    function scrollAncestors(el){
        const out = [];
        for(let n = el.parentElement; n; n = n.parentElement){
            const s = cs(n);
            if(/auto|scroll/.test(s.overflowY) && n.scrollHeight > n.clientHeight + 1) out.push({ n, y: true });
            if(/auto|scroll/.test(s.overflowX) && n.scrollWidth > n.clientWidth + 1) out.push({ n, x: true });
        }
        return out;
    }
    const se = document.scrollingElement || document.documentElement;
    const docScrollsY = se.scrollHeight > vh + 1;
    const docScrollsX = se.scrollWidth > vw + 1;

    const all = [...root.querySelectorAll("*")].filter(el => !/^(SCRIPT|STYLE|LINK|META|BR|NOSCRIPT|PATH|G|DEFS|USE|TITLE)$/i.test(el.tagName));
    if(root !== document.body) all.unshift(root);
    const visible = all.filter(isVisible);
    const interactiveSel = "a[href],button,input:not([type=hidden]),select,textarea,summary,[role=button],[role=tab],[role=link],[tabindex]:not([tabindex='-1'])";
    const hasOwnText = el => [...el.childNodes].some(c => c.nodeType === 3 && c.textContent.trim().length > 0);

    // 1. clipped text
    for(const el of visible){
        const s = cs(el);
        const text = (el.innerText || "").trim();
        if(!text || !hasOwnText(el)) continue; // containers are handled by rule 1b (descendant text cut by the container)
        if(el.clientWidth <= 2 || el.clientHeight <= 2) continue; // visually-hidden helpers
        if(el.closest("[aria-hidden='true']") && !opts.includeAriaHidden) continue;
        const clipX = /hidden|clip/.test(s.overflowX), clipY = /hidden|clip/.test(s.overflowY);
        const ellipsis = s.textOverflow === "ellipsis" && (hasOwnText(el) || el.children.length);
        const lineClamp = s.webkitLineClamp && s.webkitLineClamp !== "none";
        if(clipX && el.scrollWidth > el.clientWidth + 1) add("text-clipped", el, `scrollWidth ${el.scrollWidth} > clientWidth ${el.clientWidth}${ellipsis ? " (ellipsis)" : ""}`, null, el.scrollWidth - el.clientWidth);
        else if(clipY && el.scrollHeight > el.clientHeight + 1) add("text-clipped", el, `scrollHeight ${el.scrollHeight} > clientHeight ${el.clientHeight}${lineClamp ? " (line-clamp)" : ""}`, null, el.scrollHeight - el.clientHeight);
        
    }
    // 1b. text/controls that stick out of an overflow-clipping ancestor (content cut by a parent box).
    // For text we use the real line boxes (Range rects of the element's own text nodes), not the element box, so tall line-heights do not trigger it.
    function textBox(el){
        let l = Infinity, t = Infinity, r = -Infinity, b = -Infinity;
        for(const node of el.childNodes){
            if(node.nodeType !== 3 || !node.textContent.trim()) continue;
            const range = document.createRange(); range.selectNodeContents(node);
            const fs = parseFloat(cs(el).fontSize) || 16;
            for(const q of range.getClientRects()){ if(q.width > 0 && q.height > 0){ const mid = (q.top + q.bottom) / 2, half = Math.min(q.height / 2, fs * 0.6); /* glyph band, not the (taller) line box */ l = Math.min(l, q.left); t = Math.min(t, mid - half); r = Math.max(r, q.right); b = Math.max(b, mid + half); } }
        }
        return l === Infinity ? null : { left: l, top: t, right: r, bottom: b };
    }
    for(const el of visible){
        const isText = hasOwnText(el);
        if(!(isText || el.matches(interactiveSel))) continue;
        const box = isText ? textBox(el) : null;
        const full = box ? { left: box.left, top: box.top, right: box.right, bottom: box.bottom, width: box.right - box.left, height: box.bottom - box.top } : el.getBoundingClientRect();
        if(full.width <= 0 || full.height <= 0) continue;
        // intersect with hard clippers (overflow hidden/clip) of ancestors
        let vl = full.left, vt = full.top, vr = full.right, vb = full.bottom, scrolls = false, cutter = null, fixedSeen = false;
        for(let n = el; n && n !== document.documentElement; n = n.parentElement){
            const ns = cs(n);
            if(n !== el && /auto|scroll/.test(ns.overflowX + ns.overflowY)) scrolls = true;
            if(fixedSeen) break; // a position:fixed element escapes the overflow clipping of its ancestors
            if(ns.position === "fixed") fixedSeen = true;
            if(n === el && !isText) continue;
            const cx = /hidden|clip/.test(ns.overflowX), cy = /hidden|clip/.test(ns.overflowY);
            if(n !== el && (cx || cy)){ const p = n.getBoundingClientRect(); const before = [vl, vt, vr, vb]; if(cx){ vl = Math.max(vl, p.left); vr = Math.min(vr, p.right); } if(cy){ vt = Math.max(vt, p.top); vb = Math.min(vb, p.bottom); } if(!cutter && (vl !== before[0] || vt !== before[1] || vr !== before[2] || vb !== before[3])) cutter = n; }
        }
        if(vr <= vl || vb <= vt) continue; // fully clipped away = hidden on purpose (carousels, collapsed panels)
        const cutX = (vl - full.left) + (full.right - vr), cutY = (vt - full.top) + (full.bottom - vb);
        if((cutX > 3 || cutY > 3) && !scrolls){
            add("text-clipped", el, `${isText ? "text" : "control"} cut by overflow-hidden ${cutter ? sel(cutter) : "ancestor"}: ${round(cutX)}px horizontal, ${round(cutY)}px vertical hidden`, { left: full.left, top: full.top, width: full.width, height: full.height }, Math.max(cutX, cutY));
        }
    }

    // 2. overlaps
    const isImage = el => el.matches("img,canvas,video") || (cs(el).backgroundImage !== "none" && !(el.innerText || "").trim() && el.children.length === 0 && !el.matches(interactiveSel));
    const isCard = el => /(^|[\s_-])(card|panel|tile)|Card|Panel|Tile/.test(el.className && el.className.baseVal === undefined ? String(el.className) : "") && !el.matches(interactiveSel);
    const isHeading = el => /^H[1-6]$/.test(el.tagName);
    const candidates = visible.filter(el => {
        const s = cs(el);
        const art = isImage(el); // decorative character art is aria-hidden and pointer-events:none on purpose, so images are never skipped for that
        if(s.pointerEvents === "none" && !isHeading(el) && !art) return false;
        if(el.closest("[aria-hidden='true']") && !art) return false;
        if(el.matches("input[type=checkbox],input[type=radio]") && el.closest("label")) return false;
        const r = el.getBoundingClientRect();
        if(r.width * r.height > 0.7 * vw * vh) return false; // full-screen backdrops
        return el.matches(interactiveSel) || isHeading(el) || isImage(el) || isCard(el);
    });
    const layered = el => { for(let n = el; n && n !== document.documentElement; n = n.parentElement){ const p = cs(n).position; if(p === "fixed" || p === "sticky") return true; } return false; };
    const scrollerOf = el => { for(let n = el.parentElement; n && n !== document.documentElement; n = n.parentElement){ const o = cs(n); if(/auto|scroll/.test(o.overflowY) && n.scrollHeight > n.clientHeight + 1) return n; } return null; };
    const kind = el => el.matches(interactiveSel) ? "control" : isHeading(el) ? "heading" : isImage(el) ? "image" : "card";
    const seen = new Set();
    for(let i = 0; i < candidates.length; i += 1){
        const a = candidates[i], ra = clippedRect(a);
        if(ra.width <= 0 || ra.height <= 0) continue;
        for(let j = i + 1; j < candidates.length; j += 1){
            const b = candidates[j];
            if(a.contains(b) || b.contains(a)) continue;
            const ka = kind(a), kb = kind(b);
            if(ka === "card" && kb === "card") { /* card on card is allowed only when not nested; still counted */ }
            const rb = clippedRect(b);
            const w = Math.min(ra.right, rb.right) - Math.max(ra.left, rb.left), h = Math.min(ra.bottom, rb.bottom) - Math.max(ra.top, rb.top);
            if(w <= 0 || h <= 0 || w * h <= 8) continue;
            // stacked (positioned) layers deliberately sit above/below each other: ignore pairs where one is a pure image and the other a card/panel it decorates
            if((ka === "image" && kb !== "image") || (kb === "image" && ka !== "image")){ const im = ka === "image" ? a : b; if(im.closest("[aria-hidden='true']") || kb === "card" || ka === "card") continue; } // decorative (aria-hidden) art behind text/cards is by design
            if(ka === "image" && kb === "image") continue; // art vs art is judged on real (non-transparent) pixels below
            const sa = scrollerOf(a), sb = scrollerOf(b);
            if(sa !== sb && ((sa && !sa.contains(b)) || (sb && !sb.contains(a)))) continue; // scrolling content passing under non-scrolling chrome
            if(cs(a).display === "inline" && cs(b).display === "inline") continue; // wrapped inline links have overlapping line boxes
            if(layered(a) !== layered(b)) continue; // scrolling content passing under a fixed/sticky bar is expected
            const key = sel(a) + "|" + sel(b);
            if(seen.has(key)) continue; seen.add(key);
            findings.push({ rule: "overlap", severity: ka === "image" && kb === "image" && w * h < 0.15 * Math.min(ra.width * ra.height, rb.width * rb.height) ? "minor" : undefined, selector: sel(a) + "  <->  " + sel(b), rect: { x: round(Math.max(ra.left, rb.left)), y: round(Math.max(ra.top, rb.top)), w: round(w), h: round(h) }, detail: `${ka} overlaps ${kb} by ${round(w * h)}px2`, text: ((a.innerText || a.alt || "").trim().slice(0, 25) + " / " + (b.innerText || b.alt || "").trim().slice(0, 25)).replace(/\s+/g, " ") });
        }
    }

    // 3. off-screen controls
    for(const el of visible){
        if(!el.matches(interactiveSel)) continue;
        if(el.closest("[aria-hidden='true']")) continue;
        const r = el.getBoundingClientRect();
        const sc = scrollAncestors(el);
        const reachX = docScrollsX || sc.some(x => x.x), reachY = docScrollsY || sc.some(x => x.y);
        const outL = r.left < -1, outR = r.right > vw + 1, outT = r.top < -1, outB = r.bottom > vh + 1;
        const horiz = (outL || outR) && !(reachX && !outL);
        const vert = outT || outB;
        if((outL || outR) && !(sc.some(x => x.x))){
            add("off-screen", el, `${outL ? "left edge " + round(r.left) + "px past left" : "right edge " + round(r.right) + "px past viewport width " + vw}`);
        }else if(vert && !reachY && !(sc.some(x => x.y))){
            add("off-screen", el, `${outB ? "bottom " + round(r.bottom) + " beyond viewport height " + vh : "top " + round(r.top) + " above viewport"} and nothing scrolls`);
        }
    }

    // 3b. phones: a control glued to the bottom edge (within 10px) sits in the home-indicator / browser-bar zone and is hard or impossible to press.
    if(opts.phone){
        for(const el of visible){
            if(!el.matches("a[href],button,[role=button]")) continue;
            if(el.closest("nav,footer,[role=navigation],[role=tablist],[aria-hidden='true']")) continue;
            const r = el.getBoundingClientRect();
            if(r.width < 0.3 * vw || r.height < 28) continue;
            if(r.bottom > vh - 10 && r.bottom <= vh + 1 && r.top < vh) add("off-screen", el, `bottom edge ${round(r.bottom)} is only ${round(vh - r.bottom)}px from the screen bottom (${vh}): inside the phone home-indicator zone`, r, 0);
        }
    }

    // 5. stretched images
    for(const el of visible){
        if(el.tagName !== "IMG" || !el.naturalWidth || !el.naturalHeight) continue;
        const s = cs(el);
        if(s.objectFit !== "fill") continue;
        const r = el.getBoundingClientRect();
        if(r.width < 8 || r.height < 8) continue;
        const rendered = r.width / r.height, natural = el.naturalWidth / el.naturalHeight;
        const diff = Math.abs(rendered - natural) / natural;
        if(diff > 0.03) add("stretched-image", el, `rendered ${round(r.width)}x${round(r.height)} (ratio ${round(rendered * 100) / 100}) vs natural ${el.naturalWidth}x${el.naturalHeight} (ratio ${round(natural * 100) / 100}), ${round(diff * 100)}% off`);
    }
    // 5a/2b. Figure art (characters, props): judged on REAL pixels, not boxes, because the art has transparent padding.
    // - art-clipped: share of the non-transparent pixels that fall outside the screen or outside an overflow-hidden ancestor.
    // - overlap: area where the non-transparent pixels of two figures coincide.
    // Full-bleed plates (object-fit: cover, or wide+tall bands) are meant to be cropped/layered and are skipped.
    const maskCache = new Map();
    function maskOf(img){
        if(maskCache.has(img)) return maskCache.get(img);
        let mask = null;
        try{
            const w = 64, h = Math.max(8, Math.round(64 * img.naturalHeight / img.naturalWidth));
            const canvas = document.createElement("canvas"); canvas.width = w; canvas.height = h;
            const g = canvas.getContext("2d", { willReadFrequently: true }); g.drawImage(img, 0, 0, w, h);
            const d = g.getImageData(0, 0, w, h).data; const alpha = new Uint8Array(w * h);
            for(let i = 0; i < w * h; i += 1) alpha[i] = d[i * 4 + 3];
            mask = { w, h, alpha };
        }catch(error){ mask = null; } // tainted/undecodable: fall back to boxes
        maskCache.set(img, mask); return mask;
    }
    function figureOf(el){
        const s = cs(el);
        if(s.objectFit === "cover") return null;
        const r = el.getBoundingClientRect();
        if(r.width < 40 || r.height < 40) return null;
        if(r.width >= 0.85 * vw && r.height >= 0.4 * vh) return null;
        let cr = { left: r.left, top: r.top, width: r.width, height: r.height };
        if(s.objectFit === "contain" || s.objectFit === "scale-down"){
            const k = Math.min(r.width / el.naturalWidth, r.height / el.naturalHeight), cw = el.naturalWidth * k, ch = el.naturalHeight * k;
            const pos = (s.objectPosition || "50% 50%").split(/\s+/).map(x => /%$/.test(x) ? parseFloat(x) / 100 : 0.5);
            cr = { left: r.left + (r.width - cw) * (pos[0] ?? 0.5), top: r.top + (r.height - ch) * (pos[1] ?? 0.5), width: cw, height: ch };
        }
        const c = clippedRect(el);
        const vis = { left: Math.max(c.left, 0), right: Math.min(c.right, vw), top: c.top, bottom: c.bottom };
        return { el, r, cr, vis, mask: maskOf(el) };
    }
    const opaque = (f, x, y) => {
        if(x < f.cr.left || x >= f.cr.left + f.cr.width || y < f.cr.top || y >= f.cr.top + f.cr.height) return false;
        if(!f.mask) return true;
        const u = Math.min(f.mask.w - 1, Math.floor((x - f.cr.left) / f.cr.width * f.mask.w)), v = Math.min(f.mask.h - 1, Math.floor((y - f.cr.top) / f.cr.height * f.mask.h));
        return f.mask.alpha[v * f.mask.w + u] > 96;
    };
    const inVis = (f, x, y) => x >= f.vis.left && x <= f.vis.right && y >= f.vis.top && y <= f.vis.bottom;
    const figures = [];
    for(const el of visible){ if(el.tagName === "IMG" && el.naturalWidth && el.naturalHeight){ const f = figureOf(el); if(f) figures.push(f); } }
    for(const f of figures){
        let total = 0, shown = 0;
        const cols = f.mask ? f.mask.w : 32, rows = f.mask ? f.mask.h : 32;
        for(let j = 0; j < rows; j += 1) for(let i = 0; i < cols; i += 1){
            const x = f.cr.left + (i + 0.5) / cols * f.cr.width, y = f.cr.top + (j + 0.5) / rows * f.cr.height;
            if(f.mask && f.mask.alpha[j * cols + i] <= 96) continue;
            total += 1; if(inVis(f, x, y)) shown += 1;
        }
        if(!total) continue;
        const hidden = 1 - shown / total;
        if(hidden < 0.99 && hidden > (opts.artMin ?? 0.1)) add("art-clipped", f.el, `${round(hidden * 100)}% of the visible figure pixels are cut off by the screen edge or a clipping parent (box ${round(f.r.width)}x${round(f.r.height)} at x ${round(f.r.left)}; src ${(f.el.currentSrc || "").split("/").pop()})`, f.r, hidden < 0.25 ? 4 : 99); // under 25% cut is usually a deliberate crop: reported as minor
    }
    for(let i = 0; i < figures.length; i += 1) for(let j = i + 1; j < figures.length; j += 1){
        const a = figures[i], b = figures[j];
        if(a.el.contains(b.el) || b.el.contains(a.el)) continue;
        const l = Math.max(a.cr.left, b.cr.left), t = Math.max(a.cr.top, b.cr.top), r = Math.min(a.cr.left + a.cr.width, b.cr.left + b.cr.width), bt = Math.min(a.cr.top + a.cr.height, b.cr.top + b.cr.height);
        if(r <= l || bt <= t) continue;
        const step = 2; let both = 0;
        for(let y = t; y < bt; y += step) for(let x = l; x < r; x += step) if(opaque(a, x, y) && opaque(b, x, y) && inVis(a, x, y) && inVis(b, x, y)) both += step * step;
        if(both <= 8) continue;
        const area = f => { let n = 0; const cols = f.mask ? f.mask.w : 1, rows = f.mask ? f.mask.h : 1; if(!f.mask) return f.cr.width * f.cr.height; for(let k = 0; k < f.mask.alpha.length; k += 1) if(f.mask.alpha[k] > 96) n += 1; return n / (cols * rows) * f.cr.width * f.cr.height; };
        const frac = both / Math.max(1, Math.min(area(a), area(b)));
        findings.push({ rule: "overlap", severity: frac < 0.08 ? "minor" : undefined, selector: sel(a.el) + "  <->  " + sel(b.el), rect: { x: round(l), y: round(t), w: round(r - l), h: round(bt - t) }, detail: `figure art overlaps figure art: ${round(both)}px2 of real pixels = ${round(frac * 100)}% of the smaller figure`, text: `${(a.el.currentSrc || "").split("/").pop()} / ${(b.el.currentSrc || "").split("/").pop()}` });
    }
    // 5c. nine-slice frames whose corners are squeezed unevenly (stretched look)
    for(const el of visible){
        const s = cs(el);
        if(s.borderImageSource === "none" || !/url\(/.test(s.borderImageSource)) continue;
        const slice = (s.borderImageSlice || "").split(/\s+/).filter(x => /^[\d.]+$/.test(x)).map(Number);
        if(slice.length < 4) continue;
        const bw = [parseFloat(s.borderTopWidth), parseFloat(s.borderRightWidth), parseFloat(s.borderBottomWidth), parseFloat(s.borderLeftWidth)];
        const k = bw.map((w, i) => slice[i] > 0 ? w / slice[i] : null).filter(x => x);
        if(k.length < 2) continue;
        const ratio = Math.max(...k) / Math.min(...k);
        if(ratio > 1.3) add("stretched-image", el, `border-image frame corners scaled unevenly (scale ${k.map(x => round(x * 100) / 100).join("/")}, ratio ${round(ratio * 100) / 100})`);
    }
    // 5b. CSS background images forced to 100% 100%: compare the box ratio with the real image ratio
    const bgChecks = [];
    for(const el of visible){
        const s = cs(el);
        const m = s.backgroundImage.match(/url\(["']?([^"')]+)["']?\)/);
        if(!m || !/^100%\s+100%$/.test(s.backgroundSize)) continue;
        const r = el.getBoundingClientRect();
        if(r.width < 8 || r.height < 8) continue;
        bgChecks.push(new Promise(resolve => { const img = new Image(); img.onload = () => resolve({ el, r, w: img.naturalWidth, h: img.naturalHeight }); img.onerror = () => resolve(null); img.src = m[1]; }));
    }
    for(const hit of await Promise.all(bgChecks)){
        if(!hit || !hit.w || !hit.h) continue;
        const diff = Math.abs(hit.r.width / hit.r.height - hit.w / hit.h) / (hit.w / hit.h);
        if(diff > 0.03) add("stretched-image", hit.el, `background-size 100% 100%: box ratio ${round(hit.r.width / hit.r.height * 100) / 100} vs image ${hit.w}x${hit.h} (${round(hit.w / hit.h * 100) / 100}), ${round(diff * 100)}% off`);
    }

    // 6. small tap targets (phones only)
    if(opts.phone){
        for(const el of visible){
            if(!el.matches(interactiveSel)) continue;
            if(el.closest("[aria-hidden='true']") || el.getAttribute("tabindex") === "-1") continue;
            const s = cs(el);
            if(s.display === "inline" && el.closest("p,li,span,div") && el.tagName === "A") continue; // inline text link
            if(el.matches("input[type=checkbox],input[type=radio]")){ const lab = el.closest("label") || (el.id && document.querySelector(`label[for="${el.id}"]`)); if(lab){ const lr = lab.getBoundingClientRect(); if(lr.width >= 32 && lr.height >= 32) continue; } }
            const r = el.getBoundingClientRect();
            if(r.width < 32 || r.height < 32) findings.push({ rule: "tap-target", selector: sel(el), rect: rectOf(el.getBoundingClientRect()), detail: `${round(r.width)}x${round(r.height)} is under 32x32`, text: (el.innerText || el.getAttribute("aria-label") || el.value || "").trim().replace(/\s+/g, " ").slice(0, 40) });
        }
    }

    // 4. page scroll (whole document, not the root)
    const pageFindings = [];
    if(se.scrollHeight > vh + 1) pageFindings.push({ rule: "page-scroll", selector: "document", rect: { x: 0, y: 0, w: se.scrollWidth, h: se.scrollHeight }, detail: `vertical: scrollHeight ${se.scrollHeight} > innerHeight ${vh}`, text: "" });
    if(se.scrollWidth > vw + 1) pageFindings.push({ rule: "page-scroll", selector: "document", rect: { x: 0, y: 0, w: se.scrollWidth, h: se.scrollHeight }, detail: `horizontal: scrollWidth ${se.scrollWidth} > innerWidth ${vw}`, text: "" });
    return findings.concat(pageFindings);
});
