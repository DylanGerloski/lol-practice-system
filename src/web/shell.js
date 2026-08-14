'use strict';

// The shared document shell for every web page: head
// meta, canonical, og/twitter, a JSON-LD slot, inlined CSS, a skip link,
// header + nav, <main>, and a footer carrying Riot's required disclaimer
// plus About/Privacy links. Every page in the web build (index.html/404.html,
// and every page added since) should be built
// by calling documentShell() -- there is exactly one place that assembles
// <head>/<header>/<footer>, so nothing drifts between pages.

const fs = require('fs');
const path = require('path');
const site = require('./../site.js');
const { escapeHtml } = require('../render/html.js');
const { adSlot, adsScriptTag } = require('./ads.js');
const adConfig = require('./adConfig.js');

// GoatCounter is a free, privacy-respecting, cookieless analytics service
// (no personal data collected) -- the standard async snippet, unconditional
// on every page, matching the pattern already live on the human's other
// asset (lichess-stats-poc / repertoire-builder). No other analytics vendor
// is wired in anywhere in this build.
const GOATCOUNTER_URL = 'https://dylangerrrrkerl.goatcounter.com/count';

// AdSense's own site-verification meta tag (independent of ad serving):
// declares the publisher id so the human can complete the "Add site" step
// in the AdSense dashboard. This is unconditional (not gated by
// adConfig.enabled) -- it only proves site ownership to Google, the same
// job ads.txt does for authorized sellers; it does not itself request,
// serve, or enable any ad unit. adConfig.enabled/slots stay untouched and
// still gate actual ad serving, per the human's original decision.
const ADSENSE_CLIENT = adConfig.client;

// AdSense Auto ads loader (human-confirmed, currently-generated snippet for
// this same publisher account). Unconditional,
// same as the verification meta tag above: Auto ads places ad units itself
// once Google approves the site-add, so it isn't gated by
// adConfig.enabled/slots -- that flag only ever applied to the older
// manual-unit plan (src/web/ads.js's adsScriptTag(), still dormant/gated
// below), which Auto ads supersedes per the human's decision. Left the old
// gated code path untouched rather than removing it.
const ADSENSE_AUTO_ADS_SCRIPT = `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${escapeHtml(ADSENSE_CLIENT)}" crossorigin="anonymous"></script>`;

// Riot's fan-content policy requires this exact wording,
// defined once in site.js and shared with the print pack (src/render/pages.js)
// so both outputs carry byte-identical text. Contact identity throughout the
// web build is a personal one, never a business/legal entity -- Riot's
// policy excludes projects that involve one.
const { RIOT_DISCLAIMER, TRADEMARK_NOTICE } = site;

// Inline SVG favicon: a mono wordmark glyph, no
// image file, no new asset pipeline -- a single accent-blue circle badge
// with a white "S" monogram. A data: URI can't reference a CSS custom
// property, so its two colors are copied here literally from tokens.css's
// --accent/--paper at the one call site that needs them; this is the same,
// deliberate exception the human's other site's own FAVICON_DATA_URI takes to the "no hardcoded
// hex outside tokens.css" rule -- it's a self-contained embedded image
// asset, not page styling. scripts/build-og-image.js decodes this exact
// string to reuse the same mark in the 1200x630 og-image, so the favicon and
// the social-share image can never drift apart.
const FAVICON_DATA_URI = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Ccircle cx='32' cy='32' r='30' fill='%231B54C8'/%3E%3Ctext x='32' y='45' font-family='Arial, Helvetica, sans-serif' font-size='38' font-weight='700' fill='%23FFFFFF' text-anchor='middle'%3ES%3C/text%3E%3C/svg%3E";

// tokens.css + screen.css, read once at require time -- this IS the
// concatenation the build writes to dist/site.css, and it is also inlined
// directly into every page's <head> for fast static delivery,
// with no render-blocking stylesheet request for a one-page-and-out visit.
const SITE_CSS = [
  fs.readFileSync(path.join(__dirname, 'tokens.css'), 'utf8'),
  fs.readFileSync(path.join(__dirname, 'screen.css'), 'utf8')
].join('\n');

// Fixed nav order. Every page passes `active` (or null) to
// mark the current page with aria-current; pages that don't exist yet (until
// they're built) still get a working link into the future filename, since
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
  <meta http-equiv="Content-Security-Policy" content="object-src 'none'; base-uri 'none'">
  <meta name="referrer" content="strict-origin-when-cross-origin">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">${canonicalLink}${robotsMeta}${og}
  <meta name="google-adsense-account" content="${escapeHtml(ADSENSE_CLIENT)}">
  ${ADSENSE_AUTO_ADS_SCRIPT}
  <link rel="icon" href="${FAVICON_DATA_URI}">
  <style>${SITE_CSS}</style>${jsonLdBlock}${adsScriptBlock}
  <script data-goatcounter="${GOATCOUNTER_URL}" async src="https://gc.zgo.at/count.js"></script>
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

