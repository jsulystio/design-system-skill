// bundle.mjs
// Post-processes the generated site/ (see build.mjs) into ONE self-contained
// HTML file: all CSS inlined, every page folded into a client-side hash router,
// no external requests. That single file can be shared with people who don't
// have the repo, or published as a Claude artifact.
//
// Run build.mjs first (it writes site/). Then:
//   node design-system/scripts/bundle.mjs [outfile]
// Output modes:
//   default  -> a standalone .html file (with <!doctype>…) you can double-click
//   --fragment -> body-content only (no <!doctype>/<html>/<head>/<body>), which
//                 is the shape the Claude Artifact tool wants.
// No dependencies, pure Node stdlib.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(fileURLToPath(import.meta.url), '../..');
const SITE = path.join(ROOT, 'site');
const p = (...a) => path.join(ROOT, ...a);

const args = process.argv.slice(2);
const fragment = args.includes('--fragment');
const outfile = args.find((a) => !a.startsWith('--'))
  || path.join(SITE, fragment ? 'bundle.fragment.html' : 'design-system.bundle.html');

if (!fs.existsSync(SITE)) {
  console.error('site/ not found. Run `node design-system/scripts/build.mjs` first.');
  process.exit(1);
}

const read = (f) => fs.readFileSync(f, 'utf8');

// Design-system name (for the <title>), from the token source.
let name = 'Design system';
try { name = JSON.parse(read(p('tokens/figma.raw.json')))?.meta?.name || name; } catch {}

// ---- collect every page as a route ----
// routeId = path under site/ without .html: index, get-started,
// foundations/color, components/button, …
const pageFiles = [];
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) { if (e.name !== 'assets') walk(full); }
    else if (e.name.endsWith('.html')) pageFiles.push(full);
  }
})(SITE);

const routeIdOf = (file) => path.relative(SITE, file).replace(/\\/g, '/').replace(/\.html$/, '');

// Rewrite inter-page links (href="../components/button.html") into hash routes
// (href="#!/components/button"). In-page anchors (href="#semantic") are left
// alone — they don't end in .html.
const ROUTE_RE = /((?:\.\.\/)*)((?:index|get-started|staying-in-sync|foundations\/[a-z0-9-]+|components\/[a-z0-9-]+))\.html/g;
const rewriteHrefs = (s) => s.replace(new RegExp('href="' + ROUTE_RE.source + '"', 'g'), 'href="#!/$2"');

// ---- pull the shared chrome from index.html (its links use no ../ prefix) ----
const indexHtml = read(path.join(SITE, 'index.html'));
const grab = (re, src, label) => {
  const m = src.match(re);
  if (!m) { console.error(`could not extract ${label} from index.html`); process.exit(1); }
  return m[0];
};
const navHtml = rewriteHrefs(grab(/<nav class="side"[\s\S]*?<\/nav>/, indexHtml, 'nav'));
const topbarHtml = rewriteHrefs(grab(/<header class="topbar">[\s\S]*?<\/header>/, indexHtml, 'topbar'));
const paletteHtml = grab(/<div class="palette" id="palette"[\s\S]*?(?=\n?<script>window\.__SEARCH_ITEMS)/, indexHtml, 'palette');
const searchJson = (indexHtml.match(/window\.__SEARCH_ITEMS = (\[[\s\S]*?\]);/) || [])[1] || '[]';
const searchItems = searchJson.replace(
  /"href":"((?:\.\.\/)*)((?:index|get-started|staying-in-sync|foundations\/[a-z0-9-]+|components\/[a-z0-9-]+))\.html"/g,
  '"href":"#!/$2"',
);

// ---- build one <section data-route> per page ----
const MAIN_RE = /<main class="content([^"]*)">([\s\S]*?)<\/main>/;
const routes = pageFiles.map((file) => {
  const id = routeIdOf(file);
  const m = read(file).match(MAIN_RE);
  if (!m) { console.error(`no content block in ${file}`); process.exit(1); }
  const cls = ('content' + m[1]).trim();
  const inner = rewriteHrefs(m[2]);
  return `<section class="${cls}" data-route="${id}" hidden>${inner}</section>`;
}).sort((a, b) => (a.includes('data-route="index"') ? -1 : b.includes('data-route="index"') ? 1 : 0));

