// Live face check (Nik, 12 Oct 9:37 p.m. Eastern): opens a REAL game screen at phone sizes, measures every visible
// button, card, title and tab bar the game actually draws, and checks none of them covers a manager's face on the
// marble phone background ENV_<KEY>_PHONE_V2 (zones from PHONE_FACE_ZONES.json, background drawn cover + centred).
// Usage: NODE_PATH=$(npm root -g) node live_facecheck.cjs <url> <KEY> [shotDir]
// Also (Nik, 12 Oct 9:43 p.m. Eastern: "no more faded or cut design"): fails if any manager or manager-background element
// is faded, cut or filtered: a gradient mask, clip-path, opacity below 1, or a blur/brightness/grayscale/sepia filter.
// Exit 0 = all faces clear and no faded or cut managers at every size; 1 = a problem (the report says which element).
const { chromium } = require('playwright');
const path = require('path');
const Z = require(path.join(__dirname, '../../../../visual-assets/v10_1/plates-v2/PHONE_FACE_ZONES.json')).zones;
const [url, key, shotDir] = process.argv.slice(2);
const SIZES = [[393, 852], [393, 660], [375, 667], [360, 640]];
const IW = 1179, IH = 2096;
(async () => {
  if (!Z[key]) { console.log(`${key}: no managers on this screen, nothing to check`); return; }
  const b = await chromium.launch(); let bad = 0;
  for (const [w, h] of SIZES) {
    const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await p.goto(url, { waitUntil: 'networkidle', timeout: 60000 }); await p.waitForTimeout(4000);
    const s = Math.max(w / IW, h / IH), ox = (w - IW * s) / 2, oy = (h - IH * s) / 2;
    const faces = Z[key].map(([a, c, d, e]) => [ox + a * IW * s, oy + c * IH * s, ox + d * IW * s, oy + e * IH * s]);
    const hits = await p.evaluate(({ faces, w, h }) => {
      const out = [];
      const visible = el => { const cs = getComputedStyle(el);
        return cs.visibility !== 'hidden' && cs.display !== 'none' && parseFloat(cs.opacity) > 0.05; };
      const drawsSomething = el => { const cs = getComputedStyle(el);
        const bg = cs.backgroundColor && !/rgba\(.*,\s*0\)$|transparent/.test(cs.backgroundColor);
        const bgImg = cs.backgroundImage && cs.backgroundImage !== 'none';
        const border = parseFloat(cs.borderTopWidth) > 0 && !/rgba\(.*,\s*0\)$/.test(cs.borderTopColor);
        const text = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim());
        return bg || bgImg || border || text || /^(IMG|SVG|CANVAS|BUTTON|INPUT|VIDEO)$/.test(el.tagName.toUpperCase()); };
      for (const el of document.querySelectorAll('body *')) {
        const r = el.getBoundingClientRect();
        if (r.width < 2 || r.height < 2 || r.width * r.height > 0.6 * w * h) continue;   // skip full-screen layers (they are the background)
        if (!visible(el) || !drawsSomething(el)) continue;
        if (/cutout|manager|portrait|plate|backdrop|stage-art|background/i.test(el.className && el.className.baseVal !== undefined ? el.className.baseVal : el.className || '')) continue; // the managers themselves
        faces.forEach((f, i) => {
          const ix = Math.min(r.right, f[2]) - Math.max(r.left, f[0]), iy = Math.min(r.bottom, f[3]) - Math.max(r.top, f[1]);
          const onTop = () => { const cx = (Math.max(r.left, f[0]) + Math.min(r.right, f[2])) / 2, cy = (Math.max(r.top, f[1]) + Math.min(r.bottom, f[3])) / 2;
            const t = document.elementFromPoint(cx, cy); return t && (t === el || el.contains(t) || t.contains(el)); };   // really visible there, not hidden under another layer
          if (ix > 2 && iy > 2 && onTop()) out.push({ face: i ? 'Nik' : 'Daniel', tag: el.tagName.toLowerCase(), id: el.id, cls: String(el.className && el.className.baseVal !== undefined ? el.className.baseVal : el.className).slice(0, 60), text: (el.innerText || '').trim().slice(0, 40), pct: Math.round(100 * ix * iy / ((f[2] - f[0]) * (f[3] - f[1]))) });
        });
      }
      return out;
    }, { faces, w, h });
    const fades = await p.evaluate(() => {
      const out = [], who = /^(.*hero.*|.*cutout.*|manager.*|.*daniel.*|nik|nik[-_].*|.*[-_]nik|.*portrait.*|ovl_.*)$/i;
      for (const el of document.querySelectorAll('body *')) {
        const name = (el.id || '') + ' ' + String(el.className && el.className.baseVal !== undefined ? el.className.baseVal : el.className || '');
        let src = ''; if (el.tagName === 'IMG') src = el.currentSrc || el.src || '';
        if (/^(BUTTON|A|INPUT|LABEL)$/.test(el.tagName)) continue;   // buttons are UI, not managers
        if (!(name + ' ' + src.split('/').pop()).split(/\s+/).some(t => who.test(t))) continue;
        const r = el.getBoundingClientRect(); if (r.width < 20 || r.height < 20) continue;
        const cs = getComputedStyle(el); if (cs.display === 'none' || cs.visibility === 'hidden') continue;
        const why = [];
        const mask = cs.maskImage || cs.webkitMaskImage || ''; if (/gradient/.test(mask)) why.push('fade mask ' + mask.slice(0, 70));
        if (cs.clipPath && cs.clipPath !== 'none') why.push('clip-path ' + cs.clipPath.slice(0, 50));
        if (parseFloat(cs.opacity) < 0.99) why.push('opacity ' + cs.opacity);
        if (/blur|grayscale|sepia|brightness\(0?\.[0-8]/.test(cs.filter || '')) why.push('filter ' + cs.filter);
        if (why.length) out.push(`<${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''} class="${name.trim().slice(0, 50)}"> ${why.join('; ')}`);
      }
      return out;
    });
    if (shotDir) {
      await p.evaluate(fs => fs.forEach(f => { const d = document.createElement('div');
        Object.assign(d.style, { position: 'fixed', left: f[0] + 'px', top: f[1] + 'px', width: (f[2] - f[0]) + 'px', height: (f[3] - f[1]) + 'px', outline: '3px solid #0ff', zIndex: 2147483647, pointerEvents: 'none' });
        document.body.appendChild(d); }), faces);
      await p.screenshot({ path: `${shotDir}/FACECHECK_${key}_${w}x${h}.png` });
    }
    const worst = {}; hits.forEach(x => { const k = x.face + ' ' + x.tag + (x.id ? '#' + x.id : '') + ' ' + x.text; if (!worst[k] || worst[k].pct < x.pct) worst[k] = x; });
    const list = Object.values(worst).sort((a, b) => b.pct - a.pct);
    console.log(`${key} ${w}x${h}: ${list.length || fades.length ? 'FAIL' : 'OK'}` + list.slice(0, 8).map(x => `\n  - ${x.face}'s face ${x.pct}% under <${x.tag}${x.id ? '#' + x.id : ''} class="${x.cls}"> ${x.text ? '"' + x.text + '"' : ''}`).join(''));
    fades.forEach(f => console.log(`  - FADED/CUT manager: ${f}`));
    if (list.length || fades.length) bad = 1; await p.close();
  }
  await b.close(); process.exit(bad);
})().catch(e => { console.error(e.message); process.exit(2); });
