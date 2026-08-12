'use strict';

// The shared document shell for every web page (spec Section 6 B0): head
// meta, canonical, og/twitter, a JSON-LD slot, inlined CSS, a skip link,
// header + nav, <main>, and a footer carrying Riot's required disclaimer
// plus About/Privacy links. Every page in the web build (this task's
// index.html/404.html, and every page later subtasks add) should be built
// by calling documentShell() -- there is exactly one place that assembles
// <head>/<header>/<footer>, so nothing drifts between pages.

const fs = require('fs');
const path = require('path');
const site = require('./../site.js');
const { escapeHtml } = require('../render/html.js');
const { adSlot, adsScriptTag } = require('./ads.js');

// Riot's fan-content policy requires this exact wording (spec Section 1.7),
// defined once in site.js and shared with the print pack (src/render/pages.js)
// so both outputs carry byte-identical text. Contact identity throughout the
// web build is a personal one, never a business/legal entity -- Riot's
// policy excludes projects that involve one.
const { RIOT_DISCLAIMER, TRADEMARK_NOTICE } = site;

// tokens.css + screen.css, read once at require time -- this IS the
// concatenation the build writes to dist/site.css, and it is also inlined
// directly into every page's <head> (spec Section 1.6: fast static delivery,
// no render-blocking stylesheet request for a one-page-and-out visit).
const SITE_CSS = [
  fs.readFileSync(path.join(__dirname, 'tokens.css'), 'utf8'),
  fs.readFileSync(path.join(__dirname, 'screen.css'), 'utf8')
].join('\n');

// Fixed nav order, spec Section 1.5. Every page passes `active` (or null) to
// mark the current page with aria-current; pages that don't exist yet (until
// B1-B4 build them) still get a working link into the future filename, since
// this shell defines the site's whole navigational shape up front.
const NAV_LINKS = [
  { key: 'home', label: 'Home', file: '' },
  { key: 'program', label: 'Program', file: 'program.html' },
  { key: 'focus-menu', label: 'Focus menu', file: 'focus-menu.html' },
  { key: 'drills', label: 'Drills', file: 'drills.html' },
  { key: 'warmup', label: 'Warmup', file: 'warmup.html' },
  { key: 'tracker', label: 'Tracker', file: 'tracker.html' },
  { key: 'downloads', label: 'Downloads', file: 'downloads.html' },
  { key: 'faq', label: 'FAQ', file: 'faq.html' }
];

/**
 * @param {{title:string, description:string, canonical?:string,
 *   ogType?:'website'|'article', jsonLd?:string, noindex?:boolean}} opts
 * @returns {string} a full <head>...</head> block.
 */
function documentHead(opts) {
  const { title, description, canonical, ogType = 'website', jsonLd, noindex } = opts;

  const canonicalLink = canonical
    ? `\n  <link rel="canonical" href="${escapeHtml(canonical)}">`
    : '';
  const robotsMeta = noindex ? '\n  <meta name="robots" content="noindex">' : '';
  const og = `\n  <meta property="og:title" content="${escapeHtml(title)}">` +
    `\n  <meta property="og:description" content="${escapeHtml(description)}">` +
    (canonical ? `\n  <meta property="og:url" content="${escapeHtml(canonical)}">` : '') +
    `\n  <meta property="og:type" content="${escapeHtml(ogType)}">` +
    `\n  <meta property="og:site_name" content="${escapeHtml(site.SITE_NAME)}">` +
    `\n  <meta property="og:image" content="${escapeHtml(site.absoluteUrl('og-image.png'))}">` +
    `\n  <meta property="og:image:width" content="1200">` +
    `\n  <meta property="og:image:height" content="630">` +
    `\n  <meta name="twitter:card" content="summary_large_image">`;
  const jsonLdBlock = jsonLd ? `\n  <script type="application/ld+json">${jsonLd}</script>` : '';
  const adsScript = adsScriptTag();
  const adsScriptBlock = adsScript ? `\n  ${adsScript}` : '';

  return `<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">${canonicalLink}${robotsMeta}${og}
  <style>${SITE_CSS}</style>${jsonLdBlock}${adsScriptBlock}
</head>`;
}

/**
 * @param {string|null} active one of NAV_LINKS' `key`s, or null.
 * @returns {string} the shared header + nav markup.
 */
function renderHeader(active = null) {
  const links = NAV_LINKS
    .map(({ key, label, file }) => `<a href="${escapeHtml(site.url(file))}"${active === key ? ' aria-current="page"' : ''}>${escapeHtml(label)}</a>`)
    .join('\n      ');

  return `<header class="site-header">
    <a class="brand" href="${escapeHtml(site.url())}">${escapeHtml(site.SITE_NAME)}</a>
    <nav class="site-nav" aria-label="Main">
      ${links}
    </nav>
  </header>`;
}

/**
 * @returns {string} the shared footer -- Riot's required disclaimer verbatim
 *   (spec Section 1.7), plus About/Privacy links. No Ko-fi/donation link and
 *   no affiliate link anywhere in this footer, ever -- see the spec section
 *   this shell was built from for why.
 */
function renderFooter() {
  return `<footer class="site-footer">
    <p>${escapeHtml(RIOT_DISCLAIMER)}</p>
    <p>${escapeHtml(TRADEMARK_NOTICE)}</p>
    <p class="footer-links">
      <a href="${escapeHtml(site.url('about.html'))}">About</a>
      <a href="${escapeHtml(site.url('privacy.html'))}">Privacy</a>
    </p>
  </footer>`;
}

/**
 * @param {{title:string, description:string, bodyHtml:string, canonical?:string,
 *   ogType?:'website'|'article', jsonLd?:string, active?:string|null,
 *   noindex?:boolean, wide?:boolean}} opts
 * @returns {string} a full standalone HTML document using the shared shell.
 */
function documentShell(opts) {
  const { title, description, bodyHtml, canonical, ogType, jsonLd, active = null, noindex, wide } = opts;
  return `<!doctype html>
<html lang="en">
${documentHead({ title, description, canonical, ogType, jsonLd, noindex })}
<body>
  <a class="skip-link" href="#main">Skip to content</a>
  ${renderHeader(active)}
  <main id="main" class="page-shell${wide ? ' page-shell-wide' : ''}">
${bodyHtml}
  </main>
  ${renderFooter()}
</body>
</html>
`;
}

/**
 * The static-hosting 404 page (spec Section 6 B0). GitHub Pages serves
 * /404.html automatically. Uses the exact same header/nav/footer shell as
 * every other page, marked noindex, and carries no ad slot (spec Section
 * 1.4: about/privacy/404/print pages get zero ads).
 */
function render404Page() {
  const title = `Page not found | ${site.SITE_NAME}`;
  const description = `The page you followed a link to doesn’t exist on ${site.SITE_NAME}. Here’s where to pick back up.`;
  const body = `<div class="not-found">
      <h1>That page doesn’t exist</h1>
      <p class="lead">The link you followed may be out of date, or the page may have moved.</p>
      <ul>
        <li><a href="${escapeHtml(site.url())}">Home</a></li>
      </ul>
    </div>`;
  return documentShell({ title, description, bodyHtml: body, noindex: true });
}

module.exports = {
  SITE_CSS,
  RIOT_DISCLAIMER,
  TRADEMARK_NOTICE,
  NAV_LINKS,
  documentHead,
  renderHeader,
  renderFooter,
  documentShell,
  render404Page,
  adSlot
};