// Newsletter signup: no email provider is connected yet. This constant is
// the ONE place to enable real capture later -- once a provider is chosen,
// set NEWSLETTER_FORM_ACTION to that provider's real hosted-form action URL
// (e.g. a Buttondown/ConvertKit "plain HTML form" embed action) -- that one
// edit is the entire wiring change, no rebuild of renderNewsletterSignup()
// itself. Left null (the current state) renders an honest "not live yet"
// placeholder instead of a form with nowhere real to submit to.
const NEWSLETTER_FORM_ACTION = null;
const NEWSLETTER_FORM_METHOD = 'POST';

/**
 * Shared social-link mark (a ring, a jagged upward line, a dot at the tip)
 * recreated as inline SVG from the operator's own profile picture. Colors
 * are the artist's fixed brand colors, not derived from this site's own
 * token ramp, so the mark stays recognizable and identical across every
 * property and the social profile itself -- same self-contained-asset
 * exception to the tokens-only rule as this file's own FAVICON_DATA_URI.
 */
// Colors are applied via CSS classes (tokens.css's --brand-mark-* custom
// properties), not inline hex attributes, so the built HTML never carries a
// literal hex value outside tokens.css -- keeps this passing
// test/buildSite.test.js's "no hardcoded hex color outside a var()
// reference" invariant while still declaring the colors as fixed, not
// derived from this site's own ramp.
const SOCIAL_ICON_SVG = '<svg width="18" height="18" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false"><circle class="brand-mark-ground" cx="50" cy="50" r="47"/><circle class="brand-mark-ring" cx="50" cy="50" r="35" fill="none" stroke-width="3"/><path class="brand-mark-line" d="M16 74 L38 58 L50 66 L83 27" fill="none" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/><circle class="brand-mark-dot" cx="83" cy="27" r="9"/></svg>';

/**
 * Portfolio-wide footer credit line -- identical wording/type role on all
 * three properties, naming the operator and linking to the other two. Not a
 * donation/affiliate link, so renderFooter()'s "kept deliberately clean"
 * guarantee below is unaffected. See docs/DESIGN_PLAYBOOK.md's "What stays
 * shared across the portfolio".
 */
function renderFooterCredit() {
  return `<p class="footer-credit">Built by Dylan &mdash; also making <a href="https://repertoire-builder.com" rel="noopener noreferrer">Repertoire Builder</a> and <a href="https://dylangerloski.github.io/filetools/" rel="noopener noreferrer">filetools</a>. <a class="footer-social" href="https://x.com/builtittheycome" rel="noopener noreferrer">${SOCIAL_ICON_SVG}Follow @builtittheycome</a></p>`;
}

/**
 * Sitewide newsletter signup, rendered inside the shared footer so it
 * appears on every page. Distinct from (and does not reintroduce) a
 * donation/affiliate link -- renderFooter()'s comment about staying clean of
 * those is unaffected; this is a plain program-updates signup.
 */
function renderNewsletterSignup() {
  if (!NEWSLETTER_FORM_ACTION) {
    return `<div class="newsletter-signup newsletter-signup--pending">
      <h2 class="newsletter-heading">Get program updates by email</h2>
      <p class="newsletter-description">Email sign-up isn&rsquo;t live yet &mdash; check back soon.</p>
    </div>`;
  }
  return `<form class="newsletter-signup" action="${escapeHtml(NEWSLETTER_FORM_ACTION)}" method="${escapeHtml(NEWSLETTER_FORM_METHOD)}">
      <h2 class="newsletter-heading">Get program updates by email</h2>
      <p class="newsletter-description">One email when new drills, warmups, or focus content ship. No spam, unsubscribe anytime.</p>
      <div class="newsletter-fields">
        <label for="newsletter-email" class="sr-only">Email address</label>
        <input id="newsletter-email" name="email" type="email" required placeholder="you@example.com" autocomplete="email">
        <button type="submit">Subscribe</button>
      </div>
    </form>`;
}

/**
 * @returns {string} the shared footer -- Riot's required disclaimer verbatim,
 *   plus About/Privacy links. No Ko-fi/donation link and
 *   no affiliate link anywhere in this footer, ever -- kept deliberately clean.
 */
function renderFooter() {
  return `<footer class="site-footer">
    <p>${escapeHtml(RIOT_DISCLAIMER)}</p>
    <p>${escapeHtml(TRADEMARK_NOTICE)}</p>
    <p class="footer-links">
      <a href="${escapeHtml(site.url('about.html'))}">About</a>
      <a href="${escapeHtml(site.url('privacy.html'))}">Privacy</a>
    </p>
    ${renderFooterCredit()}
    ${renderNewsletterSignup()}
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
 * The static-hosting 404 page. GitHub Pages serves
 * /404.html automatically. Uses the exact same header/nav/footer shell as
 * every other page, marked noindex, and carries no ad slot
 * (about/privacy/404/print pages get zero ads).
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
  FAVICON_DATA_URI,
  RIOT_DISCLAIMER,
  TRADEMARK_NOTICE,
  NAV_LINKS,
  documentHead,
  renderHeader,
  renderFooter,
  renderNewsletterSignup,
  documentShell,
  render404Page,
  adSlot
};