// ---- inline CSS ----
// The route panels reuse `.content` (display:flex), which out-specifies the
// plain `[hidden]` attribute — so an explicit, higher-specificity rule is what
// actually hides the inactive routes.
const css = ['tokens.css', 'site.css', 'demos.css']
  .map((f) => read(path.join(SITE, 'assets', f)))
  .join('\n')
  + '\nsection[data-route][hidden] { display: none !important; }\n';

// ---- router / interactions (single copy; delegated so it survives route swaps) ----
const ROUTER_JS = `
  const root = document.documentElement;
  let saved = null; try { saved = localStorage.getItem('theme'); } catch {}
  if (!saved) { try { saved = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'; } catch { saved = 'light'; } }
  root.setAttribute('data-theme', saved);
  const $ = (s) => document.querySelector(s);
  const main = $('#main');
  const side = $('#side');

  // Theme toggle (persist best-effort).
  $('#theme')?.addEventListener('click', () => {
    const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('theme', next); } catch {}
  });

  // Mobile drawer.
  const backdrop = $('#backdrop');
  const closeNav = () => { document.body.classList.remove('nav-open'); $('#menu')?.setAttribute('aria-expanded', 'false'); if (backdrop) backdrop.hidden = true; };
  const openNav = () => { document.body.classList.add('nav-open'); $('#menu')?.setAttribute('aria-expanded', 'true'); if (backdrop) backdrop.hidden = false; };
  $('#menu')?.addEventListener('click', () => document.body.classList.contains('nav-open') ? closeNav() : openNav());
  backdrop?.addEventListener('click', closeNav);

  // Topbar shadow on scroll of the content column.
  const topbar = document.querySelector('.topbar');
  const onScroll = () => topbar && topbar.classList.toggle('scrolled', main.scrollTop > 4);
  main.addEventListener('scroll', onScroll, { passive: true });

  // Tabs + copy: delegated, so freshly-shown routes work without rebinding.
  document.addEventListener('click', (e) => {
    const tab = e.target.closest('.tab');
    if (tab) {
      const tabs = tab.closest('.tabs');
      tabs.querySelectorAll('.tab').forEach((b) => { b.classList.remove('is-active'); b.setAttribute('aria-selected', 'false'); });
      tab.classList.add('is-active'); tab.setAttribute('aria-selected', 'true');
      tabs.querySelectorAll('.tabpanel').forEach((pan) => pan.classList.toggle('is-hidden', pan.dataset.panel !== tab.dataset.tab));
      return;
    }
    const cp = e.target.closest('.copy');
    if (cp) {
      const box = cp.closest('.tabpanel') || cp.closest('.snippet') || cp.closest('.code-wrap');
      const code = box && box.querySelector('code');
      if (code) navigator.clipboard.writeText(code.textContent).then(() => {
        const prev = cp.textContent; cp.textContent = 'Copied'; cp.classList.add('is-copied');
        setTimeout(() => { cp.textContent = prev; cp.classList.remove('is-copied'); }, 1200);
      });
    }
  });

  // Command palette (⌘K / Ctrl+K).
  const items = window.__SEARCH_ITEMS || [];
  const palette = $('#palette'), pInput = $('#palette-input'), pResults = $('#palette-results');
  let pActive = 0;
  const pMatches = (it, q) => it.name.toLowerCase().includes(q) || it.group.toLowerCase().includes(q);
  function pRender() {
    const q = pInput.value.trim().toLowerCase();
    const shown = q ? items.filter((it) => pMatches(it, q)) : items;
    pActive = 0;
    pResults.innerHTML = shown.length
      ? shown.map((it, i) => '<li class="palette-item' + (i === 0 ? ' is-active' : '') + '" role="option" data-href="' + it.href + '"><span class="palette-item-name">' + it.name + '</span><span class="palette-item-group">' + it.group + '</span></li>').join('')
      : '<li class="palette-empty">No results</li>';
  }
  function pSetActive(i) {
    const els = pResults.querySelectorAll('.palette-item');
    if (!els.length) return;
    pActive = (i + els.length) % els.length;
    els.forEach((el, j) => el.classList.toggle('is-active', j === pActive));
    els[pActive].scrollIntoView({ block: 'nearest' });
  }
  function pGo() {
    const el = pResults.querySelectorAll('.palette-item')[pActive];
    if (el && el.dataset.href) { location.hash = el.dataset.href; pHide(); }
  }
  function pShow() { if (!palette) return; palette.hidden = false; document.body.classList.add('palette-open'); pInput.value = ''; pRender(); pInput.focus(); }
  function pHide() { if (!palette) return; palette.hidden = true; document.body.classList.remove('palette-open'); }
  $('#palette-open')?.addEventListener('click', pShow);
  if (palette) {
    pInput.addEventListener('input', pRender);
    palette.addEventListener('mousedown', (e) => { if (e.target === palette) pHide(); });
    pResults.addEventListener('click', (e) => { const li = e.target.closest('.palette-item'); if (li && li.dataset.href) { location.hash = li.dataset.href; pHide(); } });
    pResults.addEventListener('mousemove', (e) => { const li = e.target.closest('.palette-item'); if (li) pSetActive([...pResults.querySelectorAll('.palette-item')].indexOf(li)); });
    pInput.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); pSetActive(pActive + 1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); pSetActive(pActive - 1); }
      else if (e.key === 'Enter') { e.preventDefault(); pGo(); }
    });
  }
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); palette && palette.hidden ? pShow() : pHide(); }
    else if (e.key === 'Escape') { if (palette && !palette.hidden) { e.stopPropagation(); pHide(); } else closeNav(); }
  });

  // "On this page" scrollspy over the active route's TOC.
  function syncToc() {
    const route = [...document.querySelectorAll('section[data-route]')].find((s) => !s.hidden);
    const toc = route && route.querySelector('.toc');
    if (!toc) return;
    const links = [...toc.querySelectorAll('a')];
    const idFor = (a) => a.getAttribute('href').slice(1);
    const secs = [...route.querySelectorAll('section[id]')].filter((s) => links.some((a) => idFor(a) === s.id));
    let current = secs[0];
    for (const s of secs) { if (s.getBoundingClientRect().top <= 96) current = s; else break; }
    if (current) links.forEach((a) => a.classList.toggle('is-active', idFor(a) === current.id));
  }
  main.addEventListener('scroll', syncToc, { passive: true });
  window.addEventListener('resize', syncToc);

  // Hash router: show one route, update nav, reset scroll.
  const routes = [...document.querySelectorAll('section[data-route]')];
  const has = (id) => routes.some((s) => s.dataset.route === id);
  function currentId() {
    const h = location.hash;
    if (h.startsWith('#!/')) { const id = decodeURIComponent(h.slice(3)); if (has(id)) return id; }
    return 'index';
  }
  function show(id) {
    routes.forEach((s) => { s.hidden = s.dataset.route !== id; });
    side.querySelectorAll('a').forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === '#!/' + id));
    main.scrollTop = 0;
    closeNav();
    onScroll();
    syncToc();
  }
  window.addEventListener('hashchange', () => show(currentId()));
  show(currentId());
`;

const title = /design system/i.test(name) ? name : `${name} · Design system`;
const head =
  `<title>${title}</title>\n` +
  `<style>${css}</style>\n`;
const bodyContent =
  `<div class="backdrop" id="backdrop" hidden></div>\n` +
  `<nav class="side" id="side" aria-label="Components">${navHtml.replace(/^<nav[^>]*>|<\/nav>$/g, '')}</nav>\n` +
  `<div class="main" id="main">\n${topbarHtml}\n${routes.join('\n')}\n</div>\n` +
  `${paletteHtml}\n` +
  `<script>window.__SEARCH_ITEMS = ${searchItems};</script>\n` +
  `<script>${ROUTER_JS}</script>\n`;

let out;
if (fragment) {
  out = head + bodyContent;
} else {
  out = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
${head}</head>
<body>
${bodyContent}</body>
</html>
`;
}

fs.mkdirSync(path.dirname(outfile), { recursive: true });
fs.writeFileSync(outfile, out);
const kb = (out.length / 1024).toFixed(0);
console.log(`Bundled ${routes.length} pages -> ${path.relative(process.cwd(), outfile)} (${kb} KB, ${fragment ? 'fragment' : 'standalone'})`);
