"use strict";
// Removes comments from a source file without touching text inside strings, so a "/*" or "//" inside a string can never hide
// the code after it (r100 B7, Verify nit on the r99 names check; the same trap the listener census hit).
//   js:   '...' "..." `...` (with ${...} nesting), regex literals, /* */ and // comments
//   css:  '...' "..." and /* */ comments
//   html: <!-- --> outside <script>/<style>; the inside of <script> is read as js and of <style> as css; prose stays as it is
//   md:   <!-- --> only; json: nothing (it has no comments)
// Every removed comment becomes one space (and keeps its newlines), so words on either side never join up.

const REGEX_BEFORE = /(?:^|[=(,:;!&|?{}\[+\-*%<>~^]|\b(?:return|typeof|case|do|else|in|of|new|delete|void|throw|yield|await))\s*$/;

function stripJs(src) {
  let out = "", i = 0;
  const n = src.length;
  const stack = []; // open template literals waiting for their closing backtick after a ${...}
  let depth = 0;    // brace depth inside the innermost ${...}
  while (i < n) {
    const c = src[i], d = src[i + 1];
    if (c === "/" && d === "*") { const e = src.indexOf("*/", i + 2); const end = e < 0 ? n : e + 2; out += " " + src.slice(i, end).replace(/[^\n]/g, ""); i = end; continue; }
    if (c === "/" && d === "/") { let e = src.indexOf("\n", i); if (e < 0) e = n; out += " "; i = e; continue; }
    if (c === "'" || c === '"') { let j = i + 1; while (j < n && src[j] !== c && src[j] !== "\n") j += src[j] === "\\" ? 2 : 1; out += src.slice(i, j + 1); i = j + 1; continue; }
    if (c === "`") { i = template(i + 1); continue; }
    if (c === "}" && stack.length && depth === 0) { depth = stack.pop(); out += c; i = template(i + 1); continue; }
    if (c === "{" && stack.length) depth++;
    if (c === "}" && stack.length) depth--;
    if (c === "/" && REGEX_BEFORE.test(out.slice(-40))) {
      let j = i + 1, cls = false;
      while (j < n && src[j] !== "\n") { const k = src[j]; if (k === "\\") { j += 2; continue; } if (k === "[") cls = true; else if (k === "]") cls = false; else if (k === "/" && !cls) break; j++; }
      out += src.slice(i, j + 1); i = j + 1; continue;
    }
    out += c; i++;
  }
  return out;
  // copies a template literal from `start` (just after a backtick or the } closing a ${...}) to its end or its next ${
  function template(start) {
    let j = start;
    while (j < n) {
      if (src[j] === "\\") { j += 2; continue; }
      if (src[j] === "`") { out += src.slice(start - 1, j + 1); return j + 1; }
      if (src[j] === "$" && src[j + 1] === "{") { out += src.slice(start - 1, j + 2); stack.push(depth); depth = 0; return j + 2; }
      j++;
    }
    out += src.slice(start - 1); return n;
  }
}

function stripCss(src) {
  let out = "", i = 0;
  while (i < src.length) {
    const c = src[i];
    if (c === "/" && src[i + 1] === "*") { const e = src.indexOf("*/", i + 2); const end = e < 0 ? src.length : e + 2; out += " " + src.slice(i, end).replace(/[^\n]/g, ""); i = end; continue; }
    if (c === "'" || c === '"') { let j = i + 1; while (j < src.length && src[j] !== c && src[j] !== "\n") j += src[j] === "\\" ? 2 : 1; out += src.slice(i, j + 1); i = j + 1; continue; }
    out += c; i++;
  }
  return out;
}

function stripHtml(src) {
  let out = "", i = 0;
  const open = /<!--|<script\b[^>]*>|<style\b[^>]*>/gi;
  while (i < src.length) {
    open.lastIndex = i;
    const m = open.exec(src);
    if (!m) { out += src.slice(i); break; }
    out += src.slice(i, m.index);
    if (m[0] === "<!--") { const e = src.indexOf("-->", m.index + 4); const end = e < 0 ? src.length : e + 3; out += " " + src.slice(m.index, end).replace(/[^\n]/g, ""); i = end; continue; }
    const tag = /^<script/i.test(m[0]) ? "script" : "style";
    const close = src.toLowerCase().indexOf(`</${tag}`, m.index + m[0].length);
    const end = close < 0 ? src.length : close;
    const body = src.slice(m.index + m[0].length, end);
    out += m[0] + (tag === "script" ? stripJs(body) : stripCss(body));
    i = end;
    if (close >= 0) { const gt = src.indexOf(">", close); out += src.slice(close, gt + 1); i = gt + 1; }
  }
  return out;
}

function stripComments(file, src) {
  if (/\.(?:c?js|mjs)$/.test(file)) return stripJs(src);
  if (/\.css$/.test(file)) return stripCss(src);
  if (/\.html?$/.test(file)) return stripHtml(src);
  if (/\.md$/.test(file)) return src.replace(/<!--[^]*?-->/g, m => " " + m.replace(/[^\n]/g, ""));
  return src;
}

module.exports = { stripComments, stripJs, stripCss, stripHtml };
