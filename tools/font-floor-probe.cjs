"use strict";
// r96 font floor probe: the page-side half of tools/font-floor-sweep.cjs, also used by the CE2PG run (CE2PG_FONT_SWEEP=<file>).
// sweepPage(page, host, floor, found, screen): every visible text under the floor, with the CSS rule that wins for it (CDP).
async function sweepPage(page, host, floor, found, screen = ""){
    const session = await page.context().newCDPSession(page);
    await session.send("DOM.enable"); await session.send("CSS.enable");
    await page.evaluate(() => document.querySelectorAll("[data-fsw]").forEach(n => n.removeAttribute("data-fsw")));
    const tagged = await page.evaluate(({ host, floor }) => {
        const root = document.getElementById(host) || document.body, seen = new Set(); let n = 0; const out = [];
        for(const el of root.querySelectorAll("*")){
            if(!el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }) || !el.getClientRects().length) continue;
            const own = [...el.childNodes].some(c => c.nodeType === 3 && c.textContent.trim());
            if(!own && !(el.value && el.tagName === "INPUT")) continue;
            const px = parseFloat(getComputedStyle(el).fontSize);
            if(!(px < floor - 0.01)) continue;
            const sig = el.tagName + "|" + el.className + "|" + el.id + "|" + px;
            if(seen.has(sig)) continue; seen.add(sig);
            el.setAttribute("data-fsw", String(n)); out.push({ i: n, px, name: el.tagName.toLowerCase() + (el.id ? "#" + el.id : "") + (typeof el.className === "string" && el.className.trim() ? "." + el.className.trim().split(/\s+/).join(".") : ""), text: (el.innerText || el.value || "").replace(/\s+/g, " ").trim().slice(0, 30) }); n++;
        }
        return out;
    }, { host, floor });
    const { root } = await session.send("DOM.getDocument", { depth: 0 });
    for(const t of tagged){
        try{
            const { nodeId } = await session.send("DOM.querySelector", { nodeId: root.nodeId, selector: `[data-fsw="${t.i}"]` });
            const m = await session.send("CSS.getMatchedStylesForNode", { nodeId });
            let win = null;
            for(const r of m.matchedCSSRules){
                const props = (r.rule.style.cssProperties || []).filter(p => /^font(-size)?$/.test(p.name) && !p.disabled);
                if(!props.length) continue;
                const imp = props.some(p => p.important);
                if(!win || imp || !win.imp) win = { imp, sel: r.rule.selectorList.text, media: (r.rule.media || []).map(x => x.text).join(" | "), sheet: (r.rule.styleSheetId && "") , props: props.map(p => `${p.name}:${p.value}`).join(";"), origin: r.rule.origin };
            }
            const inline = await session.send("CSS.getInlineStylesForNode", { nodeId });
            const inl = inline.inlineStyle && (inline.inlineStyle.cssProperties || []).some(p => /^font(-size)?$/.test(p.name));
            const key = win ? `${win.sel} {${win.props}} @${win.media}` : (inl ? "INLINE-STYLE" : "UNKNOWN");
            const row = found.get(key) || { rule: key, px: new Set(), screens: new Set(), examples: [] };
            row.screens.add(screen);
            row.px.add(t.px); if(row.examples.length < 3) row.examples.push(`${t.name} "${t.text}"`); found.set(key, row);
        }catch(error){ /* element vanished */ }
    }
    await session.detach();
}


function rowsOf(found){ return [...found.values()].map(r => ({ ...r, px: [...r.px].sort(), screens: [...r.screens].sort() })).sort((a, b) => a.rule.localeCompare(b.rule)); }
module.exports = { sweepPage, rowsOf };
